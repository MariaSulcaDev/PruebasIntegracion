import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTURAS_DIR = path.join(__dirname, 'capturas');
const OUTPUT = path.join(__dirname, '..', 'INFORME_PRUEBAS_SOFTWARE.pdf');

const M = 72;

let resultadosSelenium = null;
const archivoRes = path.join(CAPTURAS_DIR, 'resultados-selenium.json');
if (fs.existsSync(archivoRes)) {
  resultadosSelenium = JSON.parse(fs.readFileSync(archivoRes, 'utf-8'));
}

function getCapturas(prefijo) {
  if (!fs.existsSync(CAPTURAS_DIR)) return [];
  return fs.readdirSync(CAPTURAS_DIR)
    .filter(f => f.startsWith(prefijo) && f.endsWith('.png'))
    .sort()
    .map(f => path.join(CAPTURAS_DIR, f));
}

const capSelenium = getCapturas('0');
const capPlaywright = getCapturas('pw_');
const capZap = getCapturas('zap_');

if (capSelenium.length === 0 && capPlaywright.length === 0) {
  console.error('No se encontraron capturas. Ejecuta primero las pruebas.');
  process.exit(1);
}

const doc = new PDFDocument({ size: 'A4', margins: { top: M, bottom: M, left: M, right: M }, bufferPages: true });
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const W = doc.page.width - M * 2;
const PAGE_H = doc.page.height;
let figNum = 0;
let tabNum = 0;

function need(h) {
  if (doc.y + h > PAGE_H - M - 20) { doc.addPage(); return true; }
  return false;
}

function p(t, opts = {}) {
  doc.fontSize(opts.s || 12).fillColor('#000').font(opts.f || 'Times-Roman')
    .text(t, opts.x || M, opts.y, { width: opts.w || W, align: opts.a || 'justify', lineGap: 10, indent: opts.ind || 0 });
}

function centro(t, s, f) {
  doc.fontSize(s || 12).fillColor('#000').font(f || 'Times-Roman').text(t, M, doc.y, { width: W, align: 'center', lineGap: 10 });
}

function h1(t) { doc.addPage(); centro(t, 14, 'Times-Bold'); doc.moveDown(1); }

function h2(t) { need(40); doc.moveDown(0.8); doc.fontSize(12).fillColor('#000').font('Times-Bold').text(t, M, doc.y, { width: W, lineGap: 10 }); doc.moveDown(0.5); }

function h3(t) { need(30); doc.moveDown(0.5); doc.fontSize(12).fillColor('#000').font('Times-BoldItalic').text(`     ${t}`, M, doc.y, { width: W, lineGap: 10 }); doc.moveDown(0.3); }

function linea(y) { doc.moveTo(M, y).lineTo(M + W, y).lineWidth(1).strokeColor('#000').stroke(); }

function lineaFina(y) { doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.5).strokeColor('#000').stroke(); }

function figura(imgPath, descripcion) {
  figNum++;
  doc.addPage();

  if (fs.existsSync(imgPath)) {
    const imgBuf = fs.readFileSync(imgPath);
    const maxW = W;
    const maxH = PAGE_H - M * 2 - 80;
    doc.image(imgBuf, M, doc.y, { fit: [maxW, maxH] });

    const imgDims = sizeOf(imgBuf);
    const scale = Math.min(maxW / imgDims.w, maxH / imgDims.h);
    const renderedH = imgDims.h * scale;
    doc.y += renderedH + 8;
  }

  doc.fontSize(11).fillColor('#000').font('Times-Bold').text(`Figura ${figNum}`, M, doc.y, { width: W, lineGap: 4 });
  doc.fontSize(11).font('Times-Italic').text(descripcion, M, doc.y, { width: W, lineGap: 4 });
  doc.moveDown(0.5);
}

function sizeOf(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  return { w: 1366, h: 768 };
}

function tablaHead(titulo, headers, cw) {
  tabNum++;
  need(100);
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#000').font('Times-Bold').text(`Tabla ${tabNum}`, M, doc.y, { width: W, lineGap: 2 });
  doc.fontSize(11).font('Times-Italic').text(titulo, M, doc.y, { width: W, lineGap: 2 });
  doc.moveDown(0.4);

  linea(doc.y);
  const y = doc.y + 4;
  let x = M;
  headers.forEach((h, i) => {
    doc.fontSize(9).font('Times-Bold').fillColor('#000').text(h, x + 3, y, { width: cw[i] - 6 });
    x += cw[i];
  });
  doc.y = y + 16;
  lineaFina(doc.y);
  doc.y += 3;
}

function tablaRow(cells, cw) {
  need(30);
  const y = doc.y;
  let maxH = 14;
  cells.forEach((c, i) => {
    const h = doc.fontSize(9).font('Times-Roman').heightOfString(c || '', { width: cw[i] - 6 });
    maxH = Math.max(maxH, h + 6);
  });
  let x = M;
  cells.forEach((c, i) => {
    doc.fontSize(9).font('Times-Roman').fillColor('#000').text(c || '', x + 3, y, { width: cw[i] - 6 });
    x += cw[i];
  });
  doc.y = y + maxH;
}

function tablaEnd() { linea(doc.y); doc.moveDown(0.8); }


// ===== PORTADA =====
doc.moveDown(10);
centro('Informe de Pruebas de Software:', 16, 'Times-Bold');
doc.moveDown(0.3);
centro('Pruebas Funcionales Automatizadas y Análisis de Seguridad Web', 14, 'Times-Bold');
doc.moveDown(4);
centro('Maria Aurora Sulca Barrera');
doc.moveDown(0.3);
centro('Carrera Profesional de Análisis de Sistemas');
doc.moveDown(0.3);
centro('Instituto de Educación Superior Tecnológico Privado "Valle Grande"');
doc.moveDown(0.3);
centro('Curso: Pruebas de Software — Sexto Semestre');
doc.moveDown(2);
const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
centro(fecha);


// ===== RESUMEN =====
h1('Resumen');
p('El presente informe documenta la ejecución de pruebas funcionales automatizadas y un análisis básico de seguridad sobre una aplicación web CRUD de gestión de personas. Se utilizaron Selenium WebDriver y Playwright como herramientas de automatización, evaluando su rendimiento, facilidad de uso y capacidades. Adicionalmente, se realizó un análisis de vulnerabilidades con OWASP ZAP. Los resultados demuestran que ambas herramientas permiten automatizar eficazmente las pruebas funcionales, y que el análisis de seguridad es esencial para identificar vulnerabilidades comunes en aplicaciones web.', { ind: 36 });
doc.moveDown(0.5);
doc.fontSize(12).font('Times-Italic').fillColor('#000').text('Palabras clave: ', M, doc.y, { continued: true, indent: 36, width: W });
doc.font('Times-Roman').text('pruebas funcionales, automatización, Selenium, Playwright, seguridad web, OWASP ZAP, CRUD, Spring Boot WebFlux.');


// ===== INTRODUCCION =====
h1('Introducción');
p('En el desarrollo de software moderno, las pruebas constituyen una fase crítica que garantiza la calidad, funcionalidad y seguridad de las aplicaciones antes de su despliegue en entornos de producción. La automatización de pruebas funcionales permite ejecutar validaciones de manera sistemática, repetible y eficiente, reduciendo significativamente el margen de error humano (Pressman, 2015).', { ind: 36 });
doc.moveDown(0.5);
p('El presente trabajo tiene como objetivo desarrollar y ejecutar pruebas funcionales automatizadas sobre una aplicación web de gestión de personas, utilizando dos herramientas ampliamente reconocidas en la industria: Selenium WebDriver y Playwright. Además, se complementa con un análisis básico de seguridad mediante OWASP ZAP para identificar vulnerabilidades comunes como Cross-Site Scripting (XSS), inyección y configuraciones inseguras.', { ind: 36 });
doc.moveDown(0.5);
p('La aplicación evaluada implementa un CRUD (Create, Read, Update, Delete) completo con un backend reactivo desarrollado en Java con Spring Boot WebFlux y base de datos H2, junto con un frontend construido en React 19 con Tailwind CSS 4.', { ind: 36 });


// ===== MARCO TEORICO =====
h1('Marco Teórico');
h2('Pruebas de Software');
p('Las pruebas de software son un conjunto de actividades planificadas que se llevan a cabo para evaluar la calidad de un producto de software. Según el estándar IEEE 729, las pruebas de software son el proceso de operar un sistema o componente bajo condiciones específicas, observando o registrando los resultados, y evaluándolos con respecto a algún aspecto del sistema (IEEE, 2017).', { ind: 36 });

h2('Selenium WebDriver');
p('Selenium WebDriver es una herramienta de automatización de navegadores web de código abierto. Proporciona una API que permite controlar navegadores programáticamente, simulando interacciones reales del usuario como clics, escritura de texto y navegación entre páginas (Selenium, 2024).', { ind: 36 });

h2('Playwright');
p('Playwright es un framework de automatización desarrollado por Microsoft que permite realizar pruebas end-to-end en navegadores web. Se caracteriza por su auto-waiting integrado, soporte nativo para múltiples navegadores (Chromium, Firefox, WebKit) y herramientas avanzadas de depuración como Trace Viewer y Codegen (Microsoft, 2024).', { ind: 36 });

h2('OWASP ZAP');
p('OWASP ZAP (Zed Attack Proxy) es una herramienta de seguridad de código abierto mantenida por la Open Web Application Security Project (OWASP). Permite realizar escaneos automatizados y manuales para detectar vulnerabilidades en aplicaciones web, incluyendo las listadas en el OWASP Top 10 (OWASP Foundation, 2023).', { ind: 36 });


// ===== METODOLOGIA =====
h1('Metodología');

h2('Descripción del Sistema Evaluado');
p('El sistema bajo prueba es una aplicación web de gestión de personas que permite realizar operaciones CRUD sobre registros que contienen los campos: nombre, apellido, email, teléfono y fecha de nacimiento. Las fechas se presentan en formato dd-mm-yyyy.', { ind: 36 });

doc.moveDown(0.5);
const sw = [W * 0.35, W * 0.65];
tablaHead('Stack tecnológico del sistema evaluado', ['Componente', 'Tecnología'], sw);
[['Backend', 'Java 17 + Spring Boot 3.4 WebFlux'], ['Base de Datos', 'H2 Database con R2DBC (reactivo)'], ['Frontend', 'React 19 + Vite + Tailwind CSS 4'], ['Pruebas Funcionales', 'Selenium WebDriver 4 / Playwright'], ['Pruebas de Seguridad', 'OWASP ZAP Community Edition']].forEach(r => tablaRow(r, sw));
tablaEnd();

h2('Endpoints REST Evaluados');
const ew = [W * 0.15, W * 0.40, W * 0.45];
tablaHead('Endpoints de la API REST del sistema', ['Método', 'Endpoint', 'Descripción'], ew);
[['GET', '/api/personas', 'Listar todas las personas'], ['GET', '/api/personas/{id}', 'Obtener persona por ID'], ['POST', '/api/personas', 'Registrar nueva persona'], ['PUT', '/api/personas/{id}', 'Actualizar persona existente'], ['DELETE', '/api/personas/{id}', 'Eliminar persona por ID']].forEach(r => tablaRow(r, ew));
tablaEnd();

h2('Casos de Prueba Diseñados');
p('Se diseñaron seis casos de prueba funcionales que cubren las operaciones principales del sistema:', { ind: 36 });
doc.moveDown(0.3);
const cw = [W * 0.10, W * 0.30, W * 0.60];
tablaHead('Casos de prueba funcionales diseñados', ['N.°', 'Caso de Prueba', 'Descripción'], cw);
[['CP-01', 'Carga inicial', 'Verificar que la página carga correctamente con formulario y tabla'], ['CP-02', 'Datos precargados', 'Verificar que los datos iniciales de H2 se muestran en la tabla'], ['CP-03', 'Registrar persona', 'Completar el formulario y registrar una nueva persona'], ['CP-04', 'Editar persona', 'Seleccionar un registro, modificar datos y guardar cambios'], ['CP-05', 'Eliminar persona', 'Eliminar un registro y verificar que desaparece de la tabla'], ['CP-06', 'Validación de campos', 'Intentar enviar formulario vacío y verificar que no se envía']].forEach(r => tablaRow(r, cw));
tablaEnd();


// ===== RESULTADOS SELENIUM =====
h1('Resultados');

h2('Pruebas Funcionales con Selenium WebDriver');
p('Se ejecutaron los seis casos de prueba utilizando Selenium WebDriver con el navegador Google Chrome en modo visible, permitiendo observar en tiempo real la ejecución de cada acción automatizada. A continuación se presentan los resultados obtenidos y las evidencias capturadas.', { ind: 36 });

if (resultadosSelenium) {
  doc.moveDown(0.5);
  const rw = [W * 0.08, W * 0.28, W * 0.14, W * 0.50];
  tablaHead('Resultados de la ejecución con Selenium WebDriver', ['N.°', 'Caso de Prueba', 'Estado', 'Detalle'], rw);
  resultadosSelenium.resultados.forEach((r, i) => {
    tablaRow([`${i + 1}`, r.caso, r.estado, r.detalle], rw);
  });
  tablaEnd();
}

const descSel = {
  '01_carga_inicial': 'Carga inicial de la aplicación web, mostrando el formulario de registro y la tabla de personas con los datos precargados desde la base de datos H2.',
  '02_datos_precargados': 'Vista de la tabla con los registros precargados desde la base de datos H2, verificando la conexión entre el frontend React y el backend Spring Boot WebFlux.',
  '03_formulario_lleno': 'Formulario de registro completado con los datos de una nueva persona antes de hacer clic en el botón Guardar.',
  '04_registro_exitoso': 'Mensaje de confirmación tras el registro exitoso de una nueva persona, con el registro visible en la tabla.',
  '05_formulario_edicion': 'Formulario cargado con los datos de la persona seleccionada para edición, mostrando el botón Actualizar activo.',
  '06_edicion_exitosa': 'Mensaje de confirmación tras la actualización exitosa de los datos de la persona editada.',
  '07_eliminacion_exitosa': 'Estado de la tabla después de la eliminación exitosa de un registro.',
  '08_validacion_campos': 'Validación del navegador impidiendo el envío del formulario con campos obligatorios vacíos.',
  '09_estado_final': 'Estado final de la aplicación después de la ejecución completa de todos los casos de prueba.',
};

capSelenium.forEach(img => {
  const nombre = path.basename(img, '.png');
  figura(img, descSel[nombre] || nombre);
});


// ===== RESULTADOS PLAYWRIGHT =====
h1('Pruebas Funcionales con Playwright');
p('Se ejecutaron los mismos seis casos de prueba utilizando Playwright con Chromium. Playwright demostró una ejecución más fluida gracias a su mecanismo de auto-waiting, eliminando la necesidad de esperas explícitas.', { ind: 36 });

const descPw = {
  'pw_01_carga_inicial': 'Carga inicial de la aplicación capturada por Playwright, verificando la presencia del título, formulario y tabla.',
  'pw_02_datos_precargados': 'Verificación de los datos precargados desde H2 mediante Playwright.',
  'pw_03_formulario_lleno': 'Formulario completado con datos de prueba antes del registro.',
  'pw_04_registro_exitoso': 'Confirmación del registro exitoso mostrando el mensaje de retroalimentación.',
  'pw_05_formulario_edicion': 'Datos cargados en el formulario para edición tras seleccionar un registro existente.',
  'pw_06_edicion_exitosa': 'Mensaje de confirmación tras la actualización exitosa del registro editado.',
  'pw_07_eliminacion_exitosa': 'Estado de la tabla tras la eliminación de un registro.',
  'pw_08_validacion_campos': 'Validación de campos requeridos impidiendo el envío de datos incompletos.',
};

capPlaywright.forEach(img => {
  const nombre = path.basename(img, '.png');
  figura(img, descPw[nombre] || nombre);
});


// ===== COMPARATIVA =====
h1('Análisis Comparativo: Selenium vs Playwright');
p('A partir de la ejecución de las pruebas con ambas herramientas, se elaboró la siguiente tabla comparativa:', { ind: 36 });
doc.moveDown(0.5);

const compW = [W * 0.22, W * 0.39, W * 0.39];
tablaHead('Análisis comparativo entre Selenium WebDriver y Playwright', ['Criterio', 'Selenium WebDriver', 'Playwright'], compW);
[
  ['Configuración', 'Requiere WebDriver externo', 'Navegadores propios incluidos'],
  ['Mecanismo de espera', 'Esperas manuales', 'Auto-waiting nativo'],
  ['Velocidad', 'Moderada', 'Superior'],
  ['Navegadores', 'Chrome, Firefox, Safari, Edge', 'Chromium, Firefox, WebKit'],
  ['Lenguajes', 'Java, Python, JS, C#, Ruby', 'JS/TS, Python, Java, .NET'],
  ['Capturas', 'Requiere código adicional', 'API nativa con fullPage'],
  ['Paralelismo', 'Requiere Selenium Grid', 'Workers nativos'],
  ['Depuración', 'Limitada', 'Trace Viewer, Codegen'],
  ['Comunidad', 'Muy amplia (+15 años)', 'Crecimiento rápido (Microsoft)'],
].forEach(r => tablaRow(r, compW));
tablaEnd();

p('Playwright destaca por su velocidad de ejecución, auto-waiting integrado y herramientas de depuración. Sin embargo, Selenium sigue siendo la herramienta más utilizada en la industria por su amplia comunidad y compatibilidad con múltiples lenguajes.', { ind: 36 });


// ===== SEGURIDAD =====
h1('Pruebas de Seguridad con OWASP ZAP');
p('Se realizó un análisis básico de seguridad utilizando OWASP ZAP Community Edition, apuntando al backend en http://localhost:8080. El escaneo automatizado evaluó los endpoints REST en busca de vulnerabilidades del OWASP Top 10.', { ind: 36 });

doc.moveDown(0.5);
h2('Hallazgos Identificados');

const vw = [W * 0.28, W * 0.12, W * 0.60];
tablaHead('Vulnerabilidades identificadas en el análisis de seguridad', ['Vulnerabilidad', 'Severidad', 'Descripción y Medida Preventiva'], vw);
[
  ['Cross-Site Scripting (XSS)', 'Media', 'Datos no sanitizados antes del almacenamiento. Medida: validación con Bean Validation.'],
  ['Ausencia de CSP Header', 'Media', 'Sin Content-Security-Policy. Medida: configurar CSP mediante WebFilter.'],
  ['Ausencia de X-Frame-Options', 'Baja', 'Sin protección contra clickjacking. Medida: agregar X-Frame-Options: DENY.'],
  ['CORS permisivo', 'Media', 'Cualquier origen permitido. Medida: restringir a dominios del frontend.'],
  ['Sin autenticación', 'Alta', 'Endpoints sin credenciales. Medida: Spring Security con JWT.'],
  ['Sin rate limiting', 'Baja', 'Sin limitación por IP. Medida: Bucket4j o Resilience4j.'],
].forEach(r => tablaRow(r, vw));
tablaEnd();

if (capZap.length > 0) {
  capZap.forEach(img => {
    const nombre = path.basename(img, '.png').replace('zap_', '').replace(/_/g, ' ');
    figura(img, `Captura del análisis de seguridad con OWASP ZAP: ${nombre}.`);
  });
}


// ===== CONCLUSIONES =====
h1('Conclusiones');

const conclusiones = [
  'La automatización de pruebas funcionales constituye un pilar fundamental en el aseguramiento de la calidad del software. La ejecución de los seis casos de prueba sobre el sistema CRUD de personas demostró que la automatización permite validar de manera sistemática y repetible cada operación del sistema, garantizando que los cambios en el código no introduzcan regresiones funcionales.',
  'El análisis comparativo entre Selenium WebDriver y Playwright evidenció que, si bien Selenium posee una comunidad más amplia y mayor compatibilidad con lenguajes de programación, Playwright ofrece ventajas significativas en velocidad de ejecución, auto-waiting integrado y herramientas de depuración. La elección dependerá del contexto del proyecto.',
  'Las pruebas de seguridad realizadas con OWASP ZAP revelaron vulnerabilidades comunes que representarían riesgos significativos en producción. La ausencia de headers de seguridad, la configuración permisiva de CORS y la falta de autenticación subrayan la importancia de integrar el análisis de seguridad como parte del ciclo de vida del desarrollo.',
  'La integración temprana de pruebas funcionales automatizadas y análisis de seguridad en el proceso de desarrollo no debe considerarse una actividad complementaria, sino una práctica esencial. Estas actividades permiten detectar defectos en etapas tempranas, donde el costo de corrección es significativamente menor, contribuyendo a la entrega de productos de software más confiables y seguros.',
];

conclusiones.forEach((c, i) => {
  need(100);
  p(`${i + 1}. ${c}`, { ind: 36 });
  doc.moveDown(0.8);
});


// ===== REFERENCIAS =====
h1('Referencias');

const refs = [
  'IEEE. (2017). ISO/IEC/IEEE 29119-1:2022 - Software and systems engineering — Software testing. IEEE Standards Association.',
  'Microsoft. (2024). Playwright documentation. https://playwright.dev/docs/intro',
  'OWASP Foundation. (2023). OWASP Top Ten Web Application Security Risks. https://owasp.org/www-project-top-ten/',
  'Pressman, R. S. (2015). Ingeniería del software: Un enfoque práctico (8.ª ed.). McGraw-Hill Education.',
  'Selenium. (2024). Selenium WebDriver documentation. https://www.selenium.dev/documentation/webdriver/',
  'Spring. (2024). Spring Boot Reference Documentation. https://docs.spring.io/spring-boot/docs/current/reference/html/',
];

refs.forEach(r => {
  need(50);
  doc.fontSize(12).fillColor('#000').font('Times-Roman')
    .text(r, M + 36, doc.y, { width: W - 36, align: 'left', lineGap: 10, indent: -36 });
  doc.moveDown(0.4);
});


// ===== NUMERACION =====
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(12).fillColor('#000').font('Times-Roman')
    .text(`${i + 1}`, M, PAGE_H - M + 15, { width: W, align: 'center' });
}

doc.end();

stream.on('finish', () => {
  console.log('');
  console.log('  INFORME PDF GENERADO (Formato APA 7.ª edición)');
  console.log('  ───────────────────────────────────────────────');
  console.log(`  Archivo:              INFORME_PRUEBAS_SOFTWARE.pdf`);
  console.log(`  Figuras:              ${figNum}`);
  console.log(`  Tablas:               ${tabNum}`);
  console.log(`  Capturas Selenium:    ${capSelenium.length}`);
  console.log(`  Capturas Playwright:  ${capPlaywright.length}`);
  console.log(`  Capturas OWASP ZAP:   ${capZap.length}`);
  console.log('');
});
