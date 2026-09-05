# CORRIDA 3 — Entrada Registrada

**Fecha de Ejecución:** 2026-08-24 09:10:04 UTC-3  
**Modelo Utilizado:** `gemini-1.5-flash`  
**Parámetros:** Temperature=0.1, Top-P=0.95  
**Autor Ingesta:** Pablo González (Analista FP&A)  
**ID Corrida:** `RUN-20260824-W33`  

---

### System Prompt Proporcionado:
*(Ver versión completa en [`prompts/system_prompt.md`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/prompts/system_prompt.md))*

---

### User Prompt e Ingesta Transaccional:

Estimado Agente Analista,

Procesá la exportación transaccional adjunta correspondiente a las ventas de la **Semana 33 (17/08/2026 al 23/08/2026)**.

Generá el **Reporte Semanal de Ventas y Alertas Operativas** respetando de forma estricta el contrato de salida Markdown de 5 secciones y los umbrales de control fijados en tu System Prompt (Margen Bruto mínimo: 15.0%, Descuento máximo: 20.0%).

```csv
ID_Transaccion,Fecha,Cliente,Vendedor,Categoria,Producto,Unidades,Precio_Lista,Precio_Venta_Real,Costo_Unitario,Precio_Venta_Total,Costo_Total,Descuento_Porcentaje,Margen_Bruto_Porcentaje
TRX-1031,2026-08-17,Sanatorio Trinidad,Juan Pérez,Desinfectantes/Sanitizantes,Desinfectante Amonio 5L,50,2500.00,2250.00,1500.00,112500.00,75000.00,10.00,33.33
TRX-1032,2026-08-17,Boutique Hotel Palermo,María Rodríguez,Papel e Higiene,Toalla Intercalada 2500f,20,4200.00,3780.00,2800.00,75600.00,56000.00,10.00,25.93
TRX-1033,2026-08-18,Universidad de Belgrano,Carlos Gómez,Químicos de Limpieza,Jabón Líquido Manos 5L,40,2900.00,2610.00,1750.00,104400.00,70000.00,10.00,32.95
TRX-1034,2026-08-18,Centro Médico Mitre,Ana Martínez,Desinfectantes/Sanitizantes,Alcohol en Gel 5L,20,3800.00,3420.00,2200.00,68400.00,44000.00,10.00,35.67
TRX-1035,2026-08-19,Complejo Teatral GBA,Juan Pérez,Accesorios y Mopas,Mopa Microfibra Profesional,30,1800.00,1620.00,1100.00,48600.00,33000.00,10.00,32.10
TRX-1036,2026-08-19,Supermercado Expres,María Rodríguez,Papel e Higiene,Papel Higiénico Jumbopack,40,5100.00,4590.00,3100.00,183600.00,124000.00,10.00,32.46
TRX-1037,2026-08-20,Cadena Gimnasios Fit,Carlos Gómez,Desinfectantes/Sanitizantes,Aerosol Desinfectante 400ml,80,850.00,765.00,480.00,61200.00,38400.00,10.00,37.25
TRX-1038,2026-08-20,Industrias del Cuero,Ana Martínez,Químicos de Limpieza,Desengrasante Pesado 20L,15,8900.00,8010.00,5400.00,120150.00,81000.00,10.00,32.58
TRX-1039,2026-08-21,Logística Avellaneda,Juan Pérez,Químicos de Limpieza,Detergente Industrial 20L,10,6500.00,5850.00,4100.00,58500.00,41000.00,10.00,29.91
TRX-1040,2026-08-21,Restaurante Plaza,María Rodríguez,Papel e Higiene,Servilleta 33x33 1000u,25,1950.00,1852.50,1200.00,46312.50,30000.00,5.00,35.22
TRX-1041,2026-08-22,Laboratorio Norte,Carlos Gómez,Desinfectantes/Sanitizantes,Alcohol 70% 5L,30,3100.00,2945.00,1850.00,88350.00,55500.00,5.00,37.18
TRX-1042,2026-08-22,Municipio Lomas,Ana Martínez,Accesorios y Mopas,Carro Prensa Mopa 36L,4,32000.00,30400.00,21000.00,121600.00,84000.00,5.00,30.92
```
