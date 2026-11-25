<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { bands, slices } from './polarBands'
import MathText from './Math.vue'
const reversed=ref(false), theta=ref(.9), radius=ref(.8), playing=ref(false)
const cut=computed(()=>slices(reversed.value?radius.value:theta.value,reversed.value))
const inside=computed(()=>slices(theta.value,false).some(([a,b])=>radius.value>=a && radius.value<=b))
const xy=(t:number,r:number,polar:boolean)=>polar ? [35+t*147,234-r*100] : [35+r*Math.cos(t)*100,234-r*Math.sin(t)*100]
const arc=(a:number,b:number,r:number,p:boolean)=>Array.from({length:65},(_,i)=>xy(a+(b-a)*i/64,r,p).join(','))
const shape=(band:typeof bands[number],p:boolean)=>[
  ...arc(band.angular[0],band.angular[1],band.radial[0],p),
  ...arc(band.angular[0],band.angular[1],band.radial[1],p).reverse(),
].join(' ')
const line=(a:number,b:number,p:boolean)=>reversed.value?arc(a,b,radius.value,p).join(' '):[xy(theta.value,a,p),xy(theta.value,b,p)].join(' ')
let frame=0, last=0
function stop(){cancelAnimationFrame(frame);playing.value=false;last=0}
function tick(now:number){
  if(last){
    const delta=Math.min(now-last,50)/2600
    if(reversed.value) radius.value=(radius.value+delta)%2.2
    else theta.value=(theta.value+delta)%(Math.PI/2)
  }
  last=now
  frame=requestAnimationFrame(tick)
}
function play(){if(playing.value){stop();return} playing.value=true;frame=requestAnimationFrame(tick)}
onUnmounted(stop)
const normal=String.raw`\int_0^{\pi/6}\int_{1/2}^{1}r\,dr\,d\theta+\int_{\pi/6}^{\pi/2}\left(\int_{1/2}^{1}r\,dr+\int_{3/2}^{2}r\,dr\right)d\theta`
const reverse=String.raw`\int_{1/2}^{1}\int_0^{\pi/2}r\,d\theta\,dr+\int_{3/2}^{2}\int_{\pi/6}^{\pi/2}r\,d\theta\,dr`
</script>
<template>
<main><section class="intro"><div class="eyebrow">考研数学二 / 二重积分</div><h1>一条射线，两段积分区间</h1><p>求图中两个圆环扇区的总面积。拖动射线，观察它进入、离开，再进入阴影的过程。</p></section>
<div class="section-head"><h2>同步切片</h2><div class="segmented"><button :aria-pressed="!reversed" @click="stop();reversed=false">先对 r 积分</button><button :aria-pressed="reversed" @click="stop();reversed=true">先对 θ 积分</button></div></div>
<div class="solid-grid bands-grid">
<article v-for="polar in [false,true]" :key="String(polar)" class="card chart"><div class="card-head"><h3>{{polar?'θ–r 参数平面':'xy 平面'}}</h3></div>
<svg viewBox="0 0 290 260" class="solid-view" role="img" :aria-label="polar?'极坐标分段区域':'圆环扇区'">
<path d="M20 234H275 M35 245V12" stroke="#72869e" fill="none"/>
<text x="269" y="225">{{polar?'θ':'x'}}</text><text x="44" y="22">{{polar?'r':'y'}}</text>
<polygon v-for="(band,i) in bands" :key="i" :points="shape(band,polar)" stroke="#3269bd" fill="#a5c9f2"/>
<polyline :points="line(0,reversed?Math.PI/2:2.2,polar)" stroke="#8495a8" stroke-dasharray="4 5" fill="none"/>
<polyline v-for="(interval,i) in cut" :key="i" :points="line(interval[0],interval[1],polar)" stroke="#c46b24" stroke-width="4" fill="none"/>
<circle :cx="xy(theta,radius,polar)[0]" :cy="xy(theta,radius,polar)[1]" r="5" :fill="inside?'#ad571a':'#fff'" stroke="#ad571a"/>
</svg></article></div>
<section class="card solid-controls"><label class="slider"><span>角度 θ <output>{{theta.toFixed(3)}} rad</output></span><input v-model.number="theta" type="range" min="0" :max="Math.PI/2" step="any" @input="stop"></label>
<label class="slider"><span>半径 r <output>{{radius.toFixed(3)}}</output></span><input v-model.number="radius" type="range" min="0" max="2.2" step="any" @input="stop"></label>
<button class="primary" @click="play">{{playing?'暂停':'播放扫描'}}</button>
<p>{{ cut.length ? cut.map(([a,b])=>'['+a.toFixed(3)+', '+b.toFixed(3)+']').join(' ∪ ') : '当前切片与阴影没有交集' }}</p>
</section>
<div class="formula card"><div><h3>面积的积分限</h3><MathText :tex="reversed?reverse:normal"/><p>每个累次积分均使用面积元 <MathText tex="r\,dr\,d\theta"/> 或 <MathText tex="r\,d\theta\,dr"/>，微分顺序随切片方向改变。</p><p>从 θ = π/6 起，外侧圆环扇区也被扫到。两段之间的空白半径不计入积分。</p></div></div>
</main>
</template>
<style scoped>
.bands-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.solid-view{display:block;width:100%;height:350px;background:#f3f7fb}
.solid-controls{padding:1rem;margin:1rem 0}
@media(max-width:720px){.bands-grid{grid-template-columns:1fr}}
</style>
