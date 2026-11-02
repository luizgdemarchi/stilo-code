# Auditoria de segurança obrigatória — Stilo Code

> Status: design do BRAINSTORM aprovado pelo usuário em 2026-10-24. Ordem combinada: este ciclo só começa
> depois do ciclo de seleção de modelo/esforço (em `PLAN`) e da remoção dos agentes que não
> são Claude Code nem Codex.

## Contexto e porquê

O pipeline termina hoje com `REVIEW/FIX` focado em corretude, mais uma auditoria opcional de
simplificação. Nada procura vulnerabilidades. O usuário quer que todo projeto passe por um
audit de segurança de qualidade profissional antes de terminar, usando a metodologia da skill
[`cloudflare/security-audit-skill`](https://github.com/cloudflare/security-audit-skill), e
aceita o custo alto em tokens e agentes porque espera que isso ajude muito no uso real.

A skill foi revisada inteira antes deste design (docs de fluxo, índice de ataques, schema,
validadores e seus testes). Veredito: o método é bom — verificador independente para cada
candidato, gravidade calibrada por impacto demonstrado, rejeição explícita de ruído de
checklist, ledger de cobertura e rodadas incrementais. Mas não roda inteiro no ambiente do
usuário sem adaptação:

1. Os dois validadores abortam no Windows com
   `OS no-follow and nonblocking input protection is unavailable` (`fs.constants.O_NOFOLLOW`
   e `O_NONBLOCK` não existem lá). No Windows: 46 testes passam, 7 falham por esse motivo,
   12 são pulados.
2. `confirmed` exige execução local num sandbox com rede bloqueada, ambiente limpo, alvo
   somente-leitura, escrita só em `scratch/` e limites de CPU, memória, processos, disco e
   tempo. Sem isso, todo achado real fica `needs_validation`.
3. O procedimento de promoção de evidência (`scratch/` → `artifacts/`, 11 regras no-follow)
   é descrito, mas não implementado: o agente teria de escrevê-lo a cada rodada.
4. Pela própria Cloudflare, uma rodada encontra cerca de metade do que rodadas repetidas
   encontram. "Zero achados" significa "zero achados nesta rodada".

## Objetivos

- Nenhum projeto chega a `DONE` sem um audit de segurança completo e limpo.
- O audit tem a mesma qualidade da metodologia da Cloudflare, no perfil `standard`.
- Funciona em Claude Code e Codex, inclusive no Windows, sem instalar nada além do Node, que
  o Stilo já exige.

## Não-objetivos

- Não suportar outros agentes. A remoção deles é um ciclo próprio, anterior a este.
- Não usar Docker, VM ou qualquer ferramenta extra como sandbox.
- Não oferecer os perfis `quick` ou `deep`, nem permitir escolher o perfil.
- Não mudar o critério do review de código normal (continua: nenhum `crítico` nem `alto`).
- Não mexer na auditoria opcional de simplificação, que continua no `DONE`.
- Não aplicar correções durante o audit: a skill descreve a correção; o `FIX` aplica.

## Anti-objetivos (falha mesmo funcionando)

- Um projeto chegar a `DONE` com achado `confirmed` sem correção.
- Código do projeto auditado ser executado sem sandbox verificado.
- Relatório com detalhes de exploração ir parar no git.
- Um subagente do audit se comportar como coordenador do Stilo ou disparar outro audit.
- O Stilo afirmar que um sandbox, modelo ou subagente está ativo sem ter verificado.

## Decisões do usuário

1. **Obrigatório.** O audit é um portão antes de `DONE`, em todo ciclo.
2. **Metodologia completa da Cloudflare**, copiada para dentro do Stilo. A arquitetura da
   skill pode ser mudada onde for necessário.
3. **Sempre `standard`.**
4. **Bloqueio:** qualquer achado `confirmed` com gravidade `critical`, `high`, `medium` ou
   `low` impede `DONE` e manda o projeto para `FIX` → `REVIEW` → audit de novo.
5. **`needs_validation` não bloqueia** e não precisa ser validado obrigatoriamente.
   Para `confirmed` não existe dispensa: nem o usuário nem o agente podem aceitar o risco e
   seguir para `DONE` ("só entra em `DONE` quando não tiver nenhum erro").
6. **Só Claude Code e Codex** (ambos têm subagentes).
7. **Sem Docker e sem instalação extra.** O sandbox é o do próprio CLI mais as proteções que o
   Stilo traz em Node, sem exigir limite de CPU e memória.

## Escolhas do designer (marcadas para revisão do usuário)

- **Fase nova `SECURITY`** entre `REVIEW` e `DONE`. Transições: `REVIEW` limpo → `SECURITY`;
  `SECURITY` sem bloqueio → `DONE`; `SECURITY` com bloqueio → `FIX` → `REVIEW` → `SECURITY`.
  Modelo profundo. Modo Enxuto `pleno` na saída de conversa, nunca aplicado aos artefatos nem
  ao JSON da skill.
- **`informational` não bloqueia.** A própria skill o define como observação de impacto
  mínimo; ele aparece no resumo.
- **Rodada `incomplete` bloqueia `DONE`.** O Stilo não define `budget`, então a skill roda o
  `standard` até o fim; um `incomplete` só aparece por falha real (validação ou independência
  indisponível), e o resumo diz o motivo.
- **Saída em `<projeto>/.stilo/security/run-<N>/`**, com `N` igual ao próximo inteiro livre,
  para as rodadas anteriores servirem de entrada incremental. Antes da primeira rodada, o
  Stilo cria `.stilo/security/.gitignore` contendo `*`, o que torna a pasta inteira ignorada
  pelo git em qualquer projeto, e confere com `git check-ignore`. Isso cumpre a condição da
  skill para escrever dentro do alvo. Em projeto sem git, a condição é tratada como cumprida.
  Os relatórios nunca são versionados.
- **A fase `SECURITY` é o pedido explícito de audit completo** que a skill exige para o modo
  full audit; o diretório de saída acima é a seleção explícita do usuário.
- **A cópia da skill fica fora de `skills/`**, para não virar skill invocável nem disparar
  sozinha em perguntas sobre segurança (o `AGENTS.md` § 11 diz que o Stilo não tem skill
  invocável). Local sugerido: `vendor/security-audit/`. O agente usa sempre essa cópia,
  mesmo que a skill original esteja instalada.
- **Sem subagentes disponíveis** (por exemplo, Codex com a função desligada), o audit não roda
  em modo degradado: a rodada fica `incomplete`, bloqueia `DONE`, e o Stilo diz como ligar
  (no Codex, em algumas versões, por `/experimental`).
- **Na fase `SECURITY`, o `SubagentStart` não injeta o ruleset do Stilo.** Hoje o hook
  injeta `AGENTS.md` e os módulos em todo subagente; nessa fase todo subagente é do audit, e
  hunters e verificadores precisam receber só o prompt exato da skill — jamais o módulo de
  segurança, senão cada hunter tentaria rodar outro audit.
- **Escopo de toda rodada: o repositório inteiro do projeto**, nunca uma rodada parcial (uma
  rodada com escopo reduzido é cobertura parcial pela própria skill). As rodadas anteriores
  entram como evidência incremental.
- **Sem efeito retroativo:** projetos já em `DONE` quando a mudança chegar não voltam; o
  portão vale na próxima saída de `REVIEW`.

## A cópia adaptada da skill

- Base fixada no commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` da Cloudflare (MIT).
- Mantém `LICENSE` original e ganha um arquivo de adaptações listando cada arquivo mudado e o
  porquê. Arquivos não listados ali continuam idênticos ao upstream, e um teste confere isso
  por hash.
- Adaptações:
  1. **Leitura segura no Windows** nos dois validadores: onde `O_NOFOLLOW`/`O_NONBLOCK` não
     existem, rejeitar link simbólico, junction e outros reparse points, arquivo não regular e
     `nlink` maior que 1; comparar a identidade do arquivo (`dev`/`ino`, tamanho) antes e
     depois da leitura. No POSIX, o comportamento original não muda. Os testes da skill
     passam no Windows e no POSIX.
  2. **Promoção de evidência pronta e testada**: um script que implementa as 11 regras de
     promoção com o mesmo nível da adaptação 1 no Windows e o original no POSIX, para o
     agente nunca improvisar esse código.
  3. **`standard` fixo**: os trechos de escolha de perfil passam a dizer que, no Stilo, o
     perfil é sempre `standard`.
  4. **Sandbox composto** (próxima seção) no lugar da exigência de limite de CPU, memória,
     processos e disco.
  5. **Integração com o Stilo**: diretório de saída, pedido explícito de full audit e regras
     de bloqueio.
- Atualizar a partir do upstream é manual e documentado: trazer o commit novo, reaplicar as
  adaptações, atualizar o commit fixado e os hashes.

## Sandbox composto

Executar código do projeto auditado só é permitido quando as duas camadas estão presentes:

1. **Sandbox do CLI ligado e verificado.** Claude Code: `/sandbox`, disponível no macOS,
   Linux e WSL2; não existe no Windows nativo. Codex: sandbox do próprio CLI, incluindo o
   Windows nativo no PowerShell. Antes de qualquer execução, o Stilo roda uma sonda pela
   mesma ferramenta de shell que o agente usa e exige que **conexão de saída para a internet
   falhe** e que **escrita fora do projeto e da pasta temporária falhe**. Se alguma das duas
   passar, não há sandbox.
2. **Proteções do Stilo em Node**, sem instalar nada: execução numa cópia descartável do
   projeto dentro do `scratch/` do agente; ambiente vazio preenchido por lista permitida, com
   `HOME`, pastas temporárias e caches apontando para o `scratch/`; limite de tempo e de
   tamanho de saída; só dados falsos; nenhuma chamada a serviço real ou publicado.

Sem a camada 1, nada roda: o achado fica `needs_validation` (que não bloqueia) e o relatório
diz como ligar o sandbox.

A sonda roda no mesmo agente que vai executar, imediatamente antes da execução — não basta
o coordenador ter passado nela, porque a documentação do Claude Code não garante que o
sandbox vale para subagentes. Execução do audit nunca usa o retry fora do sandbox
(`dangerouslyDisableSandbox` ou equivalente no Codex); o resumo recomenda
`allowUnsandboxedCommands: false` no Claude Code.

Riscos aceitos pelo usuário: não há limite de CPU, memória, processos nem disco (o limite de
tempo cobre processo travado); o projeto original não fica somente-leitura no nível do
sistema operacional, porque os sandboxes dos CLIs permitem escrita na pasta de trabalho — a
cópia descartável reduz, mas não elimina, esse risco. Consequência na máquina do usuário:
Claude Code no Windows nativo nunca confirma achados por execução; Codex no PowerShell ou
Claude Code no WSL2 confirmam.

## O que o usuário recebe

Ao fim de cada rodada, um resumo curto na conversa: rodada e caminho, status
`complete`/`incomplete` com motivo, contagem por gravidade, lista de `confirmed` que
bloqueiam, lista de `needs_validation` (com o fato que falta e o plano de validação que a
skill escreve) e `informational`. Se houver bloqueio, a próxima fase é `FIX`; cada achado
`confirmed` recebe uma resolução registrada dentro da pasta da rodada, e só a rodada seguinte
prova que foi corrigido.

## Fica para o builder

- Nomes exatos de arquivos e scripts (`modules/seguranca.md`, sonda, executor, promoção,
  arquivo de adaptações).
- Como o hook injeta o caminho absoluto da cópia da skill no módulo de segurança.
- Lista exata de variáveis permitidas por plataforma no executor.
- Se a cópia descartável inclui `node_modules` e similares (a skill proíbe instalar
  dependências, então o que for necessário tem de vir copiado).
- O destino da sonda de rede, desde que não envie dados nem tráfego de audit.
- Onde registrar a resolução de cada achado durante o `FIX`.
- Atualizações em `AGENTS.md` (fases, tabelas de modelo, módulos, Enxuto, `/clear` seguro),
  `state.json`, hooks, adaptadores Claude/Codex, READMEs, `docs/aceite.md` e testes,
  incluindo o orçamento de contexto injetado (o módulo de segurança precisa caber nele).

## Validação

- Transições de fase: `REVIEW` limpo → `SECURITY`; bloqueio → `FIX`; limpo → `DONE`;
  `state.json` aceita `SECURITY`.
- Bloqueio: um `findings.json` de exemplo com `confirmed` `low` bloqueia; só
  `needs_validation` e `informational` não bloqueiam; `incomplete` bloqueia.
- Validadores e promoção: testes da skill passam no Windows e no POSIX; links simbólicos,
  junctions, hard links e arquivos acima do limite são rejeitados.
- Sandbox: a sonda reprova um ambiente sem sandbox (rede aberta ou escrita fora permitida) e
  nenhuma execução acontece nesse caso.
- Integridade da cópia: arquivos não adaptados batem por hash com o upstream fixado.
- Subagentes da fase `SECURITY` não recebem o ruleset nem o módulo de segurança.
- `.stilo/security/` fica ignorado pelo git num projeto sem `.gitignore` próprio.
- Teste vivo: uma rodada completa num projeto pequeno com uma vulnerabilidade plantada, em
  Claude Code e em Codex.
