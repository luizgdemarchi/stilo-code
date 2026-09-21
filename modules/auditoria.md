# Módulo: Auditoria opcional de simplificação

**Gatilho: carregue este módulo somente na fase `DONE`, depois de `REVIEW/FIX` sem achados `crítico` ou `alto`.**

A auditoria é consultiva e opcional. Ofereça-a ao usuário; seguir sem executá-la também
conclui o pipeline. Use `ponytail-audit` somente se ele já estiver disponível. Na ausência
do companion, aplique estas instruções manualmente, sem pedir instalação.

## Escopo e saída

- Revise o repositório inteiro, priorizando arquivos alterados no ciclo atual.
- Crie apenas `.stilo/cleanup-NN.md`; nunca sobrescreva um relatório anterior.
- Não crie comando, dependência ou analisador novo.
- Não remova, mova nem edite arquivos durante a auditoria.
- Não altere `.stilo/state.json`, reviews, checkpoints, ciclos ou evidências.

Cada sugestão deve conter:

1. arquivo e linha, quando identificáveis;
2. evidência concreta observada e limitações da análise;
3. risco;
4. remoção mínima proposta;
5. comando ou roteiro para validar a remoção;
6. classificação: `baixo risco`, `requer confirmação` ou `não recomendado`.

Referências dinâmicas, APIs públicas, manifestos, migrações, fixtures e arquivos de
histórico nunca são remoção automática: exigem confirmação humana e devem ser classificadas
como `requer confirmação` ou `não recomendado`. Se o usuário aceitar uma sugestão, pare a
auditoria e retorne a `FIX` → `REVIEW`; a auditoria não aplica a mudança.
