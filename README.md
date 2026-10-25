# Stilo Code

**Um pipeline de projeto que continua de onde parou.** Stilo Code é um plugin para Claude
Code e Codex que mantém em disco a fase de cada projeto e orienta o agente a registrar as
decisões nos documentos do fluxo. Os hooks leem esse estado automaticamente, para que o
agente retome o trabalho mesmo depois de uma nova sessão ou de limpar o contexto com
`/clear`.

*[English](README.en.md)*

## O que o Stilo Code faz

O Stilo conduz o trabalho por etapas: entender o pedido antes de propor, registrar o que
deve ser feito, planejar como, executar, revisar a implementação e corrigir os achados.
Depois, uma fase editorial separada percorre todo o texto mantido no repositório, aponta
padrões no contexto e registra correções mínimas; ela preserva a voz e não tenta inferir
se o texto foi escrito por IA. O agente aplica as correções e repete a revisão editorial.

```text
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → EDITORIAL_REVIEW ⇄ EDITORIAL_FIX → DONE
```

Cada projeto tem um arquivo `.stilo/state.json` com a fase atual e contadores separados para
as revisões técnica e editorial. Quando existem, os documentos de spec, plano, review,
revisão editorial e checkpoint guardam decisões e evidências. Ao retomar, o agente confere
esse estado e os arquivos do projeto antes de continuar. O contexto da conversa não é a
única fonte de continuidade.

## Como funciona

Os hooks do plugin identificam o projeto e injetam as instruções e o estado nas sessões,
mensagens e subagentes. O agente segue o pipeline e registra as transições de fase nos
arquivos do projeto. Mensagens que começam com `/` passam pelo mesmo caminho; o Stilo não
interpreta prompts como comandos que alteram arquivos.

O ruleset completo está em [`AGENTS.md`](AGENTS.md). Não há comandos públicos ou skills
invocáveis do Stilo: depois da instalação, a injeção é automática.

## Hosts suportados

- **Claude Code:** instala os hooks `SessionStart`, `UserPromptSubmit` e `SubagentStart`.
- **Codex:** usa o manifesto `.codex-plugin/plugin.json` e os mesmos hooks compartilhados.

O Stilo Code dá suporte a esses dois hosts.

## Instalação

### Claude Code

```text
/plugin marketplace add luizgdemarchi/stilo-code
/plugin install stilo-code@stilo-code
```

### Codex

Clone este repositório e aponte o Codex para ele. O manifesto de hooks está em
`.codex-plugin/plugin.json`.

## Detalhes e desenvolvimento

- [Retomada e preparação do GitHub CLI](docs/preparacao-github-cli.md)
- [Avaliações de agentes](docs/avaliacao-agente.md)
- [Critérios de aceite](docs/aceite.md)

Companions como `superpowers`, `ponytail`, `context7` e `playwright` são opcionais. O
pipeline funciona sem eles. `AGENTS.md` é a fonte das regras; os módulos em `modules/`
detalham as fases que precisam de instruções específicas.

Para desenvolvimento local, `npm test` executa os testes do projeto. A cópia instalada do
plugin é separada deste checkout; alterações locais só chegam ao host após uma instalação
ou atualização autorizada.

## Licença

MIT © Luiz Gabriel De Marchi Nascimento
