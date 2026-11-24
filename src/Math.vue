<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'
const props = defineProps<{ tex: string }>()
const html = computed(() => katex.renderToString(props.tex))
</script>
<template><span v-html="html"></span></template>
