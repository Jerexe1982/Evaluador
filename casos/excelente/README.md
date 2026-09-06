# Agente de Reporte Semanal de Ventas y Alertas Operativas

**Trabajo final · Programación de y con Agentes de IA · MBA UCEMA 2026 2T**
**Pablo González** — Analista de Operaciones / FP&A, Distribuidora San Martín S.R.L.

---

## Qué construí

Un agente que arma el reporte semanal de ventas de Distribuidora San Martín S.R.L. —una PyME de
venta B2B de limpieza e higiene institucional en el GBA— a partir de la exportación en CSV del
sistema de gestión. Lee las transacciones de la semana, calcula los KPI, desglosa por vendedor y
por categoría, y marca toda operación con margen bruto menor a 15,00 % o descuento mayor a
20,00 %. Lo usa Martín Benítez, Gerente Comercial, el lunes a la mañana para decidir sobre
excepciones de descuento; antes de este agente el reporte no se hacía. El agente produce el
borrador y se detiene ahí: no envía nada.

```text
casos/excelente/
├── README.md                        este archivo
├── DECISIONES.md                    iteraciones, fallas, análisis económico, gobierno
├── prompts/
│   ├── system_prompt.md             el contrato: seis piezas, formato cerrado, nivel L2
│   └── user_prompt.md               plantilla del pedido semanal
├── datos/                           la herramienta real: los CSV que leen las corridas
│   ├── ventas_semana_31.csv         20 transacciones — corrida 1
│   ├── ventas_semana_32.csv         10 transacciones — corrida 2
│   ├── ventas_semana_33.csv         13 transacciones (una incompleta) — corrida 3
│   ├── piloto_semana_30.csv         semana de prueba, usada en las iteraciones del contrato
│   └── piloto_semana_30_export_crudo.csv   el mismo dato sin normalizar, que rompió la v1
├── corridas/                        las tres ejecuciones, con fecha, entrada y salida
│   ├── corrida-1/{entrada.md, salida.md}
│   ├── corrida-2/{entrada.md, salida.md, respuesta_api.json}
│   └── corrida-3/{entrada.md, salida.md}
│       respuesta_api.json es la respuesta cruda de la API, con modelVersion,
│       responseId, finishReason y usageMetadata tal como los devolvió Gemini
└── pruebas/                         salidas defectuosas guardadas (no son corridas del sistema)
    ├── v1-salida-descartada.md
    ├── v2-salida-descartada.md
    ├── v3-borrador-salida-descartada.md
    └── modelo-chico-salida-descartada.md
```

## Cómo se lo pedí

El contrato está partido en dos: [prompts/system_prompt.md](prompts/system_prompt.md) lleva la
identidad estable del agente y [prompts/user_prompt.md](prompts/user_prompt.md) la plantilla del
pedido de cada semana. Las seis piezas, con el fragmento textual de cada una:

| Pieza | Dónde | Textual |
| :--- | :--- | :--- |
| **Rol** | system, §1 | *"Sos el Analista de Control de Gestión Comercial de Distribuidora San Martín S.R.L. […] No usás calificativos valorativos —'excelente', 'gran venta', 'récord', 'óptimo', 'muy bueno'—"* |
| **Contexto** | system, §2 | *"cuatro categorías […] cuatro vendedores […] un CSV exportado del sistema de gestión, una fila por transacción, con estas catorce columnas y sin separador de miles (decimal con punto)"* |
| **Tarea** | system, §3 | *"Producir el Reporte Semanal de Ventas y Alertas Operativas de la semana indicada: calcular los KPI agregados, desglosar facturación y margen por vendedor y por categoría, listar toda transacción que infrinja los umbrales […] y cerrar con tres acciones"* |
| **Restricciones** | system, §4 | umbrales fijos (*"`Margen_Bruto_Porcentaje` < 15,00 %"*, *"`Descuento_Porcentaje` > 20,00 %"*), veracidad (*"Está prohibido inventar, deducir o estimar transacciones, precios, costos o márgenes que no estén en el CSV recibido"*), filas incompletas (regla 4.3), fórmulas, redondeo, extensión |
| **Formato** | system, §5 | las cinco secciones con encabezados literales, las tres tablas con sus columnas, y el vocabulario cerrado de la columna Estado: *"Sólo se admiten tres valores […] `Informativo` · `En Regla` · `Alerta`"* |
| **Ejemplos** | system, §6 | tres: transacción normal frente a transacción con desvío, fila incompleta, y semana sin desvíos |

El user prompt es una plantilla con cuatro huecos —semana, archivo de origen, fecha y el CSV
pegado— más el procedimiento de cuatro pasos para armar la corrida. Las tres entradas reales,
con los huecos completados y el CSV literal adentro, están en
[corridas/corrida-1/entrada.md](corridas/corrida-1/entrada.md),
[corridas/corrida-2/entrada.md](corridas/corrida-2/entrada.md) y
[corridas/corrida-3/entrada.md](corridas/corrida-3/entrada.md).

## Qué funciona

**Tres corridas, tres semanas, tres archivos de datos distintos.** Todas con
`gemini-1.5-flash`, `temperature=0.1`. Cada entrada trae fecha, modelo, parámetros, el archivo de
origen enlazado y el CSV pegado tal cual, de modo que la corrida se puede repetir.

| Corrida | Fecha | Semana | Dato de origen | Procesadas | Facturación informada | Alertas | Salida |
| :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- |
| 1 | 2026-08-10 | 31 | [ventas_semana_31.csv](datos/ventas_semana_31.csv) | 20 | $ 1.870.770,00 | 2 | [salida.md](corridas/corrida-1/salida.md) |
| 2 | 2026-08-17 | 32 | [ventas_semana_32.csv](datos/ventas_semana_32.csv) | 10 | $ 1.447.125,00 | 2 | [salida.md](corridas/corrida-2/salida.md) |
| 3 | 2026-08-24 | 33 | [ventas_semana_33.csv](datos/ventas_semana_33.csv) | 12 de 13 | $ 1.089.212,50 | 1 hueco de datos | [salida.md](corridas/corrida-3/salida.md) |

Las cifras de cada salida se pueden rehacer sumando las columnas del CSV de su entrada: la
facturación es la suma de `Precio_Venta_Total`, el margen bruto medio es la ganancia total sobre
la facturación total, y el descuento medio es el promedio simple de `Descuento_Porcentaje`. Las
tres fórmulas están escritas en la regla 4.4 del contrato.

**Las tres salidas tienen la misma forma.** Las mismas cinco secciones, las mismas siete filas de
KPI, las mismas columnas en las tablas de vendedor y categoría, y sólo los tres valores admitidos
en la columna Estado.

**La restricción de no completar datos se ve actuando.** `datos/ventas_semana_33.csv` tiene 13
filas y TRX-1043 llegó sin costo. En [corridas/corrida-3/salida.md](corridas/corrida-3/salida.md)
el agente la marca como `HUECO DE DATOS`, la excluye de todos los agregados, dice cuánto factura
la fila que no contó y cierra con *"Reporte parcial: no distribuir hasta completar los datos
faltantes listados en la Sección 4"*. Esa semana el reporte no se firmó el lunes.

**Supervisión — el agente opera en L2 (ejecutar con revisión).** Declarado en la sección 7 del
[system prompt](prompts/system_prompt.md), no sólo acá.

- **Qué hace solo:** leer el CSV, calcular, aplicar los umbrales, redactar el reporte y guardarlo.
- **Qué no hace nunca:** enviar mails, escribir en el ERP, tocar precios, estimar datos faltantes,
  contactar a un cliente o a un vendedor. No tiene credenciales de ningún sistema.
- **Qué reviso yo antes de confiar en la salida:** la facturación total contra la exportación del
  sistema de gestión; cada alerta contra su fila del CSV; y al revés, que filtrando el CSV por
  margen < 15 % y descuento > 20 % salga la misma cantidad de alertas que la Sección 4; los huecos
  declarados; y el vocabulario de la columna Estado. Veinte a veinticinco minutos.
- **Quién firma:** **Martín Benítez, Gerente Comercial**, firma el reporte revisado antes de que se
  distribuya al equipo comercial y decide sobre las excepciones de descuento que el reporte señala.

**Costo.** USD 0,000783 · 0,000725 · 0,000768 por corrida, promedio USD 0,000759, USD 0,0395 al
año a razón de una corrida semanal. Los tokens de cada corrida están en su `entrada.md` y la
cuenta completa, con la tarifa y su fuente, en la sección 4 de [DECISIONES.md](DECISIONES.md).
Se probó `gemini-1.5-flash-8b` sobre la entrada exacta de la corrida 2: falló
([pruebas/modelo-chico-salida-descartada.md](pruebas/modelo-chico-salida-descartada.md)).

## Qué falta o qué falló

Las cuatro iteraciones del contrato, con su error textual y la salida guardada, están en
[DECISIONES.md](DECISIONES.md). Resumidas:

| Cuándo | Qué falló | Salida guardada | Qué se cambió |
| :--- | :--- | :--- | :--- |
| 05/08 | Informó $ 622,11 de facturación donde el sistema decía $ 622.110,00: leyó el punto de miles como decimal. | [v1](pruebas/v1-salida-descartada.md) | pieza *contexto* (formato exacto del archivo) y *restricciones* (fórmulas escritas) |
| 07/08 | *"¡Muy buena semana para el equipo! […] Se destaca especialmente Juan Pérez"* sobre una operación con 28,00 % de descuento y 12,39 % de margen, que además no listó en alertas. | [v2](pruebas/v2-salida-descartada.md) | pieza *rol* (calificativos prohibidos) y *restricciones* (toda transacción fuera de umbral va a alertas, sin importar el monto) |
| 09/08 | Completó con $ 21.000,00 un `Costo_Unitario` que no estaba en el archivo, "el mismo valor registrado para ese producto en operaciones anteriores". | [v3 borrador](pruebas/v3-borrador-salida-descartada.md) | pieza *restricciones* (regla 4.3), *formato* (fila de KPI de excluidas) y *ejemplos* (ejemplo 2) |
| 09/08 | Usó el estado `En Regla (Óptimo)`, que el contrato no había definido. | [v3 borrador](pruebas/v3-borrador-salida-descartada.md) | pieza *formato* (vocabulario cerrado de la columna Estado) |

**Lo que sigue sin resolverse:**

- El agente no valida la aritmética interna del CSV. Un `Precio_Lista` mal cargado en el origen
  pasa derecho: le encontré uno en la semana 31 antes de correr, y lo encontré yo, no el agente.
- La comparación entre semanas es manual: las referencias a la semana anterior que aparecen en la
  corrida 2 se las pasé en el user prompt. El agente no lee las corridas anteriores.
- Los umbrales de 15,00 % y 20,00 % vienen de la política comercial, no de los datos. Con tres
  semanas de corridas no hay con qué discutirlos.

**Lo que se sacó del alcance:** el envío automático del reporte por correo, la detección de
desvíos en condiciones de pago (el export no trae esa columna) y el pronóstico por vendedor (tres
semanas de histórico no alcanzan). Los tres motivos están en la sección 1 de
[DECISIONES.md](DECISIONES.md).

## Qué aprendí

Que el trabajo no estuvo en el modelo sino en el contrato y en el dato. La falla más cara —el
factor mil de la primera corrida— se arregló cambiando cómo exporta el sistema de gestión, no
cambiando el prompt.

Que lo que el contrato no decide, lo decide el modelo, y no siempre igual dos veces. La misma fila
incompleta desapareció en silencio un día y apareció rellenada con un número inventado dos días
después. Escribir la regla no fue burocracia: fue la única forma de que la conducta dejara de ser
una sorpresa semanal.

Que una salida prolija puede estar equivocada de la manera más cara. El modelo más chico devolvió
un reporte impecable que sobreestimaba el margen en casi cinco puntos y se comía una alerta de
$ 121.875,00. Sin la salida correcta al lado para comparar, no lo habría visto.

Y que la supervisión no es lo que se agrega al final para quedar bien: es lo que permitió sacar el
envío automático del alcance sin que el sistema perdiera sentido.
