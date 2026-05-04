import { API_URL } from './config'

export async function predictChord(uri, name = 'audio.wav', mimeType = 'audio/wav') {
  const fd = new FormData()
  fd.append('file', { uri, name, type: mimeType })

  const res = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    body: fd,
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`HTTP ${res.status}: ${txt}`)
  }
  return res.json()
}

export async function fetchHealth() {
  const res = await fetch(`${API_URL}/`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
