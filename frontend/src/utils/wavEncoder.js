// Encode a Float32Array audio signal as a 16-bit PCM WAV blob.
export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)        // PCM
  view.setUint16(22, 1, true)        // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

// Decode any audio Blob (webm/ogg/mp3) to a mono Float32Array at targetSampleRate,
// then re-encode as a WAV blob.
export async function blobToWav(blob, targetSampleRate = 22050) {
  const arrayBuffer = await blob.arrayBuffer()
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
  ctx.close()

  // Mix to mono
  const channels = decoded.numberOfChannels
  const length = decoded.length
  const mono = new Float32Array(length)
  for (let c = 0; c < channels; c++) {
    const data = decoded.getChannelData(c)
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels
  }

  // Resample (linear interpolation — librosa will resample again, this is fine)
  const ratio = targetSampleRate / decoded.sampleRate
  const outLength = Math.floor(length * ratio)
  const out = new Float32Array(outLength)
  for (let i = 0; i < outLength; i++) {
    const srcPos = i / ratio
    const i0 = Math.floor(srcPos)
    const i1 = Math.min(i0 + 1, length - 1)
    const t = srcPos - i0
    out[i] = mono[i0] * (1 - t) + mono[i1] * t
  }

  return encodeWav(out, targetSampleRate)
}
