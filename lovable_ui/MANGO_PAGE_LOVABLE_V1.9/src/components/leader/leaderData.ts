export interface MediaItem {
  type: "image" | "video";
  src: string;
  alt: string;
  subcategory?: string;
}

export interface SeasonData {
  id: string;
  name: string;
  year: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
  role: string;
  evolution: string;
  learnings: string;
  media: MediaItem[];
}

export interface MilestoneData {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  description: string;
  narrative: string;
  importance: string;
  span2?: boolean;
  media: MediaItem[];
}

export const seasons: SeasonData[] = [
  {
    id: "cargo-connect",
    name: "Cargo Connect",
    year: "2021–2022",
    icon: "/images/fll/cargo-connect.png",
    color: "hsl(142 60% 45%)",
    glowColor: "rgba(34,197,94,0.25)",
    description: "Primer gran paso en FLL — dos equipos del colegio, aprendizaje técnico y base en equipo.",
    role: "Miembro activo de Monkeys United — apoyo en carteleras, presentación del proyecto y necesidades del equipo.",
    evolution: "Primera experiencia real en FLL Challenge junto a Lego Girls, ambos equipos de Comfandi El Prado. Descubrimiento del robot game, el proyecto de innovación y los valores fundamentales.",
    learnings: "Trabajo en equipo, LEGO Mindstorms, resolución de problemas y la importancia de comunicar el trabajo realizado.",
    media: [
      { type: "image", src: "/images/gallery/leader/diploma_cargo_connect.jpg", alt: "Diploma FLL Cargo Connect — Nacional", subcategory: "Evento" },
      { type: "image", src: "/images/gallery/leader/cargo_connect_1.png", alt: "Con mamá frente al poster FASTY", subcategory: "Evento" },
      { type: "image", src: "/images/gallery/leader/cargo_connect_2.png", alt: "Mesa de juego del robot — Nacional FLL", subcategory: "Evento" },
      { type: "image", src: "/images/gallery/leader/cargo_connect_3.png", alt: "Banner FIRST LEGO LEAGUE — sede del evento", subcategory: "Evento" },
      { type: "image", src: "/images/gallery/leader/cargo_connect_4.png", alt: "Stand del equipo — presentación del robot", subcategory: "Stand" },
      { type: "image", src: "/images/gallery/leader/cargo_connect_5.png", alt: "Zona de pits — programación en equipo", subcategory: "Equipo" },
      { type: "image", src: "/images/gallery/leader/cargo_connect_6.png", alt: "Stand completo Monkeys United — FASTY", subcategory: "Stand" },
    ],
  },
  {
    id: "superpowered",
    name: "SUPERPOWERED",
    year: "2022–2023",
    icon: "/images/fll/superpowered.png",
    color: "hsl(25 95% 55%)",
    glowColor: "rgba(249,115,22,0.25)",
    description: "Evolución y nueva perspectiva — vivir la FLL en otra ciudad y compartir la experiencia entre equipos.",
    role: "Miembro activo de Monkeys United — creciente interés por el proyecto de innovación sin dejar el robot game.",
    evolution: "Sede diferente en Bogotá, otra perspectiva. De nuevo dos equipos de Comfandi El Prado — Monkeys United y Lego Girls — compartiendo la competencia y fortaleciendo lazos.",
    learnings: "Estrategia competitiva, comunicación con jueces y el valor de vivir la FLL en un entorno nuevo.",
    media: [
      { type: "image", src: "/images/gallery/leader/superpowered_1.png", alt: "Equipo reunido en círculo — Robotic Club", subcategory: "Equipo" },
      { type: "image", src: "/images/gallery/leader/superpowered_2.png", alt: "Sebastián liderando charla grupal", subcategory: "Equipo" },
      { type: "image", src: "/images/gallery/leader/superpowered_3.png", alt: "Grupo Lego Girls reunido en el evento", subcategory: "Equipo" },
      { type: "image", src: "/images/gallery/leader/superpowered_4.png", alt: "Reunión grupal con mentor — estrategia", subcategory: "Equipo" },
      { type: "image", src: "/images/gallery/leader/superpowered_5.png", alt: "Sebastián en mesa de juego del robot — Mesa 05", subcategory: "Competencia" },
      { type: "image", src: "/images/gallery/leader/superpowered_6.png", alt: "Robot game en acción — Mesa 05", subcategory: "Competencia" },
      { type: "image", src: "/images/gallery/leader/superpowered_7.png", alt: "Vista panorámica mesas de competencia", subcategory: "Competencia" },
      { type: "image", src: "/images/gallery/leader/superpowered_8.png", alt: "Equipos compitiendo — Mesas 03 y 04", subcategory: "Competencia" },
      { type: "image", src: "/images/gallery/leader/superpowered_9.png", alt: "Stand Monkeys United — compañeros en pit", subcategory: "Stand" },
      { type: "image", src: "/images/gallery/leader/superpowered_10.png", alt: "Stand completo Monkeys United — Mesa 03", subcategory: "Stand" },
    ],
  },
  {
    id: "masterpiece",
    name: "MASTERPIECE",
    year: "2023–2024",
    icon: "/images/fll/masterpiece.png",
    color: "hsl(270 60% 60%)",
    glowColor: "rgba(168,85,247,0.25)",
    description: "Consolidación competitiva — 1er Puesto Nacional y clasificación al campeonato mundial.",
    role: "Miembro activo de CALIBOTS — enfocado en el proyecto de innovación, diseño visual y presentación ante jueces. Las decisiones clave se tomaban en equipo.",
    evolution: "Unificación de Monkeys United y Lego Girls en un solo equipo: CALIBOTS, nombre nacido de Cali y la robótica. Con el apoyo de padres, profesores y compañeros, se logró el primer puesto nacional — el mayor hito hasta la fecha — y la clasificación para representar a Colombia en el FIRST Championship.",
    learnings: "Excelencia en presentación y manejo de jueces, inclusión cultural como eje de la experiencia FLL, descubrimiento de la importancia del proyecto innovador y análisis de errores para mejorar en futuras temporadas.",
    media: [
      ...generateImages("fll_nacional", 51, "png", "Nacional FLL", "Nacional"),
      { type: "image", src: "/images/gallery/leader/masterpiece_regional_1.png", alt: "Foto grupal CALIBOTS — Regional PCIS", subcategory: "Equipo" },
      { type: "image", src: "/images/gallery/leader/masterpiece_regional_2.png", alt: "Equipo revisando robot en evento", subcategory: "Equipo" },
      { type: "image", src: "/images/gallery/leader/masterpiece_stand_1.png", alt: "Stand Mesa 18 — Costos/Beneficios", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/masterpiece_stand_2.png", alt: "Equipo en stand — Anexo Fotográfico", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/masterpiece_stand_3.png", alt: "Equipo completo en stand CALIBOTS", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/masterpiece_stand_4.png", alt: "Stand Mesa 18 — Futuras Alianzas", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/masterpiece_final_1.png", alt: "Sebastián con mamá — Final Nacional", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/masterpiece_final_2.png", alt: "Equipo reunido — Final Nacional", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/masterpiece_final_3.png", alt: "Foto grupal CALIBOTS — Final Nacional", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/masterpiece_final_4.png", alt: "Equipo con patrocinadores — Final Nacional", subcategory: "Premiación" },
    ],
  },
  {
    id: "submerged",
    name: "Submerged",
    year: "2024–2025",
    icon: "/images/fll/submerged.png",
    color: "hsl(204 70% 53%)",
    glowColor: "rgba(56,189,248,0.25)",
    description: "Madurez y expansión — IoT, electrónica avanzada y visión ambiental con SiembraTech.",
    role: "Líder de desarrollo de SiembraTech junto a Samuel Monsalve — enfocado en sensores, mapeo y la parte física del proyecto Mangleye. Inicio del liderazgo técnico real dentro del equipo.",
    evolution: "Salto tecnológico impulsado por el profesor Víctor Mario Perilla: integración de IoT, LoRa y mapeo ambiental en SiembraTech, un macroproyecto que combinaba Mangleye (monitoreo de manglares) y Water Guardians. Estas bases técnicas se transformarían después en M.A.N.G.O.",
    learnings: "Hardware avanzado (Jetson, múltiples microcontroladores), comunicación LoRa, pensamiento sistémico y los primeros pasos reales en liderazgo técnico y delegación de tareas.",
    media: [
      { type: "image", src: "/images/gallery/leader/masterpiece_1.jpg", alt: "Premiación Nacional FLL Submerged" },
      { type: "image", src: "/images/gallery/leader/masterpiece_2.jpg", alt: "Certificado Mejor Proyecto Innovación" },
      { type: "image", src: "/images/gallery/leader/masterpiece_3.jpg", alt: "Con compañero y diploma" },
      { type: "image", src: "/images/gallery/leader/masterpiece_4.jpg", alt: "Diploma oficial Mejor Proyecto Innovación" },
      { type: "image", src: "/images/gallery/leader/lider_team.jpg", alt: "Equipo CALIBOTS con SiembraTech" },
    ],
  },
];

// Generate sequential image arrays
function generateImages(prefix: string, count: number, ext: string, altPrefix: string, subcategory?: string): MediaItem[] {
  return Array.from({ length: count }, (_, i) => ({
    type: "image" as const,
    src: `/images/gallery/leader/${prefix}_${i + 1}.${ext}`,
    alt: `${altPrefix} ${i + 1}`,
    subcategory,
  }));
}

export const milestones: MilestoneData[] = [
  {
    id: "inicios",
    title: "Inicios en Robótica",
    subtitle: "Programa Innovación Educativa",
    year: "2019",
    description: "Los primeros pasos en electrónica y robótica con Scratch + SB-TDS, construyendo el primer seguidor de línea.",
    narrative: "Desde temprana edad, la curiosidad por la tecnología llevó a explorar la robótica educativa a través de programas como Innovación Educativa, donde se construyó el primer robot seguidor de línea y se descubrió la pasión por crear.",
    importance: "El punto de partida de todo — donde una semilla de curiosidad se convirtió en vocación tecnológica.",
    media: [
      { type: "image", src: "/images/gallery/leader/inicios_1.jpg", alt: "Ensamblando piezas con compañeros" },
      { type: "image", src: "/images/gallery/leader/inicios_2.jpg", alt: "Armando carro seguidor de línea" },
      { type: "image", src: "/images/gallery/leader/inicios_3.jpg", alt: "Soldadura y electrónica" },
      { type: "image", src: "/images/gallery/leader/inicios_4.jpg", alt: "Primer carro terminado" },
      { type: "image", src: "/images/gallery/leader/inicios_5.jpg", alt: "Ensamblando robot con herramientas" },
      { type: "image", src: "/images/gallery/leader/inicios_6.jpg", alt: "Probando seguidor de línea en pista" },
      { type: "image", src: "/images/gallery/leader/inicios_7.jpg", alt: "Exhibiendo robots terminados" },
      { type: "image", src: "/images/gallery/leader/inicios_8.jpg", alt: "Certificación Scratch + SB-TDS" },
      { type: "video", src: "/images/gallery/leader/inicios_video_1.mp4", alt: "Video — Primeros pasos en robótica #1" },
      { type: "video", src: "/images/gallery/leader/inicios_video_2.mp4", alt: "Video — Primeros pasos en robótica #2" },
    ],
  },
  {
    id: "ecolatas",
    title: "ECOLATAS",
    subtitle: "Proyecto socio-ambiental",
    year: "2020",
    description: "Proyecto con impacto socio-ambiental que demostró el compromiso con la innovación responsable.",
    narrative: "ECOLATAS fue un proyecto que combinó tecnología y conciencia ambiental, estableciendo las bases del enfoque que después evolucionaría hacia M.A.N.G.O y la protección de ecosistemas marítimos.",
    importance: "La semilla del compromiso ambiental que define la visión actual del proyecto M.A.N.G.O.",
    media: [
      { type: "image", src: "/images/gallery/leader/ecolatas_logo.png", alt: "Logo ECOLATAS — Diseñando con Conciencia", subcategory: "Identidad" },
      { type: "image", src: "/images/gallery/leader/ecolatas_uploaded.png", alt: "ECOLATAS — Proyecto socio-ambiental", subcategory: "Proyecto" },
    ],
  },
  {
    id: "robisoft",
    title: "Copa RobiSoft",
    subtitle: "7mo Puesto Nacional — Sumo con Robi",
    year: "2021",
    description: "Participación destacada en la Copa RobiSoft, demostrando versatilidad competitiva más allá de FLL.",
    narrative: "La Copa RobiSoft representó un desafío diferente: competencia de sumo robótico a nivel nacional. Un entorno donde la estrategia mecánica y la programación de combate pusieron a prueba nuevas habilidades.",
    importance: "Demostración de que las habilidades trascienden una sola competencia — versatilidad y adaptabilidad.",
    media: [
      { type: "image", src: "/images/gallery/leader/coparobi_puesto.jpg", alt: "Tabla de posiciones — Sumo con Robi", subcategory: "Resultados" },
      { type: "image", src: "/images/milestones/robisoft_logo.png", alt: "Logo Copa RobiSoft", subcategory: "Identidad" },
    ],
  },
  {
    id: "internacional",
    title: "Representación Internacional",
    subtitle: "Colombia en Houston, Texas",
    year: "2024",
    description: "Un hito que llevó el trabajo del equipo a escala internacional, con representación de Colombia y una experiencia transformadora en innovación y competencia.",
    narrative: "Representar a Colombia en el FIRST Championship en Houston, Texas fue la culminación de años de esfuerzo. El equipo CALIBOTS compitió contra los mejores del mundo, recibió el premio Motivate Winner y vivió una experiencia que transformó su visión del impacto que la tecnología puede tener.",
    importance: "El momento más significativo — donde el trabajo local se convirtió en representación nacional e impacto global.",
    media: [
      { type: "image", src: "/images/gallery/leader/houston_1.png", alt: "Equipo CALIBOTS en Houston, Texas", subcategory: "Houston" },
      { type: "image", src: "/images/gallery/leader/houston_5.png", alt: "Houston foto 5", subcategory: "Houston" },
      { type: "image", src: "/images/gallery/leader/houston_10.png", alt: "Houston foto 10", subcategory: "Houston" },
      { type: "image", src: "/images/gallery/leader/houston_15.png", alt: "Houston foto 15", subcategory: "Houston" },
      { type: "image", src: "/images/gallery/leader/houston_20.png", alt: "Houston foto 20", subcategory: "Houston" },
      { type: "image", src: "/images/gallery/leader/houston_25.png", alt: "Houston foto 25", subcategory: "Houston" },
      ...generateImages("motivated", 9, "png", "Trofeo Motivate Winner", "Premio Motivate"),
    ],
  },
];
