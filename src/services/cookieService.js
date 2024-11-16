const fs = require('fs');
const COOKIES_FILE_PATH = 'C:\\Users\\nvmj\\AppData\\Local\\Google\\Chrome for Testing\\User Data\\Default\\Network\\cookies.json';

async function salvaCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookies, null, 2));
}

async function carregaCookies(page) {
  if (fs.existsSync(COOKIES_FILE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE_PATH));
    await page.setCookie(...cookies);
  }
}

// Exporta as funções como módulo
module.exports = {
  salvaCookies,
  carregaCookies,
};
