# USER PROMPT — Plantilla de la corrida semanal

Esta es la plantilla que se completa cada lunes. Los campos entre corchetes se reemplazan antes
de enviar. El system prompt que acompaña este pedido es [system_prompt.md](system_prompt.md).
Las tres ejecuciones ya hechas con esta plantilla, con los valores reales de cada semana, están
en [../corridas/](../corridas/).

---

````text
Semana a procesar: [SEMANA_NN (DD/MM/AAAA al DD/MM/AAAA)]
Archivo de origen: [datos/ventas_semana_NN.csv]
Fecha de ejecución: [AAAA-MM-DD HH:MM UTC-3]
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
[CONTENIDO_COMPLETO_DEL_CSV]
```
````

---

**Cómo se arma la corrida (procedimiento, 4 pasos).**

1. Exportar la semana del sistema de gestión a CSV y guardarla en `datos/ventas_semana_NN.csv`
   sin separador de miles y con decimal punto.
2. Copiar esta plantilla, completar los corchetes y pegar el contenido del archivo dentro del
   bloque `csv`. La entrada resultante se guarda tal cual en `corridas/corrida-N/entrada.md`.
3. Enviar system prompt + user prompt al modelo declarado en la entrada y guardar la respuesta
   sin editar en `corridas/corrida-N/salida.md`.
4. Revisión L2 (Pablo González) sobre la salida guardada, según el punto 7 del system prompt.
   Recién después se manda a firma.
