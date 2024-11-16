const axios = require('axios');

async function pegaURI(obid, item, token) {
  return new Promise((resolve) => {
    axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Files('${obid}')/Intergraph.SPF.Server.API.Model.RetrieveFileUris`, {
      headers: {
        'Authorization': token,
      }
    }).then((response) => {
      if (response.data.value[0].Uri) {
        resolve([response.data.value[0], ...item]);
      } else {
        resolve(item);
      }
    }).catch(() => {
      resolve(undefined);
    });
  });
}

// Exporta a função como módulo
module.exports = {
  pegaURI,
};
