export const bands = [
  { radial: [0.5, 1], angular: [0, Math.PI / 2] },
  { radial: [1.5, 2], angular: [Math.PI / 6, Math.PI / 2] },
] as const

export function slices(value: number, reversed: boolean) {
  const fixed = reversed ? 'radial' : 'angular'
  const varying = reversed ? 'angular' : 'radial'
  return bands.filter(b => value >= b[fixed][0] && value <= b[fixed][1]).map(b => b[varying])
}

type Interval = readonly [number, number]
interface PolarCase {
  name: string
  problem: string
  angle: Interval
  maxRadius: number
  radial: (theta: number) => readonly Interval[]
  angular: (radius: number) => readonly Interval[]
  standard: string
  reversed: string
}
const turn=2*Math.PI
const disk=(inner:number,name:string):PolarCase=>({
  name, problem: inner ? '1/4\\le x^2+y^2\\le1' : 'x^2+y^2\\le1',
  angle:[0,turn],maxRadius:1,
  radial:()=>[[inner,1]],angular:r=>r>=inner && r<=1?[[0,turn]]:[],
  standard:'\\int_0^{2\\pi}\\int_{'+inner+'}^1r\\,dr\\,d\\theta',
  reversed:'\\int_{'+inner+'}^1\\int_0^{2\\pi}r\\,d\\theta\\,dr',
})
const half=(a:number):Interval=>[-a,a]
export const polarCases:PolarCase[]=[
  disk(0,'单位圆域'),disk(.5,'同心圆环'),
  {name:'偏心圆',problem:'(x-2)^2+y^2\\le1',angle:half(Math.PI/6),maxRadius:3,
    radial:t=>{
      const d=Math.sqrt(Math.max(0,1-4*Math.sin(t)**2))
      return [[2*Math.cos(t)-d,2*Math.cos(t)+d]]
    },
    angular:r=>r<1||r>3?[]:[half(Math.acos(Math.min(1,(r*r+3)/(4*r))))],
    standard:String.raw`\int_{-\pi/6}^{\pi/6}\int_{2\cos\theta-\sqrt{1-4\sin^2\theta}}^{2\cos\theta+\sqrt{1-4\sin^2\theta}}r\,dr\,d\theta`,
    reversed:String.raw`\int_1^3\int_{-\arccos((r^2+3)/(4r))}^{\arccos((r^2+3)/(4r))}r\,d\theta\,dr`,
  },
  {name:'两圆相交',problem:String.raw`x^2+y^2\le1,\quad(x-1)^2+y^2\le1`,angle:half(Math.PI/2),maxRadius:1,
    radial:t=>[[0,Math.max(0,Math.min(1,2*Math.cos(t)))]],
    angular:r=>r>1?[]:[half(Math.acos(r/2))],
    standard:String.raw`2\int_0^{\pi/3}\int_0^1r\,dr\,d\theta+2\int_{\pi/3}^{\pi/2}\int_0^{2\cos\theta}r\,dr\,d\theta`,
    reversed:String.raw`\int_0^1\int_{-\arccos(r/2)}^{\arccos(r/2)}r\,d\theta\,dr`,
  }
]
