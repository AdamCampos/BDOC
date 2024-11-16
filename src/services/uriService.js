const axios = require('axios');

/**
 * Busca a URI correspondente a um OBID de documento e calcula o tamanho total do arquivo.
 * @param {string} obid - O OBID do documento.
 * @param {Array|Object} item - Dados associados ao item.
 * @param {string} token - Token de autorização.
 * @returns {Promise<Array|Object|undefined>} - Retorna uma Promise com a URI, dados associados e o tamanho total ou undefined se não for encontrada.
 */
async function pegaURI(obid, item, token) {

  return new Promise((resolve) => {
    axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Files('${obid}')/Intergraph.SPF.Server.API.Model.RetrieveFileUris`, {
      headers: {
        'Authorization': token,
      }
    }).then((response) => {
      if (response.data.value[0]?.Uri) {
        const uriData = response.data.value[0];
        const contentLength = Number(uriData.ContentLength) || 0;
        resolve([uriData, ...item, contentLength]);
      } else {
        resolve(item);
      }
    }).catch(() => {
      resolve(undefined);
    });
  });
}

/**
 * Formata o tamanho total dos arquivos em uma unidade legível.
 * @param {number} tamanhoTotal - O tamanho total em bytes.
 * @returns {string} - O tamanho formatado.
 */
function formatarTamanhoTotal(tamanhoTotal) {
  if (tamanhoTotal > 1073741824) {
    return `${(tamanhoTotal / 1073741824).toFixed(2)} GB`;
  } else if (tamanhoTotal > 1048576) {
    return `${(tamanhoTotal / 1048576).toFixed(2)} MB`;
  } else if (tamanhoTotal > 1024) {
    return `${(tamanhoTotal / 1024).toFixed(2)} kB`;
  } else {
    return `${tamanhoTotal} bytes`;
  }
}

// Exporta as funções como módulo
module.exports = {
  pegaURI,
  formatarTamanhoTotal,
};
