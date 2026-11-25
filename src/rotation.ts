export type Span = [number, number]
export type Axis = 'x' | 'y'

export interface Region {
  name: string
  x: Span
  y: Span
  vertical: (x: number) => Span
  horizontal: (y: number) => Span
}

export const regions: Region[] = [
  { name: 'x² ≤ y ≤ x，0 ≤ x ≤ 1', x: [0, 1], y: [0, 1], vertical: x => [x*x, x], horizontal: y => [y, Math.sqrt(y)] },
  { name: 'x ≤ y ≤ √x，0 ≤ x ≤ 1', x: [0, 1], y: [0, 1], vertical: x => [x, Math.sqrt(x)], horizontal: y => [y*y, y] },
  { name: 'x² ≤ y ≤ 1，−1 ≤ x ≤ 1', x: [-1, 1], y: [0, 1], vertical: x => [x*x, 1], horizontal: y => [-Math.sqrt(y), Math.sqrt(y)] },
  { name: 'x ≤ y ≤ 2，0 ≤ x ≤ 2（由 x = 0 封闭）', x: [0, 2], y: [0, 2], vertical: x => [x, 2], horizontal: y => [0, y] },
]

export function radii([low, high]: Span): Span {
  return [low <= 0 && high >= 0 ? 0 : Math.min(Math.abs(low), Math.abs(high)), Math.max(Math.abs(low), Math.abs(high))]
}

export function integrate(f: (v: number) => number, [a,b]: Span, n = 4096) {
  let sum = f(a) + f(b)
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + (b-a)*i/n)
  return sum * (b-a)/(3*n)
}

export function section(region: Region, axis: Axis, position: number) {
  return axis === 'x' ? region.vertical(position) : region.horizontal(position)
}

export function volume(region: Region, axis: Axis) {
  return integrate(position => {
    const [r,R] = radii(section(region, axis, position))
    return Math.PI * (R*R-r*r)
  }, region[axis])
}

function affine(text: string): Span {
  const input = text.replace(/\s/g, '').replace(/−/g, '-')
  const number = '(?:\\d+(?:\\.\\d*)?|\\.\\d+)'
  const match = new RegExp('^([+-]?)(' + number + ')?\\*?x(?:([+-]' + number + '))?$').exec(input)
  if (match) return [(match[1] === '-' ? -1 : 1)*Number(match[2] ?? 1), Number(match[3] ?? 0)]
  if (new RegExp('^[+-]?' + number + '$').test(input)) return [0, Number(input)]
  throw new Error('自定义曲线目前支持 ax+b 和常数，例如 -0.5x+1。')
}

export function affineRegion(f: string, g: string, a: number, b: number): Region {
  if (!(a < b) || b-a < 1e-6 || Math.max(Math.abs(a),Math.abs(b)) > 100) throw new Error('请输入有效区间，端点绝对值最多 100。')
  const first = affine(f)
  const second = affine(g)
  const value = ([m,c]: Span, x: number) => m*x+c
  const ys = [value(first,a),value(first,b),value(second,a),value(second,b)]
  if (ys.some(y => !Number.isFinite(y) || Math.abs(y)>100)) throw new Error('函数值绝对值最多 100。')
  if (first[0] === second[0] && first[1] === second[1]) throw new Error('两条曲线重合，无法围成有面积的区域。')
  // A crossing can create two disconnected horizontal sections.
  if ((ys[0]!-ys[2]!)*(ys[1]!-ys[3]!) < 0) throw new Error('自定义曲线在区间内部相交。当前版本仅支持端点相交或区间内上下顺序固定。')
  const [lower,upper] = value(first,(a+b)/2) < value(second,(a+b)/2) ? [first,second] : [second,first]
  return {
    name: '两条直线及区间端点限定的区域', x: [a,b], y: [Math.min(...ys),Math.max(...ys)],
    vertical: x => [value(lower,x),value(upper,x)],
    horizontal(y) {
      let lo = a
      let hi = b
      for (const [m,c,target] of [[...lower,y], [-upper[0],-upper[1],-y]] as [number,number,number][]) {
        if (m > 0) hi = Math.min(hi, (target-c)/m)
        if (m < 0) lo = Math.max(lo, (target-c)/m)
      }
      return [lo,Math.max(lo,hi)]
    },
  }
}


export function sweptRadii([lo,hi]: Span, positive: boolean, negative: boolean): Span {
  if (positive && negative) return radii([lo,hi])
  if (positive) return [Math.max(0,lo),Math.max(0,hi)]
  if (negative) return [Math.max(0,-hi),Math.max(0,-lo)]
  return [0,0]
}

export function subtractSpan([lo,hi]: Span, [cutLo,cutHi]: Span): [Span,Span] {
  const leftEnd=Math.min(hi,Math.max(lo,cutLo))
  const rightStart=Math.max(leftEnd,Math.min(hi,cutHi))
  return [[lo,leftEnd],[rightStart,hi]]
}

export function shellIntervals(region: Region, axis: Axis, radius: number): Span[] {
  const direction=axis==='x'?'y':'x'
  const [low,high]=region[direction]
  const positions=radius===0?[0]:[-radius,radius]
  const spans=positions.filter(v=>v>=low && v<=high).map(v=>section(region,direction,v)).sort((a,b)=>a[0]-b[0])
  const first=spans[0], second=spans[1]
  if (first && second && second[0]<=first[1]) return [[first[0],Math.max(first[1],second[1])]]
  return spans
}
