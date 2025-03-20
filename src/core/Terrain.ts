import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import { iBlockFragment } from "../utils/types/block";
import { Core } from "./Core";
import { TerrainGenerate } from "./TerrainGenerate";
import { config, symConfig } from "./_config";
import { blockLoader, blockGeom, cloudGeom, cloudMaterial } from "./Loader";

export class Terrain {
  core: Core;
  seed: number;
  cloudSeed: number;
  treeSeed: number;
  generator: TerrainGenerate;
  size: number;
  fragmentSize: number; // Size of each terrain fragment
  originX: number;
  originZ: number;
  thread: number;
  blockFragments: iBlockFragment[][]; // Array of terrain fragments for chunk management

  constructor(core: Core) {
    this.core = core;
    this.generator = new TerrainGenerate(this);
    this.seed = 0;
    this.cloudSeed = 0;
    this.treeSeed = 0;
    this.size = 0;
    this.fragmentSize = 0;
    this.originX = 0;
    this.originZ = 0;
    this.thread = 0;
    this.blockFragments = [];
  }

  // Updates the world state and resets scene information when changing scene size
  updateState() {
    this.clear();
    if (config.seed === null || config.cloudSeed === null || config.treeSeed === null) return false;
    this.seed = config.seed;
    this.cloudSeed = config.cloudSeed;
    this.treeSeed = config.treeSeed;
    this.size = config.renderer.stageSize;
    this.fragmentSize = Math.sqrt(this.size);
    this.originX = Math.floor(config.state.posX / this.fragmentSize) * this.fragmentSize;
    this.originZ = Math.floor(config.state.posZ / this.fragmentSize) * this.fragmentSize;
    this.thread = config.controller.thread;
    if (this.generator.treaders.length !== this.thread) {
      this.generator.setTreader(this.thread);
    }
    this.blockFragments = new Array(this.fragmentSize);
    this.generator.setSeed(this.seed, this.cloudSeed, this.treeSeed);
    for (let i = 0; i < this.fragmentSize; i += 1) {
      this.blockFragments[i] = new Array(this.fragmentSize);
      for (let j = 0; j < this.fragmentSize; j += 1) {
        this.blockFragments[i][j] = {
          timestamp: 0,
          posX: 0,
          posZ: 0,
          group: undefined,
          types: [],
          templateMesh: [],
          idMap: new Map(),
          cloudPos: [],
          cloudMesh: undefined
        };
      }
    }
    this.buildWorld();
    return true;
  }

  // Initializes the world with lighting and initial terrain generation
  buildWorld() {
    // Set up scene lighting
    const sunLight = new THREE.PointLight(0xffffff, 500000.0);
    sunLight.position.set(500, 500, 500);
    this.core.scene.add(sunLight);

    const sunLight2 = new THREE.PointLight(0xffffff, 500000.0);
    sunLight2.position.set(-500, 500, -500);
    this.core.scene.add(sunLight2);

    const reflectionLight = new THREE.AmbientLight(0x404040, 0.5);
    this.core.scene.add(reflectionLight);

    this.tryUpdateAll();
  }

  // Generates and refreshes the entire world terrain
  tryUpdateAll() {
    this.generator.generateAll({
      stx: this.originX - (this.fragmentSize * this.fragmentSize) / 2,
      edx: this.originX + (this.fragmentSize * this.fragmentSize) / 2,
      stz: this.originZ - (this.fragmentSize * this.fragmentSize) / 2,
      edz: this.originZ + (this.fragmentSize * this.fragmentSize) / 2,
      thread: this.thread,
      fragmentSize: this.fragmentSize
    });
  }

  // Updates terrain chunks based on player movement
  tryUpdateScene() {
    let nextX = this.originX;
    let nextZ = this.originZ;
    if (Math.abs(config.state.posZ - this.originZ) > this.fragmentSize) {
      let stz = this.originZ;
      let edz = this.originZ;
      if (config.state.posZ < this.originZ) {
        stz -= this.fragmentSize * (this.fragmentSize / 2 + 1);
        edz -= (this.fragmentSize * this.fragmentSize) / 2;
        nextZ -= this.fragmentSize;
      } else {
        stz += (this.fragmentSize * this.fragmentSize) / 2;
        edz += this.fragmentSize * (this.fragmentSize / 2 + 1);
        nextZ += this.fragmentSize;
      }
      this.originZ = nextZ;
      this.generator.generateLine({
        stx: this.originX - (this.fragmentSize * this.fragmentSize) / 2,
        edx: this.originX + (this.fragmentSize * this.fragmentSize) / 2,
        stz,
        edz,
        thread: this.thread,
        fragmentSize: this.fragmentSize
      });
    }
    if (Math.abs(config.state.posX - this.originX) > this.fragmentSize) {
      let stx = this.originX;
      let edx = this.originX;
      if (config.state.posX < this.originX) {
        stx -= this.fragmentSize * (this.fragmentSize / 2 + 1);
        edx -= (this.fragmentSize * this.fragmentSize) / 2;
        nextX -= this.fragmentSize;
      } else {
        stx += (this.fragmentSize * this.fragmentSize) / 2;
        edx += this.fragmentSize * (this.fragmentSize / 2 + 1);
        nextX += this.fragmentSize;
      }
      this.originX = nextX;
      this.generator.generateLine({
        stz: this.originZ - (this.fragmentSize * this.fragmentSize) / 2,
        edz: this.originZ + (this.fragmentSize * this.fragmentSize) / 2,
        stx,
        edx,
        thread: this.thread,
        fragmentSize: this.fragmentSize
      });
    }
  }

  // Handles terrain updates from worker threads
  onUpdateLine(ev: MessageEvent<{ fragmentSize: number; frags: iBlockFragment[] }>) {
    const matrix = new THREE.Matrix4();
    const { fragmentSize, frags } = ev.data;
    // Skip updates from outdated scene configurations
    if (this.fragmentSize !== fragmentSize) return;
    frags.forEach((d: iBlockFragment) => {
      // Skip fragments outside the visible area
      if (
        d.posX < this.originX - (fragmentSize * fragmentSize) / 2 ||
        d.posX >= this.originX + (fragmentSize * fragmentSize) / 2 ||
        d.posZ < this.originZ - (fragmentSize * fragmentSize) / 2 ||
        d.posZ >= this.originZ + (fragmentSize * fragmentSize) / 2
      )
        return;

      // Calculate array indices for the fragment
      let blkX = d.posX + (fragmentSize * fragmentSize) / 2;
      while (blkX < 0) blkX += fragmentSize * fragmentSize;
      blkX = (blkX / fragmentSize) % fragmentSize;
      let blkZ = d.posZ + (fragmentSize * fragmentSize) / 2;
      while (blkZ < 0) blkZ += fragmentSize * fragmentSize;
      blkZ = (blkZ / fragmentSize) % fragmentSize;

      const oldFrag = this.blockFragments[blkZ][blkX];

      // Skip outdated fragment updates
      if (d.timestamp < oldFrag.timestamp) {
        return;
      }

      // Clean up old fragment resources
      if (oldFrag.group) {
        oldFrag.types.forEach((dd) => {
          if (dd.instancedMesh) dd.instancedMesh.dispose();
        });
        if (oldFrag.cloudMesh) oldFrag.cloudMesh.dispose();
        oldFrag.templateMesh.forEach((dd) => {
          if (oldFrag.group) {
            oldFrag.group.remove(dd);
            dd.remove();
          }
        });
        if (oldFrag.group) this.core.scene.remove(oldFrag.group);
      }

      this.blockFragments[blkZ][blkX] = d;

      // Create new mesh instances and add them to the scene
      d.group = new THREE.Group();
      d.types.forEach((dd) => {
        const block = blockLoader[dd.blocks.type as keyof typeof blockLoader];
        if (!block || !("material" in block)) {
          return;
        }
        dd.instancedMesh = new THREE.InstancedMesh(blockGeom, block.material, dd.blocks.count);
        dd.instancedMesh.name = `${blkZ}_${blkX}_${dd.blocks.type}`;

        for (let i = 0; i < dd.blocks.count; i += 1) {
          matrix.setPosition(dd.blocks.position[3 * i], dd.blocks.position[3 * i + 1], dd.blocks.position[3 * i + 2]);
          dd.instancedMesh.setMatrixAt(i, matrix);
        }

        dd.instancedMesh.instanceMatrix.needsUpdate = true;
        if (d.group) d.group.add(dd.instancedMesh);
      });

      // Add cloud meshes if present
      if (d.cloudPos && d.cloudPos.length > 0) {
        d.cloudMesh = new THREE.InstancedMesh(cloudGeom, cloudMaterial, d.cloudPos.length / 3);
        for (let i = 0; i < d.cloudPos.length / 3; i += 1) {
          matrix.setPosition(d.cloudPos[i * 3], d.cloudPos[i * 3 + 1], d.cloudPos[i * 3 + 2]);
          d.cloudMesh.setMatrixAt(i, matrix);
        }
        d.cloudMesh.instanceMatrix.needsUpdate = true;
        if (d.group) d.group.add(d.cloudMesh);
      }

      if (d.group) this.core.scene.add(d.group);
    });
  }

  // Removes all objects from the scene
  clear() {
    while (this.core.scene.children.length) {
      this.core.scene.remove(this.core.scene.children[0]);
    }
  }

  // Calculates the height of the terrain at a given position
  getFloorHeight(x: number, z: number): number {
    const noiseGen = new ImprovedNoise();
    const { maxHeight } = symConfig.stage;
    const { seed } = config;
    const { seedGap } = symConfig.noiseGap;
    if (seed === null) return 0;
    return Math.floor(noiseGen.noise(x / seedGap, z / seedGap, seed) * maxHeight);
  }

  // Checks if a block exists at the given coordinates
  hasBlock(x: number, z: number, y: number): boolean {
    const idx = this.getFragIdx(x, z);
    return this.blockFragments[idx.z][idx.x].idMap.get(`${x}_${y}_${z}`) !== undefined;
  }

  // Calculates the fragment indices for given world coordinates
  getFragIdx(x: number, z: number): { x: number; z: number } {
    let blkX = x + (this.fragmentSize * this.fragmentSize) / 2;
    while (blkX < 0) blkX += this.fragmentSize * this.fragmentSize;
    blkX = Math.floor(blkX / this.fragmentSize) % this.fragmentSize;
    let blkZ = z + (this.fragmentSize * this.fragmentSize) / 2;
    while (blkZ < 0) blkZ += this.fragmentSize * this.fragmentSize;
    blkZ = Math.floor(blkZ / this.fragmentSize) % this.fragmentSize;
    return { x: blkX, z: blkZ };
  }
}
