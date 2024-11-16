const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Função para inicializar o navegador
async function initializeBrowser() {
  let browser;
  try {
    browser = await puppeteer.connect({ browserWSEndpoint: 'ws://localhost:9222' });
  } catch (e) {
    console.log('Iniciando navegador...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--remote-debugging-port=9222',
        '--user-data-dir=C:\\Users\\nvmj\\Desktop\\NodeJS\\api'
      ]
    });
  }
  return browser;
}

// Exportação da função como um módulo
module.exports = {
  initializeBrowser,
};
