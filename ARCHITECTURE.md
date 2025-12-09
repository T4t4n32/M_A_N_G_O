# 🧩 **ARCHITECTURE — M.A.N.G.O System Architecture**

This document describes the complete technical architecture of **M.A.N.G.O (Autonomous Monitoring of Oceanic Management Levels)**.  
It explains how the system collects, transmits, stores, and displays environmental data from mangrove ecosystems.

The architecture is divided into five main layers:

1. **Hardware Layer**
2. **Firmware / Sensor Layer**
3. **Communication Layer (LoRa)**
4. **Data Layer (Database & Cloud)**
5. **Visualization Layer (Dashboard)**

Each layer works together to create a reliable and efficient monitoring system.

---

# 🟦 **1. Hardware Architecture**

The hardware is designed to be **portable, low-cost, and safe for outdoor environments**.

### 🔧 **Main Components**

|Component|Function|
|---|---|
|**NVIDIA Jetson TK1**|Central processor that reads sensors and prepares data packets.|
|**LoRa Module**|Sends data wirelessly to the base station.|
|**pH Sensor**|Measures acidity/alkalinity of water.|
|**Turbidity Sensor**|Measures water clarity.|
|**Temperature Sensor**|Monitors water temperature.|
|**Water-resistant enclosure**|Protects electronics from humidity and salinity.|

### ⚠️ Important Notes

- The device is **not designed to stay in the water 24/7**.
- It is deployed temporarily for field sessions and removed afterward.
- There is **no solar system integrated** at this stage.
- Power is supplied by a conventional external source or battery.
### 📦 **Hardware Goals**

- Portable and safe to handle
- Reliable in wet environments
- Easy to open for calibration or maintenance
- Strong enough for field transport
---

# 🟩 **2. Sensor & Firmware Layer**

This layer handles the **reading, calibration, and formatting** of each environmental variable.

### 🎚 Sensors

- **pH Sensor** → analog input
- **Turbidity Sensor** → analog input
- **Temperature Sensor** → digital or analog depending on model
### 🧠 Sensor Processing

The Jetson TK1:

1. Reads raw sensor values
2. Converts them to real units (pH, NTU, °C)
3. Applies calibration constants
4. Packages them into a data structure ready for LoRa transmission

### 📌 Calibration

Calibration is done **before field deployment**, not during live operation.  
Calibration protocols are stored separately in `/tests/calibration_tests.md`.

---

# 🟨 **3. Communication Architecture (LoRa Layer)**

LoRa is used because it is:

- Low-power
- Long-range
- Good for rural/environmental settings

### 📡 **Workflow**

1. Jetson TK1 sends a data packet to the LoRa module
2. The LoRa module transmits the packet over long distance
3. A **LoRa Gateway** receives the packet
4. The gateway forwards the data to the cloud/database

### 📦 Data Packet Template

A typical transmission includes:

`{   "device_id": "MANGO_01",   "timestamp": "2025-03-10T14:22:11Z",   "ph": 7.42,   "turbidity": 12.8,   "temperature": 27.5 }`

### 🚫 Limitations

- LoRa does **not** support large file transfers
- Only small, structured sensor packets
- Transmission depends on signal conditions
---

# 🟥 **4. Data Architecture (Database & Cloud)**

The **database is the true 24/7 component** of the system.  
It keeps data available even when the device is **offline, removed, or charging**.

### 🗄 Database: MySQL (or compatible)

### 📌 Tables

**1. `readings`**  
Stores all environmental data.

|Field|Type|Description|
|---|---|---|
|id|INT|Primary key|
|device_id|VARCHAR|Device identifier|
|timestamp|DATETIME|When the measurement was recorded|
|ph|FLOAT|pH value|
|turbidity|FLOAT|NTU turbidity level|
|temperature|FLOAT|Temperature in °C|

**2. `devices`**  
Stores metadata (optional).

### 📡 Data Flow

1. Gateway → Cloud API
2. Cloud API → Database insertion
3. Dashboard reads directly from the database
---

# 🟪 **5. Visualization Architecture (Dashboard Layer)**

The dashboard converts database values into **easy-to-understand visuals**, ideal for:

- Researchers
- Environmental authorities
- Communities
- Academic presentations

### 📊 Dashboard Options

- **Grafana** (recommended)
- Custom Web Dashboard (HTML/JS/Python)

### 📈 Visual Tools

- Real-time charts (temperature, turbidity, pH)
- Alerts for abnormal values
- Tables and exportable CSV reports
- Daily/weekly averages
---

# 🌐 **System Architecture Diagram (Text Version)**

 `┌──────────────────────────────────────────────────────────────┐  │                          Hardware                            │  │ Jetson TK1 → Sensors (pH, Turbidity, Temp) → LoRa Transmitter│  └──────────────────────────────────────────────────────────────┘                  │                  ▼  ┌──────────────────────────────────────────────────────────────┐  │                       Communication Layer                     │  │                  LoRa Wireless Transmission                   │  └──────────────────────────────────────────────────────────────┘                  │                  ▼  ┌──────────────────────────────────────────────────────────────┐  │                     Gateway / Cloud API                       │  └──────────────────────────────────────────────────────────────┘                  │                  ▼  ┌──────────────────────────────────────────────────────────────┐  │                         Database Layer                        │  │            MySQL — Stores data 24/7 for visualization         │  └──────────────────────────────────────────────────────────────┘                  │                  ▼  ┌──────────────────────────────────────────────────────────────┐  │                       Visualization Layer                     │  │       Dashboard (Grafana/Web) → Real-time environmental data  │  └──────────────────────────────────────────────────────────────┘`

---

# 🧭 **Key Design Principles**

- **Portability:** device is not fixed permanently
- **Reliability:** database ensures data persistence
- **Simplicity:** easy deployment and retrieval
- **Scalability:** future devices can be added
- **Safety:** safe operation in mangrove environments

---

# 👤 **Maintainer**

**Sebastián Sánchez**  
GitHub: [https://github.com/T4t4n32](https://github.com/T4t4n32)