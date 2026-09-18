import React, { useMemo, useState } from "react";
import { ChevronRight, Gem, Heart, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { AVATAR_FRAMES, PROFILE_EFFECTS, PROFILE_OVERLAYS } from "../cosmetics";
import { NAMEPLATES, nameplateSrc } from "../nameplates";
import { PROFILE_ART_EFFECTS, profileArtSrc } from "../profile-art";
import { PROFILE_FRAMES, profileFrameLayers } from "../profile-frames";
import { BANNER_PRESETS } from "./profilePresentation";

const CATEGORY_LABELS = {
  all: "Tudo",
  avatarFrame: "Molduras de avatar",
  profileEffect: "Efeitos",
  bannerPreset: "Banners",
  profileOverlay: "Sobreposições",
  profilePlate: "Placas",
  profileArtEffect: "Arte de perfil",
  profileFrame: "Molduras de perfil",
};

const priceFor = (id, type) => 180 + (([...`${type}:${id}`].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 9) * 40);
const productsFrom = (items, type, preview) => items
  .filter(([id]) => id !== "none" && id !== "default")
  .map((item, index) => { const [id, name] = item; return { id: `${type}:${id}`, cosmeticId: id, name, type, price: priceFor(id, type), preview: preview?.(id, index, item) }; });

const STORE_PRODUCTS = [
  ...productsFrom(BANNER_PRESETS, "bannerPreset", (_id, _index, item) => item[2]),
  ...productsFrom(PROFILE_OVERLAYS, "profileOverlay", (id) => `/cosmetics-optimized/overlays/${id}.png`),
  ...productsFrom(AVATAR_FRAMES, "avatarFrame"),
  ...productsFrom(PROFILE_EFFECTS, "profileEffect"),
  ...productsFrom(NAMEPLATES, "profilePlate", (id) => nameplateSrc(id)),
  ...productsFrom(PROFILE_ART_EFFECTS, "profileArtEffect", (id) => profileArtSrc(id)),
  ...productsFrom(PROFILE_FRAMES, "profileFrame", (id) => profileFrameLayers(id)[0]?.src),
];

const FEATURED = ["sakura-dawn", "steel-wolf", "infernal-dragon", "gothic-bloom", "lunar-orbit", "holo-circuit"];

function ProductVisual({ product, user, Avatar }) {
  if (product.type === "avatarFrame") return <div className="store-avatar-preview"><Avatar user={{ ...user, avatarFrame: product.cosmeticId, cosmeticStatic: true }}/></div>;
  if (product.type === "profilePlate") return <video src={product.preview} muted loop autoPlay playsInline preload="metadata"/>;
  if (product.type === "bannerPreset") return <div className="store-banner-preview" style={{ background: product.preview }}/>;
  if (product.preview) return <img src={product.preview} alt="" loading="lazy" decoding="async"/>;
  return <div className={`store-effect-preview store-effect-${product.cosmeticId}`}><Sparkles/><span>{product.name}</span></div>;
}

export default function StorePage({ user, Avatar, onClose }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(() => new Set());
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => STORE_PRODUCTS.filter((product) =>
    (category === "all" || product.type === category) &&
    product.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")),
  ), [category, query]);
  const pageSize = 24, pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice(Math.min(page, pages - 1) * pageSize, (Math.min(page, pages - 1) + 1) * pageSize);
  const featured = STORE_PRODUCTS.filter((product) => FEATURED.includes(product.cosmeticId)).slice(0, 6);
  const chooseCategory = (next) => { setCategory(next); setPage(0); };
  const toggleFavorite = (id) => setFavorites((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  return <main className="main-content store-page" aria-label="Loja Sesh">
    <header className="store-nav">
      <button className="store-logo" title="Voltar aos amigos" onClick={onClose}><ShoppingBag size={22}/></button>
      <button className={category === "all" ? "active" : ""} onClick={() => chooseCategory("all")}>Destaques</button>
      <label>Navegar<select value={category} onChange={(event) => chooseCategory(event.target.value)}>{Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <span className="store-nav-spacer"/>
      <label className="store-search"><Search size={17}/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Buscar na loja"/></label>
      <button className="store-favorite-count" aria-label="Favoritos"><Heart size={18}/><span>{favorites.size}</span></button>
      <span className="store-wallet"><Gem size={17}/>0</span>
    </header>
    <div className="store-scroll">
      {category === "all" && !query && <>
        <section className="store-hero">
          <div><span className="eyebrow">COLEÇÃO EM DESTAQUE</span><h1>Aurora Arcana</h1><p>Personalize cada canto do seu perfil com brilho, movimento e identidade.</p><button onClick={() => chooseCategory("profileOverlay")}>Explorar coleção <ChevronRight size={18}/></button></div>
        </section>
        <section className="store-section"><div className="store-section-title"><div><span>ESCOLHAS DO SESH</span><h2>Destaques da semana</h2></div><button onClick={() => chooseCategory("all")}>Ver catálogo</button></div><div className="store-feature-grid">{featured.map((product) => <StoreProductCard key={product.id} {...{ product, user, Avatar, favorites, toggleFavorite, setSelected }}/>)}</div></section>
      </>}
      <section className="store-section store-catalog"><div className="store-section-title"><div><span>{category === "all" ? "CATÁLOGO COMPLETO" : "CATEGORIA"}</span><h2>{CATEGORY_LABELS[category]} <small>{filtered.length} itens</small></h2></div></div>
        {shown.length ? <div className="store-product-grid">{shown.map((product) => <StoreProductCard key={product.id} {...{ product, user, Avatar, favorites, toggleFavorite, setSelected }}/>)}</div> : <div className="store-empty">Nenhum item encontrado para essa busca.</div>}
        {pages > 1 && <div className="store-pager"><button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Anterior</button><span>Página {Math.min(page, pages - 1) + 1} de {pages}</span><button disabled={page >= pages - 1} onClick={() => setPage((value) => Math.min(pages - 1, value + 1))}>Próxima</button></div>}
      </section>
    </div>
    {notice && <button className="store-notice" onClick={() => setNotice("")}>{notice}</button>}
    {selected && <div className="store-modal-backdrop" onClick={(event) => event.target === event.currentTarget && setSelected(null)}><section className="store-modal" role="dialog" aria-modal="true" aria-label={selected.name}><button className="store-modal-close" aria-label="Fechar" onClick={() => setSelected(null)}><X/></button><div className="store-modal-preview"><ProductVisual product={selected} user={user} Avatar={Avatar}/></div><span>{CATEGORY_LABELS[selected.type]}</span><h2>{selected.name}</h2><p>A prévia já está funcionando. A compra e o inventário serão conectados quando o gateway da loja for ativado.</p><strong><Gem size={18}/>{selected.price} Orbs</strong><button className="store-buy" onClick={() => setNotice("Compra em demonstração: nenhum valor foi cobrado.")}>Comprar em breve</button></section></div>}
  </main>;
}

function StoreProductCard({ product, user, Avatar, favorites, toggleFavorite, setSelected }) {
  const favorite = favorites.has(product.id);
  return <article className="store-product-card"><button className={`store-heart ${favorite ? "active" : ""}`} aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={() => toggleFavorite(product.id)}><Heart size={17} fill={favorite ? "currentColor" : "none"}/></button><button className="store-product-main" onClick={() => setSelected(product)}><div className="store-product-art"><ProductVisual product={product} user={user} Avatar={Avatar}/></div><span>{CATEGORY_LABELS[product.type]}</span><h3>{product.name}</h3><strong><Gem size={15}/>{product.price} Orbs</strong></button></article>;
}
