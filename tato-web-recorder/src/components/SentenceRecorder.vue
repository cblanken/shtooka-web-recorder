<script setup lang="ts">
import { Sentence } from '../types/sentence'
import AudioVisualizer from './AudioVisualizer.vue'
import RecordButton from './RecordButton.vue'
import ExportToggle from './ExportToggle.vue'
import DownloadButton from './DownloadAllButton.vue'

defineProps({
  id: { type: Number, required: true },
  sentenceText: { type: String, required: true }
})
</script>

<template>
  <div id="{{ id }}" class="flex">
    <Sentence :id="$props.id" :sentence="$props.sentenceText" />
    <AudioVisualizer />
    <RecordButton />
    <ExportToggle />
    <DownloadButton />
  </div>
</template>
