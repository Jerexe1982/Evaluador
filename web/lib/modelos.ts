/** Modelos habilitados para correr el corrector, con la tarifa publicada por millón de tokens. */
export type Modelo = {
  id: string;
  nombre: string;
  entradaPorMillon: number;
  salidaPorMillon: number;
  nota: string;
};

export const MODELOS: Modelo[] = [
  {
    id: "claude-opus-5",
    nombre: "Claude Opus 5",
    entradaPorMillon: 5,
    salidaPorMillon: 25,
    nota: "El más capaz. Es el que usamos para diseñar y calibrar la rúbrica.",
  },
  {
    id: "claude-sonnet-5",
    nombre: "Claude Sonnet 5",
    entradaPorMillon: 2,
    salidaPorMillon: 10,
    nota: "Intermedio. Sirve para comparar si la corrección se sostiene más barata.",
  },
  {
    id: "claude-haiku-4-5",
    nombre: "Claude Haiku 4.5",
    entradaPorMillon: 1,
    salidaPorMillon: 5,
    nota: "El más chico. El criterio del curso pide probar si alcanza para la tarea.",
  },
];

export const MODELO_POR_DEFECTO = MODELOS[0].id;

export function buscarModelo(id: string): Modelo | undefined {
  return MODELOS.find((m) => m.id === id);
}
