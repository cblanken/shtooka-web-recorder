export class Sentence {
  id: string
  text: string
  audio_src: URL | null

  constructor(id: string, sentence: string, audio_src: URL | null = null) {
    this.id = id
    this.text = sentence
    this.audio_src = audio_src
  }
}
