# Relatório de auditoria de segurança — stilo-code

**Status:** auditoria concluída; validações de ambiente pendentes.  
**Alvo:** 6f014387f797ab32c336be662dcd260a23e64b68  
**Perfil e escopo:** standard, repositório inteiro (.). Sem orçamento definido; 40 invocações de agentes.  
**Execução:** o host não oferece sandbox de sistema operacional; nenhum código, hook, teste ou script do repositório-alvo foi executado. A análise foi estática. Uma sonda de resolução de executáveis já registrada, sem código do alvo, confirmou comportamento condicional do Node no Windows.  
**Runs anteriores:** nenhum.

## Resumo de segurança

Nenhuma vulnerabilidade foi confirmada nesta auditoria. Isso não demonstra ausência de vulnerabilidades: oito hipóteses com caminho de código sustentado permanecem needs_validation, pois dependem de comportamento de Claude Code/Codex, do agente, das permissões do sistema de arquivos ou de efeitos de leitura que não foram observados com segurança neste host. Nenhum registro recebeu severidade.

## Achados confirmados

Nenhum.

## Leads que exigem validação

| Fingerprint | Hipótese | Fato decisivo pendente |
|---|---|---|
| hooks/stilo-setup.js:probeGitHubCli:bare-name-gh-cwd-resolution | O probe SessionStart pode resolver um gh.exe do diretório do projeto. | cwd e ambiente realmente herdados pelo hook em cada host. |
| scripts/setup-github-cli.js:realRun:bare-name-installer-cwd-resolution | O instalador pode resolver um winget.exe do projeto. | cwd e NoDefaultCurrentDirectoryInExePath no processo do agente. |
| hooks/stilo-state.js:findStateFiles:unbounded-ancestor-walk | A descoberta pode escolher estado de um ancestral compartilhado. | Permissões de escrita no ancestral e efeito do estado no host/modelo. |
| hooks/stilo-instructions.js:sanitiza/repo-free-text-injected-without-provenance-label | Texto livre do checkpoint pode entrar no contexto sem rótulo de origem. | Como o host/modelo apresenta e interpreta esses campos. |
| hooks/stilo-state.js:readJsonObject:unbounded-readFileSync-checkpoint-special-file | O hook pode ler checkpoint grande ou especial sem limite. | Consumo de recursos e ação do timeout do host. |
| hooks/stilo-state.js:readStateResult:unbounded-readFileSync-state-special-file | A leitura de state.json pode bloquear ou consumir memória em certos sistemas de arquivos. | Efeito de symlink/FIFO/arquivo grande e encerramento do processo pelo host. |
| hooks/stilo-instructions.js:blocoEstado:write-repair-directive-to-unverified-state-identity | Instruções de reparo podem apontar para gravação através de symlink. | Como a ferramenta do agente resolve o destino e a permissão de escrita. |
| hooks/stilo-instructions.js:buildFullContext:companion-name-endorsement | Uma recomendação de companion pode parecer endosso a MCP local de mesmo nome. | Carregamento, consentimento, identidade do servidor e seleção pelo agente. |

Planos delimitados, fontes e bloqueios completos estão em NEEDS-VALIDATION.md. Não foi feito tráfego para serviços nem teste em ambiente de produção.

## Cobertura

O ledger final contém 21 unidades: 10 covered, 10 candidate, 1 not_applicable, nenhuma blocked e nenhuma deferred. A unidade not_applicable trata de hooks/stilo-diagnostics.js, cujo diagnóstico não tem chamador nas superfícies incluídas neste commit. O crítico pós-onda 4 e o crítico final, distintos, não aceitaram unidades faltantes ou reatribuições. As unidades candidate continuam visíveis porque seus registros requerem validação externa; isso não é cobertura confirmada de comportamento de runtime.

## Observações de hardening — não são achados confirmados

- Adicionar guarda explícita para CLAUDE_PLUGIN_ROOT vazio nos comandos dos hooks, embora os hosts documentados forneçam a variável.
- Os arquivos de estado .stilo estão versionados apesar da intenção descrita no .gitignore; a origem do plugin aponta para a raiz inteira do repositório.
- Limitar tamanho e tipo dos arquivos de estado/checkpoint antes de leituras síncronas.
- Vincular checkpoint ao estado ativo (fase, ciclo e, quando aplicável, HEAD) antes de inserir texto livre no contexto.
- Exigir aprovação explícita do usuário antes de orientar a instalação do GitHub CLI; o fluxo atual depende do portão de permissão do host.
- O escritor writeJsonAtomic não tem chamador nos hooks atuais; se for conectado no futuro, exigir criação exclusiva e validação de contenção dos diretórios.

## Padrões positivos observados

- Os manifests registram apenas hooks; não declaram servidores MCP, comandos, skills ou permissões adicionais.
- Os hooks limitam-se à injeção de contexto (SessionStart, UserPromptSubmit e SubagentStart); a saída não decide permissões nem aprova ferramentas.
- O pacote não declara dependências nem scripts de instalação npm.
- O caminho de instalação usa lock de criação exclusiva e gravação atômica do receipt.

## Verificação estrutural

parent-validate.cjs aprovou findings.json com 8 registros e coverage-ledger.json com 21 unidades. Os oito registros foram revalidados por verificadores independentes na Fase 5. Três receberam refinamentos não materiais; a correção material do destino da trilha de checkpoint foi confirmada por verificação independente adicional. Todos os registros finais continuam needs_validation.