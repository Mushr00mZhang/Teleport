import { MyFile } from '@/models/file';
import type { ChunkedBuffer } from '@/workers/filesplit';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
export type SendMsg = {
  Type: 'getUsers' | 'rename' | 'text' | 'file';
  Content: string;
  From: string;
  To: string;
};
export type SendFile = {
  Type: 'file';
  Content: {
    Id: string;
    // Url: string;
    Name: string;
    Type: string;
    Ext: string;
  };
  From: string;
  To: string;
};
export type SendFileChunk = {
  Type: 'file-chunk';
  Content: ChunkedBuffer;
  From: string;
  To: string;
};
type BaseMsg = {
  From: string;
  To: string;
  Time: Date;
};
type LogMsg = {
  Type: 'login' | 'logoff';
  Content: string;
} & BaseMsg;
type RenameMsg = {
  Type: 'rename';
  Content: string;
} & BaseMsg;
type TextMsg = {
  Type: 'text';
  Content: string;
  Read: boolean;
} & BaseMsg;
type FileMsg = {
  Type: 'file';
  Content: {
    Id: string;
    // Buf: string;
    Name: string;
    Type: string;
    Ext: string;
    Url?: string;
  };
  Read: boolean;
  Progress: number;
} & BaseMsg;
type FileChunkMsg = {
  Type: 'file-chunk';
  Content: ChunkedBuffer;
} & BaseMsg;
type UsersMsg = {
  Type: 'users';
  Content: User[];
} & BaseMsg;
export type Message = TextMsg | FileMsg | FileChunkMsg | UsersMsg | LogMsg | RenameMsg;
export type User = {
  LoginName: string;
  NickName: string;
  Status: 0 | 1;
  LastMsg?: TextMsg | FileMsg;
};
export const useChatStore = defineStore('ws', () => {
  const files = reactive(new Map<string, ArrayBuffer[]>());
  const user: User = {
    LoginName: '',
    NickName: '',
    Status: 0,
  };
  const ws = ref<WebSocket>();
  const messages = reactive<(TextMsg | FileMsg)[]>([]);
  const users = reactive<User[]>([]);
  const login = (loginName: string, nickName: string) => {
    const search = new URLSearchParams();
    search.set('LoginName', loginName);
    search.set('NickName', nickName);
    const url = `${document.head.baseURI.replace(/http(s*)/, 'ws').trimEnd()}api/login?${search}`;
    ws.value = new WebSocket(url);
    ws.value.addEventListener('open', () => {
      localStorage.setItem('loginName', loginName);
      localStorage.setItem('nickName', nickName);
      user.LoginName = loginName;
      user.NickName = nickName;
      getUsers();
    });
    ws.value.addEventListener('message', onMessage);
    ws.value.addEventListener('close', onClose);
  };
  const sendMsg = (content: string, to: string) => {
    if (!ws.value) return false;
    const msg: SendMsg = {
      Type: 'text',
      Content: content,
      From: user.LoginName,
      To: to,
    };
    ws.value.send(JSON.stringify(msg));
    messages.push({
      Type: 'text',
      Content: msg.Content,
      From: msg.From,
      To: msg.To,
      Time: new Date(),
      Read: true,
    });
    return true;
  };
  const sendFile = (file: MyFile, to: string) => {
    if (!ws.value) return null;
    const msg: SendFile = {
      Type: 'file',
      Content: {
        Id: file.id,
        // Url: '',
        Name: file.file.name,
        Type: file.file.type,
        Ext: file.file.name.slice(file.file.name.lastIndexOf('.')),
      },
      From: user.LoginName,
      To: to,
    };
    ws.value.send(JSON.stringify(msg));
    const fileMsg: FileMsg = { ...msg, Time: new Date(), Read: true, Progress: 0 };
    messages.push(fileMsg);
    //   // NOTE:后续添加续传
    return file.id;
  };
  const sendFileChunk = (chunk: ChunkedBuffer, to: string) => {
    if (!ws.value) return false;
    const prefix = `file-chunk${chunk.fileId}${chunk.index.toString().padStart(8)}${chunk.count
      .toString()
      .padStart(8)}${chunk.md5}${to.padStart(34)}`;
    const msgBuf = new Int8Array([
      ...prefix.split('').map((i) => i.charCodeAt(0)),
      ...new Int8Array(chunk.buf),
    ]);
    ws.value.send(msgBuf);
    // NOTE:后续添加续传
  };
  const getUsers = () => {
    if (!ws.value) return false;
    const msg: SendMsg = {
      Type: 'getUsers',
      Content: '',
      From: user.LoginName,
      To: 'server',
    };
    ws.value.send(JSON.stringify(msg));
    return true;
  };
  const onOpen = (e: Event) => {
    console.log('open', e);
  };
  const onMessage = async (e: MessageEvent) => {
    console.log('message', e);
    try {
      if (e.data instanceof Blob) {
        const arrayBuffer = await e.data.arrayBuffer();
        if (String.fromCharCode(...new Int8Array(arrayBuffer.slice(0, 10))) !== 'file-chunk')
          return;
        const id = String.fromCharCode(...new Int8Array(arrayBuffer.slice(10, 46)));
        const index = Number(String.fromCharCode(...new Int8Array(arrayBuffer.slice(46, 54))));
        const count = Number(String.fromCharCode(...new Int8Array(arrayBuffer.slice(54, 62))));
        const md5 = String.fromCharCode(...new Int8Array(arrayBuffer.slice(62, 94)));
        const to = String.fromCharCode(...new Int8Array(arrayBuffer.slice(94, 128)));
        const buf = arrayBuffer.slice(128);
        console.log(
          `文件分片接收成功 id: ${id} [${String(index + 1).padStart(
            String(count).length,
            '0',
          )}/${count}] md5: ${md5} len: ${buf.byteLength}`,
        );
        let bufs = files.get(id);
        if (!bufs) {
          bufs = [];
          files.set(id, bufs);
        }
        bufs[index] = buf;
        const fileMsg = messages.find((i) => i.Type === 'file' && i.Content.Id === id) as
          | FileMsg
          | undefined;
        if (!fileMsg) return;
        const received = bufs.filter((i) => !!i).length;
        fileMsg.Progress = received / count;
        if (received !== count) return;
        const file = new File(bufs, fileMsg.Content.Name, {
          type: fileMsg.Content.Type,
        });
        // console.log(file);
        const url = URL.createObjectURL(file);
        fileMsg.Content.Url = url;
        // console.log(url);
      } else if (typeof e.data === 'string') {
        const msg: Message = JSON.parse(e.data);
        msg.Time = new Date(msg.Time);
        switch (msg.Type) {
          case 'login':
            {
              let user = users.find((i) => i.LoginName === msg.From);
              if (!user) {
                user = {
                  LoginName: msg.From,
                  NickName: msg.Content,
                  Status: 1,
                  LastMsg: [...messages]
                    .sort((a, b) => b.Time.getTime() - a.Time.getTime())
                    .find(
                      (i) =>
                        (i.Type === 'text' || i.Type === 'file') &&
                        (i.From === msg.From || i.To === msg.From),
                    ) as TextMsg | FileMsg,
                };
                users.push(user);
              }
              user.NickName = msg.Content;
              user.Status = 1;
            }
            break;
          case 'logoff':
            {
              let user = users.find((i) => i.LoginName === msg.From);
              if (!user) {
                user = {
                  LoginName: msg.From,
                  NickName: msg.Content,
                  Status: 0,
                  LastMsg: [...messages]
                    .sort((a, b) => b.Time.getTime() - a.Time.getTime())
                    .find(
                      (i) =>
                        (i.Type === 'text' || i.Type === 'file') &&
                        (i.From === msg.From || i.To === msg.From),
                    ) as TextMsg | FileMsg,
                };
                users.push(user);
              }
              user.NickName = msg.Content;
              user.Status = 0;
            }
            break;
          case 'users':
            users.splice(0);
            users.push(...msg.Content);
            break;
          case 'rename':
            break;
          case 'file':
            msg.Progress = 0;
            messages.push(msg);
            files.set(msg.Content.Id, []);
            break;
          case 'file-chunk':
            {
              let bufs = files.get(msg.Content.id);
              if (!files.has(msg.Content.id)) {
                bufs = [];
                files.set(msg.Content.id, bufs);
              }
              if (!bufs) break;
              bufs[msg.Content.index] = msg.Content.buf;
              if (bufs.filter((i) => !!i).length === msg.Content.count) {
                console.log('文件接收完毕');
              }
            }
            break;
          case 'text':
            // // 发送给自己的消息，标记为未读
            // if (msg.To === user.LoginName) {
            //   msg.Read = false;
            // }
            messages.push(msg);
            // 设置用户最新消息
            for (const user of users) {
              if (msg.From === user.LoginName) {
                user.LastMsg = msg;
              }
            }
            break;
          default:
            break;
        }
      }
    } catch {}
  };
  const onClose = (e: CloseEvent) => {
    console.log('close', e);
    // 关闭连接
    if (ws.value) ws.value.close();
    // 重置变量
    ws.value = undefined;
  };
  const on = (type: 'open' | 'message' | 'close', cb: (e: Event) => any) => {
    if (!ws.value) return false;
    ws.value.addEventListener(type, cb);
    return true;
  };
  const once = (type: 'open' | 'message' | 'close', cb: (e: Event) => any) => {
    if (!ws.value) return false;
    const ncb = (e: Event) => {
      cb(e);
      ws.value?.removeEventListener(type, ncb);
    };
    ws.value.addEventListener(type, ncb);
    return true;
  };
  return { ws, login, sendMsg, sendFile, sendFileChunk, messages, user, getUsers, users, on, once };
});
