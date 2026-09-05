# DECISIONES — NorteBot

## Criterio general

El proyecto se desarrolló con una mirada centrada en el negocio y en la experiencia de quienes reciben el reporte. Desde el comienzo se priorizó una solución simple, confiable y escalable, capaz de acompañar el crecimiento de Almacén Norte SRL sin introducir fricción en las tareas cotidianas. La arquitectura fue pensada para separar la adquisición de datos, el razonamiento y la comunicación de resultados.

## Evolución conceptual

La primera etapa consistió en comprender las necesidades de la organización y traducirlas a un objetivo claro. Luego se exploraron distintas alternativas de modelos, herramientas y formatos, considerando calidad, velocidad y costo. La solución elegida mostró un balance superior y permitió consolidar un flujo flexible.

En una segunda etapa se refinó el contrato para que el agente pudiera trabajar con información heterogénea. Se puso especial atención en la claridad del rol, el contexto y las restricciones, buscando que las respuestas fueran consistentes y accionables. Los ejemplos fueron incorporados como mecanismo de alineación y como referencia para situaciones habituales.

## Iteraciones y aprendizajes

Las iteraciones permitieron fortalecer el criterio de análisis, reducir ambigüedades y mejorar la calidad de las recomendaciones. Se revisaron casos normales, extremos y con información incompleta. El sistema evolucionó hacia una respuesta más breve, con mayor foco en los indicadores que interesan a la gerencia.

También se trabajó sobre la gobernanza. Se adoptó el principio de mínimo privilegio, se incorporó revisión humana y se definieron límites explícitos para evitar que el agente tomara decisiones irreversibles. La separación entre sugerir y ejecutar fue considerada fundamental para preservar la responsabilidad humana.

## Decisiones técnicas

La selección del modelo respondió a una evaluación integral de precisión, latencia y costo. La estructuración de la salida facilitó la validación automática y dejó una base sólida para futuras integraciones. La conexión con la planilla y el canal de comunicación se diseñó con credenciales seguras y manejo de errores.

## Resultado

El resultado es una solución madura, replicable y orientada a impacto. La experiencia confirmó que el diseño de contratos, la supervisión y el análisis económico deben pensarse de manera conjunta. NorteBot constituye una base sólida para ampliar el alcance a pronósticos, segmentación y automatización de decisiones comerciales.

## Reflexión final

El mayor aprendizaje fue comprender que un agente no es sólo un prompt, sino un sistema sociotécnico completo. El trabajo permitió integrar diseño, implementación, evaluación, economía y gobierno en una propuesta coherente, preparada para operar en un contexto real y generar valor sostenible.
