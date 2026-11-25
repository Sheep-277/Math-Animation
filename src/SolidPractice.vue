<script setup lang="ts">
import { computed, ref } from 'vue'
import MathText from './Math.vue'
const axis=ref('x'), method=ref(''), limits=ref(''), expression=ref(''), feedback=ref('')
const expected=computed(()=>axis.value==='x'?'圆环法':'柱壳法')
const termPattern=/^([+-])(?:(\d+)\*?)?x(?:\^([0-8]))?$/
function coefficients(input:string){
  const text=input.replace(/\s/g,'').replace(/−/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/⁴/g,'^4')
  if(text.length>100 || !text) return
  const signed=/^[+-]/.test(text)?text:'+'+text
  const terms=signed.match(/[+-][^+-]+/g)
  if(!terms || terms.join('')!==signed) return
  const result=Array<number>(9).fill(0)
  for(const term of terms){
    const match=termPattern.exec(term)
    if(!match) return
    const degree=Number(match[3]??1), coefficient=Number(match[2]??1)
    if(coefficient>10000) return
    result[degree]=result[degree]!+(match[1]==='-'?-1:1)*coefficient
  }
  return result
}
function check(){
  if(!method.value || !limits.value){feedback.value='请选择方法和积分限。';return}
  if(method.value!==expected.value || limits.value!=='0,1'){feedback.value='请观察竖直切片与旋转轴的关系，再检查区域在 x 轴上的投影。';return}
  const result=coefficients(expression.value)
  if(!result){feedback.value='方法和积分限正确。该表达式超出当前判定范围，可查看解析或输入展开后的多项式。';return}
  const correct=coefficients(axis.value==='x'?'x^2-x^4':'x^2-x^3')!
  feedback.value=result.every((n,i)=>n===correct[i])?'切片方法、积分限和被积函数均正确。':'切片方法和积分限正确。请检查被积函数的半径与高度。'
}
const answer=computed(()=>axis.value==='x'?String.raw`\pi\int_0^1(x^2-x^4)\,dx=\frac{2\pi}{15}`:String.raw`2\pi\int_0^1(x^2-x^3)\,dx=\frac{\pi}{6}`)
</script>
<template>
<main><section class="intro"><div class="eyebrow">考研数学二 / 随堂练习</div><h1>选择切片并写出积分</h1><p>取固定 x 的竖直线段，求区域绕选定坐标轴旋转一周的体积。</p><MathText tex="0\le x\le1,\quad x^2\le y\le x"/></section>
<form class="card practice" @submit.prevent="check" @input="feedback=''">
<p><label>旋转轴 <select v-model="axis"><option value="x">X 轴</option><option value="y">Y 轴</option></select></label></p>
<p><label>切片方法 <select v-model="method"><option value="">请选择</option><option>圆盘法</option><option>圆环法</option><option>柱壳法</option></select></label></p>
<p><label>积分限 <select v-model="limits"><option value="">请选择</option><option value="0,1">[0, 1]</option><option value="-1,1">[−1, 1]</option><option value="0,2">[0, 2]</option></select></label></p>
<p><label>被积函数 <MathText :tex="axis==='x'?'V=\\pi\\int_a^b F(x)\\,dx':'V=2\\pi\\int_a^b F(x)\\,dx'"/> 中的 F(x) <input v-model="expression" placeholder="输入展开后的多项式"></label></p>
<button class="primary">检查答案</button><p role="status">{{feedback}}</p>
<details><summary>查看答案与解析</summary><p>{{axis==='x'?'竖直截线垂直于 X 轴，外半径为 x，内半径为 x²。':'竖直截线平行于 Y 轴，柱壳半径为 x，高度为 x−x²。'}}</p><MathText :tex="answer"/></details></form></main>
</template>
