import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/routes/:id',
      name: 'route-detail',
      component: () => import('@/views/RouteDetail.vue'),
    },
    {
      path: '/routes',
      name: 'routes-list',
      component: () => import('@/views/RoutesList.vue'),
    },
  ],
})

export default router
