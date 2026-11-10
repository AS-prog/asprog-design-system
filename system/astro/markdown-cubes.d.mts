// Tipo mínimo del plugin: no depende de satteri para que el paquete no lo exija.
declare const markdownCubes: {
  name: string;
  element: { filter: string[]; visit: (node: any) => any };
};
/** El marcado de la figura de una Nota, con su pie si lo lleva. */
export declare function cubeNote(caption?: string): string;
export default markdownCubes;
