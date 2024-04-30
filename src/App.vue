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
let stream: MediaStream
let worklet: AudioWorkletNode
const startRecording = async () => {
  await ctx.resume()

  // mediaRecorder.start()

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // TODO: add toast message
    console.log('> getUserMedia supported')
    // const dest = ctx.createMediaStreamDestination()
    // mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' })

    // Configure MediaRecorder
    // let chunks: Blob[] = []
    // mediaRecorder.ondataavailable = (e) => {
    //   chunks.push(e.data)
    // }

    // mediaRecorder.onstop = () => {
    //   const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
    //   console.log(blob)
    //   if (blob.size === 0) {
    //     alert('Sound could not be recorded. The blob is empty.')
    //     return
    //   }
    //   let selectedSentence = sentences.value.find((s) => s.id === selectedSentenceID.value)
    //   if (selectedSentence) {
    //     selectedSentence.audio_src = window.URL.createObjectURL(blob)
    //     console.log('set audio srcd', selectedSentence.audio_src)
    //     sentences.value = sentences.value.slice()
    //   } else {
    //     alert('A sentence must be selected to record.')
    //   }

    //   chunks = []
    // }

    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = ctx.createMediaStreamSource(stream)

    ctx.audioWorklet
      .addModule('worklets/recording.js')
      .then(() => {
        worklet = new AudioWorkletNode(ctx, 'tato-audio-processor', {})

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

        worklet.port.onmessage = (e) => {
          console.log(e.data[0])
        }

        // Audio pipeline
        source.connect(gainNode)
        gainNode.connect(delayNode)
        delayNode.connect(compressorNode)
        compressorNode.connect(worklet)
        worklet.connect(ctx.destination)
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

const stopRecording = () => {
  stream.getTracks().forEach((track) => track.stop())
  worklet.disconnect()
  worklet.port.close()
  store.recordingState = RecordingState.Idle
  console.log('RECORDING STOPPED')
}

let selectedSentenceID = ref('')
const selectSentence = (e: Event) => {
  selectedSentenceID.value = (e.currentTarget as HTMLLIElement).getAttribute('data-id') || ''
}
</script>

<template>
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
  <!-- Header (Tatoeba/Github links) -->
</template>
