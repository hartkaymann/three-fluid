import * as THREE from 'three'
import SlabDebug from './SlabDebug';


import Slab from './Slab';


export default class DebugPanel {

    wgl: THREE.WebGLRenderer;
    container: HTMLElement;

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
        this.slabDebugs.forEach(element => {
            element.create(this.container);
        });
    }

    render() {
        this.slabDebugs.forEach(element => {
            element.render(this.wgl);
        });
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