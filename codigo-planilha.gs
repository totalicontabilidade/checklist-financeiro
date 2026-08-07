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

// Pasta do Drive onde ficam os termos de compromisso. É o ID da pasta
// "SETOR CONTÁBIL" — usar o ID em vez do nome evita quebrar se a renomearem.
const ID_PASTA_SETOR_CONTABIL = '16vLlZ8lHDd0Si09gtsr6YvLVvkfOtTFs';
const SUBPASTA_COMPROMISSOS = 'Compromissos - Maquinetas';

// Resposta do formulário que dispara a geração do termo.
const OPCAO_CLIENTE_ENVIA = 'Enviar os documentos todo mês';

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

    // Quem se compromete a enviar os relatórios ganha um termo em PDF no Drive.
    // Se isso falhar, a resposta do cliente já está gravada e não se perde.
    let termo = '';
    if (d.formaDocumentos === OPCAO_CLIENTE_ENVIA) {
      try {
        termo = gerarTermoCompromisso(d);
      } catch (falha) {
        registrarErro('Falha ao gerar o termo de ' + d.empresa, falha);
      }
    }

    if (AVISAR_EMAIL) {
      MailApp.sendEmail(AVISAR_EMAIL,
        'Checklist financeiro: ' + d.empresa,
        d.empresa + ' (' + d.cnpj + ') enviou o checklist.\n' +
        'Protocolo: ' + d.protocolo + '\n' +
        'Bancos: ' + bancos.length + ' | Maquinetas: ' + maquinas.length +
        ' | Acessos informados: ' + acessos.length +
        (termo ? '\n\nTermo de compromisso gerado: ' + termo : '') +
        '\n\n' + ss.getUrl());
    }

    return json({ ok: true, protocolo: d.protocolo });
  } catch (erro) {
    // Guarda o envio cru para não perder nada se algo mudar no formulário.
    registrarErro(erro, e && e.postData ? e.postData.contents : '(vazio)');
    return json({ ok: false, erro: String(erro) });
  } finally {
    lock.releaseLock();
  }
}

/* ==========================================================================
   Termo de compromisso em PDF
   ========================================================================== */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * Gera o termo em PDF e salva no Drive.
 * Devolve a URL do arquivo.
 */
function gerarTermoCompromisso(d) {
  const hoje = new Date();
  const fuso = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const dia = Number(Utilities.formatDate(hoje, fuso, 'd'));
  const mes = Number(Utilities.formatDate(hoje, fuso, 'M'));
  const ano = Utilities.formatDate(hoje, fuso, 'yyyy');
  const porExtenso = dia + ' de ' + MESES[mes - 1] + ' de ' + ano;
  const mesAno = Utilities.formatDate(hoje, fuso, 'MM-yyyy');

  const maquinetas = (d.maquinas || []).map(function (m) { return m.maquina; })
    .concat(d.maquinaOutra ? [d.maquinaOutra] : [])
    .filter(String);

  const pdf = Utilities.newBlob(montarHtmlDoTermo(d, maquinetas, porExtenso), 'text/html')
    .getAs('application/pdf')
    .setName(nomeDoArquivo(d.empresa, mesAno));

  return pasta().createFile(pdf).getUrl();
}

/** "EMPRESA XYZ - Compromisso Maquinetas - 08-2026.pdf" */
function nomeDoArquivo(empresa, mesAno) {
  const limpo = String(empresa || 'SEM NOME')
    .replace(/[\/\\:*?"<>|]/g, ' ')   // caracteres que atrapalham em nome de arquivo
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 80);
  return limpo + ' - Compromisso Maquinetas - ' + mesAno + '.pdf';
}

/** Devolve a subpasta dos compromissos, criando se ainda não existir. */
function pasta() {
  const setor = DriveApp.getFolderById(ID_PASTA_SETOR_CONTABIL);
  const existentes = setor.getFoldersByName(SUBPASTA_COMPROMISSOS);
  return existentes.hasNext() ? existentes.next() : setor.createFolder(SUBPASTA_COMPROMISSOS);
}

function montarHtmlDoTermo(d, maquinetas, porExtenso) {
  const lista = maquinetas.length
    ? '<p class="maq"><b>Maquinetas declaradas:</b> ' + escapar(maquinetas.join(', ')) + '</p>'
    : '';

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    + 'body{font-family:Helvetica,Arial,sans-serif;color:#17202e;font-size:11.5pt;line-height:1.6;margin:0}'
    + '.faixa{background:#0b1f3a;color:#fff;padding:22px 34px;border-bottom:5px solid #c9a227}'
    + '.marca{font-size:9pt;letter-spacing:3px;color:#e2c766;font-weight:bold}'
    + '.faixa h1{margin:8px 0 0;font-size:16pt;font-weight:bold}'
    + '.corpo{padding:30px 34px}'
    + '.dados{border:1px solid #dde3ec;border-left:4px solid #c9a227;padding:14px 18px;margin-bottom:24px}'
    + '.dados p{margin:3px 0;font-size:11pt}'
    + 'ol{margin:10px 0 18px 22px} li{margin-bottom:5px}'
    + '.aviso{border:1px solid #c9a227;background:#fffaf0;padding:14px 18px;margin:22px 0}'
    + '.maq{font-size:10.5pt;color:#63708a}'
    + '.rodape{margin-top:34px;border-top:1px solid #dde3ec;padding-top:14px;font-size:9.5pt;color:#63708a}'
    + '.assin{margin-top:46px;font-size:10.5pt}'
    + '.linha{border-top:1px solid #17202e;width:300px;margin-top:44px;padding-top:5px}'
    + '</style></head><body>'

    + '<div class="faixa"><div class="marca">TOTALI SOLUÇÕES CONTÁBEIS</div>'
    + '<h1>Termo de Compromisso — Envio dos Relatórios das Maquinetas</h1></div>'

    + '<div class="corpo">'
    + '<div class="dados">'
    + '<p><b>Empresa:</b> ' + escapar(d.empresa) + '</p>'
    + '<p><b>CNPJ:</b> ' + escapar(d.cnpj) + '</p>'
    + '<p><b>Protocolo:</b> ' + escapar(d.protocolo) + '</p>'
    + '<p><b>Data de geração:</b> ' + escapar(porExtenso) + '</p>'
    + '</div>'

    + '<p>A empresa acima identificada declara, por meio deste termo, que <b>optou por enviar '
    + 'ela mesma</b> os relatórios das suas máquinas de cartão, em vez de fornecer os dados de '
    + 'acesso aos portais das operadoras.</p>'

    + '<p>Assim, a empresa <b>se compromete a encaminhar à Totali Soluções Contábeis, todos os '
    + 'meses, pelo Confi</b>, os seguintes documentos referentes a cada uma das suas maquinetas:</p>'

    + '<ol><li>Relatório de vendas;</li>'
    + '<li>Relatório de recebimentos;</li>'
    + '<li>Relatório de antecipações.</li></ol>'

    + lista

    + '<div class="aviso"><b>Responsabilidade pelos prazos.</b> O envio mensal desses relatórios é '
    + 'de responsabilidade exclusiva da empresa. Sem eles, a Totali não consegue registrar as vendas, '
    + 'as taxas e as antecipações, e a escrituração do período fica retida.<br><br>'
    + 'Caso o atraso ou a ausência do envio resulte em perda de prazo, entrega em atraso, retificação, '
    + 'multa ou qualquer outra penalidade, a empresa declara-se ciente de que a responsabilidade é sua, '
    + 'não cabendo imputá-la à Totali Soluções Contábeis.</div>'

    + '<p>Se em algum momento o envio mensal se tornar inviável, a empresa deve comunicar a Totali '
    + 'para que se passe ao acesso direto aos portais das operadoras.</p>'

    + '<div class="assin"><div class="linha">' + escapar(d.empresa) + '<br>'
    + 'CNPJ ' + escapar(d.cnpj) + '</div></div>'

    + '<div class="rodape">Documento gerado automaticamente em ' + escapar(porExtenso)
    + ' a partir do Checklist Financeiro preenchido pela empresa. '
    + 'Protocolo ' + escapar(d.protocolo) + '.</div>'
    + '</div></body></html>';
}

function escapar(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Registra qualquer falha numa aba própria, sem derrubar o envio. */
function registrarErro(erro, conteudo) {
  try {
    aba(SpreadsheetApp.getActiveSpreadsheet(), 'Erros', ['Quando', 'Erro', 'Conteúdo'])
      .appendRow([new Date(), String(erro), String(conteudo)]);
  } catch (ignorado) {}
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
