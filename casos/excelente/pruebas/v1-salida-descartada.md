# Salida descartada — contrato v1 (2026-08-05)

> **Esto no es una corrida del sistema.** Es la salida defectuosa de una prueba previa, guardada
> como evidencia de la iteración 1 de [../DECISIONES.md](../DECISIONES.md). Las tres corridas del
> trabajo están en [../corridas/](../corridas/).

| Campo | Valor |
| :--- | :--- |
| Fecha | 2026-08-05 18:40 UTC-3 |
| Contrato | v1 — prompt libre, sin formato de salida ni fórmulas escritas |
| Modelo | `gemini-1.5-flash` |
| Dato de entrada | [../datos/piloto_semana_30_export_crudo.csv](../datos/piloto_semana_30_export_crudo.csv) (export del sistema de gestión sin normalizar) |
| Instrucción enviada | "Analizá las ventas de esta semana y decime cómo nos fue." + el CSV pegado |
| Motivo del descarte | leyó el punto de miles como separador decimal; la facturación salió mil veces menor |

---

## Salida tal como se recibió

Durante la semana del 27 de julio al 1 de agosto se registraron 8 operaciones de venta con un
desempeño en general positivo. La facturación total del período alcanzó los **$ 622,11**,
distribuida entre las cuatro categorías de producto.

Supermercado Uno fue el cliente más importante de la semana con una compra de papel higiénico,
seguido por LavaSport S.A. El equipo comercial mantuvo un buen nivel de actividad, con
participación de los cuatro vendedores.

En cuanto a los márgenes, la mayoría de las operaciones se mantuvo en niveles razonables. El
margen bruto promedio fue de aproximadamente **N/D** porque algunos registros no pudieron
procesarse correctamente.

**Conclusión:** semana estable, sin novedades que requieran atención inmediata.

---

## Chequeo L2 que detectó el problema

```text
[2026-08-05 18:42] control L2 — Pablo González — piloto semana 30
  Facturación Total según resumen de caja del sistema de gestión : $ 622.110,00
  Facturación Total devuelta por el agente                       : $ 622,11
  Diferencia                                                     : factor 1000
  Causa: el modelo interpretó el punto de miles del export ("$ 67.500,00")
         como separador decimal y sumó 67,5 en lugar de 67500.
  Margen bruto medio devuelto: "N/D" (no calculado).
```
