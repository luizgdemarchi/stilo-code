# Progresso da execução — ciclo 2026-11-02-dieta-superpowers-design

Atualizado: 2026-11-02. Fase: `EXECUTE`. Base: `4ced739`. Nada commitado ainda (commits só
com autorização do usuário). Plano aprovado em 2026-11-02, com as emendas do spec.

## Feito e verificado

- T01: `tests/all.test.js` (descoberta automática), `scripts/verificar-publicacao.js`,
  `tests/publicacao.test.js`, scripts no `package.json`. `node --test tests/publicacao.test.js`:
  6/6. `npm run validate-plan`: 13 tarefas, 5 ondas.
- T02: `hooks/stilo-state.js` (campo `cycle`, `documentosDoCiclo`, removidos off/ciclo
  legado), `tests/state.test.js`. 19/19.
- T03: `scripts/medir-tokens.js`, `tests/medir-tokens.test.js`, fixtures em
  `tests/fixtures/transcripts/`. 4/4; roda em transcript real do Claude e do Codex.
- T04: `modules/brainstorm.md`, `especificacao.md`, `plano.md`, `design.md` — dentro do
  orçamento.
- T05: `modules/orquestracao.md` (reescrito, só `PLAN`), `execucao.md`, `tdd.md`,
  `depuracao.md`, `correcao.md` — dentro do orçamento.
- T06: `modules/revisor.md`, `revisor-editorial.md`, `enxuto.md`, `frontend.md` — dentro do
  orçamento; títulos-contrato presentes; "até zero achados" ausente em `modules/`.

- Retomada em 2026-11-02 (nova sessão): checkout em `4ced739`, mudanças locais preservadas;
  T01–T03 reexecutados (29/29) e orçamentos de T04–T06 conferidos.
- T07: `modules/encerramento.md` (1.631), `modules/subagente.md` (1.062), seção "Testar a
  skill como código" em `modules/autoria-skill.md` (5.151), `THIRD_PARTY_NOTICES.md` (MIT
  integral conferido por inclusão de texto), `licenses/Apache-2.0.txt` (SHA-256 igual ao
  original `0d542e0c…94594`).

- T08: `AGENTS.md` reescrito, 8.676 caracteres; seções `## Regra 0` a `## 12.`; grep de
  "até zero achados", `superpowers` e versão de modelo vazio; critério único igual ao de
  `revisor.md`.

- T10: `hooks/stilo-diagnostics.js` usa `documentosDoCiclo` (sem `readCycle`, sem
  `cycle.json`, sem `docs/superpowers`); `tests/diagnostics.test.js` 11/11, e os 4 testes
  novos ou alterados falham contra o código de `4ced739`; critério 21 de `docs/aceite.md`
  `retirado`.

- T09: `modulosDaFase` pela tabela de R7.1; bloco de estado com Ciclo, Trilha, Documentos
  e `Módulos sob demanda`; `buildSubagentContext`; `hooks/stilo-sessao.js` (registro em
  `<dados>/sessoes/<16 hex>.json`, poda de 7 dias só dos próprios registros, recusa pasta
  de outro dono ou link no temporário); `stilo-activate.js` lê o stdin; `stilo-prompt.js`
  injeta os módulos na troca de fase. Testes de instruções, contexto, hooks, confiabilidade
  e estado: 77/77; 22 falharam antes da implementação. Pior caso medido (nome longo,
  `design.md`, nota do `gh`): sessão 11.465–17.860 (máximo em `REVIEW`), subagente
  1.280–2.791, sem compactação em nenhuma fase. Revisor em subagente não executado: sem
  delegação autorizada nesta sessão; o `REVIEW` do ciclo cobre o diff.

- T11: `git mv` de 14 documentos para `docs/ciclos/` (a seção Files do plano lista 14; o
  "15" da verificação é erro de contagem). `git ls-files spec.md plan.md docs/superpowers
  .stilo/cycle.json` vazio; `validate-plan` passa; pastas vazias de `docs/superpowers/`
  removidas; `.stilo/cycle.json` apagado. `docs/evidencias-template.md`: além das linhas
  17 e 18, a linha 19 mandava criar `.stilo/cycle.json`, contra R4.4; trocada pelo campo
  `cycle` do estado. Referências restantes a `docs/superpowers` ficam só no histórico
  (`docs/security/audits/`, documentos migrados).

- T12: READMEs (ciclos, trilha curta, `design.md`, medição, política de versão, créditos);
  `docs/preparacao-github-cli.md` recebeu as regras tiradas do `AGENTS.md`;
  `docs/contrato-hooks.md` com o contrato do subagente, do rastreio de sessão e da troca de
  fase; versões `0.2.0`; `evidencias.md` (antes reproduzido caractere a caractere numa
  cópia de `4ced739`; C23 passou para `marketplace.json` e `plugin.json`; E1 e E2
  pendentes com roteiro); `publicacao.json` registrado (`54c9d15c…`), verificação com
  código 0. Atenção para o `FIX`: mudar arquivo distribuído invalida o registro; como
  `0.2.0` não foi publicada, registre de novo antes de publicar.

- T13: `tests/estrutura.test.js` (C02, C04, C07, C08, C09, C11, C17, C18, C19, C22 e
  orçamentos); `orchestration`, `reviewer-contract`, `audit` e `instruction-improvement`
  reescritos sem prosa; `manifestos` aceita a atribuição em `THIRD_PARTY_NOTICES.md`.
  `npm test` 156/156; `validate-plan`, `verificar-publicacao`, `git diff --check` e
  `claude plugin validate .` passam. Nenhum arquivo distribuído mudou depois do registro.

Execução encerrada em 2026-11-02; fase gravada como `REVIEW`. Nada commitado: os commits
esperam autorização do usuário.

## Para o `REVIEW` olhar

- Desvios fora da seção Files: `tests/github-cli-bootstrap.test.js` (T13) tinha asserção
  de prosa ("Preparação do ambiente") sem tarefa dona, e foi trocada pela âncora `## 12.`;
  linha 19 de `docs/evidencias-template.md` (T11). READMEs citam a skill de design sem o
  nome do pacote, porque `manifestos.test.js` proíbe o nome fora dos avisos.
- O `validate-plan` do `package.json` (arquivo distribuído) aponta para o plano do ciclo
  ativo. Cada ciclo novo muda o hash de publicação e exige versão nova só por isso. O id
  deste ciclo também contém `superpowers`; C19 desconta esse id.
- Revisor em subagente de T09 não executado (sem delegação autorizada).
- Corrigir arquivo distribuído no `FIX` invalida `publicacao.json`; registrar de novo antes
  de publicar.

## Observações para quem retomar

- Testes antigos de prosa (`instructions`, `context`, `hooks`, `reliability-contract`,
  `orchestration`, `reviewer-contract`, `audit`, `diagnostics`) vão falhar até T09/T10/T13
  (decisão 7 do plano). `npm test` completo só precisa passar no fim de T13.
- Critério único de saída, frase usada em `modules/revisor.md` e que T08 deve repetir igual
  no `AGENTS.md`: "Critério de saída: repetir `REVIEW → FIX` até uma rodada sem achado
  `crítico` nem `alto`."
- Trilha curta: o `SPEC` escreve `ciclo.md` com `## Spec` e `## Plano` e pede uma aprovação;
  o `PLAN` só confere os passos.
- Módulos novos e reescritos começam com a linha `Gatilho: ...` (contrato para T13).
