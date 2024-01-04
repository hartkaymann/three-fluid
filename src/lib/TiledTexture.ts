import * as THREE from 'three'

export default class TiledTexture {

    private _resolution: THREE.Vector2;
    private _tileResolution: THREE.Vector2;
    private _tileCount: THREE.Vector3;
    private _simulationResolution: THREE.Vector3;

    constructor() {
        this._resolution = new THREE.Vector2;
        this._tileResolution = new THREE.Vector2;
        this._tileCount = new THREE.Vector3;
        this._simulationResolution = new THREE.Vector3;
    }

    get resolution(): THREE.Vector2 { return this._resolution; }
    get tileResolution(): THREE.Vector2 { return this._tileResolution; }
    get tileCount(): THREE.Vector3 { return this._tileCount; }
    get simulationResolution(): THREE.Vector3 { return this._simulationResolution; }

    // TODO: 
    // To keep ratio correct, the total tiles should be bigger than the target tile amount.
    // The target tile amount should then be taken as the z value for the tile count. 
    // This would waste a bit of space but the grid would be guaranteed equally spaced.
    // Aternatively might have to change halfrdx in shaders when computing gradient. 
    // Solution: Cache the best result and use that at the end.
    computeResolution(maxTextureResolution: THREE.Vector2, domain: THREE.Vector3) : boolean {
        const domainRatio = new THREE.Vector3(domain.x / domain.y, domain.y / domain.z, domain.z / domain.x);

        let targetTileAmount = domainRatio.z;
        let tileCount = new THREE.Vector2(0, 0);

        let areaWidthScale = (domainRatio.x * maxTextureResolution.y) * maxTextureResolution.y; // area of the result when scaled by width
        let areaHeightScale = maxTextureResolution.x * (maxTextureResolution.x / domainRatio.x); // area of the result when scaled by height
        let newWidth, newHeight = 0;
        if (areaWidthScale < areaHeightScale) {
            newWidth = domainRatio.x * maxTextureResolution.y;
            newHeight = maxTextureResolution.y;
        } else {
            newWidth = maxTextureResolution.x;
            newHeight = maxTextureResolution.x / domainRatio.x;
        }
        //console.log("Max Res: " +  maxTextureResolution.x + ", " + maxTextureResolution.y);

        let tileResolutionLow = new THREE.Vector2(0, 0); // low
        let tileResolutionHigh = new THREE.Vector2(newWidth, newHeight); // high
        let tileResolution = new THREE.Vector2();
        let i = 0;
        let totalTiles = 0;
        for (; i < Math.sqrt(Math.max(tileResolutionHigh.x, tileResolutionHigh.y)); i++) {
            tileResolution.set(
                (tileResolutionLow.x + tileResolutionHigh.x) / 2.0,
                (tileResolutionLow.y + tileResolutionHigh.y) / 2.0
            ).floor(); // mid

            targetTileAmount = tileResolution.x * domainRatio.z;

            tileCount = new THREE.Vector2(Math.floor(maxTextureResolution.x / tileResolution.x), Math.floor(maxTextureResolution.y / tileResolution.y));
            totalTiles = tileCount.x * tileCount.y; // mid value

            if (totalTiles == targetTileAmount)
                break;
            else if (totalTiles < targetTileAmount)
                tileResolutionHigh.copy(tileResolution);
            else
                tileResolutionLow.copy(tileResolution);
        }

        this._resolution = new THREE.Vector2(tileResolution.x * tileCount.x, tileResolution.y * tileCount.y);
        this._tileResolution = tileResolution;
        this._tileCount = new THREE.Vector3(tileCount.x, tileCount.y, totalTiles);
        this._simulationResolution = new THREE.Vector3(tileResolution.x, tileResolution.y, totalTiles);

        // console.log("Iterations: " + i);
        // console.log("Final Simulation Resolution: " + tileResolution.x + ", " + tileResolution.y + ", " + totalTiles);
        // console.log("Final Texture Resolution: " + tileResolution.x * tileCount.x + ", " + tileResolution.y * tileCount.y);
        return totalTiles != 0;
    }
}