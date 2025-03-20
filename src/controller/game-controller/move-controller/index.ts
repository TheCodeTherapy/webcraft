import Core from "../../../core";
import { config, symConfig } from "../../config/index";
import { getTargetPosition, relativeCollisionCheckAll } from "../../../core/collision";
import { GameController } from "..";

class MoveController {
  core: Core;
  host: GameController;
  jumping: boolean;
  jumpingSpeed: number;

  constructor(core: Core, host: GameController) {
    this.core = core;
    this.jumping = true;
    this.jumpingSpeed = 0;
    this.host = host;
  }

  getVerticalMove() {
    this.jumpingSpeed -= symConfig.actionsScale.g;
    return this.jumpingSpeed + symConfig.actionsScale.g / 2;
  }

  positionMove({ font, left, up }: { font: number; left: number; up: number }, deltaTime: number) {
    if (config.controller.cheat) {
      const targetPos = getTargetPosition({ ...config.state, font, left, up, core: this.core, deltaTime });
      if (
        targetPos.posX !== config.state.posX ||
        targetPos.posY !== config.state.posY ||
        targetPos.posZ !== config.state.posZ
      )
        this.host.hasChange = true;
      this.core.camera.position.set(targetPos.posX, targetPos.posY, targetPos.posZ);
      config.state = { ...targetPos };
      return;
    }
    if (!this.jumping && up > 0) {
      this.jumping = true;
      this.jumpingSpeed = up;
    }
    up = this.getVerticalMove();
    const targetPos = getTargetPosition({ ...config.state, font, left, up, core: this.core, deltaTime });
    const collisions = relativeCollisionCheckAll({
      ...config.state,
      font,
      left,
      up,
      core: this.core,
      deltaTime,
      log: this.host.host.log
    });

    if (collisions[0] === null) {
      if (config.state.posX !== targetPos.posX) this.host.hasChange = true;
      config.state.posX = targetPos.posX;
    }

    if (collisions[2] === null) {
      if (config.state.posZ !== targetPos.posZ) this.host.hasChange = true;
      config.state.posZ = targetPos.posZ;
    }

    if (collisions[1] === null) {
      if (config.state.posY !== targetPos.posY) this.host.hasChange = true;
      config.state.posY = targetPos.posY;
    } else {
      if (this.jumpingSpeed < 0 && this.jumping === false && (left !== 0 || font !== 0))
        this.core.audio.play("step", collisions[1].obj.object.name.split("_")[2], false);
      if (this.jumpingSpeed < 0) this.jumping = false;
      this.jumpingSpeed = 0;
    }

    if (collisions[0] || collisions[2]) {
      this.host.host.ui.actionControl.tryVibration(700);
    }

    this.core.camera.position.set(config.state.posX, config.state.posY, config.state.posZ);
  }

  viewDirectionMove(
    { viewHorizontal, viewVertical }: { viewHorizontal: number; viewVertical: number },
    deltaTime: number
  ) {
    if (viewHorizontal === 0 && viewVertical === 0) return;
    this.host.hasChange = true;
    this.core.camera.rotation.y +=
      -viewHorizontal * symConfig.actionsScale.viewScale * config.controller.opSens * deltaTime;
    while (this.core.camera.rotation.y > Math.PI) this.core.camera.rotation.y -= Math.PI * 2;
    while (this.core.camera.rotation.y < -Math.PI) this.core.camera.rotation.y += Math.PI * 2;
    this.core.camera.rotation.x += viewVertical * symConfig.actionsScale.viewScale * deltaTime;
    this.core.camera.rotation.x = Math.max(Math.min(this.core.camera.rotation.x, Math.PI * 0.495), -Math.PI * 0.495);
    this.core.camera.updateMatrix();
  }
}

export default MoveController;
