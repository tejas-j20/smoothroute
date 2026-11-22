# SmoothRoute

Browser-based road quality mapping using smartphone motion sensors and GPS.
No app install, no special hardware, no video.

## Status
- Stage 1: recorder page (motion + GPS logging, manual bump marks, CSV export)
- Stage 2: session map, autosave and saved rides, unit tests, analysis notebook

## Folders
- `frontend/`  React + Vite web app (the recorder lives here)
- `backend/`   Python FastAPI server (later stage)
- `analysis/`  Notebook for studying recorded rides
- `data/`      CSV files from test rides
- `docs/`      Review presentations and diagrams

## Run the recorder
```bash
cd frontend
npm install
npm run dev
```
Phone sensors only work on HTTPS, so open the app on your phone through a tunnel:
```bash
cloudflared tunnel --url http://localhost:5173
```
Saved rides belong to the link they were recorded on. A new tunnel link starts
with an empty list, so download your CSV before closing the tunnel.

## Run the tests
```bash
cd frontend
npm test
```

## Study a ride
```bash
cd analysis
pip install -r requirements.txt
jupyter notebook explore_ride.ipynb
```
Put the downloaded CSV in `data/` and set `CSV_PATH` in the first code cell.

## Team
- Name 1 (USN1)
- Name 2 (USN2)
