import { useRef, useState } from 'react'
import { blobToWav } from '../utils/wavEncoder.js'

export default function FileUploader({ onAudio, disabled }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    try {
      const wav = await blobToWav(file, 22050)
      onAudio(wav, file.name)
    } catch (err) {
      alert('Could not decode audio: ' + err.message)
    }
  }

  return (
    <div
      className={'dropzone ' + (dragOver ? 'drag' : '')}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
      }}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <p>Drop an audio file here, or click to browse</p>
      <p className="hint">.wav, .mp3, .ogg, .webm, .flac</p>
    </div>
  )
}
