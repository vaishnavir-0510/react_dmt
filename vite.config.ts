import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Set base path for GitHub Pages when building for github mode
  const base = mode === 'github' ? '/react_dmt/' : '/';
  
  return {
    plugins: [react()],
    // Ensure environment variables are properly loaded
    envPrefix: 'VITE_',
    // Base path for GitHub Pages deployment
    base,
  };
})
