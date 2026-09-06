# Reporte Semanal de Ventas y Alertas Operativas — Semana 33 (17/08/2026 al 23/08/2026)

## 1. Resumen Ejecutivo
La semana cerró con una facturación de $ 1.089.212,50 sobre 12 transacciones procesadas y un margen bruto medio de 32,80 %, por encima del piso de referencia de 20,00 %. El descuento medio fue de 8,75 %, 3,25 puntos por debajo del objetivo de 12,00 %, y ninguna de las 12 transacciones procesadas infringió los umbrales de margen ni de descuento. El archivo trajo 13 filas: TRX-1043 llegó sin `Costo_Unitario`, `Costo_Total` ni `Margen_Bruto_Porcentaje`, quedó excluida de todos los agregados y está detallada en la Sección 4. Los $ 52.650,00 de esa transacción no están contados en la facturación informada arriba, de modo que las cifras de este reporte cubren 12 de las 13 operaciones de la semana.

## 2. Métricas Clave (KPIs)
| Métrica | Valor | Objetivo / Ref | Estado |
| :--- | :--- | :--- | :--- |
| Facturación Total | $ 1.089.212,50 | N/A | Informativo |
| Costo Total de Ventas | $ 731.900,00 | N/A | Informativo |
| Margen Bruto Total ($) | $ 357.312,50 | N/A | Informativo |
| Margen Bruto Medio (%) | 32,80 % | Mínimo 20,00 % | En Regla |
| Descuento Medio (%) | 8,75 % | Máximo 12,00 % | En Regla |
| Total Transacciones Procesadas | 12 | N/A | Informativo |
| Transacciones Excluidas por Dato Faltante | 1 | N/A | Alerta |

## 3. Análisis por Vendedor y Categoría

### Desglose por Vendedor
| Vendedor | Operaciones | Facturación Total | Margen Medio % | Descuento Medio % |
| :--- | :--- | :--- | :--- | :--- |
| Ana Martínez | 3 | $ 310.150,00 | 32,61 % | 8,33 % |
| María Rodríguez | 3 | $ 305.512,50 | 31,26 % | 8,33 % |
| Carlos Gómez | 3 | $ 253.950,00 | 35,46 % | 8,33 % |
| Juan Pérez | 3 | $ 219.600,00 | 32,15 % | 10,00 % |

### Desglose por Categoría
| Categoría | Facturación Total | Participación % | Margen Medio % |
| :--- | :--- | :--- | :--- |
| Desinfectantes/Sanitizantes | $ 330.450,00 | 30,34 % | 35,57 % |
| Papel e Higiene | $ 305.512,50 | 28,05 % | 31,26 % |
| Químicos de Limpieza | $ 283.050,00 | 25,99 % | 32,17 % |
| Accesorios y Mopas | $ 170.200,00 | 15,63 % | 31,26 % |

## 4. Alertas Comerciales y de Riesgo Operativo

1. **HUECO DE DATOS (TRX-1043):** Cooperativa Escolar Sur | Carlos Gómez | Servilleta 33x33 1000u
   - Columnas vacías: `Costo_Unitario`, `Costo_Total`, `Margen_Bruto_Porcentaje`. Fila excluida de todos los agregados. No se estima el valor faltante. La fila declara 30 unidades a $ 1.755,00 con 10,00 % de descuento y $ 52.650,00 de facturación; sin el costo no puede calcularse su margen ni verificarse si infringe el piso de 15,00 %.

Entre las 12 transacciones procesadas no se registraron desvíos de margen ni descuentos por encima de 20,00 %.

## 5. Acciones Recomendadas
1. Cargar el costo de Servilleta 33x33 1000u en la ficha de producto del sistema de gestión y volver a exportar la semana 33: hasta entonces la facturación real del período es superior a la informada en este reporte.
2. Revisar por qué el producto se facturó sin costo cargado: si el alta de producto permite emitir sin costo, el control de margen de la Sección 4 no cubre esas operaciones.
3. Sostener el tope de descuento vigente en las categorías Papel e Higiene y Químicos de Limpieza, donde se concentraron los desvíos de las semanas 31 y 32 y esta semana no hubo ninguno.

Reporte parcial: no distribuir hasta completar los datos faltantes listados en la Sección 4.
