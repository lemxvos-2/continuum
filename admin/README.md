# Continuum Admin (privado)

Painel de superadmin do Continuum. **Esta pasta deve ir para um repositório privado** — apague-a do repo público depois de copiá-la.

## Rodar
```bash
cp .env.example .env   # ajuste VITE_API_URL
npm install
npm run dev            # http://localhost:5174
```

## Segurança (3 camadas, todas obrigatórias)
1. **Login normal + role ADMIN** — o usuário precisa ter `role: "ADMIN"` no documento `users` do MongoDB:
   `db.users.updateOne({ email: "voce@exemplo.com" }, { $set: { role: "ADMIN" } })`
2. **Chave de admin** — defina no servidor `ADMIN_API_KEY` com pelo menos 32 caracteres
   (`openssl rand -hex 32`). Ela é digitada no login e nunca fica salva no navegador.
   Sem essa variável, a API de admin responde 404 (desligada em instalações self-host).
3. **Allowlist de IP (opcional)** — `ADMIN_ALLOWED_IPS=1.2.3.4,5.6.7.8`.

Também adicione o domínio do painel em `CORS_ALLOWED_ORIGINS` do backend.
Qualquer falha retorna 404 (não revela que o painel existe) e é registrada no log.

## Funcionalidades
- Métricas: usuários, ativos, novos 7d/30d, notas, entidades, workspaces, usuários por plano, saúde do servidor
- Usuários: busca, paginação, bloquear/ativar
- Assinaturas: status, planos, renovação e link direto para o Stripe
