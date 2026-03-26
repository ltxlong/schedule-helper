import { serveDir } from "jsr:@std/http/file-server";

const ACCESS_PASSWORD = Deno.env.get("ACCESS_PASSWORD") ?? "";

function isStatic(pathname: string) {
  return pathname.startsWith("/assets/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".ico");
}

function isAuthenticated(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  return cookie.split(";").some((v) => v.trim() === "authenticated=true");
}

function serve(req: Request) {
  return serveDir(req, { fsRoot: "dist", quiet: true });
}

Deno.serve((req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const authed = isAuthenticated(req);

    // 静态资源和首页放行
    if (isStatic(path) || path === "/") return serve(req);

    // 已登录访问 /login -> 回首页
    if (authed && path === "/login") {
      return Response.redirect(new URL("/", req.url), 302);
    }

    // 未登录访问 /login 页面，放行
    if (path === "/login" && !req.headers.get("X-Access-Password")) {
      return serve(req);
    }

    // 登录校验
    const userPassword = req.headers.get("X-Access-Password");
    if (userPassword && ACCESS_PASSWORD && userPassword === ACCESS_PASSWORD) {
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          // 可选：服务端直接写登录cookie
          // "Set-Cookie": "authenticated=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400",
        },
      });
    }

    // 已登录放行
    if (authed) return serve(req);

    // 其他未登录跳转 /login
    return Response.redirect(new URL("/login", req.url), 302);
  } catch (error) {
    console.error("中间件错误:", error);
    return serve(req);
  }
});
