import { Vector3 } from "three";

export function getDir(o: Vector3): Vector3 {
  return new Vector3(Math.sign(o.x), Math.sign(o.y), Math.sign(o.z));
}
