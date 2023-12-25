import * as THREE from 'three'

import vertexTiled from './shaders/displaytiled.vert'
import fragmentCommon from './shaders/common.frag'
import fragmentTiled from './shaders/displaytiled.frag'
import Slab from './lib/Slab';
import TiledTexture from './lib/TiledTexture';

export default class Renderer {

    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;

    domain: THREE.Vector3;
    group: THREE.Group;

    material: THREE.RawShaderMaterial;
    pointerSphere: THREE.Mesh;
    pointerArrow: THREE.ArrowHelper;

    applyShading = true;
    color1 = '#3f5efb';
    color2 = '#fc466b';
    minThreshold = 0.00001;

    constructor(
        renderer: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera,
        domain: THREE.Vector3,
        tiledTex: TiledTexture
    ) {
        this.renderer = renderer;
        this.camera = camera;

        this.domain = domain;

        this.scene = new THREE.Scene();

        // Setup tiled rendering
        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                density: { value: new THREE.Texture() },
                velocity: { value: new THREE.Texture() },
                pressure: { value: new THREE.Texture() },
                u_size: { value: domain },
                u_resolution: { value: tiledTex.simulationResolution },
                u_textureResolution: { value: tiledTex.resolution },
                u_tileCount: { value: tiledTex.tileCount },
                u_color1: { value: new THREE.Vector3() },
                u_color2: { value: new THREE.Vector3() },
                u_minThreshold: { value: 0.0 },
                u_applyShading: { value: true }
            },
            vertexShader: vertexTiled,
            fragmentShader: [fragmentCommon, fragmentTiled].join('\n'),
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: false,
        });

        let sideLength = Math.sqrt(domain.x * domain.x + domain.y * domain.y + domain.z * domain.z);
        this.group = new THREE.Group();
        for (let z = 0; z < sideLength; z++) {
            const geometry = new THREE.PlaneGeometry(sideLength, sideLength);
            geometry.translate(0.0, 0.0, sideLength / 2 - z);

            let attribCoord = [];
            for (let i = 0; i < geometry.getAttribute("position").count; i++) {
                attribCoord.push(z);
            }
            geometry.setAttribute("depth", new THREE.Float32BufferAttribute(attribCoord, 1));

            const quad = new THREE.Mesh(geometry, this.material);
            this.group.add(quad);
        }

        this.scene.add(this.group);
        // Add visual guides
        const geometryDomainBox = new THREE.BoxGeometry(domain.x, domain.y, domain.z);
        const domainBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometryDomainBox),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        this.scene.add(domainBox);

        this.pointerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x1473e6 })
        );
        this.scene.add(this.pointerSphere);

        this.pointerArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            2,
            0x1473e6,
            0.5,
            0.5
        );
        this.scene.add(this.pointerArrow);
    }

    render(density: Slab, velocity: Slab, pressure: Slab) {

        this.group.rotation.copy(this.camera.rotation);
        // this.group.rotation.y += 0.02;
        this.group.matrixWorldNeedsUpdate = true;

        // Render 
        this.material.uniforms.density.value = density.read.texture;
        this.material.uniforms.velocity.value = velocity.read.texture;
        this.material.uniforms.pressure.value = pressure.read.texture;
        this.material.uniforms.u_color1.value = new THREE.Color(this.color1);
        this.material.uniforms.u_color2.value = new THREE.Color(this.color2);
        this.material.uniforms.u_minThreshold.value = this.minThreshold;
        this.material.uniforms.u_applyShading.value = this.applyShading;

        this.renderer.setRenderTarget(null);
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.setScissor(0, 0, window.innerWidth - 350, window.innerHeight);
        this.renderer.render(this.scene, this.camera);
    }

    updateGuides(position: THREE.Vector3, direction: THREE.Vector3, visible: boolean) {
        this.pointerSphere.visible = visible;
        this.pointerArrow.visible = visible && (direction.length() > 0);

        let color = new THREE.Color(0.5 + direction.x, 0.5 + direction.y, 0.5 + direction.z);

        // TODO: change sphere color to be interaction direction?
        this.pointerSphere.position.set(position.x, position.y, position.z);
        this.pointerSphere.material.color.set(color);

        this.pointerArrow.position.set(position.x, position.y, position.z);
        this.pointerArrow.setDirection(direction.normalize());
        this.pointerArrow.setColor(color);
    }

}