import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import UI from "../ui";
import { Core } from "../core/Core";
import UiController from "./ui-controller";
import { GameController } from "./game-controller/GameController";
import { config, defaultConfig, language } from "./config";
import { deepCopy } from "../utils/deep-copy";
import biomesConfig from "../core/Biomes";
import Log from "./log";
import MultiPlay from "./MultiPlay";

export class Controller {
  ui: UI;
  core: Core;
  gameController: GameController;
  uiController: UiController;
  running: boolean;
  gameStage: HTMLElement;
  hudStage: HTMLElement;
  VRButtonElem: HTMLElement;
  vr: boolean;
  vrSupport: boolean;
  log: Log;
  multiPlay: MultiPlay;
  clock: THREE.Clock;

  constructor(el: HTMLElement) {
    this.clock = new THREE.Clock();
    Array.from(el.children).forEach((d) => d.remove());
    this.gameStage = document.createElement("div");
    this.gameStage.setAttribute("id", "game-stage");
    this.gameStage.classList.add("hidden");
    el.appendChild(this.gameStage);
    this.hudStage = document.createElement("div");
    this.hudStage.setAttribute("id", "HUD-stage");
    this.hudStage.classList.add("hidden");
    el.appendChild(this.hudStage);

    this.multiPlay = new MultiPlay(this);

    deepCopy(defaultConfig, config);

    this.ui = new UI();
    this.core = new Core(this);
    this.running = false;

    this.uiController = new UiController(this.ui);
    this.gameController = new GameController(this.core, this);
    this.log = new Log([]);

    this.vr = false;
    this.vrSupport = false;
    this.VRButtonElem = VRButton.createButton(this.core.renderer);
    this.VRButtonElem.setAttribute("id", "VRButton");
    document.body.appendChild(this.VRButtonElem);
    navigator?.xr &&
      navigator.xr.isSessionSupported("immersive-vr").then(() => {
        this.core.renderer.xr.enabled = true;
        this.vrSupport = true;
      });

    this.ui.loadController(this);
  }

  startGame(justInit: boolean) {
    if (config.controller.operation === "mobile" && !config.controller.dev && window.innerHeight > window.innerWidth) {
      this.uiController.ui.menu.setNotify(language.tryRotate);
      return;
    }
    this.gameStage.classList.remove("hidden");
    this.hudStage.classList.remove("hidden");
    if (config.seed === null) config.seed = Math.random();
    if (config.cloudSeed === null) config.cloudSeed = Math.random();
    if (config.treeSeed === null) config.treeSeed = Math.random();
    if (config.weather === null) config.weather = Math.floor(Math.random() * biomesConfig.length);

    this.log.load(config.log);

    if (justInit) {
      return;
    }

    this.uiController.ui.bag.place();
    this.runGame();

    this.uiController.ui.menu.setNotify(
      `${language.weather}: ${language.weatherName[biomesConfig[config.weather][3]]}`,
      1500,
      this.uiController.ui.actionControl.elem
    );
  }

  runGame() {
    this.gameController.hasChange = false;
    if (config.controller.operation === "mobile" && !config.controller.dev && window.innerHeight > window.innerWidth) {
      this.uiController.ui.menu.setNotify(language.tryRotate);
      return;
    }
    this.core.terrain.updateState();
    this.running = true;
    this.core.updateCore();
    this.uiController.ui.listenAll();
    this.uiController.ui.menu.hideMenu();
    this.gameController.moveController.jumping = true;
    this.tryRender();
    this.multiPlay.playersController.addScene();
  }

  pauseGame() {
    this.running = false;
    this.uiController.ui.pauseAll();
  }

  endGame() {
    deepCopy(defaultConfig, config);
    this.core.terrain.clear();
    if (this.multiPlay.working) {
      this.multiPlay?.emitLeaveRoom();
      this.multiPlay.socket?.close();
      this.multiPlay.socket = null;
    }
  }

  toggleCheatMode() {
    config.controller.cheat = !config.controller.cheat;
    this.gameController.moveController.jumping = true;
    this;
  }

  tryRender(_deltaTime = 0) {
    if (!this.running) {
      return;
    }

    const dt = this.clock.getDelta();
    requestAnimationFrame(() => this.core.tryRender(dt));

    if (this.vr) this.core.renderer.setAnimationLoop(this.tryRender.bind(this));
    else requestAnimationFrame(this.tryRender.bind(this));

    if (this.uiController.ui.actionControl.gamepad)
      this.uiController.ui.actionControl.sendGamepadAction(navigator?.getGamepads());
    if (this.uiController.ui.bag.gamepad) this.uiController.ui.bag.sendGamepadAction(navigator?.getGamepads());

    if (this.multiPlay.working && this.gameController.hasChange) {
      this.multiPlay.emitUpdateState();
      this.gameController.hasChange = false;
    }

    this.multiPlay.playersController.render();

    this.uiController.ui.fps.work();
    this.gameController.update(dt);

    // We now call it via requestAnimationFrame
    // this.core.tryRender();
  }
}
