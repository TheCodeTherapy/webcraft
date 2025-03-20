import { blockTypes } from "../../core/loader/index";
import Core from "../../core";
import BlockController from "./block-controller";
import MoveController from "./move-controller";
import { config } from "../config";
import { relativeOperateCollisionCheck } from "../../core/collision";
import { Controller } from "..";
import { actionBlockEvent, BlockLog } from "../../utils/types/block";
import weatherType from "../../core/weather";

class GameController {
  core: Core;
  blockController: BlockController;
  moveController: MoveController;
  host: Controller;

  nextTrickMoveTask: {
    font: number;
    left: number;
    up: number;
  };

  nextTrickViewTask: {
    viewHorizontal: number;
    viewVertical: number;
  };

  nextTrickBlockTask: BlockLog[];

  hasChange: boolean;

  constructor(core: Core, host: Controller) {
    this.core = core;
    this.host = host;
    this.blockController = new BlockController(this.core, this);
    this.moveController = new MoveController(this.core, this);
    this.nextTrickBlockTask = [];
    this.nextTrickMoveTask = {
      font: 0,
      left: 0,
      up: 0
    };
    this.nextTrickViewTask = {
      viewHorizontal: 0,
      viewVertical: 0
    };
  }

  handleMoveAction(args) {
    this.nextTrickMoveTask = {
      ...this.nextTrickMoveTask,
      ...args
    };
  }

  handleViewAction({ vertical, horizontal }) {
    this.nextTrickViewTask.viewHorizontal += horizontal;
    this.nextTrickViewTask.viewVertical += vertical;
  }

  handleBlockAction(key: actionBlockEvent) {
    this.hasChange = true;
    const collision = relativeOperateCollisionCheck({
      posX: this.core.camera.position.x,
      posY: this.core.camera.position.y,
      posZ: this.core.camera.position.z,
      font: config.controller.opRange,
      left: 0,
      up: 0,
      core: this.core,
      log: this.blockController.host.host.log,
      access: false
    });
    if (collision === null) return;

    let { posX, posY, posZ } = collision.pos;
    [posX, posY, posZ] = [posX, posY, posZ].map(Math.round);

    const target: BlockLog = {
      posX,
      posY,
      posZ,
      type: null,
      action: actionBlockEvent.REMOVE
    };
    if (key === actionBlockEvent.ADD) {
      target.posX += collision.obj.face.normal.x;
      target.posY += collision.obj.face.normal.y;
      target.posZ += collision.obj.face.normal.z;
      target.type = blockTypes[config.bag.bagItem[config.bag.activeIndex]];
      target.action = actionBlockEvent.ADD;
      this.core.audio.play("break", blockTypes[config.bag.bagItem[config.bag.activeIndex]]);
    } else {
      this.checkRemoveFloor(target);
      this.core.audio.play("break", collision.obj.object.name.split("_")[2]);
    }
    this.host.log.insert(target);
    this.nextTrickBlockTask.push(target);
  }

  // 当下一帧渲染时执行请求, 并重设状态
  update(deltaTime: number) {
    this.moveController.viewDirectionMove(this.nextTrickViewTask, deltaTime);
    this.moveController.positionMove(this.nextTrickMoveTask, deltaTime);
    this.nextTrickViewTask = { viewHorizontal: 0, viewVertical: 0 };
    this.blockController.update(this.nextTrickBlockTask);
    this.blockController.highlightCurrentBlock();
    this.nextTrickBlockTask.length = 0;
  }

  checkRemoveFloor(target) {
    this.testAndInsert({ ...target, posX: target.posX + 1 });
    this.testAndInsert({ ...target, posX: target.posX - 1 });
    this.testAndInsert({ ...target, posZ: target.posZ + 1 });
    this.testAndInsert({ ...target, posZ: target.posZ - 1 });
    this.testAndInsert({ ...target, posY: target.posY - 1 });
    this.testAndInsert({ ...target, posY: target.posY + 1 });
  }

  testAndInsert(target) {
    if (
      this.core.terrain.getFloorHeight(target.posX, target.posZ) <= target.posY ||
      this.host.log.query(target.posX, target.posZ, target.posY) ||
      this.core.terrain.hasBlock(target.posX, target.posZ, target.posY)
    )
      return;
    this.host.log.insert({ ...target, type: blockTypes[weatherType[config.weather][2]] });
    this.nextTrickBlockTask.push({ ...target, type: blockTypes[weatherType[config.weather][2]] });
  }
}

export { GameController, actionBlockEvent };
