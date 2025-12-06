# Introducción
Los manglares colombianos, ecosistemas costeros de alta biodiversidad, son parte importante en la protección de las zonas ribereñas, convirtiéndolos en unos sistemas socio ecológicos altamente productivos. ![[PROBLEMATICA - DRAFTS#^1db977]] También, ![[PROBLEMATICA - DRAFTS#^ae0304]] 
Aunque las cifras anteriores, hablan de un ecosistema altamente rico y biodiverso, se enfrentan diariamente a una reducción y contaminación que no solo afecta al manglar, sino también a comunidades locales. ![[PROBLEMATICA - DRAFTS#^a7e501]] Asimismo, la carencia de información, la gestión manual de datos y la supervisión esporádica, propician una detección tardía de amenazas y retrasa aun mas, la toma de decisiones^[1]

Sin algún registro, de ![[PROBLEMATICA - DRAFTS#^d5d222]]y el aumento en la reducción y contaminación de hectáreas de manglares, se genera un alto impacto negativo ya que estos son los encargados de:
- Protección de las costas: Son un muro natural que protege las costas de tormentas y tsunamis.
+ Regulación de inundaciones: Los manglares regulan las inundaciones con la reducción de la fuerza con la que las olas llegan a las costas.
- Recarga de acuíferos: Los manglares filtran las aguas que abastecen a los mantos freáticos.
+ Fuente de alimentos: Los manglares son una fuente de alimentos para las personas de las comunidades costeras y para la vida silvestre.
- Desalinizan las aguas que ingresan en tierra firme

Basándome en estudios anteriores como el Informe del estado de los ecosistemas de manglar en Colombia elaborado por IDEAM (2022), la Evaluación de la salud ecosistémica de los manglares del Pacífico colombiano de INVEMAR (2023), y los trabajos pioneros sobre uso sostenible y recuperación de áreas degradadas realizados por el MinAmbiente (2010) y la EPA Canal del Dique (2010), así como las mediciones de contaminación por hidrocarburos en sedimentos del estuario del río Mira de Garcés y Espinosa (2019), la presente investigación se desarrollará mediante una combinación de métodos de revisión bibliográfica y análisis documental de las principales fuentes oficiales y académicas. Para el procesamiento de datos, se emplearán herramientas de análisis de datos y estadístico, de este modo, se podrá cuantificar cambios en la cobertura y salud de los manglares, así como evaluar niveles de contaminación. Finalmente, se realizara la construcción de un dispositivo capas de registrar autónomamente la cantidad y tipo de dato, que se necesita para estar informados acerca de la salud e integridad del socio ecosistema del manglar.
# Problemática:
Los manglares colombianos enfrentan retroceso acelerado por tala ilegal, contaminación y erosión costera (ej.: vía Tolú-Coveñas), con pérdidas de 7.269 ha entre 1996-2020. La gestión manual de datos retrasa la detección de amenazas, elevando la mortalidad de plántulas (>90%) y reduciendo su supervivencia a solo 1%. Esto afecta servicios ecosistémicos clave (protección contra inundaciones y economía local), poniendo en riesgo a 200.000 familias y un valor anual de USD 1.6 mil millones.
La carencia de información genera retrasos críticos en la toma de decisiones: acciones de reforestación y limpieza se planifican con datos incompletos, ocasionando bajas tasas de supervivencia de plántulas (solo 5 de cada 500 sobreviven) y desperdicio de recursos. La falta de registros automatizados incrementa errores en informes y reduce la efectividad de la conservación, afectando directamente a 200,000 familias costeras que dependen de estos ecosistemas para su sustento económico y protección contra inundaciones.
La gestión manual de datos y supervisión esporádica propician detección tardía de amenazas, agravando riesgos como:
1. Erosión costera por obras mal planificadas (ej. vía Tolú-Coveñas).
2. Pérdida de servicios ecosistémicos valorados en $1.6B USD/año
3. Reducción del 40% en especies marinas clave, impactando economías locales como las comunidades piangueras de Nariño. Esta situación exige soluciones tecnológicas para monitoreo autónomo y continuo.
%%- ## Justificación:%%
# Objetivos
## General
Construir un dispositivo autónomo que registre los datos de pH, turbidez y temperatura, para el registro y mantenimiento de la salud e integridad de los ecosistemas del manglar en el litoral Pacifico durante los años 2024-2025.
## Especifico

1. **Diseñar y ensamblar el prototipo electrónico del dispositivo**
    - **Qué**: Elaborar el esquema de hardware y carcasa, seleccionando microcontrolador, módulo de comunicaciones y fuentes de alimentación.
    - **Dónde**: En el taller de electrónica, con acceso a instrumentos de prototipado (impresora 3D, estación de soldadura, multímetro, osciloscopio).
    - **Cómo**:
        1. Hacer el diagrama eléctrico en software CAD (Fritzing, KiCad).
        2. Imprimir o mecanizar la carcasa en PLA/ABS.
        3. Ensamblar componentes y cableado; validar conexiones con pruebas de continuidad.
2. **Integrar y calibrar los sensores de pH, turbidez y temperatura**
    - **Qué**: Conectar los sensores específicos (sonda de pH analógica, sensor óptico de turbidez y termistor o DS18B20) al microcontrolador y ajustar sus rangos de lectura.
    - **Dónde**: Inicialmente en bancada de laboratorio; luego en banco de pruebas con agua de referencia (soluciones buffer de pH conocido, soluciones turbidez estándar y baño de temperatura controlada).
    - **Cómo**:
        1. Programar rutinas de muestreo en Arduino o ESP32.
        2. Realizar curvas de calibración: medir respuesta del sensor frente a estándares certificados.
        3. Implementar en el firmware la corrección matemática (ecuaciones de calibración) para cada sensor.
3. **Desarrollar el sistema de adquisición, transmisión y almacenamiento de datos**
    - **Qué**: Crear el software embebido que lea sensores, formatee datos y los envíe vía GSM/LoRa/Wi‑Fi a un servidor o base de datos en la nube.
    - **Dónde**:
        - En simulador de red (entorno de desarrollo de comunicaciones)
        - En campo, en estaciones de muestreo a lo largo del litoral Pacífico (Bahía Málaga, Golfo de Tribugá, estuario del río Mira).
    - **Cómo**:
        1. Implementar cliente MQTT o HTTP en el dispositivo.
        2. Configurar un servidor (por ejemplo, InfluxDB + Grafana o base de datos SQL).
        3. Validar la entrega de paquetes y gestionar reconexiones automáticas ante fallos.
4. **Realizar despliegues piloto y pruebas de campo en manglares seleccionados**
    - **Qué**: Instalar el dispositivo en puntos estratégicos de manglar para validar su funcionamiento en condiciones reales (salinidad, humedad, bioincrustación).
    - **Dónde**: Al menos tres sitios representativos del Pacífico colombiano (por ejemplo, manglares de Tumaco, Buenaventura y Nuquí).
    - **Cómo**:
        1. Coordinar con autoridades ambientales y comunidades locales.
        2. Fijar la unidad en estructuras flotantes o postes resistentes.
        3. Hacer lecturas continuas durante 1–2 meses, registrando también variables meteorológicas de apoyo.
5. **Analizar los datos recolectados y establecer umbrales de alerta para la salud del manglar**
    - **Qué**: Procesar la serie temporal de pH, turbidez y temperatura para identificar patrones, anomalías y tendencias.
    - **Dónde**: En tu centro de análisis de datos (laboratorio informático o servidor de la institución).
    - **Cómo**:
        1. Emplear herramientas de análisis (Python/Pandas, R) y GIS para correlacionar variaciones con eventos (marea, lluvia, vertidos).
        2. Definir valores críticos (umbrales) basados en literatura previa (IDEAM 2022; INVEMAR 2023).
        3. Generar reportes visuales (mapas, gráficos) y un sistema de notificación automática (SMS o correo) si algún parámetro excede los límites seguros.

# Marco Teórico
- **Sistemas Socio‑Ecológicos**
    
    - **Definición y alcance**: Un sistema socio‑ecológico integra los componentes naturales (ecosistema de manglar) y sociales (comunidades locales, instituciones) en una unidad interdependiente.
        
    - **Resiliencia y vulnerabilidad**: Se analizan los principios de resiliencia para entender cómo los manglares responden a perturbaciones (cambios en salinidad, contaminación) y los factores que aumentan su vulnerabilidad (deforestación, expansión de infraestructura).
        
    - **Gobernanza adaptativa**: Se fundamenta en ciclos de monitoreo, aprendizaje y ajuste de estrategias de manejo, enfatizando la retroalimentación entre datos ambientales y toma de decisiones.
        
- **Calidad de Agua en Ecosistemas Costeros**
    
    - **Parámetros físico‑químicos clave**:
        
        - _pH_: indicador de acidez o alcalinidad, crítico para el metabolismo de la biota de manglar.
            
        - _Turbidez_: refleja la carga de materia en suspensión, asociada a erosión y descargas contaminantes.
            
        - _Temperatura_: regula procesos bioquímicos y la solubilidad de gases y nutrientes.
            
    - **Relación con la salud biológica**: Cambios fuera de rangos óptimos afectan la productividad primaria, la descomposición de materia orgánica y la dinámica de nutrientes.
        
- **Tecnologías de Monitoreo Autónomo**
    
    - **Sensores in situ**:
        
        - _Sensores de pH_: basados en electrodos de vidrio o semiconductores ISFET, requieren calibración con soluciones buffer.
            
        - _Sensores de turbidez_: utilizan métodos ópticos (LED y fotodetector) para estimar la concentración de partículas.
            
        - _Sensores de temperatura_: típicamente termistores o termopares, con respuesta rápida y alta precisión.
            
    - **Plataforma embebida y comunicaciones**:
        
        - _Microcontroladores_ (Arduino, ESP32) como cerebro del dispositivo.
            
        - _Protocolos IoT_ (MQTT, HTTP) para transmisión de datos vía GSM, LoRa o Wi‑Fi.
            
- **Análisis de Datos Ambientales**
    
    - **Series temporales y estadística descriptiva**: Detección de tendencias, variabilidad estacional y anomalías mediante medias móviles y coeficientes de variación.
        
    - **Sistemas de Información Geográfica (SIG)**: Georreferenciación de puntos de muestreo, generación de mapas temáticos de distribución de parámetros.
        
    - **Umbrales de alerta temprana**: Definición de valores críticos con base en literatura y normativa, activación de notificaciones automáticas cuando se exceden límites seguros.

%%Marco Referencial - Marco Contextual - Marco Conceptual%% 
# Bibliografía
![[fuentes_manglares_proyecto#^55bad5]]

1. IDEAM. (2022). _Informe técnico del estado de los ecosistemas de manglar en Colombia_. [Ver PDF](https://www.ideam.gov.co/sites/default/files/transparencia/planeacion/informe_de_gestion_2024_0.pdf)
2. INVEMAR. (2023). _Evaluación de la salud ecosistémica de los manglares del Pacífico colombiano_. [Ver PDF](https://www.invemar.org.co/documents/37438/112976/informe+integral+anual+PICIA+2023+1.pdf/6bbf13b1-a6aa-183c-8612-c5a41c8dd580?t=1738780208854)
3. MinAmbiente. (2010). _Uso sostenible, manejo y conservación de los ecosistemas de manglar en Colombia_. [Ver PDF](https://www.minambiente.gov.co/consulta/actualizacion-programa-para-el-uso-sostenible-manejo-y-conservacion-de-los-ecosistemas-de-manglar-en-colombia/)
4. EPA Canal del Dique. (2010). _Los manglares de Colombia y la recuperación de sus áreas degradadas_. [Ver PDF](https://www.redalyc.org/pdf/617/61790101.pdf)
5. Garcés, O., & Espinosa, L. F. (2019). _Contaminación por hidrocarburos en sedimentos de manglar del estuario del río Mira_. [Ver PDF](https://boletin.invemar.org.co/ojs/index.php/boletin/article/view/836)
6. MinAmbiente. (1997). _Resolución 257 de 1997 - Lineamientos nacionales para el monitoreo del manglar en Colombia_. [Ver PDF](https://www.minambiente.gov.co/wp-content/uploads/2021/10/Anexo-5.-Lineamientos-nacionales-para-el-monitoreo-del-manglar-en-Colombia.pdf)
7. Álvarez, J. (2011). _Una revisión sobre los manglares: características, problemáticas y su marco jurídico_. [Ver PDF](https://uaim.edu.mx/webraximhai/Ej-21articulosPDF/05REVISION_SOBRE_MANGLARES_CARACTERISTICAS.pdf)
8. El País. (2023). _Frenemos la deforestación de los manglares_. [Ver PDF](https://elpais.com/planeta-futuro/red-de-expertos/2023-07-31/frenemos-la-deforestacion-de-los-manglares.html)
9. Donato, D. C., Kauffman, J. B., Murdiyarso, D., Kurnianto, S., Stidham, M., & Kanninen, M. (2011). _Mangroves among the most carbon-rich forests in the tropics_. _Nature Geoscience_. [Ver PDF](https://www.nature.com/articles/ngeo1123.epdf)
10. Revista Semillas. (2002). _Un problema por abordar: los manglares del Caribe colombiano_. [Ver PDF](https://www.semillas.org.co/es/un-problema-por-abordar-los-manglares-del-caribe-colombiano)
11. El Tiempo. (2019). _Pacífico colombiano pierde cada año más de mil hectáreas de manglar_. [Ver PDF](https://www.eltiempo.com/vida/medio-ambiente/pacifico-colombiano-pierde-cada-ano-mas-de-mil-hectareas-de-manglar-712885)
12. ONU Medio Ambiente. (2023). _Una mirada al interior de la belleza y los beneficios de los manglares_. [Ver PDF](https://www.unep.org/es/noticias-y-reportajes/reportajes/una-mirada-al-interior-de-la-belleza-y-los-beneficios-de-los)
13. MinAmbiente. (2021). _Los manglares, una fuente de vida que Colombia conserva_. [Ver PDF](https://www.minambiente.gov.co/los-manglares-una-fuente-de-vida-que-colombia-conserva/)
14. DANE. (s.f.). _Hacia una cuenta de bosque para Colombia_. [Ver PDF](https://www.dane.gov.co/files/investigaciones/pib/ambientales/PI_Hacia_una_cuenta_de_bosque_para_colombia.pdf)
15. Radio Nacional de Colombia. (2023). _Colombia y sus manglares: la importancia para la conservación de especies marinas_. [Ver PDF](https://www.radionacional.co/actualidad/medio-ambiente/manglares-en-colombia-cruciales-en-la-conservacion-de-especies-marinas)
16. Fundación MarViva. (2016). _La Piangua: conservando los manglares_. [VIDEO](https://www.youtube.com/watch?v=TmFqZ0LPYc8)
17. MinAmbiente. (2019). _10 ecosistemas para enamorarse de Colombia_. [Ver PDF](https://www.minambiente.gov.co/10-ecosistemas-para-enamorarse-de-colombia/)
18. FAO. (2023). _Se intensifican los esfuerzos mundiales por proteger los manglares_. [Ver PDF](https://www.fao.org/newsroom/detail/global-effort-to-safeguard-mangroves-steps-up/es)
19. FAO. (2023). _Desentrañar los secretos de los manglares_. [Ver PDF](https://www.fao.org/interactive/remote-sensing-mangroves/es/)
20. FAO. (2017). _Restauración y gestión del ecosistema de manglares_. [Ver PDF](https://www.fao.org/sustainable-forest-management/toolbox/modules-alternative/mangroves-and-coastal-forests/basic-knowledge/es/)
21. SEMARNAT - Gobierno de México. (2016). _Los manglares mexicanos_. [Ver PDF](https://www.gob.mx/semarnat/articulos/manglares-mexicanos)
22. Observatorio Cartagena. (2016). _Ecosistema de manglar_. [Ver PDF](https://observatorio.epacartagena.gov.co/wp-content/uploads/2016/09/ECOSISTEMA-DE-MANGLAR-septiembre-1-de-2016-2-.pdf)
23. INVEMAR. (2015). _Informe del estado de los ambientes y recursos marinos y costeros de Colombia_. [Ver PDF](https://www.invemar.org.co/redcostera1/invemar/docs/ier_2015_baja.pdf)
24. INVEMAR. (2004). _Estado de los estudios y manglares en Colombia_. [Ver PDF](https://www.invemar.org.co/redcostera1/invemar/docs/EAMC_2004/06Estuariosmanglares.pdf)
25. Fundación Comfenalco. (2010). _Mangles de Cartagena de Indias: patrimonio biológico y fuente de biodiversidad_. [Ver PDF](https://observatorio.epacartagena.gov.co/wp-content/uploads/2016/10/MANGLES-DE-CARTAGENA.pdf)
26. Escuela Superior de Administración Pública (ESAP). (2000). _Uso sostenible, manejo y conservación de los ecosistemas de manglar en Colombia_. [Ver PDF](https://repositoriocdim.esap.edu.co/bitstream/handle/20.500.14471/65/Ecosistemas%20de%20manglar.pdf?sequence=1&isAllowed=y)
27. Álvarez-León, R. (2003). _Los manglares de Colombia y la recuperación de sus áreas degradadas: revisión bibliográfica y nuevas experiencias_. _Madera y Bosques_, 9(1), 3–25. [[27-GA-Los manglares de Colombia y la Recuperación de sus areas degradadas.pdf|Ver PDF]]
28. Ministerio del Medio Ambiente. (2002). _Programa nacional para el uso sostenible, manejo y conservación de los ecosistemas de manglar en Colombia_. Dirección General de Ecosistemas. [[28-GA-Programa-Nacional-uso-sostenible-manejo-y-conservacion-de-los-ecosistemas-de-manglar.pdf|Ver PDF]]
29. Herrera-Carmona, J. C., Prüssmann-Uribe, J., Abud-Hoyos, M., & Zapata-Padilla, L. A. (2024). _Análisis de vulnerabilidad y riesgo climático del socioecosistema de manglar en Colombia_. _Boletín de Investigaciones Marinas y Costeras_, 53(2), 103–132. [[29-GA-Analisis de Vulnerabilidad y Riesgo Climatico del Sociecosistema de manglar en Colombia.pdf|Ver PDF]]
