# Preparação do GitHub CLI

A primeira ativação suportada do Stilo orienta o agente a executar o preparador interno,
fora do timeout de 5 segundos dos hooks. `/plugin install` não é presumido como execução
de scripts npm. Copiar AGENTS.md usa as ferramentas normais do agente para preparar gh;
o arquivo sozinho não instala executáveis. Sem acesso, registrar a causa e próximo passo.

O preparador reutiliza gh existente sem atualizar. Detecta versão em até 1.000 ms por
processo; instala uma vez, em até 180.000 ms, e só confirma sucesso após executar gh.
Não inicia login, não solicita token nem altera contas. Autenticação é etapa posterior.

| Ambiente | Método e limites |
|---|---|
| Windows | WinGet existente, pacote exato GitHub.cli da fonte winget, execução sem interação |
| macOS | Homebrew existente, brew install gh, sem autoatualização do gerenciador |
| Linux | apt/dnf existentes, pacote em repositório já configurado; privilégio aprovado pelo host |
| Outros | Pendência com causa e [instruções oficiais](https://github.com/cli/cli#installation) |

Não adiciona repositórios, chaves, gerenciadores, Git ou companions. Rede/permissão
indisponível vira pendência; pipeline continua. Windows pode exigir nova janela para
atualizar PATH; a validação alternativa usa somente o diretório padrão GitHub CLI de
Program Files, nunca um caminho fornecido pelo receipt.

Estado local em ~/.stilo/setup/github-cli.json, lock exclusivo github-cli.lock. STILO_HOME
pode apontar para diretório isolado em testes. Receipt inválido não é sobrescrito.
Após falha/pendência, não há retry automático; novo pedido explícito permite --retry.
Lock de proprietário desconhecido exige conferência manual. Timeout conserva lock se não
houver confirmação de parada, inclusive de instaladores descendentes. Nunca apagar lock
para contornar processo ativo. Detecção de gh instalado posteriormente continua permitida.

Testes usam executores simulados e temporários exclusivos, nunca gerenciadores reais.
Esses testes comprovam fluxo, não instalação real em cada SO. Verificação viva deve usar
ambiente descartável e registrar versão/resultado separadamente de autenticação.

Opções conferidas em 2026-10-19: [WinGet install](https://learn.microsoft.com/en-us/windows/package-manager/winget/install),
[gh Windows e PATH](https://github.com/cli/cli/blob/trunk/docs/install_windows.md),
[macOS](https://github.com/cli/cli/blob/trunk/docs/install_macos.md),
[Linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md).
