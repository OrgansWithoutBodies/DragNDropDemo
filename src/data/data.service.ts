import {
  DataStore,
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
  public placeEntity(placement: Placement) {
    this.dataStore.update(({ placedEntities, ...R }) => ({
      ...R,
      placedEntities: [...placedEntities, placement],
    }));
  }
  public addDroppable(droppable: DroppableID): PlacedID {
    const { droppableEntities } = this.dataStore.getValue();
    const data: Placement = {
      droppable: {
        id: droppable,
        geometry: droppableEntities[droppable].geometry,
      },
      color: "red",
      normal: null,
      pos: null,
      placedEntityId: makeid(10),
    };
    this.placeEntity(data);

    console.log("TEST123-place", data);
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
    const { placedEntities } = this.dataStore.getValue();
    console.log("TEST123-update", placedEntities);
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
