<script setup lang="ts">
import SentenceImporter from './components/SentenceImporter.vue'

const importedSentences = defineModel()
</script>

<template>
  <header class="text-3xl">
    <h1>Tatoeba Web Recorder</h1>
    <!-- Tatoeba list URL or ID search -->
  </header>

  <main>
    <SentenceImporter v-model="importedSentences" />
    <div v-if="importedSentences">
      <li v-for="[id, sentence] in importedSentences" :key="id">{{ id }} - {{ sentence }}</li>
    </div>
  </main>

  <!-- Render loaded sentence items -->

  <!-- Footer (Tatoeba/Github links) -->
</template>
