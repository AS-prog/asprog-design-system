/*
  js/library-fold.js — niveles plegables en la barra lateral (css/library.css).
  Se carga justo después de nav.lib-nav (scripts/site.py lo pone dentro de
  <!-- site:nav -->), así que pliega antes de pintar y no hay destello.
  Sin JavaScript todo queda desplegado.

  Cada li de .lib-nav con un ul hijo recibe un button.lib-fold con
  aria-expanded. Empiezan abiertos los niveles que contienen la página actual
  (aria-current="page"); el resto, plegado. Se alterna con la flecha, con una
  etiqueta <span> (como «Solución») o con el enlace de la página actual.
  Pulsar otra página navega con normalidad.
*/
(function () {
  function fold(li) {
    var sub = li.querySelector(':scope > ul');
    if (!sub || li.classList.contains('lib-foldable')) return;
    var head = li.querySelector(':scope > a, :scope > span');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'lib-fold';
    button.setAttribute('aria-label', 'Mostrar u ocultar ' + (head ? head.textContent.trim() : 'nivel'));
    function set(open) {
      li.classList.toggle('is-folded', !open);
      button.setAttribute('aria-expanded', String(open));
    }
    function toggle(event) {
      event.preventDefault();
      set(li.classList.contains('is-folded'));
    }
    li.classList.add('lib-foldable');
    li.insertBefore(button, sub);
    set(!!li.querySelector('[aria-current="page"]'));
    button.addEventListener('click', toggle);
    if (head && (head.tagName === 'SPAN' || head.getAttribute('aria-current') === 'page')) {
      head.style.cursor = 'pointer';
      head.addEventListener('click', toggle);
    }
  }
  function init() { document.querySelectorAll('.lib-nav li').forEach(fold); }
  if (document.querySelector('.lib-nav')) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
