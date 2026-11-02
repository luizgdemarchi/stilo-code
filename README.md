# Stilo Code

**Um pipeline de projeto que continua de onde parou.** Stilo Code é um plugin para Claude
Code e Codex que mantém em disco a fase de cada projeto e orienta o agente a registrar as
decisões nos documentos do fluxo. Os hooks leem esse estado automaticamente, para que o
agente retome o trabalho mesmo depois de uma nova sessão ou de limpar o contexto com
`/clear`.

*[English](README.en.md)*

## O que o Stilo Code faz

O Stilo conduz o trabalho por etapas: entender o pedido antes de propor, registrar o que
deve ser feito, planejar como, executar com testes primeiro, revisar a implementação e
corrigir os achados. Depois, uma fase editorial separada revisa o texto alterado no ciclo,
aponta padrões no contexto e registra correções mínimas; ela preserva a voz e não tenta
inferir se o texto foi escrito por IA. No fim, o agente oferece integrar, abrir PR, manter a
branch ou descartar, e não faz nada disso sem a sua escolha.

```text
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → EDITORIAL_REVIEW ⇄ EDITORIAL_FIX → DONE
```

Cada projeto tem um arquivo `.stilo/state.json` com a fase atual, o ciclo ativo e contadores
separados para as revisões técnica e editorial. Cada pedido é um ciclo, com seus documentos
em `docs/ciclos/<ciclo>/`: `spec.md` e `plan.md`, mais `design.md` quando há interface no
escopo. Uma mudança pequena (até 3 arquivos, sem dependência nova, sem tocar em segurança,
dados persistidos ou contrato público) pode seguir a trilha curta, com um único `ciclo.md`
aprovado uma vez; nenhuma fase é pulada. Ao retomar, o agente confere o estado e os arquivos
do projeto antes de continuar. O contexto da conversa não é a única fonte de continuidade.

## Como funciona

Os hooks do plugin identificam o projeto e injetam o núcleo das regras, o estado e os
módulos da fase atual no início da sessão. Quando a fase muda no meio da sessão, a próxima
mensagem traz os módulos da fase nova; o registro de qual fase já foi injetada fica no
diretório de dados do plugin, fora do projeto. Subagentes recebem um contexto reduzido, com
o papel deles e o essencial da fase. Mensagens que começam com `/` passam pelo mesmo
caminho; o Stilo não interpreta prompts como comandos que alteram arquivos.

O núcleo está em [`AGENTS.md`](AGENTS.md), e as instruções de cada fase em `modules/`. Não
há comandos públicos ou skills invocáveis do Stilo: depois da instalação, a injeção é
automática.

## Medir o consumo de tokens

```text
node scripts/medir-tokens.js <transcript.jsonl|pasta> [--json]
```

O script lê transcripts do Claude Code e sessões do Codex e informa o número de chamadas
ao modelo, os tokens de entrada, de cache e de saída, e o tamanho da saída de cada
ferramenta. Use o mesmo pedido antes e depois de uma mudança para comparar.

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

Companions como `ponytail`, `context7` e `playwright` são opcionais. O pipeline funciona
sem eles.

Para desenvolvimento local, `npm test` executa os testes do projeto. A cópia instalada do
plugin é separada deste checkout; alterações locais só chegam ao host após uma instalação
ou atualização autorizada.

Os hosts guardam o plugin em cache pela versão. Quem contribui e muda um arquivo
distribuído (`AGENTS.md`, `modules/`, `hooks/`, `scripts/`, manifestos) sobe a versão nos
três manifestos (`package.json`, `.claude-plugin/plugin.json` e `.codex-plugin/plugin.json`),
registra a publicação com `node scripts/verificar-publicacao.js --registrar` e confere com
`npm run verificar-publicacao`. A verificação falha quando o conteúdo mudou e a versão não.

## Licença

MIT © Luiz Gabriel De Marchi Nascimento

Partes das instruções foram adaptadas do plugin superpowers, de Jesse Vincent (MIT), e de
uma skill de design de interface da Anthropic (Apache-2.0). Os avisos e as licenças estão
em [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
