import * as THREE from 'three';
import Slab from './Slab';

import vertexBasic from '../shaders/basic.vert'

import fragmentDisplayVector from '../shaders/displayvector.frag'
import fragmentDisplayScalar from '../shaders/displayscalar.frag'

export default class SlabDebug {

    title: string;
    slab: Slab;

    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;

    sceneElement: HTMLDivElement;

    material: THREE.RawShaderMaterial;


    constructor(title: string, slab: Slab) {
        this.title = title;
        this.slab = slab;

        const res = slab.resolution;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, res.x, res.y, 0, 1, 100);
        this.camera.position.z = 2;
        
        
        let isVectorFormat = slab.read.texture.format == THREE.RGBAFormat;
        const vs = vertexBasic;
        const fs = isVectorFormat ? fragmentDisplayVector : fragmentDisplayScalar;
        let bias = isVectorFormat ? 0.5 : 0.0; 

        const geometry = new THREE.PlaneGeometry(res.x, res.y)
        geometry.translate(
            res.x / 2,
            res.y / 2,
            0
        );

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                read: { value: slab.read.texture },
                bias: { value: new THREE.Vector3(bias, bias, bias) },
                scale: { value: new THREE.Vector3(res.x, res.x, res.x) },
                res: { value: res }
            },
            vertexShader: vs,
            fragmentShader: fs
        });

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

        if (rect.bottom < 0 ||
            rect.top > renderer.domElement.clientHeight ||
            rect.right < 0 ||
            rect.left > renderer.domElement.clientWidth) {
            return; // it's off screen
        }

        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        const bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.clearColor();

        this.material.uniforms.read.value = this.slab.read.texture;

        renderer.render(this.scene, this.camera);
    }
}