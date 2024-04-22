<script setup lang="ts">
import Sentence from './Sentence.vue'
import AudioVisualizer from './AudioVisualizer.vue'
import RecordButton from './RecordButton.vue'
import ExportToggle from './ExportToggle.vue'
import DownloadButton from './DownloadButton.vue'

const [id, sentenceText] = defineProps({
  id: { type: Number, required: true },
  sentenceText: { type: String, required: true }
})
</script>

<template>
  <div class="flex">
    <Sentence :id="id" :sentence="sentenceText" />
    <AudioVisualizer />
    <RecordButton />
    <ExportToggle />
    <DownloadButton />
  </div>
</template>
