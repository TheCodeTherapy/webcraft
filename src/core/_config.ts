import deviceTest from "../utils/device-test";
import { deepClone } from "../utils/deep-clone";

import "../utils/types/image.d.ts";
import xboxImg from "../assets/pictures/joy-stick/xbox-en.png";
import psImg from "../assets/pictures/joy-stick/ps-en.png";

const langEN = {
  singlePlayerGame: "Single Game",
  multiPlayerGame: "Multi Game",
  uploadArchive: "Upload Archive",
  browserArchive: "Browser Archive",
  cancelArchive: "Loaded, Click to Cancel",
  loadArchiveSuccess: "File Read Successfully",
  browserNoArchive: "No Archive in Browser",
  cancelSuccess: "Cancel Success",
  setting: "Game Settings",
  help: "Help",
  about: "About",
  createRoom: "Create Room",
  joinRoom: "Join Room",
  exitRoom: "Exit Room",
  roomName: "Room Name",
  nickname: "Nickname",
  player: "Player",
  startGame: "Start Game",
  backMenu: "Back",
  fov: "FOV",
  fogFactor: "fog",
  stageSize: "Simulate",
  rendDistance: "Render",
  volume: "Volume",
  language: "Language",
  operation: "Operation",
  bagMode: "Bag Mode",
  pcMode: "PC",
  mobileMode: "Mobile",
  vrMode: "VR",
  backGame: "Resume",
  setFullScreen: "(Cancel) Fullscreen",
  saveGame: "Save Game",
  exitGame: "Exit",
  saveSuccess: "Save Success",
  cheatMode: "Cheat Mode",
  on: "ON",
  off: "OFF",
  fps: "FPS",
  helps: [
    { k: "Space Bar", v: "Jump" },
    { k: "E Key", v: "Switch Bag" },
    { k: "Q Key", v: "Cheat Mode" },
    { k: "Mouse Move", v: "Change Orientation" },
    { k: "WSAD Key", v: "Move" },
    { k: "Number Key", v: "Toggle Block" },
    { k: "Wheel Scroll", v: "Toggle Block" },
    { k: "Click Item Box", v: "Toggle Block" },
    { k: "Shift Key", v: "Drop in Cheat Mode" },
    { k: "Mouse left/right click", v: "Destroy/Create Blocks" },
    { k: "ESC Key", v: "Show Menu" },
    { k: "Drag Screen", v: "Change Orientation" },
    { k: "Click Item Box", v: "Toggle Block" },
    { k: "Click Active Item", v: "Open Backpack" },
    { k: "Turn Headset", v: "Change Orientation" },
    { k: "Using Remote", v: "Destroy Blocks" }
  ],
  aboutItems: ["Minecraft release based on Three.js", "Version: 1.0.2", "More information, see", ":)"],
  tryRotate: "Please rotate the screen before start",
  tryLock: "Mouse lock failed, please try clicking again",
  allBlock: "All blocks",
  up: "△",
  down: "▽",
  build: "⊙",
  remove: "×",
  menu: "Menu",
  opSens: "Op Sens",
  opRange: "Op Range",
  crossHair: "Crosshair",
  dark: "BK",
  light: "WH",
  high: "High",
  low: "Low",
  norm: "Normal",
  threadNumber: "Thread",
  weatherName: ["Classic", "Ice", "Beach Melon Field", "Pumpkin Field 🎃", "Bizarre?"],
  weather: "Scenes",
  chromeSupport: "Newest Chrome is recommended →",
  chromeAddress: "https://chrome.google.com/",
  enterVR: "Enter VR",
  exitVR: "Exit VR",
  xbox: "Xbox",
  xboxJoystick: "Xbox Joy Stick",
  xboxImg,
  joystick: "Joy Stick",
  ps45: "PS4/5",
  psJoystick: "PS Joy Stick",
  psImg,
  developing: "This feature is still under development, so stay tuned :)",
  linkServer: "Connect server",
  defaultServer: "Use default server",
  customServer: "Use self-built server",
  serverAddress: "Address",
  cancelLink: "Disconnect",
  chooseRoom: "Next",
  dissolveRoom: "Dissolve room",
  wsMessage: {
    PERMISSION_DENIED: "Permission denied",
    ROOM_NOT_FOUND: "Room not found",
    CREATE_ROOM_SUCCESS: "Room created successfully",
    LEAVE_SUCCESS: "You have left the room",
    ROOM_DISSOLVED: "Room has been dissolved",
    PLAYER_CHANGE_JOIN: " joined the room",
    PLAYER_CHANGE_LEAVE: " left the room",
    DISCONNECT: "Disconnected from server",
    DUPlATE_NAME: "Duplicate nickname, please modify"
  }
};

const config: {
  seed: number | null;
  cloudSeed: number | null;
  treeSeed: number | null;
  weather: number | null;
  bag: {
    type: string;
    bagItem: number[];
    activeIndex: number;
    mobile: {
      rotateDegree: number;
      radius: number;
    };
    bagBox: {
      activeIdx: number;
    };
  };
  camera: {
    fov: number;
    camHeight: number;
  };
  renderer: {
    fog: number;
    stageSize: number;
  };
  controller: {
    thread: number;
    volume: number;
    operation: string;
    language: string;
    cheat: boolean;
    dev: boolean;
    fps: boolean;
    crosshair: string;
    opSens: number;
    opRange: number;
  };
  state: {
    posX: number;
    posY: number;
    posZ: number;
  };
  log: any[];
} = {
  seed: null,
  cloudSeed: null,
  treeSeed: null,
  weather: null,
  bag: {
    type: deviceTest(),
    bagItem: [44, 8, 12, 15, 30, 31, 46, 45, 33, 23],
    activeIndex: 0,
    mobile: {
      rotateDegree: 12.5,
      radius: 233
    },
    bagBox: {
      activeIdx: 0
    }
  },
  camera: {
    fov: 80,
    camHeight: 2
  },
  renderer: {
    fog: 0.02,
    stageSize: deviceTest() === "pc" ? 144 : 64 // stage的边长 196
    // renderDistance: 500,
  },
  controller: {
    thread: 4,
    volume: 80,
    operation: deviceTest(),
    language: `${/^\/en/.test(document.location.pathname) ? 1 : 0}`,
    cheat: false,
    dev: false,
    fps: true,
    crosshair: "dark",
    opSens: 1,
    opRange: 8
  },
  state: {
    posX: 0,
    posY: 30,
    posZ: 0
  },
  log: []
};

const symConfig = {
  stage: {
    skyBackground: 0x87ceeb,
    maxHeight: 11,
    horizonHeight: -3,
    treeBaseHeight: 0,
    skyHeight: 40
  },
  actionsScale: {
    walking: 8,
    jump: 9,
    fall: 9,
    cheatFactor: 2,
    moveScale: 1,
    viewScale: 0.5,
    g: 0.027
  },
  body: {
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
    length: 0.6,
    width: 0.8,
    height: 2,
    eyeButton: 1.75,
    eyeUp: 0.25,
    eyeLeft: 0.4,
    eyeRight: 0.4,
    eyeFront: 0.1,
    eyeBack: 0.4
  },
  noiseGap: {
    seedGap: 35,
    cloudSeedGap: 2,
    treeSeedGap: 2
  },
  xbox: {
    viewMoveScale: 2
  },
  ps: {
    viewMoveScale: 2
  },
  eps: 0.03
};

const defaultConfig = {
  seed: null,
  cloudSeed: null,
  treeSeed: null,
  weather: null,
  bag: {
    type: deviceTest(),
    bagItem: [44, 8, 12, 15, 30, 31, 46, 45, 33, 23],
    activeIndex: 0,
    mobile: {
      rotateDegree: 12.5,
      radius: 233
    },
    bagBox: {
      activeIdx: 0
    }
  },
  camera: {
    fov: 80,
    camHeight: 2
  },
  renderer: {
    fog: 0.02,
    stageSize: deviceTest() === "pc" ? 144 : 64 // stage的边长 196
    // renderDistance: 500,
  },
  controller: {
    thread: 4,
    volume: 80,
    operation: deviceTest(),
    language: `${/^\/en/.test(document.location.pathname) ? 1 : 0}`,
    cheat: false,
    dev: false,
    fps: true,
    crosshair: "dark",
    opSens: 1,
    opRange: 8
  },
  state: {
    posX: 0,
    posY: 30,
    posZ: 0
  },
  log: []
};

const languages = [langEN];
const language = deepClone(languages[/^\/cn/.test(document.location.pathname) ? 1 : 0]);

export { config, symConfig, defaultConfig, language, languages };
