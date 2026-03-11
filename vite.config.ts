import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mjsPath = path.join(__dirname, '../mjs/dist/mjs.js');

export default defineConfig({
  server: {
    fs: {
      allow: ['..'],
    },
  },
  plugins: [
    {
      name: 'serve-mjs-bundle',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0];
          if (url !== '/mjs/dist/mjs.js') {
            return next();
          }
          if (!fs.existsSync(mjsPath)) {
            return next();
          }
          res.setHeader('Content-Type', 'application/javascript');
          fs.createReadStream(mjsPath).pipe(res);
        });
      },
    },
  ],
});
