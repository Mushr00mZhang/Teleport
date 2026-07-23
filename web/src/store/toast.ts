import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
  duration: number;
}

const MAX_VISIBLE = 3;
const MIN_DURATION = 200;
let nextId = 0;

export const useToastStore = defineStore('toast', () => {
  const messages = ref<ToastMessage[]>([]);

  const getDuration = (baseDuration: number) => {
    const queueLength = messages.value.length;
    if (queueLength <= MAX_VISIBLE) return baseDuration;
    const speedFactor = queueLength / MAX_VISIBLE;
    const adjustedDuration = baseDuration / speedFactor;
    return Math.max(MIN_DURATION, adjustedDuration);
  };

  /** 手动关闭指定消息 */
  const dismiss = (id: number) => {
    const index = messages.value.findIndex((m) => m.id === id);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  };

  /** 手动关闭最旧的一条消息（从顶部出队） */
  const dismissOldest = () => {
    if (messages.value.length > 0) {
      messages.value.shift();
    }
  };

  const push = (text: string, type: ToastType = 'info', baseDuration = 3000) => {
    const id = nextId++;
    const duration = getDuration(baseDuration);
    const msg: ToastMessage = { id, text, type, duration };

    // 如果已超出最大数量，手动出队最旧的
    if (messages.value.length >= MAX_VISIBLE) {
      messages.value.shift();
    }

    messages.value.push(msg);
  };

  const info = (text: string, duration = 3000) => push(text, 'info', duration);
  const success = (text: string, duration = 3000) => push(text, 'success', duration);
  const warning = (text: string, duration = 4000) => push(text, 'warning', duration);
  const error = (text: string, duration = 5000) => push(text, 'error', duration);

  return { messages, push, dismiss, dismissOldest, info, success, warning, error };
});
