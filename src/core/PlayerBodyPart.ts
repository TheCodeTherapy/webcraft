import { Group, Object3D } from "three";

export class PlayerBodyPart extends Group {
  constructor(readonly innerLayer: Object3D, readonly outerLayer: Object3D) {
    super();
    innerLayer.name = "inner";
    outerLayer.name = "outer";
  }
}
