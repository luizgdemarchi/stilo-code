<!-- Aprovação: usuário confirmou spec e plano em 2026-10-19. Status históricos abaixo não revogam esta aprovação. Execução serial sem commits/publicação. -->

# Confiabilidade do agente e GitHub CLI — Plano de implementação

> **Para agentes:** usar `superpowers:executing-plans` para executar tarefa por tarefa.
> Status: spec e plano aprovados pelo usuário em 2026-10-19; implementação local verificada.
> Relatório de avaliação registra aceites vivos pendentes; sem commits nem publicação.

**Objetivo:** entregar as cinco melhorias de confiabilidade e a preparação automática do `gh`.

**Arquitetura:** aproveitar estado, checkpoints, hooks e validador existentes. Adicionar
recursos ao contrato das ondas, módulos condicionais para avaliação/evolução e fixture
local com avaliador independente. Um preparador idempotente do GitHub CLI roda fora dos
hooks; a primeira ativação encaminha sua execução pelo agente quando necessário.

**Tecnologia:** Markdown, CommonJS, `node:test` e bibliotecas nativas; Node.js >=20.

**Spec:** `docs/superpowers/specs/2026-10-19-confiabilidade-agente-design.md`, vinculada em `spec.md` § 17.

## Restrições globais

- Manter zero dependências npm novas e Node.js >=20.
- Preservar schema version 1, sete fases, reviews 01–11, mudanças locais e pendências anteriores.
- Não substituir a política de modelo/esforço do ciclo de 2026-10-01.
- Não criar comando `/stilo`, skill pública, scheduler, instalação de companions ou nova API.
- Instalar somente `gh` no preparo solicitado; login, tokens, Git, push e publicação ficam fora.
- Nunca instalar em hooks de 5 segundos, em testes unitários ou durante o planejamento.
- Execução recomendada: coordenador em série; ondas indicam possibilidade, não exigem subagentes.
- Se houver delegação autorizada, implementadores só editam/reportam; coordenador integra e revisa.
- Não fazer commits neste ciclo sem nova autorização. Se autorizados, coordenador captura HEAD
  antes de cada commit e inclui somente os trechos pertencentes à tarefa, na ordem do plano.
- Registrar modelo e esforço solicitados separadamente do que a ferramenta confirmar.
  Não transportar a escolha nominal de modelos do ciclo anterior como autorização deste ciclo.
- Revisão/correção permanece no fluxo REVIEW ⇄ FIX. Só concluir DONE com os aceites obrigatórios.

## Base e sequência

HEAD observado: `ff4e2163cd69ae825bf9016975aca5a606a523e9`. Há mudanças locais prévias em
`AGENTS.md`, `modules/orquestracao.md`, `tests/orchestration.test.js`, spec, plano e estado.
Reinventariar no início; não restaurar arquivos para obter base limpa.

O ciclo anterior concluiu T01 e parou antes da integração de T02. `modulosDaFase()` ainda
não inclui orquestração, e `tests/all.test.js` ainda não inclui contexto. T01 abaixo cobre
essas duas integrações como pré-requisito das novas regras. Os demais requisitos antigos
continuam válidos; não declarar o ciclo anterior encerrado por essa incorporação.

## Arquivos e responsabilidades

- `AGENTS.md`: regras essenciais de retomada, recursos e preparação; gatilhos dos módulos.
- `hooks/stilo-instructions.js`: composição/proteção do contexto, mantendo assinaturas existentes.
- `scripts/validate-plan.js`: parser e validação de recursos; não despacha agentes.
- `modules/revisor.md`: evidência e contraprova, mantendo histórico compatível.
- `modules/avaliacao.md`: protocolo dos cenários descartáveis e observações independentes.
- `modules/melhoria-instrucoes.md`: comparação de uma candidata com a instrução original.
- `scripts/evaluate-harness.js`: avaliador determinístico de fixture própria.
- `scripts/setup-github-cli.js`: detecção/instalação idempotente, verificável e testável por injeção.
- `hooks/stilo-setup.js`: detecção rápida e construção da nota de preparação; não instala.
- `docs/avaliacao-agente.md`: roteiros reproduzíveis, limites e classificação das provas.
- `docs/preparacao-github-cli.md`: métodos, limites, reinício de PATH e autenticação posterior.
- `docs/aceite.md` e `hooks/stilo-diagnostics.js`: mesma matriz de critérios 1–48.

## Foco da revisão

1. Checkpoint mais recente contradiz estado/spec; data sozinha não autoriza avanço — T01/T09.
2. Arquivos distintos disputam a mesma porta ou um diretório pai — T02.
3. O agente modifica a fixture de revisão ou seu avaliador para obter aprovação — T04/T09.
4. WinGet termina com sucesso, mas o PATH da sessão ainda não encontra gh — T06/T09.
5. Preparação é iniciada por dois agentes ou reaplicada após falha — T06/T07.

### Tarefa T01 — Retomada e distribuição da política existente

ID: T01
Especialista: estado, instruções e integração de contexto
Files:
- Modify: `AGENTS.md`
- Modify: `modules/orquestracao.md`
- Modify: `hooks/stilo-instructions.js`
- Modify: `tests/context.test.js`
- Modify: `tests/instructions.test.js`
- Modify: `tests/all.test.js`
- Create: `tests/reliability-contract.test.js`
Depends-on: nenhum
Resources: nenhum

**Capacidade:** risco alto de retomada incorreta; capacidade profunda e esforço alto suportado.
**Interfaces:** manter `buildFullContext(state, caminhos)`, `buildInjectedContext(state, caminhos)`
e `modulosDaFase(state)`. A retomada verifica Git/processos pelo agente, não por subprocessos nos hooks.

- [ ] Inventariar estado/ciclo/checkout e capturar o diff prévio; identificar quais trechos já
  pertencem à política anterior. Preservar aprovações, arquivos e pendências.
- [ ] Criar casos em `reliability-contract.test.js`: estado válido não comprova aprovação;
  resumo não comprova teste; checkpoint ausente não reinicia; sem Git registra limitação;
  escritor ativo impede assumir seus arquivos. Asserções verificam cláusulas, não comportamento vivo.
- [ ] Incluir em `AGENTS.md` uma seção curta `Retomada verificável`, com comparação de fontes,
  preservação de mudanças, reconciliação explícita e limite de autoridade de conteúdo externo.
  Em orquestração, acrescentar recuperação de escritor interrompido e continuação independente.
- [ ] Incluir orquestração em PLAN/EXECUTE/REVIEW no carregador, conforme T02 do plano anterior.
  Proteger o bloco `Retomada verificável` na compactação sem alterar orçamento/assinaturas.
- [ ] Incluir contexto no agregador se ausente. Testar política integral nas três fases,
  checkpoint contraditório na instrução de retomada, fonte ausente e fallback byte a byte
  quando blocos obrigatórios excederem 16.000 caracteres. Atualizar expectativa nominal do
  teste de compactação: exigir redução somente quando os blocos obrigatórios couberem.
- [ ] Verificar `node --test tests/reliability-contract.test.js tests/context.test.js tests/instructions.test.js`.
  Entrega: cláusulas presentes, política protegida e regressões existentes preservadas.

### Tarefa T02 — Recursos no contrato e no validador de ondas

ID: T02
Especialista: parser, dependências e concorrência
Files:
- Modify: `AGENTS.md`
- Modify: `modules/orquestracao.md`
- Modify: `scripts/validate-plan.js`
- Modify: `tests/validate-plan.test.js`
- Modify: `tests/orchestration.test.js`
Depends-on: T01
Resources: nenhum

**Capacidade:** lógica comum, esforço médio suportado; revisão atenta a concorrência.
**Interfaces:** preservar `parsePlan(text)`, `validatePlan(text)` e `main(argv)`.
Acrescentar `resources: string[]`, `resourcesDeclared: boolean` às tarefas e `warnings: string[]`
ao resultado. `valid`, `errors`, `waves` e códigos CLI 0/1/2 mantêm seu significado.

**Sintaxe:** `Resources: nenhum` ou linha com identificadores separados por vírgula, após
`Depends-on`. Tipos aceitos: `port:host:numero`, `db:nome`, `dir:caminho`, `profile:nome`.
Todos representam acesso exclusivo. Exemplo: `Resources: port:127.0.0.1:4173, db:stilo-testes`.
Identificadores são literais; caminhos de diretório relativos à raiz do projeto são
normalizados lexicalmente, com barras consistentes e comparação conservadora sem caixa.
Diretório igual, pai ou filho conflita. Não consultar rede ou resolver symlinks no parser.

- [ ] Estender o helper `tarefa()` dos testes com `resources = 'nenhum'`, mais um caso
  legado que omite a linha; preservar cobertura de arquivos e dependências anterior.
- [ ] Adicionar casos: recursos distintos passam; mesma porta/DB/perfil falha na mesma onda;
  recurso compartilhado com dependência passa em ondas separadas; diretórios pai/filho
  conflitam; tipo desconhecido, vazio, wildcard e mistura de `nenhum` com recurso são erros.
  Porta com bind curinga conflita conservadoramente com qualquer host na mesma porta;
  aliases de loopback são tratados como o mesmo host.
- [ ] Ler a nova linha sem confundi-la com `Files`. Legado sem linha produz aviso e barreira:
  tarefa roda sozinha, depois das anteriores e antes das seguintes, respeitando topologia.
  Se dependência futura impedir essa ordem, retornar erro explicando a ambiguidade; não criar ciclo silencioso.
- [ ] Manter a regra atual de rejeitar colisões na mesma onda; não criar scheduler nem
  alterar silenciosamente o plano para esconder colisões. No legado, conferir colisões de
  arquivo pelo agrupamento candidato anterior à barreira para não mascarar erro já detectado.
- [ ] Documentar `Resources` e posse única dos recursos. Recursos não declarados ou
  identidade real incerta exigem revisão conservadora antes de delegar, inclusive aliases/symlinks.
- [ ] Verificar `node --test tests/validate-plan.test.js tests/orchestration.test.js` e
  validar este plano. Esperado: dez tarefas, seis ondas, nenhuma colisão declarada.

### Tarefa T03 — Evidência e contraprova nos reviews

ID: T03
Especialista: revisão e qualidade de achados
Files:
- Modify: `modules/revisor.md`
- Create: `tests/reviewer-contract.test.js`
Depends-on: T01
Resources: nenhum

**Capacidade:** julgamento crítico, capacidade profunda e esforço alto suportado.
**Interfaces:** manter `Arquivo`, `Gravidade`, `O que quebra`, `Como corrigir`, `Estado`;
adicionar `Evidência`, `Confiança: alta|média|baixa`, `Contraprova verificada` e
`Classificação: confirmado|hipótese|sugestão`. Hipótese não conta como bug confirmado.

- [ ] Testar o contrato com três exemplos: bug confirmado; suspeita sem reprodução; controle
  em chamador que refuta a suspeita. Exigir declaração honesta quando uma prova não foi executada.
- [ ] Registrar no cabeçalho alvo por commits ou snapshot das camadas staged/unstaged/novas,
  cobertura e exclusões. Nos achados, distinguir introduzido/preexistente/indeterminado.
- [ ] Remover a presunção de que primeira rodada sem achados significa revisão rasa.
  Preservar a exigência de critério de aceite, cenário concreto, gravidades e histórico.
- [ ] Orientar revisão conectada aos chamadores e a controles que possam refutar o achado;
  manter revisores sem escrita no código e não migrar reviews antigos.
- [ ] Verificar `node --test tests/reviewer-contract.test.js tests/orchestration.test.js`.

### Tarefa T04 — Fixture própria e avaliação independente

ID: T04
Especialista: avaliação de agentes e isolamento de testes
Files:
- Create: `modules/avaliacao.md`
- Create: `docs/avaliacao-agente.md`
- Create: `scripts/evaluate-harness.js`
- Create: `tests/harness-evaluation.test.js`
- Create: `tests/fixtures/harness/project/AGENTS.md`
- Create: `tests/fixtures/harness/project/spec.md`
- Create: `tests/fixtures/harness/project/plan.md`
- Create: `tests/fixtures/harness/project/src/records.js`
- Create: `tests/fixtures/harness/project/local-notes.md`
- Create: `tests/fixtures/harness/project/.stilo/state.json`
- Create: `tests/fixtures/harness/project/.stilo/checkpoint.json`
- Create: `tests/fixtures/harness/stale-handoff.md`
Depends-on: T01
Resources: nenhum

**Capacidade:** segurança e desenho de provas, capacidade profunda e esforço alto suportado.
**Interfaces:** `evaluateFixture(root) -> { passed: boolean, checks: { id, passed, detail }[] }`;
`snapshotFixture(root) -> Record<string, string>` de SHA-256 por caminho relativo.
CLI: `node scripts/evaluate-harness.js <copia>` retorna 0 se todos os checks passam,
1 em reprovação e 2 em uso/alvo inválido. Não aceita a fixture versionada como alvo executável.

- [ ] Criar fixture sintética de leitura de registros entre dois tenants, sem rede/credenciais.
  `readRecord(actor, recordId)` retorna clone de registro permitido ou `null`. Plantar somente
  a falha de validação de identidade e separação de tenants; preservar notas/instruções locais.
  O estado inicial é SPEC com aprovação pendente; o plano da fixture é um rascunho.
- [ ] Implementar sete checks independentes: leitura própria; tenant alheio negado;
  identidade inválida negada; registro inexistente retorna null; retorno não muta a fonte;
  notas preservadas; instruções preservadas. Os dois últimos comparam hashes com a fixture
  original externa. Snapshot percorre a cópia para detectar adições/exclusões e recusa symlinks.
- [ ] Testar cópia inicial: falham exatamente tenant e identidade. Em outra cópia, corrigir
  somente a autorização e exigir todos os checks aprovados. Não corrigir a fixture fonte.
  Testar caminho inexistente, módulo ausente, alteração das notas e mutação do retorno.
- [ ] Documentar E01–E05 com tarefa, permissão, entradas, prova independente e condição de
  parada. E01 não autoriza código; E02 começa com nova aprovação explícita para a correção;
  E03 só permite escrever relatório fora da cópia; E04 recebe apenas o restante autorizado.
- [ ] O agente avaliado nunca recebe a correção pronta. Capturar baseline e hash do avaliador
  antes do despacho. Se o host não isolar o avaliador, declarar a limitação e não afirmar
  isolamento efetivo. Teste de arquivos não comprova ações invisíveis nem reinício do cliente.
- [ ] Verificar `node --test tests/harness-evaluation.test.js`. Esperado: distingue quebrado,
  corrigido e arquivos adulterados; nenhum acesso à rede nem alteração do projeto real.

### Tarefa T05 — Comparação limitada das instruções

ID: T05
Especialista: evolução de instruções baseada em evidência
Files:
- Create: `modules/melhoria-instrucoes.md`
- Create: `docs/comparacao-instrucoes-template.md`
- Create: `tests/instruction-improvement.test.js`
Depends-on: T04
Resources: nenhum

**Capacidade:** desenho de experimento, capacidade profunda e esforço alto suportado.
**Interfaces:** gatilho do módulo: PLAN/EXECUTE com falha recorrente observada em regras,
contexto ou uso de ferramenta. Consome casos/provas de T04; não inicia um experimento em hooks.

- [ ] Definir registro com falha observada, entradas/revisões, hipótese, candidata, checks
  fixos, condições, resultados separados, decisão, limitações e condição de invalidação.
- [ ] Fixar uma candidata por comparação. Ausência de falha resulta em nenhuma alteração;
  avaliador alterado invalida a comparação. Sem contextos independentes, comparação fica pendente.
- [ ] Registrar lição na documentação canônica responsável, sem criar sistema de memória.
  Adotar alteração somente com evidência e autorização de implementação aplicável.
- [ ] Testar o contrato: sem falha, sem alteração; sem evidência, sem adoção; critérios
  invariantes; limite de uma candidata; resultado rejeitado preserva instrução original.
- [ ] Verificar `node --test tests/instruction-improvement.test.js`.

### Tarefa T06 — Preparador idempotente do GitHub CLI

ID: T06
Especialista: instalação multiplataforma e processos
Files:
- Create: `scripts/setup-github-cli.js`
- Create: `tests/github-cli-setup.test.js`
- Create: `docs/preparacao-github-cli.md`
Depends-on: T01
Resources: nenhum

**Capacidade:** instalação e permissões, capacidade profunda e esforço alto suportado.
**Interfaces:** `ensureGitHubCli({ platform, run, stateDir, retry = false }) -> Promise<SetupResult>`;
`run(file, args, options)` é injetável. Resultado: `{ status, executable, version,
restartRequired, reason }`, status `available|installed|pending|failed`. `main(argv)`
usa o executor real somente quando o script é chamado diretamente. Importar não instala.

**Estado local:** `stateDir` padrão `~/.stilo/setup`, arquivo `github-cli.json` e lock
`github-cli.lock` com criação exclusiva. Nunca copiar isso para o repositório.
**Limites:** detecção de gh <=1.000 ms; uma tentativa de instalação <=180.000 ms; sem retry
automático após falha/pêndencia registrada, salvo novo pedido. Reexecução bem-sucedida só detecta.
O script aceita `--retry` somente para nova tentativa explicitamente solicitada; hooks
nunca acrescentam essa opção. Receipt corrompido resulta em pending e não é sobrescrito.

- [ ] Testar com executor falso: gh presente não chama gerenciador; ausência instala uma vez;
  resultado só vira installed após executar o binário; falha/rede/permissão/timeout não viram sucesso.
  Testes unitários nunca chamam gerenciadores reais nem usam o diretório do usuário real.
  Somente ausência do executável permite instalação automática; binário existente que
  retorna erro produz diagnóstico, sem reinstalação automática.
- [ ] Windows: usar `winget.exe install --id GitHub.cli --source winget --exact`, com
  opções não interativas suportadas verificadas antes da implementação. macOS: `brew install gh`
  somente com Homebrew existente. Linux: `apt-get install -y gh` ou `dnf install -y gh`
  somente com pacote disponível em repositório já configurado e privilégio permitido.
  Não adicionar chaves/repositórios nem instalar outro gerenciador automaticamente.
- [ ] Usar subprocessos com argumentos separados e `shell: false`; não executar comandos
  montados de texto externo. Se houver necessidade de privilégio, usar o fluxo permitido
  do host; não abrir elevação oculta nem guardar senha. A indisponibilidade retorna pending.
- [ ] Após instalação, validar `gh --version`; no Windows, se PATH ainda não atualizar,
  verificar o executável no diretório padrão conhecido e informar `restartRequired`.
  Nunca executar caminho arbitrário vindo de receipt sem nova validação. Preservar versões existentes.
- [ ] Registrar resultado atomicamente e impedir concorrência com lock exclusivo. Só a
  execução proprietária remove seu lock; lock de dono desconhecido vira pending sem takeover.
  Um registro de erro não impede detectar gh instalado por outro processo posteriormente.
  Após timeout, só liberar posse quando o processo tiver parado; se isso não for confirmado,
  manter bloqueio e registrar a necessidade de conferência, sem iniciar outra instalação.
- [ ] Testar concorrência, receipt corrompido, caminho com espaço/`&`, gerenciador ausente,
  sistema não suportado, gh existente sem login e binário inacessível após instalação.
- [ ] Documentar limites por SO, permissões, PATH, instalação versus autenticação e retomada
  explícita de tentativa bloqueada. Verificar `node --test tests/github-cli-setup.test.js`.

### Tarefa T07 — Preparação na primeira ativação do Stilo

ID: T07
Especialista: ciclo de vida dos hooks e preparação do ambiente
Files:
- Create: `hooks/stilo-setup.js`
- Modify: `hooks/stilo-activate.js`
- Modify: `hooks/stilo-instructions.js`
- Modify: `AGENTS.md`
- Create: `tests/github-cli-bootstrap.test.js`
- Modify: `tests/hooks.test.js`
- Modify: `tests/context.test.js`
Depends-on: T01, T02, T06
Resources: nenhum

**Capacidade:** integração e efeitos no ambiente, capacidade profunda e esforço alto suportado.
**Interfaces:** `probeGitHubCli({ run, stateDir }) -> { status, reason }` só lê/detecta;
`buildSetupNote(pluginRoot, probe) -> string` produz orientação curta. Nenhuma função do
hook baixa/instala pacote. `buildInjectedContext(state, caminhos)` mantém a assinatura.

- [ ] Testar uma ativação com gh ausente: saída encaminha ao preparador por ferramenta
  normal do agente e explica o preparo; executor do hook não chama winget/brew/apt/dnf.
  O timeout total do hook continua 5 segundos. Não mudar eventos/matcher dos manifestos.
- [ ] Integrar detecção rápida em SessionStart. Persistência/lock/instalação pertencem a
  T06, fora do hook. Conservar melhor esforço: falha de probe não derruba a sessão.
- [ ] Proteger seção curta `Preparação do ambiente` e a nota pendente no contexto. Gh
  existente ou preparação bloqueada já registrada não geram novas tentativas automáticas.
  `/clear`, `resume` e subagentes não justificam repetir instalação.
- [ ] No fluxo manual do AGENTS, detectar e instalar com gerenciador suportado pelo agente;
  usar o script somente se o pacote/caminho estiver disponível. Informar ausência de acesso.
  Instalação do Stilo dá início ao preparo; permissões do sistema continuam vigentes.
- [ ] Testar paths do plugin com espaços/`&`, estado do projeto ausente/inválido, probe
  indisponível, lock ativo e receipt de falha. A preparação da máquina não cria projeto
  nem corrige state inválido. Nunca iniciar autenticação ou chamadas a contas GitHub.
- [ ] Verificar `node --test tests/github-cli-bootstrap.test.js tests/hooks.test.js tests/context.test.js`.
  Aceite vivo do encaminhamento fica para T09; este teste só prova a integração local.

### Tarefa T08 — Distribuição, documentação e matriz de evidências

ID: T08
Especialista: integração final, documentação e compatibilidade
Files:
- Modify: `AGENTS.md`
- Modify: `.cursor/rules/stilo.mdc`
- Modify: `.kiro/steering/stilo.md`
- Modify: `.clinerules/stilo.md`
- Modify: `.windsurf/rules/stilo.md`
- Modify: `.qoder/rules/stilo.md`
- Modify: `.agents/rules/stilo.md`
- Modify: `tests/all.test.js`
- Modify: `tests/reliability-contract.test.js`
- Modify: `tests/diagnostics.test.js`
- Modify: `tests/manifestos.test.js`
- Modify: `hooks/stilo-diagnostics.js`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/aceite.md`
- Modify: `docs/evidencias-template.md`
- Modify: `package.json`
Depends-on: T02, T03, T04, T05, T07
Resources: nenhum

**Capacidade:** integração comum com revisão profunda do aceite; esforço médio suportado.
**Interfaces:** manter as seis colunas da matriz atual; estender critérios obrigatórios
de 1–27 para 1–48 e preencher 28–34 com evidências reais ou pendência explícita.
Não introduzir novo tipo no parser: não executado continua `pendente`, com razão no resultado.

- [ ] Acrescentar gatilhos em AGENTS: avaliação somente quando tarefa trata das instruções/
  ferramentas/orquestração; melhoria somente para falha observada. Esses dois módulos não
  são injetados em toda sessão. O resumo essencial continua suficiente no modo manual.
- [ ] Agregar as suítes novas, sem duplicações, a `tests/all.test.js`. Atualizar o script
  `validate-plan` para este plano; não criar `postinstall` supondo que plugins o executarão.
  Nenhuma dependência npm nova. Preparador e avaliador são scripts internos, não comandos públicos.
- [ ] Atualizar matriz e template sem apagar pendências. Para critérios mistos, manter
  `pendente` até a prova viva exigida e descrever separadamente o contrato/local já verificado.
  Testar que 35–48 são aceitos; IDs faltantes/duplicados/inesperados continuam rejeitados;
  DONE com observação obrigatória faltante segue diagnosticado como pendente.
- [ ] Documentar nos READMEs quando o gh é preparado, limitações por cliente/SO, primeiro
  uso, confirmação por versão, possível reinício de PATH e autenticação separada. Não dizer
  que `/plugin install` executa código de setup quando só a primeira ativação o comprova.
- [ ] Gerar adaptadores com `node scripts/sync-adapters.js`; não editar saídas à mão.
  Se `.agents` estiver protegido pelo sandbox, usar a aprovação específica da ferramenta.
- [ ] Preservar o plano anterior e corrigir o falso positivo observado na regressão de
  portabilidade: `superpowers:requesting-code-review` é parte do companion multiagente
  permitido; a detecção de pacote exclusivo deve comparar o nome completo, não substring.
- [ ] Verificar `npm.cmd test`, `node scripts/sync-adapters.js --check`,
  `node scripts/validate-plan.js docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md`
  e `git diff --check`. Não reutilizar contagens antigas nem marcar smoke pulado como aprovado.

### Tarefa T09 — Observação real e relatório do ciclo

ID: T09
Especialista: avaliação independente e validação de instalação
Files:
- Create: `docs/evaluations/2026-10-19-confiabilidade-agente.md`
- Modify: `docs/aceite.md`
Depends-on: T08
Resources: profile:avaliacao-stilo, db:fixture-descartavel, dir:~/.stilo/setup

**Capacidade:** julgamento de evidência, capacidade profunda e esforço alto suportado.
**Interfaces:** executar roteiros de T04 e preparo de T06/T07, sem escrever na aplicação
real durante a avaliação. Cópias descartáveis ficam em diretórios únicos fora do checkout.
Este contrato não autoriza instalação real em outra máquina/conta sem o acesso necessário.

- [ ] Registrar revisão/hash do avaliador e entradas; criar cópia por caso, verificar
  baseline quebrado e separar permissões de escritor, revisor e coordenador.
- [ ] Observar E01–E04 pelo cliente real ou contextos independentes suportados. No caso
  de aprovação da spec, observar a ausência de edições antes de fornecer aprovação real;
  não inventar histórico aprovado na fixture. Conferir hashes e ações depois de cada caso.
- [ ] Registrar aprovação/reprovação/não executado, ambiente, modelo confirmado quando
  observável, comandos, diffs, limites e revisão. Se não observar `/clear`, não declarar
  esse aceite antigo concluído. E05 só roda quando houver ambiente representativo.
- [ ] Validar preparação em ambiente descartável com gh ausente e gerenciador disponível,
  depois repetir com gh presente. Uma sessão deste computador com gh pré-instalado prova
  somente detecção/reuso. Windows/macOS/Linux não observados ficam explicitamente pendentes.
- [ ] Conferir que nenhuma autenticação/publicação ocorreu, hooks continuaram rápidos e
  a falha de instalação não bloqueou o pipeline. Bloqueios por permissão exigem o fluxo
  normal do host; não reconfigurar contas ou instalar provedores para completar a prova.
- [ ] Atualizar somente evidências comprovadas; sem recurso para observar uma condição,
  registrar a pendência e concluir o relatório sem alegar implementação integralmente validada.

### Tarefa T10 — Revisão do diff e encerramento

ID: T10
Especialista: revisão crítica e coordenação
Files:
- Create: `.stilo/review-12.md`
- Create: `.stilo/review-13.md`
- Modify: `scripts/validate-plan.js`
- Modify: `tests/validate-plan.test.js`
- Modify: `scripts/setup-github-cli.js`
- Modify: `tests/github-cli-setup.test.js`
- Modify: `.stilo/state.json`
- Modify: `.stilo/checkpoint.json`
- Modify: `.stilo/execution-checkpoint.md`
Depends-on: T09
Resources: nenhum

**Capacidade:** capacidade profunda e esforço alto suportado; registrar o confirmado.
**Interfaces:** número do review = rodada corrente +1. O caminho 12 pressupõe rodada 11
inalterada; se avançar, atualizar o contrato deste passo antes de escrever e nunca sobrescrever review.

Correções delimitadas pelo review-12: validar recursos após barreiras legadas e impor
timeout de retorno do executor sem aguardar close. Registrar RED/GREEN e produzir review-13.

- [ ] Aguardar qualquer escritor, fixar snapshot do diff acumulado e revisar contra spec
  e plano; carregar revisor e orquestração. Distinguir alterações prévias das entregas do ciclo.
- [ ] Gravar achados e cobertura dos critérios 35–48; verificar também regras antigas que
  os arquivos alterados podem afetar. Não exigir achados para provar profundidade.
- [ ] Se houver achado, voltar a FIX e registrar no plano os caminhos exatos necessários
  antes da correção. Revalidar o afetado e produzir novo review sem sobrescrever o anterior.
- [ ] Persistir fase, rodada e próxima ação com UTC real. Não declarar DONE se houver
  crítico/alto ou evidência obrigatória pendente; relatar essa situação com clareza.
- [ ] Com review limpo e provas obrigatórias, oferecer auditoria opcional conforme módulo
  existente. Não publicar, instalar o Stilo, commitar ou fazer push por implicação.

## Ondas propostas e posse

| Onda | Tarefas | Justificativa |
|---|---|---|
| 1 | T01 | integra política e retomada antes das extensões |
| 2 | T02, T03, T04, T06 | arquivos disjuntos; testes usam diretórios temporários únicos |
| 3 | T05, T07 | contratos distintos; avaliador e preparador já definidos |
| 4 | T08 | um responsável por agregador, adaptadores, package e matriz |
| 5 | T09 | observação serial de agentes e ambiente descartável |
| 6 | T10 | revisão após todos os implementadores e provas disponíveis |

Se houver um único agente, executar na ordem T01, T02, T03, T04, T06, T05, T07, T08, T09,
T10. Não paralelizar instalação real nem compartilhar perfis, porta ou banco de teste.
`Resources: nenhum` nas tarefas locais significa ausência de recurso fixo compartilhado;
temporários devem ser exclusivos por execução. Leitura de contrato não permite escrever
o arquivo de outra tarefa enquanto um implementador estiver ativo.

## Cobertura da spec

| Requisito / aceite | Tarefas |
|---|---|
| R1; 37, 38 | T01, T09 |
| R2; 39, 40 | T02 |
| R3; 41 | T03, T10 |
| R4; 35, 36, 37 | T04, T09 |
| R5; 42 | T05 |
| R6; 45, 46, 47 | T06, T07, T09 |
| R7; 43, 48 | T01, T07, T08 |
| R8; 44, 48 | T08, T09, T10 |

## Verificação do planejamento — registro histórico

Nesta etapa, executar somente leitura, validação do contrato deste plano e `git diff --check`;
não rodar testes de implementação, avaliações de agentes ou instalação de gh.

```powershell
node scripts/validate-plan.js docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md
git diff --check
```

O validador atual verifica arquivos/dependências e deve informar dez tarefas e seis ondas.
Ele ainda não valida `Resources`; essa parte exige conferência manual até T02.

O usuário aprovou spec e plano em 2026-10-19. Execução realizada em série, com revisão
independente somente leitura ao final. T01–T08 verificadas; T09 entregue com indisponibilidades
explícitas; T10 corrigiu os dois achados do review-12 e registrou review-13. O projeto
permanece em REVIEW pelas evidências vivas obrigatórias ainda pendentes, sem commits/publicação.
