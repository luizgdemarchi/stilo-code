# Seleção de modelo e esforço — Plano de implementação

> **Para agentes:** usar `superpowers:executing-plans` para implementar tarefa por tarefa, com revisão independente ao final. Os itens abaixo são verificáveis individualmente.

**Objetivo:** orientar a escolha automática e rastreável de modelo e esforço por tarefa, respeitando capacidades disponíveis e escolhas do usuário.

**Arquitetura:** política normativa em `modules/orquestracao.md`, resumo em `AGENTS.md` e distribuição pelos seis adaptadores existentes. O contexto protege todos os blocos dos módulos da fase; T02 inclui `orquestracao.md` nesses módulos em `PLAN`, `EXECUTE`, `REVIEW` e `FIX` (FIX por emenda após review-16), sem alterar assinaturas nem algoritmo; os orçamentos sobem por decisão do usuário (ver Restrições). Não haverá roteador executável nem catálogo fixo de provedores.

**Tecnologia:** Markdown, CommonJS e `node:test`, sem dependências novas.

**Spec:** `spec.md` § 16, critérios 28–34. O pedido de seguir ao plano aprova esta especificação. As emendas anteriores permanecem históricas.

## Restrições e decisões

- Avaliar complexidade, risco, ambiguidade, contexto e verificabilidade; fase não é classificação suficiente.
- Modelo e esforço são decisões separadas, restritas às combinações suportadas pela ferramenta.
- Escolhas explícitas do usuário prevalecem. Para este ciclo: `gpt-5.6-sol` / `medium` na execução; `gpt-5.6-sol` / `xhigh` em revisão e correção, quando selecionáveis. Esses nomes não entram na política portátil do produto.
- Não trocar a sessão principal, adicionar dependências, comandos, configurações públicas ou chamadas externas.
- Falha de ambiente não provoca escalada. Após uma escalada sem sucesso, o coordenador reassume e registra o impedimento.
- Sem subagentes, executar em série; sem controle de modelo ou esforço, registrar a limitação sem alegar troca.
- Implementadores não fazem commit; coordenador captura `HEAD` e serializa commits locais, sem push, instalação ou publicação.
- Preservar spec, reviews 01–11 e pendências vivas anteriores. Próximo review: 12, salvo avanço concorrente comprovado. Avanço comprovado na integração: o ciclo remoto de 2026-10-19 gravou review-12 a review-15; este ciclo usa review-16 e review-17.
- Orçamentos (decisão do usuário, 2026-10-24): `CONTEXT_BUDGET` 16.000 → 17.000 e orçamento nominal monitorado 22.000 → 26.000. Motivo: com a política, REVIEW tem 25.596 caracteres completos e 16.648 protegidos; nenhuma redundância pura cobre a diferença.
- Emenda após review-16 (decisão do usuário, 2026-10-24): `CONTEXT_BUDGET` 17.000 → 19.500, `## 3. Estado em disco` e `## 5. Módulos` de `AGENTS.md` passam a blocos protegidos, e `orquestracao.md` também é carregado em `FIX`. Motivo: com 17.000 a compactação descartava § 3/§ 5 e um checkpoint no limite forçava o fallback em REVIEW.
- Execução serial: as tarefas dependem da política e da sua distribuição; não há ganho em implementar arquivos compartilhados em paralelo.

## Foco da revisão

1. Alteração de uma linha em permissões: risco impede classificação mecânica (T01).
2. Modelo solicitado indisponível ou esforço sem controle: limitação explícita, nunca substituição alegada como aplicada (T01).
3. Falha de ambiente confundida com incapacidade: diagnosticar antes de escalar (T01).
4. Contexto excedendo orçamento: preservar política inteira ou usar fallback completo (T02).
5. Teste textual confundido com execução real: evidências separadas e aceite vivo pendente quando não observado (T03).

### Tarefa T01: Política e contrato rastreável

ID: T01
Especialista: instruções de orquestração e testes de contrato
Files:
- Modify: `AGENTS.md`
- Modify: `modules/orquestracao.md`
- Modify: `tests/orchestration.test.js`
Depends-on: nenhum

**Classificação:** lógica relevante, risco de delegação inadequada; modelo/esforço solicitados conforme restrição explícita do ciclo. Registrar aplicação somente se confirmada pela ferramenta.

**Interface:** manter `ID`, `Especialista`, `Files:` e `Depends-on:`. Acrescentar campos descritivos sem alterar o parser do plano: `Classificação`, `Modelo solicitado`, `Esforço solicitado`, `Justificativa`, `Aplicação confirmada`, `Validação` e `Escalada`.

- [ ] Acrescentar testes ao arquivo existente, inicialmente falhando, para as cláusulas do novo contrato. Exemplo de teste, usando `le()` já existente:

```js
test('seleção registra pedido e confirmação separadamente', () => {
  const texto = le('modules/orquestracao.md');
  for (const campo of ['Classificação:', 'Modelo solicitado:', 'Esforço solicitado:',
    'Justificativa:', 'Aplicação confirmada:', 'Validação:', 'Escalada:']) {
    assert.ok(texto.includes(campo), campo);
  }
  assert.match(texto, /escolhas explícitas do usuário prevalecem/i);
  assert.match(texto, /falha de ambiente não provoca escalada/i);
});
```

- [ ] Rodar `node --test tests/orchestration.test.js`; confirmar falha das cláusulas novas, sem alterar expectativas antigas.
- [ ] Escrever no módulo uma sequência operacional: verificar capacidades expostas; classificar; aplicar preferência explícita; escolher combinação suportada; registrar; delegar apenas tarefa delimitada; validar; diagnosticar falha; escalar uma vez por capacidade; reassumir se falhar novamente.
- [ ] Incluir três orientações: trabalho mecânico verificável usa menor modelo adequado e esforço baixo; lógica comum usa esforço médio; arquitetura, segurança e incerteza alta usam capacidade maior e esforço alto suportado. Não equiparar tamanho a risco.
- [ ] Incluir exemplo de contrato com os oito campos acima; `Aplicação confirmada: não informada pela ferramenta` deve ser uma saída válida. Falta de modelo solicitado exige relato explícito, sem inventar equivalência.
- [ ] Acrescentar cenários comentados e testes textuais para edição mecânica, lógica comum, arquitetura, permissões, preferência explícita, ausência de subagentes, ausência de controle de modelo, ausência de controle de esforço, falha de capacidade e falha de ambiente. Os testes verificam instruções, não executam um classificador fictício.
- [ ] Em `AGENTS.md` § 4, distinguir modelo alvo da sessão e seleção por tarefa; remeter ao módulo nas fases PLAN/EXECUTE/REVIEW/FIX (FIX por emenda após review-16), sem remover a tabela ou as regras atuais de ondas.
- [ ] Rodar novamente o teste direcionado. Verificar também que permanecem separação de arquivos, espera de implementadores e commits pelo coordenador.

### Tarefa T02: Contexto automático e adaptadores

ID: T02
Especialista: integração e regressão de contexto
Files:
- Modify: `hooks/stilo-instructions.js`
- Modify: `tests/context.test.js`
- Modify: `tests/instructions.test.js`
- Modify: `tests/all.test.js`
- Modify: `.cursor/rules/stilo.mdc`
- Modify: `.kiro/steering/stilo.md`
- Modify: `.clinerules/stilo.md`
- Modify: `.windsurf/rules/stilo.md`
- Modify: `.qoder/rules/stilo.md`
- Modify: `.agents/rules/stilo.md`
Depends-on: T01

**Classificação:** integração com risco de perda de instruções; seleção solicitada conforme restrição do ciclo.

**Interface:** consumir `buildFullContext(state, caminhos)` e `buildInjectedContext(state, caminhos)` existentes. Incluir `orquestracao.md` em `modulosDaFase()` para `PLAN`, `EXECUTE`, `REVIEW` e `FIX` (FIX por emenda após review-16), ajustando as expectativas do teste unitário. Elevar `CONTEXT_BUDGET` para 19.500 (17.000 antes da emenda), proteger `## 3. Estado em disco` e `## 5. Módulos` e o limite do teste `contexto nominal por fase respeita o orçamento` para 26.000. Não alterar assinaturas nem algoritmo de seleção.

- [ ] Incluir o teste abaixo em `tests/context.test.js`:

```js
for (const phase of ['PLAN', 'EXECUTE', 'REVIEW']) {
  test(`política integral no contexto de ${phase}`, () => {
    const state = { version: 1, project: 'x', phase, reviewRound: 11 };
    const modulo = fs.readFileSync(path.join(__dirname, '../modules/orquestracao.md'), 'utf8');
    for (const build of [buildFullContext, buildInjectedContext]) {
      const contexto = build(state);
      const blocos = modulo.split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/)
        .map(s => s.trim()).filter(Boolean);
      for (const bloco of blocos) assert.ok(contexto.includes(bloco), phase);
    }
  });
}
```

- [ ] Adicionar cenário com raiz temporária usando o padrão de `CLAUDE_PLUGIN_ROOT` já existente: copiar ruleset/módulos necessários, acrescentar ao módulo protegido um bloco maior que 17.000 caracteres e exigir igualdade byte a byte entre contexto injetado e completo. Restaurar variável em `finally`.
- [ ] Acrescentar `require('./context.test.js');` a `tests/all.test.js`, que hoje não inclui essa suíte. Não duplicar importações nem criar arquivo agregador novo.
- [ ] Rodar `node --test tests/context.test.js tests/instructions.test.js`. O contexto nominal deve continuar menor que o completo; se a política impedir isso, reduzir redundância normativa sem remover requisitos. Se exigir redesenho de runtime, retornar a PLAN.
- [ ] Executar `node scripts/sync-adapters.js`, sem editar saídas geradas à mão. A escrita em `.agents` pode exigir aprovação do sandbox; usar a solicitação da ferramenta se necessário.
- [ ] Verificar `node scripts/sync-adapters.js --check` e `node --test tests/orchestration.test.js tests/context.test.js tests/instructions.test.js`.

### Tarefa T03: Documentação e evidências

ID: T03
Especialista: documentação e critérios de aceite
Files:
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/aceite.md`
- Modify: `hooks/stilo-diagnostics.js`
- Modify: `tests/diagnostics.test.js`
Depends-on: T02

**Classificação:** documentação verificável; seleção solicitada conforme restrição do ciclo.

**Interface:** matriz de critérios 28–34 vinculada às evidências locais e a uma observação viva separada.

- [ ] Documentar seleção por tarefa, respeito à preferência explícita, fallback e escalada limitada nos dois READMEs. Não prometer custo, latência ou troca automática da sessão.
- [ ] Atualizar nos dois READMEs o parágrafo do orçamento nominal para 26.000 caracteres, sem prometer redução de custo.
- [ ] Adicionar à matriz: 28–32 cobertos pelo contrato e cenários de T01; 33 pelos adaptadores/contexto de T02; 34 pelos testes existentes de orquestração/plano e suíte completa.
- [ ] Registrar cenário vivo reproduzível: delegar uma tarefa real delimitada; anotar capacidades expostas, pedido de modelo/esforço, confirmação retornada e resultado da validação. Só marcar comprovado com essa evidência; ausência de confirmação permanece pendente. Não criar subagente fictício apenas para declarar aceite.
- [ ] Preservar critérios antigos pendentes e separar `contrato verificado localmente` de `seleção efetiva observada`. Vincular o review novo somente após ele existir.
- [ ] Rodar `npm.cmd test`, `node scripts/sync-adapters.js --check` e `git diff --check`. Registrar passados, pulados e falhas com a evidência atual, sem reutilizar contagens do review-11.

### Tarefa T04: Revisão independente e encerramento

ID: T04
Especialista: revisor independente e coordenador
Files:
- Create: `.stilo/review-16.md`
- Modify: `.stilo/state.json`
Depends-on: T03

**Classificação:** revisão crítica; solicitar `gpt-5.6-sol` / `xhigh` conforme usuário; registrar limitação se indisponível.

- [ ] Aguardar todos os implementadores, capturar `HEAD` e revisar diff acumulado contra spec § 16 e este plano; carregar `modules/revisor.md` e `modules/orquestracao.md`.
- [ ] Usar o fluxo de pedido de revisão do companion `superpowers`, se disponível; revisor independente relata, coordenador grava achados com arquivo, linha, gravidade, cenário e correção no review 16. Se `reviewRound` avançou, usar o próximo número sem sobrescrever histórico.
- [ ] Resolver achados em FIX e produzir novos reviews sequenciais até zero erros; a lista exata de arquivos das correções vem dos achados, não autoriza expansão de escopo.
- [ ] Reexecutar os testes afetados pelas correções e as verificações finais quando pertinentes. Não declarar aceite vivo com base em regex ou testes locais.
- [ ] Atualizar estado e rodada com UTC real. Encerrar somente com review limpo, relatando pendências vivas; oferecer auditoria opcional conforme pipeline. Não executar auditoria nem publicação por implicação.

## Ondas e cobertura

Ondas seriais: T01 → T02 → T03 → T04. Os arquivos gerados pertencem apenas a T02. Commits, se realizados, são locais, seletivos e na ordem das tarefas; preservar alterações anteriores de `spec.md` e estado.

Critérios 28, 29, 30, 31, 32: T01 + evidência de T03. Critério 33: T02. Critério 34: T01/T02/T03 e revisão T04. Requisitos 1–7 da spec: T01; requisito 8: T01/T04; requisito 9: T02.

## Validação do plano e retomada

```powershell
node scripts/validate-plan.js docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md
git diff --check
```

Resultado esperado: quatro tarefas válidas, quatro ondas, nenhum erro de whitespace. Estado ao entregar: PLAN, reviewRound 11 preservado. Próxima ação: executar T01 após o usuário revisar este plano; nenhum código de implementação foi alterado nesta etapa.
