import { config } from "../../../core/_config";
import "./css/style.less";

class BagMobilePlugin {
  bagOuterElem: HTMLElement;

  bagInnerElem: HTMLElement;

  bagItemsElem: HTMLElement[];

  host: { highlight: () => void; toggleBag: () => void };

  clickItemEventListener: (e: TouchEvent | MouseEvent) => void;

  preventDefault: (e: TouchEvent | MouseEvent) => void;

  constructor(bagOuterElem: HTMLElement, host) {
    this.host = host;
    this.bagInnerElem = document.createElement("div");
    this.bagInnerElem.classList.add("mobile");
    this.bagOuterElem = bagOuterElem;
    [...this.bagOuterElem.children].forEach((d) => !d.className.includes("bag-box") && d.remove());

    this.bagOuterElem.appendChild(this.bagInnerElem);

    this.clickItemEventListener = BagMobilePlugin.getClickItemEventListener(this.host);
    this.preventDefault = BagMobilePlugin.getPreventDefaultListener();
  }

  place() {
    this.bagItemsElem = [...this.bagInnerElem.children] as HTMLElement[];
    this.bagItemsElem.forEach((d, i) => {
      d.style.transform = `rotateZ(${i * config.bag.mobile.rotateDegree}deg) translateX(-${
        config.bag.mobile.radius
      }px) `;
    });
  }

  listen() {
    if (config.controller.dev) this.bagInnerElem.addEventListener("click", this.clickItemEventListener);
    this.bagInnerElem.addEventListener("touchstart", this.clickItemEventListener);
    this.bagInnerElem.addEventListener("touchmove", this.preventDefault);
    this.bagInnerElem.addEventListener("touchend", this.preventDefault);
    this.bagInnerElem.addEventListener("touchcancel", this.preventDefault);
  }

  pause() {
    this.bagInnerElem.removeEventListener("touchstart", this.clickItemEventListener);
    this.bagInnerElem.removeEventListener("touchmove", this.preventDefault);
    this.bagInnerElem.removeEventListener("touchend", this.preventDefault);
    this.bagInnerElem.removeEventListener("touchcancel", this.preventDefault);
  }

  destroy() {
    this.pause();
    this.bagInnerElem.remove();
  }

  static getClickItemEventListener(host) {
    return (e) => {
      e.stopPropagation();
      e.preventDefault();
      const idx = Number.parseInt((e.target as HTMLElement)?.getAttribute("idx"), 10);
      if (idx >= 0 && idx <= 9) {
        if (idx === config.bag.activeIndex) host.toggleBag();
        else {
          config.bag.activeIndex = idx;
          host.highlight();
        }
      }
      return false;
    };
  }

  static getPreventDefaultListener() {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
  }
}

export default BagMobilePlugin;
