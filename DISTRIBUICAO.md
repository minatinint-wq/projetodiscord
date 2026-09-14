# Distribuição do Sesh Desktop 1.2.0

## Compartilhar
Gere com `npm run dist:win`. O resultado é `release/SeshDesktop.exe`.
É um executável portátil Windows x64: o usuário não precisa instalar Node.js.
Ele acessa o servidor compartilhado https://sesh-web-08o6.onrender.com/app.
É necessária conexão à internet.

Cada push para `main` publica uma Release do GitHub com o instalador e o
manifesto de atualização. Ao abrir (e a cada seis horas), o aplicativo verifica
essa Release. Quando houver versão nova, ele pede confirmação, baixa em segundo
plano e reinicia para instalar sobre a instalação existente — sem navegador,
arquivo extra no Desktop ou instalação manual.

## Armazenamento
O portátil não inicia o antigo backend local. A autenticação e os dados ficam
no servidor remoto. O desenvolvimento continua com backend local.
Contas e mensagens locais antigas não são migradas silenciosamente.

Não empacote .env, credenciais, cookies ou dados de usuários. A lista de arquivos
do Electron inclui os módulos de catálogo/cosméticos para evitar imports ausentes.

## Publicar
1. Executar testes de API, UI, build e smoke test do Electron.
2. Fazer commit/push para `main`; o GitHub Actions cria a versão sequencial,
   publica a Release e anexa o instalador e o manifesto.
3. Verificar a Release publicada e a versão de /api/health depois do deploy Render.
4. Confirmar armazenamento PostgreSQL e backups fora do disco efêmero.
5. Testar áudio, câmera e compartilhamento com duas redes reais.

O executável não tem certificado de assinatura de código nesta entrega.
Não desative proteções do Windows: confira origem e hash antes de abrir.
Para voz em redes restritivas, configure TURN com credenciais temporárias.
