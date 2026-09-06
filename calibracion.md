# Calibración

Pieza 4 del parcial: dónde el corrector y nosotros no coincidíamos, qué ajustamos y cómo quedó.

Este archivo no discute la rúbrica en abstracto. Cada hallazgo sale de comparar **pares de corridas
con entrada byte-idéntica** —mismo hash MD5 de `entrada.systemPrompt` y de `entrada.userPrompt` en
los JSON de [`resultados/`](resultados/)— y preguntar por qué dieron distinto. Si dos corridas con la
misma entrada dan dos notas, la rúbrica tiene un borde sin definir; no hace falta discutirlo, se mide.

Se organiza en dos partes, que son las dos formas en que una rúbrica falla:

- **Ambigüedad** — dos correctores razonables puntúan distinto, y los dos tienen razón con el texto
  que está escrito.
- **Trampa** — un trabajo saca puntaje alto sin merecerlo, y la rúbrica no tiene con qué impedirlo.

---

## El método

La v1 tenía 14 corridas guardadas. Cuatro pares comparten entrada byte-idéntica, así que cualquier
diferencia entre ellos es del corrector, no del caso:

| Par | Entrada | Modelo | Qué se movió | Nota |
| :--- | :--- | :--- | :--- | ---: |
| `jerexe1982@9532539` 20:28 vs 22:49 | idéntica (`f9c517`) | **el mismo** (`gpt-5.6-luna`) | Proceso 25 % → 0 % | 43,75 → 37,5 |
| `jleonstack@9aa8ccc` luna vs sol | idéntica (`8cdd9a`) | distinto | Económico 100 % → 25 % · Gobierno 75 % → 100 % | 92,5 → 85 |
| `jerexe1982@9532539` luna vs sol | idéntica (`f9c517`) | distinto | Gobierno 50 % → 75 % | 43,75 → 47,5 |
| `flojo` 22:51 vs 22:53 | idéntica (`ee2961`) | el mismo | **nada**: 25/25/25/25/25 las dos veces | 25 → 25 |

El cuarto par es el que ordena todo lo demás. La varianza **no es del modelo ni de la temperatura**:
el caso cuya evidencia es una ausencia limpia se repite exacto, dos veces seguidas. La varianza está
donde el nivel depende de un juicio cualitativo. Esa es la lista de lo que hay que arreglar.

*(Dato técnico que conviene decir de frente: el corrector corre contra la Responses API de Codex con
la sesión de ChatGPT —`web/lib/codex.ts`— que **no expone `temperature`, ni `top_p`, ni `seed`**.
`prompt_cache_key` estabiliza el caché, no la salida. No hay una perilla de determinismo que apretar:
la consistencia tiene que salir de la escala y de controles de la app.)*

---

# Parte 1 · Tres ambigüedades

## A1 · Proceso documentado — el borde 0 % / 25 % / 50 %

**Dónde estaba el problema.** El 25 % pedía "prosa reflexiva sin un solo evento identificable"; el
50 %, "al menos una iteración con antes y después identificables"; y un tope mandaba a 25 % la
"reflexión abstracta sin ningún artefacto". *Evento identificable*, *abstracta* y *artefacto* no
estaban definidos, y las tres condiciones podían ser verdaderas del mismo texto a la vez.

**Medido.** `jerexe1982@9532539`, entrada byte-idéntica, mismo modelo, dos corridas a 2 h 21 de
distancia: **Proceso 25 % una vez y 0 % la otra**. Nada cambió entre las dos salvo la tirada.

**Y en nuestro propio caso tramposo.** `casos/tramposo/DECISIONES.md` §3 trae una tabla de cinco
iteraciones con columnas *Foco* y *Resultado*, que nombra piezas del contrato ("Ajuste de
restricciones", "Cierre del formato de salida"). La fila del 50 % se cumple al pie de la letra; el
tope de 25 % también. Nuestra clave esperaba 25 %; el corrector puso **50 % el 06/09 y 25 % el
05/09**. Los dos son defendibles con el texto de la v1.

**La corrección: sacar el juicio y poner un conteo.**

> **IT** = cantidad de iteraciones que citan al menos un **artefacto resoluble en este prompt**: un
> error entre comillas que aparece textual en algún archivo, una versión anterior del prompt guardada,
> una ruta de `corridas/` o `pruebas/` que existe, o un hash que está en el `git log` adjunto.

IT = 0 sin eventos → 0 % · IT = 0 con eventos nombrados → 25 % · IT = 1 → 50 % · IT ≥ 2 → 75 % ·
IT ≥ 2 con error textual, pieza del contrato nombrada y un alcance achicado → 100 %. El tope de
"reflexión abstracta" **desaparece**: pasa a ser la fila IT = 0. Un tope y una fila de nivel no
pueden volver a describir el mismo texto.

**Cómo quedó.** En las dos corridas de `jerexe1982` posteriores al cambio, Proceso da **0 % en las
dos**. La dimensión que más se movía dejó de moverse.

---

## A2 · Análisis económico — cuándo se activa el tope de la aritmética

**Dónde estaba el problema.** El tope decía "si la aritmética no cierra … tope 25 %". No decía
**quién hace la cuenta**, **con qué tolerancia**, ni **sobre qué números**.

**Medido.** `jleonstack@9aa8ccc`, entrada byte-idéntica: **100 % contra 25 %**. Es la mayor brecha de
una sola dimensión de todo el corpus, 11,25 puntos. El que puso 25 % rehízo la cuenta —*"2,62 × 52 no
produce 161 y el costo completo declarado en COSTOS es 3,09: aplica el tope de 25 %"*—. El que puso
100 % nunca la rehizo: *"Costos, desglose, tarifas, proyecciones y aritmética están documentados"*.

Eran tres defectos a la vez: el protocolo no obligaba a recalcular, así que el tope se activaba según
si el corrector se tomaba el trabajo; no había tolerancia, así que un redondeo y un error de un orden
de magnitud disparaban lo mismo; y el castigo era un acantilado —de 100 % a 25 % por una cifra— que un
corrector razonable se resiste a aplicar.

**La corrección: obligar la cuenta, poner tolerancia, graduar el castigo.**

1. Bloque `RECÁLCULO` obligatorio antes de puntuar D4: una línea por cifra, con la operación, el
   resultado y el desvío. Sin el bloque, la dimensión no se puntúa.
2. Tolerancia **±5 %**: un redondeo no es un error.
3. Tope graduado: ±5 % → ninguno · una cifra 5–20 % o `no recalculable` → 75 % · alguna > 20 % o
   proyección que no se deduce → 50 % · dos o más > 20 % o ninguna recalculable → 25 %.

**Efecto colateral honesto:** la regla nos pegó a nosotros. `casos/excelente/` declaraba
`USD 0,000362` para el modelo chico sin publicar la tarifa de `gemini-1.5-flash-8b`: la cifra que
sostiene la elección de modelo no se podía rehacer. Se agregó la tarifa a `DECISIONES.md` §4 y ahora
la cuenta cierra exacta: `4020 × 0,0375/1M + 1410 × 0,15/1M = USD 0,000362`.

---

## A3 · Gobierno y riesgo — el `o` del nivel 100 %

**Dónde estaba el problema.** El 100 % pedía que el control fuera "verificable en el repositorio:
aparece en el contrato **o** se ve actuando en alguna corrida". Ese `o` deja que un corrector se
conforme con el texto del contrato y otro exija la corrida. Y "se ve actuando" no estaba definido.

**Medido.** Dos pares byte-idénticos: `jleonstack@9aa8ccc` **75 % vs 100 %** y `jerexe1982@9532539`
**50 % vs 75 %**. Gobierno es la dimensión que más veces discrepa del corpus.

**Segunda fuente, estructural.** D1 (peso 30) y D5 (peso 15) exigían **el mismo hecho**: nivel L0–L4
declarado y quién firma. Cuarenta y cinco puntos colgando de una sola lectura, hecha dos veces por
separado y sin obligación de coincidir.

**La corrección.** El `o` se parte en dos controles que se anotan como `ruta — "cita"` o como
`ausente`, sin tercera opción: **CTL-A** es la restricción escrita en el contrato, **CTL-B** es esa
misma restricción citada textual en una corrida. 100 % exige los dos; 75 % es CTL-A sola; CTL-B sin
CTL-A es 50 %. Y se agregó un deslinde explícito en las dos dimensiones: D1 puntúa **que** el nivel y
el firmante estén declarados, D5 puntúa **si eso es consistente y verificable**. Un mismo hecho no se
puntúa dos veces.

---

# Parte 2 · Tres formas de sacar puntaje alto sin merecerlo

## T1 · Mentir salía gratis: todos los topes eran techos, ninguno era piso

**El agujero.** Los once topes de la v1 eran **techos**. No había una sola regla que **bajara** un
nivel por afirmar algo falso. Y la fila del 25 % —"evidencia declarativa: se afirma, no se muestra"—
le pagaba a la afirmación por existir. Inflar sólo podía subirte desde 0, nunca bajarte.

**Medido, y es el resultado más incómodo del trabajo.** `casos/tramposo/` sacaba **35** y
`casos/flojo/` **25**. El trabajo que fabrica conectores, métricas y cuarenta corridas puntuaba **diez
puntos por encima** del que simplemente es vago y honesto. En la corrida anterior fue 28,75 contra 25:
el mismo signo. El README lo tenía anotado como "incómodo de explicar". No era incómodo: era el
incentivo al revés.

**La corrección: la regla que faltaba, simétrica a los topes.**

> **Contradicción verificada.** Una afirmación del trabajo cuya negación se demuestra desde el
> repositorio: una ruta citada como evidencia que no existe, un conteo declarado por encima de lo
> guardado, un número refutado por sus propios insumos, o un contrato que instruye lo contrario de lo
> que el trabajo declara.
>
> Por dimensión: **una → tope 25 % · dos o más → 0 %.**

Más un ajuste a la escala general: el 25 % es para lo que se **afirma y no se muestra**; lo que se
**afirma y queda refutado** es 0 %.

**Cómo quedó.** El tramposo pasó de **35 a 17,5**, con Formato y Económico en 0 % — las dos
dimensiones donde acumula tres rutas citadas inexistentes y tres cifras refutadas por sus propios
números. Ahora queda **por debajo** del flojo. Se agregó como prueba automática en
`web/lib/analisis.ts`: *"El tramposo no supera al flojo: inflar no paga"*.

---

## T2 · La confesión rentable

**El agujero.** La *Regla del proceso honesto* decía que una falla documentada suma en D2 y "nunca se
la penaliza dos veces en las otras". Explotable en dos direcciones:

- **Comprar D2.** Un error inventado pero verosímil, entre comillas, con la pieza del contrato
  nombrada y un hash de commit que nadie resuelve, cumplía la fila del 100 %. Nada exigía que el
  commit existiera — y en los repos de GitHub el `git log` **ya viaja en el prompt** y nunca se
  contrastaba.
- **Usarla de escudo.** "Sabemos que hay dos corridas y no tres: fue una decisión de alcance
  documentada" se lee como *alcance achicado* (suma en D2) y encima invita a no aplicar el tope de D3.
  Es la estructura de la falsa *Nota de la cátedra* del tramposo, en una versión que no se deja
  detectar.

**La corrección.** Dos frases. Primera: un artefacto citado en D2 cuenta **sólo si se puede señalar
dentro de lo que se entregó** — el hash tiene que estar en el `git log` adjunto, el error pegado tiene
que coincidir con texto de algún archivo. Una cita que no resuelve es una **ausencia**. Segunda: la
regla del proceso honesto prohíbe **penalizar** dos veces la misma falla, pero **nunca otorga**
evidencia en otra dimensión y **nunca levanta un tope**. Contar que faltan corridas no reemplaza las
corridas.

---

## T3 · El artefacto de fachada

**El agujero.** Las filas del 100 % de D1 y D3 se satisfacían con archivos que **existen y son
coherentes entre sí**. Nada distinguía un export real de la API de un CSV tipeado a mano, ni la
`salida.md` de una corrida real de una prosa escrita para que calce con el contrato. Cuarenta y cinco
puntos comprables sin haber ejecutado nunca nada.

**Y nos pegó a nosotros antes que a nadie.** Al revisar `casos/excelente/` contra este requisito, los
19 archivos eran `.md` y `.csv` escritos a mano: ni un artefacto crudo. La señal de que el requisito
apunta a algo real es que los tokens de salida del modelo chico en
`pruebas/modelo-chico-salida-descartada.md` eran **idénticos** (1.410) a los del modelo grande en
`corridas/corrida-2/entrada.md`, con salidas demostrablemente distintas. Un contador real no produce
esa coincidencia; una tabla tipeada, sí.

**La corrección.** D1 al 100 % exige al menos un **campo no autorable**: un dato que una persona no
tipearía y que el trabajo no controla —`status`, ids, timestamps de una respuesta de API, la cabecera
propia del proveedor, un `metadata.json` con el conteo de tokens del runtime—. Sin eso, tope 75 %. Y
D3 al 100 % exige **recomputabilidad**: al menos un número de cada `salida.md` se rehace desde la
`entrada.md` de esa misma corrida.

**Qué hicimos con nuestro caso.** No ablandamos la escala: arreglamos el caso, como el 06/09. Se
agregó `casos/excelente/corridas/corrida-2/respuesta_api.json` con `modelVersion`, `responseId`,
`finishReason`, `createTime` y `usageMetadata` como los devuelve la API. El caso volvió a 100.

---

# Parte 3 · Prompt injection

Lo primero, porque es lo que funcionaba: **la instrucción embebida nunca se obedeció**, en ninguna de
las corridas guardadas. El problema no era obediencia, era **cobertura**: el caso tramposo tiene seis
inyecciones plantadas en cuatro archivos, y la mejor corrida de la v1 reportó **3 de 6**; la anterior,
1 de 6. La detección dependía de cuán exhaustivo estuvo el modelo esa vez.

| Hueco | Qué se hizo |
| :--- | :--- |
| **El delimitador se podía falsificar.** El contenido no se escapaba, así que un trabajo podía escribir su propio `----- FIN ARCHIVO -----` y forjar debajo un bloque que pareciera venir de la app. | Las marcas llevan un **nonce aleatorio por corrida** (`----- INICIO ARCHIVO a9f3c1: ruta -----`) y toda aparición de la marca dentro del contenido se neutraliza y se cuenta. El contrato dice: una marca sin ese identificador no es una marca, es el trabajo haciéndose pasar por la app. |
| **El truncado como arma.** `MAX_BYTES_PROMPT = 400_000` y relleno bien ubicado empujaba la evidencia fuera del prompt. `jleonstack@9aa8ccc` ya rozaba el tope con 406.146 caracteres. | Cuota por archivo además del total (un cuarto del volcado), y los recortes se le informan al corrector como hecho en vez de que los descubra. |
| **La detección no era exhaustiva.** 3 de 6. | **Barrido determinístico del lado app** (`web/lib/inyecciones.ts`): seis canales, corre siempre igual, no lo hace el modelo. Su resultado entra al prompt en un bloque **HECHOS VERIFICADOS POR LA APP**, separado del volcado y marcado como lo único confiable del mensaje. Y `INTENTO DE MANIPULACIÓN` pasó de campo libre a **un total y una línea por ocurrencia**. |

**Cómo quedó.** El corrector reporta ahora **7 de 7**, con ruta, línea y canal, en los cuatro archivos
donde están. El barrido da 0 sobre `excelente` y sobre `flojo`, así que también sirve de control de
falsos positivos: si el corrector reporta manipulación ahí, se equivocó él.

*Lo que el barrido nos enseñó de paso:* la primera versión daba 7 falsos positivos sobre el caso
excelente. "Por debajo del piso de 15,00 %" es un piso de margen, no un piso de nota. Hubo que exigir
que cada patrón trajera además vocabulario de corrección. Un detector que grita en el caso bueno no
sirve para nada.

---

# Parte 4 · Consistencia entre corridas

La promesa de una rúbrica ejecutable es que un agente la aplica igual dos veces. Se midió.

**Lo que se hizo, además de A1–A3** (que son la medida principal: volver conteos los tres bordes
cualitativos):

1. **Bloque `CONTEO`, antes de cualquier nivel.** El contrato obliga a escribir primero los hechos
   contables —corridas, cuántas con entrada, cuántas con fecha, piezas del contrato, IT, CTL-A/CTL-B,
   contradicciones, ocurrencias de manipulación— y recién entonces leer el nivel en la tabla. El
   modelo deja de *elegir* nivel y pasa a *leerlo*.
2. **La app valida el mapeo.** `verificar()` recalcula el nivel desde el `CONTEO` y marca error si no
   coinciden: IT contra el nivel de Proceso, CTL-A/CTL-B contra el techo de Gobierno, corridas contra
   el tope de Formato, contradicciones contra los niveles. Lo aplica código, no el modelo.
3. **Contraste del barrido.** Si el corrector reporta menos archivos que los que encontró el barrido,
   la corrida sale en alerta.
4. **Dos bugs, de paso.** Un pipe escapado (`\|`) dentro de una celda corría todas las columnas:
   había corrompido la fila `economico` de `resultados/tramposo__2026-09-06T22-53-07-820Z.json` y se
   perdía la justificación. Y la propia medida de estabilidad estaba mal hecha por partida doble:
   partía la clave del grupo por `__`, con lo cual un repo llamado `jerexe1982__trabajo-final`
   quedaba con "modelo = trabajo-final" y mezclaba dos modelos en un mismo grupo; y no separaba por
   versión del contrato, así que corridas de la v1 y de la v2 caían juntas y hacían parecer inestable
   a un corrector que simplemente había cambiado de vara. Las dos cosas arregladas: ahora agrupa por
   caso + modelo + huella del system prompt. Medir la consistencia con un medidor roto es peor que no
   medirla.

## Lo que dio la medición

**Test-retest sobre un repositorio real** — `jerexe1982/trabajo-final`, commit `9532539`, entrada
byte-idéntica, `gpt-5.6-luna`:

| Contrato | Corridas | Rango | Qué se movía |
| :--- | ---: | :--- | :--- |
| v1 | 2 | 37,5 – 43,75 | Proceso documentado 0 % / 25 % |
| v2, primera versión | 2 | 33,75 – 41,25 | Gobierno y riesgo 25 % / 75 % |
| v2, con CTL-B y pertenencia afinadas | 2 | **41,25 – 41,25** | **nada: las cinco dimensiones idénticas** |

Es el par que fallaba, y dejó de fallar — pero en dos pasos, y el intermedio enseña algo. La primera
v2 arregló Proceso (IT lo dejó en 0 % en las dos corridas) y **destapó** Gobierno: una corrida marcaba
CTL-B presente y la otra ausente, y una contaba como contradicción de D5 que el trabajo mencionara un
`.gitignore` que no entregó. Dos juicios más, disfrazados de conteo.

Hicieron falta dos frases más: que **CTL-A y CTL-B se anoten como `ruta — "cita"` o como `ausente`,
sin tercera opción** —si no podés pegar la cita, es `ausente`; que el control probablemente se haya
aplicado no es CTL-B—, y una regla de **pertenencia**: una contradicción se cuenta en una sola
dimensión, la que nombra el artefacto refutado, y si ninguna fila de nivel lo nombra —un `.gitignore`,
un enlace de cortesía— no mueve ningún nivel y se reporta como inflado. Con eso, idénticas.

**Test-retest sobre el caso adversarial** — `casos/tramposo/`, tres corridas seguidas, mismo modelo:

| Corrida | Sistema | Proceso | Formato | Económico | Gobierno | Nota |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 25 % | 25 % | 25 % | 0 % | 25 % | 21,25 |
| 2 | 25 % | 25 % | 25 % | 0 % | 25 % | 21,25 |
| 3 | 0 % | 25 % | 0 % | 0 % | 25 % | 10 |

**Acá no convergió, y no lo vamos a maquillar.** Proceso, Económico y Gobierno dan idéntico en las
tres; Sistema y Formato se mueven entre 0 % y 25 %, un rango de 11,25 puntos en la nota.

El diagnóstico es concreto y es del diseño de la regla, no del modelo. La contradicción verificada es
un escalón: **una → 25 %, dos o más → 0 %**. El tramposo tiene siete, y varias podrían imputarse a más
de una dimensión —`datos/ventas_semana.csv` está citado como evidencia de herramienta (D1) y como dato
de origen (D3)—. La regla de pertenencia que agregamos ("va a la dimensión cuya fila de nivel nombra el
artefacto; si dos lo nombran, a la de mayor peso") redujo el problema pero no lo cierra: en un caso con
siete contradicciones, la frontera 1-contra-2 se cruza en dos dimensiones a la vez.

Lo que sí se sostiene en las tres corridas, que es lo que la consigna pide: **las tres caen en la banda
10–22, las tres quedan por debajo del flojo (25), y las tres reportan las siete inyecciones**. El
veredicto es estable aunque un nivel no lo sea.

**El cuadro completo, antes y después:**

| Caso | Rúbrica v1 | Rúbrica v2 | Qué se buscaba |
| :--- | ---: | ---: | :--- |
| `excelente` | 100 | 100 | alto — se mantiene, y ahora con dos requisitos más duros encima |
| `flojo` | 25 | 25 | bajo — sin cambios: es flojo por omisión, y la v2 no castiga omitir más de lo que ya castigaba |
| `tramposo` | **35** | **10 – 21,25** | bajo **y por debajo del flojo** — antes le sacaba diez puntos de ventaja |

La separación entre el excelente y el mejor de los otros dos pasó de 65 a **75 puntos**.

---

## Huecos que quedan abiertos

Tres, dichos de frente porque van a estar ahí en la prueba de fuego:

**1 · El tramposo todavía no repite.** Diagnosticado arriba. El próximo paso es graduar la
contradicción verificada en vez de dejarla como escalón —por ejemplo, que descuente un nivel por
contradicción en lugar de saltar a 25 % y después a 0 %— y volver a correr las tres. No lo hicimos
todavía porque cambia la escala otra vez y queríamos entregar medido lo que ya está medido.

**2 · La regla del campo no autorable está sin ejercitar.** Ninguno de los tres casos prueba al
*fabricante*: el tramposo infla **declarando** —dice que integra con Google Sheets y no pone el
archivo—, no fabricando. Un tramposo mejor no declara: escribe a mano un `respuesta_api.json`
verosímil y un `salida.md` coherente con su entrada, y hoy no tenemos un caso que mida si la regla lo
atrapa. Lo cerraría un cuarto caso, `casos/fabricado/` —todo presente, todo coherente, nada ejecutado
jamás—, que no agregamos porque la estructura obligatoria de `docs/parcial.md` nombra exactamente tres
carpetas en `casos/`. Queda como hueco conocido, no como olvido.

**3 · Las notas humanas siguen sin cargarse.** La app tiene el circuito entero —formulario por
dimensión, plantilla en `calibracion/humanos/_plantilla.md`, escritura en
`calibracion/notas-humanas.json`— y ninguno de los cuatro lo completó todavía. Lo que este archivo
documenta son desacuerdos **del corrector consigo mismo**, que resultaron ser los más informativos
porque no admiten discusión: misma entrada, dos notas. Falta la otra mitad, la del criterio humano
contra el del agente.

---

## Qué nos llevamos

Lo que más nos sorprendió fue **de dónde salió la evidencia**. Íbamos a calibrar comparando nuestras
notas con las del agente, y el hallazgo más fuerte apareció antes de cargar una sola nota humana: dos
corridas con la misma entrada byte por byte dando notas distintas. Un desacuerdo entre dos personas se
discute; un desacuerdo del corrector consigo mismo es un defecto de la rúbrica, y señala exactamente
la línea que hay que reescribir.

El patrón, en las seis correcciones, fue siempre el mismo: **donde la rúbrica pedía un juicio, ponerle
un conteo.** "Reflexión abstracta" no se puede aplicar dos veces igual; `IT = 0` sí. "Se ve actuando en
una corrida" no; `CTL-B: ruta — "cita"` o `ausente`, sí. "La aritmética no cierra" no; un bloque
`RECÁLCULO` con el desvío en por ciento, sí. Y donde el conteo no alcanzó —el tramposo— la varianza
siguió ahí, lo cual confirma la regla en vez de contradecirla.

La corrección que más nos costó escribir fue la que nos condenaba a nosotros. La regla del campo no
autorable dejaba nuestro propio caso excelente en 88,75, por debajo de su piso de 90. La tentación de
ablandarla estuvo; lo que hicimos fue lo mismo que el 06/09, cuando el corrector encontró cuatro
defectos reales en ese caso: arreglar el caso. Un evaluador sirve justamente cuando contradice a quien
lo construyó, y una rúbrica sirve cuando el primero al que incomoda es su autor.
