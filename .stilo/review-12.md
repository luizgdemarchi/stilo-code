# Review 12 — Stilo Code

Revisado: snapshot staged/unstaged/novos do checkout sobre
ff4e2163cd69ae825bf9016975aca5a606a523e9, sem commits novos.
Contra: spec.md §17 e docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md.
Revisão independente somente leitura; modelo solicitado gpt-6-astra/high, aplicação
não informada pelo retorno da ferramenta. Snapshot e baseline prévios registrados em
`.superpowers/sdd/2026-10-19-confiabilidade-agente-plan/`.

## Resumo

2 achados: 0 críticos, 0 altos, 2 médios, 0 baixos. Testes direcionados do revisor: 25/25.
Não declarar DONE: permanecem aceites vivos obrigatórios.

## Achados

### 1. Recursos verificados antes da serialização legada

- **Arquivo:** `scripts/validate-plan.js:281`
- **Gravidade:** médio
- **O que quebra:** tarefas A(db:teste), L(sem Resources), B(db:teste), com arquivos distintos,
  retornam inválidas embora as ondas finais sejam A, L, B, todas seriais.
- **Como corrigir:** validar recursos nas ondas efetivas; preservar colisões antigas de arquivos nas candidatas.
- **Evidência:** revisor executou validatePlan; erro de recurso compartilhado em onda candidata,
  com ondas finais individuais. Viola compatibilidade mista de T02/critério 40.
- **Confiança:** alta
- **Contraprova verificada:** barreira realmente serializa; dependência explícita evita a falha,
  mas não atende à compatibilidade prometida para o caso sem dependências.
- **Classificação:** confirmado
- **Origem:** introduzido
- **Estado:** corrigido em `scripts/validate-plan.js`, validação de recursos após barreiras;
  regressão de plano misto reproduziu a falha antes e passou após a correção.

### 2. Timeout não encerra a espera pelo subprocesso

- **Arquivo:** `scripts/setup-github-cli.js:17`
- **Gravidade:** médio
- **O que quebra:** após kill sem close, a promessa do executor permanece pendente,
  ultrapassando os limites de detecção/instalação documentados.
- **Como corrigir:** watchdog retorna timeout/stopped:false sem depender de close,
  libera handles do controlador e preserva lock; não alegar parada dos descendentes.
- **Evidência:** código real carregado com spawn sintético; timeout 20 ms, após 100 ms
  kill chamado uma vez e promessa ainda pendente. Só emitir close resolveu a promessa.
- **Confiança:** alta para falha de limite; ocorrência em instalador Unix não observada.
- **Contraprova verificada:** processo real Node com descendente passou neste Windows em
  ~274 ms, sem eliminar dependência de close no caminho em que término não é confirmado.
- **Classificação:** confirmado
- **Origem:** introduzido
- **Estado:** corrigido em `scripts/setup-github-cli.js`, watchdog retorna sem aguardar close,
  com stopped:false e lock preservado; regressão sintética reproduziu falha e passou após correção.

## Cobertura, contraprovas e exclusões

PATH Windows, lock/receipt, ausência de retry automático e caminho arbitrário no receipt
foram verificados sem novos achados. Hashes e checks da fixture não são apresentados como
isolamento de permissões. Regras de retomada separam estado, aprovação e evidência.
Nenhuma outra alegação foi descartada por estar fora de escopo; limites de observação
permanecem explicitados no relatório de avaliação. Nenhum teste textual comprova ação viva.

## Critérios 35–48

35, 39–44 e 48: verificação local; 40 precisa correção do achado 1.
36, 37, parte delegada de 38 e partes vivas de 45–47: pendentes.
45: detecção/reuso real de gh 2.102.0 comprovados, instalação ausente não observada.
46: achado 2 exige regressão do limite, além da prova viva ainda pendente.
Pendências anteriores preservadas na matriz 1–48, sem inferir aprovação.
