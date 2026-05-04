# Guitar Chord Recognition

CNN-based guitar chord classifier with a FastAPI backend, React web app, and React Native (Expo) mobile app.

---

## Project layout

```
ChordRecognition/
├── chord_cnn.pth              # trained model weights (output of the Colab notebook)
├── chord_recognition.ipynb    # training notebook
├── build_notebook.py          # helper for the training notebook
├── backend/                   # FastAPI inference server (Python)
├── frontend/                  # React + Vite (web)
└── mobile/                    # Expo / React Native (iOS + Android)
```

## Prerequisites

- **Python 3.10+** (for the backend)
- **Node.js 18+** and **npm** (for frontend & mobile)
- **ffmpeg** (only for the mobile app — Android records `.m4a` which librosa cannot decode without ffmpeg)
- **Expo Go app** on your phone (App Store / Play Store) — must be the latest version (currently bundles SDK 54)
- All devices (laptop + phone) on the **same WiFi network** for LAN dev

---

## 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run for web-only dev (laptop only)

```bash
uvicorn main:app --reload --port 8000
```

Server runs on `http://127.0.0.1:8000`. Open it in a browser to see status JSON.

### Run for mobile dev (phone needs to reach it)

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

`--host 0.0.0.0` binds to all interfaces so the phone can hit `http://<laptop-LAN-IP>:8000`.

Install `ffmpeg` on the backend host so it can decode Android `.m4a` recordings:

```bash
sudo apt install ffmpeg     # Linux
brew install ffmpeg         # macOS
```

Restart the backend after installing.

---

## 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api/*` to the backend on port 8000.

Production build:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the build locally
```

---

## 3. Mobile app (Expo / React Native)

### Quick start

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with **Expo Go**:
- iOS: Camera app
- Android: Expo Go → "Scan QR code"

### Configure backend URL

Edit `mobile/src/config.js` and set `API_URL` to your laptop's LAN IP:

```js
export const API_URL = 'http://192.168.1.10:8000'
```

Find your LAN IP:
- Linux: `hostname -I`
- macOS: `ifconfig | grep "inet "`
- Windows: `ipconfig`

> ⚠️ `localhost` / `127.0.0.1` will **not** work on a physical phone — those resolve to the phone itself, not your laptop.

Alternative: use an ngrok tunnel for the backend:
```bash
ngrok http 8000
# paste the https URL into config.js
```

### Network requirements

- Phone and laptop on the **same WiFi**
- WiFi must not have **AP/client isolation** enabled (common on guest networks)
- Firewall must allow ports **8081** (Metro) and **19000–19002** (Expo)

If LAN doesn't work, fall back to tunnel mode:

```bash
npx expo start --tunnel
```

---

## Troubleshooting

### Mobile: "Project uses SDK X, Expo Go uses SDK Y"

Expo Go from the app store ships only the **latest** SDK. The project must match. To upgrade the project:

```bash
cd mobile
npx expo install expo@latest
npx expo install --fix
```

If `--fix` errors with `ERESOLVE` peer-dep conflicts (commonly with `expo-av` and React 19):

```bash
npm install --legacy-peer-deps
```

### Mobile: "Cannot find module 'babel-preset-expo'"

`--legacy-peer-deps` sometimes drops dev dependencies. Reinstall it:

```bash
npm install --save-dev babel-preset-expo --legacy-peer-deps
```

### Mobile: "Request timed out" / "Could not connect to development server"

In order:
1. Restart Metro with cleared cache: `npx expo start --clear`
2. Check that backend is bound to `0.0.0.0`, not `127.0.0.1`
3. Check phone and laptop are on the same WiFi (no guest/AP isolation)
4. Try tunnel mode: `npx expo start --tunnel --clear`
5. Check OS firewall allows ports 8081 and 19000–19002

### Mobile: npm install network timeouts

Slow registry on weak connection. Increase timeout and retries:

```bash
npm install --legacy-peer-deps --fetch-timeout=600000 --fetch-retries=5
```

### Backend: librosa fails on `.m4a` upload

`ffmpeg` is not installed on the backend host. Install it (`sudo apt install ffmpeg`) and restart the backend.

### Backend: "Address already in use" on port 8000

Another process is using it. Kill it or pick a different port:

```bash
lsof -i :8000          # find PID
kill <PID>
# or run on another port
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

(Update `mobile/src/config.js` and `frontend/vite.config.js` if you change the port.)

---

## How the prediction pipeline works

1. User records audio (mic) or uploads a file (web/mobile).
2. Client decodes any audio format → resamples to **22050 Hz mono** → encodes as WAV.
3. WAV is sent to `POST /predict` (multipart upload).
4. Backend computes a **mel-spectrogram**, runs the trained CNN, returns:
   - predicted chord
   - full ranking with probabilities
   - base64-encoded spectrogram PNG
5. Client displays the result and the spectrogram.

## Endpoints

| Method | Path       | Description                                    |
|--------|------------|------------------------------------------------|
| GET    | `/`        | Health check + model metadata                  |
| POST   | `/predict` | Multipart audio upload, returns prediction JSON |

## Training the model

The CNN is trained in `chord_recognition.ipynb` (Google Colab compatible). Output is `chord_cnn.pth`, which the backend loads at startup. Re-run the notebook to retrain or change architecture.
