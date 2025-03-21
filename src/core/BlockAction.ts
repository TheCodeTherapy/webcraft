import * as THREE from "three";
import { blockGeom, blockLoader } from "./Loader";
import { BlockLog } from "./Types";
import { Core } from "./Core";

export class BlockAction {
  core: Core;
  matrix: THREE.Matrix4;

  constructor(core: Core) {
    this.core = core;
    this.matrix = new THREE.Matrix4();
  }

  removeBlock(blk: BlockLog) {
    const fragIdx = this.getFragIdx(blk.posX, blk.posZ);
    if (this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].idMap.has(`${blk.posX}_${blk.posY}_${blk.posZ}`)) {
      const oldBlock = this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].idMap.get(
        `${blk.posX}_${blk.posY}_${blk.posZ}`
      );

      if (!oldBlock) {
        return;
      }

      if (oldBlock.temp) {
        const group = this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].group;
        if (!group) {
          return;
        }
        group.remove(this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].templateMesh[oldBlock.idx]);
      } else {
        this.matrix.setPosition(0, -1000000, 0);
        if (oldBlock.typeIdx === undefined) {
          return;
        }
        const type = this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].types[oldBlock.typeIdx];
        if (!type) {
          return;
        }
        const instancedMesh = type.instancedMesh;
        if (!instancedMesh) {
          return;
        }
        instancedMesh.setMatrixAt(oldBlock.idx, this.matrix.clone());
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
      this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].idMap.delete(`${blk.posX}_${blk.posY}_${blk.posZ}`);
    }
  }

  placeBlock(blk: BlockLog) {
    const fragIdx = this.getFragIdx(blk.posX, blk.posZ);
    if (!blk.type) return;
    const blockType = blockLoader[blk.type];
    if (!blockType?.material) return;
    const mesh = new THREE.Mesh(blockGeom, blockType.material);
    mesh.position.set(blk.posX, blk.posY, blk.posZ);
    if (this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].idMap.has(`${blk.posX}_${blk.posY}_${blk.posZ}`)) {
      this.removeBlock(blk);
    }
    const group = this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].group;
    if (!group) return;
    group.add(mesh);
    this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].idMap.set(`${blk.posX}_${blk.posY}_${blk.posZ}`, {
      temp: true,
      idx: this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].templateMesh.length
    });
    this.core.terrain.blockFragments[fragIdx.z][fragIdx.x].templateMesh.push(mesh);
  }

  getFragIdx(x: number, z: number): { x: number; z: number } {
    const { fragmentSize } = this.core.terrain;
    let blkX = x + (fragmentSize * fragmentSize) / 2;
    while (blkX < 0) blkX += fragmentSize * fragmentSize;
    blkX = Math.floor(blkX / fragmentSize) % fragmentSize;
    let blkZ = z + (fragmentSize * fragmentSize) / 2;
    while (blkZ < 0) blkZ += fragmentSize * fragmentSize;
    blkZ = Math.floor(blkZ / fragmentSize) % fragmentSize;
    return { x: blkX, z: blkZ };
  }
}
