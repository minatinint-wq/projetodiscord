# Handoff completo — Sesh

Atualizado em 13/09/2026. Este documento é a fonte de continuidade para outra IA assumir o projeto sem repetir a investigação.

## Prompt pronto para a próxima IA

> Continue o projeto Sesh em `C:\Users\Sabrina\Desktop\projetodiscord-main`, branch `main`. Leia este arquivo inteiro, confira `git status -sb`, os últimos commits e os testes antes de editar. Preserve tudo que já funciona. O foco agora é concluir cosméticos animados de alta qualidade e corrigir regressões visuais/funcionais encontradas em uso real. Faça backend, frontend, validação, testes, commit e push. Não entregue PNG com quadriculado fingindo transparência, não use arte com marca-d'água e não faça animação aleatória/desconectada do tema.

## Acesso e execução

- Repositório: https://github.com/minatinint-wq/projetodiscord
- Pasta local: `C:\Users\Sabrina\Desktop\projetodiscord-main`
- Branch: `main`
- Produção: https://sesh-web-08o6.onrender.com/app
- Render service: `srv-dai9ivm743jc73e96cdg`
- Wrapper desktop: `C:\Users\Sabrina\Desktop\SeshDesktop.exe`
- O executável carrega a aplicação do Render; mudanças web não exigem gerar outro EXE, salvo mudança no wrapper.
- A usuária exige commit e push ao terminar cada bloco coerente.

## Estado verificado

Antes deste handoff:

- `npm run build`: passou.
- `npm test`: 19/19 passou.
- A branch estava sincronizada com `origin/main`.
- O último ajuste de hierarquia foi enviado no commit `6591e4e`.

Commits recentes relevantes:

- `6591e4e fix: keep server owner inside assigned role`
- `5e0ba33 feat: add optimized atmospheric profile effects`
- `a6f6fe1 feat: add stable public user IDs`
- `0474ebf fix: restore profile and message interaction flow`
- `4b0329c fix: keep server owner at top of member hierarchy`
- `a1dcbfd feat: refine realtime UX and role effects`

## O que já funciona

### Conta e identidade

- Cada conta possui `publicId` estável no formato `S-XXXXXXXXXX`.
- O admin principal usa o ID reservado `S-0000000001`.
- A interface mostra `@username`; o identificador antigo com `#` não fica visível.
- Login e adição de amizade aceitam usuário, e-mail ou ID público.
- `@username` é único.
- Usuários comuns precisam de no mínimo quatro caracteres.
- Apenas o admin principal e a conta histórica `s` podem manter nome de uma letra.
- Cadastro não depende do Resend para permitir login.

### Perfil

- Avatar e banner persistem no backend.
- GIF de avatar/banner exige Nitro no backend.
- Jogos favoritos persistem e o catálogo contém 400 jogos com IDs, ícones e fontes.
- Badges e Nitro podem ser concedidos pelos administradores autorizados.
- Clique simples abre resumo compacto; perfil completo só abre por ação explícita.
- Editor de perfil e configurações fecham com `Esc`.
- Drag and drop de arquivos existe no fluxo de anexos/perfil.

### Chat, cargos e voz

- Mensagens têm agrupamento, horário curto, divisores por dia e autoscroll quando apropriado.
- Menu de contexto próprio funciona por botão direito; o menu nativo do navegador foi bloqueado no alvo.
- O dono pode escolher cargo visual sem perder autoridade.
- Cargos têm prioridade, separação lateral, permissões e efeitos no hover do nome.
- O dono agora permanece dentro do grupo do cargo atribuído; dentro do grupo aparece primeiro e recebe uma coroa dourada.
- VAD usa sinal RMS real e não anima fala aleatoriamente.
- Scrollbars foram reduzidas e tematizadas.

### Efeitos existentes

- Canvas atmosférico otimizado: `embers`, `smoke`, `flames`, `blue_fire`, `ash`.
- O canvas pausa fora da tela, respeita reduced motion e limita DPR.
- Molduras de avatar atuais são 313 APNGs: `snowglobe`, `fire` e `glitch` ficam locais em 288 × 288, e outras 310 vêm sob demanda do catálogo público do AvatarDecoration.
- As 14 opções estáticas e as molduras antigas foram removidas por solicitação da usuária; overlays e banners premium continuam usando sprite WebP.
- `AnimatedCosmetic.jsx` espera sprite sheet WebP com 24 quadros, grade 6 × 4.

## Correção de hierarquia recém-feita

Arquivo principal: `src/main.jsx`.

Regra correta:

1. Grupos seguem a posição do cargo.
2. O dono não recebe um grupo artificial separado.
3. O dono fica dentro do cargo visual selecionado.
4. Dentro daquele grupo, o dono fica primeiro.
5. Uma coroa dourada aparece ao lado do nome do dono.
6. A autoridade real continua vindo de `server.ownerId`, nunca do cargo visual.

Não reintroduzir o antigo grupo “Cargo • Dono”, pois ele separava pessoas com o mesmo cargo e causava a incoerência mostrada pela usuária.

## Direção visual obrigatória

O visual deve lembrar perfis modernos do Discord, mas permanecer original ao Sesh:


- escuro, limpo e contemporâneo;
- detalhes nítidos em tamanhos pequenos;
- movimento fluido e coerente com o tema;
- partículas com forma reconhecível, não pontos coloridos genéricos;
- sobreposições não podem bloquear bio, cargos, jogos ou botões;
- nada com aparência infantil, clip-art antiga ou excesso de brilho aleatório;
- variações femininas e masculinas/sóbrias;
- animações mais lentas: normalmente 2,4–6 s por loop;
- começar e terminar no mesmo estado para loop sem salto.

### Diferença entre os três formatos

1. **Moldura de avatar**
   - Canvas 1:1 transparente.
   - Elemento principal circular.
   - Área interna totalmente vazada.
   - Arte pode extrapolar apenas 8–12% do círculo.
   - Precisa continuar legível em 40, 64 e 96 px.

2. **Sobreposição de perfil**
   - Alvo visual do modal: 480 × 720.
   - Centro livre; decoração concentrada nas bordas/cantos.
   - Moldura quadrada de PicMix não deve ser aplicada diretamente ao avatar.
   - Uma moldura quadrada bonita pode ser adaptada para sobreposição vertical, recortando/recompondo cantos, nunca esticando.

3. **Efeito de partículas**
   - Pode cobrir o modal, mas com baixa densidade e `pointer-events: none`.
   - Pétalas, folhas, cinzas e faíscas precisam ter sprites reais com rotação, profundidade e velocidade variadas.
   - Não usar pontos como substituto do objeto.

## Referências fornecidas pela usuária

Imagens locais:

- Pétalas/flores pequenas: `C:\Users\Sabrina\AppData\Local\Temp\codex-clipboard-ebd9539a-f8ba-4d7d-a2a6-de3254772ac9.png`
- Moldura azul ondulada: `C:\Users\Sabrina\AppData\Local\Temp\codex-clipboard-825a514b-bbb3-46ce-8060-eb695b176233.png`
- Galhos ciano: `C:\Users\Sabrina\AppData\Local\Temp\codex-clipboard-60041b15-58e2-47a3-8471-47497b674640.png` — **rejeitada como feia**.
- Moldura verde quadrada: `C:\Users\Sabrina\AppData\Local\Temp\codex-clipboard-f6b3cca3-93c7-441c-b9ac-86f477152034.png` — aprovada somente como referência de linguagem visual. **Não copiar nem integrar o arquivo exato**. Estudar contorno fino, centro vazado, pontos de luz e ritmo das bordas para criar uma composição original do Sesh.

Vídeos de referência:

- `C:\Users\Sabrina\Videos\2026-09-12 13-42-47.mp4`
- `C:\Users\Sabrina\Videos\2026-09-12 19-19-15.mp4`
- `C:\Users\Sabrina\Videos\2026-09-12 19-56-24.mp4`
- `C:\Users\Sabrina\Videos\2026-09-12 20-17-28.mp4`
- `C:\Users\Sabrina\Videos\2026-09-12 21-48-32.mp4`
- `C:\Users\Sabrina\Videos\2026-09-12 22-03-10.mp4`
- `C:\Users\Sabrina\Videos\2026-09-12 23-25-54.mp4`

Sites de inspiração:

- https://pt.picmix.com/stamp
- https://avatardecoration.com/fake-discord-decoration#decoration

Use esses sites para mapear linguagem visual e formatos. Não publique imagens com `PICMIX` repetido, não remova marca-d'água de terceiros e confirme licença antes de redistribuir qualquer arquivo. Preferir arte própria ou ativos cuja licença de redistribuição esteja clara.

## Resultado da varredura visual

Famílias com bom potencial:

- frame/cadre/rahmen: bordas vazadas;
- animated/glitter: brilho percorrendo o contorno;
- transparent/deco/overlay: cantos e elementos soltos;
- flower/petals/sakura: pétalas pequenas e assimétricas;
- smoke/fire/embers: fumaça e fogo com alpha;
- crown/halo/wings: decoração circular de avatar;
- webcore/y2k/cyber: linhas, cromado, holografia;
- gothic/thorns/crystal: opções escuras e masculinas;
- autumn/leaves/snow: sazonal e mais sóbrio.

Padrões que funcionam:

- centro vazio;
- detalhe mais forte em dois cantos opostos;
- contorno fino;
- animação localizada (luz percorrendo a borda, pétalas caindo, fumaça respirando);
- preview no tamanho real antes de aprovar.

Padrões a evitar:

- quadro inteiro preenchido;
- checkerboard renderizado como pixels;
- GIF de três quadros piscando a cada 300 ms;
- miniatura de 200 px ampliada para modal;
- moldura gigante cobrindo avatar e nome;
- arte sem relação com o tema selecionado.

## Tentativa de ativos desta sessão — não publicar

- Foram gerados dois PNGs de teste (pétalas e moldura elétrica), mas o gerador gravou o quadriculado no RGB em vez de alpha real.
- `ffprobe` confirmou `pix_fmt=rgb24`, portanto não eram transparentes.
- Foram baixadas seis miniaturas GIF públicas do PicMix para avaliação. Tinham 200 px; algumas apenas 3 quadros e 0,3 s.
- Esses arquivos são referência temporária, não qualidade de produção.
- Não commitar nem integrar esses testes. Produzir ou obter arquivos finais com alpha real e licença clara.

### Sequência de 55 quadros fornecida pela usuária

- Existem 55 PNGs em `D:\` com nomes `discord_fake_avatar_decorations_<timestamp>.png`.
- Eles são quadros consecutivos de uma única animação de inverno com folhas, pinhas, bolota, neve e partículas.
- Ordenar pelo timestamp numérico crescente para reconstruir o loop.
- O círculo azul e o símbolo branco no centro são apenas o avatar de demonstração. **Remover o avatar-base de todos os quadros.**
- A saída aceita contém somente a decoração e as partículas em RGBA transparente, reutilizável sobre qualquer foto.
- Preservar as partes brancas da neve: não apagar “todo branco” por cor. Construir/estimar o avatar-base e subtrair por diferença, combinando máscara temporal e retoque de alpha.
- Validar cada quadro sobre fundos preto, branco, vermelho e quadriculado antes de exportar.
- Remover duplicatas no início/fim, estabilizar o timing e garantir loop sem salto.
- Converter para o sprite WebP 6 × 4 usado por `AnimatedCosmetic.jsx`; se houver mais de 24 quadros úteis, reamostrar temporalmente sem acelerar demais.
- Não manter o logo do Discord nem uma foto específica incorporada no asset final.

## Pipeline correto para novos cosméticos

1. Obter/criar arte com alpha real.
2. Validar:

   `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt,nb_frames,duration arquivo`

3. Para base estática:
   - avatar: 384 × 384 PNG/WebP;
   - overlay: 480 × 720 PNG/WebP.
4. Para animação:
   - 24 quadros;
   - sprite sheet WebP 6 × 4;
   - avatar: 2304 × 1536;
   - overlay: 2880 × 2880;
   - loop contínuo;
   - transparência real;
   - sem fundo preto/cinza/checkerboard.
5. Colocar arquivos em:
   - `public/cosmetics-optimized/frames`
   - `public/cosmetics-animated/frames`
   - `public/cosmetics-optimized/overlays`
   - `public/cosmetics-animated/overlays`
6. Registrar IDs em:
   - `cosmetics.js`
   - `src/premiumCosmetics.js`
7. Renderizar por:
   - `src/PremiumAvatarFrame.jsx`
   - `src/PremiumProfileOverlay.jsx`
   - `src/AnimatedCosmetic.jsx`
8. Validar no editor, cartão compacto, modal completo, lista de membros e mensagem.
9. Não animar moldura completa na lista de membros. Para 40 px, usar o primeiro quadro ou uma versão simplificada; animação completa só em perfil aberto/preview.

## Próximo pacote recomendado

Criar no mínimo quatro itens por família:

### Molduras de avatar

- Coroa solar — dourada, brilho percorrendo o metal.
- Halo elétrico — azul/ciano, pulso lento.
- Espinhos de obsidiana — preto/vermelho, fumaça discreta.
- Sakura noturna — pétalas pequenas, rosa/vinho.

### Sobreposições

- Jardim de pétalas — rosas realistas pequenas, cantos opostos.
- Portal elétrico — borda azul irregular e fina.
- Fumaça abissal — fumaça preta/roxa nas bordas.
- Moldura verde arcana — criação original inspirada apenas nos princípios da referência quadrada; não usar a arte exata.

### Efeitos de perfil

- pétalas com sprites reais;
- fumaça em camadas;
- brasas com fragmentos e trilhas, não bolinhas;
- gelo/cristais com pequenos estilhaços.

## Backlog funcional ainda a retestar

Mesmo que testes automatizados passem, fazer teste manual com duas contas comuns e uma admin:

1. Cadastro e login de usuário externo recém-criado.
2. Login por usuário, e-mail e ID público.
3. Avatar e banner estáticos.
4. Banner GIF com Nitro e bloqueio sem Nitro.
5. Jogos favoritos e ícones no perfil.
6. Badge atribuída pelo admin aparecendo no próprio admin e em membros.
7. Criar cargo, salvar, reabrir e confirmar que lista.
8. Reordenar cargos e confirmar a lateral.
9. Dono e outro membro com o mesmo cargo aparecem no mesmo grupo; dono primeiro e com coroa.
10. Botão direito em si e nos outros abre o menu correto sem quebrar layout.
11. Duplo clique no canal de voz entra na chamada.
12. Indicador de fala reage ao microfone real.
13. Enviar mensagem desce automaticamente sem roubar o scroll de quem lê histórico.
14. `Esc` fecha perfil, editor, configurações e menus.
15. Perfil compacto → botão explícito → perfil completo.

## Regras de backend que não podem ficar só no frontend

- Autorização de cargo, mute, kick, ban e badges sempre no servidor.
- Nitro validado no servidor para GIFs/cosméticos premium.
- Dono determinado por `server.ownerId`.
- Cargo visual não eleva autoridade.
- Username único e tamanho mínimo validados no backend.
- Upload validar MIME real, tamanho, dimensões e formato.
- GIF/WebP animado deve ser detectado pelos bytes, não apenas extensão.
- Persistência deve continuar atômica.

## Testes e entrega

Após cada bloco:

1. `npm run build`
2. `npm test`
3. `npm run test:ui`
4. `git status -sb`
5. `git add <arquivos do bloco>`
6. `git commit -m "..."`
7. `git push origin main`
8. Aguardar Render ficar `live`.
9. Conferir `https://sesh-web-08o6.onrender.com/api/health`.

Não incluir arquivos temporários, referências com marca-d'água, downloads de baixa resolução nem saídas com transparência falsa no commit.
