// Importa as bibliotecas necessárias
const puppeteer = require('puppeteer'); // Biblioteca para controle do navegador
const cheerio = require('cheerio'); // Biblioteca para manipulação de HTML
const fs = require('fs'); // Biblioteca para manipulação de arquivos
const axios = require('axios'); // Biblioteca para requisições HTTP
const https = require('https'); // Biblioteca para configurar requisições HTTPS
const path = require('path'); // Biblioteca para manipulação de caminhos de arquivos

// Configuração para ignorar a verificação de certificado SSL
const agent = new https.Agent({
  rejectUnauthorized: false // Ignora erros de certificado SSL
});

// Função para baixar imagens a partir de uma URL e salvá-las localmente
async function downloadImage(url, filename) {
  try {
    const response = await axios({
      url, // URL da imagem
      method: 'GET', // Método HTTP
      responseType: 'stream', // Recebe a resposta como um stream
      httpsAgent: agent // Utiliza o agente configurado para ignorar SSL
    });
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filename); // Cria um stream de escrita no arquivo
      response.data.pipe(writer); // Conecta o stream de resposta ao arquivo
      writer.on('finish', resolve); // Resolve a promessa quando terminar
      writer.on('error', reject); // Rejeita a promessa em caso de erro
    });
  } catch (error) {
    console.error(`Erro ao baixar a imagem de ${url}:`, error.message);
  }
}

// Função principal para realizar o scraping
async function main() {
  const url = 'https://localizadorpessoas.petrobras.com.br/lope/busca/buscar.do?ordenacao=0D&filtered=false&aba=F&unico=P-80/geplat&advanced=false&pagina=5';

  console.log('Iniciando scraping...');

  // Cria o diretório para armazenar as imagens, se não existir
  const dirPath = path.resolve(__dirname, '../public/fotos');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  try {
    // Inicia o navegador no modo headless
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage(); // Abre uma nova aba no navegador
    await page.goto(url, { waitUntil: 'networkidle2' }); // Acessa a página e aguarda até a rede estar inativa

    const content = await page.content(); // Obtém o conteúdo da página
    const $ = cheerio.load(content); // Carrega o conteúdo no Cheerio para manipulação

    const resultados = []; // Array para armazenar os resultados do scraping

    // Seleciona os elementos desejados na página
    $('div.resultado.span12').each((index, element) => {
      const item = $(element);

      // Extrai as informações desejadas
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

      // Baixa a imagem correspondente, se existir
      if (imagemSrc && chave) {
        const imagePath = path.resolve(dirPath, `${chave}.jpg`);
        downloadImage(imagemSrc, imagePath)
          .then(() => console.log(`Imagem de ${chave} baixada com sucesso.`))
          .catch(error => console.error(`Erro ao baixar a imagem de ${chave}:`, error));
      }

      // Adiciona as informações ao array de resultados
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

    // Prepara os dados no formato CSV
    const csvHeaders = 'Nome,Lotacao,Email,Empresa,Matricula,Funcao,Chave,Imagem\n';
    const csvFilePath = path.resolve(__dirname, '../public/resultados.csv');

    // Verifica se o arquivo CSV já existe e escreve os cabeçalhos somente se necessário
    if (!fs.existsSync(csvFilePath)) {
      fs.writeFileSync(csvFilePath, csvHeaders, 'utf8');
    }

    // Adiciona os resultados no arquivo CSV
    const csvContent = resultados.map(result => {
      return `${result.nome},${result.lotacao},${result.email},${result.empresa},${result.matricula},${result.funcao},${result.chave},${result.imagem}\n`;
    }).join('');

    fs.appendFileSync(csvFilePath, csvContent, 'utf8');
    console.log('Resultados adicionados ao arquivo "public/resultados.csv"');

    await browser.close(); // Fecha o navegador
  } catch (error) {
    console.error('Erro durante o scraping:', error);
  }
}

// Chama a função principal
main();
