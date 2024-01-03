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

    plane: THREE.Mesh;
    sceneElement: HTMLDivElement;

    material: THREE.RawShaderMaterial;


    constructor(title: string, slab: Slab, bias: number) {
        this.title = title;
        this.slab = slab;

        let isVectorFormat = this.slab.read.texture.format == THREE.RGBAFormat;
        const res = this.slab.resolution;
        const vs = vertexBasic;
        const fs = isVectorFormat ? fragmentDisplayVector : fragmentDisplayScalar;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                u_readTexture: { value: new THREE.Texture() },
                u_bias: { value: new THREE.Vector3(bias, bias, bias) },
                u_scale: { value: new THREE.Vector3(res.x, res.x, res.x) },
            },
            vertexShader: vs,
            fragmentShader: fs
        });
        this.reset();

        this.sceneElement = document.createElement('div');
    }

    reset(): void {
        const res = this.slab.resolution;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, res.x, res.y, 0, 1, 100);
        this.camera.position.z = 2;
        
        const geometry = new THREE.PlaneGeometry(res.x, res.y)
        geometry.translate(
            res.x / 2,
            res.y / 2,
            0
        );

        this.plane = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.plane);
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

        this.material.uniforms.u_readTexture.value = this.slab.read.texture;

        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }

    setSlab(slab: Slab): void{
        this.slab = slab;
        this.reset();
    }
}