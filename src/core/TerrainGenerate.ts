import { blockTypes, treeTypes } from "./Loader";
import { config, symConfig } from "./_config";
import "../utils/types/worker.d.ts";
import Worker from "./TerrainWorker?worker";
import { Terrain } from "./Terrain";
import weatherTypes from "./Biomes";

export class TerrainGenerate {
  terrain: Terrain;

  noiseSeed: {
    seed: number;
    cloudSeed: number;
    treeSeed: number;
  };

  treaders: Worker[];

  constructor(terrain: Terrain) {
    this.terrain = terrain;
    this.noiseSeed = { seed: 0, cloudSeed: 0, treeSeed: 0 };
    this.treaders = [];
  }

  setSeed(seed: number, cloudSeed: number, treeSeed: number) {
    this.noiseSeed = { seed, cloudSeed, treeSeed };
  }

  setTreader(num: number) {
    if (this.treaders.length > num) {
      for (let i = num; i < this.treaders.length; i += 1) {
        this.treaders[i].terminate();
      }
      this.treaders.length = num;
    } else {
      for (let i = this.treaders.length; i < num; i += 1) {
        const worker = new Worker();
        worker.onmessage = this.terrain.onUpdateLine.bind(this.terrain);
        this.treaders.push(worker);
      }
    }
  }

  generateLine({
    stx,
    edx,
    stz,
    edz,
    fragmentSize,
    thread
  }: {
    stx: number;
    edx: number;
    stz: number;
    edz: number;
    fragmentSize: number;
    thread: number;
  }) {
    if (stx > edx) [stx, edx] = [edx, stx];
    if (stz > edz) [stz, edz] = [edz, stz];
    const timestamp = performance.now();
    const fragCountZ = (edz - stz) / fragmentSize;
    const fragCountX = (edx - stx) / fragmentSize;
    if (fragCountZ === 1) {
      let curFragX = 0;
      for (let i = 0; i < thread; i += 1) {
        const stx2 = stx + curFragX * fragmentSize;
        const edx2 = i === thread - 1 ? edx : stx + Math.floor(((i + 1) / thread) * fragCountX) * fragmentSize;
        this.treaders[i].postMessage({
          timestamp,
          stx: stx2,
          edx: edx2,
          stz,
          edz,
          fragmentSize,
          noiseSeed: this.noiseSeed,
          noiseGap: symConfig.noiseGap,
          weather: config.weather,
          blockTypes,
          weatherTypes,
          horizonHeight: symConfig.stage.horizonHeight,
          treeBaseHeight: symConfig.stage.treeBaseHeight,
          maxHeight: symConfig.stage.maxHeight,
          skyHeight: symConfig.stage.skyHeight,
          treeTypes,
          log: this.terrain.core.controller.log.queryArea(stx2, edx2, stz, edz)
        });
        curFragX = Math.floor(((i + 1) / thread) * fragCountX);
      }
    } else {
      let curFragZ = 0;
      for (let i = 0; i < thread; i += 1) {
        const stz2 = stz + curFragZ * fragmentSize;
        const edz2 = i === thread - 1 ? edz : stz + Math.floor(((i + 1) / thread) * fragCountZ) * fragmentSize;
        this.treaders[i].postMessage({
          timestamp,
          stz: stz2,
          edz: edz2,
          stx,
          edx,
          fragmentSize,
          noiseSeed: this.noiseSeed,
          noiseGap: symConfig.noiseGap,
          weather: config.weather,
          blockTypes,
          weatherTypes,
          horizonHeight: symConfig.stage.horizonHeight,
          treeBaseHeight: symConfig.stage.treeBaseHeight,
          maxHeight: symConfig.stage.maxHeight,
          skyHeight: symConfig.stage.skyHeight,
          treeTypes,
          log: this.terrain.core.controller.log.queryArea(stx, edx, stz2, edz2)
        });
        curFragZ = Math.floor(((i + 1) / thread) * fragCountZ);
      }
    }
  }

  generateAll({
    stx,
    edx,
    stz,
    edz,
    fragmentSize,
    thread
  }: {
    stx: number;
    edx: number;
    stz: number;
    edz: number;
    fragmentSize: number;
    thread: number;
  }) {
    if (stx > edx) [stx, edx] = [edx, stx];
    if (stz > edz) [stz, edz] = [edz, stz];
    const fragCount = (edz - stz) / fragmentSize;
    let curFrag = 0;
    const timestamp = performance.now();
    for (let i = 0; i < thread; i += 1) {
      const stz2 = stz + curFrag * fragmentSize;
      const edz2 = i === thread - 1 ? edz : stz + Math.floor(((i + 1) / thread) * fragCount) * fragmentSize;
      this.treaders[i].postMessage({
        timestamp,
        stx,
        edx,
        stz: stz2,
        edz: edz2,
        fragmentSize,
        noiseSeed: this.noiseSeed,
        noiseGap: symConfig.noiseGap,
        weather: config.weather,
        blockTypes,
        weatherTypes,
        horizonHeight: symConfig.stage.horizonHeight,
        treeBaseHeight: symConfig.stage.treeBaseHeight,
        maxHeight: symConfig.stage.maxHeight,
        skyHeight: symConfig.stage.skyHeight,
        treeTypes,
        log: this.terrain.core.controller.log.queryArea(stx, edx, stz2, edz2)
      });
      curFrag = Math.floor(((i + 1) / thread) * fragCount);
    }
  }
}
