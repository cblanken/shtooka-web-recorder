<script setup lang="ts">
import DownloadButton from './components/DownloadAllButton.vue'
import RecordButton from './components/RecordButton.vue'
import SentenceImporter from './components/SentenceImporter.vue'
import SentenceItem from './components/SentenceItem.vue'
import { Sentence } from './types/sentence'
import { ref } from 'vue'

const sentences = ref(new Array<Sentence>())

/*
 *  # AUDIO RECORDING AND PROCESSING
 *  1. Setup Audio Context
 *  2. Setup MediaRecorder
 *  3. Link nodes
 *  4. Process sound (volume -> cut silence before -> cut silence after)
 */

const ctx = new AudioContext()
const dest = ctx.createMediaStreamDestination()
let mediaRecorder: MediaRecorder, activeSentenceAudio: string
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  // TODO: add toast message
  console.log('> getUserMedia supported')
  mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' })

  // Configure MediaRecorder
  let chunks: Blob[] = []
  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data)
  }

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
    activeSentenceAudio = window.URL.createObjectURL(blob)
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      const source = ctx.createMediaStreamSource(stream)

      // Audio nodes
      let gain = document.querySelector('#audio-gain')?.value || 0.5
      const gainNode = new GainNode(ctx, {
        gain: gain
      })
      const delayNode = new DelayNode(ctx, {
        delayTime: 0,
        maxDelayTime: 1
      })
      const compressorNode = new DynamicsCompressorNode(ctx, {
        threshold: -50,
        knee: 40,
        ratio: 12,
        reduction: -20,
        attack: 0,
        release: 0.25
      })

      // Audio pipeline
      source.connect(gainNode)
      gainNode.connect(delayNode)
      delayNode.connect(compressorNode)
      compressorNode.connect(dest)

      // // Setup button to stop recording
      // let stop_btn = row.querySelector('.stop-btn')
      // stop_btn.addEventListener('click', (e) => {
      //   mediaRecorder.stop()
      //   console.log(`Recording stopped for: #${id}`)
      //   row.classList.remove('recording-active')
      // })

      // row.classList.add('recording-active')
      // mediaRecorder.start()
    })
    .catch((err) => {
      console.error(`> The following getUserMedia error occurred: ${err}`)
    })
} else {
  console.log('> getUserMedia is not supported in this browser')
  // Todo add toast message
}
</script>

<template>
  <header class="text-3xl">
    <h1>Tatoeba Web Recorder</h1>
    <!-- Tatoeba list URL or ID search -->
  </header>

  <main>
    <div class="flex gap-2">
      <RecordButton />
      <DownloadButton />
    </div>
    <SentenceImporter @add_sentences="(s: any[]) => (sentences = s)" />
    <table class="table" v-if="sentences.length > 0">
      <thead>
        <th>ID</th>
        <th>Sentence</th>
        <th>Audio</th>
        <th>Export</th>
      </thead>
      <tr v-for="sentence in sentences" :key="sentence.id">
        <SentenceItem :id="sentence.id" :text="sentence.text" />
      </tr>
    </table>
  </main>

  <!-- Render loaded sentence items -->

  <!-- Footer (Tatoeba/Github links) -->
</template>
