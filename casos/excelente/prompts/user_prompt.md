# USER PROMPT — Plantilla de Ingesta Semanal

**Fecha de Ejecución:** [FECHA_DE_RUN]  
**Período de Análisis:** [SEMANA_ANALIZADA, ej: Semana 31 (03/08/2026 al 09/08/2026)]  
**Responsable de Ingesta (L2):** Pablo González (Analista FP&A)  

---

### Solicitud de Reporte:

Estimado Agente Analista,

Procesá la exportación transaccional adjunta correspondiente a las ventas del período **[SEMANA_ANALIZADA]**. 

Generá el **Reporte Semanal de Ventas y Alertas Operativas** respetando de forma estricta el contrato de salida Markdown de 5 secciones y los umbrales de control fijados en tu System Prompt (Margen Bruto mínimo: 15.0%, Descuento máximo: 20.0%).

---

### Dataset Transaccional en Formato CSV:

```csv
[INSERTAR_AQUI_DATOS_VENTAS_SEMANA_CSV]
```

---
*Nota de Control (L2): Los valores en `Precio_Venta_Total` y `Costo_Total` han sido validados contra el resumen de caja del ERP sin comas de miles.*
