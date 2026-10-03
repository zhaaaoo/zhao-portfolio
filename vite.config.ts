import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // the profiling build keeps <Profiler> timings in production, which the inspect drawer reads
    alias: [{ find: /^react-dom\/client$/, replacement: 'react-dom/profiling' }],
  },
  build: {
    rollupOptions: {
      input: { main: 'index.html', resume: 'resume/index.html' },
      output: {
        manualChunks: (id) => (id.includes('node_modules/react') || id.includes('node_modules/scheduler') ? 'react' : undefined),
      },
    },
  },
});
