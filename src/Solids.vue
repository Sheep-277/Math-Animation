<script setup lang="ts">
import { computed, ref, shallowRef, onUnmounted } from 'vue'
import RotationMesh from './RotationMesh.vue'
import MathText from './Math.vue'
import { regions, radii, section, volume, shellIntervals, affineRegion, type Axis, type Region } from './rotation'
const choice=ref(0), axis=ref<Axis>('x'), angle=ref(360), position=ref(.5)
const slice=ref(true), wire=ref(false), transparent=ref(true), axes=ref(true), grid=ref(true), trail=ref(false)
const playing=ref(false), speed=ref(1), shell=ref(false)
const custom=shallowRef<Region>()
const f=ref('x+1'), g=ref('0'), start=ref(-1), end=ref(1), error=ref('')
const region=computed(()=>choice.value===-1?custom.value!:regions[choice.value]!)
function apply(){
  try {
    custom.value=affineRegion(f.value,g.value,start.value,end.value)
    choice.value=-1
    error.value=''
    center()
  } catch (cause) { error.value=(cause as Error).message }
}
const direction=computed(()=>shell.value ? (axis.value==='x'?'y':'x') : axis.value)
const domain=computed(()=>region.value[direction.value])
const bounds=computed(()=>section(region.value,direction.value,position.value))
const radius=computed(()=>radii(bounds.value))
const height=computed(()=>shellIntervals(region.value,axis.value,Math.abs(position.value)).reduce((sum,[lo,hi])=>sum+hi-lo,0))
const result=computed(()=>volume(region.value,axis.value))
const area=computed(()=>Math.PI*(radius.value[1]**2-radius.value[0]**2))
const fmt=(v:number)=>v.toFixed(5)
function center(){position.value=(domain.value[0]+domain.value[1])/2}
const extent=computed(()=>Math.max(...region.value.x.map(Math.abs),...region.value.y.map(Math.abs)))
const project=(x:number,y:number)=>[180+120*x/extent.value,145-120*y/extent.value].join(',')
const curves=computed(()=>[0,1].map(side=>Array.from({length:161},(_,i)=>{
  const [a,b]=region.value.x
  const x=a+(b-a)*i/160
  return project(x,region.value.vertical(x)[side]!)
})))
const polygon=computed(()=>[...curves.value[0]!,...curves.value[1]!.slice().reverse()].join(' '))
const cut=computed(()=>bounds.value.map(v=>direction.value==='x'?project(position.value,v):project(v,position.value)).join(' '))
function pick(event:PointerEvent){
  const transform=(event.currentTarget as SVGSVGElement).getScreenCTM()
  if(!transform) return
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(transform.inverse())
  const n=(direction.value==='x'?p.x-180:145-p.y)*extent.value/120
  position.value=Math.max(domain.value[0],Math.min(domain.value[1],n))
  slice.value=true
}
let frame=0,last=0
function stop(){cancelAnimationFrame(frame);last=0;playing.value=false}
function tick(now:number){
  if(last) angle.value=Math.min(360,angle.value+Math.min(now-last,50)*.1*speed.value)
  last=now
  if(angle.value>=360) stop()
  else frame=requestAnimationFrame(tick)
}
function play(){if(playing.value){stop();return} if(angle.value===360) angle.value=0;playing.value=true;frame=requestAnimationFrame(tick)}
function stage(i:number){stop();angle.value=[0,120,360,360][i]!;slice.value=i===3}
onUnmounted(stop)
const exact=computed(()=>choice.value!==0?'':axis.value==='x'
  ? shell.value?String.raw`2\pi\int_0^1 y(\sqrt y-y)\,dy=2\pi/15`:String.raw`\pi\int_0^1(x^2-x^4)\,dx=2\pi/15`
  : shell.value?String.raw`2\pi\int_0^1x(x-x^2)\,dx=\pi/6`:String.raw`\pi\int_0^1(y-y^2)\,dy=\pi/6`)
</script>
<template>
<main class="solid">
<section class="intro"><div class="eyebrow">考研数学二 / 定积分应用</div><h1>旋转体实验室</h1><p>拖动进度观察平面区域的扫掠过程，在二维图中选取切片，查看它旋转后的形状。</p></section>
<section class="problem"><label>题目 <select v-model.number="choice" @change="center"><option v-for="(item,i) in regions" :key="item.name" :value="i">{{item.name}}</option><option v-if="custom" :value="-1">自定义直线区域</option></select></label><label>旋转轴 <select v-model="axis" @change="center"><option value="x">X 轴</option><option value="y">Y 轴</option></select></label></section>
<details class="card solid-controls"><summary>输入自定义曲线</summary>
<form class="solid-row" @submit.prevent="apply">
<label>f(x) <input v-model="f" required size="10"></label><label>g(x) <input v-model="g" required size="10"></label>
<label>a <input v-model.number="start" type="number" step="any" required></label><label>b <input v-model.number="end" type="number" step="any" required></label>
<button class="primary">应用</button></form><p>支持直线 ax+b 和常数，两条曲线在区间内部需要保持上下顺序。</p><p v-if="error" role="alert">{{error}}</p></details>
<div class="section-head"><h2>几何观察</h2><div class="segmented"><button v-for="(name,i) in ['二维区域','旋转过程','完整实体','截面分析']" :key="name" @click="stage(i)">{{name}}</button></div></div>
<div class="solid-grid">
<article class="card chart"><div class="card-head"><h3>平面区域</h3><span>点击选取切片</span></div>
<svg viewBox="0 0 360 290" class="solid-view" @pointerdown="pick" aria-label="旋转体的原始平面区域" role="img">
<path d="M10 145H350 M180 8V282" stroke="#8198af"/>
<path :d="axis==='x'?'M10 145H350':'M180 8V282'" stroke="#7555a5" stroke-width="2"/>
<text x="338" y="136">x</text><text x="190" y="22">y</text>
<polygon :points="polygon" fill="#a5c9f2"/>
<polyline v-for="(curve,i) in curves" :key="i" :points="curve.join(' ')" stroke="#3269bd" stroke-width="2" fill="none"/>
<polyline v-if="slice" :points="cut" stroke="#d57b34" stroke-width="4"/>
</svg></article>
<article class="card chart"><div class="card-head"><h3>三维旋转体</h3><span>拖动视角 · 滚轮缩放</span></div>
<RotationMesh :region="region" :axis="axis" :degrees="angle" :position="position" :slice="slice" :shell="shell" :wire="wire" :transparent="transparent" :axes="axes" :grid="grid" :trail="trail"/>
</article></div>
<section class="card solid-controls">
<div class="solid-row"><button class="primary" @click="play">{{playing?'暂停':'开始旋转'}}</button><button @click="stage(0)">重置</button>
<label>速度 <select v-model.number="speed"><option :value=".5">0.5×</option><option :value="1">1×</option><option :value="2">2×</option></select></label>
<label>方法 <select v-model="shell" @change="center"><option :value="false">圆盘 / 圆环</option><option :value="true">柱壳</option></select></label></div>
<label class="slider"><span>扫掠进度 <output>{{angle.toFixed(0)}}°</output></span><input v-model.number="angle" type="range" min="0" max="360" @input="stop"></label>
<label class="slider"><span>切片位置 {{direction}} <output>{{fmt(position)}}</output></span><input v-model.number="position" type="range" :min="domain[0]" :max="domain[1]" :step="(domain[1]-domain[0])/500" @input="slice=true"></label>
<div class="solid-row"><label><input v-model="slice" type="checkbox"> 切片</label><label><input v-model="wire" type="checkbox"> 线框</label><label><input v-model="transparent" type="checkbox"> 半透明</label><label><input v-model="axes" type="checkbox"> 坐标轴</label><label><input v-model="grid" type="checkbox"> 网格</label><label><input v-model="trail" type="checkbox"> 轨迹</label></div>
</section>
<div class="formula card"><div><h3>{{shell?'柱壳':radius[0]===0?'圆盘':'圆环'}}</h3><p v-if="shell">半径 ≈ {{fmt(Math.abs(position))}}，总高度 ≈ {{fmt(height)}}。同一半径的两侧若有重叠，轴向区间取并集。</p><p v-else>{{ 'R ≈ '+fmt(radius[1])+'，r ≈ '+fmt(radius[0])+'，截面积 ≈ '+fmt(area) }}</p></div><div><h3>旋转一周的体积</h3><MathText v-if="exact" :tex="'V='+exact"/><p>V ≈ {{fmt(result)}}</p></div></div>
<section class="card solid-controls"><h3>常见错误</h3><p>截线穿过旋转轴时，截面包含轴心，内半径为零。把两端距离中的较小值当作内半径，会误挖掉一个圆盘。</p></section>
</main>
</template>
<style>
.solid-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.solid-view{width:100%;height:350px;display:block;background:#f3f7fb}
.solid-view canvas{display:block}
.solid-view p{padding:1rem}
.solid-controls{padding:1rem;margin:1rem 0}
.solid-row{display:flex;align-items:center;flex-wrap:wrap;gap:.8rem}
@media(max-width:720px){.solid-grid{grid-template-columns:1fr}}
</style>
