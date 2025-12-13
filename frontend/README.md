Perfecto, gracias por traer **el código completo** 👍
Ahora sí estamos **exactamente en el punto correcto: B.1 — adaptar el dashboard al backend real**, **sin romper nada** y **marcando claramente qué debes cambiar**.

Voy a hacerlo **por secciones**, tal como pediste, señalando:

* ❌ **LO QUE YA NO VA**
* ✅ **LO NUEVO**
* 🔧 **“AQUÍ CAMBIAS / COLOCAS”**

No voy a reescribir todo el HTML, **solo el `<script>`**, que es donde está el cambio real.

---

# 🧭 OBJETIVO DEL PASO B.1

Reemplazar:

* ❌ `fakeFetchSeries(...)`
* ❌ `startFakeSSE()`

por:

* ✅ `fetch()` real al backend Flask
* ✅ `EventSource` real (`/api/stream`)
* ✅ Uso de **cookies de sesión** (`credentials: "include"`)

---

# 1️⃣ CONFIGURACIÓN GLOBAL (NUEVO)

👉 **AL INICIO del `<script>`**, agrega esto:

```js
/* =============================
   BACKEND CONFIG
   ============================= */

const API_BASE = "http://localhost:5000/api"; 
// 🔧 CAMBIA ESTO si el backend está en otro host o puerto
```

---

# 2️⃣ ELIMINAR API SIMULADA ❌

❌ **BORRA COMPLETAMENTE** esta función:

```js
function fakeFetchSeries(type, hours){
  ...
}
```

Ya **no se usa más**.

---

# 3️⃣ FETCH REAL PARA SERIES TEMPORALES ✅

### 🔁 Reemplaza estas funciones:

#### ❌ ANTES

```js
const d = await fakeFetchSeries('level', h);
```

---

### ✅ DESPUÉS (CÓDIGO NUEVO)

#### 📊 Nivel

```js
async function reloadLevel(){
  const h = +document.getElementById('range-level').value;

  const res = await fetch(
    `${API_BASE}/range/level?hours=${h}`,
    { credentials: "include" } // 🔧 IMPORTANTE
  );

  if (!res.ok) {
    alert("No autorizado. Inicia sesión.");
    return;
  }

  const d = await res.json();

  levelChart.data.labels = d.map(x =>
    new Date(x.timestamp).toLocaleTimeString()
  );
  levelChart.data.datasets[0].data = d.map(x => x.value);
  levelChart.update();

  document.getElementById('stat-level').innerText =
    d[d.length - 1].value;
}
```

---

#### 🌡️ Temperatura

```js
async function reloadTemp(){
  const h = +document.getElementById('range-temp').value;

  const res = await fetch(
    `${API_BASE}/range/temperature?hours=${h}`,
    { credentials: "include" }
  );

  if (!res.ok) return;

  const d = await res.json();

  tempChart.data.labels = d.map(x =>
    new Date(x.timestamp).toLocaleTimeString()
  );
  tempChart.data.datasets[0].data = d.map(x => x.value);
  tempChart.update();

  document.getElementById('stat-temp').innerText =
    d[d.length - 1].value;
}
```

---

#### 🧂 Salinidad

```js
async function reloadSal(){
  const h = +document.getElementById('range-sal').value;

  const res = await fetch(
    `${API_BASE}/range/salinity?hours=${h}`,
    { credentials: "include" }
  );

  if (!res.ok) return;

  const d = await res.json();

  salChart.data.labels = d.map(x =>
    new Date(x.timestamp).toLocaleTimeString()
  );
  salChart.data.datasets[0].data = d.map(x => x.value);
  salChart.update();

  document.getElementById('stat-sal').innerText =
    d[d.length - 1].value;
}
```

---

# 4️⃣ REEMPLAZAR SSE SIMULADO ❌ → SSE REAL ✅

## ❌ BORRA COMPLETAMENTE

```js
function startFakeSSE(){ ... }
```

---

## ✅ AGREGA SSE REAL

```js
/* =============================
   REALTIME DATA (SSE REAL)
   ============================= */

function startSSE(){
  const evt = new EventSource(`${API_BASE}/stream`, {
    withCredentials: true // 🔧 MUY IMPORTANTE
  });

  evt.onmessage = (event) => {
    const data = JSON.parse(event.data);

    const time = new Date(data.timestamp).toLocaleTimeString();

    pushPoint(levelChart, time, data.level);
    pushPoint(tempChart, time, data.temperature);
    pushPoint(salChart, time, data.salinity);

    document.getElementById('stat-level').innerText = data.level;
    document.getElementById('stat-temp').innerText = data.temperature;
    document.getElementById('stat-sal').innerText = data.salinity;
  };

  evt.onerror = () => {
    console.error("SSE connection lost");
    evt.close();
  };
}
```

---

# 5️⃣ INICIALIZACIÓN FINAL (CAMBIO CLAVE)

❌ ANTES:

```js
reloadLevel();reloadTemp();reloadSal();startFakeSSE();
```

✅ DESPUÉS:

```js
reloadLevel();
reloadTemp();
reloadSal();
startSSE(); // 🔧 CAMBIO CLAVE
```

---

# 6️⃣ RESUMEN DE LO QUE CAMBIASTE (IMPORTANTE)

| Antes               | Ahora            |
| ------------------- | ---------------- |
| `fakeFetchSeries()` | `fetch()` real   |
| Datos falsos        | API Flask        |
| `setInterval()`     | SSE real         |
| Sin sesión          | Cookies Flask    |
| Simulación          | Producción-ready |

---

# 7️⃣ CHECKLIST PARA PROBAR 🔍

1. Backend corriendo:

   ```bash
   python main.py
   ```

2. Login hecho correctamente (`/api/login`)

3. Abrir `dashboard.html` **desde el mismo navegador**

4. Ver:

   * Gráficos cargan
   * KPIs se actualizan
   * Datos en tiempo real

---

## 🟢 ESTADO ACTUAL DEL PROYECTO

* ✅ Arquitectura limpia
* ✅ Backend real
* ✅ Frontend conectado
* ✅ Tiempo real funcional

---

Cuando confirmes:

> **El dashboard ya consume datos reales**

pasamos **sin romper nada** a:

👉 **C — Seguridad, base de datos y datos reales del dispositivo**
