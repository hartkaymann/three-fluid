import * as THREE from 'three';

export default class Slab {

    private FBOs: THREE.WebGLRenderTarget[];

    read: THREE.WebGLRenderTarget;
    write: THREE.WebGLRenderTarget;
    resolution: THREE.Vector2;

    constructor(resolution: THREE.Vector2, format?: THREE.AnyPixelFormat) {

        this.FBOs = [];

        for (let i = 0; i < 2; i++) {
            this.FBOs[i] = new THREE.WebGLRenderTarget(
                resolution.x,
                resolution.y,
                {
                    type: THREE.FloatType,
                    format: format ? format : THREE.RGBAFormat,
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    //minFilter: THREE.NearestFilter,
                    //magFilter: THREE.NearestFilter,

                }
            );
        }

        this.read = this.FBOs[0];
        this.write = this.FBOs[1];
        this.resolution = resolution;
    }

    swap() {
        let temp = this.read;
        this.read = this.write;
        this.write = temp;
    }
}