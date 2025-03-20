import * as THREE from "three";
import { blockTypes } from "../loader/index";
import Core from "..";
import { blockLoader } from "../loader";
import { config } from "../../controller/config";

class Audio {
  core: Core;
  support: boolean;

  constructor(core: Core) {
    this.core = core;
    this.support = false;
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();
    core.camera.add(listener);

    blockTypes.forEach((d: string) => {
      if (!blockLoader[d]) return;
      if (blockLoader[d].break) {
        audioLoader.load(blockLoader[d].break!, (buffer) => {
          const audio = new THREE.Audio(listener);
          audio.setBuffer(buffer);
          blockLoader[d].breakAudio = audio;
        });
      }
      if (blockLoader[d].step) {
        audioLoader.load(blockLoader[d].step!, (buffer) => {
          const audio = new THREE.Audio(listener);
          audio.setBuffer(buffer);
          blockLoader[d].stepAudio = audio;
        });
      }
    });
  }

  play(action: string, type: string, forceStop = true) {
    if (!blockLoader[type]) return;
    const audio = action === "step" ? blockLoader[type].stepAudio : blockLoader[type].breakAudio;
    if (!audio) return;
    if (audio.isPlaying) {
      if (forceStop) audio.stop();
      else return;
    }
    audio.setVolume(config.controller.volume / 100);
    audio.play();
    this;
  }
}

export default Audio;
