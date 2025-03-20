import { blockTypes } from "./Loader";
import { Core } from "./Core";
import { blockLoader } from "./Loader";
import { config } from "./_config";
import { AudioLoader, AudioListener, Audio as ThreeAudio } from "three";

export class Audio {
  core: Core;
  support: boolean;

  constructor(core: Core) {
    this.core = core;
    this.support = false;
    const listener = new AudioListener();
    const audioLoader = new AudioLoader();
    core.camera.add(listener);

    blockTypes.forEach((d: string) => {
      if (!blockLoader[d]) return;
      if (blockLoader[d].break) {
        audioLoader.load(blockLoader[d].break!, (buffer) => {
          const audio = new ThreeAudio(listener);
          audio.setBuffer(buffer);
          blockLoader[d].breakAudio = audio;
        });
      }
      if (blockLoader[d].step) {
        audioLoader.load(blockLoader[d].step!, (buffer) => {
          const audio = new ThreeAudio(listener);
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
