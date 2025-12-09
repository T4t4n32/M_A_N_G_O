# 🌱 **M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels**

<p align="center">
  <img src="DEGREE PROJECT/INVESTIGATION/LOGO.png" width="369" alt="MANGO Logo">
</p>

<p align="center">
  <!-- Badges profesionales -->
  ![Release](https://img.shields.io/github/v/release/T4t4n32/M.A.N.G.O?style=for-the-badge&color=orange&label=Release)
  ![Version](https://img.shields.io/github/v/tag/T4t4n32/M.A.N.G.O?style=for-the-badge&color=green&label=Version)
  ![Status](https://img.shields.io/badge/status-stable-brightgreen?style=for-the-badge)
</p>

### **Real-time environmental insights for protecting mangrove ecosystems in Colombia.**

---

## 📌 **What is M.A.N.G.O?**

**M.A.N.G.O** is a **low-cost, portable, modular monitoring system** designed to measure key water conditions in mangrove ecosystems.  
Its goal: provide **accurate, real-time environmental information** to support conservation, research, and decision-making.

Mangroves are essential for:

* Protecting coastal communities from storms  
* Filtering polluted water  
* Hosting rich biodiversity  
* Supporting over **200,000 families** in Colombia  

These ecosystems face threats such as **pollution, illegal mining, and climate change**, worsened by **lack of continuous and reliable environmental data**.  

**M.A.N.G.O addresses this** by collecting essential water parameters and storing them in a **24/7 cloud database**, accessible even when the device is not deployed.

---

## 🌊 **System Measurements**

M.A.N.G.O records:

* **pH** – water acidity/alkalinity  
* **Turbidity** – water clarity  
* **Temperature** – affects species and ecosystem health  

Data flow: Sensors → **Jetson TK1** → **LoRa IoT** → Base station → Cloud database  

---

## ⚠️ **Important Clarification**

The device **does NOT operate 24/7 in water**. Instead:

* Temporarily deployed during field sessions  
* Measurements recorded and sent to the database  
* Device can be **removed, checked, or recharged** after sessions  
* **Database remains accessible 24/7**  

This ensures **practicality, portability, and ecosystem safety**.

---

## ⚡ **Why M.A.N.G.O Matters**

Traditional monitoring in mangroves is:

- ❌ Manual  
- ❌ Slow  
- ❌ Infrequent  
- ❌ Expensive  

M.A.N.G.O provides:

- ✔ Accurate field measurements  
- ✔ 24/7 access to environmental data  
- ✔ Low-cost, portable hardware  
- ✔ Clear information for communities and researchers  
- ✔ Scalable to additional zones  

---

## 🧠 **System Overview**

### **Hardware**

* NVIDIA Jetson TK1  
* LoRa wireless module  
* pH, Turbidity, and Temperature sensors  
* Water-resistant enclosure  
* *Future upgrade:* solar power module  

### **Software**

* Sensor reading scripts (Python / C++)  
* LoRa transmission code  
* Data ingestion (MySQL / Cloud)  
* Dashboard for graphs and alerts  
* Optional AI predictions (future phase)  

---

## 📍 **Planned Pilot Test Site**

Official pilot test will be conducted in **one mangrove area on the Colombian Pacific coast**:  

* **Tumaco**  
* **Buenaventura**  
* **Nuquí**  

Selection based on **safety, accessibility, and environmental conditions**.

---

## 🌍 **Alignment with UN Sustainable Development Goals**

M.A.N.G.O contributes to:

* **SDG 9** — Industry, Innovation, and Infrastructure  
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
* Sensors selected and tested  
* LoRa communication in early testing  
* Database structure in development  
* Dashboard experimentation in progress  
* Pilot site selection pending  

---

## 🤝 **Contributing**

Contributions and ideas are welcome. See [**CONTRIBUTING.md**](CONTRIBUTING.md) for instructions.

---

## 📜 **License**

This project uses the [**MIT License**](LICENSE.md).

---

## 👤 **Author**

**Sebastián Sánchez**  
GitHub: [https://github.com/T4t4n32](https://github.com/T4t4n32)

---

## ✨ **Project Tagline**

> **“Technology protecting life — one mangrove at a time.”**
