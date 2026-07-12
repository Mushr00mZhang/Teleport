import { createRouter, createWebHistory } from 'vue-router';
const router = createRouter({
  history: createWebHistory('/teleport/'),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/',
      name: 'main',
      component: () => import('../views/Main.vue'),
    },
  ],
});
export default router;
