# pH Sensor – Experimental Log & Observations

## Project
**M.A.N.G.O. — Autonomous Monitoring of Oceanic Management Levels**

This document records the experimental behavior, limitations, and observations of the pH sensors used during the early development and testing phase of the project.

The purpose of this file is **documentation and traceability**, not final calibration or validated results.

---

## 1. Context

During the sensor integration phase, multiple pH sensors and modules of **uncertain origin** were tested in order to:

- Understand baseline electrical behavior
- Evaluate module stability
- Identify calibration feasibility
- Decide whether sensors are suitable for dashboard integration

Two different pH sensors were involved:

- **Black pH sensor** (unknown reference, used as test unit)
- **Blue pH sensor** (new, complete module, not fully tested yet)

---

## 2. Hardware Overview

### 2.1 pH Sensor (Black – Test Unit)

- Reference: Unknown
- Electrode condition at arrival: **Dry**
- Module condition: **Incomplete**
  - Missing capacitor (filter / stabilization component)
- Purpose:
  - Used as *experimental / sacrificial unit*
  - Parts that remain functional may be reused as spare components

### 2.2 pH Sensor (Blue – New Unit)

- Reference: Chinese-manufactured module (manual translated)
- Module condition: **Complete**
- Storage solution provided by manufacturer:
  - **3N KCl solution**
- Status:
  - Not yet fully tested
  - Reserved for structured calibration once procedure is validated

---

## 3. Test Environment

- Microcontroller: Arduino Uno
- Power supply: 5V (Arduino)
- Analog input: A0
- Liquids used:
  - Deionized water
  - Sensor storage solution (3N KCl)
- Note:
  - No official buffer solutions (pH 4.01 / 7.01 / 10.01) available at this stage

---

## 4. Raw Voltage Observations

### 4.1 Initial Measurements (Black Sensor)

Repeated readings showed **near-saturation behavior**:

RAW: 1013 | Voltage: 4.951 V
RAW: 1014 | Voltage: 4.956 V
RAW: 1015 | Voltage: 4.961 V

Characteristics:

- Voltage remains close to 5V
- Minimal response to liquid changes
- Minor fluctuations but no stable trend
- Adjusting potentiometers did **not** resolve saturation

---

### 4.2 Behavior After Electrode Hydration

The electrode was rehydrated after being confirmed dry.

Observed behavior:

- Initial voltage drop (~3.x V)
- Gradual drift back toward higher voltages (4.4 – 4.7 V)
- Potentiometer adjustment allowed partial tuning
- Lower voltage bound reached (~3.35 V), but could not be reduced further

This suggests **partial recovery**, but not reliable operation.

---

## 5. Potentiometer Adjustment Notes

- One potentiometer affects offset
- Adjustment allows voltage to increase or decrease
- Lower limit observed:
  - Approximately **3.3 – 3.4 V**
- Reconnecting the sensor does not reset this lower bound

Interpretation:

- Module design or missing capacitor may be limiting analog output range
- Sensor output does not span the expected pH voltage range

---

## 6. Key Findings

- The black pH sensor **cannot be reliably calibrated**
- Output voltage tends to saturate near supply voltage
- Sensor response to different liquids is weak or inconsistent
- Missing stabilization components likely affect signal integrity
- Results are **not suitable for meaningful pH computation**

---

## 7. Project Decisions

Based on current evidence:

- ❌ The black sensor will **not** be used for production measurements
- ✅ Remaining functional parts may be reused as spares
- 🔄 Focus shifts to:
  - Proper procedure
  - Controlled calibration
  - Testing with the new blue pH sensor

---

## 8. Next Steps (Planned)

- Acquire or prepare proper buffer solutions:
  - pH 4.01
  - pH 7.01
  - pH 10.01
- Define a repeatable calibration procedure
- Validate raw voltage ranges before computing pH
- Only integrate pH data into the dashboard after stable calibration

---

## 9. Notes on Documentation Strategy

This experiment is intentionally documented **before achieving success** to:

- Preserve development transparency
- Avoid false assumptions
- Support future debugging and peer review

Unstable or inconclusive results are part of the engineering process and are documented accordingly.

---

**Status:** Experimental / Not calibrated  
**Reliability:** Low  
**Dashboard integration:** Not recommended at this stage
