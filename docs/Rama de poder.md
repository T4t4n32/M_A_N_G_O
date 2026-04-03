# Rama de potencia

## 1. Qué es la rama de potencia

La rama de potencia de M.A.N.G.O. es el subsistema encargado de **recibir, proteger, distribuir, convertir, supervisar y habilitar** la energía del proyecto. No se plantea como una sola línea de alimentación, sino como una **arquitectura de potencia por dominios**, porque el sistema combina una batería LiPo 5S de alta energía, cargas de cómputo sensibles como la Jetson TK1, electrónica de control a 3.3V y una etapa de propulsión con ESC y motores que puede generar picos altos de corriente. La Jetson TK1, además, requiere una entrada de **12V ±10%** y puede dañarse si se supera cierto umbral, por lo que no puede alimentarse directamente desde la batería 5S. ([NVIDIA Developer Downloads](https://developer.download.nvidia.com/embedded/jetson/TK1/docs/Jetson_TK1_FAQ_2014May01_V2.pdf?utm_source=chatgpt.com "Q&A Jetson TK1 FAQ:"))

## 2. Objetivo de esta rama

El objetivo de esta rama no es solo “dar voltaje”, sino hacerlo de forma **segura, estable, separada por funciones y supervisada en tiempo real**. Por eso la arquitectura se definió para cumplir cinco metas al mismo tiempo: proteger la entrada de batería, evitar que una falla de una carga tumbe todo el sistema, entregar a cada subsistema el nivel de tensión correcto, mantener una referencia de señal válida sin contaminar las etapas sensibles y medir consumo real para estimar autonomía y detectar fallas. Esa necesidad se justifica por la combinación de batería 5S, ESC bidireccionales APISQUEEN de **3–6S / 12–24V**, Jetson a 12V, y lógica basada en ESP32-S3 a 3.3V. ([Underwater Thruster](https://www.underwaterthruster.com/en-ca/products/apisqueen-12-24v-3-6s-lipo-45a-bi-directional-esc-to-control-brushless-motors-propellers-in-forward-or-reverse-rotation?utm_source=chatgpt.com "APISQUEEN 12-24V (3-6S LiPo) 45A bi-directional ESC to control brushle – Underwater Thruster"))

## 3. Cómo se estructura

La estructura final propuesta es la siguiente:

**Batería LiPo 5S → protección de entrada → monitoreo principal → habilitación y soft-power → distribución por ramas → regulación por dominio → cargas finales.**

A partir de esa idea general, la energía se divide en cinco dominios reales:

1. **Dominio de entrada y protección**
    
2. **Dominio de propulsión**
    
3. **Dominio de cómputo a 12V**
    
4. **Dominio de 5V principal**
    
5. **Dominio de 3.3V limpio**
    

Esta separación no es decorativa. Se definió así porque la propulsión tiene comportamiento eléctrico muy distinto a la Jetson y a la lógica, y porque el sistema necesita que un fallo en una rama no apague todo el dispositivo. La documentación de la Jetson TK1 refuerza esa decisión al exigir 12V controlados, mientras que el ESP32-S3 exige una alimentación estable de 3.3V con capacidad de al menos 500 mA. ([NVIDIA Developer Downloads](https://developer.download.nvidia.com/embedded/jetson/TK1/docs/Jetson_TK1_FAQ_2014May01_V2.pdf?utm_source=chatgpt.com "Q&A Jetson TK1 FAQ:"))

## 4. Dominio 1: entrada, protección y control general

La batería principal será una **LiPo 5S** de aproximadamente **18.5V nominales** y cerca de **21V completamente cargada**. Como esa entrada tiene alta energía y capacidad de corriente, la primera etapa de la rama será una **protección multicapa** compuesta por: fusible principal, protección contra inversión de polaridad, supresión de transitorios y una etapa de control de encendido/apagado. Para la parte electrónica moderada, una solución tipo **TPS2663** es coherente con este enfoque porque añade protección contra sobretensión, subtensión, sobrecorriente, cortocircuito, corriente inversa, apagado térmico y arranque controlado. ([Texas Instruments](https://www.ti.com/product/INA228?utm_source=chatgpt.com "INA228 data sheet, product information and support | TI.com"))

## 5. Dominio 2: propulsión

La propulsión se plantea como una **rama separada de alta corriente**, alimentada desde el bus de batería protegido, con distribución central y **una salida independiente por cada ESC**. Eso significa que los tres ESC no irán en serie ni en una sola cadena improvisada, sino en **paralelo respecto al bus principal**, cada uno con su propia protección por rama. Esta decisión se tomó porque los ESC APISQUEEN de 45A soportan **3–6S LiPo** y control PWM **1–2 ms**, por lo que pueden trabajar con la batería 5S, pero el peor escenario de arranque simultáneo o alta exigencia mecánica puede generar caídas de tensión y transitorios que no deben contaminar la lógica ni el cómputo. ([Underwater Thruster](https://www.underwaterthruster.com/en-ca/products/apisqueen-12-24v-3-6s-lipo-45a-bi-directional-esc-to-control-brushless-motors-propellers-in-forward-or-reverse-rotation?utm_source=chatgpt.com "APISQUEEN 12-24V (3-6S LiPo) 45A bi-directional ESC to control brushle – Underwater Thruster"))

## 6. Dominio 3: cómputo a 12V

La Jetson TK1 y el Kinect V1 360 no compartirán una única rama común, sino que se alimentarán mediante **ramas independientes de 12V**, cada una con su propio convertidor buck y su propia protección. Esa decisión se tomó por seguridad y continuidad operativa: si la Kinect falla o se sobreconsume, la Jetson no debe apagarse por arrastre, y viceversa. En el caso de la Jetson, esto es especialmente importante porque NVIDIA especifica una entrada de **12V ±10%**, advierte riesgo por encima de **16V** y señala que el kit incluía una fuente de **12V / 5A**, lo cual confirma que la alimentación de cómputo debe ser regulada y dedicada. ([NVIDIA Developer Downloads](https://developer.download.nvidia.com/embedded/jetson/TK1/docs/Jetson_TK1_FAQ_2014May01_V2.pdf?utm_source=chatgpt.com "Q&A Jetson TK1 FAQ:"))

## 7. Dominio 4: rama principal de 5V

La rama de 5V se definió como el dominio intermedio del sistema. Su función será alimentar sensores y módulos que requieren 5V, respaldar la parte de laboratorio y servir como base para generar la rama limpia de 3.3V. Esta rama nacerá de un **buck dedicado desde la batería** y además aceptará respaldo desde **USB-C**, pero solo como fuente de mantenimiento, programación y pruebas, no como fuente principal del sistema completo. El estándar USB-C como sink requiere **resistencias de 5.1 kΩ en CC1 y CC2**, y sin USB Power Delivery se limita a **5V** y hasta **3A**, por lo que su papel aquí es de respaldo de 5V y no de alimentación total de una plataforma con propulsión. ([Espressif Systems](https://docs.espressif.com/projects/esp-iot-solution/en/latest/usb/usb_overview/usb_typec_hardware_guide.html?utm_source=chatgpt.com "USB Type-C Hardware Design Guide - - — ESP-IoT-Solution latest documentation"))

## 8. Dominio 5: rama limpia de 3.3V

Desde la rama de 5V se generará una salida de **3.3V limpia**, reservada para la electrónica sensible: **ESP32-S3, LoRa Ra-02, MAX31865 y módulos opcionales como IMU o GPS**. Esta rama no debe compartir el mismo entorno eléctrico que la propulsión ni que los convertidores de alta corriente. La razón es que el ESP32-S3 trabaja entre **3.0 y 3.6V**, recomienda **3.3V** y una fuente de al menos **500 mA**, y además el pin **CHIP_PU / EN** no debe quedar flotante. Esa necesidad de estabilidad justifica una rama limpia, desacoplada y físicamente separada de los retornos ruidosos. ([Espressif Systems](https://docs.espressif.com/projects/esp-techpedia/en/latest/esp-friends/get-started/try-firmware/try-firmware-hardware/esp32s3.html?utm_source=chatgpt.com "ESP32-S3 - - — ESP-Techpedia latest documentation"))

## 9. Lógica de habilitación: por qué no se arma todo al conectar batería

Una de las decisiones más importantes es que **conectar batería no equivale a dejar la propulsión armada**. La secuencia correcta será de dos niveles: primero una **habilitación física del sistema** y después una **habilitación lógica de la propulsión**. Esto se eligió porque los ESC APISQUEEN requieren que, al encender, el controlador entregue **1.5 ms** como neutro para el auto-test; solo después de ese self-test se debe permitir avance o reversa. Por eso, la propuesta final es: batería conectada → protección y arranque controlado → electrónica de control activa → PWM en neutro → validación → armado lógico de los ESC. ([Underwater Thruster](https://www.underwaterthruster.com/en-ca/products/apisqueen-12-24v-3-6s-lipo-45a-bi-directional-esc-to-control-brushless-motors-propellers-in-forward-or-reverse-rotation?utm_source=chatgpt.com "APISQUEEN 12-24V (3-6S LiPo) 45A bi-directional ESC to control brushle – Underwater Thruster"))

## 10. Tierra, retorno y referencia de señal

El sistema **sí necesita referencia común de señal** entre controlador y ESC para que el PWM sea válido. La documentación de PX4 lo resume de forma muy clara: no existe un cableado PWM correcto sin una referencia de tierra compartida para la señal. Sin embargo, eso no significa mezclar sin criterio todos los retornos de potencia. La solución adoptada es usar un **retorno común interno del sistema**, pero con **retornos separados por función**: propulsión, lógica, analógico y RF. Esos retornos solo se unen de forma controlada en la PGB. Eso permite tener señal válida para PWM y, al mismo tiempo, evita que la corriente grande de los motores pase por la misma ruta que sensores y lógica. ([PX4 Documentation](https://docs.px4.io/v1.14/en/peripherals/pwm_escs_and_servo.html?utm_source=chatgpt.com "PWM Servos and ESCs (Motor Controllers) | PX4 User Guide (v1.14)"))

## 11. Por qué no se usa el agua como “tierra”

El sistema no utilizará el mar ni el agua como retorno eléctrico. Toda la corriente de retorno será **interna y controlada** dentro del sistema. Esa decisión se tomó por seguridad eléctrica y por corrosión: la corriente continua que fuga por caminos no intencionados puede generar **stray current corrosion**, es decir, corrosión acelerada por corriente parásita. La literatura técnica y guías de industria coinciden en que la corriente DC que encuentra un camino alterno fuera del circuito previsto produce corrosión severa en estructuras metálicas y componentes expuestos. ([Caltrans](https://dot.ca.gov/-/media/dot-media/programs/engineering/documents/corrasion/corrosionchapters/202507corrosionguidelineschapter13-a11y.pdf?utm_source=chatgpt.com "Corrosion Guidelines"))

## 12. Monitoreo y autonomía

La rama de potencia no se diseñó como una caja negra. Se incluyó monitoreo porque era necesario conocer voltaje, corriente, potencia y energía real consumida por el sistema. Para eso encaja muy bien un monitor como el **INA228**, que mide **voltaje de bus, corriente, potencia, energía y carga acumulada**, con rango de medición de hasta **85V** y resolución de **20 bits**. En la propuesta final, el monitoreo se considera obligatorio al menos en la entrada principal y recomendable en ramas críticas como Jetson y propulsión. Eso permitirá calcular autonomía real, detectar sobreconsumos y saber qué subsistema está drenando más energía. ([Texas Instruments](https://www.ti.com/product/INA228?utm_source=chatgpt.com "INA228 data sheet, product information and support | TI.com"))

## 13. Variables consideradas para llegar a esta arquitectura

La rama quedó definida así después de considerar de manera conjunta estas variables:

- **Tipo de batería**: LiPo 5S, alta energía y alto riesgo si no se protege. ([Underwater Thruster](https://www.underwaterthruster.com/en-ca/products/apisqueen-12-24v-3-6s-lipo-45a-bi-directional-esc-to-control-brushless-motors-propellers-in-forward-or-reverse-rotation?utm_source=chatgpt.com "APISQUEEN 12-24V (3-6S LiPo) 45A bi-directional ESC to control brushle – Underwater Thruster"))
    
- **Tensión requerida por la Jetson**: 12V regulados, con límites claros de operación. ([NVIDIA Developer Downloads](https://developer.download.nvidia.com/embedded/jetson/TK1/docs/Jetson_TK1_FAQ_2014May01_V2.pdf?utm_source=chatgpt.com "Q&A Jetson TK1 FAQ:"))
    
- **Tensión y estabilidad requeridas por la lógica**: 3.3V limpio para ESP32-S3 y periféricos sensibles. ([Espressif Systems](https://docs.espressif.com/projects/esp-techpedia/en/latest/esp-friends/get-started/try-firmware/try-firmware-hardware/esp32s3.html?utm_source=chatgpt.com "ESP32-S3 - - — ESP-Techpedia latest documentation"))
    
- **Compatibilidad de los ESC con 5S**: soporte real de 3–6S y secuencia de arranque por PWM neutro. ([Underwater Thruster](https://www.underwaterthruster.com/en-ca/products/apisqueen-12-24v-3-6s-lipo-45a-bi-directional-esc-to-control-brushless-motors-propellers-in-forward-or-reverse-rotation?utm_source=chatgpt.com "APISQUEEN 12-24V (3-6S LiPo) 45A bi-directional ESC to control brushle – Underwater Thruster"))
    
- **Necesidad de referencia de tierra de señal**: PWM requiere GND común de señal. ([PX4 Documentation](https://docs.px4.io/v1.14/en/peripherals/pwm_escs_and_servo.html?utm_source=chatgpt.com "PWM Servos and ESCs (Motor Controllers) | PX4 User Guide (v1.14)"))
    
- **Riesgo de picos de corriente y caídas de tensión**: especialmente en arranques simultáneos de propulsión. Esto es una inferencia de diseño basada en los límites del ESC, la batería y la coexistencia con cómputo sensible. ([Underwater Thruster](https://www.underwaterthruster.com/en-ca/products/apisqueen-12-24v-3-6s-lipo-45a-bi-directional-esc-to-control-brushless-motors-propellers-in-forward-or-reverse-rotation?utm_source=chatgpt.com "APISQUEEN 12-24V (3-6S LiPo) 45A bi-directional ESC to control brushle – Underwater Thruster"))
    
- **Necesidad de respaldo de laboratorio por USB-C**: útil para debug y mantenimiento, pero no como fuente principal de todo el sistema. ([Espressif Systems](https://docs.espressif.com/projects/esp-iot-solution/en/latest/usb/usb_overview/usb_typec_hardware_guide.html?utm_source=chatgpt.com "USB Type-C Hardware Design Guide - - — ESP-IoT-Solution latest documentation"))
    
- **Necesidad de diagnóstico y autonomía**: resuelta con monitoreo digital por corriente/energía. ([Texas Instruments](https://www.ti.com/product/INA228?utm_source=chatgpt.com "INA228 data sheet, product information and support | TI.com"))
    
- **Condición de trabajo en ambiente marino**: evita usar el agua como retorno y obliga a contener todas las corrientes dentro del sistema. ([Caltrans](https://dot.ca.gov/-/media/dot-media/programs/engineering/documents/corrasion/corrosionchapters/202507corrosionguidelineschapter13-a11y.pdf?utm_source=chatgpt.com "Corrosion Guidelines"))
    

## 14. Definición final

En su forma definitiva, la rama de potencia de M.A.N.G.O. se define así:

> **La rama de potencia de M.A.N.G.O. es una arquitectura de alimentación protegida y jerarquizada, diseñada para recibir energía desde una batería LiPo 5S, protegerla desde la entrada, supervisarla eléctricamente, habilitarla de forma controlada y distribuirla por dominios independientes de propulsión, cómputo, 5V y 3.3V limpio. Su estructura separa cargas de alta corriente de la electrónica sensible, conserva la referencia común de señal cuando es necesaria, evita retornos no controlados y permite estimar autonomía real mediante monitoreo de energía. Se estructuró de ese modo porque el sistema combina cargas con requisitos eléctricos muy distintos —Jetson a 12V, lógica a 3.3V, sensores a 5V y ESC de 3–6S— y porque la prioridad del diseño es seguridad, estabilidad y continuidad operativa ante fallas o picos de consumo.** ([NVIDIA Developer Downloads](https://developer.download.nvidia.com/embedded/jetson/TK1/docs/Jetson_TK1_FAQ_2014May01_V2.pdf?utm_source=chatgpt.com "Q&A Jetson TK1 FAQ:"))

## 15. Versión corta para responder en exposición

> **La rama de potencia no se diseñó como una sola línea, sino como un sistema por dominios. Primero protege la entrada de la batería 5S, luego monitorea y habilita la energía, y después la distribuye en ramas separadas para propulsión, Jetson, Kinect, 5V y 3.3V limpio. Se hizo así porque la Jetson necesita 12V regulados, el ESP32-S3 necesita 3.3V estable, los ESC trabajan con 3–6S y la propulsión genera picos que no pueden contaminar la lógica. Además, el sistema mantiene tierra común de señal donde hace falta, pero con retornos controlados, y nunca usa el agua como retorno eléctrico.** ([NVIDIA Developer Downloads](https://developer.download.nvidia.com/embedded/jetson/TK1/docs/Jetson_TK1_FAQ_2014May01_V2.pdf?utm_source=chatgpt.com "Q&A Jetson TK1 FAQ:"))
