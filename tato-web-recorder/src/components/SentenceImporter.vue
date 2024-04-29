import { URL } from 'node:url';
<script setup lang="ts">
// TODO: load alternative file formats
// TODO: read data from Tatoeba API

import { Sentence } from '../types/sentence'

const emit = defineEmits<{
  add_sentences: any[]
}>()

async function loadShtookaFile(e: Event) {
  let target = e.target as HTMLInputElement
  let file = target?.files?.item(0)
  try {
    let text = await file?.text()
    if (text) {
      let sentences = new Array<Sentence>()
      let lines = text.trim().split('\n')
      if (lines.length > 0) {
        lines.forEach((line: string) => {
          let [id, line_text] = line.split('-')
          let sentence = new Sentence(id.trim(), line_text.trim())
          sentences.push(sentence)
        })

        emit('add_sentences', sentences)
      }
    }
  } catch (e) {
    alert(
      `Unable to load file: "${file?.name}". It may have an invalid format. Please try again with a properly formatted file.`
    )
  }
}
</script>

<template>
  <label class="hidden" for="sentenceFile">Upload File</label>
  <input
    id="sentenceFile"
    @change="loadShtookaFile"
    class="input-load-file text-xl"
    type="file"
    ref="fileInput"
  />
</template>
