<script setup lang="ts">
import ExportButton from '@/components/DownloadAllButton.vue'
import RecordButton from '@/components/RecordButton.vue'
import SentenceImporter from '@/components/SentenceImporter.vue'
import SentenceItem from '@/components/SentenceItem.vue'
import { Sentence } from '@/types/sentence'
import { RecordingState } from '@/types/audio'
import { ref } from 'vue'
import { store } from '@/store'
import * as zip from '@zip.js/zip.js'
import { SpeexWorkletNode, loadSpeex } from '@sapphi-red/web-noise-suppressor'
import speexWorkletPath from '@sapphi-red/web-noise-suppressor/speexWorklet.js?url'
import speexWasmPath from '@sapphi-red/web-noise-suppressor/speex.wasm?url'

const sentences = ref(new Array<Sentence>())
let selectedSentenceID = ref()
const exportURL = ref()
const exportAnchor = ref()

/*
 *  # AUDIO RECORDING AND PROCESSING
 *  1. Setup Audio Context
 *  2. Setup MediaRecorder
 *  3. Link nodes
 *  4. Process sound (volume -> cut silence before -> cut silence after)
 */

const ctx = new AudioContext()
let microphone: MediaStream
let recorder: AudioWorkletNode

// Audio nodes
const gainNode = new GainNode(ctx, {
  gain: store.defaultGain
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

window.onbeforeunload = () => {
  return confirm()
}

const startRecording = async () => {
  if (!selectedSentenceID.value) {
    alert(
      `A sentence must be selected to begin recording. Please upload a sentence file if you have not does so already.`
    )
    return
  } else if (sentences.value.find((s) => s.id === selectedSentenceID.value)?.audio_src) {
    if (
      !confirm(
        "A recording already exists for this sentence.\n\
        Are you sure you'd like to replace it?"
      )
    ) {
      return
    }
  }

  // Setup noise suppression
  const speexWasmBinary = await loadSpeex({ url: String(speexWasmPath) })
  await ctx.audioWorklet.addModule(String(speexWorkletPath))
  const speex = new SpeexWorkletNode(ctx, {
    wasmBinary: speexWasmBinary,
    maxChannels: 2
  })

  await ctx.resume()
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log('> getUserMedia supported')
    microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = ctx.createMediaStreamSource(microphone)

    ctx.audioWorklet
      .addModule('worklets/recording.js')
      .then(async () => {
        // Setup recorder
        recorder = new AudioWorkletNode(ctx, 'tato-audio-recorder', {})
        recorder.port.onmessage = (e) => {
          if (e.data.command === 'exportWAVData') {
            let blob = new Blob([e.data.dataview], { type: e.data.type })
            createSelectedSentenceRecording(blob)
          }
        }
        recorder.port.postMessage({ command: 'init', config: { sampleRate: ctx.sampleRate } })
        recorder.port.postMessage({ command: 'start' })

        // Update gain
        let gainElement = document.querySelector('#audio-gain') as HTMLInputElement
        if (gainElement && gainElement.value) {
          gainNode.gain.value = parseInt(gainElement?.value)
        }

        // Audio pipeline
        source.connect(recorder).connect(speex).connect(ctx.destination)
      })
      .catch((err) => {
        console.error(`Unable to preprocess audio. Error: ${err}`)
      })
  } else {
    console.log('> getUserMedia is not supported in this browser')
    // Todo add toast message
  }

  store.recordingState = RecordingState.Recording
}

const exportWAV = (mimeType: string = 'audio/wav') => {
  recorder.port.postMessage({ command: 'exportWAV', type: mimeType })
}

const createSelectedSentenceRecording = (blob: Blob) => {
  // Update link to audio file blob
  if (blob.size === 0) {
    alert('Sound file could not be saved. No recorded data.')
    return
  }
  let selectedSentence = sentences.value.find((s) => s.id === selectedSentenceID.value)
  if (selectedSentence) {
    // Free existing ObjectURL if a recording already exists for the target sentence
    if (selectedSentence.audio_src) {
      URL.revokeObjectURL(selectedSentence.audio_src)
    }

    // Update sentence data and recording URL
    selectedSentence.audio_src = window.URL.createObjectURL(blob)
    selectedSentence.export_enabled = true
    sentences.value = sentences.value.slice()
  } else {
    alert(`The sentence with id ${selectedSentenceID.value} could not be found.`)
  }
}

const stopRecording = () => {
  microphone.getTracks().forEach((track) => track.stop())
  exportWAV()
  recorder.disconnect()
  recorder.port.postMessage({ command: 'stop' })
  store.recordingState = RecordingState.Idle
}

const selectSentence = (e: Event) => {
  selectedSentenceID.value = (e.currentTarget as HTMLLIElement).getAttribute('data-id') || ''
}

const toggleSentenceExportCheckbox = (id: string) => {
  let sentence = sentences.value.find((s) => s.id === id)
  if (sentence) {
    sentence.export_enabled = !sentence.export_enabled
  } else {
    // Unknown sentence ID
    console.log(`Unknown sentence ID. Could not enable export for sentence with the id "${id}".`)
  }
}

const getExportEnabledSentences = () => {
  return sentences.value.filter((s) => s.export_enabled)
}

const zipAudios = async (e: Event) => {
  let selected_sentences = getExportEnabledSentences()

  if (selected_sentences.length <= 0) {
    alert('The Export option must be enabled for at least one sentence to export.')
    return
  }

  // Initialize zipWriter
  let blobWriter: zip.BlobWriter = new zip.BlobWriter('application/zip')
  let zipWriter: zip.ZipWriter<Blob> | null = new zip.ZipWriter(blobWriter, { bufferedWrite: true })

  // Zip audio files
  for (let i = 0; i < selected_sentences.length; i++) {
    let s = selected_sentences[i]
    let filename = `${s.id} - ${s.text}.wav`
    let blob = await fetch(s.audio_src || '').then((r) => r.blob())
    await zipWriter.add(filename, new zip.BlobReader(blob))
  }

  // Create zip URL
  await zipWriter.close()
  const zipBlob = await blobWriter.getData()
  let zipURL = URL.createObjectURL(zipBlob)
  exportURL.value = zipURL
  exportAnchor.value.setAttribute('href', zipURL)
  exportAnchor.value.click()
  freeZipUrl()
  zipWriter = null
}

const freeAllRecordingUrls = () => {
  sentences.value.forEach((url) => {
    if (url.audio_src) {
      URL.revokeObjectURL(url.audio_src)
    }
  })
}

const freeZipUrl = () => {
  let zipURL = exportAnchor.value.getAttribute('href')
  URL.revokeObjectURL(zipURL)
}

const load_sentences = (s: any[]) => {
  freeAllRecordingUrls()
  freeZipUrl()
  sentences.value = s
  selectedSentenceID.value = s[0].id
}
</script>

<template>
  <!-- Header (Tatoeba/Github links) -->
  <header class="flex justify-between items-center gap-2 sticky top-0 z-50 bg-slate-700 px-4 mb-2">
    <h1 class="text-2xl">Tato Web Recorder</h1>
    <div class="flex gap-2">
      <RecordButton
        @start="startRecording"
        @stop="stopRecording"
        :recordingState="store.recordingState"
        :disabled="!selectedSentenceID"
      />
      <ExportButton @click="zipAudios" :disabled="getExportEnabledSentences().length === 0" />
      <a ref="exportAnchor" download="tato_audio.zip" hidden></a>
    </div>
  </header>
  <main class="flex flex-col gap-2">
    <SentenceImporter @load_sentences="load_sentences" />
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
          @toggle_checkbox="(id: string) => toggleSentenceExportCheckbox(id)"
          v-for="sentence in sentences"
          :key="sentence.id"
          :id="sentence.id"
          :text="sentence.text"
          :audioSrc="sentence.audio_src"
          :exportEnabled="sentence.export_enabled"
          ext="wav"
        />
      </tbody>
    </table>
  </main>
</template>
