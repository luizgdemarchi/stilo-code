# Revisão editorial 01 — stilo-code

- **Modo:** incremental
- **Commit-base:** `4ced739` (base do ciclo `2026-11-02-dieta-superpowers-design`)
- **Revisado:** `eb34951`, working tree limpo
- **Objetivo e público:** prosa clara e exata para dois leitores: o agente que recebe
  `AGENTS.md` e `modules/` por injeção, e quem instala ou mantém o plugin (READMEs,
  `docs/`, comentários de código).
- **Revisor:** coordenador, revisão única, sem subagentes.

**Cobertura** (`git diff --stat 4ced739 HEAD`, só a prosa):

- `AGENTS.md`, `README.md`, `README.en.md`, `THIRD_PARTY_NOTICES.md`;
- `modules/`: `autoria-skill.md` (seção nova), `brainstorm.md`, `correcao.md`,
  `depuracao.md`, `design.md`, `encerramento.md`, `enxuto.md`, `especificacao.md`,
  `execucao.md`, `frontend.md`, `orquestracao.md`, `plano.md`, `revisor-editorial.md`,
  `revisor.md`, `subagente.md`, `tdd.md`;
- `docs/contrato-hooks.md` (seção 4 nova), `docs/preparacao-github-cli.md`,
  `docs/evidencias-template.md`, `docs/aceite.md` (linha 21);
- comentários adicionados em `hooks/` e `scripts/`;
- inconsistência com o que a mudança alterou: `hooks/stilo-activate.js` e
  `hooks/stilo-context.js`, para conferir o que o contrato e os comentários afirmam.

**Exclusões:** histórico (`.stilo/review-*.md`, `evidencias.md`, `progresso.md`, ciclos
encerrados e as renomeações para `docs/ciclos/`); `spec.md` e `plan.md` do ciclo ativo,
documentos de trabalho que viram histórico no `DONE`; `licenses/Apache-2.0.txt` e o texto
da licença MIT; manifestos (`plugin.json`, `package.json`), que mudaram só na versão; testes.

**Limitações:** as descrições dos manifestos ainda listam só `review ⇄ fix`, sem as fases
editoriais, mas o texto é anterior ao ciclo e fica fora do modo incremental.

## Resumo

3 achados: 0 crítico, 0 alto, 1 médio, 2 baixo.

## Achados

### 1. Contrato atribui ao `SessionStart` inteiro o que só a parte `fase` faz
- **Arquivo:** `docs/contrato-hooks.md:88`
- **Trecho:** "`SessionStart` | `session_id`, `cwd`" (`:88`); "O `SessionStart` passou a ler
  o stdin para saber a sessão e o `cwd`." (`:92`); "O `SessionStart` grava a fase injetada"
  (`:112`)
- **Contexto e efeito:** o texto foi escrito antes da divisão em duas partes. Hoje só `fase`
  lê o stdin e registra a sessão; `nucleo` sai sem ler o stdin, que no Windows pode não
  fechar (`hooks/stilo-activate.js:26-28`), e não registra (`:20`). Quem mantém os hooks e
  lê o contrato tende a "alinhar" o `nucleo` ao documento e trazer de volta a espera pelo
  stdin; o motivo de não ler está só no comentário do código.
- **Gravidade:** médio
- **Confiança:** alta
- **Correção mínima:** na tabela, `fase`: `session_id`, `cwd`; `nucleo`: nada. Em `:92`,
  "A parte `fase` do `SessionStart` passou a ler o stdin [...]. A parte `nucleo` não lê: no
  Windows o stdin pode não fechar, e ela usa o `cwd` do processo." Em `:112`, "A parte
  `fase` do `SessionStart` grava [...]".
- **Estado:** aberto

### 2. "Por isso" sem o passo que liga a causa ao adiamento do registro
- **Arquivo:** `README.md:94`
- **Trecho:** "A verificação falha quando o conteúdo mudou e a versão não; por isso o
  registro fica para depois do último `FIX`." (em `README.en.md:94-95`: "The check fails
  when content changed and the version did not, so the record waits until after the last
  `FIX`.")
- **Contexto e efeito:** falta a consequência que justifica a ordem: registrado antes, o
  registro fixa o conteúdo, e cada correção posterior, com a mesma versão, faz a
  verificação falhar. Sem esse passo, o leitor entende que a falha da verificação é o motivo
  de esperar, não o que acontece se não esperar. `modules/encerramento.md:14` diz isso em
  quatro palavras: "ele trava as correções do `FIX`".
- **Gravidade:** baixo
- **Confiança:** média
- **Correção mínima:** "A verificação falha quando o conteúdo muda e a versão não; feito
  antes do último `FIX`, o registro faria cada correção falhar." Em inglês: "The check
  fails when content changes and the version does not; recorded before the last `FIX`, the
  record would make every later fix fail it."
- **Estado:** aberto

### 3. Comentário promete rede de segurança que a parte `fase` não tem
- **Arquivo:** `hooks/stilo-instructions.js:503`
- **Trecho:** "Rede de segurança: os orçamentos dos módulos mantêm cada parte abaixo do
  limite, e a compactação só age se um texto crescer além do previsto."
- **Contexto e efeito:** na parte `fase`, todos os blocos são protegidos (o bloco de estado
  e todos os blocos dos módulos, `:500-501`), e `selectContextBlocks` devolve `null` quando
  os protegidos passam do orçamento (`hooks/stilo-context.js:35`); o texto sai completo. A
  compactação só socorre o `nucleo`. Quem aumentar um módulo confiando no comentário espera
  um corte que não vem; o que segura a parte `fase` é o teste de pior caso.
- **Gravidade:** baixo
- **Confiança:** alta
- **Correção mínima:** "Rede de segurança do `nucleo`: a compactação só age se o texto
  crescer além do previsto. Na parte `fase` todos os blocos são protegidos e nada é
  cortado; quem segura o limite são os testes de C05 e de pior caso."
- **Estado:** aberto

## Sem achado

`AGENTS.md`, os módulos de fase, `THIRD_PARTY_NOTICES.md`, `docs/preparacao-github-cli.md`,
`docs/evidencias-template.md` e `docs/aceite.md` foram lidos sem achado: frases curtas, com
o motivo junto da regra e termos estáveis entre núcleo, módulos e READMEs.
