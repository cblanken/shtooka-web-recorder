export class Sentence {
  id: string
  text: string
  audio_src: string

  constructor(id: string, sentence: string, audio_src: string = '') {
    this.id = id
    this.text = sentence
    this.audio_src = audio_src
  }
}
