# Sesh

MVP de uma plataforma de comunidades inspirada em apps de chat modernos, com identidade visual própria.

## Executar localmente

Instale as dependências:

```bash
npm install
```

Inicie o backend e o frontend no navegador:

```bash
npm run dev
```

Depois abra `http://127.0.0.1:5173` para a landing ou
`http://127.0.0.1:5173/app` para entrar. O backend fica em
`http://127.0.0.1:3001`.

O comando `npm run dev` inicia os dois serviços automaticamente.

Para abrir como aplicativo desktop do Windows, com seletor de janela/tela:

```bash
npm run desktop
npm run dist:win
```

O Electron abrirá uma janela própria do Sesh e iniciará o backend local automaticamente.

## Login local de teste

- Usuário: `demo`
- Senha: `demo123`

A conta é criada automaticamente no JSON local quando ainda não existe. Para impedir
essa criação, defina `SEED_DEMO_USER=false`.

## Comandos

Se preferir usar dois terminais separados:

```bash
npm run server
npm run web
```

Outros comandos:

```bash
npm test
npm run build
npm run desktop
```

No desenvolvimento, os dados ficam em `data/database.json`; nenhum banco remoto
é acessado. No executável Windows, o banco usa AES-256-GCM e fica em
`%APPDATA%\Sesh\sesh-data.enc`. A chave é protegida pelo cofre do Windows.
PostgreSQL é opcional e só é ativado quando `DATABASE_URL` é informado.

O executável portátil é gerado em:

`release\Sesh-Portable-1.0.0-x64.exe`

## Funcionalidades atuais

- Navegação entre servidores e canais
- Lista de membros com status
- Busca local de mensagens
- Envio de mensagens na interface
- Layout responsivo para telas menores
- Autenticação local com senha derivada por scrypt
- Persistência local em JSON e PostgreSQL opcional
- Atualizações em tempo real com WebSockets
- Voz, câmera e compartilhamento de tela P2P em fase de MVP
- Destaque e tela cheia para câmera e transmissão
- Personalização de perfil, molduras, entretenimento e insígnias
- Tag, banner e cor de destaque do servidor

Consulte `DISTRIBUICAO.md` antes de publicar para outras pessoas.
