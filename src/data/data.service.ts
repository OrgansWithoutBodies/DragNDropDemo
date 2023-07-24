import { DataStore, dataStore } from "./data.store";
export class DataService {
  constructor(private dataStore: DataStore) {}
}

export const dataService = new DataService(dataStore);
