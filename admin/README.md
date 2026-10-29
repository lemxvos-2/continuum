# Continuum Admin (privado)

Painel de administração do Continuum. **Esta pasta deve ir para um repositório privado** — apague-a do repo público depois de copiá-la.

## Rodar
```bash
cp .env.example .env   # ajuste VITE_API_URL
npm install
npm run dev            # http://localhost:5174
```

## Acesso (um único administrador)
1. No servidor, defina `ADMIN_EMAIL=voce@exemplo.com`.
2. No servidor, defina `ADMIN_FRONTEND_URL=https://admin.continuum.onl` e inclua
   `https://admin.continuum.onl` em `CORS_ALLOWED_ORIGINS`.
3. Configure `https://admin.continuum.onl/google-callback` como Authorized redirect URI
   no Google Cloud Console. O painel também aceita login Google, sem senha cadastrada.
4. Configure `VITE_API_URL=https://sua-api.onrender.com` no build do painel.

Qualquer outra conta recebe 404. Sem `ADMIN_EMAIL`, a API de admin fica desligada.
O login Google é validado em `/api/admin/me`; contas sem permissão não mantêm o token.
O login por e-mail e senha fica oculto por padrão. Para exibi-lo em um build de
desenvolvimento, configure `VITE_DEV_MODE=true` no arquivo `.env` do painel e reinicie
o servidor/build. Essa opção controla somente a interface do painel e não altera as regras
de autenticação do backend.

### Testes locais

O comando `npm run dev` serve o painel em `http://localhost:5174`. Para testar OAuth
localmente, defina `ADMIN_FRONTEND_URL=http://localhost:5174` no backend e adicione
`http://localhost:5174/google-callback` às Authorized redirect URIs no Google Cloud
Console. Se executar o painel em outra porta, use essa mesma origem nos dois lugares.

Variáveis do backend para produção:

```text
ADMIN_EMAIL=seu-email@gmail.com
ADMIN_FRONTEND_URL=https://admin.continuum.onl
CORS_ALLOWED_ORIGINS=https://continuum.onl,https://admin.continuum.onl
```

Variável do frontend admin:

```text
VITE_API_URL=https://sua-api.onrender.com
```

## Funcionalidades
- Métricas: usuários, ativos, novos 7d/30d, notas, entidades, workspaces, usuários por plano, saúde do servidor
- Usuários: busca, paginação, bloquear/ativar
- Assinaturas: status, planos, renovação e link direto para o Stripe
