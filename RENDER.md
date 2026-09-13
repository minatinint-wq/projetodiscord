# Publicar o Sesh no Render

O projeto usa um único Web Service para servir a landing page, o aplicativo,
a API HTTP e o WebSocket. O PostgreSQL é criado pelo Blueprint e conectado
pela rede privada do Render.

## Primeira publicação

1. Entre em https://dashboard.render.com/.
2. Escolha **New > Blueprint**.
3. Conecte o GitHub e selecione **minatinint-wq/projetodiscord**.
4. Confirme o arquivo **render.yaml**.
5. Quando solicitado, informe **CREATOR_EMAIL** com o e-mail da conta criadora.
6. Acompanhe o deploy até o health check **/api/health** ficar saudável.

## Cotas de geração de imagem

O comando `/image` tenta Cloudflare Workers AI, NVIDIA FLUX, Gemini, provedor
personalizado, Pollinations público sem chave e, por último, o Space público do
Hugging Face. O Pollinations fica ligado por padrão para a instalação não depender
somente da cota ZeroGPU. Para priorizar uma API autenticada no Web Service
`sesh-web`, configure uma destas opções em **Environment**:

- Cloudflare: `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` com permissão
  **Workers AI - Read**. O modelo padrão é
  `@cf/black-forest-labs/flux-1-schnell`.
- NVIDIA: `NVIDIA_API_KEY`. O endpoint e o modelo
  `black-forest-labs/flux.1-schnell` são preenchidos automaticamente.

Não grave essas credenciais no Git. Depois de salvar as variáveis, faça um novo
deploy do serviço. Erro de cota, indisponibilidade ou credencial de um provedor
faz o servidor tentar o próximo; bloqueio explícito de segurança não é contornado.

Não crie um **Static Site**: câmera, chamadas, perfis, convites e mensagens
dependem do processo Node e do WebSocket.

## Validação

- Abra https://SEU-SERVICO.onrender.com/api/health.
- A resposta correta é JSON com **ok: true** e **storage: postgresql**.
- Entre em **/app** com **demo / demo123** no primeiro teste.
- Crie uma segunda conta e valide convite, perfil, mensagens e chamada.

## Importar os dados copiados

O arquivo **data/database.json** fica fora do Git porque contém contas. Não
coloque esse arquivo no repositório nem em uma variável pública.

Depois que o PostgreSQL existir:

1. Faça um backup do destino.
2. No banco do Render, autorize temporariamente apenas o seu IP externo.
3. Copie a **External Database URL** em **Connect**.
4. No PowerShell local, defina DATABASE_URL com essa URL.
5. Defina DATABASE_SSL como true.
6. Defina DATABASE_SSL_REJECT_UNAUTHORIZED como false.
7. Execute **npm run db:import -- data/database.json --replace**.
8. Remova novamente o seu IP da lista externa do banco.

O importador valida IDs e relações, usa uma transação e não exibe contas,
senhas ou a URL nos logs. A opção **--replace** é necessária porque a primeira
inicialização cria a conta de demonstração.

O carregamento atual normaliza automaticamente campos antigos de perfil,
servidor e badges. As badges antigas são convertidas assim:

- booster para apoiador
- bug para cacador_bugs
- dev para desenvolvedor
- star para fundador

## Limites do plano gratuito

O Web Service gratuito pode adormecer após inatividade. O PostgreSQL gratuito
expira 30 dias depois da criação e não oferece backups. Para uso real e dados
duráveis, altere o banco para um plano pago antes do vencimento.
