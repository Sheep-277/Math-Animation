# MathVision

面向考研数学二的交互式数学可视化网站。包含旋转体、二重积分、极坐标区域题库、分段切片和交互练习。

## 本地运行

```powershell
npm ci
npm run dev
npm test
npm run build
```

Vite 将静态文件输出到 `dist/`。项目依赖在 npm 管理范围内，运行无需 Python 或后端。仓库保留 GitHub Pages 工作流。

## 数学模型与代码位置

- `src/rotation.ts` 定义竖直和水平截线、到轴的径向区间、柱壳区间并集和体积计算。跨轴截面包含轴心，所以内半径取零。
- `src/RotationMesh.vue` 使用 Three.js 的缓冲网格生成按角度展开的曲面。跨轴扫掠在角度重叠处取并集，角向封口取相邻径向区间的差。OrbitControls 提供视角操作。
- `src/lesson.ts` 和 `src/PolarLesson.vue` 保留圆与直线的原始例题和 JSXGraph 双视图。`src/polarBands.ts` 定义其余区域的解析切片，供两张同步图和换序说明使用。
- `src/SolidPractice.vue` 按多项式系数检查展开后的等价答案。超出支持范围的输入会提示无法可靠判定。
- `tests/rotation.test.mjs` 覆盖两条旋转轴的基准体积、跨轴与空心截面、部分扫掠、柱壳并集、偏心圆、相交圆、极坐标换序和多段区间。

自定义边界支持常数与仿射函数，区间内上下顺序需固定；预设还包含二次函数和平方根。数值体积以辛普森公式求近似值，基准例题另提供解析值。三维表面采用有限采样构造，数学截面由解析边界求得。首次浏览器检查使用 Windows Edge 无头模式与软件 WebGL，覆盖播放暂停、切换旋转轴、极坐标区间和多项式判题。

## 技术调研

JSXGraph 适用于交互坐标系，精度由独立数学模型和采样决定。Vue 计算属性共享状态并缓存推导值。KaTeX 渲染教学公式，播放使用原生帧时间。Three.js 直接生成网格，支持视角操作和透明材质。数学可视化开源参考包括 JSXGraph 示例与基于 Three.js 的 MathBox。

[Vite 静态部署](https://vite.dev/guide/static-deploy.html) · [Vue 计算属性](https://vuejs.org/guide/essentials/computed) · [JSXGraph 示例](https://jsxgraph.org/share/) · [Three.js BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html) · [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html) · [MathBox](https://github.com/unconed/mathbox) · [KaTeX](https://katex.org/docs/security)
