# Distribuição do Sesh

## Teste local

Envie `release/Sesh-Portable-1.0.0-x64.exe`. Cada pessoa consegue abrir sem
instalar Node.js. Nessa modalidade cada computador possui um banco local próprio;
as pessoas ainda não compartilham as mesmas comunidades.

Antes de disponibilizar o arquivo, publique também o hash SHA-256 para que os
usuários possam verificar a integridade do download.

## Colocar todos na mesma comunidade

Para usuários diferentes conversarem entre si, use uma instância central:

1. Hospede `server.js` em um serviço compatível com Node.js e WebSocket.
2. Configure PostgreSQL por `DATABASE_URL`; não use o JSON local em produção.
3. Exponha somente HTTPS e WSS por um domínio próprio.
4. Configure `CORS_ORIGIN` com a origem exata do frontend.
5. Defina `CREATOR_EMAIL` no ambiente do servidor, nunca no código.
6. Adicione um servidor TURN com credenciais temporárias para câmera e
   compartilhamento funcionarem entre redes e operadoras diferentes.
7. Troque a configuração do frontend para usar a URL pública da API e gere
   novamente o executável.

## Antes de divulgar

- Assine o executável com um certificado de assinatura de código.
- Implemente recuperação de senha, verificação de email e limitação de tentativas.
- Use backups criptografados do PostgreSQL.
- Adicione política de privacidade, termos, denúncia e moderação.
- Faça teste de carga e auditoria das permissões.

O ASAR dificulta alterações casuais no código distribuído, mas não substitui
segredos no servidor. Tokens, senhas de banco e chaves nunca devem ser incluídos
no executável.
