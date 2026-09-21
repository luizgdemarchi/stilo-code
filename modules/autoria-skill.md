# Módulo: Autoria de skill e plugin

**Gatilho: carregue este módulo só quando o projeto em si é uma skill ou um plugin de
agente**, nas fases `PLAN` ou `EXECUTE`. Um projeto que apenas usa skills nunca lê este
arquivo. O Stilo Code não publica skills nem comandos próprios; este módulo orienta
apenas projetos de terceiros que estejam sendo criados.

## Anatomia de um `SKILL.md`

```markdown
---
name: nome-em-kebab-case
description: Quando usar esta skill, com os gatilhos concretos.
---

# Título

Corpo: instruções, na ordem em que serão executadas.
```

Regras do frontmatter:

- `name` — kebab-case, igual ao nome da pasta que contém o arquivo.
- `description` — o campo mais importante do arquivo. É a única coisa que o agente lê
  antes de decidir carregar a skill; o corpo só entra em contexto depois.
- `argument-hint` (opcional) — formato de argumentos da skill, quando o agente oferecer
  essa superfície.

O corpo é carregado **inteiro** quando a skill dispara. Escreva para ser executado, não
para ser admirado: passos na ordem, formatos literais, exemplos de entrada e saída.

## Como escrever uma `description` que dispara na hora certa

Uma `description` é um classificador, não um resumo. Ela precisa responder **quando**
usar, não **o que** a skill é.

```
Ruim:  Uma skill poderosa para gerenciar projetos de software.
Bom:   Use ao iniciar um projeto novo, retomar um projeto parado, ou quando o
       usuário perguntar em que fase o projeto está. Dispara em "novo projeto",
       "stilo", "retomar", "em que fase estamos".
```

O que faz a diferença:

- **Gatilhos concretos, com as palavras que o usuário realmente digita** — inclusive
  sinônimos e a forma informal. Abstração (`para produtividade`, `melhora a qualidade`) não
  classifica nada.
- **Diga também quando NÃO usar**, se houver confusão provável com outra skill. Um limite
  explícito evita disparo em falso, que custa contexto e confunde o usuário.
- **Comece por "Use quando"**. Força a frase a ser sobre situação, não sobre a skill.
- **Uma skill, uma responsabilidade.** Se a `description` precisa de "e também", são duas
  skills.

Teste antes de publicar: escreva cinco pedidos que deveriam disparar a skill e três que
não deveriam. Se a `description` não separa os dois grupos lendo só ela, reescreva.

## Quando quebrar em módulos

Um `SKILL.md` que passa de umas duzentas linhas está pagando contexto em toda invocação,
inclusive nos casos que usam um décimo do arquivo.

Quebre quando: parte do conteúdo só vale para um subconjunto dos casos; existe uma
referência longa (tabela, formato de arquivo, lista de erros) consultada raramente; ou uma
seção é grande e independente do resto.

O módulo fica num arquivo ao lado, e o `SKILL.md` diz **em uma linha quando carregá-lo**.
Todo módulo começa declarando seu próprio gatilho na primeira linha — quem lê o módulo
solto precisa saber se ele se aplica.

O que **nunca** sai do arquivo principal: as regras que valem sempre, e a ordem dos passos.

## Adaptadores multi-agente

Uma skill que só instala em um agente prende o usuário a ele. Se o pacote é para ser
portátil, mantenha **uma fonte única de verdade** — normalmente o `AGENTS.md` da raiz — e
gere o resto por script, com uma flag de verificação que falha quando algo sai de sincronia.
Cópias manuais do mesmo texto divergem em uma semana.

| Agente | Arquivo |
|---|---|
| Claude Code | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/<nome>/SKILL.md` do projeto |
| Codex | `.codex-plugin/plugin.json`, `AGENTS.md` |
| OpenCode | `opencode.json`, `.opencode/plugins/*.mjs` |
| Gemini CLI | `gemini-extension.json` |
| Cursor | `.cursor/rules/*.mdc` (frontmatter com `alwaysApply`) |
| Windsurf | `.windsurf/rules/*.md` |
| Cline | `.clinerules/*.md` |
| Kiro | `.kiro/steering/*.md` |
| Qoder | `.qoder/rules/*.md` |
| Genérico | `AGENTS.md` na raiz |

`AGENTS.md` na raiz é o piso: qualquer agente que leia um arquivo de regra do projeto pega
esse. É também o que faz o pacote funcionar colado à mão, sem instalação nenhuma.

## Hooks

Hook é o que faz um pacote agir sem o usuário pedir. Três regras que valem em qualquer
agente:

1. **Best-effort sempre.** Qualquer falha sai com código 0 e stdout vazio. Um hook que
   quebra a sessão é pior do que um hook que não roda.
2. **Nunca bloqueie esperando stdin.** Quem lê stdin precisa de tratamento de erro e de um
   tempo limite curto que processa o que chegou e sai.
3. **O formato de saída difere por agente e por evento.** Descubra o formato lendo um
   pacote que já funciona naquele agente, em vez de inferir.
