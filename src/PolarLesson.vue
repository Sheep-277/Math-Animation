<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import Graph from './Graph.vue'
import MathText from './Math.vue'
import { angleMin, angleMax, outerRadius, radiusMax, upperAngle, steps } from './lesson'

const step = ref(0)
const reversed = ref(false)
const outer = ref(.24)
const inner = ref(.65)
const area = ref(true)
const boundaries = ref(true)
const playing = ref(false)
const speed = ref(1)
const radius = computed(() => reversed.value ? outer.value*radiusMax : inner.value*outerRadius(thetaFromOuter.value))
const thetaFromOuter = computed(() => angleMin+outer.value*(angleMax-angleMin))
const theta = computed(() => reversed.value ? angleMin+inner.value*(upperAngle(radius.value)-angleMin) : thetaFromOuter.value)
const fixed = (n:number) => n.toFixed(3)
const x = computed(()=>radius.value*Math.cos(theta.value))
const y = computed(()=>radius.value*Math.sin(theta.value))
const integrand = String.raw`f(r\cos\theta,r\sin\theta)\,r`
const standard = String.raw`\int_{\pi/4}^{\pi/2}\int_0^{2\cos\theta}`+integrand+String.raw`\,dr\,d\theta`
const swapped = String.raw`\int_0^{\sqrt2}\int_{\pi/4}^{\arccos(r/2)}`+integrand+String.raw`\,d\theta\,dr`
const slice = computed(()=>reversed.value
  ? String.raw`r\approx ${fixed(radius.value)},\quad \frac\pi4\le\theta\le\arccos(r/2)\approx ${fixed(upperAngle(radius.value))}`
  : String.raw`\theta\approx ${fixed(theta.value)},\quad 0\le r\le 2\cos\theta\approx ${fixed(outerRadius(theta.value))}`)
let frame = 0
let last: number | undefined
function tick(now:number) {
  if (last !== undefined) {
    const next = inner.value + Math.min(now-last,50)*speed.value/2300
    if (next >= 1) {
      outer.value = (outer.value+.025)%1
      inner.value = 0
    } else inner.value = next
  }
  last = now
  frame = requestAnimationFrame(tick)
}
function pause() { playing.value=false; cancelAnimationFrame(frame); last=undefined }
function togglePlay() {
  if (playing.value) return pause()
  playing.value=true
  frame=requestAnimationFrame(tick)
}
function reset() { pause(); step.value=0; reversed.value=false; outer.value=.24; inner.value=.65; speed.value=1; area.value=true; boundaries.value=true }
function setOrder(value:boolean) {
  if (value===reversed.value) return
  pause()
  const t=theta.value, r=radius.value
  reversed.value=value
  const width = value ? upperAngle(r)-angleMin : outerRadius(t)
  outer.value=Math.max(0,Math.min(1,value ? r/radiusMax : (t-angleMin)/(angleMax-angleMin)))
  inner.value=width>1e-12 ? Math.max(0,Math.min(1,value ? (t-angleMin)/width : r/width)) : 0
}
function selectStep(index:number) { step.value=index; setOrder(index===4) }
function move(which:'theta'|'radius', event:Event) {
  pause()
  const value=Number((event.target as HTMLInputElement).value)
  if ((which==='radius')===reversed.value) outer.value=value
  else inner.value=value
}
onBeforeUnmount(pause)
const answer = ref('')
const feedback = ref('')
const correct = ref(false)
function check() {
  correct.value=answer.value==='b'
  feedback.value=correct.value ? '正确。固定 r 后，圆周条件给出 θ 的上限。'
    : answer.value ? '再试一次。把 r ≤ 2cosθ 除以 2，再利用 cosθ 在此区间递减。' : '请先选择一个答案。'
}
</script>

<template>
<main>
  <section class="intro">
    <div class="eyebrow">考研数学二 / 二重积分</div>
    <h1>从直角坐标到极坐标</h1>
    <p>拖动角度和半径，观察同一个点在两张图上的位置，再试着交换积分次序。</p>
  </section>
  <section class="problem">
    <div><strong>本节例题</strong><p>将区域 D 上的二重积分写成极坐标累次积分。</p></div>
    <MathText tex="D=\{(x,y)\mid x^2+y^2\le 2x,\ y\ge x\}" />
  </section>
  <section id="explore">
    <div class="section-head"><h2>交互探索</h2><div class="segmented" aria-label="积分次序"><button :aria-pressed="!reversed" @click="setOrder(false)">先 r 后 θ</button><button :aria-pressed="reversed" @click="setOrder(true)">先 θ 后 r</button></div></div>
    <div class="workspace">
      <article v-for="polar in [false,true]" :key="String(polar)" class="card chart">
        <div class="card-head"><h3>{{ polar ? '极坐标参数平面' : '直角坐标平面' }}</h3><MathText :tex="polar ? '(\\theta,r)' : '(x,y)'" /></div>
        <Graph :polar="polar" :theta="theta" :radius="radius" :area="area" :boundaries="boundaries" :reversed="reversed" />
        <div class="readout"><MathText :tex="polar ? '\\theta\\approx '+fixed(theta)+',\\quad r\\approx '+fixed(radius) : 'x\\approx '+fixed(x)+',\\quad y\\approx '+fixed(y)" /></div>
      </article>
      <aside class="card controls">
        <h3>参数控制</h3>
        <label class="slider"><span>角度 θ <output>{{ fixed(theta) }} rad</output></span><input type="range" min="0" max="1" step="0.001" :value="reversed ? inner : outer" @input="move('theta',$event)"><small>{{ reversed ? 'π/4 → arccos(r/2)' : 'π/4 → π/2' }}</small></label>
        <label class="slider"><span>半径 r <output>{{ fixed(radius) }}</output></span><input type="range" min="0" max="1" step="0.001" :value="reversed ? outer : inner" @input="move('radius',$event)"><small>{{ reversed ? '0 → √2' : '0 → 2cosθ' }}</small></label>
        <div class="buttons"><button class="primary" @click="togglePlay">{{ playing ? 'Ⅱ 暂停' : '▷ 播放' }}</button><button @click="reset">↺ 重置</button></div>
        <label class="speed">动画速度<select v-model.number="speed"><option :value=".5">0.5×</option><option :value="1">1×</option><option :value="2">2×</option></select></label>
        <div class="checks"><label><input v-model="area" type="checkbox"> 区域填充</label><label><input v-model="boundaries" type="checkbox"> 边界与方程</label></div>
      </aside>
    </div>
    <div class="legend"><span><i></i> 积分区域 D</span><span><i></i> {{ reversed ? '固定 r 的切片' : '固定 θ 的切片' }}</span><span><i></i> 当前对应点</span></div>
    <div class="formula card"><div><h3>当前切片</h3><MathText :tex="slice" /></div><div><h3>累次积分</h3><MathText :tex="reversed ? swapped : standard" /></div></div>
  </section>
  <section id="lesson">
    <div class="section-head"><h2>步骤讲解</h2></div>
    <div class="card lesson">
      <div class="step-list" aria-label="讲解步骤"><button v-for="(item,index) in steps" :key="item.title" :aria-pressed="step===index" @click="selectStep(index)"><span>{{ index+1 }}</span>{{ item.title }}</button></div>
      <div class="step-body"><h3>{{ steps[step]!.title }}</h3><p>{{ steps[step]!.body }}</p><MathText :tex="steps[step]!.tex" />
        <div class="step-nav"><button :disabled="step===0" @click="selectStep(step-1)">上一步</button><button :disabled="step===steps.length-1" @click="selectStep(step+1)">下一步</button></div>
      </div>
    </div>
    <div class="notes">
      <article class="card"><h3>直角坐标下如何换序？</h3><p>竖切时，底端是直线，顶端是上半圆。横切时，左端是左半圆，右端是直线。两种切法的外层投影都是 [0, 1]。</p><p><MathText tex="0\le x\le1,\quad x\le y\le\sqrt{2x-x^2}" /></p><p><MathText tex="0\le y\le1,\quad 1-\sqrt{1-y^2}\le x\le y" /></p></article>
      <article class="card"><h3>常见错误</h3><p>把 r 的上限写成 1，会把圆心到圆周的距离误当成原点到圆周的距离。拖到 θ = π/4，能看到射线终点在 (1, 1)，此时 r = √2。</p><p>面积元漏掉 r 也会改变结果。用被积函数 1 检查，本题面积为 π/4 − 1/2。</p></article>
      <article class="card"><h3>什么时候要分段？</h3><p>对照单位圆盘内 x ≤ 1/2 的部分。固定 y 后，右端是圆周和直线给出的两个上限中较小的一个。</p><MathText tex="x_{\max}=\min\{1/2,\sqrt{1-y^2}\}" /><p>当 |y| ≤ √3/2 时，右端落在直线上。其余两段落在圆周上，因此用单条边界方程逐段写时要在 y = ±√3/2 处分段。</p></article>
    </div>
  </section>
  <section id="practice">
    <div class="section-head"><h2>随堂练习</h2></div>
    <form class="card practice" @submit.prevent="check">
      <fieldset><legend>先对 θ 积分时，固定 r 的角度范围是什么？</legend>
        <label v-for="[key,tex] in [['a','0\\le\\theta\\le\\arccos(r/2)'],['b','\\pi/4\\le\\theta\\le\\arccos(r/2)'],['c','\\pi/4\\le\\theta\\le\\pi/2']]" :key="key"><input v-model="answer" type="radio" name="bounds" :value="key" @change="feedback=''"><MathText :tex="tex!" /></label>
      </fieldset>
      <button class="primary" type="submit">检查答案</button><p v-if="feedback" role="status" :class="{correct}">{{ feedback }}</p>
      <details><summary>查看完整答案</summary><p>半径达到最大值 √2 时，角度范围缩成 π/4。换序后的积分为</p><MathText :tex="swapped" /></details>
    </form>
  </section>
</main>

</template>
