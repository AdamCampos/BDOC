const puppeteer = require('puppeteer'); // Biblioteca para controle do navegador
const fs = require('fs'); // Biblioteca para manipulação de arquivos
const path = require('path'); // Para manipular caminhos de arquivos

async function fetchDataWithBrowser() {
  const url = `https://busypp.petrobras.com.br/sap/opu/odata/sap/YSHR_CONTROLE_FREQUENCIA_SRV/FrequenciaSet(Matricula='09815703',MesAno='202411')?$expand=Marcacoes%2FHorariosRegistrados,Marcacoes%2FHorariosReferencia,Marcacoes%2FAjustes%2FAnexoSet,BancoHoras,Aprovadores,Justificativas%2FMotivos,ServiceStatusSet,PendenciasSet&$format=json&emitirWarningOmitidos=`;

  try {
    console.log('Iniciando navegador...');

    // Inicia o navegador no modo visual
    const browser = await puppeteer.launch({
      headless: false, // Modo visual para abrir a janela de seleção do certificado
      args: [
        '--ignore-certificate-errors', // Ignorar erros de certificados inválidos
        '--disable-setuid-sandbox',
        '--no-sandbox'
      ],
      ignoreHTTPSErrors: true, // Ignorar erros HTTPS
      defaultViewport: null // Tela cheia
    });

    const page = await browser.newPage();
    console.log(`Acessando URL: ${url}`);

    // Navega para a URL fornecida
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 }); // Aguarda o carregamento da página

    // Obtém o conteúdo da resposta (JSON)
    const content = await page.evaluate(() => document.body.innerText);
    const data = JSON.parse(content);

    console.log('Dados obtidos:', data);

    // Processa os dados do bloco Ajustes
    const marcacoes = data.d.Marcacoes.results;
    const ajustes = marcacoes.flatMap(marcacao =>
      marcacao.Ajustes.results.map(ajuste => ({
        Matricula: ajuste.Matricula,
        Data: ajuste.Data,
        HoraInicio: ajuste.HoraInicio,
        HoraFim: ajuste.HoraFim,
        DescJustificativa: ajuste.DescJustificativa,
        Status: ajuste.Status,
        CodigoMotivo: ajuste.CodigoMotivo,
        DescricaoMotivo: ajuste.DescricaoMotivo,
        ObsEmpregado: ajuste.ObsEmpregado,
        Comentarios: ajuste.Comentarios.trim(),
        DataInicio: ajuste.DataInicio,
        DataFim: ajuste.DataFim,
        ChaveSubst: ajuste.ChaveSubst
      }))
    );

    // Salva os dados em CSV
    const outputPath = path.resolve(__dirname, 'ajustes.csv');
    const csvHeaders = 'Matricula,Data,HoraInicio,HoraFim,DescJustificativa,Status,CodigoMotivo,DescricaoMotivo,ObsEmpregado,Comentarios,DataInicio,DataFim,ChaveSubst\n';
    const csvContent = ajustes.map(item =>
      `${item.Matricula},${item.Data},${item.HoraInicio},${item.HoraFim},${item.DescJustificativa},${item.Status},${item.CodigoMotivo},${item.DescricaoMotivo},${item.ObsEmpregado},${item.Comentarios},${item.DataInicio},${item.DataFim},${item.ChaveSubst}`
    ).join('\n');

    fs.writeFileSync(outputPath, csvHeaders + csvContent, 'utf-8');
    console.log(`Dados de Ajustes processados e salvos em ${outputPath}`);

    await browser.close(); // Fecha o navegador
  } catch (error) {
    console.error('Erro durante o scraping:', error.message);
  }
}

// Chama a função principal
fetchDataWithBrowser();
