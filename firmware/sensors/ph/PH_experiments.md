# pH Sensor Experiments Log

This document records experimental tests, observations, and technical decisions
related to the pH sensing subsystem of the M.A.N.G.O. project.

The goal of this log is to ensure traceability, avoid repeated mistakes, and
provide transparency on hardware validation steps.

---

## Experiment 01 — Black pH Electrode (Reference / Test Unit)

### Context
- pH electrode of unknown origin (black housing)
- Previously stored dry for an unknown period
- Connected to an incomplete pH interface module (missing filtering capacitor)
- Used as an initial test unit ("sacrificial sensor") to validate electrical behavior

---

### Test Setup
- Microcontroller: Arduino UNO
- Analog input: A0
- ADC reference: 5.0 V
- Firmware: `PH_raw_read.ino`
- Measurement mode: raw ADC value + voltage

---

### Observed Readings
RAW: 1013-1014
Voltage: 4.951-4.956 V


---

### Behavior
- ADC readings saturated near maximum value
- Output voltage locked close to VCC (~5 V)
- Temporary voltage fluctuations observed when changing liquids
- Signal always returned to ~4.95 V after short transients
- Potentiometer adjustments had no lasting effect

---

### Technical Analysis
- Persistent saturation indicates absence of a valid electrochemical signal
- Likely causes:
  - Degraded electrode due to dry storage
  - Unstable reference junction
  - Amplifier offset saturation
  - Additional noise due to missing filtering capacitor on the module
- Behavior is not consistent with a functional pH electrode response

---

### Conclusion
- The black pH electrode is **not suitable** for:
  - Calibration
  - Quantitative pH measurement
  - Further algorithm development
- Sensor behavior confirms hardware degradation rather than software or ADC issues

---

### Decision
- The black electrode is **discarded for active pH sensing**
- No further calibration or testing will be performed using this electrode

---

### Salvage and Reuse Policy
- Any components of the black sensor assembly that remain functional
  (e.g. cables, connectors, BNC interface, mechanical parts)
  may be **reused as spare parts** for the new pH sensor units if compatible
- The electrode itself will not be reused under any circumstances

---

### Next Steps
- Proceed with validation using a new pH electrode (blue housing)
- Use a complete pH interface module with proper filtering components
- Repeat raw voltage validation before attempting calibration
- Only introduce buffer solutions after stable electrical behavior is confirmed

---

**Status:** Closed — diagnostic complete, decision validated
