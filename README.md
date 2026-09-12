# Sesh

Aplicativo de comunidades, mensagens, perfis e chamadas, com identidade própria.
Versão 1.2.0. Veja [notas da versão](RELEASE_NOTES.md) e [distribuição](DISTRIBUICAO.md).

## Desenvolvimento
Use Node.js 22.22.x e npm:
```sh
npm ci
npm run dev
```
Frontend: http://127.0.0.1:5173/app. Backend: http://127.0.0.1:3001.
`npm run desktop` abre a versão de desenvolvimento Electron com backend local.
Dados locais ficam em `data/database.json`. Nunca versione dados reais ou arquivos .env.

## Produção
`npm run build && npm start` serve o cliente compilado e a API.
Configure PostgreSQL com DATABASE_URL antes de usar hospedagem com disco efêmero.
O endpoint `/api/health` informa versão e modo de armazenamento, sem credenciais.
Veja [.env.example](.env.example) e [Render](RENDER.md).

O portátil Windows acessa https://sesh-web-08o6.onrender.com/app e compartilha
o backend remoto com o navegador. Não cria um servidor separado por computador.

## Testes
```sh
npm test
npm run build
npm run test:ui
npm run dist:win
```
Os testes usam bancos temporários isolados. A suíte UI usa Chrome instalado em
Windows; configure SESH_TEST_BROWSER para outro executável compatível.
Microfone e câmera são simulados nos testes automatizados; valide hardware real
no seu ambiente. Imagens do catálogo vêm de fontes externas.

## Catálogo e personalização
400 jogos com IDs estáveis, URLs de imagens e fontes em game-artwork.js.
Seleção de até 12 favoritos por perfil. 15 opções de efeito, 17 de moldura e
18 de nome, incluindo Rainbow RGB, degradês e pulsação.
As opções incluem o estado padrão/sem efeito.
Os scripts sync-game-artwork, complete-game-artwork e resolve-game-covers
atualizam metadados públicos. Respeite os limites das fontes; não rode em loop.

## Segurança e limites
GIF de perfil exige assinatura ativa no backend. Membros só podem moderar
cargos inferiores; gestores não podem alterar seu próprio cargo nem conceder
permissões superiores. Apenas permissões implementadas são mostradas.
As configurações de privacidade são persistidas na conta.

WebRTC P2P não substitui infraestrutura TURN/SFU. Cobrança, bots, tópicos,
detecção automática de jogos e mesa de som não fazem parte desta entrega.
Não publique conta demo em produção: configure SEED_DEMO_USER=false.
As imagens e marcas de jogos pertencem aos respectivos titulares; fontes
estão registradas no catálogo. Não há afiliação ao Discord ou aos jogos.
