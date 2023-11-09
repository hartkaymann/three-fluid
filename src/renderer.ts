import * as THREE from 'three'

import vertexTiled from './shaders/displaytiled.vert'
import fragmentTiled from './shaders/displaytiled.frag'
import Slab from './lib/Slab';

export default class Renderer {

    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;

    window: THREE.Vector2;
    domain: THREE.Vector3;

    material: THREE.RawShaderMaterial;
    pointerSphere: THREE.Mesh;

    minThreshold = 0.0000;

    constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, window: THREE.Vector2, domain: THREE.Vector3, resolution: THREE.Vector3) {
        this.renderer = renderer;
        this.camera = camera;

        this.window = window;
        this.domain = domain;

        this.scene = new THREE.Scene();

        // Setup tiled rendering
        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                density: { value: new THREE.Texture() },
                velocity: {value: new THREE.Texture()},
                pressure: {value: new THREE.Texture()},
                res: { value: resolution },
                size: { value: domain },
                u_minThreshold: { value: 0.0},
            },
            vertexShader: vertexTiled,
            fragmentShader: fragmentTiled,
            side: THREE.DoubleSide,
            transparent: true
        });

        for (let z = 1; z < resolution.z - 1; z++) {
            const geometry = new THREE.PlaneGeometry(domain.x, domain.y);
            geometry.translate(0.0, 0.0, domain.z / 2 - z * (domain.z / resolution.z));

            let attribCoord = [];
            for (let i = 0; i < geometry.getAttribute("position").count; i++) {
                attribCoord.push(z);
            }
            geometry.setAttribute("depth", new THREE.Float32BufferAttribute(attribCoord, 1));

            const quad = new THREE.Mesh(geometry, this.material);

            this.scene.add(quad);
        }

        // Add visual guides
        const geometryDomainBox = new THREE.BoxGeometry(domain.x, domain.y, domain.z);
        const domainBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometryDomainBox),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        this.scene.add(domainBox);

        this.pointerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x1473e6 })
        );
        this.scene.add(this.pointerSphere);
    }

    render(density: Slab, velocity: Slab, pressure: Slab) {
        // Render 
        this.material.uniforms.density.value = density.read.texture;
        this.material.uniforms.velocity.value = velocity.read.texture;
        this.material.uniforms.pressure.value = pressure.read.texture;
        this.material.uniforms.u_minThreshold.value = this.minThreshold;

        this.renderer.setRenderTarget(null);
        this.renderer.setViewport(0, 0, this.window.width, this.window.height);
        this.renderer.setScissor(0, 0, this.window.width - 350, this.window.height);
        this.renderer.render(this.scene, this.camera);

    }

    updateGuides(position: THREE.Vector3, visible: boolean) {
        this.pointerSphere.visible = visible;
        this.pointerSphere.position.set(position.x, position.y, position.z);
    }

    resize(w: number, h: number) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
}