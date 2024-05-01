class TatoAudioProcessor extends AudioWorkletProcessor {
  bufferSize = 4096
  #bytesWritten = 0
  #buffer = new Float32Array(this.bufferSize)
  #isRecording = true
  constructor() {
    super()
    this.port.onmessage = (e) => {
      if (e.data == 'stop') {
        this.#isRecording = false
      }
    }
  }

  process(inputs) {
    this.append(inputs[0][0])
    return this.#isRecording
  }

  append(channelData) {
    // Flush data to main thread if buffer is full or
    // if a stop signal has been received
    if (this.isBufferFull() || !this.#isRecording) {
      this.flush()
    }

    if (!channelData) {
      return
    }

    for (let i = 0; i < channelData.length; i++) {
      this.#buffer[this.#bytesWritten++] = channelData[i]
    }
  }

  resetBuffer() {
    this.#bytesWritten = 0
  }

  isBufferEmpty() {
    return this.#bytesWritten === 0
  }

  isBufferFull() {
    return this.#bytesWritten === this.bufferSize
  }

  flush() {
    this.port.postMessage(
      this.#bytesWritten < this.bufferSize
        ? this.#buffer.slice(0, this.#bytesWritten)
        : this.#buffer
    )
    this.resetBuffer()
  }
}

registerProcessor('tato-audio-processor', TatoAudioProcessor)
