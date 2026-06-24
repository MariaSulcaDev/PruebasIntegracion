import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTURAS_DIR = path.join(__dirname, '..', 'capturas');

test.describe('CRUD de Personas - Playwright', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('01 - Carga inicial de la pagina', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Gestión de Personas');
    await expect(page.locator('#personaForm')).toBeVisible();
    await expect(page.locator('#tablaPersonas')).toBeVisible();
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_01_carga_inicial.png'), fullPage: true });
  });

  test('02 - Datos precargados desde H2', async ({ page }) => {
    const filas = page.locator('#tablaPersonas tbody tr');
    const count = await filas.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_02_datos_precargados.png'), fullPage: true });
  });

  test('03 - Registrar nueva persona', async ({ page }) => {
    await page.fill('#nombre', 'Luis Fernando');
    await page.fill('#apellido', 'Garcia Rios');
    await page.fill('#email', 'luis.garcia@vallegrande.edu.pe');
    await page.fill('#telefono', '944556677');
    await page.fill('#fechaNacimiento', '2001-06-20');
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_03_formulario_lleno.png'), fullPage: true });

    await page.click('#btnGuardar');
    await page.waitForTimeout(1000);
    await expect(page.locator('#mensaje')).toContainText('Persona registrada correctamente');
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_04_registro_exitoso.png'), fullPage: true });
  });

  test('04 - Editar persona existente', async ({ page }) => {
    await page.locator('.btn-editar').first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_05_formulario_edicion.png'), fullPage: true });

    await page.fill('#nombre', 'Maria Aurora Editada');
    await page.click('#btnGuardar');
    await page.waitForTimeout(1000);
    await expect(page.locator('#mensaje')).toContainText('Persona actualizada correctamente');
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_06_edicion_exitosa.png'), fullPage: true });
  });

  test('05 - Eliminar persona', async ({ page }) => {
    await page.fill('#nombre', 'Temporal');
    await page.fill('#apellido', 'Para Eliminar');
    await page.fill('#email', 'temp@vallegrande.edu.pe');
    await page.click('#btnGuardar');
    await page.waitForTimeout(1000);

    const filasAntes = await page.locator('#tablaPersonas tbody tr').count();

    page.on('dialog', dialog => dialog.accept());
    await page.locator('.btn-eliminar').last().click();
    await page.waitForTimeout(1500);

    const filasDespues = await page.locator('#tablaPersonas tbody tr').count();
    expect(filasDespues).toBeLessThan(filasAntes);
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_07_eliminacion_exitosa.png'), fullPage: true });
  });

  test('06 - Validacion de campos requeridos', async ({ page }) => {
    const filasAntes = await page.locator('#tablaPersonas tbody tr').count();
    await page.click('#btnGuardar');
    await page.waitForTimeout(500);
    const filasDespues = await page.locator('#tablaPersonas tbody tr').count();
    expect(filasDespues).toBe(filasAntes);
    await page.screenshot({ path: path.join(CAPTURAS_DIR, 'pw_08_validacion_campos.png'), fullPage: true });
  });

});
