/* @refresh reset */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { GAME_CATALOG } from "../game-catalog.js";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Camera,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Hash,
  Headphones,
  HelpCircle,
  Lock,
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
  PhoneOff,
  Pin,
  Plus,
  Radio,
  Search,
  Send,
  Settings,
  Smile,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
  X,
} from "lucide-react";
import { api, connectSocket } from "./api";
import "./styles.css";

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
  { title: "Permissões gerais do servidor", permissions: [
    ["viewChannels", "Ver canais", "Permite ver os canais públicos do servidor."],
    ["manageChannels", "Gerenciar canais", "Criar, editar e excluir canais."],
    ["manageRoles", "Gerenciar cargos", "Criar e editar cargos abaixo deste cargo."],
    ["manageExpressions", "Gerenciar expressões", "Gerenciar emojis, figurinhas e sons do servidor."],
    ["manageWebhooks", "Gerenciar webhooks", "Criar, editar e excluir webhooks."],
    ["manageServer", "Gerenciar servidor", "Editar nome, identidade e configurações do servidor."],
    ["createInvite", "Criar convite", "Convidar novas pessoas para este servidor."],
    ["changeNickname", "Alterar apelido", "Alterar o próprio apelido neste servidor."],
  ]},
  { title: "Permissões de membros", permissions: [
    ["manageMembers", "Gerenciar membros", "Atribuir cargos e aplicar ações de moderação."],
    ["manageNicknames", "Gerenciar apelidos", "Alterar os apelidos de outros membros."],
    ["kickMembers", "Expulsar membros", "Remover membros do servidor."],
    ["banMembers", "Banir membros", "Banir membros e remover histórico."],
    ["timeoutMembers", "Membros de castigo", "Impedir temporariamente chat e voz."],
  ]},
  { title: "Permissões de canal de texto", permissions: [
    ["sendMessages", "Enviar mensagens e criar postagens", "Enviar mensagens nos canais de texto."],
    ["sendMessagesThreads", "Enviar mensagens em tópicos e postagens", "Responder em tópicos e fóruns."],
    ["createPublicThreads", "Criar tópicos públicos", "Criar tópicos visíveis para todos."],
    ["createPrivateThreads", "Criar tópicos privados", "Criar tópicos controlados por convite."],
    ["embedLinks", "Incorporar links", "Exibir prévias de links."],
    ["attachFiles", "Anexar arquivos", "Enviar imagens, GIFs e arquivos."],
    ["addReactions", "Adicionar reações", "Usar reações nas mensagens."],
    ["useExternalEmojis", "Usar emojis externos", "Usar emojis de outros servidores."],
    ["useExternalStickers", "Usar figurinhas externas", "Usar figurinhas de outros servidores."],
    ["mentionEveryone", "Mencionar @everyone, @here e cargos", "Notificar todos, quem está online ou membros de um cargo."],
    ["manageMessages", "Gerenciar mensagens", "Excluir mensagens de outros membros."],
    ["pinMessages", "Fixar mensagens", "Fixar ou desafixar mensagens."],
    ["bypassSlowmode", "Ignorar modo lento", "Enviar mensagens sem esperar o modo lento."],
  ]},
  { title: "Permissões de canais de voz", permissions: [
    ["connectVoice", "Conectar", "Entrar em canais de voz."],
    ["speakVoice", "Falar", "Transmitir áudio em chamadas."],
    ["useCamera", "Usar câmera", "Ligar a câmera durante a chamada."],
    ["shareScreen", "Compartilhar tela", "Transmitir a tela em uma chamada."],
    ["prioritySpeaker", "Voz prioritária", "Dar prioridade à própria voz."],
    ["muteMembers", "Silenciar membros", "Silenciar participantes na voz."],
    ["deafenMembers", "Ensurdecer membros", "Desativar o áudio de participantes."],
    ["moveMembers", "Mover membros", "Mover participantes entre canais."],
    ["useVoiceActivity", "Usar atividade de voz", "Transmitir por detecção de voz."],
    ["useSoundboard", "Usar mesa de som", "Usar sons do servidor."],
    ["useExternalSounds", "Usar sons externos", "Usar sons de outros servidores."],
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
function VoiceMediaIndicators({ camera, screen }) {
  if (!camera && !screen) return null;
  return (
    <span className="voice-media-indicators">
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
  return user?.avatar ? (
    <img
      className={`avatar avatar-img avatar-frame-${user?.avatarFrame || "none"} ${small ? "avatar-small" : ""}`}
      src={user.avatar}
      alt=""
      onClick={onClick}
    />
  ) : (
    <div
      className={`avatar avatar-${color} avatar-frame-${user?.avatarFrame || "none"} ${small ? "avatar-small" : ""}`}
      onClick={onClick}
    >
      {value}
    </div>
  );
}

function MessageContent({ content, members, onProfile }) {
  const fragments = String(content || "").split(/(@[a-zA-Z0-9_.-]+)/g);
  return (
    <p>
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
        ) : <React.Fragment key={index}>{fragment}</React.Fragment>;
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
function BadgeContextMenu({ menu, onAdd, onModerate, onAssignRole, onManageRoles, onAddFriend, onCopyHandle }) {
  const isSelf = menu.user.id === menu.currentUserId;
  return (
    <div
      className="context-menu badge-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onClick={(event) => event.stopPropagation()}
    >
      <button className="context-item" onClick={() => menu.onProfile?.()}>
        Perfil
      </button>
      {!isSelf && <>
        <button className="context-item" onClick={onCopyHandle}>
          Copiar nome de usuário
        </button>
        <button className="context-item" onClick={onAddFriend}>
          Adicionar amigo
        </button>
      </>}
      {isSelf && onManageRoles && <>
        <div className="context-sep" />
        <button className="context-item" onClick={onManageRoles}>
          Gerenciar cargos do servidor
        </button>
      </>}
      {(onModerate || onAdd) && <div className="context-sep" />}
      {onModerate && !isSelf && <>
        {onAssignRole && menu.assignableRoles?.length > 0 && <label className="context-role-picker">
          <span>Definir cargo</span>
          <select
            value={menu.user.roleId || "member"}
            onChange={(event) => onAssignRole(event.target.value)}
          >
            {menu.assignableRoles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </label>}
        <button className="context-item" onClick={() => onModerate({ textMuted: !menu.user.textMuted })}>
          {menu.user.textMuted ? "Permitir chat" : "Silenciar chat no servidor"}
        </button>
        <button className="context-item context-danger" onClick={() => onModerate({ voiceMuted: !menu.user.voiceMuted })}>
          {menu.user.voiceMuted ? "Permitir voz" : "Silenciar voz no servidor"}
        </button>
      </>}
      {onAdd && <button className="context-item" onClick={onAdd}>
        Adicionar insígnias
      </button>}
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
function VoiceSettingsPanel({ user, onClose, onAccount, onLogout }) {
  const [micVolume, setMicVolume] = useState(80);
  const [outputVolume, setOutputVolume] = useState(80);
  const [sensitivity, setSensitivity] = useState(55);
  const [automatic, setAutomatic] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [section, setSection] = useState("voice");
  const sectionInfo = {
    privacy: ["Dados e privacidade", "Gerencie os dados da sua conta e como eles são usados."],
    messages: ["Permissões de mensagens", "Defina quem pode enviar mensagens, menções e convites."],
    notifications: ["Notificações", "Escolha quando o Sesh deve chamar sua atenção."],
    plus: ["Sesh Plus", "Gerencie recursos e benefícios da sua assinatura."],
    highlights: ["Destaques da comunidade", "Controle destaques e recomendações de comunidades."],
    subscriptions: ["Assinaturas", "Acompanhe seus planos e pagamentos."],
    voice: ["Voz e vídeo", "Configure dispositivos, transmissão e qualidade de chamada."],
    transmission: ["Transmissão", "Ajuste qualidade e permissões de compartilhamento."],
    sounds: ["Sons", "Controle alertas, sons de interface e volume."],
    advanced: ["Avançado", "Preferências avançadas de experiência e desempenho."],
  };
  const [testing, setTesting] = useState(false);
  const [testingCamera, setTestingCamera] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState(
    localStorage.getItem("sesh_audio_input") || "",
  );
  const [selectedOutput, setSelectedOutput] = useState(
    localStorage.getItem("sesh_audio_output") || "",
  );
  const [selectedCamera, setSelectedCamera] = useState(
    localStorage.getItem("sesh_video_input") || "",
  );
  const cameraPreviewRef = useRef(null);
  const cameraPreviewStreamRef = useRef(null);
  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices?.()
      .then((items) =>
        setDevices(
          items.filter((item) =>
            ["audioinput", "audiooutput", "videoinput"].includes(item.kind),
          ),
        ),
      )
      .catch(() => {});
    return () => {
      cameraPreviewStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  function selectDevice(storageKey, setter, value) {
    setter(value);
    if (value) localStorage.setItem(storageKey, value);
    else localStorage.removeItem(storageKey);
  }
  async function testMicrophone() {
    setTesting(true);
    setDeviceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setDeviceError("Não foi possível acessar o microfone selecionado.");
    }
    setTimeout(() => setTesting(false), 1200);
  }
  async function toggleCameraPreview() {
    if (testingCamera) {
      cameraPreviewStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
      cameraPreviewStreamRef.current = null;
      if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
      setTestingCamera(false);
      return;
    }
    setDeviceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...(selectedCamera ? { deviceId: { exact: selectedCamera } } : {}),
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      cameraPreviewStreamRef.current = stream;
      if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = stream;
      setTestingCamera(true);
      const updated = await navigator.mediaDevices.enumerateDevices();
      setDevices(
        updated.filter((item) =>
          ["audioinput", "audiooutput", "videoinput"].includes(item.kind),
        ),
      );
    } catch {
      setDeviceError("Não foi possível acessar a câmera selecionada.");
    }
  }
  return (
    <div className="voice-settings-backdrop">
      <section className="voice-settings-modal">
        <aside className="voice-settings-nav">
          <div className="voice-settings-user">
            <Avatar
              user={user || { displayName: "Sesh" }}
              color="purple"
              small
            />
            <div>
              <strong>{user?.displayName || "Sesh"}</strong>
              <span>Editar perfil</span>
            </div>
          </div>
          <div className="voice-settings-search">
            <Search size={14} /> Buscar
          </div>
          <button onClick={onAccount}>Conta</button>
          <button className={section === "privacy" ? "voice-settings-active" : ""} onClick={() => setSection("privacy")}>
            <Lock size={15} /> Dados e privacidade
          </button>
          <button className={section === "messages" ? "voice-settings-active" : ""} onClick={() => setSection("messages")}>
            <MessageSquare size={15} /> Permissões de mensagens
          </button>
          <button className={section === "notifications" ? "voice-settings-active" : ""} onClick={() => setSection("notifications")}>
            <Bell size={15} /> Notificações
          </button>
          <hr />
          <small>Cobrança</small>
          <button className={section === "plus" ? "voice-settings-active" : ""} onClick={() => setSection("plus")}>Sesh Plus</button>
          <button className={section === "highlights" ? "voice-settings-active" : ""} onClick={() => setSection("highlights")}>Destaques da comunidade</button>
          <button className={section === "subscriptions" ? "voice-settings-active" : ""} onClick={() => setSection("subscriptions")}>Assinaturas</button>
          <hr />
          <small>Experiência</small>
          <button className={section === "voice" ? "voice-settings-active" : ""} onClick={() => setSection("voice")}>
            <Mic size={15} /> Voz e vídeo
          </button>
          <button className="voice-settings-sub" onClick={() => setSection("voice")}>Voz</button>
          <button className="voice-settings-sub" onClick={() => setSection("transmission")}>Transmissão</button>
          <button className="voice-settings-sub" onClick={() => setSection("sounds")}>Sons</button>
          <button className="voice-settings-sub" onClick={() => setSection("advanced")}>Avançado</button>
          <hr />
          <button
            className="voice-settings-logout"
            onClick={() => {
              if (window.confirm("Deseja sair da sua conta?")) onLogout();
            }}
          >
            <LogOut size={15} /> Sair da conta
          </button>
        </aside>
        <main className="voice-settings-content">
          <button className="voice-settings-close" onClick={onClose}>
            <X size={18} />
          </button>
          <header>{sectionInfo[section].at(0)}</header>
          <div className={`voice-settings-scroll settings-section-${section}`}>
            {section !== "voice" && (
              <section className="settings-section-card">
                <h1>{sectionInfo[section].at(0)}</h1>
                <p>{sectionInfo[section].at(1)}</p>
              </section>
            )}
            <h1>Voz</h1>
            <div className="voice-device-grid">
              <label>
                Microfone
                <select
                  value={selectedMic}
                  onChange={(event) =>
                    selectDevice(
                      "sesh_audio_input",
                      setSelectedMic,
                      event.target.value,
                    )
                  }
                >
                  <option value="">Dispositivo padrão</option>
                  {devices
                    .filter((item) => item.kind === "audioinput")
                    .map((item) => (
                      <option key={item.deviceId} value={item.deviceId}>
                        {item.label || "Microfone"}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Alto-falante
                <select
                  value={selectedOutput}
                  onChange={(event) =>
                    selectDevice(
                      "sesh_audio_output",
                      setSelectedOutput,
                      event.target.value,
                    )
                  }
                >
                  <option value="">Dispositivo padrão</option>
                  {devices
                    .filter((item) => item.kind === "audiooutput")
                    .map((item) => (
                      <option key={item.deviceId} value={item.deviceId}>
                        {item.label || "Alto-falante"}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Câmera
                <select
                  value={selectedCamera}
                  onChange={(event) =>
                    selectDevice(
                      "sesh_video_input",
                      setSelectedCamera,
                      event.target.value,
                    )
                  }
                >
                  <option value="">Dispositivo padrão</option>
                  {devices
                    .filter((item) => item.kind === "videoinput")
                    .map((item) => (
                      <option key={item.deviceId} value={item.deviceId}>
                        {item.label || "Câmera"}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="voice-slider-grid">
              <label>
                Volume do Microfone
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micVolume}
                  onChange={(event) => setMicVolume(event.target.value)}
                />
              </label>
              <label>
                Volume do Alto-falante
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={outputVolume}
                  onChange={(event) => setOutputVolume(event.target.value)}
                />
              </label>
            </div>
            <div className="voice-test-row">
              <button onClick={testMicrophone}>
                {testing ? "Testando..." : "Teste do microfone"}
              </button>
              <div className="voice-meter">
                {Array.from({ length: 34 }, (_, index) => (
                  <i key={index} />
                ))}
              </div>
            </div>
            <div className="camera-test">
              <video
                ref={cameraPreviewRef}
                autoPlay
                muted
                playsInline
                className={testingCamera ? "camera-preview-on" : ""}
              />
              <button onClick={toggleCameraPreview}>
                {testingCamera ? "Encerrar prévia" : "Testar câmera"}
              </button>
            </div>
            {deviceError && <div className="form-error">{deviceError}</div>}
            <p className="voice-help">
              Precisa de ajuda? Confira nosso{" "}
              <span>guia de solução de problemas</span>
            </p>
            <hr />
            <h2>Perfil de entrada</h2>
            {[
              [
                "isolated",
                "Isolamento de Voz",
                "Só a sua voz: deixe o Sesh equilibrar o ruído",
              ],
              [
                "studio",
                "Estúdio",
                "Áudio puro: microfone aberto e sem processamento",
              ],
              [
                "custom",
                "Personalizado",
                "Modo avançado: use de todos os botões e mostradores!",
              ],
            ].map(([value, label, help]) => (
              <label className="voice-radio" key={value}>
                <input
                  type="radio"
                  name="profile"
                  defaultChecked={value === "custom"}
                />{" "}
                <span>
                  <strong>{label}</strong>
                  <small>{help}</small>
                </span>
              </label>
            ))}
            <div className="voice-toggle-row">
              <div>
                <strong>
                  Ajustar Automaticamente a Sensibilidade de Entrada
                </strong>
                <small>
                  Controla quanto o Sesh transmite do seu microfone.
                </small>
              </div>
              <button
                className={`voice-toggle ${automatic ? "on" : ""}`}
                onClick={() => setAutomatic((value) => !value)}
              >
                <span />
              </button>
            </div>
            <input
              className="voice-full-slider"
              type="range"
              min="0"
              max="100"
              value={sensitivity}
              onChange={(event) => setSensitivity(event.target.value)}
            />
            <div className="voice-toggle-row">
              <div>
                <strong>Supressão de ruído</strong>
                <small>Reduz sons indesejados durante a conversa.</small>
              </div>
              <button
                className={`voice-toggle ${noiseSuppression ? "on" : ""}`}
                onClick={() => setNoiseSuppression((value) => !value)}
              >
                <span />
              </button>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
function RoleConfigPanel({ role, members, onUpdate, onAssignMember, onSave, saving, onClose }) {
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
            <label>Nome do cargo<input value={role.name} maxLength={40} onChange={(event) => onUpdate(role.id, { name: event.target.value })} /></label>
            <label>Cor do cargo<input type="color" value={role.color} onChange={(event) => onUpdate(role.id, { color: event.target.value })} /></label>
            <label>Estilo<select value={role.style || "solid"} onChange={(event) => onUpdate(role.id, { style: event.target.value })}><option value="solid">Sólido</option><option value="glow">Brilho</option><option value="pulse">Pulso</option><option value="blink">Piscar</option></select></label>
            <div className="role-icon-upload"><div className="role-icon-preview" style={{ "--role-preview-color": role.color }}>{role.icon ? <img src={role.icon} alt="" /> : <i />}</div><div><strong>Ícone do cargo</strong><small>Envie uma imagem de até 250 KB para identificar este cargo.</small><div><label className="role-icon-button">Escolher imagem<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={chooseRoleIcon} /></label>{role.icon && <button type="button" onClick={() => onUpdate(role.id, { icon: null })}>Remover</button>}</div>{imageError && <em>{imageError}</em>}</div></div>
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
        {tab === "members" && <section className="role-member-manager"><div className="role-member-manager-head"><p>Escolha quem terá este cargo. Um membro usa um cargo por vez.</p><strong>{roleMembers.length} membro{roleMembers.length === 1 ? "" : "s"}</strong></div>{members.map((member) => <label key={member.id} className="role-member-row"><span><Avatar user={member} color={member.avatarColor || "purple"} small /><strong>{member.displayName}</strong><small>@{member.username}</small></span><input type="checkbox" checked={member.roleId === role.id} onChange={(event) => onAssignMember(member.id, event.target.checked ? role.id : "member")} /></label>)}</section>}
        <footer className="role-config-actions"><button type="button" onClick={onClose}>Fechar</button><button type="button" className="prompt-confirm" disabled={saving} onClick={async () => { const saved = await onSave(); if (saved) onClose(); }}>{saving ? "Salvando..." : "Salvar cargo"}</button></footer>
      </section>
    </div>
  );
}
function ServerSettingsPanel({ server, members = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: server.name || "", tag: server.tag || "", icon: server.icon || null,
    banner: server.banner || null, accentColor: server.accentColor || "#c93642", roles: server.roles || [],
    memberRoles: Object.fromEntries(members.filter((member) => member.id !== server.ownerId).map((member) => [member.id, member.roleId || "member"])),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rolesSaved, setRolesSaved] = useState(false);
  const [roleEditorId, setRoleEditorId] = useState(null);
  const [settingsSection, setSettingsSection] = useState("overview");
  useEffect(() => {
    const handleEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  function addRole() {
    const roleId = `role_${Date.now()}`;
    setForm((current) => ({ ...current, roles: [...current.roles, { id: roleId, name: "Novo cargo", color: "#c93642", style: "solid", permissions: { ...DEFAULT_CUSTOM_ROLE_PERMISSIONS } }] }));
    setRoleEditorId(roleId);
  }
  function updateRole(roleId, patch) {
    setForm((current) => ({ ...current, roles: current.roles.map((role) => role.id === roleId ? { ...role, ...patch } : role) }));
  }
  function assignRoleMember(userId, roleId) {
    setForm((current) => ({ ...current, memberRoles: { ...current.memberRoles, [userId]: roleId } }));
  }
  function moveRole(roleId, direction) {
    setForm((current) => {
      const custom = current.roles.map((role, index) => ({ role, index })).filter(({ role }) => !["owner", "member"].includes(role.id));
      const from = custom.findIndex(({ role }) => role.id === roleId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= custom.length) return current;
      const roles = [...current.roles];
      [roles[custom[from].index], roles[custom[to].index]] = [roles[custom[to].index], roles[custom[from].index]];
      return { ...current, roles };
    });
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
    try { await onSave({ roles: form.roles, memberRoles: form.memberRoles }); setRolesSaved(true); return true; }
    catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await onSave({ name: form.name.trim(), tag: form.tag.trim().toUpperCase(), icon: form.icon, banner: form.banner, accentColor: form.accentColor, roles: form.roles, memberRoles: form.memberRoles });
      onClose();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const customRoles = form.roles.filter((role) => !["owner", "member"].includes(role.id));
  const defaultRole = form.roles.find((role) => role.id === "member");
  const configurableMembers = members.filter((member) => member.id !== server.ownerId);
  return (
    <div className="modal-backdrop server-settings-backdrop" onClick={onClose}>
      <section className="server-settings-modal server-settings-workspace" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar configurações"><X size={18} /></button>
        <aside className="server-settings-nav" aria-label="Configurações do servidor">
          <div className="server-settings-nav-title">SERVIDOR DE {String(form.name || "SESH").toUpperCase()}</div>
          <button type="button" className={settingsSection === "overview" ? "active" : ""} onClick={() => setSettingsSection("overview")}>Visão geral</button>
          <button type="button" className={settingsSection === "roles" ? "active" : ""} onClick={() => setSettingsSection("roles")}>Cargos</button>
          <button type="button" className={settingsSection === "members" ? "active" : ""} onClick={() => setSettingsSection("members")}>Membros</button>
          <div className="server-settings-nav-divider" />
          <p>As alterações são salvas em cada seção.</p>
        </aside>
        <main className="server-settings-content">
          {settingsSection === "overview" && <form className="server-overview-form" onSubmit={submit}>
            <header><span>VISÃO GERAL</span><h2>Perfil do servidor</h2><p>Escolha como sua comunidade aparece para todos os membros.</p></header>
            <div className="server-settings-preview" style={{ ...bannerStyleValue(form.banner), "--server-accent": form.accentColor }}>
              <div className="server-settings-icon">{form.icon?.startsWith?.("data:image/") ? <img src={form.icon} alt="" /> : <span>{String(form.icon || form.name || "S").slice(0, 2)}</span>}</div>
              <div><strong>{form.name || "Nome do servidor"}</strong>{form.tag && <span>{form.tag}</span>}</div>
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
            <p className="server-role-hint">A lista define a prioridade: cargos mais acima aparecem primeiro. Use “Separar membros” dentro de cada cargo para criar uma seção na lateral.</p>
            <section className="settings-roles-list">
              {defaultRole && <article className="settings-role-item default-role"><div className="settings-role-main"><i className="role-color-dot" /><span><strong>Permissões padrão</strong><small>@everyone · aplicadas a todos os membros</small></span></div><button type="button" className="role-edit" onClick={() => setRoleEditorId(defaultRole.id)}>Editar</button></article>}
              {customRoles.map((role, index) => <article key={role.id} className="settings-role-item" style={{ "--role-preview-color": role.color }}><div className="settings-role-main"><i className={role.icon ? "role-list-icon has-image" : "role-color-dot"}>{role.icon && <img src={role.icon} alt="" />}</i><span><strong>{role.name || "Novo cargo"}</strong><small>{role.hoist ? "Membros separados na lateral" : "Lista geral de membros"}</small></span></div><div className="role-list-actions"><button type="button" className="role-move" title="Subir" aria-label="Subir cargo" onClick={() => moveRole(role.id, -1)}>↑</button><button type="button" className="role-move" title="Descer" aria-label="Descer cargo" onClick={() => moveRole(role.id, 1)}>↓</button><button type="button" className="role-edit" onClick={() => setRoleEditorId(role.id)}>Editar</button><button type="button" className="role-remove" onClick={() => setForm((current) => ({ ...current, roles: current.roles.filter((item) => item.id !== role.id) }))}>Remover</button></div><span className="role-order">#{index + 1}</span></article>)}
              {!customRoles.length && <div className="role-empty-state"><strong>Nenhum cargo criado</strong><span>Crie o primeiro cargo para organizar permissões e membros.</span></div>}
            </section>
            {rolesSaved && <p className="role-save-feedback">Cargos salvos.</p>}{error && <div className="form-error">{error}</div>}
            <div className="role-page-actions"><button type="button" className="prompt-confirm" onClick={saveRoles} disabled={busy}>{busy ? "Salvando..." : "Salvar cargos"}</button></div>
          </section>}
          {settingsSection === "members" && <section className="server-members-page">
            <header><span>MEMBROS</span><h2>Gerenciar membros</h2><p>Defina um cargo para cada pessoa. O dono do servidor permanece no topo.</p></header>
            <section className="settings-members-list">{configurableMembers.map((member) => <label className="server-role-member" key={member.id}><span><Avatar user={member} color={member.avatarColor || "purple"} small /><strong>{member.displayName}</strong><small>@{member.username}</small></span><select value={form.memberRoles[member.id] || "member"} onChange={(event) => assignRoleMember(member.id, event.target.value)}>{form.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>)}{!configurableMembers.length && <div className="role-empty-state"><strong>Ainda não há membros</strong><span>Quando alguém entrar, você poderá atribuir um cargo aqui.</span></div>}</section>
            {rolesSaved && <p className="role-save-feedback">Membros atualizados.</p>}{error && <div className="form-error">{error}</div>}
            <div className="role-page-actions"><button type="button" className="prompt-confirm" onClick={saveRoles} disabled={busy}>{busy ? "Salvando..." : "Salvar membros"}</button></div>
          </section>}
        </main>
        {roleEditorId && form.roles.find((role) => role.id === roleEditorId) && <RoleConfigPanel role={form.roles.find((role) => role.id === roleEditorId)} members={configurableMembers} onUpdate={updateRole} onAssignMember={assignRoleMember} onSave={saveRoles} saving={busy} onClose={() => setRoleEditorId(null)} />}
      </section>
    </div>
  );
}
function ProfileSettingsPanel({
  user,
  onClose,
  onSave,
  onPrivacy,
  onCustomize,
  catalogItems = [],
}) {
  const [tab, setTab] = useState("profile");
  const [customizer, setCustomizer] = useState(null);
  const [form, setForm] = useState({
    displayName: user.displayName,
    username: user.username,
    bio: user.bio || "",
    avatar: user.avatar,
    banner: user.banner || null,
    badges: user.badges || [],
    email: user.email || "",
    password: "",
    nameStyle: user.nameStyle || "default",
    nameEffect: user.nameEffect || "solid",
    nameColor: user.nameColor || "#f1f3f5",
    profileTheme: user.profileTheme || "default",
    profilePlate: user.profilePlate || "default",
    profileEffect: user.profileEffect || "none",
    avatarFrame: user.avatarFrame || "none",
    gameInterests: user.gameInterests || [],
    favoriteGame: user.favoriteGame || "",
    activityText: user.activityText || "",
    wishlist: user.wishlist || "",
  });
  const [gameQuery, setGameQuery] = useState("");
  const [imageError, setImageError] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarInputRef = useRef(null);
  const filteredGames = useMemo(() => GAME_CATALOG.filter((game) =>
    !gameQuery.trim() || game.name.toLowerCase().includes(gameQuery.trim().toLowerCase()),
  ).slice(0, 80), [gameQuery]);
  const toggleGame = (game) => update("gameInterests", form.gameInterests.includes(game.id)
    ? form.gameInterests.filter((gameId) => gameId !== game.id) : [...form.gameInterests, game.id].slice(0, 12));
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  function readDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }
  function shrinkImage(file) {
    return new Promise((resolve, reject) => {
      const source = URL.createObjectURL(file);
      const image = new Image();
      image.onerror = () => { URL.revokeObjectURL(source); reject(new Error("Não foi possível abrir essa imagem.")); };
      image.onload = () => {
        const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(source);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = source;
    });
  }
  async function chooseProfileImage(key, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageError("");
    if (!file.type.startsWith("image/")) return setImageError("Escolha uma imagem PNG, JPG, GIF ou WebP.");
    try {
      let image = await readDataUrl(file);
      if (image.length > 4_000_000) {
        if (file.type === "image/gif") return setImageError("Esse GIF é grande demais. Escolha um GIF de até 3 MB.");
        image = await shrinkImage(file);
      }
      if (image.length > 4_000_000) return setImageError("Não foi possível reduzir essa imagem. Escolha uma foto menor que 3 MB.");
      update(key, image);
    } catch {
      setImageError("Não foi possível ler essa imagem.");
    }
  }
  async function applyCustomization(values) {
    try {
      await onCustomize(values);
      setForm((current) => ({ ...current, ...values }));
      setCustomizer(null);
    } catch {
      // O componente pai já exibe a mensagem retornada pela API.
    }
  }
  return (
    <div className="profile-settings-backdrop">
      <section className="profile-settings-modal">
        <aside className="profile-settings-side">
          <div className="profile-settings-switcher">
            Perfil principal <ChevronDown size={14} />
          </div>
          <nav className="profile-settings-section-nav">
            <button type="button" className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Editar perfil</button>
            <button type="button" className={tab === "account" ? "active" : ""} onClick={() => setTab("account")}>Informações da conta</button>
          </nav>

          <div className="profile-settings-side-title">
            Placa de identificação
          </div>
          <button
            type="button"
            className="profile-settings-id-card"
            onClick={() =>
              setCustomizer({ kind: "plate", key: "profilePlate" })
            }
          >
            <Avatar user={form} color="purple" small />
            <span />
            <Plus size={16} />
          </button>
          <div className="profile-settings-side-title">Avatar e decorações</div>
          <div className="profile-settings-tiles">
            <div className="profile-avatar-control">
              <button type="button" className="profile-avatar-photo-tile" aria-label="Opções do avatar" onClick={() => setAvatarMenuOpen((open) => !open)}>
                <Avatar user={form} color="purple" />
                <span>Editar avatar</span>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(event) => chooseProfileImage("avatar", event)} />
              {avatarMenuOpen && <div className="profile-avatar-menu"><button type="button" onClick={() => { setAvatarMenuOpen(false); avatarInputRef.current?.click(); }}>Mudar avatar</button><button type="button" onClick={() => { setAvatarMenuOpen(false); setCustomizer({ kind: "frame", key: "avatarFrame" }); }}>Mudar decoração de avatar</button></div>}
            </div>
            <button
              type="button"
              aria-label="Alterar moldura do avatar"
              onClick={() =>
                setCustomizer({ kind: "frame", key: "avatarFrame" })
              }
            >
              <Plus size={22} />
            </button>
          </div>
          <div className="profile-settings-side-title">
            Estilo do nome exibido
          </div>
          <button
            type="button"
            className="profile-name-style"
            onClick={() => setCustomizer({ kind: "name", key: "nameStyle" })}
          >
            {form.displayName || "Sesh"}
          </button>
          <div className="profile-settings-side-title">Tema e faixa</div>
          <div className="profile-settings-themes">
            <button
              type="button"
              aria-label="Alterar tema do perfil"
              onClick={() =>
                setCustomizer({ kind: "theme", key: "profileTheme" })
              }
            />
            <button
              type="button"
              aria-label="Alterar faixa do perfil"
              onClick={() =>
                setCustomizer({ kind: "theme", key: "profileTheme" })
              }
            />
          </div>
          <div className="profile-settings-side-title">
            Efeitos de perfil e molduras
          </div>
          <div className="profile-settings-tiles">
            <button
              type="button"
              onClick={() =>
                setCustomizer({ kind: "effect", key: "profileEffect" })
              }
            >
              <Plus size={22} />
            </button>
            <button
              type="button"
              onClick={() =>
                setCustomizer({ kind: "plate", key: "profilePlate" })
              }
            >
              <Plus size={22} />
            </button>
          </div>
        </aside>
        <main className="profile-settings-main">
          <button className="profile-settings-close" onClick={onClose}>
            <X size={18} />
          </button>
                    <div className="profile-settings-topbar"><div><span>{tab === "profile" ? "EDITAR PERFIL" : "INFORMAÇÕES DA CONTA"}</span><strong>{tab === "profile" ? "Personalize seu perfil" : "Dados e segurança"}</strong></div><button type="button" onClick={() => onSave(form)}>{tab === "profile" ? "Salvar perfil" : "Salvar conta"}</button></div>
{tab === "profile" ? (
            <>
              <section
                className="profile-preview"
                data-profile-effect={form.profileEffect}
                data-profile-theme={form.profileTheme}
                data-profile-plate={form.profilePlate}
              >
                <ProfileEffectLayer effect={form.profileEffect} />
                <div
                  className="profile-preview-banner"
                  style={bannerStyleValue(form.banner)}
                />
                <div className="profile-preview-body">
                  <Avatar user={form} color="purple" />
                  <h1>{form.displayName || "Sesh"}</h1>
                  <div>{form.username || "usuario"}</div>
                  <p>{form.bio || "Adicione uma biografia ao seu perfil."}</p>
                  {(form.activityText || form.favoriteGame) && (
                    <div className="profile-preview-activity">
                      <strong>{form.activityText || "Jogando agora"}</strong>
                      {form.favoriteGame && <span>{form.favoriteGame}</span>}
                    </div>
                  )}
                  <div className="profile-preview-badges">
                    {form.badges.map((key) =>
                      BADGES[key] ? (
                        <BadgeIcon key={key} badge={BADGES[key]} />
                      ) : null,
                    )}
                  </div>
                </div>
              </section>
              <section className="profile-settings-right">
                <nav>
                  <button className="profile-tab-active">Mural</button>
                  <button>Atividade</button>
                  <button>Lista de desejos</button>
                </nav>
                <h2>Personalize seu perfil com widgets</h2>
                <p>
                  Explore nossa biblioteca de widgets para compartilhar mais
                  sobre você e seus interesses
                </p>
                <div className="profile-widget-grid">
                  <label>
                    Atividade atual
                    <input
                      value={form.activityText}
                      placeholder="Ex.: Jogando com a comunidade"
                      onChange={(event) =>
                        update("activityText", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Jogo favorito
                    <input
                      value={form.favoriteGame}
                      placeholder="Qual jogo não sai da sua lista?"
                      onChange={(event) =>
                        update("favoriteGame", event.target.value)
                      }
                    />
                  </label>
                  <label className="profile-wishlist-field">
                    Lista de desejos
                    <textarea
                      value={form.wishlist}
                      placeholder="Jogos, filmes e experiências que você quer conhecer"
                      onChange={(event) =>
                        update("wishlist", event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className="game-interest-picker">
                  <div className="game-interest-head">
                    <strong>Jogos de interesse</strong>
                    <span>{form.gameInterests.length}/12</span>
                  </div>
                  <input
                    value={gameQuery}
                    placeholder="Pesquisar nos 400 jogos mais populares"
                    onChange={(event) => setGameQuery(event.target.value)}
                  />
                  <div className="game-interest-list">
                    {filteredGames.map((game) => (
                      <button type="button" key={game.id} className={form.gameInterests.includes(game.id) ? "game-interest-selected" : ""} onClick={() => toggleGame(game)}>
                        <span className="game-interest-icon" style={{ background: game.accent }}>{game.name.slice(0, 1)}</span>
                        <span>{game.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              <div className="profile-settings-fields">
                <div className="profile-image-actions">
                  <label className="avatar-upload">
                    Trocar foto / GIF
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => chooseProfileImage("avatar", event)}
                    />
                  </label>
                  {form.avatar && (
                    <button type="button" onClick={() => update("avatar", null)}>
                      Remover foto
                    </button>
                  )}
                  <label className="avatar-upload">
                    Trocar banner
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => chooseProfileImage("banner", event)}
                    />
                  </label>
                  {form.banner && (
                    <button type="button" onClick={() => update("banner", null)}>
                      Remover banner
                    </button>
                  )}
                {catalogItems.some((item) => item.type === "banner" && item.active !== false) && (
                  <label>
                    Banner padrão
                    <select defaultValue="" onChange={(event) => {
                      if (event.target.value) update("banner", event.target.value);
                    }}>
                      <option value="">Escolha um banner do catálogo</option>
                      {catalogItems.filter((item) => item.type === "banner" && item.active !== false).map((item) => (
                        <option key={item.id} value={item.value}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                </div>
                {imageError && <p className="profile-image-error">{imageError}</p>}
                <label>
                  Nome de exibição
                  <input
                    value={form.displayName}
                    onChange={(event) =>
                      update("displayName", event.target.value)
                    }
                  />
                </label>
                <label>
                  Nome de usuário
                  <input
                    value={form.username}
                    onChange={(event) => update("username", event.target.value)}
                  />
                  <small>
                    Use este nome para que outras pessoas adicionem você.
                  </small>
                </label>
                <label>
                  Bio
                  <textarea
                    value={form.bio}
                    onChange={(event) => update("bio", event.target.value)}
                  />
                </label>
                <div className="profile-settings-badges">
                  <strong>Insígnias do perfil</strong>
                  {Object.entries(BADGES)
                    .filter(([key]) => key !== "criador" || user.isCreator)
                    .map(([key, badge]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        disabled={!user.isMasterAdmin}
                        checked={form.badges.includes(key)}
                        onChange={(event) =>
                          update(
                            "badges",
                            event.target.checked
                              ? [...form.badges, key]
                              : form.badges.filter((item) => item !== key),
                          )
                        }
                      />
                      <img src={badge.image} alt={badge.label} />
                      {badge.label}
                    </label>
                    ))}
                </div>
                <div className="profile-settings-actions">
                  <button onClick={() => onSave(form)}>
                    Salvar alterações
                  </button>
                  <button onClick={() => setTab("account")}>
                    Dados e privacidade
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="profile-privacy">
              <h1>Informações da conta</h1>
              <p>
                Gerencie seu e-mail, nome de usuário e senha separadamente da edição visual do perfil.
              </p>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </label>
              <label>
                Nova senha
                <input
                  type="password"
                  placeholder="Deixe vazio para manter a senha atual"
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                />
              </label>
              <label>
                Nome de usuário
                <input
                  value={form.username}
                  onChange={(event) => update("username", event.target.value)}
                />
              </label>
              <button onClick={() => onSave(form)}>Salvar dados</button>
              <button
                className="profile-back-button"
                onClick={() => setTab("profile")}
              >
                Voltar ao perfil
              </button>
            </div>
          )}
        </main>
      </section>
      {customizer?.kind === "name" && (
        <WorkingFontStyleModal
          user={form}
          onClose={() => setCustomizer(null)}
          onApply={(selection) =>
            applyCustomization({
              nameStyle: selection.font,
              nameEffect: selection.effect,
              nameColor: selection.color,
            })
          }
        />
      )}
      {customizer && customizer.kind !== "name" && (
        <CanvasChoiceModal
          title={
            customizer.kind === "plate"
              ? "Alterar placa de identificação"
              : customizer.kind === "effect"
                ? "Alterar efeito do perfil"
                : customizer.kind === "frame"
                  ? "Alterar moldura do avatar"
                  : "Alterar tema do perfil"
          }
          kind={customizer.kind}
          current={form[customizer.key]}
          onClose={() => setCustomizer(null)}
          onApply={(value) => applyCustomization({ [customizer.key]: value })}
          catalogItems={catalogItems}
        />
      )}
    </div>
  );
}
function bannerStyleValue(banner) {
  if (!banner) return undefined;
  return String(banner).startsWith("data:image/")
    ? { backgroundImage: `url(${banner})` }
    : { background: banner };
}
function DirectConversation({ user, onClose, onOpenProfile }) {
  if (!user) return null;
  return (
    <div className="direct-conversation">
      <header className="direct-header">
        <button className="direct-back" onClick={onClose}>
          ‹
        </button>
        <span className="avatar-dot-wrap">
          <Avatar user={user} color={user.avatarColor || "purple"} small />
          <span
            className={`presence-dot presence-${user.presence || "offline"}`}
          />
        </span>
        <div className="direct-header-person">
          <strong>{user.displayName}</strong>
          <span>
            {user.username} {user.presence === "voice" ? "• Em voz" : ""}
          </span>
        </div>
        <div className="direct-header-actions">
          <button title="Iniciar chamada">
            <PhoneOff size={17} />
          </button>
          <button title="Vídeo">
            <Video size={17} />
          </button>
          <button title="Fixar">
            <Pin size={17} />
          </button>
          <button title="Ver perfil" onClick={onOpenProfile}>
            <Users size={17} />
          </button>
        </div>
      </header>
      <main className="direct-main">
        <div className="direct-messages">
          <div className="direct-welcome">
            <Avatar user={user} color={user.avatarColor || "purple"} />
            <h2>{user.displayName}</h2>
            <p>Este é o começo da sua conversa com {user.username}.</p>
          </div>
        </div>
        <form
          className="direct-composer"
          onSubmit={(event) => event.preventDefault()}
        >
          <Plus size={18} />
          <input placeholder={`Conversar com @${user.username}`} />
          <Smile size={18} />
        </form>
      </main>
      <aside className="direct-profile">
        <div className="direct-profile-banner" />
        <Avatar user={user} color={user.avatarColor || "purple"} />
        <h2>{user.displayName}</h2>
        <span className="direct-profile-username">{user.username}</span>
        {user.bio && <p>{user.bio}</p>}
        <div className="direct-profile-section">MÚLTIPLAS CONEXÕES</div>
        <button className="direct-profile-link" onClick={onOpenProfile}>
          Ver Perfil Completo
        </button>
        {user.voice && (
          <div className="direct-voice-card">
            <strong>Em voz</strong>
            <span>{user.voice.channelName}</span>
            <button>Abrir chamada de voz</button>
          </div>
        )}
      </aside>
    </div>
  );
}

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
              <span>Usuário ou e-mail</span>
              <input
                required
                autoFocus
                autoComplete="username"
                placeholder="Digite seu usuário"
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
                  minLength="6"
                  type={showPassword ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder="Mínimo de 6 caracteres"
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
  const [catalogItems, setCatalogItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [memberListOpen, setMemberListOpen] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
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
  const [voiceStates, setVoiceStates] = useState({});
  const [voiceChannel, setVoiceChannel] = useState(null);
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
  const socketRef = useRef(null);
  const selectedServerRef = useRef(selectedServer);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const audioRefs = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());
  const [contextMenu, setContextMenu] = useState(null);
  const [serverContextMenu, setServerContextMenu] = useState(null);
  const [badgeMenu, setBadgeMenu] = useState(null);
  const [badgeEditor, setBadgeEditor] = useState(null);
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
      camera: camOn,
      screen: screenOn,
    });
  }, [voiceConnected, voiceChannel?.id, camOn, screenOn]);
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
    setProfileData("loading");
    api
      .profile(profileView.userId)
      .then((result) => setProfileData(result))
      .catch((err) => {
        setNotice(err.message);
        setProfileView(null);
      });
    const onKey = (event) => {
      if (event.key === "Escape") setProfileView(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profileView]);
  useEffect(() => {
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
    document.querySelectorAll(".member").forEach((row) => {
      const username = row
        .querySelector(".member-role")
        ?.textContent?.replace(/^@/, "");
      const member = members.find((item) => item.username === username);
      if (!member || row.querySelector(".member-plate-label")) return;
      const plate = member.profilePlate || "default";
      row.classList.add(`member-plate-${plate}`);
      if (plate !== "default") {
        const label = document.createElement("span");
        label.className = "member-plate-label";
        label.textContent =
          plate === "stars" ? "✦" : plate === "waves" ? "〰" : "✧";
        row.querySelector(".member-role")?.after(label);
      }
    });
  }, [members]);
  useEffect(() => {
    return;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(statusMenuEl());
    return () => {
      root.unmount();
      host.remove();
    };
  }, [statusMenu, selectedServer, currentUser.status]);
  useEffect(() => {
    return;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(
      <VoiceSettingsPanel
        user={currentUser}
        onClose={() => setSettingsOpen(false)}
        onAccount={() => setSettingsTab("account")}
      />,
    );
    return () => {
      root.unmount();
      host.remove();
    };
  }, [settingsOpen, settingsTab]);
  useEffect(() => {
    return;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(
      <ProfileSettingsPanel
        user={{ ...currentUser, ...accountForm }}
        onClose={() => setSettingsOpen(false)}
        onPrivacy={() => setSettingsTab("account")}
        onSave={saveProfileSettings}
      />,
    );
    return () => {
      root.unmount();
      host.remove();
    };
  }, [settingsOpen, settingsTab, currentUser, accountForm]);
  useEffect(() => {
    return;
    let host;
    let root;
    const closeFontModal = () => {
      if (root && host) {
        root.unmount();
        host.remove();
        root = null;
        host = null;
      }
    };
    const openFontModal = (event) => {
      const target = event.target.closest?.(".profile-name-style");
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      host = document.createElement("div");
      document.body.appendChild(host);
      root = createRoot(host);
      root.render(
        <FontStyleModal
          current={currentUser.nameStyle || "default"}
          onClose={closeFontModal}
          onApply={async (selection) => {
            try {
              const result = await api.updateMe({
                nameStyle: selection.font,
                nameEffect: selection.effect,
                nameColor: selection.color,
              });
              onUserUpdate(result.user);
              setNotice("Estilo do nome aplicado com sucesso.");
              closeFontModal();
            } catch (err) {
              setNotice(err.message);
            }
          }}
        />,
      );
    };
    const forceClose = (event) => {
      if (
        event.target.closest?.(
          ".font-style-modal .modal-close, .font-style-modal .prompt-cancel",
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeFontModal();
      }
    };
    document.addEventListener("click", openFontModal, true);
    document.addEventListener("click", forceClose, true);
    return () => {
      document.removeEventListener("click", openFontModal, true);
      document.removeEventListener("click", forceClose, true);
      closeFontModal();
    };
  }, [settingsOpen, settingsTab, currentUser]);
  useEffect(() => {
    return;
    const handleFontActions = async (event) => {
      const target = event.target.closest?.(
        ".font-style-modal .prompt-confirm, .font-style-modal .modal-close, .font-style-modal .prompt-cancel",
      );
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const backdrop = target.closest(".font-modal-backdrop");
      if (
        target.classList.contains("modal-close") ||
        target.classList.contains("prompt-cancel")
      ) {
        backdrop?.remove();
        return;
      }
      const selectedFont =
        backdrop
          ?.querySelector(".font-option.choice-selected")
          ?.className.match(/font-([a-z]+)/)?.[1] || "default";
      const selectedEffect =
        backdrop?.querySelector(".font-effects .choice-selected")
          ?.textContent || "solid";
      const selectedColor =
        [...(backdrop?.querySelectorAll(".font-colors button") || [])].find(
          (button) => button.classList.contains("choice-selected"),
        )?.style.background || "#f1f3f5";
      try {
        const result = await api.updateMe({
          nameStyle: selectedFont,
          nameEffect: selectedEffect,
          nameColor: selectedColor,
        });
        onUserUpdate(result.user);
        setNotice("Estilo do nome aplicado com sucesso.");
        backdrop?.remove();
      } catch (err) {
        setNotice(err.message);
      }
    };
    document.addEventListener("click", handleFontActions, true);
    return () => document.removeEventListener("click", handleFontActions, true);
  }, [settingsOpen, settingsTab, currentUser]);
  useEffect(() => {
    return;
    const applyFontDirectly = async (event) => {
      const button = event.target.closest?.(
        ".font-style-modal .prompt-confirm",
      );
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const backdrop = button.closest(".font-modal-backdrop");
      const selected = backdrop?.querySelector(".font-option.choice-selected");
      const fontClass = selected?.classList[1] || "font-default";
      const selectedFont = fontClass.replace("font-", "");
      const selectedEffect =
        backdrop?.querySelector(".font-effects .choice-selected")
          ?.textContent || "solid";
      const selectedColorIndex = [
        ...(backdrop?.querySelectorAll(".font-colors button") || []),
      ].findIndex((item) => item.classList.contains("choice-selected"));
      const selectedColor =
        PROFILE_NAME_COLORS[selectedColorIndex] || "#f1f3f5";
      try {
        const result = await api.updateMe({
          nameStyle: selectedFont,
          nameEffect: selectedEffect,
          nameColor: selectedColor,
        });
        onUserUpdate(result.user);
        setNotice("Estilo do nome aplicado com sucesso.");
        backdrop?.remove();
      } catch (err) {
        setNotice(err.message);
      }
    };
    document.addEventListener("mousedown", applyFontDirectly, true);
    return () =>
      document.removeEventListener("mousedown", applyFontDirectly, true);
  }, [settingsOpen, settingsTab, currentUser]);
  useEffect(() => {
    return;
    let suppressClick = false;
    const markApply = (event) => {
      if (event.target.closest?.(".font-style-modal .prompt-confirm"))
        suppressClick = true;
    };
    const suppressOldApply = (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("mousedown", markApply, true);
    window.addEventListener("click", suppressOldApply, true);
    return () => {
      window.removeEventListener("mousedown", markApply, true);
      window.removeEventListener("click", suppressOldApply, true);
    };
  }, [settingsOpen, settingsTab]);
  useEffect(() => {
    return;
    const persistFontPreview = (event) => {
      const button = event.target.closest?.(
        ".font-style-modal .prompt-confirm",
      );
      if (!button) return;
      const backdrop = button.closest(".font-modal-backdrop");
      const selected = backdrop?.querySelector(".font-option.choice-selected");
      const fontClass = [...(selected?.classList || [])].find(
        (value) => value.startsWith("font-") && value !== "font-option",
      );
      if (fontClass) {
        localStorage.setItem("sesh_name_style", fontClass.replace("font-", ""));
        document.body.dataset.nameStyle = fontClass.replace("font-", "");
      }
    };
    window.addEventListener("mousedown", persistFontPreview, true);
    return () =>
      window.removeEventListener("mousedown", persistFontPreview, true);
  }, [settingsOpen, settingsTab]);
  useEffect(() => {
    return;
    let host;
    let root;
    const openWorkingFont = (event) => {
      if (!event.target.closest?.(".profile-name-style")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      host = document.createElement("div");
      document.body.appendChild(host);
      root = createRoot(host);
      root.render(
        <WorkingFontStyleModal
          user={currentUser}
          onClose={() => {
            root.unmount();
            host.remove();
          }}
          onApply={async (selection) => {
            const result = await api.updateMe({
              nameStyle: selection.font,
              nameEffect: selection.effect,
              nameColor: selection.color,
            });
            localStorage.setItem("sesh_name_style", selection.font);
            localStorage.setItem("sesh_name_effect", selection.effect);
            localStorage.setItem("sesh_name_color", selection.color);
            onUserUpdate(result.user);
            setNotice("Estilo do nome aplicado!");
            root.unmount();
            host.remove();
          }}
        />,
      );
    };
    window.addEventListener("click", openWorkingFont, true);
    return () => {
      window.removeEventListener("click", openWorkingFont, true);
      if (root && host) {
        root.unmount();
        host.remove();
      }
    };
  }, [settingsOpen, settingsTab, currentUser]);
  useEffect(() => {
    return;
    let host;
    let root;
    const onCustomize = (event) => {
      const target = event.target.closest?.(
        ".profile-name-style, .profile-settings-themes button, .profile-settings-tiles > div",
      );
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      const sectionTitle =
        target.parentElement.previousElementSibling?.textContent || "";
      const kind = target.classList.contains("profile-name-style")
        ? "name"
        : target.parentElement.classList.contains("profile-settings-themes")
          ? "theme"
          : sectionTitle.includes("Avatar")
            ? "plate"
            : target === target.parentElement?.firstElementChild
              ? "effect"
              : "plate";
      const key =
        kind === "name"
          ? "nameStyle"
          : kind === "theme"
            ? "profileTheme"
            : kind === "effect"
              ? "profileEffect"
              : "profilePlate";
      host = document.createElement("div");
      document.body.appendChild(host);
      root = createRoot(host);
      root.render(
        <CanvasChoiceModal
          title={
            kind === "plate"
              ? "Alterar placa de identificação"
              : "Personalizar perfil"
          }
          kind={kind}
          current={accountForm?.[key] || currentUser[key] || "default"}
          onClose={() => {
            root.unmount();
            host.remove();
          }}
          onApply={async (value) => {
            try {
              const result = await api.updateMe({ [key]: value });
              onUserUpdate(result.user);
              setMembers((current) =>
                current.map((member) =>
                  member.id === result.user.id
                    ? { ...member, ...result.user }
                    : member,
                ),
              );
              setNotice("Personalização aplicada!");
              root.unmount();
              host.remove();
            } catch (err) {
              setNotice(err.message);
            }
          }}
        />,
      );
    };
    document.addEventListener("click", onCustomize, true);
    return () => document.removeEventListener("click", onCustomize, true);
  }, [settingsOpen, settingsTab, currentUser, accountForm]);
  useEffect(() => {
    if (selectedServer && homeTab.startsWith("dm:")) setHomeTab("online");
  }, [selectedServer, homeTab]);
  useEffect(() => {
    const ownMember = members.find((member) => member.id === currentUser.id);
    const canModerate = Boolean(
      selectedServer && (selectedServer.role === "owner" || ownMember?.serverRole?.permissions?.manageMembers),
    );
    const onContextMenu = (event) => {
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
      const ownPanel = event.target.closest(".user-panel");
      if (ownPanel) {
        event.stopPropagation();
        setBadgeMenu({
          x: Math.min(event.clientX, window.innerWidth - 240),
          y: Math.min(event.clientY, window.innerHeight - 110),
          user: currentUser,
          currentUserId: currentUser.id,
          onProfile: () => {
            setProfileView({ userId: currentUser.id });
            setBadgeMenu(null);
          },
        });
        return;
      }
      if (card && profileData?.user && currentUser.isMasterAdmin) {
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
      const row = event.target.closest(".member, .voice-member, .voice-participant, .voice-tile, .message");
      if (!row) return;
      const username =
        row.querySelector(".member-role")?.textContent?.replace(/^@/, "") ||
        row.querySelector(".message-meta strong")?.textContent;
      const displayName =
        row.querySelector(".voice-member-name")?.textContent ||
        row.querySelector(".message-meta strong")?.textContent ||
        row.querySelector("strong")?.textContent;
      const target =
        members.find(
          (item) =>
            item.username === username || item.displayName === displayName,
        ) ||
        messages.find((item) => item.author?.displayName === displayName)
          ?.author ||
        Object.values(voiceStates)
          .flat()
          .find((item) => item.displayName === displayName);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      setBadgeMenu({
        x: Math.min(event.clientX, window.innerWidth - 240),
        y: Math.min(event.clientY, window.innerHeight - 70),
        user: target,
        currentUserId: currentUser.id,
        canModerate,
        onProfile: () => {
          setProfileView({ userId: target.id });
          setBadgeMenu(null);
        },
      });
    };
    document.addEventListener("contextmenu", onContextMenu, true);
    return () => document.removeEventListener("contextmenu", onContextMenu, true);
  }, [currentUser.id, currentUser.isMasterAdmin, profileData, members, messages, voiceStates, selectedServer, servers]);
  useEffect(() => {
    api
      .servers()
      .then((result) => {
        setServers(result.servers);
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

  useEffect(() => {
    if (!selectedServer) return;
    const channel =
      selectedServer.channels.find((item) => item.type === "text") ||
      selectedServer.channels[0];
    setSelectedChannel(channel);
    if (channel?.type === "text")
      api.messages(channel.id).then((result) => setMessages(result.messages));
    api.me().then(() => {});
    api
      .server(selectedServer.id)
      .then((result) => {
        setMembers(result.members || []);
        if (Array.isArray(result.voice))
          setVoiceStates((current) => {
            const next = { ...current };
            for (const item of result.voice)
              next[item.channelId] = item.participants;
            return next;
          });
      });
  }, [selectedServer]);
  useEffect(() => {
    socketRef.current = connectSocket(async (event) => {
      if (event.type === "message.created")
        setMessages((current) =>
          event.message.channelId === selectedChannel?.id &&
          !current.some((item) => item.id === event.message.id)
            ? [...current, event.message]
            : current,
        );
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
                  displayName: event.user.displayName,
                  username: event.user.username,
                  avatarColor: event.user.avatarColor,
                  avatar: event.user.avatar,
                }
              : member,
          ),
        );
        // User updates are broadcast to all connected people. Only the
        // matching event may refresh this browser's authenticated session.
        if (event.user.id === currentUser.id) onUserUpdate(event.user);
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
    });
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (!contextMenu && !serverContextMenu && !badgeMenu) return;
    const close = () => {
      setContextMenu(null);
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
  }, [contextMenu, serverContextMenu, badgeMenu]);
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
        audio.muted = deafenedRef.current;
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
    if (localStorage.getItem("sesh_ui_sounds") === "off") return;
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
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...(audioInput ? { deviceId: { exact: audioInput } } : {}),
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
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
    if (!voiceConnected) return;
    if (voiceChannel)
    playUiSound("disconnect");
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
    audioRefs.current.forEach((audio) => {
      audio.muted = next;
    });
    setDeafened(next);
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
        video: { frameRate: { ideal: 30, max: 30 } },
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
      analyser.fftSize = 512;
      source.connect(analyser);
      analysersRef.current.set(userId, {
        source,
        analyser,
        data: new Uint8Array(analyser.frequencyBinCount),
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
      analysersRef.current.forEach((item, userId) => {
        item.analyser.getByteFrequencyData(item.data);
        let sum = 0;
        for (let i = 0; i < item.data.length; i++) sum += item.data[i];
        if (sum / item.data.length > 6) next[userId] = true;
      });
      const prev = speakingRef.current;
      const changed =
        Object.keys(next).some((key) => !prev[key]) ||
        Object.keys(prev).some((key) => !next[key]);
      if (changed) {
        speakingRef.current = next;
        setSpeaking(next);
      }
      setTimeout(tick, 180);
    };
    tick();
  }
  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    return messages.filter(
      (message) =>
        message.content.toLowerCase().includes(search.toLowerCase()) ||
        message.author.displayName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [messages, search]);
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
    const separated = roles.filter((role) => role.hoist);
    const groups = separated
      .map((role) => ({ role, members: members.filter((member) => member.roleId === role.id) }))
      .filter((group) => group.members.length);
    const separatedIds = new Set(separated.map((role) => role.id));
    const remaining = members.filter((member) => !separatedIds.has(member.roleId));
    if (remaining.length) groups.push({ role: null, members: remaining });
    return groups;
  }, [members, selectedServer?.roles]);
  const isOwner = selectedServer?.role === "owner";
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
  function copyOwnHandle() {
    const handle = currentUser.tag
      ? `${currentUser.username}#${currentUser.tag}`
      : currentUser.username;
    copyText(handle, `${handle} copiado. Agora é só enviar para adicionarem você.`);
  }
  function copyMemberHandle(user) {
    const handle = user.tag ? `${user.username}#${user.tag}` : user.username;
    copyText(handle, `${handle} copiado.`);
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
  function openMemberMenu(event, user) {
    event.preventDefault();
    event.stopPropagation();
    const ownMember = members.find((member) => member.id === currentUser.id);
    const canModerate = Boolean(
      selectedServer &&
        (selectedServer.role === "owner" || ownMember?.serverRole?.permissions?.manageMembers),
    );
    const actorPosition = ownMember?.serverRole?.position ?? 999;
    const assignableRoles = (selectedServer?.roles || []).filter((role) =>
      role.id !== "owner" && (selectedServer.role === "owner" || role.position > actorPosition),
    );
    setBadgeMenu({
      x: Math.min(event.clientX, window.innerWidth - 250),
      y: Math.min(event.clientY, window.innerHeight - 210),
      user,
      currentUserId: currentUser.id,
      canModerate,
      assignableRoles,
      onProfile: () => {
        setProfileView({ userId: user.id });
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
    setProfileView({
      x: Math.min(event.clientX + 12, window.innerWidth - 352),
      y: Math.min(event.clientY - 40, window.innerHeight - 500),
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
      if (currentUser.isMasterAdmin) input.badges = accountForm.badges;
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
        email: form.email,
        favoriteGame: form.favoriteGame,
        gameInterests: form.gameInterests,
        activityText: form.activityText,
        wishlist: form.wishlist,
      };
      if (form.password) input.password = form.password;
      if (currentUser.isMasterAdmin) input.badges = form.badges;
      const result = await api.updateMe(input);
      onUserUpdate(result.user);
      setNotice("Perfil atualizado!");
      setSettingsOpen(false);
    } catch (err) {
      setNotice(err.message);
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
    if ((!draft.trim() && !attachment) || !selectedChannel) return;
    try {
      const result = await api.sendMessage(selectedChannel.id, {
        content: draft.trim(),
        attachment,
      });
      setMessages((current) =>
        current.some((item) => item.id === result.message.id)
          ? current
          : [...current, result.message],
      );
      setDraft("");
      setAttachment(null);
      if (guideServer === selectedChannel.serverId) dismissGuide();
    } catch (err) {
      setNotice(err.message);
    }
  }
  function onAttachmentFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024)
      return setNotice("Envie uma imagem, GIF ou WebP de até 3 MB.");
    const reader = new FileReader();
    reader.onerror = () => setNotice("Não foi possível ler essa imagem.");
    reader.onload = () => setAttachment(String(reader.result));
    reader.readAsDataURL(file);
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
    if (!isOwner)
      return setNotice("Somente o dono do servidor pode criar canais.");
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
    <div className="status-menu" onClick={(event) => event.stopPropagation()}>
      {[
        ["online", "Online"],
        ["idle", "Ausente"],
        ["dnd", "Não perturbar"],
        ["invisible", "Invisível"],
      ].map(([value, label]) => (
        <button
          key={value}
          className={`status-row ${currentUser.status === value ? "status-row-on" : ""}`}
          onClick={() => setStatus(value)}
        >
          <span
            className={`presence-dot presence-dot-menu presence-${value === "invisible" ? "offline" : value}`}
          />
          {label}
        </button>
      ))}
    </div>
  );
  const guideActive =
    guideServer === selectedServer?.id &&
    !localStorage.getItem(`sesh_guide_${selectedServer?.id}`);
  const overlays = (
    <>
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
      {profileView && !selectedServer && (
        <div className="profile-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setProfileView(null); }}>
          <section
            className="profile-card"
            data-profile-effect={
              profileData && profileData !== "loading"
                ? profileData.user.profileEffect || "none"
                : "none"
            }
            style={{ left: profileView.x, top: profileView.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="profile-card-close"
              aria-label="Fechar perfil"
              onClick={() => setProfileView(null)}
            >
              <X size={18} />
            </button>
            {profileData && profileData !== "loading" && (
              <ProfileEffectLayer effect={profileData.user.profileEffect} />
            )}
            {profileData === "loading" || !profileData ? (
              <div className="profile-body">Carregando perfil...</div>
            ) : (
              <>
                <div
                  className="profile-banner"
                  style={bannerStyle(profileData.user.banner)}
                />
                <div className="profile-body">
                  <span className="avatar-dot-wrap profile-avatar-wrap">
                    <Avatar
                      user={profileData.user}
                      color={profileData.user.avatarColor || "purple"}
                    />
                    <span
                      className={`presence-dot presence-lg presence-${presenceFor(profileData.user.id)}`}
                    />
                  </span>
                  <div className="profile-name">
                    {profileData.user.displayName}
                  </div>
                  <div className="profile-username">
                    <span>{profileData.user.username}</span>
                    {profileData.user.badges?.map((key) => {
                      const badge = BADGES[key];
                      return badge ? (
                        <BadgeIcon
                          className="profile-badge-img"
                          key={key}
                          badge={badge}
                        />
                      ) : null;
                    })}
                  </div>
                  <div className="profile-created-at">
                    Membro desde {profileData.user.createdAt ? new Date(profileData.user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "data não disponível"}
                  </div>
                  {profileData.user.bio && (
                    <div className="profile-bio">{profileData.user.bio}</div>
                  )}
                  {(profileData.user.activityText ||
                    profileData.user.favoriteGame) && (
                    <div className="profile-entertainment">
                      <strong>
                        {profileData.user.activityText || "Jogando agora"}
                      </strong>
                      {profileData.user.favoriteGame && (
                        <span>{profileData.user.favoriteGame}</span>
                      )}
                    </div>
                  )}
                  {(profileData.user.activityText ||
                    profileData.user.favoriteGame) && (
                    <div className="profile-entertainment">
                      <strong>
                        {profileData.user.activityText || "Jogando agora"}
                      </strong>
                      {profileData.user.favoriteGame && (
                        <span>{profileData.user.favoriteGame}</span>
                      )}
                    </div>
                  )}
                  {profileData.user.bio && profileData.user.bio.length > 80 && (
                    <button
                      className="profile-bio-link"
                      onClick={() => setNotice(profileData.user.bio)}
                    >
                      Ver biografia completa
                    </button>
                  )}
                  {profileData.voice && (
                    <div className="profile-voice">
                      <div className="profile-voice-title">
                        <Volume2 size={11} /> EM VOZ
                      </div>
                      <div className="profile-voice-channel">
                        <Volume2 size={14} /> {profileData.voice.channelName}
                      </div>
                      <button
                        className="profile-voice-join"
                        onClick={() => openVoiceFromProfile(profileData.voice)}
                      >
                        Abrir chamada de voz
                      </button>
                    </div>
                  )}
                  {profileData.user.id === currentUser.id && (
                    <button
                      className="profile-voice-join"
                      onClick={() => {
                        setProfileView(null);
                        openSettings();
                      }}
                    >
                      Editar perfil
                    </button>
                  )}
                </div>
              </>
            )}
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
                          disabled={!currentUser.isMasterAdmin}
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
          onAdd={currentUser.isMasterAdmin ? () => openBadgeEditor(badgeMenu.user) : null}
          onModerate={badgeMenu.canModerate ? (input) => moderateMember(badgeMenu.user, input) : null}
          onAssignRole={badgeMenu.canModerate ? (roleId) => moderateMember(badgeMenu.user, { roleId }) : null}
          onManageRoles={badgeMenu.user.id === currentUser.id && selectedServer?.role === "owner" ? () => {
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
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={20} />
          </button>
          <strong>Amigos</strong>
          <button
            className="icon-button"
            onClick={() => setMemberListOpen(!memberListOpen)}
          >
            <Users size={20} />
          </button>
        </header>
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
                  className="home-dm-row"
                  key={person.id}
                  onClick={() => setHomeTab(`dm:${person.id}`)}
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
                  <span className="home-dm-name">{person.displayName}</span>
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
            <aside className="member-sidebar active-now-sidebar">
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
        <div className="user-panel">
          {statusMenu && statusMenuEl()}
          <span
            className="user-avatar-btn"
            title="Alterar meu status"
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
            title="Clique para copiar seu nome de usuário"
            onClick={copyOwnHandle}
          >
            <strong>{currentUser.displayName}</strong>
            <span>{currentUser.tag ? `${currentUser.username}#${currentUser.tag}` : currentUser.username}</span>
          </div>
          <div className="user-actions">
            <button title="Silenciar">
              <Mic size={17} />
            </button>
            <button title="Áudio">
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
          onClick={() => setMobileNav(!mobileNav)}
        >
          <Menu size={20} />
        </button>
        <strong>{selectedServer.name}</strong>
        <button
          className="icon-button"
          onClick={() => setMemberListOpen(!memberListOpen)}
        >
          <Users size={20} />
        </button>
      </header>
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
            <span className="workspace-server-tag">{selectedServer.tag}</span>
          )}
          <div className="header-tools">
            <button title="Copiar convite do servidor" onClick={copyInvite}>
              <UserPlus size={17} />
            </button>
            {selectedServer.role === "owner" && (
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
                  className={`channel-row ${selectedChannel.id === channel.id ? "selected" : ""} ${mutedChannels.includes(channel.id) ? "muted-row" : ""}`}
                  data-channel-id={channel.id}
                  onClick={() => {
                    setSelectedChannel(channel);
                    setMobileNav(false);
                    if (channel.type === "text")
                      api
                        .messages(channel.id)
                        .then((result) => setMessages(result.messages));
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
                          className="voice-member profile-click"
                          key={participant.id}
                          onClick={(event) =>
                            openProfile(event, participant.id)
                          }
                          onContextMenu={(event) =>
                            openMemberMenu(event, participant)
                          }
                        >
                          <span className="avatar-dot-wrap">
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
                            <span>{participant.displayName}</span>
                            <VoiceMediaIndicators
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
            <div className="voice-status-info">
              <span className="voice-status-title">
                <Volume2 size={13} /> Voz conectada
              </span>
              <strong>{voiceChannel?.name}</strong>
            </div>
            <button title="Desconectar da chamada" onClick={leaveVoice}>
              <PhoneOff size={15} />
            </button>
          </div>
        )}
        <div className="user-panel">
          {statusMenu && statusMenuEl()}
          <span
            className="user-avatar-btn"
            title="Alterar meu status"
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
            title="Clique para copiar seu nome de usuário"
            onClick={copyOwnHandle}
          >
            <strong>{currentUser.displayName}</strong>
            <span>{currentUser.tag ? `${currentUser.username}#${currentUser.tag}` : currentUser.username}</span>
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
            <button className="header-action">
              <Pin size={19} />
            </button>
            <button
              className={`header-action ${memberListOpen ? "selected-action" : ""}`}
              onClick={() => setMemberListOpen(!memberListOpen)}
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
          <div className="chat-area">
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
                              <Avatar
                                user={participant}
                                color={participant.avatarColor || "purple"}
                              />
                            )}
                            <div className="voice-tile-label">
                              <div className="voice-tile-name-row">
                                <strong>{participant.displayName}</strong>
                                <VoiceMediaIndicators
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
                    <button className="guide-card" onClick={copyInvite}>
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
                  <input ref={attachmentInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onAttachmentFile} />
                  <button type="button" className={attachment ? "attachment-ready" : ""} title="Enviar imagem ou GIF" onClick={() => attachmentInputRef.current?.click()}>
                    <Paperclip size={20} />
                  </button>
                  {attachment && <img className="composer-attachment-preview" src={attachment} alt="Imagem pronta para enviar" />}
                  {mentionQuery !== null && <MentionSuggestions candidates={mentionCandidates} onChoose={chooseMention} />}
                  <input
                    ref={composerInputRef}
                    value={draft}
                    onChange={(event) => updateDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={`Conversar em #${selectedChannel.name}`}
                  />
                  <button type="button">
                    <Smile size={20} />
                  </button>
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
                <div className="messages-list">
                  {filteredMessages.map((message) => (
                    <article className="message" key={message.id}>
                      <Avatar
                        user={message.author}
                        color={message.author.avatarColor || "purple"}
                        onClick={(event) =>
                          openProfile(event, message.author.id)
                        }
                      />
                      <div className="message-body">
                        <div className="message-meta">
                          <strong
                            onClick={(event) =>
                              openProfile(event, message.author.id)
                            }
                          >
                            {message.author.displayName}
                          </strong>
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
                            {new Date(message.createdAt).toLocaleString(
                              "pt-BR",
                            )}
                          </time>
                        </div>
                        {message.content && <MessageContent content={message.content} members={members} onProfile={openProfile} />}
                        {message.attachment && <img className="message-attachment" src={message.attachment} alt={`Imagem enviada por ${message.author.displayName}`} loading="lazy" />}
                      </div>
                      <button className="message-more">
                        <MoreVertical size={17} />
                      </button>
                    </article>
                  ))}
                  {filteredMessages.length === 0 && (
                    <div className="empty-search">
                      Nenhuma mensagem encontrada.
                    </div>
                  )}
                </div>
                <form className="composer" onSubmit={sendMessage}>
                  <input ref={attachmentInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onAttachmentFile} />
                  <button type="button" className={attachment ? "attachment-ready" : ""} title="Enviar imagem ou GIF" onClick={() => attachmentInputRef.current?.click()}>
                    <Paperclip size={20} />
                  </button>
                  {attachment && <img className="composer-attachment-preview" src={attachment} alt="Imagem pronta para enviar" />}
                  {mentionQuery !== null && <MentionSuggestions candidates={mentionCandidates} onChoose={chooseMention} />}
                  <input
                    ref={composerInputRef}
                    value={draft}
                    onChange={(event) => updateDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={`Conversar em #${selectedChannel.name}`}
                  />
                  <button type="button">
                    <Smile size={20} />
                  </button>
                  <button className="send-button" type="submit">
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}
          </div>
          {memberListOpen && (
            <aside className="member-sidebar">
              <div className="member-title">MEMBROS — {members.length}</div>
              {memberGroups.map((group) => (
                <section className="member-role-group" key={group.role?.id || "members"}>
                  {group.role && <div className="member-role-group-title" style={{ "--role-group-color": group.role.color }}>{group.role.name} — {group.members.length}</div>}
                  {group.members.map((member) => (
                    <div
                      className={`member profile-click role-style-${member.serverRole?.style || "solid"}`}
                      style={{ "--member-role-color": member.serverRole?.color || "#8f96a3" }}
                      key={member.id}
                      onClick={(event) => openProfile(event, member.id)}
                      onContextMenu={(event) => openMemberMenu(event, member)}
                    >
                      <span className="avatar-dot-wrap">
                        <Avatar user={member} color={member.avatarColor || "purple"} small />
                        <span className={`presence-dot presence-${presenceFor(member.id)}`} />
                      </span>
                      <div>
                        <strong>
                          {member.displayName}
                          {selectedServer.tag && <span className="server-tag" style={{ "--server-tag-color": selectedServer.accentColor || "#c93642" }}>{selectedServer.tag}</span>}
                        </strong>
                        <span className="member-role">{member.serverRole?.name || member.username}</span>
                      </div>
                    </div>
                  ))}
                </section>
              ))}            </aside>
          )}
        </div>
      </main>
      {overlays}
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
          {isOwner && (
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
          {isOwner && (
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
          {isOwner && (
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
          {isOwner && (
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
          {isOwner && (
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
            <button className="context-item" onClick={() => { if (server.role === "owner") { setSelectedServer(server); setServerSettingsOpen(true); } else setNotice("Somente o dono pode alterar o servidor."); setServerContextMenu(null); }}>Config. do servidor<span className="context-arrow">›</span></button>
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
      {profileView && (
        <div className="profile-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setProfileView(null); }}>
          <section
            className="profile-card"
            data-profile-effect={
              profileData && profileData !== "loading"
                ? profileData.user.profileEffect || "none"
                : "none"
            }
            style={{ left: profileView.x, top: profileView.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="profile-card-close"
              aria-label="Fechar perfil"
              onClick={() => setProfileView(null)}
            >
              <X size={18} />
            </button>
            {profileData && profileData !== "loading" && (
              <ProfileEffectLayer effect={profileData.user.profileEffect} />
            )}
            {profileData === "loading" || !profileData ? (
              <div className="profile-body">Carregando perfil...</div>
            ) : (
              <>
                <div
                  className="profile-banner"
                  style={bannerStyle(profileData.user.banner)}
                />
                <div className="profile-body">
                  <span className="avatar-dot-wrap profile-avatar-wrap">
                    <Avatar
                      user={profileData.user}
                      color={profileData.user.avatarColor || "purple"}
                    />
                    <span
                      className={`presence-dot presence-lg presence-${presenceFor(profileData.user.id)}`}
                    />
                  </span>
                  <div className="profile-name">
                    {profileData.user.displayName}
                  </div>
                  <div className="profile-username">
                    <span>{profileData.user.username}</span>
                    {profileData.user.badges?.map((key) => {
                      const badge = BADGES[key];
                      return badge ? (
                        <BadgeIcon
                          className="profile-badge-img"
                          key={key}
                          badge={badge}
                        />
                      ) : null;
                    })}
                  </div>
                  <div className="profile-created-at">
                    Membro desde {profileData.user.createdAt ? new Date(profileData.user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "data não disponível"}
                  </div>
                  {profileData.user.bio && (
                    <div className="profile-bio">{profileData.user.bio}</div>
                  )}
                  {profileData.user.bio && profileData.user.bio.length > 80 && (
                    <button
                      className="profile-bio-link"
                      onClick={() => setNotice(profileData.user.bio)}
                    >
                      Ver biografia completa
                    </button>
                  )}
                  {profileData.voice && (
                    <div className="profile-voice">
                      <div className="profile-voice-title">
                        <Volume2 size={11} /> EM VOZ
                      </div>
                      <div className="profile-voice-channel">
                        <Volume2 size={14} /> {profileData.voice.channelName}
                      </div>
                      <button
                        className="profile-voice-join"
                        onClick={() => openVoiceFromProfile(profileData.voice)}
                      >
                        Abrir chamada de voz
                      </button>
                    </div>
                  )}
                  {profileData.user.id === currentUser.id && (
                    <button
                      className="profile-voice-join"
                      onClick={() => {
                        setProfileView(null);
                        openSettings();
                      }}
                    >
                      Editar perfil
                    </button>
                  )}
                </div>
              </>
            )}
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
                          disabled={!currentUser.isMasterAdmin}
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
      onUserUpdate={setUser}
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
