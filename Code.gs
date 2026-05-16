const CONFIG_STATUS = {
  FIRST_DATA_ROW: 2,
  STATUS_COLUMN: 5, // E
  ENTRY_DATE_COLUMN: 6, // F
  DEADLINE_COLUMN: 7, // G
  EVALUATION_DAYS: 6,
  TAG_EXPIRATION_DAYS: 14,
  STATUS: {
    EVALUATION: "Periodo de Avaliacao",
    WAITING_TAG: "Aguardando TAG",
    EXPIRED_TAG: "Prazo expirado para TAG"
  },
  IGNORED_STATUS: [
    "ativo",
    "ban",
    "banido",
    "sob analise"
  ]
};

function atualizarStatusPersonalizado() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheets()[0];
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < CONFIG_STATUS.FIRST_DATA_ROW) return;

  const quantidadeLinhas = ultimaLinha - CONFIG_STATUS.FIRST_DATA_ROW + 1;
  const dados = aba
    .getRange(
      CONFIG_STATUS.FIRST_DATA_ROW,
      CONFIG_STATUS.STATUS_COLUMN,
      quantidadeLinhas,
      CONFIG_STATUS.DEADLINE_COLUMN - CONFIG_STATUS.STATUS_COLUMN + 1
    )
    .getValues();

  const hoje = normalizarData(new Date());
  const atualizacoesStatus = [];
  const atualizacoesPrazo = [];

  dados.forEach((linha, indice) => {
    const numeroLinha = CONFIG_STATUS.FIRST_DATA_ROW + indice;
    const estadoAtual = linha[0];
    const dataEntrada = linha[1];
    const dataPrazoAtual = linha[2];

    if (!estadoAtual) return;

    const estadoNormalizado = normalizarTexto(estadoAtual);
    if (deveIgnorarStatus(estadoNormalizado)) return;

    const entrada = normalizarData(dataEntrada);
    if (!entrada) {
      Logger.log("Entrada invalida linha " + numeroLinha);
      return;
    }

    const prazo = adicionarDias(entrada, CONFIG_STATUS.EVALUATION_DAYS);
    if (!datasIguais(dataPrazoAtual, prazo)) {
      atualizacoesPrazo.push({ linha: numeroLinha, valor: prazo });
    }

    const diasDesdeEntrada = calcularDiferencaDias(hoje, entrada);
    let novoEstado = estadoAtual;

    if (
      contemStatus(estadoNormalizado, CONFIG_STATUS.STATUS.EVALUATION) &&
      hoje.getTime() >= prazo.getTime()
    ) {
      novoEstado = CONFIG_STATUS.STATUS.WAITING_TAG;
    } else if (
      contemStatus(estadoNormalizado, CONFIG_STATUS.STATUS.WAITING_TAG) &&
      diasDesdeEntrada >= CONFIG_STATUS.TAG_EXPIRATION_DAYS
    ) {
      novoEstado = CONFIG_STATUS.STATUS.EXPIRED_TAG;
    }

    if (novoEstado !== estadoAtual) {
      atualizacoesStatus.push({ linha: numeroLinha, valor: novoEstado });
    }
  });

  atualizacoesStatus.forEach((atualizacao) => {
    aba.getRange(atualizacao.linha, CONFIG_STATUS.STATUS_COLUMN).setValue(atualizacao.valor);
  });

  atualizacoesPrazo.forEach((atualizacao) => {
    aba.getRange(atualizacao.linha, CONFIG_STATUS.DEADLINE_COLUMN).setValue(atualizacao.valor);
  });

  Logger.log(
    "Atualizacao concluida: " +
      atualizacoesStatus.length +
      " status e " +
      atualizacoesPrazo.length +
      " prazos alterados."
  );
}

function normalizarTexto(valor) {
  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function deveIgnorarStatus(estadoNormalizado) {
  return CONFIG_STATUS.IGNORED_STATUS.indexOf(estadoNormalizado) !== -1;
}

function contemStatus(estadoNormalizado, statusEsperado) {
  return estadoNormalizado.indexOf(normalizarTexto(statusEsperado)) !== -1;
}

function normalizarData(valor) {
  if (!valor) return null;

  if (valor instanceof Date) {
    return criarDataSemHorario(valor);
  }

  if (typeof valor === "string") {
    const texto = valor.trim();
    const dataBrasileira = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);

    if (dataBrasileira) {
      const dia = Number(dataBrasileira[1]);
      const mes = Number(dataBrasileira[2]) - 1;
      const anoTexto = dataBrasileira[3];
      const ano = Number(anoTexto.length === 2 ? "20" + anoTexto : anoTexto);
      const data = new Date(ano, mes, dia);

      if (
        data.getFullYear() === ano &&
        data.getMonth() === mes &&
        data.getDate() === dia
      ) {
        return criarDataSemHorario(data);
      }
    }
  }

  const data = new Date(valor);
  return criarDataSemHorario(data);
}

function criarDataSemHorario(data) {
  if (isNaN(data.getTime())) return null;

  const dataNormalizada = new Date(data);
  dataNormalizada.setHours(0, 0, 0, 0);
  return dataNormalizada;
}

function adicionarDias(data, dias) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  novaData.setHours(0, 0, 0, 0);
  return novaData;
}

function datasIguais(primeiraData, segundaData) {
  const primeira = normalizarData(primeiraData);
  const segunda = normalizarData(segundaData);

  if (!primeira || !segunda) return false;
  return primeira.getTime() === segunda.getTime();
}

function calcularDiferencaDias(dataFinal, dataInicial) {
  return Math.floor((dataFinal.getTime() - dataInicial.getTime()) / 86400000);
}
