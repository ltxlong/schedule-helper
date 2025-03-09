# 排班表助手

一个用于快捷管理虚拟主播排班的 Web 应用。

## 功能特点

- 支持周排班和月排班
- 可自定义排班表样式和主题
- 数据保存在浏览器本地
- 支持模板管理（包含导出/导入模板）
- 支持历史管理
- 支持主播管理（包含导出/导入成员）
- 支持拖拽表格
- 支持放缩表格
- 支持背景设置
- 支持导出图片
- 支持编辑格子（点击格子）
- 支持右键菜单（格子右键：合并格子和恢复格子）
- 支持合并格子（ctrl + 鼠标左键滑动，然后右键选合并）
- 支持休印显示（设置字体大小的时候，休印大小也会随着变化）
- 支持免费商业的阿里和鸿蒙字体
- 支持部署到cloudflare和vercel
- 响应式设计，适配各种设备（手机端适配不太好，还是推荐在PC端使用）

注意：如果导出的图片有点糊或者不满意的话，可以截图（如Snipaste截图工具）
更多：可以使用Snipaste截图工具，通过贴图的方式，贴图（类似挂件）后再截图

## 技术栈

- Vue 3
- Element Plus
- Tailwind CSS
- HTML2Canvas
- Vue Router
- VueDraggable

## 开发环境设置

安装依赖
```bash
npm install
```

启动开发服务器（本地部署，登录密码在.env配置VITE_ACCESS_PASSWORD）
```bash
npm run dev
```

## 云部署设置

部署到 Cloudflare Pages / vercel
- 在 Cloudflare Pages / vercel 中创建新项目
- 连接 Git 仓库，并且选择本项目
- 设置构建命令：`npm run build` （vercel部署的时候默认了，无需再手动设置）
- 设置构建输出目录：`dist`  （vercel部署的时候默认了，无需再手动设置）
- 添加环境变量（配置登录密码）：
  - `ACCESS_PASSWORD`
