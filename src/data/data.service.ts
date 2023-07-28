import { BufferGeometry } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  DataStore,
  DraggableGeometry,
  DroppableID,
  PlacedID,
  Placement,
  dataStore,
} from "./data.store";
function makeid(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export class DataService {
  constructor(private dataStore: DataStore) {}
  public async loadAsyncModels() {
    const { droppableEntities } = this.dataStore.getValue();
    const asyncEntityKeys = Object.keys(droppableEntities).filter(
      (key) => "geometryAsyncSource" in droppableEntities[key as DroppableID]
    );
    const data = await Promise.all(
      asyncEntityKeys.map(async (key) => {
        const typedKey = key as DroppableID;
        const loader = new GLTFLoader();
        const data = await loader.loadAsync(
          (droppableEntities[typedKey] as { geometryAsyncSource: string })
            .geometryAsyncSource
        );
        console.log("TEST123-returning", data);
        return [
          typedKey,
          (
            data.scene.children[0] as any as { geometry: BufferGeometry }
          ).geometry
            .scale(0.1, 0.1, 0.1)
            .rotateY(Math.PI / 2),
        ] as [DroppableID, BufferGeometry];
      })
    );
    const mutableDroppables = { ...droppableEntities };
    data.forEach((val) => {
      mutableDroppables[val[0]] = { geometry: () => val[1] };
    });
    this.dataStore.update((...R) => ({
      ...R,
      droppableEntities: mutableDroppables,
    }));
  }
  public setActiveColor(activeColor: string) {
    this.dataStore.update(({ ...R }) => ({
      ...R,
      activeColor,
    }));
  }
  public setSelected(selected: PlacedID) {
    console.log("TEST124-select");
    this.dataStore.update(({ ...R }) => ({
      ...R,
      selectedPlacedEntity: selected,
    }));
  }
  public placeEntity(placement: Placement) {
    this.dataStore.update(({ placedEntities, ...R }) => ({
      ...R,
      placedEntities: [...placedEntities, placement],
    }));
  }
  public addDroppable(droppable: DroppableID): PlacedID {
    const { droppableEntities, activeColor } = this.dataStore.getValue();
    const data: Placement<false> = {
      droppable: {
        id: droppable,
        geometry: (droppableEntities[droppable] as DraggableGeometry<false>)
          .geometry,
      },
      color: activeColor,
      normal: null,
      pos: null,
      placedEntityId: makeid(10) as PlacedID,
    };
    this.placeEntity(data);

    return data.placedEntityId;
  }
  public updateEntity(
    placementID: Placement["placedEntityId"],
    newPlacement: Omit<Placement, "placedEntityId">
  ) {
    this.dataStore.update(({ placedEntities, ...R }) => {
      const updatingIndex = placedEntities.findIndex(
        ({ placedEntityId }) => placedEntityId === placementID
      );
      const updatedPlacements = [...placedEntities];
      updatedPlacements[updatingIndex] = {
        placedEntityId: placementID,
        ...newPlacement,
      };
      return {
        ...R,
        placedEntities: updatedPlacements,
      };
    });
  }
  public updateEntityPosition(
    placementID: Placement["placedEntityId"],
    newPlacement: Pick<Placement, "normal" | "pos">
  ) {
    const { placedEntities: currentEntities } = this.dataStore.getValue();
    const updatingIndex = currentEntities.findIndex(
      ({ placedEntityId }) => placedEntityId === placementID
    );
    this.updateEntity(placementID, {
      ...currentEntities[updatingIndex],
      ...newPlacement,
    });
  }
}

export const dataService = new DataService(dataStore);
