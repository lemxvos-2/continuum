# Evitar o "Cemitério de Notas" (sem IA)

> Status: proposta para o futuro · Criado em 07/11/2026

## Problema

O Continuum promete evitar que notas morram esquecidas, mas na prática os Insights atuais
(score numérico, badges como "Forgotten Gem", "editada há 42 dias") não geram valor:

- Números são dados frios: não trazem contexto nem emoção.
- Não oferecem um **próximo passo** claro ("tá, e daí?").
- Exigem que o usuário saia do que está fazendo e vá até `/insights`.

**Objetivo:** fazer notas antigas voltarem à vida com mecânicas determinísticas —
instantâneas, privadas, offline e sem custo de IA.

## Princípios

1. **Mostrar o conteúdo, não a métrica.** Sempre exibir o trecho real da nota.
2. **Toda sugestão tem uma ação.** Resolver, adicionar pensamento, adiar ou arquivar.
3. **Aparecer no contexto.** No diário/notas e no editor, não só numa página separada.
4. **Pouco por vez.** 1 a 3 itens, nunca listas infinitas.
5. **Determinístico e explicável.** O usuário entende por que algo apareceu.

---

## 1. Open Loops — Caçador de fios soltos

Pensamentos abandonados pela metade são o maior cemitério.

### Detecção (varredura do documento TipTap)
- Checklists `[ ]` não marcados criados há mais de 7 dias.
- Parágrafos terminados com `?` (perguntas não respondidas).
- Prefixos explícitos: `DÚVIDA:`, `IDEIA:`, `DECIDIR:`, `TODO:` (e equivalentes em inglês).

### O que o usuário vê
> **3 pensamentos incompletos de semanas atrás**
> ↳ "Vale a pena trocar o banco de dados?" — *Arquitetura v2*, há 24 dias
> `[Resolver]` `[Adiar]` `[Descartar]`

### Ações
- **Resolver:** abre a nota rolando até o trecho (ou marca o checklist).
- **Adiar:** soneca de 14 dias.
- **Descartar:** nunca mais sugerir esse trecho.

### Notas técnicas
- Extrair loops no salvamento da nota (backend) e guardar `noteId`, `blockId`/posição, texto, tipo, `createdAt`.
- Guardar estado por loop: `open | snoozed(until) | resolved | dismissed`.
- Respeitar o workspace ativo em todas as leituras.

---

## 2. Daily Shuffle — 1 minuto por dia

### Funcionamento
- Ao abrir o app, um card compacto no topo de Notas mostra **1 nota antiga**.
- Seleção por repetição espaçada: intervalos 7 → 30 → 90 → 180 dias,
  ponderados por menções/conexões (reaproveitar o score atual como peso, não como exibição).
- Mesma nota durante o dia inteiro (semente = data + usuário).

### Ações
1. 📌 **Ainda relevante** — avança para o próximo intervalo.
2. ✏️ **Adicionar pensamento** — caixa rápida; o texto é anexado ao fim da nota com a data de hoje.
3. 📦 **Arquivar / Desapegar** — remove do shuffle.
4. **Pular** — mostra outra (limite de 3 por dia).

### Métrica de sucesso
- % de dias em que o usuário interage com o card.
- Notas antigas que recebem novo conteúdo.

---

## 3. Ressurgimento contextual no editor

### Funcionamento
- Ao inserir uma menção (`@Design`, `#Estratégia`) na nota atual, consultar notas que
  compartilham essa entidade (interseção simples de `entityIds`).
- Exibir discretamente (rodapé/painel lateral, recolhível):
  > Você citou **@Design** em 3 notas anteriores. A mais antiga é de maio: *Princípios Visuais*.
- Ordenar por: mais entidades em comum → mais antiga não revisitada.

### Cuidados
- Não interromper a escrita: sem pop-ups, sem foco roubado.
- Debounce e cache local; funcionar offline com os dados já em cache.
- Opção para desligar em Configurações do editor.

---

## 4. Interseção de entidades (coincidências)

### Funcionamento (álgebra de conjuntos)
- Para cada entidade, contar coocorrência com outras entidades nas mesmas notas.
- Na página da entidade:
  > Aparece junto de **@Ana** com frequência: **#ProjetoX** (80% das notas), **@Carlos** (40%).
- Clique abre a lista das notas onde ambas aparecem.

### Regras
- Mínimo de 3 notas em comum para exibir (evitar ruído).
- Percentual = notas com ambas / notas da entidade atual.

---

## 5. Cápsula do tempo — mensagem para o eu do futuro

### Funcionamento
- Comando no editor: `/lembrar 30d`, `/lembrar 3m` ou `/lembrar 2027-01-01`.
- Insere um bloco especial na nota com a data de reabertura.
- No dia marcado, destaque no topo de Notas (e opcionalmente no e-mail diário existente):
  > 📬 **Mensagem do seu "eu" de 3 meses atrás**
  > "Hoje decidi lançar o produto sem cobrar. Quero ver se vou me arrepender."
  > `[Abrir]` `[Responder hoje]`

- **Responder hoje** anexa a reflexão abaixo da mensagem original, com a data.

---

## Antes vs. depois

| Hoje (métricas passivas) | Proposta (ativa, sem IA) |
| :--- | :--- |
| "Score 8.2 — Forgotten Gem" | "2 checklists esquecidos há 18 dias" |
| Gráfico de evolução de score | Daily Shuffle com ações rápidas |
| Só em `/insights` | No topo de Notas e dentro do editor |
| Usuário interpreta números | Usuário lê o trecho e decide |

## O que fazer com a página Insights atual
- Manter o score apenas como **peso interno** de ordenação.
- Esconder números crus por padrão; substituir badges por frases com o motivo
  ("sem abrir há 3 meses, ligada a 4 entidades").
- Insights vira o "centro de revisão": Open Loops, Cápsulas pendentes, Shuffle e coincidências.

## Ordem sugerida de implementação
1. **Open Loops** — maior valor, só depende do conteúdo das notas.
2. **Daily Shuffle** — reaproveita o score existente.
3. **Ressurgimento no editor** — reaproveita `entityIds`.
4. **Cápsula do tempo** — novo bloco no editor + integração com e-mail diário.
5. **Interseção de entidades** — consulta agregada na página da entidade.

## Fora de escopo
- Qualquer resumo, classificação ou geração por IA.
- Notificações push (avaliar depois).
