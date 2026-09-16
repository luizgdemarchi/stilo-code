# Review 04 — stilo-code

Revisado: checkout completo em `main` (`a215a2e`), hooks, adaptadores, manifestos,
documentação e suíte local.
Contra: `spec.md`, `plan.md`, `AGENTS.md`, reviews anteriores e `docs/aceite.md`.

## Resumo

6 achados: 2 alto, 3 médio, 1 baixo. Todos corrigidos ou reclassificados no ciclo
`retomada-confiavel-governanca`; a validação viva continua pendente apenas onde
`docs/aceite.md` registra explicitamente essa limitação.

`npm.cmd test` passa 55/55, `node scripts/sync-adapters.js --check` passa e `git diff --check`
passa. Esses checks não cobrem os cenários abaixo.

## Achados

### 1. Estado JSON ilegível é confundido com ausência de projeto

- **Arquivo:** `hooks/stilo-instructions.js:88-90`
- **Gravidade:** alto
- **O que quebra:** um projeto existente em `EXECUTE` com `state.json` truncado ou JSON inválido faz `readState()` devolver `null`; a próxima mensagem recebe “nenhum projeto ativo” e a instrução para criar uma subpasta em `BRAINSTORM`. O agente pode iniciar outro projeto e abandonar a fase persistida.
- **Como corrigir:** `resolveProjeto()` deve distinguir arquivo ausente de arquivo encontrado porém ilegível; nesse segundo caso, injetar erro explícito com o caminho e bloquear criação/avanço até o usuário reparar o JSON. Cobrir `SessionStart` e `UserPromptSubmit`.
- **Estado:** corrigido em `hooks/stilo-instructions.js:169-179` e `tests/instructions.test.js`; `resolveProjeto()` distingue `unreadable` e o contexto bloqueia reinício.

### 2. Estado com `phase` ausente ou vazio reinicia silenciosamente em `BRAINSTORM`

- **Arquivo:** `hooks/stilo-instructions.js:67-69`
- **Gravidade:** alto
- **O que quebra:** `{ "project": "app", "phase": null }` ou um state sem `phase` passa por `faseInvalida()`, e `fase()` escolhe `BRAINSTORM`; um projeto que perdeu esse campo é apresentado como novo, sem aviso de schema inválido.
- **Como corrigir:** validar os campos obrigatórios do schema (`version`, `project`, `phase`, `reviewRound`, `enxuto`); tratar ausência/vazio como estado inválido explícito, sem aplicar defaults destrutivos. Adicionar testes para `phase` ausente, `null` e string vazia.
- **Estado:** corrigido em `hooks/stilo-state.js:153-177` e `tests/state.test.js`; `validateState()` exige todos os campos sem defaults destrutivos.

### 3. `/stilo-off` e `/stilo` ignoram falha ao persistir o flag global

- **Arquivo:** `hooks/stilo-prompt.js:50-58`
- **Gravidade:** médio
- **O que quebra:** se `~/.stilo/off` já for um diretório ou o diretório não tiver permissão de escrita, `setOff()` retorna `false`, mas `/stilo-off` confirma “STILO OFF”; depois, `/stilo` pode imprimir o ruleset e aparentar religação enquanto o flag continua ativo e as mensagens comuns continuam silenciosas.
- **Como corrigir:** verificar o retorno de `setOff()` e emitir erro explícito; só confirmar a mudança quando o estado em disco puder ser relido como esperado. Cobrir diretório conflitante e falha de permissão.
- **Estado:** corrigido em `hooks/stilo-prompt.js:58-71` e `tests/hooks.test.js`; `setOff()` é relido antes de confirmar off/on.

### 4. A matriz de suporte declara Copilot com hooks, mas o pacote não publica manifesto Copilot

- **Arquivo:** `spec.md:276-277`
- **Gravidade:** alto
- **O que quebra:** a documentação promete camada 2 para GitHub Copilot CLI, mas não existe manifesto/registro de hooks do Copilot no repositório; portanto a branch `COPILOT_PLUGIN_DATA` de `hooks/stilo-runtime.js` não é alcançada por uma instalação publicada e o estado não é injetado automaticamente.
- **Como corrigir:** ou adicionar o manifesto e um teste de instalação/saída do Copilot, ou remover Copilot da matriz e declarar apenas o modo manual suportado. Atualizar README e `docs/aceite.md` de forma consistente.
- **Estado:** corrigido em `spec.md:274-287`, `AGENTS.md`, `README.md`, `README.en.md` e `tests/manifestos.test.js`; Copilot está documentado somente como suporte manual.

### 5. Integração OpenCode é testada só como objeto JavaScript, não como runtime do agente

- **Arquivo:** `.opencode/plugins/stilo.mjs:58-64`
- **Gravidade:** médio
- **O que quebra:** o plugin depende do hook experimental `experimental.chat.system.transform` e de mutação de `saida.system`; uma mudança de versão que não propague essa mutação deixa o agente sem o ruleset, embora o plugin carregue sem exceção. O teste atual apenas chama a função com um objeto fabricado.
- **Como corrigir:** fixar uma versão/linha de suporte do OpenCode, adicionar smoke test executando o CLI e verificar que o prompt efetivamente contém o estado; manter fallback documentado para `AGENTS.md` quando o hook não estiver disponível.
- **Estado:** corrigido em `.opencode/plugins/stilo.mjs:58-72` e `tests/opencode-runtime.test.js`; fallback por `AGENTS.md` e smoke condicionado à CLI estão publicados.

### 6. `DONE` está mais forte que a evidência de aceitação registrada

- **Arquivo:** `.stilo/state.json:4` e `docs/aceite.md:15-33`
- **Gravidade:** médio
- **O que quebra:** o estado diz `DONE`, mas os critérios 2, 4, 5, 12 e 14 permanecem marcados como “mecanismo verificado, falta a confirmação em sessão viva”. Isso permite declarar encerramento sem provar criação de projeto, `/clear`, transição de `SPEC`, modo enxuto e resposta no idioma numa conversa real.
- **Como corrigir:** executar e registrar os cinco roteiros em uma sessão real de cada agente prometido, ou mudar o estado/documentação para “verificado localmente, validação viva pendente”.
- **Estado:** corrigido em `docs/aceite.md:1-21`, `hooks/stilo-diagnostics.js:187-211` e `.stilo/state.json:4`; `DONE` permanece bloqueado enquanto houver evidência pendente.

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 1 | Instalação no Claude Code | atendido |
| 2 | Projeto novo entra em `BRAINSTORM` | parcial — mecanismo, não comportamento vivo |
| 3 | Sessão nova reporta `PLAN` | atendido por teste de hook |
| 4 | `/clear` retoma a fase | parcial — matcher, não comportamento vivo |
| 5 | Fim de `SPEC` grava estado e avisa | parcial — instrução, não comportamento vivo |
| 6–11 | Hooks, adaptadores, `AGENTS.md`, companions e módulos | atendidos no escopo local |
| 12 | Modo Enxuto em `EXECUTE` | parcial — instrução, não comportamento vivo |
| 13 | Override persistente de `enxuto` | atendido por teste |
| 14 | Idioma da resposta | parcial — regra publicada, não comportamento vivo |

## Melhorias recomendadas (sem achado novo)

- adicionar CI com `npm test`, `sync-adapters.js --check` e `git diff --check`;
- declarar `engines.node` e uma matriz de versões suportadas;
- substituir referências documentais stale (`README.pt-BR.md`, “nove cópias”) pela estrutura real;
- atualizar `docs/contrato-hooks.md` para registrar que Codex também fornece `CLAUDE_PLUGIN_ROOT` como alias e separar contrato observado de compatibilidade atual.
