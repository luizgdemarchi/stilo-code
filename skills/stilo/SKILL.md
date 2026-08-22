---
name: stilo
description: Use ao iniciar um projeto novo, ao retomar um projeto parado, ou quando o usuário quiser saber em que fase o projeto está. Dispara em "novo projeto", "stilo", "retomar", "em que fase estamos", "continuar de onde parei", "new project", "resume project". Também ajusta o Modo Enxuto com "/stilo enxuto <nível>". Não use para tarefas dentro de uma fase já em andamento — o pipeline já está no contexto.
argument-hint: "[nome-do-projeto | enxuto off|leve|pleno|auto]"
---

# /stilo

O ruleset completo está em `AGENTS.md`, na raiz deste pacote. Leia-o se ele ainda não
estiver no seu contexto: ele traz as sete fases, o que fazer em cada uma, os módulos e o
Modo Enxuto.

Esta skill faz três coisas, decididas pelo argumento e pelo estado em disco.

## 1. Sem argumento — retomar ou começar

Procure `.stilo/state.json` subindo a partir do diretório atual; se não achar, varra um
nível abaixo.

**Achou exatamente um:** leia e reporte, em uma linha:

```
projeto=<nome> · fase=<FASE> · próxima: <a próxima ação da fase>
```

Depois faça a próxima ação. Não recomece a fase do zero: leia primeiro os artefatos que
já existem (`spec.md`, `plan.md`, o último `.stilo/review-NN.md`).

**Achou mais de um:** liste todos os caminhos e pergunte qual é o desta conversa. Nunca
escolha por conta própria.

**Não achou nenhum:** é projeto novo. Vá para a seção 2.

## 2. Com um nome — projeto novo

```
/stilo meu-app
```

1. Crie a subpasta `meu-app/` no workspace (Regra 0 — uma pasta por projeto).
2. Crie `meu-app/.stilo/state.json`:

```json
{
  "version": 1,
  "project": "meu-app",
  "phase": "BRAINSTORM",
  "reviewRound": 0,
  "enxuto": "auto",
  "updated": "<agora, em ISO 8601 UTC>"
}
```

3. Entre em `BRAINSTORM` e comece a fazer perguntas: problema real, quem usa, restrições,
   critério de sucesso. Uma decisão por vez, sempre com uma recomendação.

**Não escreva código nesta fase.** Nem estrutura de pastas, nem `package.json`, nem
esqueleto "só para começar". Regra 1: nunca pular para a implementação.

Se o usuário não deu um nome, pergunte — o nome vira o nome da pasta.

## 3. `enxuto` — ajustar a compressão de saída

```
/stilo enxuto off | leve | pleno | auto
```

Grava o campo `enxuto` no `state.json` do projeto ativo. `auto` deriva o nível da fase;
qualquer outro valor sobrepõe a fase e persiste entre sessões. Detalhe em
`modules/enxuto.md`.

Quando os hooks do plugin estão ativos, esse comando já é gravado por eles antes de você
ver a mensagem — confirme o valor lendo o arquivo em vez de gravar de novo.

## Depois de agir

Confira em que modelo você está rodando contra o alvo da fase (`AGENTS.md` § 4) e avise
só se divergir — uma linha, sem insistir.

Se acabou de gravar um artefato durável, emita `✅ Ponto seguro para /clear`.
