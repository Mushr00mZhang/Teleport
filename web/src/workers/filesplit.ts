import { v4 as uuidv4 } from 'uuid';
import MD5 from 'crypto-js/md5';
import WordArray from 'crypto-js/lib-typedarrays';
export type ChunkedBuffer = {
  id: string;
  fileId: string;
  buf: ArrayBuffer;
  index: number;
  count: number;
  size: number;
  md5: string;
};
onmessage = async (e) => {
  if (e.data.source !== 'file-split-worker') return;
  const { id, file, size = 1024 * 1024 } = e.data as { id: string; file: File; size: number };
  if (!file) return;
  const count = Math.ceil(file.size / size);
  const fileBuf = await file.arrayBuffer();
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  // reader.addEventListener('load', (e) => {
  //   reader.result;
  // });
  // console.log(file.size, fileBuf.byteLength);
  for (let i = 0; i < count; i++) {
    const buf = fileBuf.slice(i * size, (i + 1) * size);
    const wordArray = WordArray.create(buf);
    const md5 = MD5(wordArray).toString();
    const chunk: ChunkedBuffer = {
      id: uuidv4(),
      fileId: id,
      index: i,
      count,
      buf,
      size: buf.byteLength,
      md5,
    };
    postMessage(chunk);
  }
};
