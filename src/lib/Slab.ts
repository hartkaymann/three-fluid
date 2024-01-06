import * as THREE from 'three';

export default class Slab {

    private _FBOs: THREE.WebGLRenderTarget[];

    public read: THREE.WebGLRenderTarget;
    public write: THREE.WebGLRenderTarget;
    public resolution: THREE.Vector2;

    constructor(resolution: THREE.Vector2, format?: THREE.AnyPixelFormat) {

        this._FBOs = [];

        for (let i = 0; i < 2; i++) {
            this._FBOs[i] = new THREE.WebGLRenderTarget(
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

        this.read = this._FBOs[0];
        this.write = this._FBOs[1];
        this.resolution = resolution;
    }

    swap() {
        let temp = this.read;
        this.read = this.write;
        this.write = temp;
    }
}