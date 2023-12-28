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
        slabs: { name: string, slab: Slab }[]
    ) {
        this.wgl = wgl;
        this.container = container;

        slabs.forEach(element => {
            this.slabDebugs.push(new SlabDebug(element.name, element.slab));
        })
    }

    create() {
        const debugHeader = document.createElement('div');
        debugHeader.className = 'debug-header';

        this.elementResolution = document.createElement('p');
        debugHeader.appendChild(this.elementResolution);

        this.elementTiles = document.createElement('p');
        debugHeader.appendChild(this.elementTiles);

        this.container.appendChild(debugHeader);

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
        tiles: number
    ) {
        this.elementResolution.innerText = `Resolution: ${resolution.x}x${resolution.x}`;
        this.elementTiles.innerText = `Tiles: ${tiles}`;
    }

    setSlabs(slabs: { name: string, slab: Slab }[]) {
        if(this.slabDebugs.length != slabs.length) {
            console.warn("Warning! Slabs could not be reset.")
            return;
        }

        for(let i = 0; i < this.slabDebugs.length; i++) {
            this.slabDebugs[i].setSlab(slabs[i].slab);
        } 
    }
}