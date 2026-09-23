import type { ManifestOptions } from 'vite-plugin-pwa';

export const pwaManifest: ManifestOptions = {
  name: 'SimatsSeatSync',
  short_name: 'SeatSync',
  description: 'Event registration and team management platform for SIMATS',
  theme_color: '#1D1D1F',
  background_color: '#ffffff',
  display: 'standalone',
  scope: '/',
  start_url: '/',
  orientation: 'portrait',
  icons: [
    {
      src: '/pwa-icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/pwa-icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ],
  categories: ['productivity', 'utilities'],
  prefer_related_applications: false
};
