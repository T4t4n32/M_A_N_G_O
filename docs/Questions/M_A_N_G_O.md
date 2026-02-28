# File Tree: M_A_N_G_O

**Generated:** 2/16/2026, 1:20:17 PM
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
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 admin.py
│   │   │   ├── 🐍 api.py
│   │   │   ├── 🐍 auth.py
│   │   │   ├── 🐍 data.py
│   │   │   ├── 🐍 health.py
│   │   │   ├── 🐍 institutions.py
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
│   │   ├── 🐍 db_init.py
│   │   ├── 🐍 extensions.py
│   │   ├── 🐍 init_db.py
│   │   ├── 🐍 models.py
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
│   ├── 🐍 celery_app.py
│   ├── 📄 entrypoint.sh
│   ├── 🐍 main.py
│   ├── 📄 requirements.txt
│   └── 🐍 wsgi.py
├── 📁 bridge
│   ├── 🐳 Dockerfile
│   ├── 🐍 lora_http_bridge.py
│   ├── 📄 requirements.bridge.txt
│   └── 📄 spool.jsonl
├── 📁 database
│   ├── 📁 Python_Base_Data_Sensors
│   │   ├── 🐍 F.py
│   │   ├── 🐍 datos.py
│   │   ├── 🐍 final.py
│   │   └── 🐍 serial_to_php.py
│   ├── 📝 cloud_config.md
│   ├── 📄 init.sql
│   ├── 📝 queries.md
│   └── 📄 schema.sql
|
├── 📁 frontend
│   ├── 📁 assets
│   │   ├── 📁 css
│   │   │   ├── 🎨 about.css
│   │   │   ├── 🎨 dashboard.css
│   │   │   ├── 🎨 gallery.css
│   │   │   ├── 🎨 login.css
│   │   │   └── 🎨 styles.css
│   │   ├── 📁 images
│   │   │   ├── 📁 gallery
│   │   │   │   └── 📁 hardware
│   │   │   │       ├── 🖼️ hardware_100_MONTAJE_LORA_HELTEC (6).jpg
│   │   │   │       ├── 🖼️ hardware_101_MONTAJE_LORA_HELTEC (7).jpg
│   │   │   │       ├── 🖼️ hardware_102_MONTAJE_PH (1).jpg
│   │   │   │       ├── 🖼️ hardware_103_MONTAJE_PH (2).jpg
│   │   │   │       ├── 🖼️ hardware_104_MONTAJE_PH (3).jpg
│   │   │   │       ├── 🖼️ hardware_105_MONTAJE_PH (4).jpg
│   │   │   │       ├── 🖼️ hardware_106_MONTAJE_PH (5).jpg
│   │   │   │       ├── 🖼️ hardware_107_MONTAJE_PH (6).jpg
│   │   │   │       ├── 🖼️ hardware_108_PAQUETE_1.jpg
│   │   │   │       ├── 🖼️ hardware_109_PAQUETES.jpg
│   │   │   │       ├── 🖼️ hardware_10_APISQUEEN_PAQUETE (8).jpg
│   │   │   │       ├── 🖼️ hardware_110_PAQUETES__LLEGADA.jpg
│   │   │   │       ├── 🖼️ hardware_111_Paquetes_MANGO.jpg
│   │   │   │       ├── 🖼️ hardware_112_PH (1).jpg
│   │   │   │       ├── 🖼️ hardware_113_PH (2).jpg
│   │   │   │       ├── 🖼️ hardware_114_PH (3).jpg
│   │   │   │       ├── 🖼️ hardware_115_SENSOR.jpg
│   │   │   │       ├── 🖼️ hardware_116_sensores_1.jpg
│   │   │   │       ├── 🖼️ hardware_117_SENSORES (1).jpg
│   │   │   │       ├── 🖼️ hardware_118_SENSORES (2).jpg
│   │   │   │       ├── 🖼️ hardware_119_SENSORES (3).jpg
│   │   │   │       ├── 🖼️ hardware_11_APISQUEEN_PAQUETE (9).jpg
│   │   │   │       ├── 🖼️ hardware_120_SENSORES (4).jpg
│   │   │   │       ├── 🖼️ hardware_121_SENSORES (5).jpg
│   │   │   │       ├── 🖼️ hardware_122_SENSORES_LORA_MAX31865 (1).jpg
│   │   │   │       ├── 🖼️ hardware_123_SENSORES_LORA_MAX31865 (2).jpg
│   │   │   │       ├── 🖼️ hardware_124_SENSORES_LORA_MAX31865 (3).jpg
│   │   │   │       ├── 🖼️ hardware_125_SENSORES_LORA_MAX31865 (4).jpg
│   │   │   │       ├── 🖼️ hardware_126_SENSORES_LORA_MAX31865 (5).jpg
│   │   │   │       ├── 🖼️ hardware_127_SENSORES_LORA_MAX31865 (6).jpg
│   │   │   │       ├── 🖼️ hardware_128_Sensor_ph.png
│   │   │   │       ├── 🖼️ hardware_129_Sensors_lora.jpg
│   │   │   │       ├── 🖼️ hardware_12_APISQUEEN_PAQUETE (10).jpg
│   │   │   │       ├── 🖼️ hardware_130_TEMPERATURA (1).jpg
│   │   │   │       ├── 🖼️ hardware_131_TEMPERATURA (2).jpg
│   │   │   │       ├── 🖼️ hardware_132_TEMPERATURA (3).jpg
│   │   │   │       ├── 🖼️ hardware_133_TEMPERATURA (4).jpg
│   │   │   │       ├── 🖼️ hardware_134_WIRELESS.jpg
│   │   │   │       ├── 🖼️ hardware_135_ESQUEMA COMPLETO.png
│   │   │   │       ├── 🖼️ hardware_136_ESQUEMA CONEXION SENSORES JETSON LORA TX_RX.png
│   │   │   │       ├── 🖼️ hardware_137_ESQUEMA_MANGO.png
│   │   │   │       ├── 🖼️ hardware_13_APISQUEEN_PAQUETE (11).jpg
│   │   │   │       ├── 🖼️ hardware_14_APISQUEEN_PAQUETE (12).jpg
│   │   │   │       ├── 🖼️ hardware_15_APISQUEEN_PAQUETE (13).jpg
│   │   │   │       ├── 🖼️ hardware_16_APISQUEEN_PAQUETE (14).jpg
│   │   │   │       ├── 🖼️ hardware_17_APISQUEEN_PAQUETE (15).jpg
│   │   │   │       ├── 🖼️ hardware_18_APISQUEEN_PAQUETE (16).jpg
│   │   │   │       ├── 🖼️ hardware_19_APISQUEEN_PAQUETE (17).jpg
│   │   │   │       ├── 🖼️ hardware_1_1_ESP32.jpg
│   │   │   │       ├── 🖼️ hardware_20_APISQUEEN_PAQUETE (18).jpg
│   │   │   │       ├── 🖼️ hardware_21_APISQUEEN_PAQUETE (19).jpg
│   │   │   │       ├── 🖼️ hardware_22_APISQUEEN_PAQUETE (20).jpg
│   │   │   │       ├── 🖼️ hardware_23_APISQUEEN_PAQUETE (21).jpg
│   │   │   │       ├── 🖼️ hardware_24_APISQUEEN_PAQUETE (22).jpg
│   │   │   │       ├── 🖼️ hardware_25_APISQUEEN_PAQUETE (23).jpg
│   │   │   │       ├── 🖼️ hardware_26_APISQUEEN_PAQUETE (24).jpg
│   │   │   │       ├── 🖼️ hardware_27_APISQUEEN_PAQUETE (25).jpg
│   │   │   │       ├── 🖼️ hardware_28_APISQUEEN_PAQUETE (26).jpg
│   │   │   │       ├── 🖼️ hardware_29_APISQUEEN_PAQUETE (27).jpg
│   │   │   │       ├── 🖼️ hardware_2_2_ESP32.jpg
│   │   │   │       ├── 🖼️ hardware_30_APISQUEEN_PAQUETE (28).jpg
│   │   │   │       ├── 🖼️ hardware_31_APISQUEEN_PAQUETE (29).jpg
│   │   │   │       ├── 🖼️ hardware_32_APISQUEEN_PAQUETE (30).jpg
│   │   │   │       ├── 🖼️ hardware_33_APISQUEEN_PAQUETE (31).jpg
│   │   │   │       ├── 🖼️ hardware_34_APISQUEEN_PAQUETE (32).jpg
│   │   │   │       ├── 🖼️ hardware_35_APISQUEEN_PAQUETE (33).jpg
│   │   │   │       ├── 🖼️ hardware_36_APISQUEEN_PAQUETE (34).jpg
│   │   │   │       ├── 🖼️ hardware_37_APISQUEEN_PAQUETE (35).jpg
│   │   │   │       ├── 🖼️ hardware_38_APISQUEEN_PAQUETE (36).jpg
│   │   │   │       ├── 🖼️ hardware_39_APISQUEEN_PAQUETE (37).jpg
│   │   │   │       ├── 🖼️ hardware_3_APISQUEEN_PAQUETE (1).jpg
│   │   │   │       ├── 🖼️ hardware_40_APISQUEEN_PAQUETE (38).jpg
│   │   │   │       ├── 🖼️ hardware_41_APISQUEEN_PAQUETE (39).jpg
│   │   │   │       ├── 🖼️ hardware_42_APISQUEEN_PAQUETE (40).jpg
│   │   │   │       ├── 🖼️ hardware_43_APISQUEEN_PAQUETE (41).jpg
│   │   │   │       ├── 🖼️ hardware_44_APISQUEEN_PAQUETE (42).jpg
│   │   │   │       ├── 🖼️ hardware_45_APISQUEEN_PAQUETE (43).jpg
│   │   │   │       ├── 🖼️ hardware_46_APISQUEEN_PAQUETE (44).jpg
│   │   │   │       ├── 🖼️ hardware_47_APISQUEEN_PAQUETE (45).jpg
│   │   │   │       ├── 🖼️ hardware_48_APISQUEEN_PAQUETE (46).jpg
│   │   │   │       ├── 🖼️ hardware_49_APISQUEEN_PAQUETE (47).jpg
│   │   │   │       ├── 🖼️ hardware_4_APISQUEEN_PAQUETE (2).jpg
│   │   │   │       ├── 🖼️ hardware_50_APISQUEEN_PAQUETE (48).jpg
│   │   │   │       ├── 🖼️ hardware_51_APISQUEEN_PAQUETE (49).jpg
│   │   │   │       ├── 🖼️ hardware_52_Case_Jetson.png
│   │   │   │       ├── 🖼️ hardware_53_COMUNICACION.jpg
│   │   │   │       ├── 🖼️ hardware_54_ESQUEMA_ARMADO_GENERAL_1.jpg
│   │   │   │       ├── 🖼️ hardware_55_ESQUEMA_SENSORES (1).jpg
│   │   │   │       ├── 🖼️ hardware_56_ESQUEMA_SENSORES (2).jpg
│   │   │   │       ├── 🖼️ hardware_57_Estacion_Soldadura.jpg
│   │   │   │       ├── 🖼️ hardware_58_Extention Raspberry pi.png
│   │   │   │       ├── 🖼️ hardware_59_G-PIO_Jetson_TK1.jpg
│   │   │   │       ├── 🖼️ hardware_5_APISQUEEN_PAQUETE (3).jpg
│   │   │   │       ├── 🖼️ hardware_60_HELTEC.jpg
│   │   │   │       ├── 🖼️ hardware_61_HELTEC 2.jpg
│   │   │   │       ├── 🖼️ hardware_62_HELTEC 3.jpg
│   │   │   │       ├── 🖼️ hardware_63_HELTEC 4.jpg
│   │   │   │       ├── 🖼️ hardware_64_HELTEC_WIFI.jpg
│   │   │   │       ├── 🖼️ hardware_65_jetson-expsansion-800.jpg
│   │   │   │       ├── 🖼️ hardware_66_Manual_CHINO.jpg
│   │   │   │       ├── 🖼️ hardware_67_MATERIALES.jpg
│   │   │   │       ├── 🖼️ hardware_68_MATERIALES_2.jpg
│   │   │   │       ├── 🖼️ hardware_69_MATERIALES_3.jpg
│   │   │   │       ├── 🖼️ hardware_6_APISQUEEN_PAQUETE (4).jpg
│   │   │   │       ├── 🖼️ hardware_70_MAX31865.jpg
│   │   │   │       ├── 🖼️ hardware_71_MAX31865 (1).jpg
│   │   │   │       ├── 🖼️ hardware_72_MAX31865 (2).jpg
│   │   │   │       ├── 🖼️ hardware_73_MAX31865 (3).jpg
│   │   │   │       ├── 🖼️ hardware_74_MAX31865 (4).jpg
│   │   │   │       ├── 🖼️ hardware_75_MAX31865 (5).jpg
│   │   │   │       ├── 🖼️ hardware_76_MONTAJE (1).jpg
│   │   │   │       ├── 🖼️ hardware_77_MONTAJE (2).jpg
│   │   │   │       ├── 🖼️ hardware_78_MONTAJE (3).jpg
│   │   │   │       ├── 🖼️ hardware_79_MONTAJE (4).jpg
│   │   │   │       ├── 🖼️ hardware_7_APISQUEEN_PAQUETE (5).jpg
│   │   │   │       ├── 🖼️ hardware_80_MONTAJE (5).jpg
│   │   │   │       ├── 🖼️ hardware_81_MONTAJE (6).jpg
│   │   │   │       ├── 🖼️ hardware_82_MONTAJE (7).jpg
│   │   │   │       ├── 🖼️ hardware_83_MONTAJE (8).jpg
│   │   │   │       ├── 🖼️ hardware_84_MONTAJE (9).jpg
│   │   │   │       ├── 🖼️ hardware_85_MONTAJE (10).jpg
│   │   │   │       ├── 🖼️ hardware_86_MONTAJE (11).jpg
│   │   │   │       ├── 🖼️ hardware_87_MONTAJE (12).jpg
│   │   │   │       ├── 🖼️ hardware_88_MONTAJE (13).jpg
│   │   │   │       ├── 🖼️ hardware_89_MONTAJE (14).jpg
│   │   │   │       ├── 🖼️ hardware_8_APISQUEEN_PAQUETE (6).jpg
│   │   │   │       ├── 🖼️ hardware_90_MONTAJE (15).jpg
│   │   │   │       ├── 🖼️ hardware_91_MONTAJE (16).jpg
│   │   │   │       ├── 🖼️ hardware_92_MONTAJE_LORA (1).jpg
│   │   │   │       ├── 🖼️ hardware_93_MONTAJE_LORA (2).jpg
│   │   │   │       ├── 🖼️ hardware_94_MONTAJE_LORA (3).jpg
│   │   │   │       ├── 🖼️ hardware_95_MONTAJE_LORA_HELTEC (1).jpg
│   │   │   │       ├── 🖼️ hardware_96_MONTAJE_LORA_HELTEC (2).jpg
│   │   │   │       ├── 🖼️ hardware_97_MONTAJE_LORA_HELTEC (3).jpg
│   │   │   │       ├── 🖼️ hardware_98_MONTAJE_LORA_HELTEC (4).jpg
│   │   │   │       ├── 🖼️ hardware_99_MONTAJE_LORA_HELTEC (5).jpg
│   │   │   │       └── 🖼️ hardware_9_APISQUEEN_PAQUETE (7).jpg
│   │   │   ├── 🖼️ LOGO.png
│   │   │   └── 🖼️ LOGO.svg
│   │   └── 📁 js
│   │       ├── 📄 api.js
│   │       ├── 📄 auth.js
│   │       ├── 📄 dashboard.js
│   │       ├── 📄 gallery.js
│   │       └── 📄 main.js
│   ├── 📝 README.md
│   ├── 🌐 about.html
│   ├── 🌐 dashboard.html
│   ├── 🌐 gallery.html
│   ├── 🌐 index.html
│   ├── 🌐 login.html
│   ├── 🌐 request-access.html
│   ├── 🌐 rssa.html
│   └── 🌐 t_d.html
|
├── 📁 nginx
│   ├── ⚙️ default.conf
│   └── ⚙️ nginx.conf
├── 📁 scripts
│   ├── 📄 99-mango-rx.rules
│   ├── 📄 run-local.sh
│   └── 📄 setup-local.sh
|
├── ⚙️ .gitattributes
├── ⚙️ .gitignore
├── 📝 ARCHITECTURE.md
├── 📝 CHANGELOG.md
├── 📝 CODE_OF_CONDUCT.md
├── 📝 CONTRIBUTING.md
├── 📝 LICENSE.md
├── 📝 README.md
├── 📝 ROADMAP.md
├── 📝 STATUS.md
├── ⚙️ compose.rx.yaml
├── ⚙️ compose.yaml
└── 📄 mango
```
