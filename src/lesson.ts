export const angleMin = Math.PI / 4
export const angleMax = Math.PI / 2
export const radiusMax = Math.SQRT2

export function outerRadius(theta: number) {
  return theta >= angleMax ? 0 : 2 * Math.cos(theta)
}

export function upperAngle(radius: number) {
  return Math.acos(Math.min(1, Math.max(0, radius / 2)))
}

export const steps = [
  { title: '识别区域', body: '配方得到圆心 (1, 0)、半径 1 的圆盘。取直线 y = x 上方与圆盘相交的部分，交点为 (0, 0) 和 (1, 1)。', tex: String.raw`(x-1)^2+y^2\le 1,\quad y\ge x` },
  { title: '确定角度', body: '从原点看，直线提供起始方向。圆盘位于右半平面，射线转到纵轴时只剩原点。', tex: String.raw`\frac{\pi}{4}\le\theta\le\frac{\pi}{2}` },
  { title: '确定半径', body: '固定角度，射线从原点进入区域，抵达圆周时离开。先把原点单独保留，再用 r > 0 化简圆周方程。', tex: String.raw`r^2\le 2r\cos\theta\implies 0\le r\le 2\cos\theta` },
  { title: '写出积分', body: '内层沿射线累加，外层转动射线。面积元包含雅可比因子 r。', tex: String.raw`dA=r\,dr\,d\theta` },
  { title: '交换次序', body: '固定 r，看参数平面的水平切片。左端始终是 π/4，右端始终由圆周给出，所以本题一段即可。左图对应一段以原点为圆心的圆弧。', tex: String.raw`0\le r\le\sqrt2,\quad \frac\pi4\le\theta\le\arccos(r/2)` },
]
