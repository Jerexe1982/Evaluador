# CORRIDA 1 — Entrada Registrada

**Fecha de Ejecución:** 2026-08-10 09:30:15 UTC-3  
**Modelo Utilizado:** `gemini-1.5-flash`  
**Parámetros:** Temperature=0.1, Top-P=0.95  
**Autor Ingesta:** Pablo González (Analista FP&A)  
**ID Corrida:** `RUN-20260810-W31`  

---

### System Prompt Proporcionado:
*(Ver versión completa en [`prompts/system_prompt.md`](file:///Users/catamarchesi/Desktop/UCEMA/TRABAJO%20GRUPAL%20IA/casos/excelente/prompts/system_prompt.md))*

---

### User Prompt e Ingesta Transaccional:

Estimado Agente Analista,

Procesá la exportación transaccional adjunta correspondiente a las ventas de la **Semana 31 (03/08/2026 al 09/08/2026)**.

Generá el **Reporte Semanal de Ventas y Alertas Operativas** respetando de forma estricta el contrato de salida Markdown de 5 secciones y los umbrales de control fijados en tu System Prompt (Margen Bruto mínimo: 15.0%, Descuento máximo: 20.0%).

```csv
ID_Transaccion,Fecha,Cliente,Vendedor,Categoria,Producto,Unidades,Precio_Lista,Precio_Venta_Real,Costo_Unitario,Precio_Venta_Total,Costo_Total,Descuento_Porcentaje,Margen_Bruto_Porcentaje
TRX-1001,2026-08-03,Sanatorio San José,Juan Pérez,Químicos de Limpieza,Desinfectante Amonio 5L,40,2500.00,2250.00,1500.00,90000.00,60000.00,10.00,33.33
TRX-1002,2026-08-03,Restaurante El Faro,María Rodríguez,Papel e Higiene,Toalla Intercalada 2500f,15,4200.00,3990.00,2800.00,59850.00,42000.00,5.00,29.82
TRX-1003,2026-08-04,Hotel Central GBA,Carlos Gómez,Accesorios y Mopas,Mopa Microfibra Profesional,25,1800.00,1620.00,1100.00,40500.00,27500.00,10.00,32.10
TRX-1004,2026-08-04,LavaSport S.A.,Juan Pérez,Químicos de Limpieza,Detergente Industrial 20L,30,6500.00,4680.00,4100.00,140400.00,123000.00,28.00,12.39
TRX-1005,2026-08-04,Estación YPF Norte,Ana Martínez,Desinfectantes/Sanitizantes,Alcohol en Gel 5L,10,3800.00,3420.00,2200.00,34200.00,22000.00,10.00,35.67
TRX-1006,2026-08-05,Supermercado Uno,María Rodríguez,Papel e Higiene,Papel Higiénico Jumbopack,50,5100.00,4590.00,3100.00,229500.00,155000.00,10.00,32.46
TRX-1007,2026-08-05,Colegio Modelo,Carlos Gómez,Químicos de Limpieza,Jabón Líquido Manos 5L,20,2900.00,2610.00,1750.00,52200.00,35000.00,10.00,32.95
TRX-1008,2026-08-05,Gimnasio SportLife,Ana Martínez,Desinfectantes/Sanitizantes,Aerosol Desinfectante 400ml,100,850.00,765.00,480.00,76500.00,48000.00,10.00,37.25
TRX-1009,2026-08-06,Oficinas Tech Park,Juan Pérez,Papel e Higiene,Toalla Intercalada 2500f,30,4200.00,3360.00,2800.00,100800.00,84000.00,20.00,16.67
TRX-1010,2026-08-06,Clínica del Sol,María Rodríguez,Desinfectantes/Sanitizantes,Desinfectante Amonio 5L,60,2500.00,2250.00,1500.00,135000.00,90000.00,10.00,33.33
TRX-1011,2026-08-06,Consorcio Avellaneda,Carlos Gómez,Accesorios y Mopas,Carro Prensa Mopa 36L,5,3200.00,28800.00,21000.00,144000.00,105000.00,10.00,27.08
TRX-1012,2026-08-07,Fabrica Metalúrgica S.A.,Juan Pérez,Químicos de Limpieza,Desengrasante Pesado 20L,12,8900.00,8010.00,5400.00,96120.00,64800.00,10.00,32.58
TRX-1013,2026-08-07,Panadería La Espiga,Ana Martínez,Papel e Higiene,Servilleta 33x33 1000u,20,1950.00,1755.00,1200.00,35100.00,24000.00,10.00,31.62
TRX-1014,2026-08-07,Taller Mecánico Silva,María Rodríguez,Químicos de Limpieza,Detergente Industrial 20L,8,6500.00,5850.00,4100.00,46800.00,32800.00,10.00,29.91
TRX-1015,2026-08-08,Club Deportivo Quilmes,Carlos Gómez,Químicos de Limpieza,Cloro Concentrado 10L,40,1600.00,1440.00,950.00,57600.00,38000.00,10.00,34.03
TRX-1016,2026-08-08,Distribuidora Sur,Juan Pérez,Papel e Higiene,Papel Higiénico Jumbopack,80,5100.00,3570.00,3100.00,285600.00,248000.00,30.00,13.17
TRX-1017,2026-08-08,Laboratorios BioPharma,Ana Martínez,Desinfectantes/Sanitizantes,Alcohol 70% 5L,35,3100.00,2790.00,1850.00,97650.00,64750.00,10.00,33.69
TRX-1018,2026-08-09,Empresa Limpieza Total,María Rodríguez,Accesorios y Mopas,Mopa Microfibra Profesional,50,1800.00,1440.00,1100.00,72000.00,55000.00,20.00,23.61
TRX-1019,2026-08-09,Residencia San Martín,Carlos Gómez,Químicos de Limpieza,Jabón Líquido Manos 5L,15,2900.00,2610.00,1750.00,39150.00,26250.00,10.00,32.95
TRX-1020,2026-08-09,Eventos GBA,Ana Martínez,Papel e Higiene,Toalla Intercalada 2500f,10,4200.00,3780.00,2800.00,37800.00,28000.00,10.00,25.93
```
