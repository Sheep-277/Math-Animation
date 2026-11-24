<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import JXG from 'jsxgraph'
import { angleMin, angleMax, outerRadius, upperAngle } from './lesson'
const props = defineProps<{ polar?: boolean; theta: number; radius: number; area: boolean; boundaries: boolean; reversed: boolean }>()
const host = ref<HTMLDivElement>()
let board: ReturnType<typeof JXG.JSXGraph.initBoard> | undefined
const color = '#3269bd'
const accent = '#d57b34'
const sample = (a: number, b: number) => Array.from({length: 161}, (_, i) => a + (b-a)*i/160)
const radial = (theta: number, r: number) => [r*Math.cos(theta), r*Math.sin(theta)]
let resize: ResizeObserver | undefined
onMounted(() => {
  if (!host.value) return
  const polar = props.polar
  const zoom = { enabled: false, wheel: false }
  board = JXG.JSXGraph.initBoard(host.value, {
    boundingbox: polar ? [-.2, 1.85, 1.83, -.34] : [-.46, 1.52, 2.35, -.62],
    keepaspectratio: !polar, axis: false, showNavigation: false, showCopyright: false,
    pan: {enabled:false}, zoom,
  })
  const b = board
  const axes = {strokeColor:'#8292a7', strokeWidth:1, fixed:true, highlight:false, lastArrow:true}
  b.create('axis', [[0,0],[1,0]], {...axes, ticks:{visible:!polar, drawLabels:!polar, strokeColor:'#95a3b5', label:{fontSize:11, color:'#66788f'}}})
  b.create('axis', [[0,0],[0,1]], {...axes, ticks:{drawLabels:true, strokeColor:'#95a3b5', label:{fontSize:11, color:'#66788f'}}})
  const label = (x:number,y:number,value:string) => b.create('text',[x,y,value],{fixed:true, highlight:false, fontSize:13, color:'#53667f'})
  label(polar ? 1.7 : 2.13,.10,polar ? 'θ' : 'x')
  label(.06,polar ? 1.73 : 1.4,polar ? 'r' : 'y')
  if (polar) {
    label(angleMin-.07,-.14,'π/4')
    label(angleMax-.07,-.14,'π/2')
  }
  const angles = sample(angleMin,angleMax)
  const region = polar ? [[angleMin,0], ...angles.map(t => [t,outerRadius(t)]), [angleMin,0]]
    : [[0,0], ...angles.map(t => radial(t,outerRadius(t))), [0,0]]
  const curve = (points: number[][], attrs: Record<string,unknown>) => b.create('curve',[
    points.map(p=>p[0]!), points.map(p=>p[1]!),
  ],{fixed:true,highlight:false,...attrs})
  const fill = curve(region,{strokeWidth:0, fillColor:'#75a8eb',fillOpacity:.40, layer:2})
  const guides = polar ? [
    curve(angles.map(t=>[t,outerRadius(t)]),{strokeColor:color,strokeWidth:2}),
    curve([[angleMin,0],[angleMin,Math.SQRT2]],{strokeColor:color,strokeWidth:2}),
    curve([[angleMin,0],[angleMax,0]],{strokeColor:color,strokeWidth:2}),
    label(1.04,1.47,'r = 2 cos θ'),
  ] : [
    curve(sample(0,2*Math.PI).map(t=>[1+Math.cos(t),Math.sin(t)]),{strokeColor:'#8aa5c6',strokeWidth:1.5,dash:2}),
    curve([[-.4,-.4],[1.45,1.45]],{strokeColor:'#8aa5c6',strokeWidth:1.5,dash:2}),
    curve(angles.map(t=>radial(t,outerRadius(t))),{strokeColor:color,strokeWidth:2.5}),
    curve([[0,0],[1,1]],{strokeColor:color,strokeWidth:2.5}),
    label(1.34,1.18,'y = x'),
    label(1.43,.72,'(x − 1)² + y² = 1'),
  ]
  const slicePoints = () => {
    if (props.reversed) {
      const top = upperAngle(props.radius)
      return polar ? [[angleMin,props.radius],[top,props.radius]] : sample(angleMin,top).map(t=>radial(t,props.radius))
    }
    const max = outerRadius(props.theta)
    return polar ? [[props.theta,0],[props.theta,max]] : [[0,0],radial(props.theta,max)]
  }
  const slice = curve(slicePoints(),{strokeColor:accent,strokeWidth:2.5,layer:7})
  slice.updateDataArray = function () {
    const points = slicePoints()
    this.dataX = points.map(p=>p[0]!)
    this.dataY = points.map(p=>p[1]!)
  }
  b.create('point', [
    () => polar ? props.theta : props.radius*Math.cos(props.theta),
    () => polar ? props.radius : props.radius*Math.sin(props.theta),
  ],{name:'',size:4,strokeColor:'#fff',strokeWidth:2,fillColor:accent,fixed:true,highlight:false,layer:9})
  const update = () => {
    b.suspendUpdate()
    fill.setAttribute({visible:props.area})
    guides.forEach(g=>g.setAttribute({visible:props.boundaries}))
    b.unsuspendUpdate()
  }
  watch(()=>[props.theta,props.radius,props.area,props.boundaries,props.reversed],update)
  resize = new ResizeObserver(([entry]) => {
    if (entry && entry.contentRect.width && entry.contentRect.height) {
      b.resizeContainer(entry.contentRect.width,entry.contentRect.height,true)
      b.fullUpdate()
    }
  })
  resize.observe(host.value)
  update()
})
onBeforeUnmount(()=>{
  resize?.disconnect()
  if (board) JXG.JSXGraph.freeBoard(board)
})
</script>
<template><div ref="host" class="jxgbox graph" role="img" :aria-label="polar ? '极坐标参数平面' : '直角坐标积分区域'"></div></template>
