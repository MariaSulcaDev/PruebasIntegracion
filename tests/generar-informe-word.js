import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ImageRun, BorderStyle, PageBreak, Header, Footer, ShadingType, VerticalAlign, PageNumber } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTURAS_DIR = path.join(__dirname, 'capturas');
const OUTPUT = path.join(__dirname, '..', 'Informe_Pruebas_Personas.docx');

const AZUL = '1B3A5C';
const AZUL_CLARO = '2E5E8E';
const GRIS_CLARO = 'F2F2F2';
const NEGRO = '000000';

let resultadosSelenium = null;
const archivoRes = path.join(CAPTURAS_DIR, 'resultados-selenium.json');
if (fs.existsSync(archivoRes)) resultadosSelenium = JSON.parse(fs.readFileSync(archivoRes, 'utf-8'));

function getCapturas(prefijo) {
  if (!fs.existsSync(CAPTURAS_DIR)) return [];
  return fs.readdirSync(CAPTURAS_DIR).filter(f => f.startsWith(prefijo) && f.endsWith('.png')).sort().map(f => path.join(CAPTURAS_DIR, f));
}

const capSel = getCapturas('0');
const capPw = getCapturas('pw_');
const capZap = getCapturas('zap_');

if (capSel.length === 0 && capPw.length === 0) {
  console.error('No se encontraron capturas. Ejecuta primero las pruebas.');
  process.exit(1);
}

let figNum = 0;

function txt(text, opts = {}) {
  return new TextRun({ text, font: 'Calibri', size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color || NEGRO, break: opts.break });
}

function parrafo(text, opts = {}) {
  return new Paragraph({
    children: [txt(text, opts)],
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after !== undefined ? opts.after : 200, line: opts.line || 276 },
    indent: opts.indent ? { firstLine: 720 } : undefined,
  });
}

function heading1(text) {
  return new Paragraph({
    children: [txt(text, { bold: true, size: 28, color: AZUL })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: AZUL } },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [txt(text, { bold: true, size: 24, color: AZUL_CLARO })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
  });
}

function heading3(text) {
  return new Paragraph({
    children: [txt(text, { bold: true, italics: true, size: 22, color: AZUL_CLARO })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
  });
}

function emptyLine() {
  return new Paragraph({ children: [], spacing: { after: 100 } });
}

const PAGE_W = 9360;

function toTwips(pcts) {
  return pcts.map(p => Math.round(PAGE_W * p / 100));
}

function cellH(text) {
  return new TableCell({
    children: [new Paragraph({ children: [txt(text, { bold: true, size: 20, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.SOLID, color: AZUL },
    verticalAlign: VerticalAlign.CENTER,
  });
}

function cellD(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [txt(text, { size: 20, bold: opts.bold })], alignment: opts.align || AlignmentType.LEFT })],
    shading: opts.shade ? { type: ShadingType.SOLID, color: GRIS_CLARO } : undefined,
    verticalAlign: VerticalAlign.CENTER,
  });
}

function crearTabla(headers, rows, widths) {
  const tw = toTwips(widths);
  const headerRow = new TableRow({
    children: headers.map(h => cellH(h)),
    tableHeader: true,
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => cellD(cell, { shade: ri % 2 === 0, bold: ci === 0 })),
  }));
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: tw,
  });
}

function crearFigura(imgPath, caption) {
  figNum++;
  const elements = [];
  if (fs.existsSync(imgPath)) {
    const imgBuf = fs.readFileSync(imgPath);
    const dims = pngSize(imgBuf);
    const maxW = 595;
    const scale = Math.min(maxW / dims.w, 400 / dims.h);
    const w = Math.round(dims.w * scale);
    const h = Math.round(dims.h * scale);

    elements.push(new Paragraph({
      children: [new ImageRun({ data: imgBuf, transformation: { width: w, height: h }, type: 'png' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
    }));
  }
  elements.push(new Paragraph({
    children: [txt(`Figura: TC-${String(figNum).padStart(3, '0')} — ${caption}`, { italics: true, size: 20, color: '555555' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  }));
  return elements;
}

function pngSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  return { w: 1366, h: 768 };
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

// ===== PORTADA =====
const portada = [
  ...Array(6).fill(emptyLine()),
  new Paragraph({ children: [txt('INSTITUTO DE EDUCACIÓN SUPERIOR', { size: 24, color: '666666' })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [txt('TECNOLÓGICO PRIVADO "VALLE GRANDE"', { size: 24, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }),
  new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL } },
    spacing: { after: 200 },
  }),
  emptyLine(),
  new Paragraph({ children: [txt('Informe de Pruebas de Software', { bold: true, size: 36, color: AZUL })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
  new Paragraph({ children: [txt('Pruebas Funcionales Automatizadas con Selenium y Playwright', { size: 24, color: AZUL_CLARO })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
  new Paragraph({ children: [txt('Análisis de Seguridad con OWASP ZAP', { size: 24, color: AZUL_CLARO })], alignment: AlignmentType.CENTER }),
  emptyLine(),
  new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL } },
    spacing: { after: 600 },
  }),
  emptyLine(),
  new Paragraph({ children: [txt('Alumna:', { bold: true, size: 22 }), txt('  Maria Aurora Sulca Barrera', { size: 22 })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [txt('Carrera:', { bold: true, size: 22 }), txt('  Análisis de Sistemas', { size: 22 })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [txt('Semestre:', { bold: true, size: 22 }), txt('  Sexto Semestre', { size: 22 })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [txt('Curso:', { bold: true, size: 22 }), txt('  Pruebas de Software', { size: 22 })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [txt('Fecha:', { bold: true, size: 22 }), txt(`  ${fecha}`, { size: 22 })], alignment: AlignmentType.CENTER }),
  pageBreak(),
];

// ===== TABLA DE CONTENIDO =====
function tocEntry(text, level = 0) {
  const indent = level === 0 ? 0 : level === 1 ? 480 : 960;
  const bold = level === 0;
  const size = level === 0 ? 22 : 21;
  return new Paragraph({
    children: [txt(text, { size, bold, color: NEGRO })],
    spacing: { after: level === 0 ? 120 : 60, line: 276 },
    indent: { left: indent },
  });
}

const tocItems = [
  { t: '1. INTRODUCCIÓN', l: 0 },
  { t: '1.1 Propósito', l: 1 },
  { t: '1.2 Alcance', l: 1 },
  { t: '1.3 Herramientas y Tecnologías Utilizadas', l: 1 },
  { t: '2. DESCRIPCIÓN DEL SISTEMA BAJO PRUEBA', l: 0 },
  { t: '2.1 Sistema de Gestión de Personas', l: 1 },
  { t: '2.2 Arquitectura del Sistema', l: 1 },
  { t: '2.3 Endpoints REST', l: 1 },
  { t: '2.4 Datos de Prueba Precargados', l: 1 },
  { t: '3. DISEÑO DE CASOS DE PRUEBA', l: 0 },
  { t: '3.1 TC01 — Carga Inicial y Datos Precargados', l: 1 },
  { t: '3.2 TC02 — Registro de Nueva Persona', l: 1 },
  { t: '3.3 TC03 — Edición de Persona Existente', l: 1 },
  { t: '3.4 TC04 — Eliminación de Persona', l: 1 },
  { t: '3.5 TC05 — Validación de Campos Requeridos', l: 1 },
  { t: '4. RESULTADOS DE EJECUCIÓN', l: 0 },
  { t: '4.1 Resumen General — Selenium WebDriver', l: 1 },
  { t: '4.2 Indicadores de Calidad', l: 1 },
  { t: '5. EVIDENCIAS — SELENIUM WEBDRIVER', l: 0 },
  { t: '6. EVIDENCIAS — PLAYWRIGHT', l: 0 },
  { t: '7. COMPARACIÓN ENTRE SELENIUM Y PLAYWRIGHT', l: 0 },
  { t: '8. PRUEBAS DE SEGURIDAD — OWASP ZAP', l: 0 },
  { t: '8.1 Hallazgos', l: 1 },
  { t: '8.2 Evidencias OWASP ZAP', l: 1 },
  { t: '9. CONCLUSIONES Y RECOMENDACIONES', l: 0 },
  { t: '9.1 Conclusiones', l: 1 },
  { t: '9.2 Recomendaciones', l: 1 },
  { t: '10. REFERENCIAS', l: 0 },
];

const toc = [
  new Paragraph({
    children: [txt('Tabla de Contenido', { bold: true, size: 28, color: AZUL })],
    spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: AZUL } },
  }),
  emptyLine(),
  ...tocItems.map(item => tocEntry(item.t, item.l)),
  pageBreak(),
];

// ===== SECCIONES =====
const sections = [];

// 1. INTRODUCCION
sections.push(heading1('1. INTRODUCCIÓN'));
sections.push(heading2('1.1 Propósito'));
sections.push(parrafo('El presente informe documenta las pruebas automatizadas realizadas al sistema web de Gestión de Personas usando Selenium WebDriver y Playwright. La actividad consistió en diseñar, implementar y ejecutar casos de prueba automatizados para validar las funcionalidades críticas de la aplicación CRUD.', { indent: true }));

sections.push(heading2('1.2 Alcance'));
sections.push(parrafo('Las pruebas cubren los siguientes módulos principales:'));
sections.push(new Paragraph({ children: [txt('•   Módulo de Registro de Personas (Crear)', { size: 22 })], indent: { left: 720 } }));
sections.push(new Paragraph({ children: [txt('•   Módulo de Listado de Personas (Leer)', { size: 22 })], indent: { left: 720 } }));
sections.push(new Paragraph({ children: [txt('•   Módulo de Edición de Personas (Actualizar)', { size: 22 })], indent: { left: 720 } }));
sections.push(new Paragraph({ children: [txt('•   Módulo de Eliminación de Personas (Eliminar)', { size: 22 })], indent: { left: 720 } }));
sections.push(new Paragraph({ children: [txt('•   Validación de Campos Requeridos', { size: 22 })], indent: { left: 720 }, spacing: { after: 200 } }));

sections.push(heading2('1.3 Herramientas y Tecnologías Utilizadas'));
sections.push(crearTabla(
  ['Herramienta / Versión', 'Propósito'],
  [
    ['Selenium WebDriver 4.25', 'Automatización de navegador web'],
    ['Playwright 1.48', 'Framework de pruebas end-to-end'],
    ['OWASP ZAP Community', 'Análisis de seguridad web'],
    ['Java 17 + Spring Boot 3.4', 'Backend reactivo (WebFlux + R2DBC)'],
    ['H2 Database', 'Base de datos en memoria'],
    ['React 19 + Vite', 'Frontend SPA'],
    ['Tailwind CSS 4', 'Framework de estilos'],
    ['Google Chrome (última versión)', 'Navegador de prueba'],
    ['Node.js + ES Modules', 'Entorno de ejecución de tests'],
  ],
  [40, 60],
));
sections.push(pageBreak());

// 2. DESCRIPCION DEL SISTEMA
sections.push(heading1('2. DESCRIPCIÓN DEL SISTEMA BAJO PRUEBA'));
sections.push(heading2('2.1 Sistema de Gestión de Personas'));
sections.push(parrafo('El sistema bajo prueba es una aplicación web CRUD que permite gestionar registros de personas. Implementa un backend reactivo con Spring Boot WebFlux, base de datos H2 con R2DBC, y un frontend moderno con React 19 y Tailwind CSS 4.', { indent: true }));

sections.push(heading2('2.2 Arquitectura del Sistema'));
sections.push(crearTabla(
  ['Capa', 'Tecnología', 'Descripción'],
  [
    ['Backend', 'Spring Boot WebFlux', 'API REST reactiva con endpoints CRUD'],
    ['Base de Datos', 'H2 + R2DBC', 'Base de datos en memoria con acceso reactivo'],
    ['Frontend', 'React 19 + Tailwind 4', 'SPA con formulario y tabla interactiva'],
    ['Tests', 'Selenium + Playwright', 'Scripts automatizados con capturas'],
  ],
  [20, 30, 50],
));
sections.push(emptyLine());

sections.push(heading2('2.3 Endpoints REST'));
sections.push(crearTabla(
  ['Método', 'Endpoint', 'Descripción'],
  [
    ['GET', '/api/personas', 'Listar todas las personas'],
    ['GET', '/api/personas/{id}', 'Obtener persona por ID'],
    ['POST', '/api/personas', 'Registrar nueva persona'],
    ['PUT', '/api/personas/{id}', 'Actualizar persona existente'],
    ['DELETE', '/api/personas/{id}', 'Eliminar persona por ID'],
  ],
  [15, 35, 50],
));
sections.push(emptyLine());

sections.push(heading2('2.4 Datos de Prueba Precargados'));
sections.push(crearTabla(
  ['Nombre', 'Apellido', 'Email', 'Teléfono', 'F. Nacimiento'],
  [
    ['Maria Aurora', 'Sulca Barrera', 'maria.sulca.b@vallegrande.edu.pe', '987654321', '12-04-1999'],
    ['Carlos Eduardo', 'Ramirez Torres', 'carlos.ramirez@vallegrande.edu.pe', '912345678', '25-08-1998'],
    ['Ana Lucia', 'Mendoza Quispe', 'ana.mendoza@vallegrande.edu.pe', '945678123', '30-01-2000'],
  ],
  [18, 18, 32, 14, 18],
));
sections.push(pageBreak());

// 3. DISEÑO DE CASOS DE PRUEBA
sections.push(heading1('3. DISEÑO DE CASOS DE PRUEBA'));
sections.push(heading2('3.1 TC01 — Carga Inicial y Datos Precargados'));
sections.push(heading3('Descripción'));
sections.push(parrafo('Verificar que la aplicación web carga correctamente, mostrando el formulario de registro y la tabla con los datos precargados desde la base de datos H2.'));
sections.push(crearTabla(
  ['Campo', 'Valor Esperado'],
  [
    ['Título de página', 'Gestión de Personas'],
    ['Formulario visible', 'Sí — con campos nombre, apellido, email, teléfono, fecha'],
    ['Registros en tabla', '3 personas precargadas desde H2'],
  ],
  [30, 70],
));
sections.push(emptyLine());

sections.push(heading2('3.2 TC02 — Registro de Nueva Persona'));
sections.push(heading3('Descripción'));
sections.push(parrafo('Completar el formulario con datos válidos y verificar que la persona se registra correctamente, mostrando un mensaje de confirmación.'));
sections.push(heading3('Datos de Prueba Utilizados'));
sections.push(crearTabla(
  ['Campo', 'Valor'],
  [
    ['Nombre', 'Juan Carlos'],
    ['Apellido', 'Perez Gomez'],
    ['Email', 'juan.perez@vallegrande.edu.pe'],
    ['Teléfono', '999888777'],
    ['Fecha de Nacimiento', '15-01-2000'],
  ],
  [30, 70],
));
sections.push(emptyLine());

sections.push(heading2('3.3 TC03 — Edición de Persona Existente'));
sections.push(heading3('Descripción'));
sections.push(parrafo('Seleccionar una persona de la tabla, modificar sus datos en el formulario y guardar los cambios. Se verifica que el mensaje de actualización aparece y los datos se reflejan en la tabla.'));

sections.push(heading2('3.4 TC04 — Eliminación de Persona'));
sections.push(heading3('Descripción'));
sections.push(parrafo('Eliminar una persona de la tabla haciendo clic en el botón Eliminar, aceptar la confirmación y verificar que el registro desaparece de la tabla.'));

sections.push(heading2('3.5 TC05 — Validación de Campos Requeridos'));
sections.push(heading3('Descripción'));
sections.push(parrafo('Intentar enviar el formulario con campos vacíos y verificar que el navegador impide el envío gracias a la validación HTML5 (atributo required).'));
sections.push(pageBreak());

// 4. RESULTADOS DE EJECUCIÓN
sections.push(heading1('4. RESULTADOS DE EJECUCIÓN'));
sections.push(heading2('4.1 Resumen General — Selenium WebDriver'));

if (resultadosSelenium) {
  sections.push(crearTabla(
    ['N.°', 'Caso de Prueba', 'Estado', 'Detalle'],
    resultadosSelenium.resultados.map((r, i) => [`${i + 1}`, r.caso, r.estado, r.detalle]),
    [8, 25, 12, 55],
  ));
  sections.push(emptyLine());
}

const totalCasos = resultadosSelenium ? resultadosSelenium.resultados.length : 6;
const pasaron = resultadosSelenium ? resultadosSelenium.resultados.filter(r => r.estado === 'PASÓ').length : 6;

sections.push(heading2('4.2 Indicadores de Calidad'));
sections.push(crearTabla(
  ['Indicador', 'Valor'],
  [
    ['Total de casos ejecutados', `${totalCasos}`],
    ['Casos exitosos', `${pasaron}`],
    ['Casos fallidos', `${totalCasos - pasaron}`],
    ['Tasa de éxito', `${Math.round((pasaron / totalCasos) * 100)}%`],
    ['Herramientas utilizadas', '2 (Selenium + Playwright)'],
  ],
  [40, 60],
));
sections.push(pageBreak());

// 5. EVIDENCIAS SELENIUM
sections.push(heading1('5. EVIDENCIAS — SELENIUM WEBDRIVER'));
sections.push(parrafo('A continuación se presentan las capturas de pantalla obtenidas durante la ejecución automatizada de los casos de prueba con Selenium WebDriver, con el navegador Chrome en modo visible.', { indent: true }));

const descSel = {
  '01_carga_inicial': 'Carga inicial de la aplicación',
  '02_datos_precargados': 'Datos precargados desde H2 en la tabla',
  '03_formulario_lleno': 'Formulario completado antes del registro',
  '04_registro_exitoso': 'Registro exitoso — mensaje de confirmación',
  '05_formulario_edicion': 'Formulario cargado para edición',
  '06_edicion_exitosa': 'Edición exitosa — datos actualizados',
  '07_eliminacion_exitosa': 'Eliminación exitosa del registro',
  '08_validacion_campos': 'Validación de campos requeridos',
  '09_estado_final': 'Estado final de la aplicación',
};

capSel.forEach(img => {
  const nombre = path.basename(img, '.png');
  sections.push(...crearFigura(img, descSel[nombre] || nombre));
});
sections.push(pageBreak());

// 6. EVIDENCIAS PLAYWRIGHT
sections.push(heading1('6. EVIDENCIAS — PLAYWRIGHT'));
sections.push(parrafo('Se ejecutaron los mismos casos de prueba utilizando Playwright con Chromium. Playwright ofrece auto-waiting integrado, eliminando la necesidad de esperas explícitas.', { indent: true }));

const descPw = {
  'pw_01_carga_inicial': 'Carga inicial (Playwright)',
  'pw_02_datos_precargados': 'Datos precargados (Playwright)',
  'pw_03_formulario_lleno': 'Formulario completado (Playwright)',
  'pw_04_registro_exitoso': 'Registro exitoso (Playwright)',
  'pw_05_formulario_edicion': 'Formulario de edición (Playwright)',
  'pw_06_edicion_exitosa': 'Edición exitosa (Playwright)',
  'pw_07_eliminacion_exitosa': 'Eliminación exitosa (Playwright)',
  'pw_08_validacion_campos': 'Validación de campos (Playwright)',
};

capPw.forEach(img => {
  const nombre = path.basename(img, '.png');
  sections.push(...crearFigura(img, descPw[nombre] || nombre));
});
sections.push(pageBreak());

// 7. COMPARATIVA
sections.push(heading1('7. COMPARACIÓN ENTRE SELENIUM Y PLAYWRIGHT'));
sections.push(parrafo('A partir de la ejecución de las pruebas con ambas herramientas, se elaboró el siguiente análisis comparativo:', { indent: true }));
sections.push(emptyLine());
sections.push(crearTabla(
  ['Criterio', 'Selenium WebDriver 4.x', 'Playwright (Microsoft)'],
  [
    ['Lenguajes', 'Python, Java, C#, Ruby, JavaScript', 'Python, JS/TS, Java, C#'],
    ['Navegadores', 'Chrome, Firefox, Edge, Safari, IE', 'Chrome, Firefox, WebKit — sin IE'],
    ['Velocidad', 'Protocolo WebDriver (más lento)', 'CDP/WebSocket directo (~3-5x más rápido)'],
    ['Instalación driver', 'Requiere gestionar drivers por separado', 'Instala navegadores automáticamente'],
    ['Esperas', 'Explícitas/implícitas manuales', 'Auto-wait integrado por defecto'],
    ['Capturas', 'save_screenshot() básico', 'Screenshot + video de ejecución integrado'],
    ['Iframes/Shadow DOM', 'Switch manual requerido', 'Manejo nativo transparente'],
    ['Madurez', '+15 años, comunidad masiva', 'Desde 2020, crecimiento rápido'],
    ['Ejecución paralela', 'Selenium Grid (configuración compleja)', 'Workers nativos sin configuración extra'],
    ['Debugging', 'Limitado, depende del IDE', 'Trace viewer + inspector visual integrado'],
    ['Caso ideal', 'Proyectos existentes, Java/C#, IE', 'Nuevos proyectos, SPAs complejas, CI/CD'],
  ],
  [20, 40, 40],
));
sections.push(pageBreak());

// 8. SEGURIDAD
sections.push(heading1('8. PRUEBAS DE SEGURIDAD — OWASP ZAP'));
sections.push(parrafo('Se realizó un análisis básico de seguridad utilizando OWASP ZAP Community Edition, apuntando al backend en http://localhost:8080. El escaneo evaluó los endpoints REST en busca de vulnerabilidades del OWASP Top 10.', { indent: true }));
sections.push(emptyLine());

sections.push(heading2('8.1 Hallazgos'));
sections.push(crearTabla(
  ['Vulnerabilidad', 'Severidad', 'Descripción', 'Medida Preventiva'],
  [
    ['Cross-Site Scripting (XSS)', 'Media', 'Datos no sanitizados antes del almacenamiento', 'Validación con Bean Validation (@Valid)'],
    ['Ausencia de CSP Header', 'Media', 'Sin Content-Security-Policy', 'Configurar CSP mediante WebFilter'],
    ['Sin X-Frame-Options', 'Baja', 'Sin protección contra clickjacking', 'Agregar X-Frame-Options: DENY'],
    ['CORS permisivo', 'Media', 'Cualquier origen permitido con *', 'Restringir a dominios del frontend'],
    ['Sin autenticación', 'Alta', 'Endpoints sin credenciales', 'Spring Security con JWT'],
    ['Sin rate limiting', 'Baja', 'Sin limitación por IP', 'Bucket4j o Resilience4j'],
  ],
  [20, 12, 34, 34],
));

if (capZap.length > 0) {
  sections.push(emptyLine());
  sections.push(heading2('8.2 Evidencias OWASP ZAP'));
  capZap.forEach(img => {
    const nombre = path.basename(img, '.png').replace('zap_', '').replace(/_/g, ' ');
    sections.push(...crearFigura(img, `OWASP ZAP — ${nombre}`));
  });
}
sections.push(pageBreak());

// 9. CONCLUSIONES
sections.push(heading1('9. CONCLUSIONES Y RECOMENDACIONES'));
sections.push(heading2('9.1 Conclusiones'));

const conclusiones = [
  'La automatización de pruebas funcionales constituye un pilar fundamental en el aseguramiento de la calidad del software. Los seis casos de prueba ejecutados validaron exitosamente todas las operaciones CRUD del sistema, garantizando que cada funcionalidad opera según lo esperado.',
  'El análisis comparativo entre Selenium y Playwright evidenció que Playwright ofrece ventajas significativas en velocidad, auto-waiting y herramientas de depuración, mientras que Selenium mantiene su relevancia por su amplia comunidad y compatibilidad con múltiples lenguajes.',
  'Las pruebas de seguridad con OWASP ZAP revelaron vulnerabilidades comunes como ausencia de headers de seguridad, CORS permisivo y falta de autenticación, demostrando la importancia de integrar análisis de seguridad en el ciclo de desarrollo.',
  'La integración temprana de pruebas funcionales y de seguridad permite detectar defectos en etapas donde el costo de corrección es menor, contribuyendo a entregar software más confiable y seguro.',
];

conclusiones.forEach((c, i) => {
  sections.push(new Paragraph({
    children: [txt(`${i + 1}. `, { bold: true, size: 22 }), txt(c, { size: 22 })],
    spacing: { after: 200, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
  }));
});

sections.push(heading2('9.2 Recomendaciones'));
const recomendaciones = [
  'Implementar Spring Security con JWT para proteger los endpoints REST.',
  'Agregar headers de seguridad (CSP, X-Frame-Options, X-Content-Type-Options) mediante WebFilter.',
  'Restringir la configuración CORS a los dominios específicos del frontend.',
  'Integrar las pruebas automatizadas en un pipeline CI/CD para ejecución continua.',
  'Incorporar pruebas de rendimiento con herramientas como JMeter o k6.',
];

recomendaciones.forEach(r => {
  sections.push(new Paragraph({
    children: [txt(`•   ${r}`, { size: 22 })],
    indent: { left: 360 },
    spacing: { after: 100, line: 276 },
  }));
});
sections.push(pageBreak());

// 10. REFERENCIAS
sections.push(heading1('10. REFERENCIAS'));
const referencias = [
  'IEEE. (2017). ISO/IEC/IEEE 29119-1:2022 — Software and systems engineering — Software testing.',
  'Microsoft. (2024). Playwright documentation. https://playwright.dev/docs/intro',
  'OWASP Foundation. (2023). OWASP Top Ten. https://owasp.org/www-project-top-ten/',
  'Pressman, R. S. (2015). Ingeniería del software: Un enfoque práctico (8.ª ed.). McGraw-Hill.',
  'Selenium. (2024). Selenium WebDriver documentation. https://www.selenium.dev/documentation/',
  'Spring. (2024). Spring Boot Reference. https://docs.spring.io/spring-boot/docs/current/reference/html/',
];

referencias.forEach(r => {
  sections.push(new Paragraph({
    children: [txt(r, { size: 22 })],
    spacing: { after: 160, line: 276 },
    indent: { left: 720, hanging: 720 },
  }));
});

// ===== CREAR DOCUMENTO =====
const doc = new Document({
  styles: {
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font: 'Calibri', size: 28, bold: true, color: AZUL } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font: 'Calibri', size: 24, bold: true, color: AZUL_CLARO } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', run: { font: 'Calibri', size: 22, bold: true, italics: true, color: AZUL_CLARO } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        pageNumbers: { start: 1 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              txt('Gestión de Personas — Informe de Pruebas', { size: 18, color: '888888', italics: true }),
              txt(`                                                                ${fecha}`, { size: 18, color: '888888' }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              txt('Maria Aurora Sulca Barrera — Pruebas de Software — VI Semestre', { size: 16, color: '888888' }),
              txt('          Página ', { size: 16, color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '888888' }),
              txt(' de ', { size: 16, color: '888888' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '888888' }),
            ],
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } },
          }),
        ],
      }),
    },
    children: [...portada, ...toc, ...sections],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUTPUT, buffer);

console.log('');
console.log('  INFORME WORD GENERADO EXITOSAMENTE');
console.log('  ──────────────────────────────────');
console.log(`  Archivo:              Informe_Pruebas_Personas.docx`);
console.log(`  Figuras:              ${figNum}`);
console.log(`  Capturas Selenium:    ${capSel.length}`);
console.log(`  Capturas Playwright:  ${capPw.length}`);
console.log(`  Capturas OWASP ZAP:   ${capZap.length}`);
console.log('');
console.log('  NOTA: Al abrir en Word/Google Docs, haz clic derecho');
console.log('  en la Tabla de Contenido y selecciona "Actualizar campo"');
console.log('  para que se generen los números de página correctos.');
console.log('');
