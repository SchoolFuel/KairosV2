import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'copy-to-appsscript',
      closeBundle: () => {
        const src = path.resolve(__dirname, 'dist/index.html');
        const dest = path.resolve(__dirname, '../Dialog.html'); // Copy to GAS root
        fs.copyFileSync(src, dest);
        console.log('✅ Dialog.html updated from React build.');
      },
    },
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
  },
});
