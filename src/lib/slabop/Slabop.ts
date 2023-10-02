import * as THREE from 'three';


// Emulating a 3D textures with tiled 2D textures
// the Z slices of a 3D texture are laid out along the X-Axis
// the 2D dimensions of a 3D texture are therefore [width * depth, height]

export abstract class Slabop {

    protected scene: THREE.Scene;
    protected camera: THREE.Camera;
    uniforms: { [uniform: string]: THREE.IUniform<any> }

    constructor(
        grid: THREE.Vector3,
        vs: string,
        fs: string,
        uniforms: {
            [uniform: string]: THREE.IUniform<any>
        }
    ) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.OrthographicCamera((grid.x * grid.z) / -2, (grid.x * grid.z) / 2, grid.y / 2, grid.y / -2, 1, 100);
        this.camera.position.z = 2;

        this.uniforms = uniforms;

        // TODO: reduce render area to not render the first and last tile, since those would be boundaries
        // const geometry = new THREE.PlaneGeometry(grid.x * grid.z - 2, grid.y -2, grid.z, 1.0);

        for (let i = 1; i < grid.z - 1; i++) {
            const geometry = new THREE.PlaneGeometry(grid.x - 2, grid.y - 2);
            geometry.translate((grid.x * grid.z / -2 + grid.x / 2) + i * grid.x, 0.0, 0.0);
            
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