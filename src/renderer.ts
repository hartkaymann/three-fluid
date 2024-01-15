import * as THREE from 'three'

import Slab from './lib/Slab';
import TiledTexture from './lib/TiledTexture';

import vertexTiled from './shaders/displaytiled.vert'
import fragmentCommon from './shaders/common.frag'
import fragmentTiled from './shaders/displaytiled.frag'

/**
 * Handles volumetric rendering of the fluid.
 */
export default class Renderer {

    private _wgl: THREE.WebGLRenderer;
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;

    private _planes: THREE.Group;
    private _domainBox: THREE.LineSegments;
    private _material: THREE.RawShaderMaterial;

    private _guidePointer: THREE.Mesh;

    public settings = {
        slices: 100,
        scissor: 0,
        ambient: 0.5,
        color1: '#3f5efb',
        color2: '#fc466b',
        showGuides: true,
        hasShading: true,
        background: '#3f3f3f',
        minThreshold: 0.00001,
    }

    public get domainBox() {
        return this._domainBox;
    }

    constructor(
        wgl: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera,
    ) {
        this._wgl = wgl;

        this._camera = camera;
        this._scene = new THREE.Scene();

        this._material = new THREE.RawShaderMaterial({
            uniforms: {
                density: { value: new THREE.Texture() },
                velocity: { value: new THREE.Texture() },
                pressure: { value: new THREE.Texture() },
                u_colorAmbient: { value: new THREE.Vector3() },
                u_resolution: { value: new THREE.Vector3() },
                u_tileCount: { value: new THREE.Vector3() },
                u_color1: { value: new THREE.Vector3() },
                u_color2: { value: new THREE.Vector3() },
                u_size: { value: new THREE.Vector3() },
                u_textureResolution: { value: new THREE.Vector2() },
                u_ambientStrength: { value: 0.0 },
                u_minThreshold: { value: 0.0 },
                u_applyShading: { value: true },
            },
            vertexShader: vertexTiled,
            fragmentShader: [fragmentCommon, fragmentTiled].join('\n'),
            side: THREE.FrontSide,
            transparent: true,
            depthTest: true,
        });

        // Add visual guides
        this._guidePointer = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        this._scene.add(this._guidePointer);
    }

    /**
     * @param domain 
     * Dimensions of the fluid domain. 
     * @param tiledTex 
     * Current flat 3D texture object.
     */
    reset(
        domain: THREE.Vector3,
        tiledTex: TiledTexture,
    ) {
        this._material.uniforms.u_size.value = domain;
        this._material.uniforms.u_resolution.value = tiledTex.simulationResolution;
        this._material.uniforms.u_textureResolution.value = tiledTex.resolution;
        this._material.uniforms.u_tileCount.value = tiledTex.tileCount;

        this._scene.remove(this._planes);
        this._scene.remove(this._domainBox);

        let sideLength = Math.sqrt(domain.x * domain.x + domain.y * domain.y + domain.z * domain.z);
        this._planes = new THREE.Group();
        this._planes.matrixAutoUpdate = true;
        for (let z = 0; z < this.settings.slices; z++) {
            const geometry = new THREE.PlaneGeometry(sideLength, sideLength);
            geometry.translate(0.0, 0.0, (sideLength / -2) + (sideLength / this.settings.slices) * z);

            let attribCoord = [];
            for (let i = 0; i < geometry.getAttribute("position").count; i++) {
                attribCoord.push(z);
            }
            geometry.setAttribute("depth", new THREE.Float32BufferAttribute(attribCoord, 1));

            const quad = new THREE.Mesh(geometry, this._material);
            this._planes.add(quad);
        }
        this._scene.add(this._planes);

        const geometryDomainBox = new THREE.BoxGeometry(domain.x, domain.y, domain.z);
        this._domainBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometryDomainBox),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        this._domainBox.visible = this.settings.showGuides;
        this._scene.add(this._domainBox);
    }

    render(
        density: Slab,
        velocity: Slab
    ) {
        this._planes.rotation.copy(this._camera.rotation);

        // Update material uniforms
        this._material.uniforms.density.value = density.read.texture;
        this._material.uniforms.velocity.value = velocity.read.texture;
        this._material.uniforms.u_color1.value = new THREE.Color(this.settings.color1);
        this._material.uniforms.u_color2.value = new THREE.Color(this.settings.color2);
        this._material.uniforms.u_minThreshold.value = this.settings.minThreshold;
        this._material.uniforms.u_applyShading.value = this.settings.hasShading;

        // Render 
        this._wgl.setRenderTarget(null);
        this._wgl.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this._wgl.setScissor(0, 0, window.innerWidth - this.settings.scissor, window.innerHeight);
        this._wgl.clear();
        this._wgl.render(this._scene, this._camera);
    }

    /**
     * Updates values, position and visiblity of visual guides in the scene.
     * @param position 
     * Position of the pointer in 3D world space.
     * @param direction 
     * Direction of the pointer's movement.
     * @param isHit
     * Whether pointer is currently inside the domain.
     * @param isInteracting
     * Whether mouse buttons are pressed.
     */
    updateGuides(
        position: THREE.Vector3,
        direction: THREE.Vector3,
        isHit: boolean,
        isInteracting: boolean
    ) {
        this._domainBox.visible = this.settings.showGuides;
        this._guidePointer.visible = this.settings.showGuides && isHit;

        direction.z *= -1;
        let color = new THREE.Color(0.5 + direction.x, 0.5 + direction.y, 0.5 + direction.z);

        this._guidePointer.position.set(position.x, position.y, position.z);
        (this._guidePointer.material as THREE.MeshBasicMaterial).color.set(color);
        (this._guidePointer.material as THREE.MeshBasicMaterial).opacity = isInteracting ? 1 : 0.5;
    }

    updateBackgroundColor() {
        let color = new THREE.Color(this.settings.background);

        this._material.uniforms.u_ambientStrength.value = this.settings.ambient;
        this._material.uniforms.u_colorAmbient.value = color;

        this._wgl.setClearColor(color);
    }

    resize(width: number) {
        this.settings.scissor = width;
    }
}