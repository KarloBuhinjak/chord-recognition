import { useEffect, useState } from 'react'
import Recorder from './components/Recorder.jsx'
import FileUploader from './components/FileUploader.jsx'
import ResultDisplay from './components/ResultDisplay.jsx'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    fetch('/api/').then((r) => r.json()).then(setMeta).catch(() => {})
  }, [])

  const handleAudio = async (blob, name) => {
    setError(null)
    setLoading(true)
    setResult(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(URL.createObjectURL(blob))

    try {
      const fd = new FormData()
      fd.append('file', blob, name)
      const res = await fetch('/api/predict', { method: 'POST', body: fd })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`HTTP ${res.status}: ${txt}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Guitar Chord Recognition</h1>
        <p className="subtitle">CNN-based chord classifier</p>
        {meta && (
          <p className="meta">
            {meta.classes?.length} classes · device: {meta.device} · {meta.duration}s clips
          </p>
        )}
      </header>

      <section className="inputs">
        <div className="input-card">
          <h2>Record</h2>
          <Recorder onAudio={handleAudio} disabled={loading} />
        </div>
        <div className="input-card">
          <h2>Upload</h2>
          <FileUploader onAudio={handleAudio} disabled={loading} />
        </div>
      </section>

      {audioUrl && (
        <div className="audio-preview">
          <audio src={audioUrl} controls />
        </div>
      )}

      {loading && <div className="loader">Analyzing...</div>}
      {error && <div className="error-banner">{error}</div>}

      <ResultDisplay result={result} />
    </div>
  )
}
