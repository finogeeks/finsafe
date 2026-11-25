<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ code: string }>()
const { isDark, lang } = useData()
const graph = computed(() => decodeURIComponent(props.code))
const svg = ref('')
const failed = ref(false)
const id = `diagram-${useId().replaceAll(':', '-')}`

async function renderDiagram() {
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: isDark.value ? 'dark' : 'neutral' })
    const result = await mermaid.render(id, graph.value)
    svg.value = result.svg
    failed.value = false
  } catch {
    svg.value = ''
    failed.value = true
  }
}

onMounted(renderDiagram)
watch(isDark, renderDiagram)
</script>

<template>
  <div class="documentation-diagram">
    <div v-if="svg" class="mermaid" v-html="svg" />
    <p v-if="failed" role="status">{{ lang === 'zh-CN' ? '图表暂时无法显示，请查看下方源码。' : 'Diagram unavailable. View the source below.' }}</p>
    <details :open="!svg">
      <summary>{{ lang === 'zh-CN' ? '流程图源码' : 'Diagram source' }}</summary>
      <pre><code>{{ graph }}</code></pre>
    </details>
  </div>
</template>
