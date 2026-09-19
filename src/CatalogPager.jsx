import React from "react";

function compactPages(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index);
  const visible = [...new Set([0, pages - 1, page - 1, page, page + 1])]
    .filter((index) => index >= 0 && index < pages)
    .sort((a, b) => a - b);
  const items = [];
  visible.forEach((index, position) => {
    if (position && index - visible[position - 1] > 1) items.push(`gap-${index}`);
    items.push(index);
  });
  return items;
}

export default function CatalogPager({ page, pages, setPage, count, label }) {
  const go = (next) => setPage(Math.max(0, Math.min(pages - 1, Number(next))));
  return <div className="pager" role="navigation" aria-label={`Páginas de ${label}`}>
    <div className="pager-pages">
      <button type="button" disabled={page === 0} onClick={() => go(0)} aria-label="Primeira página">«</button>
      <button type="button" disabled={page === 0} onClick={() => go(page - 1)} aria-label="Página anterior">‹</button>
      {compactPages(page, pages).map((item) => typeof item === "number" ? <button type="button" key={item} aria-pressed={item === page} className={item === page ? "pager-current" : ""} onClick={() => go(item)}>{item + 1}</button> : <span className="pager-gap" aria-hidden="true" key={item}>…</span>)}
      <button type="button" disabled={page >= pages - 1} onClick={() => go(page + 1)} aria-label="Próxima página">›</button><button type="button" disabled={page >= pages - 1} onClick={() => go(pages - 1)} aria-label="Última página">»</button>
    </div>
    <label className="pager-jump">Ir para<select aria-label={`Ir para página de ${label}`} value={page} onChange={(event) => go(event.target.value)}>{Array.from({ length: pages }, (_, index) => <option value={index} key={index}>{index + 1}</option>)}</select><span>de {pages}</span></label>
    <span className="pager-count">{count} {label}</span>
  </div>;
}
