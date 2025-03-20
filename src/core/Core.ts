import { blockLoader, blockTypes } from "./Loader";
import { config, symConfig } from "../controller/config";
import { Audio } from "./Audio";
import { Terrain } from "./Terrain";
import { BlockAction } from "./BlockAction";
import { Controller } from "../controller";
import { PerspectiveCamera, Scene, WebGLRenderer, FogExp2, Color, Texture, MeshStandardMaterial } from "three";
import * as THREE from "three";

export class Core {
  camera: PerspectiveCamera;
  scene: Scene;
  renderer: WebGLRenderer;
  terrain: Terrain;
  audio: Audio;
  blockAction: BlockAction;
  controller: Controller;

  constructor(controller: Controller) {
    this.camera = new PerspectiveCamera();
    this.scene = new Scene();
    this.renderer = new WebGLRenderer();

    this.terrain = new Terrain(this);
    this.audio = new Audio(this);
    this.blockAction = new BlockAction(this);

    this.controller = controller;

    this.init();
  }

  init() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.camera.fov = config.camera.fov;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.near = 0.01;
    this.camera.far = Math.max(233, config.renderer.stageSize * Math.sqrt(3));
    this.camera.updateProjectionMatrix();
    this.camera.position.set(config.state.posX, config.state.posY, config.state.posZ);
    this.camera.rotation.order = "YXZ";

    this.scene = new Scene();
    const backgroundColor = symConfig.stage.skyBackground;
    this.scene.fog = new FogExp2(backgroundColor, config.renderer.fog);
    this.scene.background = new Color(backgroundColor);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById("game-stage")?.appendChild(this.renderer.domElement);
  }

  tryRender(_deltaTime = 0) {
    this.terrain.tryUpdateScene();
    this.renderer.render(this.scene, this.camera);
  }

  updateCore() {
    (this.scene.fog as FogExp2).density = config.renderer.fog;
    this.camera.fov = config.camera.fov;
    this.camera.far = Math.max(233, config.renderer.stageSize * Math.sqrt(3));
    this.camera.position.set(config.state.posX, config.state.posY, config.state.posZ);
    this.camera.updateProjectionMatrix();
  }

  static getMaterial(idx: number) {
    const isArray = Array.isArray(blockLoader[blockTypes[idx]].textureImg);
    if (isArray) {
      return (blockLoader[blockTypes[idx]].textureImg as Texture[]).map(
        (d: Texture) => new MeshStandardMaterial({ map: d })
      );
    } else {
      return new MeshStandardMaterial({ map: blockLoader[blockTypes[idx]].textureImg as Texture });
    }
  }
}
