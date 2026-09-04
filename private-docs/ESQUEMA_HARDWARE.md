### 📦 Lista de Materiales Faltantes

#### 1. Regulación y Gestión de Potencia (Lo más crítico)
Estos componentes convierten tu batería LiPo 3S (11.1V) en voltajes estables y limpios para cada subsistema, y protegen contra descargas profundas.

| Componente | Cantidad Estimada | Función en MANGO | Recomendación Específica |
| :--- | :--- | :--- | :--- |
| **Regulador Buck DC-DC (12V→5V, 3A+)** | 1 | Alimentar la **Jetson TK1** (vía barrel jack) y los sensores de 5V (PH-4502C). Debe ser estable y con buen filtrado. | Recomiendo el **module D24V50F5**. Salida de 5V, 5A, protegido contra cortos y sobrecalentamiento. |
| **Regulador Buck DC-DC (12V/5V→3.3V, 2A+)** | 1-2 | Alimentar el **ESP32, módulos LoRa, MAX31865 y ADC**. Uno dedicado para la parte digital/radio reduce ruido. | **Module D24V22F3** (3.3V, 2.5A) es excelente. Usa uno por cada subcircuito crítico si es necesario. |
| **Protector de Batería LiPo (BMS para 3S)** | 1 | **Protege tu batería** de sobre-descarga, sobrecarga y cortocircuitos. **Esencial** para un despliegue a largo plazo. | **BMS 3S 40A** (o mayor amperaje que tu consumo total). Con balance de celdas. |
| **Panel Solar + Controlador MPPT** | 1 Set | Para **carga autónoma** de la batería en campo. Un panel de 20W-40W y un controlador MPPT pequeño (ej., 10A). | Panel monocristalino de 20W y controlador **EPEVER 10A MPPT**. |
| **Fusibles DC y Portafusibles** | Varios | **Protección contra sobrecorriente** en cada rama principal de alimentación (Jetson, motores, bancada de sensores). | Fusibles de 5x20mm, valores según consumo (ej., 5A para Jetson, 10A para motores). |

#### 2. Acondicionamiento de Señal y Conversión de Nivel (Protege la Jetson)
La **Jetson TK1 funciona a 1.8V**. Todos tus sensores/modulos (ESP32, MAX31865, GPS) son de 3.3V o 5V. Conectarlos directamente la destruirá.

| Componente | Cantidad Estimada | Función en MANGO | Recomendación Específica |
| :--- | :--- | :--- | :--- |
| **Conversor de Nivel Bidireccional (3.3V ↔ 1.8V)** | 2-3 | **Proteger los buses de comunicación** I2C y SPI entre la Jetson (1.8V) y los periféricos (3.3V). | **TXB0108** (8-canales) o **TXB0104** (4-canales). **No uses convertidores unidireccionales** (como el 74HC4050) para I2C/SPI bidireccionales. |
| **ADC de Precisión Externa (16-bit)** | 1 | La Jetson **NO tiene ADC**. Necesitas un chip para leer los sensores analógicos de **pH** y **turbidez** con la precisión que el proyecto requiere. | **ADS1115** (4 canales, I2C, 16-bit). Muy estable y ampliamente compatible. |
| **Amplificador Operacional (Op-Amp) de Precisión** | 2 | **Acondicionar la señal analógica** del sensor de pH (PH-4502C). Posiblemente necesite buffering o re-escaling para aprovechar el rango completo del ADS1115 (0-3.3V). | **MCP6002** (Dual Op-Amp, rail-to-rail, bajo consumo) o **TLV9002**. |
| **Resistencias y Capacitores de Precisión** | 1 Lote | Para construir **filtros paso bajo** (anti-aliasing) y **divisores de voltaje** en las etapas de acondicionamiento de señal. | Resistencias de película metálica 1% y capacitores cerámicos C0G/NP0. |
| **Protectores de E/S (TVS Diodes)** | 1 Lote | **Protección contra picos de voltaje** (ruido, ESD) en las líneas de sensores que llegan desde el exterior de la carcasa. | Diodos TVS unidireccionales para 3.3V y 5V. Colocar cerca de los conectores de entrada. |

#### 3. Conectividad, Robustez y Montaje
Para que el sistema sobreviva en un manglar (humedad, salinidad, vibración).

| Componente | Cantidad Estimada | Función en MANGO | Recomendación Específica |
| :--- | :--- | :--- | :--- |
| **Caja de Montaje IP65/IP67** | 1 | **Carcasa estanca** para la electrónica (Jetson, reguladores, PCB). Los sensores irán fuera con sus propios sellados. | Caja de plástico ABS o policarbonato con junta tórica y portaventana para el panel solar. |
| **Conectores Impermeables (IP67)** | 1 Set | Para conectar **sensores externos** (PT100, pH, turbidez) a la caja electrónica de forma sellada. | Conectores **M12** (circular) o **conectores de aviación** de 3-4 pines. |
| **PCB Prototipo Personalizado** | 1-2 | **No se puede hacer este sistema en protoboard**. Necesitas una placa que integre reguladores, convertidores de nivel, ADC y conectores de forma ordenada y robusta. | Diseña una PCB de 2 o 4 capas. Usa servicios como **JLCPCB** o **PCBWay** para fabricación. |
| **Cableado de Calidad (AWG adecuado)** | 1 Rollo | Para conexiones de potencia (usar calibre grueso como **AWG18**) y señal (cable apantallado para sensores analógicos). | Cable multiconductor con trenza de cobre y blindaje para sensores. |

### 🚨 Advertencia Crítica y Recomendación Final
**No conectes NINGÚN sensor o módulo (ESP32, MAX31865, etc.) directamente a los pines GPIO de la Jetson TK1 sin un conversor de nivel bidireccional (como el TXB0108) en medio.** El voltaje de 3.3V los destruirá.

Mi recomendación de acción es:
1.  **Fase 1 (Prototipo en Banco):** Usa primero el **Arduino UNO/Nano o el ESP32** para caracterizar y calibrar cada sensor individualmente (PT100+MAX31865, pH, turbidez). Esto te dará las fórmulas de conversión.
2.  **Fase 2 (Integración Segura):** Diseña la **PCB** que integre los reguladores de potencia, el conversor de nivel TXB0108, el ADS1115 y los conectores para los sensores. Esta placa será el "hub" entre los sensores y la Jetson.
3.  **Fase 3 (Prueba en Campo Controlada):** Monta todo en la caja IP65, conecta la batería con el BMS y prueba en un entorno real pero con supervisión.

