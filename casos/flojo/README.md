# Trabajo Final — Automatización de procesos con IA

**Alumno:** Mateo González
**Materia:** Programación de y con Agentes de IA
**Maestría:** MBA UCEMA — 2026 2T
**Dónde trabajo:** Distribuidora Pampa S.R.L., mayorista de almacén en zona oeste del GBA. Estoy en el área administrativa/comercial.

---

## Introducción

En cualquier empresa hay tareas administrativas que se siguen haciendo a mano sobre una planilla: alguien abre el archivo, mira los números y escribe un resumen para pasarlo al resto. Es un trabajo repetitivo, que lleva tiempo y que no aporta demasiado en sí mismo.

La idea de este trabajo final es aplicar un modelo de lenguaje a ese tipo de tarea dentro de la empresa donde trabajo, que es una PyME chica y no tiene área de sistemas. La intención es que la parte repetitiva la resuelva la IA y que la persona se quede con la revisión y con la decisión.

## Enfoque

El trabajo se apoya en las herramientas de IA generativa que ya usamos en el día a día (ChatGPT en el navegador), sin desarrollar software adicional ni contratar nada nuevo. El agente está definido por un prompt, y los datos de la semana se pegan directamente adentro de ese prompt.

Es una primera versión, con un alcance chico a propósito: verificar que la salida sirva como borrador para después revisarla. No hay ninguna integración con la planilla ni con los sistemas de la empresa: todo se hace copiando y pegando.

## Estructura del repositorio

- `README.md`: este archivo.
- `prompts/system_prompt.md`: el prompt que le paso al modelo.
- `corridas/`: la salida de la ejecución que dejé guardada.
- `DECISIONES.md`: notas del armado, costos y controles.

## Cómo se usa

1. Abrir ChatGPT.
2. Abrir `prompts/system_prompt.md` y reemplazar los datos que están adentro por los de la semana que corresponda.
3. Pegar todo en el chat.
4. Copiar la respuesta y revisarla antes de mandarla.

## Próximos pasos

Si el resultado convence, más adelante se podría ver la forma de que lea la planilla directamente en vez de tener que pegar los datos a mano, y de dejar más cerrado el formato de salida para que todas las semanas queden iguales.
