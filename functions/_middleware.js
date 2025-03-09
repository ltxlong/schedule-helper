export async function onRequest({ request, env, next }) {
    try {
      const url = new URL(request.url);
      
      // 静态资源和登录页直接放行
      if (url.pathname.includes('/assets/') || 
          url.pathname.endsWith('.js') || 
          url.pathname.endsWith('.css') || 
          url.pathname.endsWith('.ico') ||
          url.pathname === '/') {
        return next();
      }
      
      if (url.pathname === '/login' && 
        !request.headers.get('X-Access-Password')) {
        return next();
      }

      // 登录验证
      const userPassword = request.headers.get('X-Access-Password');
      const correctPassword = env.ACCESS_PASSWORD;

      if (userPassword && correctPassword && userPassword === correctPassword) {
        return new Response('OK', { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*'
          }
        });
      }
      
      // 已登录的用户 (检查会话存储状态)
      const cookie = request.headers.get('cookie');
      if (cookie && cookie.includes('authenticated=true')) {
        return next();
      }
      
      // 未验证的API请求返回401
      if (request.headers.get('accept')?.includes('application/json')) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      // 其他页面请求重定向到登录页
      return Response.redirect(new URL('/login', request.url));
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 200 });
    }
  }