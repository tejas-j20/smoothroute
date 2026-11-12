import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tunnel domains must be allowed, otherwise Vite blocks requests with "Blocked host".
const tunnelHosts = [
  '.trycloudflare.com', // Cloudflare quick tunnel
  '.ngrok-free.app',    // ngrok
  '.ngrok-free.dev',
  '.ngrok.app',
]

export default defineConfig({
  plugins: [react()],
  server: { host: true, allowedHosts: tunnelHosts },
  preview: { host: true, allowedHosts: tunnelHosts },
})
