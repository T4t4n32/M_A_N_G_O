import DecryptedText from "@/components/effects/DecryptedText";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, ChevronDown, Search as SearchIcon, Play } from "lucide-react";

const filters = ["Todo", "Hardware", "Software", "Campo", "Progreso"];

const INITIAL_VISIBLE = 16;

type GalleryItem = { src: string; title: string; cat: string; desc: string };

const STATIC_IMAGES: GalleryItem[] = [
  { src: "/images/gallery/hardware/hardware_1_1_ESP32.webp", title: "Cerebro del Sistema: ESP32", cat: "Hardware", desc: "Microcontrolador principal del sistema M.A.N.G.O." },
  // hardware_2 removed (duplicate ESP32)
  { src: "/images/gallery/hardware/hardware_3_APISQUEEN_PAQUETE_1.webp", title: "Regulador UBEC de Voltaje", cat: "Hardware", desc: "APISQUEEN - UBEC regulador de voltaje para propulsión." },
  { src: "/images/gallery/hardware/hardware_4_APISQUEEN_PAQUETE_2.webp", title: "Kit de Propulsión Completo", cat: "Hardware", desc: "Kit completo de propulsión y control APISQUEEN." },
  { src: "/images/gallery/hardware/hardware_5_APISQUEEN_PAQUETE_3.webp", title: "Splitter de Potencia XT60", cat: "Hardware", desc: "Cable splitter XT60 para distribución de energía." },
  { src: "/images/gallery/hardware/hardware_6_APISQUEEN_PAQUETE_4.webp", title: "Splitter XT60 — Vista Alterna", cat: "Hardware", desc: "Cable splitter XT60 vista alternativa." },
  { src: "/images/gallery/hardware/hardware_7_APISQUEEN_PAQUETE_5.webp", title: "Manual del UBEC 3A", cat: "Hardware", desc: "Hoja técnica del regulador UBEC Switch-Mode 3A." },
  { src: "/images/gallery/hardware/hardware_8_APISQUEEN_PAQUETE_6.webp", title: "UBEC con Conector XT60", cat: "Hardware", desc: "Módulo UBEC listo con conector XT60." },
  { src: "/images/gallery/hardware/hardware_9_APISQUEEN_PAQUETE_7.webp", title: "Ficha Técnica ESC Feather", cat: "Hardware", desc: "Especificaciones del controlador ESC Feather." },
  { src: "/images/gallery/hardware/hardware_10_APISQUEEN_PAQUETE_8.webp", title: "ESC Sumergible Listo", cat: "Hardware", desc: "ESC sumergible con conectores para thruster." },
  { src: "/images/gallery/hardware/hardware_11_APISQUEEN_PAQUETE_9.webp", title: "Módulo de Propulsión Extra", cat: "Hardware", desc: "Componente de propulsión adicional APISQUEEN." },
  { src: "/images/gallery/hardware/hardware_12_APISQUEEN_PAQUETE_10.webp", title: "Electrónica de Propulsión", cat: "Hardware", desc: "Paquete de componentes electrónicos de potencia." },
  { src: "/images/gallery/hardware/hardware_13_APISQUEEN_PAQUETE_11.webp", title: "Conexiones Eléctricas", cat: "Hardware", desc: "Detalle de conexiones eléctricas del sistema de propulsión." },
  { src: "/images/gallery/hardware/hardware_14_APISQUEEN_PAQUETE_12.webp", title: "Controlador Secundario", cat: "Hardware", desc: "Módulo de control adicional para motores." },
  { src: "/images/gallery/hardware/hardware_15_APISQUEEN_PAQUETE_13.webp", title: "Piezas de Montaje", cat: "Hardware", desc: "Componentes mecánicos de montaje." },
  { src: "/images/gallery/hardware/hardware_16_APISQUEEN_PAQUETE_14.webp", title: "Ensamblaje de Propulsión", cat: "Hardware", desc: "Vista del ensamblaje del sistema de propulsión." },
  { src: "/images/gallery/hardware/hardware_17_APISQUEEN_PAQUETE_15.webp", title: "Cableado de Potencia", cat: "Hardware", desc: "Detalle del cableado de potencia." },
  { src: "/images/gallery/hardware/hardware_18_APISQUEEN_PAQUETE_16.webp", title: "Módulo Integrado", cat: "Hardware", desc: "Módulo integrado de propulsión APISQUEEN." },
  { src: "/images/gallery/hardware/hardware_19_APISQUEEN_PAQUETE_17.webp", title: "Fuente de Potencia", cat: "Hardware", desc: "Componente de potencia del sistema." },
  { src: "/images/gallery/hardware/hardware_20_APISQUEEN_PAQUETE_18.webp", title: "Kit Ensamblado Final", cat: "Hardware", desc: "Kit APISQUEEN completo ensamblado." },
  { src: "/images/gallery/hardware/hardware_21_APISQUEEN_PAQUETE_19.webp", title: "Thruster Brushless Submarino", cat: "Hardware", desc: "Thruster brushless con hélice para operación subacuática." },
  { src: "/images/gallery/hardware/hardware_22_APISQUEEN_PAQUETE_20.webp", title: "Cables del Thruster", cat: "Hardware", desc: "Detalle de cables y conectores del thruster." },
  { src: "/images/gallery/hardware/hardware_23_APISQUEEN_PAQUETE_21.webp", title: "Thruster — Vista Superior", cat: "Hardware", desc: "Thruster sumergible vista superior." },
  { src: "/images/gallery/hardware/hardware_24_APISQUEEN_PAQUETE_22.webp", title: "Caja Thruster 2000m", cat: "Hardware", desc: "Empaque del Brushless Underwater Thruster 2000m." },
  { src: "/images/gallery/hardware/hardware_25_APISQUEEN_PAQUETE_23.webp", title: "Precauciones del Thruster", cat: "Hardware", desc: "Instrucciones de precaución y seguridad del thruster." },
  { src: "/images/gallery/hardware/hardware_26_APISQUEEN_PAQUETE_24.webp", title: "Empaque del Motor", cat: "Hardware", desc: "Caja del thruster vista frontal." },
  { src: "/images/gallery/hardware/hardware_27_APISQUEEN_PAQUETE_25.webp", title: "Specs: 12-24V / 480kV", cat: "Hardware", desc: "Parámetros del producto (12-24V, 480kV)." },
  { src: "/images/gallery/hardware/hardware_28_APISQUEEN_PAQUETE_26.webp", title: "Motor Brushless Propeller", cat: "Hardware", desc: "Caja del Brushless Propeller Motor." },
  { src: "/images/gallery/hardware/hardware_29_APISQUEEN_PAQUETE_27.webp", title: "Control Remoto A300", cat: "Hardware", desc: "Control remoto A300 con guía rápida." },
  { src: "/images/gallery/hardware/hardware_30_APISQUEEN_PAQUETE_28.webp", title: "A300 — Vista Alternativa", cat: "Hardware", desc: "Control remoto A300 vista alternativa." },
  { src: "/images/gallery/hardware/hardware_31_APISQUEEN_PAQUETE_29.webp", title: "Componente de Enlace", cat: "Hardware", desc: "Componente adicional del paquete APISQUEEN." },
  { src: "/images/gallery/hardware/hardware_32_APISQUEEN_PAQUETE_30.webp", title: "Acople de Transmisión", cat: "Hardware", desc: "Detalle de acople mecánico." },
  { src: "/images/gallery/hardware/hardware_33_APISQUEEN_PAQUETE_31.webp", title: "Pieza de Refuerzo", cat: "Hardware", desc: "Componente de refuerzo estructural." },
  { src: "/images/gallery/hardware/hardware_34_APISQUEEN_PAQUETE_32.webp", title: "Adaptador de Conexión", cat: "Hardware", desc: "Adaptador de conexión eléctrica." },
  { src: "/images/gallery/hardware/hardware_35_APISQUEEN_PAQUETE_33.webp", title: "Soporte Mecánico", cat: "Hardware", desc: "Soporte mecánico para montaje." },
  { src: "/images/gallery/hardware/hardware_36_APISQUEEN_PAQUETE_34.webp", title: "Pieza de Ensamble", cat: "Hardware", desc: "Pieza de ensamble del sistema." },
  // hardware_37 removed (back of box, no useful info)
  { src: "/images/gallery/hardware/hardware_38_APISQUEEN_PAQUETE_36.webp", title: "Conector de Alimentación", cat: "Hardware", desc: "Conector para alimentación del sistema." },
  { src: "/images/gallery/hardware/hardware_39_APISQUEEN_PAQUETE_37.webp", title: "Terminal de Potencia", cat: "Hardware", desc: "Terminal de conexión de potencia." },
  { src: "/images/gallery/hardware/hardware_40_APISQUEEN_PAQUETE_38.webp", title: "Distribuidor Eléctrico", cat: "Hardware", desc: "Distribuidor eléctrico del paquete." },
  { src: "/images/gallery/hardware/hardware_41_APISQUEEN_PAQUETE_39.webp", title: "ESC con Conector XT60", cat: "Hardware", desc: "ESC empaquetado con conector XT60." },
  { src: "/images/gallery/hardware/hardware_42_APISQUEEN_PAQUETE_40.webp", title: "Cable USB de Programación", cat: "Hardware", desc: "Cable USB para carga y programación." },
  { src: "/images/gallery/hardware/hardware_43_APISQUEEN_PAQUETE_41.webp", title: "Cable USB — Vista Detalle", cat: "Hardware", desc: "Cable USB vista alternativa con detalle." },
  { src: "/images/gallery/hardware/hardware_44_APISQUEEN_PAQUETE_42.webp", title: "Diagrama ESC Feather", cat: "Hardware", desc: "Ficha técnica del Feather ESC con diagrama de conexión." },
  { src: "/images/gallery/hardware/hardware_45_APISQUEEN_PAQUETE_43.webp", title: "ESC Empaquetado", cat: "Hardware", desc: "ESC empaquetado vista alternativa." },
  { src: "/images/gallery/hardware/hardware_46_APISQUEEN_PAQUETE_44.webp", title: "Receptor RC 6 Canales", cat: "Hardware", desc: "Receptor RC de 6 canales con antena." },
  { src: "/images/gallery/hardware/hardware_47_APISQUEEN_PAQUETE_45.webp", title: "Receptor RC — Circuito PCB", cat: "Hardware", desc: "Receptor RC vista posterior mostrando el PCB." },
  // hardware_48 removed (third RC receptor photo)
  { src: "/images/gallery/hardware/hardware_49_APISQUEEN_PAQUETE_47.webp", title: "Cables XT60 Empaquetados", cat: "Hardware", desc: "Cables con conectores XT60 empaquetados." },
  { src: "/images/gallery/hardware/hardware_50_APISQUEEN_PAQUETE_48.webp", title: "Splitter XT60 Doble", cat: "Hardware", desc: "Cables splitter XT60 rojos." },
  { src: "/images/gallery/hardware/hardware_51_APISQUEEN_PAQUETE_49.webp", title: "Guía del Usuario UBEC", cat: "Hardware", desc: "Manual de usuario del UBEC 3A." },
  { src: "/images/gallery/hardware/hardware_52_Case_Jetson.webp", title: "Render 3D del Case Jetson", cat: "Progreso", desc: "Diseño CAD del case protector para Jetson." },
  { src: "/images/gallery/hardware/hardware_53_COMUNICACION.webp", title: "Código LoRa en Arduino IDE", cat: "Software", desc: "Código de comunicación LoRa en Arduino IDE." },
  { src: "/images/gallery/hardware/hardware_54_ESQUEMA_ARMADO_GENERAL_1.webp", title: "Prueba de Integración General", cat: "Progreso", desc: "Pruebas de integración de componentes en mesa de trabajo." },
  { src: "/images/gallery/hardware/hardware_55_ESQUEMA_SENSORES_1.webp", title: "Diagrama en Pizarra #1", cat: "Progreso", desc: "Diagrama esquemático de conexión de sensores dibujado en pizarra." },
  { src: "/images/gallery/hardware/hardware_56_ESQUEMA_SENSORES_2.webp", title: "Diagrama en Pizarra #2", cat: "Progreso", desc: "Segundo diagrama de conexión de sensores en pizarra." },
  { src: "/images/gallery/hardware/hardware_57_Estacion_Soldadura.webp", title: "Estación de Soldadura", cat: "Progreso", desc: "Estación de soldadura y ensamblaje del proyecto." },
  { src: "/images/gallery/hardware/hardware_58_Extention_Raspberry_pi.webp", title: "Adaptador Raspberry Pi 5", cat: "Hardware", desc: "Adaptador de conector para Raspberry Pi 5." },
  { src: "/images/gallery/hardware/hardware_59_G-PIO_Jetson_TK1.webp", title: "GPIO del Jetson TK1", cat: "Hardware", desc: "Detalle de puertos GPIO en NVIDIA Jetson TK1." },
  { src: "/images/gallery/hardware/hardware_60_HELTEC.webp", title: "Heltec LoRa en Case", cat: "Hardware", desc: "Módulo Heltec WiFi LoRa 32 en caja protectora." },
  { src: "/images/gallery/hardware/hardware_61_HELTEC_2.webp", title: "Heltec con OLED Activo", cat: "Hardware", desc: "Módulo Heltec con pantalla OLED encendida y cables." },
  { src: "/images/gallery/hardware/hardware_62_HELTEC_3.webp", title: "PCB Heltec V3 en Soldadura", cat: "Hardware", desc: "PCB Heltec V3 con pantalla OLED en estación de soldadura." },
  { src: "/images/gallery/hardware/hardware_63_HELTEC_4.webp", title: "Comunicación LoRa Dual", cat: "Hardware", desc: "Dos módulos Heltec en protoboard con comunicación LoRa activa." },
  { src: "/images/gallery/hardware/hardware_64_HELTEC_WIFI.webp", title: "Heltec LoRa 433MHz + WiFi", cat: "Hardware", desc: "Caja Heltec LoRa 32 (433-510 MHz) junto a módulo WiFi." },
  { src: "/images/gallery/hardware/hardware_65_jetson_expansion.webp", title: "Pinout Jetson TK1 Expansion", cat: "Hardware", desc: "Diagrama completo de pines GPIO del Jetson TK1." },
  { src: "/images/gallery/hardware/hardware_66_Manual_CHINO.webp", title: "Manual del Electrodo de pH", cat: "Hardware", desc: "Manual de instrucciones del electrodo compuesto de pH." },
  { src: "/images/gallery/hardware/hardware_67_MATERIALES.webp", title: "Arsenal del Proyecto", cat: "Hardware", desc: "Materiales del proyecto: Raspberry Pi 4, sensores y herramientas." },
  { src: "/images/gallery/hardware/hardware_68_MATERIALES_2.webp", title: "Jetson + Raspberry Pi 4", cat: "Hardware", desc: "Vista de materiales: Jetson TK1, Raspberry Pi 4 y componentes." },
  { src: "/images/gallery/hardware/hardware_69_MATERIALES_3.webp", title: "Inventario Completo", cat: "Hardware", desc: "Vista panorámica de todos los materiales del proyecto." },
  { src: "/images/gallery/hardware/hardware_70_MAX31865.webp", title: "Módulos MAX31865 PT100", cat: "Hardware", desc: "Módulos MAX31865 para lectura de sensor PT100 de temperatura." },
  { src: "/images/gallery/hardware/hardware_71_MAX31865_1.webp", title: "Tarjeta de Conversión PT100", cat: "Hardware", desc: "MAX31865 — Tarjeta de conversión PT100 (2/3/4 Wire)." },
  { src: "/images/gallery/hardware/hardware_72_MAX31865_2.webp", title: "Bornes RTD Platinum", cat: "Hardware", desc: "Bornes verdes para conexión de sensores Platinum RTD." },
  { src: "/images/gallery/hardware/hardware_73_MAX31865_3.webp", title: "Chip de Precisión MCP6002", cat: "Hardware", desc: "PCB con chip regulador MCP6002 de alta precisión." },
  { src: "/images/gallery/hardware/hardware_74_MAX31865_4.webp", title: "Conectores para PT100", cat: "Hardware", desc: "Conectores de tornillo para cables del sensor PT100." },
  { src: "/images/gallery/hardware/hardware_75_MAX31865_5.webp", title: "MAX31865 con Pines SPI", cat: "Hardware", desc: "Vista completa del MAX31865 con pines SPI." },
  { src: "/images/gallery/hardware/hardware_76_MONTAJE_1.webp", title: "Montaje en Banco de Pruebas", cat: "Progreso", desc: "Heltec con protoboard y sensores conectados en banco." },
  { src: "/images/gallery/hardware/hardware_77_MONTAJE_2.webp", title: "Acondicionamiento de Señal", cat: "Progreso", desc: "Protoboard con cableado multicolor y módulos de señal." },
  { src: "/images/gallery/hardware/hardware_78_MONTAJE_3.webp", title: "Triple Integración en Proto", cat: "Progreso", desc: "Heltec, regulador y convertidor de nivel en protoboard." },
  { src: "/images/gallery/hardware/hardware_79_MONTAJE_4.webp", title: "Sensor + ADS1115 Conectados", cat: "Progreso", desc: "Sensor de temperatura y módulo ADS1115 conectados." },
  { src: "/images/gallery/hardware/hardware_80_MONTAJE_5.webp", title: "Pruebas en Funcionamiento", cat: "Progreso", desc: "MAX31865, ADS1115 y reguladores en funcionamiento." },
  { src: "/images/gallery/hardware/hardware_81_MONTAJE_6.webp", title: "Acondicionador con Pines", cat: "Hardware", desc: "Módulo acondicionador de señal con pines y cables." },
  { src: "/images/gallery/hardware/hardware_82_MONTAJE_7.webp", title: "MAX31865 en Mano", cat: "Hardware", desc: "Tarjeta MAX31865 con bornes verdes para sensor PT100." },
  { src: "/images/gallery/hardware/hardware_83_MONTAJE_8.webp", title: "PT100 Blindado al MAX31865", cat: "Progreso", desc: "Sensor PT100 con cable blindado conectado a MAX31865." },
  { src: "/images/gallery/hardware/hardware_84_MONTAJE_9.webp", title: "Cableado Analógico", cat: "Progreso", desc: "Cableado de protoboard para sensores analógicos." },
  { src: "/images/gallery/hardware/hardware_85_MONTAJE_10.webp", title: "Convertidor de Nivel TXB0104", cat: "Progreso", desc: "Convertidor TXB0104 con pines I2C/SPI conectados." },
  { src: "/images/gallery/hardware/hardware_86_MONTAJE_11.webp", title: "Arduino UNO con Shield", cat: "Hardware", desc: "Arduino UNO con shield y cableado multicolor." },
  { src: "/images/gallery/hardware/hardware_87_MONTAJE_12.webp", title: "Arduino + Módulos de Señal", cat: "Progreso", desc: "Integración de Arduino con módulos de acondicionamiento." },
  { src: "/images/gallery/hardware/hardware_88_MONTAJE_13.webp", title: "Cadena de Sensores Completa", cat: "Progreso", desc: "MAX31865 con sensor y convertidor de nivel integrados." },
  { src: "/images/gallery/hardware/hardware_89_MONTAJE_14.webp", title: "Turbidez AZDM01 Conectado", cat: "Progreso", desc: "Sensor de turbidez AZDM01 conectado a módulo acondicionador." },
  { src: "/images/gallery/hardware/hardware_90_MONTAJE_15.webp", title: "PT100 en Protoboard", cat: "Progreso", desc: "MAX31865 con cable blindado para PT100 en protoboard." },
  { src: "/images/gallery/hardware/hardware_91_MONTAJE_16.webp", title: "Sensor BNC Calibrable", cat: "Hardware", desc: "Módulo BNC con potenciómetros para calibración." },
  { src: "/images/gallery/hardware/hardware_92_MONTAJE_LORA_1.webp", title: "Primer Montaje LoRa", cat: "Progreso", desc: "Montaje inicial del módulo Heltec LoRa en protoboard." },
  { src: "/images/gallery/hardware/hardware_93_MONTAJE_LORA_2.webp", title: "Prueba de Comunicación LoRa", cat: "Progreso", desc: "Pruebas de comunicación LoRa con Arduino IDE en PC." },
  { src: "/images/gallery/hardware/hardware_94_MONTAJE_LORA_3.webp", title: "OLED: Mensaje LoRa Enviado", cat: "Progreso", desc: "Pantalla OLED del Heltec mostrando envío de mensajes LoRa." },
  { src: "/images/gallery/hardware/hardware_95_MONTAJE_LORA_HELTEC_1.webp", title: "Soldadura de Pines Heltec", cat: "Progreso", desc: "Soldadura de pines en módulo Heltec LoRa." },
  { src: "/images/gallery/hardware/hardware_96_MONTAJE_LORA_HELTEC_2.webp", title: "Reverso de Placa Heltec V3", cat: "Hardware", desc: "Placa Heltec V3 (reverso) en estación de soldadura." },
  { src: "/images/gallery/hardware/hardware_97_MONTAJE_LORA_HELTEC_3.webp", title: "Bus OLED del Heltec", cat: "Hardware", desc: "Detalle del bus de conexión de la pantalla OLED." },
  { src: "/images/gallery/hardware/hardware_98_MONTAJE_LORA_HELTEC_4.webp", title: "Conector de Antena LoRa", cat: "Hardware", desc: "Vista lateral del módulo Heltec con conectores de antena." },
  { src: "/images/gallery/hardware/hardware_99_MONTAJE_LORA_HELTEC_5.webp", title: "Headers de la Placa Heltec", cat: "Hardware", desc: "Primer plano de los pines de conexión en la placa Heltec." },
  // hardware_100 removed (bad photo)
  { src: "/images/gallery/hardware/hardware_101_MONTAJE_LORA_HELTEC_7.webp", title: "Heltec en Estación Articulada", cat: "Hardware", desc: "Módulo Heltec LoRa con OLED en estación de soldadura articulada." },
  { src: "/images/gallery/hardware/hardware_102_MONTAJE_PH_1.webp", title: "Calibración de pH con Multímetro", cat: "Progreso", desc: "Calibración del sensor pH con multímetro en mesa de trabajo." },
  { src: "/images/gallery/hardware/hardware_103_MONTAJE_PH_2.webp", title: "Arduino + Módulo pH + ADS1115", cat: "Progreso", desc: "Arduino Uno conectado con módulos de pH y ADS1115." },
  { src: "/images/gallery/hardware/hardware_104_MONTAJE_PH_3.webp", title: "Prueba en Soluciones Buffer", cat: "Progreso", desc: "Pruebas de sensor pH en agua destilada y soluciones de calibración." },
  { src: "/images/gallery/hardware/hardware_105_MONTAJE_PH_4.webp", title: "Kit de Calibración pH 4.0/7.0", cat: "Hardware", desc: "Sensores de pH en estuche con calibración 7.0 y 4.0." },
  { src: "/images/gallery/hardware/hardware_106_MONTAJE_PH_5.webp", title: "Amplificador pH en Acción", cat: "Progreso", desc: "Arduino Uno con módulo amplificador conectado a sensores pH." },
  { src: "/images/gallery/hardware/hardware_107_MONTAJE_PH_6.webp", title: "ADC MAX1238 con Tornillos", cat: "Hardware", desc: "Placa amplificadora MAX1238 ADC con conectores de tornillo." },
  { src: "/images/gallery/hardware/hardware_108_PAQUETE_1.webp", title: "Raspberry Pi 4 Desembalada", cat: "Progreso", desc: "Raspberry Pi 4 en caja protectora con módulo WiFi." },
  { src: "/images/gallery/hardware/hardware_109_PAQUETES.webp", title: "Llegada de Componentes", cat: "Progreso", desc: "Cajas de paquetes recibidas para el proyecto M.A.N.G.O." },
  { src: "/images/gallery/hardware/hardware_110_PAQUETES_LLEGADA.webp", title: "Paquete Internacional", cat: "Progreso", desc: "Cajas con etiqueta aduanal desde el exterior." },
  { src: "/images/gallery/hardware/hardware_111_Paquetes_MANGO.webp", title: "Unboxing M.A.N.G.O", cat: "Progreso", desc: "Paquetes desembalados con libreta y componentes electrónicos." },
  { src: "/images/gallery/hardware/hardware_112_PH_1.webp", title: "Sensor pH con BNC", cat: "Hardware", desc: "Módulo sensor de pH con conector BNC (vista frontal)." },
  { src: "/images/gallery/hardware/hardware_113_PH_2.webp", title: "Kit Completo de pH", cat: "Hardware", desc: "Kit de medición de pH en su estuche con módulo BNC." },
  { src: "/images/gallery/hardware/hardware_114_PH_3.webp", title: "PCB del Módulo pH", cat: "Hardware", desc: "Reverso de la placa del módulo de sensor de pH BNC." },
  { src: "/images/gallery/hardware/hardware_115_SENSOR.webp", title: "Termopares + Acondicionadores", cat: "Hardware", desc: "Sensores termopares empacados junto a módulos acondicionadores." },
  { src: "/images/gallery/hardware/hardware_116_sensores_1.webp", title: "Estación de Sensores LoRa", cat: "Hardware", desc: "Conjunto de módulos Heltec, MAX31865 y conectores." },
  { src: "/images/gallery/hardware/hardware_117_SENSORES_1.webp", title: "Electrodo de pH Azul", cat: "Hardware", desc: "Sonda de electrodo de pH azul en empaque protector." },
  { src: "/images/gallery/hardware/hardware_118_SENSORES_2.webp", title: "Vista General de Sensores", cat: "Hardware", desc: "Sensores termopares y de pH con módulos y cajas." },
  { src: "/images/gallery/hardware/hardware_119_SENSORES_3.webp", title: "PT100 y BNC Empacados", cat: "Hardware", desc: "Termopares PT100 y módulos BNC aún empacados." },
  { src: "/images/gallery/hardware/hardware_120_SENSORES_4.webp", title: "Bolsas Antiestáticas BNC", cat: "Hardware", desc: "Módulos acondicionadores BNC en bolsas antiestáticas." },
  { src: "/images/gallery/hardware/hardware_121_SENSORES_5.webp", title: "Termopares Certificados", cat: "Hardware", desc: "Caja de thermocouples con calibración profesional." },
  { src: "/images/gallery/hardware/hardware_122_SENSORES_LORA_MAX31865_1.webp", title: "Heltec + PT100 + MAX31865", cat: "Hardware", desc: "Módulo Heltec con sensores PT100 y acondicionador MAX31865." },
  { src: "/images/gallery/hardware/hardware_123_SENSORES_LORA_MAX31865_2.webp", title: "Integración de Temperatura", cat: "Hardware", desc: "Módulos MAX31865, sensores PT100 y conectores BNC integrados." },
  { src: "/images/gallery/hardware/hardware_124_SENSORES_LORA_MAX31865_3.webp", title: "Plataforma de Montaje LoRa", cat: "Hardware", desc: "Plataforma con tiras de contacto para módulos LoRa." },
  { src: "/images/gallery/hardware/hardware_125_SENSORES_LORA_MAX31865_4.webp", title: "Bus de Comunicación SPI", cat: "Hardware", desc: "Extensión con pines y buses de comunicación para MAX31865." },
  { src: "/images/gallery/hardware/hardware_126_SENSORES_LORA_MAX31865_5.webp", title: "Integración Final de Sensores", cat: "Hardware", desc: "Heltec LoRa con MAX31865, PT100 y adaptadores BNC." },
  { src: "/images/gallery/hardware/hardware_127_SENSORES_LORA_MAX31865_6.webp", title: "Estación Completa Operativa", cat: "Hardware", desc: "Configuración completa: LoRa, PT100, MAX31865 y fuente." },
  { src: "/images/gallery/hardware/hardware_128_Sensor_ph.webp", title: "Sondas pH Calibradas", cat: "Hardware", desc: "Sondas de pH: electrodo blanco (referencia) y azul (medición)." },
  { src: "/images/gallery/hardware/hardware_129_Sensors_lora.webp", title: "Kit LoRa de Largo Alcance", cat: "Hardware", desc: "Módulos SX1278, antenas, cables USB y conectores LoRa." },
  { src: "/images/gallery/hardware/hardware_130_TEMPERATURA_1.webp", title: "PT100 de Fábrica", cat: "Hardware", desc: "Termocouples PT100 empacados con certificados de calibración." },
  { src: "/images/gallery/hardware/hardware_131_TEMPERATURA_2.webp", title: "Sondas Impermeables Inox", cat: "Hardware", desc: "Sondas PT100 impermeables de acero inoxidable." },
  { src: "/images/gallery/hardware/hardware_132_TEMPERATURA_3.webp", title: "Terminales en Horquilla", cat: "Hardware", desc: "Cable mallado y terminales de conexión en horquilla." },
  { src: "/images/gallery/hardware/hardware_133_TEMPERATURA_4.webp", title: "Sondas PT100 de 3 Hilos", cat: "Hardware", desc: "Conjunto de sondas PT100 de 3 hilos con terminales aislados." },
  { src: "/images/gallery/hardware/hardware_134_WIRELESS.webp", title: "Heltec Wireless Stick", cat: "Hardware", desc: "Módulo Heltec Wireless Stick (LoRa + Wi-Fi + BLE) con antena." },
  { src: "/images/gallery/hardware/hardware_135_ESQUEMA_COMPLETO.webp", title: "Arquitectura Completa del HW", cat: "Hardware", desc: "Diagrama completo: potencia, sensores y procesamiento." },
  { src: "/images/gallery/hardware/hardware_136_ESQUEMA_CONEXION_SENSORES_JETSON_LORA_TX_RX.webp", title: "Flujo: Sensores → LoRa → Jetson", cat: "Hardware", desc: "Diagrama de flujo de datos desde sensores hasta Jetson vía LoRa." },
  { src: "/images/gallery/hardware/hardware_137_ESQUEMA_MANGO.webp", title: "Diagrama Conceptual M.A.N.G.O", cat: "Software", desc: "Diagrama de la problemática ambiental y la solución tecnológica." },
];

const VALID_CATS = new Set(["Hardware", "Software", "Campo", "Progreso"]);

export function GallerySection() {
  const [active, setActive] = useState("Todo");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [apiImages, setApiImages] = useState<GalleryItem[]>([]);

  // Fetch all uploaded images from public API (all pages) — fail silently so static gallery always works.
  // Only dynamic uploads (URL starts with /api/v1/uploads/) are included to avoid duplicating
  // the static hardware images already listed in STATIC_IMAGES above.
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const all: GalleryItem[] = [];
        let page = 1;
        while (true) {
          const res = await fetch(`/api/v1/public/media?kind=image&per_page=100&page=${page}`);
          if (!res.ok || cancelled) return;
          const data = await res.json() as {
            items: Array<{ url: string; title: string; category: string | null; description: string | null }>;
            total: number;
            pages: number;
          };
          if (cancelled) return;
          const mapped: GalleryItem[] = data.items
            .filter((it) => it.url.startsWith("/api/v1/uploads/"))
            .map((it) => ({
              src:   it.url,
              title: it.title || "Sin título",
              cat:   VALID_CATS.has(it.category ?? "") ? (it.category as string) : "Progreso",
              desc:  it.description || "",
            }));
          all.push(...mapped);
          if (page >= data.pages) break;
          page++;
        }
        setApiImages(all);
      } catch {
        // network error — static gallery still renders
      }
    };
    void fetchAll();
    return () => { cancelled = true; };
  }, []);

  const images = useMemo<GalleryItem[]>(
    () => [...STATIC_IMAGES, ...apiImages],
    [apiImages],
  );

  const filtered = useMemo(() => {
    let result = active === "Todo" ? images : images.filter((img) => img.cat === active);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (img) =>
          img.title.toLowerCase().includes(q) ||
          img.desc.toLowerCase().includes(q) ||
          img.cat.toLowerCase().includes(q)
      );
    }
    return result;
  }, [active, search, images]);

  const needsCollapse = filtered.length > INITIAL_VISIBLE;
  const visible = expanded || !needsCollapse ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - INITIAL_VISIBLE;

  // Reset expanded when changing filter
  useEffect(() => {
    setExpanded(false);
  }, [active]);

  // Preload adjacent images when lightbox is open
  useEffect(() => {
    if (lightbox === null) return;
    const preload = (index: number) => {
      const img = new Image();
      img.src = filtered[index]?.src;
    };
    preload((lightbox + 1) % filtered.length);
    preload((lightbox - 1 + filtered.length) % filtered.length);
    // Preload 2 ahead as well
    preload((lightbox + 2) % filtered.length);
  }, [lightbox, filtered]);

  const resetZoom = () => setZoom(1);

  const goNext = useCallback(() => {
    if (lightbox === null) return;
    setZoom(1);
    setLightbox((lightbox + 1) % filtered.length);
  }, [lightbox, filtered.length]);

  const goPrev = useCallback(() => {
    if (lightbox === null) return;
    setZoom(1);
    setLightbox((lightbox - 1 + filtered.length) % filtered.length);
  }, [lightbox, filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") { setLightbox(null); setZoom(1); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))); }
      else if (e.key === "0") { e.preventDefault(); setZoom(1); }
      else if (e.key === "Home") { e.preventDefault(); setZoom(1); setLightbox(0); }
      else if (e.key === "End") { e.preventDefault(); setZoom(1); setLightbox(filtered.length - 1); }
      else if (e.key === "Tab") {
        // Trap focus within the lightbox
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], video, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, goNext, goPrev, filtered.length]);

  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  // Focus management: send focus into the dialog on open, restore on close.
  useEffect(() => {
    if (lightbox === null) return;
    lastTrigger.current = (document.activeElement as HTMLElement) ?? null;
    const t = window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      target?.focus();
    }, 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      lastTrigger.current?.focus?.();
    };
  }, [lightbox]);

  const openLightbox = (i: number) => {
    setZoom(1);
    setLightbox(i);
  };

  const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);

  // Static hardware images ship a pre-generated /thumb/ WebP (~480px) for the grid;
  // dynamic API uploads have no thumb variant, so the grid falls back to their original src.
  const HARDWARE_DIR = "/images/gallery/hardware/";
  const gridSrc = (src: string) =>
    src.startsWith(HARDWARE_DIR) ? src.replace(HARDWARE_DIR, `${HARDWARE_DIR}thumb/`) : src;

  return (
    <section id="galeria" className="py-20 md:py-28 bg-[hsl(215,40%,7%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,hsl(204_70%_53%/0.10),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_70%,hsl(168_72%_42%/0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold"><DecryptedText text="Galería de Registro" speed={40} maxIterations={8} animateOn="view" className="text-white" encryptedClassName="text-accent/40" /></h2>
          <p className="mt-3 text-white/50 max-w-2xl mx-auto">
            Registro visual del desarrollo y pruebas del proyecto
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-md mx-auto mb-8">
          <label htmlFor="gallery-search" className="sr-only">Buscar imágenes</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              id="gallery-search"
              type="text"
              placeholder="Buscar imágenes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setExpanded(false); }}
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(168,72%,42%)]/60 focus-visible:border-[hsl(168,72%,42%)]/60 transition-all backdrop-blur-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div role="tablist" aria-label="Filtros de galería" className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.filter((f) => f === "Todo" || images.some((img) => img.cat === f)).map((f) => {
            const count = f === "Todo" ? images.length : images.filter((img) => img.cat === f).length;
            const selected = active === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={selected}
                aria-label={`Filtrar por ${f}, ${count} elemento${count !== 1 ? "s" : ""}`}
                onClick={() => { setActive(f); setExpanded(false); }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(210,35%,8%)] ${
                  selected
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.1] border border-white/10"
                }`}
              >
                {f} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {search.trim() && (
          <p className="text-center text-sm text-white/50 mb-6">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{search}"
          </p>
        )}

        {/* CSS Columns Masonry — no JS overhead */}
        <div className="relative">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4" style={{ columnFill: 'balance' }}>
            {visible.map((img, i) => (
              <div
                key={img.src}
                className="break-inside-avoid mb-4 bg-white/[0.06] rounded-xl border border-white/[0.08] overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-[hsl(168_72%_42%/0.1)] transition-all duration-300 cursor-pointer group"
                onClick={() => openLightbox(i)}
              >
                <div className="overflow-hidden bg-white/[0.03]" style={{ aspectRatio: '4 / 3' }}>
                  <img
                    src={gridSrc(img.src)}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    width={480}
                    height={360}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm truncate">{img.title}</h3>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{img.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Fade overlay + expand button */}
          {needsCollapse && !expanded && (
            <div className="relative mt-0">
              <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-[hsl(205,35%,20%)] to-transparent pointer-events-none" />
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setExpanded(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] text-white font-semibold text-sm hover:from-[hsl(168,72%,38%)] hover:to-[hsl(204,70%,48%)] transition-all shadow-lg shadow-[hsl(168,72%,42%)]/20"
                >
                  <ChevronDown className="h-4 w-4" />
                  Ver {hiddenCount} imágenes más
                </button>
              </div>
            </div>
          )}

          {needsCollapse && expanded && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/70 hover:text-white hover:bg-white/[0.12] font-semibold text-sm transition-all"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
                Mostrar menos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-lightbox-title"
          aria-describedby="gallery-lightbox-desc"
          className="fixed inset-0 z-[110] bg-black flex items-center justify-center"
          onClick={() => { setLightbox(null); setZoom(1); }}
        >
          {/* Close */}
          <button
            data-autofocus
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); setZoom(1); }}
            aria-label="Cerrar visor"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Zoom controls */}
          <div
            role="toolbar"
            aria-label="Controles de zoom"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setZoom(Math.max(0.5, +(zoom - 0.25).toFixed(2)))} className="p-1.5 text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded" aria-label="Reducir zoom (tecla -)">
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-white/80 text-xs font-medium min-w-[3rem] text-center" aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(4, +(zoom + 0.25).toFixed(2)))} className="p-1.5 text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded" aria-label="Aumentar zoom (tecla +)">
              <ZoomIn className="h-5 w-5" />
            </button>
            {zoom !== 1 && (
              <button onClick={resetZoom} className="p-1.5 text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded" aria-label="Restablecer zoom (tecla 0)">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Counter + keyboard hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs flex items-center gap-3" aria-live="polite">
            <span>{lightbox + 1} / {filtered.length}</span>
            <span className="hidden sm:inline opacity-60">← → cambiar · + − zoom · 0 reset · Esc cerrar</span>
          </div>
          <span className="sr-only" aria-live="polite">
            {lightbox + 1} / {filtered.length}
          </span>

          {/* Prev arrow */}
          <button
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>

          {/* Next arrow */}
          <button
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </button>

          {/* Media + info */}
          <div className="max-w-5xl w-full px-10 md:px-16" onClick={(e) => e.stopPropagation()}>
            <div
              className="relative flex items-center justify-center rounded-xl overflow-hidden"
              style={{ height: "72vh" }}
              onWheel={(e) => {
                if (!filtered[lightbox] || isVideo(filtered[lightbox].src)) return;
                e.preventDefault();
                setZoom((z) => Math.min(4, Math.max(0.5, +(z - Math.sign(e.deltaY) * 0.15).toFixed(2))));
              }}
              onDoubleClick={() => {
                if (!filtered[lightbox] || isVideo(filtered[lightbox].src)) return;
                setZoom((z) => (z === 1 ? 2 : 1));
              }}
            >
              {filtered[lightbox] && isVideo(filtered[lightbox].src) ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={filtered[lightbox].src}
                  controls
                  autoPlay
                  playsInline
                  className="w-auto h-full max-w-full max-h-full bg-black rounded"
                  style={{ maxHeight: "72vh" }}
                  aria-label={filtered[lightbox]?.title}
                />
              ) : (
                <img
                  src={filtered[lightbox]?.src}
                  alt={filtered[lightbox]?.title}
                  className="w-auto h-auto max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                  style={{ transform: `scale(${zoom})`, maxHeight: "72vh", cursor: zoom > 1 ? "zoom-out" : "zoom-in" }}
                  draggable={false}
                />
              )}
            </div>
            <div className="mt-3 text-center">
              <h3 id="gallery-lightbox-title" className="text-white font-bold text-lg">{filtered[lightbox]?.title}</h3>
              <p id="gallery-lightbox-desc" className="text-white/60 mt-1 text-sm">{filtered[lightbox]?.desc}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
