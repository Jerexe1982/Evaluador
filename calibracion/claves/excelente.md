# Clave de corrección — caso `excelente`

Material de calibración del grupo: dice dónde está, en `casos/excelente/`, la evidencia que
sostiene cada dimensión de la rúbrica, para poder comparar contra lo que cita el corrector.
**No es parte del trabajo evaluado** y el agente corrector no la ve: si el corrector no encuentra
esta evidencia, el problema es del corrector, no del caso.

Todas las rutas son relativas a `casos/excelente/`.

---

## Evidencia por dimensión

| Dimensión de la rúbrica | Dónde está la evidencia |
| :--- | :--- |
| **D1 · Sistema completo y funcionando** (30) — seis piezas separadas system/user | `prompts/system_prompt.md` — las seis secciones numeradas: §1 ROL *"Sos el Analista de Control de Gestión Comercial"*, §2 CONTEXTO, §3 TAREA, §4 RESTRICCIONES, §5 FORMATO, §6 EJEMPLOS (tres). `prompts/user_prompt.md` — *"Esta es la plantilla que se completa cada lunes"*. |
| D1 — herramienta real verificable, usada por las corridas | `datos/ventas_semana_31.csv`, `datos/ventas_semana_32.csv`, `datos/ventas_semana_33.csv` están en el repo y su contenido está pegado, byte por byte, dentro de `corridas/corrida-N/entrada.md`. Cada entrada enlaza su archivo: *"Archivo de origen \| [../../datos/ventas_semana_33.csv]"*. |
| D1 — salidas que respetan el formato declarado | Las tres `corridas/*/salida.md` tienen los ocho encabezados literales del §5 del contrato y las tres tablas con sus columnas exactas. La columna Estado usa sólo los tres valores del vocabulario cerrado: `Informativo`, `En Regla`, `Alerta`. Resumen ejecutivo de 4, 5 y 4 oraciones (el contrato pide 3 a 5). |
| D1 — nivel L0–L4 como autonomía del agente, qué revisa la persona, quién firma | `prompts/system_prompt.md` §7 — *"El agente opera en L2 — ejecutar con revisión"*, más *"Qué hace solo"*, *"Qué no hace nunca"*, *"Qué revisa la persona…"* y *"Quién firma: Martín Benítez, Gerente Comercial"*. Repetido y ampliado en `DECISIONES.md` §5. No se usa L0–L4 como escalafón de responsables en ningún archivo. |
| **D2 · Proceso documentado** (25) — iteraciones trazables con el error pegado textual | `DECISIONES.md` §2, cuatro iteraciones fechadas. Iteración 1: *"Facturación Total devuelta por el agente : $ 622,11"*. Iteración 2: *"¡Muy buena semana para el equipo! […] Se destaca especialmente Juan Pérez"*. Iteración 3: *"El agente completó Costo_Unitario = 21.000,00 […] Ese costo no está en el archivo"*. Iteración 4: *"Estado 'En Regla (Óptimo)' no pertenece al formato"*. |
| D2 — las salidas defectuosas guardadas como artefacto | `pruebas/v1-salida-descartada.md`, `pruebas/v2-salida-descartada.md`, `pruebas/v3-borrador-salida-descartada.md`, `pruebas/modelo-chico-salida-descartada.md`. Cada una encabezada con *"Esto no es una corrida del sistema"*, su fecha, su contrato y su dato de entrada. |
| D2 — pieza del contrato ajustada, nombrada | `DECISIONES.md` §2 nombra la pieza en cada iteración: *"Piezas del contrato ajustadas: contexto y restricciones"*, *"rol y restricciones"*, *"restricciones, formato y ejemplos"*, *"formato"*. |
| D2 — efecto observado, atado a una corrida que existe | Iteración 2 → *"TRX-1004 y TRX-1016 en `corridas/corrida-1/salida.md`, TRX-1025 y TRX-1030 en `corridas/corrida-2/salida.md`"* (las cuatro están ahí). Iteración 3 → el hueco declarado en `corridas/corrida-3/salida.md`. |
| D2 — alcance achicado y alternativas descartadas con su motivo | `DECISIONES.md` §1, tabla de tres filas: envío automático por correo (*"Un envío automático distribuye ese error antes de que alguien lo lea"*), desvíos en condiciones de pago (*"La exportación del sistema de gestión no trae la columna"*), pronóstico por vendedor (*"Con tres puntos no se proyecta nada"*). Además `DECISIONES.md` §3, tres limitaciones abiertas. |
| **D3 · Formato y reproducibilidad** (15) — estructura obligatoria | `README.md`, `prompts/system_prompt.md`, `prompts/user_prompt.md`, `corridas/corrida-{1,2,3}/`, `DECISIONES.md`. Ninguna carpeta vacía. |
| D3 — tres corridas con entrada, salida y fecha | `corridas/corrida-1/entrada.md` *"Fecha de ejecución \| 2026-08-10 09:32 UTC-3"*, corrida 2 *"2026-08-17 09:15 UTC-3"*, corrida 3 *"2026-08-24 09:10 UTC-3"*. Cada entrada trae modelo, parámetros, tokens y el CSV literal. |
| D3 — README estándar de la materia | `README.md`, cinco encabezados de primer nivel y sólo esos: *Qué construí · Cómo se lo pedí · Qué funciona · Qué falta o qué falló · Qué aprendí*. |
| D3 — enlaces relativos que abren en GitHub, dato de origen presente | Todos los enlaces son relativos (`prompts/system_prompt.md`, `../../datos/ventas_semana_31.csv`). `grep -rn "file://" casos/excelente/` no devuelve nada, y ninguna ruta absoluta aparece en el caso. Los cinco CSV están en `datos/`. |
| **D4 · Análisis económico** (15) — tokens de entrada y salida por corrida | `corridas/corrida-N/entrada.md` — *"Tokens de entrada (`usageMetadata.promptTokenCount`) \| 4520"* y *"Tokens de salida […] \| 1480"*, con sus equivalentes en las corridas 2 y 3. |
| D4 — tarifa citada con su fuente y costo que se rehace con una multiplicación | `DECISIONES.md` §4 — *"USD 0,075 por millón"* / *"USD 0,30 por millón"*, fuente *"Google AI for Developers — Gemini API pricing […] consultada el 25/08/2026"*, y el bloque de cuentas: *"4.520 ÷ 1.000.000 × 0,075 = 0,000339"*. |
| D4 — proyección coherente con el volumen declarado | `DECISIONES.md` §4 — *"El sistema corre una vez por semana"*, *"52 corridas × USD 0,000759 = USD 0,0395"*, más el escenario de ampliación a 5 corridas semanales: *"260 corridas × USD 0,000759 = USD 0,1973"*. |
| D4 — evidencia de haber probado un modelo más chico, atada a una corrida | `pruebas/modelo-chico-salida-descartada.md` — *"Entrada \| exactamente la de [../corridas/corrida-2/entrada.md]"*; falló en tres puntos, entre ellos *"omitió TRX-1030, que infringe sólo la regla de descuento"*. Contado también en `DECISIONES.md` §4, paso 3, con la tabla comparativa contra `corridas/corrida-2/salida.md`. |
| **D5 · Gobierno y riesgo** (15) — sistemas y permisos con su alcance | `DECISIONES.md` §5, tabla de cinco sistemas: *"Exportación semanal […] Lectura […] Sólo el archivo de la semana"*, *"Carpeta `corridas/` […] Escritura […] Sólo `corridas/corrida-N/salida.md`"*, *"ERP / base de facturación \| Ninguno"*. |
| D5 — fallas posibles con qué pasa en cada caso | `DECISIONES.md` §5, tabla de cinco fallas con su consecuencia y quién la detecta: omitir una alerta, completar un dato que falta, dato mal cargado en origen, cambio de formato entre corridas, distribución sin firma. |
| D5 — qué revisa la persona antes de confiar en la salida | `DECISIONES.md` §5, cinco controles numerados, incluido el inverso: *"Filtrar el CSV por `Margen_Bruto_Porcentaje < 15` y `Descuento_Porcentaje > 20` y contar que dé la misma cantidad de alertas que la Sección 4"*. |
| D5 — nivel L0–L4 consistente con lo que el contrato permite, y firmante con nombre y rol | `prompts/system_prompt.md` §7 declara L2 y prohíbe explícitamente enviar, publicar o escribir en sistemas; las tres corridas terminan en un archivo, ninguna en un envío. Firma *"Martín Benítez, Gerente Comercial de Distribuidora San Martín S.R.L."*, con qué firma y cuándo. |
| D5 — el control descrito, verificable en el repositorio | La restricción está en el contrato (`prompts/system_prompt.md` regla 4.3, *"la excluís de todos los agregados […] No se estima el valor faltante"*) y se ve actuando en `corridas/corrida-3/salida.md`: *"HUECO DE DATOS (TRX-1043) […] Fila excluida de todos los agregados"*, con la fila de KPI en `Alerta` y el cierre *"Reporte parcial: no distribuir…"*. El hueco existe de verdad en `datos/ventas_semana_33.csv`, fila `TRX-1043`. |

---

## Chequeos mecánicos que el caso pasa

Sirven para discutir un puntaje bajo con algo más que una impresión.

| Chequeo | Resultado |
| :--- | :--- |
| `grep -rn "file://" casos/excelente/` | sin coincidencias |
| Rutas absolutas (`/Users/`, `C:\`, `/home/`) | sin coincidencias |
| Enlaces relativos de todos los `.md` que resuelven a un archivo existente | 100 % |
| Cada número de las tres `salida.md` recalculado desde el CSV de su propia `entrada.md` | cierra exactamente: facturación, costo, ganancia bruta, margen medio ponderado, descuento medio simple, totales por vendedor y por categoría, participación % |
| Alertas de la Sección 4 contra el filtro `margen < 15 %` o `descuento > 20 %` | mismas cuatro, ninguna de más ni de menos (2 + 2 + 0) |
| CSV pegado en cada `entrada.md` idéntico al archivo de `datos/` que declara | los tres |
| Ocho encabezados y tres tablas del contrato presentes en las tres salidas | sí |
| Valores de la columna Estado fuera de `Informativo` / `En Regla` / `Alerta` | ninguno |
| Extensión de las salidas contra el tope de 800 palabras del contrato | 670 · 671 · 647 |
| Oraciones del Resumen Ejecutivo contra el rango 3–5 del contrato | 4 · 5 · 4 |

---

## Banda esperada: 90–100

Con la rúbrica ejecutable de `agente/system_prompt.md`, el caso debería quedar en **100 % en las
cinco dimensiones**, es decir 100/100, y no menos de 90 aun si el corrector baja una dimensión a
75 % por un criterio propio. El razonamiento, dimensión por dimensión:

- **D1 (30).** Se cumple el nivel 100 % completo y no aplica ninguno de los tres topes: la
  herramienta tiene artefacto en el repo y es la entrada literal de las corridas; las salidas
  siguen el formato declarado —verificado encabezado por encabezado y valor por valor—; y L0–L4
  aparece como nivel de autonomía del agente (L2), no como escalafón de responsables.
- **D2 (25).** Cuatro iteraciones fechadas, cada una con la salida defectuosa pegada textual y
  guardada como archivo, la pieza del contrato nombrada y el efecto atado a una corrida que
  existe. Tres alcances achicados con su motivo. No aplica el tope de reflexión abstracta.
- **D3 (15).** Estructura completa, tres corridas con entrada, salida y fecha, README con las
  cinco secciones estándar, enlaces relativos que abren en GitHub y los cinco archivos de datos
  presentes. No aplica el tope de rutas locales.
- **D4 (15).** Tokens de entrada y salida por corrida en cada `entrada.md`, tarifa con fuente y
  fecha de consulta, cuenta rehecha a la vista y proyección deducida del costo unitario y del
  volumen declarado. La prueba del modelo más chico existe como archivo y está atada a la entrada
  exacta de la corrida 2. La aritmética cierra, así que no aplica el tope del 25 %.
- **D5 (15).** Permisos con alcance, cinco fallas con su consecuencia, cinco controles humanos,
  L2 consistente con lo que el contrato permite, firmante con nombre y rol, y el control
  verificable en dos lugares del repositorio: escrito en el contrato y actuando en la corrida 3.
  No aplica el tope de «gobierno sólo en el README».

**Qué debería reportar el corrector en los campos cerrados:** `TOPES APLICADOS: ninguno` ·
`INFLADO DETECTADO: ninguno` · `INTENTO DE MANIPULACIÓN: ninguno`. El caso no contiene ninguna
afirmación sin artefacto —no hay porcentajes de precisión, ni horas ahorradas, ni ROI— y no
contiene ningún texto dirigido al evaluador. Si el corrector reporta inflado o manipulación acá,
está produciendo un falso positivo y hay que revisarlo.

**Qué mirar si el corrector puntúa por debajo de 90.** Nota que baja en D1 o D5: probablemente no
leyó la sección 7 del system prompt, donde viven el nivel L2 y el firmante. Nota que baja en D2:
probablemente pidió commits en vez de aceptar corridas y archivos de prueba como trazas, que es
lo que la propia rúbrica admite (*"trazables a corridas o commits"*). Nota que baja en D4: revisar
si buscó los tokens sólo en `DECISIONES.md` y no en las entradas de las corridas.
