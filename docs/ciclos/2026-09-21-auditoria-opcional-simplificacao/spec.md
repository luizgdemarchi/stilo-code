# Auditoria opcional de simplificação — Stilo Code

## Contexto

O pipeline já termina com `REVIEW` e `FIX`, mas um review de corretude não tem como
objetivo principal procurar código que pode ser removido. O pedido é oferecer uma última
passagem consultiva, sem apagar nada automaticamente.

## Decisão

Na transição para `DONE`, depois de um `REVIEW/FIX` limpo, o agente oferece uma auditoria
opcional, sem criar uma nova fase obrigatória. O usuário pode executá-la ou seguir sem
relatório. A auditoria usa o `ponytail-audit` quando disponível; sem o companion, as
mesmas instruções são executadas manualmente pelo agente.

O padrão é revisar o repositório inteiro, priorizando arquivos tocados no ciclo atual. O
resultado é `.stilo/cleanup-NN.md`, preservando relatórios anteriores. O relatório apenas
recomenda: não edita, remove, move nem bloqueia o pipeline.

## Contrato do relatório

Cada item deve conter:

- arquivo e linha, quando identificáveis;
- evidência concreta de que o item parece não ser usado;
- risco e limitações da análise;
- remoção mínima sugerida;
- comando ou roteiro para validar a remoção;
- classificação: `baixo risco`, `requer confirmação` ou `não recomendado`.

Referências dinâmicas, APIs públicas, manifestos, migrações, fixtures e histórico são
sempre tratados como áreas que exigem confirmação humana. Uma sugestão aceita não é
aplicada pela auditoria: retorna ao fluxo normal `FIX → REVIEW`.

## Escopo excluído

Não haverá novo comando, dependência, analisador estático próprio, limpeza automática,
alteração de `state.json` ou bloqueio de `DONE`. A ausência do Ponytail deve continuar
sendo uma degradação silenciosa.

## Validação

O ciclo deve testar a presença e a ausência do companion, o formato do relatório, a
preservação do histórico e a proteção contra remoção automática ou falsa segurança em
referências dinâmicas.
