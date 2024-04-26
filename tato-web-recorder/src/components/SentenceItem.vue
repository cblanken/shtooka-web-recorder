<script setup lang="ts">
const props = defineProps({
  id: { type: Number, required: true },
  sentenceText: { type: String, required: true }
})
</script>

<template>
  <div class="flex items-center gap-4 py-2 px-1 hover:bg-green-700">
    <input class="w-5 h-5" type="checkbox" />
    <div class="text-white">{{ $props.id }}</div>
    <div class="selection:bg-transparent">{{ $props.sentenceText }}</div>
  </div>
</template>
