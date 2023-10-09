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

    constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, window: THREE.Vector2, domain: THREE.Vector3, resolution: THREE.Vector3) {
        this.renderer = renderer;
        this.camera = camera;

        this.window = window;
        this.domain = domain;

        this.scene = new THREE.Scene();

        // Setup tiled rendering
        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                read: { value: new THREE.Texture() },
                res: { value: resolution },
                size: { value: domain }
            },
            vertexShader: vertexTiled,
            fragmentShader: fragmentTiled,
            side: THREE.DoubleSide,
            transparent: true
        });

        for (let i = 1; i < resolution.z - 1; i++) {
            const geometry = new THREE.PlaneGeometry(domain.x, domain.y);
            geometry.translate(0.0, 0.0, domain.z / 2 - i * (domain.z / resolution.z));

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
            new THREE.MeshBasicMaterial({ color: 0x00ffff })
        );
        this.scene.add(this.pointerSphere);
    }

    render(slab: Slab) {
        // Render 
        this.material.uniforms.read.value = slab.read.texture;

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