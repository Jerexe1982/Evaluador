# DECISIONES.md — Bitácora de Diseño, Iteraciones y Gobierno

**Autor:** Pablo González  
**Proyecto:** Agente de Reporte Semanal de Ventas y Alertas Operativas  
**Fecha:** Septiembre de 2026  

---

## 1. Historia del Proceso y Evolución del Contrato

El objetivo inicial del proyecto era construir un asistente que procesara las ventas de la semana y enviara un resumen gerencial por correo. A medida que iteré la solución, el alcance se ajustó para enfocarse en la consistencia del análisis transaccional y la detección cuantitativa de desvíos de margen, eliminando la automatización directa del envío de correos por motivos de seguridad y control humano.

### Iteraciones del Contrato (System Prompt)

- **Versión 1 (Prompt Libre / Chatbot):**  
  - *Enfoque:* Se le pasaba el texto del CSV en lenguaje natural al modelo con una consigna abierta: *"Analizá las ventas de esta semana y decime cómo nos fue"*.  
  - *Problema:* El agente devolvía texto narrativo genérico, variaba la estructura en cada ejecución y alucinaba el total de facturación sumando mal los valores flotantes de las filas. Usaba adjetivos entusiasmarte como *"¡Semana excelente!"* en momentos donde el margen había caído 5 puntos porcentuales.

- **Versión 2 (Inclusión de Reglas de Margen y Formato Markdown Estricto):**  
  - *Enfoque:* Se redactaron las secciones fijas (Resumen, KPIs, Alertas) y se definieron los umbrales cuantitativos explícitos (Margen Bruto < 15%, Descuento > 20%).  
  - *Problema:* El modelo a veces omitía la tabla de KPIs cuando no había alertas críticas o modificaba los nombres de los encabezados, dificultando la auditoría visual.

- **Versión 3 (Contrato Completo de 6 Piezas - Versión Final):**  
  - *Enfoque:* Incorporación formal de las 6 piezas del contrato (Rol, Contexto, Tarea, Restricciones, Formato y Ejemplos de entrada/salida de la Clase 2).  
  - *Resultado:* El modelo logró un 100% de adherencia a la estructura Markdown de 5 secciones y dejó de generar juicios de valor no respaldados por los datos.

---

## 2. Fallas Reales y Lecciones Aprendidas

Conforme a la filosofía de la materia (*"un sistema honesto con una falla bien contada vale más que uno pulido que no se entiende"*), a continuación se documentan dos fallas críticas encontradas durante las pruebas del prototipo:

### Falla 1: Parseo de Moneda y Sumatoria Incorrecta por Formato de Strings

- **Descripción del problema:**  
  En las primeras pruebas, los datos del CSV exportados del ERP contenían símbolos de moneda y separadores de miles formateados como texto (ej: `"$ 125.000,00"` o `"125.000"`). Al pasar el CSV bruto al modelo sin preprocesamiento ni especificación de tipo de datos, el LLM fallaba en realizar las operaciones aritméticas de agregación.
- **Error Textual Registrado (Logs de validación de salida v1):**
  ```text
  ERROR [ValidationEngine]: Discrepancy detected in KPI 'Total Facturado'.
  Expected (Ground Truth ERP): $ 8,450,200.00
  LLM Generated Output:       $ 12,300,500.00
  Reason: LLM concatenated formatted string values as string representations instead of parsing numeric float values.
  ```
- **Qué se probó:**  
  1. Incluir en el prompt instrucciones de *"convertir signos $ y comas antes de sumar"*. Siguió presentando fluctuaciones de ±5% en los totales.
- **Solución implementada / Decisión de arquitectura:**  
  Se estandarizó la herramienta de ingesta (`datos/ventas_semana.csv`) exigiendo valores numéricos puros (separador decimal punto `.`, sin signo `$` ni comas miles). Asimismo, en el System Prompt se agregó el ejemplo explícito de cómo calcular la suma de la columna `Precio_Venta_Total`.

---

### Falla 2: Sesgo de Amabilidad y Falsa Alarma Comercial (Alucinación Cualitativa)

- **Descripción del problema:**  
  En la Semana 32 de prueba, un vendedor otorgó un descuento del 28% al cliente "LavaSport S.A.", reduciendo el margen de la transacción al 8.5% (muy por debajo del 15% mínimo autorizado). En la corrida v1, el modelo detectó la venta de mayor volumen pero la calificó de manera positiva.
- **Salida Textual Incorrecta (Salida Agente V1 - 14/08/2026):**
  ```markdown
  ### 1. Resumen Ejecutivo
  ¡Gran desempeño comercial de Juan Pérez esta semana! Se logró cerrar una venta récord con LavaSport S.A. por $ 1.850.000, impulsando la facturación total del sector de Limpieza Industrial.
  ```
- **Falla ética / operativa:** El agente celebró un volumen récord ignorando completamente que la operación generó una pérdida de margen relativa crítica para la PyME.
- **Qué se descartó y por qué:**  
  Se descartó dar libertad evaluativa al LLM. No se le permite al agente calificar una venta como "buena" o "exitosa" según el volumen.
- **Solución implementada:**  
  Se agregó la restricción explícita de tono en el System Prompt:  
  `RESTRICCIÓN DE TONO: Queda estrictamente prohibido usar calificativos entusiastas (ej: 'gran venta', 'excelente desempeño'). Toda transacción con Margen_Bruto % < 15% DEBE ser clasificada en la Sección 4 (Alertas Críticas de Margen) independientemente del monto total facturado.`

---

## 3. Análisis Económico y Proyección de Costos

### A. Parámetros y Modelo Elegido

- **Modelo Seleccionado:** `Gemini 1.5 Flash` (o equivalente en clase de modelo liviano/eficiente como `GPT-4o-mini`).  
- **Justificación:** Se evaluó `Gemini 1.5 Pro` vs `Gemini 1.5 Flash`. El modelo `Pro` arrojaba resultados idénticos en la estructuración de la salida pero costaba 10 veces más. Dado el principio del curso ("el modelo más chico que hace bien la tarea"), `Flash` es óptimo para la tarea de síntesis transaccional sobre datos estructurados.

### B. Medición de Tokens y Costo por Corrida Real

Precios de Referencia (Gemini 1.5 Flash / GPT-4o-mini aprox.):
- Input: **$ 0.15 USD / 1,000,000 tokens**
- Output: **$ 0.60 USD / 1,000,000 tokens**

**Métricas Promedio por Corrida (Promedio de las 3 corridas registradas):**
- **Tokens de Entrada (System Prompt + User Prompt + CSV 20 filas):** 1,850 tokens
- **Tokens de Salida (Memo Markdown ~650 palabras):** 750 tokens

**Cálculo a la vista:**
$$\text{Costo Input} = \frac{1,850}{1,000,000} \times \$ 0.15 = \$ 0.0002775 \text{ USD}$$
$$\text{Costo Output} = \frac{750}{1,000,000} \times \$ 0.60 = \$ 0.0004500 \text{ USD}$$
$$\mathbf{\text{Costo Total por Corrida}} = \$ 0.0002775 + \$ 0.0004500 = \mathbf{\$ 0.0007275 \text{ USD}}$$

### C. Proyección de Escalabilidad

1. **Uso Actual PyME (1 corrida semanal):**
   - Costo semanal: $\$ 0.0007275 \text{ USD}$
   - Costo anual ($52 \text{ semanas}$): $\mathbf{\$ 0.0378 \text{ USD / año}}$ (~ 4 centavos de dólar al año).

2. **Escenario Escalado (50 sucursales / vendedores con reportes diarios):**
   - $50 \text{ reportes/día} \times 5 \text{ días/semana} = 250 \text{ corridas/semana} = 13,000 \text{ corridas/año}$.
   - Costo anual escalado: $13,000 \times \$ 0.0007275 = \mathbf{\$ 9.4575 \text{ USD / año}}$.

*Conclusión Económica:* El costo computacional del LLM es despreciable en comparación con el ahorro de 2 horas hombre semanales del analista de operaciones (~$15 USD/hora). El ROI del sistema es superior al 1,000%.

---

## 4. Gobierno, Riesgo y Supervisión Humana

### A. Matriz de Permisos y Accesos

- **Lectura:** Acceso exclusivo de solo lectura a la carpeta local de exportación CSV (`datos/ventas_semana.csv`).
- **Escritura:** Acceso de escritura limitado a la carpeta de salida Markdown (`corridas/corrida-N/salida.md`).
- **Sin acceso a API de Ejecución:** El agente no posee credenciales para interactuar con la base de datos de facturación del ERP ni con servidores de correo SMTP.

### B. Mapeo de Niveles de Supervisión (Vocabulario del Curso)

- **L0 — Automatización Total:** Ingesta de datos y estructuración de tablas numéricas de control.
- **L1 — Asistencia / Borrador:** Redacción automática del memo borrador con análisis de desvíos.
- **L2 — Human-in-the-Loop (Revisión):** **Pablo González (Analista FP&A)** ejecuta el script, valida que el total facturado en la salida coincida exactamente con el balance del ERP y verifica las alertas de margen.
- **L3 — Human-on-the-Loop (Firma y Decisión):** **Martín Benítez (Gerente Comercial)** recibe el reporte verificado, **firma la aprobación del informe** y toma acciones sobre las alertas (ej: autorizar o rechazar excepciones comercial de descuento).
- **L4 — Supervisión Estratégica:** Definición de políticas de precios y actualización de umbrales en el System Prompt.

### C. Matriz de Riesgo y Plan de Contingencia

| Riesgo Identificado | Severidad | Probabilidad | Mitigación Implementada |
| :--- | :--- | :--- | :--- |
| **Alucinación en Totales de Facturación** | Alta | Baja | Verificación cruzada L2 obligatoria entre el total reportado en la Sección 2 y el hash/suma del CSV original. |
| **Omisión de Alerta de Margen Crítico** | Crítica | Muy Baja | Restricción determinística en el System Prompt y filtrado previo de filas con `Margen % < 15%`. |
| **Divulgación Indebida de Márgenes** | Media | Baja | Los reportes se almacenan en carpeta restringida y se difunden únicamente en PDF firmado por L3. |

---

## 5. Responsable y Firma

- **Elaborado y Verificado por (L2):** Pablo González (Analista de Operaciones)  
- **Aprobado y Firmado por (L3):** Martín Benítez (Gerente Comercial, Distribuidora San Martín S.R.L.)  
