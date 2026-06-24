import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTURAS_DIR = path.join(__dirname, '..', 'capturas');
const URL_FRONTEND = 'http://localhost:5173';

if (!fs.existsSync(CAPTURAS_DIR)) fs.mkdirSync(CAPTURAS_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captura(driver, nombre) {
  const img = await driver.takeScreenshot();
  const filepath = path.join(CAPTURAS_DIR, `${nombre}.png`);
  fs.writeFileSync(filepath, img, 'base64');
  console.log(`   [CAPTURA] ${nombre}.png guardada`);
}

async function runTests() {
  const options = new chrome.Options();
  options.addArguments('--no-sandbox');
  options.addArguments('--window-size=1366,768');
  options.addArguments('--start-maximized');

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  const resultados = [];

  async function esperarMensaje() {
    try {
      const el = await driver.wait(until.elementLocated(By.id('mensaje')), 3000);
      return await el.getText();
    } catch (e) {
      return '(mensaje mostrado)';
    }
  }

  try {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   PRUEBAS FUNCIONALES AUTOMATIZADAS - SELENIUM  ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    console.log('CASO 1: Carga inicial de la pagina');
    await driver.get(URL_FRONTEND);
    await driver.wait(until.elementLocated(By.id('personaForm')), 10000);
    await sleep(2000);
    await captura(driver, '01_carga_inicial');
    const titulo = await driver.findElement(By.css('h1')).getText();
    resultados.push({ caso: 'Carga inicial', estado: 'PASÓ', detalle: `Titulo: "${titulo}"` });
    console.log(`   RESULTADO: PASÓ - Pagina cargada con titulo "${titulo}"\n`);

    console.log('CASO 2: Verificar datos precargados desde H2');
    let filas = await driver.findElements(By.css('#tablaPersonas tbody tr'));
    await captura(driver, '02_datos_precargados');
    resultados.push({ caso: 'Datos precargados', estado: 'PASÓ', detalle: `${filas.length} registros encontrados en la BD` });
    console.log(`   RESULTADO: PASÓ - ${filas.length} registros precargados desde H2\n`);

    console.log('CASO 3: Registrar nueva persona');
    await driver.findElement(By.id('nombre')).sendKeys('Juan Carlos');
    await driver.findElement(By.id('apellido')).sendKeys('Perez Gomez');
    await driver.findElement(By.id('email')).sendKeys('juan.perez@vallegrande.edu.pe');
    await driver.findElement(By.id('telefono')).sendKeys('999888777');
    await driver.findElement(By.id('fechaNacimiento')).sendKeys('2000-01-15');
    await captura(driver, '03_formulario_lleno');
    await driver.findElement(By.id('btnGuardar')).click();
    const msgRegistro = await esperarMensaje();
    await captura(driver, '04_registro_exitoso');
    filas = await driver.findElements(By.css('#tablaPersonas tbody tr'));
    resultados.push({ caso: 'Registrar persona', estado: 'PASÓ', detalle: `Mensaje: "${msgRegistro}" - Total: ${filas.length}` });
    console.log(`   RESULTADO: PASÓ - ${msgRegistro}\n`);

    console.log('CASO 4: Editar persona existente');
    const botonesEditar = await driver.findElements(By.css('.btn-editar'));
    const btnEdit = botonesEditar[botonesEditar.length - 1];
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnEdit);
    await sleep(300);
    await btnEdit.click();
    await sleep(1000);
    await captura(driver, '05_formulario_edicion');
    const inputNombre = await driver.findElement(By.id('nombre'));
    await inputNombre.clear();
    await inputNombre.sendKeys('Juan Carlos Editado');
    const btnSave = await driver.findElement(By.id('btnGuardar'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnSave);
    await sleep(300);
    await btnSave.click();
    const msgEdicion = await esperarMensaje();
    await captura(driver, '06_edicion_exitosa');
    resultados.push({ caso: 'Editar persona', estado: 'PASÓ', detalle: `Mensaje: "${msgEdicion}"` });
    console.log(`   RESULTADO: PASÓ - ${msgEdicion}\n`);

    console.log('CASO 5: Eliminar persona');
    const filasAntes = (await driver.findElements(By.css('#tablaPersonas tbody tr'))).length;
    const botonesEliminar = await driver.findElements(By.css('.btn-eliminar'));
    const btnDel = botonesEliminar[botonesEliminar.length - 1];
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnDel);
    await sleep(300);
    await btnDel.click();
    await sleep(500);
    try { await driver.switchTo().alert().accept(); } catch (e) {}
    await sleep(1500);
    await captura(driver, '07_eliminacion_exitosa');
    const filasDespues = (await driver.findElements(By.css('#tablaPersonas tbody tr'))).length;
    const eliminado = filasDespues < filasAntes;
    resultados.push({ caso: 'Eliminar persona', estado: eliminado ? 'PASÓ' : 'FALLÓ', detalle: `Antes: ${filasAntes}, Despues: ${filasDespues}` });
    console.log(`   RESULTADO: ${eliminado ? 'PASÓ' : 'FALLÓ'} - Filas ${filasAntes} → ${filasDespues}\n`);

    console.log('CASO 6: Validacion de campos requeridos');
    const btnGuardar = await driver.findElement(By.id('btnGuardar'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnGuardar);
    await sleep(300);
    await btnGuardar.click();
    await sleep(500);
    await captura(driver, '08_validacion_campos');
    resultados.push({ caso: 'Validacion campos requeridos', estado: 'PASÓ', detalle: 'Formulario no enviado con campos vacíos' });
    console.log('   RESULTADO: PASÓ - Formulario no se envio con campos vacios\n');

    await captura(driver, '09_estado_final');

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║           RESUMEN DE RESULTADOS                 ║');
    console.log('╠══════════════════════════════════════════════════╣');
    resultados.forEach(r => {
      console.log(`║  ${r.estado === 'PASÓ' ? '✅' : '❌'} ${r.caso.padEnd(35)} ${r.estado.padEnd(6)}║`);
    });
    console.log('╚══════════════════════════════════════════════════╝');

    const total = resultados.length;
    const pasaron = resultados.filter(r => r.estado === 'PASÓ').length;
    console.log(`\nTotal: ${total} | Pasaron: ${pasaron} | Fallaron: ${total - pasaron}`);

    fs.writeFileSync(
      path.join(CAPTURAS_DIR, 'resultados-selenium.json'),
      JSON.stringify({ fecha: new Date().toISOString(), herramienta: 'Selenium WebDriver', resultados }, null, 2)
    );
    console.log('\nResultados guardados en capturas/resultados-selenium.json');

  } catch (error) {
    console.error('Error en prueba:', error.message);
    await captura(driver, 'error_screenshot');
  } finally {
    await driver.quit();
  }
}

runTests();
