
---

# 🌱 **M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels**

<p align="center">
  <img src="DEGREE PROJECT/INVESTIGATION/LOGO.png" width="369" alt="MANGO Logo">
</p>

### **Real-time environmental insights for protecting mangrove ecosystems in Colombia.**

---

## 📌 **What is M.A.N.G.O?**

**M.A.N.G.O** is a low-cost and portable monitoring system designed to measure key water conditions in mangrove ecosystems.
Its main goal is to provide **accurate, real-time environmental information** that supports conservation, scientific research, and decision-making.

Mangroves are essential for:

* Protecting coastal communities from storms
* Filtering polluted water
* Hosting rich biodiversity
* Supporting more than **200,000 families** in Colombia

However, these ecosystems are disappearing due to pollution, illegal mining, and climate change. One of the biggest problems is the **lack of reliable and continuous environmental data**.

M.A.N.G.O helps solve this problem by collecting important water measurements and storing them safely in a **24/7 cloud database**, where they can be used even when the device is not deployed.

---

## 🌊 **What the System Measures**

M.A.N.G.O records three essential water parameters:

* **pH** – indicates acidity or alkalinity
* **Turbidity** – shows water clarity
* **Temperature** – affects species and ecosystem health

The sensors connect to a **Jetson TK1**, which processes the data and sends it through **LoRa IoT** to the base station and then to the cloud database.

---

## ⚠️ **Important Clarification**

The **device itself does NOT operate 24/7** and will **not stay in the water permanently**.
Instead:

* The device is **temporarily deployed** during field sessions.
* Measurements are recorded during each session.
* After sending the data, the device can be **removed, checked, or recharged**.
* The **database** remains available **24/7**, storing all collected information.

This makes the system practical, portable, and safer for both the device and the ecosystem.

---

## ⚡ **Why M.A.N.G.O Matters**

Traditional environmental monitoring in mangroves is:
-  ❌ Manual
- ❌ Slow
- ❌ Infrequent
- ❌ Expensive

M.A.N.G.O offers:
- ✔ Accurate field measurements
- ✔ 24/7 access to stored environmental data
- ✔ Low-cost and portable hardware
- ✔ Clear information for communities and researchers
- ✔ Scalable for more zones in the future

---

## 🧠 **System Overview**

### **Hardware**

* NVIDIA Jetson TK1
* LoRa wireless module
* pH sensor
* Turbidity sensor
* Temperature sensor
* Water-resistant enclosure
* *Possible future upgrade:* solar power module (not included in the current version)

### **Software**

* Sensor reading scripts (Python / C++)
* LoRa transmission code
* Data ingestion (MySQL or cloud database)
* Dashboard for graphs and alerts
* Optional AI predictions (future phase)

---

## 📍 **Planned Pilot Test Site**

The project will conduct **one official field test** in a mangrove area on the Colombian Pacific coast.

Possible locations:

* **Tumaco**
* **Buenaventura**
* **Nuquí**

Only **one** will be selected as the pilot test site based on safety, accessibility, and environmental conditions.

---

## 🌍 **Alignment with the UN Sustainable Development Goals**

M.A.N.G.O contributes to:

* **SDG 9** — Industry, Innovation and Infrastructure
* **SDG 13** — Climate Action
* **SDG 14** — Life Below Water

---

## 📁 **Repository Structure**

```
M.A.N.G.O/
│
├── README.md                 # Project overview
├── LICENSE.md                # MIT License
├── CONTRIBUTING.md           # Contribution guidelines
│
├── docs/
│   ├── overview/             # Concepts and summaries
│   ├── architecture/         # System architecture and diagrams
│   ├── media/                # Logo, banner, diagrams
│   └── tests/                # Notes from calibration and field tests
│
├── hardware/                 # Physical components and design
│   ├── CAD/
│   ├── STL/
│   ├── BOM.md
│   └── wiring.md
│
├── software/                 # Code for sensors, Jetson, and LoRa
│   ├── firmware/
│   ├── jetson/
│   ├── sensors/
│   └── utils/
│
├── database/                 # SQL schema and config
│   ├── schema.sql
│   ├── queries.md
│   └── cloud_config.md
│
└── dashboard/                # Visualization tools
    ├── grafana/
    └── web_dashboard/
```

---

## 🚀 **Current Development Status**

* Core concept defined
* Sensors selected and being tested
* LoRa communication in early testing stage
* Database structure in development
* Dashboard experimentation in progress
* Pilot site selection pending

---

## 🤝 **Contributing**

Contributions and ideas are welcome.
See **CONTRIBUTING.md** for instructions.

---

## 📜 **License**

This project uses the **MIT License**.

---

## 👤 **Author**

**Sebastián Sánchez**
GitHub: [https://github.com/T4t4n32](https://github.com/T4t4n32)

---

## ✨ **Project Tagline**

> **“Technology protecting life — one mangrove at a time.”**

---


