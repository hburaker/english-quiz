// @ts-check
import { defineConfig } from 'astro/config';

// Tamamen statik çıktı: `npm run build` sonrası dist/ klasörü her yerde çalışır.
export default defineConfig({
  output: 'static',
});
