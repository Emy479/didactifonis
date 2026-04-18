/**
 * generarPDF.js
 * Utilidad para exportar historial clínico de pacientes en PDF.
 *
 * Dos niveles:
 *   - generarPDFTutor()       → informe amigable para familia
 *   - generarPDFProfesional() → informe técnico editable para profesionales
 */

import jsPDF from "jspdf";

// ── Constantes de diseño ──────────────────────────────────────────────────────
const MARGEN       = 20;
const ANCHO_PAGINA = 210; // A4 mm
const ANCHO_UTIL   = ANCHO_PAGINA - MARGEN * 2;
const ALTO_PAGINA  = 297;
const AZUL         = [37, 99, 235];
const GRIS_OSCURO  = [31, 41, 55];
const GRIS_MEDIO   = [107, 114, 128];
const GRIS_CLARO   = [243, 244, 246];
const VERDE        = [22, 163, 74];
const PURPURA      = [124, 58, 237];

const AREAS_LABEL = {
  fonologia:     "Fonología",
  semantica:     "Semántica",
  morfosintaxis: "Morfosintaxis",
  pragmatica:    "Pragmática",
  habla:         "Habla",
  lenguaje:      "Lenguaje",
};

// ── Helper: nueva página si no hay espacio ────────────────────────────────────
const verificarSalto = (doc, y, necesario = 20) => {
  if (y + necesario > ALTO_PAGINA - 20) {
    doc.addPage();
    return MARGEN + 10;
  }
  return y;
};

// ── Helper: encabezado de página ──────────────────────────────────────────────
const dibujarEncabezado = (doc, nombrePaciente, tipo) => {
  // Barra superior azul
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, ANCHO_PAGINA, 18, "F");

  // Logo / título plataforma
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Didactifonis", MARGEN, 12);

  // Tipo de informe
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(tipo, ANCHO_PAGINA - MARGEN, 12, { align: "right" });

  // Nombre paciente debajo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GRIS_MEDIO);
  doc.text(`Paciente: ${nombrePaciente}`, MARGEN, 25);

  // Línea separadora
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, 28, ANCHO_PAGINA - MARGEN, 28);
};

// ── Helper: pie de página ─────────────────────────────────────────────────────
const dibujarPie = (doc) => {
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_MEDIO);
    const fecha = new Date().toLocaleDateString("es-CL", {
      day: "2-digit", month: "long", year: "numeric",
    });
    doc.text(`Generado el ${fecha}  ·  Didactifonis`, MARGEN, ALTO_PAGINA - 10);
    doc.text(`${i} / ${totalPaginas}`, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 10, { align: "right" });
  }
};

// ── Helper: sección título ────────────────────────────────────────────────────
const seccion = (doc, y, titulo, color = AZUL) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(titulo.toUpperCase(), MARGEN, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.line(MARGEN, y + 1.5, ANCHO_PAGINA - MARGEN, y + 1.5);
  return y + 7;
};

// ── Helper: fila clave-valor ──────────────────────────────────────────────────
const fila = (doc, y, clave, valor) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_MEDIO);
  doc.text(clave, MARGEN, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRIS_OSCURO);
  const lineas = doc.splitTextToSize(valor || "—", ANCHO_UTIL - 45);
  doc.text(lineas, MARGEN + 45, y);
  return y + lineas.length * 5 + 2;
};

// ── Helper: texto largo con salto automático ──────────────────────────────────
const parrafo = (doc, y, texto, color = GRIS_OSCURO) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...color);
  const lineas = doc.splitTextToSize(texto || "—", ANCHO_UTIL);
  lineas.forEach((linea) => {
    y = verificarSalto(doc, y, 6);
    doc.text(linea, MARGEN, y);
    y += 5;
  });
  return y + 2;
};

// ── Helper: chips de áreas ────────────────────────────────────────────────────
const chips = (doc, y, areas) => {
  if (!areas?.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text("Sin áreas registradas", MARGEN, y);
    return y + 6;
  }
  let x = MARGEN;
  areas.forEach((area) => {
    const label = AREAS_LABEL[area] || area;
    const ancho = doc.getTextWidth(label) + 6;
    if (x + ancho > ANCHO_PAGINA - MARGEN) { x = MARGEN; y += 8; }
    doc.setFillColor(...PURPURA);
    doc.roundedRect(x, y - 4, ancho, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(label, x + 3, y);
    x += ancho + 3;
  });
  return y + 10;
};

// ── Helper: tabla de sesiones ─────────────────────────────────────────────────
const tablaSesiones = (doc, y, sesiones) => {
  if (!sesiones?.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text("Sin sesiones registradas", MARGEN, y);
    return y + 6;
  }

  // Cabecera
  const cols = [
    { label: "Juego",       x: MARGEN,      ancho: 65 },
    { label: "Fecha",       x: MARGEN + 65, ancho: 32 },
    { label: "Puntuación",  x: MARGEN + 97, ancho: 28 },
    { label: "Tiempo",      x: MARGEN + 125,ancho: 24 },
    { label: "Estado",      x: MARGEN + 149,ancho: 21 },
  ];

  doc.setFillColor(...AZUL);
  doc.rect(MARGEN, y - 4, ANCHO_UTIL, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  cols.forEach((col) => doc.text(col.label, col.x + 1, y));
  y += 5;

  sesiones.slice(0, 15).forEach((s, i) => {
    y = verificarSalto(doc, y, 8);
    if (i % 2 === 0) {
      doc.setFillColor(...GRIS_CLARO);
      doc.rect(MARGEN, y - 3.5, ANCHO_UTIL, 6, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_OSCURO);

    const nombreJuego = s.juego?.nombre || "Juego";
    const nombreCorto = nombreJuego.length > 28 ? nombreJuego.slice(0, 27) + "…" : nombreJuego;
    const fecha = s.fechaSesion ? new Date(s.fechaSesion).toLocaleDateString("es-CL") : "—";
    const puntos = `${s.puntuacion || 0} pts`;
    const tiempo = `${Math.round((s.tiempoJugado || 0) / 60)} min`;
    const estado = s.aprobado ? "✓ Aprobado" : "En progreso";

    doc.text(nombreCorto,           cols[0].x + 1, y);
    doc.text(fecha,                  cols[1].x + 1, y);
    doc.text(puntos,                 cols[2].x + 1, y);
    doc.text(tiempo,                 cols[3].x + 1, y);
    doc.setTextColor(...(s.aprobado ? VERDE : GRIS_MEDIO));
    doc.text(estado,                 cols[4].x + 1, y);
    doc.setTextColor(...GRIS_OSCURO);
    y += 6;
  });

  return y + 4;
};

// ── Helper: tarjetas de stats ─────────────────────────────────────────────────
const tarjetasStats = (doc, y, generales) => {
  const stats = [
    { label: "Total sesiones",    valor: generales?.totalSesiones || 0 },
    { label: "Mejor puntuación",  valor: generales?.mejorPuntuacion || 0 },
    { label: "Promedio",          valor: Math.round(generales?.promedioPuntuacion || 0) },
    { label: "Tiempo total",      valor: `${Math.round((generales?.tiempoTotalJugado || 0) / 60)} min` },
  ];

  const anchoTarjeta = (ANCHO_UTIL - 9) / 4;
  stats.forEach((s, i) => {
    const x = MARGEN + i * (anchoTarjeta + 3);
    doc.setFillColor(...GRIS_CLARO);
    doc.roundedRect(x, y, anchoTarjeta, 18, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...AZUL);
    doc.text(String(s.valor), x + anchoTarjeta / 2, y + 10, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text(s.label, x + anchoTarjeta / 2, y + 15.5, { align: "center" });
  });
  return y + 24;
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF TUTOR — Informe amigable para familia
// ─────────────────────────────────────────────────────────────────────────────
export const generarPDFTutor = ({ paciente, asignaciones, estadisticas, historial }) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;
  const fechaHoy = new Date().toLocaleDateString("es-CL", {
    day: "2-digit", month: "long", year: "numeric",
  });

  dibujarEncabezado(doc, nombreCompleto, "Informe de Progreso Familiar");
  let y = 36;

  // ── Presentación amigable ─────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...GRIS_OSCURO);
  doc.text(`Hola, este es el informe de progreso de`, MARGEN, y);
  y += 7;
  doc.setTextColor(...AZUL);
  doc.text(nombreCompleto, MARGEN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_MEDIO);
  doc.text(`Generado el ${fechaHoy}`, MARGEN, y);
  y += 10;

  // ── Datos básicos ─────────────────────────────────────────────────────────
  y = seccion(doc, y, "Información del niño/a");
  const edad = paciente.edad || paciente.fechaNacimiento
    ? (() => {
        const hoy = new Date();
        const nac = new Date(paciente.fechaNacimiento);
        let e = hoy.getFullYear() - nac.getFullYear();
        if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--;
        return e;
      })()
    : "N/A";

  y = fila(doc, y, "Nombre:",   nombreCompleto);
  y = fila(doc, y, "Edad:",     `${edad} años`);
  y = fila(doc, y, "Plan:",     paciente.tipoCuenta === "familiar" ? "Plan Familiar" : "Plan Profesional");
  y += 4;

  // ── Áreas trabajadas ──────────────────────────────────────────────────────
  y = seccion(doc, y, "Áreas que está trabajando", PURPURA);
  y = chips(doc, y, paciente.areasTrabajar);
  y += 2;

  // ── Resumen de actividad ──────────────────────────────────────────────────
  y = verificarSalto(doc, y, 30);
  y = seccion(doc, y, "Resumen de actividad");
  const gen = estadisticas?.generales;
  y = tarjetasStats(doc, y, gen);
  y += 2;

  // ── Juegos asignados ──────────────────────────────────────────────────────
  y = verificarSalto(doc, y, 20);
  y = seccion(doc, y, "Juegos asignados");
  if (!asignaciones?.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text("Sin juegos asignados aún", MARGEN, y);
    y += 6;
  } else {
    asignaciones.forEach((a) => {
      y = verificarSalto(doc, y, 10);
      const nombre = a.juego?.nombre || "Juego";
      const veces  = a.estadisticas?.vecesJugado || 0;
      const comp   = a.estadisticas?.completado ? "Completado ✓" : "En progreso";

      doc.setFillColor(...GRIS_CLARO);
      doc.roundedRect(MARGEN, y - 3, ANCHO_UTIL, 8, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRIS_OSCURO);
      doc.text(nombre, MARGEN + 3, y + 1.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRIS_MEDIO);
      doc.text(`${veces} ${veces === 1 ? "vez jugado" : "veces jugado"}`, MARGEN + 100, y + 1.5);

      doc.setTextColor(...(a.estadisticas?.completado ? VERDE : GRIS_MEDIO));
      doc.text(comp, MARGEN + 148, y + 1.5);
      y += 11;
    });
  }
  y += 2;

  // ── Últimas sesiones ──────────────────────────────────────────────────────
  if (historial?.length > 0) {
    y = verificarSalto(doc, y, 25);
    y = seccion(doc, y, "Últimas sesiones de juego");
    y = tablaSesiones(doc, y, historial.slice(0, 8));
  }

  // ── Mensaje de cierre ─────────────────────────────────────────────────────
  y = verificarSalto(doc, y, 20);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(MARGEN, y, ANCHO_UTIL, 18, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...AZUL);
  doc.text("¡Sigue así!", MARGEN + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRIS_OSCURO);
  const mensaje = `${paciente.nombre} está avanzando en su proceso terapéutico. Cada sesión de juego contribuye a su desarrollo del lenguaje.`;
  const linMensaje = doc.splitTextToSize(mensaje, ANCHO_UTIL - 8);
  doc.text(linMensaje, MARGEN + 4, y + 13);

  dibujarPie(doc);
  doc.save(`informe_${paciente.nombre}_${paciente.apellido}_familiar.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF PROFESIONAL — Informe técnico con notas clínicas editables
// ─────────────────────────────────────────────────────────────────────────────
export const generarPDFProfesional = ({
  paciente,
  asignaciones,
  estadisticas,
  historial,
  profesional,
  notas, // { diagnosticoActualizado, observaciones, recomendaciones, objetivo }
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;
  const fechaHoy = new Date().toLocaleDateString("es-CL", {
    day: "2-digit", month: "long", year: "numeric",
  });

  dibujarEncabezado(doc, nombreCompleto, "Informe Clínico Profesional");
  let y = 36;

  // ── Título y profesional ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...GRIS_OSCURO);
  doc.text("Informe Clínico de Seguimiento", MARGEN, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_MEDIO);
  doc.text(`Fecha de emisión: ${fechaHoy}`, MARGEN, y);
  if (profesional?.nombre) {
    doc.text(`Profesional: ${profesional.nombre}`, ANCHO_PAGINA - MARGEN, y, { align: "right" });
  }
  y += 10;

  // ── Datos del paciente ────────────────────────────────────────────────────
  y = seccion(doc, y, "Datos del Paciente");
  const edad = paciente.fechaNacimiento
    ? (() => {
        const hoy = new Date();
        const nac = new Date(paciente.fechaNacimiento);
        let e = hoy.getFullYear() - nac.getFullYear();
        if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--;
        return e;
      })()
    : "N/A";

  const nacStr = paciente.fechaNacimiento
    ? new Date(paciente.fechaNacimiento).toLocaleDateString("es-CL")
    : "—";

  y = fila(doc, y, "Nombre completo:",   nombreCompleto);
  y = fila(doc, y, "Fecha nacimiento:",  nacStr);
  y = fila(doc, y, "Edad:",              `${edad} años`);
  y = fila(doc, y, "Género:",            paciente.genero === "masculino" ? "Masculino" : paciente.genero === "femenino" ? "Femenino" : "No especificado");
  y = fila(doc, y, "Tipo de plan:",      paciente.tipoCuenta === "familiar" ? "Plan Familiar" : "Plan Profesional");
  y += 4;

  // ── Diagnóstico registrado ────────────────────────────────────────────────
  y = verificarSalto(doc, y, 20);
  y = seccion(doc, y, "Diagnóstico Registrado en Sistema");
  y = parrafo(doc, y, paciente.diagnostico || "Sin diagnóstico registrado.");
  y += 2;

  if (paciente.observaciones) {
    y = verificarSalto(doc, y, 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text("Observaciones en sistema:", MARGEN, y);
    y += 4;
    y = parrafo(doc, y, paciente.observaciones);
    y += 2;
  }

  // ── Áreas terapéuticas ────────────────────────────────────────────────────
  y = verificarSalto(doc, y, 20);
  y = seccion(doc, y, "Áreas Terapéuticas", PURPURA);
  y = chips(doc, y, paciente.areasTrabajar);
  y += 4;

  // ── Notas clínicas del profesional ────────────────────────────────────────
  if (notas?.diagnosticoActualizado || notas?.observaciones || notas?.recomendaciones || notas?.objetivo) {
    y = verificarSalto(doc, y, 20);
    y = seccion(doc, y, "Notas Clínicas del Profesional", VERDE);

    if (notas.diagnosticoActualizado) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRIS_MEDIO);
      doc.text("Diagnóstico actualizado:", MARGEN, y);
      y += 4;
      y = parrafo(doc, y, notas.diagnosticoActualizado);
      y += 2;
    }
    if (notas.objetivo) {
      y = verificarSalto(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRIS_MEDIO);
      doc.text("Objetivo terapéutico actual:", MARGEN, y);
      y += 4;
      y = parrafo(doc, y, notas.objetivo);
      y += 2;
    }
    if (notas.observaciones) {
      y = verificarSalto(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRIS_MEDIO);
      doc.text("Observaciones clínicas:", MARGEN, y);
      y += 4;
      y = parrafo(doc, y, notas.observaciones);
      y += 2;
    }
    if (notas.recomendaciones) {
      y = verificarSalto(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRIS_MEDIO);
      doc.text("Recomendaciones:", MARGEN, y);
      y += 4;
      y = parrafo(doc, y, notas.recomendaciones);
      y += 2;
    }
    y += 2;
  }

  // ── Estadísticas de progreso ──────────────────────────────────────────────
  y = verificarSalto(doc, y, 35);
  y = seccion(doc, y, "Estadísticas de Progreso");
  const gen = estadisticas?.generales;
  y = tarjetasStats(doc, y, gen);
  y += 4;

  // ── Juegos más jugados ────────────────────────────────────────────────────
  if (estadisticas?.juegosMasJugados?.length > 0) {
    y = verificarSalto(doc, y, 20);
    y = seccion(doc, y, "Juegos Más Trabajados");
    estadisticas.juegosMasJugados.forEach((j) => {
      y = verificarSalto(doc, y, 8);
      const nombre = j._id?.nombre || "Juego";
      const sesiones = j.totalSesiones || 0;
      const promedio = Math.round(j.promedioPuntuacion || 0);

      doc.setFillColor(...GRIS_CLARO);
      doc.roundedRect(MARGEN, y - 3, ANCHO_UTIL, 8, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRIS_OSCURO);
      doc.text(nombre, MARGEN + 3, y + 1.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRIS_MEDIO);
      doc.text(`${sesiones} sesiones  ·  Promedio: ${promedio} pts`, MARGEN + 110, y + 1.5);
      y += 11;
    });
    y += 2;
  }

  // ── Historial de sesiones ─────────────────────────────────────────────────
  y = verificarSalto(doc, y, 30);
  y = seccion(doc, y, "Historial de Sesiones");
  y = tablaSesiones(doc, y, historial);

  // ── Firma ─────────────────────────────────────────────────────────────────
  y = verificarSalto(doc, y, 30);
  y += 8;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, y, MARGEN + 60, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRIS_MEDIO);
  doc.text(profesional?.nombre || "Profesional tratante", MARGEN, y + 4);
  if (profesional?.especialidad) {
    const espLabel = {
      fonoaudiologia: "Fonoaudiología", psicopedagogia: "Psicopedagogía",
      educacion_especial: "Educación Especial", terapia_lenguaje: "Terapia del Lenguaje",
      audiologia: "Audiología", neuropsicologia: "Neuropsicología",
      psicologia: "Psicología", otro: "Profesional",
    };
    doc.text(espLabel[profesional.especialidad] || profesional.especialidad, MARGEN, y + 8);
  }

  dibujarPie(doc);
  doc.save(`informe_clinico_${paciente.nombre}_${paciente.apellido}.pdf`);
};
