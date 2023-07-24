import { Store, StoreConfig } from "@datorama/akita";
import { ConeGeometry, SphereGeometry } from "three";

export type DraggableGeometry = { geometry: () => THREE.BufferGeometry };

export type BrandedString<T extends string> = string & { __brand: T };
export type DroppableID = BrandedString<"Droppable">;
export type PlacedID = BrandedString<"Placed">;

export interface ObjV3<T extends number = number> {
  x: T;
  y: T;
  z: T;
}
export type Placement = {
  placedEntityId: PlacedID;
  droppable: DraggableGeometry & {
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
}
export function createInitialState(): DataState {
  return {
    droppableEntities: {
      cone: { geometry: () => new ConeGeometry(0.25, 0.5) },
      sphere: { geometry: () => new SphereGeometry(0.25) },
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
