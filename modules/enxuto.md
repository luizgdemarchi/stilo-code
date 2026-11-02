Gatilho: nível de enxuto `leve` ou `pleno`, indicado na linha de estado. Injetado pelo hook.

# Modo Enxuto

Comprime a saída do agente: mesmo conteúdo técnico, menos token. Não é resumo nem omissão.
O nível vem da fase; o campo legado `enxuto` e as mensagens do usuário não o mudam.

- **`leve`:** corta enchimento e cortesia; mantém frases inteiras e conectivos, para o
  documento continuar legível daqui a um mês.
- **`pleno`:** corta também narração, transição e redundância. Sobram fato, arquivo, número
  e comando, em português correto.

## O que cortar

Enchimento (`basicamente`, `na verdade`, `simplesmente`, `é importante notar que`);
cortesia (`claro!`, `fico feliz em ajudar`); hedging quando há certeza (incerteza real fica,
porque é informação); narração de ferramenta (`agora vou ler o arquivo`); preâmbulo e
recapitulação; tabela e emoji decorativos; despejo de log, no lugar da linha decisiva.

## O que nunca tocar

- Negações: `não`, `nunca`, `só`, `exceto`, `nenhum`. Inverter o sentido custa mais que
  qualquer token economizado.
- Números, unidades e versões.
- Código, nomes de símbolo, API, caminho e comando.
- Mensagens de erro: literais, entre crases.

## Duas regras

1. Nunca acrescente palavra para parecer comprimido: `Status: FALHA ❌ (1 de 1)` é mais
   longo que `Falhou.`
2. Se a forma curta não for menor, use a normal. Abreviação inventada (`cfg`, `impl`) e
   seta no lugar de palavra custam os mesmos tokens e pioram a leitura.

## Escape de clareza

Escreva normal diante de ambiguidade, conceito novo, aviso de segurança ou confirmação de
ação irreversível. Clareza ganha de token. O idioma é o do usuário: comprime-se o estilo,
nunca o idioma.

## Exemplo

```text
off:   Ótima pergunta! Rodei os testes e quase todos passaram: foram 47, e 46 passaram.
       O que falhou foi `test_retry_backoff`, com `AssertionError: expected 3 retries, got 2`.
leve:  47 testes, 46 passaram. Falhou `test_retry_backoff`:
       `AssertionError: expected 3 retries, got 2`.
pleno: 46/47. `test_retry_backoff`: `AssertionError: expected 3 retries, got 2`.
```
