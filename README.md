# 积分实验室

面向考研数学二冲刺复习的纯前端交互课。首题研究圆盘 x²+y² ≤ 2x 与半平面 y ≥ x 的交集。

## 本地运行

使用 Node.js 22.12 或更新版本的 LTS。项目不需要 Python、Conda 或后端。

```sh
npm install
npm run dev
npm run build
npm run preview
```

开发服务和构建预览分别输出本地访问地址。生产构建输出到 dist。

## 技术选型与页面架构

- [JSXGraph](https://www.jsxgraph.org/docs/) 支持几何元素、动态坐标和参数曲线，适合在两个画板上同时展示切片和对应点。本项目用它绘图。
- [Function Plot](https://github.com/mauriciopoppe/function-plot) 支持常见函数图、参数曲线及交互缩放。用于本项目时，几何对象和双图教学联动需要额外组织。
- Vue 管理唯一一份交互状态，KaTeX 渲染数学公式。桌面布局把直角坐标、参数平面和控制面板并排放置，推导与练习放在图形下方。
- src/lesson.ts 集中定义数学边界及讲解，src/Graph.vue 将同一组参数映射到两个画板，src/App.vue 管理操作、次序、公式及答题反馈。

## 数学校验

- 固定 θ 时，θ 从 π/4 到 π/2，r 从 0 到 2cosθ。参数平面上的竖线对应直角坐标中的射线段。
- 固定 r 时，r 从 0 到 √2，θ 从 π/4 到 arccos(r/2)。参数平面上的横线对应直角坐标中的圆弧，r = 0 时退化为原点。
- 两种次序都包含雅可比因子 r。被积函数为 1 时，面积为 π/4 − 1/2。

## 免费部署

- [Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/git-integration/) 推荐用于直接部署。连接仓库后将构建命令设为 npm run build，将输出目录设为 dist。[免费额度](https://developers.cloudflare.com/pages/platform/limits/)
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) 支持免费托管公开仓库，可用 [Vite 的 GitHub Actions 示例](https://vite.dev/guide/static-deploy.html#github-pages) 构建和发布 dist。项目已设置相对资源路径，可部署在仓库子路径。
