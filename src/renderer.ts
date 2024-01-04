import * as THREE from 'three'

import vertexTiled from './shaders/displaytiled.vert'
import fragmentCommon from './shaders/common.frag'
import fragmentTiled from './shaders/displaytiled.frag'
import Slab from './lib/Slab';
import TiledTexture from './lib/TiledTexture';

export default class Renderer {

    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;

    domainBox: THREE.LineSegments;
    group: THREE.Group;

    material: THREE.RawShaderMaterial;
    pointerSphere: THREE.Mesh;
    pointerArrow: THREE.ArrowHelper;

    settings = {
        showGuides: true,
        hasShading: true,
        slices: 0,
        ambient: 0.1,
        color1: '#3f5efb',
        color2: '#fc466b',
        minThreshold: 0.00001,
        scissor: 0
    }

    constructor(
        renderer: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera,
        domain: THREE.Vector3,
    ) {
        this.renderer = renderer;
        this.camera = camera;

        this.scene = new THREE.Scene();

        this.settings.slices = Math.sqrt(domain.x * domain.x + domain.y * domain.y + domain.z * domain.z); // TODO: mention default slice count in vis cahpter

        // Setup tiled rendering
        this.material = new THREE.RawShaderMaterial({
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
        this.pointerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        this.scene.add(this.pointerSphere);

        this.pointerArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            1.5,
            0x000000,
            0.5,
            0.5
        );
        this.scene.add(this.pointerArrow);
    }

    reset(
        domain: THREE.Vector3,
        tiledTex: TiledTexture,
        resetSlices?: boolean
    ) {
        this.material.uniforms.u_size.value = domain;
        this.material.uniforms.u_resolution.value = tiledTex.simulationResolution;
        this.material.uniforms.u_textureResolution.value = tiledTex.resolution;
        this.material.uniforms.u_tileCount.value = tiledTex.tileCount;

        this.scene.remove(this.group);
        this.scene.remove(this.domainBox);

        let sideLength = Math.sqrt(domain.x * domain.x + domain.y * domain.y + domain.z * domain.z);
        if(resetSlices) 
            this.settings.slices = sideLength;
        this.group = new THREE.Group();
        this.group.matrixAutoUpdate = true;
        for (let z = 0; z < this.settings.slices; z++) {
            const geometry = new THREE.PlaneGeometry(sideLength, sideLength);
            geometry.translate(0.0, 0.0, (sideLength / -2) + (sideLength / this.settings.slices) * z);

            let attribCoord = [];
            for (let i = 0; i < geometry.getAttribute("position").count; i++) {
                attribCoord.push(z);
            }
            geometry.setAttribute("depth", new THREE.Float32BufferAttribute(attribCoord, 1));

            const quad = new THREE.Mesh(geometry, this.material);
            this.group.add(quad);
        }
        this.scene.add(this.group);

        const geometryDomainBox = new THREE.BoxGeometry(domain.x, domain.y, domain.z);
        this.domainBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometryDomainBox),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        this.domainBox.visible = this.settings.showGuides;
        this.scene.add(this.domainBox);
    }

    render(density: Slab, velocity: Slab, pressure: Slab) {
        this.group.rotation.copy(this.camera.rotation);

        // Render 
        this.material.uniforms.density.value = density.read.texture;
        this.material.uniforms.velocity.value = velocity.read.texture;
        this.material.uniforms.pressure.value = pressure.read.texture;
        this.material.uniforms.u_color1.value = new THREE.Color(this.settings.color1);
        this.material.uniforms.u_color2.value = new THREE.Color(this.settings.color2);
        this.material.uniforms.u_ambient.value = this.settings.ambient;
        this.material.uniforms.u_minThreshold.value = this.settings.minThreshold;
        this.material.uniforms.u_applyShading.value = this.settings.hasShading;

        this.renderer.setRenderTarget(null);
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.setScissor(0, 0, window.innerWidth - this.settings.scissor, window.innerHeight);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
    }

    updateGuides(position: THREE.Vector3, direction: THREE.Vector3, isPointerVisible: boolean) {
        this.domainBox.visible = this.settings.showGuides;
        this.pointerSphere.visible = this.settings.showGuides && isPointerVisible;
        this.pointerArrow.visible = this.settings.showGuides && isPointerVisible && (direction.length() > 0);

        direction.z *= -1;
        let color = new THREE.Color(0.5 + direction.x, 0.5 + direction.y, 0.5 + direction.z);

        this.pointerSphere.position.set(position.x, position.y, position.z);
        (this.pointerSphere.material as THREE.MeshBasicMaterial).color.set(color);

        this.pointerArrow.position.set(position.x, position.y, position.z);
        this.pointerArrow.setDirection(direction.normalize());
        this.pointerArrow.setColor(color);
    }

    resize(width: number) {
        this.settings.scissor = width;
    }
}