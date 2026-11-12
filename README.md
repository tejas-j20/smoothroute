# SmoothRoute

Browser-based road quality mapping using smartphone motion sensors and GPS.
No app install, no special hardware, no video.

## Status
Iteration 1: recorder page (frontend only). Logs motion + GPS, lets a person
mark bumps manually, and exports a CSV for analysis.

## Folders
- `frontend/`  React + Vite web app (the recorder lives here)
- `backend/`   Python FastAPI server (later iteration)
- `analysis/`  Notebooks for studying recorded rides
- `data/`      CSV files from test rides
- `docs/`      Review presentations and diagrams

## Run the recorder
```bash
cd frontend
npm install
npm run dev
```
Phone sensors only work on HTTPS, so open the app on your phone through a tunnel
(see the instructions in the project chat/notes), not through http://<laptop-ip>.

## Team
- Name 1 (USN1)
- Name 2 (USN2)
