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
async function verificaToken(token, browser, reiniciarFluxo) {
  if (!token) {
    console.log('[Token Manager]: Token não capturado. Reiniciando o processo em 2 minutos...');
    await browser.close();
    setTimeout(reiniciarFluxo, 120000); // Reinicia após 2 minutos
    return false;
  }

  const expira = calculaToken(token);
  if (expira < 10) {
    console.log(`[Token Manager]: Token expirando em ${expira} minutos. Renovando...`);
    await browser.close();

    // Aguarda um tempo proporcional ao tempo restante e reinicia o processo
    setTimeout(() => {
      console.log('[Token Manager]: Reiniciando o processo após renovação do token.');
      reiniciarFluxo();
    }, Math.max(1000, (expira + 0.1) * 60000)); // Garante pelo menos 1 segundo de espera

    return false;
  }

  return true; // Token válido
}

// Exporta as funções como módulo
module.exports = {
  calculaToken,
  verificaToken,
};
