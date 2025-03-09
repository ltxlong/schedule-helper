import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

// 验证函数
const validatePassword = async (password) => {
  const isDev = import.meta.env.DEV
  const devPassword = import.meta.env.VITE_ACCESS_PASSWORD

  // 开发环境：直接比对密码
  if (isDev) {
    return password === devPassword;
  }

  // 生产环境：通过中间件验证
  try {
    const response = await fetch(window.location.href, {
      headers: {
        'X-Access-Password': password
      },
      redirect: 'manual'
    });

    return response.status === 200;
  } catch (error) {
    console.error('验证失败:', error);
    return false;
  }
}

const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
};

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const isDev = import.meta.env.DEV
  const devPassword = import.meta.env.VITE_ACCESS_PASSWORD
  const isAuthenticated = getCookie('authenticated') === 'true'

  // 如果不需要验证或已经验证过，直接通过
  if (!to.meta.requiresAuth || isAuthenticated) {
    next()
    return
  }

  // 如果需要验证但没有设置密码，直接通过
  if (!devPassword && isDev) {
    next()
    return
  }

  // 需要验证且未验证，跳转到登录页
  next('/login')
})

export default router

// 导出验证函数供 LoginView 使用
export { validatePassword }