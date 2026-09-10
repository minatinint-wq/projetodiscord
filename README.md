# Orbit Community

MVP de uma plataforma de comunidades inspirada em apps de chat modernos, com identidade visual própria.

## Executar

Instale as dependências:

```bash
npm install
```

Inicie o backend e o frontend juntos:

```bash
npm run dev
```

Depois abra `http://localhost:5173`. O backend fica em `http://localhost:3001`.

O comando `npm run dev` já inicia os dois serviços automaticamente.

Para abrir como aplicativo desktop do Windows, use:

```bash
npm run desktop
```

O Electron abrirá uma janela própria do Orbit e iniciará o backend local automaticamente. Se preferir usar dois terminais separados:

```bash
npm run server
npm run dev
```

## Funcionalidades atuais

- Navegação entre servidores e canais
- Lista de membros com status
- Busca local de mensagens
- Envio de mensagens na interface
- Layout responsivo para telas menores
- Estrutura preparada para adicionar autenticação, persistência e WebSockets
