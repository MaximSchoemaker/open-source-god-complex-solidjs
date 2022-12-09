import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

console.log("defineConfig");

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
    watch: {
      ignored: ["**/dist/**", "**/public/**"]
    },
  },
  build: {
    target: 'esnext',
    emptyOutDir: false,
  },
});
