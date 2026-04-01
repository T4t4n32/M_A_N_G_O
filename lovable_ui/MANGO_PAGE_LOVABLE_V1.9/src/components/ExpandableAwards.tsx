import { useState, useEffect, useCallback } from "react";
import { Trophy, MapPin, Lightbulb, Star, Medal, ChevronDown, Play, X, ChevronLeft, ChevronRight, Wrench } from "lucide-react";

interface MediaItem {
  type: "image" | "video";
  src: string;
  alt: string;
  subcategory?: string;
}

interface AwardItem {
  id: string;
  titulo: string;
  detalle: string;
  icon: typeof Trophy;
  media: MediaItem[];
}

const SUBCATEGORY_ICONS: Record<string, string> = {
  "Stand y Proyecto": "📌",
  "Competencia Robot": "🤖",
  "Premiación": "🏆",
  "Equipo y Grupo": "👥",
  "Backstage y Viaje": "🚌",
};

const awards: AwardItem[] = [
  {
    id: "inicios",
    titulo: "Inicios en Robótica",
    detalle: "Programa Innovación Educativa (Scratch + SB-TDS) — Primer seguidor de línea",
    icon: Wrench,
    media: [
      { type: "image", src: "/images/gallery/leader/inicios_1.jpg", alt: "Ensamblando piezas con compañeros" },
      { type: "image", src: "/images/gallery/leader/inicios_2.jpg", alt: "Armando carro seguidor de línea" },
      { type: "image", src: "/images/gallery/leader/inicios_3.jpg", alt: "Soldadura y electrónica" },
      { type: "image", src: "/images/gallery/leader/inicios_4.jpg", alt: "Primer carro terminado" },
      { type: "image", src: "/images/gallery/leader/inicios_5.jpg", alt: "Ensamblando robot con herramientas" },
      { type: "image", src: "/images/gallery/leader/inicios_6.jpg", alt: "Probando seguidor de línea en pista" },
      { type: "image", src: "/images/gallery/leader/inicios_7.jpg", alt: "Exhibiendo robots terminados" },
      { type: "image", src: "/images/gallery/leader/inicios_8.jpg", alt: "Programa Scratch + SB-TDS — Certificación" },
      { type: "image", src: "/images/gallery/leader/inicios_9.jpg", alt: "Foto grupal con robots" },
      { type: "image", src: "/images/gallery/leader/inicios_10.jpg", alt: "Entrega de diplomas con instructor" },
      { type: "image", src: "/images/gallery/leader/inicios_11.jpg", alt: "Foto final del grupo" },
      { type: "video", src: "/images/gallery/leader/inicios_video_1.mp4", alt: "Video — Primeros pasos en robótica #1" },
      { type: "video", src: "/images/gallery/leader/inicios_video_2.mp4", alt: "Video — Primeros pasos en robótica #2" },
    ],
  },
  {
    id: "masterpiece",
    titulo: "1er Puesto Nacional FLL",
    detalle: "Masterpiece 2023-2024 — Bogotá",
    icon: Trophy,
    media: [
      // Stand y Proyecto
      { type: "image", src: "/images/gallery/leader/fll_nacional_1.png", alt: "Sebastián con equipo en evento FLL", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_3.png", alt: "Stand Mesa 18 — Diseños de Stand", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_4.png", alt: "Muestra gastronómica en stand", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_5.png", alt: "Stand con anexos fotográficos y evidencias", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_6.png", alt: "Stand con diseños 3D en proyector", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_7.png", alt: "Equipo CALIBOTS en stand Masterpiece", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_8.png", alt: "Vista panorámica del stand CALIBOTS", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_12.png", alt: "Equipo en stand con anexo fotográfico", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_25.png", alt: "Stand temático musical — señalética del proyecto", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_33.png", alt: "Presentación del proyecto musical M.A.N.G.O en el stand", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_35.png", alt: "Integrantes del equipo alrededor del instrumento en exhibición", subcategory: "Stand y Proyecto" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_36.png", alt: "Interacción con visitantes en el stand del proyecto", subcategory: "Stand y Proyecto" },
      // Competencia Robot
      { type: "image", src: "/images/gallery/leader/fll_nacional_9.png", alt: "Mesa de competencia robot — FLL Nacional", subcategory: "Competencia Robot" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_14.png", alt: "Presentación del proyecto a referees FLL", subcategory: "Competencia Robot" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_15.png", alt: "Entrada a zona de evaluación — Zona 5", subcategory: "Competencia Robot" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_16.png", alt: "Interacción con otros equipos en el evento", subcategory: "Competencia Robot" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_18.png", alt: "Tabla de puntajes — CALIBOTS 285 puntos", subcategory: "Competencia Robot" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_34.png", alt: "Vista superior del equipo en actividad de evento", subcategory: "Competencia Robot" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_41.png", alt: "Equipo completo en mesa 13 durante la final nacional", subcategory: "Competencia Robot" },
      // Premiación
      { type: "image", src: "/images/gallery/leader/fll_nacional_17.png", alt: "Celebración — Compañeros en hombros tras victoria", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_22.png", alt: "Sebastián con trofeo FIRST LEGO League", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_23.png", alt: "Abrazo grupal celebrando la victoria", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_24.png", alt: "Abrazo grupal — Momento emotivo post-premiación", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_26.png", alt: "Integrantes con trofeo frente al backdrop oficial FLL", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_27.png", alt: "Integrante CALIBOTS posando con trofeo FLL", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_28.png", alt: "Celebración individual con trofeo — foto oficial", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_29.png", alt: "Integrante del equipo con trofeo en premiación", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_37.png", alt: "Sebastián con trofeo al finalizar la jornada", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_38.png", alt: "Trofeo FIRST LEGO League — detalle del reconocimiento", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_45.png", alt: "Integrantes posando con trofeo FIRST LEGO League", subcategory: "Premiación" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_46.png", alt: "Cuarteto del equipo sosteniendo el trofeo", subcategory: "Premiación" },
      // Equipo y Grupo
      { type: "image", src: "/images/gallery/leader/fll_nacional_2.png", alt: "Foto grupal CALIBOTS en FLL", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_10.png", alt: "Foto grupal CALIBOTS en photocall FLL", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_11.png", alt: "Equipo completo frente a banner FLL", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_13.png", alt: "Foto grupal completa — FLL Nacional", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_30.png", alt: "Foto grupal del equipo mostrando medallas", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_31.png", alt: "Equipo CALIBOTS celebrando en el recinto", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_32.png", alt: "Foto oficial de equipo completo con bandera", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_39.png", alt: "Foto grupal en la final nacional con medallas", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_40.png", alt: "Foto grupal cercana del equipo CALIBOTS celebrando", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_42.png", alt: "Retrato grupal del equipo en zona de premiación", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_43.png", alt: "Foto oficial ampliada con mentores y familia", subcategory: "Equipo y Grupo" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_44.png", alt: "Equipo reunido mostrando medallas en el recinto", subcategory: "Equipo y Grupo" },
      // Backstage y Viaje
      { type: "image", src: "/images/gallery/leader/fll_nacional_19.png", alt: "Equipo CALIBOTS preparándose en backstage", subcategory: "Backstage y Viaje" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_20.png", alt: "Integrantes Camila y Santiago en zona de equipos", subcategory: "Backstage y Viaje" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_21.png", alt: "Equipo sentado esperando resultados — FLL Nacional", subcategory: "Backstage y Viaje" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_47.png", alt: "Círculo de cierre con familias y mentores del equipo", subcategory: "Backstage y Viaje" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_48.png", alt: "Selfie grupal del staff y acompañantes fuera del recinto", subcategory: "Backstage y Viaje" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_49.png", alt: "Foto oficial del equipo y acompañantes en exteriores", subcategory: "Backstage y Viaje" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_50.png", alt: "Trayecto del equipo en transporte durante la jornada", subcategory: "Backstage y Viaje" },
      { type: "image", src: "/images/gallery/leader/fll_nacional_51.png", alt: "Reunión del equipo y acompañantes en celebración nocturna", subcategory: "Backstage y Viaje" },
    ],
  },
  {
    id: "representante",
    titulo: "Representante de Colombia",
    detalle: "FLL Internacional — Houston, Texas",
    icon: MapPin,
    media: [
      { type: "image", src: "/images/gallery/leader/houston_1.png", alt: "Equipo CALIBOTS en zona de descanso — Houston, Texas" },
      { type: "image", src: "/images/gallery/leader/houston_2.png", alt: "Representante de Colombia — Houston foto 2" },
      { type: "image", src: "/images/gallery/leader/houston_3.png", alt: "Representante de Colombia — Houston foto 3" },
      { type: "image", src: "/images/gallery/leader/houston_4.png", alt: "Representante de Colombia — Houston foto 4" },
      { type: "image", src: "/images/gallery/leader/houston_5.png", alt: "Representante de Colombia — Houston foto 5" },
      { type: "image", src: "/images/gallery/leader/houston_6.png", alt: "Representante de Colombia — Houston foto 6" },
      { type: "image", src: "/images/gallery/leader/houston_7.png", alt: "Representante de Colombia — Houston foto 7" },
      { type: "image", src: "/images/gallery/leader/houston_8.png", alt: "Representante de Colombia — Houston foto 8" },
      { type: "image", src: "/images/gallery/leader/houston_9.png", alt: "Representante de Colombia — Houston foto 9" },
      { type: "image", src: "/images/gallery/leader/houston_10.png", alt: "Representante de Colombia — Houston foto 10" },
      { type: "image", src: "/images/gallery/leader/houston_11.png", alt: "Representante de Colombia — Houston foto 11" },
      { type: "image", src: "/images/gallery/leader/houston_12.png", alt: "Representante de Colombia — Houston foto 12" },
      { type: "image", src: "/images/gallery/leader/houston_13.png", alt: "Representante de Colombia — Houston foto 13" },
      { type: "image", src: "/images/gallery/leader/houston_14.png", alt: "Representante de Colombia — Houston foto 14" },
      { type: "image", src: "/images/gallery/leader/houston_15.png", alt: "Representante de Colombia — Houston foto 15" },
      { type: "image", src: "/images/gallery/leader/houston_16.png", alt: "Representante de Colombia — Houston foto 16" },
      { type: "image", src: "/images/gallery/leader/houston_17.png", alt: "Representante de Colombia — Houston foto 17" },
      { type: "image", src: "/images/gallery/leader/houston_18.png", alt: "Representante de Colombia — Houston foto 18" },
      { type: "image", src: "/images/gallery/leader/houston_19.png", alt: "Representante de Colombia — Houston foto 19" },
      { type: "image", src: "/images/gallery/leader/houston_20.png", alt: "Representante de Colombia — Houston foto 20" },
      { type: "image", src: "/images/gallery/leader/houston_21.png", alt: "Representante de Colombia — Houston foto 21" },
      { type: "image", src: "/images/gallery/leader/houston_22.png", alt: "Representante de Colombia — Houston foto 22" },
      { type: "image", src: "/images/gallery/leader/houston_23.png", alt: "Representante de Colombia — Houston foto 23" },
      { type: "image", src: "/images/gallery/leader/houston_24.png", alt: "Representante de Colombia — Houston foto 24" },
      { type: "image", src: "/images/gallery/leader/houston_25.png", alt: "Representante de Colombia — Houston foto 25" },
      { type: "image", src: "/images/gallery/leader/houston_26.png", alt: "Representante de Colombia — Houston foto 26" },
      { type: "image", src: "/images/gallery/leader/houston_27.png", alt: "Representante de Colombia — Houston foto 27" },
      { type: "image", src: "/images/gallery/leader/houston_28.png", alt: "Representante de Colombia — Houston foto 28" },
      { type: "image", src: "/images/gallery/leader/houston_29.png", alt: "Representante de Colombia — Houston foto 29" },
      { type: "image", src: "/images/gallery/leader/houston_30.png", alt: "Representante de Colombia — Houston foto 30" },
      { type: "image", src: "/images/gallery/leader/houston_31.png", alt: "Representante de Colombia — Houston foto 31" },
      { type: "image", src: "/images/gallery/leader/houston_32.png", alt: "Representante de Colombia — Houston foto 32" },
      { type: "image", src: "/images/gallery/leader/houston_33.png", alt: "Representante de Colombia — Houston foto 33" },
      { type: "image", src: "/images/gallery/leader/houston_34.png", alt: "Representante de Colombia — Houston foto 34" },
      { type: "image", src: "/images/gallery/leader/houston_35.png", alt: "Representante de Colombia — Houston foto 35" },
      { type: "image", src: "/images/gallery/leader/houston_36.png", alt: "Representante de Colombia — Houston foto 36" },
      { type: "image", src: "/images/gallery/leader/houston_37.png", alt: "Representante de Colombia — Houston foto 37" },
      { type: "image", src: "/images/gallery/leader/houston_38.png", alt: "Representante de Colombia — Houston foto 38" },
      { type: "image", src: "/images/gallery/leader/houston_39.png", alt: "Representante de Colombia — Houston foto 39" },
      { type: "image", src: "/images/gallery/leader/houston_40.png", alt: "Representante de Colombia — Houston foto 40" },
      { type: "image", src: "/images/gallery/leader/houston_41.png", alt: "Representante de Colombia — Houston foto 41" },
      { type: "image", src: "/images/gallery/leader/houston_42.png", alt: "Representante de Colombia — Houston foto 42" },
      { type: "image", src: "/images/gallery/leader/houston_43.png", alt: "Representante de Colombia — Houston foto 43" },
      { type: "image", src: "/images/gallery/leader/houston_44.png", alt: "Representante de Colombia — Houston foto 44" },
      { type: "image", src: "/images/gallery/leader/houston_45.png", alt: "Representante de Colombia — Houston foto 45" },
      { type: "image", src: "/images/gallery/leader/houston_46.png", alt: "Representante de Colombia — Houston foto 46" },
      { type: "image", src: "/images/gallery/leader/houston_47.png", alt: "Representante de Colombia — Houston foto 47" },
      { type: "image", src: "/images/gallery/leader/houston_48.png", alt: "Representante de Colombia — Houston foto 48" },
      { type: "image", src: "/images/gallery/leader/houston_49.png", alt: "Representante de Colombia — Houston foto 49" },
      { type: "image", src: "/images/gallery/leader/houston_50.png", alt: "Representante de Colombia — Houston foto 50" },
    ],
  },
  {
    id: "innovador",
    titulo: "Mejor Proyecto Innovador",
    detalle: "Submerged — Cartagena (SiembraTech → M.A.N.G.O)",
    icon: Lightbulb,
    media: [
      { type: "image", src: "/images/gallery/leader/diploma_cargo_connect.jpg", alt: "Diploma FLL Cargo Connect — Nacional" },
      { type: "image", src: "/images/gallery/leader/lider_team.jpg", alt: "Equipo CALIBOTS con M.A.N.G.O — Rumbo a Houston" },
      { type: "image", src: "/images/gallery/leader/masterpiece_1.jpg", alt: "Premiación Nacional FLL Submerged" },
      { type: "image", src: "/images/gallery/leader/masterpiece_2.jpg", alt: "Certificado Mejor Proyecto Innovación" },
      { type: "image", src: "/images/gallery/leader/masterpiece_3.jpg", alt: "Con compañero y diploma" },
      { type: "image", src: "/images/gallery/leader/masterpiece_4.jpg", alt: "Diploma oficial Mejor Proyecto Innovación" },
    ],
  },
  {
    id: "motivated",
    titulo: "Premio \"Motivated\"",
    detalle: "FLL Internacional — Houston, Texas",
    icon: Star,
    media: [
      { type: "image", src: "/images/gallery/leader/motivated_1.png", alt: "Sebastián con trofeo Motivate Winner — Avenida Houston" },
      { type: "image", src: "/images/gallery/leader/motivated_2.png", alt: "Sebastián con trofeo Motivate de cerca — lanyard CALIBOTS" },
      { type: "image", src: "/images/gallery/leader/motivated_3.png", alt: "Trofeo Motivate Winner — vista completa" },
      { type: "image", src: "/images/gallery/leader/motivated_4.png", alt: "Placa del trofeo — detalle Motivate Winner" },
      { type: "image", src: "/images/gallery/leader/motivated_5.png", alt: "Trofeo Motivate Winner — vista angular" },
      { type: "image", src: "/images/gallery/leader/motivated_6.png", alt: "Samuel con trofeo Motivate y gafas LEGO — celebración" },
      { type: "image", src: "/images/gallery/leader/motivated_7.png", alt: "Placa Motivate Winner — FLL World Festival 2025 Houston" },
      { type: "image", src: "/images/gallery/leader/motivated_8.png", alt: "Sebastián con trofeo y sombrero vueltiao — FIRST Championship" },
      { type: "image", src: "/images/gallery/leader/motivated_9.png", alt: "Integrante con trofeo Motivate y sombrero vueltiao — tribuna" },
      { type: "image", src: "/images/gallery/leader/motivated_10.png", alt: "Premio Motivated — Houston foto 10" },
      { type: "image", src: "/images/gallery/leader/motivated_11.png", alt: "Premio Motivated — Houston foto 11" },
      { type: "image", src: "/images/gallery/leader/motivated_12.png", alt: "Premio Motivated — Houston foto 12" },
      { type: "image", src: "/images/gallery/leader/motivated_13.png", alt: "Premio Motivated — Houston foto 13" },
      { type: "image", src: "/images/gallery/leader/motivated_14.png", alt: "Premio Motivated — Houston foto 14" },
      { type: "image", src: "/images/gallery/leader/motivated_15.png", alt: "Premio Motivated — Houston foto 15" },
      { type: "image", src: "/images/gallery/leader/motivated_16.png", alt: "Premio Motivated — Houston foto 16" },
      { type: "image", src: "/images/gallery/leader/motivated_17.png", alt: "Premio Motivated — Houston foto 17" },
      { type: "image", src: "/images/gallery/leader/motivated_18.png", alt: "Premio Motivated — Houston foto 18" },
      { type: "image", src: "/images/gallery/leader/motivated_19.png", alt: "Premio Motivated — Houston foto 19" },
      { type: "image", src: "/images/gallery/leader/motivated_20.png", alt: "Premio Motivated — Houston foto 20" },
      { type: "image", src: "/images/gallery/leader/motivated_21.png", alt: "Premio Motivated — Houston foto 21" },
      { type: "image", src: "/images/gallery/leader/motivated_22.png", alt: "Premio Motivated — Houston foto 22" },
      { type: "image", src: "/images/gallery/leader/motivated_23.png", alt: "Premio Motivated — Houston foto 23" },
      { type: "image", src: "/images/gallery/leader/motivated_24.png", alt: "Premio Motivated — Houston foto 24" },
      { type: "image", src: "/images/gallery/leader/motivated_25.png", alt: "Premio Motivated — Houston foto 25" },
      { type: "image", src: "/images/gallery/leader/motivated_26.png", alt: "Premio Motivated — Houston foto 26" },
      { type: "image", src: "/images/gallery/leader/motivated_27.png", alt: "Premio Motivated — Houston foto 27" },
      { type: "image", src: "/images/gallery/leader/motivated_28.png", alt: "Premio Motivated — Houston foto 28" },
      { type: "image", src: "/images/gallery/leader/motivated_29.png", alt: "Premio Motivated — Houston foto 29" },
      { type: "image", src: "/images/gallery/leader/motivated_30.png", alt: "Premio Motivated — Houston foto 30" },
      { type: "image", src: "/images/gallery/leader/motivated_31.png", alt: "Premio Motivated — Houston foto 31" },
      { type: "image", src: "/images/gallery/leader/motivated_32.png", alt: "Premio Motivated — Houston foto 32" },
      { type: "image", src: "/images/gallery/leader/motivated_33.png", alt: "Premio Motivated — Houston foto 33" },
      { type: "image", src: "/images/gallery/leader/motivated_34.png", alt: "Premio Motivated — Houston foto 34" },
      { type: "image", src: "/images/gallery/leader/motivated_35.png", alt: "Premio Motivated — Houston foto 35" },
      { type: "image", src: "/images/gallery/leader/motivated_36.png", alt: "Premio Motivated — Houston foto 36" },
      { type: "image", src: "/images/gallery/leader/motivated_37.png", alt: "Premio Motivated — Houston foto 37" },
      { type: "image", src: "/images/gallery/leader/motivated_38.png", alt: "Premio Motivated — Houston foto 38" },
      { type: "image", src: "/images/gallery/leader/motivated_39.png", alt: "Premio Motivated — Houston foto 39" },
      { type: "image", src: "/images/gallery/leader/motivated_40.png", alt: "Premio Motivated — Houston foto 40" },
      { type: "image", src: "/images/gallery/leader/motivated_41.png", alt: "Premio Motivated — Houston foto 41" },
      { type: "image", src: "/images/gallery/leader/motivated_42.png", alt: "Premio Motivated — Houston foto 42" },
      { type: "image", src: "/images/gallery/leader/motivated_43.png", alt: "Premio Motivated — Houston foto 43" },
      { type: "image", src: "/images/gallery/leader/motivated_44.png", alt: "Premio Motivated — Houston foto 44" },
      { type: "image", src: "/images/gallery/leader/motivated_45.png", alt: "Premio Motivated — Houston foto 45" },
      { type: "image", src: "/images/gallery/leader/motivated_46.png", alt: "Premio Motivated — Houston foto 46" },
      { type: "image", src: "/images/gallery/leader/motivated_47.png", alt: "Premio Motivated — Houston foto 47" },
      { type: "image", src: "/images/gallery/leader/motivated_48.png", alt: "Premio Motivated — Houston foto 48" },
      { type: "image", src: "/images/gallery/leader/motivated_49.png", alt: "Premio Motivated — Houston foto 49" },
      { type: "image", src: "/images/gallery/leader/motivated_50.png", alt: "Premio Motivated — Houston foto 50" },
    ],
  },
  {
    id: "robisoft",
    titulo: "Copa RobiSoft",
    detalle: "7mo Puesto Nacional — Sumo con Robi",
    icon: Medal,
    media: [
      { type: "image", src: "/images/gallery/leader/coparobi_puesto.jpg", alt: "Tabla de posiciones — Sumo con Robi (7mo puesto)" },
    ],
  },
];

/** Group media by subcategory, preserving order. Items without subcategory go into a single group. */
function groupBySubcategory(media: MediaItem[]): { label: string | null; items: MediaItem[]; startIndex: number }[] {
  const groups: { label: string | null; items: MediaItem[]; startIndex: number }[] = [];
  let currentLabel: string | null | undefined = undefined;
  let idx = 0;

  for (const item of media) {
    const label = item.subcategory ?? null;
    if (label !== currentLabel) {
      groups.push({ label, items: [item], startIndex: idx });
      currentLabel = label;
    } else {
      groups[groups.length - 1].items.push(item);
    }
    idx++;
  }
  return groups;
}

export function ExpandableAwards() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ awardId: string; index: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const lightboxMedia = lightbox
    ? awards.find((a) => a.id === lightbox.awardId)?.media ?? []
    : [];

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    setZoom(1);
  }, []);

  const goNext = useCallback(() => {
    if (!lightbox || lightboxMedia.length <= 1) return;
    setZoom(1);
    setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightboxMedia.length });
  }, [lightbox, lightboxMedia.length]);

  const goPrev = useCallback(() => {
    if (!lightbox || lightboxMedia.length <= 1) return;
    setZoom(1);
    setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightboxMedia.length) % lightboxMedia.length });
  }, [lightbox, lightboxMedia.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, closeLightbox, goNext, goPrev]);

  useEffect(() => {
    if (!lightbox) return;
    const preload = (idx: number) => {
      const item = lightboxMedia[idx];
      if (item?.type === "image") {
        const img = new Image();
        img.src = item.src;
      }
    };
    preload((lightbox.index + 1) % lightboxMedia.length);
    preload((lightbox.index - 1 + lightboxMedia.length) % lightboxMedia.length);
  }, [lightbox, lightboxMedia]);

  const renderMediaGrid = (award: AwardItem) => {
    const hasSubcategories = award.media.some((m) => m.subcategory);

    if (!hasSubcategories) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {award.media.map((item, i) => renderThumb(award, item, i))}
        </div>
      );
    }

    const groups = groupBySubcategory(award.media);

    return (
      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.label ?? "default"}>
            {group.label && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{SUBCATEGORY_ICONS[group.label] ?? "📷"}</span>
                <span className="text-white/60 text-[11px] font-semibold uppercase tracking-wider">{group.label}</span>
                <span className="text-white/20 text-[10px] font-mono ml-auto">{group.items.length}</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.items.map((item, i) => renderThumb(award, item, group.startIndex + i))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderThumb = (award: AwardItem, item: MediaItem, globalIndex: number) => (
    <div
      key={globalIndex}
      onClick={() => { setLightbox({ awardId: award.id, index: globalIndex }); setZoom(1); }}
      className="aspect-square rounded-lg bg-white/[0.06] border border-white/[0.08] overflow-hidden relative group cursor-pointer"
    >
      {item.type === "image" ? (
        <img
          src={item.src}
          alt={item.alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full relative">
          <video src={item.src} className="w-full h-full object-cover" muted playsInline preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
            <Play className="h-6 w-6 text-white" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-accent" />
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Premios y Logros</h4>
          <span className="text-white/30 text-xs ml-auto">Haz clic para ver fotos</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {awards.map((award) => {
            const isOpen = expanded === award.id;
            const hasMedia = award.media.length > 0;

            return (
              <div
                key={award.id}
                className={`rounded-lg overflow-hidden transition-all duration-300 ${
                  isOpen ? "bg-white/[0.06] border border-accent/20" : "bg-white/[0.04] border border-transparent"
                }`}
              >
                <button
                  onClick={() => hasMedia && toggle(award.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    hasMedia ? "hover:bg-white/[0.03] cursor-pointer" : "cursor-default"
                  }`}
                >
                  <award.icon className={`h-4 w-4 shrink-0 ${isOpen ? "text-accent" : "text-accent/70"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm font-medium leading-tight">{award.titulo}</p>
                    <p className="text-white/50 text-xs">{award.detalle}</p>
                  </div>
                  {hasMedia && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-white/30 text-[10px] font-mono">{award.media.length}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-white/30 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  )}
                  {!hasMedia && (
                    <span className="text-white/20 text-[10px] shrink-0">Próximamente</span>
                  )}
                </button>

                {isOpen && hasMedia && (
                  <div className="px-3 pb-3 border-t border-white/[0.06]">
                    {renderMediaGrid(award)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {lightbox && lightboxMedia.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxMedia.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/70 text-xs font-medium bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
              {lightbox.index + 1} / {lightboxMedia.length}
            </div>
          )}

          <div className="max-w-3xl max-h-[80vh] w-auto px-2 sm:px-4" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia[lightbox.index]?.type === "image" ? (
              <img
                src={lightboxMedia[lightbox.index].src}
                alt={lightboxMedia[lightbox.index].alt}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined, transition: "transform 0.2s" }}
                draggable={false}
              />
            ) : (
              <video
                src={lightboxMedia[lightbox.index]?.src}
                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
                controls
                autoPlay
                playsInline
              />
            )}
            <p className="text-white/70 text-xs text-center mt-3 drop-shadow">
              {lightboxMedia[lightbox.index]?.alt}
            </p>
          </div>

          {lightboxMedia.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 md:left-5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
