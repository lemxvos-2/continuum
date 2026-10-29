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
2. Entre no painel com o e-mail e a senha dessa conta (login normal com JWT).
   A conta precisa ter senha cadastrada (contas criadas só com Google não têm).
3. Adicione o domínio do painel em `CORS_ALLOWED_ORIGINS` do backend.

Qualquer outra conta recebe 404. Sem `ADMIN_EMAIL`, a API de admin fica desligada.
A sessão fica salva só na aba (sessionStorage) e expira junto com o token.

## Funcionalidades
- Métricas: usuários, ativos, novos 7d/30d, notas, entidades, workspaces, usuários por plano, saúde do servidor
- Usuários: busca, paginação, bloquear/ativar
- Assinaturas: status, planos, renovação e link direto para o Stripe
