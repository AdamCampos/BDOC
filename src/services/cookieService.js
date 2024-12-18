const fs = require('fs');
const COOKIES_FILE_PATH = 'C:\\Users\\nvmj\\AppData\\Local\\Google\\Chrome for Testing\\User Data\\Default\\Network\\cookies.json';

// Salva cookies no arquivo
async function salvaCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookies, null, 2));
  console.log('Cookies salvos em:', COOKIES_FILE_PATH);
}

// Carrega cookies no navegador
async function carregaCookies(page) {
  if (fs.existsSync(COOKIES_FILE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE_PATH));
    if (Array.isArray(cookies) && cookies.length > 0) {
      await page.setCookie(...cookies.map(cookie => ({
        ...cookie,
        url: `https://${cookie.domain.replace(/^\./, '')}`
      })));
      console.log('Cookies carregados com sucesso.');
    } else {
      console.warn('Nenhum cookie válido encontrado.');
    }
  } else {
    console.warn('Arquivo de cookies não encontrado.');
  }
}

module.exports = {
  salvaCookies,
  carregaCookies,
};
