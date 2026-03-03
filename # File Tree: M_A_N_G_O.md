# File Tree: M_A_N_G_O

**Generated:** 3/3/2026, 8:44:26 AM
**Root Path:** `/home/t4t4n_32/Documents/repositorios/M_A_N_G_O`

```
├── 📁 .github
│   └── 📁 workflows
│       └── ⚙️ blank.yml
├── 📁 backend
│   ├── 📁 app
│   │   ├── 📁 middleware
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 auth_middleware.py
│   │   │   ├── 🐍 logging_middleware.py
│   │   │   └── 🐍 rate_limit_middleware.py
│   │   ├── 📁 models
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 access.py
│   │   │   ├── 🐍 schemas.py
│   │   │   ├── 🐍 sensor.py
│   │   │   └── 🐍 user.py
│   │   ├── 📁 routes
│   │   │   ├── 📁 _legacy
│   │   │   │   └── 📝 README.md
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 dashboard_api.py
│   │   │   └── 🐍 health.py
│   │   ├── 📁 routes_old
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 admin.py
│   │   │   ├── 🐍 api.py
│   │   │   ├── 🐍 auth.py
│   │   │   ├── 🐍 compat_ingest.py
│   │   │   ├── 🐍 dashboard_api.py
│   │   │   ├── 🐍 data.py
│   │   │   ├── 🐍 health.py
│   │   │   ├── 🐍 health_compat.py
│   │   │   ├── 🐍 institutions.py
│   │   │   ├── 🐍 lovable_auth.py
│   │   │   ├── 🐍 lovable_compat.py
│   │   │   ├── 🐍 public.py
│   │   │   ├── 🐍 sensors.py
│   │   │   ├── 🐍 sensors_data.py
│   │   │   └── 🐍 websocket.py
│   │   ├── 📁 services
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 auth_service.py
│   │   │   ├── 🐍 data_service.py
│   │   │   ├── 🐍 email_service.py
│   │   │   ├── 🐍 export_service.py
│   │   │   ├── 🐍 notification_service.py
│   │   │   ├── 🐍 sensor_service.py
│   │   │   ├── 🐍 sensor_store.py
│   │   │   └── 🐍 validation_service.py
│   │   ├── 📁 tasks
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 email_tasks.py
│   │   │   ├── 🐍 maintenance_tasks.py
│   │   │   └── 🐍 sensor_tasks.py
│   │   ├── 📁 utils
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 decorators.py
│   │   │   ├── 🐍 helpers.py
│   │   │   ├── 🐍 pagination.py
│   │   │   ├── 🐍 security.py
│   │   │   └── 🐍 validators.py
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 bootstrap.py
│   │   ├── 🐍 celery_ext.py
│   │   ├── 🐍 config.py
│   │   ├── 🐍 extensions.py
│   │   ├── 🐍 models.py
│   │   ├── 🐍 models_compat.py
│   │   └── 🐍 routes.py
│   ├── 📁 data
│   │   └── 📄 mango.db
│   ├── 📁 migrations
│   │   └── ⚙️ alembic.ini
│   ├── 📁 scripts
│   │   ├── 🐍 __init__.py
│   │   └── 🐍 insert_readings.py
│   ├── 🐳 Dockerfile
│   ├── 📝 README.md
│   ├── 📄 README.txt
│   ├── 🐍 __init__.py
│   ├── 🐍 celery_app.py
│   ├── 🐍 db_init.py
│   ├── 📄 entrypoint.sh
│   ├── 🐍 main.py
│   ├── 📄 requirements.txt
│   └── 🐍 wsgi.py
├── 📁 bridge
│   ├── 🐳 Dockerfile
│   ├── 🐍 lora_http_bridge.py
│   ├── 📄 requirements.bridge.txt
│   └── 📄 spool.jsonl
├── 📁 deploy
│   ├── 📁 edge-jetson
│   │   ├── 📁 systemd
│   │   │   ├── 📄 mango-edge-api.service
│   │   │   └── 📄 mango-edge-sync.service
│   │   ├── ⚙️ .env.edge
│   │   └── ⚙️ compose.edge.yaml
│   ├── 📁 gateway-laptop
│   │   ├── 📁 systemd
│   │   │   └── 📄 mango-rx-gateway.service
│   │   └── ⚙️ .env.gateway
│   └── 📁 vps
│       ├── 📁 nginx
│       │   └── ⚙️ default.conf
│       ├── ⚙️ .env.vps
│       └── ⚙️ compose.vps.yaml
├── 📁 docs
│   ├── 📝 API_CONTRACT.md
│   ├── 📝 DEPLOYMENT.md
│   ├── 📝 LORA_PROTOCOL.md
│   └── 📝 TROUBLESHOOTING.md
├── 📁 edge
│   ├── 📁 app
│   │   ├── 📁 routes
│   │   │   ├── 🐍 dashboard_api.py
│   │   │   ├── 🐍 health.py
│   │   │   └── 🐍 ingest.py
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 config.py
│   │   └── 🐍 db.py
│   ├── 📁 scripts
│   │   ├── 📄 export_local_data.sh
│   │   └── 📄 run_edge_dev.sh
│   ├── 📁 sync
│   │   ├── 📝 policy.md
│   │   ├── 📄 spool.sqlite
│   │   └── 🐍 sync_worker.py
│   ├── 📝 README.md
│   └── 📄 VERSION
├── 📁 firmware
│   ├── 📁 LoRa
│   │   ├── 📁 1st_test
│   │   │   ├── 📁 Receptor_LoRa_ESP32
│   │   │   │   └── 📄 Receptor_LoRa_ESP32.ino
│   │   │   └── 📁 Transmisor_LoRa_Wireless_Stick
│   │   │       └── 📄 Transmisor_LoRa_Wireless_Stick.ino
│   │   ├── 📁 2nd_test
│   │   │   ├── 📁 Receptor_ESP32_WROOM
│   │   │   │   └── 📁 Receptor_ESP32_WROOM
│   │   │   │       └── 📄 Receptor_ESP32_WROOM.ino
│   │   │   └── 📁 Transmisor_Heltec_Wifi_LoRa_V3
│   │   │       └── 📄 Transmisor_Heltec_Wifi_LoRa_V3.ino
│   │   ├── 📁 3th_test
│   │   │   ├── 📁 rx_heltec_wifi_lora32
│   │   │   │   ├── 📁 v1.5.0
│   │   │   │   │   ├── 📁 .pio
│   │   │   │   │   │   └── 📁 libdeps
│   │   │   │   │   │       ├── 📁 heltec_wifi_lora_32_V2
│   │   │   │   │   │       │   ├── 📁 LoRa
│   │   │   │   │   │       │   │   ├── 📁 examples
│   │   │   │   │   │       │   │   ├── 📁 src
│   │   │   │   │   │       │   │   ├── ⚙️ .piopm
│   │   │   │   │   │       │   │   ├── ⚙️ .travis.yml
│   │   │   │   │   │       │   │   ├── 📝 API.md
│   │   │   │   │   │       │   │   ├── 📄 LICENSE
│   │   │   │   │   │       │   │   ├── 📝 README.md
│   │   │   │   │   │       │   │   ├── 📝 issue_template.md
│   │   │   │   │   │       │   │   ├── 📄 keywords.txt
│   │   │   │   │   │       │   │   └── 📄 library.properties
│   │   │   │   │   │       │   └── 📄 integrity.dat
│   │   │   │   │   │       └── 📁 heltec_wifi_lora_32_V3
│   │   │   │   │   │           ├── 📁 LoRa
│   │   │   │   │   │           │   ├── 📁 examples
│   │   │   │   │   │           │   ├── 📁 src
│   │   │   │   │   │           │   ├── ⚙️ .piopm
│   │   │   │   │   │           │   ├── ⚙️ .travis.yml
│   │   │   │   │   │           │   ├── 📝 API.md
│   │   │   │   │   │           │   ├── 📄 LICENSE
│   │   │   │   │   │           │   ├── 📝 README.md
│   │   │   │   │   │           │   ├── 📝 issue_template.md
│   │   │   │   │   │           │   ├── 📄 keywords.txt
│   │   │   │   │   │           │   └── 📄 library.properties
│   │   │   │   │   │           └── 📄 integrity.dat
│   │   │   │   │   ├── 📁 src
│   │   │   │   │   │   ├── 📁 forward
│   │   │   │   │   │   │   └── ⚡ serial_forward.cpp
│   │   │   │   │   │   ├── 📁 lora
│   │   │   │   │   │   │   └── ⚡ lora_rx.cpp
│   │   │   │   │   │   └── ⚡ main.cpp
│   │   │   │   │   └── ⚙️ platformio.ini
│   │   │   │   └── 📝 README.md
│   │   │   └── 📁 tx_wireless_stick_v3
│   │   │       ├── 📁 v1.5.0
│   │   │       │   ├── 📁 .pio
│   │   │       │   │   └── 📁 libdeps
│   │   │       │   │       └── 📁 heltec_wireless_stick_v3
│   │   │       │   │           ├── 📁 ArduinoJson
│   │   │       │   │           │   ├── 📁 examples
│   │   │       │   │           │   ├── 📁 src
│   │   │       │   │           │   ├── ⚙️ .piopm
│   │   │       │   │           │   ├── ⚡ ArduinoJson.h
│   │   │       │   │           │   ├── 📄 LICENSE.txt
│   │   │       │   │           │   ├── 📝 README.md
│   │   │       │   │           │   ├── ⚙️ library.json
│   │   │       │   │           │   └── 📄 library.properties
│   │   │       │   │           ├── 📁 LoRa
│   │   │       │   │           │   ├── 📁 examples
│   │   │       │   │           │   ├── 📁 src
│   │   │       │   │           │   ├── ⚙️ .piopm
│   │   │       │   │           │   ├── ⚙️ .travis.yml
│   │   │       │   │           │   ├── 📝 API.md
│   │   │       │   │           │   ├── 📄 LICENSE
│   │   │       │   │           │   ├── 📝 README.md
│   │   │       │   │           │   ├── 📝 issue_template.md
│   │   │       │   │           │   ├── 📄 keywords.txt
│   │   │       │   │           │   └── 📄 library.properties
│   │   │       │   │           └── 📄 integrity.dat
│   │   │       │   ├── 📁 boards
│   │   │       │   │   └── ⚙️ heltec_wireless_stick_v3.json
│   │   │       │   ├── 📁 src
│   │   │       │   │   ├── 📁 lora
│   │   │       │   │   │   └── ⚡ lora_tx.cpp
│   │   │       │   │   ├── 📁 payload
│   │   │       │   │   │   └── ⚡ payload_builder.cpp
│   │   │       │   │   ├── 📁 sensors
│   │   │       │   │   │   ├── ⚡ ph.cpp
│   │   │       │   │   │   ├── ⚡ temperature.cpp
│   │   │       │   │   │   └── ⚡ turbidity.cpp
│   │   │       │   │   └── ⚡ main.cpp
│   │   │       │   └── ⚙️ platformio.ini
│   │   │       └── 📝 README.md
│   │   └── 📁 4th_test
│   │       ├── 📁 rx_esp32_ra-02
│   │       │   └── 📄 rx_esp32_ra-02.ino
│   │       └── 📁 tx_esp32_ra-02
│   │           └── 📄 tx_esp32_ra-02.ino
│   ├── 📁 Motor
│   │   └── 📄 Motor.ino
│   ├── 📁 Others
│   │   └── 📁 Breackout_1.1_Blink
│   │       └── 📁 Breackout_1.1_Blink
│   │           ├── 📁 Breackout_1.1_Blink
│   │           │   └── 📄 Breackout_1.1_Blink.ino
│   │           ├── 📄 LICENSE.txt
│   │           └── 📝 README.md
│   └── 📁 sensors
│       ├── 📁 combined
│       │   ├── 📁 Sensors_V0.1.0
│       │   │   └── 📄 Sensors_V0.1.0.ino
│       │   ├── 📁 Sensors_V0.1.1
│       │   │   └── 📄 Sensors_V0.1.1.ino
│       │   ├── 📁 Sensors_V0.1.2
│       │   │   └── 📄 Sensors_V0.1.2.ino
│       │   ├── 📁 Sensors_V0.1.3
│       │   │   └── 📄 Sensors_V0.1.3.ino
│       │   ├── 📁 Sensors_V0.1.4
│       │   │   └── 📄 Sensors_V0.1.4.ino
│       │   ├── 📁 Sensors_V0.1.5
│       │   │   └── 📄 Sensors_V0.1.5.ino
│       │   ├── 📁 Sensors_V1.0.0
│       │   │   └── 📄 Sensors_V1.0.0.ino
│       │   ├── 📁 Sensors_V1.1.0
│       │   │   └── 📄 Sensors_V1.1.0.ino
│       │   ├── 📁 Sensors_V1.2.0
│       │   │   └── 📄 Sensors_V1.2.0.ino
│       │   ├── 📁 Sensors_V1.2.1
│       │   │   └── 📄 Sensors_V1.2.1.ino
│       │   ├── 📁 Sensors_V1.3.0
│       │   │   └── 📄 Sensors_V1.3.0.ino
│       │   ├── 📁 Sensors_V1.4.1
│       │   │   └── 📄 Sensors_V1.4.1.ino
│       │   └── 📁 Sensors_V1.5.0
│       │       ├── 📁 All
│       │       │   ├── 📁 RX_ALL_CLEAN_V1.5.0
│       │       │   │   └── 📄 RX_ALL_CLEAN_V1.5.0.ino
│       │       │   ├── 📁 RX_ALL_V1.5.0
│       │       │   │   └── 📄 RX_ALL_V1.5.0.ino
│       │       │   └── 📁 TX_ALL_V1.5.0
│       │       │       └── 📄 TX_ALL_V1.5.0.ino
│       │       ├── 📁 Temperatura
│       │       │   ├── 📁 RX_Temperature_V1.5.0
│       │       │   │   └── 📄 RX_Temperature_V1.5.0.ino
│       │       │   └── 📁 TX_Temperature_V1.5.0
│       │       │       └── 📄 TX_Temperature_V1.5.0.ino
│       │       ├── 📁 Turbidity
│       │       │   ├── 📁 RX_Turbidity_V1.5.0
│       │       │   │   └── 📄 RX_Turbidity_V1.5.0.ino
│       │       │   └── 📁 TX_Turbidity_V1.5.0.ino
│       │       │       └── 📄 TX_Turbidity_V1.5.0.ino.ino
│       │       ├── 📁 ph
│       │       │   ├── 📁 RX_PH_V1.5.0
│       │       │   │   └── 📄 RX_PH_V1.5.0.ino
│       │       │   └── 📁 TX_PH_V1.5.0
│       │       │       └── 📄 TX_PH_V1.5.0.ino
│       │       └── 📁 test_LoRa
│       │           └── 📄 test_LoRa.ino
│       ├── 📁 ph
│       │   ├── 📁 PH_calibrated
│       │   │   └── 📄 PH_calibrated.ino
│       │   ├── 📁 PH_calibrated_V7-V4
│       │   │   └── 📄 PH_calibrated_V7-V4.ino
│       │   ├── 📁 PH_measure
│       │   │   └── 📄 PH_measure.ino
│       │   ├── 📁 PH_raw_read
│       │   │   └── 📄 PH_raw_read.ino
│       │   ├── 📁 Sensors_PH_V0.1.0
│       │   │   └── 📄 Sensors_PH_V0.1.0.ino
│       │   ├── 📁 Sensors_PH_V1.0.0
│       │   │   └── 📄 Sensors_PH_V1.0.0.ino
│       │   ├── 📁 Sensors_PH_V1.1.0
│       │   │   └── 📄 Sensors_PH_V1.1.0.ino
│       │   └── 📝 PH_experiments.md
│       ├── 📁 temperature
│       │   ├── 📁 Sensors_Temperatura_V0.1.0
│       │   │   └── 📄 Sensors_Temperatura_V0.1.0.ino
│       │   ├── 📁 Sensors_Temperatura_V0.1.1
│       │   │   └── 📄 Sensors_Temperatura_V0.1.1.ino
│       │   ├── 📁 Temperature_3_Wire_ESP32_V1.2.0
│       │   │   └── 📄 Temperature_3_Wire_ESP32_V1.2.0.ino
│       │   ├── 📁 Temperature_3_Wire_V1.0.0
│       │   │   └── 📄 Temperature_3_Wire_V1.0.0.ino
│       │   ├── 📁 Temperature_3_Wire_V1.1.0
│       │   │   └── 📄 Temperature_3_Wire_V1.1.0.ino
│       │   ├── 📁 Temperature_3_Wire_V1.2.0
│       │   │   └── 📄 Temperature_3_Wire_V1.2.0.ino
│       │   └── 📁 Temperature_4_Wire_V1.0.0
│       │       └── 📄 Temperature_4_Wire_V1.0.0.ino
│       └── 📁 turbidity
│           ├── 📁 Sensors_Turbidez_V0.1.0
│           │   └── 📄 Sensors_Turbidez_V0.1.0.ino
│           ├── 📁 Sensors_Turbidez_V1.0.0
│           │   └── 📄 Sensors_Turbidez_V1.0.0.ino
│           ├── 📁 Sensors_Turbidez_V1.1.0
│           │   └── 📄 Sensors_Turbidez_V1.1.0.ino
│           ├── 📁 Sensors_Turbidez_V1.2.0
│           │   └── 📄 Sensors_Turbidez_V1.2.0.ino
│           ├── 📁 Sensors_Turbidez_V1.3.0
│           │   └── 📄 Sensors_Turbidez_V1.3.0.ino
│           ├── 📁 Sensors_Turbidez_V1.4.0
│           │   └── 📄 Sensors_Turbidez_V1.4.0.ino
│           └── 📁 Sensors_Turbidez_V1.5.0
│               └── 📄 Sensors_Turbidez_V1.5.0.ino
├── 📁 frontend
│   ├── 📁 images
│   │   ├── 📁 gallery
│   │   │   └── 📁 hardware
│   │   │       ├── 🖼️ hardware_100_MONTAJE_LORA_HELTEC (6).jpg
│   │   │       ├── 🖼️ hardware_101_MONTAJE_LORA_HELTEC (7).jpg
│   │   │       ├── 🖼️ hardware_102_MONTAJE_PH (1).jpg
│   │   │       ├── 🖼️ hardware_103_MONTAJE_PH (2).jpg
│   │   │       ├── 🖼️ hardware_104_MONTAJE_PH (3).jpg
│   │   │       ├── 🖼️ hardware_105_MONTAJE_PH (4).jpg
│   │   │       ├── 🖼️ hardware_106_MONTAJE_PH (5).jpg
│   │   │       ├── 🖼️ hardware_107_MONTAJE_PH (6).jpg
│   │   │       ├── 🖼️ hardware_108_PAQUETE_1.jpg
│   │   │       ├── 🖼️ hardware_109_PAQUETES.jpg
│   │   │       ├── 🖼️ hardware_10_APISQUEEN_PAQUETE (8).jpg
│   │   │       ├── 🖼️ hardware_110_PAQUETES__LLEGADA.jpg
│   │   │       ├── 🖼️ hardware_111_Paquetes_MANGO.jpg
│   │   │       ├── 🖼️ hardware_112_PH (1).jpg
│   │   │       ├── 🖼️ hardware_113_PH (2).jpg
│   │   │       ├── 🖼️ hardware_114_PH (3).jpg
│   │   │       ├── 🖼️ hardware_115_SENSOR.jpg
│   │   │       ├── 🖼️ hardware_116_sensores_1.jpg
│   │   │       ├── 🖼️ hardware_117_SENSORES (1).jpg
│   │   │       ├── 🖼️ hardware_118_SENSORES (2).jpg
│   │   │       ├── 🖼️ hardware_119_SENSORES (3).jpg
│   │   │       ├── 🖼️ hardware_11_APISQUEEN_PAQUETE (9).jpg
│   │   │       ├── 🖼️ hardware_120_SENSORES (4).jpg
│   │   │       ├── 🖼️ hardware_121_SENSORES (5).jpg
│   │   │       ├── 🖼️ hardware_122_SENSORES_LORA_MAX31865 (1).jpg
│   │   │       ├── 🖼️ hardware_123_SENSORES_LORA_MAX31865 (2).jpg
│   │   │       ├── 🖼️ hardware_124_SENSORES_LORA_MAX31865 (3).jpg
│   │   │       ├── 🖼️ hardware_125_SENSORES_LORA_MAX31865 (4).jpg
│   │   │       ├── 🖼️ hardware_126_SENSORES_LORA_MAX31865 (5).jpg
│   │   │       ├── 🖼️ hardware_127_SENSORES_LORA_MAX31865 (6).jpg
│   │   │       ├── 🖼️ hardware_128_Sensor_ph.png
│   │   │       ├── 🖼️ hardware_129_Sensors_lora.jpg
│   │   │       ├── 🖼️ hardware_12_APISQUEEN_PAQUETE (10).jpg
│   │   │       ├── 🖼️ hardware_130_TEMPERATURA (1).jpg
│   │   │       ├── 🖼️ hardware_131_TEMPERATURA (2).jpg
│   │   │       ├── 🖼️ hardware_132_TEMPERATURA (3).jpg
│   │   │       ├── 🖼️ hardware_133_TEMPERATURA (4).jpg
│   │   │       ├── 🖼️ hardware_134_WIRELESS.jpg
│   │   │       ├── 🖼️ hardware_135_ESQUEMA COMPLETO.png
│   │   │       ├── 🖼️ hardware_136_ESQUEMA CONEXION SENSORES JETSON LORA TX_RX.png
│   │   │       ├── 🖼️ hardware_137_ESQUEMA_MANGO.png
│   │   │       ├── 🖼️ hardware_13_APISQUEEN_PAQUETE (11).jpg
│   │   │       ├── 🖼️ hardware_14_APISQUEEN_PAQUETE (12).jpg
│   │   │       ├── 🖼️ hardware_15_APISQUEEN_PAQUETE (13).jpg
│   │   │       ├── 🖼️ hardware_16_APISQUEEN_PAQUETE (14).jpg
│   │   │       ├── 🖼️ hardware_17_APISQUEEN_PAQUETE (15).jpg
│   │   │       ├── 🖼️ hardware_18_APISQUEEN_PAQUETE (16).jpg
│   │   │       ├── 🖼️ hardware_19_APISQUEEN_PAQUETE (17).jpg
│   │   │       ├── 🖼️ hardware_1_1_ESP32.jpg
│   │   │       ├── 🖼️ hardware_20_APISQUEEN_PAQUETE (18).jpg
│   │   │       ├── 🖼️ hardware_21_APISQUEEN_PAQUETE (19).jpg
│   │   │       ├── 🖼️ hardware_22_APISQUEEN_PAQUETE (20).jpg
│   │   │       ├── 🖼️ hardware_23_APISQUEEN_PAQUETE (21).jpg
│   │   │       ├── 🖼️ hardware_24_APISQUEEN_PAQUETE (22).jpg
│   │   │       ├── 🖼️ hardware_25_APISQUEEN_PAQUETE (23).jpg
│   │   │       ├── 🖼️ hardware_26_APISQUEEN_PAQUETE (24).jpg
│   │   │       ├── 🖼️ hardware_27_APISQUEEN_PAQUETE (25).jpg
│   │   │       ├── 🖼️ hardware_28_APISQUEEN_PAQUETE (26).jpg
│   │   │       ├── 🖼️ hardware_29_APISQUEEN_PAQUETE (27).jpg
│   │   │       ├── 🖼️ hardware_2_2_ESP32.jpg
│   │   │       ├── 🖼️ hardware_30_APISQUEEN_PAQUETE (28).jpg
│   │   │       ├── 🖼️ hardware_31_APISQUEEN_PAQUETE (29).jpg
│   │   │       ├── 🖼️ hardware_32_APISQUEEN_PAQUETE (30).jpg
│   │   │       ├── 🖼️ hardware_33_APISQUEEN_PAQUETE (31).jpg
│   │   │       ├── 🖼️ hardware_34_APISQUEEN_PAQUETE (32).jpg
│   │   │       ├── 🖼️ hardware_35_APISQUEEN_PAQUETE (33).jpg
│   │   │       ├── 🖼️ hardware_36_APISQUEEN_PAQUETE (34).jpg
│   │   │       ├── 🖼️ hardware_37_APISQUEEN_PAQUETE (35).jpg
│   │   │       ├── 🖼️ hardware_38_APISQUEEN_PAQUETE (36).jpg
│   │   │       ├── 🖼️ hardware_39_APISQUEEN_PAQUETE (37).jpg
│   │   │       ├── 🖼️ hardware_3_APISQUEEN_PAQUETE (1).jpg
│   │   │       ├── 🖼️ hardware_40_APISQUEEN_PAQUETE (38).jpg
│   │   │       ├── 🖼️ hardware_41_APISQUEEN_PAQUETE (39).jpg
│   │   │       ├── 🖼️ hardware_42_APISQUEEN_PAQUETE (40).jpg
│   │   │       ├── 🖼️ hardware_43_APISQUEEN_PAQUETE (41).jpg
│   │   │       ├── 🖼️ hardware_44_APISQUEEN_PAQUETE (42).jpg
│   │   │       ├── 🖼️ hardware_45_APISQUEEN_PAQUETE (43).jpg
│   │   │       ├── 🖼️ hardware_46_APISQUEEN_PAQUETE (44).jpg
│   │   │       ├── 🖼️ hardware_47_APISQUEEN_PAQUETE (45).jpg
│   │   │       ├── 🖼️ hardware_48_APISQUEEN_PAQUETE (46).jpg
│   │   │       ├── 🖼️ hardware_49_APISQUEEN_PAQUETE (47).jpg
│   │   │       ├── 🖼️ hardware_4_APISQUEEN_PAQUETE (2).jpg
│   │   │       ├── 🖼️ hardware_50_APISQUEEN_PAQUETE (48).jpg
│   │   │       ├── 🖼️ hardware_51_APISQUEEN_PAQUETE (49).jpg
│   │   │       ├── 🖼️ hardware_52_Case_Jetson.png
│   │   │       ├── 🖼️ hardware_53_COMUNICACION.jpg
│   │   │       ├── 🖼️ hardware_54_ESQUEMA_ARMADO_GENERAL_1.jpg
│   │   │       ├── 🖼️ hardware_55_ESQUEMA_SENSORES (1).jpg
│   │   │       ├── 🖼️ hardware_56_ESQUEMA_SENSORES (2).jpg
│   │   │       ├── 🖼️ hardware_57_Estacion_Soldadura.jpg
│   │   │       ├── 🖼️ hardware_58_Extention Raspberry pi.png
│   │   │       ├── 🖼️ hardware_59_G-PIO_Jetson_TK1.jpg
│   │   │       ├── 🖼️ hardware_5_APISQUEEN_PAQUETE (3).jpg
│   │   │       ├── 🖼️ hardware_60_HELTEC.jpg
│   │   │       ├── 🖼️ hardware_61_HELTEC 2.jpg
│   │   │       ├── 🖼️ hardware_62_HELTEC 3.jpg
│   │   │       ├── 🖼️ hardware_63_HELTEC 4.jpg
│   │   │       ├── 🖼️ hardware_64_HELTEC_WIFI.jpg
│   │   │       ├── 🖼️ hardware_65_jetson-expsansion-800.jpg
│   │   │       ├── 🖼️ hardware_66_Manual_CHINO.jpg
│   │   │       ├── 🖼️ hardware_67_MATERIALES.jpg
│   │   │       ├── 🖼️ hardware_68_MATERIALES_2.jpg
│   │   │       ├── 🖼️ hardware_69_MATERIALES_3.jpg
│   │   │       ├── 🖼️ hardware_6_APISQUEEN_PAQUETE (4).jpg
│   │   │       ├── 🖼️ hardware_70_MAX31865.jpg
│   │   │       ├── 🖼️ hardware_71_MAX31865 (1).jpg
│   │   │       ├── 🖼️ hardware_72_MAX31865 (2).jpg
│   │   │       ├── 🖼️ hardware_73_MAX31865 (3).jpg
│   │   │       ├── 🖼️ hardware_74_MAX31865 (4).jpg
│   │   │       ├── 🖼️ hardware_75_MAX31865 (5).jpg
│   │   │       ├── 🖼️ hardware_76_MONTAJE (1).jpg
│   │   │       ├── 🖼️ hardware_77_MONTAJE (2).jpg
│   │   │       ├── 🖼️ hardware_78_MONTAJE (3).jpg
│   │   │       ├── 🖼️ hardware_79_MONTAJE (4).jpg
│   │   │       ├── 🖼️ hardware_7_APISQUEEN_PAQUETE (5).jpg
│   │   │       ├── 🖼️ hardware_80_MONTAJE (5).jpg
│   │   │       ├── 🖼️ hardware_81_MONTAJE (6).jpg
│   │   │       ├── 🖼️ hardware_82_MONTAJE (7).jpg
│   │   │       ├── 🖼️ hardware_83_MONTAJE (8).jpg
│   │   │       ├── 🖼️ hardware_84_MONTAJE (9).jpg
│   │   │       ├── 🖼️ hardware_85_MONTAJE (10).jpg
│   │   │       ├── 🖼️ hardware_86_MONTAJE (11).jpg
│   │   │       ├── 🖼️ hardware_87_MONTAJE (12).jpg
│   │   │       ├── 🖼️ hardware_88_MONTAJE (13).jpg
│   │   │       ├── 🖼️ hardware_89_MONTAJE (14).jpg
│   │   │       ├── 🖼️ hardware_8_APISQUEEN_PAQUETE (6).jpg
│   │   │       ├── 🖼️ hardware_90_MONTAJE (15).jpg
│   │   │       ├── 🖼️ hardware_91_MONTAJE (16).jpg
│   │   │       ├── 🖼️ hardware_92_MONTAJE_LORA (1).jpg
│   │   │       ├── 🖼️ hardware_93_MONTAJE_LORA (2).jpg
│   │   │       ├── 🖼️ hardware_94_MONTAJE_LORA (3).jpg
│   │   │       ├── 🖼️ hardware_95_MONTAJE_LORA_HELTEC (1).jpg
│   │   │       ├── 🖼️ hardware_96_MONTAJE_LORA_HELTEC (2).jpg
│   │   │       ├── 🖼️ hardware_97_MONTAJE_LORA_HELTEC (3).jpg
│   │   │       ├── 🖼️ hardware_98_MONTAJE_LORA_HELTEC (4).jpg
│   │   │       ├── 🖼️ hardware_99_MONTAJE_LORA_HELTEC (5).jpg
│   │   │       └── 🖼️ hardware_9_APISQUEEN_PAQUETE (7).jpg
│   │   ├── 📁 historial_pages_desings
│   │   │   ├── 🖼️ colores_pallete.jpeg
│   │   │   ├── 🖼️ colores_pallete.png
│   │   │   ├── 🖼️ dashboad_V1.4 (1).png
│   │   │   ├── 🖼️ dashboad_V1.4 (2).png
│   │   │   ├── 🖼️ dashboard_V0.1.png
│   │   │   ├── 🖼️ dashboard_V1.0.png
│   │   │   ├── 🖼️ dashboard_V1.1.png
│   │   │   ├── 🖼️ dashboard_V1.2.png
│   │   │   ├── 🖼️ dashboard_V1.3.png
│   │   │   ├── 🖼️ dashboard_V1.5.png
│   │   │   ├── 🖼️ dashboard_V1.6.png
│   │   │   └── 🖼️ dashboard_idea_v1.png
│   │   ├── 🖼️ LOGO.png
│   │   ├── 🖼️ icono.png
│   │   ├── 🖼️ logo.svg
│   │   ├── 📄 mango-favicon.ico
│   │   ├── 📄 mango-icon-1772328920.ico
│   │   ├── 🖼️ mango-icon-1772328920.svg
│   │   ├── 📄 mango-logo-full-1772328920.ico
│   │   ├── 🖼️ mango-logo-full-1772328920.svg
│   │   └── 🖼️ mango-logo.svg
│   ├── 📝 README.md
│   ├── 🌐 index.html
│   ├── 📄 script.js
│   └── 🎨 styles.css
├── 📁 gateway
│   ├── 📁 systemd
│   │   └── 📄 mango-rx-gateway.service
│   ├── 📝 README_GATEWAY.md
│   ├── 📝 README_GATEWAY_v2.md
│   ├── 📝 README_GATEWAY_v3.md
│   ├── 📄 VERSION
│   ├── 📄 mango_gateway.db
│   ├── 📄 requirements.gateway.txt
│   └── 🐍 rx_gateway.py
├── 📁 hardware
│   ├── 📁 components
│   │   ├── 📁 3D_Folder_Design
│   │   │   ├── 📁 Propeller_Water-Jet-Turbine-1
│   │   │   │   ├── 📄 arka p.SLDPRT
│   │   │   │   ├── 📄 bolt.SLDPRT
│   │   │   │   ├── 📄 kafa.SLDPRT
│   │   │   │   ├── 📄 kanat tmotor.STL
│   │   │   │   ├── 📄 montaj.SLDASM
│   │   │   │   ├── 🖼️ turbine.png
│   │   │   │   ├── 📄 tutucu.SLDPRT
│   │   │   │   └── 📄 tutucu.STL
│   │   │   ├── 📁 Underwater Thruster Brushless Propeller
│   │   │   │   ├── 🖼️ Thruster 4 view.JPG
│   │   │   │   ├── 📄 Thruster Motor.SLDPRT
│   │   │   │   ├── 📄 Thruster Shell.SLDPRT
│   │   │   │   ├── 📄 Underwater Thruster Brushless Motor 4 Blade Propeller.SLDASM
│   │   │   │   └── 📄 Underwater Thruster Brushless Motor 4 Blade Propeller.STEP
│   │   │   └── 📄 U1-3D.stp
│   │   ├── 📁 DX-LR30-433 Information Package
│   │   │   ├── 📁 00 Development Environment IDE
│   │   │   │   └── 📄 Readme.txt
│   │   │   ├── 📁 01 Chip Technical Manual
│   │   │   │   ├── 📕 DS_SX1261-2_V2_1.pdf
│   │   │   │   └── 📕 STM32F103C8T6.pdf
│   │   │   ├── 📁 02 Module Technical Manual
│   │   │   │   └── 📕 DX-LR30-433M22S Module technical manual.pdf
│   │   │   ├── 📁 03 Development Board Technical Manual
│   │   │   │   └── 📕 DX-LR30-433M22SP Development board user manual.pdf
│   │   │   ├── 📁 04 Testing Tools
│   │   │   │   ├── 📁 PC Serial Assistant
│   │   │   │   │   └── 📄 PC test app download.txt
│   │   │   │   └── 📁 STM32F103 burning tool
│   │   │   │       └── ⚙️ mcuisp.exe
│   │   │   ├── 📁 05 Hardware Information
│   │   │   │   ├── 📁 DX-LR20&30_PCB_Footprint&SCH_Part_AD
│   │   │   │   │   ├── 📄 DX-LR20&30_PCB_Footprint_AD.PcbDoc
│   │   │   │   │   └── 📄 DX-LR20&30_SCH_Part_AD.SchDoc
│   │   │   │   ├── 📁 DX-LR20&30_PCB_Footprint&SCH_Part_PADS
│   │   │   │   │   ├── 📄 DX-LR20&30_PCB_Footprint_PADS.pcb
│   │   │   │   │   └── 📄 DX-LR20&30_SCH_Part_PADS.sch
│   │   │   │   └── 📕 LR30-SP PCBA schematic diagram.pdf
│   │   │   ├── 📁 06 Programming code demonstration
│   │   │   │   └── 📁 LR20&30-433
│   │   │   │       └── 📦 LR20&30-433.rar
│   │   │   └── 📁 07 Development Reference
│   │   │       └── 📄 Reference Cases.txt
│   │   ├── 📁 LoRa
│   │   │   ├── 📁 LORA32_OLED
│   │   │   │   ├── 📁 Lora32_V3_HF
│   │   │   │   │   ├── 📄 SimpleDemo.bat
│   │   │   │   │   ├── ⚙️ SimpleDemo.ino.bin
│   │   │   │   │   ├── ⚙️ SimpleDemo.ino.bootloader.bin
│   │   │   │   │   ├── ⚙️ SimpleDemo.ino.partitions.bin
│   │   │   │   │   ├── ⚙️ boot_app0.bin
│   │   │   │   │   ├── ⚙️ esptool.exe
│   │   │   │   │   └── ⚡ images.h
│   │   │   │   └── 📕 how to use.pdf
│   │   │   ├── 📁 Lora32_V3_factest_HF
│   │   │   │   ├── 📁 Lora32_V3_HF
│   │   │   │   │   ├── 📄 Lora32_V3_HF.bat
│   │   │   │   │   ├── 📄 Lora32_V3_HF.ino
│   │   │   │   │   ├── ⚙️ Lora32_V3_HF.ino.bin
│   │   │   │   │   ├── ⚙️ Lora32_V3_HF.ino.bootloader.bin
│   │   │   │   │   ├── ⚙️ Lora32_V3_HF.ino.partitions.bin
│   │   │   │   │   ├── ⚙️ boot_app0.bin
│   │   │   │   │   ├── ⚙️ esptool.exe
│   │   │   │   │   └── ⚡ images.h
│   │   │   │   └── 📕 how to use.pdf
│   │   │   ├── 📁 WirelessStick_3D_drawing(SolidWorks2014)
│   │   │   │   ├── 📄 C-DZB.sldprt
│   │   │   │   ├── 📄 C-HZ.sldprt
│   │   │   │   ├── 📄 C-YJP.sldprt
│   │   │   │   └── 📄 WirelessStick.SLDASM
│   │   │   ├── 📁 meshtastic_wifi_lora_32_V3
│   │   │   │   ├── ⚙️ boot_app0.bin
│   │   │   │   ├── ⚙️ bootloader.bin
│   │   │   │   ├── ⚙️ esptool.exe
│   │   │   │   ├── ⚙️ firmware.bin
│   │   │   │   ├── 📄 flash.bat
│   │   │   │   └── ⚙️ partitions.bin
│   │   │   ├── 📁 wireless_stick_v3
│   │   │   │   ├── 📁 Heltec_ESP32-master
│   │   │   │   │   ├── 📁 examples
│   │   │   │   │   │   ├── 📁 2.4G_RF
│   │   │   │   │   │   │   ├── 📁 BLE_WiFi
│   │   │   │   │   │   │   │   └── 📄 BLE_WiFi.ino
│   │   │   │   │   │   │   └── 📁 TimeNTP_ESP32WiFi
│   │   │   │   │   │   │       └── 📄 TimeNTP_ESP32WiFi.ino
│   │   │   │   │   │   ├── 📁 ESP32
│   │   │   │   │   │   │   ├── 📁 ADC_Read_Voltage
│   │   │   │   │   │   │   │   ├── 📁 ADC_Read_Accurate
│   │   │   │   │   │   │   │   │   └── 📄 ADC_Read_Accurate.ino
│   │   │   │   │   │   │   │   ├── 📁 ADC_Read_Simple
│   │   │   │   │   │   │   │   │   └── 📄 ADC_Read_Simple.ino
│   │   │   │   │   │   │   │   ├── 📁 Battery_power
│   │   │   │   │   │   │   │   │   └── 📄 Battery_power.ino
│   │   │   │   │   │   │   │   └── 📝 README.md
│   │   │   │   │   │   │   ├── 📁 ESP32_Dual_Core
│   │   │   │   │   │   │   │   ├── 📁 examples
│   │   │   │   │   │   │   │   │   ├── 📁 Movecore
│   │   │   │   │   │   │   │   │   ├── 📁 Showcore
│   │   │   │   │   │   │   │   │   └── 📁 SpeedTest
│   │   │   │   │   │   │   │   ├── 📁 resources
│   │   │   │   │   │   │   │   │   ├── 🖼️ MoveCore.png
│   │   │   │   │   │   │   │   │   ├── 🖼️ Result.png
│   │   │   │   │   │   │   │   │   ├── 🖼️ SpeedTest.png
│   │   │   │   │   │   │   │   │   ├── 🖼️ Task_Synchronization.png
│   │   │   │   │   │   │   │   │   └── 🖼️ print_core.png
│   │   │   │   │   │   │   │   └── 📝 README.md
│   │   │   │   │   │   │   ├── 📁 ExternalWakeUp
│   │   │   │   │   │   │   │   └── 📄 ExternalWakeUp.ino
│   │   │   │   │   │   │   ├── 📁 GetChipID
│   │   │   │   │   │   │   │   └── 📄 GetChipID.ino
│   │   │   │   │   │   │   ├── 📁 I2C_Scanner
│   │   │   │   │   │   │   │   └── 📄 I2C_Scanner.ino
│   │   │   │   │   │   │   ├── 📁 PSRAM_Test
│   │   │   │   │   │   │   │   └── 📄 PSRAM_Test.ino
│   │   │   │   │   │   │   ├── 📁 RTC_counter
│   │   │   │   │   │   │   │   └── 📄 RTC_counter.ino
│   │   │   │   │   │   │   ├── 📁 Serial2
│   │   │   │   │   │   │   │   └── 📄 Serial2.ino
│   │   │   │   │   │   │   ├── 📁 ULP
│   │   │   │   │   │   │   │   └── 📁 HoldPinStatus
│   │   │   │   │   │   │   │       └── 📄 HoldPinStatus.ino
│   │   │   │   │   │   │   ├── 📁 VextControl
│   │   │   │   │   │   │   │   └── 📄 VextControl.ino
│   │   │   │   │   │   │   └── 📁 WiFiLoRa32_battery_read
│   │   │   │   │   │   │       └── 📄 WiFiLoRa32_battery_read.ino
│   │   │   │   │   │   ├── 📁 Factory_Test
│   │   │   │   │   │   │   ├── 📁 Vision_Master_E290_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Vision_Master_E290_FactoryTest.ino
│   │   │   │   │   │   │   │   ├── ⚡ checklicense.cpp
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Vision_Master_T190_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Vision_Master_T190_FactoryTest.ino
│   │   │   │   │   │   │   │   ├── ⚡ checklicense.cpp
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Vsion_Master_E0213A367_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Vsion_Master_E0213A367_FactoryTest.ino
│   │   │   │   │   │   │   │   ├── ⚡ checklicense.cpp
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Vsion_Master_E213_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Vsion_Master_E213_FactoryTest.ino
│   │   │   │   │   │   │   │   ├── ⚡ checklicense.cpp
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 WIFI_Kit_32_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 WIFI_Kit_32_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 WIRELESS_MINI_SHELL_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 WIRELESS_MINI_SHELL_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 WiFi_Kit_32_V3_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 WiFi_Kit_32_V3_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 WiFi_LoRa_32_V2_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 WiFi_LoRa_32_V2_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 WiFi_LoRa_32_V3
│   │   │   │   │   │   │   │   └── 📁 WiFi_LoRa_32_V3_FactoryTest_V1
│   │   │   │   │   │   │   │       ├── 📄 WiFi_LoRa_32_V3_FactoryTest_V1.ino
│   │   │   │   │   │   │   │       └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 WiFi_LoRa_32_V4_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 WiFi_LoRa_32_V4_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Paper_E0213A367_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Paper_E0213A367_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Paper_V1.0_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Paper_V1.0_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Paper_V1.1_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Paper_V1.1_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Shell_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Shell_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Shell_V3_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Shell_V3_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Stick_Lite_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Stick_Lite_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Stick_Lite_V3_FactoryTest
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Stick_Lite_V3_FactoryTest.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Stick_V3_FactoryTest
│   │   │   │   │   │   │   │   └── 📄 Wireless_Stick_V3_FactoryTest.ino
│   │   │   │   │   │   │   ├── 📁 Wireless_Tracker_V1.0_FactoryTest
│   │   │   │   │   │   │   │   └── 📄 Wireless_Tracker_V1.0_FactoryTest.ino
│   │   │   │   │   │   │   ├── 📁 Wireless_Tracker_V1.1_FactoryTest
│   │   │   │   │   │   │   │   └── 📄 Wireless_Tracker_V1.1_FactoryTest.ino
│   │   │   │   │   │   │   └── 📁 Wireless_Tracker_V2_FactoryTest
│   │   │   │   │   │   │       └── 📄 Wireless_Tracker_V2_FactoryTest.ino
│   │   │   │   │   │   ├── 📁 GPS
│   │   │   │   │   │   │   ├── 📁 GPSDisplayOnTFT
│   │   │   │   │   │   │   │   └── 📄 GPSDisplayOnTFT.ino
│   │   │   │   │   │   │   └── 📁 GPSToUart
│   │   │   │   │   │   │       └── 📄 GPSToUart.ino
│   │   │   │   │   │   ├── 📁 LoRaBasic
│   │   │   │   │   │   │   ├── 📁 DeepSleepWakeUpByLora
│   │   │   │   │   │   │   │   └── 📄 DeepSleepWakeUpByLora.ino
│   │   │   │   │   │   │   ├── 📁 LoRaPowerTest
│   │   │   │   │   │   │   │   └── 📄 LoRaPowerTest.ino
│   │   │   │   │   │   │   ├── 📁 LoRaReceiver
│   │   │   │   │   │   │   │   └── 📄 LoRaReceiver.ino
│   │   │   │   │   │   │   ├── 📁 LoRaSender
│   │   │   │   │   │   │   │   └── 📄 LoRaSender.ino
│   │   │   │   │   │   │   ├── 📁 TxPowerTest
│   │   │   │   │   │   │   │   └── 📄 TxPowerTest.ino
│   │   │   │   │   │   │   ├── 📁 pingpong
│   │   │   │   │   │   │   │   └── 📄 pingpong.ino
│   │   │   │   │   │   │   └── 📝 README.md
│   │   │   │   │   │   ├── 📁 LoRaWAN
│   │   │   │   │   │   │   ├── 📁 LoRaWAN_GHTV3_Battery
│   │   │   │   │   │   │   │   └── 📄 LoRaWAN_GHTV3_Battery.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWAN_GHTV3_Uplink
│   │   │   │   │   │   │   │   └── 📄 LoRaWAN_GHTV3_Uplink.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWAN_Hallsensor_Door_Detection
│   │   │   │   │   │   │   │   └── 📄 LoRaWAN_Hallsensor_Door_Detection.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWan
│   │   │   │   │   │   │   │   └── 📄 LoRaWan.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWanDownlinkDatahandle
│   │   │   │   │   │   │   │   └── 📄 LoRaWanDownlinkDatahandle.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWanGPSLocation
│   │   │   │   │   │   │   │   ├── 📄 LoRaWanGPSLocation.ino
│   │   │   │   │   │   │   │   └── 📄 TTNDecoder.js
│   │   │   │   │   │   │   ├── 📁 LoRaWanGPSTime
│   │   │   │   │   │   │   │   ├── 📄 LoRaWanGPSTime.ino
│   │   │   │   │   │   │   │   └── 📄 TTNDecoder.js
│   │   │   │   │   │   │   ├── 📁 LoRaWanGPSTime_lora_v4
│   │   │   │   │   │   │   │   └── 📄 LoRaWanGPSTime_lora_v4.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWanInterrupt
│   │   │   │   │   │   │   │   └── 📄 LoRaWanInterrupt.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWanMulticast
│   │   │   │   │   │   │   │   └── 📄 LoRaWanMulticast.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWanOLED
│   │   │   │   │   │   │   │   └── 📄 LoRaWanOLED.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWanTimeReq
│   │   │   │   │   │   │   │   └── 📄 LoRaWanTimeReq.ino
│   │   │   │   │   │   │   ├── 📁 LoRaWanWiFi
│   │   │   │   │   │   │   │   └── 📄 LoRaWanWiFi.ino
│   │   │   │   │   │   │   └── 📁 LoRaWan_Monitor_heartrate
│   │   │   │   │   │   │       └── 📄 LoRaWan_Monitor_heartrate.ino
│   │   │   │   │   │   ├── 📁 OLED
│   │   │   │   │   │   │   ├── 📁 DrawingDemo
│   │   │   │   │   │   │   │   └── 📄 DrawingDemo.ino
│   │   │   │   │   │   │   ├── 📁 OLED_rotate
│   │   │   │   │   │   │   │   └── 📄 OLED_rotate.ino
│   │   │   │   │   │   │   ├── 📁 OTA_OLED
│   │   │   │   │   │   │   │   └── 📄 OTA_OLED.ino
│   │   │   │   │   │   │   ├── 📁 SimpleDemo
│   │   │   │   │   │   │   │   ├── 📄 SimpleDemo.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   └── 📁 UiDemo
│   │   │   │   │   │   │       ├── 📄 UiDemo.ino
│   │   │   │   │   │   │       └── ⚡ images.h
│   │   │   │   │   │   ├── 📁 SD
│   │   │   │   │   │   │   ├── 📁 SD_Time
│   │   │   │   │   │   │   │   ├── 📄 SD_Time.ino
│   │   │   │   │   │   │   │   └── 🖼️ TestInfo.png
│   │   │   │   │   │   │   └── 🖼️ SD.JPG
│   │   │   │   │   │   ├── 📁 Sensor
│   │   │   │   │   │   │   ├── 📁 BH1750_test
│   │   │   │   │   │   │   │   └── 📄 BH1750_test.ino
│   │   │   │   │   │   │   ├── 📁 BMP180basic
│   │   │   │   │   │   │   │   ├── 📄 BMP180basic.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 DHT11_LoRa_sender
│   │   │   │   │   │   │   │   └── 📄 DHT11_LoRa_sender.ino
│   │   │   │   │   │   │   ├── 📁 GXHTC_read
│   │   │   │   │   │   │   │   └── 📄 GXHTC_read.ino
│   │   │   │   │   │   │   ├── 📁 Sensor_OLED
│   │   │   │   │   │   │   │   └── 📄 Sensor_OLED.ino
│   │   │   │   │   │   │   ├── 📁 bmp280
│   │   │   │   │   │   │   │   └── 📄 bmp280.ino
│   │   │   │   │   │   │   └── 📁 da217_read_xyz
│   │   │   │   │   │   │       └── 📄 da217_read_xyz.ino
│   │   │   │   │   │   ├── 📁 TFT
│   │   │   │   │   │   │   └── 📁 ST7735_SPI
│   │   │   │   │   │   │       └── 📄 ST7735_SPI.ino
│   │   │   │   │   │   ├── 📁 VME213
│   │   │   │   │   │   │   ├── 📁 Deepsleep
│   │   │   │   │   │   │   │   └── 📄 Deepsleep.ino
│   │   │   │   │   │   │   ├── 📁 Global_Simple
│   │   │   │   │   │   │   │   ├── 📄 Global_Simple.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 HT_lCMEN2R13EFC1
│   │   │   │   │   │   │   │   ├── 📄 HT_lCMEN2R13EFC1.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 LorawanEink
│   │   │   │   │   │   │   │   ├── 📄 LorawanEink.ino
│   │   │   │   │   │   │   │   └── ⚡ img.h
│   │   │   │   │   │   │   ├── 📁 Part_Simple
│   │   │   │   │   │   │   │   ├── 📄 Part_Simple.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 sensor_th
│   │   │   │   │   │   │   │   ├── ⚡ img.h
│   │   │   │   │   │   │   │   └── 📄 sensor_th.ino
│   │   │   │   │   │   │   └── 📁 weather_station
│   │   │   │   │   │   │       ├── ⚡ images.h
│   │   │   │   │   │   │       ├── 📝 readme.md
│   │   │   │   │   │   │       └── 📄 weather_station.ino
│   │   │   │   │   │   ├── 📁 VME290
│   │   │   │   │   │   │   ├── 📁 DEPG0290BxS800FxX_BW
│   │   │   │   │   │   │   │   ├── 📄 DEPG0290BxS800FxX_BW.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 GHXTC_Sensor_Display
│   │   │   │   │   │   │   │   ├── ⚡ images.h
│   │   │   │   │   │   │   │   └── 📄 sensor_th.ino
│   │   │   │   │   │   │   ├── 📁 deepsleep
│   │   │   │   │   │   │   │   └── 📄 deepsleep.ino
│   │   │   │   │   │   │   ├── 📁 lorawaneink_GHXTC
│   │   │   │   │   │   │   │   ├── ⚡ img.h
│   │   │   │   │   │   │   │   └── 📄 lorawaneink_GHXTC.ino
│   │   │   │   │   │   │   └── 📁 weather_station
│   │   │   │   │   │   │       ├── ⚡ images.h
│   │   │   │   │   │   │       ├── 📝 readme.md
│   │   │   │   │   │   │       └── 📄 weather_station.ino
│   │   │   │   │   │   ├── 📁 VMT190
│   │   │   │   │   │   │   ├── 📁 Sensor_LoRaWAN
│   │   │   │   │   │   │   │   ├── 📄 Sensor_LoRaWAN.ino
│   │   │   │   │   │   │   │   └── ⚡ img.h
│   │   │   │   │   │   │   └── 📁 tft1_9
│   │   │   │   │   │   │       ├── ⚡ img_data.h
│   │   │   │   │   │   │       ├── ⚡ pic.h
│   │   │   │   │   │   │       └── 📄 tft1_9.ino
│   │   │   │   │   │   ├── 📁 Wireless_paper
│   │   │   │   │   │   │   ├── 📁 E-ink_Firmware_Query
│   │   │   │   │   │   │   │   ├── 📄 E-ink_Firmware_Query.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 HT_E0213A367_test
│   │   │   │   │   │   │   │   ├── 📄 HT_E0213A367.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Paper_V1.0
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Paper_V1.0.ino
│   │   │   │   │   │   │   │   ├── ⚡ html.h
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   ├── 📁 Wireless_Paper_V1.1
│   │   │   │   │   │   │   │   ├── 📁 img
│   │   │   │   │   │   │   │   │   ├── 🖼️ image-1.png
│   │   │   │   │   │   │   │   │   ├── 🖼️ image-2.png
│   │   │   │   │   │   │   │   │   ├── 🖼️ image-3.png
│   │   │   │   │   │   │   │   │   ├── 🖼️ image-4.png
│   │   │   │   │   │   │   │   │   ├── 🖼️ image-5.png
│   │   │   │   │   │   │   │   │   └── 🖼️ image.png
│   │   │   │   │   │   │   │   ├── 📄 Wireless_Paper_V1.1.ino
│   │   │   │   │   │   │   │   ├── ⚡ html.h
│   │   │   │   │   │   │   │   ├── ⚡ images.h
│   │   │   │   │   │   │   │   └── 📝 readme.md
│   │   │   │   │   │   │   ├── 📁 Wireless_paper_1.1_manual_flasher
│   │   │   │   │   │   │   │   ├── 📄 Wireless_paper_1.1_manual_flasher.ino
│   │   │   │   │   │   │   │   └── ⚡ images.h
│   │   │   │   │   │   │   └── 📁 Wireless_paper_1.2_manual_flasher
│   │   │   │   │   │   │       ├── 📁 img
│   │   │   │   │   │   │       │   ├── 🖼️ 01.jpg
│   │   │   │   │   │   │       │   └── 🖼️ 02.jpg
│   │   │   │   │   │   │       ├── 📄 Wireless_paper_1.2_manual_flasher.ino
│   │   │   │   │   │   │       ├── ⚡ images.h
│   │   │   │   │   │   │       └── 📝 readme.md
│   │   │   │   │   │   └── 📁 eink
│   │   │   │   │   │       ├── 📁 e213_E0213A367_fase_mode
│   │   │   │   │   │       │   ├── 📄 e213_E0213A367_fase_mode.ino
│   │   │   │   │   │       │   ├── ⚡ hourglass_1.h
│   │   │   │   │   │       │   ├── ⚡ hourglass_2.h
│   │   │   │   │   │       │   └── ⚡ hourglass_3.h
│   │   │   │   │   │       └── 📁 wireless_paper_E0213A367_fase_mode
│   │   │   │   │   │           ├── ⚡ hourglass_1.h
│   │   │   │   │   │           ├── ⚡ hourglass_2.h
│   │   │   │   │   │           ├── ⚡ hourglass_3.h
│   │   │   │   │   │           └── 📄 wireless_paper_E0213A367_fase_mode.ino
│   │   │   │   │   ├── 📁 img
│   │   │   │   │   │   ├── 🖼️ 01.png
│   │   │   │   │   │   ├── 🖼️ 02.png
│   │   │   │   │   │   ├── 🖼️ location.png
│   │   │   │   │   │   └── 🖼️ location_cn.png
│   │   │   │   │   ├── 📁 src
│   │   │   │   │   │   ├── 📁 driver
│   │   │   │   │   │   │   ├── ⚡ board-config.h
│   │   │   │   │   │   │   ├── 📄 board.c
│   │   │   │   │   │   │   ├── ⚡ board.h
│   │   │   │   │   │   │   ├── ⚡ debug.h
│   │   │   │   │   │   │   ├── 📄 delay.c
│   │   │   │   │   │   │   ├── ⚡ delay.h
│   │   │   │   │   │   │   ├── 📄 gpio-board.c
│   │   │   │   │   │   │   ├── ⚡ gpio-board.h
│   │   │   │   │   │   │   ├── 📄 gpio.c
│   │   │   │   │   │   │   ├── ⚡ gpio.h
│   │   │   │   │   │   │   ├── ⚡ lorawan_spi.h
│   │   │   │   │   │   │   ├── ⚡ rtc-board.h
│   │   │   │   │   │   │   ├── 📄 sx1262-board.c
│   │   │   │   │   │   │   ├── ⚡ sx126x-board.h
│   │   │   │   │   │   │   ├── 📄 sx126x.c
│   │   │   │   │   │   │   ├── ⚡ sx126x.h
│   │   │   │   │   │   │   ├── 📄 sx1276-board.c
│   │   │   │   │   │   │   ├── ⚡ sx1276-board.h
│   │   │   │   │   │   │   ├── 📄 sx1276.c
│   │   │   │   │   │   │   ├── ⚡ sx1276.h
│   │   │   │   │   │   │   ├── ⚡ sx1276Regs-Fsk.h
│   │   │   │   │   │   │   ├── ⚡ sx1276Regs-LoRa.h
│   │   │   │   │   │   │   └── ⚡ timer.h
│   │   │   │   │   │   ├── 📁 esp32
│   │   │   │   │   │   │   └── 📄 liblorawan.a
│   │   │   │   │   │   ├── 📁 esp32c3
│   │   │   │   │   │   │   ├── 📄 liblorawan-espidf4.a
│   │   │   │   │   │   │   ├── 📄 liblorawan-espidf5.a
│   │   │   │   │   │   │   ├── 📄 liblorawan.a
│   │   │   │   │   │   │   └── 📄 liblorawan2.a
│   │   │   │   │   │   ├── 📁 esp32s3
│   │   │   │   │   │   │   └── 📄 liblorawan.a
│   │   │   │   │   │   ├── 📁 lora
│   │   │   │   │   │   │   ├── 📝 API.md
│   │   │   │   │   │   │   ├── ⚡ LoRa.cpp
│   │   │   │   │   │   │   └── ⚡ LoRa.h
│   │   │   │   │   │   ├── 📁 loramac
│   │   │   │   │   │   │   ├── 📁 region
│   │   │   │   │   │   │   │   ├── 📄 Region.c
│   │   │   │   │   │   │   │   ├── ⚡ Region.h
│   │   │   │   │   │   │   │   ├── 📄 RegionAS923.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionAS923.h
│   │   │   │   │   │   │   │   ├── 📄 RegionAU915.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionAU915.h
│   │   │   │   │   │   │   │   ├── 📄 RegionCN470.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionCN470.h
│   │   │   │   │   │   │   │   ├── 📄 RegionCN779.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionCN779.h
│   │   │   │   │   │   │   │   ├── 📄 RegionCommon.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionCommon.h
│   │   │   │   │   │   │   │   ├── 📄 RegionEU433.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionEU433.h
│   │   │   │   │   │   │   │   ├── 📄 RegionEU868.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionEU868.h
│   │   │   │   │   │   │   │   ├── 📄 RegionIN865.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionIN865.h
│   │   │   │   │   │   │   │   ├── 📄 RegionKR920.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionKR920.h
│   │   │   │   │   │   │   │   ├── 📄 RegionRU864.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionRU864.h
│   │   │   │   │   │   │   │   ├── 📄 RegionUS915-Hybrid.c
│   │   │   │   │   │   │   │   ├── ⚡ RegionUS915-Hybrid.h
│   │   │   │   │   │   │   │   ├── 📄 RegionUS915.c
│   │   │   │   │   │   │   │   └── ⚡ RegionUS915.h
│   │   │   │   │   │   │   ├── ⚡ Commissioning.h
│   │   │   │   │   │   │   ├── 📄 LoRaMac.c
│   │   │   │   │   │   │   ├── ⚡ LoRaMac.h
│   │   │   │   │   │   │   ├── 📄 LoRaMacClassB.c
│   │   │   │   │   │   │   ├── ⚡ LoRaMacClassB.h
│   │   │   │   │   │   │   ├── ⚡ LoRaMacClassBConfig.h
│   │   │   │   │   │   │   ├── 📄 LoRaMacConfirmQueue.c
│   │   │   │   │   │   │   ├── ⚡ LoRaMacConfirmQueue.h
│   │   │   │   │   │   │   ├── 📄 LoRaMacCrypto.c
│   │   │   │   │   │   │   ├── ⚡ LoRaMacCrypto.h
│   │   │   │   │   │   │   ├── ⚡ LoRaMacTest.h
│   │   │   │   │   │   │   ├── 📄 aes.c
│   │   │   │   │   │   │   ├── ⚡ aes.h
│   │   │   │   │   │   │   ├── 📄 cmac.c
│   │   │   │   │   │   │   ├── ⚡ cmac.h
│   │   │   │   │   │   │   ├── 📄 utilities.c
│   │   │   │   │   │   │   └── ⚡ utilities.h
│   │   │   │   │   │   ├── 📁 radio
│   │   │   │   │   │   │   ├── 📄 radio.c
│   │   │   │   │   │   │   ├── ⚡ radio.h
│   │   │   │   │   │   │   └── ⚡ radio_sx127x.h
│   │   │   │   │   │   ├── ⚡ BH1750.cpp
│   │   │   │   │   │   ├── ⚡ BH1750.h
│   │   │   │   │   │   ├── ⚡ BMP180.cpp
│   │   │   │   │   │   ├── ⚡ BMP180.h
│   │   │   │   │   │   ├── ⚡ BMP280.cpp
│   │   │   │   │   │   ├── ⚡ BMP280.h
│   │   │   │   │   │   ├── ⚡ ESP32_LoRaWan_102.h
│   │   │   │   │   │   ├── ⚡ ESP32_Mcu.h
│   │   │   │   │   │   ├── ⚡ GXHTC.cpp
│   │   │   │   │   │   ├── ⚡ GXHTC.h
│   │   │   │   │   │   ├── ⚡ HT_DEPG0290BxS800FxX_BW.h
│   │   │   │   │   │   ├── ⚡ HT_Display.cpp
│   │   │   │   │   │   ├── ⚡ HT_Display.h
│   │   │   │   │   │   ├── ⚡ HT_DisplayFonts.h
│   │   │   │   │   │   ├── ⚡ HT_DisplayUi.cpp
│   │   │   │   │   │   ├── ⚡ HT_DisplayUi.h
│   │   │   │   │   │   ├── ⚡ HT_E0213A367.h
│   │   │   │   │   │   ├── ⚡ HT_QYEG0213RWS800_BWR.h
│   │   │   │   │   │   ├── ⚡ HT_SH1107Wire.h
│   │   │   │   │   │   ├── ⚡ HT_SSD1306Spi.h
│   │   │   │   │   │   ├── ⚡ HT_SSD1306Wire.h
│   │   │   │   │   │   ├── ⚡ HT_TinyGPS++.cpp
│   │   │   │   │   │   ├── ⚡ HT_TinyGPS++.h
│   │   │   │   │   │   ├── ⚡ HT_lCMEN2R13EFC1.h
│   │   │   │   │   │   ├── ⚡ HT_lCMEN2R13EFC1_LUT.h
│   │   │   │   │   │   ├── ⚡ HT_st7735.cpp
│   │   │   │   │   │   ├── ⚡ HT_st7735.h
│   │   │   │   │   │   ├── ⚡ HT_st7735_fonts.cpp
│   │   │   │   │   │   ├── ⚡ HT_st7735_fonts.h
│   │   │   │   │   │   ├── ⚡ HT_st7736.cpp
│   │   │   │   │   │   ├── ⚡ HT_st7736.h
│   │   │   │   │   │   ├── ⚡ HT_st7789spi.cpp
│   │   │   │   │   │   ├── ⚡ HT_st7789spi.h
│   │   │   │   │   │   ├── ⚡ LoRaWan_APP.cpp
│   │   │   │   │   │   ├── ⚡ LoRaWan_APP.h
│   │   │   │   │   │   ├── 📄 clk.c
│   │   │   │   │   │   ├── ⚡ da217.cpp
│   │   │   │   │   │   ├── ⚡ da217.h
│   │   │   │   │   │   ├── ⚡ esp_clk_internal.h
│   │   │   │   │   │   ├── ⚡ heltec.cpp
│   │   │   │   │   │   └── ⚡ heltec.h
│   │   │   │   │   ├── ⚙️ .gitignore
│   │   │   │   │   ├── 📄 CMakeLists.txt
│   │   │   │   │   ├── 📄 LICENSE
│   │   │   │   │   ├── 📝 README.md
│   │   │   │   │   ├── 📄 keywords.txt
│   │   │   │   │   ├── ⚙️ library.json
│   │   │   │   │   └── 📄 library.properties
│   │   │   │   └── 📦 Heltec_ESP32-master.zip
│   │   │   ├── 📄 WirelessStick(AutoCAD2004).dwg
│   │   │   └── 🌐 en.szdx-smart.com.html
│   │   └── 📁 wireless_stick_v3
│   │       └── 📁 Wireless_Stick_V3_FactoryTest
│   │           └── 📄 Wireless_Stick_V3_FactoryTest.ino
│   ├── 📁 datasheets
│   │   ├── 📁 Freenove_Breackout_ESP32
│   │   │   ├── 📕 74HC04.pdf
│   │   │   ├── 📕 Breackout_Freenove_Tutorial.pdf
│   │   │   ├── 🖼️ CB9101.png
│   │   │   ├── 📕 Freenove_Breakout_Board_for_ESP32_Schematic_ _CB9101_V1.1_Schematic_.pdf
│   │   │   ├── 📕 SI2305.pdf
│   │   │   ├── 📕 SI2306.pdf
│   │   │   └── 📕 XL1583.pdf
│   │   ├── 📁 Freenove_ESP32
│   │   │   ├── 📁 ESP32_S3
│   │   │   │   ├── 📕 esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf
│   │   │   │   ├── 📕 esp32-s3_datasheet_en.pdf
│   │   │   │   └── 📕 esp32-s3_technical_reference_manual_en.pdf
│   │   │   ├── 📁 ESP32_WROOM
│   │   │   │   ├── 📕 esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf
│   │   │   │   ├── 📕 esp32_datasheet_en.pdf
│   │   │   │   └── 📕 esp32_technical_reference_manual_en.pdf
│   │   │   ├── 📁 ESP32_Wrover_B
│   │   │   │   ├── 📕 esp32-wrover-b_datasheet_en.pdf
│   │   │   │   ├── 📕 esp32-wrover_datasheet_en.pdf
│   │   │   │   └── 📕 esp32_technical_reference_manual_en.pdf
│   │   │   ├── 🖼️ ESP32S3_Pinout.png
│   │   │   ├── 🖼️ ESP32_WROOM_Pinout.png
│   │   │   └── 🖼️ ESP32_Wrover_Pinout.png
│   │   ├── 📁 LoRa
│   │   │   └── 📕 LoRa(V3)Heltec-ESP32.pdf
│   │   └── 📁 pH_sensor
│   │       └── 📕 ph-sensor-ph-4502c.pdf
│   ├── 📝 README.md
│   └── 🐍 get-platformio.py
├── 📁 link
│   ├── ⚙️ compose.rx.yaml
│   ├── ⚙️ compose.yaml
│   ├── 📄 mango
│   ├── 📦 mango_golden_stack.zip
│   └── 📦 routes_cleanup_patch.zip
├── 📁 lovable_ui
│   ├── 📁 MANGO_PAGE_LOVABLE_V0.1
│   │   ├── 📁 .lovable
│   │   │   └── 📝 plan.md
│   │   ├── 📁 public
│   │   │   ├── 📄 favicon.ico
│   │   │   ├── 🖼️ placeholder.svg
│   │   │   └── 📄 robots.txt
│   │   ├── 📁 src
│   │   │   ├── 📁 components
│   │   │   │   ├── 📁 ui
│   │   │   │   │   ├── 📄 accordion.tsx
│   │   │   │   │   ├── 📄 alert-dialog.tsx
│   │   │   │   │   ├── 📄 alert.tsx
│   │   │   │   │   ├── 📄 aspect-ratio.tsx
│   │   │   │   │   ├── 📄 avatar.tsx
│   │   │   │   │   ├── 📄 badge.tsx
│   │   │   │   │   ├── 📄 breadcrumb.tsx
│   │   │   │   │   ├── 📄 button.tsx
│   │   │   │   │   ├── 📄 calendar.tsx
│   │   │   │   │   ├── 📄 card.tsx
│   │   │   │   │   ├── 📄 carousel.tsx
│   │   │   │   │   ├── 📄 chart.tsx
│   │   │   │   │   ├── 📄 checkbox.tsx
│   │   │   │   │   ├── 📄 collapsible.tsx
│   │   │   │   │   ├── 📄 command.tsx
│   │   │   │   │   ├── 📄 context-menu.tsx
│   │   │   │   │   ├── 📄 dialog.tsx
│   │   │   │   │   ├── 📄 drawer.tsx
│   │   │   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   │   │   ├── 📄 form.tsx
│   │   │   │   │   ├── 📄 hover-card.tsx
│   │   │   │   │   ├── 📄 input-otp.tsx
│   │   │   │   │   ├── 📄 input.tsx
│   │   │   │   │   ├── 📄 label.tsx
│   │   │   │   │   ├── 📄 menubar.tsx
│   │   │   │   │   ├── 📄 navigation-menu.tsx
│   │   │   │   │   ├── 📄 pagination.tsx
│   │   │   │   │   ├── 📄 popover.tsx
│   │   │   │   │   ├── 📄 progress.tsx
│   │   │   │   │   ├── 📄 radio-group.tsx
│   │   │   │   │   ├── 📄 resizable.tsx
│   │   │   │   │   ├── 📄 scroll-area.tsx
│   │   │   │   │   ├── 📄 select.tsx
│   │   │   │   │   ├── 📄 separator.tsx
│   │   │   │   │   ├── 📄 sheet.tsx
│   │   │   │   │   ├── 📄 sidebar.tsx
│   │   │   │   │   ├── 📄 skeleton.tsx
│   │   │   │   │   ├── 📄 slider.tsx
│   │   │   │   │   ├── 📄 sonner.tsx
│   │   │   │   │   ├── 📄 switch.tsx
│   │   │   │   │   ├── 📄 table.tsx
│   │   │   │   │   ├── 📄 tabs.tsx
│   │   │   │   │   ├── 📄 textarea.tsx
│   │   │   │   │   ├── 📄 toast.tsx
│   │   │   │   │   ├── 📄 toaster.tsx
│   │   │   │   │   ├── 📄 toggle-group.tsx
│   │   │   │   │   ├── 📄 toggle.tsx
│   │   │   │   │   ├── 📄 tooltip.tsx
│   │   │   │   │   └── 📄 use-toast.ts
│   │   │   │   ├── 📄 AboutSection.tsx
│   │   │   │   ├── 📄 ContactSection.tsx
│   │   │   │   ├── 📄 DocumentationSection.tsx
│   │   │   │   ├── 📄 Footer.tsx
│   │   │   │   ├── 📄 GallerySection.tsx
│   │   │   │   ├── 📄 Header.tsx
│   │   │   │   ├── 📄 HeroSection.tsx
│   │   │   │   ├── 📄 LoginModal.tsx
│   │   │   │   ├── 📄 NavLink.tsx
│   │   │   │   └── 📄 ProjectSection.tsx
│   │   │   ├── 📁 hooks
│   │   │   │   ├── 📄 use-mobile.tsx
│   │   │   │   └── 📄 use-toast.ts
│   │   │   ├── 📁 lib
│   │   │   │   └── 📄 utils.ts
│   │   │   ├── 📁 pages
│   │   │   │   ├── 📄 Index.tsx
│   │   │   │   └── 📄 NotFound.tsx
│   │   │   ├── 📁 test
│   │   │   │   ├── 📄 example.test.ts
│   │   │   │   └── 📄 setup.ts
│   │   │   ├── 🎨 App.css
│   │   │   ├── 📄 App.tsx
│   │   │   ├── 🎨 index.css
│   │   │   ├── 📄 main.tsx
│   │   │   └── 📄 vite-env.d.ts
│   │   ├── ⚙️ .gitignore
│   │   ├── 📝 README.md
│   │   ├── 📄 bun.lockb
│   │   ├── ⚙️ components.json
│   │   ├── 📄 eslint.config.js
│   │   ├── 🌐 index.html
│   │   ├── ⚙️ package-lock.json
│   │   ├── ⚙️ package.json
│   │   ├── 📄 postcss.config.js
│   │   ├── 📄 tailwind.config.ts
│   │   ├── ⚙️ tsconfig.app.json
│   │   ├── ⚙️ tsconfig.json
│   │   ├── ⚙️ tsconfig.node.json
│   │   ├── 📄 vite.config.ts
│   │   └── 📄 vitest.config.ts
│   ├── 📁 MANGO_PAGE_LOVABLE_V1.1
│   │   ├── 📁 .lovable
│   │   │   └── 📝 plan.md
│   │   ├── 📁 public
│   │   │   ├── 📄 favicon.ico
│   │   │   ├── 🖼️ placeholder.svg
│   │   │   └── 📄 robots.txt
│   │   ├── 📁 src
│   │   │   ├── 📁 components
│   │   │   │   ├── 📁 ui
│   │   │   │   │   ├── 📄 accordion.tsx
│   │   │   │   │   ├── 📄 alert-dialog.tsx
│   │   │   │   │   ├── 📄 alert.tsx
│   │   │   │   │   ├── 📄 aspect-ratio.tsx
│   │   │   │   │   ├── 📄 avatar.tsx
│   │   │   │   │   ├── 📄 badge.tsx
│   │   │   │   │   ├── 📄 breadcrumb.tsx
│   │   │   │   │   ├── 📄 button.tsx
│   │   │   │   │   ├── 📄 calendar.tsx
│   │   │   │   │   ├── 📄 card.tsx
│   │   │   │   │   ├── 📄 carousel.tsx
│   │   │   │   │   ├── 📄 chart.tsx
│   │   │   │   │   ├── 📄 checkbox.tsx
│   │   │   │   │   ├── 📄 collapsible.tsx
│   │   │   │   │   ├── 📄 command.tsx
│   │   │   │   │   ├── 📄 context-menu.tsx
│   │   │   │   │   ├── 📄 dialog.tsx
│   │   │   │   │   ├── 📄 drawer.tsx
│   │   │   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   │   │   ├── 📄 form.tsx
│   │   │   │   │   ├── 📄 hover-card.tsx
│   │   │   │   │   ├── 📄 input-otp.tsx
│   │   │   │   │   ├── 📄 input.tsx
│   │   │   │   │   ├── 📄 label.tsx
│   │   │   │   │   ├── 📄 menubar.tsx
│   │   │   │   │   ├── 📄 navigation-menu.tsx
│   │   │   │   │   ├── 📄 pagination.tsx
│   │   │   │   │   ├── 📄 popover.tsx
│   │   │   │   │   ├── 📄 progress.tsx
│   │   │   │   │   ├── 📄 radio-group.tsx
│   │   │   │   │   ├── 📄 resizable.tsx
│   │   │   │   │   ├── 📄 scroll-area.tsx
│   │   │   │   │   ├── 📄 select.tsx
│   │   │   │   │   ├── 📄 separator.tsx
│   │   │   │   │   ├── 📄 sheet.tsx
│   │   │   │   │   ├── 📄 sidebar.tsx
│   │   │   │   │   ├── 📄 skeleton.tsx
│   │   │   │   │   ├── 📄 slider.tsx
│   │   │   │   │   ├── 📄 sonner.tsx
│   │   │   │   │   ├── 📄 switch.tsx
│   │   │   │   │   ├── 📄 table.tsx
│   │   │   │   │   ├── 📄 tabs.tsx
│   │   │   │   │   ├── 📄 textarea.tsx
│   │   │   │   │   ├── 📄 toast.tsx
│   │   │   │   │   ├── 📄 toaster.tsx
│   │   │   │   │   ├── 📄 toggle-group.tsx
│   │   │   │   │   ├── 📄 toggle.tsx
│   │   │   │   │   ├── 📄 tooltip.tsx
│   │   │   │   │   └── 📄 use-toast.ts
│   │   │   │   ├── 📄 AboutSection.tsx
│   │   │   │   ├── 📄 ContactSection.tsx
│   │   │   │   ├── 📄 DocumentationSection.tsx
│   │   │   │   ├── 📄 Footer.tsx
│   │   │   │   ├── 📄 GallerySection.tsx
│   │   │   │   ├── 📄 Header.tsx
│   │   │   │   ├── 📄 HeroSection.tsx
│   │   │   │   ├── 📄 LoginModal.tsx
│   │   │   │   ├── 📄 NavLink.tsx
│   │   │   │   └── 📄 ProjectSection.tsx
│   │   │   ├── 📁 hooks
│   │   │   │   ├── 📄 use-mobile.tsx
│   │   │   │   └── 📄 use-toast.ts
│   │   │   ├── 📁 lib
│   │   │   │   └── 📄 utils.ts
│   │   │   ├── 📁 pages
│   │   │   │   ├── 📄 Index.tsx
│   │   │   │   └── 📄 NotFound.tsx
│   │   │   ├── 📁 test
│   │   │   │   ├── 📄 example.test.ts
│   │   │   │   └── 📄 setup.ts
│   │   │   ├── 🎨 App.css
│   │   │   ├── 📄 App.tsx
│   │   │   ├── 🎨 index.css
│   │   │   ├── 📄 main.tsx
│   │   │   └── 📄 vite-env.d.ts
│   │   ├── 📝 README.md
│   │   ├── 📄 bun.lockb
│   │   ├── ⚙️ components.json
│   │   ├── 📄 eslint.config.js
│   │   ├── 🌐 index.html
│   │   ├── ⚙️ package-lock.json
│   │   ├── ⚙️ package.json
│   │   ├── 📄 postcss.config.js
│   │   ├── 📄 tailwind.config.ts
│   │   ├── ⚙️ tsconfig.app.json
│   │   ├── ⚙️ tsconfig.json
│   │   ├── ⚙️ tsconfig.node.json
│   │   ├── 📄 vite.config.ts
│   │   └── 📄 vitest.config.ts
│   ├── 📁 MANGO_PAGE_LOVABLE_V1.2
│   │   ├── 📁 .lovable
│   │   │   └── 📝 plan.md
│   │   ├── 📁 public
│   │   │   ├── 📄 favicon.ico
│   │   │   ├── 🖼️ placeholder.svg
│   │   │   └── 📄 robots.txt
│   │   ├── 📁 src
│   │   │   ├── 📁 components
│   │   │   │   ├── 📁 dashboard
│   │   │   │   │   ├── 📄 ConnectionBanner.tsx
│   │   │   │   │   ├── 📄 DashboardHeader.tsx
│   │   │   │   │   ├── 📄 ImuPanel.tsx
│   │   │   │   │   ├── 📄 SensorCard.tsx
│   │   │   │   │   └── 📄 SensorChart.tsx
│   │   │   │   ├── 📁 ui
│   │   │   │   │   ├── 📄 accordion.tsx
│   │   │   │   │   ├── 📄 alert-dialog.tsx
│   │   │   │   │   ├── 📄 alert.tsx
│   │   │   │   │   ├── 📄 aspect-ratio.tsx
│   │   │   │   │   ├── 📄 avatar.tsx
│   │   │   │   │   ├── 📄 badge.tsx
│   │   │   │   │   ├── 📄 breadcrumb.tsx
│   │   │   │   │   ├── 📄 button.tsx
│   │   │   │   │   ├── 📄 calendar.tsx
│   │   │   │   │   ├── 📄 card.tsx
│   │   │   │   │   ├── 📄 carousel.tsx
│   │   │   │   │   ├── 📄 chart.tsx
│   │   │   │   │   ├── 📄 checkbox.tsx
│   │   │   │   │   ├── 📄 collapsible.tsx
│   │   │   │   │   ├── 📄 command.tsx
│   │   │   │   │   ├── 📄 context-menu.tsx
│   │   │   │   │   ├── 📄 dialog.tsx
│   │   │   │   │   ├── 📄 drawer.tsx
│   │   │   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   │   │   ├── 📄 form.tsx
│   │   │   │   │   ├── 📄 hover-card.tsx
│   │   │   │   │   ├── 📄 input-otp.tsx
│   │   │   │   │   ├── 📄 input.tsx
│   │   │   │   │   ├── 📄 label.tsx
│   │   │   │   │   ├── 📄 menubar.tsx
│   │   │   │   │   ├── 📄 navigation-menu.tsx
│   │   │   │   │   ├── 📄 pagination.tsx
│   │   │   │   │   ├── 📄 popover.tsx
│   │   │   │   │   ├── 📄 progress.tsx
│   │   │   │   │   ├── 📄 radio-group.tsx
│   │   │   │   │   ├── 📄 resizable.tsx
│   │   │   │   │   ├── 📄 scroll-area.tsx
│   │   │   │   │   ├── 📄 select.tsx
│   │   │   │   │   ├── 📄 separator.tsx
│   │   │   │   │   ├── 📄 sheet.tsx
│   │   │   │   │   ├── 📄 sidebar.tsx
│   │   │   │   │   ├── 📄 skeleton.tsx
│   │   │   │   │   ├── 📄 slider.tsx
│   │   │   │   │   ├── 📄 sonner.tsx
│   │   │   │   │   ├── 📄 switch.tsx
│   │   │   │   │   ├── 📄 table.tsx
│   │   │   │   │   ├── 📄 tabs.tsx
│   │   │   │   │   ├── 📄 textarea.tsx
│   │   │   │   │   ├── 📄 toast.tsx
│   │   │   │   │   ├── 📄 toaster.tsx
│   │   │   │   │   ├── 📄 toggle-group.tsx
│   │   │   │   │   ├── 📄 toggle.tsx
│   │   │   │   │   ├── 📄 tooltip.tsx
│   │   │   │   │   └── 📄 use-toast.ts
│   │   │   │   ├── 📄 AboutSection.tsx
│   │   │   │   ├── 📄 ContactSection.tsx
│   │   │   │   ├── 📄 DocumentationSection.tsx
│   │   │   │   ├── 📄 Footer.tsx
│   │   │   │   ├── 📄 GallerySection.tsx
│   │   │   │   ├── 📄 Header.tsx
│   │   │   │   ├── 📄 HeroSection.tsx
│   │   │   │   ├── 📄 LoginModal.tsx
│   │   │   │   ├── 📄 NavLink.tsx
│   │   │   │   ├── 📄 ProjectSection.tsx
│   │   │   │   └── 📄 ProtectedRoute.tsx
│   │   │   ├── 📁 hooks
│   │   │   │   ├── 📄 use-mobile.tsx
│   │   │   │   ├── 📄 use-toast.ts
│   │   │   │   ├── 📄 useAuth.ts
│   │   │   │   ├── 📄 useHealth.ts
│   │   │   │   ├── 📄 useSensorData.ts
│   │   │   │   └── 📄 useSensorRange.ts
│   │   │   ├── 📁 lib
│   │   │   │   ├── 📄 api.ts
│   │   │   │   └── 📄 utils.ts
│   │   │   ├── 📁 pages
│   │   │   │   ├── 📄 Dashboard.tsx
│   │   │   │   ├── 📄 Index.tsx
│   │   │   │   ├── 📄 Login.tsx
│   │   │   │   └── 📄 NotFound.tsx
│   │   │   ├── 📁 test
│   │   │   │   ├── 📄 example.test.ts
│   │   │   │   └── 📄 setup.ts
│   │   │   ├── 📁 types
│   │   │   │   └── 📄 dashboard.ts
│   │   │   ├── 🎨 App.css
│   │   │   ├── 📄 App.tsx
│   │   │   ├── 🎨 index.css
│   │   │   ├── 📄 main.tsx
│   │   │   └── 📄 vite-env.d.ts
│   │   ├── ⚙️ .gitignore
│   │   ├── 📝 README.md
│   │   ├── 📄 bun.lockb
│   │   ├── ⚙️ components.json
│   │   ├── 📄 eslint.config.js
│   │   ├── 🌐 index.html
│   │   ├── ⚙️ package-lock.json
│   │   ├── ⚙️ package.json
│   │   ├── 📄 postcss.config.js
│   │   ├── 📄 tailwind.config.ts
│   │   ├── ⚙️ tsconfig.app.json
│   │   ├── ⚙️ tsconfig.json
│   │   ├── ⚙️ tsconfig.node.json
│   │   ├── 📄 vite.config.ts
│   │   └── 📄 vitest.config.ts
│   ├── 📁 MANGO_PAGE_LOVABLE_V1.3
│   │   ├── 📁 .lovable
│   │   │   └── 📝 plan.md
│   │   ├── 📁 public
│   │   │   ├── 📄 favicon.ico
│   │   │   ├── 🖼️ placeholder.svg
│   │   │   └── 📄 robots.txt
│   │   ├── 📁 src
│   │   │   ├── 📁 assets
│   │   │   │   ├── 🖼️ icono.png
│   │   │   │   └── 🖼️ logo.png
│   │   │   ├── 📁 components
│   │   │   │   ├── 📁 dashboard
│   │   │   │   │   ├── 📄 ConnectionBanner.tsx
│   │   │   │   │   ├── 📄 DashboardHeader.tsx
│   │   │   │   │   ├── 📄 ImuPanel.tsx
│   │   │   │   │   ├── 📄 SensorCard.tsx
│   │   │   │   │   └── 📄 SensorChart.tsx
│   │   │   │   ├── 📁 ui
│   │   │   │   │   ├── 📄 accordion.tsx
│   │   │   │   │   ├── 📄 alert-dialog.tsx
│   │   │   │   │   ├── 📄 alert.tsx
│   │   │   │   │   ├── 📄 aspect-ratio.tsx
│   │   │   │   │   ├── 📄 avatar.tsx
│   │   │   │   │   ├── 📄 badge.tsx
│   │   │   │   │   ├── 📄 breadcrumb.tsx
│   │   │   │   │   ├── 📄 button.tsx
│   │   │   │   │   ├── 📄 calendar.tsx
│   │   │   │   │   ├── 📄 card.tsx
│   │   │   │   │   ├── 📄 carousel.tsx
│   │   │   │   │   ├── 📄 chart.tsx
│   │   │   │   │   ├── 📄 checkbox.tsx
│   │   │   │   │   ├── 📄 collapsible.tsx
│   │   │   │   │   ├── 📄 command.tsx
│   │   │   │   │   ├── 📄 context-menu.tsx
│   │   │   │   │   ├── 📄 dialog.tsx
│   │   │   │   │   ├── 📄 drawer.tsx
│   │   │   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   │   │   ├── 📄 form.tsx
│   │   │   │   │   ├── 📄 hover-card.tsx
│   │   │   │   │   ├── 📄 input-otp.tsx
│   │   │   │   │   ├── 📄 input.tsx
│   │   │   │   │   ├── 📄 label.tsx
│   │   │   │   │   ├── 📄 menubar.tsx
│   │   │   │   │   ├── 📄 navigation-menu.tsx
│   │   │   │   │   ├── 📄 pagination.tsx
│   │   │   │   │   ├── 📄 popover.tsx
│   │   │   │   │   ├── 📄 progress.tsx
│   │   │   │   │   ├── 📄 radio-group.tsx
│   │   │   │   │   ├── 📄 resizable.tsx
│   │   │   │   │   ├── 📄 scroll-area.tsx
│   │   │   │   │   ├── 📄 select.tsx
│   │   │   │   │   ├── 📄 separator.tsx
│   │   │   │   │   ├── 📄 sheet.tsx
│   │   │   │   │   ├── 📄 sidebar.tsx
│   │   │   │   │   ├── 📄 skeleton.tsx
│   │   │   │   │   ├── 📄 slider.tsx
│   │   │   │   │   ├── 📄 sonner.tsx
│   │   │   │   │   ├── 📄 switch.tsx
│   │   │   │   │   ├── 📄 table.tsx
│   │   │   │   │   ├── 📄 tabs.tsx
│   │   │   │   │   ├── 📄 textarea.tsx
│   │   │   │   │   ├── 📄 toast.tsx
│   │   │   │   │   ├── 📄 toaster.tsx
│   │   │   │   │   ├── 📄 toggle-group.tsx
│   │   │   │   │   ├── 📄 toggle.tsx
│   │   │   │   │   ├── 📄 tooltip.tsx
│   │   │   │   │   └── 📄 use-toast.ts
│   │   │   │   ├── 📄 AboutSection.tsx
│   │   │   │   ├── 📄 ContactSection.tsx
│   │   │   │   ├── 📄 DocumentationSection.tsx
│   │   │   │   ├── 📄 Footer.tsx
│   │   │   │   ├── 📄 GallerySection.tsx
│   │   │   │   ├── 📄 Header.tsx
│   │   │   │   ├── 📄 HeroSection.tsx
│   │   │   │   ├── 📄 LoginModal.tsx
│   │   │   │   ├── 📄 NavLink.tsx
│   │   │   │   ├── 📄 ProjectSection.tsx
│   │   │   │   └── 📄 ProtectedRoute.tsx
│   │   │   ├── 📁 hooks
│   │   │   │   ├── 📄 use-mobile.tsx
│   │   │   │   ├── 📄 use-toast.ts
│   │   │   │   ├── 📄 useAuth.ts
│   │   │   │   ├── 📄 useHealth.ts
│   │   │   │   ├── 📄 useSensorData.ts
│   │   │   │   └── 📄 useSensorRange.ts
│   │   │   ├── 📁 lib
│   │   │   │   ├── 📄 api.ts
│   │   │   │   └── 📄 utils.ts
│   │   │   ├── 📁 pages
│   │   │   │   ├── 📄 Dashboard.tsx
│   │   │   │   ├── 📄 Index.tsx
│   │   │   │   ├── 📄 Login.tsx
│   │   │   │   └── 📄 NotFound.tsx
│   │   │   ├── 📁 test
│   │   │   │   ├── 📄 example.test.ts
│   │   │   │   └── 📄 setup.ts
│   │   │   ├── 📁 types
│   │   │   │   └── 📄 dashboard.ts
│   │   │   ├── 🎨 App.css
│   │   │   ├── 📄 App.tsx
│   │   │   ├── 🎨 index.css
│   │   │   ├── 📄 main.tsx
│   │   │   └── 📄 vite-env.d.ts
│   │   ├── ⚙️ .gitignore
│   │   ├── 📝 README.md
│   │   ├── 📄 bun.lockb
│   │   ├── ⚙️ components.json
│   │   ├── 📄 eslint.config.js
│   │   ├── 🌐 index.html
│   │   ├── ⚙️ package-lock.json
│   │   ├── ⚙️ package.json
│   │   ├── 📄 postcss.config.js
│   │   ├── 📄 tailwind.config.ts
│   │   ├── ⚙️ tsconfig.app.json
│   │   ├── ⚙️ tsconfig.json
│   │   ├── ⚙️ tsconfig.node.json
│   │   ├── 📄 vite.config.ts
│   │   └── 📄 vitest.config.ts
│   └── 📝 README.md
├── 📁 nginx
│   ├── ⚙️ default.conf
│   └── ⚙️ nginx.conf
├── 📁 scripts
│   ├── 📄 99-mango-rx.rules
│   ├── 📄 run-local.sh
│   └── 📄 setup-local.sh
├── ⚙️ .gitattributes
├── ⚙️ .gitignore
├── 📝 ARCHITECTURE.md
├── 📝 CHANGELOG.md
├── 📝 CODE_OF_CONDUCT.md
├── 📝 CONTRIBUTING.md
├── 📄 ENV_ADDITIONS.txt
├── 📝 LICENSE.md
├── 📝 README.md
├── 📝 README_GOLDEN_STACK.md
├── 📄 README_PATCH.txt
├── 📝 ROADMAP.md
├── 📝 STATUS.md
├── 📄 VERSION
├── ⚙️ compose.rx.yaml
├── ⚙️ compose.yaml
├── 🐍 db_init.py
└── 📄 mango
```

---
*Generated by FileTree Pro Extension*