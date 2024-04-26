<script setup lang="ts">
import { Sentence } from '../types/sentence'
import AudioVisualizer from './AudioVisualizer.vue'
import RecordButton from './RecordButton.vue'
import ExportToggle from './ExportToggle.vue'
import DownloadButton from './DownloadAllButton.vue'

const [id, sentenceText] = defineProps({
  id: { type: Number, required: true },
  sentenceText: { type: String, required: true }
})

const emit = defineEmits(['select-sentence'])
function click() {}
</script>

<template>
  <div id="{{ id }}" class="flex">
    <Sentence :id="id" :sentence="sentenceText" />
    <AudioVisualizer />
    <RecordButton />
    <ExportToggle />
    <DownloadButton />
  </div>
</template>
