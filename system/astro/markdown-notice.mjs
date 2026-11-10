// Plugin HAST para Sätteri, el procesador de Markdown de Astro 7: convierte los callouts
// de Markdown en avisos de Delphos, con el mismo marcado que Notice.astro (AGENTS.md §3).
// No importa nada: es un objeto de plugin plano.
//
//   > [!NOTE] / > [!TIP]          → div.notice                    «Nota»
//   > [!IMPORTANT]                → div.notice.notice-important   «Importante»
//   > [!WARNING] / > [!CAUTION]   → div.notice.notice-risk        «Riesgo»
//   > [!PENDING] 006              → div.notice.notice-pending     «Pendiente · ticket 006»
//
// Uso en astro.config:
//   import { satteri } from '@astrojs/markdown-satteri';
//   markdown: { processor: satteri({ hastPlugins: [markdownNotice] }) }

const TYPES = {
  NOTE: ['', 'Nota'],
  TIP: ['', 'Nota'],
  IMPORTANT: ['notice-important', 'Importante'],
  WARNING: ['notice-risk', 'Riesgo'],
  CAUTION: ['notice-risk', 'Riesgo'],
  PENDING: ['notice-pending', 'Pendiente'],
};
const MARKER = /^\s*\[!(\w+)\][ \t]*([^\n]*)\n?/;

const isBlank = (n) => n.type === 'text' && !n.value.trim();

function toNotice(node) {
  const children = [...node.children];
  const firstIndex = children.findIndex((n) => !isBlank(n));
  const first = children[firstIndex];
  if (first?.type !== 'element' || first.tagName !== 'p') return;
  const inline = [...first.children];
  const text = inline[0];
  if (text?.type !== 'text') return;
  const m = text.value.match(MARKER);
  const type = m && TYPES[m[1].toUpperCase()];
  if (!type) return;

  const [modifier, label] = type;
  const ticket = m[2].trim();
  // Lo que queda del primer párrafo tras el marcador sigue siendo cuerpo del aviso.
  const rest = text.value.slice(m[0].length);
  inline[0] = { type: 'text', value: rest };
  while (inline.length && (isBlank(inline[0]) || (inline[0].type === 'element' && inline[0].tagName === 'br'))) inline.shift();
  const body = children.slice(firstIndex + 1);
  if (inline.length) body.unshift({ ...first, children: inline });

  const title = modifier === 'notice-pending' && ticket ? `${label} · ticket ${ticket}` : label;
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['notice', modifier].filter(Boolean) },
    children: [
      { type: 'element', tagName: 'span', properties: { className: ['notice-title'] }, children: [{ type: 'text', value: title }] },
      ...body,
    ],
  };
}

export default {
  name: 'delphos-notice',
  element: { filter: ['blockquote'], visit: (node) => toNotice(node) },
};
