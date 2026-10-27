import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Homepage.vue'
import { useAuthStore } from '@/controller/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Homepage },
    { path: '/routes', name: 'routes-list', component: () => import('@/views/RoutesList.vue') },
    { path: '/globe', name: 'routes-globe', component: () => import('@/views/RoutesGlobe.vue') },
    { path: '/routes/:id', name: 'route-detail', component: () => import('@/views/RouteDetail.vue') },
    { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/quiz', name: 'quiz', component: () => import('@/views/QuizView.vue'), meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initSession()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'auth', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'home' }
  }
  // already signed in, no need to see the login page
  if (to.name === 'auth' && auth.isLoggedIn) {
    return { name: 'profile' }
  }
})

export default router
