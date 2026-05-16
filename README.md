# Codificacao Script

Automacao em Google Apps Script para atualizar status em uma planilha do Google Sheets com base na data de entrada e no prazo calculado.

## Objetivo

A funcao `atualizarStatusPersonalizado()` percorre a primeira aba da planilha ativa, calcula o prazo de avaliacao e atualiza os status conforme regras simples de acompanhamento.

## Estrutura esperada da planilha

A primeira linha deve ser usada como cabecalho. Os dados comecam na linha 2.

| Coluna | Uso |
| --- | --- |
| E | Status atual |
| F | Data de entrada |
| G | Prazo calculado automaticamente |

## Regras de status

- A coluna G recebe automaticamente a data de entrada da coluna F + 6 dias.
- Quando o status contem `Periodo de Avaliacao` e a data atual chega ao prazo da coluna G, o status muda para `Aguardando TAG`.
- Quando o status contem `Aguardando TAG` e ja passaram 14 dias desde a data de entrada, o status muda para `Prazo expirado para TAG`.
- Os status `Ativo`, `Ban`, `Banido` e `Sob analise` sao ignorados por correspondencia exata apos normalizacao de acentos, maiusculas e espacos.

> Exemplo importante: `Inativo` nao e tratado como `Ativo`, porque a comparacao deixou de usar busca parcial para status ignorados.

## Arquivos

- `Code.gs`: codigo principal do Apps Script.
- `appsscript.json`: manifesto do projeto com runtime V8 e timezone `America/Bahia`.
- `README.md`: documentacao de uso.

## Como instalar

1. Abra a planilha no Google Sheets.
2. Acesse `Extensoes` > `Apps Script`.
3. Crie ou substitua o arquivo `Code.gs` pelo conteudo deste repositorio.
4. Se estiver usando o manifesto, copie tambem o conteudo de `appsscript.json`.
5. Salve o projeto.
6. Execute `atualizarStatusPersonalizado()` uma vez pelo editor para conceder as permissoes solicitadas.

## Gatilho recomendado

Para que a atualizacao acompanhe a passagem dos dias, crie um gatilho por tempo:

1. No editor do Apps Script, abra `Gatilhos`.
2. Adicione um novo gatilho para a funcao `atualizarStatusPersonalizado`.
3. Escolha origem `Baseado em tempo`.
4. Selecione execucao diaria, preferencialmente no inicio do dia.

## Cenarios de teste manual

Use uma planilha de teste e preencha as colunas E, F e G a partir da linha 2.

| Status inicial | Data de entrada | Resultado esperado |
| --- | --- | --- |
| `Periodo de Avaliacao` | Hoje - 6 dias | Status muda para `Aguardando TAG`; G recebe entrada + 6 dias |
| `Periodo de Avaliacao` | Hoje - 12 dias | Status muda para `Aguardando TAG`; nao expira na mesma execucao |
| `Aguardando TAG` | Hoje - 14 dias | Status muda para `Prazo expirado para TAG` |
| `Ativo` | Qualquer data valida | Status nao muda |
| `Inativo` | Qualquer data valida | Nao e confundido com `Ativo`; so muda se alguma regra futura corresponder |
| `Banido` | Qualquer data valida | Status nao muda |
| `Sob analise` | Qualquer data valida | Status nao muda |
| vazio | Qualquer data | Linha ignorada |
| qualquer status | Data invalida ou vazia | Linha ignorada e registrada no `Logger` |

Os textos podem ser digitados com maiusculas, minusculas, espacos extras e sem acentos. O script normaliza esses detalhes antes de comparar os status.
