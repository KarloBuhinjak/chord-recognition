export default function ResultDisplay({ result }) {
  if (!result) return null
  const { prediction, confidence, ranking, spectrogram_png_b64 } = result

  return (
    <div className="result">
      <div className="prediction-card">
        <div className="label">Predicted chord</div>
        <div className="chord">{prediction}</div>
        <div className="confidence">{(confidence * 100).toFixed(1)}% confidence</div>
      </div>

      <div className="ranking">
        <h3>All probabilities</h3>
        <ul>
          {ranking.map((r, i) => (
            <li key={r.chord} className={i === 0 ? 'top' : ''}>
              <div className="bar-row">
                <span className="chord-name">{r.chord}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${r.probability * 100}%` }}
                  />
                </div>
                <span className="pct">{(r.probability * 100).toFixed(1)}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {spectrogram_png_b64 && (
        <div className="spectrogram">
          <h3>Mel-spectrogram (model input)</h3>
          <img
            src={`data:image/png;base64,${spectrogram_png_b64}`}
            alt="Mel-spectrogram"
          />
        </div>
      )}
    </div>
  )
}
