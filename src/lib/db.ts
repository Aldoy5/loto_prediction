import Dexie, { Table } from 'dexie';
import { Draw } from '../types';

export class AppDatabase extends Dexie {
  draws!: Table<Draw>;

  constructor() {
    super('LotoScraperDB');
    this.version(2).stores({
      draws: 'id, date_tirage, nom_tirage, sort_key' // 'id' is the unique string constructed from date+name
    });
  }
}

export const localDb = new AppDatabase();
