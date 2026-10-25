Carregue somente nas fases `PLAN`, `EXECUTE`, `REVIEW` e `FIX`.

# Orquestração multiagente

Cada tarefa declara `ID`, descrição, especialista, `Files:` com caminhos exatos e `Depends-on:`.

Antes de delegar, o coordenador verifica as capacidades expostas pela ferramenta e classifica
a tarefa por complexidade, risco, ambiguidade, contexto necessário e verificabilidade. A fase
é um sinal, não a classificação inteira. Escolhas explícitas do usuário prevalecem.
Sem preferência explícita, não pergunte o modelo a cada tarefa. Modelo e esforço são
decisões separadas e usam somente combinações suportadas. Para toda tarefa, escolha o modelo
menos exigente que ainda seja adequado entre os modelos disponíveis.

- Edição mecânica verificável: menor modelo adequado e esforço baixo.
- Lógica comum: esforço médio.
- Arquitetura, segurança, revisão crítica ou incerteza alta: capacidade maior e esforço alto suportado.

Tamanho não substitui risco: uma linha em autenticação, permissões, dados ou operação
destrutiva não é simples só por ser curta.

O coordenador aplica a preferência explícita, escolhe uma combinação suportada, registra o
contrato, delega apenas uma tarefa concreta e delimitada quando o custo da delegação se
justificar e valida o resultado. O registro usa:

```text
ID: T01
Especialista: instruções
Files: modules/orquestracao.md
Depends-on: nenhum
Classificação: lógica comum
Modelo solicitado: modelo disponível adequado
Esforço solicitado: médio
Justificativa: altera o contrato de delegação
Aplicação confirmada: não informada pela ferramenta
Validação: teste direcionado
Escalada: nenhuma
```

Se o modelo solicitado não existir, ou se não houver controle de modelo ou controle de
esforço, use o recurso disponível e relate a limitação; não invente equivalência nem alegue
uma troca que a ferramenta não confirmou. Sem subagentes, execute em série.

Quando a validação falhar, diagnosticar a causa antes de escalar. Falha de capacidade permite
escalar modelo ou esforço uma vez, levando a evidência da falha. Falha de ambiente não provoca escalada.
Se a escalada terminar sem sucesso, o coordenador reassume e registra o impedimento.

Ambiente: comando ausente, permissão ou sandbox, rede, dependência ou teste instável.

Capacidade: resultado errado com o ambiente íntegro.

Tarefas só compartilham uma onda quando não há dependência direta ou transitiva e os conjuntos de arquivos são totalmente disjuntos.

Marcação incerta ou não exata depende de todas as tarefas anteriores e roda em série.

Implementadores editam e reportam, mas não fazem commit.

Revisores não escrevem no código.

O coordenador espera todos, captura `HEAD` antes de cada commit, commita em ordem e só então libera a revisão.

Worktree isolada é último recurso quando a separação por arquivo não for possível.

## Recursos exclusivos

Declare `Resources: nenhum` ou identificadores separados por vírgula após Depends-on:
`port:127.0.0.1:4173, db:teste, dir:out, profile:navegador`. Todos são exclusivos.
Independência exige arquivos, dependências e recursos disjuntos. Diretórios iguais,
pai/filho, aliases de loopback e bind curinga na mesma porta conflitam. Caminhos são
normalizados lexicalmente, sem resolver symlinks; identidade real incerta requer revisão.
Legado sem a linha recebe aviso e barreira serial antes/depois; dependência futura que
impeça essa ordem exige corrigir o contrato. Nunca esconder colisão de arquivos por isso.
Só um responsável possui cada recurso até encerrar seu uso.

Recuperação interrompida: compare checkout e evidências; confirme que o escritor anterior
parou antes de assumir seus arquivos. Sem essa confirmação, continue apenas trabalho
independente. Não descarte mudanças locais nem use relato de sucesso como prova.

## Cenários de decisão

- Edição mecânica: alteração repetitiva e verificável usa a menor capacidade adequada.
- Lógica comum: mudança de comportamento com teste usa esforço médio.
- Arquitetura: decisão transversal usa capacidade maior e esforço alto suportado.
- Permissões: mesmo uma alteração curta não é classificada como simples.
- Preferência explícita: o pedido do usuário substitui a escolha automática quando suportado.
- Ausência de subagentes: o coordenador executa em série.
- Sem controle de modelo ou sem controle de esforço: usar o disponível e registrar a limitação.
- Falha de capacidade: escalar uma vez e validar de novo.
- Falha de ambiente: corrigir ou registrar o ambiente sem mudar modelo por si só.
