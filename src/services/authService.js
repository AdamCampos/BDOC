/**
 * Calcula o tempo restante de validade de um token de autenticação.
 * @param {string} token - O token JWT.
 * @returns {number} - Tempo restante em minutos.
 */
function calculaToken(token) {
  const base64 = token.split('.')[1].replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64).split("").map(function (item) {
      return "%" + ("00" + item.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
  const { exp } = JSON.parse(jsonPayload);
  const expiraEm = ((((exp * 1000) - Date.now()) / 60000).toFixed(0));

  console.log('Token:', expiraEm);
  return expiraEm;
}

/**
 * Verifica se o token é válido e se precisa ser renovado.
 * @param {string} token - Token de autenticação.
 * @param {object} browser - Instância do navegador Puppeteer.
 * @param {Function} main - Função principal a ser reiniciada em caso de renovação de token.
 * @returns {Promise<boolean>} - Retorna true se o token é válido, false se precisar renovar.
 */
async function verificaToken(token, browser, main) {
  if (!token) {
    console.log('Erro ou timeout: Token não capturado em 2 minutos');
    await browser.close();
    setTimeout(main, 120000);
    return false;
  }

  const expira = calculaToken(token);
  if (expira < 5) {
    console.log('Renovando o token...');
    await browser.close();
    setTimeout(main, (expira + 1) * 60000);
    return false;
  }

  return true;
}

// Exporta as funções como módulo
module.exports = {
  calculaToken,
  verificaToken,
};
