import { Store, StoreConfig } from "@datorama/akita";

import {
  ConeGeometry,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
} from "three";
// import Teapot from "/teapot.gltf";

// declare module '*.gltf'{}
export type DraggableGeometry<TAsync extends boolean = boolean> =
  TAsync extends true
    ? {
        geometryAsyncSource: string;
      }
    : {
        geometry: () => THREE.BufferGeometry;
      };

export type BrandedString<T extends string> = string & { __brand: T };
export type DroppableID = BrandedString<"Droppable">;
export type PlacedID = BrandedString<"Placed">;

export interface ObjV3<T extends number = number> {
  x: T;
  y: T;
  z: T;
}
export type Placement<TAsync extends boolean = boolean> = {
  placedEntityId: PlacedID;
  droppable: DraggableGeometry<TAsync> & {
    id: DroppableID;
  };
  pos: ObjV3 | null;
  normal: ObjV3 | null;
  color: string;
};

export interface DataState {
  droppableEntities: Record<DroppableID, DraggableGeometry>;
  placedEntities: Placement[];
  selectedPlacedEntity: PlacedID | null;
  activeColor: string;
}
export function createInitialState(): DataState {
  return {
    activeColor: "red",
    droppableEntities: {
      ["cone" as DroppableID]: { geometry: () => new ConeGeometry(0.25, 0.5) },
      ["knot" as DroppableID]: {
        geometry: () =>
          new TorusKnotGeometry(0.125, 0.125 / 2).rotateX((Math.PI * 2) / 4),
      },
      ["sphere" as DroppableID]: { geometry: () => new SphereGeometry(0.25) },
      ["torus" as DroppableID]: {
        geometry: () =>
          new TorusGeometry(0.25, 0.125).rotateX((Math.PI * 2) / 4),
      },
      ["teapot" as DroppableID]: {
        geometryAsyncSource: "/teapot.gltf",
        // geometryAsyncSource: Teapot,
      },
    },
    placedEntities: [],
    selectedPlacedEntity: null,
  };
}

@StoreConfig({ name: "data" })
export class DataStore extends Store<DataState> {
  constructor() {
    super(createInitialState());
  }
}

export const dataStore = new DataStore();
