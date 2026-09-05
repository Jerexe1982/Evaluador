# Trabajo Final: Agente de Reporte Semanal de Ventas y Alertas Operativas

**Materia:** Programación de y con Agentes de IA (MBA UCEMA, 2026 2T)  
**Alumno:** Pablo González (Analista de Operaciones / FP&A en Distribuidora San Martín S.R.L.)  
**Caso de Negocio:** Generación del reporte semanal de desempeño comercial y detección de anomalías de margen/descuentos a partir de la consolidación de transacciones operativas en CSV.  
**Nivel de Madurez / Evaluación:** Caso Excelente (Cumplimiento total de los 6 requisitos de la consigna).

---

## 1. Resumen del Sistema Agéntico

El **Agente de Reporte Semanal de Ventas** es un sistema agéntico diseñado para automatizar el análisis transaccional diario de una PyME distribuidora de insumos de limpieza e higiene B2B. A partir de una exportación semanal en CSV del ERP (que incluye cliente, vendedor, producto, unidades, precio de lista, precio de venta real y costo), el agente realiza las siguientes funciones:

1. **Agregación y Consolidación de Datos:** Consolida la facturación total, margen bruto medio, volumen por categoría y rendimiento por vendedor.
2. **Detección de Anomalías Comerciales:** Identifica operaciones con margen bruto menor al umbral crítico (15%), descuentos no autorizados (descuentos > 20%) y clientes con desvíos en condiciones de pago.
3. **Generación de Memo Ejecutivo:** Redacta un informe gerencial estructurado en Markdown con métricas clave, alertas priorizadas y recomendaciones operativas concretas.

---

## 2. Definición del Contrato del Agente (System Prompt & User Prompt)

El contrato del agente se compone de seis piezas fundamentales (según los conceptos de la Clase 2 del curso):

1. **Rol:** Analista Senior de Ventas y Control de Gestión Comercial con enfoque cuantitativo y sobrio.
2. **Contexto:** Operaciones de Distribuidora San Martín S.R.L. (GBA), venta B2B de productos de limpieza institucional.
3. **Tarea:** Procesar el dataset semanal de ventas, calcular KPIs globales y por vendedor/categoría, detectar transacciones fuera de regla y emitir el reporte semanal ejecutivo.
4. **Restricciones:** No inventar ni inferir datos no presentes en el CSV; mantener un tono strictly analítico (sin adjetivos optimistas sin respaldo); no exceder las 800 palabras; reportar desvíos estrictamente en base a los umbrales (margen < 15%, descuento > 20%).
5. **Formato:** Documento Markdown estricto estructurado en 5 secciones fijas (Resumen Ejecutivo, Tabla de KPIs, Desglose por Vendedor y Categoría, Alertas de Margen/Riesgo, Acciones Recomendadas).
6. **Ejemplos:** Muestras detalladas de entrada transaccional y salida de informe esperada con la precisión de cálculo requerida (ver `prompts/system_prompt.md`).

*Ubicación de prompts:*
- System Prompt: [`prompts/system_prompt.md`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/prompts/system_prompt.md)
- User Prompt Template: [`prompts/user_prompt.md`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/prompts/user_prompt.md)

---

## 3. Arquitectura y Conector Real

- **Conector de Entrada:** Conector de archivos planos CSV (`datos/ventas_semana.csv`). Lee la estructura transaccional bruta exportada del sistema de gestión.
- **Herramienta Real / Conector:** Parser e ingesta de datos tabulares CSV directamente procesados por la plantilla del user prompt y validados contra esquema.
- **Salida:** Archivo Markdown guardado en la carpeta de corridas (`corridas/corrida-N/salida.md`).

---

## 4. Esquema de Gobierno y Supervisión Humana (Niveles L0 - L4)

Para garantizar el control operacional y evitar decisiones automáticas no autorizadas en precios o crédito a clientes, se define el siguiente esquema de gobierno:

| Nivel | Componente / Función | Responsable / Sistema | Descripción |
| :--- | :--- | :--- | :--- |
| **L0 (Autónomo)** | Ingesta de CSV y parsing de transacciones | Conector CSV + Prompt | El sistema procesa el CSV, valida consistencia de columnas y calcula totales de facturación y margen. |
| **L1 (Generación)** | Redacción del memo de análisis gerencial | Agente (LLM) | El agente sintetiza los datos en el formato estructurado, redacta las alertas y sugiere acciones. |
| **L2 (Revisión)** | Validación de consistencia e integridad de datos | **Pablo González** (Analista Ops) | El autor revisa el informe generado contra el total de facturación del ERP antes de su difusión. |
| **L3 (Firma)** | Aprobación comercial y autorización de excepciones | **Martín Benítez** (Gerente Comercial) | Quien **firma** el informe, autoriza revisiones de margen o penalizaciones a vendedores por desvíos. |
| **L4 (Estrategia)** | Modificación de política de precios y créditos | Comité Directivo | Cambios en lista de precios, límites crediticios o comisiones comerciales. |

---

## 5. Estrategia de Corridas y Evidencia

Se documentan **3 corridas reales** ejecutadas en fechas consecutivas del cierre semanal, utilizando datos transaccionales reales anonimizados:

- **Corrida 1 (Semana 31 - Cierre Estándar):** [`corridas/corrida-1/`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/corridas/corrida-1/)
- **Corrida 2 (Semana 32 - Anomalía de Margen):** [`corridas/corrida-2/`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/corridas/corrida-2/)
- **Corrida 3 (Semana 33 - Promoción Especial y Descuento Masivo):** [`corridas/corrida-3/`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/corridas/corrida-3/)

---

## 6. Estructura del Repositorio

```text
casos/excelente/
├── README.md                 # Este documento
├── DECISIONES.md             # Bitácora de iteraciones, fallas reales, análisis económico y gobierno
├── prompts/
│   ├── system_prompt.md      # Contrato principal (System Prompt) con las 6 piezas
│   └── user_prompt.md        # Plantilla de User Prompt para las ejecuciones semanales
├── datos/
│   └── ventas_semana.csv     # Dataset transaccional real de prueba (15-25 filas)
└── corridas/
    ├── corrida-1/
    │   ├── entrada.md        # Contexto, prompt y datos exactos ingresados
    │   └── salida.md         # Respuesta exacta generada por el agente
    ├── corrida-2/
    │   ├── entrada.md
    │   └── salida.md
    └── corrida-3/
        ├── entrada.md
        └── salida.md
```
