# Review 19 — README overview-first

Revisado: `HEAD 0b1485d4f3746b3e921d55b1682f4db79dc70b39` mais diff unstaged em
`README.md`, `README.en.md`, `spec.md`, `plan.md`, `.stilo/state.json` e
`.stilo/execution-checkpoint.md`.
Cobertura e exclusões: leitura dos dois READMEs contra `spec.md` § 19, plano ativo,
`AGENTS.md` e os manifestos publicados; verificados links relativos, hosts, sequência e
escopo. Não foram executados código ou testes. Arquivos de código e documentos ligados
ficaram fora do escopo.
Contra: `spec.md` § 19 e emenda ativa em `plan.md`.

## Resumo

1 achado: 0 crítico, 0 alto, 0 médio, 1 baixo.

## Achados

### 1. Esclarecer que documentos de continuidade podem não existir

- **Arquivo:** `README.md:22` e `README.en.md:22`
- **Gravidade:** baixo
- **O que quebra:** em projetos sem checkpoint, a lista de documentos de continuidade pode sugerir que todos são obrigatórios, embora `AGENTS.md` diga que um checkpoint ausente não exige criá-lo.
- **Como corrigir:** qualificar a frase com “quando existem” e “when present”.
- **Evidência:** leitura comparativa com a regra “Um checkpoint ausente não exige recomeçar nem criar checkpoint obrigatório” em `AGENTS.md`; revisão independente confirmou o mesmo cenário.
- **Confiança:** alta
- **Contraprova verificada:** nenhum requisito da spec torna checkpoints obrigatórios; o texto de retomada já permite conferir o estado e os arquivos presentes.
- **Classificação:** sugestão
- **Origem:** introduzido
- **Estado:** corrigido em `README.md:22` e `README.en.md:22`; a frase agora diz que os documentos são preservados quando existem.

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 55 | Abertura identifica produto, hosts e função | atendido |
| 56 | Fluxo, estado persistido e retomada após `/clear` | atendido |
| 57 | Instalação após a visão geral para ambos os hosts | atendido |
| 58 | Hierarquia equivalente nos dois idiomas | atendido |
| 59 | Links internos existentes | atendido |
| 60 | Alterações de produto restritas aos READMEs; sem hosts removidos; diff sem whitespace inválido | atendido; artefatos de spec/plano/estado/checkpoint são metadados exigidos pelo pipeline |
