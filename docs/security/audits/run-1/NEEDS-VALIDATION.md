# Necessita validação — stilo-code @ 6f01438

Os itens abaixo são hipóteses sustentadas por caminhos de código, não vulnerabilidades confirmadas. Nenhum possui severidade. A rodada não executou código do repositório: o host não tem sandbox de sistema operacional. Execute os planos locais somente em VM/ambiente descartável com os limites indicados; as verificações de host são observações do proprietário em perfis descartáveis, sem tráfego para serviço de produção.

## 1. Resolução de gh.exe no probe SessionStart

**Fingerprint:** hooks/stilo-setup.js:probeGitHubCli:bare-name-gh-cwd-resolution  
**Fronteira:** projeto aberto → executável chamado pelo hook do plugin.  
**Trilha:** hooks/claude-codex-hooks.json:5 → hooks/stilo-activate.js:9 → hooks/stilo-setup.js:8. O hook chama gh.exe --version por nome simples. A sonda já registrada confirma que Node no Windows pode resolver executáveis do cwd quando NoDefaultCurrentDirectoryInExePath está ausente; não executou código do projeto.  
**Bloqueios:** não se sabe se cada host inicia SessionStart com cwd do projeto, nem se o hook herda a variável que muda a resolução.  
**Plano local:** em VM Windows descartável, sem rede, iniciar o plugin em projeto de teste com cópia benigna de hostname.exe chamada gh.exe. Registrar cwd do hook, valor da variável e caminho da imagem iniciada. Não usar executáveis ou dados do projeto real.  
**Plano observado pelo proprietário:** repetir em perfis descartáveis de Claude Code e Codex; registrar cwd, ambiente, imagem iniciada e eventual prompt de confiança. Sem projeto de produção ou credenciais.

## 2. Resolução de winget.exe pelo instalador

**Fingerprint:** scripts/setup-github-cli.js:realRun:bare-name-installer-cwd-resolution  
**Fronteira:** conteúdo de projeto não confiável → executável iniciado pelo fluxo de setup.  
**Trilha:** hooks/stilo-setup.js:22 → scripts/setup-github-cli.js:76,90 → scripts/setup-github-cli.js:16. O instalador usa nome simples, herda ambiente e cwd e não define cwd próprio.  
**Bloqueios:** não se conhece cwd nem NoDefaultCurrentDirectoryInExePath herdado pelo processo do agente ao executar o comando sugerido. A sonda de plataforma não executou o instalador.  
**Plano local:** em VM Windows descartável sem rede, inspecionar cwd/ambiente de um processo benigno iniciado da mesma forma; usar um marcador winget.exe que apenas imprime texto fixo. Não invocar o instalador nem gerenciador de pacotes. Comparar a variável ausente e definida como 1.  
**Plano observado pelo proprietário:** em perfis descartáveis, observar cwd e presença da variável no ambiente que iniciaria o comando sugerido; não rodar o instalador.

## 3. Descoberta de estado acima do projeto

**Fingerprint:** hooks/stilo-state.js:findStateFiles:unbounded-ancestor-walk  
**Fronteira:** arquivo em ancestral compartilhado → contexto e arquivo de estado do projeto aberto.  
**Trilha:** hooks/stilo-state.js:74,87,91,279 → hooks/stilo-instructions.js:64,267 → hooks/stilo-runtime.js:41. A busca ascendente termina somente na raiz e seleciona o primeiro estado existente.  
**Bloqueios:** não está demonstrado que um principal de menor privilégio possa gravar no ancestral relevante, nem como o host/modelo reage ao estado injetado.  
**Plano local:** em sandbox descartável sem rede, com raiz temporária, ambiente allowlisted vazio e limites de recursos, criar estado/checkpoint de marcador no topo e um projeto-vítima abaixo sem .stilo local; chamar resolver e montador de contexto e registrar o caminho/valores selecionados. Repetir com estado ilegível. Não executar sem os controles.  
**Plano observado pelo proprietário:** em host descartável, verificar permissões do ancestral e se outro usuário padrão pode criar .stilo/state.json; se puder, observar a resolução em projeto dummy com marcadores inofensivos.

## 4. Texto livre de checkpoint sem procedência explícita

**Fingerprint:** hooks/stilo-instructions.js:sanitiza/repo-free-text-injected-without-provenance-label  
**Fronteira:** texto controlado pelo projeto → contexto de alta prioridade do plugin/host.  
**Trilha:** hooks/stilo-state.js:215,231 → hooks/stilo-instructions.js:55,64,86,315 → hooks/stilo-runtime.js:27. nextAction, task e pending são sanitizados e inseridos no contexto, sem rótulo explícito de origem não confiável.  
**Bloqueios:** não se observou a apresentação desses campos pelo host nem se o modelo os interpreta como instrução ou age sobre eles.  
**Plano local:** em VM Linux descartável, sem rede, usuário sem privilégios, plugin somente leitura, fixture isolada, limite de memória de 128 MiB e timeout de 5 segundos. Criar state/checkpoint JSON válidos com marcadores sintéticos; iniciar SessionStart e capturar stdout. Registrar se nextAction aparece como próxima: e se a origem é indicada. Não enviar texto a modelo nem habilitar ferramentas; interromper se os limites falharem.  
**Plano observado pelo proprietário:** em perfis descartáveis de Claude Code e Codex, observar como o contexto apresenta o marcador; sem ferramentas ou dados sensíveis, verificar se o modelo o trata como dado do projeto.

## 5. Leitura sem limite de checkpoint.json

**Fingerprint:** hooks/stilo-state.js:readJsonObject:unbounded-readFileSync-checkpoint-special-file  
**Fronteira:** arquivo de projeto → disponibilidade e memória do hook.  
**Trilha:** hooks/stilo-instructions.js:286,64,72 → hooks/stilo-state.js:232,204. readCheckpoint chega a readFileSync síncrono sem checagem de tipo ou limite de bytes.  
**Bloqueios:** consumo de memória/duração e comportamento do timeout não foram medidos; links e arquivos especiais dependem da plataforma.  
**Plano local:** VM Linux sem rede; memory.max=268435456, pids.max=32, timeout de grupo de 6 segundos. Fixtures fora do checkout com state válido e checkpoint pequeno, link para /dev/zero e arquivo regular de 67108864 bytes. Com checkout somente leitura, chamar buildCheckpointNote(statePath, false) por Node absoluto; registrar saída, duração, RSS e retorno. Não executar se os limites não puderem ser impostos.  
**Plano observado pelo proprietário:** em VM/perfil descartável de cada host com os mesmos limites, observar encerramento do hook no timeout, processos sobreviventes e continuidade da sessão.

## 6. Leitura sem limite de state.json

**Fingerprint:** hooks/stilo-state.js:readStateResult:unbounded-readFileSync-state-special-file  
**Fronteira:** arquivo de projeto → disponibilidade e memória do hook por prompt.  
**Trilha:** hooks/stilo-prompt.js:19 → hooks/stilo-state.js:87,284,132. A descoberta aceita existência e o leitor síncrono não limita tipo ou tamanho.  
**Bloqueios:** efeito de symlink/FIFO, RSS e timeout do host não foram observados; o checkout Windows pode não materializar links POSIX.  
**Plano local:** VM Linux isolada sem rede, alvo somente leitura, ambiente vazio, limite de memória de 256 MB e timeout de grupo de 6 segundos. Testar fixtures separadas com state regular, symlink para /dev/zero e FIFO; chamar resolveProjeto e registrar saída, RSS, bloqueio e término. Não executar sem todos os limites.  
**Plano observado pelo proprietário:** em VM/perfil descartável, observar se cada host encerra o hook e se o prompt continua; não usar fixtures em perfil de produção.

## 7. Instrução de escrita sobre identidade de estado não verificada

**Fingerprint:** hooks/stilo-instructions.js:blocoEstado:write-repair-directive-to-unverified-state-identity  
**Fronteira:** symlink do projeto → arquivo do usuário fora do projeto via ferramenta de escrita do agente.  
**Trilha:** hooks/stilo-state.js:87,132 → hooks/stilo-instructions.js:217,234,290 → ferramenta de escrita/controle de permissão do host.  
**Bloqueios:** não se sabe se as ferramentas seguem o symlink, se a permissão mostra o destino resolvido, ou se o agente tentaria a gravação; checkout Windows padrão pode não materializar o link.  
**Plano local:** VM POSIX descartável, sem rede e com perfil dummy. Apontar .stilo/state.json a um arquivo dummy externo; observar se o hook injeta instrução de reparo e se a ferramenta mostra destino externo ou bloqueia. Não aprovar nem realizar gravação; confirmar que o arquivo dummy permanece intacto.  
**Plano observado pelo proprietário:** em perfis descartáveis de Claude Code e Codex, registrar o caminho mostrado no prompt de permissão e a decisão do host; não aprovar nem alterar o arquivo dummy.

## 8. Recomendação de companion e MCP de mesmo nome

**Fingerprint:** hooks/stilo-instructions.js:buildFullContext:companion-name-endorsement  
**Fronteira:** recomendação do plugin → MCP configurado pelo projeto e potencialmente não confiável.  
**Trilha:** AGENTS.md:233,244,245 → hooks/stilo-instructions.js:45,298 → hooks/stilo-activate.js:11. O texto recomenda context7 e playwright; o repositório não carrega nem identifica configuração MCP local.  
**Bloqueios:** carregamento, consentimento, identidade e seleção pelo host/agente não foram observados.  
**Plano local:** VM descartável sem rede externa, limites de processo/tempo e perfis novos de Claude Code/Codex. Configurar apenas no projeto dummy um MCP local inofensivo context7. Comparar duas sessões idênticas, uma com a recomendação e outra sem; usar somente o marcador sintético STILO_CANARY_A91. Registrar se o host carrega o MCP, que identidade/consentimento mostra, se o agente o seleciona e se a requisição contém o marcador. Servidor retorna documentação fixa e registra apenas nome da ferramenta e presença do marcador. Não usar credenciais, dados reais ou chamadas externas; interromper sem isolamento.  
**Plano observado pelo proprietário:** repetir em perfis descartáveis e sessões novas, comparar com sessão sem o bloco; registrar configuração, consentimento, seleção e marcador. Sem produção, credenciais ou serviços externos.