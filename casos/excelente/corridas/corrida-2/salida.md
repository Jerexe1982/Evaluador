# Reporte Semanal de Ventas y Alertas Operativas — Semana 32 (10/08/2026 al 16/08/2026)

## 1. Resumen Ejecutivo
En la Semana 32 se registró una facturación total de **$ 1.447.125,00** en 10 operaciones comerciales, alcanzando un margen bruto medio del **22.64%**. Se identifica un desvío severo de rentabilidad provocado por la transacción **TRX-1025** a Hipermercado El Sol, donde un descuento del **35.0%** redujo el margen bruto de la operación al **6.49%**. Esta única operación destruyó 4.2 puntos porcentuales del margen bruto potencial de la semana.

## 2. Métricas Clave (KPIs)
| Métrica | Valor | Objetivo / Ref | Estado |
| :--- | :--- | :--- | :--- |
| Facturación Total | $ 1.447.125,00 | N/A | Normal |
| Costo Total de Ventas | $ 1.119.500,00 | N/A | Informativo |
| Margen Bruto Total ($) | $ 327.625,00 | N/A | Informativo |
| Margen Bruto Medio (%) | 22.64 % | Mínimo 20.0 % | En Regla |
| Descuento Medio (%) | 14.00 % | Máximo 12.0 % | Alerta Crítica |
| Total Transacciones | 10 | N/A | Informativo |

## 3. Análisis por Vendedor y Categoría

### Desglose por Vendedor
| Vendedor | Operaciones | Facturación Total | Margen Medio % | Descuento Medio % |
| :--- | :--- | :--- | :--- | :--- |
| Carlos Gómez | 2 | $ 476.100,00 | 10.84 % | 22.50 % |
| Juan Pérez | 3 | $ 391.500,00 | 33.33 % | 10.00 % |
| Ana Martínez | 2 | $ 295.200,00 | 28.18 % | 10.00 % |
| María Rodríguez | 3 | $ 284.325,00 | 23.89 % | 15.00 % |

### Desglose por Categoría
| Categoría | Facturación Total | Participación % | Margen Medio % |
| :--- | :--- | :--- | :--- |
| Papel e Higiene | $ 549.000,00 | 37.94 % | 11.84 % |
| Accesorios y Mopas | $ 295.200,00 | 20.40 % | 28.18 % |
| Químicos de Limpieza | $ 371.625,00 | 25.68 % | 28.94 % |
| Desinfectantes/Sanitizantes | $ 231.300,00 | 15.98 % | 33.85 % |

## 4. Alertas Comerciales y de Riesgo Operativo

1. **Alerta 1 (TRX-1025):** Hipermercado El Sol | Carlos Gómez | Papel Higiénico Jumbopack | Descuento: 35.0% | Margen: 6.49%  
   - **DESVÍO GRAVE DE MARGEN:** Se otorgó un descuento del 35.0% (máximo permitido: 20.0%) reduciendo la ganancia bruta a solo $ 25.800,00 sobre un volumen de $ 397.800,00. El margen de 6.49% viola severamente el piso del 15.0%.
2. **Alerta 2 (TRX-1030):** Frigorífico La Pampa | María Rodríguez | Detergente Industrial 20L | Descuento: 25.0% | Margen: 15.90%  
   - **DESCUENTO NO AUTORIZADO:** El descuento concedido (25.0%) excede el límite normativo del 20.0%, situando el margen al borde del límite de tolerancia.

## 5. Acciones Recomendadas

1. **Revisión Inmediata con Carlos Gómez:** Citar al vendedor Carlos Gómez para auditar el motivo de la concesión de un 35% de descuento no parametrizado en la transacción TRX-1025.
2. **Bloqueo Sistémico de Descuentos > 20%:** Implementar una regla rígida en el software de facturación para rechazar la emisión de notas de pedido con descuentos superiores al 20.0% sin token de autorización de L3.
3. **Refacturación o Nota de Débito:** Evaluar con la Gerencia Comercial la factibilidad legal/comercial de renegociar las condiciones con Hipermercado El Sol para las próximas entregas.
