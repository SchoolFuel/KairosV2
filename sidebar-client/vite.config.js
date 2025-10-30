import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';

function waitForFile(filePath, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for file: ${filePath}`));
      }
    }, 100);
  });
}

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'copy-to-appsscript',
      async closeBundle() {  
        const src = path.resolve(__dirname, 'dist/index.html');
        const dest = path.resolve(__dirname, '../Sidebar.html');

        try {
          await waitForFile(src); 
          fs.copyFileSync(src, dest); 
          console.log('✅ Sidebar.html updated from React build.');
        } catch (err) {
          console.error('❌', err.message);
        }
      },
    },
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
  },
});