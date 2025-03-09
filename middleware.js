export const config = {
  matcher: '/:path*',
  runtime: 'edge'
};

export default function middleware(request) {
  try {
    const url = new URL(request.url);
    
    // 静态资源和登录页直接放行
    if (url.pathname.includes('/assets/') || 
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.ico') || 
        url.pathname === '/') {
      return new Response(null, {
        status: 200,
        headers: { 'x-middleware-next': '1' }
      });
    }
    
    // 检查是否已登录
    const cookie = request.headers.get('cookie');
    const isAuthenticated = cookie && cookie.includes('authenticated=true');
    
    // 已登录用户访问登录页，重定向到首页
    if (isAuthenticated && url.pathname === '/login') {
      return Response.redirect(new URL('/', request.url), 302);
    }
    
    // 未登录用户访问登录页，放行
    if (url.pathname === '/login' && 
        !request.headers.get('X-Access-Password')) {
      return new Response(null, {
        status: 200,
        headers: { 'x-middleware-next': '1' }
      });
    }

    // 登录验证
    const userPassword = request.headers.get('X-Access-Password');
    const correctPassword = process.env.ACCESS_PASSWORD;

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
    
    // 已登录的用户请求其他页面，放行
    if (isAuthenticated) {
      return new Response(null, {
        status: 200,
        headers: { 'x-middleware-next': '1' }
      });
    }
    
    // 重定向到登录页
    return Response.redirect(new URL('/login', request.url), 302);
  } catch (error) {
    console.error('中间件错误:', error);
    return new Response(null, {
      status: 200,
      headers: { 'x-middleware-next': '1' }
    });
  }
}
