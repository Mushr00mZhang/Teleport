let db: IDBDatabase | null = null;
const init = async () => {
  const request = indexedDB.open('teleport', 1);
  db = await new Promise((res: (value: IDBDatabase | null) => void, rej) => {
    request.addEventListener(
      'success',
      (event: Event) => res('result' in event ? (event.result as IDBDatabase) : null),
      { once: true }
    );
    request.addEventListener('upgradeneeded', (event: IDBVersionChangeEvent) => {
      const oldDB = 'result' in event ? (event.result as IDBDatabase) : null;
      if (!oldDB) return;
      const fileStore = oldDB.createObjectStore('files', { keyPath: 'id' });
      fileStore.createIndex('name', 'name', { unique: false });
      fileStore.createIndex('type', 'type', { unique: false });
      // fileStore.createIndex('ext', 'ext', { unique: false });
      fileStore.createIndex('size', 'size', { unique: false });
      fileStore.createIndex('md5', 'md5', { unique: false });
      const fileChunkStore = oldDB.createObjectStore('fileChunks', { keyPath: 'id' });
      fileChunkStore.createIndex('fileId', 'fileId', { unique: false });
      fileChunkStore.createIndex('index', 'index', { unique: false });
      fileChunkStore.createIndex('size', 'size', { unique: false });
      fileChunkStore.createIndex('md5', 'md5', { unique: false });
    });
  }).catch((e) => {
    console.error(e);
    return null;
  });
};
const initted = init();
const getDB = async () => {
  await initted;
  return db;
};
export { getDB };
