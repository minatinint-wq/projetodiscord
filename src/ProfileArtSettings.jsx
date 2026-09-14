import React, { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { PROFILE_ART_EFFECTS } from "../profile-art";
import { PROFILE_FRAMES } from "../profile-frames";
import ProfileArtEffect from "./ProfileArtEffect";
import ProfileFrameEffect from "./ProfileFrameEffect";

const PAGE_SIZE = 24;

function Pager({ page, pages, setPage, count, label }) {
  if (pages <= 1) return <div className="pager"><span className="pager-count">{count} {label}</span></div>;
  return <div className="pager" role="navigation" aria-label={`Páginas de ${label}`}>
    <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} aria-label="Página anterior">‹</button>
    {Array.from({ length: pages }, (_, index) => <button type="button" key={index} aria-pressed={index === page} className={index === page ? "pager-current" : ""} onClick={() => setPage(index)}>{index + 1}</button>)}
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
  const effectPages = Math.max(1, Math.ceil(effects.length / PAGE_SIZE));
  const framePages = Math.max(1, Math.ceil(frames.length / PAGE_SIZE));
  const safeEffectPage = Math.min(effectPage, effectPages - 1);
  const safeFramePage = Math.min(framePage, framePages - 1);

  return <>
    <section className="settings-card profile-art-settings">
      <h2>Efeitos de perfil</h2>
      <p>A arte APNG cobre banner, avatar e conteúdo, preserva a animação original e ultrapassa suavemente as bordas do cartão. A escolha requer Nitro, mas todos enxergam o efeito equipado.</p>
      <label className="settings-search"><Search size={18}/><input value={effectQuery} onChange={(event) => { setEffectQuery(event.target.value); setEffectPage(0); }} placeholder={`Buscar entre ${PROFILE_ART_EFFECTS.length - 1} efeitos`}/></label>
      <div className="profile-art-grid">
        {effects.slice(safeEffectPage * PAGE_SIZE, safeEffectPage * PAGE_SIZE + PAGE_SIZE).map(([value, label, , format]) => {
          const locked = value !== "none" && !nitro;
          const selected = (form.profileArtEffect || "none") === value;
          return <button type="button" key={value} disabled={locked} title={locked ? `${label} · Nitro` : label} className={`profile-art-choice ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => !locked && update("profileArtEffect", value)}>
            <span className="profile-art-thumb">{value === "none" ? <span className="profile-art-none">Sem efeito</span> : <ProfileArtEffect effect={value} preview/>}</span>
            <span className="profile-catalog-label">{label}</span>
            {value !== "none" && <small className="asset-format">{format === "apng" ? "APNG" : "PNG"}</small>}
            {locked ? <b className="premium-lock">NITRO</b> : selected && <Check size={14}/>} 
          </button>;
        })}
      </div>
      <Pager page={safeEffectPage} pages={effectPages} setPage={setEffectPage} count={Math.max(0, effects.length - 1)} label="efeitos"/>
    </section>

    <section className="settings-card profile-art-settings">
      <h2>Molduras de perfil</h2>
      <p>Camadas decorativas próprias do cartão de perfil. Elas contornam a arte completa sem virar moldura de avatar nem nameplate.</p>
      <label className="settings-search"><Search size={18}/><input value={frameQuery} onChange={(event) => { setFrameQuery(event.target.value); setFramePage(0); }} placeholder={`Buscar entre ${PROFILE_FRAMES.length - 1} molduras`}/></label>
      <div className="profile-frame-grid">
        {frames.slice(safeFramePage * PAGE_SIZE, safeFramePage * PAGE_SIZE + PAGE_SIZE).map(([value, label]) => {
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
