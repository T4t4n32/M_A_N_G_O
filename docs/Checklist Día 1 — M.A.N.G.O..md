# Checklist Día 1 — M.A.N.G.O.

## 1. Inventario eléctrico completo

Marca esto primero antes de conectar nada:

- [x] Confirmar voltaje nominal de la batería LiPo: **18.5V**

| Puerto        | Voltaje |
| ------------- | ------- |
| Conector XT90 | 19.19 V |
| S5 Riel 1     | 3.83 V  |
| S5 Riel 2     | 7.67 V  |
| S5 Riel 3     | 11.51 V |
| S5 Riel 4     | 15.35 V |
| S5 Riel 5     | 19.19 V |
- [x] Confirmar capacidad: **5000 mAh**
Se uso un IMAX B6AC para verificar la capacidad de la bateria
Usando el el cargador apenas llego a los 2126 mAh

- [x] Confirmar cantidad de celdas reales de la LiPo
Cuenta con 5 celdas (1 riel = Positivo, 5 rieles = Negativo)

- [x] Identificar con exactitud el voltaje de entrada de la **Jetson TK1**
El kit de desarrollo [NVIDIA](https://developer.download.nvidia.com/embedded/jetson/TK1/docs/Jetson_TK1_FAQ_2014May01_V2.pdf) Jetson TK1 requiere una fuente de alimentación de **12V DC** a través de su conector cilíndrico estándar. Se recomienda un adaptador que proporcione al menos **5A** (60W) para asegurar un funcionamiento estable, especialmente al utilizar periféricos y el ventilador incluido. 
- **Voltaje de entrada:** 12V DC nominal.
- **Conector:** Cilíndrico estándar (diámetro exterior aprox. 5.5mm, interior 2.5mm).
- **Corriente Recomendada:** 5A (mínimo funcional). 

- [x] Identificar el voltaje y corriente del **Kinect V1**
El [Kinect v1](https://www.reddit.com/r/kinect/comments/p1nnsb/how_much_power_does_a_kinect_actually_use/?tl=es-419#:~:text=Estoy%20usando%20un%20Kinect%20360%20V1%2C%20modelo,de%209V%2C%200.45A%20de%20corriente%20pico%20al) para Xbox 360 opera con un voltaje de **12V DC** y consume una corriente pico de aproximadamente **0.45A a 1.5A** cuando está activo (con motor de inclinación y sensores funcionando), lo que equivale a un consumo de energía real de unos **5.4W a 18W** aproximadamente
- **Voltaje:** 12V DC (corriente continua).
- **Corriente:** Suele requerir adaptadores de 12V 1.5A para asegurar energía suficiente para el motor.
- **Watts (Potencia):** El consumo promedio funcional es bajo, generalmente por debajo de los 15W, aunque la fuente del adaptador suele ser de mayor capacidad.

- [x] Identificar consumo estimado del **módem Huawei**
### Datasheet
The Huawei E3372h-153 is a high-speed LTE Category 4 USB stick providing up to 150 Mbps download and 50 Mbps upload speeds, supporting 4G FDD/TDD, 3G, and 2G networks. It features HiLink technology for automatic installation (plug-and-play), two CRC-9 external antenna connectors, and a microSD card slot for storage. 
[1](https://www.ycict.net/products/e3372h-153-usb-sticker/), [2](https://sincereonetech.com/products/lte-modem-huawei-e3372h-153-4g-dongle/#:~:text=Details,850/900/1800/1900MHz), [3](https://www.4gltemall.com/huawei-e3372-4g-lte-cat4-usb-stick.html), [4](https://www.conrad.com/en/p/huawei-e3372h-320-lte-black-4g-usb-modem-150-mbps-black-1927104.html#:~:text=Huawei%20E3372h%20LTE%20USB%20modem%2C%20150%20Mbps%2C,MBit/s.%20Built%2Din%20data%20counter%20LED%20status%20indicator), [5](https://www.amazon.ca/Huawei-E3372h-153-Unlocked-Europe-Middle/dp/B013UURTL4#:~:text=Product%20Summary:%20Huawei%20E3372h%2D153%20Unlocked%20150%20Mbps,the%20Internet%20anywhere%20and%20at%20any%20time.)
**Key Technical Specifications (E3372h-153):**
- **Network Compatibility:**
    - **4G LTE-FDD:** Band 1/3/7/8/20 (\(2100/1800/2600/900/800\) MHz).
    - **4G LTE-TDD:** Band 38/40/41 (\(2600/2300/2500\) MHz).
    - **3G UMTS/DC-HSPA+:** B1/B8 (\(2100/900\) MHz).
    - **2G GSM/EDGE:** \(850/900/1800/1900\) MHz.
- **Data Speeds:** LTE Cat4 (\(150\) Mbps DL / \(50\) Mbps UL), DC-HSPA+ (\(43.2\) Mbps DL).
- **Interface:** USB 2.0 type-A, SIM slot, MicroSD slot.
- **Antenna:** External 2 x 2 MIMO (CRC-9 connector).
- **Features:** HiLink (web UI, driverless), SMS support, IPv4/IPv6 dual-stack.
- **Dimensions:** \(88\text{mm} \times 28\text{mm} \times 11.5\text{mm}\), Weight \(< 35\text{g}\).
- **OS Support:** Windows \(7/8/10/11\), macOS \(10.9+\). [1](https://consumer.huawei.com/za/routers/e3372/specs/#:~:text=Close-,HUAWEI%204G%20Dongle%20E3372,of%20up%20to%20236.8%20kbps), [2](https://sincereonetech.com/news/new-arrival-huawei-e3372h-153-4g-usb-modem/), [3](https://www.technotrade.com.ua/userfiles/files/Huawei-E3372-user-guide.pdf), [4](https://www.ycict.net/products/e3372h-153-usb-sticker/), [5](https://www.4gltemall.com/huawei-e3372-4g-lte-cat4-usb-stick.html), [6](https://sincereonetech.com/products/lte-modem-huawei-e3372h-153-4g-dongle/#:~:text=Details,850/900/1800/1900MHz)

**Key Differences/Notes:**

- **E3372h-153 vs E3372s-153:** The 'h' (HiLink) models generally use web-based configuration, while older 's' models may require traditional client software.
- **Antenna:** Uses CRC-9 connectors, not TS-9. [1](https://www.0xf8.org/2017/01/flashing-a-huawei-e3372h-4g-lte-stick-from-hilink-to-stick-mode/#:~:text=Flashing%20a%20Huawei%20E3372h%204G%20LTE%20stick,its%20exact%20meaning%20however%20Hardware%20version%20CL2E3372HM), [2](https://sincereonetech.com/products/lte-modem-huawei-e3372h-153-4g-dongle/#:~:text=Details,850/900/1800/1900MHz), [3](https://www.4gltemall.com/huawei-e3372-4g-lte-cat4-usb-stick.html)

### Consumo
Segun el datasheet de Huawei, el consumo es:
Maximum power consumption <3.5W 
Power supply 5V/500mA 

- [x] Identificar consumo de **LoRa**
#### Informacion Relevante:
El módulo LoRa Ra-02 (basado en SX1278) destaca por su consumo eficiente, ideal para IoT. Su corriente de transmisión es baja, promediando entre ==7 mA y 8 mA a 12V==, mientras que el consumo en reposo es extremadamente bajo, ideal para funcionar con baterías durante largos periodos. La alimentación típica es de 3.3V. [1](https://www.youtube.com/watch?v=kNXnCjJplZw&t=13), [2](https://www.youtube.com/shorts/zRgTOb06DTM), [3](https://www.plexylab.com/shop/modulo-lora-ra-02-2233#:~:text=M%C3%B3dulo%20LoRa%20RA%2D02433%20MHz%20con%20chip%20SX1278%2C,otros%20microcontroladores.%20Soporta%20modos%20LoRa%20y%20FSK.), [4](https://www.amazon.es/TECNOIOT-SX1278-Wireless-Spectrum-Transmission/dp/B07RD2JV7Y), [5](https://translate.google.com/translate?u=https://robu.in/product/sx1278-lora-module-ra-02-433mhz-wireless-spread-spectrum-transmission/&hl=es&sl=en&tl=es&client=sge#:~:text=Ra%2D02%20is%20a%20wireless,communication%20distance%20of%2010%2C000%20meters.)

**Detalles de Consumo del Ra-02 (SX1278):**
- **Transmisión (TX):** El consumo varía según la potencia configurada, generalmente entre 20 mA y 120 mA (máximo a +20 dBm).
- **Recepción (RX):** Aproximadamente 10 mA a 15 mA.
- **Modo Reposo (Sleep):** Muy bajo consumo, en el orden de sub-microamperios ((mu)A), típicamente alrededor de 0.2 (mu)A a 1(mu)A, permitiendo años de duración de batería. [1](https://electronilab.co/tienda/modulo-transceptor-lora-sx1278-drf1278f-433-mhz-con-antena/#:~:text=Especificaciones%20El%C3%A9ctricas%20Voltaje%20de%20alimentaci%C3%B3n:%201.8V%20%E2%80%93,0.2%C2%B5A%20Temperatura%20de%20operaci%C3%B3n:%20%2D40%C2%B0C%20a%20+85%C2%B0C), [2](https://wiki.seeedstudio.com/es/WM1302_module/#:~:text=Especificaciones%20Regi%C3%B3n%20EU868%20US915%20Consumo%20de%20Energ%C3%ADa,mA%20RX:%2053%20mA%20LBT\(Listen%20Before%20Talk\)), [3](https://epyelectronica.com/tienda/inalambricos-y-comunicacion/inalambrico-inalambricos-y-comunicacion/modulo-lora-sx1276-868-915mhz/#:~:text=Caracter%C3%ADsticas%20de%20Funcionamiento:%20Voltaje%20de%20funcionamiento:%201.8V,70C%20Potencia%20de%20transmisi%C3%B3n:%2020%20dBm%20\(M%C3%A1x\)), [4](https://programarfacil.com/esp8266/esp8266-deep-sleep-nodemcu-wemos-d1-mini/#:~:text=Table_title:%20Cu%C3%A1nto%20consume%20un%20ESP8266%20Table_content:%20header:,Deep%20sleep%20%7C%20Consumo:%2020%20%C2%B5A%20%7C), [5](https://www.youtube.com/shorts/zRgTOb06DTM)

**Puntos Clave para la Eficiencia:**
- **Tecnología:** Utiliza modulación de amplio espectro, tolerando interferencias y logrando un balance entre largo alcance y bajo consumo energético.
- **Aplicaciones:** Diseñado para enviar pequeños paquetes de datos a kilómetros de distancia sin necesidad de recarga constante.
- **Alimentación:** Opera en el rango de 1.8V a 3.7V, siendo 3.3V el estándar recomendado. [1](https://www.youtube.com/watch?v=7naS8w2khWk&t=25), [2](https://translate.google.com/translate?u=https://robu.in/product/sx1278-lora-module-ra-02-433mhz-wireless-spread-spectrum-transmission/&hl=es&sl=en&tl=es&client=sge#:~:text=Ra%2D02%20is%20a%20wireless,communication%20distance%20of%2010%2C000%20meters.), [3](https://www.zamux.co/modulo-integrado-rf-433mhz-lora-ra-02-sx1278#:~:text=Descripci%C3%B3n%20Tensi%C3%B3n%20de%20funcionamiento%201%2C8%20%2D%203%2C7,Temperatura%20de%20trabajo%20%2D40%2D%20+%2085%20grados.), [4](https://www.amazon.es/TECNOIOT-SX1278-Wireless-Spectrum-Transmission/dp/B07RD2JV7Y#:~:text=%E2%9C%94%20Dise%C3%B1o%20Compacto%20%E2%80%93%20Incluye%20conector%20IPEX,\(3.3V%20t%C3%ADpico\)%2C%20ideal%20para%20proyectos%20con%20bater%C3%ADas.), [5](https://www.youtube.com/watch?v=kNXnCjJplZw&t=13)

Es fundamental poner el módulo en modo _sleep_ cuando no esté transmitiendo o recibiendo para aprovechar su bajo consumo, ya que el consumo en activo es considerablemente mayor. [1](https://translate.google.com/translate?u=https://iopscience.iop.org/article/10.1088/1742-6596/1407/1/012092/pdf&hl=es&sl=en&tl=es&client=sge#:~:text=Papers%20that%20model%20the%20energy,mA%20for%20the%20actual%20transmission.), [2](https://www.mechatronicstore.cl/lora-02-sx1278-433mhz/)

El módulo LoRa Ra-02 (basado en el chip SX1278) opera con una potencia de salida máxima de **+20 dBm**, lo que equivale a **100 mW** (==0.1 vatios==). Este módulo es diseñado para comunicaciones de largo alcance y bajo consumo, operando generalmente en la frecuencia de 433 MHz, ideal para sensores remotos. [1](https://electronilab.co/tienda/modulo-transceptor-lora-sx1278-ra-02-largo-alcance-433-mhz/#:~:text=M%C3%B3dulo%20Transceptor%20LoRa%20SX1278%20Ra,Largo%20alcance%20%E2%80%93%20433%20Mhz%20%2D%20Electronilab), [2](https://www.vistronica.com/comunicaciones/wifi/modulotransceptorlorasx1278ra-02433mhzconbase-detail.html#:~:text=El%20m%C3%B3dulo%20de%20transmisi%C3%B3n%20inal%C3%A1mbrico%20est%C3%A1%20basado,una%20larga%20distancia%20de%20transmisi%C3%B3n%20y%20alta), [3](https://www.electromania.pe/producto/modulo-lora-ra-02-sx1278/#:~:text=Caracter%C3%ADsticas%20%23%20Descripci%C3%B3n%20Valor%201%20Distancia%20de,solo%20148%20dBm%204%20Comunicaci%C3%B3n%20SPI%20semid%C3%BAplex), [4](https://naylampmechatronics.com/inalambrico/1059-transceiver-lora-433mhz-ra-02-sx1278-ufl.html#:~:text=Transceiver%20LORA%20433MHz%20RA%2D02%20SX1278%20UFL), [5](http://electronicaelfaro.com/modulo-lora-ra-02-sx1278)

**Características clave de potencia (Ra-02):**

- **Potencia de salida:** +20 dBm (100 mW).
- **Sensibilidad:** Hasta -148 dBm.
- **Consumo:** Bajo consumo de energía, ideal para baterías.
- **Frecuencia:** 433 MHz. [1](http://electronicaelfaro.com/modulo-lora-ra-02-sx1278), [2](https://www.mechatronicstore.cl/lora-02-sx1278-433mhz/#:~:text=Voltaje%20de%20alimentaci%C3%B3n:%203.3V%20DC%20\(bajo%20consumo%20energ%C3%A9tico\).), [3](https://www.didacticaselectronicas.com/shop/ws-16807-modulo-lora-hat-sx1262-para-raspberry-pi-915mhz-22837#:~:text=Funciones%20de%20bajo%20consumo%20de%20energ%C3%ADa%20como,Radio%2C%20ideal%20para%20aplicaciones%20alimentadas%20por%20bater%C3%ADa), [4](https://www.vistronica.com/comunicaciones/wifi/modulotransceptorlorasx1278ra-02433mhzconbase-detail.html#:~:text=El%20m%C3%B3dulo%20de%20transmisi%C3%B3n%20inal%C3%A1mbrico%20est%C3%A1%20basado,una%20larga%20distancia%20de%20transmisi%C3%B3n%20y%20alta)

La alta potencia de \(+20 \text{ dBm}\) (100 mW) es el valor máximo permitido para lograr el largo alcance mencionado en las especificaciones del módulo (a menudo anunciado hasta 10 km en condiciones óptimas). [1](https://yorobotics.co/producto/modulo-transceptor-lora-ra-02-sx1278-433mhz-v1-0-10km/#:~:text=0%2010Km,-0), [2](https://electronilab.co/tienda/modulo-transceptor-lora-sx1278-drf1278f-433-mhz-con-antena/#:~:text=Con%20una%20alta%20sensibilidad%20de%20hasta%20%2D139dBm,con%20un%20consumo%20de%20energ%C3%ADa%20extremadamente%20bajo.), [3](https://www.vistronica.com/comunicaciones/wifi/modulotransceptorlorasx1278ra-02433mhzconbase-detail.html#:~:text=El%20m%C3%B3dulo%20de%20transmisi%C3%B3n%20inal%C3%A1mbrico%20est%C3%A1%20basado,una%20larga%20distancia%20de%20transmisi%C3%B3n%20y%20alta)
### Consumo:
- 1.8 - 3.3 V
- 10-15 mA

- [x] Identificar consumo de cada sensor
## Turbidez:
El sensor de turbidez [TSW-20M](https://www.google.com/search?q=TSW-20M&sca_esv=9506f15c4682863e&biw=1912&bih=914&sxsrf=ANbL-n5AiGy7msrecKYpWrIAjI-WSsrgFA%3A1775157272021&ei=GMDOaYyFAYrJwbkPsqC5-Qk&ved=2ahUKEwjfi9fW8c-TAxX3RzABHUOyBz0QgK4QegQIARAB&uact=5&oq=consumo+del+sensor+TSW-20M+&gs_lp=Egxnd3Mtd2l6LXNlcnAiG2NvbnN1bW8gZGVsIHNlbnNvciBUU1ctMjBNIDIEECMYJzIFEAAY7wUyCBAAGIAEGKIEMgUQABjvBTIIEAAYgAQYogQyBRAAGO8FSN0QUM8IWM8IcAJ4AJABAJgBggGgAYIBqgEDMC4xuAEDyAEA-AEBmAIDoAKSAcICCBAAGLADGO8FwgILEAAYgAQYsAMYogSYAwCIBgGQBgWSBwMyLjGgB6sEsgcDMC4xuAeIAcIHBTAuMS4yyAcMgAgA&sclient=gws-wiz-serp&mstk=AUtExfAB8GdAmCdRCIZ6I8LXIrZvoXZgfObhMwU65rDQ070BMLtjX-o73RjjsB8OUKWKYdmal-LeXvpN5gz5M4_KaqUi_ITVmySK5LW3iTWYOfENGUhSDzcewThJyFrhKLeFPmb_4Dkj1zvw9hNbTOzS7GAIBM9ZZYX6T9TBrLjHNnLWhQpLa98qfwrxEwdefa4ENomMzvUsD5OTrMDgQ5V-jLKD-RAOGdVAI4zVFsH10EJ4B2h8ioDit8j0oP8nU8MMKtQG2VC3lIW3Dqshf04e6uIzli015u6S-bAUE7b7W3qQwg7c9CmvIgUZibXFzY1LislAcB1w2pXfzQ6VKJkkgdnmA3ai-uJUxnZHJCSnI_hwVQ7fRV-X6DBMlCddnKUEDcuMqJmW0VS7NBGPwOJpvS24ywE3PCmyvFjg6aBYDxhzRMb_I5nRTZQG1CcP343kTh5x9jS6dNaDgM3FLOiZrw&csui=3) opera con un voltaje de **5V DC** y tiene un consumo de corriente de aproximadamente ==**11mA a 30mA**==. Este módulo es ideal para medir la calidad del agua y la turbidez en lavadoras o aguas residuales, funcionando mediante principios ópticos de dispersión de luz. [1](https://www.mercadolibre.com.co/1pcs-tsw-20m-turbidity-sensor-module-dc-5v-11ma-sewage/p/MCO2045432653#:~:text=Compra%20online%20de%20manera%20segura%20con%20Compra,Turbidity%20Sensor%20Module%2C%20Dc%205v%2011ma%20Sewage.), [2](https://www.amazon.es/M%C3%B3dulo-sensor-turbidez-Monitorizaci%C3%B3n-residuales/dp/B09C19BGTH#:~:text=M%C3%B3dulo%20de%20sensor%20de%20turbidez%20%2D%20Monitorizaci%C3%B3n,residuales%20TSW%2D20M%20:%20Amazon.es:%20Bricolaje%20y%20herramientas.), [3](https://translate.google.com/translate?u=https://iconprocon.com/blog-post/turbidity-sensors/&hl=es&sl=en&tl=es&client=sge#:~:text=Los%20sensores%20de%20turbidez%20utilizan,de%20part%C3%ADculas%20en%20la%20soluci%C3%B3n.)
- **Voltaje de trabajo:** 5V DC.
- **Corriente de consumo:** ~11mA - 30mA.
- **Principio:** Detección óptica (dispersión de luz). [1](https://www.mercadolibre.com.co/1pcs-tsw-20m-turbidity-sensor-module-dc-5v-11ma-sewage/p/MCO2045432653#:~:text=Compra%20online%20de%20manera%20segura%20con%20Compra,Turbidity%20Sensor%20Module%2C%20Dc%205v%2011ma%20Sewage.), [2](https://www.ubuy.ec/es/product/F3DAOJEXQ-tsw-20m-turbidity-sensor-module-water-quality-monitoring-sewage-turbidity-value-detection-module-liquid-suspended-particles-sensor-for-turbidity#:~:text=Shop%20M%C3%B3dulo%20de%20Sensor%20de%20Turbidez%20TenNuoDa,at%20a%20best%20price%20in%20Ecuador.%20B09P3V34BN.), [3](https://www.walmart.com.mx/ip/sensor-de-turbidez-monitoreo-de-la-calidad-del-agua-modulo-de-deteccion-de-valor-de-turbidez-de-aguas-residuales-tsw-20m-deteccion-de-turbidez-sensor-de-turbidez/00068255236296#:~:text=Compra%20Sensor%20de%20turbidez%20Monitoreo%20de%20la,a%20domicilio.%20Tu%20tienda%20en%20l%C3%ADnea%20Walmart.), [4](https://www.amazon.es/M%C3%B3dulo-sensor-turbidez-Monitorizaci%C3%B3n-residuales/dp/B09C19BGTH#:~:text=M%C3%B3dulo%20de%20sensor%20de%20turbidez%20%2D%20Monitorizaci%C3%B3n,residuales%20TSW%2D20M%20:%20Amazon.es:%20Bricolaje%20y%20herramientas.), [5](https://translate.google.com/translate?u=https://iconprocon.com/blog-post/turbidity-sensors/&hl=es&sl=en&tl=es&client=sge#:~:text=Los%20sensores%20de%20turbidez%20utilizan,de%20part%C3%ADculas%20en%20la%20soluci%C3%B3n.)

**Especificaciones técnicas clave:**

- **Voltaje de funcionamiento:** 5VCC
- **Corriente de consumo:** Aproximadamente 30mA
- **Aplicaciones:** Control de lavadoras, lavavajillas, monitoreo de calidad de agua y detección de aguas residuales.
- **Salida:** Señal analógica (a mayor turbidez, menor voltaje). [1](https://www.ubuy.com.pr/es/product/F3DAOJEXQ-tsw-20m-turbidity-sensor-module-water-quality-monitoring-sewage-turbidity-value-detection-module-liquid-suspended-particles-sensor-for-turbidity#:~:text=Shop%20M%C3%B3dulo%20de%20sensor%20de%20turbidez%20TSW%2D20M%2C,a%20best%20price%20in%20Puerto%20Rico.%20B09P3V34BN.), [2](https://www.youtube.com/watch?v=Xn0wu_h4qgE&t=119), [3](https://www.amazon.com.mx/turbidez-Monitoreo-calidad-detecci%C3%B3n-residuales/dp/B07X4HZP3V#:~:text=%E3%80%90Ampliamente%20Aplicable%E3%80%91M%C3%B3dulo%20de%20detecci%C3%B3n%20de%20valor%20de,industriales%20y%20recolecci%C3%B3n%20de%20aguas%20residuales%20ambientales.), [4](https://www.amazon.com.mx/Turbidez-Monitoreo-Detecci%C3%B3n-Residuales-Medici%C3%B3n/dp/B0C4PXNXF9#:~:text=CONVERSI%C3%93N%20DE%20SE%C3%91AL%20DE%20CORRIENTE:%20Este%20m%C3%B3dulo,salida%2C%20mayor%20ser%C3%A1%20el%20valor%20de%20turbidez.), [5](https://www.mercadolibre.cl/modulo-sensor-de-turbidez-tsw-20m-1-unidad-5-v-cc-11/p/MLC2053644895#:~:text=Compra%20en%20cuotas%20sin%20inter%C3%A9s%20y%20recibe,Tsw%2D20m%20\(1%20Unidad\)%2C%205%20V%20Cc%2C%2011.)

Este sensor es ideal para medir la turbidez en el rango de \(0\%\) a \(3.5\%\) (NTU) con una tolerancia de (+- 0.5%).

The [TSW-20M](https://www.google.com/search?q=TSW-20M&sca_esv=9506f15c4682863e&biw=1912&bih=914&sxsrf=ANbL-n4bFs6f-O_RiXFeli3yiy2Uz_S4pw%3A1775158573030&ei=LcXOad3DAd-UwbkPxO-f-Qg&oq=datasheet+tsw-20m&gs_lp=Egxnd3Mtd2l6LXNlcnAiEWRhdGFzaGVldCB0c3ctMjBtKgIIADIJEAAYsAMYCBgeMgsQABiABBiwAxiiBDIIEAAYsAMY7wUyCBAAGLADGO8FMggQABiwAxjvBUidB1AAWABwAXgAkAEAmAEAoAEAqgEAuAEByAEAmAIBoAIDmAMAiAYBkAYFkgcBMaAHALIHALgHAMIHAzAuMcgHAoAIAA&sclient=gws-wiz-serp&mstk=AUtExfAKihb5PrSmmX5lEbd8VtpVoo4k9gL2McKUZLgMQwy9RVWe03EbWJ-gwKkMgjstcYOjHfDXfmby4P7i_WYwveCCocMW2UeK_8cjyjaV1osm66bXsghZ_m9doFnb1ElRwR5QZMVlul5DSP_zTRyWFdc_KVJPZBEFklgsnfQdpDU-fd5uMXB0i94V8tnYKqbh4Cs1d7ZPpLln0O0AILuAW4cdO--3MJr3BkX1nrl6dzZZeeO0qxNS2IjU_u0GzpxX66TJi4uQ5I1mHk3PPTmrHfKRQci2phszZShtzhWikvGWKz8F76ojLSTIqLUsZZGhNDzvRKNJvK55_2Msf-NBNQWKXU1Z-no9wo32XWeY6B5_trcygay4y1WbcsJGBYarIW8U2nMuzafvBfDkhwsm9_Jx7ceYkSTDIPnbNiK25QZHs4zHohr5zbAgG25hP3qBFgEEp6_yBp4NVFbVG5XEwNdZUF-CNtiFPT-RmF8HsMFt67ecMQGQbFkU44WJ_MRFsuZ5XwxAPOYsnTPhhdCtSb-gew1jjhdV7158ftZ1qtZxtoiHzM5Hbp8JnbirHH2WA-XsFVOuHE83oARUWw&csui=3&ved=2ahUKEwj8xPeC9c-TAxWwgoQIHf9QJO4QgK4QegQIARAD) is a 5V optical turbidity sensor module designed to measure water clarity (0-4550 NTU) by detecting light scattering, ideal for washing machines, dishwashers, and water quality monitoring. It outputs an analog voltage inversely proportional to turbidity (lower voltage = higher turbidity) and includes a digital threshold output. [1](https://www.amazon.com/Turbidity-Monitoring-Industrial-Compatible-Dishwashers/dp/B0DZL9L2P2#:~:text=About%20this%20Item,Package%20List:%20*%20Turbidity%20Sensor%20Module), [2](https://electronicarych.com/shop/md-tsw-20m-md-tsw-20m-modulo-sensor-de-turbidez-tsw-20m-13633#:~:text=Especificaci%C3%B3n%20%EF%BC%9A,C%2C%2035%2D95%25%20RH), [3](https://manuals.plus/asin/B0DZL9L2P2.pdf), [4](https://www.ubuy.is/en/product/F3DAOJEXQ-tsw-20m-turbidity-sensor-module-water-quality-monitoring-sewage-turbidity-value-detection-module-liquid-suspended-particles-sensor-for-turbidity)

**Key Specifications:**

- **Operating Voltage:** DC 5V
- **Working Current:** 11mA
- **Detection Range:** 0%~3.5% (0–4550 NTU)
- **Operating Temperature:** 30–70°C
- **Output Type:** Analog (\(V_{out}\)) and Digital (high/low level)
- **Dimensions:** Approx 16g, designed for partial submersion (transparent part only) [1](https://www.microscale.net/products/turbidity-sensor#:~:text=Description,the%20sensor%20will%20be%20damaged.), [2](https://www.ubuy.com.bd/en/product/2P8P0SRS-turbidity-sensor-module-water-quality-monitoring-sewage-turbidity-meter-value-detection-module-tsw-2#:~:text=It%20features%20four%20wiring%20terminals,water%20quality%20for%20your%20laundry!.), [3](https://www.amazon.com/Turbidity-Monitoring-Industrial-Compatible-Dishwashers/dp/B0DZL9L2P2#:~:text=About%20this%20Item,Package%20List:%20*%20Turbidity%20Sensor%20Module), [4](https://electronicarych.com/shop/md-tsw-20m-md-tsw-20m-modulo-sensor-de-turbidez-tsw-20m-13633#:~:text=Especificaci%C3%B3n%20%EF%BC%9A,C%2C%2035%2D95%25%20RH)

**Wiring:**

- **V:** DC +5V
- **G:** GND
- **A:** Analog Signal Output
- **D:** Digital (Level) Signal Output [1](https://electronicarych.com/shop/md-tsw-20m-md-tsw-20m-modulo-sensor-de-turbidez-tsw-20m-13633#:~:text=Especificaci%C3%B3n%20%EF%BC%9A,C%2C%2035%2D95%25%20RH), [2](https://www.amazon.com.be/-/en/TSW-20M-Turbidity-Detection-Wastewater-Monitoring/dp/B07V2Q7SLW#:~:text=waste%20water%20collection.-,Specifications:%20Model:%20TSW%2D20M%20Operating%20voltage:%20DC%205V,1%20x%20Turbidity%20Sensor%20Module)

**Important Notes:**

- Only the transparent probe section is waterproof; do not submerge the entire sensor module.
- The analog signal needs calibration for precise NTU measurements.
- Reverse polarity will damage the sensor. [1](https://www.ubuy.gy/productuk/1BP4MEAK8-turbidity-sensor-module-water#:~:text=Question:%20Is%20the%20sensor%20fully%20waterproof?%20Answer:,sensor%20can%20be%20placed%20in%20the%20water.), [2](https://www.microscale.net/products/turbidity-sensor#:~:text=Description,the%20sensor%20will%20be%20damaged.), [3](https://manuals.plus/asin/B0DZL9L2P2.pdf)
## Temperatura:
El módulo MAX31865 para sensores RTD (PT100/PT1000) destaca por su **bajo consumo de energía**. Funciona con un voltaje de entrada de 3.3V o 5V y, aunque el chip principal tiene un consumo muy bajo (del orden de microamperios en reposo), la placa integrada suele incluir regulador y LEDs que operan en rangos típicos de miliamperios. [1](https://www.compelelectronica.com/productos/max31865-modulo-convertidor-de-termopar-a-digital), [2](https://mcielectronics.cl/shop/product/transmisor-max31865-pt100/)

**Detalles técnicos del consumo:**

- **Voltaje de Operación:** 3.3V o 5V (compatible con lógica de 5V).
- **Eficiencia:** Diseñado para aplicaciones de bajo consumo.
- **Componentes adicionales:** El regulador de voltaje a 3.3V y los LEDs indicadores en la placa pueden aumentar ligeramente el consumo total por encima de las especificaciones puras del chip MAX31865. [1](https://es.aliexpress.com/i/1005006704199704.html#:~:text=1/13-,1%20~%2010%20unidades%20MAX31865%20PT100%20~%20PT1000%20placa%20convertidora%20RTD%20a,3%20V/5V%20para%20Arduino&text=Empresa%20de%20mensajer%C3%ADa:%20Ecoscooting%20Correos%20%2Cetc.&text=Pagos%20seguros:%20No%20compartiremos%20tus,mantenemos%20tus%20datos%20personales%20seguros.), [2](https://www.compelelectronica.com/productos/max31865-modulo-convertidor-de-termopar-a-digital), [3](https://mcielectronics.cl/shop/product/transmisor-max31865-pt100/) [1](https://www.ubuy.com.bo/es/product/JF61U0N4W-max31865-pt100-to-pt1000-rtd-to-digital-converter-board-3-3v-5v-temperature-thermocouple-sensor-amplifier-module-for-arduino-with-50-to-200-0-5m#:~:text=Ideal%20para%20aficionados%20que%20buscan%20integrar%20la,en%20sus%20proyectos%20Arduino%20con%20alta%20precisi%C3%B3n.), [2](https://www.compelelectronica.com/productos/max31865-modulo-convertidor-de-termopar-a-digital)

El módulo MAX31865 para sensores RTD (PT100/PT1000) destaca por su ==**bajo consumo de energía**==. Funciona con un voltaje de entrada de 3.3V o 5V y, aunque el chip principal tiene un consumo muy bajo (del orden de microamperios en reposo), la placa integrada suele incluir regulador y LEDs que operan en rangos típicos de miliamperios. [1](https://www.compelelectronica.com/productos/max31865-modulo-convertidor-de-termopar-a-digital), [2](https://mcielectronics.cl/shop/product/transmisor-max31865-pt100/)

**Detalles técnicos del consumo:**

- **Voltaje de Operación:** 3.3V o 5V (compatible con lógica de 5V).
- **Eficiencia:** Diseñado para aplicaciones de bajo consumo.
- **Componentes adicionales:** El regulador de voltaje a 3.3V y los LEDs indicadores en la placa pueden aumentar ligeramente el consumo total por encima de las especificaciones puras del chip MAX31865. [1](https://es.aliexpress.com/i/1005006704199704.html#:~:text=1/13-,1%20~%2010%20unidades%20MAX31865%20PT100%20~%20PT1000%20placa%20convertidora%20RTD%20a,3%20V/5V%20para%20Arduino&text=Empresa%20de%20mensajer%C3%ADa:%20Ecoscooting%20Correos%20%2Cetc.&text=Pagos%20seguros:%20No%20compartiremos%20tus,mantenemos%20tus%20datos%20personales%20seguros.), [2](https://www.compelelectronica.com/productos/max31865-modulo-convertidor-de-termopar-a-digital), [3](https://mcielectronics.cl/shop/product/transmisor-max31865-pt100/)

Para mediciones precisas y de bajo consumo en sistemas [Arduino](https://www.google.com/search?sca_esv=9506f15c4682863e&sxsrf=ANbL-n7vqSV7WYZMc0HDh3FrQyuaXNAxsg%3A1775157521808&q=Arduino&source=lnms&fbs=ADc_l-bpk8W4E-qsVlOvbGJcDwpn60DczFdcvPnuv8WQohHLTaMb_WtLz8zQ41bNqiqMK_04Ozv42qQXGXRTVAFht9zrPUQ1F0RxA6xz96656LnPnIMZ76HC8ZlmSsHvDT7l1oyPFJdte18nLZp03lHFswFRe2EE2OaH5kX_znVXIKv2CkK1UGpnlRDKF7G3-Gx_UnFmdEofbUCtYNTdAXNiywVjaV_KNVePdHVEsvdjF3-E_GXyAso&sa=X&ved=2ahUKEwiavMKO8c-TAxXyTTABHf7PIggQgK4QegQIBBAB&biw=1912&bih=914&dpr=1&mstk=AUtExfA-e2StbXc7htK3Db87LeJC15sP4BUCm9FAsSx1Hw697RHn1QR5tf24izdAadTV6_JwX-8Av0NB_fnDJLvCtdBnZP0oa5qkOF_HraWDC3z1e8vjTwHAsGCPa6BNdmRiT0sLEoLyBBi08e4XZuJq11N7Uz_tPDNEwVnuvVUG734eQ3QyjYBh2i-W5E3H4cjtfxljO_h8ZpUXzHkB4oikVfV_TEAbgziR6synV8KTzStHBgilJH3c0YZdzDZPHkrKUKbSLjIcVH0GOunP1YTukKO64Jnsu3giw2zZcWq5koCvmJ8WRdBeQ9p7cyNJm1Hx1-l--4r0-xeBSZKiuTbnatf1J3MpjkkTTqdcXf3DVlCJXN6W3ksGCoJzU8Pu2DXNWHXGLDfDU79tlIriUSM1wE_Uj4srvo6kSV8VjT5O-3MnDxKL63h2ecvDtbz9Ksie6QokKXzeQRuY82ISRcv_WQ&csui=3), es ideal debido a su diseño compacto y robusto. [1](https://www.ubuy.com.bo/es/product/JF61U0N4W-max31865-pt100-to-pt1000-rtd-to-digital-converter-board-3-3v-5v-temperature-thermocouple-sensor-amplifier-module-for-arduino-with-50-to-200-0-5m#:~:text=Ideal%20para%20aficionados%20que%20buscan%20integrar%20la,en%20sus%20proyectos%20Arduino%20con%20alta%20precisi%C3%B3n.), [2](https://www.compelelectronica.com/productos/max31865-modulo-convertidor-de-termopar-a-digital)
## pH:
El módulo sensor de pH PH-4502C funciona con 5Vcc y tiene un consumo de corriente bajo, típicamente ==entre **5 y 10 mA**==. Es compatible con plataformas como Arduino, ESP32 y Raspberry Pi, diseñado para monitorear acidez o alcalinidad en líquidos con sondas BNC estándar. [1](https://www.facebook.com/electroamazingsac/posts/%F0%9D%90%8C%F0%9D%90%8E%F0%9D%90%83%F0%9D%90%94%F0%9D%90%8B%F0%9D%90%8E-%F0%9D%90%92%F0%9D%90%84%F0%9D%90%8D%F0%9D%90%92%F0%9D%90%8E%F0%9D%90%91-%F0%9D%90%83%F0%9D%90%84-%F0%9D%90%8F%F0%9D%90%87-%F0%9D%90%80%F0%9D%90%8D%F0%9D%90%80%F0%9D%90%8B%F0%9D%90%8E%F0%9D%90%86-%F0%9D%90%8F%F0%9D%90%87-%F0%9D%9F%92%F0%9D%9F%93%F0%9D%9F%8E%F0%9D%9F%90%F0%9D%90%82-%F0%9D%90%92%F0%9D%90%8E%F0%9D%90%8D%F0%9D%90%83%F0%9D%90%80el-m%C3%B3dulo-ph-4502c-sensor-de-ph-es-un-d/801052992234993/#:~:text=MODULO%20SENSOR%20DE%20PH%20ANALOG%20PH%2D4502C%20+,corriente:%205%20a%2010%20MA%20%2D%20Temperatura), [2](https://nanoparuro.com/shop/ph-4502c-ph-4502c-sensor-de-ph-con-sonda-para-arduino-1193#:~:text=M%C3%B3dulo%20medidor%20de%20pH%20PH%2D4502C%20con%20sonda,Compatible%20con%20Arduino%2C%20ESP32%20y%20Raspberry%20Pi.)
**Características clave del consumo y alimentación:**
- **Voltaje de Operación:** 5 Vcc.
- **Consumo de Corriente:** 5-10 mA.
- **Salida:** Analógica (voltaje) y digital (umbral ajustable).
- **Componentes:** Incluye conector BNC para sonda E201 y potenciómetro de calibración. [1](https://www.youtube.com/watch?v=PvjpaiyFHsA&t=16), [2](https://www.youtube.com/watch?v=5Zoln0ZJTjI&t=100), [3](https://ssdielect.com/arduino-y-compatibles-1/885-ph-4502c.html#:~:text=MODULO%20SENSOR%20PARA%20MEDIR%20PH%20PH%2D4502C%20ANALOGO,de%20operaci%C3%B3n:%20%2D10%2D50%C2%BAC%20Tiempo%20de%20respuesta:%205S), [4](https://www.geekfactory.mx/producto/ph-4502c-kit-sensor-de-ph-economico/#:~:text=Caracter%C3%ADsticas%20de%20PH%2D4502C%20Kit%20sensor%20de%20pH,20%20mm%20Tiempo%20de%20respuesta:%20%E2%89%A4%201min), [5](https://www.facebook.com/electroamazingsac/posts/%F0%9D%90%8C%F0%9D%90%8E%F0%9D%90%83%F0%9D%90%94%F0%9D%90%8B%F0%9D%90%8E-%F0%9D%90%92%F0%9D%90%84%F0%9D%90%8D%F0%9D%90%92%F0%9D%90%8E%F0%9D%90%91-%F0%9D%90%83%F0%9D%90%84-%F0%9D%90%8F%F0%9D%90%87-%F0%9D%90%80%F0%9D%90%8D%F0%9D%90%80%F0%9D%90%8B%F0%9D%90%8E%F0%9D%90%86-%F0%9D%90%8F%F0%9D%90%87-%F0%9D%9F%92%F0%9D%9F%93%F0%9D%9F%8E%F0%9D%9F%90%F0%9D%90%82-%F0%9D%90%92%F0%9D%90%8E%F0%9D%90%8D%F0%9D%90%83%F0%9D%90%80el-m%C3%B3dulo-ph-4502c-sensor-de-ph-es-un-d/801052992234993/#:~:text=MODULO%20SENSOR%20DE%20PH%20ANALOG%20PH%2D4502C%20+,corriente:%205%20a%2010%20MA%20%2D%20Temperatura)
Para asegurar mediciones precisas, es recomendable calibrar el módulo antes de cada uso o periódicamente. [1](https://www.growbarato.net/blog/como-calibrar-medidor-ph/#:~:text=Es%20aconsejable%20calibrar%20el%20medidor,que%20puede%20afectar%20al%20funcionamiento.)

## Data

| Datos                    | PH-4502C           | TSW-20M                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | MAX31865                    |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Voltaje de operación     | 5V                 | 5V                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 3.3V o 5V                   |
| Corriente                | 5 - 10 mA          | ~11mA - 30mA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 0.5 - 1 mA                  |
| Rango de detección       | 0 - 14             | 0 – 1000 NTU o 0 – 4550 NTU                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | -200°C a +850°C             |
| Temperatura de operación | -10 - 50°C         | -30 °C ~ 80 °C (o -30°C~70°C)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | -100 °C y +100 °C           |
| Tiempo de respuesta      | 5 s                | 5 s                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | menos de 60-70 milisegundos |
| Tiempo de estabilización | 60 s               | N/A                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | N/A                         |
| Consumo de potencia      | 0.5 W              | 0.055 W                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | - 1 mW                      |
| Humedad                  | 95% (Nominal: 65%) | N/A                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | N/A                         |
| Salida de voltaje        | Analogico          | Una **[salida analógica](https://www.google.com/search?q=salida+anal%C3%B3gica&sca_esv=9506f15c4682863e&biw=1912&bih=914&sxsrf=ANbL-n6wVublxhfG2Lcka1wc1Cp-SG8UMw%3A1775158415974&ei=j8TOafSbO_6KwbkPvtmiqQ4&ved=2ahUKEwjiobW99M-TAxUYRDABHeyAFEMQgK4QegQIARAD&uact=5&oq=salida+del+TSW-20M&gs_lp=Egxnd3Mtd2l6LXNlcnAiEnNhbGlkYSBkZWwgVFNXLTIwTTIIECEYoAEYwwQyCBAhGKABGMMEMggQIRigARjDBEjNEVD-CljfDnACeACQAQCYAbgBoAGWB6oBAzAuNrgBA8gBAPgBAZgCBKACpQLCAgsQABiABBiwAxiiBMICCBAAGLADGO8FmAMAiAYBkAYFkgcDMi4yoAefEbIHAzAuMrgHnwLCBwUwLjMuMcgHCoAIAA&sclient=gws-wiz-serp&mstk=AUtExfCe9HtHFRIiPdEIMtzCxU684TaVXiro1W7ubBy2Zw0k_T57MMRoBdFHhdOT37qGxEnjpEEEG0ufrHIWtIOVYDdkNYkI0WpAsAJqfBenA03k9K0RepmorZnf9wVr3XR7ut2Wob8eQrI7j2Ne1gPOskQoqSc1wcqinwLpY-beX_2yuBvJAbPU6nz64wJr2HKsAn8aBfCUFNEhecWuvkubXbFMc0bPlBiJu4MUTOLH1WQR6xNSS1b5I1w_o-nmC1DBGrqYbFtd7mU9kcVqWrbFimbXDfRlInU8TUWBL9tI34qMRUzP-hKSkKhyDBkzPXQJx2-KNOIL2PX8Sd86G5GTyq2B_nXDzFghIOsyV6vFZEFuzqNnLCpHH5Fv2VxIO9thUM0r7W5hJYtaayRPVoT2SazcFIP8K0gkGyv5tpe81b4kQCgv8SsL4lbvvqa4JPzGGcVGE6_2sYPK6vudjoR7-nlMbofzYpeHlrzVo9iDjug80MMVdk4uLvk_AKV278ACWYlmvRgPMc7kwOngeqTeF7ocY_reazF6ujZn8Ck81hpZObrpXjJ7ayUosYt-B6Db__dea07Bpan9qzHxjg&csui=3)** (A) que entrega un voltaje de 0V a 4.5V (a menor voltaje, mayor turbidez) y una **[salida digital](https://www.google.com/search?q=salida+digital&sca_esv=9506f15c4682863e&biw=1912&bih=914&sxsrf=ANbL-n6wVublxhfG2Lcka1wc1Cp-SG8UMw%3A1775158415974&ei=j8TOafSbO_6KwbkPvtmiqQ4&ved=2ahUKEwjiobW99M-TAxUYRDABHeyAFEMQgK4QegQIARAE&uact=5&oq=salida+del+TSW-20M&gs_lp=Egxnd3Mtd2l6LXNlcnAiEnNhbGlkYSBkZWwgVFNXLTIwTTIIECEYoAEYwwQyCBAhGKABGMMEMggQIRigARjDBEjNEVD-CljfDnACeACQAQCYAbgBoAGWB6oBAzAuNrgBA8gBAPgBAZgCBKACpQLCAgsQABiABBiwAxiiBMICCBAAGLADGO8FmAMAiAYBkAYFkgcDMi4yoAefEbIHAzAuMrgHnwLCBwUwLjMuMcgHCoAIAA&sclient=gws-wiz-serp&mstk=AUtExfCe9HtHFRIiPdEIMtzCxU684TaVXiro1W7ubBy2Zw0k_T57MMRoBdFHhdOT37qGxEnjpEEEG0ufrHIWtIOVYDdkNYkI0WpAsAJqfBenA03k9K0RepmorZnf9wVr3XR7ut2Wob8eQrI7j2Ne1gPOskQoqSc1wcqinwLpY-beX_2yuBvJAbPU6nz64wJr2HKsAn8aBfCUFNEhecWuvkubXbFMc0bPlBiJu4MUTOLH1WQR6xNSS1b5I1w_o-nmC1DBGrqYbFtd7mU9kcVqWrbFimbXDfRlInU8TUWBL9tI34qMRUzP-hKSkKhyDBkzPXQJx2-KNOIL2PX8Sd86G5GTyq2B_nXDzFghIOsyV6vFZEFuzqNnLCpHH5Fv2VxIO9thUM0r7W5hJYtaayRPVoT2SazcFIP8K0gkGyv5tpe81b4kQCgv8SsL4lbvvqa4JPzGGcVGE6_2sYPK6vudjoR7-nlMbofzYpeHlrzVo9iDjug80MMVdk4uLvk_AKV278ACWYlmvRgPMc7kwOngeqTeF7ocY_reazF6ujZn8Ck81hpZObrpXjJ7ayUosYt-B6Db__dea07Bpan9qzHxjg&csui=3)** (D) de nivel | RTD-a-Digital               |


- [x] Identificar señal y alimentación de cada **ESC APISQUEEN**

#### **Detalles de Alimentación y Señal (U01 con 45A ESC):**
- **Alimentación Principal:** 12V a 16V DC (Compatible con baterías LiPo 2S-6S).
- **ESC:** 45A Bidireccional (soporta giro adelante/atrás).
- **Señal de Control:** Cable de silicona de par trenzado (reduce interferencia).
- **Protocolos Soportados:**
    - **PWM:** Normal (ancho de pulso 1-2 ms).
    - **Oneshot / Multishot:** Soportado.
    - **Dshot:** Digital (Dshot150, Dshot300, Dshot600).
- **Detección:** El ESC detecta automáticamente la señal del acelerador al encenderse.
- **Componentes necesarios:** Se requiere por separado una batería, receptor, control remoto y un BEC o UBEC para alimentar el receptor. [1](https://www.mercadolibre.com.mx/propulsor-subacuatico-apisqueen-u01-con-45a-esc/up/MLMU2833680628#:~:text=Descripci%C3%B3n.%201.%20Este%20enlace%20solo%20contiene%20un,UBEC%2C%20control%20remoto%2C%20receptor%20y%20bater%C3%ADas%20por), [2](https://es.aliexpress.com/i/1005005400135393.html#:~:text=Modelo:%20U2%20mini%20Voltaje:%2012%2D16V%20\(3%2D4S%20LiPo\),en%20agua%20de%20mar%20y%20agua%20dulce.), [3](https://es.aliexpress.com/item/1005006684091065.html), [4](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov#:~:text=El%20cable%20de%20se%C3%B1al%20es%20un%20cable,no%20resistente%20al%20agua%20\(voltaje:%20Lipo%202%2D6S\):), [5](https://www.mercadolibre.com.mx/apisqueen-helice-submarina-u01-con-45a-esc-bidireccional-12v/up/MLMU702297332)

- [x] ==Identificar si los ESC se alimentan directamente desde la batería o desde rama separada==
Los Propulsores se conectan al **45A ESC**, del ESC van a un conector que tiene de varias conexiones (3) que se unifican para conectar la bateria. A ese conector se le conecta el modulo de poder y que controla a traves del RF los propulsores. 
Diria que los ESC no se alimentan directamente porque no se de que otro modo o rama separada conectarlo
El propulsor submarino APISQUEEN U01 opera con un voltaje de \(12\text{V}-24\text{V}\) (\(3\text{S}-6\text{S}\) LiPo), alcanzando una corriente máxima de \(17\text{A}\) y una potencia máxima de \(390\text{W}\). Incluye un ESC bidireccional de \(45\text{A}\) que acepta señales PWM estándar (1-2ms), Oneshot, Multishot y señales digitales Dshot150/300/600. [1](https://es.aliexpress.com/item/1005006684091065.html), [2](https://www.mercadolibre.com.mx/propulsor-subacuatico-apisqueen-u01-con-45a-esc/up/MLMU2833680628), [3](https://es.aliexpress.com/item/1005006335233745.html#:~:text=ApisQueen%2012V%20~%2024V%20U1%20propulsor%20submarino,178%20g%20Longitud%20del%20cable:%20330%20mm.), [4](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov#:~:text=El%20cable%20de%20se%C3%B1al%20es%20un%20cable,no%20resistente%20al%20agua%20\(voltaje:%20Lipo%202%2D6S\):)

**Detalles Técnicos Principales:**

- **Corriente Máxima:** \(17\text{A}\).
- **Voltaje:** \(12\text{V}-24\text{V}\) (Recomendado \(16\text{V}\) o \(4\text{S}\) Lipo para máximo rendimiento).
- **Potencia Máxima:** \(390\text{W}\).
- **Señal de Control:** PWM (estándar), Oneshot, Multishot, Dshot600.
- **ESC:** \(45\text{A}\) bidireccional incluido.
- **Empuje:** Hasta \(2\text{kg}\). [1](https://www.amazon.com.mx/ApisQueen-U01-Propulsor-bidireccional-escobillas/dp/B0CJWSJY4K#:~:text=ApisQueen%20U01%20%2D%20Propulsor%20submarino%20con%20ESC,ROV%20\(CW\)%20:%20Amazon.com.mx:%20Juguetes%20y%20Juegos.), [2](https://es.aliexpress.com/item/1005006684091065.html), [3](https://www.mercadolibre.com.mx/propulsor-subacuatico-apisqueen-u01-con-45a-esc/up/MLMU2833680628), [4](https://es.aliexpress.com/item/1005006335233745.html#:~:text=ApisQueen%2012V%20~%2024V%20U1%20propulsor%20submarino,178%20g%20Longitud%20del%20cable:%20330%20mm.), [5](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov#:~:text=El%20cable%20de%20se%C3%B1al%20es%20un%20cable,no%20resistente%20al%20agua%20\(voltaje:%20Lipo%202%2D6S\):)

El ESC del U01 detecta automáticamente la señal del acelerador al encenderse. Está diseñado para ROVs y barcos teledirigidos. [1](https://www.amazon.es/ApisQueen-propulsor-submarino-U1-escobillas/dp/B0D9PZ47N5#:~:text=ApisQueen%20Juego%20de%20propulsor%20submarino%20U1%20de,barcos%20ROVs%20:%20Amazon.es:%20Juguetes%20y%20juegos.), [2](https://es.aliexpress.com/item/1005006684091065.html), [3](https://es.aliexpress.com/item/1005006335233745.html#:~:text=ApisQueen%2012V%20~%2024V%20U1%20propulsor%20submarino,178%20g%20Longitud%20del%20cable:%20330%20mm.)

- [x] Identificar si algún módulo necesita **5V**, **12V** o tensión especial
Todos los modulos han manejado desde los 1.8 a los 12 V. 

- [x] Anotar todo en una tabla simple: **módulo / voltaje / corriente / observación**


| Modulo                                | #   | Voltaje     | Corriente       | Watts                                    |
| ------------------------------------- | --- | ----------- | --------------- | ---------------------------------------- |
| Turbidez (TSW-20M)                    | 1   | 5V          | ~11mA - 30mA    | 0.055 W                                  |
| Temperatura (PT100 + MAX31865)        | 1   | 3.3V        | 0.5 - 1 mA      | -0.01 W                                  |
| pH (ph-4502C)                         | 1   | 5V          | 5 - 10 mA       | 0.5 W                                    |
| Huawei E3372H-153                     | 1   | 5V          | 500mA           | <3.5W                                    |
| Jetson TK1                            | 1   | 12V         | 5A              | 60W                                      |
| U01 UnderWater Thruster set APISQUEEN | 2   | 12-16 V     | 17A (ESC = 45A) | 390 W                                    |
| Ra-02 433Mhz                          | 2   | 1.8 - 3.3 V | 20 - 120 mA     | 100 mW (0.1 vatios)                      |
| ESP32-S3                              | 2   | 3.3 - 5 V   | 180 - 240 mA    | ∼0.6 - 0.8 W (a 3.3V). ∼1 - 1.2 W (a 5V) |
| Kinect V1                             | 1   | 12V         | 0.45 - 1.08 A   | 5.4 -12 W                                |
| A300 RF                               | 1   | 4V - 9V DC  | 90 mA           | 0.36W y 0.81W                            |
| BNO080 (IMU)                          | 1   | 3.3V        | 10-15 mA        | -0.1W                                    |

---
## Observaciones:

El BNO080 es un ==sensor [IMU (Unidad de Medición Inercial)](https://www.google.com/search?q=IMU+%28Unidad+de+Medici%C3%B3n+Inercial%29&sca_esv=216a8bf4ffb3c00e&biw=950&bih=913&sxsrf=ANbL-n4EKH1zPLOvXNqTmYVop7Usi6wGng%3A1775172806912&ei=xvzOabKyN52EwbkPy7yvoAc&ved=2ahUKEwjejJior9CTAxVZjLAFHSW4DzYQgK4QegQIARAC&uact=5&oq=especificaciones+del+BNO080&gs_lp=Egxnd3Mtd2l6LXNlcnAiG2VzcGVjaWZpY2FjaW9uZXMgZGVsIEJOTzA4MDIFECEYoAEyBRAhGKABSOU5UM4IWJQ4cAp4AJABAZgBxQagAYgvqgEMMC4zMS40LTEuMC4yuAEDyAEA-AEBmAIqoALSJ8ICCBAAGLADGO8FwgILEAAYgAQYsAMYogTCAgoQIxiABBgnGIoFwgIEECMYJ8ICDhAuGIAEGLEDGNEDGMcBwgILEAAYgAQYsQMYgwHCAggQABiABBixA8ICBRAAGIAEwgIQECMY8AUYgAQYJxjJAhiKBcICChAjGPAFGCcYyQLCAgoQABiABBhDGIoFwgIIEC4YgAQYsQPCAgsQLhiABBjHARivAcICBRAuGIAEwgIHECMY8AUYJ8ICDhAAGIAEGLEDGIMBGIoFwgILEC4YgAQYsQMYigXCAg0QABiABBixAxhDGIoFwgIJEAAYgAQYChgLwgIGEAAYAxgKwgIKEAAYgAQYsQMYDcICBxAAGIAEGA3CAgYQABgWGB7CAggQABgWGAoYHsICBRAAGO8FwgIIEAAYgAQYogTCAggQABiiBBiJBZgDAIgGAZAGBZIHCzEwLjMwLjEuNi0xoAeh7wGyBwowLjMwLjEuNi0xuAefJ8IHCTAuMTEuMjguM8gHswGACAA&sclient=gws-wiz-serp&mstk=AUtExfASJeI5eu8mkDjH8_k-2fQtR7oUpEsvHKXnRto2qCQRpOU4fIdkJtI0B7mRdUMVjdg97hl5ESRvg-CPmTosQixVs5bZHwHPsKIddASmCZOjffXnf-Y_-IK6rd5ixjwrMuw-E_JKS8aOY5rcKpyEiO90uyeQSOPHpNYLk6I99t7Cu-pjZRcoGat73TgLb_w82Hopk8kknUQ5gw4qLyA1A49nallyiYwgX3yubSEdShIrQoIBx9cLkH8gHowfTHsDrEXMi35fXtznsGcMbu49R_DEg9h4qAL6mBtG_aQFxTsoaQ&csui=3) de 9 ejes, ideal para AR/VR y robótica, que integra [acelerómetro](https://www.google.com/search?q=aceler%C3%B3metro&sca_esv=216a8bf4ffb3c00e&biw=950&bih=913&sxsrf=ANbL-n4EKH1zPLOvXNqTmYVop7Usi6wGng%3A1775172806912&ei=xvzOabKyN52EwbkPy7yvoAc&ved=2ahUKEwjejJior9CTAxVZjLAFHSW4DzYQgK4QegQIARAD&uact=5&oq=especificaciones+del+BNO080&gs_lp=Egxnd3Mtd2l6LXNlcnAiG2VzcGVjaWZpY2FjaW9uZXMgZGVsIEJOTzA4MDIFECEYoAEyBRAhGKABSOU5UM4IWJQ4cAp4AJABAZgBxQagAYgvqgEMMC4zMS40LTEuMC4yuAEDyAEA-AEBmAIqoALSJ8ICCBAAGLADGO8FwgILEAAYgAQYsAMYogTCAgoQIxiABBgnGIoFwgIEECMYJ8ICDhAuGIAEGLEDGNEDGMcBwgILEAAYgAQYsQMYgwHCAggQABiABBixA8ICBRAAGIAEwgIQECMY8AUYgAQYJxjJAhiKBcICChAjGPAFGCcYyQLCAgoQABiABBhDGIoFwgIIEC4YgAQYsQPCAgsQLhiABBjHARivAcICBRAuGIAEwgIHECMY8AUYJ8ICDhAAGIAEGLEDGIMBGIoFwgILEC4YgAQYsQMYigXCAg0QABiABBixAxhDGIoFwgIJEAAYgAQYChgLwgIGEAAYAxgKwgIKEAAYgAQYsQMYDcICBxAAGIAEGA3CAgYQABgWGB7CAggQABgWGAoYHsICBRAAGO8FwgIIEAAYgAQYogTCAggQABiiBBiJBZgDAIgGAZAGBZIHCzEwLjMwLjEuNi0xoAeh7wGyBwowLjMwLjEuNi0xuAefJ8IHCTAuMTEuMjguM8gHswGACAA&sclient=gws-wiz-serp&mstk=AUtExfASJeI5eu8mkDjH8_k-2fQtR7oUpEsvHKXnRto2qCQRpOU4fIdkJtI0B7mRdUMVjdg97hl5ESRvg-CPmTosQixVs5bZHwHPsKIddASmCZOjffXnf-Y_-IK6rd5ixjwrMuw-E_JKS8aOY5rcKpyEiO90uyeQSOPHpNYLk6I99t7Cu-pjZRcoGat73TgLb_w82Hopk8kknUQ5gw4qLyA1A49nallyiYwgX3yubSEdShIrQoIBx9cLkH8gHowfTHsDrEXMi35fXtznsGcMbu49R_DEg9h4qAL6mBtG_aQFxTsoaQ&csui=3), giroscopio y magnetómetro con un ARM Cortex M0+ para procesar datos de movimiento. Ofrece orientación 3D precisa en tiempo real, con un tamaño compacto (3.8mm x 5.2mm x 1.1mm) y bajo consumo de energía==. [1](https://www.mercadolibre.com.co/2-piezas-gy-bno080-bno085-bno086-ar-vr-imu-de-alta-precisio/p/MCO2040111090), [2](https://cdn.sparkfun.com/assets/1/3/4/5/9/BNO080_Datasheet_v1.3.pdf), [3](https://www.ubuy.com.bo/es/product/N2TVHWBZS-gy-bno080-bno085-ar-vr-imu-high-accuracy-nine-axis-9dof-ahrs-sensor-module-new-for-arrival-2025-high-for-quality#:~:text=Respuesta:%20El%20m%C3%B3dulo%20sensor%20GY%2DBNO080%20BNO085%20proporciona,como%20la%20rob%C3%B3tica%20y%20los%20juegos%20AR/VR.), [4](https://www.amazon.com/-/es/Buying-aceler%C3%B3metro-precisi%C3%B3n-giroscopio-magnet%C3%B3metro/dp/B0CDGZMLPP), [5](https://www.didacticaselectronicas.com/shop/sen-14686-vr-imu-bno080-qwiic-16326)

**Especificaciones Principales del BNO080:**

- **Tipo de sensor:** Paquete de nivel de sistema (SiP) de 9 ejes (Acelerómetro + Giroscopio + Magnetómetro).
- **Microcontrolador:** ARM Cortex M0+ integrado de 32 bits.
- **Voltaje de Operación:** 3.3V.
- **Salidas:** Orientación (cuaterniones, Euler), aceleración calibrada, velocidad angular, vector de rotación.
- **Aplicaciones:** Realidad Virtual (VR), Realidad Aumentada (AR), Robótica, IoT.
- **Compatibilidad:** Android, apto para sistemas que requieren baja latencia. [1](https://www.amazon.com/-/es/Buying-aceler%C3%B3metro-precisi%C3%B3n-giroscopio-magnet%C3%B3metro/dp/B0CDGZMLPP), [2](https://www.didacticaselectronicas.com/shop/sen-14686-vr-imu-bno080-qwiic-16326), [3](https://es.aliexpress.com/item/1005006481537958.html#:~:text=*%20Voltaje%20de%20Alimentaci%C3%B3n3.3V.%20*%20TipoREGULADOR%20DE%20VOLTAJE.%20*%20Nombre%20de%20la%20marcaBMHM.), [4](https://cdn.sparkfun.com/assets/1/3/4/5/9/BNO080_Datasheet_v1.3.pdf), [5](https://www.mercadolibre.com.co/2-piezas-gy-bno080-bno085-bno086-ar-vr-imu-de-alta-precisio/p/MCO2040111090)

**Características del Módulo (GY-BNO080 / SparkFun):**

- **Interfaz:** Generalmente I2C, SPI o UART, a menudo disponible con conector Qwiic para fácil conexión.
- **Formato:** Módulo pequeño (LGA) con 28 pines.
- **Precisión:** Alta, optimizado para seguimiento de movimiento 3D. [1](https://tienda.bricogeek.com/descatalogado/1112-sparkfun-vr-imu-bno080-qwiic.html), [2](https://www.didacticaselectronicas.com/shop/sen-14686-vr-imu-bno080-qwiic-16326), [3](https://cdn.sparkfun.com/assets/1/3/4/5/9/BNO080_Datasheet_v1.3.pdf)

---

El ESP32 es un microcontrolador de 32 bits, potente y de bajo costo, ideal para IoT. Destaca por su ==doble núcleo a 240 MHz, conectividad Wi-Fi y Bluetooth (clásico + BLE) integrados, 520 KB SRAM, y abundantes periféricos (ADC, DAC, PWM, I2C, SPI)==. Funciona a 3.3V, consumiendo muy poca energía, lo que lo hace perfecto para proyectos inteligentes inalámbricos. [1](https://pasionelectronica.com/esp32-caracteristicas-y-pines/), [2](https://www.sigmaelectronica.net/producto/esp-32/), [3](https://www.luisllamas.es/esp32-detalles-hardware-pinout/), [4](https://www.sigmaelectronica.net/producto/esp32-wroom-32d/), [5](https://programarfacil.com/esp8266/esp32/#:~:text=ESP32%20es%20una%20familia%20de%20microcontroladores%20de,sobre%20esta%20plataforma%20y%20la%20informaci%C3%B3n%20dispersa)

**Características Principales del ESP32**

- **Procesador:** Tensilica Xtensa Dual-Core 32-bit LX6, operando hasta 240 MHz, con un rendimiento de hasta 600 DMIPS.
- **Conectividad Inalámbrica:**
    - **Wi-Fi:** 802.11 b/g/n (hasta 150 Mbps).
    - **Bluetooth:** Versión 4.2 BR/EDR y Bluetooth Low Energy (BLE).
- **Memoria:**
    - **SRAM:** 520 KB.
    - **ROM:** 448 KB.
    - **Flash:** Generalmente soporta memorias externas, comúnmente 4 MB en placas de desarrollo.
- **Periféricos y Entradas/Salidas (GPIOs):**
    - Más de 30 pines GPIO programables.
    - Conversores Analógico-Digitales (ADC) de 12 bits (hasta 18 canales).
    - Conversores Digital-Analógicos (DAC) de 2 canales.
    - Sensores táctiles capacitivos (10 pines).
    - Interfaces: 3x UART, 3x SPI, 2x I2C, 2x I2S, CAN bus.
    - PWM para motores y LEDs.
- **Seguridad:** Hardware integrado para cifrado AES, SHA-2, RSA, ECC y RNG.
- **Alimentación:** Voltaje de trabajo de 3.3V (generalmente se alimenta a 5V a través de USB en placas).
- **Bajo Consumo:** Soporta varios modos de sueño (sleep mode), consumiendo apenas unos mu A. [1](https://translate.google.com/translate?u=https://www.electronifyindia.com/blogs/news/esp32-wroom-32-features-applications-everything-you-need-to-know&hl=es&sl=en&tl=es&client=sge), [2](https://programarfacil.com/esp8266/esp32/#:~:text=ESP32%20es%20una%20familia%20de%20microcontroladores%20de,sobre%20esta%20plataforma%20y%20la%20informaci%C3%B3n%20dispersa), [3](https://pasionelectronica.com/esp32-caracteristicas-y-pines/), [4](https://www.luisllamas.es/esp32-detalles-hardware-pinout/), [5](https://www.sigmaelectronica.net/producto/esp-32/), [6](https://www.sigmaelectronica.net/producto/esp32-wroom-32d/)

**Ventajas vs. ESP8266**  
El ESP32 es superior al ESP8266 al ofrecer doble núcleo, mayor frecuencia de reloj, conectividad Bluetooth (el 8266 no tiene), y más pines GPIO con mejores capacidades analógicas. [1](https://cursos.mcielectronics.cl/2024/07/09/esp32-vs-esp8266-que-microcontrolador-es-el-adecuado-para-usted/), [2](https://www.geekfactory.mx/producto/adafruit-feather-huzzah32-esp32/#:~:text=El%20ESP32%20es%20el%20sustituto%20perfecto%20sobre,una%20UART%20extra\)%2C%20dos%20nucleos%20de%20procesamiento.), [3](https://www.az-delivery.de/es/collections/esp32#:~:text=Nuestros%20microcontroladores%20ESP32%20\(%20ESP32S%20\)%20El,china%20Espressif%20como%20sucesor%20del%20popular%20ESP8266.), [4](https://programarfacil.com/esp8266/esp32/#:~:text=ESP32%20es%20una%20familia%20de%20microcontroladores%20de,sobre%20esta%20plataforma%20y%20la%20informaci%C3%B3n%20dispersa)

**Entornos de Programación**  
Se puede programar utilizando Arduino IDE, MicroPython, Lua, o el framework oficial ESP-IDF (Espressif IoT Development Framework). [1](https://translate.google.com/translate?u=https://www.sunfounder.com/blogs/news/esp32-tutorial-a-comprehensive-guide-to-esp32-boards-features-and-getting-started&hl=es&sl=en&tl=es&client=sge), [2](https://www.youtube.com/watch?v=gbntchCgXSs&t=47), [3](https://www.amazon.es/AZDelivery-Desarrollo-Lolin32-ESP-32-Bluetooth/dp/B086W49HRH), [4](https://leantec.es/tienda/placa-de-desarrollo-nodemcu-esp32-wroom-32-devkit-v1-wifibluetooth-30-pines/#:~:text=La%20placa%20es%20totalmente%20compatible%20con%20el,flexibilidad%20para%20desarrolladores%20de%20todos%20los%20niveles.), [5](https://www.amazon.com.mx/AITIAO-ESP-WROOM-32-desarrollo-microcontrolador-Bluetooth/dp/B0BZYB757B#:~:text=Los%20m%C3%A1s%20destacados%20Paquete%20y%20servicio:%20recibir%C3%A1s,con%20el%20programa%20Lua%2C%20f%C3%A1cil%20de%20desarrollar.)

---
El [transmisor y receptor ApisQueen A300 6CH 2.4GHz](https://www.google.com/search?q=transmisor+y+receptor+ApisQueen+A300+6CH+2.4GHz&sca_esv=216a8bf4ffb3c00e&biw=950&bih=913&sxsrf=ANbL-n4IOo6YM71WuKoljltFY2q7MqdhpA%3A1775174223494&ei=TwLPadLiHbiQwbkPu5qNkAI&ved=2ahUKEwiZ5bHlr9CTAxUTTjABHcHUEQAQgK4QegQIARAB&uact=5&oq=especificaciones+del+A300+controlador+RF&gs_lp=Egxnd3Mtd2l6LXNlcnAiKGVzcGVjaWZpY2FjaW9uZXMgZGVsIEEzMDAgY29udHJvbGFkb3IgUkYyBRAhGKABSNM6UNoPWIM5cAh4AZABApgBoAWgAdwiqgEMMC4yNS4xLjEuMC4xuAEDyAEA-AEBmAIboALxGcICChAAGLADGNYEGEfCAgQQIxgnwgIFEAAY7wXCAggQABiABBiiBMICBRAAGIAEwgIGEAAYFhgewgIIEAAYogQYiQXCAgUQIRifBZgDAIgGAZAGApIHCjguMTcuMS41LTGgB6qCAbIHCjAuMTcuMS41LTG4B9AZwgcHMi4xMi4xM8gHTIAIAA&sclient=gws-wiz-serp&mstk=AUtExfDCHXTlqDtOQ-SgM8CD6klB9MpoMN4y-2nP6TaxUsxhGHZ4KBF4TDLKDQhuZxSZeeVpulBTIeB9RulgDB3w5fWYEvTD23mxSvXo91VpiM4TchcY69cDtUrpHVgcPXSegfxf4E1ijOtEF80DjK3jHrWncLPWBBel64CgN4qDYKPFWHuNRufseXdr-qCYg4UtnBYNuu1Jbz3YB_RueV6qEA4nUC1zvv-7BMQF-eReD0yOsWlXTqZm8IZNbTFmDOTiXPQWtCZAKd3rwSkUKMazpvr9rAhTLk-QK27D1Pvlgl6Rfg&csui=3) es un controlador de radiofrecuencia (RF) diseñado para embarcaciones RC y barcos de cebo, destacando por su impermeabilidad, rango de 2.4GHz ISM, y modos de control mixto para motores. Ofrece protección contra pérdida de señal, 6 canales y funciones de dirección diferencial. [1](https://www.amazon.com/-/es/ApisQueen-A300-Transmisor-controlador-impermeable/dp/B0BWN3YZ2K), [2](https://www.ubuy.com.bo/es/product/BM95CDLZC-apisqueen-as600-6ch-2-4ghz-rc-transmitter-and-receiver-remote-controller-with-pwm-6-channel-receiver-for-rc-boat)

**Especificaciones Clave del A300 6CH RC:**

- **Frecuencia:** 2.4GHz ISM, proporcionando una conexión estable y de largo alcance.
- **Canales:** 6 canales, lo que permite controlar múltiples funciones (motor, dirección, luces, etc.).
- **Impermeabilidad:** Diseñado para entornos acuáticos, adecuado para barcos de cebo y de arrastre.
- **Seguridad:** Cuenta con protección contra pérdida de señal, lo que ayuda a evitar la pérdida del vehículo.
- **Modos de Control:**
    - **Modo Mixto (1-2 Canales):** Permite controlar dos motores simultáneamente para maniobras complejas.
    - **Modo Mixto (3-4 Canales):** Permite el control avanzado de dirección. [1](https://www.amazon.com/-/es/ApisQueen-A300-Transmisor-controlador-impermeable/dp/B0BWN3YZ2K), [2](https://www.ubuy.com.bo/es/product/BM95CDLZC-apisqueen-as600-6ch-2-4ghz-rc-transmitter-and-receiver-remote-controller-with-pwm-6-channel-receiver-for-rc-boat)

**Aplicaciones:**

- Barcos de pesca y cebo de radiofrecuencia.
- Embarcaciones RC de arrastre. [1](https://www.ubuy.com.bo/es/product/BM95CDLZC-apisqueen-as600-6ch-2-4ghz-rc-transmitter-and-receiver-remote-controller-with-pwm-6-channel-receiver-for-rc-boat)

_Nota: Asegúrese de no confundir este controlador ApisQueen con dispositivos Anviz A300 de seguridad (control de acceso/asistencia) que también aparecen en búsquedas relacionadas._ [1](https://www.pccomponentes.com/anviz-a300-lector-basico-de-control-de-presencia-y-acceso#:~:text=Controla%20la%20asistencia%20y%20acceso%20de%20tu,te%20ofrece%20seguridad%20avanzada%20y%20comodidad%20multidispositivo.)

---

## 2. Separación de ramas de alimentación

No debes mezclar todo en una sola línea sin control.

- [x] Definir **rama de potencia**
## Qué es la rama de potencia

Es la parte del sistema que alimenta las cargas de mayor consumo y mayor ruido eléctrico, normalmente:

- propulsores
- ESC
- actuadores fuertes
- cargas que jalan picos de corriente

En tu caso, casi seguro la rama de potencia está centrada en:

- **batería LiPo 18.5V**
- **3 ESC**
- **3 propulsores APISQUEEN**

La Jetson, Kinect, LoRa, módem y sensores **no deberían ir metidos en esa misma rama como si fueran una sola cosa**.

---

## Preguntas para definir bien la rama de potencia
## 1. ¿Qué cargas son las que realmente consumen más corriente?

**¿Qué componentes tienen motor, hélice, empuje o picos fuertes?**

- 3 propulsores
- 3 ESC

---

## 2. ¿Los ESC aceptan directamente el voltaje de tu batería?

**¿Los ESC del kit APISQUEEN trabajan con el voltaje de tu LiPo 18.5V sin regulación intermedia?**

El ESC del propulsor submarino Apisqueen U01 tiene un rango de entrada de voltaje de **12V a 16V** (generalmente compatible con baterías LiPo de 3S o 4S). Este ESC bidireccional de 45A es diseñado para aplicaciones subacuáticas, soportando señales PWM (1-2 ms), [Oneshot](https://www.google.com/search?q=Oneshot&oq=rango+de+entrada+del+ESC+Apisqueen+u01&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQLhhA0gEINDA5OWowajGoAgiwAgE&sourceid=chrome&ie=UTF-8&mstk=AUtExfDHWEUIeHsSCDuB8hlsJvvWzLew7KnVxwAowpVvjlA3oZ_h11BkajrFaYiptxBhEjaWH8rQlvKYtcGmvkI_C8yScwmwGtfOzzCJOOGgNbjVinDVU2aCzOeMNpRHzOoZLot-i6gS1E4iuH6boSs-n-pPZhhsDPMl0h50yclT2o9pbUT-n4JYVDxw4nbFWXLRSfsVR-buGvlCaXoo2zRc4WRn9UNiQ2IX8X2J1wlsE2UBI6l7wg7WuIjP0urx2zZRs30gfw9GjDzXz8Y2eruRlUN2g5ph-winoO8h0WGAjL9BAw&csui=3&ved=2ahUKEwig0-2YutCTAxXPRTABHZNdE3MQgK4QegQIARAB), [Multishot](https://www.google.com/search?q=Multishot&oq=rango+de+entrada+del+ESC+Apisqueen+u01&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQLhhA0gEINDA5OWowajGoAgiwAgE&sourceid=chrome&ie=UTF-8&mstk=AUtExfDHWEUIeHsSCDuB8hlsJvvWzLew7KnVxwAowpVvjlA3oZ_h11BkajrFaYiptxBhEjaWH8rQlvKYtcGmvkI_C8yScwmwGtfOzzCJOOGgNbjVinDVU2aCzOeMNpRHzOoZLot-i6gS1E4iuH6boSs-n-pPZhhsDPMl0h50yclT2o9pbUT-n4JYVDxw4nbFWXLRSfsVR-buGvlCaXoo2zRc4WRn9UNiQ2IX8X2J1wlsE2UBI6l7wg7WuIjP0urx2zZRs30gfw9GjDzXz8Y2eruRlUN2g5ph-winoO8h0WGAjL9BAw&csui=3&ved=2ahUKEwig0-2YutCTAxXPRTABHZNdE3MQgK4QegQIARAC) y [Dshot150/300/600](https://www.google.com/search?q=Dshot150%2F300%2F600&oq=rango+de+entrada+del+ESC+Apisqueen+u01&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQLhhA0gEINDA5OWowajGoAgiwAgE&sourceid=chrome&ie=UTF-8&mstk=AUtExfDHWEUIeHsSCDuB8hlsJvvWzLew7KnVxwAowpVvjlA3oZ_h11BkajrFaYiptxBhEjaWH8rQlvKYtcGmvkI_C8yScwmwGtfOzzCJOOGgNbjVinDVU2aCzOeMNpRHzOoZLot-i6gS1E4iuH6boSs-n-pPZhhsDPMl0h50yclT2o9pbUT-n4JYVDxw4nbFWXLRSfsVR-buGvlCaXoo2zRc4WRn9UNiQ2IX8X2J1wlsE2UBI6l7wg7WuIjP0urx2zZRs30gfw9GjDzXz8Y2eruRlUN2g5ph-winoO8h0WGAjL9BAw&csui=3&ved=2ahUKEwig0-2YutCTAxXPRTABHZNdE3MQgK4QegQIARAD). [1](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov), [2](https://www.aliexpress.com/i/1005008727732199.html#:~:text=U01%2012V~16V%202Kg%20Thrust,directional%20Control%20ESC%20%2D%20AliExpress%201420), [3](https://es.aliexpress.com/item/1005006684091065.html#:~:text=El%20ESC%20detecta%20autom%C3%A1ticamente%20el%20se%C3%B1al%20del,antiinterferencias%20y%20el%20ESC%20no%20es%20necesario), [4](https://www.youtube.com/watch?v=KvI0WhCFS70#:~:text=APISQUEEN%2012V~16V%20U01%20Set,://www.underwater...), [5](https://www.mercadolibre.com.mx/apisqueen-helice-submarina-u01-con-45a-esc-bidireccional-12v/up/MLMU702297332#:~:text=Env%C3%ADos%20gratis%20en%20el%20d%C3%ADa%20%E2%9C%93%20Compra,Submarina%20U01%20Con%2045a%20Esc%20Bidireccional%2012v.)

**Detalles técnicos del ESC U01:**

- **Voltaje de entrada:** 12V - 16V DC.
- **Corriente Continua:** 45A.
- **Dirección:** Bidireccional (Reversa y adelante).
- **Protocolos de señal:** PWM, Oneshot, Multishot, Dshot.
- **Uso:** Especializado para ROVs y botes sumergibles (u01). [1](https://www.underwaterthruster.com/products/u01-12v-16v-200w-2kg-thrust-brushless-underwater-subsea-thruster-propeller-propulsion-with-bi-directional-control-esc-for-rov-boat#:~:text=U01%2012V~16V%20Brushless%20Underwater,For%20ROV%20Boat%20%E2%80%93%20Underwater%20Thruster), [2](https://www.mercadolibre.com.mx/apisqueen-helice-submarina-u01-con-45a-esc-bidireccional-12v/up/MLMU702297332#:~:text=Env%C3%ADos%20gratis%20en%20el%20d%C3%ADa%20%E2%9C%93%20Compra,Submarina%20U01%20Con%2045a%20Esc%20Bidireccional%2012v.), [3](https://www.ebay.com/itm/306395483544), [4](https://www.amazon.com/-/es/U2-escobillas-subacu%C3%A1tico-propulsi%C3%B3n-bidireccional/dp/B0BGL7D5GJ#:~:text=Amazon.com:%20APISQUEEN%20U2%2012V%20300W%205.7%20lbs,barco%20\(verde%2C%20CW\)%20:%20Juguetes%20y%20Juegos.), [5](https://www.ubuy.hn/es/product/FV3CRISNA-apisqueen-u01-underwater-thruster-with-45a-bi-directional-esc-12v-24v-2kg-thrust-brushless-underwater-subsea-thrusterpropeller-for-rov-boat-cw), [6](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov)

El propulsor subacuático Apisqueen U01 soporta baterías LiPo de **2S a 4S** (voltaje de 12V a 16V). La configuración recomendada para obtener la máxima eficiencia y empuje 2 Kg es utilizar una batería de **4S LiPo** (16V). Aunque el rango operativo es de 12V - 16V, algunos informes indican que puede operar brevemente con24V (6S), pero no es aconsejable para un uso prolongado. [1](https://www.amazon.com/-/es/ApisQueen-submarina-escobillas-submarino-propulsi%C3%B3n/dp/B0CG191VX2), [2](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov), [3](https://es.aliexpress.com/i/1005008727732199.html#:~:text=Prueba%20de%20empuje%20delantero%20APISQUEEN%20U01%20completa,pero%20no%20apto%20para%20uso%20a%20largo), [4](https://tiendamia.com/pe/producto?amz=B0CG19NM8W)

**Detalles clave del Apisqueen U01:**

- **Tipo de batería:** LiPo 2S-4S.
- **Voltaje operativo:** 12 V - 16 V
- **Voltaje recomendado:** 16 V (4S LiPo.
- **Entorno:** Solo diseñado para agua dulce.
- **Corriente máxima:** 17 A.
- **Empuje máximo:** 2 kg (4.41 lb). [1](https://www.amazon.com/-/es/ApisQueen-submarina-escobillas-submarino-propulsi%C3%B3n/dp/B0CG191VX2), [2](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov), [3](https://tiendamia.com/pe/producto?amz=B0CG19NM8W)

| Parámetro [[1](https://www.underwaterthruster.com/products/apisqueen-12v-16v-2kg-thrust-u01-tow-set-brushless-underwater-thruster-propeller-with-bi-directional-control-esc-for-rov-boat#:~:text=Voltage:%2012%2D16V%20\(2S,suitable%20for%20long%2Dterm%20use%EF%BC%89), [2](https://www.ubuy.sn/en/product/FV3CRISNA-apisqueen-u01-underwater-thruster-with-45a-bi-directional-esc-12v-24v-2kg-thrust-brushless-underwater-subsea-thrusterpropeller-for-rov-boat-cw#:~:text=ApisQueen%20Editorial%20Review,separately%20for%20a%20complete%20setup.), [3](https://es.aliexpress.com/item/1005006684091065.html)] | Valor          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| **Corriente Máxima**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 17 A           |
| **Capacidad del ESC**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 45 A           |
| **Potencia Máxima**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 390 W          |
| **Empuje Máximo**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 2 Kg (4.4 lb)  |
| **Voltaje Recomendado**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 16 V (4S LiPo) |

**Nota importante:** Este modelo está diseñado exclusivamente para uso en **agua dulce**; su uso en agua salada no está recomendado y puede reducir drásticamente su vida útil. [1](https://www.amazon.com/ApisQueen-Underwater-Brushless-Propeller-Propulsion/dp/B0CG191VX2#:~:text=Top%20highlights,robot%20RC%20bait%20boat%20ROV.), [2](https://www.underwaterthruster.com/es/products/apisqueen-12v-16v-2kg-de-empuje-u01-tow-set-helice-helice-subacuatica-sin-escobillas-con-control-bidireccional-esc-adecuado-para-barcos-rov#:~:text=Voltaje:%2012%2D16%20V%20\(2S%2D4S%20LiPo\)%2C%20potencia%20m%C3%A1xima:,mm%2C%20entorno%20aplicable%20U01%20:%20Agua%20dulce.), [3](https://www.aliexpress.com/i/1005006335233745.html#:~:text=Item%20description%20report,and%20has%20the%20following%20features:)

**¿Ese ESC soporta 5S LiPo de forma directa?**
Tecnicamente no, solamente durante un corto tiempo lo soporta 

---

## 3. ¿La batería va a alimentar los ESC de forma directa o a través de algún módulo?

**¿Los motores deben recibir la energía casi directa desde batería a través de ESC?**
- **batería → distribución de potencia → ESC**
Si, deben ir directos, pero primero pasando por el ESC

---
## 4. ¿La rama de potencia debe estar separada físicamente de la rama lógica?
**¿Quiero que el ruido eléctrico de los motores llegue directo a la Jetson, Kinect y sensores?**
La respuesta es **no**.
- rama de potencia = motores y ESC
- rama lógica = Jetson, modulos, sensores
- rama periférica = Kinect, módem, NSC2

---

## 5. ¿Cómo se va a distribuir esa potencia a los 3 ESC?

- distribución en paralelo desde la batería hacia los 3 ESC
- barra de distribución
- arnés en Y o bloque de potencia
- punto de unión robusto

**¿Cómo voy a repartir el positivo y negativo de batería a los tres ESC sin improvisar empalmes inseguros?**
La potencia se repartiria con un conector que viene en el kit propio del APISQUEEN U01, que es un tipo de Y, solo que este tiene, una entrada de energia (Bateria) y luego tiene 3 salida o puntos, 2 para los propulsores y el restante para modulo de poder que a su vez, esta conectando y alimentando el controlador RF (A300)

---

## 6. ¿Qué protección tendrá esa rama?
**Si ocurre un corto o un ESC falla, ¿qué protege la batería y el resto del sistema?**
### 1. Protección desde la entrada de batería

La batería principal es una **LiPo 5S**, así que la primera protección no empieza en el regulador, sino **desde la entrada**. Por eso contemplamos:

- **fusible principal**,
- **protección contra inversión de polaridad**,
- **TVS / supresión de transitorios**,
- y una etapa tipo **eFuse / hot-swap** para limitar sobrecorriente, sobrevoltaje, cortocircuito, corriente inversa y arranque brusco.

Esto tiene mucho sentido porque un dispositivo como el **TPS2663** trabaja entre **4.5 V y 60 V**, soporta hasta **6 A**, y añade funciones como **UVLO, OVP, limitación de corriente, soft-start, reverse current blocking, short-circuit protection, thermal shutdown y power good**.

### 2. Separación de ramas para evitar que una falla dañe todo

Otra de las decisiones de seguridad más importantes que tomamos es que **no todo irá en una sola rama común**. Separamos:

- rama de **Jetson**,
- rama de **Kinect**,
- rama de **5V**,
- rama de **3.3V limpia**,
- y rama de **propulsión**.

¿Por qué? Porque si una rama falla, las otras deben seguir operando. Eso es especialmente importante en la **Jetson TK1**, porque NVIDIA indica que la placa está caracterizada para **12 V ±10%**, que por encima de **16 V** puede dañarse, y que el kit usaba una fuente de **12 V / 5 A**.

### 3. Protección específica de la rama Jetson

La rama de la Jetson no puede quedar “colgada” de la batería 5S directamente. Esa rama tendrá:

- **buck dedicado a 12V**,
- protección propia de la rama,
- idealmente **fusible o limitación por rama**,
- y monitoreo de estado.

La justificación técnica es clara: la Jetson TK1 necesita una alimentación controlada a 12 V y NVIDIA advierte que tensiones por encima de 16 V pueden dañar la placa. Además, el consumo depende de la aplicación y periféricos, por eso la rama debe diseñarse con margen.

### 4. Protección específica de la rama Kinect

La Kinect también irá en **rama independiente**, no mezclada con la Jetson. Eso mejora la seguridad porque si la Kinect genera un problema de consumo, cableado o arranque, no compromete directamente la rama principal de cómputo.  
Aquí la protección será:

- **buck dedicado a 12V**,
- protección de rama,
- y aislamiento eléctrico respecto a Jetson y lógica.

Eso no sale de una ficha puntual de Kinect que hayamos usado aquí, sino de la arquitectura de seguridad que definimos para el proyecto.

### 5. Protección de la rama de 5V

La rama de 5V es muy importante porque alimenta:

- sensores a 5V,
- lógica auxiliar,
- respaldo por USB-C,
- y sirve como base para generar 3.3V.

Aquí contemplamos:

- **buck dedicado 5S → 5V**,
- **mux de potencia** para elegir entre **5V_USB** y **5V_BAT**,
- y control para que las dos fuentes no se “peleen”.

Para esto encaja muy bien una solución tipo **TPS2121**, que está pensada como **power mux**, con bloqueo de corriente inversa, protección térmica y conmutación entre fuentes sin interrupción apreciable.

### 6. Protección del USB-C

El USB-C en nuestro diseño **no será la fuente principal de toda la plataforma**, sino una fuente de:

- mantenimiento,
- programación,
- debug,
- y respaldo de la rama de 5V en laboratorio.

Para que eso sea correcto, el diseño USB-C como dispositivo debe llevar **resistencias de 5.1 kΩ en CC1 y CC2**, y sin USB Power Delivery el modo Type-C estándar trabaja a **5 V**, con hasta **3 A** en este escenario.

Eso significa que el USB-C sirve como respaldo útil y seguro para la parte lógica, pero no como fuente para toda la carga pesada del sistema.

### 7. Protección de la rama de 3.3V limpia

La rama de **3.3V** es la más delicada porque ahí viven:

- **ESP32-S3**,
- **LoRa**,
- **MAX31865**,
- y módulos opcionales como IMU o GPS.

Por eso esa rama tendrá:

- regulador dedicado desde 5V,
- filtrado,
- desacoples locales,
- y separación física de las zonas de potencia y propulsión.

Esto es importante porque Espressif recomienda para el **ESP32-S3** una alimentación de **3.3 V** con al menos **500 mA**, sugiere añadir al menos **10 μF** en la entrada de alimentación, y además advierte que el pin **CHIP_PU / EN no debe quedar flotante**.

### 8. Protección del canal USB del ESP32-S3

Como vamos a usar el **ESP32-S3** con USB, también contemplamos protección y estabilidad en esa parte:

- **GPIO19 = USB_D-**
- **GPIO20 = USB_D+**
- y Espressif recomienda resistencias serie de **22/33 Ω** cerca del chip y reservar capacitor a tierra en cada línea USB para mejorar el comportamiento eléctrico.

Esto ayuda a que la programación y depuración no queden frágiles.

### 9. Protección y monitoreo de consumo

Una parte clave de la seguridad no es solo “proteger”, sino también **saber qué está pasando**. Por eso definimos monitoreo con **INA228**, porque permite medir:

- **voltaje**,
- **corriente**,
- **potencia**,
- **energía**,
- y **carga acumulada**.

Además, el INA228 soporta medición de bus hasta **85 V**, trabaja desde **2.7 V a 5.5 V** para su propia alimentación y tiene ADC de **20 bits**, así que es muy adecuado para una batería 5S y para medir ramas específicas.

Eso significa que la protección de la rama no será “ciega”: podremos detectar sobreconsumo, autonomía, rama problemática y comportamiento real del sistema.

### 10. Protección de la propulsión

La rama de propulsión no irá mezclada con la lógica sensible. Aquí la seguridad consistirá en:

- **salida separada desde batería protegida**,
- **fusible por ESC o por rama**,
- cobre de alta corriente,
- y rutas de retorno separadas del analógico y RF.

Esto no depende de una hoja de datos concreta, sino de una práctica de diseño necesaria: evitar que la corriente grande de motores y ESC contamine las mediciones de sensores o reinicie la electrónica de control.

### 11. Protección operativa: kill switch y soft-power

También definimos dos niveles de seguridad en encendido y apagado:

- un **kill switch de emergencia** físico en la carcasa,
- y un sistema de **soft-power** para encendido normal y apagado controlado.

Esto va muy en línea con la propia recomendación de NVIDIA para la Jetson TK1: no quitar potencia bruscamente, sino usar el mecanismo de apagado ordenado cuando sea posible.

---

### Respuesta modelo para decirla en la exposición

> **Esa rama tendrá una protección multicapa.** Primero, desde la entrada de batería contará con fusible principal, protección contra inversión de polaridad, supresión de transitorios y una etapa electrónica de protección tipo eFuse/hot-swap. Segundo, cada rama crítica estará separada, por ejemplo Jetson, Kinect, 5V, 3.3V y propulsión, para que una falla no comprometa todo el sistema. Tercero, cada rama tendrá su regulación dedicada según su nivel de tensión y consumo. Cuarto, el sistema incluirá monitoreo de voltaje, corriente, potencia y energía para detectar sobrecargas y estimar autonomía. Y finalmente, el proyecto contará con apagado controlado y kill switch de emergencia para mejorar la seguridad operativa.

---

## 7. ¿Cómo se controla el encendido de la rama de potencia?
**¿Los ESC y propulsores se energizan apenas conecto batería, o solo después de una habilitación controlada?**
Mi recomendación es: **no deben quedar habilitados “listos para empujar” apenas conectas la batería**. Lo mejor es un esquema de **doble capa**:

**Capa 1: habilitación física del sistema.**  
Conectar batería no debería equivaler a “propulsión armada”. Debe existir un **kill switch / master enable** físico y una cadena de potencia que primero levante la electrónica de control y supervisión. Una protección tipo **eFuse/hot-swap** en la rama electrónica ayuda a controlar sobrecorriente, soft-start y fallas, pero la rama de ESC necesita además una habilitación propia por su nivel de corriente. El TPS2663, por ejemplo, sí añade UVLO, OVP, limitación de corriente, soft-start, bloqueo de corriente inversa y apagado térmico, pero por su límite de corriente es más adecuado para la electrónica/ramas moderadas que para toda la propulsión pesada.

**Capa 2: armado lógico de propulsión.**  
Una vez encendida la plataforma, el controlador solo debe habilitar los ESC cuando se cumplan precondiciones: neutro PWM válido, estado interno OK, batería dentro de rango y orden de armado. Esto encaja muy bien con los ESC APISQUEEN: el fabricante indica que, al energizarse, el microcontrolador debe enviar **1.5 ms** para neutro y dejar que pase el self-test antes de controlar avance/reversa. Así que la secuencia correcta es: batería conectada → electrónica arranca → controlador envía PWM neutro → validación → habilitación de propulsión. El dashboard puede ser parte del permiso lógico, pero **no debería ser la única barrera**.

---

## 8. ¿La rama de potencia comparte GND con la lógica?

Aquí hay un matiz:

- la alimentación debe estar separada
- pero muchas veces **sí necesitas GND común** para referencia de señal entre controlador y ESC

**¿Necesito tierra común entre ESC y controlador para que la señal PWM sea válida?**

**Capa 2: armado lógico de propulsión.**  
Una vez encendida la plataforma, el controlador solo debe habilitar los ESC cuando se cumplan precondiciones: neutro PWM válido, estado interno OK, batería dentro de rango y orden de armado. Esto encaja muy bien con los ESC APISQUEEN: el fabricante indica que, al energizarse, el microcontrolador debe enviar **1.5 ms** para neutro y dejar que pase el self-test antes de controlar avance/reversa. Así que la secuencia correcta es: batería conectada → electrónica arranca → controlador envía PWM neutro → validación → habilitación de propulsión. El dashboard puede ser parte del permiso lógico, pero **no debería ser la única barrera**.

---

## 9. ¿Qué calibre de cable y conectores usarás?
**¿El cableado que usaré aguanta la corriente de tres propulsores al mismo tiempo?**
**¿Los conectores están pensados para corriente de potencia o son solo para señal?**

Solo si lo dimensionas por **peor caso**, no por caso promedio. Y aquí el peor caso no es “el motor va tranquilo”, sino **tres arranques casi simultáneos o una maniobra con alto empuje sostenido**. Los ESC APISQUEEN que mostraste son de **45A**; si dimensionas en serio por el límite de la rama, el bus de propulsión debe asumir hasta **3 × 45A = 135A continuos teóricos**, más transitorios. Aunque tus propulsores reales quizá consuman menos, ese es el escenario conservador de diseño. APISQUEEN muestra, por ejemplo, un thruster X5 de **500W / 20A** y uno U3 de **290W / 12A**, mientras que un T200 de referencia consume **24A a 16V** y **32A a 20V**; eso confirma que el consumo real del propulsor depende mucho del modelo, pero no invalida que la rama del ESC se diseñe con margen.

Por eso, mi recomendación de cableado es esta:

- **Batería → bus de propulsión / distribución principal:** **4 AWG mínimo** si el tramo no es largo; **2 AWG** si el recorrido crece o quieres bajar caída de voltaje con más margen.
- **Cada rama a ESC:** **6 AWG** si realmente vas a diseñar para 45A por rama con margen térmico y entorno confinado; **8 AWG** solo si el tramo es muy corto, bien ventilado y el consumo real medido queda claramente por debajo de 40A.  
    Las tablas de ampacidad de referencia para ambiente marino muestran que 8 AWG ronda ~55A abierto / ~39A en entorno más severo, 6 AWG ~75A / ~51A, y 4 AWG ~95A continuo. Además, en 12–24V el **voltaje de caída** importa mucho, no solo la ampacidad.

---

## 10. ¿Cuál es el peor escenario de consumo?
**¿Qué pasa si los 3 propulsores arrancan al mismo tiempo o exigen bastante empuje?**
Ese es tu **peor escenario de diseño** y debes decirlo así. Lo que puede pasar no es solo “se gasta rápido la batería”; pueden pasar tres cosas más críticas:

1. **Pico de corriente elevado** en el bus de propulsión.
2. **Caída de voltaje (sag)** en la batería/cableado si la impedancia total es alta.
3. **Brownout o reinicio** de Jetson, sensores o lógica si compartes mal la alimentación.

Eso es exactamente la razón por la que no debes colgar Jetson/sensores del mismo camino de potencia que los ESC. La Jetson necesita un 12V estable; si la caída del bus primario la obliga a salir de rango, se vuelve inestable. Por eso decidimos ramas separadas, con distribución central, reguladores dedicados y monitoreo. Y si te preguntan por corriente, di esto: **aunque el propulsor real pueda estar en 12A, 20A o 30A según modelo, el bus se diseña por el límite del ESC y por el peor caso simultáneo.**

---

## Cómo deberías definir, por ahora, la rama de potencia
## Rama de potencia v0

Incluye:

- **batería LiPo 18.5V**
- **interruptor/corte principal**
- **fusible o protección**
- **distribución de potencia**
- **ESC 1**
- **ESC 2**
- **ESC 3**
- **propulsor 1**
- **propulsor 2**
- **propulsor 3**

Y **no** incluye directamente:

- Jetson TK1
- Kinect
- módem Huawei
- LoRa
- sensores

---

## Respuestas que deberías intentar obtener hoy

Para cerrar este punto, necesitas responder estas 6:

1. **¿Los ESC APISQUEEN soportan 18.5V / 5S LiPo?**
**Sí, los de 45A que estamos tomando como base sí lo soportan**, porque APISQUEEN los publica como **3–6S LiPo / 12–24V**, con nota explícita de soporte hasta **6S (25.2V)**. Además, el fabricante distingue que los **45A son “no BEC”**, mientras que modelos más pequeños sí integran BEC; eso significa que para tu arquitectura es correcto alimentar la lógica por una rama dedicada y no esperar que el ESC alimente al controlador.

Pero aquí va la precisión importante: **que el ESC soporte 5S no significa que automáticamente cualquier propulsor, hélice o empuje sostenido esté bien a 5S**. El conjunto real depende del motor/propulsor que le conectes. Hay propulsores APISQUEEN de 12–24V con consumos máximos de 12A, 20A o 28A según modelo, y sistemas más grandes que se anuncian con corrientes de hasta 45A por conjunto. Por eso el cierre técnico correcto es: **5S sí es compatible con el ESC 45A, pero la validación final de corriente se hace con el propulsor concreto y con pruebas instrumentadas.**

1. **¿La batería alimentará los 3 ESC en paralelo?**
**Sí.** La forma correcta es que la batería alimente un **bus DC principal** y desde ahí salgan **tres ramas en paralelo**, una por ESC. No los alimentas en serie. Cada ESC recibe el mismo voltaje del bus y consume la corriente que su propulsor demande. Esto, además, te permite poner:

- un fusible por rama,
- medir por rama si luego quieres,
- y aislar fallas sin comprometer toda la propulsión.

La palabra clave para defender esta decisión es **distribución centralizada con ramas paralelas protegidas**. El propio uso normal de thrusters/ESCs en estas plataformas es exactamente ese: fuente DC común + ESC independiente por motor.

1. **¿Qué tipo de distribución usarás para repartir potencia?**
Aquí tu respuesta debe sonar firme:  
**usaré una distribución tipo star / hub central**, no un cableado en cascada.

Eso significa:

- un punto central de entrada de batería,
- un bloque de protección principal,
- una barra o bus de distribución,
- y de ahí ramas separadas:
    - Jetson 12V,
    - Kinect 12V,
    - 5V lógica/sensores,
    - propulsión ESC1,
    - propulsión ESC2,
    - propulsión ESC3.

La ventaja del esquema star es que reduces interacción entre ramas, facilitas medir consumos, colocas protección por rama y controlas mejor las caídas de voltaje. En tu proyecto esto es especialmente importante porque coexistirán cargas muy distintas: cómputo, sensores y propulsión.

1. **¿Qué protección principal tendrá esa línea?**
Aquí yo respondería así:

**La línea principal tendrá protección multicapa:**

- **fusible principal** lo más cerca posible de la batería,
- **protección contra inversión de polaridad**,
- **supresión de transitorios / TVS**,
- **monitoreo de voltaje y corriente**,
- y, para la rama electrónica, una protección tipo **eFuse/hot-swap** con soft-start y corte por falla.

Para la parte de fusibles, los MRBF están pensados como protección principal de batería en DC y los MIDI/AMI son muy útiles como protección de ramas de alta corriente. Blue Sea, por ejemplo, especifica los MRBF como adecuados para protección principal DC y los MIDI/AMI con alta capacidad de interrupción en aplicaciones DC principales.

Mi recomendación práctica sería:

- **fusible principal** en la salida de batería, antes de la distribución,
- **fusible por ESC/rama**,
- y protección separada para la rama electrónica crítica.  
    Y una corrección importante a tu idea: **el elemento “sacrificable” no debe ser un cable ni una pista cualquiera; debe ser un fusible o un dispositivo de protección diseñado para eso.**

1. **¿Cómo se hará el corte o stop general?**
Lo mejor para tu caso no es un único switch bruto, sino **dos niveles de parada**:

**Nivel 1: parada de emergencia (kill switch).**  
Un interruptor físico accesible desde la carcasa que corte **de inmediato la propulsión**. Si quieres máxima seguridad, puede además cortar toda la plataforma; pero desde el punto de vista operativo suele ser mejor que el “kill” tumbe primero propulsión y deje electrónica unos segundos para registro/diagnóstico o apagado ordenado. Eso ya depende de tu filosofía de seguridad.

**Nivel 2: apagado controlado / soft-power.**  
El sistema se enciende y apaga normalmente con una lógica de soft-power, no con desconexión brutal de la batería a diario. Así puedes validar estados, guardar logs y evitar encendidos accidentales. Para ramas moderadas, un eFuse como el TPS2663 aporta funciones de soft-start, current limiting y fault response; para la conmutación entre **5V_USB** y **5V_BAT**, un mux como **TPS2121** ayuda a hacer el respaldo de laboratorio sin peleas entre fuentes.
1. **¿Cómo asegurarás tierra común de señal sin mezclar toda la alimentación?**
Lo mejor para tu caso no es un único switch bruto, sino **dos niveles de parada**:

**Nivel 1: parada de emergencia (kill switch).**  
Un interruptor físico accesible desde la carcasa que corte **de inmediato la propulsión**. Si quieres máxima seguridad, puede además cortar toda la plataforma; pero desde el punto de vista operativo suele ser mejor que el “kill” tumbe primero propulsión y deje electrónica unos segundos para registro/diagnóstico o apagado ordenado. Eso ya depende de tu filosofía de seguridad.

**Nivel 2: apagado controlado / soft-power.**  
El sistema se enciende y apaga normalmente con una lógica de soft-power, no con desconexión brutal de la batería a diario. Así puedes validar estados, guardar logs y evitar encendidos accidentales. Para ramas moderadas, un eFuse como el TPS2663 aporta funciones de soft-start, current limiting y fault response; para la conmutación entre **5V_USB** y **5V_BAT**, un mux como **TPS2121** ayuda a hacer el respaldo de laboratorio sin peleas entre fuentes.


---

##
- [x] Definir **rama de lógica/computación**
## Qué es la rama de lógica/computación

Es la rama que alimenta los equipos que:
- procesan datos,
- ejecutan lógica,
- controlan decisiones,
- manejan comunicaciones,
- envían señales de control,
- dependen de voltaje estable y limpio.

En tu caso, muy probablemente aquí entran:

- **Jetson TK1**
- **microcontrolador auxiliar** que controle ESC/PWM, si lo usas
- parte de comunicaciones de control, según cómo lo organices

Y normalmente **no** deberían ir aquí como carga principal:

- propulsores
- ESC como potencia
- Kinect si consume aparte y conviene dejarlo en periféricos
- cargas que metan ruido fuerte

---
## Objetivo de esta rama

La meta es que puedas decir:

**“la parte inteligente del sistema recibe energía estable, regulada y protegida, sin depender de los picos de los motores.”**

---
### 1. ¿Qué módulo toma las decisiones principales del sistema?

La pregunta central es:

**¿Quién es el cerebro principal de M.A.N.G.O.?**
- **Jetson TK1**

---

### 2. ¿Habrá un segundo cerebro de control en tiempo real?

**¿El microcontrolador auxiliar solo pertenece al control de motores o también hace parte de la lógica del sistema?**

Como en tu caso manejará:

- PWM,
- modo manual/autónomo,
- stop/failsafe,
- recepción de órdenes,

Por ahora, el unico 2do "cerebro" es el ESP32, pero hace parte tambien de la logico del sistema

---

### 3. ¿Qué equipos necesitan voltaje más limpio y estable?

**¿Qué módulos pueden fallar o dañarse si reciben ruido, caídas o sobrevoltaje?**
- Jetson TK1
- ESP32
- Modem Huawei
- Kinect
- Modulo RF A300

---

### 4. ¿Qué voltaje necesita cada equipo de lógica?

Aquí debes identificar con total claridad:

- Jetson TK1: ¿qué voltaje exacto requiere?
- ESP32/Arduino/controlador: ¿5V? ¿3.3V? ¿por VIN o por regulado?
- algún conversor adicional de señales: ¿requiere 5V o 3.3V?

**¿Qué salidas reguladas necesito para que la lógica funcione sin forzar ningún módulo?**

- Jetson = 12V
- ESP = 5V
- Kinect = 12V
- Modem = Va a la Jetson
- Sensores (pH, temp, turbi) = Van a la Jetson
- Controlador RF = Va al ESP32
- NCS2 = Va a la Jetson

---

### 5. ¿La rama de lógica tendrá un regulador dedicado?

**¿Voy a sacar la lógica desde un buck dedicado independiente de otras ramas?**
Si, tendra su regulador dedicado 

---

### 6. ¿Qué tan crítica es la estabilidad de la Jetson?

Muy crítica.

**¿Qué pasa si la Jetson se reinicia cuando arrancan motores o cambia la carga?**

Pasa esto:

- pierdes SLAM,
- pierdes procesos,
- pierdes sincronización,
- puedes corromper archivos o SQLite,
- pierdes control de alto nivel.

Eso significa que esta rama debe priorizar:

- estabilidad,
- margen de corriente,
- protección,
- buen regulador.

---

### 7. ¿Qué módulos deben encender primero?
**¿Conviene energizar primero la lógica/computación antes que la rama de potencia?**

En muchos sistemas, sí.  
Porque primero quieres:

- control disponible,
- estado estable,
- software listo,
- después habilitar motores.

Entonces esta rama suele ser la primera en encenderse y la última en apagarse.

---

### 8. ¿Qué pasa si esta rama cae?

**Si falla la rama lógica, qué debe ocurrir con los propulsores?**

Cuando se entra en un estado de alerta por bateria/energia, los propulsores deben sacar o dejar en un lugar seguro el dispositivo: Elevarlo si se encuentra sumergido o detenerse si se encuentra en movimiento en la superficie
En 1ra instancia, si se hace un corte brusco de la logica, por seguridad se suspenden los motores, si de pronto vuelve la parte logica despues de unos minutos, se reanuda el funcionamiento de los propulsores, de lo contraria, se apaga todo el sistema

---

### 9. ¿La rama de lógica comparte GND con otras ramas?

Normalmente:

- sí comparte referencia común de tierra con control/ESC,
- pero no comparte la alimentación “sucia” de potencia.

**¿Cómo comparto referencia de señal sin meter ruido de potencia a la lógica?**

En principio, dividiendo el punto en comun que estamos manejando: Potencia por un lado, logica por el otro. Si es por el ruido generado, va mas a la alimentacion que se le dedique a la parte de la logica pero tambien recae en algo fisico donde se cubren muy bien y se manejan las distancias entre modulos y potencia, de este modo, se evita un ruido en la señal. Si es por la parte electronica, recae mas en microcontroladores que permiten el flujo y control de las señales que se usen.

---

### 10. ¿Qué cargas NO deben entrar aquí?

**¿Qué módulos, aunque sean importantes, no conviene poner en la rama principal de lógica?**
El kinect, aunque comparte voltaje con la jetson, si seria oportuno dividir estas ramas. De resto, pueden ir en la parte de logica, ya que son controladas y alimentadas por la Jetson, gracias a su bajo consumo, no se corren riesgos

---

### Definición preliminar de la rama de lógica/computación

#### Rama de lógica/computación v0

Incluye:

- **salida regulada dedicada desde la batería**
- **Jetson TK1**
- **microcontrolador auxiliar** (ESP32/Arduino, si lo usas)
- líneas de control y comunicación entre ambos
- alimentación de módulos de control esenciales
- NCS2

No incluye como carga principal:

Rama de Potencia:
- ESC como potencia
- propulsores

Rama de perifericos:
- Kinect si lo separas en periféricos
- Sensores (pH, Temperatura, Turbidez)
- Modem Huawei

---
#### Qué debes responder para cerrarla bien

Necesitas responder estas preguntas concretas:

1. **¿La Jetson TK1 tendrá regulador dedicado solo para ella?**
Si

2. **¿El microcontrolador se alimentará desde la misma rama lógica o desde una subrama aparte?**
Rama de logica

3. **¿Qué voltaje exacto tendrá la salida de esta rama?**
12 V, ya que eso consume la Jetson que es el cerebro

4. **¿Qué corriente mínima debe soportar esa salida con margen?**
5A, y eso que es con todo encendido

5. **¿Será la primera rama en encender?**
Si

6. **¿Qué pasa si esta rama falla: cómo forzar stop seguro?**
Desde programacion se alerta sobre el bajo consumo y si llega a haber un bajon o apagon, tendra un protocolo para alertar, si no se recupera la rama logica, se apagara por completo

7. **¿Qué módulos quedan fuera de esta rama para no sobrecargarla ni ensuciarla?**
El kinect y propulsores

---

## Cómo distinguir lógica/computación de periféricos

### Va en lógica/computación si:

- piensa,
- procesa,
- decide,
- controla,
- coordina el sistema.

### Va en periféricos si:

- apoya,
- mide,
- captura,
- transmite,
- pero no es el cerebro principal.

Entonces:

- Jetson = lógica/computación
- microcontrolador de control = lógica/control
- Kinect =  periférico
- módem Huawei =  periférico/comunicaciones
- sensores =  periféricos/instrumentación

---

# 
- [x] Definir **rama de periféricos**

 ## 1. ¿Todos esos periféricos usan el mismo voltaje?

Pregunta clave:

- ¿Kinect usa el mismo voltaje que sensores?
No, usa 12V
- ¿el módem Huawei usa el mismo voltaje que los sensores?
Usa el mismo voltaje que 2 sensores
- ¿LoRa trabaja a 3.3V o 5V?
3.3V
- ¿los sensores necesitan acondicionamiento?
No

Porque si la respuesta es no, entonces dentro de “periféricos” debes crear **subramas**.

Ejemplo:

- periféricos 12V o 5V altos
- periféricos 5V estables
- periféricos 3.3V / señal

---

## 2. ¿Cuál periférico consume más?

- **Kinect**
---

## 3. ¿Qué periféricos meten ruido o picos?

El módem Huawei puede tener comportamiento variable.  
El Kinect también puede ser más exigente que un sensor simple.

**¿Los sensores delicados deben compartir la misma salida regulada con Kinect y módem?**

El kinect va diferente del modem, asi que no compartir salida

---

## 4. ¿Cómo se conectan a la Jetson?

Todo USB

---

## 5. ¿Qué periféricos son críticos y cuáles no?

**Si este periférico falla, el sistema sigue funcionando o no?**

Los mas criticos son los sensores del ecosistema, en orden de prioridad son:

1. Sensores (Temp, Turbi, pH)
2. ESP32
3. LoRa
4. Modem
5. Kinect
6. NCS2
7. BNO080

---
# Mejor aún: subdividir periféricos

## Subrama de sensado

- pH
- temperatura
- turbidez
- BNO080

## Subrama de visión/captura

- Kinect
- NCS2

## Subrama de comunicaciones

- módem Huawei
- LoRa
- ESP32

# 1. Subrama de sensado

## Aquí entrarían

- sensor de **pH**
- sensor de **temperatura**
- sensor de **turbidez**
- Sensor de **Giroscopio**

### A. ¿Qué voltaje necesita cada sensor?

Pregunta clave:

- ¿todos trabajan igual?
No
- ¿alguno requiere 5V?
Si
- ¿alguno requiere 3.3V?
Si
- ¿alguno entrega señal analógica y necesita ADC?
No

### B. ¿Cómo se conectan?

Debes identificar si cada uno usa:

- analógico
- SPI
- digital simple
- I2C

### C. ¿Quién los lee?

Pregunta:

- ¿los sensores los leerá la Jetson?
No
- ¿los leerá un microcontrolador y luego enviará datos a la Jetson?
Si, los leera la ESP32

### D. ¿Qué tan sensibles son al ruido?
- ¿si comparten alimentación con módem o Kinect, se puede dañar la lectura?
Muy probablemente
- ¿conviene darles una línea más limpia?
Conviene una linea limpia

## Definición preliminar

**Subrama de sensado**

- sensores de pH, temperatura, turbidez y giroscopio
- regulada y estable
- preferiblemente separada de cargas variables como módem y Kinect
- con referencia común bien definida

---

# 2. Subrama de comunicaciones

Esta subrama incluye los módulos que permiten **enviar, recibir o retransmitir datos**.

## Aquí entrarían

- **módem Huawei**
- **LoRa**

### A. ¿Cuál consume más?
- módem Huawei > LoRa

### B. ¿Qué voltaje requiere cada uno?

- módem Huawei: ¿5V por USB?
Si
- LoRa: ¿3.3V o 5V según módulo?
3.3V

### C. ¿Pueden compartir la misma salida regulada?

- ¿es seguro alimentar Huawei y LoRa desde la misma subrama?
- ¿o el Huawei mete variaciones que podrían afectar LoRa?
El Huawei no meteria variaciones. Aunque el Huawei estaria mas unido a la Jetson, el LoRa va mas al Ra-02

### D. ¿Quién los controla?

- ¿Jetson maneja ambos?
No
- ¿LoRa lo maneja Jetson o microcontrolador?
LoRa es un microcontrolador: ESP32

### E. ¿Qué prioridad tienen?

- WiFi
- Huawei
- LoRa
- almacenamiento local

## Definición preliminar

**Subrama de comunicaciones**

- módem Huawei
- LoRa
- alimentación regulada
- priorizada para conectividad, pero separada de sensores delicados si hay ruido o consumo variable

---

# 3. Subrama de visión/captura

Esta subrama incluye módulos cuya función es **captar imagen, profundidad o video**.

## Aquí entra

- **Kinect V1**
- **NCS2**

## Qué define esta subrama

Debes responder:

### A. ¿Qué voltaje requiere el Kinect?

12V

### B. ¿Qué corriente demanda?

1.08A

### C. ¿Cómo se conecta a la Jetson?

- USB
- alimentación independiente

### D. ¿Es una carga sensible o pesada?

Sensible

### E. ¿Qué pasa si el Kinect falla?

- ¿el sistema sigue funcionando sin Kinect?  
    Probablemente sí.  
    Eso lo convierte en periférico importante, pero no crítico para todo el sistema.
Continua el dispositivo

## Definición preliminar

**Subrama de visión/captura**

- Kinect V1
- línea regulada dedicada o semidedicada
- separada de sensado fino
- conectada a Jetson como dispositivo de captura

---
### Subrama de sensado

- pH
- temperatura
- turbidez
- BNO080

### Subrama de comunicaciones

- módem Huawei
- LoRa

### Subrama de visión/captura

- Kinect V1
- NCS2

---

- [x] Confirmar que los **propulsores + ESC** van por una ruta distinta a Jetson/Kinect
- [x] Confirmar que la Jetson no recibirá voltaje sin regulación adecuada
- [x] Confirmar que Kinect tampoco quedará conectado “a prueba”
- [x] Definir si usarás una **masa común**
Si, habra masa común
- [x] Escribir el criterio: qué va directo de batería y qué va regulado
Nada va a ir "directo" como tal a la bateria, siempre se va a pasar por algo antes de energizar

---

## 3. Regulación y protección


- [ ] Definir si necesitas uno o varios **DC-DC buck converters**

- [ ] Definir salida exacta para Jetson

- [ ] Definir salida exacta para Kinect

- [ ] Definir salida para módem Huawei si aplica

- [ ] Confirmar si sensores y LoRa salen desde 5V o 3.3V

- [ ] Definir si vas a colocar **fusible principal**

- [ ] Definir si vas a colocar **interruptor general**

- [ ] Definir si habrá **botón o sistema de STOP general**

- [ ] Confirmar polaridad de cada línea antes de energizar

- [ ] Revisar si el calibre de cable es suficiente para motores y batería

---

## 4. Diagrama de potencia v1

Antes de montar físico, debe existir un esquema, aunque sea rústico.

- [ ] Dibujar batería como fuente principal
- [ ] Dibujar rama a ESC 1
- [ ] Dibujar rama a ESC 2
- [ ] Dibujar rama a ESC 3
- [ ] Dibujar rama a regulador de Jetson
- [ ] Dibujar rama a regulador/periféricos
- [ ] Dibujar GND común
- [ ] Marcar interruptor general
- [ ] Marcar fusible o protección
- [ ] Marcar qué módulo enciende primero y cuál después

---

## 5. Secuencia de encendido y apagado

Esto te evita errores y daños.

- [x] Definir orden de encendido
Logica (Cerebro(Jetson), modulos (ESP32), sensores, etc), luego potencia (Motores)

1. Jetson (Jetson alimenta el resto de sensores y modulos)
2. Kinect
3. Propulsores

- [x] Definir orden de apagado
Primero potencia, luego logica

- [x] Decidir si primero energizas lógica y luego potencia
Primero logica, luego potencia

- [x] Decidir en qué punto se habilitan ESC
Antes de los propulsores, seria el penultimo punto en habilitarse

- [x] Definir condición de prueba segura: propulsores aislados o sin carga al inicio
Para la prueba, iran unicamente con la conexion RF y una conexion al microcontrolador (ESP32), para hacer pruebas de control de ambos metodos

- [ ] Dejar escrito el protocolo de prueba: “qué conecto primero, qué mido después”

---

## 6. Montaje físico inicial

Solo cuando lo anterior esté claro.

- [ ] Organizar cables por rama
- [ ] Etiquetar cables si es posible
- [ ] Revisar continuidad básica
- [ ] Revisar polaridad con multímetro
- [ ] Conectar primero reguladores sin cargas críticas
- [ ] Medir salida de reguladores sin conectar Jetson/Kinect
- [ ] Confirmar que la salida del regulador es correcta y estable
- [ ] Solo después considerar conectar módulos sensibles

---

## 7. Pruebas por etapas

No conectes todo a la vez.

- [ ] Probar batería → regulador → multímetro
- [ ] Probar rama lógica sola
- [ ] Probar rama periféricos sola
- [ ] Probar que no haya calentamiento extraño
- [ ] Probar que no haya caída brusca de voltaje
- [ ] Registrar resultados medidos
- [ ] Anotar cualquier anomalía

---

## 8. Cierre obligatorio del día

No se termina el día sin esto.

- [ ] Tener tabla final de voltajes y módulos
- [ ] Tener diagrama v1 listo
- [x] Tener criterio claro de qué va regulado y qué va directo
- [ ] Tener protocolo de encendido/apagado
- [ ] Tener lista de riesgos reales detectados
- [ ] Tener lista de materiales faltantes, si falta algo
- [ ] Marcar qué quedó validado y qué quedó pendiente

---
# Riesgos que debes vigilar hoy sí o sí

No los pierdas de vista:

- [x] conectar Jetson con voltaje incorrecto
- [x] alimentar Kinect desde una línea inadecuada
- [x] mezclar potencia de motores con lógica sin separación
- [x] no compartir GND cuando sí se necesita referencia común
- [x] invertir polaridad
- [x] probar todo junto “para ahorrar tiempo”
- [x] no medir antes de conectar

---

# Orden recomendado de ejecución hoy

Hazlo así, en este orden:

1. **tabla de consumos y voltajes**
2. **separación de ramas**
3. **regulación y protección**
4. **diagrama de potencia**
5. **secuencia de encendido**
6. **montaje físico inicial**
7. **pruebas por etapas**
8. **cierre y registro**

---
# Resultado mínimo esperado hoy

Al finalizar hoy, deberías poder decir:

- **sé exactamente cómo voy a alimentar cada módulo**
- **sé qué no debo conectar directo**
- **tengo una distribución clara**
- **tengo un procedimiento seguro de encendido**
- **ya reduje el riesgo de quemar componentes**
# Mini formato para que me reportes avance

**Día 1 - avance**

- Inventario: ...
- Voltajes identificados: ...
- Reguladores disponibles: ...
- Dudas actuales: ...
- Riesgo que veo: ...



# Lista Ideal: 
Cierro como **lista de compra realista para la fase de potencia**, pensada para que **puedas comprar, montar y validar rápido**, sin esperar todavía la PGB final. Tomé una decisión importante para ahorrar tiempo: **en esta fase no te mando a comprar ICs sueltos difíciles de integrar**, sino una mezcla de **protección marina/automotriz seria + módulos DC/DC listos para usar + monitoreo útil + arneses bien hechos**. Además, estoy asumiendo como escenario base **3 propulsores tipo APISQUEEN X5 de 500W / 20A** con **ESC APISQUEEN bidireccionales de 45A y soporte 3–6S**, porque esa es la combinación más cercana a lo que has venido manejando; si al final el propulsor real consume más de 20A, habrá que subir fusibles por rama y revisar el cableado de cada ESC.

## Decisión ejecutiva

Para tu proyecto yo haría esta fase así:

- **La batería entra por el XT90 que ya tienes**, pero **no seguiría distribuyendo potencia interna con XT90/XT60**.
- Inmediatamente después de la entrada de batería, pasaría a:
    - **fusible principal MRBF**,
    - **switch principal / kill-service switch**,
    - **bloque de distribución central con fusibles por rama**,
    - y desde ahí sacaría ramas separadas a:
        - **ESC1, ESC2, ESC3**,
        - **Jetson 12V**,
        - **Kinect 12V**,
        - **5V principal**,
        - **3.3V limpia**.  
            Esto es coherente con que la Jetson TK1 necesita **12V regulados** y no debe recibir la LiPo 5S directa.

---

# Lista de compra — Fase de potencia
## 1) Compra obligatoria ahora mismo

Esta es la lista que **sí compraría ya**.

|Cant.|Material / referencia|Decisión para M.A.N.G.O.|Uso|
|---|---|---|---|
|1|**Blue Sea MRBF Terminal Fuse Block 5191**|Sí|Portafusible principal cerca de batería|
|1|**MRBF 125A**|Sí|Fusible principal de batería|
|1|**Blue Sea SafetyHub 150 (7748)**|Sí|Centro de distribución y fusibles de ramas|
|3|**Fusibles MIDI/AMI 40A**|Sí|1 por cada ESC/propulsor|
|1|**Fusible MIDI/AMI 30A**|Sí|Rama electrónica general hacia reguladores|
|1|**Fusible ATO/ATC 7.5A**|Sí|Salida 12V Jetson|
|1|**Fusible ATO/ATC 5A**|Sí|Salida 12V Kinect|
|1|**Fusible ATO/ATC 10A**|Sí|Salida 5V principal|
|1|**Fusible ATO/ATC 5A**|Sí|Salida 3.3V / lógica auxiliar|
|1|**Blue Sea e-Series 9003e**|Sí|Switch principal / service disconnect / kill accesible|
|2|**Pololu D42V55F12 (12V, 4.5A)**|Sí|1 para Jetson, 1 para Kinect|
|1|**Pololu D36V50F5 (5V, 5.5A)**|Sí|Rama 5V principal|
|1|**Pololu D36V50F3 (3.3V, 6.5A)**|Sí|Rama 3.3V limpia|
|2 o 3|**Adafruit INA228 breakout**|Sí|Monitoreo de ramas moderadas: Jetson / 5V / Kinect|
|1|**Par XT90 anti-spark**|Sí, pero solo como interfaz batería|Entrada de batería al sistema|
|1|**Caja surtida ATO/ATC y MIDI/AMI de repuesto**|Sí|Repuestos y ajuste fino en pruebas|

### Por qué elegí estas piezas

El **MRBF 5191** está pensado para protección DC principal, acepta hasta **300A**, usa terminal M8 y trabaja hasta **58V DC**; el **MRBF** se monta muy cerca de batería, que es justo donde conviene el fusible principal. El **SafetyHub 150** te simplifica muchísimo la vida porque ya integra **4 posiciones de fusibles MIDI/AMI de 30–200A**, **6 posiciones ATO/ATC de 1–30A** y una **barra negativa**, además de cubierta sellada e IP66. El **switch 9003e** lo elijo como corte principal serio y mantenible desde carcasa.

### Nota importante sobre los fusibles por rama

Los **40A por ESC** los estoy eligiendo como decisión de proyecto para no ir demasiado justo si tus propulsores tienen picos de arranque, pero siguen por debajo del límite del ESC de 45A. Si al final tu propulsor real resulta más pequeño y estable, luego podemos bajar a 30A por rama. Esta parte es una **decisión de diseño**, no una cifra tomada de catálogo.

---

## 2) Cableado y terminales que sí debes comprar

Aquí no improvisaría.

|Cant.|Material|Decisión para M.A.N.G.O.|Uso|
|---|---|---|---|
|2 m rojo + 2 m negro|**Cable 4 AWG** (silicona flexible o marino estañado)|Sí|Batería → fusible principal → switch → distribución|
|3 pares según longitud real|**Cable 6 AWG** rojo/negro|Sí|Distribución → ESC1/ESC2/ESC3|
|2 pares según longitud real|**Cable 12 AWG** rojo/negro|Sí|Jetson 12V y Kinect 12V|
|1–2 pares según longitud real|**Cable 14 AWG** rojo/negro|Sí|Rama 5V principal|
|2–3 m|**Cable 20–22 AWG** (mejor trenzado para señal)|Sí|PWM + GND de señal hacia ESC|
|1 surtido|**Terminales de anillo M8 / 5⁄16"** para 4/6/12 AWG|Sí|SafetyHub, MRBF, switch y distribución|
|1 surtido|**Punteras/ferrules**|Sí|Entradas a borneras de módulos DC/DC|
|1 surtido|**Termorretráctil con adhesivo**|Sí|Sellado mecánico y eléctrico|
|1 surtido|**Prensaestopas / cable glands**|Sí|Paso seguro por carcasa|
|1|**Crimpadora seria para terminales grandes**|Sí|No improvisar terminales de potencia|
|1|**Crimpadora para ferrules y terminales pequeños**|Sí|Acabado limpio en lógica/señal|

### Mi criterio para los calibres

Las tablas marinas de ampacidad muestran que, como referencia general, **8 AWG** ronda **80A**, **6 AWG** ronda **120A** y **4 AWG** ronda **160A**, además de que el largo del recorrido y la caída de tensión importan mucho. Por eso, para tu caso:

- **4 AWG** en la línea principal de batería,
- **6 AWG** a cada rama de ESC,
- **12 AWG** a Jetson/Kinect,
- **14 AWG** a 5V,  
    me parece un punto de partida robusto y práctico.

### Decisión importante sobre XT90 / XT60

Yo **no compraría XT60** para esta fase. En los catálogos revisados, **XT60** aparece alrededor de **30A**, mientras que distintas variantes de **XT90** aparecen en el orden de **40–45A**. Como tu sistema completo puede superar eso en el peor escenario, mi recomendación es:

- dejar el **XT90 solo como entrada de batería**,
- y después pasar de inmediato a **fusible + switch + distribución atornillada con terminales de anillo**.

---

## 3) Materiales para fabricar / hacer tú mismo

Esto no se compra armado: lo haces tú.

### Arnés 1 — entrada principal de batería

- XT90 batería → MRBF principal → switch 9003e → SafetyHub 150

### Arnés 2 — propulsión

- SafetyHub → fusible ESC1 → ESC1
- SafetyHub → fusible ESC2 → ESC2
- SafetyHub → fusible ESC3 → ESC3

### Arnés 3 — rama Jetson

- SafetyHub → buck 12V Jetson → fusible de salida → **jack 5.5mm OD / 2.1mm ID centro positivo** hacia la Jetson TK1

### Arnés 4 — rama Kinect

- SafetyHub → buck 12V Kinect → fusible de salida → conector/cable de alimentación Kinect V1 360

### Arnés 5 — 5V / 3.3V

- SafetyHub → buck 5V → bus 5V
- bus 5V → regulador 3.3V
- bus 5V → pH / turbidez / USB lab
- 3.3V → ESP32-S3 / LoRa / MAX31865

### Arnés 6 — señal ESC

- PWM + GND de señal desde el controlador hacia cada ESC  
    Aquí **sí o sí** debes llevar **GND común de señal** con el PWM.

La Jetson TK1 usa un conector de alimentación **5.5mm externo / 2.1mm interno, centro positivo**, y la propia documentación del kit habla de **12V ±10%** y fuente incluida de **12V/5A**, así que ese arnés debe quedar bien hecho, no improvisado.

---

## 4) Monitoreo: qué comprar ahora y qué dejar para la PGB final

Aquí te hago una recomendación importante para no gastar mal.

### Sí comprar ahora

- **2 o 3 breakouts INA228**
    - 1 para rama Jetson
    - 1 para rama 5V
    - 1 opcional para rama Kinect

### No comprar todavía como solución definitiva

- **INA228 breakout para bus principal de batería o propulsión**  
    No te lo recomiendo como solución final para esa parte porque el breakout comercial de Adafruit usa un **shunt de 15 mΩ** y está pensado para **hasta 10A continuos** o alrededor de **2.75A** en modo de mayor resolución. Para tu bus principal y propulsión, eso se queda corto. Ahí conviene integrar el INA228 en la **PGB final** con un **shunt de mayor corriente** elegido para tu rama real.

---

## 5) Qué NO compraría todavía

Para ahorrar tiempo y plata, yo **no compraría aún** esto para la fase 1:

- **TPS2663 suelto**
- **TPS2121 suelto**
- **USB2514B suelto**
- **INA228 suelto para main bus**
- **conectores de PCB definitivos de la PGB**

¿La razón? Para la fase de validación, los módulos de Pololu ya te resuelven varias protecciones útiles:

- protección contra inversión,
- sobrecorriente,
- sobretemperatura,
- soft-start,
- y en varios casos también **power-good** y **enable**.  
    Luego, cuando cerremos la PGB, ahí sí compras los ICs y footprints definitivos.

---

## 6) Lista final cerrada para comprar ya

Si yo fuera tú, hoy mismo compraría esto:

**Protección y distribución**

- 1 × Blue Sea 5191
- 1 × MRBF 125A
- 1 × Blue Sea SafetyHub 150
- 3 × MIDI/AMI 40A
- 1 × MIDI/AMI 30A
- 1 × ATO 7.5A
- 1 × ATO 5A
- 1 × ATO 10A
- 1 × ATO 5A
- repuestos ATO/MIDI

**Corte principal**

- 1 × Blue Sea 9003e

**Conversión DC/DC**

- 2 × Pololu 12V D42V55F12
- 1 × Pololu 5V D36V50F5
- 1 × Pololu 3.3V D36V50F3

**Monitoreo**

- 2 × INA228 breakout
- 1 × INA228 breakout extra si el presupuesto aguanta

**Conectividad y entrada**

- 1 × par XT90 anti-spark
- 1 × jack 5.5/2.1 centro positivo para Jetson
- 1 × conector/cable de alimentación Kinect V1 360 si no lo tienes ya

**Cableado**

- 4 AWG rojo/negro
- 6 AWG rojo/negro
- 12 AWG rojo/negro
- 14 AWG rojo/negro
- 20–22 AWG señal
- terminales de anillo M8
- ferrules
- termorretráctil con adhesivo
- prensaestopas
- crimpadoras

---

## 7) Qué te voy a dar después sobre autonomía

Para la próxima, te saco la **autonomía en horas** en tres escenarios:

- **reposo / sensado**
- **navegación moderada**
- **peor caso con 3 propulsores + cómputo**

Pero para que salga bien, ahí sí voy a fijar estas hipótesis:

- consumo real de cada propulsor,
- si usarás Jetson + Kinect simultáneamente siempre o por momentos,
- y cuánto tiempo estarán activos los thrusters frente a la parte de sensado.

La lista de arriba ya está pensada para que puedas **comprar y arrancar la fase de potencia sin seguir esperando**.

# Riesgos que debes anticipar aquí

## Riesgo 1

Subdimensionar el regulador de la Jetson.

## Riesgo 2

Compartir la salida de la Jetson con demasiados módulos y causar reinicios.

## Riesgo 3

Meter en la misma rama módulos con consumo inestable.

## Riesgo 4

No diseñar qué pasa si la lógica cae y dejar propulsión viva.

## Riesgo 5

Tener GND mal definido y luego sufrir problemas de señal.