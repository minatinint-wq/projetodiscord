# Distribuição do Sesh Desktop 1.2.0

## Compartilhar
Gere com `npm run dist:win`. O resultado é `release/SeshDesktop.exe`.
É um executável portátil Windows x64: o usuário não precisa instalar Node.js.
Ele acessa o servidor compartilhado https://sesh-web-08o6.onrender.com/app.
É necessária conexão à internet.

A release do GitHub contém o executável e seu SHA-256. O aplicativo consulta
`/releases/latest.json` e oferece o download quando há versão mais nova.
A atualização do portátil é manual: fechar o app e substituir o arquivo.

## Armazenamento
O portátil não inicia o antigo backend local. A autenticação e os dados ficam
no servidor remoto. O desenvolvimento continua com backend local.
Contas e mensagens locais antigas não são migradas silenciosamente.

Não empacote .env, credenciais, cookies ou dados de usuários. A lista de arquivos
do Electron inclui os módulos de catálogo/cosméticos para evitar imports ausentes.

## Publicar
1. Executar testes de API, UI, build e smoke test do Electron.
2. Gerar o executável, calcular SHA-256 e publicar na release v1.2.0.
3. Fazer commit/push; verificar a versão de /api/health depois do deploy Render.
4. Confirmar armazenamento PostgreSQL e backups fora do disco efêmero.
5. Testar áudio, câmera e compartilhamento com duas redes reais.

O executável não tem certificado de assinatura de código nesta entrega.
Não desative proteções do Windows: confira origem e hash antes de abrir.
Para voz em redes restritivas, configure TURN com credenciais temporárias.
