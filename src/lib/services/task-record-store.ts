import { Exercise } from '@/workout-state.ts';

export interface TaskRecordStore {
  get(uuid: string): Promise<TaskRecord | undefined>;
  list(): Promise<TaskRecord[]>;
  save(taskDefinition: TaskRecord): Promise<void>;
  delete(uuid: string): Promise<void>;
}

export interface TaskRecord {
  uuid: string;
  slug: string;
  name: string;
  content: TaskBody;
}

export interface TaskBody {
  items: TaskItem[];
}

export type TaskItem = TimedItem | ContainerItem;
export interface BaseItem {
  uuid: string;
  name: string;
}
export interface TimedItem extends BaseItem {
  type: 'timed';
  duration: number;
  exercise: Exercise;
}
export interface ContainerItem extends BaseItem {
  type: 'container';
  items: TimedItem[];
}
