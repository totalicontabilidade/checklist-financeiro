/**
 * Checklist Financeiro — Totali Contabilidade
 * Recebe os envios do formulário (GitHub Pages) e grava na planilha.
 *
 * Onde colar: abra a planilha do Google > Extensões > Apps Script >
 * apague o conteúdo e cole isto aqui. Depois: Implantar > Nova implantação >
 * App da Web > Executar como "Eu" > Quem pode acessar "Qualquer pessoa".
 *
 * ATENÇÃO: a aba "Acessos das maquinetas" guarda LOGIN E SENHA dos clientes.
 * Proteja essa aba (Dados > Proteger intervalos) e não compartilhe a planilha
 * com link aberto.
 */

// Deixe em branco para não receber aviso por e-mail a cada envio.
const AVISAR_EMAIL = '';

const ABA_RESPOSTAS = 'Respostas';
const ABA_BANCOS = 'Bancos';
const ABA_ACESSOS = 'Acessos das maquinetas';

const CAB_RESPOSTAS = ['Protocolo', 'Recebido em', 'Empresa', 'CNPJ', 'Tem banco?', 'Bancos',
  'Outros bancos', 'Usa maquineta?', 'Maquinetas', 'Outra maquineta',
  'Relatórios das maquinetas', 'Observações'];

const CAB_BANCOS = ['Protocolo', 'Empresa', 'CNPJ', 'Banco'];

const CAB_ACESSOS = ['Protocolo', 'Empresa', 'CNPJ', 'Maquineta', 'Login', 'Senha'];

/** Ponto de entrada do formulário. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quando = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm');

    const bancos = d.bancos || [];
    const maquinas = d.maquinas || [];

    aba(ss, ABA_RESPOSTAS, CAB_RESPOSTAS).appendRow([
      d.protocolo,
      quando,
      d.empresa,
      d.cnpj,
      d.temBanco ? 'Sim' : 'Não',
      bancos.join('\n'),
      d.bancoOutro,
      d.temMaquina ? 'Sim' : 'Não',
      maquinas.map(function (m) { return m.maquina; }).join(', '),
      d.maquinaOutra,
      d.formaDocumentos,
      d.observacoes
    ]);

    // Uma linha por banco, para dar para filtrar e ordenar.
    if (bancos.length) {
      gravar(aba(ss, ABA_BANCOS, CAB_BANCOS), bancos.map(function (b) {
        return [d.protocolo, d.empresa, d.cnpj, b];
      }));
    }

    // Só grava acesso de quem realmente informou login ou senha.
    const acessos = maquinas.filter(function (m) { return m.login || m.senha; });
    if (acessos.length) {
      gravar(aba(ss, ABA_ACESSOS, CAB_ACESSOS), acessos.map(function (m) {
        return [d.protocolo, d.empresa, d.cnpj, m.maquina, m.login, m.senha];
      }));
    }

    if (AVISAR_EMAIL) {
      MailApp.sendEmail(AVISAR_EMAIL,
        'Checklist financeiro: ' + d.empresa,
        d.empresa + ' (' + d.cnpj + ') enviou o checklist.\n' +
        'Protocolo: ' + d.protocolo + '\n' +
        'Bancos: ' + bancos.length + ' | Maquinetas: ' + maquinas.length +
        ' | Acessos informados: ' + acessos.length + '\n\n' + ss.getUrl());
    }

    return json({ ok: true, protocolo: d.protocolo });
  } catch (erro) {
    // Guarda o envio cru para não perder nada se algo mudar no formulário.
    try {
      aba(SpreadsheetApp.getActiveSpreadsheet(), 'Erros', ['Quando', 'Erro', 'Conteúdo'])
        .appendRow([new Date(), String(erro), e && e.postData ? e.postData.contents : '(vazio)']);
    } catch (ignorado) {}
    return json({ ok: false, erro: String(erro) });
  } finally {
    lock.releaseLock();
  }
}

/** Só para conferir no navegador se a implantação está no ar. */
function doGet() {
  return json({ ok: true, servico: 'Checklist Financeiro — Totali' });
}

/** Acrescenta várias linhas de uma vez. */
function gravar(planilha, linhas) {
  planilha.getRange(planilha.getLastRow() + 1, 1, linhas.length, linhas[0].length).setValues(linhas);
}

/** Devolve a aba, criando com cabeçalho se ainda não existir. */
function aba(ss, nome, cabecalho) {
  let s = ss.getSheetByName(nome);
  if (!s) {
    s = ss.insertSheet(nome);
    s.appendRow(cabecalho);
    s.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#0b1f3a').setFontColor('#ffffff');
    s.setFrozenRows(1);
  }
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
