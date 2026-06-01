import { useState } from "react";
import Recorder from "./components/Recorder.jsx";
import FileUploader from "./components/FileUploader.jsx";
import ResultDisplay from "./components/ResultDisplay.jsx";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleAudio = async (blob, name, previewBlob = blob) => {
    setError(null);
    setLoading(true);
    setResult(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(previewBlob));

    try {
      const fd = new FormData();
      fd.append("file", blob, name);
      const res = await fetch("/api/predict", { method: "POST", body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="kicker">Neural Audio Lab</p>
        <h1>Guitar Chord Recognition</h1>
        <p className="subtitle">
          Record or upload a riff and the model instantly predicts the chord
          and renders its spectrogram.
        </p>
      </header>

      <section className="control-deck">
        <div className="input-card record-card">
          <h2>Live Recording</h2>
          <p className="card-copy">
            Best for testing your guitar in real time.
          </p>
          <Recorder onAudio={handleAudio} disabled={loading} />
        </div>
        <div className="input-card upload-card">
          <h2>Audio Upload</h2>
          <p className="card-copy">
            Use an existing audio file and compare the prediction.
          </p>
          <FileUploader onAudio={handleAudio} disabled={loading} />
        </div>

        <aside className="audio-preview-panel">
          <h2>Playback</h2>
          {audioUrl ? (
            <audio src={audioUrl} controls />
          ) : (
            <p className="hint">
              After recording or uploading, your preview appears here.
            </p>
          )}
        </aside>
      </section>

      {loading && <div className="loader">Analyzing...</div>}
      {error && <div className="error-banner">{error}</div>}

      <ResultDisplay result={result} />
    </div>
  );
}
