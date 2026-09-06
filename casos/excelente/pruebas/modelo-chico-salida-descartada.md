# Salida descartada — prueba de modelo más chico, `gemini-1.5-flash-8b` (2026-08-18)

> **Esto no es una corrida del sistema.** Es la salida defectuosa de la prueba de modelo
> documentada en la sección 4 de [../DECISIONES.md](../DECISIONES.md). Las tres corridas del
> trabajo están en [../corridas/](../corridas/) y todas usaron `gemini-1.5-flash`.

| Campo | Valor |
| :--- | :--- |
| Fecha | 2026-08-18 10:40 UTC-3 |
| Modelo probado | `gemini-1.5-flash-8b` |
| Contrato | el mismo, sin cambios: [../prompts/system_prompt.md](../prompts/system_prompt.md) versión 3 |
| Entrada | exactamente la de [../corridas/corrida-2/entrada.md](../corridas/corrida-2/entrada.md) (Semana 32) |
| Salida correcta de referencia | [../corridas/corrida-2/salida.md](../corridas/corrida-2/salida.md) |
| Tokens | entrada 4.020 · salida 1.410 |
| Costo de esta prueba | USD 0,000362 (contra USD 0,000725 con `gemini-1.5-flash`) |
| Resultado | descartado: tres defectos, dos de ellos afectan una decisión comercial |

---

## Salida tal como se recibió (secciones 1 a 4; la 5 se omite por ser correcta)

### 1. Resumen Ejecutivo
La semana registró una facturación de $ 1.447.125,00 sobre 10 transacciones, con un margen bruto
medio de 27,54 % y un descuento medio de 14,00 %. Se detectó un desvío: TRX-1025, con 35,00 % de
descuento y 6,49 % de margen. Ninguna fila llegó incompleta.

### 2. Métricas Clave (KPIs)
| Métrica | Valor | Objetivo / Ref | Estado |
| :--- | :--- | :--- | :--- |
| Facturación Total | $ 1.447.125,00 | N/A | Informativo |
| Costo Total de Ventas | $ 1.119.500,00 | N/A | Informativo |
| Margen Bruto Total ($) | $ 327.625,00 | N/A | Informativo |
| Margen Bruto Medio (%) | 27,54 % | Mínimo 20,00 % | En Regla |
| Descuento Medio (%) | 14,00 % | Máximo 12,00 % | Alerta Crítica |
| Total Transacciones Procesadas | 10 | N/A | Informativo |
| Transacciones Excluidas por Dato Faltante | 0 | N/A | Informativo |

### 3. Análisis por Vendedor y Categoría

#### Desglose por Vendedor
| Vendedor | Operaciones | Facturación Total | Margen Medio % | Descuento Medio % |
| :--- | :--- | :--- | :--- | :--- |
| Carlos Gómez | 2 | $ 476.100,00 | 19,72 % | 22,50 % |
| Juan Pérez | 3 | $ 391.500,00 | 33,86 % | 10,00 % |
| Ana Martínez | 2 | $ 295.200,00 | 29,59 % | 10,00 % |
| María Rodríguez | 3 | $ 284.325,00 | 25,05 % | 15,00 % |

#### Desglose por Categoría
| Categoría | Facturación Total | Participación % | Margen Medio % |
| :--- | :--- | :--- | :--- |
| Papel e Higiene | $ 549.000,00 | 37,94 % | 16,21 % |
| Químicos de Limpieza | $ 371.625,00 | 25,68 % | 28,69 % |
| Accesorios y Mopas | $ 295.200,00 | 20,40 % | 29,59 % |
| Desinfectantes/Sanitizantes | $ 231.300,00 | 15,98 % | 34,50 % |

### 4. Alertas Comerciales y de Riesgo Operativo

1. **Alerta 1 (TRX-1025):** Hipermercado El Sol | Carlos Gómez | Papel Higiénico Jumbopack | Descuento: 35,00 % | Margen: 6,49 %
   - **DESVÍO DE MARGEN:** el margen de 6,49 % queda por debajo del piso de 15,00 %.

---

## Comparación contra la salida de `gemini-1.5-flash`

| Punto | `flash-8b` (esta salida) | `flash` (corrida 2) | Qué pasó |
| :--- | :--- | :--- | :--- |
| Margen Bruto Medio (%) | 27,54 % | 22,64 % | promedió los márgenes fila por fila en vez de dividir ganancia total sobre facturación total, como fija la regla 4.4 del contrato. Sobreestima el margen de la semana en 4,90 puntos |
| Margen Medio % por vendedor | Carlos Gómez 19,72 % | Carlos Gómez 10,84 % | mismo error de promedio simple: (32,95 + 6,49) ÷ 2 = 19,72 |
| Alertas | 1 (TRX-1025) | 2 (TRX-1025 y TRX-1030) | omitió TRX-1030, que infringe sólo la regla de descuento (25,00 % > 20,00 %) y no la de margen: aplicó una de las dos reglas de la sección 4.1 |
| Estado del descuento medio | `Alerta Crítica` | `Alerta` | valor fuera del vocabulario cerrado |

Los dos primeros errores no se ven a simple vista: la salida es prolija y los totales de
facturación son correctos. El tercero es el que decide la prueba: TRX-1030 es una operación de
$ 121.875,00 con un descuento no autorizado que el reporte no le habría mostrado al Gerente
Comercial. El ahorro que justificaría el cambio es de USD 0,000363 por corrida, unos USD 0,019
por año a razón de una corrida semanal. Se descartó `flash-8b` y quedó `flash`.
