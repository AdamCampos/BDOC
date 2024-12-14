// src/services/devToolsService.js
const { salvaCookies, carregaCookies } = require('./cookieService');

/**
 * Captura o token de autenticação usando DevTools e a página Puppeteer.
 * @param {object} browser - Instância do navegador Puppeteer.
 * @param {string} url - URL a ser acessada para captura do token.
 * @returns {Promise<string>} - Retorna o token de autenticação capturado.
 */
async function getDevToolsData(browser, url) {
  const page = await browser.newPage();
  await carregaCookies(page);

  let retornaToken = null;
  let redirecionado = false;

  await page.setRequestInterception(true);

  page.on('request', request => {
    // Verifica se o header contém "Authorization"
    const requestHeaders = request.headers();
    if (requestHeaders['authorization']) {
      //console.log('URL com header "Authorization":', request.url());
      //console.log('Token encontrado:', requestHeaders['authorization']);
      retornaToken = requestHeaders['authorization'].toString();
    }
    request.continue();
  });

  page.on('response', response => {

    if (response.url().includes('https://integra-ext.petrobras.com.br/samext/oauth/connect/authorize')) {
      console.log(response);
      console.log('Redirecionamento detectado, reiniciando o programa...');
      redirecionado = true;
    }
  });

  await page.goto(url, { timeout: 60000 });

  if (redirecionado) {
    await browser.close();
    throw new Error('Redirecionamento detectado, reiniciando...');
  }

  await PromiseTimeout(120000);
  await salvaCookies(page);
  return retornaToken;
}

/**
 * Função auxiliar para definir um atraso de execução.
 * @param {number} delayms - Tempo de atraso em milissegundos.
 * @returns {Promise<void>}
 */
function PromiseTimeout(delayms) {
  return new Promise(resolve => setTimeout(resolve, delayms));
}

module.exports = { getDevToolsData };
