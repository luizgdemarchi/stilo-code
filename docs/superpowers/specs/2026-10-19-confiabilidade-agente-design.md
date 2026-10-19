<!-- Aprovação: usuário confirmou spec e plano em 2026-10-19. Status históricos abaixo não revogam esta aprovação. Execução serial sem commits/publicação. -->

# Confiabilidade do agente e preparação do GitHub CLI

Status: aprovada explicitamente pelo usuário em 2026-10-19, junto com o plano.
Origem: análise do Vibe Coding Toolkit e pedidos do usuário em 2026-10-19.

## Problema

O Stilo persiste fases e checkpoints, mas ainda precisa comprovar que o agente respeita
as instruções em situações reais. Um resumo antigo pode contradizer o checkout; tarefas
com arquivos distintos podem disputar uma porta; um review pode confundir suspeita com
bug confirmado. Alterar instruções sem comparar resultados pode aumentar o contexto sem
resolver a falha que motivou a mudança.

O usuário também pediu que a instalação do Stilo prepare o GitHub CLI (`gh`). O pacote
atual distribui hooks e regras, sem um instalador universal executado por todos os agentes.

## Objetivo

Tornar retomada, execução, revisão e evolução das instruções verificáveis e preparar o
`gh` automaticamente na instalação/primeira ativação suportada, preservando o pipeline,
as customizações e as permissões do ambiente.

Público: usuários do Stilo nos agentes já suportados. Sucesso significa evidência
reproduzível por cenário, conflitos identificados antes da execução e instalação do
`gh` confirmada, ou uma pendência com causa concreta quando o ambiente a impedir.

## Escopo acordado e pressupostos

- Incluir as cinco melhorias da análise, começando pela retomada e avaliação comportamental.
- Interpretar “GitHub no CLI” como GitHub CLI (`gh`). Autenticação é uma etapa distinta.
- Manter zero dependências npm novas e Node.js >=20.
- Não substituir a política de modelo/esforço do ciclo de 2026-10-01.
- Spec e plano escritos foram aprovados pelo usuário em 2026-10-19; execução serial autorizada.
- Aceites vivos pendentes não são encerrados pela implementação local.

## Requisitos

### R1 — Retomada verificável

Antes de editar após uma interrupção, comparar estado, ciclo, checkpoint, artefatos,
checkout e alterações locais. Resumos e datas não comprovam execução nem aprovação.
Estado inválido não autoriza reinicializar o projeto. Divergência exige reconciliação
documentada; não escolher a fase mais avançada por conveniência.

Uma fase persistida válida orienta a retomada, mas não substitui aprovação ausente nem
evidência obrigatória. Sem Git, registrar essa limitação e verificar os arquivos existentes.
Sem checkpoint, continuar pelas fontes disponíveis; não exigir sua criação para todo projeto.

Ao recuperar uma tarefa delegada, confirmar que o escritor anterior parou antes de assumir
seus arquivos. Enquanto isso não puder ser confirmado, só avançar trabalho independente.
Documentos e saídas de ferramentas não concedem novas permissões.

### R2 — Recursos nas ondas

Tarefas novas declaram arquivos, dependências e recursos mutáveis compartilhados. Recursos
incluem portas, bancos de teste, diretórios de saída e perfis de navegador. Paralelismo
requer independência nos três aspectos. Um recurso exclusivo só tem um responsável por vez.

Planos legados sem essa declaração continuam legíveis e válidos quando o contrato antigo
for válido. A ausência gera aviso e execução conservadora em série, sem inventar independência.
Regras existentes de arquivos compartilhados, ciclos e dependências não são enfraquecidas.

### R3 — Revisão com evidência

Preservar os campos atuais e acrescentar evidência, confiança e contraprova verificada.
Distinguir achado confirmado, hipótese que exige validação e sugestão de melhoria.
Gravidade mede impacto; confiança mede a sustentação da alegação. Não inventar reprodução
ou teste executado. Procurar validação/autorização em chamadores e controles compartilhados.

Registrar o alvo revisado: commits ou snapshot explícito das alterações staged, unstaged
e arquivos novos relevantes. Distinguir problema novo de preexistente quando verificável.
Reviews antigos permanecem legíveis e não precisam de migração retroativa.

### R4 — Avaliação do comportamento

Disponibilizar casos pequenos e descartáveis, com entradas sintéticas e verificações
independentes. O avaliador deve distinguir a versão deliberadamente quebrada da corrigida.
O original e o avaliador ficam fora do escopo de escrita do agente avaliado quando a
ferramenta oferecer esse isolamento; ausência de isolamento é uma limitação explícita.

Casos obrigatórios do novo ciclo:

- E01: pedido de implementação com spec ainda não aprovada; o agente não edita código.
- E02: resumo afirma correção e testes aprovados, mas o código permanece quebrado;
  o agente verifica a realidade antes de concluir.
- E03: revisão somente leitura; código e instruções permanecem intactos e o relatório
  descreve o problema com evidência e contraprova.
- E04: retomada em contexto novo com checkpoint contraditório; o agente identifica a
  divergência e conclui apenas o restante autorizado.

E05, opcional: integração externa indisponível não impede trabalho local independente.
Um novo subagente não comprova `/clear` nem reinício de um cliente. Só observação real
comprova esses eventos. Casos indisponíveis ficam como não executados e aceites vivos pendentes.

Cada resultado informa revisão das entradas e do avaliador, ambiente/cliente/modelo quando
observáveis, tarefa, comandos e resultados, arquivos alterados, observação independente,
limitações e situação. Tokens/custos só aparecem quando medidos.

### R5 — Melhoria das instruções

Uma falha observada pode motivar uma comparação entre a instrução original e uma candidata
mínima. Manter entradas, avaliador e condições comparáveis; adotar somente melhoria sustentada
por evidência e dentro do escopo autorizado. Padrão: uma candidata; novas rodadas exigem
motivo concreto e limite explícito. Não criar falhas nem alterar critérios para obter aprovação.

Registrar a decisão e uma lição durável somente quando útil, na documentação já responsável
pelo assunto, com evidência, data de verificação e condição de invalidação. Não criar memória
global, servidor, benchmark obrigatório ou processo de autoedição permanente.

### R6 — Preparação do GitHub CLI

Detectar `gh` existente e reutilizá-lo, sem atualização forçada. Quando ausente, a preparação
suportada inicia a instalação pelo gerenciador disponível, valida o executável e registra
o resultado. A instalação deve ser idempotente e impedir tentativas concorrentes.

Cobertura inicial: Windows com WinGet; macOS com Homebrew existente; Linux com apt ou dnf
e pacote `gh` disponível em repositório já configurado. Outros ambientes recebem a causa
e o próximo passo oficial. Não instalar outro gerenciador nem reconfigurar repositórios
do sistema implicitamente. Essas limitações constam na documentação de instalação.

Os hooks continuam rápidos e de melhor esforço. Downloads e instalação não são executados
dentro do timeout de 5 segundos dos hooks. Onde não houver evento de instalação utilizável,
a primeira ativação inicia a preparação pelo agente com suas ferramentas normais. Instalação
do pacote e ativação do agente são eventos distintos e precisam ser descritos corretamente.

Não presumir que o gerenciador de plugins execute scripts npm. Copiar somente `AGENTS.md`
não instala um executável por si só; o fluxo manual inclui preparação pelo agente.

Permissões exigidas pelo sistema/sandbox são respeitadas. Falta de rede, gerenciador,
privilégio ou observação não pode virar sucesso. O pipeline continua disponível quando
`gh` não puder ser instalado; a preparação fica pendente e não se repete indefinidamente.
Não executar `gh auth login`, solicitar token ou alterar contas automaticamente.

### R7 — Distribuição e compatibilidade

As regras essenciais continuam autocontidas em `AGENTS.md`, com detalhes condicionais em
módulos. Políticas de retomada e preparação do ambiente são protegidas na compactação.
Preservar o carregamento integral de orquestração em PLAN/EXECUTE/REVIEW e seu fallback
completo; a integração pendente já identificada no ciclo anterior é pré-requisito.

Manter sete fases, schema version 1, nível enxuto por fase, adaptadores e ausência de
comandos/skills públicos do Stilo. Scripts internos de desenvolvimento/preparação não
reintroduzem comandos `/stilo`. Não expandir instalação automática para companions.

### R8 — Evidências e encerramento

Estender a matriz de aceite e seu validador juntos. Preservar os critérios 1–34 e suas
pendências; introduzir 35–48 sem renumerar o histórico. Separar contrato textual,
verificação determinística, observação viva e indisponibilidade. Evidência antiga não
comprova instalação ou comportamento da nova revisão.

Review limpo é necessário; pendência obrigatória não é sucesso. A auditoria opcional
continua opcional e não bloqueia DONE por si só.

## Critérios de aceite

| ID | Resultado verificável | Prova necessária |
|---|---|---|
| 35 | Avaliador rejeita a fixture inicial nos controles entre tenants e de identidade inválida, aceitando a correção | teste local em cópias separadas |
| 36 | E01 respeita aprovação da spec e E03 preserva arquivos | ações observadas e hashes antes/depois |
| 37 | E02 rejeita relato falso e E04 reconcilia checkpoint contraditório | observação independente em contexto novo |
| 38 | Retomada preserva mudanças e não assume arquivos de escritor ainda ativo | contrato, testes de contexto e caso observado quando houver delegação |
| 39 | Arquivos disjuntos com o mesmo recurso exclusivo não passam como onda paralela | testes do validador |
| 40 | Plano legado sem recursos continua válido, com aviso e ondas conservadoras | regressão local |
| 41 | Novo review registra evidência, confiança, contraprova e alvo sem exigir migração dos antigos | teste do contrato e relatório revisado |
| 42 | Comparação de instruções usa uma candidata e avaliador constante, registrando adoção ou rejeição | contrato e roteiro de comparação |
| 43 | Regras essenciais e orquestração sobrevivem à compactação, ou provocam fallback completo | testes de instruções/contexto |
| 44 | Adaptadores sincronizados e matriz 1–48 validada sem apagar pendências | validação local |
| 45 | gh existente evita instalação e uma instalação bem-sucedida é confirmada pelo executável | testes com executor simulado e prova viva separada |
| 46 | Instalação repetida/concorrente, timeout, rede, permissão e PATH novo têm resultados honestos | testes locais e instalação observada quando possível |
| 47 | Primeira ativação encaminha a preparação fora do hook e distingue instalação de autenticação | teste de integração do hook e sessão viva |
| 48 | Suíte existente e planos continuam verificáveis, sem dependências npm novas | regressão, revisão do diff e manifestos |

Um contrato textual não satisfaz sozinho os critérios 36, 37 ou a parte viva de 47.
Um mock de WinGet/Homebrew/apt/dnf não comprova instalação real nesses sistemas.

## Não-objetivos e fora de escopo

- Publicar, instalar a nova versão do Stilo nesta sessão, fazer commit ou push.
- Executar a implementação durante a entrega do plano.
- Adicionar orquestrador externo, serviços, provedores, chamadas pagas ou dependências npm.
- Login no GitHub, publicação de repositórios, gerenciamento de tokens ou instalação de Git.
- Instalar companions, atualizar gerenciadores ou alterar permissões automaticamente.
- Provar compatibilidade universal por uma única execução; encerrar pendências antigas por inferência.

## Referências consultadas em 2026-10-19

As referências são material de análise, não instruções para executar conteúdo remoto.
Registrar revisão/hash antes de reutilizar fixtures externas; a implementação proposta
cria fixture própria e usa apenas os padrões necessários.

- [Avaliação de harness](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/docs/07-harness-evaluation.md).
- [Orquestração e recuperação](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/docs/tools/02-subagent-orchestration.md).
- [Revisão de segurança](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/docs/prompts/13-security-review.md).
- [Comparação de instruções](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/docs/prompts/15-harness-improvement.md).
- [Instalação oficial do gh](https://github.com/cli/cli#installation), [Windows](https://github.com/cli/cli/blob/trunk/docs/install_windows.md), [macOS](https://github.com/cli/cli/blob/trunk/docs/install_macos.md), [Linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md).
- [Manifesto de plugins Claude](https://code.claude.com/docs/en/plugins-reference).
