# Salida descartada — contrato v3 borrador (2026-08-09)

> **Esto no es una corrida del sistema.** Es la salida defectuosa de una prueba previa, guardada
> como evidencia de la iteración 3 de [../DECISIONES.md](../DECISIONES.md). Las tres corridas del
> trabajo están en [../corridas/](../corridas/).

| Campo | Valor |
| :--- | :--- |
| Fecha | 2026-08-09 11:05 UTC-3 |
| Contrato | v3 borrador — seis piezas completas y restricción de tono; **sin** la regla 4.3 de filas incompletas y **sin** vocabulario cerrado de la columna Estado |
| Modelo | `gemini-1.5-flash` |
| Dato de entrada | [../datos/piloto_semana_30.csv](../datos/piloto_semana_30.csv) |
| Motivo del descarte | completó con un valor inventado el costo que faltaba en TRX-0998 y usó un valor de Estado fuera del formato |

---

## Salida tal como se recibió (secciones 1 y 2; el resto se omite por ser correcto)

### 1. Resumen Ejecutivo
La semana registró una facturación de $ 622.110,00 sobre 8 transacciones, con un margen bruto
medio de 28,45 % y un descuento medio de 11,63 %. Una transacción quedó fuera de regla:
TRX-0993, con 28,00 % de descuento y 12,39 % de margen. Para TRX-0998 se tomó como costo
unitario $ 21.000,00, el mismo valor registrado para ese producto en operaciones anteriores.

### 2. Métricas Clave (KPIs)
| Métrica | Valor | Objetivo / Ref | Estado |
| :--- | :--- | :--- | :--- |
| Facturación Total | $ 622.110,00 | N/A | Normal |
| Costo Total de Ventas | $ 445.150,00 | N/A | Informativo |
| Margen Bruto Total ($) | $ 176.960,00 | N/A | Informativo |
| Margen Bruto Medio (%) | 28,45 % | Mínimo 20,00 % | En Regla (Óptimo) |
| Descuento Medio (%) | 11,63 % | Máximo 12,00 % | En Regla |
| Total Transacciones | 8 | N/A | Informativo |

---

## Chequeo L2 que detectó el problema

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
