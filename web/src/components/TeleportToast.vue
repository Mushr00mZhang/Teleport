<script setup lang="ts">
import { useToastStore, type ToastMessage } from '@/store/toast';
import { onUnmounted } from 'vue';

const toastStore = useToastStore();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const startTimer = (msg: ToastMessage) => {
  const timer = setTimeout(() => {
    dismiss(msg.id);
  }, msg.duration);
  timers.set(msg.id, timer);
};

const dismiss = (id: number) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toastStore.dismiss(id);
};

const onItemMounted = (msg: ToastMessage) => {
  startTimer(msg);
};

onUnmounted(() => {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
});
</script>

<template>
  <div class="teleport-toast-container">
    <TransitionGroup name="teleport-toast-item" tag="div" class="teleport-toast-stack">
      <div
        v-for="msg in toastStore.messages"
        :key="msg.id"
        class="teleport-toast"
        :class="`teleport-toast--${msg.type}`"
        @click="dismiss(msg.id)"
        @vue:mounted="onItemMounted(msg)"
      >
        <span class="teleport-toast-text">{{ msg.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss">
$prefix: 'teleport-toast';

.#{$prefix}-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
  width: min(560px, 90vw);
}

.#{$prefix}-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.#{$prefix} {
  min-width: 280px;
  padding: 14px 24px;
  border-radius: 12px;
  box-shadow:
    0 3px 5px -1px rgba(0, 0, 0, 0.2),
    0 6px 10px 0 rgba(0, 0, 0, 0.14),
    0 1px 18px 0 rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.25px;
  line-height: 1.4;
  pointer-events: auto;

  &-text {
    flex: 1;
  }

  &--info {
    background-color: var(--teleport-info);
    color: var(--teleport-on-info);
  }

  &--success {
    background-color: var(--teleport-success);
    color: var(--teleport-on-success);
  }

  &--warning {
    background-color: var(--teleport-warning);
    color: var(--teleport-on-warning);
  }

  &--error {
    background-color: var(--teleport-error);
    color: var(--teleport-on-error);
  }
}

/* 入场：从下方滑入 */
.teleport-toast-item-enter-active {
  transition: all 0.3s ease-out;
}

/* 离场：向上方滑出并淡出 */
.teleport-toast-item-leave-active {
  transition: all 0.25s ease-in;
}

.teleport-toast-item-enter-from {
  opacity: 0;
  transform: translateY(40px);
}

.teleport-toast-item-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}

/* 队列内位置移动过渡 */
.teleport-toast-item-move {
  transition: transform 0.3s ease;
}
</style>
