<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { polarCases } from './polarBands'
import MathText from './Math.vue'
const index=ref(0), reversed=ref(false), theta=ref(0), radius=ref(.75), playing=ref(false)
const topic=computed(()=>polarCases[index.value]!)
const bounds=computed(()=>topic.value.angle)
const cut=computed(()=>reversed.value?topic.value.angular(radius.value):topic.value.radial(theta.value))
const tAt=(u:number)=>bounds.value[0]+u*(bounds.value[1]-bounds.value[0])
function project(t:number,r:number,polar:boolean){
  const scale=106/topic.value.maxRadius
  return polar?[30+240*(t-bounds.value[0])/(bounds.value[1]-bounds.value[0]),234-r*2*scale]:[150+r*Math.cos(t)*scale,125-r*Math.sin(t)*scale]
}
const sample=(f:(u:number)=>number[])=>Array.from({length:181},(_,i)=>f(i/180).join(','))
function outline(p:boolean){
  const edge=(side:0|1)=>sample(u=>project(tAt(u),topic.value.radial(tAt(u))[0]![side],p))
  return 'M'+edge(0).join(' L')+' L'+edge(1).reverse().join(' L')+' Z'
}
function trace(a:number,b:number,p:boolean){
  return reversed.value ? sample(u=>project(a+(b-a)*u,radius.value,p)).join(' ') : [project(theta.value,a,p),project(theta.value,b,p)].join(' ')
}
function choose(){stop();theta.value=tAt(.5);radius.value=topic.value.maxRadius*.67}
let frame=0,last=0
function stop(){cancelAnimationFrame(frame);playing.value=false;last=0}
function animate(now:number){
  if(last){
    const dt=Math.min(now-last,50)/4200
    if(reversed.value) radius.value=(radius.value+dt*topic.value.maxRadius)%topic.value.maxRadius
    else {
      const [lo,hi]=bounds.value
      theta.value=lo+(theta.value-lo+dt*(hi-lo))%(hi-lo)
    }
  }
  last=now;frame=requestAnimationFrame(animate)
}
function play(){if(playing.value){stop();return} playing.value=true;frame=requestAnimationFrame(animate)}
onUnmounted(stop)
</script>
<template>
<main><section class="intro"><div class="eyebrow">考研数学二 / 二重积分</div><h1>极坐标区域题库</h1><p>求阴影面积，并比较两种积分次序的积分限。</p></section>
<section class="problem"><label>区域 <select v-model.number="index" @change="choose"><option v-for="(item,i) in polarCases" :key="item.name" :value="i">{{item.name}}</option></select></label><MathText :tex="topic.problem"/></section>
<div class="section-head"><h2>同步切片</h2><div class="segmented"><button :aria-pressed="!reversed" @click="stop();reversed=false">先对 r 积分</button><button :aria-pressed="reversed" @click="stop();reversed=true">先对 θ 积分</button></div></div>
<div class="region-grid"><article v-for="polar in [false,true]" :key="String(polar)" class="card chart">
<div class="card-head"><h3>{{polar?'θ–r 参数平面':'xy 平面'}}</h3></div>
<svg viewBox="0 0 300 250" role="img" :aria-label="polar?'极坐标参数域':'直角坐标积分区域'">
<path :d="polar?'M30 234H280 M30 234V12':'M20 125H280 M150 238V12'" stroke="#8495a8"/>
<text :x="274" :y="polar?226:115">{{polar?'θ':'x'}}</text><text :x="polar?40:160" y="23">{{polar?'r':'y'}}</text>
<path :d="outline(polar)" fill="#a5c9f2" stroke="#3269bd" fill-rule="evenodd"/>
<polyline :points="trace(reversed?bounds[0]:0,reversed?bounds[1]:topic.maxRadius,polar)" fill="none" stroke="#8495a8" stroke-dasharray="4 5"/>
<polyline v-for="([a,b],i) in cut" :key="i" :points="trace(a,b,polar)" fill="none" stroke="#c46b24" stroke-width="4"/>
<circle :cx="project(theta,radius,polar)[0]" :cy="project(theta,radius,polar)[1]" r="5" fill="#c46b24" stroke="#fff"/>
</svg></article></div>
<section class="card region-controls"><label class="slider"><span>角度 θ <output>{{theta.toFixed(3)}} rad</output></span><input v-model.number="theta" type="range" :min="bounds[0]" :max="bounds[1]" step="any" @input="stop"></label>
<label class="slider"><span>半径 r <output>{{radius.toFixed(3)}}</output></span><input v-model.number="radius" type="range" min="0" :max="topic.maxRadius" step="any" @input="stop"></label><button class="primary" @click="play">{{playing?'暂停':'播放扫描'}}</button><p>{{cut.length?cut.map(([a,b])=>'['+a.toFixed(3)+', '+b.toFixed(3)+']').join(' ∪ '):'当前切片没有交集'}}</p></section>
<div class="formula card"><div><h3>面积积分</h3><MathText :tex="reversed?topic.reversed:topic.standard"/><p v-if="index===3 && !reversed">当 |θ| ≥ π/3 时，偏心圆提供径向上界。上式利用了关于 x 轴的对称性。</p></div></div>
</main>
</template>
<style scoped>
.region-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
svg{display:block;width:100%;height:350px;background:#f3f7fb}
.region-controls{padding:1rem;margin:1rem 0}
@media(max-width:720px){.region-grid{grid-template-columns:1fr}}
</style>
