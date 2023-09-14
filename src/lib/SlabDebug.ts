import * as THREE from 'three';
import Slab from './Slab';


export default class SlabDebug {

    title: string;
    slab: Slab;

    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;

    sceneElement: HTMLDivElement;

    material: THREE.RawShaderMaterial;


    constructor(title: string, slab: Slab, grid: THREE.Vector2, vs: string, fs: string, bias: number = 0.0) {
        this.title = title;
        this.slab = slab;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 1, 10);
        this.camera.position.z = 2;

        const geometry = new THREE.PlaneGeometry(grid.x, grid.y)

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                read: { value: slab.read.texture },
                bias: { value: new THREE.Vector3(bias, bias, bias) },
                scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
            },
            vertexShader: vs,
            fragmentShader: fs
        });;

        let mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);

        this.sceneElement = document.createElement('div');
    }

    create(container: HTMLElement): void {
        const element = document.createElement('div');
        element.className = 'debug-item';

        element.appendChild(this.sceneElement);

        const descriptionElemen = document.createElement('div');
        descriptionElemen.innerText = this.title;
        element.appendChild(descriptionElemen);

        container.appendChild(element);


    }

    render(renderer: THREE.WebGLRenderer): void {
        const rect = this.sceneElement.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
            rect.right < 0 || rect.left > renderer.domElement.clientWidth) {
            return; // it's off screen
        }

        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        const bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        this.material.uniforms.read.value = this.slab.read.texture;

        renderer.render(this.scene, this.camera);
    }
}