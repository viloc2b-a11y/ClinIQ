# cliniq_app — SOP

## Objetivo
- Transformar el prototipo HTML de ClinIQ en una aplicación web 100% funcional y determinista con un backend en Python (Flask/FastAPI) que intermedie las llamadas a Anthropic, permita carga y parsing real de PDFs (.pdf) y documentos Word (.docx), y sirva la UI de forma local.

## Alcance
### Qué es
- Un backend Python seguro que maneja las request de API.
- Lógica real de parseo de archivos PDF y DOCX.
- Un sistema estandarizado respetando la observabilidad global (`manifest.json` y `logs`).

### Qué no es
- Un despliegue en la nube público.
- Un sistema con base de datos robusta de usuarios en esta iteración MVP local.

## Contrato (OBLIGATORIO)
### Inputs
- Fuente(s): Archivos HTML originales, documentos subidos por el usuario (PDF, DOCX, TXT), strings de chat.
- Formato esperado (schema/descripción): Multipart form data para archivos, JSON para endpoints de chat.
- Ejemplo mínimo (no sensible): `{ "message": "hello", "mode": "contract", "doc_text": "..." }`
- Validaciones previas: El backend debe verificar la existencia de `.env` con la API key de Anthropic y validar la extensión de los archivos subidos.

### Outputs
- Artefactos esperados (rutas exactas): 
  - `build/index.html` (Frontend actualizado)
  - `scripts/cliniq_app.py` (Script servidor backend Flask/FastAPI)
  - `.tmp/logs/cliniq_app.log`
  - `.tmp/runs/cliniq_app/{timestamp}/manifest.json`
- Formato esperado: Respuestas JSON del backend al frontend.
- Criterios de aceptación:
  - [ ] (CRITICAL) Servidor HTTP backend inicia correctamente a través de `cliniq_app.py`.
  - [ ] (CRITICAL) Frontend modificado invoca API local en lugar de llamadas directas a anthropic en el navegador.
  - [ ] (CRITICAL) Parsing real de PDF/DOCX (usando dependencias como `PyPDF2` o `python-docx` / `pdfplumber`).
  - [ ] (CRITICAL) Generación del Run Manifest y archivo de log con estado SUCCESS al arrancar el servidor.

### Invariantes / Idempotencia
- Definición de “idempotente” para esta tarea: El script del backend debe arrancar el servidor en el mismo puerto sin colisiones; el bootstrapping del código debe siempre generar la misma estructura sin crear duplicados.
- Estrategia anti-duplicados: Reemplazo (overwrite) controlado en la inicialización o re-escritura idempotente de subdirectorios temporales.

## Flujo (pasos)
1. Escribir el script del framework web (FastAPI o Flask) en `scripts/cliniq_app.py`.
2. Actualizar el documento HTML base original para apuntar a endpoints `/api/chat` y `/api/upload` de la ruta `localhost`.
3. El frontend enviará multipart form data a `/api/upload` para que el backend lo parseé en memoria, y `chat-input` se enviará a `/api/chat`.
4. El backend mantendrá comunicación con Anthropic Claude API usando el key desde `.env`.
5. Grabar `manifest.json` cada vez que el backend termine su setup exitoso.

## Restricciones / Casos borde (Memoria viva)
- Nota: No exponer la API KEY en el JS como en el mock anterior. El frontend ya no debe requerir que el usuario ponga la llave si se usa `.env`, o bien puede permitir al usuario ingresarla para pasarla de forma segura al backend por la API, pero preferimos mantenerla en el backend (`.env`) por ahora.
- Asegurar parseo idempotente (los docs no deberían guardarse indefinidamente para evitar PHI problems, procesar en memoria o en `.tmp` y luego borrar).

## Observabilidad
- Log path: `.tmp/logs/cliniq_app.log`
- Run manifest path: `.tmp/runs/cliniq_app/YYYYMMDD_HHMMSS/manifest.json`
- Señales de éxito/fracaso: El app responde con código 200 a llamadas `/` de healthcheck.
