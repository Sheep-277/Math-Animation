<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
const PolarLesson=defineAsyncComponent(()=>import('./PolarLesson.vue'))
const Solids=defineAsyncComponent(()=>import('./Solids.vue'))
const PolarBands=defineAsyncComponent(()=>import('./PolarBands.vue'))
const SolidPractice=defineAsyncComponent(()=>import('./SolidPractice.vue'))
const PolarRegions=defineAsyncComponent(()=>import('./PolarRegions.vue'))
const tab=ref('solid')
const tabs=[['solid','旋转体'],['polar','二重积分'],['regions','区域题库'],['bands','分段切片'],['practice','交互练习']]
</script>
<template>
<header><div class="bar"><span class="brand"><span>∫</span> MathVision</span><nav class="segmented" aria-label="专题导航"><button v-for="[id,label] in tabs" :key="id" :aria-pressed="tab===id" @click="tab=id!">{{label}}</button></nav></div></header>
<PolarLesson v-if="tab==='polar'"/><PolarRegions v-else-if="tab==='regions'"/><PolarBands v-else-if="tab==='bands'"/><SolidPractice v-else-if="tab==='practice'"/><Solids v-else/>
<footer>MathVision · 考研数学二</footer>
</template>
