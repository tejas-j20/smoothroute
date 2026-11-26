# SmoothRoute

Browser-based road quality mapping using smartphone motion sensors and GPS.
No app install, no special hardware, no video.

## Status
- Stage 1: recorder page (motion + GPS logging, manual bump marks, CSV export)
- Stage 2: session map, autosave and saved rides, unit tests, analysis notebook
- Stage 3: automatic bump detection in the browser with editable settings, compared with hand marks
- Stage 4: Spring Boot backend (severity scoring, clustering, REST API)
- Stage 5: upload detected bumps from the app and a public road roughness map

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

## Automatic detection
On the Ready screen, choose the detection settings (threshold, minimum speed, pause, plain or
speed-normalised). While recording, the app finds bumps live. After the ride, the result screen
compares them with the bumps you marked by hand (marks found, false alarms, missed).

## Upload and the public map
1. Start the backend (see `backend/README.md`) and give it an https:// address, for example
   `cloudflared tunnel --url http://localhost:8080`.
2. In the app, open "Server address", paste that https:// address and press "Test connection".
3. After a ride, press "Upload to the server" on the result screen.
4. Press "View the road roughness map" to see all spots, coloured by severity.

The address can also be built into the site with the `VITE_API_URL` environment variable
(see `frontend/.env.example`).

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
