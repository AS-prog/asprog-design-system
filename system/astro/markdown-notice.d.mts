// Tipo mínimo del plugin: no depende de satteri para que el paquete no lo exija.
declare const markdownNotice: {
  name: string;
  element: { filter: string[]; visit: (node: any) => any };
};
export default markdownNotice;
