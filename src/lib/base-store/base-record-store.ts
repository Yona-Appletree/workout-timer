export interface BaseRecordStore<TRecord> {
  get(uuid: string): Promise<TRecord | undefined>;
  list(): Promise<TRecord[]>;
  save(record: TRecord): Promise<void>;
  delete(uuid: string): Promise<void>;
}

export interface BaseRecord {
  uuid: string;
}
