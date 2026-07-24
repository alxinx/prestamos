-- moras_aplicadas quedó sin ningún lector ni escritor desde que la mora se
-- calcula en vivo por cuota (moraPorCuotaDe, src/lib/calculoMora.js) — el
-- job de mora (mora.worker.js) dejó de escribirla el 2026-07-23, y nada la
-- leyó nunca. Confirmada vacía antes de esta migración. Violaba además
-- CLAUDE.md §4 ("los valores calculados nunca se persisten").
DROP TABLE `moras_aplicadas`;
