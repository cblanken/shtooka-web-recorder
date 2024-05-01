<script setup lang="ts">
import DownloadButton from '@/components/DownloadAllButton.vue'
import RecordButton from '@/components/RecordButton.vue'
import SentenceImporter from '@/components/SentenceImporter.vue'
import SentenceItem from '@/components/SentenceItem.vue'
import { Sentence } from '@/types/sentence'
import { RecordingState } from '@/types/audio'
import { ref } from 'vue'
import { store } from '@/store'

const sentences = ref(new Array<Sentence>())

/*
 *  # AUDIO RECORDING AND PROCESSING
 *  1. Setup Audio Context
 *  2. Setup MediaRecorder
 *  3. Link nodes
 *  4. Process sound (volume -> cut silence before -> cut silence after)
 */

const ctx = new AudioContext()
// let mediaRecorder: MediaRecorder
let microphone: MediaStream
let recorder: AudioWorkletNode
let chunks: BlobPart[] = []
const startRecording = async () => {
  await ctx.resume()
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log('> getUserMedia supported')
    microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = ctx.createMediaStreamSource(microphone)

    ctx.audioWorklet
      .addModule('worklets/recording.js')
      .then(() => {
        recorder = new AudioWorkletNode(ctx, 'tato-audio-recorder', {})

        // Audio nodes
        let gainElement = document.querySelector('#audio-gain') as HTMLInputElement
        let gain: number = parseInt(gainElement?.value) || 0.5
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
          // reduction: -20,
          attack: 0,
          release: 0.25
        })

        recorder.port.onmessage = (e) => {
          if (e.data.command === 'exportWAVData') {
            console.log('MAIN THREAD EXPORTED WAV')
            let blob = new Blob([e.data.dataview], { type: e.data.type })
            saveWav(blob)
          }
        }

        // Audio pipeline
        source.connect(gainNode)
        gainNode.connect(delayNode)
        delayNode.connect(compressorNode)
        compressorNode.connect(recorder)
        recorder.connect(ctx.destination)

        recorder.port.postMessage({ command: 'init', config: { sampleRate: ctx.sampleRate } })
        recorder.port.postMessage({ command: 'start' })
      })
      .catch((err) => {
        console.error(`> The following getUserMedia error occurred: ${err}`)
      })
  } else {
    console.log('> getUserMedia is not supported in this browser')
    // Todo add toast message
  }

  store.recordingState = RecordingState.Recording
  console.log('RECORDING STARTED', ctx.state)
}

const exportWAV = (mimeType: string = 'audio/wav') => {
  recorder.port.postMessage({ command: 'exportWAV', type: mimeType })
}

const saveWav = (blob: Blob) => {
  if (blob.size === 0) {
    alert('Sound file could not be saved. No recorded data.')
    return
  }
  let selectedSentence = sentences.value.find((s) => s.id === selectedSentenceID.value)
  if (selectedSentence) {
    selectedSentence.audio_src = window.URL.createObjectURL(blob)
    sentences.value = sentences.value.slice()
  } else {
    alert('A sentence must be selected to record.')
  }
}

const stopRecording = () => {
  microphone.getTracks().forEach((track) => track.stop())
  exportWAV()
  recorder.disconnect()
  recorder.port.postMessage({ command: 'stop' })
  store.recordingState = RecordingState.Idle
}

let selectedSentenceID = ref('')
const selectSentence = (e: Event) => {
  selectedSentenceID.value = (e.currentTarget as HTMLLIElement).getAttribute('data-id') || ''
}
</script>

<template>
  <!-- Header (Tatoeba/Github links) -->
  <header class="text-3xl">
    <h1>Tatoeba Web Recorder</h1>
    <!-- Tatoeba list URL or ID search -->
  </header>

  <main>
    <div class="flex gap-2">
      <RecordButton
        @start="startRecording"
        @stop="stopRecording"
        :recordingState="store.recordingState"
      />
      <DownloadButton />
    </div>
    <SentenceImporter
      @add_sentences="
        (s: any[]) => {
          sentences = s
          selectedSentenceID = s[0].id
        }
      "
    />
    <table class="table" v-if="sentences.length > 0">
      <thead>
        <th>ID</th>
        <th>Sentence</th>
        <th>Audio</th>
        <th>Export</th>
        <th>Download</th>
      </thead>
      <tbody>
        <SentenceItem
          :class="selectedSentenceID === sentence.id ? 'selected-sentence' : ''"
          @click="selectSentence"
          v-for="sentence in sentences"
          :key="sentence.id"
          :id="sentence.id"
          :text="sentence.text"
          :audioSrc="sentence.audio_src"
        />
      </tbody>
    </table>
  </main>
</template>
