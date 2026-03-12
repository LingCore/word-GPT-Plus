import { IndexedDBSaver } from './checkpoints'

let checkpointer: IndexedDBSaver | null = null

export function getCheckpointer(): IndexedDBSaver {
  if (!checkpointer) {
    checkpointer = new IndexedDBSaver()
  }
  return checkpointer
}

export function setCheckpointer(saver: IndexedDBSaver): void {
  checkpointer = saver
}
