import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/routes', name: 'routes-list', component: () => import('@/views/RoutesList.vue') },
    { path: '/routes/:id', name: 'route-detail', component: () => import('@/views/RouteDetail.vue') },
    { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue') },
    { path: '/quiz', name: 'quiz', component: () => import('@/views/QuizView.vue') },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue') },
  ],
})

export default router
