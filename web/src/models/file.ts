import { v4 as uuidv4 } from 'uuid';
import { type ChunkedBuffer } from '@/workers/filesplit';
import FileSplitWorker from '@/workers/filesplit.ts?worker';
import FileMD5Worker from '@/workers/filemd5.ts?worker';
import { getDB } from './db';
export const MinSplitSize = 1024 * 1024 * 1;
export const MaxSplitSize = 1024 * 1024 * 10;
export class MyFile {
  id: string;
  file: File;
  splitSize: number;
  count: number;
  private md5: string;
  private calcingMD5: Promise<void>;
  constructor(file: File, splitSize = MaxSplitSize / 2) {
    this.id = uuidv4();
    this.file = file;
    this.splitSize = Math.max(Math.min(splitSize ?? 0, MaxSplitSize), MinSplitSize);
    this.count = Math.ceil(file.size / splitSize);
    this.md5 = '';
    this.calcingMD5 = this.calcMD5();
    // this.insertFile();
  }
  get name() {
    return this.file?.name;
  }
  get isImage() {
    return this.file?.type.startsWith('image');
  }
  async getMD5() {
    await this.calcingMD5;
    return this.md5;
  }
  async calcMD5() {
    const worker = new FileMD5Worker();
    worker.postMessage({ source: 'file-md5-worker', id: this.id, file: this.file });
    await new Promise((r: (value: boolean) => void) => {
      worker.addEventListener('message', (e) => {
        const { id, md5 } = e.data as { id: string; md5: string };
        if (this.id !== id) r(false);
        this.md5 = md5;
        r(true);
      });
    });
    worker.terminate();
  }
  async insertFile() {
    const db = await getDB();
    if (db) {
      const transaction = db.transaction(['files'], 'readwrite');
      const fileStore = transaction.objectStore('files');
      const request = fileStore.add({
        id: this.id,
        type: this.file.type,
        size: this.file.size,
        md5: this.md5,
      });
      await new Promise((r) => {
        request.addEventListener('success', r);
      });
    } else {
      // 启用实时模式
    }
  }
  async split(callback: (chunk: ChunkedBuffer) => void, size = this.splitSize) {
    const worker = new FileSplitWorker();
    worker.postMessage({ source: 'file-split-worker', id: this.id, file: this.file, size });
    await new Promise((r: (value: boolean) => void) => {
      let chunkCnt = 0;
      worker.addEventListener('message', (e) => {
        const chunk = e.data as ChunkedBuffer;
        if (chunk.fileId !== this.id) return;
        chunkCnt++;
        callback(chunk);
        // this.insertFileChunk(chunk);
        if (this.count !== chunkCnt) return;
        r(true);
      });
    });
    worker.terminate();
  }
  async insertFileChunk(chunk: ChunkedBuffer) {
    const db = await getDB();
    if (db) {
      const transaction = db.transaction(['fileChunks'], 'readwrite');
      const fileChunkStore = transaction.objectStore('fileChunks');
      const request = fileChunkStore.add(chunk);
      await new Promise((r) => {
        request.addEventListener('success', r);
      });
    } else {
      // 启用实时模式
    }
  }
}
