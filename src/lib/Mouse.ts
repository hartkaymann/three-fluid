import * as THREE from 'three';


export default class Mouse {

    left: boolean;
    right: boolean;
    position: THREE.Vector2;
    motion: THREE.Vector2;

    constructor() {
        this.left = false;
        this.right = false;
        this.position = new THREE.Vector2();
        this.motion = new THREE.Vector2();

        document.addEventListener("mousedown", this.mouseDown.bind(this), false);
        document.addEventListener("mouseup", this.mouseUp.bind(this), false);
        document.addEventListener("mousemove", this.mouseMove.bind(this), false);
        document.addEventListener("contextmenu", this.contextMenu.bind(this), false);
    }

    mouseDown(event: MouseEvent) {
        let x = event.clientX / window.innerWidth;
        let y = event.clientY / window.innerHeight;
        this.position.set(x, y);
        this.left = event.button === 0 ? true : this.left;
        this.right = event.button === 2 ? true : this.right;
    }

    mouseUp(event: MouseEvent) {
        event.preventDefault();
        this.left = event.button === 0 ? false : this.left;
        this.right = event.button === 2 ? false : this.right;
    }

    mouseMove(event: MouseEvent) {
        event.preventDefault();

        let x = event.clientX / window.innerWidth;
        let y = event.clientY / window.innerHeight;

        if (this.left || this.right) {
            let dx = x - this.position.x;
            let dy = -1.0 * (y - this.position.y);

            let drag = new THREE.Vector2(
                Math.min(Math.max(dx, -1), 1),
                Math.min(Math.max(dy, -1), 1)
            );

            let position = new THREE.Vector2(x, y);

            this.motion = drag;

            this.position.set(x, y);
        }
    }

    contextMenu(event: MouseEvent) {
        event.preventDefault();
    }
}
