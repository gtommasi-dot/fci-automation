import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Cargar variables de entorno (.env)
dotenv.config();

const frameworkType = process.env.FRAMEWORK_TYPE?.toUpperCase() || 'LEGACY';
console.log(`🧩 Playwright iniciado en modo: ${frameworkType}`);

// Configuración base
export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,

  // Reporters dinámicos según entorno
  reporter:
    frameworkType === 'AI'
      ? [
          ['list'], // salida limpia en consola
          ['allure-playwright', { outputFolder: 'allure-results' }],
        ]
      : [['list']], // Legacy: consola simple (usa generate-report.js luego)

  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // Opcional: distintos dispositivos si más adelante usas Playwright Test
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
