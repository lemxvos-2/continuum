# Timeline por Entries (journal mensal)

## Contexto
Usuários reais escrevem uma única nota por mês ("Setembro 2026") com blocos começando por uma data:

```
01/09/2026
Falei merda pra @Ana Luíza...

03/09/2026
Fui treinar com a @Ana Luíza... (Edit: Realmente foi (19/09/2026)).
```

O Continuum não deve forçar 30 notas soltas. Ele deve entender essa estrutura.

## 1. Parser de entries (determinístico, sem AI)
- Uma linha/parágrafo que contém só uma data marca o início de uma entry.
- Formatos: `DD/MM/AAAA`, `DD/MM`, `DD-MM-AAAA`, `AAAA-MM-DD`, `DD de setembro`, headings com data.
- `DD/MM` sem ano herda o ano do título da nota ou da entry anterior.
- A entry vai até a próxima linha-data ou fim da nota.
- Datas entre parênteses dentro do texto (`(Edit: ... (19/09/2026))`) NÃO abrem entry: viram "retrospectivas".
- Resultado: `{ noteId, date, startPos, endPos, text, entityIds[], retroDates[] }`.
- Rodar no cliente ao abrir/salvar; cache por `noteId + updatedAt`. Futuramente, persistir no backend para consultas.

## 2. Visualizações
- **Modo Documento:** o editor atual, intacto. Linhas-data ganham estilo sutil (chip de data, divisor).
- **Modo Timeline:** linha vertical; cada entry é um nó com data, trecho, chips das entidades mencionadas.
- Toggle Documento/Timeline no topo da nota. Clicar em uma entry na timeline abre o documento na posição.

## 3. Timeline global
- Página/aba que junta entries de todas as notas em ordem cronológica (mais recentes primeiro).
- Notas sem entries entram como uma entry na data de criação.
- Agrupamento por mês, rolagem infinita.

## 4. Filtro por entidade
- Clicar em `@Ana Luíza` mostra só os dias em que ela aparece: a história cronológica da relação.
- Integrar na página da entidade: aba "Timeline".
- Mostrar lacunas ("23 dias sem mencionar") como espaço visual, não número frio.

## 5. Retrospectivas (Edits)
- `(Edit: ... (19/09/2026))` liga a entry de 03/09 ao dia 19/09.
- Na timeline: badge "revisitado em 19/09"; no dia 19/09 aparece um eco "você voltou a 03/09".
- Ação rápida "Adicionar retrospectiva" insere `(Edit: … (hoje))` no fim da entry.

## 6. Atalhos de escrita
- Comando `/hoje` insere a data de hoje como linha-data.
- Ao abrir a nota do mês atual, botão "Nova entry de hoje" cria a linha e posiciona o cursor.

## Ordem sugerida
1. Parser + testes (formatos, herança de ano, retrospectivas).
2. Estilo das linhas-data no editor + `/hoje`.
3. Modo Timeline dentro da nota.
4. Filtro por entidade e aba na entidade.
5. Timeline global.
6. Retrospectivas ligadas.
