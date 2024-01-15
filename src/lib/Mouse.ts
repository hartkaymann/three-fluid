import * as THREE from 'three';

/**
 * Keeps track of the screen position and buttons of the mouse.
 */
export default class Mouse {

    keys: [boolean, boolean];
    position: THREE.Vector2;
    motion: THREE.Vector2;

    constructor() {
        this.keys = [false, false];
        this.position = new THREE.Vector2();
        this.motion = new THREE.Vector2();

        document.addEventListener("mousedown", this.mouseDown.bind(this), false);
        document.addEventListener("mouseup", this.mouseUp.bind(this), false);
        document.addEventListener("mousemove", this.mouseMove.bind(this), false);
        document.addEventListener("contextmenu", this.contextMenu.bind(this), false);
    }

    mouseDown(event: MouseEvent) {
       
        this.keys[0] = event.button === 0 ? true : this.keys[0];
        this.keys[1] = event.button === 2 ? true : this.keys[1];
    }

    mouseUp(event: MouseEvent) {
        event.preventDefault();
        this.keys[0] = event.button === 0 ? false : this.keys[0];
        this.keys[1] = event.button === 2 ? false : this.keys[1];
    }

    mouseMove(event: MouseEvent) {
        event.preventDefault();

        let x = event.clientX / window.innerWidth;
        let y = event.clientY / window.innerHeight;
        this.position.set(x, y);

        if (this.keys[0] || this.keys[1]) {
            let dx = x - this.position.x;
            let dy = -1.0 * (y - this.position.y);

            let drag = new THREE.Vector2(
                Math.min(Math.max(dx, -1), 1),
                Math.min(Math.max(dy, -1), 1)
            );

            this.motion = drag;

            this.position.set(x, y);
        }
    }

    contextMenu(event: MouseEvent) {
        event.preventDefault();
    }
}
