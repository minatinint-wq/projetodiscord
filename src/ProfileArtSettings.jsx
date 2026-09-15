import React, { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { PROFILE_ART_EFFECTS, profileArtVariantCount } from "../profile-art";
import { PROFILE_FRAMES } from "../profile-frames";
import ProfileArtEffect from "./ProfileArtEffect";
import ProfileFrameEffect from "./ProfileFrameEffect";

// APNGs are expensive to decode even when their cards are below the fold.
// Keep each mounted page deliberately small so changing tabs stays instant.
const EFFECT_PAGE_SIZE = 6;
const FRAME_PAGE_SIZE = 8;

function visiblePageItems(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index);
  const indexes = new Set([0, pages - 1, page - 1, page, page + 1]);
  const visible = [...indexes].filter((index) => index >= 0 && index < pages).sort((a, b) => a - b);
  const items = [];
  visible.forEach((index, position) => {
    if (position && index - visible[position - 1] > 1) items.push(`gap-${index}`);
    items.push(index);
  });
  return items;
}

function Pager({ page, pages, setPage, count, label }) {
  if (pages <= 1) return <div className="pager"><span className="pager-count">{count} {label}</span></div>;
  return <div className="pager" role="navigation" aria-label={`Páginas de ${label}`}>
    <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} aria-label="Página anterior">‹</button>
    {visiblePageItems(page, pages).map((item) => typeof item === "number"
      ? <button type="button" key={item} aria-pressed={item === page} className={item === page ? "pager-current" : ""} onClick={() => setPage(item)}>{item + 1}</button>
      : <span className="pager-gap" aria-hidden="true" key={item}>…</span>)}
    <button type="button" disabled={page >= pages - 1} onClick={() => setPage((value) => Math.min(pages - 1, value + 1))} aria-label="Próxima página">›</button>
    <span className="pager-count">{count} {label}</span>
  </div>;
}

export default function ProfileArtSettings({ form, nitro, update }) {
  const [effectQuery, setEffectQuery] = useState("");
  const [effectPage, setEffectPage] = useState(0);
  const [frameQuery, setFrameQuery] = useState("");
  const [framePage, setFramePage] = useState(0);
  const effects = useMemo(() => PROFILE_ART_EFFECTS.filter(([id, label]) => id === "none" || `${id} ${label}`.toLowerCase().includes(effectQuery.toLowerCase())), [effectQuery]);
  const frames = useMemo(() => PROFILE_FRAMES.filter(([id, label]) => id === "none" || `${id} ${label}`.toLowerCase().includes(frameQuery.toLowerCase())), [frameQuery]);
  const effectPages = Math.max(1, Math.ceil(effects.length / EFFECT_PAGE_SIZE));
  const framePages = Math.max(1, Math.ceil(frames.length / FRAME_PAGE_SIZE));
  const safeEffectPage = Math.min(effectPage, effectPages - 1);
  const safeFramePage = Math.min(framePage, framePages - 1);

  return <>
    <section className="settings-card profile-art-settings">
      <h2>Efeitos de perfil</h2>
      <p>A arte APNG cobre banner, avatar e conteúdo, preserva a animação original e respeita os limites do cartão. Efeitos dinâmicos podem sortear outra composição a cada abertura. A escolha requer Nitro, mas todos enxergam o efeito equipado.</p>
      <label className="settings-search"><Search size={18}/><input value={effectQuery} onChange={(event) => { setEffectQuery(event.target.value); setEffectPage(0); }} placeholder={`Buscar entre ${PROFILE_ART_EFFECTS.length - 1} efeitos`}/></label>
      <div className="profile-art-grid">
        {effects.slice(safeEffectPage * EFFECT_PAGE_SIZE, safeEffectPage * EFFECT_PAGE_SIZE + EFFECT_PAGE_SIZE).map(([value, label, , format]) => {
          const locked = value !== "none" && !nitro;
          const selected = (form.profileArtEffect || "none") === value;
          return <button type="button" key={value} disabled={locked} title={locked ? `${label} · Nitro` : label} className={`profile-art-choice ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => !locked && update("profileArtEffect", value)}>
            <span className="profile-art-thumb">{value === "none" ? <span className="profile-art-none">Sem efeito</span> : <ProfileArtEffect effect={value} preview/>}</span>
            <span className="profile-catalog-label">{label}</span>
            {value !== "none" && <small className="asset-format">{format === "apng" ? "APNG" : "PNG"}{profileArtVariantCount(value) > 1 ? ` · ${profileArtVariantCount(value)} VARIAÇÕES` : ""}</small>}
            {locked ? <b className="premium-lock">NITRO</b> : selected && <Check size={14}/>} 
          </button>;
        })}
      </div>
      <Pager page={safeEffectPage} pages={effectPages} setPage={setEffectPage} count={Math.max(0, effects.length - 1)} label="efeitos"/>
    </section>

    <section className="settings-card profile-art-settings">
      <h2>Molduras de perfil</h2>
      <p>Camadas decorativas próprias do cartão de perfil. Elas contornam a arte completa e extrapolam a borda, sem virar moldura de avatar nem placa de identificação.</p>
      <label className="settings-search"><Search size={18}/><input value={frameQuery} onChange={(event) => { setFrameQuery(event.target.value); setFramePage(0); }} placeholder={`Buscar entre ${PROFILE_FRAMES.length - 1} molduras`}/></label>
      <div className="profile-frame-grid">
        {frames.slice(safeFramePage * FRAME_PAGE_SIZE, safeFramePage * FRAME_PAGE_SIZE + FRAME_PAGE_SIZE).map(([value, label]) => {
          const locked = value !== "none" && !nitro;
          const selected = (form.profileFrame || "none") === value;
          return <button type="button" key={value} disabled={locked} title={locked ? `${label} · Nitro` : label} className={`profile-frame-choice ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => !locked && update("profileFrame", value)}>
            <span className="profile-frame-thumb">{value === "none" ? <span className="profile-art-none">Sem moldura</span> : <ProfileFrameEffect frame={value} preview/>}</span>
            <span className="profile-catalog-label">{label}</span>
            <small className="asset-format">PNG EM CAMADAS</small>
            {locked ? <b className="premium-lock">NITRO</b> : selected && <Check size={14}/>} 
          </button>;
        })}
      </div>
      <Pager page={safeFramePage} pages={framePages} setPage={setFramePage} count={Math.max(0, frames.length - 1)} label="molduras"/>
    </section>
  </>;
}
