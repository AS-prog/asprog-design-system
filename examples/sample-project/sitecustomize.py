"""Compatibility shim for markdown-it-py 4.x in the site-md test suite.

markdown-it-py rebinds every render rule to its own renderer, so a rule that is
already a bound method of `Renderer` loses its `self`. Keeping bound methods
intact lets `Renderer` register its rules as methods.
"""
try:
    from markdown_it.main import MarkdownIt
except ImportError:
    MarkdownIt = None


if MarkdownIt is not None:
    _add_render_rule = MarkdownIt.add_render_rule

    def _add_render_rule_keeping_bound_methods(self, name, function, fmt="html"):
        if self.renderer.__output__ == fmt:
            rule = function if hasattr(function, "__self__") else function.__get__(self.renderer)
            self.renderer.rules[name] = rule

    MarkdownIt.add_render_rule = _add_render_rule_keeping_bound_methods
