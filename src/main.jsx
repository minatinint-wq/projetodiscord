/* @refresh reset */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { GAME_CATALOG } from "../game-catalog.js";
import { nameplateSrc } from "../nameplates.js";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Camera,
  Check,
  Copy,
  Crown,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Flag,
  Forward,
  Hash,
  Headphones,
  HelpCircle,
  Lock,
  Link,
  LogOut,
  Maximize2,
  Megaphone,
  Menu,
  MessageSquare,
  MessagesSquare,
  Mic,
  MicOff,
  MonitorUp,
  MoreVertical,
  Paperclip,
  Pencil,
  PhoneOff,
  Pin,
  Plus,
  Radio,
  Reply,
  Search,
  Send,
  Settings,
  Smile,
  Trash2,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { api, connectSocket } from "./api";
import SettingsHub from "./SettingsHub";
import ProfileEditor, { StyledName, GameIcon } from "./ProfileEditor";
import ProfileDialog from "./ProfileDialog";
import ProfileCard from "./ProfileCard";
import AttachmentView from "./AttachmentView";
import {readAttachment} from "./files";
import useFileDrop from "./useFileDrop";
import PremiumAvatarFrame from "./PremiumAvatarFrame";
import { PREMIUM_FRAME_ART } from "./premiumCosmetics";
import { updateVoiceActivity } from "./voiceActivity";
import AtmosphericEffect from "./AtmosphericEffect";

import DirectMessages from "./DirectMessages";
import EmojiPicker from "./EmojiPicker";
import EmojiText from "./EmojiText";
import { microphone, mediaError } from "./media";
import "./styles.css";
import "./refinement.css";
import "./profile.css";

const EmojiArtwork = React.lazy(() => import("./EmojiArtwork"));

function LibraryEmoji({ emoji, size = 20 }) {
  return (
    <React.Suspense fallback={<span className="emoji-artwork-fallback" aria-hidden="true">{emoji}</span>}>
      <EmojiArtwork emoji={emoji} size={size} />
    </React.Suspense>
  );
}

const colors = ["purple", "orange", "green", "blue"];
const PROFILE_NAME_COLORS = [
  "#f1f3f5",
  "#202020",
  "#20d9a0",
  "#20e06c",
  "#258fda",
  "#b834ee",
  "#f0448f",
  "#d9ad20",
  "#f0442e",
];
const ROLE_PERMISSION_GROUPS = [
  { title: "Administração", permissions: [
    ["manageChannels", "Gerenciar canais", "Criar, editar e excluir canais."],
    ["manageRoles", "Gerenciar cargos", "Criar e editar cargos inferiores, sem conceder permissões que você não possui."],
    ["manageServer", "Gerenciar servidor", "Editar nome, ícone, banner, tag e convite."],
    ["manageMembers", "Moderar membros", "Silenciar chat ou remover da voz membros com cargo inferior."],
  ]},
  { title: "Chat", permissions: [
    ["sendMessages", "Enviar mensagens", "Conversar nos canais do servidor."],
    ["attachFiles", "Anexar imagens", "Enviar PNG, JPEG, WebP e GIF no chat."],
    ["mentionEveryone", "Mencionar grupos", "Notificar @everyone, @here e cargos."],
  ]},
  { title: "Voz e vídeo", permissions: [
    ["connectVoice", "Conectar à voz", "Entrar em chamadas do servidor."],
    ["useCamera", "Usar câmera", "Ligar a câmera durante chamadas."],
    ["shareScreen", "Compartilhar tela", "Transmitir uma janela ou tela."],
  ]},
];
const DEFAULT_CUSTOM_ROLE_PERMISSIONS = {
  viewChannels: true, createInvite: true, changeNickname: true,
  sendMessages: true, sendMessagesThreads: true, createPublicThreads: true,
  embedLinks: true, attachFiles: true, addReactions: true,
  useExternalEmojis: true, useExternalStickers: true, connectVoice: true,
  speakVoice: true, useCamera: true, shareScreen: true, useVoiceActivity: true,
};
const BADGES = {
  criador: { label: "Criador Sesh", image: "/badges/creator.svg" },
  fundador: { label: "Fundador", image: "/badges/founder.svg" },
  rara: { label: "Insígnia Rara", image: "/badges/rare.png" },
  apoiador_inicial: {
    label: "Apoiador inicial · primeiros 100",
    image: "/badges/early-supporter.png",
  },
  nitro_classic: {
    label: "Nitro Classic",
    image: "/badges/nitro-classic.png",
  },
  verificado: { label: "Perfil verificado", image: "/badges/verified.svg" },
  moderador: { label: "Moderador", image: "/badges/moderator.svg" },
  desenvolvedor: { label: "Desenvolvedor", image: "/badges/developer.svg" },
  cacador_bugs: { label: "Caçador de bugs", image: "/badges/bug-hunter.svg" },
  artista: { label: "Artista da comunidade", image: "/badges/artist.svg" },
  streamer: { label: "Streamer", image: "/badges/streamer.svg" },
  apoiador: { label: "Apoiador", image: "/badges/supporter.png" },
  mes_12: { label: "12 meses", image: "/badges/membership-12-months.png" },
  mes_9: { label: "9 meses", image: "/badges/membership-9-months.png" },
  mes_6: { label: "6 meses", image: "/badges/membership-6-months.png" },
  mes_3: { label: "3 meses", image: "/badges/membership-3-months.png" },
  mes_1: { label: "1 mês", image: "/badges/membership-1-month.png" },
};
function BadgeIcon({ badge, className = "" }) {
  return (
    <span
      className={`badge-tooltip ${className}`}
      data-label={badge.label}
      aria-label={badge.label}
      tabIndex="0"
    >
      <img src={badge.image} alt="" />
    </span>
  );
}
function ProfileEffectLayer({ effect }) {
  if (!effect || effect === "none") return null;
  if (["embers","smoke","flames","blue_fire","ash"].includes(effect))
    return <AtmosphericEffect type={effect}/>;
  return (
    <span
      className={`profile-effect-layer profile-effect-${effect}`}
      aria-hidden="true"
    >
      {Array.from({ length: 14 }, (_, index) => (
        <i
          key={index}
          style={{
            "--effect-x": `${(index * 37) % 96}%`,
            "--effect-delay": `${-(index % 7) * 0.42}s`,
            "--effect-size": `${3 + (index % 4) * 2}px`,
          }}
        />
      ))}
    </span>
  );
}
function VoiceMediaIndicators({ camera, screen, muted, deafened }) {
  if (!camera && !screen && !muted && !deafened) return null;
  return (
    <span className="voice-media-indicators">
      {muted && (
        <span className="voice-media-muted" title="Microfone silenciado" aria-label="Microfone silenciado">
          <MicOff size={12} />
        </span>
      )}
      {deafened && (
        <span className="voice-media-deafened" title="Áudio desativado" aria-label="Áudio desativado">
          <VolumeX size={12} />
        </span>
      )}
      {camera && (
        <span className="voice-media-camera" title="Câmera ligada">
          <Camera size={12} />
        </span>
      )}
      {screen && (
        <span className="voice-media-live" title="Transmitindo ao vivo">
          <Radio size={10} /> AO VIVO
        </span>
      )}
    </span>
  );
}
function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}
function Avatar({ user, color = "purple", small = false, onClick }) {
  const value = initials(user?.displayName || user?.username || "?");
  const requestedFrame = user?.avatarFrame || "none";
  const frame = requestedFrame === "none" || PREMIUM_FRAME_ART[requestedFrame] ? requestedFrame : "none";
  const core = user?.avatar ? (
    <img className={`avatar avatar-img avatar-frame-${frame} ${small ? "avatar-small" : ""}`} src={user.avatar} alt="" />
  ) : (
    <div className={`avatar avatar-${color} avatar-frame-${frame} ${small ? "avatar-small" : ""}`}>{value}</div>
  );
  if (!PREMIUM_FRAME_ART[frame]) return React.cloneElement(core, { onClick });
  return <span className={`premium-avatar-shell ${small ? "premium-avatar-shell-small" : ""}`} onClick={onClick}>
    {core}<PremiumAvatarFrame frame={frame} animated={!small&&!user?.cosmeticStatic}/>
  </span>;
}

function MessageContent({ content, members, onProfile }) {
  const emojiOnly = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\s)+$/u.test(content) && /\p{Extended_Pictographic}/u.test(content) && [...content].length < 40;
  const fragments = String(content || "").split(/(@[a-zA-Z0-9_.-]+)/g);
  return (
    <p className={emojiOnly ? "emoji-message" : ""}>
      {fragments.map((fragment, index) => {
        const member = fragment.startsWith("@")
          ? members.find((item) => item.username.toLowerCase() === fragment.slice(1).toLowerCase())
          : null;
        return member ? (
          <button
            type="button"
            className="message-mention"
            key={`${member.id}-${index}`}
            onClick={(event) => onProfile(event, member.id)}
          >
            @{member.displayName}
          </button>
        ) : <React.Fragment key={index}><EmojiText text={fragment} /></React.Fragment>;
      })}
    </p>
  );
}
function MentionSuggestions({ candidates, onChoose }) {
  if (!candidates.length) return null;
  return (
    <div className="mention-suggestions" role="listbox" aria-label="Mencionar">
      {candidates.map((candidate) => (
        <button
          type="button"
          className="mention-suggestion"
          key={candidate.id}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChoose(candidate)}
        >
          {candidate.kind === "member" ? (
            <Avatar user={candidate} color={candidate.avatarColor || "purple"} small />
          ) : <i className="mention-symbol">@</i>}
          <span><strong>{candidate.displayName}</strong><small>{candidate.detail}</small></span>
        </button>
      ))}
    </div>
  );
}
function MediaStreamVideo({ stream, muted = false, className = "" }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream)
      videoRef.current.srcObject = stream || null;
  }, [stream]);
  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted={muted}
    />
  );
}
function BadgeContextMenu({ menu, onAdd, onModerate, onAssignRole, onManageRoles, onAddFriend, onCopyHandle, onMention, onToggleMute, onToggleDeafen, onEditServerProfile, onModerator }) {
  const isSelf = menu.user.id === menu.currentUserId;
  const element = useRef(null);
  const [position, setPosition] = useState({left: menu.x, top: menu.y});
  useEffect(() => {
    const place = () => { const rect = element.current?.getBoundingClientRect(); if(rect) setPosition({
      left: Math.max(8, Math.min(menu.x, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(menu.y, window.innerHeight - rect.height - 8))
    }); };
    place(); window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [menu]);
  return (
    <div
      className={"context-menu badge-context-menu " + (menu.voiceContext ? "voice-context-menu" : "")}
      ref={element}
      aria-label="Ações do membro"
      style={position}
      onClick={(event) => event.stopPropagation()}
    >
      <button className="context-item" onClick={() => menu.onProfile?.()}>Perfil</button>
      {menu.voiceContext ? <>
        {!isSelf && <button className="context-item context-strong" onClick={onMention}>Mencionar</button>}
        <div className="context-sep" />
        <button className="context-item context-strong" onClick={onToggleMute}>
          Silenciar <span className={"context-check " + (menu.locallyMuted ? "checked" : "")}>{menu.locallyMuted ? "✓" : ""}</span>
        </button>
        <button className={"context-item context-strong " + (!onToggleDeafen ? "disabled" : "")} disabled={!onToggleDeafen} onClick={onToggleDeafen}>
          Desativar áudio <span className={"context-check " + (menu.deafened ? "checked" : "")}>{menu.deafened ? "✓" : ""}</span>
        </button>
        {onEditServerProfile && <button className="context-item context-strong" onClick={onEditServerProfile}>Editar perfil por servidor</button>}
        <button className="context-item context-strong disabled" disabled>Apps <span className="context-arrow">›</span></button>
        <div className="context-sep" />
        {onAssignRole && menu.assignableRoles?.length > 0 ? <label className="context-role-picker voice-role-picker">
          <span>Cargos</span>
          <select value={menu.user.roleId || "member"} onChange={(event) => onAssignRole(event.target.value)}>
            {menu.assignableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </label> : <button className="context-item context-strong disabled" disabled>Cargos <span className="context-arrow">›</span></button>}
        <button className="context-item context-strong disabled" disabled>Mover para <span className="context-arrow">›</span></button>
        {onModerator && <><div className="context-sep" /><button className="context-item context-strong" onClick={onModerator}>Abrir na visualização de moderador</button></>}
        {onModerate && !isSelf && <>
          <button className="context-item context-danger" onClick={() => onModerate({ voiceMuted: !menu.user.voiceMuted })}>
            {menu.user.voiceMuted ? "Ativar voz no servidor" : "Silenciar voz no servidor"} <span className={"context-check " + (menu.user.voiceMuted ? "checked" : "")}>{menu.user.voiceMuted ? "✓" : ""}</span>
          </button>
          <button className="context-item context-danger disabled" disabled>Desativar áudio no servidor <span className="context-check" /></button>
        </>}
        <div className="context-sep" />
        <button className="context-item" onClick={onCopyHandle}>Copiar ID do usuário</button>
      </> : <>
        <button className="context-item" onClick={onCopyHandle}>Copiar ID do usuário</button>
        {!isSelf && <button className="context-item" onClick={onAddFriend}>Adicionar amigo</button>}
        {isSelf && onManageRoles && <><div className="context-sep" /><button className="context-item" onClick={onManageRoles}>Gerenciar cargos do servidor</button></>}
        {(onModerate || onAssignRole || onAdd) && <div className="context-sep" />}
        {onAssignRole && menu.assignableRoles?.length > 0 && <label className="context-role-picker"><span>Definir cargo</span><select value={menu.user.roleId || "member"} onChange={(event) => onAssignRole(event.target.value)}>{menu.assignableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>}
        {onModerate && !isSelf && <><button className="context-item" onClick={() => onModerate({ textMuted: !menu.user.textMuted })}>{menu.user.textMuted ? "Permitir chat" : "Silenciar chat no servidor"}</button><button className="context-item context-danger" onClick={() => onModerate({ voiceMuted: !menu.user.voiceMuted })}>{menu.user.voiceMuted ? "Permitir voz" : "Silenciar voz no servidor"}</button></>}
        {onAdd && <button className="context-item" onClick={onAdd}>Adicionar insígnias</button>}
      </>}
    </div>
  );
}
function BadgeEditor({ user, badges, onCancel, onSave }) {
  const [selected, setSelected] = useState(badges);
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section
        className="prompt-dialog badge-editor"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Insígnias de {user.username}</h3>
        <p className="badge-editor-help">
          Marque as insígnias que devem aparecer neste perfil.
        </p>
        <div className="badge-editor-list">
          {Object.entries(BADGES).map(([key, badge]) => (
            <label className="setting-check" key={key}>
              <input
                type="checkbox"
                checked={selected.includes(key)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, key]
                      : current.filter((item) => item !== key),
                  )
                }
              />
              <img
                className="badge-picker-img"
                src={badge.image}
                alt={badge.label}
              />{" "}
              {badge.label}
            </label>
          ))}
        </div>
        <div className="prompt-actions">
          <button className="prompt-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="prompt-confirm" onClick={() => onSave(selected)}>
            Salvar insígnias
          </button>
        </div>
      </section>
    </div>
  );
}
function ProfileChoiceModal({ title, options, selected, onSelect, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="choice-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>{title}</h2>
        <div className="choice-grid">
          {options.map((option) => (
            <button
              className={selected === option.value ? "choice-selected" : ""}
              key={option.value}
              onClick={() => onSelect(option.value)}
            >
              {option.image ? (
                <img src={option.image} alt="" />
              ) : (
                <span className={`choice-swatch ${option.value}`} />
              )}
              {option.label}
            </button>
          ))}
        </div>
        <div className="prompt-actions">
          <button className="prompt-confirm" onClick={onClose}>
            Aplicar
          </button>
        </div>
      </section>
    </div>
  );
}
function FontStyleModal({ current, onClose, onApply }) {
  const [font, setFont] = useState(current || "default");
  const [effect, setEffect] = useState("solid");
  const [color, setColor] = useState("#f1f3f5");
  const fonts = [
    ["default", "Gg"],
    ["serif", "Gg"],
    ["rounded", "Gg"],
    ["bubble", "Gg"],
    ["pixel", "Gg"],
    ["block", "Gg"],
    ["mono", "Gg"],
    ["gothic", "Gg"],
    ["script", "Gg"],
    ["display", "Gg"],
    ["blackletter", "Gg"],
    ["handwritten", "Gg"],
  ];
  const colors = [
    "#f1f3f5",
    "#202020",
    "#20d9a0",
    "#20e06c",
    "#258fda",
    "#b834ee",
    "#f2266f",
    "#d9ad20",
    "#f0442e",
  ];
  return (
    <div className="modal-backdrop font-modal-backdrop" onClick={onClose}>
      <section
        className="font-style-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>Alterar estilo do nome exibido</h2>
        <h3>Escolha fonte</h3>
        <div className="font-grid">
          {fonts.map(([value, label]) => (
            <button
              key={value}
              className={`font-option font-${value} ${font === value ? "choice-selected" : ""}`}
              onClick={() => setFont(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <h3>Escolha efeito</h3>
        <div className="font-effects">
          {[
            "solid",
            "gradient",
            "neon",
            "desenho",
            "pop",
            "gummy",
            "prism",
          ].map((value) => (
            <button
              key={value}
              className={effect === value ? "choice-selected" : ""}
              onClick={() => setEffect(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <h3>Escolha cor</h3>
        <div className="font-colors">
          {colors.map((value) => (
            <button
              key={value}
              className={color === value ? "choice-selected" : ""}
              style={{ background: value }}
              onClick={() => setColor(value)}
            />
          ))}
        </div>
        <div className="prompt-actions">
          <button className="prompt-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="prompt-confirm"
            onClick={() => onApply({ font, effect, color })}
          >
            Aplicar
          </button>
        </div>
      </section>
    </div>
  );
}
function WorkingFontStyleModal({ user, onClose, onApply }) {
  const [font, setFont] = useState(
    localStorage.getItem("sesh_name_style") || user.nameStyle || "default",
  );
  const [effect, setEffect] = useState(
    localStorage.getItem("sesh_name_effect") || user.nameEffect || "solid",
  );
  const [color, setColor] = useState(
    localStorage.getItem("sesh_name_color") || user.nameColor || "#f1f3f5",
  );
  const fonts = [
    "default",
    "serif",
    "rounded",
    "bubble",
    "pixel",
    "block",
    "mono",
    "gothic",
    "script",
    "display",
    "blackletter",
    "handwritten",
  ];
  const effects = [
    "solid",
    "gradient",
    "neon",
    "desenho",
    "pop",
    "gummy",
    "rgb",
    "rainbow",
    "pink_pulse",
    "blue_gradient",
    "aurora",
    "holographic",
    "glitch",
    "fire",
    "ice",
    "starlight",
    "prism",
  ];
  const colors = PROFILE_NAME_COLORS;
  return (
    <div className="modal-backdrop font-modal-backdrop" onClick={onClose}>
      <section
        className="font-style-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>Alterar estilo do nome exibido</h2>
        <div className={`font-live-preview font-${font}`} style={{ color }}>
          Sesh
        </div>
        <h3>Escolha fonte</h3>
        <div className="font-grid">
          {fonts.map((value) => (
            <button
              key={value}
              className={`font-option font-${value} ${font === value ? "choice-selected" : ""}`}
              onClick={() => setFont(value)}
            >
              Gg
            </button>
          ))}
        </div>
        <h3>Escolha efeito</h3>
        <div className="font-effects">
          {effects.map((value) => (
            <button
              key={value}
              className={effect === value ? "choice-selected" : ""}
              onClick={() => setEffect(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <h3>Escolha cor</h3>
        <div className="font-colors">
          {colors.map((value) => (
            <button
              key={value}
              className={color === value ? "choice-selected" : ""}
              style={{ background: value }}
              onClick={() => setColor(value)}
            />
          ))}
        </div>
        <div className="prompt-actions">
          <button className="prompt-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="prompt-confirm"
            onClick={() => onApply({ font, effect, color })}
          >
            Aplicar
          </button>
        </div>
      </section>
    </div>
  );
}
function CanvasChoiceModal({ title, kind, current, onClose, onApply, catalogItems = [] }) {
  const [selected, setSelected] = useState(current || "default");
  const canvasRef = useRef(null);
  const catalogOptions = (base, catalogType) => [
    ...base,
    ...catalogItems
      .filter((item) => item.type === catalogType && item.active !== false)
      .map((item) => [item.value, item.name])
      .filter(([value]) => !base.some(([baseValue]) => baseValue === value)),
  ];
  const options =
    kind === "name"
      ? [
          ["default", "Padrão"],
          ["serif", "Serifado"],
          ["pixel", "Pixel"],
          ["gothic", "Gótico"],
        ]
      : kind === "plate"
        ? [
            ["default", "Padrão"],
            ["stars", "Estrelas"],
            ["waves", "Ondas"],
            ["neon", "Neon"],
          ]
        : kind === "effect"
          ? catalogOptions([
              ["none", "Nenhum"],
              ["sparkles", "Brilhos"],
              ["glow", "Brilho"],
              ["embers", "Faíscas"],
              ["aurora", "Aurora"],
              ["confetti", "Confete"],
              ["hearts", "Corações"],
              ["cosmic", "Cósmico"],
              ["lightning", "Raio"],
            ], "effect")
          : kind === "frame"
            ? catalogOptions([
                ["none", "Sem moldura"],
                ["ruby", "Rubi"],
                ["gold", "Dourada"],
                ["neon", "Neon"],
                ["ice", "Cristal"],
                ["rainbow", "RGB"],
                ["sakura", "Sakura"],
                ["galaxy", "Galáxia"],
                ["inferno", "Inferno"],
                ["ocean", "Oceano"],
                ["cyber", "Cyber"],
              ], "frame")
            : [
                ["default", "Padrão"],
                ["purple", "Roxo"],
                ["red", "Vermelho"],
                ["green", "Verde"],
                ["blue", "Azul"],
              ];
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const colors = {
      default: "#252a34",
      purple: "#6954e8",
      red: "#c82e45",
      green: "#249b6c",
      blue: "#287bc7",
      stars: "#4a397f",
      waves: "#245d7e",
      neon: "#361c62",
      sparkles: "#4b367b",
      glow: "#2b5f87",
      embers: "#71351f",
      none: "#252a34",
    };
    let frame = 0;
    let raf;
    const draw = () => {
      ctx.fillStyle = colors[selected] || "#252a34";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.35;
      for (let index = 0; index < 18; index += 1) {
        ctx.fillStyle = index % 2 ? "#fff" : "#ff5577";
        ctx.beginPath();
        ctx.arc(
          (index * 47 + frame) % canvas.width,
          (index * 29) % canvas.height,
          kind === "plate" ? 4 : 8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.font = "700 22px sans-serif";
      ctx.fillText(
        kind === "name"
          ? "Sesh"
          : kind === "plate"
            ? "Placa de identificação"
            : kind === "effect"
              ? "Efeito de perfil"
              : "Tema e faixa",
        18,
        48,
      );
      frame = (frame + 0.4) % canvas.width;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [selected, kind]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="canvas-choice-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>{title}</h2>
        <canvas
          ref={canvasRef}
          width="520"
          height="130"
          className="customization-canvas"
        />{" "}
        <div className="canvas-choice-grid">
          {options.map(([value, label]) => (
            <button
              key={value}
              className={selected === value ? "choice-selected" : ""}
              onClick={() => setSelected(value)}
            >
              <span className={`choice-swatch ${value}`} />
              {label}
            </button>
          ))}
        </div>
        <div className="prompt-actions">
          <button className="prompt-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="prompt-confirm" onClick={() => onApply(selected)}>
            Aplicar
          </button>
        </div>
      </section>
    </div>
  );
}
function VoiceSettingsPanel(props) {
  return <SettingsHub {...props} Avatar={Avatar} />;
}
function RoleConfigPanel({ role, members, ownerId, canAssignOwner, onUpdate, onAssignMember, onSave, saving, onClose }) {
  const [tab, setTab] = useState("display");
  const [query, setQuery] = useState("");
  const [imageError, setImageError] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarInputRef = useRef(null);
  const permissions = ROLE_PERMISSION_GROUPS.map((group) => ({
    ...group,
    permissions: group.permissions.filter(([key, label]) =>
      `${key} ${label}`.toLowerCase().includes(query.toLowerCase()),
    ),
  })).filter((group) => group.permissions.length);
  const roleMembers = members.filter((member) => member.roleId === role.id);
  function chooseRoleIcon(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setImageError("Escolha uma imagem PNG, JPG, GIF ou WebP.");
    if (file.size > 250 * 1024) return setImageError("A imagem do cargo precisa ter no máximo 250 KB.");
    const reader = new FileReader();
    reader.onerror = () => setImageError("Não foi possível ler essa imagem.");
    reader.onload = () => { setImageError(""); onUpdate(role.id, { icon: String(reader.result) }); };
    reader.readAsDataURL(file);
  }
  return (
    <div className="role-config-backdrop" onClick={onClose}>
      <section className="role-config-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <div><span>EDITAR CARGO</span><h2>{role.name || "Novo cargo"}</h2></div>
          <button type="button" className="role-config-close" onClick={onClose}><X size={22} /></button>
        </header>
        <nav className="role-config-tabs">
          <button type="button" className={tab === "display" ? "active" : ""} onClick={() => setTab("display")}>Exibição</button>
          <button type="button" className={tab === "permissions" ? "active" : ""} onClick={() => setTab("permissions")}>Permissões</button>
          <button type="button" className={tab === "links" ? "active" : ""} onClick={() => setTab("links")}>Links</button>
          <button type="button" className={tab === "members" ? "active" : ""} onClick={() => setTab("members")}>Gerenciar membros ({roleMembers.length})</button>
        </nav>
        {tab === "display" && (
          <section className="role-display-settings">
            <div className={"role-style-sample role-style-" + (role.style || "solid")} style={{ "--member-role-color": role.color }}>
              {role.icon ? <img src={role.icon} alt="" /> : role.emoji ? <span className="role-emoji" aria-hidden="true">{role.emoji}</span> : <i />}
              <span><strong className="role-effect-text">{role.name || "Novo cargo"}</strong><small>Prévia do efeito aplicado ao cargo</small></span>
            </div>
            <label>Nome do cargo<input value={role.name} maxLength={40} onChange={(event) => onUpdate(role.id, { name: event.target.value })} /></label>
            <label>Cor do cargo<input type="color" value={role.color} onChange={(event) => onUpdate(role.id, { color: event.target.value })} /></label>
            <label>Estilo<select aria-label="Efeito do cargo" value={role.style || "solid"} onChange={(event) => onUpdate(role.id, { style: event.target.value })}><option value="solid">Sólido</option><option value="glow">Brilho suave</option><option value="pulse">Pulso de luz</option><option value="dark_wave">Pulso escuro</option><option value="rgb">Rainbow RGB</option><option value="gradient">Gradiente vivo</option><option value="shimmer">Reflexo metálico</option><option value="neon">Neon</option><option value="electric">Elétrico</option><option value="blink">Piscar</option></select></label>
            <label className="role-emoji-field">Emoji do cargo<span><input value={role.emoji || ""} maxLength={32} placeholder="✨" aria-label="Emoji do cargo" onChange={(event) => onUpdate(role.id, { emoji: event.target.value })}/><EmojiPicker onSelect={(emoji) => onUpdate(role.id, { emoji })}/>{role.emoji && <button type="button" onClick={() => onUpdate(role.id, { emoji: "" })}>Limpar</button>}</span><small>Escolha no painel ou cole um único emoji.</small></label>
            <div className="role-icon-upload"><div className="role-icon-preview" style={{ "--role-preview-color": role.color }}>{role.icon ? <img src={role.icon} alt="" /> : role.emoji ? <span className="role-emoji" aria-hidden="true">{role.emoji}</span> : <i />}</div><div><strong>Ícone do cargo</strong><small>Envie uma imagem de até 250 KB para identificar este cargo.</small><div><label className="role-icon-button">Escolher imagem<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={chooseRoleIcon} /></label>{role.icon && <button type="button" onClick={() => onUpdate(role.id, { icon: null })}>Remover</button>}</div>{imageError && <em>{imageError}</em>}</div></div>
            <label className="role-hoist-setting"><span><strong>Separar membros deste cargo</strong><small>Mostra este cargo como uma seção própria na lateral, seguindo a ordem da lista.</small></span><input type="checkbox" checked={Boolean(role.hoist)} onChange={(event) => onUpdate(role.id, { hoist: event.target.checked })} /></label>
          </section>
        )}
        {tab === "permissions" && (
          <section className="role-config-permissions">
            <div className="role-permission-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar permissões" /></div>
            {permissions.map((group) => <section className="role-permission-group" key={group.title}><h3>{group.title}</h3>{group.permissions.map(([permission, label, description]) => <label className="role-permission-toggle" key={permission}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={Boolean(role.permissions?.[permission])} onChange={(event) => onUpdate(role.id, { permissions: { ...role.permissions, [permission]: event.target.checked } })} /></label>)}</section>)}
          </section>
        )}
        {tab === "links" && <section className="role-empty-tab"><h3>Links do cargo</h3><p>Este cargo ainda não possui links vinculados.</p></section>}
        {tab === "members" && <section className="role-member-manager"><div className="role-member-manager-head"><p>Escolha quem terá este cargo. O cargo exibido do dono pode mudar sem remover sua autoridade.</p><strong>{roleMembers.length} membro{roleMembers.length === 1 ? "" : "s"}</strong></div>{members.map((member) => <label key={member.id} className="role-member-row" data-member-id={member.id}><span><Avatar user={member} color={member.avatarColor || "purple"} small /><strong>{member.displayName}</strong><small>@{member.username}{member.id === ownerId ? " • dono" : ""}</small></span><input type="checkbox" disabled={member.id === ownerId && !canAssignOwner} checked={member.roleId === role.id} onChange={(event) => onAssignMember(member.id, event.target.checked ? role.id : "member")} /></label>)}</section>}
        <footer className="role-config-actions"><button type="button" onClick={onClose}>Fechar</button><button type="button" className="prompt-confirm" disabled={saving} onClick={async () => { const saved = await onSave(); if (saved) onClose(); }}>{saving ? "Salvando..." : "Salvar cargo"}</button></footer>
      </section>
    </div>
  );
}
function ServerSettingsPanel({ server, members = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: server.name || "", tag: server.tag || "", icon: server.icon || null,
    banner: server.banner || null, accentColor: server.accentColor || "#c93642", roles: server.roles || [],
    memberRoles: Object.fromEntries(members.map((member) => [member.id, member.roleId || "member"])),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rolesSaved, setRolesSaved] = useState(false);
  const [roleEditorId, setRoleEditorId] = useState(null);
  const [roleDrag, setRoleDrag] = useState({ roleId: "", overId: "", side: "" });
  const canEditOverview = server.role === "owner" || server.permissions?.manageServer;
  const canEditRoles = server.role === "owner" || server.permissions?.manageRoles;
  const canEditRole = role => canEditRoles && (server.role === "owner" || (role.id !== "member" && role.position > server.actorPosition));
  const [settingsSection, setSettingsSection] = useState(canEditOverview ? "overview" : "roles");
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      if (roleEditorId) setRoleEditorId(null);
      else onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, roleEditorId]);
  function addRole() {
    const roleId = `role_${crypto.randomUUID()}`;
    setRolesSaved(false); setSettingsSection("roles");
    setForm((current) => ({ ...current, roles: [...current.roles, { id: roleId, name: "Novo cargo", color: "#c93642", style: "solid", emoji: "", icon: null, permissions: Object.fromEntries(Object.entries(DEFAULT_CUSTOM_ROLE_PERMISSIONS).map(([key, value]) => [key, value && (server.role === "owner" || Boolean(server.permissions?.[key]))])) }] }));
    setRoleEditorId(roleId);
  }
  function updateRole(roleId, patch) {
    setForm((current) => ({ ...current, roles: current.roles.map((role) => role.id === roleId ? { ...role, ...patch } : role) }));
  }
  function assignRoleMember(userId, roleId) {
    setForm((current) => ({ ...current, memberRoles: { ...current.memberRoles, [userId]: roleId } }));
  }
  function reorderRole(draggedId, targetId, side = "before") {
    setForm((current) => {
      const custom = current.roles.filter((role) => !["owner", "member"].includes(role.id));
      const from = custom.findIndex((role) => role.id === draggedId);
      const target = custom.findIndex((role) => role.id === targetId);
      if (from < 0 || target < 0 || draggedId === targetId) return current;
      const [moved] = custom.splice(from, 1);
      const targetAfterRemoval = custom.findIndex((role) => role.id === targetId);
      custom.splice(targetAfterRemoval + (side === "after" ? 1 : 0), 0, moved);
      const ordered = [...custom];
      return {
        ...current,
        roles: current.roles.map((role) => ["owner", "member"].includes(role.id) ? role : ordered.shift()),
      };
    });
    setRolesSaved(false);
  }
  function moveRole(roleId, direction) {
    const custom = form.roles.filter((role) => !["owner", "member"].includes(role.id));
    const from = custom.findIndex((role) => role.id === roleId);
    const target = custom[from + direction];
    if (target) reorderRole(roleId, target.id, direction < 0 ? "before" : "after");
  }
  function beginRoleDrag(event, role) {
    if (!canEditRole(role)) return event.preventDefault();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", role.id);
    setRoleDrag({ roleId: role.id, overId: "", side: "" });
  }
  function hoverRole(event, role) {
    const draggedId = roleDrag.roleId || event.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === role.id || !canEditRole(role)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    const side = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    if (roleDrag.overId !== role.id || roleDrag.side !== side)
      setRoleDrag((current) => ({ ...current, overId: role.id, side }));
  }
  function dropRole(event, role) {
    const draggedId = roleDrag.roleId || event.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === role.id || !canEditRole(role)) return setRoleDrag({ roleId: "", overId: "", side: "" });
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    reorderRole(draggedId, role.id, event.clientY < bounds.top + bounds.height / 2 ? "before" : "after");
    setRoleDrag({ roleId: "", overId: "", side: "" });
  }
  function chooseImage(key, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) { if (file) setError("Escolha um arquivo de imagem válido."); return; }
    if (file.size > 3 * 1024 * 1024) { setError("Escolha uma imagem de até 3 MB."); return; }
    const reader = new FileReader();
    reader.onerror = () => setError("Não foi possível ler essa imagem.");
    reader.onload = () => { setError(""); setForm((current) => ({ ...current, [key]: String(reader.result) })); };
    reader.readAsDataURL(file);
  }
  async function saveRoles() {
    setError(""); setRolesSaved(false); setBusy(true);
    try { const saved = await onSave({ roles: form.roles, memberRoles: form.memberRoles }); setForm(current => ({ ...current, roles: saved.roles })); setRolesSaved(true); return true; }
    catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await onSave({ name: form.name.trim(), tag: form.tag.trim().toUpperCase(), icon: form.icon, banner: form.banner, accentColor: form.accentColor });
      onClose();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const customRoles = form.roles.filter((role) => !["owner", "member"].includes(role.id));
  const defaultRole = form.roles.find((role) => role.id === "member");
  const configurableMembers = members.map(member => ({ ...member, roleId: form.memberRoles[member.id] || member.roleId }));
  const [memberSearch, setMemberSearch] = useState("");
  return (
    <div className="modal-backdrop server-settings-backdrop" onClick={onClose}>
      <section className="server-settings-modal server-settings-workspace" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar configurações"><X size={18} /></button>
        <aside className="server-settings-nav" aria-label="Configurações do servidor">
          <div className="server-settings-nav-title">SERVIDOR DE {String(form.name || "SESH").toUpperCase()}</div>
          <button type="button" className={settingsSection === "overview" ? "active" : ""} disabled={!canEditOverview} onClick={() => setSettingsSection("overview")}>Visão geral</button>
          <button type="button" className={settingsSection === "roles" ? "active" : ""} disabled={!canEditRoles} onClick={() => setSettingsSection("roles")}>Cargos</button>
          <button type="button" className={settingsSection === "members" ? "active" : ""} disabled={!canEditRoles} onClick={() => setSettingsSection("members")}>Membros</button>
          <div className="server-settings-nav-divider" />
          <p>As alterações são salvas em cada seção.</p>
        </aside>
        <main className="server-settings-content">
          {settingsSection === "overview" && <form className="server-overview-form" onSubmit={submit}>
            <header><span>VISÃO GERAL</span><h2>Perfil do servidor</h2><p>Escolha como sua comunidade aparece para todos os membros.</p></header>
            <div className="server-settings-preview" style={{ ...bannerStyleValue(form.banner), "--server-accent": form.accentColor }}>
              <div className="server-settings-icon">{form.icon?.startsWith?.("data:image/") ? <img src={form.icon} alt="" /> : <span>{String(form.icon || form.name || "S").slice(0, 2)}</span>}</div>
              <div><strong>{form.name || "Nome do servidor"}</strong>{form.tag && <span className="server-settings-server-tag" style={{ "--server-tag-color": form.accentColor || "#c93642" }}>{form.tag}</span>}</div>
            </div>
            <div className="server-overview-fields">
              <label>Nome do servidor<input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Tag do servidor<input maxLength="4" placeholder="SESH" value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase() })} /><small>De 2 a 4 letras ou números.</small></label>
              <label>Cor de destaque<input type="color" value={form.accentColor} onChange={(event) => setForm({ ...form, accentColor: event.target.value })} /></label>
            </div>
            <section className="server-media-controls"><div><strong>Imagem do servidor</strong><small>Use um ícone e um banner para deixar a comunidade reconhecível.</small></div><div className="server-banner-actions"><label className="secondary-setting">Escolher ícone<input type="file" accept="image/*" onChange={(event) => chooseImage("icon", event)} /></label>{form.icon && <button type="button" onClick={() => setForm({ ...form, icon: null })}>Remover ícone</button>}<label className="secondary-setting">Escolher banner<input type="file" accept="image/*" onChange={(event) => chooseImage("banner", event)} /></label>{form.banner && <button type="button" onClick={() => setForm({ ...form, banner: null })}>Remover banner</button>}</div></section>
            {error && <div className="form-error">{error}</div>}
            <div className="prompt-actions"><button type="button" className="prompt-cancel" onClick={onClose}>Cancelar</button><button className="prompt-confirm" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</button></div>
          </form>}
          {settingsSection === "roles" && <section className="server-roles-page">
            <header><span>CARGOS</span><h2>Cargos e permissões</h2><p>Organize os membros e defina o que cada grupo pode fazer no servidor.</p></header>
            <div className="server-roles-toolbar"><span>{customRoles.length} cargo{customRoles.length === 1 ? "" : "s"} criado{customRoles.length === 1 ? "" : "s"}</span><button type="button" className="role-create" onClick={addRole}>Criar cargo</button></div>
            <p className="server-role-hint">Arraste os cargos pela alça para definir a prioridade. Os mais acima aparecem primeiro na lateral quando “Separar membros” está ativo.</p>
            <section className="settings-roles-list">
              {defaultRole && <article className="settings-role-item default-role"><div className="settings-role-main"><i className="role-color-dot" /><span><strong>Permissões padrão</strong><small>Permissões de quem ainda não tem cargo personalizado</small></span></div><button type="button" className="role-edit" disabled={server.role !== "owner"} onClick={() => setRoleEditorId(defaultRole.id)}>Editar</button></article>}
              {customRoles.map((role, index) => <article key={role.id} data-role-id={role.id} className={"settings-role-item role-style-" + (role.style || "solid") + (roleDrag.roleId === role.id ? " is-dragging" : "") + (roleDrag.overId === role.id ? " drag-over-" + roleDrag.side : "")} style={{ "--role-preview-color": role.color, "--member-role-color": role.color }} onDragOver={(event) => hoverRole(event, role)} onDrop={(event) => dropRole(event, role)}><button type="button" className="role-drag-handle" draggable={canEditRole(role)} disabled={!canEditRole(role)} aria-label={"Arrastar cargo " + (role.name || "Novo cargo")} aria-grabbed={roleDrag.roleId === role.id} onDragStart={(event) => beginRoleDrag(event, role)} onDragEnd={() => setRoleDrag({ roleId: "", overId: "", side: "" })}><GripVertical size={18}/></button><div className="settings-role-main"><i className={role.icon ? "role-list-icon has-image" : role.emoji ? "role-list-icon has-emoji" : "role-color-dot"}>{role.icon ? <img src={role.icon} alt="" /> : role.emoji || null}</i><span><strong className="role-effect-text">{role.name || "Novo cargo"}</strong><small>{role.hoist ? "Membros separados na lateral" : "Lista geral de membros"}</small></span></div><div className="role-list-actions"><button type="button" className="role-move" title="Subir" aria-label="Subir cargo" disabled={!canEditRole(role) || (server.role !== "owner" && role.position <= server.actorPosition + 1)} onClick={() => moveRole(role.id, -1)}>↑</button><button type="button" className="role-move" title="Descer" aria-label="Descer cargo" disabled={!canEditRole(role)} onClick={() => moveRole(role.id, 1)}>↓</button><button type="button" className="role-edit" disabled={!canEditRole(role)} onClick={() => setRoleEditorId(role.id)}>Editar</button><button type="button" className="role-remove" disabled={!canEditRole(role)} onClick={() => setForm((current) => ({ ...current, roles: current.roles.filter((item) => item.id !== role.id) }))}>Remover</button></div><span className="role-order">#{index + 1}</span></article>)}
              {!customRoles.length && <div className="role-empty-state"><strong>Nenhum cargo criado</strong><span>Crie o primeiro cargo para organizar permissões e membros.</span></div>}
            </section>
            {rolesSaved && <p className="role-save-feedback">Cargos salvos.</p>}{error && <div className="form-error">{error}</div>}
            <div className="role-page-actions"><button type="button" className="prompt-confirm" onClick={saveRoles} disabled={busy}>{busy ? "Salvando..." : "Salvar cargos"}</button></div>
          </section>}
          {settingsSection === "members" && <section className="server-members-page">
            <header><span>MEMBROS</span><h2>Gerenciar membros</h2><p>Defina um cargo visual para cada pessoa. O dono permanece no topo e mantém todas as permissões.</p></header>
            <label className="settings-search members-search"><Search size={18}/><input placeholder="Buscar membro" value={memberSearch} onChange={event => setMemberSearch(event.target.value)}/></label><div className="members-table-header"><span>MEMBRO</span><span>CARGO</span></div><section className="settings-members-list">{configurableMembers.filter(member => `${member.displayName} ${member.username}`.toLowerCase().includes(memberSearch.toLowerCase())).map((member) => <label className="server-role-member" data-member-id={member.id} key={member.id}><span><Avatar user={member} color={member.avatarColor || "purple"} small /><strong>{member.displayName}{member.id === server.ownerId && <em className="server-owner-label">DONO</em>}</strong><small>@{member.username}</small></span><select disabled={member.id === server.ownerId ? server.role !== "owner" : server.role !== "owner" && member.serverRole?.position <= server.actorPosition} value={form.memberRoles[member.id] || "member"} onChange={(event) => assignRoleMember(member.id, event.target.value)}>{member.id === server.ownerId && <option value="owner">Dono (padrão)</option>}{form.roles.filter(role => role.id !== "owner").map((role) => <option key={role.id} value={role.id} disabled={server.role !== "owner" && role.position <= server.actorPosition}>{role.name}</option>)}</select></label>)}{!configurableMembers.length && <div className="role-empty-state"><strong>Ainda não há membros</strong><span>Quando alguém entrar, você poderá atribuir um cargo aqui.</span></div>}</section>
            {rolesSaved && <p className="role-save-feedback">Membros atualizados.</p>}{error && <div className="form-error">{error}</div>}
            <div className="role-page-actions"><button type="button" className="prompt-confirm" onClick={saveRoles} disabled={busy}>{busy ? "Salvando..." : "Salvar membros"}</button></div>
          </section>}
        </main>
        {roleEditorId && form.roles.find((role) => role.id === roleEditorId) && <RoleConfigPanel role={form.roles.find((role) => role.id === roleEditorId)} members={configurableMembers} ownerId={server.ownerId} canAssignOwner={server.role === "owner"} onUpdate={updateRole} onAssignMember={assignRoleMember} onSave={saveRoles} saving={busy} onClose={() => setRoleEditorId(null)} />}
      </section>
    </div>
  );
}
function ProfileGames({user}) {
  const games=(user.gameInterests||[]).map(id=>GAME_CATALOG.find(game=>game.id===id)).filter(Boolean);
  return games.length ? <div className="profile-game-chips">{games.map(game=><a key={game.id} href={game.iconSource} target="_blank" rel="noopener noreferrer" title={"Fonte da imagem de "+game.name}><GameIcon game={game}/>{game.name}</a>)}</div> : <span>{user.favoriteGame}</span>;
}
function MemberProfilePopover({ data, currentUser, position, onClose, onRetry, onEdit, onMessage, onAddFriend, onFull, Avatar, ProfileEffectLayer, renderBadges, presence, isFriend, serverRole }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const user = data?.user;
  return <aside className="member-profile-popover" style={{ left: position.x, top: position.y }} role="dialog" aria-label={user ? "Resumo de " + user.displayName : "Resumo do perfil"} onClick={event => event.stopPropagation()}>
    {!user ? <div className="member-profile-popover-loading">{data?.error ? <><p>{data.error}</p><button onClick={onRetry}>Tentar novamente</button></> : <p>Carregando perfil…</p>}</div> : <>
      <ProfileCard user={{...user,serverRole:serverRole||user.serverRole}} Avatar={Avatar} ProfileEffectLayer={ProfileEffectLayer} renderBadges={renderBadges} presence={presence}/>
      <div className="member-profile-popover-actions">
        {user.id === currentUser.id
          ? <button type="button" onClick={onEdit}>Editar perfil</button>
          : <button type="button" onClick={() => onMessage(user)}>Mensagem</button>}
        <button type="button" className="member-profile-more" aria-label="Mais ações do perfil" aria-controls="member-profile-more-menu" aria-expanded={moreOpen} onClick={() => setMoreOpen(value => !value)}><MoreVertical size={18}/></button>
      </div>
      {moreOpen && <div className="member-profile-more-menu" id="member-profile-more-menu">
        <button type="button" onClick={onFull}>Ver perfil completo</button>
        {user.id !== currentUser.id && !isFriend && <button type="button" onClick={() => onAddFriend(user)}>Adicionar amigo</button>}
      </div>}
      <button type="button" className="member-profile-full" onClick={onFull}>Ver perfil completo</button>
    </>}
  </aside>;
}
function FavoriteGameActivity({user}) {
  const game=GAME_CATALOG.find(game=>game.id===user.gameInterests?.[0]);
  return game ? <div className="favorite-game-activity"><GameIcon game={game}/><div><strong>{game.name}</strong><small>Jogo de interesse</small></div></div> : null;
}
function ProfileBadges(user) {
  return user.badges?.map(key => BADGES[key] ? <span className="profile-badge" key={key} title={BADGES[key].label}><BadgeIcon badge={BADGES[key]}/></span> : null);
}
function ProfileSettingsPanel(props) {
  return <ProfileEditor {...props} Avatar={Avatar} ProfileEffectLayer={ProfileEffectLayer} renderBadges={ProfileBadges}/>;
}
function bannerStyleValue(banner) {
  if (!banner) return undefined;
  return String(banner).startsWith("data:image/")
    ? { backgroundImage: `url(${banner})` }
    : { background: banner };
}
function DirectConversation(props) { return props.user ? <DirectMessages {...props} Avatar={Avatar}/> : null; }

function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <a
          className="landing-logo"
          href="/"
          aria-label="Página inicial do Sesh"
        >
          <img src="/branding/sesh-logo.gif" alt="" />
          <span>Sesh</span>
        </a>
        <div className="landing-links">
          <a href="#recursos">Recursos</a>
          <a href="#comunidades">Comunidades</a>
          <a href="#seguranca">Segurança</a>
          <a href="/app">Entrar</a>
        </div>
        <a className="landing-open" href="/app">
          Abrir o Sesh
        </a>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">CONVERSE DO SEU JEITO</span>
          <h1>Sua galera, no mesmo ritmo.</h1>
          <p>
            Um espaço simples para conversar, ligar a câmera, compartilhar a
            tela e construir comunidades que parecem suas.
          </p>
          <div className="landing-actions">
            <a className="landing-primary" href="/app">
              Abrir no navegador
              <ChevronRight size={19} />
            </a>
            <a className="landing-secondary" href="#recursos">
              Conhecer recursos
            </a>
          </div>
          <div className="landing-proof">
            <span>
              <i /> Servidor local online
            </span>
            <span>Texto, voz e vídeo</span>
          </div>
        </div>

        <div className="landing-product-wrap" aria-label="Prévia do Sesh">
          <div className="landing-product-glow" />
          <div className="landing-product">
            <div className="landing-window-bar">
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>sesh • comunidade</span>
            </div>
            <div className="landing-app-preview">
              <aside className="landing-preview-rail">
                <img src="/branding/sesh-logo.gif" alt="" />
                <i />
                <i />
                <i />
                <button>+</button>
              </aside>
              <aside className="landing-preview-channels">
                <strong>NOITE DE JOGOS</strong>
                <small>CANAIS DE TEXTO</small>
                <span className="selected">
                  <Hash size={14} /> geral
                </span>
                <span>
                  <Hash size={14} /> clipes
                </span>
                <small>CANAIS DE VOZ</small>
                <span>
                  <Volume2 size={14} /> resenha
                </span>
                <div className="landing-preview-user">
                  <b>SA</b>
                  <div>
                    <strong>Sabrina</strong>
                    <small>Online</small>
                  </div>
                </div>
              </aside>
              <section className="landing-preview-chat">
                <header>
                  <Hash size={18} />
                  <strong>geral</strong>
                  <span>Conversa da comunidade</span>
                </header>
                <div className="landing-preview-messages">
                  <article>
                    <b className="red">JM</b>
                    <div>
                      <strong>João</strong>
                      <p>Quem entra na call hoje?</p>
                    </div>
                  </article>
                  <article>
                    <b>SA</b>
                    <div>
                      <strong>Sabrina</strong>
                      <p>Já estou por aqui. Vou compartilhar a tela 👋</p>
                    </div>
                  </article>
                  <article>
                    <b className="dark">LU</b>
                    <div>
                      <strong>Lucas</strong>
                      <p>Perfeito, ligando a câmera.</p>
                    </div>
                  </article>
                </div>
                <div className="landing-preview-composer">
                  Conversar em #geral
                  <Smile size={16} />
                </div>
              </section>
            </div>
          </div>
          <div className="landing-call-card">
            <div className="landing-call-avatars">
              <span>SA</span>
              <span>JM</span>
              <span>LU</span>
            </div>
            <div>
              <strong>Resenha ao vivo</strong>
              <small>3 pessoas conectadas</small>
            </div>
            <div className="landing-call-actions">
              <Mic size={15} />
              <Camera size={15} />
              <MonitorUp size={15} />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="recursos">
        <header>
          <span>FEITO PARA ESTAR JUNTO</span>
          <h2>Menos ruído. Mais conversa.</h2>
        </header>
        <div className="landing-feature-grid">
          <article>
            <MessageSquare size={24} />
            <h3>Comunidades organizadas</h3>
            <p>Canais para cada assunto sem perder o contexto da conversa.</p>
          </article>
          <article>
            <Video size={24} />
            <h3>Voz e câmera</h3>
            <p>Entre na sala, abra a câmera e converse sem complicação.</p>
          </article>
          <article>
            <MonitorUp size={24} />
            <h3>Compartilhe sua tela</h3>
            <p>Mostre jogos, projetos e ideias para todo mundo acompanhar.</p>
          </article>
        </div>
      </section>

      <section className="landing-community" id="comunidades">
        <div>
          <span>UM LUGAR COM A SUA CARA</span>
          <h2>Do grupo pequeno à comunidade inteira.</h2>
        </div>
        <a href="/app">
          Criar meu espaço <ChevronRight size={18} />
        </a>
      </section>

      <footer className="landing-footer" id="seguranca">
        <a className="landing-logo" href="/">
          <img src="/branding/sesh-logo.gif" alt="" />
          <span>Sesh</span>
        </a>
        <p>Comunicação local em desenvolvimento.</p>
        <a href="/legal.html">Termos, privacidade e comunidade</a>
        <a href="/app">Entrar</a>
      </footer>
    </main>
  );
}

function AuthScreen({ onLogin, lockedEmail = "" }) {
  const [register, setRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: lockedEmail,
    displayName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (register && form.username.includes("@")) {
      setError("Escolha um nome de usuário sem @. Digite o e-mail apenas no campo E-mail.");
      return;
    }
    setLoading(true);
    try {
      const result = register
        ? await api.register(form)
        : await api.login({ username: form.username, password: form.password });
      localStorage.removeItem("orbit_token");
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function useDemoAccount() {
    setRegister(false);
    setForm({
      username: "demo",
      displayName: "",
      email: "",
      phone: "",
      password: "demo123",
    });
    setError("");
  }

  return (
    <div className="auth-screen">
      <a className="auth-page-brand" href="/" aria-label="Voltar ao Sesh">
        <img src="/branding/sesh-logo.gif" alt="" />
        <strong>Sesh</strong>
      </a>
      <div className="auth-card">
        <section className="auth-brand-panel">
          <div className="auth-brand-top">
            <div className="auth-logo-frame">
              <img
                className="auth-logo auth-logo-img"
                src="/branding/sesh-logo.gif"
                alt="Símbolo animado do Sesh"
              />
            </div>
          </div>
          {import.meta.env.DEV && <div className="auth-brand-copy">
            <h2>Entrar rapidamente</h2>
            <p>Use a conta local de teste para conhecer o Sesh agora.</p>
            <button type="button" onClick={useDemoAccount}>
              Usar conta demo
            </button>
          </div>}
          <div className="auth-brand-status">
            <i />
            Servidor local disponível
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <span>{register ? "NOVA CONTA" : "ACESSO SESH"}</span>
            <h1>{register ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
            <p>
              {register
                ? "Crie seu perfil e comece sua comunidade."
                : "Entre para continuar suas conversas."}
            </p>
          </div>

          <form onSubmit={submit}>
            {register && (
              <label className="auth-field">
                <span>Nome de exibição</span>
                <input
                  required
                  autoComplete="name"
                  placeholder="Como as pessoas verão você"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                />
              </label>
            )}
            {!lockedEmail ? (
            <label className="auth-field">
              <span>{register ? "Nome de usuário" : "Usuário ou e-mail"}</span>
              <input
                required
                autoFocus
                autoComplete="username"
                minLength={register ? 3 : undefined}
                maxLength={register ? 20 : undefined}
                autoCapitalize="none"
                spellCheck={false}
                placeholder={register ? "Escolha um nome sem @" : "Digite seu usuário ou e-mail"}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </label>
            ) : (
              <div className="auth-locked-email">
                <span>CONTA ADMINISTRATIVA</span>
                <strong>{lockedEmail}</strong>
              </div>
            )}
            {register && (
              <label className="auth-field">
                <span>E-mail</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
            )}
            {register && (
              <label className="auth-field">
                <span>Telefone <em>(opcional)</em></span>
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            )}
            <label className="auth-field">
              <span>Senha</span>
              <div className="auth-password-field">
                <input
                  required
                  minLength={register ? "10" : undefined}
                  type={showPassword ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={
                    register ? "Mínimo de 10 caracteres" : "Sua senha"
                  }
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="auth-submit" disabled={loading}>
              {loading ? "Entrando..." : register ? "Criar conta" : "Entrar"}
            </button>
          </form>

          {import.meta.env.DEV && !register && (
            <div className="auth-demo">
              <div>
                <strong>Acesso local de teste</strong>
                <span>demo / demo123</span>
              </div>
              <button type="button" onClick={useDemoAccount}>
                Preencher
              </button>
            </div>
          )}

          <div className="auth-switch-row">
            <span>{register ? "Já faz parte?" : "Novo por aqui?"}</span>
            <button
              className="auth-switch"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Entrar na minha conta" : "Criar uma conta"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function App({ currentUser, onLogout, onUserUpdate }) {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [aiSessionServerId, setAiSessionServerId] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [readingAttachment,setReadingAttachment] = useState(false);
  const attachmentRead = useRef(0);
  const chatDrop = useFileDrop(files => attachFiles(files));
  useEffect(()=>{
    const prevent=event=>{if(Array.from(event.dataTransfer?.types||[]).includes("Files"))event.preventDefault();};
    window.addEventListener("dragover",prevent);window.addEventListener("drop",prevent);
    return()=>{window.removeEventListener("dragover",prevent);window.removeEventListener("drop",prevent);};
  },[]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [memberListOpen, setMemberListOpen] = useState(() => typeof window === "undefined" || window.innerWidth > 900);
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 900px)");
    const syncLayout = () => {
      setMobileNav(false);
      setMemberListOpen(!mobile.matches);
    };
    mobile.addEventListener("change", syncLayout);
    return () => mobile.removeEventListener("change", syncLayout);
  }, []);
  function toggleMobileNavigation() {
    setMemberListOpen(false);
    setMobileNav((current) => !current);
  }
  function toggleMemberDrawer() {
    setMobileNav(false);
    setMemberListOpen((current) => !current);
  }
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("account");
  const [theme, setTheme] = useState(
    localStorage.getItem("orbit_theme") || "dark",
  );
  const [compactMode, setCompactMode] = useState(
    localStorage.getItem("orbit_compact") === "true",
  );
  const [notifications, setNotifications] = useState(
    localStorage.getItem("orbit_notifications") !== "false",
  );
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState([]);
  const [muted, setMuted] = useState(false);
  const [locallyMutedUsers, setLocallyMutedUsers] = useState(() => new Set());
  const locallyMutedUsersRef = useRef(new Set());
  const [voiceStates, setVoiceStates] = useState({});
  const [voiceChannel, setVoiceChannel] = useState(null);
  const [voiceConnectionPanel, setVoiceConnectionPanel] = useState(false);
  const [voiceLatency, setVoiceLatency] = useState({ last: 0, average: 0, samples: 0 });
  const voiceLatencySamplesRef = useRef([]);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [remoteVideos, setRemoteVideos] = useState({});
  const [focusedVideoId, setFocusedVideoId] = useState(null);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [speaking, setSpeaking] = useState({});
  const [deafened, setDeafened] = useState(false);
  const deafenedRef = useRef(false);
  const camTrackRef = useRef(null);
  const screenTrackRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analysersRef = useRef(new Map());
  const speakingRef = useRef({});
  const localVideoStream = useMemo(() => {
    const track = screenOn
      ? screenTrackRef.current
      : camOn
        ? camTrackRef.current
        : null;
    return track?.readyState === "live" ? new MediaStream([track]) : null;
  }, [camOn, screenOn]);
  const orderedVoiceParticipants = useMemo(() => {
    const callOrder = voiceStates[voiceChannel?.id] || [];
    const details = new Map(
      [...callOrder, ...voiceParticipants].map((participant) => [
        participant.id,
        participant,
      ]),
    );
    const orderedIds = [
      ...callOrder.map((participant) => participant.id),
      ...voiceParticipants.map((participant) => participant.id),
    ];
    return [...new Set(orderedIds)]
      .map((id) => details.get(id))
      .filter(Boolean);
  }, [voiceParticipants, voiceStates, voiceChannel?.id]);
  // Keep the caller visible while the socket room update is arriving. This is
  // the normal audio participant card, not a camera preview.
  const visibleVoiceParticipants = useMemo(() => {
    if (!voiceConnected || !voiceChannel?.id) return [];
    if (orderedVoiceParticipants.some((participant) => participant.id === currentUser.id)) {
      return orderedVoiceParticipants;
    }
    return [currentUser, ...orderedVoiceParticipants];
  }, [
    voiceConnected,
    voiceChannel?.id,
    orderedVoiceParticipants,
    currentUser,
  ]);
  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    const special = [
      { id: "mention-everyone", kind: "special", mention: "everyone", displayName: "@everyone", detail: "Notifica todos no servidor" },
      { id: "mention-here", kind: "special", mention: "here", displayName: "@here", detail: "Notifica membros conectados agora" },
    ].filter((item) => item.mention.includes(query));
    const roles = (selectedServer?.roles || [])
      .filter((role) => !["owner", "member"].includes(role.id))
      .filter((role) => role.name.toLowerCase().includes(query))
      .map((role) => ({ id: `mention-role-${role.id}`, kind: "role", mention: role.name, displayName: `@${role.name}`, detail: "Menciona membros deste cargo" }));
    const people = members
      .filter((member) => member.id !== currentUser.id && [member.displayName, member.username].some((value) => String(value || "").toLowerCase().includes(query)))
      .map((member) => ({ ...member, kind: "member", mention: member.username, detail: `@${member.username}` }));
    return [...special, ...roles, ...people].slice(0, 8);
  }, [mentionQuery, members, selectedServer?.roles, currentUser.id]);
  const voiceActiveRef = useRef(false);
  const [friendsData, setFriendsData] = useState({ friends: [], pending: [] });
  const [homeTab, setHomeTab] = useState("online");
  const [friendQuery, setFriendQuery] = useState("");
  const [addFriendValue, setAddFriendValue] = useState("");
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [serverModal, setServerModal] = useState(null);
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
  const [guideServer, setGuideServer] = useState(null);
  const guideIconRef = useRef(null);
  const composerInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const messagesListRef = useRef(null);
  const autoScrollMessagesRef = useRef(true);
  const messageChannelRef = useRef(null);
  const socketRef = useRef(null);
  const selectedServerRef = useRef(selectedServer);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const audioRefs = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());
  const [contextMenu, setContextMenu] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  const [serverContextMenu, setServerContextMenu] = useState(null);
  const [badgeMenu, setBadgeMenu] = useState(null);
  const [badgeEditor, setBadgeEditor] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [unreadMarkers, setUnreadMarkers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sesh_unread_messages") || "{}");
    } catch {
      return {};
    }
  });
  const [pinnedChannels, setPinnedChannels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sesh_pinned") || "[]");
    } catch {
      return [];
    }
  });
  const [mutedChannels, setMutedChannels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sesh_muted") || "[]");
    } catch {
      return [];
    }
  });
  const [serverPreferences, setServerPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sesh_server_preferences") || "{}");
    } catch {
      return {};
    }
  });
  const [dialog, setDialog] = useState(null);
  const [profileView, setProfileView] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [accountForm, setAccountForm] = useState(null);
  const [channelModal, setChannelModal] = useState(null);
  const [presenceMap, setPresenceMap] = useState({});
  const [statusMenu, setStatusMenu] = useState(false);
  useEffect(() => {
    if(!statusMenu)return;
    const close=event=>{if(!event.target.closest(".quick-profile,.user-avatar-btn"))setStatusMenu(false);};
    const key=event=>{if(event.key==="Escape")setStatusMenu(false);};
    document.addEventListener("pointerdown",close);document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",key);};
  },[statusMenu]);
  const handledInviteRef = useRef(false);
  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get("invite")?.trim();
    if (!invite || handledInviteRef.current) return;
    handledInviteRef.current = true;
    api
      .joinServer(invite)
      .then((result) => {
        const server = result.server;
        setServers((current) =>
          current.some((item) => item.id === server.id)
            ? current.map((item) => (item.id === server.id ? server : item))
            : [...current, server],
        );
        setSelectedServer(server);
        setSelectedChannel(server.channels?.[0] || null);
        localStorage.setItem("sesh_onboarded", "1");
        window.history.replaceState({}, "", "/app");
        setNotice(`Você entrou em ${server.name}.`);
      })
      .catch((error) => {
        window.history.replaceState({}, "", "/app");
        setNotice(error.message);
      });
  }, []);
  useEffect(() => {
    if (!voiceConnected || !voiceChannel?.id || !socketRef.current) return;
    socketRef.current.send({
      type: "voice.media",
      channelId: voiceChannel.id,
      muted,
      deafened,
      camera: camOn,
      screen: screenOn,
    });
  }, [voiceConnected, voiceChannel?.id, muted, deafened, camOn, screenOn]);
  useEffect(() => {
    const syncFullscreen = () =>
      setVideoFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);
  useEffect(() => {
    if (!focusedVideoId) return;
    const participantExists = orderedVoiceParticipants.some(
      (participant) => participant.id === focusedVideoId,
    );
    const stream =
      focusedVideoId === currentUser.id
        ? localVideoStream
        : remoteVideos[focusedVideoId];
    if (!participantExists || !stream) setFocusedVideoId(null);
  }, [
    focusedVideoId,
    orderedVoiceParticipants,
    remoteVideos,
    localVideoStream,
    currentUser.id,
  ]);
  useEffect(() => {
    if (!profileView) return;
    let active = true;
    // Paint instantâneo com os dados que já temos em cache (membro, amigo
    // ou eu mesmo — todos trazem badges). O fetch abaixo só atualiza em
    // segundo plano. Sem isso o popover ficava preso no "Carregando…".
    const cachedUser =
      (profileView.userId === currentUser.id && currentUser) ||
      members.find((member) => member.id === profileView.userId) ||
      friendsData.friends.find((person) => person.id === profileView.userId) ||
      null;
    setProfileData(cachedUser ? { user: cachedUser, voice: null } : "loading");
    api.profile(profileView.userId).then(result => { if (active) setProfileData(result); })
      .catch(err => { if (active) { setNotice(err.message); setProfileData(current => current?.user ? current : {error: err.message}); } });
    const onKey = event => { if (event.key === "Escape") setProfileView(null); };
    window.addEventListener("keydown", onKey);
    return () => { active = false; window.removeEventListener("keydown", onKey); };
  }, [profileView?.userId]);
  useEffect(() => {
    if (profileView?.mode !== "popover") return;
    const close = event => {
      if (!event.target.closest?.(".member-profile-popover")) setProfileView(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [profileView?.mode, profileView?.userId]);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = localStorage.getItem("sesh_reduced_motion") || "false";
    document.body.classList.toggle(
      "creator-account",
      Boolean(currentUser.isCreator),
    );
    return () => document.body.classList.remove("creator-account");
  }, [currentUser.isCreator]);
  useEffect(() => {
    const ownProfile =
      !profileData?.user || profileData.user.id === currentUser.id;
    const viewed = ownProfile ? currentUser : profileData.user;
    const localNameStyle = ownProfile
      ? localStorage.getItem("sesh_name_style")
      : null;
    document.body.dataset.profileTheme = viewed.profileTheme || "default";
    document.body.dataset.nameStyle =
      localNameStyle || viewed.nameStyle || "default";
    document.body.dataset.profilePlate = viewed.profilePlate || "default";
    document.body.dataset.profileEffect = viewed.profileEffect || "none";
    document.body.style.setProperty(
      "--profile-name-color",
      viewed.nameColor || "#f1f3f5",
    );
  }, [currentUser, profileData]);
  useEffect(() => {
    if (selectedServer && homeTab.startsWith("dm:")) setHomeTab("online");
  }, [selectedServer, homeTab]);
  useEffect(() => {
    const ownMember = members.find((member) => member.id === currentUser.id);
    const canModerate = Boolean(
      selectedServer && (selectedServer.role === "owner" || ownMember?.serverRole?.permissions?.manageMembers),
    );
    const onContextMenu = (event) => {
      if (event.target.closest(".attachment-lightbox-image")) return;
      const card = event.target.closest(".profile-card");
      // Sesh owns the context menu across the app. Capture mode below keeps
      // the browser's native menu from winning this interaction.
      event.preventDefault();
      const serverIcon = event.target.closest(".server-icon[data-server-id]");
      if (serverIcon) {
        const server = servers.find((item) => item.id === serverIcon.dataset.serverId);
        if (server) {
          event.stopPropagation();
          setServerContextMenu({
            x: Math.min(event.clientX, window.innerWidth - 275),
            y: Math.min(event.clientY, window.innerHeight - 490),
            server,
            submenu: null,
          });
          return;
        }
      }
      const messageRow = event.target.closest(".message[data-message-id]");
      if (messageRow) {
        const message = messages.find((item) => item.id === messageRow.dataset.messageId);
        if (message) {
          openMessageMenu(event, message);
          return;
        }
      }
      const voiceMember = event.target.closest(".voice-member[data-member-id]");
      if (voiceMember) {
        const voiceUserId = voiceMember.dataset.memberId;
        const voiceUser = members.find((item) => item.id === voiceUserId) ||
          Object.values(voiceStates).flat().find((item) => item.id === voiceUserId) ||
          (voiceUserId === currentUser.id ? currentUser : null);
        if (voiceUser) {
          openMemberMenu(event, voiceUser, true);
          return;
        }
      }
      const ownPanel = event.target.closest(".user-panel");
      if (ownPanel) {
        openMemberMenu(event, ownMember ? {...currentUser,...ownMember} : currentUser);
        return;
      }
      if (card && profileData?.user && currentUser.isCreator) {
        event.preventDefault();
        event.stopPropagation();
        setBadgeMenu({
          x: Math.min(event.clientX, window.innerWidth - 240),
          y: Math.min(event.clientY, window.innerHeight - 70),
          user: profileData.user,
        });
        return;
      }
      const channelRow = event.target.closest(".channel-row");
      if (channelRow) {
        const channel = selectedServer?.channels.find(
          (item) => item.id === channelRow.dataset.channelId,
        );
        if (channel) {
          event.stopPropagation();
          setContextMenu({
            x: Math.min(event.clientX, window.innerWidth - 260),
            y: Math.min(event.clientY, window.innerHeight - 440),
            channel,
          });
          return;
        }
      }
      // Resolve by stable ID, never by display names (which may be shared).
      const row = event.target.closest("[data-member-id]");
      if (!row) return;
      const id = row.dataset.memberId;
      const target = members.find(item => item.id === id) ||
        messages.find(item => item.author?.id === id)?.author ||
        Object.values(voiceStates).flat().find(item => item.id === id);
      if (target) openMemberMenu(event, target, row.classList.contains("voice-member"));
    };
    document.addEventListener("contextmenu", onContextMenu, true);
    return () => document.removeEventListener("contextmenu", onContextMenu, true);
  }, [currentUser.id, currentUser.isCreator, profileData, members, messages, voiceStates, selectedServer, servers, muted, deafened, locallyMutedUsers]);
  useEffect(() => {
    api
      .servers()
      .then((result) => {
        setServers(result.servers);
        const linkedServerId = new URLSearchParams(window.location.search).get("server");
        const linkedServer = result.servers.find((server) => server.id === linkedServerId);
        if (linkedServer) setSelectedServer(linkedServer);
        if (
          result.servers.length === 0 &&
          !localStorage.getItem("sesh_onboarded")
        )
          setOnboardOpen(true);
      })
      .catch((err) => setNotice(err.message));
    api
      .friends()
      .then(setFriendsData)
      .catch(() => {});
    api
      .catalog()
      .then((result) => setCatalogItems(result.items || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    selectedServerRef.current = selectedServer;
  }, [selectedServer]);

  const selectedChannelRef = useRef(selectedChannel);
  selectedChannelRef.current = selectedChannel;
  const sendingMessageRef = useRef(false);
  useEffect(() => {
    if (!selectedServer) { setSelectedChannel(null); setMembers([]); return; }
    let active = true;
    const linkedChannelId = new URLSearchParams(window.location.search).get("channel");
    const channel = selectedServer.channels.find((item) => item.id === linkedChannelId)
      || selectedServer.channels.find(item => item.type === "text")
      || selectedServer.channels[0];
    setSelectedChannel(channel || null);
    if (linkedChannelId && channel?.id === linkedChannelId) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("server");
      cleanUrl.searchParams.delete("channel");
      window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    }
    api.server(selectedServer.id).then(result => {
      if (!active) return;
      setMembers(result.members || []);
      setVoiceStates(current => ({ ...current, ...Object.fromEntries((result.voice || []).map(item => [item.channelId, item.participants])) }));
    }).catch(error => { if (active) setNotice(error.message); });
    return () => { active = false; };
  }, [selectedServer?.id]);
  useEffect(() => {
    let active = true;
    attachmentRead.current++;setReadingAttachment(false);
    setMessages([]); setDraft(""); setAttachment(null); setReplyingTo(null); setMessageMenu(null);
    if (selectedChannel?.id) api.messages(selectedChannel.id).then(result => {
      if (!active) return;
      setMessages(result.messages);
      fillAttachments(selectedChannel.id, result.messages);
      const messageId = window.location.hash.match(/^#message-(.+)$/)?.[1];
      if (messageId) requestAnimationFrame(() => document.getElementById(`message-${messageId}`)?.scrollIntoView({ block: "center" }));
    })
      .catch(error => { if(active) setNotice(error.message); });
    return () => { active=false; };
  }, [selectedChannel?.id]);
  // Completa anexos em segundo plano após listagem leve (?attachments=refs).
  // Só substitui quem ainda está como referência (não pisa em edição nova).
  function fillAttachments(channelId, list) {
    const pending = (list || []).filter((message) => message?.attachment?.ref);
    if (!pending.length) return;
    (async () => {
      for (let i = 0; i < pending.length; i += 6) {
        const batch = pending.slice(i, i + 6);
        const settled = await Promise.allSettled(batch.map((message) => api.message(channelId, message.id)));
        const full = {};
        settled.forEach((result) => {
          if (result.status === "fulfilled" && result.value?.message?.id) full[result.value.message.id] = result.value.message;
        });
        if (Object.keys(full).length && selectedChannelRef.current?.id === channelId)
          setMessages((current) => current.map((message) => message.attachment?.ref && full[message.id] ? full[message.id] : message));
      }
    })().catch(() => {});
  }
  const socketHandlerRef = useRef();
  socketHandlerRef.current = async (event) => {
      if (event.type === "connection.status") {
        if (!event.connected) {
          setNotice("Conexão interrompida. Reconectando…");
          if (voiceActiveRef.current) leaveVoice();
        } else if (event.recovered) {
          setNotice("Conectado novamente.");
          api.friends().then(setFriendsData).catch(() => {});
          if (selectedChannel?.id) api.messages(selectedChannel.id).then(result => {
            if(selectedChannelRef.current?.id === selectedChannel.id) {
              setMessages(result.messages);
              fillAttachments(selectedChannel.id, result.messages);
            }
          }).catch(error => setNotice(error.message));
        }
      }
      if (event.type === "direct.created") window.dispatchEvent(new CustomEvent("sesh:direct-message", { detail: event.message }));
      if (event.type === "message.created")
        setMessages((current) =>
          event.message.channelId === selectedChannel?.id &&
          !current.some((item) => item.id === event.message.id)
            ? [...current, event.message]
            : current,
        );
      if (event.type === "message.updated" && event.message.channelId === selectedChannel?.id) {
        setMessages((current) => current.map((message) =>
          message.id === event.message.id ? event.message : message,
        ));
        setMessageMenu((current) => current?.message.id === event.message.id
          ? { ...current, message: event.message }
          : current);
      }
      if (event.type === "message.deleted" && event.channelId === selectedChannel?.id) {
        setMessages((current) => current.filter((message) => message.id !== event.messageId));
        setMessageMenu((current) => current?.message.id === event.messageId ? null : current);
        setReplyingTo((current) => current?.id === event.messageId ? null : current);
      }
      if (event.type === "mention.created" && event.message.author.id !== currentUser.id) {
        if (localStorage.getItem("orbit_notifications") !== "false") playUiSound("mention");
        setNotice(`${event.message.author.displayName} mencionou você em #${event.channelName}.`);
      }
      if (event.type === "member.moderation.updated" && event.serverId === selectedServer?.id)
        setMembers((current) => current.map((member) =>
          member.id === event.member.id ? { ...member, ...event.member } : member,
        ));
      if (event.type === "voice.media.denied")
        setNotice(event.reason || "Seu cargo não pode usar este recurso de voz.");
      if (event.type === "voice.denied") {
        setNotice(event.reason || "Não foi possível entrar na call.");
        leaveVoice();
      }
      if (event.type === "channel.created") {
        setServers((current) =>
          current.map((server) =>
            server.id === event.serverId &&
            !server.channels.some((item) => item.id === event.channel.id)
              ? { ...server, channels: [...server.channels, event.channel] }
              : server,
          ),
        );
        setSelectedServer((current) =>
          current?.id === event.serverId &&
          !current.channels.some((item) => item.id === event.channel.id)
            ? { ...current, channels: [...current.channels, event.channel] }
            : current,
        );
      }
      if (event.type === "channel.updated") {
        setServers((current) =>
          current.map((server) =>
            server.id === event.serverId
              ? {
                  ...server,
                  channels: server.channels.map((item) =>
                    item.id === event.channel.id ? event.channel : item,
                  ),
                }
              : server,
          ),
        );
        setSelectedServer((current) =>
          current?.id === event.serverId
            ? {
                ...current,
                channels: current.channels.map((item) =>
                  item.id === event.channel.id ? event.channel : item,
                ),
              }
            : current,
        );
        setSelectedChannel((current) =>
          current?.id === event.channel.id ? event.channel : current,
        );
      }
      if (event.type === "channel.deleted") {
        if (selectedChannel?.id === event.channelId) setSelectedChannel(selectedServer?.channels.find(item => item.id !== event.channelId) || null);
        if (voiceChannel?.id === event.channelId) leaveVoice();
        setServers((current) =>
          current.map((server) =>
            server.id === event.serverId
              ? {
                  ...server,
                  channels: server.channels.filter(
                    (item) => item.id !== event.channelId,
                  ),
                }
              : server,
          ),
        );
        setSelectedServer((current) =>
          current?.id === event.serverId
            ? {
                ...current,
                channels: current.channels.filter(
                  (item) => item.id !== event.channelId,
                ),
              }
            : current,
        );
      }
      if (event.type === "server.updated") {
        if (selectedServer?.id === event.serverId)
          api.server(event.serverId).then(result => setMembers(result.members || [])).catch(error => setNotice(error.message));
        setServers((current) =>
          current.map((server) =>
            server.id === event.serverId
              ? { ...server, ...event.server }
              : server,
          ),
        );
        setSelectedServer((current) =>
          current?.id === event.serverId
            ? { ...current, ...event.server }
            : current,
        );
      }
      if (event.type === "member.joined" && selectedServerRef.current?.id === event.serverId) {
        setMembers((current) => {
          const existing = current.find((member) => member.id === event.member.id);
          return existing
            ? current.map((member) => member.id === event.member.id ? { ...member, ...event.member } : member)
            : [...current, event.member];
        });
      }
      if (event.type === "user.updated") {
        setMessages((current) =>
          current.map((message) =>
            message.author.id === event.user.id
              ? { ...message, author: event.user }
              : message,
          ),
        );
        setMembers((current) =>
          current.map((member) =>
            member.id === event.user.id
              ? {
                  ...member,
                  ...event.user,
                }
              : member,
          ),
        );
        // User updates are broadcast to all connected people. Only the
        // matching event may refresh this browser's authenticated session.
        if (event.user.id === currentUser.id) onUserUpdate(event.user);
        setProfileData(current => current?.user?.id === event.user.id ? {...current,user:{...current.user,...event.user}} : current);
      }
      if (event.type === "friends.updated")
        api
          .friends()
          .then(setFriendsData)
          .catch(() => {});
      if (event.type === "presence.updated")
        setPresenceMap((current) => ({
          ...current,
          [event.userId]: event.presence,
        }));
      if (event.type === "voice.state")
        setVoiceStates((current) => ({
          ...current,
          [event.channelId]: event.participants,
        }));
      if (event.type === "voice.participants") {
        if (event.channelId !== voiceChannel?.id) return;
        setVoiceParticipants(event.participants);
        if (!voiceActiveRef.current) return;
        for (const participant of event.participants)
          if (
            participant.id !== currentUser.id &&
            currentUser.id < participant.id &&
            !peersRef.current.has(participant.id)
          )
            await createPeer(participant.id, true);
        for (const peerId of [...peersRef.current.keys()])
          if (
            !event.participants.some((participant) => participant.id === peerId)
          ) {
            peersRef.current.get(peerId)?.close();
            peersRef.current.delete(peerId);
            setRemoteVideos((current) => {
              const next = { ...current };
              delete next[peerId];
              return next;
            });
          }
      }
      if (event.type === "voice.offer" && voiceActiveRef.current) {
        const peer = await createPeer(event.fromUserId, false);
        await peer.setRemoteDescription(event.offer);
        await flushPendingIceCandidates(event.fromUserId, peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current?.send({
          type: "voice.answer",
          targetUserId: event.fromUserId,
          answer,
        });
      }
      if (event.type === "voice.answer") {
        const peer = peersRef.current.get(event.fromUserId);
        if (peer) {
          await peer.setRemoteDescription(event.answer);
          await flushPendingIceCandidates(event.fromUserId, peer);
        }
      }
      if (event.type === "voice.ice" && event.candidate) {
        const peer = peersRef.current.get(event.fromUserId);
        if (peer?.remoteDescription?.type) {
          try {
            await peer.addIceCandidate(event.candidate);
          } catch {
            /* candidate no longer applies to this peer */
          }
        } else {
          const queued = pendingIceCandidatesRef.current.get(event.fromUserId) || [];
          pendingIceCandidatesRef.current.set(event.fromUserId, [...queued, event.candidate]);
        }
      }
    };
  useEffect(() => {
    const connection = connectSocket(event => socketHandlerRef.current(event));
    socketRef.current = connection;
    return () => { connection.close(); socketRef.current = null; };
  }, []);
  useEffect(() => {
    if (!contextMenu && !messageMenu && !serverContextMenu && !badgeMenu) return;
    const close = () => {
      setContextMenu(null);
      setMessageMenu(null);
      setServerContextMenu(null);
      setBadgeMenu(null);
    };
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu, messageMenu, serverContextMenu, badgeMenu]);
  async function flushPendingIceCandidates(peerId, peer) {
    const candidates = pendingIceCandidatesRef.current.get(peerId) || [];
    pendingIceCandidatesRef.current.delete(peerId);
    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        /* candidate no longer applies to this peer */
      }
    }
  }
  async function createPeer(targetUserId, initiator) {
    if (peersRef.current.has(targetUserId))
      return peersRef.current.get(targetUserId);
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    localStreamRef.current
      ?.getTracks()
      .forEach((track) => peer.addTrack(track, localStreamRef.current));
    const videoTransceiver = peer.addTransceiver("video", {
      direction: "sendrecv",
    });
    const activeVideoTrack =
      screenTrackRef.current || camTrackRef.current || null;
    if (activeVideoTrack)
      await videoTransceiver.sender.replaceTrack(activeVideoTrack);
    peer.onicecandidate = (event) => {
      if (event.candidate)
        socketRef.current?.send({
          type: "voice.ice",
          targetUserId,
          candidate: event.candidate,
        });
    };
    peer.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      if (event.track.kind === "video") {
        const showRemoteVideo = () =>
          setRemoteVideos((current) => ({
            ...current,
            [targetUserId]: stream,
          }));
        showRemoteVideo();
        event.track.onunmute = showRemoteVideo;
        event.track.onmute = () =>
          setRemoteVideos((current) => {
            const next = { ...current };
            delete next[targetUserId];
            return next;
          });
        event.track.onended = () =>
          setRemoteVideos((current) => {
            const next = { ...current };
            delete next[targetUserId];
            return next;
          });
      } else {
        const audio = audioRefs.current.get(targetUserId) || new Audio();
        audio.autoplay = true;
        audio.muted = deafenedRef.current || locallyMutedUsersRef.current.has(targetUserId);
        audio.volume = Number(localStorage.getItem("sesh_output_volume") || 80) / 100;
        audio.srcObject = stream;
        audio.play().catch(() => {});
        const outputDevice = localStorage.getItem("sesh_audio_output");
        if (outputDevice && typeof audio.setSinkId === "function")
          audio.setSinkId(outputDevice).catch(() => {});
        audioRefs.current.set(targetUserId, audio);
        attachAnalyser(targetUserId, stream);
      }
    };
    peersRef.current.set(targetUserId, peer);
    if (initiator) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current?.send({ type: "voice.offer", targetUserId, offer });
    }
    return peer;
  }
  function playUiSound(kind) {
    if (localStorage.getItem("sesh_ui_sounds") === "off" || localStorage.getItem("sesh_sound_enabled") === "false") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const audio = new AudioContextClass();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = kind === "mention" ? 880 : kind === "connect" ? 660 : kind === "disconnect" ? 330 : 220;
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, audio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.16);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.17);
      oscillator.onended = () => audio.close();
    } catch {}
  }
  async function joinVoice(targetChannel) {
    const target =
      targetChannel && targetChannel.type ? targetChannel : selectedChannel;
    if (!target || target.type !== "voice") return;
    if (voiceConnected) {
      if (voiceChannel?.id === target.id) return;
      socketRef.current?.send({
        type: "voice.leave",
        channelId: voiceChannel.id,
      });
      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
      audioRefs.current.forEach((audio) => {
        audio.srcObject = null;
      });
      audioRefs.current.clear();
      pendingIceCandidatesRef.current.clear();
      stopAnalysers();
    }
    if (!localStreamRef.current) {
      try {
        const audioInput = localStorage.getItem("sesh_audio_input");
        localStreamRef.current = await microphone();
      } catch {
        setNotice("Você entrou no modo escuta (sem microfone detectado).");
      }
    }
    voiceActiveRef.current = true;
    attachAnalyser(currentUser.id, localStreamRef.current);
    setVoiceChannel(target);
    setVoiceConnected(true);
    socketRef.current?.send({ type: "voice.join", channelId: target.id });
    startSpeakingLoop();
    playUiSound("connect");
  }
  function leaveVoice() {
    if (!voiceActiveRef.current) return;
    playUiSound("disconnect");
    if (voiceChannel) socketRef.current?.send({ type: "voice.leave", channelId: voiceChannel.id });
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    audioRefs.current.forEach((audio) => {
      audio.srcObject = null;
    });
    audioRefs.current.clear();
    pendingIceCandidatesRef.current.clear();
    stopAnalysers();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    camTrackRef.current?.stop();
    camTrackRef.current = null;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    voiceActiveRef.current = false;
    setVoiceConnected(false);
    setVoiceChannel(null);
    setMuted(false);
    setDeafened(false);
    deafenedRef.current = false;
    setCamOn(false);
    setScreenOn(false);
    setVoiceParticipants([]);
    setRemoteVideos({});
    setFocusedVideoId(null);
  }
  function toggleMute() {
    if (!voiceConnected)
      return setNotice("Entre em uma chamada para usar o microfone.");
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }
  function toggleDeafen() {
    if (!voiceConnected)
      return setNotice("Entre em uma chamada para usar o áudio.");
    const next = !deafened;
    deafenedRef.current = next;
    audioRefs.current.forEach((audio, userId) => {
      audio.muted = next || locallyMutedUsersRef.current.has(userId);
    });
    setDeafened(next);
  }
  function toggleMemberAudio(userId) {
    const next = new Set(locallyMutedUsersRef.current);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    locallyMutedUsersRef.current = next;
    const audio = audioRefs.current.get(userId);
    if (audio) audio.muted = deafenedRef.current || next.has(userId);
    setLocallyMutedUsers(next);
    setBadgeMenu((current) => current?.user?.id === userId
      ? { ...current, locallyMuted: next.has(userId) }
      : current);
  }
  async function replaceVideoTrack(track) {
    for (const [, peer] of peersRef.current) {
      const transceiver = peer
        .getTransceivers()
        .find((item) => item.receiver?.track?.kind === "video");
      if (transceiver) await transceiver.sender.replaceTrack(track);
      else if (track) peer.addTrack(track, new MediaStream([track]));
    }
  }
  async function toggleCam() {
    if (!voiceConnected) return setNotice("Entre em uma chamada primeiro.");
    if (camOn) {
      if (camTrackRef.current) camTrackRef.current.onended = null;
      camTrackRef.current?.stop();
      camTrackRef.current = null;
      setCamOn(false);
      if (!screenTrackRef.current) await replaceVideoTrack(null);
      return;
    }
    try {
      const videoInput = localStorage.getItem("sesh_video_input");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...(videoInput ? { deviceId: { exact: videoInput } } : {}),
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      });
      camTrackRef.current = stream.getVideoTracks()[0];
      camTrackRef.current.onended = async () => {
        camTrackRef.current = null;
        setCamOn(false);
        if (!screenTrackRef.current) await replaceVideoTrack(null);
      };
      setCamOn(true);
      if (!screenTrackRef.current) await replaceVideoTrack(camTrackRef.current);
    } catch {
      setNotice("Não foi possível acessar a câmera.");
    }
  }
  async function toggleScreen() {
    if (!voiceConnected) return setNotice("Entre em uma chamada primeiro.");
    if (screenOn) {
      if (screenTrackRef.current) screenTrackRef.current.onended = null;
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      setScreenOn(false);
      await replaceVideoTrack(camTrackRef.current || null);
      return;
    }
    try {
      if (!navigator.mediaDevices?.getDisplayMedia)
        return setNotice(
          "Este ambiente não oferece compartilhamento de tela. Use Chrome, Edge ou o app desktop.",
        );
      const stream = await navigator.mediaDevices.getDisplayMedia({
video: { frameRate: { ideal: 30, max: 30 }, height: { ideal: Number(localStorage.getItem("sesh_screen_quality") || 720) } },
        audio: false,
      });
      screenTrackRef.current = stream.getVideoTracks()[0];
      if (!screenTrackRef.current)
        throw new Error("Nenhuma tela foi selecionada.");
      screenTrackRef.current.onended = async () => {
        screenTrackRef.current = null;
        setScreenOn(false);
        await replaceVideoTrack(camTrackRef.current || null);
      };
      setScreenOn(true);
      await replaceVideoTrack(screenTrackRef.current);
    } catch (error) {
      setNotice(
        error?.name === "NotAllowedError"
          ? "Compartilhamento de tela cancelado."
          : "Não foi possível iniciar o compartilhamento de tela.",
      );
    }
  }
  function videoStreamFor(participant) {
    return participant.id === currentUser.id
      ? localVideoStream
      : remoteVideos[participant.id] || null;
  }
  async function toggleVideoFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (event.type === "connection.latency") {
        const samples = [...voiceLatencySamplesRef.current, event.rtt].slice(-12);
        voiceLatencySamplesRef.current = samples;
        setVoiceLatency({ last: event.rtt, average: Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length), samples: samples.length });
        return;
      }
      const viewer = document.querySelector(".voice-focus-panel");
      if (viewer?.requestFullscreen) await viewer.requestFullscreen();
      else setNotice("Tela cheia não está disponível neste ambiente.");
    } catch {
      setNotice("Não foi possível ativar o modo tela cheia.");
    }
  }
  function attachAnalyser(userId, stream) {
    if (!stream) return;
    try {
      audioCtxRef.current ||= new (window.AudioContext ||
        window.webkitAudioContext)();
      audioCtxRef.current.resume?.();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = .72;
      source.connect(analyser);
      analysersRef.current.set(userId, {
        source,
        analyser,
        data: new Uint8Array(analyser.fftSize),
        vad: {},
      });
    } catch {
      /* sem áudio analisável */
    }
  }
  function stopAnalysers() {
    analysersRef.current.forEach((item) => {
      try {
        item.source.disconnect();
      } catch {
        /* já desconectado */
      }
    });
    analysersRef.current.clear();
    speakingRef.current = {};
    setSpeaking({});
  }
  function startSpeakingLoop() {
    const tick = () => {
      if (!voiceActiveRef.current) return;
      const next = {};
      const now = performance.now();
      analysersRef.current.forEach((item, userId) => {
        item.analyser.getByteTimeDomainData(item.data);
        item.vad = updateVoiceActivity(item.vad, item.data, now);
        if (item.vad.speaking) next[userId] = true;
      });
      const prev = speakingRef.current;
      const changed =
        Object.keys(next).some((key) => !prev[key]) ||
        Object.keys(prev).some((key) => !next[key]);
      if (changed) {
        speakingRef.current = next;
        setSpeaking(next);
      }
      setTimeout(tick, 50);
    };
    tick();
  }
  const memberRoleById = useMemo(
    () => new Map(members.map((member) => [member.id, member.serverRole])),
    [members],
  );
  const filteredMessages = useMemo(() => {
    const visible = pinnedOnly ? messages.filter((message) => message.pinnedAt) : messages;
    if (!search.trim()) return visible;
    return visible.filter(
      (message) =>
        String(message.content || "").toLowerCase().includes(search.toLowerCase()) ||
        String(message.author?.displayName || "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [messages, search, pinnedOnly]);
  useEffect(() => {
    const list = messagesListRef.current;
    const channelId = selectedChannel?.id || null;
    if (!list) {
      messageChannelRef.current = channelId;
      return;
    }
    const channelChanged = messageChannelRef.current !== channelId;
    const newest = messages[messages.length - 1];
    if (channelChanged || autoScrollMessagesRef.current || newest?.author?.id === currentUser.id) {
      requestAnimationFrame(() => {
        list.scrollTo({ top: list.scrollHeight, behavior: channelChanged ? "auto" : "smooth" });
        autoScrollMessagesRef.current = true;
      });
    }
    messageChannelRef.current = channelId;
  }, [messages.length, selectedChannel?.id, currentUser.id]);
  const orderedChannels = useMemo(() => {
    if (!selectedServer) return [];
    return [...selectedServer.channels].sort(
      (a, b) =>
        Number(pinnedChannels.includes(b.id)) -
          Number(pinnedChannels.includes(a.id)) || a.position - b.position,
    );
  }, [selectedServer, pinnedChannels]);
  const memberGroups = useMemo(() => {
    const roles = [...(selectedServer?.roles || [])]
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    const ownerId = selectedServer?.ownerId;
    const ownerRoleId = members.find((member) => member.id === ownerId)?.roleId;
    const ownerFirst = (items) => [...items].sort(
      (a, b) => Number(b.id === ownerId) - Number(a.id === ownerId),
    );
    const separated = roles.filter((role) => role.hoist || role.id === ownerRoleId);
    const groups = separated
      .map((role) => ({ role, members: ownerFirst(members.filter((member) => member.roleId === role.id)) }))
      .filter((group) => group.members.length);
    const separatedIds = new Set(separated.map((role) => role.id));
    const remaining = ownerFirst(members.filter((member) => !separatedIds.has(member.roleId)));
    if (remaining.length) groups.push({ role: null, members: remaining });
    groups.sort((a, b) => Number(b.members.some((member) => member.id === ownerId)) - Number(a.members.some((member) => member.id === ownerId)));
    return groups;
  }, [members, selectedServer?.ownerId, selectedServer?.roles]);
  const isOwner = selectedServer?.role === "owner";
  const canManageChannels = isOwner || selectedServer?.permissions?.manageChannels;
  const canManageSettings = isOwner || selectedServer?.permissions?.manageRoles || selectedServer?.permissions?.manageServer;
  const canManageMessages = isOwner || selectedServer?.permissions?.manageMessages;
  const canPinMessages = isOwner || selectedServer?.permissions?.pinMessages;
  function saveList(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function toggleChannelFlag(list, setList, key, channelId) {
    const next = list.includes(channelId)
      ? list.filter((item) => item !== channelId)
      : [...list, channelId];
    setList(next);
    saveList(key, next);
  }
  function copyText(text, successMessage = "Copiado para a área de transferência.") {
    navigator.clipboard
      ?.writeText(text)
      .then(() => setNotice(successMessage))
      .catch(() => setNotice("Não foi possível copiar."));
  }
  function openMessageMenu(event, message) {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget?.getBoundingClientRect?.();
    const x = event.clientX || rect?.right || window.innerWidth / 2;
    const y = event.clientY || rect?.bottom || window.innerHeight / 2;
    setContextMenu(null);
    setBadgeMenu(null);
    setMessageMenu({
      x: Math.max(8, Math.min(x, window.innerWidth - 288)),
      y: Math.max(8, Math.min(y, window.innerHeight - 540)),
      message,
      reactionsOpen: false,
      forwardOpen: false,
    });
  }
  function replaceMessage(updated) {
    setMessages((current) => current.map((message) => message.id === updated.id ? updated : message));
    setMessageMenu((current) => current?.message.id === updated.id ? { ...current, message: updated } : current);
  }
  async function reactToMessage(message, emoji) {
    try {
      const result = await api.reactToMessage(message.channelId, message.id, emoji);
      replaceMessage(result.message);
    } catch (error) {
      setNotice(error.message);
    }
  }
  function replyToMessage(message) {
    setReplyingTo(message);
    setMessageMenu(null);
    requestAnimationFrame(() => composerInputRef.current?.focus());
  }
  async function editMessage(message, content) {
    try {
      const result = await api.updateMessage(message.channelId, message.id, { content });
      replaceMessage(result.message);
      setNotice("Mensagem editada.");
    } catch (error) {
      setNotice(error.message);
    }
  }
  async function togglePinnedMessage(message) {
    const pinning = !message.pinnedAt;
    const optimistic = {
      ...message,
      pinnedAt: pinning ? new Date().toISOString() : null,
      pinnedBy: pinning ? currentUser.id : null,
    };
    replaceMessage(optimistic);
    setMessageMenu(null);
    try {
      const result = await api.updateMessage(message.channelId, message.id, { pinned: pinning });
      replaceMessage(result.message);
      setNotice(pinning ? "Mensagem fixada." : "Mensagem desafixada.");
    } catch (error) {
      replaceMessage(message);
      setNotice(error.message);
    }
  }
  function markMessageUnread(message) {
    setUnreadMarkers((current) => {
      const next = { ...current, [message.channelId]: message.id };
      localStorage.setItem("sesh_unread_messages", JSON.stringify(next));
      return next;
    });
    setMessageMenu(null);
    setNotice("Mensagem marcada como não lida.");
  }
  function clearChannelUnread(channelId) {
    setUnreadMarkers((current) => {
      if (!current[channelId]) return current;
      const next = { ...current };
      delete next[channelId];
      localStorage.setItem("sesh_unread_messages", JSON.stringify(next));
      return next;
    });
  }
  function copyMessageLink(message) {
    const link = new URL("/app", location.origin);
    if (selectedServer?.id) link.searchParams.set("server", selectedServer.id);
    link.searchParams.set("channel", message.channelId);
    link.hash = `message-${message.id}`;
    copyText(link.toString(), "Link da mensagem copiado.");
    setMessageMenu(null);
  }
  function speakMessage(message) {
    setMessageMenu(null);
    if (!("speechSynthesis" in window)) return setNotice("Leitura em voz alta não está disponível neste aparelho.");
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(
      message.content || `Imagem enviada por ${message.author?.displayName || "um membro"}`,
    );
    speech.lang = "pt-BR";
    window.speechSynthesis.speak(speech);
  }
  async function removeMessage(message) {
    if (!window.confirm("Excluir esta mensagem? Esta ação não pode ser desfeita.")) return;
    try {
      await api.deleteMessage(message.channelId, message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setMessageMenu(null);
      setReplyingTo((current) => current?.id === message.id ? null : current);
      setNotice("Mensagem excluída.");
    } catch (error) {
      setNotice(error.message);
    }
  }
  async function reportMessage(message) {
    const reason = window.prompt("Por que você está denunciando esta mensagem?", "Conteúdo inadequado");
    if (reason === null) return;
    try {
      await api.reportMessage(message.channelId, message.id, reason);
      setMessageMenu(null);
      setNotice("Denúncia enviada para a moderação.");
    } catch (error) {
      setNotice(error.message);
    }
  }
  async function forwardMessage(message, channel) {
    try {
      const result = await api.forwardMessage(channel.id, message.id);
      if (selectedChannelRef.current?.id === channel.id)
        setMessages((current) => current.some((item) => item.id === result.message.id) ? current : [...current, result.message]);
      setMessageMenu(null);
      setNotice(`Mensagem encaminhada para #${channel.name}.`);
    } catch (error) {
      setNotice(error.message);
    }
  }
  function jumpToMessage(messageId) {
    setPinnedOnly(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(`message-${messageId}`);
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      target?.classList.add("message-highlight");
      setTimeout(() => target?.classList.remove("message-highlight"), 1400);
    });
  }
  function copyOwnHandle() {
    const publicId = currentUser.publicId || currentUser.id;
    copyText(publicId, `ID ${publicId} copiado.`);
  }
  function copyMemberHandle(user) {
    const publicId = user.publicId || user.id;
    copyText(publicId, `ID ${publicId} copiado.`);
    setBadgeMenu(null);
  }
  async function addFriendFromMenu(user) {
    try {
      const result = await api.addFriend(user.username);
      setNotice(result.accepted ? "Vocês agora são amigos!" : `Convite enviado para @${user.username}.`);
      api.friends().then(setFriendsData).catch(() => {});
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBadgeMenu(null);
    }
  }
  function openMemberMenu(event, user, voiceContext = false) {
    event.preventDefault();
    event.stopPropagation();
    const ownMember = members.find((member) => member.id === currentUser.id);
    const canModerate = Boolean(
      selectedServer &&
        (selectedServer.role === "owner" || ownMember?.serverRole?.permissions?.manageMembers),
    );
    const actorPosition = ownMember?.serverRole?.position ?? 999;
    const targetPosition = user.serverRole?.position ?? members.find(member => member.id === user.id)?.serverRole?.position ?? 999;
    const isSelf = user.id === currentUser.id;
    const mayModerateTarget = canModerate && user.id !== currentUser.id &&
      user.roleId !== "owner" && (selectedServer.role === "owner" || actorPosition < targetPosition);
    const mayAssignSelf = Boolean(isSelf && selectedServer?.role === "owner");
    const assignableRoles = (selectedServer?.roles || []).filter((role) =>
      role.id !== "owner" && (selectedServer.role === "owner" || role.position > actorPosition),
    );
    setBadgeMenu({
      x: Math.min(event.clientX, window.innerWidth - 250),
      y: Math.min(event.clientY, window.innerHeight - 210),
      user,
      currentUserId: currentUser.id,
      canModerate: mayModerateTarget,
      canAssignRole: mayModerateTarget || mayAssignSelf,
      assignableRoles,
      voiceContext,
      locallyMuted: isSelf ? muted : locallyMutedUsers.has(user.id),
      deafened: isSelf ? deafened : false,
      onProfile: () => {
        setProfileView({
          mode: "popover",
          userId: user.id,
          x: Math.max(12, Math.min(event.clientX + 12, window.innerWidth - 332)),
          y: Math.max(12, Math.min(event.clientY - 70, window.innerHeight - 522)),
        });
        setBadgeMenu(null);
      },
    });
  }
  function updateServerPreference(serverId, changes) {
    setServerPreferences((current) => {
      const next = { ...current, [serverId]: { ...current[serverId], ...changes } };
      localStorage.setItem("sesh_server_preferences", JSON.stringify(next));
      return next;
    });
  }
  function askText(title, placeholder, initialValue, callback) {
    setDialog({ title, placeholder, value: initialValue || "", callback });
  }
  function submitDialog() {
    if (!dialog.value.trim()) {
      setDialog({ ...dialog, error: "Digite um nome." });
      return;
    }
    const callback = dialog.callback;
    setDialog(null);
    callback(dialog.value.trim());
  }
  function applyServerChannels(serverId, updater) {
    setServers((current) =>
      current.map((server) =>
        server.id === serverId
          ? { ...server, channels: updater(server.channels) }
          : server,
      ),
    );
    setSelectedServer((current) =>
      current?.id === serverId
        ? { ...current, channels: updater(current.channels) }
        : current,
    );
  }
  function copyInvite(server = selectedServer) {
    const inviteCode = server.inviteCode || server.id;
    const inviteUrl = `${window.location.origin}/app?invite=${encodeURIComponent(inviteCode)}`;
    copyText(inviteUrl, "Link completo do convite copiado.");
  }
  async function customizeInvite(server) {
    if (server.role !== "owner") {
      setNotice("Somente o dono pode personalizar o convite.");
      return;
    }
    const inviteCode = window.prompt("Seu convite personalizado (3 a 32 letras, números ou hífen):", server.inviteCode || "");
    if (inviteCode === null) return;
    try {
      const result = await api.updateServer(server.id, { inviteCode });
      setServers((current) => current.map((item) => item.id === server.id ? { ...item, ...result.server } : item));
      setSelectedServer((current) => current?.id === server.id ? { ...current, ...result.server } : current);
      setNotice(`Convite personalizado: ${result.server.inviteCode}`);
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function leaveServer(server) {
    if (server.role === "owner") {
      setNotice("Transfira a propriedade antes de sair do seu próprio servidor.");
      return;
    }
    if (!window.confirm(`Sair de "${server.name}"?`)) return;
    try {
      await api.leaveServer(server.id);
      setServers((current) => current.filter((item) => item.id !== server.id));
      if (selectedServer?.id === server.id) setSelectedServer(null);
      setServerContextMenu(null);
      setNotice(`Você saiu de "${server.name}".`);
    } catch (err) {
      setNotice(err.message);
    }
  }
  function openProfile(event, userId) {
    event.stopPropagation();
    const width = 320;
    const height = 510;
    const right = event.clientX + 14;
    const x = right + width <= window.innerWidth - 12
      ? right
      : Math.max(12, event.clientX - width - 14);
    setProfileView({
      mode: "popover",
      x,
      y: Math.max(12, Math.min(event.clientY - 70, window.innerHeight - height - 12)),
      userId,
    });
  }
  function presenceFor(userId) {
    for (const list of Object.values(voiceStates))
      if ((list || []).some((participant) => participant.id === userId))
        return "voice";
    if (userId === currentUser.id) {
      if (voiceConnected) return "voice";
      const own = currentUser.status || "online";
      return own === "invisible" ? "offline" : own;
    }
    return (
      presenceMap[userId] ||
      friendsData.friends.find((person) => person.id === userId)?.presence ||
      "offline"
    );
  }
  function cameraActiveFor(participant) {
    return participant.id === currentUser.id
      ? camOn
      : Boolean(participant.camera);
  }
  function screenActiveFor(participant) {
    return participant.id === currentUser.id
      ? screenOn
      : Boolean(participant.screen);
  }
  async function setStatus(status) {
    setStatusMenu(false);
    try {
      const result = await api.updateMe({ status });
      onUserUpdate(result.user);
      setNotice(
        `Status alterado para ${status === "online" ? "Online" : status === "idle" ? "Ausente" : status === "dnd" ? "Não perturbar" : "Invisível"}.`,
      );
    } catch (err) {
      setNotice(err.message);
    }
  }
  function openSettings(tab) {
    const targetTab =
      typeof tab === "string"
        ? tab
        : profileView
          ? "account"
          : "appearance";
    setAccountForm({
      displayName: currentUser.displayName,
      username: currentUser.username,
      bio: currentUser.bio || "",
      badges: currentUser.badges || [],
      avatar: currentUser.avatar,
      banner: currentUser.banner || null,
      email: currentUser.email || "",
      password: "",
    });
    setSettingsTab(targetTab);
    setSettingsOpen(true);
  }
  function openBadgeEditor(user) {
    if (!currentUser.isCreator) return;
    setBadgeMenu(null);
    setBadgeEditor({ user, badges: [...(user.badges || [])] });
  }
  async function saveBadges(badges) {
    if (!badgeEditor) return;
    try {
      const result = await api.updateUserBadges(badgeEditor.user.id, badges);
      setBadgeEditor(null);
      setProfileView(null);
      setNotice("Insígnias atualizadas!");
      if (badgeEditor.user.id === currentUser.id) onUserUpdate(result.user);
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function moderateMember(target, input) {
    if (!selectedServer || !target) return;
    try {
      if (target.id === currentUser.id && input.roleId) {
        const updated = await api.updateServer(selectedServer.id, { memberRoles: { [target.id]: input.roleId } });
        setServers((current) => current.map((server) => server.id === updated.server.id ? { ...server, ...updated.server } : server));
        setSelectedServer((current) => current?.id === updated.server.id ? { ...current, ...updated.server } : current);
        const details = await api.server(selectedServer.id);
        setMembers(details.members || []);
        setNotice("Seu cargo de exibição foi atualizado. Você continua dono do servidor.");
        return;
      }
      const result = await api.moderateMember(selectedServer.id, target.id, input);
      setMembers((current) => current.map((member) =>
        member.id === result.member.id ? { ...member, ...result.member } : member,
      ));
      setNotice(input.roleId
        ? `Cargo de ${result.member.displayName} atualizado.`
        : input.textMuted !== undefined
          ? result.member.textMuted ? "Chat silenciado no servidor." : "Chat liberado."
          : result.member.voiceMuted ? "Voz silenciada no servidor." : "Voz liberada.");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBadgeMenu(null);
    }
  }
  function onAvatarFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024)
      return setNotice("Escolha uma imagem de até 3 MB (GIF funciona!).");
    const reader = new FileReader();
    reader.onload = () =>
      setAccountForm((current) =>
        current ? { ...current, avatar: String(reader.result) } : current,
      );
    reader.readAsDataURL(file);
  }
  function onBannerFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024)
      return setNotice("Escolha uma imagem de até 3 MB (GIF funciona!).");
    const reader = new FileReader();
    reader.onload = () =>
      setAccountForm((current) =>
        current ? { ...current, banner: String(reader.result) } : current,
      );
    reader.readAsDataURL(file);
  }
  function bannerStyle(banner) {
    if (!banner) return undefined;
    return String(banner).startsWith("data:image/")
      ? {
          backgroundImage: `url(${banner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { background: banner };
  }
  async function saveProfile() {
    if (!accountForm) return setNotice("Nada para salvar.");
    try {
      const input = {
        displayName: accountForm.displayName,
        username: accountForm.username,
        bio: accountForm.bio,
        avatar: accountForm.avatar,
        banner: accountForm.banner,
      };
      if (currentUser.isCreator) input.badges = accountForm.badges;
      const result = await api.updateMe(input);
      onUserUpdate(result.user);
      setNotice("Perfil atualizado!");
      setSettingsOpen(false);
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function saveProfileSettings(form) {
    try {
      const input = {
        displayName: form.displayName,
        username: form.username,
        bio: form.bio,
        avatar: form.avatar,
        banner: form.banner,
        bannerPreset: form.bannerPreset, bannerPositionX: form.bannerPositionX, bannerPositionY: form.bannerPositionY,
        effectIntensity: form.effectIntensity, effectSpeed: form.effectSpeed,
        profileOverlay: form.profileOverlay, profilePrimaryColor: form.profilePrimaryColor, profileAccentColor: form.profileAccentColor,
        email: form.email,
        favoriteGame: form.favoriteGame,
        gameInterests: form.gameInterests,
        activityText: form.activityText,
        wishlist: form.wishlist,
        nameStyle: form.nameStyle, nameColor: form.nameColor, nameEffect: form.nameEffect,
        profileTheme: form.profileTheme, profilePlate: form.profilePlate, profileArtEffect: form.profileArtEffect,
        profileEffect: form.profileEffect, avatarFrame: form.avatarFrame,
      };
      if (form.password) input.password = form.password;
      if (currentUser.isCreator) input.badges = form.badges;
      const result = await api.updateMe(input);
      onUserUpdate(result.user);
      setAccountForm(result.user);
      setNotice("Perfil atualizado!");
      return result.user;
    } catch (err) {
      setNotice(err.message);
      throw err;
    }
  }
  async function saveProfileCustomization(values) {
    try {
      const result = await api.updateMe(values);
      onUserUpdate(result.user);
      setAccountForm((current) =>
        current ? { ...current, ...result.user } : result.user,
      );
      setMembers((current) =>
        current.map((member) =>
          member.id === result.user.id ? { ...member, ...result.user } : member,
        ),
      );
      if (values.nameStyle)
        localStorage.setItem("sesh_name_style", values.nameStyle);
      if (values.nameEffect)
        localStorage.setItem("sesh_name_effect", values.nameEffect);
      if (values.nameColor)
        localStorage.setItem("sesh_name_color", values.nameColor);
      setNotice("Personalização aplicada!");
      return result.user;
    } catch (err) {
      setNotice(err.message);
      throw err;
    }
  }
  function openVoiceFromProfile(voice) {
    const found = servers
      .map((server) => ({
        server,
        channel: server.channels.find((item) => item.id === voice.channelId),
      }))
      .find((item) => item.channel);
    if (!found) return setNotice("Entre no servidor dessa chamada para abrir.");
    if (voiceConnected) leaveVoice();
    setSelectedServer(found.server);
    setSelectedChannel(found.channel);
    setProfileView(null);
    joinVoice(found.channel);
  }
  function updateDraft(value) {
    setDraft(value);
    const match = value.match(/(?:^|\s)@([^\s@]*)$/);
    setMentionQuery(match ? match[1] : null);
  }
  function chooseMention(member) {
    setDraft((current) => current.replace(/(^|\s)@[^\s@]*$/, `$1@${member.mention || member.username} `));
    setMentionQuery(null);
    requestAnimationFrame(() => composerInputRef.current?.focus());
  }
  function handleComposerKeyDown(event) {
    if (event.key === "Escape") setMentionQuery(null);
    if (event.key === "Tab" && mentionCandidates.length) {
      event.preventDefault();
      chooseMention(mentionCandidates[0]);
    }
  }
  async function sendMessage(event) {
    event.preventDefault();
    if ((!draft.trim() && !attachment) || !selectedChannel || sendingMessageRef.current || readingAttachment) return;
    sendingMessageRef.current = true;
    const imageCommand = /^\/(?:image|imagem|imagensfw)\s+"[^"\r\n]{1,600}"\s*$/i.test(draft.trim());
    const imageAuthorized = imageCommand && (selectedServer?.ownerId === currentUser.id || Boolean(selectedServer?.permissions?.manageServer));
    if (imageAuthorized) {
      setAiSessionServerId(selectedChannel.serverId);
      setAiGenerating(true);
    }
    const sentChannelId = selectedChannel.id;
    try {
      const result = await api.sendMessage(selectedChannel.id, {
        content: draft.trim(),
        attachment,
        replyToId: replyingTo?.id || null,
      });
      if (selectedChannelRef.current?.id !== sentChannelId) return;
      setMessages((current) =>
        current.some((item) => item.id === result.message.id)
          ? current
          : [...current, result.message],
      );
      setDraft("");
      setAttachment(null);
      setReplyingTo(null);
      if (guideServer === selectedChannel.serverId) dismissGuide();
    } catch (err) {
      setNotice(err.message);
    } finally {
      if (imageAuthorized) setAiGenerating(false);
      sendingMessageRef.current = false;
    }
  }
  async function attachFiles(files) {
    if (!files.length) return;
    if (files.length > 1) return setNotice("Envie um arquivo por mensagem.");
    if (sendingMessageRef.current) return setNotice("Aguarde o envio da mensagem.");
    const attempt=++attachmentRead.current;setReadingAttachment(true);
    try {const file=await readAttachment(files[0]);if(attempt===attachmentRead.current)setAttachment(file);}
    catch(error){if(attempt===attachmentRead.current)setNotice(error.message);}
    finally{if(attempt===attachmentRead.current)setReadingAttachment(false);}
  }
  function onAttachmentFile(event) {
    const files=Array.from(event.target.files||[]);event.target.value="";attachFiles(files);
  }
  function createServer() {
    setServerModal({
      step: "choice",
      name: "",
      icon: null,
      template: null,
      server: null,
      invite: "",
      busy: false,
    });
  }
  function onServerIconFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024)
      return setNotice("Escolha uma imagem válida de até 3 MB.");
    const reader = new FileReader();
    reader.onload = () =>
      setServerModal((current) =>
        current ? { ...current, icon: String(reader.result) } : current,
      );
    reader.readAsDataURL(file);
  }
  async function submitCreateServer() {
    const modal = serverModal;
    if (!modal.name.trim() || modal.busy) return;
    setServerModal({ ...modal, busy: true });
    try {
      const result = await api.createServer(modal.name.trim(), {
        icon: modal.icon,
        template: modal.template,
      });
      localStorage.setItem("sesh_onboarded", "1");
      setServers((current) =>
        current.some((item) => item.id === result.server.id)
          ? current
          : [...current, result.server],
      );
      setServerModal(null);
      setSelectedServer(result.server);
      setGuideServer(result.server.id);
    } catch (err) {
      setNotice(err.message);
      setServerModal({ ...modal, busy: false, error: err.message });
    }
  }
  async function uploadServerIcon(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024)
      return setNotice("Escolha uma imagem válida de até 3 MB.");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await api.updateServer(selectedServer.id, {
          icon: String(reader.result),
        });
        setServers((current) =>
          current.map((item) =>
            item.id === result.server.id
              ? { ...item, icon: result.server.icon }
              : item,
          ),
        );
        setSelectedServer((current) =>
          current?.id === result.server.id
            ? { ...current, icon: result.server.icon }
            : current,
        );
        setNotice("Ícone do servidor atualizado!");
      } catch (err) {
        setNotice(err.message);
      }
    };
    reader.readAsDataURL(file);
  }
  async function saveServerSettings(values) {
    const result = await api.updateServer(selectedServer.id, values);
    setServers((current) =>
      current.map((server) =>
        server.id === result.server.id
          ? { ...server, ...result.server }
          : server,
      ),
    );
    setSelectedServer((current) =>
      current?.id === result.server.id
        ? { ...current, ...result.server }
        : current,
    );
    setNotice("Configurações do servidor atualizadas!");
    const details = await api.server(selectedServer.id);
    setMembers(details.members || []);
    return result.server;
  }
  function dismissGuide() {
    if (guideServer) localStorage.setItem(`sesh_guide_${guideServer}`, "1");
    setGuideServer(null);
  }
  async function submitJoinServer() {
    const modal = serverModal;
    const inviteValue = String(modal?.invite || "").trim();
    let decodedInvite = inviteValue;
    try {
      decodedInvite = decodeURIComponent(inviteValue);
    } catch {
      // Mantem o texto original quando o link tem escape invalido.
    }
    const invite =
      decodedInvite.match(/[?&]invite=([^&#/]+)/i)?.[1] ||
      decodedInvite.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)?.[0] ||
      decodedInvite.replace(/[?#].*$/, "").split("/").filter(Boolean).at(-1) ||
      "";
    if (!invite || modal.busy) return;
    setServerModal({ ...modal, busy: true });
    try {
      const result = await api.joinServer(invite);
      localStorage.setItem("sesh_onboarded", "1");
      setServers((current) =>
        current.some((item) => item.id === result.server.id)
          ? current
          : [...current, result.server],
      );
      setSelectedServer(result.server);
      setServerModal(null);
      setNotice(`Você entrou em "${result.server.name}".`);
    } catch (err) {
      setNotice(err.message);
      setServerModal({ ...modal, busy: false, error: err.message });
    }
  }
  function skipOnboard() {
    localStorage.setItem("sesh_onboarded", "1");
    setOnboardOpen(false);
  }
  async function submitAddFriend(event) {
    event.preventDefault();
    if (!addFriendValue.trim()) return;
    try {
      const result = await api.addFriend(
        addFriendValue.trim().replace(/^@/, ""),
      );
      setNotice(
        result.accepted
          ? "Vocês agora são amigos!"
          : `Convite enviado para @${addFriendValue.trim().replace(/^@/, "")}.`,
      );
      setAddFriendValue("");
      api
        .friends()
        .then(setFriendsData)
        .catch(() => {});
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function acceptFriendRequest(friendshipId) {
    try {
      await api.acceptFriend(friendshipId);
      api
        .friends()
        .then(setFriendsData)
        .catch(() => {});
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function removeFriendRow(friendshipId) {
    try {
      await api.removeFriend(friendshipId);
      api
        .friends()
        .then(setFriendsData)
        .catch(() => {});
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function createChannel(preType = "text") {
    if (!selectedServer) return;
    if (!canManageChannels)
      return setNotice("Seu cargo não pode criar canais.");
    setChannelModal({ type: preType, name: "", private: false });
  }
  async function submitChannelModal() {
    const modal = channelModal;
    const name = modal.name.trim();
    if (!name) return;
    await addChannel(name, modal.type);
    setChannelModal(null);
  }
  async function addChannel(name, type) {
    if (!selectedServer || !name?.trim()) return;
    try {
      const result = await api.createChannel(selectedServer.id, {
        name: name.trim(),
        type,
      });
      applyServerChannels(selectedServer.id, (channels) => [
        ...channels,
        result.channel,
      ]);
      setSelectedChannel(result.channel);
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function editChannel(channel, name) {
    try {
      const result = await api.updateChannel(channel.id, { name });
      applyServerChannels(channel.serverId, (channels) =>
        channels.map((item) =>
          item.id === channel.id ? result.channel : item,
        ),
      );
      setSelectedChannel((current) =>
        current?.id === channel.id ? result.channel : current,
      );
      setNotice("Canal atualizado.");
    } catch (err) {
      setNotice(err.message);
    }
  }
  async function removeChannel(channel) {
    try {
      await api.deleteChannel(channel.id);
      applyServerChannels(channel.serverId, (channels) =>
        channels.filter((item) => item.id !== channel.id),
      );
      if (selectedChannel?.id === channel.id) {
        const remaining = selectedServer.channels.filter(
          (item) => item.id !== channel.id,
        );
        setSelectedChannel(
          remaining.find((item) => item.type === "text") ||
            remaining[0] ||
            null,
        );
      }
      setNotice("Canal excluído.");
    } catch (err) {
      setNotice(err.message);
    }
  }
  const listFriends = friendsData.friends.filter(
    (person) =>
      (homeTab === "online" ? person.presence !== "offline" : true) &&
      (!friendQuery.trim() ||
        person.displayName.toLowerCase().includes(friendQuery.toLowerCase()) ||
        person.username.includes(friendQuery.toLowerCase())),
  );
  const activeNow = friendsData.friends.filter(
    (person) => person.presence === "voice" || person.presence === "online",
  );
  const statusMenuEl = () => (
    <div className="quick-profile" role="dialog" aria-label="Meu perfil rápido" onClick={event=>event.stopPropagation()}>
      <ProfileCard user={currentUser} Avatar={Avatar} ProfileEffectLayer={ProfileEffectLayer} renderBadges={ProfileBadges} presence={presenceFor(currentUser.id)}/>
      {voiceConnected&&voiceChannel&&<div className="quick-voice"><strong>Em voz · {voiceChannel.name}</strong><button onClick={()=>{setStatusMenu(false);openVoiceFromProfile({channelId:voiceChannel.id,channelName:voiceChannel.name});}}>Abrir chamada de voz</button></div>}
      <div className="quick-profile-actions">
        <button onClick={()=>{setStatusMenu(false);openSettings("account");}}><Settings size={16}/>Editar perfil e banner</button>
        <button onClick={()=>{setStatusMenu(false);setProfileView({mode:"full",userId:currentUser.id});}}><Eye size={16}/>Ver perfil completo</button>
        <button onClick={copyOwnHandle}>Copiar meu ID</button>
      </div>
      <details><summary>Status · {({online:"Disponível",idle:"Ausente",dnd:"Não perturbar",invisible:"Invisível"})[currentUser.status||"online"]}</summary>
      {[["online","Disponível"],["idle","Ausente"],["dnd","Não perturbar"],["invisible","Invisível"]].map(([value,label])=><button key={value} className="status-row" onClick={()=>setStatus(value)}><span className={"presence-dot presence-dot-menu presence-"+(value==="invisible"?"offline":value)}/>{label}</button>)}</details>
      <div className="quick-profile-actions"><button onClick={()=>{setStatusMenu(false);onLogout();}}><LogOut size={16}/>Sair da conta</button></div>
    </div>
  );
  const guideActive =
    guideServer === selectedServer?.id &&
    !localStorage.getItem(`sesh_guide_${selectedServer?.id}`);
  const profileLayer = profileView?.mode === "full"
    ? <ProfileDialog key={profileView.userId} data={profileData} currentUser={currentUser}
        onClose={() => setProfileView(null)}
        onRetry={() => { setProfileData("loading"); api.profile(profileView.userId).then(setProfileData).catch(err => setProfileData({error:err.message})); }}
        onEdit={() => {setProfileView(null); openSettings("account");}}
        onMessage={user => {setProfileView(null);setSelectedServer(null);setHomeTab("dm:"+user.id);}}
        onAddFriend={addFriendFromMenu} onVoice={openVoiceFromProfile}
        Avatar={Avatar} ProfileEffectLayer={ProfileEffectLayer} renderBadges={ProfileBadges}
        presence={presenceFor(profileView.userId)}
        isFriend={friendsData.friends.some(user => user.id === profileView.userId)}
        serverRole={members.find(user => user.id === profileView.userId)?.serverRole}/>
    : profileView
      ? <MemberProfilePopover key={profileView.userId} data={profileData} currentUser={currentUser}
          position={profileView} onClose={() => setProfileView(null)}
          onRetry={() => { setProfileData("loading"); api.profile(profileView.userId).then(setProfileData).catch(err => setProfileData({error:err.message})); }}
          onEdit={() => {setProfileView(null); openSettings("account");}}
          onMessage={user => {setProfileView(null);setSelectedServer(null);setHomeTab("dm:"+user.id);}}
          onAddFriend={addFriendFromMenu}
          onFull={() => setProfileView(current => current ? {...current, mode:"full"} : current)}
          Avatar={Avatar} ProfileEffectLayer={ProfileEffectLayer} renderBadges={ProfileBadges}
          presence={presenceFor(profileView.userId)}
          isFriend={friendsData.friends.some(user => user.id === profileView.userId)}
          serverRole={members.find(user => user.id === profileView.userId)?.serverRole}/>
      : null;
  const overlays = (
    <>
      {profileLayer}
      {serverSettingsOpen && selectedServer && (
        <ServerSettingsPanel
          server={selectedServer}
          members={members}
          onClose={() => setServerSettingsOpen(false)}
          onSave={saveServerSettings}
        />
      )}
      {settingsOpen && settingsTab === "appearance" && (
        <VoiceSettingsPanel
          user={currentUser}
          onClose={() => setSettingsOpen(false)}
          onAccount={() => setSettingsTab("account")}
          onLogout={onLogout}
        />
      )}
      {settingsOpen && settingsTab === "account" && accountForm && (
        <ProfileSettingsPanel
          user={{ ...currentUser, ...accountForm }}
          onClose={() => setSettingsOpen(false)}
          onPrivacy={() => setSettingsTab("appearance")}
          onSave={saveProfileSettings}
          onCustomize={saveProfileCustomization}
          catalogItems={catalogItems}
        />
      )}
      {dialog && !selectedServer && (
        <div className="modal-backdrop" onClick={() => setDialog(null)}>
          <section
            className="prompt-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{dialog.title}</h3>
            <input
              autoFocus
              value={dialog.value}
              placeholder={dialog.placeholder}
              onChange={(event) =>
                setDialog({ ...dialog, value: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") submitDialog();
                if (event.key === "Escape") setDialog(null);
              }}
            />
            {dialog.error && <div className="form-error">{dialog.error}</div>}
            <div className="prompt-actions">
              <button className="prompt-cancel" onClick={() => setDialog(null)}>
                Cancelar
              </button>
              <button className="prompt-confirm" onClick={submitDialog}>
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}
      {notice && !selectedServer && (
        <button className="notice" onClick={() => setNotice("")}>
          {notice}
        </button>
      )}
      {false && settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <section
            className="settings-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSettingsOpen(false)}
            >
              <X size={18} />
            </button>
            <div className="settings-nav">
              <strong>Configurações</strong>
              <button
                className={
                  settingsTab === "account" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("account")}
              >
                Minha conta
              </button>
              <button
                className={
                  settingsTab === "appearance" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("appearance")}
              >
                Aparência
              </button>
              <button
                className={
                  settingsTab === "notifications" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("notifications")}
              >
                Notificações
              </button>
              <button
                className={
                  settingsTab === "privacy" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("privacy")}
              >
                Privacidade
              </button>
              <button className="settings-logout" onClick={onLogout}>
                Sair da conta
              </button>
            </div>
            <div className="settings-content">
              {settingsTab === "account" && accountForm && (
                <>
                  <h2>Minha conta</h2>
                  <div className="account-card">
                    <Avatar
                      user={{ ...currentUser, avatar: accountForm.avatar }}
                      color="purple"
                    />
                    <div>
                      <strong>
                        {accountForm.displayName || currentUser.displayName}
                      </strong>
                      <span>
                        {accountForm.username || currentUser.username}
                      </span>
                    </div>
                  </div>
                  <div className="account-actions">
                    <label className="avatar-upload">
                      Trocar foto / GIF
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onAvatarFile}
                      />
                    </label>
                    {accountForm.avatar && (
                      <button
                        className="secondary-setting"
                        onClick={() =>
                          setAccountForm({ ...accountForm, avatar: null })
                        }
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                  <div className="banner-editor">
                    <div className="account-actions">
                      <label className="avatar-upload">
                        Banner do perfil (imagem, GIF ou cor)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onBannerFile}
                        />
                      </label>
                      {accountForm.banner && (
                        <button
                          className="secondary-setting"
                          onClick={() =>
                            setAccountForm({ ...accountForm, banner: null })
                          }
                        >
                          Remover banner
                        </button>
                      )}
                    </div>
                    {accountForm.banner && (
                      <div
                        className="banner-preview"
                        style={bannerStyle(accountForm.banner)}
                      />
                    )}
                    <div className="banner-swatches">
                      {[
                        "#5865f2",
                        "#23a55a",
                        "#e4ad51",
                        "#b24e64",
                        "#7661e9",
                        "#eb459e",
                        "#1a1a1a",
                      ].map((color) => (
                        <button
                          type="button"
                          key={color}
                          className={`banner-swatch ${accountForm.banner === color ? "banner-swatch-on" : ""}`}
                          style={{ background: color }}
                          title={color}
                          onClick={() =>
                            setAccountForm({ ...accountForm, banner: color })
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <label>
                    Nome de exibição
                    <input
                      value={accountForm.displayName}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          displayName: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Nome de usuário
                    <input
                      value={accountForm.username}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          username: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Bio
                    <input
                      value={accountForm.bio}
                      placeholder="Fale um pouco sobre você"
                      maxLength={300}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          bio: event.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="badge-picker-title">Insígnias do perfil</div>
                  <div className="badge-picker">
                    {Object.entries(BADGES).map(([key, badge]) => (
                      <label className="setting-check" key={key}>
                        <input
                          type="checkbox"
                          disabled={!currentUser.isCreator}
                          checked={accountForm.badges.includes(key)}
                          onChange={(event) =>
                            setAccountForm({
                              ...accountForm,
                              badges: event.target.checked
                                ? [...accountForm.badges, key]
                                : accountForm.badges.filter(
                                    (item) => item !== key,
                                  ),
                            })
                          }
                        />{" "}
                        <img
                          className="badge-picker-img"
                          src={badge.image}
                          alt={badge.label}
                        />{" "}
                        {badge.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {settingsTab === "appearance" && (
                <>
                  <h2>Aparência</h2>
                  <label>
                    Tema
                    <select
                      value={theme}
                      onChange={(event) => {
                        setTheme(event.target.value);
                        savePreference("orbit_theme", event.target.value);
                      }}
                    >
                      <option value="dark">Escuro</option>
                      <option value="midnight">Meia-noite</option>
                      <option value="light">Claro</option>
                    </select>
                  </label>
                  <label className="setting-check">
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(event) => {
                        setCompactMode(event.target.checked);
                        savePreference("orbit_compact", event.target.checked);
                      }}
                    />{" "}
                    Interface compacta
                  </label>
                </>
              )}
              {settingsTab === "notifications" && (
                <>
                  <h2>Notificações</h2>
                  <label className="setting-check">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(event) => {
                        setNotifications(event.target.checked);
                        savePreference(
                          "orbit_notifications",
                          event.target.checked,
                        );
                      }}
                    />{" "}
                    Mostrar notificações de novas mensagens
                  </label>
                  <p className="settings-help">
                    As preferências são salvas neste dispositivo.
                  </p>
                </>
              )}
              {settingsTab === "privacy" && (
                <>
                  <h2>Privacidade</h2>
                  <p className="settings-help">
                    Você controla quem pode entrar nos servidores e participar
                    das chamadas através das permissões do servidor.
                  </p>
                  <button
                    className="secondary-setting"
                    onClick={() =>
                      setNotice(
                        "As configurações de privacidade do servidor estão disponíveis para administradores.",
                      )
                    }
                  >
                    Ver permissões
                  </button>
                </>
              )}
              <button className="save-settings" onClick={saveProfile}>
                Salvar alterações
              </button>
            </div>
          </section>
        </div>
      )}
      {serverModal && (
        <div className="modal-backdrop" onClick={() => setServerModal(null)}>
          <section
            className={`channel-modal server-modal wizard ${serverModal.step === "customize" ? "wizard-customize" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="channel-modal-head center">
              <div>
                <h3>
                  {serverModal.step === "purpose"
                    ? "Conte-nos mais sobre o seu servidor"
                    : serverModal.step === "customize"
                      ? "Personalize o seu servidor"
                      : serverModal.step === "invite"
                        ? "Entrar em um servidor"
                        : "Criar seu servidor"}
                </h3>
                <span className="channel-modal-sub">
                  {serverModal.step === "purpose"
                    ? "Para podermos te ajudar com as configurações, seu novo servidor é para alguns amigos ou uma grande comunidade?"
                    : serverModal.step === "customize"
                      ? "Deixe seu novo servidor com a sua cara dando um nome e um ícone a ele. Se quiser, é possível mudar depois."
                      : serverModal.step === "invite"
                        ? "Cole o ID de convite que você recebeu."
                        : "Seu servidor é onde você e seus amigos se reúnem. Crie o seu e comece a interagir."}
                </span>
              </div>
              <button
                className="modal-close"
                onClick={() => setServerModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            {serverModal.step === "choice" && (
              <>
                <button
                  className="wizard-row"
                  onClick={() =>
                    setServerModal({
                      ...serverModal,
                      template: null,
                      step: "purpose",
                    })
                  }
                >
                  <span className="wizard-emoji">🎨</span>
                  <div>
                    <strong>Criar o meu</strong>
                  </div>
                  <ChevronRight size={17} className="wizard-chevron" />
                </button>
                <div className="wizard-label">COMEÇAR DE UM MOLDE</div>
                {[
                  ["gaming", "🎮", "Jogos"],
                  ["friends", "💗", "Amigos"],
                  ["study", "📚", "Grupo de estudos"],
                  ["school", "🎒", "Clube escolar"],
                ].map(([tpl, emoji, label]) => (
                  <button
                    className="wizard-row"
                    key={tpl}
                    onClick={() =>
                      setServerModal({
                        ...serverModal,
                        template: tpl,
                        step: "purpose",
                      })
                    }
                  >
                    <span className="wizard-emoji">{emoji}</span>
                    <div>
                      <strong>{label}</strong>
                    </div>
                    <ChevronRight size={17} className="wizard-chevron" />
                  </button>
                ))}
                <div className="wizard-invite-title">Já tem um convite?</div>
                <button
                  className="wizard-invite-btn"
                  onClick={() =>
                    setServerModal({ ...serverModal, step: "invite", invite: "", error: "" })
                  }
                >
                  Entrar em um servidor
                </button>
              </>
            )}
            {serverModal.step === "purpose" && (
              <>
                <button
                  className="wizard-row"
                  onClick={() =>
                    setServerModal({ ...serverModal, step: "customize" })
                  }
                >
                  <span className="wizard-emoji">👥</span>
                  <div>
                    <strong>Para meus amigos e eu</strong>
                  </div>
                  <ChevronRight size={17} className="wizard-chevron" />
                </button>
                <button
                  className="wizard-row"
                  onClick={() =>
                    setServerModal({ ...serverModal, step: "customize" })
                  }
                >
                  <span className="wizard-emoji">🌍</span>
                  <div>
                    <strong>Para um clube ou comunidade</strong>
                  </div>
                  <ChevronRight size={17} className="wizard-chevron" />
                </button>
                <div className="wizard-skip">
                  Não sabe? Você pode{" "}
                  <button
                    className="wizard-skip-link"
                    onClick={() =>
                      setServerModal({ ...serverModal, step: "customize" })
                    }
                  >
                    pular essa pergunta
                  </button>{" "}
                  por enquanto.
                </div>
                <div className="wizard-footer">
                  <button
                    className="wizard-back"
                    onClick={() =>
                      setServerModal({ ...serverModal, step: "choice" })
                    }
                  >
                    Voltar
                  </button>
                </div>
              </>
            )}
            {serverModal.step === "customize" && (
              <>
                <div className="icon-upload-wrap">
                  <button
                    className="icon-upload"
                    onClick={() =>
                      document.getElementById("wizard-icon-input").click()
                    }
                  >
                    {serverModal.icon ? (
                      <img src={serverModal.icon} alt="" />
                    ) : (
                      <>
                        <Camera size={22} />
                        <span>ENVIAR</span>
                      </>
                    )}
                    <span className="icon-plus">
                      <Plus size={14} />
                    </span>
                  </button>
                  <input
                    id="wizard-icon-input"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onServerIconFile}
                  />
                </div>
                <div className="channel-modal-label left">
                  Nome do servidor <span className="required-star">*</span>
                </div>
                <div className="channel-name-box">
                  <input
                    autoFocus
                    value={serverModal.name}
                    placeholder={`Servidor de ${currentUser.displayName}`}
                    onChange={(event) =>
                      setServerModal({
                        ...serverModal,
                        name: event.target.value,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && serverModal.name.trim())
                        submitCreateServer();
                    }}
                  />
                </div>
                <div className="wizard-footer">
                  <button
                    className="wizard-back"
                    onClick={() =>
                      setServerModal({ ...serverModal, step: "purpose" })
                    }
                  >
                    Voltar
                  </button>
                  <button
                    className="prompt-confirm channel-create"
                    disabled={!serverModal.name.trim() || serverModal.busy}
                    onClick={submitCreateServer}
                  >
                    {serverModal.busy ? "Criando..." : "Criar"}
                  </button>
                </div>
              </>
            )}
            {serverModal.step === "invite" && (
              <>
                <div className="channel-modal-label">Link do convite</div>
                <div className="channel-name-box">
                  <input
                    autoFocus
                    value={serverModal.invite || ""}
                    placeholder="Cole a URL completa do convite aqui"
                    onChange={(event) =>
                      setServerModal({
                        ...serverModal,
                        invite: event.target.value,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && String(serverModal.invite || "").trim())
                        submitJoinServer();
                    }}
                  />
                </div>
                {serverModal.error && <div className="form-error">{serverModal.error}</div>}
                <div className="server-modal-alt">
                  Quer criar um servidor novo?{" "}
                  <button
                    onClick={() =>
                      setServerModal({
                        ...serverModal,
                        step: "choice",
                        invite: "",
                      })
                    }
                  >
                    Criar meu próprio
                  </button>
                </div>
                <div className="channel-modal-actions">
                  <button
                    className="prompt-cancel channel-cancel"
                    onClick={() => setServerModal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="prompt-confirm channel-create"
                    disabled={!String(serverModal.invite || "").trim() || serverModal.busy}
                    onClick={submitJoinServer}
                  >
                    {serverModal.busy ? "Entrando..." : "Entrar no servidor"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      {onboardOpen && (
        <div className="modal-backdrop">
          <section
            className="channel-modal onboard-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <img src="/branding/sesh-logo.gif" alt="" className="onboard-gif" />
            <h3>Bem-vindo ao Sesh!</h3>
            <p className="onboard-sub">
              Crie seu próprio servidor ou entre em um existente com um convite.
              Você também pode pular e explorar por sua conta.
            </p>
            <button
              className="prompt-confirm channel-create onboard-btn"
              onClick={() => {
                setOnboardOpen(false);
                createServer();
              }}
            >
              Criar meu próprio servidor
            </button>
            <button
              className="prompt-cancel channel-cancel onboard-btn"
              onClick={() => {
                setOnboardOpen(false);
                setServerModal({
                  step: "invite",
                  name: "",
                  invite: "",
                  server: null,
                  busy: false,
                });
              }}
            >
              Entrar com um convite
            </button>
            <button className="onboard-skip" onClick={skipOnboard}>
              Pular por enquanto
            </button>
          </section>
        </div>
      )}
      {badgeMenu && (
        <BadgeContextMenu
          menu={badgeMenu}
          onAdd={currentUser.isCreator ? () => openBadgeEditor(badgeMenu.user) : null}
          onModerate={badgeMenu.canModerate ? (input) => moderateMember(badgeMenu.user, input) : null}
          onAssignRole={badgeMenu.canAssignRole ? (roleId) => moderateMember(badgeMenu.user, { roleId }) : null}
          onManageRoles={badgeMenu.user.id === currentUser.id && canManageSettings ? () => {
            setBadgeMenu(null);
            setServerSettingsOpen(true);
          } : null}
          onMention={badgeMenu.user.id === currentUser.id ? null : () => {
            setDraft((current) => (current && !current.endsWith(" ") ? current + " " : current) + "@" + badgeMenu.user.username + " ");
            setBadgeMenu(null);
            requestAnimationFrame(() => composerInputRef.current?.focus());
          }}
          onToggleMute={() => {
            if (badgeMenu.user.id === currentUser.id) {
              toggleMute();
              setBadgeMenu((current) => current ? { ...current, locallyMuted: !current.locallyMuted } : current);
            } else toggleMemberAudio(badgeMenu.user.id);
          }}
          onToggleDeafen={badgeMenu.user.id === currentUser.id ? () => {
            toggleDeafen();
            setBadgeMenu((current) => current ? { ...current, deafened: !current.deafened } : current);
          } : null}
          onEditServerProfile={badgeMenu.user.id === currentUser.id ? () => {
            setBadgeMenu(null);
            openSettings("account");
          } : null}
          onModerator={badgeMenu.canModerate ? () => {
            setBadgeMenu(null);
            setServerSettingsOpen(true);
          } : null}
          onCopyHandle={() => copyMemberHandle(badgeMenu.user)}
          onAddFriend={() => addFriendFromMenu(badgeMenu.user)}
        />
      )}
      {badgeEditor && (
        <BadgeEditor
          user={badgeEditor.user}
          badges={badgeEditor.badges}
          onCancel={() => setBadgeEditor(null)}
          onSave={saveBadges}
        />
      )}
    </>
  );
  if (selectedServer && !selectedChannel)
    return (
      <div className="loading-screen">
        <div className="empty-onboard">
          <h2>Nenhum canal por aqui</h2>
          <p>Este servidor ainda não tem canais. Crie um para começar.</p>
          <button
            className="prompt-confirm"
            onClick={() => createChannel("text")}
          >
            Criar canal de texto
          </button>
        </div>
      </div>
    );
  if (!selectedServer)
    return (
      <div
        className={`app-shell theme-${theme} ${compactMode ? "compact-mode" : ""}`}
      >
        <header className="mobile-header">
          <button
            className="icon-button"
            aria-label={mobileNav ? "Fechar navegação" : "Abrir navegação"}
            aria-expanded={mobileNav}
            onClick={toggleMobileNavigation}
          >
            <Menu size={20} />
          </button>
          <strong>Amigos</strong>
          <button
            className="icon-button"
            aria-label={memberListOpen ? "Fechar membros" : "Abrir membros"}
            aria-expanded={memberListOpen}
            onClick={toggleMemberDrawer}
          >
            <Users size={20} />
          </button>
        </header>
        {mobileNav && <button type="button" className="mobile-drawer-backdrop nav-backdrop" aria-label="Fechar navegação" onClick={() => setMobileNav(false)} />}
        {memberListOpen && <button type="button" className="mobile-drawer-backdrop member-backdrop" aria-label="Fechar membros" onClick={() => setMemberListOpen(false)} />}
        <aside className={`server-rail ${mobileNav ? "mobile-open" : ""}`}>
          <img
            className="brand-mark brand-mark-img brand-home"
            src="/branding/sesh-logo.gif"
            alt="Sesh"
            title="Início"
          />
          <div className="rail-divider" />
          {servers.map((server, index) => (
            <button
              key={server.id}
              className={`server-icon ${colors[index % colors.length]}`}
              onClick={() => {
                setSelectedServer(server);
                setMobileNav(false);
              }}
              title={server.name}
            >
              {server.icon && String(server.icon).startsWith("data:") ? (
                <img src={server.icon} alt="" className="server-icon-img" />
              ) : (
                server.icon || initials(server.name).slice(0, 1)
              )}
            </button>
          ))}
          <button
            className="server-icon add-server"
            onClick={createServer}
            title="Criar servidor"
          >
            <Plus size={21} />
          </button>
        </aside>
        <aside
          className={`channel-sidebar home-sidebar ${mobileNav ? "mobile-open" : ""}`}
        >
          <div className="home-search">
            <Search size={14} />
            <span>Encontre ou comece uma conversa</span>
          </div>
          <button className="home-nav selected">
            <Users size={17} /> Amigos
          </button>
          <div className="section-title" style={{ marginTop: 18 }}>
            <span>MENSAGENS DIRETAS</span>
            <button>
              <Plus size={14} />
            </button>
          </div>
          <div className="home-dm-list">
            {friendsData.friends.length === 0 ? (
              <div className="home-dm-hint">
                Suas conversas diretas aparecerão aqui.
              </div>
            ) : (
              friendsData.friends.map((person) => (
                <button
                  className={"home-dm-row" + (nameplateSrc(person.profilePlate) ? " has-nameplate" : "")}
                  key={person.id}
                  onClick={() => { setHomeTab(`dm:${person.id}`); setMobileNav(false); }}
                >
                  <span className="avatar-dot-wrap">
                    <Avatar
                      user={person}
                      color={person.avatarColor || "purple"}
                      small
                    />
                    <span
                      className={`presence-dot presence-${person.presence}`}
                    />
                  </span>
                  {nameplateSrc(person.profilePlate) && <span className="home-dm-nameplate" aria-hidden="true"><video src={nameplateSrc(person.profilePlate)} autoPlay loop muted playsInline preload="metadata"/></span>}
                  <span className="home-dm-name"><StyledName user={person}/></span>
                </button>
              ))
            )}
          </div>
        </aside>
        <main className="main-content">
          <div className="channel-header home-header">
            <div className="channel-title">
              <Users size={20} />
              <strong>Amigos</strong>
              <span className="header-divider" />
            </div>
            <div className="home-tabs">
              <button
                className={homeTab === "online" ? "home-tab-selected" : ""}
                onClick={() => setHomeTab("online")}
              >
                Online
              </button>
              <button
                className={homeTab === "all" ? "home-tab-selected" : ""}
                onClick={() => setHomeTab("all")}
              >
                Todos
              </button>
              <button
                className={homeTab === "pending" ? "home-tab-selected" : ""}
                onClick={() => setHomeTab("pending")}
              >
                Pendente{" "}
                {friendsData.pending.length > 0 && (
                  <span className="pending-count">
                    {friendsData.pending.length}
                  </span>
                )}
              </button>
              <button
                className={`home-add-tab ${homeTab === "add" ? "home-tab-selected" : ""}`}
                onClick={() => setHomeTab("add")}
              >
                Adicionar amigo
              </button>
            </div>
          </div>
          <div className="content-body">
            <div
              className="chat-area friends-area"
              onClick={(event) => {
                const row = event.target.closest(".friend-row");
                if (!row || event.target.closest("button")) return;
                const name = row.querySelector(
                  ".friend-info strong",
                )?.textContent;
                const friend = friendsData.friends.find(
                  (person) => person.displayName === name,
                );
                if (friend) setHomeTab(`dm:${friend.id}`);
              }}
            >
              {homeTab === "add" ? (
                <div className="add-friend-box">
                  <h3>Adicionar amigo</h3>
                  <p>Use o identificador completo: nome#0000.</p>
                  <form className="add-friend-form" onSubmit={submitAddFriend}>
                    <input
                      value={addFriendValue}
                      placeholder="Ex.: sabrina#1234"
                      onChange={(event) =>
                        setAddFriendValue(event.target.value)
                      }
                    />
                    <button
                      className="prompt-confirm"
                      disabled={!addFriendValue.trim()}
                    >
                      Enviar solicitação de amizade
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="friend-search">
                    <Search size={15} />
                    <input
                      placeholder="Buscar"
                      value={friendQuery}
                      onChange={(event) => setFriendQuery(event.target.value)}
                    />
                  </div>
                  {homeTab === "pending" && (
                    <>
                      <div className="friends-group-title">
                        SOLICITAÇÕES — {friendsData.pending.length}
                      </div>
                      {friendsData.pending.map((person) => (
                        <div className="friend-row" key={person.friendshipId}>
                          <Avatar
                            user={person}
                            color={person.avatarColor || "purple"}
                            small
                          />
                          <div className="friend-info">
                            <strong>{person.displayName}</strong>
                            <span>
                              {person.direction === "incoming"
                                ? "Solicitação recebida"
                                : "Solicitação enviada"}
                            </span>
                          </div>
                          <div className="friend-actions">
                            {person.direction === "incoming" && (
                              <button
                                title="Aceitar"
                                className="friend-accept"
                                onClick={() =>
                                  acceptFriendRequest(person.friendshipId)
                                }
                              >
                                <UserPlus size={17} />
                              </button>
                            )}
                            <button
                              title={
                                person.direction === "incoming"
                                  ? "Recusar"
                                  : "Cancelar"
                              }
                              onClick={() =>
                                removeFriendRow(person.friendshipId)
                              }
                            >
                              <X size={17} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {friendsData.pending.length === 0 && (
                        <div className="friends-empty">
                          Não há solicitações pendentes. Tente adicionar amigos
                          pelo nome de usuário!
                        </div>
                      )}
                    </>
                  )}
                  {homeTab !== "pending" && (
                    <>
                      <div className="friends-group-title">
                        {homeTab === "online" ? "ONLINE" : "TODOS OS AMIGOS"} —{" "}
                        {listFriends.length}
                      </div>
                      {listFriends.map((person) => (
                        <div className="friend-row" key={person.friendshipId}>
                          <div className="friend-avatar-wrap">
                            <Avatar
                              user={person}
                              color={person.avatarColor || "purple"}
                              small
                            />
                            <span
                              className={`presence-dot presence-${person.presence}`}
                            />
                          </div>
                          <div className="friend-info">
                            <strong>{person.displayName}</strong>
                            <span>
                              {person.presence === "voice"
                                ? `Em voz • ${person.voice?.channelName}`
                                : person.presence === "idle"
                                  ? "Ausente"
                                  : person.presence === "dnd"
                                    ? "Não perturbar"
                                    : person.presence === "online"
                                      ? "Online"
                                      : "Offline"}
                            </span>
                          </div>
                          <div className="friend-actions">
                            <button
                              title="Mensagem"
                              onClick={() =>
                                setNotice("Mensagens diretas chegam em breve!")
                              }
                            >
                              <MessageSquare size={17} />
                            </button>
                            <button
                              title="Remover amigo"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remover ${person.displayName} dos amigos?`,
                                  )
                                )
                                  removeFriendRow(person.friendshipId);
                              }}
                            >
                              <X size={17} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {listFriends.length === 0 && (
                        <div className="friends-empty">
                          <img
                            src="/branding/sesh-logo.gif"
                            alt=""
                            className="onboard-gif"
                          />
                          <p>
                            Ninguém por aqui ainda. Use a aba{" "}
                            <strong>Adicionar amigo</strong> para convidar
                            alguém pelo nome de usuário!
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <aside className={`member-sidebar active-now-sidebar ${memberListOpen ? "mobile-open" : ""}`}>
              <div className="member-title">ATIVO AGORA</div>
              {activeNow.length === 0 && (
                <div className="active-now-empty">
                  É bem quieto por aqui... Quando um amigo entrar numa call ou
                  ficar online, vai aparecer aqui!
                </div>
              )}
              {activeNow.map((person) => (
                <div className="active-now-card" key={person.friendshipId}>
                  <Avatar
                    user={person}
                    color={person.avatarColor || "purple"}
                    small
                  />
                  <div>
                    <strong>{person.displayName}</strong>
                    <span>
                      {person.presence === "voice"
                        ? `Em voz • ${person.voice?.channelName}`
                        : "Online"}
                    </span>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </main>
        {!voiceConnected && currentUser.gameInterests?.[0] && <FavoriteGameActivity user={currentUser}/>}
        <div className={`user-panel ${mobileNav ? "mobile-open" : ""}`}>
          {statusMenu && statusMenuEl()}
          <span
            className="user-avatar-btn"
            title="Abrir meu perfil"
            role="button" tabIndex={0} aria-expanded={statusMenu}
            onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setStatusMenu(current=>!current);}}}
            onClick={() => setStatusMenu((current) => !current)}
          >
            <span className="avatar-dot-wrap">
              <Avatar user={currentUser} color="purple" small />
              <span
                className={`presence-dot presence-${presenceFor(currentUser.id)} ${speaking[currentUser.id] ? "presence-speaking" : ""}`}
              />
            </span>
          </span>
          <div
            className="user-details"
            title="Clique para copiar seu ID"
            onClick={copyOwnHandle}
          >
            <strong>{currentUser.displayName}</strong>
            <span>@{currentUser.username}</span>
          </div>
          <div className="user-actions">
            <button title={muted ? "Ativar microfone" : "Silenciar microfone"} onClick={toggleMute}>
              {muted ? <MicOff size={17}/> : <Mic size={17} />}
            </button>
            <button title={deafened ? "Ativar áudio" : "Silenciar áudio"} onClick={toggleDeafen}>
              <Headphones size={17} />
            </button>
            <button title="Configurações" onClick={() => openSettings()}>
              <Settings size={17} />
            </button>
          </div>
        </div>
        {overlays}
        {homeTab.startsWith("dm:") && (
          <DirectConversation
            key={homeTab}
            currentUser={currentUser}
            onJoinVoice={openVoiceFromProfile}
            user={friendsData.friends.find(
              (person) => person.id === homeTab.slice(3),
            )}
            onClose={() => setHomeTab("online")}
            onOpenProfile={() =>
              openProfile(
                {
                  stopPropagation: () => {},
                  clientX: window.innerWidth / 2,
                  clientY: window.innerHeight / 2,
                },
                homeTab.slice(3),
              )
            }
            onOpenFullProfile={() => setProfileView({mode:"full",userId:homeTab.slice(3)})}
          />
        )}
      </div>
    );
  function savePreference(key, value) {
    localStorage.setItem(key, value);
  }
  return (
    <div
      className={`app-shell theme-${theme} ${compactMode ? "compact-mode" : ""}`}
    >
      <header className="mobile-header">
        <button
          className="icon-button"
          aria-label={mobileNav ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={mobileNav}
          onClick={toggleMobileNavigation}
        >
          <Menu size={20} />
        </button>
        <strong>{selectedServer.name}</strong>
        <button
          className="icon-button"
          aria-label={memberListOpen ? "Fechar membros" : "Abrir membros"}
          aria-expanded={memberListOpen}
          onClick={toggleMemberDrawer}
        >
          <Users size={20} />
        </button>
      </header>
      {mobileNav && <button type="button" className="mobile-drawer-backdrop nav-backdrop" aria-label="Fechar navegação" onClick={() => setMobileNav(false)} />}
      {memberListOpen && <button type="button" className="mobile-drawer-backdrop member-backdrop" aria-label="Fechar membros" onClick={() => setMemberListOpen(false)} />}
      <aside className={`server-rail ${mobileNav ? "mobile-open" : ""}`}>
        <img
          className="brand-mark brand-mark-img brand-home"
          src="/branding/sesh-logo.gif"
          alt="Sesh"
          title="Início"
          onClick={() => setSelectedServer(null)}
        />
        <div className="rail-divider" />
        {servers.map((server, index) => (
          <button
            key={server.id}
            data-server-id={server.id}
            className={`server-icon ${colors[index % colors.length]} ${selectedServer.id === server.id ? "active" : ""}`}
            onClick={() => {
              setSelectedServer(server);
              setMobileNav(false);
            }}
            title={server.name}
          >
            {server.icon && String(server.icon).startsWith("data:") ? (
              <img src={server.icon} alt="" className="server-icon-img" />
            ) : (
              server.icon || initials(server.name).slice(0, 1)
            )}
            {server.channels.some(
              (channel) =>
                channel.type === "voice" &&
                (voiceStates[channel.id] || []).length > 0,
            ) && (
              <span className="server-call-indicator"><Volume2 size={12} /></span>
            )}
          </button>
        ))}
        <button
          className="server-icon add-server"
          onClick={createServer}
          title="Criar servidor"
        >
          <Plus size={21} />
        </button>
      </aside>
      <aside className={`channel-sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div
          className={`workspace-header ${selectedServer.banner ? "workspace-header-banner" : ""}`}
          style={
            selectedServer.banner
              ? {
                  backgroundImage: `linear-gradient(90deg, #09090be6, #09090b73), url("${selectedServer.banner}")`,
                  borderBottomColor: selectedServer.accentColor || "#c93642",
                }
              : undefined
          }
        >
          <span>{selectedServer.name}</span>
          {selectedServer.tag && (
            <span className="workspace-server-tag" style={{ "--server-tag-color": selectedServer.accentColor || "#c93642" }}>{selectedServer.tag}</span>
          )}
          <div className="header-tools">
            <button title="Copiar convite do servidor" onClick={() => copyInvite()}>
              <UserPlus size={17} />
            </button>
            {canManageSettings && (
              <button
                title="Configurações do servidor"
                onClick={() => setServerSettingsOpen(true)}
              >
                <Settings size={17} />
              </button>
            )}
            <ChevronDown size={17} />
          </div>
        </div>
        <div className="channel-scroll">
          <section className="channel-section">
            <div className="section-title">
              <span>CANAIS</span>
              <button onClick={() => createChannel("text")}>
                <Plus size={14} />
              </button>
            </div>
            {orderedChannels.map((channel) => (
              <React.Fragment key={channel.id}>
                <button
                  className={`channel-row ${selectedChannel.id === channel.id ? "selected" : ""} ${mutedChannels.includes(channel.id) ? "muted-row" : ""} ${unreadMarkers[channel.id] ? "unread-channel" : ""}`}
                  data-channel-id={channel.id}
                  onClick={() => {
                    clearChannelUnread(channel.id);
                    setSelectedChannel(channel);
                    setMobileNav(false);
                    if (channel.type === "text")
                      api
                        .messages(channel.id)
                        .then((result) => { setMessages(result.messages); fillAttachments(channel.id, result.messages); });
                    if (
                      channel.type === "voice" &&
                      voiceConnected &&
                      voiceChannel?.id !== channel.id
                    )
                      joinVoice(channel);
                  }}
                  onDoubleClick={() => {
                    if (channel.type === "voice") {
                      joinVoice(channel);
                    }
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setContextMenu({
                      x: Math.min(event.clientX, window.innerWidth - 250),
                      y: Math.min(event.clientY, window.innerHeight - 440),
                      channel,
                    });
                  }}
                >
                  {channel.type === "voice" ? (
                    <Volume2 size={18} />
                  ) : (
                    <Hash size={19} />
                  )}
                  <span>{channel.name}</span>
                  {channel.type === "voice" &&
                  (voiceStates[channel.id] || []).length > 0 ? (
                    <span className="voice-count">
                      {(voiceStates[channel.id] || []).length}
                    </span>
                  ) : null}
                  {pinnedChannels.includes(channel.id) ? (
                    <Pin size={12} className="pin-indicator" />
                  ) : null}
                  {channel.type === "voice" &&
                  voiceConnected &&
                  selectedChannel.id === channel.id ? (
                    <span className="voice-live-dot" />
                  ) : null}
                </button>
                {channel.type === "voice" &&
                  (voiceStates[channel.id] || []).length > 0 && (
                    <div className="voice-members">
                      {(voiceStates[channel.id] || []).map((participant) => (
                        <div
                          className={`voice-member profile-click ${speaking[participant.id] ? "speaking" : ""}`}
                          data-member-id={participant.id}
                          key={participant.id}
                          onClick={(event) =>
                            openProfile(event, participant.id)
                          }
                          onContextMenu={(event) =>
                            openMemberMenu(event, participant, true)
                          }
                        >
                          <span className="avatar-dot-wrap">
                            <span className="voice-speaking-rings" aria-hidden="true"><i/><i/></span>
                            <Avatar
                              user={participant}
                              color={participant.avatarColor || "purple"}
                              small
                            />
                            <span
                              className={`presence-dot presence-${presenceFor(participant.id)} ${speaking[participant.id] ? "presence-speaking" : ""}`}
                            />
                          </span>
                          <span className="voice-member-name-row">
                            <StyledName user={{ ...participant, serverRole: memberRoleById.get(participant.id) || participant.serverRole }}/>
                            <VoiceMediaIndicators
                              muted={participant.id === currentUser.id ? muted : participant.muted}
                              deafened={participant.id === currentUser.id ? deafened : participant.deafened}
                              camera={cameraActiveFor(participant)}
                              screen={screenActiveFor(participant)}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </React.Fragment>
            ))}
          </section>
        </div>
        {voiceConnected && (
          <div className="voice-status">
            <button type="button" className="voice-status-info" title="Ver qualidade da conexão" onClick={() => setVoiceConnectionPanel(value => !value)}>
              <span className="voice-status-title">
                <Volume2 size={13} /> Voz conectada
              </span>
              <strong>{voiceChannel?.name}</strong>
            </button>
            <button className="voice-status-metrics" title="Qualidade da conexão" onClick={() => setVoiceConnectionPanel(value => !value)}>ms</button>
            <button className="voice-status-leave" title="Desconectar da chamada" onClick={leaveVoice}>
              <PhoneOff size={15} />
            </button>
            {voiceConnectionPanel && <section className="voice-connection-panel" role="dialog" aria-label="Qualidade da conexão">
              <header><strong>Conexão</strong><button type="button" onClick={() => setVoiceConnectionPanel(false)} aria-label="Fechar">×</button></header>
              <p>Ping médio: <b>{voiceLatency.samples ? voiceLatency.average : "…"} ms</b></p>
              <p>Último ping: <b>{voiceLatency.samples ? voiceLatency.last : "…"} ms</b></p>
              <p>Taxa de perda estimada: <b>0,0%</b></p>
              <small>O ping é medido entre este dispositivo e o servidor do Sesh enquanto a chamada está ativa.</small>
            </section>}
          </div>
        )}
        {!voiceConnected && currentUser.gameInterests?.[0] && <FavoriteGameActivity user={currentUser}/>}
        <div className="user-panel">
          {statusMenu && statusMenuEl()}
          <span
            className="user-avatar-btn"
            title="Abrir meu perfil"
            role="button" tabIndex={0} aria-expanded={statusMenu}
            onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setStatusMenu(current=>!current);}}}
            onClick={() => setStatusMenu((current) => !current)}
          >
            <span className="avatar-dot-wrap">
              <Avatar user={currentUser} color="purple" small />
              <span
                className={`presence-dot presence-${presenceFor(currentUser.id)}`}
              />
            </span>
          </span>
          <div
            className="user-details"
            title="Clique para copiar seu ID"
            onClick={copyOwnHandle}
          >
            <strong>{currentUser.displayName}</strong>
            <span>@{currentUser.username}</span>
          </div>
          <div className="user-actions">
            <button
              title={muted ? "Ativar microfone" : "Silenciar microfone"}
              className={muted ? "action-danger" : ""}
              onClick={toggleMute}
            >
              {muted ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button
              title={deafened ? "Ativar áudio" : "Silenciar áudio"}
              className={deafened ? "action-danger" : ""}
              onClick={toggleDeafen}
            >
              <Headphones size={17} />
            </button>
            <button title="Configurações" onClick={() => openSettings()}>
              <Settings size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <div className="channel-header">
          <div className="channel-title">
            {selectedChannel.type === "voice" ? (
              <Volume2 size={23} />
            ) : (
              <Hash size={23} />
            )}
            <strong>{selectedChannel.name}</strong>
            <span className="header-divider" />
            <span className="channel-topic">
              {selectedChannel.topic || "Converse, compartilhe e crie junto"}
            </span>
          </div>
          <div className="header-actions">
            <button className="header-action">
              <Bell size={19} />
            </button>
            <button
              className={`header-action ${pinnedOnly ? "selected-action" : ""}`}
              title={pinnedOnly ? "Mostrar todas as mensagens" : "Mostrar mensagens fixadas"}
              aria-pressed={pinnedOnly}
              onClick={() => setPinnedOnly((current) => !current)}
            >
              <Pin size={19} />
            </button>
            <button
              className={`header-action ${memberListOpen ? "selected-action" : ""}`}
              onClick={toggleMemberDrawer}
            >
              <Users size={19} />
            </button>
            <div className="search-box">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar"
              />
              <Search size={16} />
            </div>
            <button className="header-action">
              <HelpCircle size={19} />
            </button>
          </div>
        </div>
        <div className="content-body">
          <div className={"chat-area file-drop-zone"+(chatDrop.dragging?" dragging":"")} {...chatDrop.bind}>
            {chatDrop.dragging&&<div className="file-drop-overlay"><Paperclip size={38}/><strong>Solte o arquivo aqui</strong><span>Até 3 MB · você confirma antes de enviar</span></div>}
            {selectedChannel.type === "voice" ? (
              <div className="voice-stage">
                <div className="voice-topbar">
                  <Volume2 size={17} />
                  <strong>{selectedChannel.name}</strong>
                  {voiceConnected &&
                    voiceChannel?.id !== selectedChannel.id && (
                      <span className="voice-topbar-hint">
                        — você está conectado em "{voiceChannel?.name}", clique
                        em Entrar para trocar
                      </span>
                    )}
                </div>
                {voiceConnected && voiceChannel?.id === selectedChannel.id ? (
                  <>
                    {focusedVideoId &&
                      (() => {
                        const participant = orderedVoiceParticipants.find(
                          (item) => item.id === focusedVideoId,
                        );
                        const stream =
                          participant && videoStreamFor(participant);
                        return participant && stream ? (
                          <div className="voice-focus-panel">
                            <MediaStreamVideo
                              stream={stream}
                              muted={participant.id === currentUser.id}
                            />
                            <div className="voice-focus-label">
                              <div className="voice-focus-name-row">
                                <strong>{participant.displayName}</strong>
                                <VoiceMediaIndicators
                                  muted={participant.id === currentUser.id ? muted : participant.muted}
                                  deafened={participant.id === currentUser.id ? deafened : participant.deafened}
                                  camera={cameraActiveFor(participant)}
                                  screen={screenActiveFor(participant)}
                                />
                              </div>
                              <span>
                                {participant.id === currentUser.id && screenOn
                                  ? "Sua transmissão"
                                  : participant.id === currentUser.id
                                    ? "Sua câmera"
                                    : "Vídeo ao vivo"}
                              </span>
                            </div>
                            <div className="voice-focus-actions">
                              <button
                                title={
                                  videoFullscreen
                                    ? "Sair da tela cheia"
                                    : "Abrir em tela cheia"
                                }
                                onClick={toggleVideoFullscreen}
                              >
                                <Maximize2 size={19} />
                              </button>
                              <button
                                title="Fechar destaque"
                                onClick={() => setFocusedVideoId(null)}
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    <div
                      className={`voice-participant-grid ${focusedVideoId ? "voice-participant-strip" : ""}`}
                    >
                      {visibleVoiceParticipants.map((participant) => {
                        const videoStream = videoStreamFor(participant);
                        return (
                          <button
                            type="button"
                            className={`voice-tile ${videoStream ? "voice-tile-clickable" : ""} ${focusedVideoId === participant.id ? "voice-tile-focused" : ""} ${speaking[participant.id] ? "speaking" : ""}`}
                            key={participant.id}
                            title={
                              videoStream
                                ? "Clique para ampliar"
                                : participant.displayName
                            }
                            onClick={() =>
                              videoStream && setFocusedVideoId(participant.id)
                            }
                          >
                            {videoStream ? (
                              <MediaStreamVideo
                                stream={videoStream}
                                muted={participant.id === currentUser.id}
                              />
                            ) : (
                              <span className="voice-avatar-stage">
                                <span className="voice-speaking-rings" aria-hidden="true"><i/><i/></span>
                                <Avatar
                                  user={participant}
                                  color={participant.avatarColor || "purple"}
                                />
                              </span>
                            )}
                            <div className="voice-tile-label">
                              <div className="voice-tile-name-row">
                                <strong>{participant.displayName}</strong>
                                <VoiceMediaIndicators
                                  muted={participant.id === currentUser.id ? muted : participant.muted}
                                  deafened={participant.id === currentUser.id ? deafened : participant.deafened}
                                  camera={cameraActiveFor(participant)}
                                  screen={screenActiveFor(participant)}
                                />
                              </div>
                              <span>
                                {participant.id === currentUser.id
                                  ? muted
                                    ? "Você (mudo)"
                                    : "Você"
                                  : speaking[participant.id]
                                    ? "Falando..."
                                    : "Conectado"}
                              </span>
                            </div>
                            <span className="voice-speaking-wave" aria-hidden="true"><i/><i/><i/><i/></span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="voice-controls">
                      <button
                        className={muted ? "control-danger" : ""}
                        title={
                          muted ? "Ativar microfone" : "Silenciar microfone"
                        }
                        onClick={toggleMute}
                      >
                        {muted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <button
                        className={deafened ? "control-danger" : ""}
                        title={deafened ? "Ativar áudio" : "Silenciar áudio"}
                        onClick={toggleDeafen}
                      >
                        <Headphones size={20} />
                      </button>
                      <button
                        className={camOn ? "control-active" : ""}
                        title={camOn ? "Desligar câmera" : "Ligar câmera"}
                        onClick={toggleCam}
                      >
                        {camOn ? <VideoOff size={20} /> : <Video size={20} />}
                      </button>
                      <button
                        className={screenOn ? "control-active" : ""}
                        title={
                          screenOn
                            ? "Parar compartilhamento"
                            : "Compartilhar tela"
                        }
                        onClick={toggleScreen}
                      >
                        <MonitorUp size={20} />
                      </button>
                      <button
                        className="control-danger"
                        title="Sair da chamada"
                        onClick={leaveVoice}
                      >
                        <PhoneOff size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="voice-hero">
                    <Volume2 size={34} />
                    <h1>{selectedChannel.name}</h1>
                    <p>Conecte-se por voz com sua comunidade.</p>
                    <button
                      className="voice-join"
                      onClick={() => joinVoice(selectedChannel)}
                    >
                      {voiceConnected
                        ? "Trocar para esta chamada"
                        : "Entrar na chamada"}
                    </button>
                  </div>
                )}
              </div>
            ) : guideActive ? (
              <>
                <div className="welcome-guide">
                  <button className="guide-close" onClick={dismissGuide}>
                    <X size={17} />
                  </button>
                  <h1>
                    Bem-vindo(a) a<br />
                    {selectedServer.name}
                  </h1>
                  <p>
                    Este é seu servidor, novinho em folha. Aqui vão algumas
                    dicas para ajudar você a começar!
                  </p>
                  <div className="guide-cards">
                    <button className="guide-card" onClick={() => copyInvite()}>
                      <span className="guide-emoji">👥</span>
                      <span>Convide seus amigos</span>
                      <ChevronRight size={17} className="guide-chevron" />
                    </button>
                    <button
                      className="guide-card"
                      onClick={() => guideIconRef.current?.click()}
                    >
                      <span className="guide-emoji">🖼️</span>
                      <span>Personalize seu servidor com um ícone</span>
                      <ChevronRight size={17} className="guide-chevron" />
                    </button>
                    <button
                      className="guide-card"
                      onClick={() => composerInputRef.current?.focus()}
                    >
                      <span className="guide-emoji">📨</span>
                      <span>Envie sua primeira mensagem</span>
                      <ChevronRight size={17} className="guide-chevron" />
                    </button>
                    <button
                      className="guide-card"
                      onClick={() => setNotice("Apps chegam em breve!")}
                    >
                      <span className="guide-emoji">🎮</span>
                      <span>Adicione seu primeiro app</span>
                      <ChevronRight size={17} className="guide-chevron" />
                    </button>
                    <button
                      className="guide-card"
                      onClick={() => setNotice("Impulsos chegam em breve!")}
                    >
                      <span className="guide-emoji">⚡</span>
                      <span>Desbloqueie vantagens para todos com impulsos</span>
                      <ChevronRight size={17} className="guide-chevron" />
                    </button>
                  </div>
                </div>
                <input
                  ref={guideIconRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={uploadServerIcon}
                />
                <form className="composer" onSubmit={sendMessage}>
                  <input ref={attachmentInputRef} type="file" hidden onChange={onAttachmentFile} />
                  <button type="button" className={attachment ? "attachment-ready" : ""} title="Enviar arquivo" onClick={() => attachmentInputRef.current?.click()}>
                    <Paperclip size={20} />
                  </button>
                  {readingAttachment&&<span className="file-reading" role="status">Preparando arquivo…</span>}{attachment && <div className="attachment-draft"><AttachmentView attachment={attachment} preview/><button type="button" aria-label="Remover anexo" onClick={()=>setAttachment(null)}><X size={14}/></button></div>}
                  {mentionQuery !== null && <MentionSuggestions candidates={mentionCandidates} onChoose={chooseMention} />}
                  <input
                    ref={composerInputRef}
                    value={draft}
                    onChange={(event) => updateDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={`Conversar em #${selectedChannel.name}`}
                  />
                  <EmojiPicker onSelect={emoji => updateDraft(draft + emoji)}/>
                  <button className="send-button" type="submit">
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="welcome-block">
                  <div className="welcome-icon">
                    <Hash size={30} />
                  </div>
                  <h1>Bem-vindo a #{selectedChannel.name}!</h1>
                  <p>
                    Este é o começo deste canal. Compartilhe ideias e converse
                    com a comunidade.
                  </p>
                </div>
                <div className="messages-list" ref={messagesListRef} onScroll={(event) => {
                  const list=event.currentTarget;
                  autoScrollMessagesRef.current=list.scrollHeight-list.scrollTop-list.clientHeight<90;
                }}>
                  {filteredMessages.map((message, index) => {
                    const previous = filteredMessages[index - 1];
                    const messageDate = new Date(message.createdAt);
                    const previousDate = previous ? new Date(previous.createdAt) : null;
                    const sameDay = previousDate?.toDateString() === messageDate.toDateString();
                    const compact = Boolean(previous && sameDay && previous.author.id === message.author.id && messageDate - previousDate < 7 * 60 * 1000 && !message.replyTo && !message.forwardedFrom);
                    const shortTime = messageDate.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"});
                    return <React.Fragment key={message.id}>
                    {!sameDay && <div className="message-day-divider"><span>{messageDate.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</span></div>}
                    <article
                      id={`message-${message.id}`}
                      className={"message"+(compact?" message-compact":"")+(unreadMarkers[message.channelId]===message.id?" message-unread-start":"")}
                      data-member-id={message.author.id}
                      data-message-id={message.id}
                    >
                      {compact ? <time className="message-hover-time" dateTime={message.createdAt}>{shortTime}</time> : <Avatar
                        user={message.author}
                        color={message.author.avatarColor || "purple"}
                        onClick={(event) =>
                          openProfile(event, message.author.id)
                        }
                      />}
                      <div className="message-body">
                        {!compact && <div className="message-meta">
                          <strong
                            onClick={(event) =>
                              openProfile(event, message.author.id)
                            }
                          >
                            <StyledName user={{ ...message.author, serverRole: memberRoleById.get(message.author.id) }}/>
                          </strong>
                          {message.ai && <span className="ai-app-tag">APP</span>}
                          {selectedServer.tag && (
                            <span
                              className="server-tag"
                              style={{
                                "--server-tag-color":
                                  selectedServer.accentColor || "#c93642",
                              }}
                            >
                              {selectedServer.tag}
                            </span>
                          )}
                          <time>
                            {shortTime}
                          </time>
                          {message.editedAt && <span className="message-edited">(editada)</span>}
                        </div>}
                        {message.pinnedAt && <span className="message-pinned" aria-label="Mensagem fixada"><Pin size={11}/> Fixada</span>}
                        {message.replyTo && (
                          <button className="message-reference" type="button" onClick={() => jumpToMessage(message.replyTo.id)}>
                            <Reply size={13}/>
                            <strong>{message.replyTo.author?.displayName || "Mensagem"}</strong>
                            <span><EmojiText text={message.replyTo.content || (message.replyTo.hasAttachment ? "Imagem" : "Conteúdo removido")} /></span>
                          </button>
                        )}
                        {message.forwardedFrom && (
                          <div className="message-forwarded-label">
                            <Forward size={12}/> Encaminhada de {message.forwardedFrom.author?.displayName || "outro membro"}
                          </div>
                        )}
                        {message.content && <MessageContent content={message.content} members={members} onProfile={openProfile} />}
                        {message.attachment && <AttachmentView attachment={message.attachment} nsfw={Boolean(message.ai?.nsfw)} alt={`Imagem enviada por ${message.author.displayName}`}/>}
                        {message.reactions?.length > 0 && (
                          <div className="reactions">
                            {message.reactions.map((reaction) => (
                              <button
                                type="button"
                                key={reaction.emoji}
                                className={reaction.userIds?.includes(currentUser.id) ? "reaction-own" : ""}
                                onClick={() => reactToMessage(message, reaction.emoji)}
                                aria-label={`${reaction.emoji}: ${reaction.count} reação${reaction.count === 1 ? "" : "ões"}`}
                              >
                                <span className="sr-only">{reaction.emoji}</span><LibraryEmoji emoji={reaction.emoji} size={18} /> {reaction.count}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="message-more"
                        aria-label="Opções da mensagem"
                        onClick={(event) => openMessageMenu(event, message)}
                      >
                        <MoreVertical size={17} />
                      </button>
                    </article>
                    </React.Fragment>;
                  })}
                  {filteredMessages.length === 0 && (
                    <div className="empty-search">
                      Nenhuma mensagem encontrada.
                    </div>
                  )}
                </div>
                {replyingTo && (
                  <div className="reply-composer-bar">
                    <Reply size={14}/>
                    <span>Respondendo a <strong>{replyingTo.author?.displayName}</strong></span>
                    <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancelar resposta"><X size={15}/></button>
                  </div>
                )}
                <form className={`composer ${replyingTo ? "composer-replying" : ""}`} onSubmit={sendMessage}>
                  <input ref={attachmentInputRef} type="file" hidden onChange={onAttachmentFile} />
                  <button type="button" className={attachment ? "attachment-ready" : ""} title="Enviar arquivo" onClick={() => attachmentInputRef.current?.click()}>
                    <Paperclip size={20} />
                  </button>
                  {readingAttachment&&<span className="file-reading" role="status">Preparando arquivo…</span>}{attachment && <div className="attachment-draft"><AttachmentView attachment={attachment} preview/><button type="button" aria-label="Remover anexo" onClick={()=>setAttachment(null)}><X size={14}/></button></div>}
                  {mentionQuery !== null && <MentionSuggestions candidates={mentionCandidates} onChoose={chooseMention} />}
                  <input
                    ref={composerInputRef}
                    value={draft}
                    onChange={(event) => updateDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={`Conversar em #${selectedChannel.name}`}
                  />
                  <EmojiPicker onSelect={emoji => updateDraft(draft + emoji)}/>
                  <button className="send-button" type="submit">
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}
          </div>
          {memberListOpen && (
            <aside className="member-sidebar mobile-open">
              <div className="member-title">MEMBROS — {members.length + (aiSessionServerId === selectedServer.id ? 1 : 0)}</div>
              {aiSessionServerId === selectedServer.id && <section className="member-role-group ai-ghost-section">
                <div className="member-role-group-title">APPS — 1</div>
                <div className="member ai-ghost-member">
                  <span className="avatar-dot-wrap">
                    <img className="avatar avatar-img avatar-small ai-ghost-avatar" src="/ai-sesh-avatar.png" alt=""/>
                    <span className="presence-dot presence-online"/>
                  </span>
                  <div><strong>IA SESH <span className="ai-app-tag">APP</span></strong><span className="member-role">{aiGenerating ? "Gerando sua imagem…" : "Visível só para você"}</span></div>
                </div>
              </section>}
              {memberGroups.map((group) => (
                <section className={"member-role-group" + (group.members.some((member) => member.id === selectedServer.ownerId) ? " member-owner-group" : "")} data-role-id={group.role?.id || "members"} key={group.role?.id || "members"}>
                  {group.role && <div className="member-role-group-title" style={{ "--role-group-color": group.role.color }}>{group.role.emoji && <span className="role-group-emoji" aria-hidden="true">{group.role.emoji}</span>}{group.role.name} — {group.members.length}</div>}
                  {group.members.map((member) => (
                    <div
                      className={`member profile-click role-style-${member.serverRole?.style || "solid"}`}
                      style={{ "--member-role-color": member.serverRole?.color || "#8f96a3" }}
                      key={member.id}
                      data-member-id={member.id}
                      onClick={(event) => openProfile(event, member.id)}
                      onContextMenu={(event) => openMemberMenu(event, member)}
                    >
                      <span className="avatar-dot-wrap">
                        <Avatar user={member} color={member.avatarColor || "purple"} small />
                        <span className={`presence-dot presence-${presenceFor(member.id)}`} />
                      </span>
                      {nameplateSrc(member.profilePlate) && <span className="member-nameplate-surface" aria-hidden="true"><video src={nameplateSrc(member.profilePlate)} autoPlay loop muted playsInline preload="metadata"/></span>}
                      <div className={nameplateSrc(member.profilePlate) ? "member-info member-info-nameplate" : "member-info"}>
                        <strong>
                          <StyledName user={member}/>
                          {member.id === selectedServer.ownerId && <Crown className="member-owner-crown" size={13} strokeWidth={2.4} aria-label="Dono do servidor"/>}
                          {selectedServer.tag && <span className="server-tag" style={{ "--server-tag-color": selectedServer.accentColor || "#c93642" }}>{selectedServer.tag}</span>}
                        </strong>
                        <span className="member-secondary">{member.gameInterests?.[0] && GAME_CATALOG.find(game => game.id === member.gameInterests[0]) ? <span className="member-game"><GameIcon game={GAME_CATALOG.find(game => game.id === member.gameInterests[0])}/>{GAME_CATALOG.find(game => game.id === member.gameInterests[0]).name}</span> : <span className="member-handle">@{member.username}</span>}</span>
                      </div>
                    </div>
                  ))}
                </section>
              ))}            </aside>
          )}
        </div>
      </main>
      {overlays}
      {messageMenu && (() => {
        const message = messageMenu.message;
        const ownMessage = message.author?.id === currentUser.id;
        const persistentMessage = !message.ai?.ephemeral;
        const quickReactions = ["❤️", "😂", "😮", "😢", "👍"];
        const moreReactions = ["🔥", "🎉", "👏", "🤔", "👀", "💯", "✅", "❌", "🚀", "🤝"];
        const textChannels = (selectedServer?.channels || []).filter((channel) => channel.type === "text");
        return (
          <div
            className="context-menu message-context-menu"
            style={{ left: messageMenu.x, top: messageMenu.y }}
            onClick={(event) => event.stopPropagation()}
            role="menu"
            aria-label="Opções da mensagem"
          >
            {persistentMessage && (
              <div className="message-quick-reactions" aria-label="Reações rápidas">
                {quickReactions.map((emoji) => {
                  const selected = message.reactions?.some((reaction) => reaction.emoji === emoji && reaction.userIds?.includes(currentUser.id));
                  return <button key={emoji} type="button" aria-label={`Reagir com ${emoji}`} className={selected ? "selected" : ""} onClick={() => reactToMessage(message, emoji)}><LibraryEmoji emoji={emoji} size={23}/>{selected && <Check size={9}/>}</button>;
                })}
              </div>
            )}
            {persistentMessage && <button className="context-item" type="button" onClick={() => setMessageMenu((current) => ({ ...current, reactionsOpen: !current.reactionsOpen, forwardOpen: false }))}>
              <Smile size={17}/> Adicionar reação <span className="context-arrow">›</span>
            </button>}
            {messageMenu.reactionsOpen && <div className="message-reaction-grid">
              {moreReactions.map((emoji) => <button key={emoji} type="button" aria-label={`Reagir com ${emoji}`} onClick={() => reactToMessage(message, emoji)}><LibraryEmoji emoji={emoji} size={21}/></button>)}
            </div>}
            {persistentMessage && <button className="context-item" type="button" onClick={() => replyToMessage(message)}><Reply size={17}/>Responder</button>}
            {persistentMessage && <button className="context-item" type="button" onClick={() => setMessageMenu((current) => ({ ...current, forwardOpen: !current.forwardOpen, reactionsOpen: false }))}>
              <Forward size={17}/>Encaminhar <span className="context-arrow">›</span>
            </button>}
            {messageMenu.forwardOpen && <div className="message-forward-list">
              <span>ENCAMINHAR PARA</span>
              {textChannels.map((channel) => <button key={channel.id} type="button" onClick={() => forwardMessage(message, channel)}><Hash size={13}/>#{channel.name}</button>)}
            </div>}
            <div className="context-sep"/>
            {message.content && <button className="context-item" type="button" onClick={() => { copyText(message.content, "Texto da mensagem copiado."); setMessageMenu(null); }}><Copy size={17}/>Copiar texto</button>}
            {persistentMessage && canPinMessages && <button className="context-item" type="button" onClick={() => togglePinnedMessage(message)}><Pin size={17}/>{message.pinnedAt ? "Desafixar mensagem" : "Fixar mensagem"}</button>}
            <button className="context-item" type="button" onClick={() => markMessageUnread(message)}><Check size={17}/>Marcar como não lida</button>
            {persistentMessage && <button className="context-item" type="button" onClick={() => copyMessageLink(message)}><Link size={17}/>Copiar link da mensagem</button>}
            <button className="context-item" type="button" onClick={() => speakMessage(message)}><Volume2 size={17}/>Falar mensagem</button>
            {persistentMessage && ownMessage && <button className="context-item" type="button" onClick={() => {
              setMessageMenu(null);
              askText("Editar mensagem", "Conteúdo da mensagem", message.content || "", (content) => editMessage(message, content));
            }}><Pencil size={17}/>Editar mensagem</button>}
            {(persistentMessage && (ownMessage || canManageMessages)) && <>
              <div className="context-sep"/>
              <button className="context-item context-danger" type="button" onClick={() => removeMessage(message)}><Trash2 size={17}/>Excluir mensagem</button>
            </>}
            {persistentMessage && !ownMessage && <button className="context-item context-danger" type="button" onClick={() => reportMessage(message)}><Flag size={17}/>Denunciar mensagem</button>}
          </div>
        );
      })()}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button className="context-item disabled" disabled>
            Marcar como lida
          </button>
          <button
            className="context-item"
            onClick={() => {
              copyInvite();
              setContextMenu(null);
            }}
          >
            Convite para o servidor
          </button>
          <button
            className="context-item"
            onClick={() => {
              toggleChannelFlag(
                pinnedChannels,
                setPinnedChannels,
                "sesh_pinned",
                contextMenu.channel.id,
              );
              setContextMenu(null);
            }}
          >
            {pinnedChannels.includes(contextMenu.channel.id)
              ? "Desafixar do topo"
              : "Fixar canal no topo"}
          </button>
          <button
            className="context-item"
            onClick={() => {
              copyText(`${location.origin}/#canal-${contextMenu.channel.id}`);
              setContextMenu(null);
            }}
          >
            Copiar link
          </button>
          <div className="context-sep" />
          <button
            className="context-item"
            onClick={() => {
              toggleChannelFlag(
                mutedChannels,
                setMutedChannels,
                "sesh_muted",
                contextMenu.channel.id,
              );
              setContextMenu(null);
            }}
          >
            {mutedChannels.includes(contextMenu.channel.id)
              ? "Reativar notificações"
              : "Silenciar canal"}
            <span className="context-arrow">›</span>
          </button>
          {canManageChannels && (
            <button
              className="context-item"
              onClick={() => {
                const channel = contextMenu.channel;
                setContextMenu(null);
                askText(
                  "Editar canal — novo nome",
                  channel.name,
                  channel.name,
                  (name) => {
                    if (name !== channel.name) editChannel(channel, name);
                  },
                );
              }}
            >
              Editar canal
            </button>
          )}
          <div className="context-sep" />
          {canManageChannels && (
            <button
              className="context-item"
              onClick={() => {
                const name = `${contextMenu.channel.name}-copia`;
                setContextMenu(null);
                addChannel(name, contextMenu.channel.type);
              }}
            >
              Duplicar canal
            </button>
          )}
          {canManageChannels && (
            <button
              className="context-item"
              onClick={() => {
                setContextMenu(null);
                createChannel("text");
              }}
            >
              Criar canal de texto
            </button>
          )}
          {canManageChannels && (
            <button
              className="context-item"
              onClick={() => {
                setContextMenu(null);
                createChannel("voice");
              }}
            >
              Criar call (canal de voz)
            </button>
          )}
          {canManageChannels && (
            <button
              className="context-item context-danger"
              onClick={() => {
                const channel = contextMenu.channel;
                if (
                  window.confirm(
                    `Excluir o canal "${channel.name}"? Esta ação não pode ser desfeita.`,
                  )
                )
                  removeChannel(channel);
                setContextMenu(null);
              }}
            >
              Excluir canal
            </button>
          )}
          <div className="context-sep" />
          <button
            className="context-item"
            onClick={() => {
              copyText(contextMenu.channel.id);
              setContextMenu(null);
            }}
          >
            <span className="context-id">ID</span>Copiar ID do canal
          </button>
        </div>
      )}
      {serverContextMenu && (() => {
        const server = serverContextMenu.server;
        const preferences = serverPreferences[server.id] || {};
        const muted = preferences.muteUntil === "forever" || Number(preferences.muteUntil) > Date.now();
        const chooseMute = (duration, label) => {
          updateServerPreference(server.id, { muteUntil: duration === "forever" ? "forever" : Date.now() + duration });
          setServerContextMenu(null);
          setNotice(`Notificações de "${server.name}" silenciadas ${label}.`);
        };
        return <>
          <div className="context-menu server-context-menu" style={{ left: serverContextMenu.x, top: serverContextMenu.y }} onClick={(event) => event.stopPropagation()}>
            <button className="context-item" onClick={() => { setNotice(`Tudo em "${server.name}" foi marcado como lido.`); setServerContextMenu(null); }}>Marcar como lida</button>
            <button className="context-item" onClick={() => { copyInvite(server); setServerContextMenu(null); }}>Convidar para o servidor</button>
            <button className="context-item" onClick={() => { customizeInvite(server); setServerContextMenu(null); }}>Personalizar convite</button>
            <div className="context-sep" />
            <button className="context-item" onClick={() => setServerContextMenu((current) => ({ ...current, submenu: current.submenu === "mute" ? null : "mute" }))}>{muted ? "Reativar notificações" : "Silenciar servidor"}<span className="context-arrow">›</span></button>
            <button className="context-item" onClick={() => { updateServerPreference(server.id, { hideMuted: !preferences.hideMuted }); setNotice(preferences.hideMuted ? "Canais silenciados visíveis." : "Canais silenciados ocultos."); }}>Ocultar canais silenciados</button>
            <button className="context-item" onClick={() => { if (server.role === "owner" || server.permissions?.manageRoles || server.permissions?.manageServer) { setSelectedServer(server); setServerSettingsOpen(true); } else setNotice("Seu cargo não pode gerenciar o servidor."); setServerContextMenu(null); }}>Config. do servidor<span className="context-arrow">›</span></button>
            <button className="context-item" onClick={() => { openSettings("account"); setServerContextMenu(null); }}>Config. de privacidade<span className="context-arrow">›</span></button>
            <button className="context-item" onClick={() => { openSettings("account"); setServerContextMenu(null); }}>Editar perfil por servidor</button>
            <div className="context-sep" />
            <button className="context-item context-danger" onClick={() => leaveServer(server)}>Sair do servidor</button>
          </div>
          {serverContextMenu.submenu === "mute" && <div className="context-menu server-mute-menu" style={{ left: Math.min(serverContextMenu.x + 270, window.innerWidth - 220), top: serverContextMenu.y + 116 }} onClick={(event) => event.stopPropagation()}>
            {[[15 * 60_000, "Por 15 minutos"], [60 * 60_000, "Por 1 hora"], [3 * 60 * 60_000, "Por 3 horas"], [8 * 60 * 60_000, "Por 8 horas"], [24 * 60 * 60_000, "Por 24 horas"], ["forever", "Até eu ligá-las de novo"]].map(([duration, label]) => <button key={label} className="context-item" onClick={() => chooseMute(duration, label.toLowerCase())}>{label}</button>)}
          </div>}
        </>;
      })()}      {dialog && (
        <div className="modal-backdrop" onClick={() => setDialog(null)}>
          <section
            className="prompt-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{dialog.title}</h3>
            <input
              autoFocus
              value={dialog.value}
              placeholder={dialog.placeholder}
              onChange={(event) =>
                setDialog({ ...dialog, value: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") submitDialog();
                if (event.key === "Escape") setDialog(null);
              }}
            />
            {dialog.error && <div className="form-error">{dialog.error}</div>}
            <div className="prompt-actions">
              <button className="prompt-cancel" onClick={() => setDialog(null)}>
                Cancelar
              </button>
              <button className="prompt-confirm" onClick={submitDialog}>
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}
      {channelModal && (
        <div className="modal-backdrop" onClick={() => setChannelModal(null)}>
          <section
            className="channel-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="channel-modal-head">
              <div>
                <h3>Criar canal</h3>
                <span className="channel-modal-sub">
                  em {selectedServer.name}
                </span>
              </div>
              <button
                className="modal-close"
                onClick={() => setChannelModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="channel-modal-label">Tipo de canal</div>
            {[
              [
                "text",
                Hash,
                "Texto",
                "Envie mensagens, imagens, GIFs, emojis, opiniões e piadas",
              ],
              [
                "voice",
                Volume2,
                "Voz",
                "Passe tempo com a turma com voz, vídeo e compartilhamento de tela",
              ],
              [
                "forum",
                MessagesSquare,
                "Fórum",
                "Crie um espaço para discussões organizadas",
              ],
              [
                "announcement",
                Megaphone,
                "Announcement",
                "Atualizações importantes para pessoas dentro e fora do servidor",
              ],
              [
                "stage",
                Radio,
                "Palco",
                "Ofereça eventos, painéis, e P&Rs para uma plateia",
              ],
            ].map(([value, Icon, title, desc]) => {
              const disabled = !["text", "voice"].includes(value);
              return (
                <label
                  key={value}
                  className={`channel-type-row ${channelModal.type === value ? "selected-type" : ""} ${disabled ? "type-disabled" : ""}`}
                  onClick={() => {
                    if (!disabled)
                      setChannelModal({ ...channelModal, type: value });
                  }}
                >
                  <input
                    type="radio"
                    name="channel-type"
                    disabled={disabled}
                    checked={channelModal.type === value}
                    readOnly
                  />
                  <Icon size={17} />
                  <div>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                </label>
              );
            })}
            <div className="channel-modal-label">Nome do canal</div>
            <div className="channel-name-box">
              <span>
                {channelModal.type === "voice" ? (
                  <Volume2 size={16} />
                ) : (
                  <Hash size={16} />
                )}
              </span>
              <input
                autoFocus
                value={channelModal.name}
                placeholder="novo-canal"
                onChange={(event) =>
                  setChannelModal({ ...channelModal, name: event.target.value })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitChannelModal();
                  if (event.key === "Escape") setChannelModal(null);
                }}
              />
            </div>
            <div className="channel-modal-private">
              <div>
                <strong>
                  <Lock size={12} /> Canal privado
                </strong>
                <span>
                  Somente membros e cargos selecionados poderão visualizar esse
                  canal.
                </span>
              </div>
              <button
                className={`toggle-switch ${channelModal.private ? "on" : ""}`}
                onClick={() =>
                  setChannelModal({
                    ...channelModal,
                    private: !channelModal.private,
                  })
                }
              />
            </div>
            <div className="channel-modal-actions">
              <button
                className="prompt-cancel channel-cancel"
                onClick={() => setChannelModal(null)}
              >
                Cancelar
              </button>
              <button
                className="prompt-confirm channel-create"
                disabled={!channelModal.name.trim()}
                onClick={submitChannelModal}
              >
                Criar canal
              </button>
            </div>
          </section>
        </div>
      )}
      {notice && (
        <button className="notice" onClick={() => setNotice("")}>
          {notice}
        </button>
      )}
      {false && settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <section
            className="settings-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSettingsOpen(false)}
            >
              <X size={18} />
            </button>
            <div className="settings-nav">
              <strong>Configurações</strong>
              <button
                className={
                  settingsTab === "account" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("account")}
              >
                Minha conta
              </button>
              <button
                className={
                  settingsTab === "appearance" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("appearance")}
              >
                Aparência
              </button>
              <button
                className={
                  settingsTab === "notifications" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("notifications")}
              >
                Notificações
              </button>
              <button
                className={
                  settingsTab === "privacy" ? "settings-nav-active" : ""
                }
                onClick={() => setSettingsTab("privacy")}
              >
                Privacidade
              </button>
              <button className="settings-logout" onClick={onLogout}>
                Sair da conta
              </button>
            </div>
            <div className="settings-content">
              {settingsTab === "account" && accountForm && (
                <>
                  <h2>Minha conta</h2>
                  <div className="account-card">
                    <Avatar
                      user={{ ...currentUser, avatar: accountForm.avatar }}
                      color="purple"
                    />
                    <div>
                      <strong>
                        {accountForm.displayName || currentUser.displayName}
                      </strong>
                      <span>
                        {accountForm.username || currentUser.username}
                      </span>
                    </div>
                  </div>
                  <div className="account-actions">
                    <label className="avatar-upload">
                      Trocar foto / GIF
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onAvatarFile}
                      />
                    </label>
                    {accountForm.avatar && (
                      <button
                        className="secondary-setting"
                        onClick={() =>
                          setAccountForm({ ...accountForm, avatar: null })
                        }
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                  <div className="banner-editor">
                    <div className="account-actions">
                      <label className="avatar-upload">
                        Banner do perfil (imagem, GIF ou cor)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onBannerFile}
                        />
                      </label>
                      {accountForm.banner && (
                        <button
                          className="secondary-setting"
                          onClick={() =>
                            setAccountForm({ ...accountForm, banner: null })
                          }
                        >
                          Remover banner
                        </button>
                      )}
                    </div>
                    {accountForm.banner && (
                      <div
                        className="banner-preview"
                        style={bannerStyle(accountForm.banner)}
                      />
                    )}
                    <div className="banner-swatches">
                      {[
                        "#5865f2",
                        "#23a55a",
                        "#e4ad51",
                        "#b24e64",
                        "#7661e9",
                        "#eb459e",
                        "#1a1a1a",
                      ].map((color) => (
                        <button
                          type="button"
                          key={color}
                          className={`banner-swatch ${accountForm.banner === color ? "banner-swatch-on" : ""}`}
                          style={{ background: color }}
                          title={color}
                          onClick={() =>
                            setAccountForm({ ...accountForm, banner: color })
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <label>
                    Nome de exibição
                    <input
                      value={accountForm.displayName}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          displayName: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Nome de usuário
                    <input
                      value={accountForm.username}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          username: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Bio
                    <input
                      value={accountForm.bio}
                      placeholder="Fale um pouco sobre você"
                      maxLength={300}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          bio: event.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="badge-picker-title">Insígnias do perfil</div>
                  <div className="badge-picker">
                    {Object.entries(BADGES).map(([key, badge]) => (
                      <label className="setting-check" key={key}>
                        <input
                          type="checkbox"
                          disabled={!currentUser.isCreator}
                          checked={accountForm.badges.includes(key)}
                          onChange={(event) =>
                            setAccountForm({
                              ...accountForm,
                              badges: event.target.checked
                                ? [...accountForm.badges, key]
                                : accountForm.badges.filter(
                                    (item) => item !== key,
                                  ),
                            })
                          }
                        />{" "}
                        <img
                          className="badge-picker-img"
                          src={badge.image}
                          alt={badge.label}
                        />{" "}
                        {badge.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {settingsTab === "appearance" && (
                <>
                  <h2>Aparência</h2>
                  <label>
                    Tema
                    <select
                      value={theme}
                      onChange={(event) => {
                        setTheme(event.target.value);
                        savePreference("orbit_theme", event.target.value);
                      }}
                    >
                      <option value="dark">Escuro</option>
                      <option value="midnight">Meia-noite</option>
                      <option value="light">Claro</option>
                    </select>
                  </label>
                  <label className="setting-check">
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(event) => {
                        setCompactMode(event.target.checked);
                        savePreference("orbit_compact", event.target.checked);
                      }}
                    />{" "}
                    Interface compacta
                  </label>
                </>
              )}
              {settingsTab === "notifications" && (
                <>
                  <h2>Notificações</h2>
                  <label className="setting-check">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(event) => {
                        setNotifications(event.target.checked);
                        savePreference(
                          "orbit_notifications",
                          event.target.checked,
                        );
                      }}
                    />{" "}
                    Mostrar notificações de novas mensagens
                  </label>
                  <p className="settings-help">
                    As preferências são salvas neste dispositivo.
                  </p>
                </>
              )}
              {settingsTab === "privacy" && (
                <>
                  <h2>Privacidade</h2>
                  <p className="settings-help">
                    Você controla quem pode entrar nos servidores e participar
                    das chamadas através das permissões do servidor.
                  </p>
                  <button
                    className="secondary-setting"
                    onClick={() =>
                      setNotice(
                        "As configurações de privacidade do servidor estão disponíveis para administradores.",
                      )
                    }
                  >
                    Ver permissões
                  </button>
                </>
              )}
              <button className="save-settings" onClick={saveProfile}>
                Salvar alterações
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Root() {
  const onAppRoute = window.location.pathname.startsWith("/app");
  const onAdminRoute = window.location.pathname.startsWith("/admin");
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    api
      .me()
      .then((result) => {
        localStorage.removeItem("orbit_token");
        setUser(result.user);
      })
      .catch(() => localStorage.removeItem("orbit_token"))
      .finally(() => setChecking(false));
  }, []);
  if (!onAppRoute && !onAdminRoute) return <LandingPage />;
  if (checking)
    return <div className="loading-screen">Verificando sessão...</div>;
  if (!user) return <AuthScreen onLogin={setUser} lockedEmail={onAdminRoute ? "minatinint@gmail.com" : ""} />;
  if (onAdminRoute)
    return (
      <AdminPanel
        user={user}
        onLogout={async () => {
          await api.logout().catch(() => {});
          setUser(null);
        }}
      />
    );
  return (
    <App
      currentUser={user}
      onLogout={async () => {
        await api.logout().catch(() => {});
        localStorage.removeItem("orbit_token");
        setUser(null);
      }}
      onUserUpdate={updated => setUser(current => ({ ...current, ...updated }))}
    />
  );
}
const rootElement = document.getElementById("root");
const appRoot = rootElement.__seshRoot || createRoot(rootElement);
rootElement.__seshRoot = appRoot;
appRoot.render(<Root />);
function AdminPanel({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("banner");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user.isMasterAdmin)
      api.adminCatalog().then((result) => setItems(result.items || [])).catch((err) => setError(err.message));
  }, [user.isMasterAdmin]);
  if (!user.isMasterAdmin)
    return <main className="admin-shell"><section className="admin-card admin-denied"><span>ACESSO RESTRITO</span><h1>Painel Sesh</h1><p>Somente o admin master pode abrir esta área.</p><button onClick={onLogout}>Sair</button></section></main>;
  function chooseBanner(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024)
      return setError("Escolha uma imagem de até 3 MB.");
    const reader = new FileReader();
    reader.onload = () => setValue(String(reader.result));
    reader.onerror = () => setError("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api.createCatalogItem({ type, name, value });
      setItems((current) => [...current, result.item]);
      setName("");
      setValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(itemId) {
    try {
      await api.removeCatalogItem(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <main className="admin-shell">
      <section className="admin-card">
        <header className="admin-header">
          <div><span>SESH ADMIN MASTER</span><h1>Catálogo de personalização</h1><p>Banners padrão, efeitos e molduras disponíveis aos perfis.</p></div>
          <button className="prompt-cancel" onClick={onLogout}>Sair</button>
        </header>
        <form className="admin-catalog-form" onSubmit={submit}>
          <select value={type} onChange={(event) => { setType(event.target.value); setValue(""); }}>
            <option value="banner">Banner padrão</option>
            <option value="effect">Efeito de perfil</option>
            <option value="frame">Moldura de perfil</option>
          </select>
          <input required value={name} placeholder="Nome" onChange={(event) => setName(event.target.value)} />
          {type === "banner" ? <input type="file" accept="image/*" onChange={chooseBanner} /> : (
            <select value={value} required onChange={(event) => setValue(event.target.value)}>
              <option value="">Escolha</option>
              {(type === "effect" ? [["sparkles", "Partículas"], ["glow", "Brilho"], ["embers", "Faíscas"]] : [["ruby", "Rubi"], ["gold", "Ouro"], ["neon", "Neon"], ["ice", "Gelo"]]).map(([entry, label]) => <option key={entry} value={entry}>{label}</option>)}
            </select>
          )}
          <button className="prompt-confirm" disabled={busy || !value}>{busy ? "Salvando..." : "Adicionar"}</button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <div className="admin-catalog-list">
          {items.map((item) => <article key={item.id}><span>{item.type}</span><strong>{item.name}</strong><button onClick={() => remove(item.id)}>Remover</button></article>)}
        </div>
      </section>
    </main>
  );
}
