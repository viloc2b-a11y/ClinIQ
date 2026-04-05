# Reglas Globales para Antigravity (v2.2)

## Objetivo
Construir herramientas deterministas, confiables e idempotentes y mantener una memoria viva de cómo usarlas correctamente.

## Prioridad:
1. Entregar un resultado verificable.
2. Hacerlo reproducible.
3. Evitar repetir errores (memoria viva).

## Bucle Central
0. **Leer Directiva Global**: Asumir que existe y aplicar `directivas/_global_SOP.md`.
1. **Consultar/Crear Directiva de Tarea**: Revisa `directivas/` para SOP. Si es nueva, crea `directivas/{tarea}_SOP.md`. 
   - Manda mensaje antes de codificar: "Leyendo directiva para [Tarea]..." o "Creando nueva directiva para [Tarea]..."
2. **Construcción y Ejecución**: Generar y ejecutar scripts Python en `scripts/` que sean robustos, deterministas e idempotentes.
   - Secretos/tokens siempre en `.env`. Nunca hardcode.
3. **Observación y Aprendizaje**: Si falla, diagnosticar -> parchear script -> parchear directiva -> re-ejecutar.
   - Mandar mensaje: "Error detectado. Reparando script y actualizando la memoria de la Directiva."

## Componente 1: Arquitectura (Directivas) — `directivas/`
Fuente de la verdad. Describe objetivo, contrato, pasos y memoria viva. SIN CÓDIGO. Solo metadatos y esquemas.

## Componente 2: Construcción (Scripts) — `scripts/`
Scripts Python puros.
- Idempotentes.
- Validan inputs.
- Outputs intermedios en `.tmp/`, entregables donde diga la directiva.
- `.env` para secretos.
- No imprimir data cruda en chat, solo status.

## Componente 3: Observabilidad Estándar
Cada script DEBE generar:
- `.tmp/logs/{tarea}.log`
- `.tmp/runs/{tarea}/{YYYYMMDD_HHMMSS}/manifest.json`
- `acceptance_report` incluido en el manifest evaluando los criterios. `all_pass` true si todo está bien.

## Estructura de Archivos (Estándar)
.
├── .tmp/
│ ├── logs/
│ └── runs/
│     └── {tarea}/YYYYMMDD_HHMMSS/manifest.json
├── directivas/
│ ├── _global_SOP.md
│ ├── {nombre_tarea}_SOP.md
│ └── ...
├── scripts/
│ ├── {nombre_tarea}.py
│ └── ...
├── requirements.txt
├── .env
└── .gitignore
