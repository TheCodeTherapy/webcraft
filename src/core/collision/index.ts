import { generateFragSync } from "../terrain/generate/generateFragSync";
import { symConfig, config } from "../../controller/config";
import { getDir } from "../../utils/get-dir";
import { iBlockFragment } from "../../utils/types/block";
import Log from "../../controller/log";
import { Euler, Intersection, Raycaster } from "three";
import { Vector3 } from "three";

// Types for collision system
interface CollisionResult {
  obj: Intersection;
  pos: { posX: number; posY: number; posZ: number };
}

interface Core {
  camera: {
    rotation: { x: number; y: number };
  };
}

interface CollisionCheckParams {
  posX: number;
  posY: number;
  posZ: number;
  dirX: number;
  dirY: number;
  dirZ: number;
  boundingBox?: iBlockFragment;
  access: boolean;
  log: Log;
}

interface RelativeCollisionParams {
  posX: number;
  posY: number;
  posZ: number;
  font: number;
  left: number;
  up: number;
  core: Core;
  deltaTime: number;
  log: Log;
}

interface TargetPositionParams {
  posX: number;
  posY: number;
  posZ: number;
  font: number;
  left: number;
  up: number;
  core: Core;
  deltaTime: number;
}

// Specifies which blocks need to be checked for collision when
// moving in a certain direction, points defined as follows:
//
//   7_____________6
//   /| width=0.8 /|
//  /_|__________/ |height=2
// 3| |         2| |
//  | | *    *   | |
//  | |   /  |   | |
//  | |      |   | |
//  | |  1.75|   | |
//  |4|______|___|_|5
//  |/_______|___|/length=0.5
//  0            1

const needCheck = [
  [
    // Forward
    [
      // Left
      [8, 1, 2, 3, 4, 5, 6, 0], // Down
      [8, 1, 2, 3, 5, 6, 0], // Not up
      [8, 1, 2, 3, 5, 6, 7, 0] // Up
    ],
    [
      // Not left
      [8, 1, 2, 3, 4, 5, 0], // Down
      [8, 1, 2, 3, 0], // Not up
      [8, 1, 2, 3, 6, 7, 0] // Up
    ],
    [
      // Right
      [8, 1, 2, 3, 4, 5, 7, 0], // Down
      [8, 1, 2, 3, 4, 7, 0], // Not up
      [8, 1, 2, 3, 4, 6, 7, 0] // Up
    ]
  ],

  [
    // Not forward
    [
      // Left
      [8, 1, 2, 4, 5, 6, 0], // Down
      [8, 1, 2, 5, 6], // Not up
      [8, 1, 2, 3, 5, 6, 7] // Up
    ],
    [
      // Not left
      [8, 1, 4, 5, 0], // Down
      [], // Not up
      [8, 2, 3, 6, 7] // Up
    ],
    [
      // Right
      [8, 1, 3, 4, 5, 7, 0], // Down
      [8, 0, 3, 4, 7], // Not up
      [8, 2, 3, 4, 6, 7, 0] // Up
    ]
  ],
  [
    // Backward
    [
      // Left
      [8, 1, 2, 4, 5, 6, 7, 0], // Down
      [8, 1, 2, 4, 5, 6, 7], // Not up
      [8, 1, 2, 3, 4, 5, 6, 7] // Up
    ],
    [
      // Not left
      [8, 1, 4, 5, 6, 7, 0], // Down
      [8, 4, 5, 6, 7], // Not up
      [8, 2, 3, 4, 5, 6, 7] // Up
    ],
    [
      // Right
      [8, 1, 3, 4, 5, 6, 7, 0], // Down
      [8, 3, 4, 5, 6, 7, 0], // Not up
      [8, 2, 3, 4, 5, 6, 7, 0] // Up
    ]
  ]
];

// Specifies the distance of these detection points from the camera
const dirs = [
  new Vector3(+symConfig.body.eyeRight, -symConfig.body.eyeButton, -symConfig.body.eyeFront),
  new Vector3(-symConfig.body.eyeLeft, -symConfig.body.eyeButton, -symConfig.body.eyeFront),
  new Vector3(-symConfig.body.eyeLeft, +symConfig.body.eyeUp, -symConfig.body.eyeFront),
  new Vector3(+symConfig.body.eyeRight, +symConfig.body.eyeUp, -symConfig.body.eyeFront),
  new Vector3(+symConfig.body.eyeRight, -symConfig.body.eyeButton, +symConfig.body.eyeBack),
  new Vector3(-symConfig.body.eyeLeft, -symConfig.body.eyeButton, +symConfig.body.eyeBack),
  new Vector3(-symConfig.body.eyeLeft, +symConfig.body.eyeUp, +symConfig.body.eyeBack),
  new Vector3(+symConfig.body.eyeRight, +symConfig.body.eyeUp, +symConfig.body.eyeBack),
  new Vector3(0, 0, 0)
];

/**
 * Given origin point and direction, determine if there will be a collision
 * @param posX/Y/Z: Origin point x/y/z
 * @param dirX/Y/Z: Absolute direction x/y/z
 * @param boundingBox: Nearby terrain (bounding box)
 * @returns null: No collision
 * @returns {obj: Collision object, pos: Collision point}
 */
export function collisionCheck({
  posX,
  posY,
  posZ,
  dirX,
  dirY,
  dirZ,
  boundingBox,
  access,
  log
}: CollisionCheckParams): CollisionResult | null {
  const originPosition = new Vector3(posX, posY, posZ);
  const direction = new Vector3(dirX, dirY, dirZ);
  const len = direction.length();
  const ray = new Raycaster(originPosition, direction.clone().normalize(), 0, len + 0.1);

  // If no bounding box exists, generate one
  if (!boundingBox)
    boundingBox = generateFragSync(
      posX - 3 - Math.ceil(len),
      posX + 3 + Math.ceil(len),
      posZ - 3 - Math.ceil(len),
      posZ + 3 + Math.ceil(len),
      posY - 3 - Math.ceil(len),
      posY + 3 + Math.ceil(len),
      access,
      log
    );

  if (!boundingBox?.group?.children) return null;

  const collisionResults = ray.intersectObjects(boundingBox.group.children, access);
  if (collisionResults.length > 0) {
    direction.multiplyScalar(collisionResults[0].distance);
    return {
      obj: collisionResults[0],
      pos: {
        posX: collisionResults[0].point.x,
        posY: collisionResults[0].point.y,
        posZ: collisionResults[0].point.z
      }
    };
  }
  return null;
}

// Check if user click operation results in a collision
export function relativeOperateCollisionCheck({
  posX,
  posY,
  posZ,
  font,
  left,
  up,
  core,
  log,
  access
}: Omit<CollisionCheckParams, "dirX" | "dirY" | "dirZ"> & {
  font: number;
  left: number;
  up: number;
  core: Core;
}): CollisionResult | null {
  const eulerRotate = new Euler(core.camera.rotation.x, core.camera.rotation.y, 0, "YXZ");
  const absolute = new Vector3(-left, up, -font).applyEuler(eulerRotate);
  const absoluteU = getDir(absolute);
  const len = absolute.length();

  const boundingBox = generateFragSync(
    posX - (absoluteU.x < 0 ? Math.ceil(len) : 3),
    posX + (absoluteU.x > 0 ? Math.ceil(len) : 3),
    posZ - (absoluteU.z < 0 ? Math.ceil(len) : 3),
    posZ + (absoluteU.z > 0 ? Math.ceil(len) : 3),
    posY - (absoluteU.y < 0 ? Math.ceil(len) : 3),
    posY + (absoluteU.y > 0 ? Math.ceil(len) : 3),
    access,
    log
  );

  const collision = collisionCheck({
    posX,
    posY,
    posZ,
    dirX: absolute.x,
    dirY: absolute.y,
    dirZ: absolute.z,
    boundingBox,
    access,
    log
  });

  if (collision?.obj?.face) {
    collision.pos.posX = collision.obj.point.x - collision.obj.face.normal.x * 0.5;
    collision.pos.posY = collision.obj.point.y - collision.obj.face.normal.y * 0.5;
    collision.pos.posZ = collision.obj.point.z - collision.obj.face.normal.z * 0.5;
  }

  if (boundingBox?.group?.children) {
    boundingBox.group.children.forEach((d) => {
      if (d && "dispose" in d) {
        (d as any).dispose();
      }
    });
  }

  return collision;
}

/**
 * Given camera position and relative movement, check collision for each detection point
 * @param posX/Y/Z: Camera position
 * @param font/left/up: Relative direction x/y/z
 * @param Core: Scene
 * @returns null: No collision
 * @returns {obj: Collision object, pos: Camera position at collision}
 */
export function relativeCollisionCheckAll({
  posX,
  posY,
  posZ,
  font,
  left,
  up,
  core,
  deltaTime,
  log
}: RelativeCollisionParams): [CollisionResult | null, CollisionResult | null, CollisionResult | null] {
  // Convert relative movement direction to ternary values? (x/y/z = -1/0/1)
  const dirU = getDir(new Vector3(-left, up, -font));
  // Camera position and required Euler angles
  const origin = new Vector3(posX, posY, posZ);
  const eulerRotate = new Euler(0, core.camera.rotation.y, 0, "YXZ");
  // Calculate horizontal and vertical velocity
  const scaleXOZ =
    symConfig.actionsScale.walking * symConfig.actionsScale.moveScale * config.controller.opSens * deltaTime;
  const scaleOY = symConfig.actionsScale.jump * symConfig.actionsScale.moveScale * deltaTime;
  // Calculate absolute movement direction and velocity
  const absolute = new Vector3(-left, up, -font).applyEuler(eulerRotate);
  absolute.x *= scaleXOZ;
  absolute.z *= scaleXOZ;
  absolute.y *= scaleOY;
  // Calculate maximum movement distance, generate bounding box
  const maxMove = Math.ceil(absolute.length());
  const boundingBox = generateFragSync(
    posX - 3 - maxMove,
    posX + 3 + maxMove,
    posZ - 3 - maxMove,
    posZ + 3 + maxMove,
    posY - 5 - maxMove,
    posY + 5 + maxMove,
    true,
    log
  );
  // Record the first object hit when moving in different directions
  let fstColX: CollisionResult | null = null;
  let fstColY: CollisionResult | null = null;
  let fstColZ: CollisionResult | null = null;
  // Check each detection point
  needCheck[dirU.z + 1][dirU.x + 1][dirU.y + 1].forEach((d) => {
    // Starting point = Camera position + Vector from camera to detection point
    const innerDir = dirs[d].clone().applyEuler(eulerRotate);
    const from = origin.clone().add(innerDir);

    const collisionX = collisionCheck({
      posX: from.x,
      posY: from.y,
      posZ: from.z,
      dirX: absolute.x,
      dirY: 0,
      dirZ: 0,
      boundingBox,
      access: true,
      log
    });
    if (collisionX && (fstColX === null || collisionX.obj.distance < fstColX.obj.distance)) {
      fstColX = collisionX;
      fstColX.pos = {
        posX: collisionX.pos.posX - innerDir.x,
        posY: collisionX.pos.posY,
        posZ: collisionX.pos.posZ
      };
    }

    const collisionY = collisionCheck({
      posX: from.x,
      posY: from.y,
      posZ: from.z,
      dirX: 0,
      dirY: absolute.y,
      dirZ: 0,
      boundingBox,
      access: true,
      log
    });
    if (collisionY && (fstColY === null || collisionY.obj.distance < fstColY.obj.distance)) {
      fstColY = collisionY;
      fstColY.pos = {
        posX: collisionY.pos.posX,
        posY: collisionY.pos.posY - innerDir.y,
        posZ: collisionY.pos.posZ
      };
    }

    const collisionZ = collisionCheck({
      posX: from.x,
      posY: from.y,
      posZ: from.z,
      dirX: 0,
      dirY: 0,
      dirZ: absolute.z,
      boundingBox,
      access: true,
      log
    });
    if (collisionZ && (fstColZ === null || collisionZ.obj.distance < fstColZ.obj.distance)) {
      fstColZ = collisionZ;
      fstColZ.pos = {
        posX: collisionZ.pos.posX,
        posY: collisionZ.pos.posY,
        posZ: collisionZ.pos.posZ - innerDir.z
      };
    }
  });

  if (boundingBox?.group?.children) {
    boundingBox.group.children.forEach((d) => {
      if (d && "dispose" in d) {
        (d as any).dispose();
      }
    });
  }

  return [fstColX, fstColY, fstColZ];
}

// Get the ideal movement position
export function getTargetPosition({ posX, posY, posZ, font, left, up, core, deltaTime }: TargetPositionParams): {
  posX: number;
  posY: number;
  posZ: number;
} {
  // Horizontal and vertical velocity
  const scaleXOZ =
    (config.controller.cheat ? symConfig.actionsScale.cheatFactor : 1) *
    symConfig.actionsScale.walking *
    symConfig.actionsScale.moveScale *
    config.controller.opSens *
    deltaTime;
  const scaleOY =
    (config.controller.cheat ? symConfig.actionsScale.cheatFactor : 1) *
    symConfig.actionsScale.jump *
    symConfig.actionsScale.moveScale *
    deltaTime;
  // Absolute movement direction
  const absolute = new Vector3(-left, up, -font).applyEuler(new Euler(0, core.camera.rotation.y, 0, "YXZ"));
  absolute.x *= scaleXOZ;
  absolute.z *= scaleXOZ;
  absolute.y *= scaleOY;
  return {
    posX: posX + absolute.x,
    posY: posY + absolute.y,
    posZ: posZ + absolute.z
  };
}
