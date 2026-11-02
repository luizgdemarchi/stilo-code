Gatilho: fase `PLAN`, junto com `plano.md`. Injetado pelo hook.

# Orquestração: tarefas, ondas e modelo

O plano é o contrato da execução. O que não estiver declarado aqui o coordenador não
consegue paralelizar com segurança.

## Contrato da tarefa

```text
### Tarefa T01 — título
ID: T01
Especialista: <área>
Files:
- Create|Modify|Delete|Rename: caminho/exato
Depends-on: nenhum | T00, ...
Resources: nenhum | port:127.0.0.1:4173, db:teste, dir:out, profile:navegador
```

Caminho incerto (curinga, pasta, "a definir") deixa a tarefa em série, dependente de todas
as anteriores, porque não dá para provar que ela não colide com outra.

## Ondas

Duas tarefas só dividem uma onda quando não há dependência direta nem transitiva entre elas
e os arquivos e os recursos são disjuntos. Todo recurso é exclusivo: mesma porta (inclusive
aliases de loopback e bind curinga), mesmo banco, diretórios iguais ou pai e filho e mesmo
perfil de navegador conflitam. Tarefa sem `Resources:` recebe aviso e roda em série.
Paralelo é opcional: sem subagentes, as ondas rodam em série, na ordem do plano.

## Modelo e esforço

Classifique cada tarefa por complexidade, risco, ambiguidade e verificabilidade. A fase é um
sinal, não a classificação inteira.

- Edição mecânica verificável: o menor modelo adequado, esforço baixo.
- Lógica comum com teste: esforço médio.
- Arquitetura, segurança, permissões, dados ou incerteza alta: capacidade maior, esforço
  alto. Uma linha em autenticação não fica simples por ser curta.

A preferência explícita do usuário vence; sem ela, não pergunte a cada tarefa. Use só
combinações que a ferramenta oferece. Sem controle de modelo ou de esforço, use o disponível
e registre a limitação. Nunca afirme uma troca que a ferramenta não confirmou.

Registro de cada tarefa delegada:

```text
Classificação: lógica comum
Modelo solicitado: sonnet
Esforço solicitado: médio
Aplicação confirmada: não informada pela ferramenta
```

## Escalada

Quando a verificação falha, diagnostique antes de escalar.

- Ambiente (comando ausente, permissão, sandbox, rede, dependência, teste instável):
  corrija ou registre. Não troque de modelo por isso.
- Capacidade (resultado errado com o ambiente íntegro): escale modelo ou esforço uma vez,
  levando a evidência da falha. Se falhar de novo, o coordenador assume e registra o
  impedimento.
