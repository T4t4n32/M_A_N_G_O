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
  /** Panel Emma category id — media for this season is fetched live from /api/v1/public/media. */
  category: string;
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
  /** Panel Emma category id — media for this milestone is fetched live from /api/v1/public/media. */
  category: string;
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
    category: "fll-cargo-connect",
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
    category: "fll-superpowered",
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
    category: "fll-masterpiece",
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
    category: "fll-submerged",
  },
];

export const milestones: MilestoneData[] = [
  {
    id: "inicios",
    title: "Inicios en Robótica",
    subtitle: "Programa Innovación Educativa",
    year: "2019",
    description: "Los primeros pasos en electrónica y robótica con Scratch + SB-TDS, construyendo el primer seguidor de línea.",
    narrative: "Desde temprana edad, la curiosidad por la tecnología llevó a explorar la robótica educativa a través de programas como Innovación Educativa, donde se construyó el primer robot seguidor de línea y se descubrió la pasión por crear.",
    importance: "El punto de partida de todo — donde una semilla de curiosidad se convirtió en vocación tecnológica.",
    category: "hito-inicios",
  },
  {
    id: "ecolatas",
    title: "ECOLATAS",
    subtitle: "Proyecto socio-ambiental",
    year: "2020",
    description: "Proyecto con impacto socio-ambiental que demostró el compromiso con la innovación responsable.",
    narrative: "ECOLATAS fue un proyecto que combinó tecnología y conciencia ambiental, estableciendo las bases del enfoque que después evolucionaría hacia M.A.N.G.O y la protección de ecosistemas marítimos.",
    importance: "La semilla del compromiso ambiental que define la visión actual del proyecto M.A.N.G.O.",
    category: "hito-ecolatas",
  },
  {
    id: "robisoft",
    title: "Copa RobiSoft",
    subtitle: "7mo Puesto Nacional — Sumo con Robi",
    year: "2021",
    description: "Participación destacada en la Copa RobiSoft, demostrando versatilidad competitiva más allá de FLL.",
    narrative: "La Copa RobiSoft representó un desafío diferente: competencia de sumo robótico a nivel nacional. Un entorno donde la estrategia mecánica y la programación de combate pusieron a prueba nuevas habilidades.",
    importance: "Demostración de que las habilidades trascienden una sola competencia — versatilidad y adaptabilidad.",
    category: "hito-robisoft",
  },
  {
    id: "internacional",
    title: "Representación Internacional",
    subtitle: "Colombia en Houston, Texas",
    year: "2025",
    description: "Un hito que llevó el trabajo del equipo a escala internacional, con representación de Colombia y una experiencia transformadora en innovación y competencia.",
    narrative: "Representar a Colombia en el FIRST Championship en Houston, Texas fue la culminación de años de esfuerzo. El equipo CALIBOTS compitió contra los mejores del mundo, recibió el premio Motivate Winner y vivió una experiencia que transformó su visión del impacto que la tecnología puede tener.",
    importance: "El momento más significativo — donde el trabajo local se convirtió en representación nacional e impacto global.",
    category: "hito-internacional",
  },
  {
    id: "reconocimiento-electronica",
    title: "Mejor Proyecto de Grado",
    subtitle: "Comfandi El Prado — Especialidad Electrónica",
    year: "2026",
    description: "Reconocimiento otorgado por el Colegio Comfandi El Prado al mejor proyecto de grado 11-1 en la especialidad de Electrónica, por el desarrollo del proyecto M.A.N.G.O.",
    narrative: "El Colegio Comfandi El Prado reconoció a M.A.N.G.O. como el mejor proyecto de grado 11-1 en la especialidad de Electrónica, validando en el entorno académico el trabajo técnico detrás del sistema de monitoreo de manglares.",
    importance: "El reconocimiento del propio colegio a la calidad técnica del proyecto que dio origen a todo lo demás.",
    category: "hito-reconocimiento-electronica",
  },
  {
    id: "reconocimiento-houston",
    title: "Reconocimiento Representación Internacional",
    subtitle: "Comfandi — FIRST Championship, Houston 2025",
    year: "2025",
    description: "Reconocimiento del Colegio Comfandi El Prado por la destacada participación en el FIRST Championship, categoría FIRST LEGO League, representando a la red de Colegios Comfandi en Houston, Texas.",
    narrative: "El Colegio Comfandi El Prado reconoció formalmente la participación en el FIRST Championship — categoría FIRST LEGO League — representando con orgullo a la red de Colegios Comfandi en Houston, Texas, en el 2025.",
    importance: "El reconocimiento institucional a haber llevado el nombre de Comfandi hasta el escenario internacional de la robótica.",
    category: "hito-reconocimiento-houston",
  },
];
