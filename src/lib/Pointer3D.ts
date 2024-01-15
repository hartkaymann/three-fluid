import * as THREE from 'three';
import Mouse from './Mouse';

/**
 * Tracks position of cursor in 3D world space.
 */
export default class Pointer3D extends THREE.Raycaster {

    camera: THREE.Camera;
    mouse: Mouse;

    geometry: THREE.Object3D;

    position: THREE.Vector3;
    first: THREE.Vector3;
    last: THREE.Vector3;
    direction: THREE.Vector3;

    isHit: boolean;

    constructor(
        camera: THREE.Camera,
        mouse: Mouse, domain: THREE.Vector3
    ) {
        super();
        this.camera = camera;
        this.mouse = mouse;

        this.position = new THREE.Vector3();
        this.first = new THREE.Vector3();
        this.last = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isHit = false;

        this.geometry = new THREE.Mesh(
            new THREE.BoxGeometry(domain.x, domain.y, domain.z),
            new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
        );
    }

    /**
     * Shoots a ray into the scene.
     * When ray intersects with the domain box, the position of the pointer is updated.
     * @returns null
     */
    update() {
        let mousePosition = new THREE.Vector2(
            this.mouse.position.x * 2 - 1,
            -this.mouse.position.y * 2 + 1
        );

        this.setFromCamera(mousePosition, this.camera);
        const intersects = this.intersectObject(this.geometry);
        if (intersects.length == 0) {
            this.isHit = false;
            return;
        }
        this.isHit = true;

        let intersectFirst = intersects[0].point
        let intersectLast = intersects[intersects.length - 1].point;

        this.first = intersectFirst;
        this.last = intersectLast; // TODO: shorthen and get rid of other variables if i leave these in

        let midpoint = new THREE.Vector3(
            (intersectFirst.x + intersectLast.x) / 2,
            (intersectFirst.y + intersectLast.y) / 2,
            (intersectFirst.z + intersectLast.z) / 2
        );

        this.direction = new THREE.Vector3(
            midpoint.x - this.position.x,
            midpoint.y - this.position.y,
            midpoint.z - this.position.z
        )
        this.position = midpoint;
    }
}
