#!/usr/bin/env node
// Genera tokens.css desde tokens.json. Uso: node scripts/build-tokens.mjs
import { writeFileSync } from 'node:fs';
import { loadTokens, buildCss } from './tokens-lib.mjs';
const out = new URL('../system/tokens.css', import.meta.url);
writeFileSync(out, buildCss(loadTokens()));
console.log('tokens.css generado');
