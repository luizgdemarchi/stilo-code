# Stilo Code

O pipeline de projeto que sobrevive ao `/clear`.

*[English](README.en.md)*

## O problema

Você tem um jeito de tocar projeto: pensar antes, escrever a spec, planejar, executar,
revisar. Enquanto isso vive só como memória do agente, três coisas acontecem:

1. **Some.** Um reset de configuração e o workflow deixa de valer.
2. **Não é portátil.** Existe dentro de um agente, numa máquina.
3. **Não sobrevive ao `/clear`.** Depois de limpar o contexto o agente esquece em que fase
   o projeto está e volta a improvisar — normalmente escrevendo código que ninguém pediu.

O Stilo Code transforma esse pipeline numa **máquina de estados gravada em disco**. Um
arquivo de 6 linhas por projeto, lido automaticamente a cada início de sessão. Depois do
`/clear`, o agente relê o disco e volta exatamente onde parou.

## O pipeline

```
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → DONE
```

| Fase | Modelo | Artefato durável | Sai quando |
|---|---|---|---|
| `BRAINSTORM` | profundo | *(nenhum)* | você confirma o escopo |
| `SPEC` | profundo | `spec.md` | a spec está aprovada |
| `PLAN` | profundo | `plan.md` | o plano tem passos verificáveis |
| `EXECUTE` | **rápido** | o código | todo passo feito e verificado |
| `REVIEW` | profundo | `.stilo/review-NN.md` | o review está em arquivo |
| `FIX` | profundo | código corrigido | todo achado resolvido |
| `DONE` | — | — | review sem achado crítico nem alto |

**Regra 0 — uma pasta por projeto.** **Regra 1 — nunca pular para a implementação:** um
pedido pequeno ainda passa pelo pipeline, só que rápido.

O estado fica em `<projeto>/.stilo/state.json`:

```json
{
  "version": 1,
  "project": "meu-app",
  "phase": "PLAN",
  "reviewRound": 0,
  "enxuto": "auto",
  "updated": "2026-08-21T20:40:00Z"
}
```

## Instalação

### Claude Code

```
/plugin marketplace add luizgdemarchi/stilo-code
/plugin install stilo-code@stilo-code
```

Instala as duas skills e os três hooks (`SessionStart`, `UserPromptSubmit`,
`SubagentStart`). É a instalação completa: o estado é injetado sozinho, inclusive logo
depois de um `/clear`.

### Codex

Mesmo pacote, mesmo manifesto de hooks. Aponte o Codex para o repositório clonado; o
`.codex-plugin/plugin.json` traz as skills e os hooks.

### OpenCode

```bash
git clone https://github.com/luizgdemarchi/stilo-code
```

No seu `opencode.json`:

```json
{ "plugin": ["/caminho/para/stilo-code/.opencode/plugins/stilo.mjs"] }
```

O plugin injeta o pipeline no system prompt de cada turno e registra `/stilo` e
`/stilo-off`.

### Gemini CLI / Antigravity

Clone o repositório e use o `gemini-extension.json`, que aponta o `AGENTS.md` como arquivo
de contexto. Os comandos vêm de `commands/stilo.toml` e `commands/stilo-off.toml`.

### Cursor, Windsurf, Cline, Kiro, Qoder

Copie o arquivo de regra do agente para o seu projeto:

| Agente | Arquivo |
|---|---|
| Cursor | `.cursor/rules/stilo.mdc` |
| Windsurf | `.windsurf/rules/stilo.md` |
| Cline | `.clinerules/stilo.md` |
| Kiro | `.kiro/steering/stilo.md` |
| Qoder | `.qoder/rules/stilo.md` |
| Qualquer outro | `AGENTS.md` na raiz |

Nesses agentes o pipeline funciona sem hooks: o ruleset está sempre no contexto e o próprio
agente lê e grava o `state.json`. O Qoder também aceita hooks — o template está em
`hooks/qoder-hooks.json`.

### Sem instalar nada

Cole o `AGENTS.md` no agente. Ele é autossuficiente de propósito: sozinho, conduz o
pipeline inteiro.

## Comandos

| Comando | Efeito |
|---|---|
| `/stilo` | Inicia um projeto novo ou retoma o ativo, reportando fase e próxima ação |
| `/stilo <nome>` | Cria a subpasta `<nome>/` e entra em `BRAINSTORM` |
| `/stilo enxuto off\|leve\|pleno\|auto` | Ajusta a compressão de saída |
| `/stilo-off` | Desliga globalmente até o próximo `/stilo` |

Não há comando de avanço de fase: quem avança é o agente, ao concluir uma fase.

## Modo Enxuto

Mesma informação técnica, menos token. É regra de estilo da saída — sem proxy, sem
runtime, sem interceptar nada, o que mantém o pacote portátil.

```
antes:  Perfeito, rodei os testes e fico feliz em informar que a grande maioria
        passou. Foram 47 testes no total, dos quais 46 passaram e apenas 1 falhou.
        O teste que falhou foi o `test_retry_backoff`, e a mensagem de erro
        completa foi: `AssertionError: expected 3 retries, got 2`.

depois: 46/47. `test_retry_backoff`: `AssertionError: expected 3 retries, got 2`.
```

Repare no que **não** mudou: os números, o nome do símbolo e a mensagem de erro literal.
Negações, números, versões, blocos de código e mensagens de erro são travas de segurança —
compressão nunca toca neles.

O nível sai da fase: `off` em `BRAINSTORM`, `leve` em `SPEC` e `PLAN`, `pleno` em
`EXECUTE`, `REVIEW` e `FIX`. `/stilo enxuto <nível>` sobrepõe e persiste.

## Companions

Nenhum é obrigatório. **O pipeline completa de ponta a ponta com zero companions
instalados** — cada fase traz as próprias instruções, e a detecção é silenciosa: sem erro,
sem aviso, sem pedir instalação.

| Companion | Onde ajuda |
|---|---|
| `superpowers` | `BRAINSTORM`, `PLAN`, `EXECUTE` |
| `ponytail` | `EXECUTE`, `FIX` — mantém o diff mínimo |
| `context7` (MCP) | `SPEC`, `PLAN` — docs atualizadas de biblioteca |
| `playwright` (MCP) | `EXECUTE`, `REVIEW` — verificar em navegador de verdade |

Só entram nessa lista pacotes que instalam em quase todo agente: servidor MCP, ou repo com
adaptadores multi-agente. Ferramenta presa a um único agente cria um pipeline que quebra ao
trocar de ferramenta — o problema que este pacote existe para resolver.

## Idioma

A fonte é toda em português. O ruleset instrui o agente a **responder no idioma em que
você escrever** — escreveu em inglês, resposta em inglês.

## Desenvolvimento

```bash
npm test          # node --test, zero dependências
npm run sync      # regenera os adaptadores a partir do AGENTS.md
node scripts/sync-adapters.js --check   # falha se algum adaptador divergir
```

`AGENTS.md` é a fonte única do ruleset. Os seis arquivos de regra por agente são gerados,
nunca editados à mão — um teste falha se saírem de sincronia.

## Licença

MIT © Luiz Gabriel De Marchi Nascimento
