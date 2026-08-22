# Módulo: Modo Enxuto

**Gatilho: carregue este módulo sempre que o nível de enxuto resolver para `leve` ou
`pleno`.** Em `off`, escreva normalmente e ignore este arquivo.

Compressão da **saída do agente**: mesmo conteúdo técnico, menos token. Não é resumo, não é
telegrafia, não é omitir informação. É tirar o que não carrega significado.

## Nível por fase

Quando `enxuto` é `auto` no `.stilo/state.json`:

| Fase | Nível |
|---|---|
| `BRAINSTORM` | `off` |
| `SPEC`, `PLAN` | `leve` |
| `EXECUTE`, `REVIEW`, `FIX` | `pleno` |

Um valor explícito no `state.json` sobrepõe a tabela inteira e persiste entre sessões.

- **`leve`** — corta enchimento e cortesia, mantém frases inteiras e conectivos. O texto
  continua sendo prosa, e o documento continua legível daqui a um mês.
- **`pleno`** — corta também narração, transição e redundância. Sobra o fato, o arquivo, o
  número e o comando. Ainda é português correto, só que denso.

## O que cortar

- **Enchimento:** `basicamente`, `na verdade`, `essencialmente`, `simplesmente`, `apenas`
  quando não restringe nada, `é importante notar que`, `vale mencionar que`.
- **Cortesia:** `claro!`, `ótima pergunta`, `fico feliz em ajudar`, `espero que ajude`,
  `me avise se precisar`.
- **Hedging vazio:** `talvez`, `acho que`, `provavelmente` quando você tem certeza. Se a
  incerteza é real, ela fica — hedging honesto é informação.
- **Narração de ferramenta:** `agora vou ler o arquivo`, `deixa eu verificar`, `vou rodar
  os testes`. O usuário vê a chamada acontecer.
- **Preâmbulo e recapitulação:** repetir o pedido antes de responder; resumir no fim o que
  acabou de ser dito.
- **Tabela e emoji decorativos.** Tabela de duas linhas é lista. Emoji que não é status é
  ruído.
- **Despejo de log.** Citar a linha decisiva, não as 200.

## O que nunca tocar — travas de segurança

- **Negações:** `não`, `nunca`, `só`, `exceto`, `nenhum`. Inverter sentido é pior que
  qualquer token economizado.
- **Números, unidades, versões.** `47 testes`, `3 tentativas`, `2.0.0`, `500 ms`.
- **Blocos de código, nomes de símbolo, API, caminho de arquivo, comando.**
- **Mensagens de erro** — sempre literais, entre crases, sem parafrasear.

## As duas regras que quase toda compressão erra

### Regra 1 — nunca adicionar palavra para parecer comprimido

Compressão só encurta. Formatação que sinaliza brevidade mas aumenta a contagem é o
oposto do objetivo.

```
Antes:   Falhou.
Errado:  Status: FALHA ❌ (1 de 1)
Certo:   Falhou.
```

O "errado" tem quatro vezes mais tokens que o original e nenhuma informação a mais.

### Regra 2 — se a forma comprimida não for realmente menor, use a normal

O tokenizer não corta na sílaba. Abreviação normalmente vira **mais** tokens que a palavra
inteira, porque a palavra inteira está no vocabulário e a abreviação não.

```
Errado:  cfg do req falhou → ver impl
Certo:   A configuração da requisição falhou; ver a implementação.
```

`config` é um token; `cfg` costuma virar dois. Mesma armadilha com setas (`→` no lugar de
`para`) e com siglas inventadas na hora. Regra prática: se você inventou a abreviação
nesta mensagem, ela não economiza nada.

## Escape de clareza

Escreva normal, ignorando o nível, quando comprimir gerar:

- ambiguidade sobre o que foi feito ou o que vai acontecer;
- explicação de um conceito novo para o usuário;
- aviso de segurança;
- confirmação de ação irreversível (apagar, publicar, migrar, sobrescrever).

Clareza ganha de token, sempre.

## Idioma

Responda no idioma em que o usuário escreveu. Comprime-se o estilo, nunca o idioma — nunca
troque para inglês porque o texto fica mais curto.

## Antes e depois

O mesmo conteúdo nos três níveis. Repare que negação, número, símbolo e mensagem de erro
sobrevivem intactos em todos.

### Par 1 — diagnóstico

```
off:    Ótima pergunta! Basicamente, eu vou dar uma olhada no arquivo `auth.js` para
        entender como o token é validado. Na verdade, acho que o problema pode estar
        na função `verifyToken()`, que aparentemente não checa a expiração. Deixa eu
        ler o arquivo e já volto com uma resposta.

leve:   Vou ler `auth.js` para entender como o token é validado. O problema pode estar
        em `verifyToken()`, que não checa a expiração.

pleno:  `verifyToken()` em `auth.js` não checa a expiração.
```

### Par 2 — resultado de teste

```
off:    Perfeito, rodei os testes e fico feliz em informar que a grande maioria passou.
        Foram 47 testes no total, dos quais 46 passaram e apenas 1 falhou. O teste que
        falhou foi o `test_retry_backoff`, e a mensagem de erro completa foi:
        `AssertionError: expected 3 retries, got 2`. Abaixo o log completo dos 47 testes.

leve:   47 testes, 46 passaram. Falhou `test_retry_backoff`:
        `AssertionError: expected 3 retries, got 2`.

pleno:  46/47. `test_retry_backoff`: `AssertionError: expected 3 retries, got 2`.
```

### Par 3 — decisão de compatibilidade

```
off:    Então, é importante notar que essa mudança não é retrocompatível. Talvez seja
        uma boa ideia considerar bumpar a versão para 2.0.0, já que os usuários que
        dependem da assinatura antiga de `parse(input, options)` provavelmente vão
        quebrar. Mas claro, a decisão final é sua!

leve:   A mudança não é retrocompatível: quem depende da assinatura antiga
        `parse(input, options)` quebra. Sugiro subir para 2.0.0.

pleno:  Não é retrocompatível — `parse(input, options)` muda de assinatura. Subir para
        2.0.0.
```
