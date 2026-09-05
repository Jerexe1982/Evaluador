# CORRIDA 2 — Entrada Registrada

**Fecha de Ejecución:** 2026-08-17 09:15:22 UTC-3  
**Modelo Utilizado:** `gemini-1.5-flash`  
**Parámetros:** Temperature=0.1, Top-P=0.95  
**Autor Ingesta:** Pablo González (Analista FP&A)  
**ID Corrida:** `RUN-20260817-W32`  

---

### System Prompt Proporcionado:
*(Ver versión completa en [`prompts/system_prompt.md`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/prompts/system_prompt.md))*

---

### User Prompt e Ingesta Transaccional:

Estimado Agente Analista,

Procesá la exportación transaccional adjunta correspondiente a las ventas de la **Semana 32 (10/08/2026 al 16/08/2026)**.

Generá el **Reporte Semanal de Ventas y Alertas Operativas** respetando de forma estricta el contrato de salida Markdown de 5 secciones y los umbrales de control fijados en tu System Prompt (Margen Bruto mínimo: 15.0%, Descuento máximo: 20.0%).

```csv
ID_Transaccion,Fecha,Cliente,Vendedor,Categoria,Producto,Unidades,Precio_Lista,Precio_Venta_Real,Costo_Unitario,Precio_Venta_Total,Costo_Total,Descuento_Porcentaje,Margen_Bruto_Porcentaje
TRX-1021,2026-08-10,Hospital Central GBA,Juan Pérez,Desinfectantes/Sanitizantes,Desinfectante Amonio 5L,80,2500.00,2250.00,1500.00,180000.00,120000.00,10.00,33.33
TRX-1022,2026-08-10,Cadena Gastronómica Norte,María Rodríguez,Papel e Higiene,Toalla Intercalada 2500f,40,4200.00,3780.00,2800.00,151200.00,112000.00,10.00,25.93
TRX-1023,2026-08-11,Laboratorio San Andrés,Carlos Gómez,Químicos de Limpieza,Jabón Líquido Manos 5L,30,2900.00,2610.00,1750.00,78300.00,52500.00,10.00,32.95
TRX-1024,2026-08-11,Hotel Plaza San Martín,Ana Martínez,Accesorios y Mopas,Carro Prensa Mopa 36L,8,32000.00,28800.00,21000.00,230400.00,168000.00,10.00,27.08
TRX-1025,2026-08-12,Hipermercado El Sol,Carlos Gómez,Papel e Higiene,Papel Higiénico Jumbopack,120,5100.00,3315.00,3100.00,397800.00,372000.00,35.00,6.49
TRX-1026,2026-08-12,Escuela San Ignacio,María Rodríguez,Químicos de Limpieza,Lavandina Concentrada 5L,25,500.00,450.00,300.00,11250.00,7500.00,10.00,33.33
TRX-1027,2026-08-13,Empresa Seguridad Privada,Juan Pérez,Desinfectantes/Sanitizantes,Alcohol en Gel 5L,15,3800.00,3420.00,2200.00,51300.00,33000.00,10.00,35.67
TRX-1028,2026-08-13,Consorcio Torres Belgrano,Ana Martínez,Accesorios y Mopas,Mopa Microfibra Profesional,40,1800.00,1620.00,1100.00,64800.00,44000.00,10.00,32.10
TRX-1029,2026-08-14,Fabrica Plásticos GBA,Juan Pérez,Químicos de Limpieza,Desengrasante Pesado 20L,20,8900.00,8010.00,5400.00,160200.00,108000.00,10.00,32.58
TRX-1030,2026-08-14,Frigorífico La Pampa,María Rodríguez,Químicos de Limpieza,Detergente Industrial 20L,25,6500.00,4875.00,4100.00,121875.00,102500.00,25.00,15.90
```
