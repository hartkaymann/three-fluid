import * as THREE from 'three'
import SlabDebug from './SlabDebug';


import Slab from './Slab';


export default class DebugPanel {

    wgl: THREE.WebGLRenderer;

    container: HTMLElement;
    elementResolution: HTMLParagraphElement;
    elementTiles: HTMLParagraphElement;

    slabDebugs: SlabDebug[] = [];

    constructor(
        wgl: THREE.WebGLRenderer,
        container: HTMLElement,
        slabs: { name: string, slab: Slab, bias: number }[]
    ) {
        this.wgl = wgl;
        this.container = container;

        slabs.forEach(element => {
            this.slabDebugs.push(new SlabDebug(element.name, element.slab, element.bias));
        })
    }

    create() {
        //const debugHeader = document.getElementById('debug-header') as HTMLDivElement;

        this.elementResolution = document.querySelector('#debug-resolution .debug-text') as HTMLTableCellElement;
        this.elementTiles = document.querySelector('#debug-tiles .debug-text') as HTMLTableCellElement;

        this.slabDebugs.forEach(element => {
            element.create(this.container);
        });
    }

    render() {
        this.slabDebugs.forEach(element => {
            element.render(this.wgl);
        });
    }

    setHeader(
        resolution: THREE.Vector2,
        targetResolution: THREE.Vector2,
        tiles: number
    ) {
        // TODO: target and actual resolution both here!
        this.elementResolution.innerHTML = `${resolution.x}\u2A2F${resolution.x} (${targetResolution.x}\u2A2F${targetResolution.x})`;
        this.elementTiles.innerHTML = `${tiles}`;
    }

    setSlabs(slabs: { name: string, slab: Slab, bias: number }[]) {
        if (this.slabDebugs.length != slabs.length) {
            console.warn("Warning! Slabs could not be reset.")
            return;
        }

        for (let i = 0; i < this.slabDebugs.length; i++) {
            this.slabDebugs[i].setSlab(slabs[i].slab);
        }
    }
}