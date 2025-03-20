import { Mesh } from "three";
import { highLightBlockMesh } from "../../core/Loader";
import { config } from "../config";
import { Core } from "../../core/Core";
import { relativeOperateCollisionCheck } from "../../core/Collisions";
import { BlockLog } from "../../utils/types/block";
import { GameController } from "./GameController";

export class GameControllerBlock {
  core: Core;
  curHighlight: Mesh | null;
  host: GameController;

  constructor(core: Core, host: GameController) {
    this.core = core;
    this.host = host;
    this.curHighlight = highLightBlockMesh;
  }

  update(blocks: BlockLog[], ignoreMultiPlay = false) {
    if (this.host.host.multiPlay.working && !ignoreMultiPlay) this.host.host.multiPlay.insertLog([...blocks]);
    blocks.forEach((d) => {
      if (d.type === null) this.core.blockAction.removeBlock(d);
      else this.core.blockAction.placeBlock(d);
    });
  }

  highlightCurrentBlock() {
    const collision = relativeOperateCollisionCheck({
      posX: this.core.camera.position.x,
      posY: this.core.camera.position.y,
      posZ: this.core.camera.position.z,
      font: config.controller.opRange,
      left: 0,
      up: 0,
      core: this.core,
      log: this.host.host.log,
      access: false
    });

    if (collision) {
      let { posX, posY, posZ } = collision.pos;
      [posX, posY, posZ] = [posX, posY, posZ].map(Math.round);
      if (this.curHighlight) {
        this.curHighlight.position.set(posX, posY, posZ);
        this.core.scene.add(this.curHighlight);
      }
    } else {
      if (this.curHighlight) {
        this.core.scene.remove(this.curHighlight);
      }
    }
  }
}
