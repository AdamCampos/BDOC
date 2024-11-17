const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const path = require('path');

// Configuração para ignorar a verificação de certificado SSL
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      httpsAgent: agent // Adiciona o agente que ignora a verificação SSL
    });
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filename);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Erro ao baixar a imagem de ${url}:`, error.message);
  }
}

async function main() {
  const url = 'https://localizadorpessoas.petrobras.com.br/lope/busca/buscar.do?ordenacao=0D&filtered=false&aba=F&unico=P-83/geplat&advanced=false&pagina=1';

  console.log('Iniciando scraping...');

  const dirPath = path.resolve(__dirname, '../public/fotos');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    const $ = cheerio.load(content);

    const resultados = [];
    $('div.resultado.span12').each((index, element) => {
      const item = $(element);
      const nome = item.find('p').first().text().trim().replace(/\s+/g, ' ');
      const lotacao = item.find('.lotacao').text().trim().replace(/\s+/g, ' ');
      const emailRaw = item.find('.telefone').html();
      const emailMatch = emailRaw ? emailRaw.match(/E-mail:\s*([\w._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,})/) : null;
      const email = emailMatch ? emailMatch[1].trim() : '';
      const empresa = item.find('.empresa').text().trim().replace(/\s+/g, ' ');
      const imagemSrc = item.find('img').attr('src');
      const matricula = imagemSrc ? imagemSrc.split('/').pop().split('.')[0].trim() : '';
      const funcao = item.find('.funcao').text().trim().replace(/\s+/g, ' ') || '---';
      const chave = item.find('.chave').text().trim().replace(/\s+/g, ' ') || '---';

      if (imagemSrc && chave) {
        const imagePath = path.resolve(dirPath, `${chave}.jpg`);
        downloadImage(imagemSrc, imagePath)
          .then(() => console.log(`Imagem de ${chave} baixada com sucesso.`))
          .catch(error => console.error(`Erro ao baixar a imagem de ${chave}:`, error));
      }

      resultados.push({
        nome,
        lotacao,
        email,
        empresa,
        matricula,
        funcao,
        chave,
        imagem: imagemSrc
      });
    });

    const csvHeaders = 'Nome,Lotacao,Email,Empresa,Matricula,Funcao,Chave,Imagem\n';
    const csvFilePath = path.resolve(__dirname, '../public/resultados.csv');

    // Verifica se o arquivo CSV já existe e escreve os cabeçalhos somente se ele ainda não existir
    if (!fs.existsSync(csvFilePath)) {
      fs.writeFileSync(csvFilePath, csvHeaders, 'utf8');
    }

    const csvContent = resultados.map(result => {
      return `${result.nome},${result.lotacao},${result.email},${result.empresa},${result.matricula},${result.funcao},${result.chave},${result.imagem}\n`;
    }).join('');

    // Adiciona os novos resultados ao CSV existente
    fs.appendFileSync(csvFilePath, csvContent, 'utf8');
    console.log('Resultados adicionados ao arquivo "public/resultados.csv"');

    await browser.close();
  } catch (error) {
    console.error('Erro durante o scraping:', error);
  }
}

main();
