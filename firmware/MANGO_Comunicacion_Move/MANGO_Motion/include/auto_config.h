#pragma once
// ================================================================
// M.A.N.G.O. – Modo Automático: Parámetros de misión piscina
// ================================================================
// Todos los tiempos en milisegundos. Ajusta aquí sin tocar el .cpp

// ── Arranque ────────────────────────────────────────────────────
// Tiempo de espera tras activar AUTO antes de que empiece la misión.
static constexpr uint32_t AUTO_WARMUP_MS = 30000UL;   // 30 s

// ── PWM de movimiento autónomo ──────────────────────────────────
// Los ESC trabajan en modo seguro (1400-1600). Ajusta según empuje real.
static constexpr int AUTO_FWD_US   = 1555;   // avance suave
static constexpr int AUTO_REV_US   = 1445;   // reversa suave
static constexpr int AUTO_TURN_L_L = 1445;   // motor izq giro-izq
static constexpr int AUTO_TURN_L_R = 1555;   // motor der giro-izq
static constexpr int AUTO_TURN_R_L = 1555;   // motor izq giro-der
static constexpr int AUTO_TURN_R_R = 1445;   // motor der giro-der
static constexpr int AUTO_SPIN_L   = 1440;   // rotación CW sobre eje
static constexpr int AUTO_SPIN_R   = 1560;   //   (diferencial)

// ── Duraciones de cada maniobra ─────────────────────────────────
static constexpr uint32_t DUR_FWD_LEG_MS   = 4000UL;   // avance un lado piscina
static constexpr uint32_t DUR_TURN_MS       = 2200UL;   // giro 90°
static constexpr uint32_t DUR_SPIN_MS       = 1800UL;   // rotación ~180° sobre eje
static constexpr uint32_t DUR_RETURN_MS     = 4000UL;   // tramo de vuelta
static constexpr uint32_t DUR_STOP_PAUSE_MS = 1000UL;   // pausa corta entre acciones

// ── Paradas de muestreo ─────────────────────────────────────────
static constexpr uint32_t SAMPLE_STOP_MS = 60000UL;   // 1 minuto mínimo

// ── Número de paradas durante el recorrido ──────────────────────
static constexpr uint8_t  NUM_SAMPLE_STOPS = 2;
