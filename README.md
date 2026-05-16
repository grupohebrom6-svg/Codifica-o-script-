function atualizarStatusPersonalizado() {

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheets()[0];

  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return;

  const dados = aba.getRange("E2:G" + ultimaLinha).getValues();

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  let alterou = false;

  for (let i = 0; i < dados.length; i++) {

    let estado = dados[i][0];
    let dataEntrada = dados[i][1]; // F
    let dataPrazo = dados[i][2];   // G

    if (!estado) continue;

    let estadoLower = estado.toString().toLowerCase().trim();

    if (
      estadoLower.includes("ativo") ||
      estadoLower.includes("ban") ||
      estadoLower.includes("sob análise")
    ) continue;

    // 🔥 Corrige entrada
    let entrada = new Date(dataEntrada);
    if (isNaN(entrada.getTime())) {
      Logger.log("Entrada inválida linha " + (i+2));
      continue;
    }

    entrada.setHours(0,0,0,0);

    // 🔥 Calcula prazo automaticamente (+6 dias)
    let prazo = new Date(entrada);
    prazo.setDate(prazo.getDate() + 6);

    // Atualiza coluna G automaticamente
    dados[i][2] = prazo;

    let diasEntrada = Math.floor((hoje - entrada) / 86400000);
    let diasPrazo = Math.floor((hoje - prazo) / 86400000);

    let novoEstado = estado;

    // Regra 1
    if (estadoLower.includes("período de avaliação") && diasPrazo >= 6) {
      novoEstado = "Aguardando TAG";
    }

    // Regra 2
    else if (estadoLower.includes("aguardando tag") && diasEntrada >= 14) {
      novoEstado = "Prazo expirado para TAG";
    }

    if (novoEstado !== estado) {
      dados[i][0] = novoEstado;
      alterou = true;
    }
  }

  // Atualiza colunas E e G
  aba.getRange("E2:E" + ultimaLinha)
     .setValues(dados.map(l => [l[0]]));

  aba.getRange("G2:G" + ultimaLinha)
     .setValues(dados.map(l => [l[2]]));

}
