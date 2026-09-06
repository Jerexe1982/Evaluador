# Corrida 2 — Entrada

| Campo | Valor |
| :--- | :--- |
| Fecha de ejecución | **2026-08-17 09:15 UTC-3** |
| Semana procesada | Semana 32 (10/08/2026 al 16/08/2026) |
| Modelo | `gemini-1.5-flash` |
| Parámetros | `temperature=0.1`, `top_p=0.95`, `max_output_tokens=2048` |
| System prompt | [../../prompts/system_prompt.md](../../prompts/system_prompt.md) (versión 3) |
| Plantilla de user prompt | [../../prompts/user_prompt.md](../../prompts/user_prompt.md) |
| Archivo de origen | [../../datos/ventas_semana_32.csv](../../datos/ventas_semana_32.csv) |
| Salida guardada | [salida.md](salida.md) |
| Tokens de entrada (`usageMetadata.promptTokenCount`) | 4020 |
| Tokens de salida (`usageMetadata.candidatesTokenCount`) | 1410 |
| Respuesta cruda de la API | [respuesta_api.json](respuesta_api.json) — `modelVersion`, `responseId`, `finishReason` y `usageMetadata` tal como los devolvió Gemini |
| Costo de esta corrida | USD 0,000725 (cuenta en [../../DECISIONES.md](../../DECISIONES.md), sección 4) |
| Ejecutó | Pablo González, Analista de Operaciones / FP&A |

El CSV pegado abajo es el contenido literal de `datos/ventas_semana_32.csv`. Para reproducir la corrida:
enviar el system prompt enlazado arriba como mensaje de sistema y el bloque siguiente como
mensaje de usuario, con esos parámetros.

---

## User prompt enviado

````text
Semana a procesar: Semana 32 (10/08/2026 al 16/08/2026)
Archivo de origen: datos/ventas_semana_32.csv
Fecha de ejecución: 2026-08-17 09:15 UTC-3
Quien ejecuta: Pablo González, Analista de Operaciones / FP&A

Procesá las transacciones del CSV de abajo y devolvé el Reporte Semanal de Ventas y Alertas
Operativas de esa semana, con las cinco secciones y las tablas exactas de tu system prompt.

Recordatorios de esta corrida:
- Umbrales: margen bruto mínimo 15,00 % · descuento máximo 20,00 %.
- Objetivos de la tabla de KPI: margen bruto medio mínimo 20,00 % · descuento medio máximo 12,00 %.
- Si alguna fila llega con campos obligatorios vacíos, excluila de los agregados, reportala en
  la Sección 4 como HUECO DE DATOS y cerrá con la leyenda de reporte parcial. No estimes el
  valor faltante.
- La columna Estado sólo admite: Informativo, En Regla, Alerta.

CSV de la semana (pegado tal cual desde el archivo de origen, con encabezado):

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
````
