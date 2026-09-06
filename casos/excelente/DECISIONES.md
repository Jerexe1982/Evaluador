# DECISIONES

**Autor:** Pablo González, Analista de Operaciones / FP&A — Distribuidora San Martín S.R.L.
**Proyecto:** Agente de Reporte Semanal de Ventas y Alertas Operativas
**Período de construcción:** 03/08/2026 a 24/08/2026

Este archivo cuenta cómo se llegó al contrato que está hoy en
[prompts/system_prompt.md](prompts/system_prompt.md). Cada iteración nombra la salida defectuosa
que la provocó, y esa salida está guardada en [pruebas/](pruebas/): son archivos de prueba, no
corridas del sistema. Las tres corridas del trabajo están en [corridas/](corridas/).

---

## 1 · Qué se buscaba y qué quedó afuera

El pedido original de Martín Benítez (Gerente Comercial) fue: *"que alguien me mande el lunes
temprano un resumen de la semana con los descuentos que se pasaron de la raya"*. Hoy eso lo hace
un CSV exportado del sistema de gestión, un contrato de agente y una revisión de veinte a veinticinco minutos.

**Tres cosas que estaban en el alcance inicial y no están en la entrega:**

| Qué se sacó | Por qué |
| :--- | :--- |
| **Envío automático del reporte por correo al Gerente Comercial.** Era el objetivo del pedido original. | La falla de la iteración 2 (abajo) mostró que el agente puede devolver un reporte prolijo, con los totales correctos, y omitir justamente la alerta que importaba. Un envío automático distribuye ese error antes de que alguien lo lea. El agente quedó en L2: guarda el borrador y no manda nada. La supervisión no es un adorno del diseño, es lo que reemplaza al envío automático. |
| **Detección de desvíos en condiciones de pago de clientes.** Estaba en la idea inicial del reporte. | La exportación del sistema de gestión no trae la columna de condición de pago. Agregarla implica modificar el reporte del ERP, que no depende de Operaciones. Se sacó del contrato en lugar de dejar que el agente lo dedujera del historial: es exactamente el tipo de dato que después se inventa. |
| **Pronóstico de facturación de la semana siguiente por vendedor.** | Hay tres semanas de histórico exportado (`datos/`). Con tres puntos no se proyecta nada; el número habría salido igual, y nadie habría podido decir si estaba bien. |

---

## 2 · Iteraciones del contrato

### Iteración 1 — 05/08/2026 · el agente sumó mil veces menos

Contrato v1: instrucción libre, sin formato de salida ni fórmulas escritas
(*"Analizá las ventas de esta semana y decime cómo nos fue"*), sobre el export del sistema de
gestión tal como sale: [`datos/piloto_semana_30_export_crudo.csv`](datos/piloto_semana_30_export_crudo.csv).

Salida defectuosa completa: [`pruebas/v1-salida-descartada.md`](pruebas/v1-salida-descartada.md).
El control que la detectó, textual:

```text
[2026-08-05 18:42] control L2 — Pablo González — piloto semana 30
  Facturación Total según resumen de caja del sistema de gestión : $ 622.110,00
  Facturación Total devuelta por el agente                       : $ 622,11
  Diferencia                                                     : factor 1000
  Causa: el modelo interpretó el punto de miles del export ("$ 67.500,00")
         como separador decimal y sumó 67,5 en lugar de 67500.
  Margen bruto medio devuelto: "N/D" (no calculado).
```

**Piezas del contrato ajustadas: *contexto* y *restricciones*.** En *contexto* se especificó el
formato exacto del archivo de origen —catorce columnas nombradas, sin separador de miles, decimal
con punto— y se cambió la exportación del sistema de gestión para que cumpla eso
([`datos/piloto_semana_30.csv`](datos/piloto_semana_30.csv) es la misma semana ya normalizada).
En *restricciones* se escribieron las cuatro fórmulas de agregación (hoy regla 4.4), para que el
agente sume la columna `Precio_Venta_Total` en vez de recalcularla.

**Efecto observado:** la prueba siguiente, del 07/08, devolvió $ 530.910,00, que es exactamente la
suma de las siete filas completas del archivo. El error de parseo no volvió a aparecer en ninguna
de las tres corridas.

**Lo que esta falla dejó como criterio:** el problema no estaba en el modelo, estaba en el archivo.
Normalizar el dato antes de la corrida costó diez minutos y sacó del medio una clase entera de
error.

### Iteración 2 — 07/08/2026 · celebró la venta que había que alertar

Contrato v2: secciones fijas y umbrales numéricos (margen mínimo 15,00 %, descuento máximo
20,00 %), todavía sin restricción de tono y sin ejemplos.

Salida defectuosa completa: [`pruebas/v2-salida-descartada.md`](pruebas/v2-salida-descartada.md).
Su primera sección, textual:

```markdown
### 1. Resumen Ejecutivo
¡Muy buena semana para el equipo! Se facturaron **$ 530.910,00** con un margen bruto medio del
**28,02 %**, muy por encima del objetivo. Se destaca especialmente Juan Pérez, que cerró la
operación más grande del período con LavaSport S.A. por $ 117.000,00 y logró meter un cliente
industrial en la cartera. El nivel de descuentos se mantuvo controlado.

### 4. Alertas
No se registraron anomalías en el período.
```

Esa operación es TRX-0993: 28,00 % de descuento y 12,39 % de margen. Infringe las dos reglas del
contrato y el agente la puso como el logro de la semana. El mismo control detectó un segundo
problema: la facturación informada ($ 530.910,00) no coincidía con el resumen de caja
($ 622.110,00) porque el agente había descartado sin avisar TRX-0998, la única fila sin
`Costo_Unitario`.

**Piezas del contrato ajustadas: *rol* y *restricciones*.** En *rol* se prohibieron los
calificativos valorativos, con la lista de palabras vedadas. En *restricciones* se agregó la
frase que cierra la regla 4.1: *"Toda transacción que dispare al menos una de las dos reglas va a
la Sección 4, sin excepción y sin importar el monto facturado."*

**Efecto observado:** en la prueba del 09/08 TRX-0993 aparece listada en la Sección 4 y el resumen
ejecutivo no califica ninguna operación. En las tres corridas guardadas, las cuatro transacciones
fuera de umbral están las cuatro en la Sección 4: TRX-1004 y TRX-1016 en
[`corridas/corrida-1/salida.md`](corridas/corrida-1/salida.md), TRX-1025 y TRX-1030 en
[`corridas/corrida-2/salida.md`](corridas/corrida-2/salida.md).

**Lo que esta falla dejó como criterio:** el tono no es cosmética. Un adjetivo optimista sobre una
operación fuera de regla es una recomendación implícita de repetirla.

### Iteración 3 — 09/08/2026 · inventó el costo que faltaba

Contrato v3 borrador: seis piezas completas, restricción de tono aplicada, sin regla para filas
incompletas.

Salida defectuosa: [`pruebas/v3-borrador-salida-descartada.md`](pruebas/v3-borrador-salida-descartada.md).
El control, textual:

```text
[2026-08-09 11:18] control L2 — Pablo González — piloto semana 30
  1) TRX-0998 llega sin Costo_Unitario, Costo_Total ni Margen_Bruto_Porcentaje.
     El agente completó Costo_Unitario = 21.000,00 "el mismo valor registrado
     para ese producto en operaciones anteriores" y lo sumó a los agregados:
     Costo Total = 382.150,00 + 63.000,00 = 445.150,00.
     Ese costo no está en el archivo. El dato no existe: es una invención.
     Efecto: el margen bruto medio informado (28,45 %) descansa sobre un
     número inventado; el valor real no se puede calcular con este archivo.
  2) Estado "En Regla (Óptimo)" no pertenece al formato: el contrato no fija
     qué valores admite la columna, así que el modelo agrega los suyos.
  3) Nota: el mismo hueco produjo dos comportamientos distintos en dos días.
     El 07/08 (v2) la fila desapareció sin aviso; hoy se completó con un valor
     inventado. Ninguno de los dos es aceptable.
```

Ese punto 3 es el que cambió el diseño. La misma fila incompleta produjo dos conductas distintas
en dos corridas: una la borró en silencio, la otra la rellenó. Mientras el contrato no dijera qué
hacer, el agente iba a elegir, y las dos elecciones posibles eran malas.

**Piezas del contrato ajustadas: *restricciones*, *formato* y *ejemplos*.** En *restricciones* se
escribió la regla 4.3 completa: excluir la fila de todos los agregados, reportarla en la Sección 4
como `HUECO DE DATOS`, contarla en la tabla de KPI y cerrar con la leyenda
`Reporte parcial: no distribuir hasta completar los datos faltantes listados en la Sección 4.`
En *formato* se agregó la fila fija `Transacciones Excluidas por Dato Faltante`. En *ejemplos* se
agregó el Ejemplo 2, que muestra una fila incompleta y su salida esperada.

**Efecto observado, en una corrida real:** la semana 33 trajo el mismo problema con otro producto.
`datos/ventas_semana_33.csv` tiene 13 filas y TRX-1043 llegó sin costo cargado. En
[`corridas/corrida-3/salida.md`](corridas/corrida-3/salida.md) el agente la marca, la excluye, dice
cuánto factura la fila que no contó y no estima nada:

> **HUECO DE DATOS (TRX-1043):** Cooperativa Escolar Sur | Carlos Gómez | Servilleta 33x33 1000u
> — Columnas vacías: `Costo_Unitario`, `Costo_Total`, `Margen_Bruto_Porcentaje`. Fila excluida de
> todos los agregados. No se estima el valor faltante.

El reporte cierra marcado como parcial y por eso esa semana no se firmó hasta que Compras cargó el
costo del producto.

### Iteración 4 — 09/08/2026 · un estado que el contrato no había definido

En el mismo control apareció, en la tabla de KPI, el valor `En Regla (Óptimo)`. El contrato listaba
los estados como ejemplo (`Normal / Alerta`) pero no decía que fueran los únicos admitidos, así que
el modelo agregó los suyos. Un estado inventado rompe cualquier lectura automática posterior de los
reportes.

**Pieza del contrato ajustada: *formato*.** Se declaró el vocabulario cerrado —`Informativo`,
`En Regla`, `Alerta`, sin variantes ni paréntesis— y la regla que determina cuál corresponde en
cada fila.

**Efecto observado:** las tres corridas usan sólo esos tres valores. La verificación es un `grep`
sobre `corridas/*/salida.md`.

### Iteración 5 — 18/08/2026 · probamos un modelo más chico y no pasó

Está contada en la sección 4, porque es una decisión de costo.

---

## 3 · Lo que sigue sin resolverse

- **El agente no verifica la aritmética interna del CSV.** Si el sistema de gestión exporta un
  `Precio_Venta_Real` que no se corresponde con `Precio_Lista` y el descuento, el agente informa lo
  que le dieron. Pasó una vez, antes de la corrida 1, y lo encontró la revisión L2, no el agente:

  ```text
  [2026-08-10 10:05] control L2 — Pablo González — semana 31, previo a la corrida
    TRX-1011 (Consorcio Avellaneda, Carro Prensa Mopa 36L):
      Precio_Lista = 3.200,00 · Precio_Venta_Real = 28.800,00 · Descuento = 10,00 %
      28.800,00 no puede ser el 90 % de 3.200,00. El precio de lista del producto
      es 32.000,00 (ver TRX-1024 y TRX-1042, mismo producto, otras semanas).
      Falta un dígito en el export.
    Se corrigió en el sistema de gestión y se volvió a exportar antes de correr.
    El agente no lo habría detectado: informa lo que le dan.
  ```

  El archivo del repositorio es el corregido: `TRX-1011` figura con `Precio_Lista = 32000.00` en
  [`datos/ventas_semana_31.csv`](datos/ventas_semana_31.csv). Escribir esa validación en el
  contrato —que el agente recalcule `Precio_Venta_Real` y avise si no coincide— es lo próximo.
- **La comparación entre semanas es manual.** Las frases del tipo "contra 22,39 % de la semana
  anterior" de [`corridas/corrida-2/salida.md`](corridas/corrida-2/salida.md) se agregaron al user
  prompt a mano; el agente no lee las corridas anteriores.
- **Tres semanas es poco.** Los umbrales de 15,00 % y 20,00 % vienen de la política comercial, no de
  los datos. Con un trimestre de corridas se podrá discutir si son los correctos.

---

## 4 · Análisis económico

### Tarifa

`gemini-1.5-flash`, tramo de prompts de hasta 128.000 tokens:

| Concepto | Precio |
| :--- | :--- |
| Tokens de entrada | USD 0,075 por millón |
| Tokens de salida | USD 0,30 por millón |

`gemini-1.5-flash-8b`, el modelo más chico que probamos (sección 5), mismo tramo:

| Concepto | Precio |
| :--- | :--- |
| Tokens de entrada | USD 0,0375 por millón |
| Tokens de salida | USD 0,15 por millón |

Las dos tarifas quedan publicadas acá a propósito: sin la del modelo chico, el costo de la
prueba de la sección 5 no se puede rehacer y la comparación que justifica la elección de
modelo es una afirmación sin cuenta.

Fuente: Google AI for Developers — *Gemini API pricing*
(`https://ai.google.dev/gemini-api/docs/pricing`), consultada el 25/08/2026.

### Costo de cada corrida

Los tokens son los que devolvió la API en `usageMetadata` y están anotados en la entrada de cada
corrida ([1](corridas/corrida-1/entrada.md) · [2](corridas/corrida-2/entrada.md) ·
[3](corridas/corrida-3/entrada.md)).

| Corrida | Semana | Tokens entrada | Tokens salida | Costo entrada | Costo salida | **Costo total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 31 | 4.520 | 1.480 | USD 0,000339 | USD 0,000444 | **USD 0,000783** |
| 2 | 32 | 4.020 | 1.410 | USD 0,000302 | USD 0,000423 | **USD 0,000725** |
| 3 | 33 | 4.160 | 1.520 | USD 0,000312 | USD 0,000456 | **USD 0,000768** |

Las cuentas, para rehacerlas:

```text
Corrida 1  entrada: 4.520 ÷ 1.000.000 × 0,075 = 0,000339
           salida : 1.480 ÷ 1.000.000 × 0,30  = 0,000444   → total 0,000783
Corrida 2  entrada: 4.020 ÷ 1.000.000 × 0,075 = 0,000302
           salida : 1.410 ÷ 1.000.000 × 0,30  = 0,000423   → total 0,000725
Corrida 3  entrada: 4.160 ÷ 1.000.000 × 0,075 = 0,000312
           salida : 1.520 ÷ 1.000.000 × 0,30  = 0,000456   → total 0,000768

Promedio de las tres = (0,000783 + 0,000725 + 0,000768) ÷ 3 = 0,000759
```

De los tokens de entrada, unos 3.150 son el system prompt, que es fijo; el resto es la plantilla
del user prompt (≈ 280) y el CSV de la semana, que va de 590 tokens (10 filas) a 1.090 (20 filas).
Duplicar el volumen de transacciones agrega alrededor de 1.100 tokens de entrada, es decir
USD 0,00008 por corrida: el costo lo domina el contrato, no los datos.

### Proyección

El sistema corre **una vez por semana**, el lunes a la mañana, sobre la exportación de la semana
cerrada. Ese es el volumen real, y es el de las tres corridas guardadas.

```text
Semana : 1 corrida  × USD 0,000759 = USD 0,000759
Año    : 52 corridas × USD 0,000759 = USD 0,0395
```

Escenario de ampliación que se está evaluando —el reporte semanal más un desglose por cada uno de
los cuatro vendedores, cinco corridas por semana:

```text
Semana : 5 corridas   × USD 0,000759 = USD 0,0038
Año    : 260 corridas × USD 0,000759 = USD 0,1973
```

**Lo que esto no dice.** El costo del modelo es despreciable y por eso no es el número que importa.
El costo real del sistema son los veinte a veinticinco minutos semanales de revisión L2, que son de
una persona y no de una API. No hay medición del tiempo ahorrado porque no hay línea de base: antes
de este agente el reporte semanal no se hacía, así que no hay nada contra qué comparar y no se
afirma ningún ahorro.

### Elección de modelo

El criterio del curso es el más chico que hace bien la tarea, y se aplicó en tres pasos.

1. **Diseño con el grande.** El contrato se escribió y se depuró con `gemini-1.5-pro`. A su tarifa
   (USD 1,25 y USD 5,00 por millón) la corrida 2 habría costado USD 0,012075: 16,67 veces la de
   `flash`. Con el contrato ya estable, mantener `pro` no aportaba nada.
2. **Operación con `gemini-1.5-flash`.** Las tres corridas guardadas son de `flash`. Los totales de
   las tres se verificaron a mano contra el CSV y cierran.
3. **Prueba de uno más chico: `gemini-1.5-flash-8b`.** El 18/08 se le pasó la entrada exacta de la
   corrida 2 y el mismo contrato, sin cambios. Salida completa:
   [`pruebas/modelo-chico-salida-descartada.md`](pruebas/modelo-chico-salida-descartada.md).
   Falló en tres puntos:

   | Punto | `flash-8b` | `flash` (corrida 2) | Qué pasó |
   | :--- | ---: | ---: | :--- |
   | Margen Bruto Medio | 27,54 % | 22,64 % | promedió los márgenes fila por fila en vez de dividir ganancia total sobre facturación total, como fija la regla 4.4. Sobreestima el margen de la semana en 4,90 puntos |
   | Margen de Carlos Gómez | 19,72 % | 10,84 % | el mismo error: (32,95 + 6,49) ÷ 2 = 19,72 |
   | Alertas | 1 | 2 | omitió TRX-1030, que infringe sólo la regla de descuento (25,00 % > 20,00 %) y no la de margen |

   El tercero es el que decidió: TRX-1030 es una operación de $ 121.875,00 con un descuento no
   autorizado que el Gerente Comercial no habría visto. El ahorro que lo justificaría es de
   USD 0,000363 por corrida, unos USD 0,019 por año. Quedó `flash`.

---

## 5 · Gobierno y riesgo

### Sistemas que toca el agente y con qué alcance

| Sistema | Permiso | Alcance exacto |
| :--- | :--- | :--- |
| Exportación semanal del sistema de gestión (`datos/ventas_semana_NN.csv`) | **Lectura** | Sólo el archivo de la semana que se le pega en el user prompt. El agente no accede al sistema de gestión: recibe un CSV ya exportado por una persona. |
| Carpeta `corridas/` del repositorio | **Escritura** | Sólo `corridas/corrida-N/salida.md`. No modifica prompts, ni datos, ni corridas anteriores. |
| ERP / base de facturación | **Ninguno** | No tiene credenciales. No lee ni escribe. |
| Correo, Slack, WhatsApp | **Ninguno** | No hay integración de envío. El reporte se distribuye a mano, después de la firma. |
| Lista de precios y descuentos | **Ninguno** | No propone ni aplica cambios de precio. Sólo señala desvíos contra umbrales fijos escritos en el contrato. |

### Nivel de autonomía

**L2 — ejecutar con revisión.** Declarado en la sección 7 de
[prompts/system_prompt.md](prompts/system_prompt.md), no sólo acá. El agente produce el reporte
completo en borrador y se detiene: no envía, no publica, no escribe en ningún sistema de la
empresa. Es lo que permite el contrato y es lo que hacen las tres corridas guardadas: las tres
terminan en un archivo `salida.md`, ninguna en un envío.

No es L3 (ejecutar y avisar) porque el reporte no sale sin que una persona lo mire, y no es L1
(proponer) porque el agente produce el entregable terminado, no una sugerencia.

### Qué revisa la persona antes de confiar en la salida

Pablo González, Analista de Operaciones / FP&A, sobre la `salida.md` guardada, antes de mandarla a
firma:

1. **Facturación Total** del reporte contra el total de la exportación del sistema de gestión. Es
   el control que atrapó las fallas de las iteraciones 1, 2 y 3.
2. **Cada alerta de la Sección 4** contra su fila en el CSV: que el ID exista y que los números
   coincidan.
3. **Al revés: que no falte ninguna.** Filtrar el CSV por `Margen_Bruto_Porcentaje < 15` y
   `Descuento_Porcentaje > 20` y contar que dé la misma cantidad de alertas que la Sección 4.
4. **Los huecos declarados:** que la cantidad de la fila `Transacciones Excluidas por Dato Faltante`
   coincida con las filas incompletas del archivo.
5. **El vocabulario de la columna Estado:** sólo `Informativo`, `En Regla`, `Alerta`.

Toma entre veinte y veinticinco minutos.

### Qué puede salir mal y qué pasa en cada caso

| Falla posible | Qué pasa cuando pasa | Quién lo detecta y con qué |
| :--- | :--- | :--- |
| **El agente omite una alerta** (le pasó en la iteración 2 con TRX-0993) | Una operación fuera de política no llega a la Gerencia Comercial y el descuento queda convalidado de hecho. | Control 3 de la revisión L2: el filtro del CSV se compara contra la Sección 4. La corrida no se firma; se vuelve a correr. |
| **El agente completa un dato que falta** (le pasó en la iteración 3 con TRX-0998) | El margen informado descansa sobre un número inventado y nadie lo sabe al leerlo. | Regla 4.3 del contrato, que obliga a declarar el hueco; se ve funcionando en `corridas/corrida-3/salida.md`. Control 4 de la revisión L2. |
| **El CSV llega con un dato mal cargado en origen** (pasó con un `Precio_Lista` de la semana 31) | El agente informa un margen o un descuento que no se corresponde con la operación real, sin manera de notarlo. | Control 1 y control 2 de la revisión L2. El agente no valida la aritmética interna del archivo: es la limitación abierta de la sección 3. |
| **El agente cambia el formato de salida entre corridas** | El reporte deja de ser comparable semana a semana y no se puede leer de manera automática. | Control 5 y comparación de encabezados entre las tres `salida.md`. El vocabulario cerrado de la iteración 4 lo hace verificable con un `grep`. |
| **El reporte se distribuye sin firma** | Circula por la empresa un dato de margen por vendedor que la Gerencia Comercial no revisó. | El reporte marcado como parcial lleva la leyenda de no distribuir en su propia Sección 5. La distribución es manual y la hace quien firma, no el agente. |

### Quién firma

**Martín Benítez, Gerente Comercial de Distribuidora San Martín S.R.L.**, firma el reporte revisado
antes de que se distribuya al equipo comercial, y decide sobre las excepciones de descuento que el
reporte señala. Está escrito en la sección 7 del contrato, no sólo en esta bitácora.

La semana 33 no se firmó el lunes: el reporte cerró marcado como parcial por el hueco de TRX-1043
y quedó a la espera de que Compras cargara el costo del producto.
