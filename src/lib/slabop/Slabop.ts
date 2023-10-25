import * as THREE from 'three';


// Emulating a 3D textures with tiled 2D textures
// the Z slices of a 3D texture are laid out along the X-Axis
// the 2D dimensions of a 3D texture are therefore [width * depth, height]

export abstract class Slabop {
    
    protected renderer: THREE.WebGLRenderer;
    protected scene: THREE.Scene;
    protected camera: THREE.Camera;

    uniforms: { [uniform: string]: THREE.IUniform<any> }

    constructor(
        renderer: THREE.WebGLRenderer,
        resolution: THREE.Vector3,
        vertexShaders: string | string[],
        fragmentShaders: string | string[],
        uniforms: {
            [uniform: string]: THREE.IUniform<any>
        }
    ) {
        this.renderer = renderer; 
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera((resolution.x * resolution.z) / -2, (resolution.x * resolution.z) / 2, resolution.y / 2, resolution.y / -2, 1, 100);
        this.camera.position.z = 2;

        this.uniforms = uniforms;

        let vs = Array.isArray(vertexShaders) ? vertexShaders.join('\n') : vertexShaders;
        let fs = Array.isArray(fragmentShaders) ? fragmentShaders.join('\n') : fragmentShaders;

        for (let i = 1; i < resolution.z - 1; i++) {
            const geometry = new THREE.PlaneGeometry(resolution.x - 2, resolution.y - 2);
            geometry.translate((resolution.x * resolution.z / -2 + resolution.x / 2) + i * resolution.x, 0.0, 0.0);
            
            const material = new THREE.RawShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: vs,
                fragmentShader: fs,
            });
            const quad = new THREE.Mesh(geometry, material);
            
            this.scene.add(quad);
        }
    }
}