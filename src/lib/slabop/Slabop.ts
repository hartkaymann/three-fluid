import * as THREE from 'three';


// Emulating a 3D textures with tiled 2D textures
// the Z slices of a 3D texture are laid out along the X-Axis
// the 2D dimensions of a 3D texture are therefore [width * depth, height]

/*
    Using a staggered (MAC maybe later) grid
    velocity grid width = grid width + 1 
    velocity grid height = grid height + 1 
    velocity grid depth = grid depth + 1
    
    the scalar for cell [i, j, k] is positionally located at [i + 0.5, j + 0.5, k + 0.5]
    x velocity for cell [i, j, k] is positionally located at [i, j + 0.5, k + 0.5]
    y velocity for cell [i, j, k] is positionally located at [i + 0.5, j, k + 0.5]
    z velocity for cell [i, j, k] is positionally located at [i + 0.5, j + 0.5, k]
    */

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

        // this.camera = new THREE.OrthographicCamera((grid.x * grid.z) / -2, (grid.x * grid.z) / 2, grid.y / 2, grid.y / -2, 1, 100);
        this.camera = new THREE.OrthographicCamera(0, grid.x * grid.z, grid.y, 0, 1, 100);
        this.camera.position.z = 2;

        this.uniforms = uniforms;

        const geometry = new THREE.PlaneGeometry(grid.x * grid.z - 2, grid.y + -2, grid.z, 1.0);
        geometry.translate(grid.x * grid.z / 2, grid.y / 2, 0.0);
        const material = new THREE.RawShaderMaterial({
            //glslVersion: THREE.GLSL3,
            uniforms: this.uniforms,
            vertexShader: vs,
            fragmentShader: fs
        });
        const quad = new THREE.Mesh(geometry, material);

        this.scene.add(quad);
    }
}