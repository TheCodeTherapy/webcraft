import { blockLoader, blockTypes } from "../../core/Loader";
import BagPcPlugin from "./pc";
import BagMobilePlugin from "./mobile/index";
import BagBoxPlugin from "./bagbox";
import "./css/style.less";
import { config } from "../../core/_config";
import BagXboxPlugin from "./xbox";
import BagPsPlugin from "./ps";

class Bag {
  type: "pc" | "mobile" | "vr" | "xbox" | "ps";

  items: (number | null)[];

  plugin: BagMobilePlugin | BagPcPlugin | BagXboxPlugin | BagPsPlugin;

  bagElem: HTMLElement;

  bagBox: BagBoxPlugin;

  itemsElem: HTMLElement[];

  available: boolean;

  gamepad: boolean;

  constructor(el: HTMLElement) {
    [...el.children].forEach((d: HTMLElement) => d.getAttribute("id") === "bag" && d.remove());
    this.bagElem = document.createElement("div");
    this.bagElem.setAttribute("id", "bag");
    el.appendChild(this.bagElem);
    this.plugin = null;
    this.bagBox = new BagBoxPlugin(this.bagElem, this);
    this.gamepad = false;
    this.place();
  }

  place() {
    this.type = config.bag.type as "pc" | "mobile" | "vr" | "xbox" | "ps";
    this.items = config.bag.bagItem;
    this.items.push(...Array(10).fill(null));
    this.available = false;
    this.items.length = 10;
    if (this.plugin) this.plugin.destroy();
    if (this.type === "pc") {
      this.plugin = new BagPcPlugin(this.bagElem, this);
      this.gamepad = false;
    } else if (this.type === "mobile") {
      this.plugin = new BagMobilePlugin(this.bagElem, this);
      this.gamepad = false;
    } else if (this.type === "xbox") {
      this.plugin = new BagXboxPlugin(this.bagElem, this);
      this.gamepad = true;
    } else if (this.type === "ps") {
      this.plugin = new BagPsPlugin(this.bagElem, this);
      this.gamepad = true;
    } else {
      // VR
    }

    const itemElem = document.createElement("div");
    itemElem.classList.add("bag-item");
    const itemImage = document.createElement("img");
    itemImage.classList.add("bag-item-image");
    itemElem.appendChild(itemImage);
    this.items.forEach((_, i) => {
      const elem = itemElem.cloneNode(true);
      (elem as HTMLElement).setAttribute("idx", `${i}`);
      (elem.childNodes[0] as HTMLElement).setAttribute("idx", `${i}`);
      this.plugin.bagInnerElem.appendChild(elem);
    });
    this.itemsElem = [...this.plugin.bagInnerElem.children] as HTMLElement[];
    this.plugin.place();
    this.update();
    this.highlight();
  }

  update() {
    this.items.forEach((d, i) => {
      if (d === null) (this.itemsElem[i].children[0] as HTMLElement).removeAttribute("src");
      else
        (this.itemsElem[i].children[0] as HTMLElement).setAttribute(
          "src",
          blockLoader[blockTypes[this.items[i]]].block3d
        );
    });
    config.bag.bagItem = this.items;
  }

  remove() {
    [...this.bagElem.children].forEach((d) => !d.className.includes("bag-box") && d.remove());
    this.pause();
  }

  toggleBag() {
    this.bagBox.toggleUseable();
    document.exitPointerLock && document.exitPointerLock();
  }

  onToggleBag() {
    this.update();
  }

  listen() {
    this.available = true;
    this.plugin.listen();
  }

  pause() {
    this.available = false;
    this.plugin.pause();
  }

  highlight() {
    this.itemsElem.forEach((d) => d.classList.remove("active"));
    this.itemsElem[config.bag.activeIndex].classList.add("active");
  }

  sendGamepadAction(e) {
    (this.plugin as BagXboxPlugin | BagPsPlugin).checkAction(e);
  }
}

export default Bag;
