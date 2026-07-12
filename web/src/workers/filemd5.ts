import MD5 from 'crypto-js/md5';
import WordArray from 'crypto-js/lib-typedarrays';
onmessage = async (e) => {
  if (e.data.source !== 'file-md5-worker') return;
  const { id, file } = e.data as { id: string; file: File };
  if (!file) return;
  const fileBuf = await file.arrayBuffer();
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  const wordArray = WordArray.create(fileBuf);
  const md5 = MD5(wordArray).toString();
  postMessage({ id, md5 });
};
