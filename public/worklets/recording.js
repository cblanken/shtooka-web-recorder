/* Please note, much of the following code was adapted from Recorderjs by Matt Diamond
 * for use in this AudioWorklet
 * See https://github.com/mattdiamond/Recorderjs for the original source
 *
 * Copyright © 2013 Matt Diamond
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

class TatoAudioRecorder extends AudioWorkletProcessor {
  #isRecording = false
  #recBuffers = []
  #recLength = 0
  #sampleRate = 48000
  #numChannels = 1

  constructor() {
    super()
    this.port.onmessage = (e) => {
      switch (e.data.command) {
        case 'init':
          this.init(e.data.config)
          break
        case 'start':
          this.start()
          break
        case 'stop':
          this.stop()
          break
        case 'record':
          this.record(e.data.buffer)
          break
        case 'exportWAV':
          this.exportWAV(e.data.type)
          break
        case 'getBuffer':
          this.getBuffer()
          break
        case 'clear':
          this.clear()
          break
      }
    }
  }

  process(inputs) {
    if (!this.#isRecording) {
      return
    }

    let buffer = []
    inputs[0].forEach((channel, i) => {
      // buffer.push(channel)
      buffer.push([])

      channel.forEach((sample) => {
        // Populate buffers
        buffer[i].push(sample)

        // Passthrough input
        // outputs[0][i][s] = sample
      })
    })

    this.record(buffer)

    return true
  }

  init(config) {
    this.#sampleRate = config.sampleRate || this.#sampleRate
    this.#numChannels = config.numChannels || this.#numChannels
    this.initBuffers()
  }

  initBuffers() {
    for (let channel = 0; channel < this.#numChannels; channel++) {
      this.#recBuffers[channel] = []
    }
  }

  start() {
    this.#isRecording = true
  }

  stop() {
    this.#isRecording = false
    this.port.close()
  }

  record(inputBuffer) {
    for (let channel = 0; channel < this.#numChannels; channel++) {
      this.#recBuffers[channel].push(inputBuffer[channel])
    }
    this.#recLength += inputBuffer[0].length
  }

  exportWAV(type) {
    let buffers = []
    for (let channel = 0; channel < this.#numChannels; channel++) {
      buffers.push(this.mergeBuffers(this.#recBuffers[channel], this.#recLength))
    }

    let interleaved
    if (this.#numChannels === 2) {
      interleaved = this.interleave(buffers[0], buffers[1])
    } else {
      interleaved = buffers[0]
    }
    let dataview = this.encodeWAV(interleaved)
    // let audioBlob = new Blob([dataview], { type: type })

    this.port.postMessage({ command: 'exportWAVData', dataview: dataview, type: type })
  }

  getBuffer() {
    let buffers = []
    for (let channel = 0; channel < this.#numChannels; channel++) {
      buffers.push(this.mergeBuffers(this.#recBuffers[channel], this.#recLength))
    }

    this.port.postMessage({ command: 'getBuffer', data: buffers })
  }

  clear() {
    this.#recLength = 0
    this.#recBuffers = []
    this.initBuffers()
  }

  mergeBuffers(recBuffers, recLength) {
    let result = new Float32Array(recLength)
    let offset = 0
    for (let i = 0; i < recBuffers.length; i++) {
      result.set(recBuffers[i], offset)
      offset += recBuffers[i].length
    }
    return result
  }

  interleave(inputL, inputR) {
    let length = inputL.length + inputR.length
    let result = new Float32Array(length)

    let index = 0
    let inputIndex = 0

    while (index < length) {
      result[index++] = inputL[inputIndex]
      result[index++] = inputR[inputIndex]
      inputIndex++
    }

    return result
  }

  floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  encodeWAV(samples) {
    let buffer = new ArrayBuffer(44 + samples.length * 2)
    let view = new DataView(buffer)

    /* RIFF identifier */
    this.writeString(view, 0, 'RIFF')
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true)
    /* RIFF type */
    this.writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    this.writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, 1, true)
    /* channel count */
    view.setUint16(22, this.#numChannels, true)
    /* sample rate */
    view.setUint32(24, this.#sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, this.#sampleRate * 4, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, this.#numChannels * 2, true)
    /* bits per sample */
    view.setUint16(34, 16, true)
    /* data chunk identifier */
    this.writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true)

    this.floatTo16BitPCM(view, 44, samples)
    return view
  }
}

registerProcessor('tato-audio-recorder', TatoAudioRecorder)
