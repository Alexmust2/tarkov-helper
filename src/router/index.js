import { createRouter, createWebHistory } from 'vue-router'
import Tasks from '../views/TasksView.vue'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { decode } from 'js-base64';
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";


const routes = [
  {
    path: '/tasks',
    name: 'tasks',
    component: Tasks,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/:catchAll(.*)*',
    name: 'notfound',
    component: NotFoundView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuth = localStorage.getItem('isAuth');
  const authUser = localStorage.getItem('authUser');

  if (isAuth === 'true' && authUser) {
    if (to.name === 'home') {
      next({ name: 'tasks' });
    } else {
      next();
    }
  } else {
    if (to.name !== 'home') {
      next({ name: 'home' });
    } else {
      next();
    }
  }
});

export default router;