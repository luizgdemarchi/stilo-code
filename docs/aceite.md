# Critérios de aceite — resultado

Passo 13 do `plan.md`, contra os 14 critérios do `spec.md` § 12.

Plugin instalado de verdade a partir do caminho local:

```
claude plugin marketplace add "./"        → Successfully added marketplace: stilo-code
claude plugin install stilo-code@stilo-code → Successfully installed (scope: user)
claude plugin details stilo-code@stilo-code → Skills (2) stilo, stilo-off
                                              Hooks (3) SessionStart, UserPromptSubmit, SubagentStart
                                              Always-on: ~300 tok
```

Legenda: ✅ verificado · 🕐 mecanismo verificado, falta a confirmação em sessão viva
(depende de comportamento do agente numa conversa real, que não dá para observar de fora).

| # | Critério | Situação |
|---|---|---|
| 1 | Instala no Claude Code sem erro | ✅ pelo caminho local; pelo GitHub só depois do Passo 15 |
| 2 | Pasta sem `.stilo/` entra em `BRAINSTORM`, não em implementação | ✅ mecanismo · 🕐 comportamento |
| 3 | Sessão nova com `phase: "PLAN"` reporta fase e próxima ação sozinha | ✅ |
| 4 | `/clear` no meio e o agente retoma na fase certa | ✅ mecanismo · 🕐 comportamento |
| 5 | Ao terminar `SPEC`: grava `spec.md`, atualiza estado, avisa `/clear` seguro | 🕐 comportamento |
| 6 | `/stilo-off` para de injetar; `/stilo` religa | ✅ |
| 7 | Hooks não quebram a sessão sem `node` no PATH | ✅ |
| 8 | `sync-adapters.js --check` passa | ✅ |
| 9 | `AGENTS.md` sozinho conduz o pipeline | ✅ |
| 10 | Pipeline completa com zero companions; nada preso a um agente é citado | ✅ |
| 11 | Módulos carregam só na fase certa | ✅ |
| 12 | `EXECUTE` sem narração nem cortesia, com negações e erros intactos | 🕐 comportamento |
| 13 | `/stilo enxuto pleno` sobrepõe a fase e persiste | ✅ |
| 14 | Repo em pt-BR; agente responde em inglês para usuário anglófono | ✅ repo · 🕐 resposta |

## Evidência

**1 — instalação.** Saída do `claude plugin details` acima: as 2 skills e os 3 hooks
foram reconhecidos, e os manifestos parseiam (`tests/manifestos.test.js`).

**2 — projeto novo.** `stilo-activate.js` num diretório sem `.stilo/` emite o ruleset
inteiro mais o bloco "Nenhum `.stilo/state.json` encontrado… comece em `BRAINSTORM`… não
pule para a implementação". A parte 🕐 é o agente obedecer, o que só aparece numa conversa.

**3 — sessão nova em `PLAN`.** Com o plugin instalado, `CLAUDE_PLUGIN_ROOT` apontando
para o cache:

```
- **Fase:** PLAN
- **Próxima ação:** escrever plan.md com passos verificáveis
- **Modelo alvo:** profundo
- **Modo Enxuto:** leve
```

**4 — `/clear`.** O manifesto declara `"matcher": "startup|resume|clear|compact"` no
`SessionStart` (verificado em `tests/manifestos.test.js`), e o hook lê o disco a cada
disparo. O que falta é rodar `/clear` numa conversa real e ver o agente retomar.

**5 — fim de `SPEC`.** Instrução presente em `AGENTS.md` § 2 e § 8, e o bloco de estado
injetado termina em "Ao concluir esta fase, grave você mesmo a fase seguinte". Verificável
só numa sessão viva.

**6 — desligar e religar.**

```
/stilo-off  → STILO OFF — o pipeline para de ser injetado até o próximo /stilo.
mensagem comum enquanto off → (vazio)
SessionStart enquanto off   → (vazio)
/stilo      → # Stilo Code — pipeline de projeto …
```

**7 — sem `node` no PATH.** O `commandWindows` de cada hook roda o guard
`if (Get-Command node -ErrorAction SilentlyContinue) { … }`. Executado em PowerShell com
`PATH=C:\Windows\System32`: saída vazia, sem erro, sem comando nativo executado. O teste
`tests/manifestos.test.js` falha se algum hook perder o guard.

**8 — adaptadores.** `--check` sai 0 em dia; depois de editar uma linha do `AGENTS.md`
sai 1 listando os 6 arquivos; depois de `npm run sync` volta a sair 0. Fixado em teste.

**9 — `AGENTS.md` autossuficiente.** As 10 seções exigidas pelo Passo 3 do plano estão
presentes: Regra 0, Regra 1, as 7 fases, o que fazer em cada fase, o `state.json`, modelo
por fase, módulos, Modo Enxuto, idioma, aviso de `/clear`, companions e comandos. 8.9 KB.

**10 — zero companions.** Nenhum arquivo publicado cita pacote preso a um único agente —
teste `nenhum arquivo publicado cita pacote preso a um único agente`, que varre o repo
inteiro. Nenhum módulo ou hook exige companion para funcionar.

**11 — módulos por fase.** Em `EXECUTE`, o contexto injetado traz `modules/enxuto.md` e
**não** traz `frontend.md`, `revisor.md` nem `autoria-skill.md` (contagem `grep -c` = 0
para os três). Em `REVIEW`, traz `revisor.md`.

**12 — Modo Enxuto em `EXECUTE`.** `modules/enxuto.md` entra no contexto com nível
`pleno` resolvido pela fase. Se a saída obedece é comportamento de conversa.

**13 — `enxuto` persistente.** `/stilo enxuto pleno` em `BRAINSTORM` grava
`"enxuto": "pleno"` no `state.json` sem mexer na fase, e a sessão seguinte lê `pleno` em
vez do `off` que a fase daria.

**14 — idioma.** Todo arquivo publicado está em pt-BR. A regra "responda no idioma em que
o usuário escreveu" está em `AGENTS.md` § 7 e em `modules/enxuto.md`; a resposta em si é
comportamento.

## Achado corrigido durante este passo

Rodando os hooks com o payload real, `/stilo enxuto pleno` respondeu "nenhum projeto ativo
aqui" num diretório que **tinha** `.stilo/state.json`: o `cwd` do payload era um caminho
estilo POSIX que o Node no Windows resolvia para um diretório inexistente, e o hook
aceitava esse valor sem checar. Corrigido em `hooks/stilo-prompt.js` — o `cwd` do payload
só é usado quando existe em disco, senão cai no `process.cwd()` do próprio hook, que é o
da sessão de qualquer forma. Dois testes de regressão em `tests/hooks.test.js`.

## O que falta

Os cinco itens 🕐 dependem de uma conversa real com o plugin instalado. O roteiro mínimo:

1. Numa pasta sem `.stilo/`, pedir um projeto novo → tem que virar subpasta + `BRAINSTORM`.
2. Levar até `SPEC`, conferir `spec.md` gravado, `state.json` em `PLAN` e o aviso de
   `/clear` seguro.
3. Rodar `/clear` e mandar qualquer mensagem → tem que retomar em `PLAN`.
4. Em `EXECUTE`, conferir que a resposta não tem narração nem cortesia, e que negações,
   números, blocos de código e mensagens de erro saíram intactos.
5. Escrever uma mensagem em inglês → a resposta tem que vir em inglês.
