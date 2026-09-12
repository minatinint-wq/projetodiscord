# Sesh Desktop 1.2.0

## Corrigido e implementado
- Editor de perfil com prévia, foto, banner, barra de salvamento sempre visível e sem fechamento ao salvar.
- Imagens estáticas liberadas; GIF em avatar e banner exige Nitro Classic ativo, validado no servidor.
- 15 efeitos de perfil, 17 opções de moldura e 18 estilos de nome, com respeito à preferência de movimento reduzido.
- Catálogo de 400 jogos com metadados de imagem e fonte. Jogos favoritos no editor, no perfil e na barra inferior; favoritos não representam detecção automática de processos.
- Seletor de emojis por categoria e busca; emojis ampliados em mensagens compostas somente por emojis.
- DMs entre amigos com persistência de texto/imagens, WebSocket e opção de bloquear novas mensagens.
- Microfone: seleção de dispositivo, recuperação de dispositivo removido, medidor real e gravação local para ouvir o teste.
- Configurações funcionais de câmera, áudio de saída, supressão de ruído, sons, notificações, privacidade e qualidade de transmissão.
- Cargos persistidos e atualizados na interface, permissões padrão conservadas, hierarquia administrativa e autorização no backend.
- Membros em linhas organizadas com busca, banner de servidor centralizado e painel do usuário fixo na lateral esquerda.
- Reconexão de WebSocket, correções de estado de canal, isolamento de DMs e rejeição de anexos sem permissão.
- Escritas locais atômicas e transação PostgreSQL para persistir as coleções.
- Executável conectado a https://sesh-web-08o6.onrender.com/app, com aviso de novas versões.

## Limites conhecidos
- Sesh continua em desenvolvimento. Não é uma implementação completa de Discord.
- Voz/vídeo usam WebRTC P2P. Redes restritivas precisam de infraestrutura TURN; não há SFU nesta versão.
- Compras, cobrança, tópicos, bots e mesa de som não estão implementados. As configurações não simulam checkout nem exibem permissões sem efeito.
- Não há detecção automática do jogo aberto. A barra identifica explicitamente jogos de interesse.
- Imagens dos jogos são carregadas das fontes originais; uma fonte indisponível usa identificação textual de reserva.
- O portátil não é assinado digitalmente; o Windows pode apresentar aviso de editor desconhecido.
- Contas e histórico antigos do modo local não são enviados automaticamente ao Render.
- Políticas existentes são rascunhos operacionais; não substituem revisão jurídica.
