import { Store, StoreConfig } from "@datorama/akita";
import { ConeGeometry, SphereGeometry } from "three";

export type DraggableGeometry = { geometry: () => THREE.BufferGeometry };
type EntityID = string;
export interface DataState {
  droppableEntities: Record<EntityID, DraggableGeometry>;
}
export function createInitialState(): DataState {
  return {
    droppableEntities: {
      cone: { geometry: () => new ConeGeometry(0.25, 0.5) },
      sphere: { geometry: () => new SphereGeometry(0.25) },
    },
  };
}
@StoreConfig({ name: "data" })
export class DataStore extends Store<DataState> {
  constructor() {
    super(createInitialState());
  }
}

export const dataStore = new DataStore();
