const axios = require('axios');

/**
 * Função para buscar o OBID de um documento.
 * @param {string} id - O ID do documento.
 * @param {Array|Object} item - Dados associados ao item.
 * @param {string} token - Token de autorização.
 * @returns {Promise<Array|Object|undefined>} - Retorna uma Promise com o OBID(s) e o item associado ou undefined se não for encontrado.
 */
async function pegaOBID(id, item, token) {
  return new Promise((resolve) => {
    axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Objects?$filter=(OBID%20eq%20%27${id}%27)&$select=Name,OBID&$expand=SPFFileComposition_21($filter=Interfaces%20eq%20%27ISPFBusinessFile%27%20and%20SPFViewInd%20eq%20%27true%27%20or%20SPFEditInd%20eq%20%27true%27)&$top=1&%24count=true`, {
      headers: {
        'Authorization': token,
      }
    }).then((response) => {

      if (response.data.value[0]?.SPFFileComposition_21.length >= 1) {
        const obidData = response.data.value[0];
        const obids = obidData.SPFFileComposition_21.map(comp => comp.OBID);

        // Verifica se é um único OBID ou múltiplos OBIDs
        const obidResult = obids.length === 1 ? obids[0] : obids;

        // Verifica se item é iterável, caso contrário, retorna como está
        if (Array.isArray(item)) {
          resolve([obidResult, ...item]);
        } else {
          resolve([obidResult, item]);
        }
      } else {
        console.log('Nenhum OBID disponível para ID:', id);
        resolve(undefined); // Retorna undefined se nenhum item for encontrado
      }
    }).catch((error) => {
      console.error(`Erro ao buscar OBID para ID ${id}:`, error);
      resolve(undefined);
    });
  });
}

// Exporta a função como módulo
module.exports = {
  pegaOBID,
};
