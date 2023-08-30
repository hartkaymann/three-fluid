import * as THREE from 'three';

export default class CustomTexture extends THREE.DataTexture {
    constructor(
        width: number,
        height: number,
        color: THREE.Color = new THREE.Color(0xff00ff),) {

        const size = width * height;
        const data = new Uint8Array(4 * size);

        const r = Math.floor(color.r * 255);
        const g = Math.floor(color.g * 255);
        const b = Math.floor(color.b * 255);

        for (let i = 0; i < size; i++) {
            const stride = i * 4;
            data[stride] = r;
            data[stride + 1] = g;
            data[stride + 2] = b;
            data[stride + 3] = 255;
        }
        super(data, width, height);

        this.minFilter = THREE.NearestFilter;
        this.wrapS = THREE.ClampToEdgeWrapping;
        this.needsUpdate = true;

    }
}