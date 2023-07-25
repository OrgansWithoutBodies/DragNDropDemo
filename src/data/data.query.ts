import { Query } from "@datorama/akita";

import { DataState, DataStore, dataStore } from "./data.store";

export class DataQuery extends Query<DataState> {
  constructor(protected store: DataStore) {
    super(store);
  }

  public droppableEntities = this.select("droppableEntities");
  public selectedPlacedEntity = this.select("selectedPlacedEntity");
  public placedEntities = this.select("placedEntities");
  public activeColor = this.select("activeColor");
}
export const dataQuery = new DataQuery(dataStore);
