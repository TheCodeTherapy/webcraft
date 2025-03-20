import { skinsMap } from "./Loader";
import { symConfig } from "./_config";
import { PlayerObject } from "./PlayerObject";
import { Vector3, Euler } from "three";

export class Player {
  player: PlayerObject;
  target: Vector3;
  position: Vector3;
  rotation: Euler;
  lastCall: number;
  animateStamp: number;

  constructor({ idx, pos, reward }: { idx: number; pos: Vector3; reward: Euler }) {
    this.player = new PlayerObject(skinsMap[idx]);
    this.position = pos.clone();
    this.target = this.position.clone();
    this.rotation = reward.clone();
    this.animateStamp = 0;
    this.lastCall = performance.now();
    this.player.name = `player_${idx}`;
    this.player.scale.copy(new Vector3(1 / 16, 1 / 16, 1 / 16));
    this.update();
  }

  update() {
    let delta = this.lastCall;
    this.lastCall = performance.now();
    delta = this.lastCall - delta;
    this.updateReward();

    if (this.target.clone().sub(this.position).length() <= symConfig.eps) {
      this.resetAnimate();
    } else {
      this.updatePosition(delta);
      this.reqAnimate(delta);
    }
    // this.mesh.matrixWorldNeedsUpdate = true;
  }

  updatePosition(delta: number) {
    const move = this.target.clone().sub(this.position).normalize().multiplyScalar(this.speedWalking);
    const realMove = this.target.clone().sub(this.position).normalize().multiplyScalar(this.speedWalking);
    realMove.y *= this.speedJump / this.speedWalking;
    realMove.multiplyScalar(delta / 20);
    this.position.add(realMove.length() > move.length() ? move : realMove);
    this.player.position.copy(this.position);
  }

  updateReward() {
    this.player.rotation.copy(this.rotation);
  }

  reqAnimate(delta: number) {
    this.animateStamp += delta;
    if (this.animateStamp >= 2 * Math.PI * 75) this.animateStamp -= 2 * Math.PI * 75;
    this.setAnimate();
  }

  resetAnimate() {
    this.animateStamp = 0;
    this.setAnimate();
  }

  setAnimate() {
    this.player.leftArm.rotation.x = Math.sin(this.animateStamp / 75);
    this.player.rightArm.rotation.x = Math.sin(Math.PI + this.animateStamp / 75);
    this.player.leftLeg.rotation.x = Math.sin(this.animateStamp / 75);
    this.player.rightLeg.rotation.x = Math.sin(Math.PI + this.animateStamp / 75);
    this;
  }

  setPosition(v: Vector3) {
    this.target = new Vector3(v.x, v.y - 0.25, v.z);
  }

  setRotation(v: Vector3) {
    this.rotation = new Euler(0, v.y + Math.PI, 0, "YXZ");
  }

  get speedWalking() {
    return symConfig.actionsScale.walking * symConfig.actionsScale.moveScale;
    this;
  }

  get speedJump() {
    return symConfig.actionsScale.jump * symConfig.actionsScale.moveScale;
    this;
  }
}
