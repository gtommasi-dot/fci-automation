# Playwright + Cucumber (FCI) — Framework de Automatización  
**Legacy (HTML) / AI (Allure) / ReportPortal (Local)**

Este repositorio contiene un framework de automatización basado en **TypeScript + Playwright + Cucumber**.  
Incluye 3 flujos de reporting:

1. **Legacy** → JSON + HTML clásico (multiple-cucumber-html-reporter)  
2. **AI** → **Allure** (allure-results / allure-report)  
3. **ReportPortal local** → Launches + historiales + attachments (screenshots/HTML/logs/traces)

> **Nota (Windows/PowerShell)**
> - Variables de entorno: `$env:VAR="valor"; comando`
>
> **Nota (Linux/macOS)**
> - Variables de entorno: `VAR=valor comando`

---

## Requisitos

- Node.js (LTS recomendado)
- Dependencias instaladas:
  ```bash
  npm install
  ```
- Playwright browsers:
  ```bash
  npx playwright install
  ```
- (Opcional) Docker Desktop + WSL2 para ReportPortal local

---

## Variables de entorno (.env)

### Variables del AUT (FCI)
Ejemplo:
```env
BASE_URL=https://test.myfci.com/Login
FCIWEBSITE_URL=https://test.myfci.com
BOARDING_URL=https://test.myfci.com/boarding

LENDER_USER=...
LENDER_PASSWORD=...
BORROWER_USER=...
BORROWER_PASSWORD=...
ADMIN_USER=...
ADMIN_PASSWORD=...
ADMIN_LOGIN_URL=https://tfciportal.myfci.com/login
```

### Variables de ejecución
```env
FRAMEWORK_TYPE=AI      # LEGACY | AI
HEADLESS=true          # true | false
CI=false               # true en pipeline
```

### Variables de ReportPortal (local)
```env
RP_ENABLE=true

# IMPORTANTE: usar el puerto expuesto por el gateway (Traefik).
# Si tu UI abre en http://localhost:8085, entonces:
RP_ENDPOINT=http://localhost:8085

# El proyecto DEBE existir en ReportPortal (por ej: superadmin_personal)
RP_PROJECT=superadmin_personal

# API key del usuario (Bearer token)
RP_API_KEY=xxxx

RP_LAUNCH=UI Regression
RP_ATTRIBUTES=env:local;framework:playwright-cucumber
```

> **Seguridad**
> - NO commitear `.env`.
> - Rotar `RP_API_KEY` si se filtra.
> - Mantener `.env.example` con placeholders.

---

## Estructura del repo (referencia)

```
tests/
  features/           # .feature
  steps/              # step definitions
  hooks/              # hooks (Before/After/Tracing/Logs/etc.)
  support/
    world.ts          # CustomWorld

reports/
  html/               # HTML legacy
  screenshots/        # screenshots en fallos
  videos/             # videos (si aplica)
  traces/             # Playwright traces (zip)
  logs/               # console + network logs

allure-results/
allure-report/
```

---

## Ejecución — comandos principales

### 1) Ejecutar TODO (sin tags)
```bash
npm run test
```

### 2) Ejecutar por tags (comando oficial recomendado)
Este repo filtra tags con `CUCUMBER_TAGS` (lo consume `cucumber.js`).

**Windows (PowerShell):**
```powershell
$env:CUCUMBER_TAGS='@boarding'
npx cucumber-js --config cucumber.js
```

**Linux/macOS:**
```bash
CUCUMBER_TAGS='@boarding' npx cucumber-js --config cucumber.js
```

### 3) Ejecutar en modo headed (ver navegador)
**Windows (PowerShell):**
```powershell
$env:HEADLESS='false'
$env:CUCUMBER_TAGS='@boarding'
npx cucumber-js --config cucumber.js
```

**Linux/macOS:**
```bash
HEADLESS=false CUCUMBER_TAGS='@boarding' npx cucumber-js --config cucumber.js
```

### Ejemplos de tags
```powershell
$env:CUCUMBER_TAGS='@ui'
$env:CUCUMBER_TAGS='@ui and @smoke'
$env:CUCUMBER_TAGS='not @wip'
```

---

## Scripts del repo (package.json)

> Validar en `package.json` (puede variar). Ejemplo actual:

- `npm run clean` → limpia `reports/`, `allure-*`, `dist`, etc.
- `npm run test` → `cucumber-js --config cucumber.js`
- `npm run test:ui` / `npm run test:api`
- `npm run test:ui:json` → JSON en `reports/cucumber-report.json`
- `npm run test:ui:html` → genera HTML legacy
- `npm run test:ci` → JSON + JUnit (para CI)
- `npm run test:ai` → genera `allure-results`
- `npm run allure:report` → genera + abre `allure-report`

---

## Reporting — Legacy (HTML clásico)

### Flujo
1) Ejecutar generando JSON:
```bash
npm run test:ui:json
```

2) Generar HTML:
```bash
npm run test:ui:html
```

Outputs:
- `reports/cucumber-report.json`
- `reports/html/*`

---

## Reporting — AI (Allure)

1) Ejecutar tests con Allure:
```bash
npm run test:ai
```

2) Generar + abrir el reporte:
```bash
npm run allure:report
```

Outputs:
- `allure-results/*`
- `allure-report/*`

---

## ReportPortal — Setup local con Docker (Windows 11 + WSL2)

### 1) Verificar Docker Desktop
```powershell
docker version
docker info --format "CPUs={{.NCPU}} MemTotal={{.MemTotal}}"
```

### 2) Crear carpeta y descargar docker-compose
```powershell
mkdir C:\\reportportal
cd C:\\reportportal
curl.exe -L -o docker-compose.yml https://raw.githubusercontent.com/reportportal/reportportal/master/docker-compose.yml
```

### 3) Levantar ReportPortal
```powershell
docker compose -p reportportal up -d
docker compose -p reportportal ps
```

### 4) Puertos (gateway)
En `docker compose ps`, fijarse en el servicio `gateway` (Traefik).  
Ejemplo (OK):
- `0.0.0.0:8085->8080/tcp`

Entonces la UI abre en:
- `http://localhost:8085`

> Si aparece error “ports are not available … 8080”, cambiar el puerto host a uno libre (ej. 8085) en el compose.

### 5) Logs útiles
```powershell
docker compose -p reportportal logs -n 200 api
docker compose -p reportportal logs -n 200 gateway
docker compose -p reportportal logs -n 200 uat
docker compose -p reportportal logs -n 200 opensearch
```

---

## ReportPortal — Proyectos y API

### Listar proyectos (requiere API key válida)
```powershell
curl.exe -s -H "Authorization: Bearer $env:RP_API_KEY" http://localhost:8085/api/v1/project/list
```

En un entorno local típico aparecen proyectos personales como:
- `superadmin_personal`
- `default_personal`

---

## ReportPortal — Dónde ver evidencias (attachments)

Los attachments se ven dentro del Launch:

1) **Project** (ej. `superadmin_personal`)  
2) **Launches**  
3) Abrir launch (`RP_LAUNCH`)  
4) Abrir el **Scenario/Test Item**  
5) **Logs** → ver attachments:
   - `image/png` (screenshot)
   - `text/html` (HTML dump, si habilitado)
   - `text/plain` (console/log info)
   - `application/json` (network logs)
   - `application/zip` (trace)

---

## Hooks avanzados (captura de evidencias)

El framework incluye hooks que, ante fallos, pueden:
- Guardar y adjuntar screenshot
- Guardar y adjuntar HTML de la página
- Capturar console logs y pageerror
- Capturar red (requestfailed y responses >= 400)
- Generar Playwright trace ZIP (si está habilitado)

Variables para controlar:
```env
TRACE=true
TRACE_ON_PASS=false

CAPTURE_CONSOLE=true
CAPTURE_NETWORK=true

SAVE_HTML_ON_FAIL=true
SAVE_TRACE_ON_FAIL=true
```

---

## Troubleshooting

### “0 scenarios / 0 steps”
El filtro no encontró escenarios.
- Verificar tags en los `.feature`.
- Probar sin tags:
```bash
npm run test
```

### Windows: `rimraf` no se reconoce
Usar:
```bash
npx rimraf <carpeta>
```
o `npm run clean`.

### Docker: “ports are not available … 8080”
- Cambiar el puerto host del gateway en el compose (ej. `8085:8080`).
- Reiniciar:
```powershell
docker compose -p reportportal down
docker compose -p reportportal up -d
```

### Docker Desktop: error de memoria / WSL
- Cerrar apps pesadas.
- Reiniciar WSL:
```powershell
wsl --shutdown
```

### `docker version` no conecta a `docker_engine`
- Docker Desktop no está corriendo o engine apagado.
- Abrir Docker Desktop y confirmar “Engine running”.

---

## Checklist de ejecución (local)

1) `.env` configurado  

2) `npm install`  
3) `npx playwright install`  
4) (Opcional) ReportPortal levantado (`http://localhost:8085`)  
5) Ejecutar:
```powershell
$env:HEADLESS='false'
$env:CUCUMBER_TAGS='@boarding'
$env:RP_ENABLE='true'
npx cucumber-js --config cucumber.js
```
6) Ver resultados en:
- Allure: `npm run allure:report`
- ReportPortal: Project → Launches → Launch → Scenario → Logs

---
