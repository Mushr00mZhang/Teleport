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
router.beforeEach((to, from, next) => {
  if ((to.name === 'login' || to.path === '/login') && !chatStore.ws) {
    next();
    return;
  }
  if (!chatStore.ws) {
    router.push('login');
    return;
  }
  next();
});
