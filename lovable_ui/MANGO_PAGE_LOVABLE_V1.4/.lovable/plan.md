
# Completar Dashboard M.A.N.G.O - Quitar Modo Preview y Mejorar Diseno

## Resumen

Tres objetivos:
1. **Eliminar el modo preview/stubs** - El dashboard solo funciona con backend real
2. **Mejorar el diseno visual** de tarjetas de sensores y graficos historicos
3. **Verificar el flujo completo** navegando por el dashboard

---

## 1. Eliminar Modo Preview

### Archivos a modificar:

**`src/lib/api.ts`** - Eliminar toda referencia a stubs:
- Quitar imports de `devStubs`
- Quitar la funcion `requestOrStub`
- Todas las funciones API llaman directamente a `request()` sin fallback
- Mantener el timeout de 3s como proteccion general

**`src/lib/devStubs.ts`** - Eliminar este archivo completamente

### Resultado:
- Si no hay backend, el login falla con mensaje claro de error
- Si no hay backend, el dashboard muestra el banner "Sin conexion" y estados de error en las tarjetas
- No hay bypass de autenticacion

---

## 2. Mejorar Diseno de Tarjetas de Sensores

**`src/components/dashboard/SensorCard.tsx`** - Rediseno visual:
- Agregar fondo con gradiente sutil por tipo de sensor (verde para pH, azul para temperatura, cyan para turbidez)
- Icono mas grande con fondo circular semi-transparente
- Indicador de estado mas prominente con etiqueta de texto
- Tipografia del valor mas destacada con mejor contraste
- Borde izquierdo con color del sensor como acento visual
- Transicion suave en hover (elevacion sutil)
- Mejor espaciado y jerarquia visual

---

## 3. Mejorar Diseno de Graficos Historicos

**`src/components/dashboard/SensorChart.tsx`** - Rediseno visual:
- Encabezado con icono del sensor correspondiente (no generico BarChart3)
- Selector de rango con estilo de pills/tabs mas pulido
- Area del grafico con mas altura (de 192px a 220px)
- Mejor estilo del tooltip con nombre del sensor
- Empty state mas visual con ilustracion del tipo de sensor
- Borde superior con color del sensor como acento
- Etiquetas de ejes mas legibles

---

## 4. Mejorar Layout General del Dashboard

**`src/pages/Dashboard.tsx`**:
- Agregar titulo de seccion "Sensores en Tiempo Real" sobre las tarjetas
- Agregar titulo "Historial" sobre los graficos
- Separadores visuales entre secciones
- Mejor espaciado general

**`src/components/dashboard/DashboardHeader.tsx`**:
- Agregar indicador de ultima actualizacion
- Boton de recarga manual

**`src/components/dashboard/ImuPanel.tsx`**:
- Mejorar el empty state con diseno mas visual

---

## 5. Verificacion End-to-End

Despues de implementar, navegar al dashboard usando las herramientas de browser para verificar:
- El login funciona (o muestra error claro sin backend)
- Las tarjetas de sensores se renderizan con los estados correctos
- Los graficos muestran empty state adecuado
- El panel IMU aparece como placeholder
- El header muestra el nombre de usuario y el boton de logout
- El banner de conexion aparece cuando corresponde

---

## Orden de Implementacion

1. Eliminar devStubs.ts y limpiar api.ts
2. Redisenar SensorCard con mejor visual
3. Redisenar SensorChart con mejor visual
4. Mejorar Dashboard layout, DashboardHeader e ImuPanel
5. Verificar flujo completo con browser tools
