import * as THREE from 'three'

import vertexTiled from './shaders/displaytiled.vert'
import fragmentCommon from './shaders/common.frag'
import fragmentTiled from './shaders/displaytiled.frag'
import Slab from './lib/Slab';
import TiledTexture from './lib/TiledTexture';

export default class Renderer {

    private _wgl: THREE.WebGLRenderer;
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;

    private _domainBox: THREE.LineSegments;
    private _group: THREE.Group;

    private _material: THREE.RawShaderMaterial;
    private _pointerSphere: THREE.Mesh;
    private _pointerArrow: THREE.ArrowHelper;

    public settings = {
        showGuides: true,
        hasShading: true,
        slices: 0,
        ambient: 0.1,
        color1: '#3f5efb',
        color2: '#fc466b',
        background: 0x0c0c0c,
        minThreshold: 0.00001,
        scissor: 0
    }

    public get domainBox() {
        return this._domainBox;
    }

    constructor(
        wgl: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera,
        domain: THREE.Vector3,
    ) {
        this._wgl = wgl;
        this.updateBackgroundColor();

        this._camera = camera;
        this._scene = new THREE.Scene();

        this.settings.slices = Math.sqrt(domain.x * domain.x + domain.y * domain.y + domain.z * domain.z); // TODO: mention default slice count in vis cahpter

        // Setup tiled rendering
        this._material = new THREE.RawShaderMaterial({
            uniforms: {
                density: { value: new THREE.Texture() },
                velocity: { value: new THREE.Texture() },
                pressure: { value: new THREE.Texture() },
                u_size: { value: new THREE.Vector3() },
                u_resolution: { value: new THREE.Vector3() },
                u_textureResolution: { value: new THREE.Vector2() },
                u_tileCount: { value: new THREE.Vector3() },
                u_color1: { value: new THREE.Vector3() },
                u_color2: { value: new THREE.Vector3() },
                u_minThreshold: { value: 0.0 },
                u_ambient: { value: 0.0 },
                u_applyShading: { value: true },
            },
            vertexShader: vertexTiled,
            fragmentShader: [fragmentCommon, fragmentTiled].join('\n'),
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: false,
        });

        // Add visual guides
        this._pointerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        this._scene.add(this._pointerSphere);

        this._pointerArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            1.5,
            0x000000,
            0.5,
            0.5
        );
        this._scene.add(this._pointerArrow);
    }

    reset(
        domain: THREE.Vector3,
        tiledTex: TiledTexture,
        resetSlices?: boolean
    ) {
        this._material.uniforms.u_size.value = domain;
        this._material.uniforms.u_resolution.value = tiledTex.simulationResolution;
        this._material.uniforms.u_textureResolution.value = tiledTex.resolution;
        this._material.uniforms.u_tileCount.value = tiledTex.tileCount;

        this._scene.remove(this._group);
        this._scene.remove(this._domainBox);

        let sideLength = Math.sqrt(domain.x * domain.x + domain.y * domain.y + domain.z * domain.z);
        if (resetSlices)
            this.settings.slices = sideLength;
        this._group = new THREE.Group();
        this._group.matrixAutoUpdate = true;
        for (let z = 0; z < this.settings.slices; z++) {
            const geometry = new THREE.PlaneGeometry(sideLength, sideLength);
            geometry.translate(0.0, 0.0, (sideLength / -2) + (sideLength / this.settings.slices) * z);

            let attribCoord = [];
            for (let i = 0; i < geometry.getAttribute("position").count; i++) {
                attribCoord.push(z);
            }
            geometry.setAttribute("depth", new THREE.Float32BufferAttribute(attribCoord, 1));

            const quad = new THREE.Mesh(geometry, this._material);
            this._group.add(quad);
        }
        this._scene.add(this._group);

        const geometryDomainBox = new THREE.BoxGeometry(domain.x, domain.y, domain.z);
        this._domainBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometryDomainBox),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        this._domainBox.visible = this.settings.showGuides;
        this._scene.add(this._domainBox);
    }

    render(density: Slab, velocity: Slab, pressure: Slab) {
        this._group.rotation.copy(this._camera.rotation);

        // Render 
        this._material.uniforms.density.value = density.read.texture;
        this._material.uniforms.velocity.value = velocity.read.texture;
        this._material.uniforms.pressure.value = pressure.read.texture;
        this._material.uniforms.u_color1.value = new THREE.Color(this.settings.color1);
        this._material.uniforms.u_color2.value = new THREE.Color(this.settings.color2);
        this._material.uniforms.u_ambient.value = this.settings.ambient;
        this._material.uniforms.u_minThreshold.value = this.settings.minThreshold;
        this._material.uniforms.u_applyShading.value = this.settings.hasShading;

        this._wgl.setRenderTarget(null);
        this._wgl.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this._wgl.setScissor(0, 0, window.innerWidth - this.settings.scissor, window.innerHeight);
        this._wgl.clear();
        this._wgl.render(this._scene, this._camera);
    }

    updateGuides(position: THREE.Vector3, direction: THREE.Vector3, isPointerVisible: boolean) {
        this._domainBox.visible = this.settings.showGuides;
        this._pointerSphere.visible = this.settings.showGuides && isPointerVisible;
        this._pointerArrow.visible = this.settings.showGuides && isPointerVisible && (direction.length() > 0);

        direction.z *= -1;
        let color = new THREE.Color(0.5 + direction.x, 0.5 + direction.y, 0.5 + direction.z);

        this._pointerSphere.position.set(position.x, position.y, position.z);
        (this._pointerSphere.material as THREE.MeshBasicMaterial).color.set(color);

        this._pointerArrow.position.set(position.x, position.y, position.z);
        this._pointerArrow.setDirection(direction.normalize());
        this._pointerArrow.setColor(color);
    }

    updateBackgroundColor() {
        let color = new THREE.Color(this.settings.background);
        let colorVector = new THREE.Vector3().setFromColor(color);
        colorVector.addScalar(this.settings.ambient);

        this._wgl.setClearColor(color.setFromVector3(colorVector));
    }

    resize(width: number) {
        this.settings.scissor = width;
    }
}