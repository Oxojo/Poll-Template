import { createRouter, createWebHistory } from 'vue-router'
import Home from '../component/Home.vue'
import Info from '../component/info.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/info', component: Info }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router