import * as THREE from 'three';

type Motion = {
    left: boolean,
    right: boolean,
    drag: THREE.Vector2,
    position: THREE.Vector2
}

export default class Mouse {

    left = false;
    right = false;
    position = new THREE.Vector2;
    motions: Motion[] = [];

    constructor() {
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
            let dy = -1.0 *( y - this.position.y);

            let drag = new THREE.Vector2(
                Math.min(Math.max(dx, -1), 1),
                Math.min(Math.max(dy, -1), 1)
            );

            let position = new THREE.Vector2(x, y);

            this.motions.push({
                left: this.left,
                right: this.right,
                drag: drag,
                position: position
            });

            this.position.set(x, y);
        }
    }

    contextMenu(event: MouseEvent) {
        event.preventDefault();
    }
}
