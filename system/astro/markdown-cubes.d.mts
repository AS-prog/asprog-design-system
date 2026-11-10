// Tipo mínimo del plugin: no depende de satteri para que el paquete no lo exija.
declare const markdownCubes: {
  name: string;
  element: { filter: string[]; visit: (node: any) => any };
};
/** El marcado de la figura de una Nota: la pila (`""`) o los dos fotogramas (`"antes-ahora"`), con su pie si lo lleva. */
export declare function cubeNote(caption?: string, variant?: "" | "antes-ahora"): string;
export default markdownCubes;
