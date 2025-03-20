import { InstancedMesh, Group, Mesh } from "three";

export interface iBlockFragmentSingleType {
  instancedMesh?: InstancedMesh;
  blocks: {
    type: string;
    count: number;
    position: number[];
    newIdx?: number;
  };
}

export interface iBlockFragment {
  timestamp: number;
  posX: number;
  posZ: number;
  group?: Group;
  templateMesh: Mesh[];
  types: iBlockFragmentSingleType[];
  idMap: Map<string, { temp: boolean; idx: number; typeIdx?: number }>;
  cloudPos?: number[];
  cloudMesh?: InstancedMesh;
}

export enum actionBlockEvent {
  ADD,
  REMOVE
}

export interface BlockLog {
  type: string | null;
  posX: number;
  posY: number;
  posZ: number;
  action?: actionBlockEvent;
}
