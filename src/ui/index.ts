import "./common";
import Crosshair from "./crosshair";
import Fps from "./fps";
import Bag from "./bag";
import Menu from "./menu";
import LinkUI from "./link";
import ActonControl from "./action";
import { Controller } from "../controller";
import { config } from "../core/_config";

class UI {
  crosshair: Crosshair;

  fps: Fps;

  actionControl: ActonControl;

  bag: Bag;

  menu: Menu;

  linkUI: LinkUI;

  controller: Controller;

  loadController(controller: Controller) {
    this.controller = controller;
    this.crosshair = new Crosshair(document.getElementById("HUD-stage"), config.controller.crosshair === "dark");
    this.fps = new Fps(document.getElementById("HUD-stage"));
    this.actionControl = new ActonControl(document.getElementById("HUD-stage"), this.controller);
    this.bag = new Bag(document.getElementById("HUD-stage"));
    this.menu = new Menu(document.getElementById("app"), this.controller);
    this.linkUI = new LinkUI(document.getElementById("app"), this.controller);
    document.oncontextmenu = () => false;

    // TODO: Load index world
    // Auto-start
    this.menu.controller.startGame(false);
  }

  listenAll() {
    this.fps.listen();
    this.actionControl.listen();
    this.bag.listen();
  }

  pauseAll() {
    this.fps.pause();
    this.actionControl.pause();
    this.bag.pause();
  }
}

export default UI;
