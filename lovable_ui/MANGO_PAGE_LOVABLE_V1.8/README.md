<p align="center">
  <img src="src/assets/logo.png" alt="M.A.N.G.O. Logo" width="180" />
</p>

<h1 align="center">M.A.N.G.O.</h1>
<h3 align="center">Monitoreo Autónomo Navegable para Gestión Oceanográfica</h3>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.1.0-blue?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img alt="Status" src="https://img.shields.io/badge/status-In%20Development-orange?style=flat-square" />
  <img alt="Platform" src="https://img.shields.io/badge/platform-Web%20%7C%20IoT-informational?style=flat-square" />
  <img alt="LoRa" src="https://img.shields.io/badge/comm-LoRa%20SX1278-purple?style=flat-square" />
  <img alt="Built with" src="https://img.shields.io/badge/built%20with-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react" />
</p>

---

## 📋 Descripción

**M.A.N.G.O.** es un sistema autónomo de monitoreo ambiental diseñado para la conservación de ecosistemas de manglar en la costa colombiana del Pacífico. Integra sensores de calidad del agua (pH, temperatura, turbidez), comunicación de largo alcance vía **LoRa**, y un dashboard web en tiempo real para la visualización y análisis de datos.

El proyecto nace como respuesta a la degradación de los manglares colombianos, combinando electrónica embebida, comunicación inalámbrica y desarrollo web moderno para ofrecer una herramienta accesible a investigadores y autoridades ambientales.

---

## 🏗️ Arquitectura del Sistema

El sistema se compone de **cinco capas** interconectadas:

| Capa | Descripción | Tecnologías |
|------|------------|-------------|
| **Hardware** | Sensores de campo (pH, PT100, turbidez) y actuadores | ESP32, MAX31865, ADS1115, Heltec LoRa 32 |
| **Firmware** | Lectura de sensores, calibración y empaquetado de datos | Arduino IDE, C++ |
| **Comunicación** | Transmisión inalámbrica de largo alcance | LoRa SX1278 (433 MHz), WiFi, BLE |
| **Datos** | Recepción, almacenamiento y procesamiento | NVIDIA Jetson TK1, API REST |
| **Visualización** | Dashboard web con monitoreo en tiempo real y alertas | React, Recharts, Grafana |

```
┌─────────────────────────────────────────────────────┐
│  CAMPO (Estación Remota)                            │
│  Sensores → ESP32/Heltec → LoRa TX                 │
└────────────────────┬────────────────────────────────┘
                     │ LoRa (433 MHz)
┌────────────────────▼────────────────────────────────┐
│  GATEWAY (Estación Base)                            │
│  LoRa RX → Jetson TK1 → API REST → Base de Datos   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────┐
│  DASHBOARD WEB                                       │
│  React + Recharts + Grafana → Visualización          │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend (Dashboard Web)
- **React 18** + **TypeScript** — UI declarativa con tipado estático
- **Vite** — Bundler ultrarrápido para desarrollo
- **Tailwind CSS** — Sistema de diseño utility-first
- **shadcn/ui** — Componentes accesibles y personalizables
- **Recharts** — Gráficos de series de tiempo
- **Framer Motion** — Animaciones fluidas
- **TanStack Query** — Gestión de estado del servidor y caching

### Hardware / IoT
- **NVIDIA Jetson TK1** — Micro-PC central (gateway)
- **Heltec WiFi LoRa 32 V3** — Transceptor LoRa + WiFi + BLE + OLED
- **MAX31865** — Acondicionador para sensores PT100 (temperatura)
- **Módulo BNC pH** — Lectura de electrodos de pH calibrados
- **APISQUEEN** — Kit de propulsión submarina (thrusters, ESC, UBEC)

---

## 📂 Estructura del Proyecto

```
├── public/
│   ├── docs/              # Documentación técnica (95+ archivos)
│   │   └── fuentes/       # Fuentes bibliográficas y científicas
│   └── images/gallery/    # Galería de 137 activos visuales
│       ├── hardware/      # Componentes, montajes y esquemas
│       └── leader/        # Documentación del equipo
├── src/
│   ├── components/        # Componentes React reutilizables
│   │   ├── dashboard/     # Paneles del dashboard (sensores, alertas, IMU)
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom hooks (auth, sensores, alertas)
│   ├── lib/               # API client, utilidades, thresholds
│   ├── pages/             # Páginas principales (Index, Dashboard, Login)
│   └── types/             # TypeScript type definitions
```

---

## 🚀 Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <YOUR_GIT_URL>

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

El dashboard estará disponible en `http://localhost:5173`.

> **Nota:** Para datos en tiempo real, el backend (API REST) debe estar corriendo en el puerto configurado en `VITE_API_TARGET`.

---

## 📊 Características del Dashboard

- **Monitoreo en tiempo real** — Tarjetas de pH, temperatura y turbidez con actualización cada 60s
- **Historial gráfico** — Series de tiempo con rangos de 15min, 1h, 6h y 24h
- **Sistema de alertas** — Alertas instantáneas y sostenidas con umbrales configurables
- **Panel IMU** — Orientación y aceleración del dispositivo
- **Integración Grafana** — Paneles embebidos para análisis avanzado
- **Galería técnica** — 137 imágenes con filtros y lightbox interactivo
- **Repositorio de documentos** — 95+ archivos técnicos y bibliográficos

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulte el archivo `LICENSE` para más detalles.

---

## 👥 Equipo

**Sebastián Sánchez Chacón** — Líder de proyecto, diseño de hardware y desarrollo de software.

---

<p align="center">
  <em>Protegiendo los manglares de Colombia con tecnología autónoma 🌿</em>
</p>
