const axios = require('axios');

/**
 * Função para obter o ID de um documento específico.
 * @param {string} termo - Nome do documento sem revisão.
 * @param {string} token - Token de autenticação.
 * @param {number} index - Índice para fins de log.
 * @returns {Promise<object>} - Retorna uma Promise que resolve com o ID do documento.
 */
async function pegaID(termo, token, index) {

  return new Promise((resolve) => {
    axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=1&%24filter=(Name%20eq%20%27${termo}%27%20and%20Status%20eq%20%27CURRENT%27)&%24count=false&%24skip=0`, {
      headers: {
        'Authorization': token,
      }
    }).then((response) => {
      resolve(response.data.value[0]);
    }).catch(() => {
      resolve(undefined);
    });
  });
}

// Exporta a função como módulo
module.exports = {
  pegaID,
};
