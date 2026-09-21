# Auditoria opcional de simplificação — Plano de Implementação

> **Para agentes:** use `superpowers:executing-plans` para executar este plano tarefa por tarefa.

**Objetivo:** oferecer, ao chegar em `DONE`, uma auditoria consultiva opcional que registre recomendações de simplificação sem apagar ou editar código.

**Arquitetura:** as regras normativas ficam em `AGENTS.md` e em um módulo carregado somente em `DONE`. O hook de instruções expõe a auditoria como próxima ação e os testes verificam o contrato textual e a seleção do módulo. A documentação registra os critérios e o formato do relatório; não haverá comando, dependência ou analisador novo.

**Tecnologia:** Markdown, Node.js `node:test`, hooks CommonJS existentes.

**Especificação:** `docs/superpowers/specs/2026-09-21-auditoria-opcional-simplificacao-design.md` e `spec.md` § 15.

## Restrições globais

- A auditoria é opcional e nunca bloqueia `DONE`.
- Nenhuma execução automática remove, move ou edita arquivos.
- `ponytail-audit` é usado somente quando já estiver disponível; sem ele, o agente segue as instruções internas sem erro ou pedido de instalação.
- Relatórios são `.stilo/cleanup-NN.md` e não sobrescrevem histórico.
- Referências dinâmicas, APIs públicas, manifestos, migrações, fixtures e histórico exigem confirmação humana.
- Uma sugestão aceita retorna ao fluxo `FIX → REVIEW`.

### Tarefa 1: Fixar o contrato da auditoria no ruleset e no módulo

ID: T01
Especialista: ruleset e runtime de instruções

Files:
- Modify: `AGENTS.md`
- Create: `modules/auditoria.md`
- Modify: `hooks/stilo-instructions.js`
Depends-on: nenhum

**Interfaces:**
- Produz: `PROXIMA_ACAO.DONE` orientando auditoria opcional e `modulosDaFase()` carregando `auditoria.md` somente em `DONE`.

- [ ] Atualizar a tabela de companions e as instruções de `DONE` em `AGENTS.md` com o contrato dos oito requisitos da especificação.
- [ ] Criar `modules/auditoria.md` com gatilho inequívoco em `DONE`, classificação das sugestões, campos obrigatórios do relatório e retorno para `FIX → REVIEW`.
- [ ] Atualizar `hooks/stilo-instructions.js` para expor a ação e carregar o módulo sem alterar outras fases.
- [ ] Verificar por busca que não existe comando ou dependência nova.

### Tarefa 2: Cobrir seleção de contexto e contrato textual

ID: T02
Especialista: testes de contrato

Files:
- Modify: `tests/instructions.test.js`
- Create: `tests/audit.test.js`
Depends-on: T01

**Interfaces:**
- Consome: `modulosDaFase()`, `buildFullContext()`, `PROXIMA_ACAO` e os arquivos normativos.
- Produz: testes que falham se a auditoria for carregada fora de `DONE`, se o próximo passo não for opcional ou se o relatório permitir remoção automática.

- [ ] Adicionar teste de `modulosDaFase()` para `DONE` e confirmar que `REVIEW` não recebe `auditoria.md`.
- [ ] Adicionar teste de contexto completo em `DONE` contendo o módulo e a instrução de não editar código.
- [ ] Adicionar teste textual para os campos `arquivo`, evidência, risco, remoção mínima, verificação e classificação, além das áreas protegidas.
- [ ] Rodar os testes direcionados e confirmar falha antes da implementação e aprovação depois dela.

### Tarefa 3: Atualizar evidências e documentação pública

ID: T03
Especialista: documentação e evidências

Files:
- Modify: `docs/aceite.md`
- Modify: `README.md`
- Modify: `README.en.md`
Depends-on: T02

**Interfaces:**
- Produz: critérios 22–27 rastreáveis e descrição pública da auditoria opcional.

- [ ] Registrar na matriz de evidências a verificação local de cada critério 22–27, mantendo critérios vivos anteriores pendentes.
- [ ] Documentar em português e inglês que a auditoria é opcional, consultiva e não instala companion.
- [ ] Rodar `npm.cmd test`, `node scripts/sync-adapters.js --check` e `git diff --check`.

### Tarefa 4: Fechar a fase e preparar revisão

ID: T04
Especialista: governança do pipeline

Files:
- Modify: `.stilo/state.json`
- Modify: `spec.md`
Depends-on: T03

**Interfaces:**
- Produz: `spec.md` marcado como aprovado e estado persistido em `REVIEW` após a implementação verificada.

- [ ] Marcar a emenda da especificação como aprovada, preservando o histórico existente.
- [ ] Após todos os testes, gravar `phase: "REVIEW"`, incrementar `reviewRound` somente quando o review for escrito e atualizar `updated` em UTC.
- [ ] Escrever `.stilo/review-10.md` contra `spec.md` e este plano; qualquer achado volta para `FIX`.

## Verificação final

```powershell
npm.cmd test
node --test tests/instructions.test.js tests/audit.test.js
node scripts/sync-adapters.js --check
git diff --check
```

O ciclo só pode avançar para `DONE` se o review não tiver achados `crítico` ou `alto`; a auditoria de simplificação continua opcional depois disso.
