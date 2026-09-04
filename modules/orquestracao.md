Carregue somente nas fases `PLAN`, `EXECUTE` e `REVIEW`.

# Orquestração multiagente

Cada tarefa declara `ID`, descrição, especialista, `Files:` com caminhos exatos e `Depends-on:`.

Tarefas só compartilham uma onda quando não há dependência direta ou transitiva e os conjuntos de arquivos são totalmente disjuntos.

Marcação incerta ou não exata depende de todas as tarefas anteriores e roda em série.

Implementadores editam e reportam, mas não fazem commit.

Revisores não escrevem no código.

O coordenador espera todos, captura `HEAD` antes de cada commit, commita em ordem e só então libera a revisão.

Worktree isolada é último recurso quando a separação por arquivo não for possível.
