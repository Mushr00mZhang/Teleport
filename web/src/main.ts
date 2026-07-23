import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
import { useChatStore } from '@/store/chat';

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');

const chatStore = useChatStore();
router.beforeEach((to, _, next) => {
  if ((to.name === 'login' || to.name === 'register') && !chatStore.ws) {
    next();
    return;
  }
  if (!chatStore.ws) {
    router.push('login');
    return;
  }
  next();
});
