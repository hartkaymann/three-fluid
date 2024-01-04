import * as THREE from 'three'
import DebugSlab from './DebugSlab';

import Slab from './Slab';


export default class DebugPanel {

    wgl: THREE.WebGLRenderer;

    container: HTMLElement;
    elementResolution: HTMLParagraphElement;
    elementTileResolution: HTMLParagraphElement;
    elementTiles: HTMLParagraphElement;

    debugSlabs: DebugSlab[] = [];

    constructor(
        wgl: THREE.WebGLRenderer,
        container: HTMLElement,
        slabs: { name: string, slab: Slab, bias: number }[]
    ) {
        this.wgl = wgl;
        this.container = container;

        this.elementResolution = document.querySelector('#debug-resolution .debug-text') as HTMLTableCellElement;
        this.elementTileResolution = document.querySelector('#debug-tile-resolution .debug-text') as HTMLTableCellElement;
        this.elementTiles = document.querySelector('#debug-tiles .debug-text') as HTMLTableCellElement;

        slabs.forEach(element => {
            this.debugSlabs.push(new DebugSlab(element.name, element.slab, element.bias));
        })

    }

    
    create() {
        this.debugSlabs.forEach(element => {
            element.create(this.container);
        });
    }

    render() {
        this.debugSlabs.forEach(element => {
            element.render(this.wgl);
        });
    }

    setHeader(
        resolution: THREE.Vector2,
        tileResolution: THREE.Vector2,
        tiles: number
    ) {
        this.elementResolution.innerHTML = `${resolution.x}\u2A2F${resolution.x}`;
        this.elementTileResolution.innerHTML = `${tileResolution.x}\u2A2F${tileResolution.x}`;
        this.elementTiles.innerHTML = `${tiles}`;
    }

    setSlabs(slabs: { name: string, slab: Slab, bias: number }[]) {
        if (this.debugSlabs.length != slabs.length) {
            console.warn("Warning! Slabs could not be reset.")
            return;
        }

        for (let i = 0; i < this.debugSlabs.length; i++) {
            this.debugSlabs[i].setSlab(slabs[i].slab);
        }
    }
}