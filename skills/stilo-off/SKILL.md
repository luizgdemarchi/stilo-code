---
name: stilo-off
description: Use quando o usuário quiser desligar o pipeline do Stilo Code. Dispara em "/stilo-off", "desliga o stilo", "para de injetar o pipeline", "stilo off", "turn stilo off". Não use para trocar o Modo Enxuto — isso é "/stilo enxuto <nível>".
---

# /stilo-off

Desliga o Stilo Code globalmente, em todos os projetos.

1. Crie o arquivo-flag vazio `~/.stilo/off` (no Windows, `%USERPROFILE%\.stilo\off`),
   criando o diretório se preciso.
2. Confirme em uma linha: `Stilo Code desligado — /stilo religa.`

Os hooks param de injetar o pipeline enquanto o arquivo existir. Nenhum `state.json` é
apagado nem alterado: o projeto continua exatamente na fase em que estava.

`/stilo` apaga o flag e religa.
