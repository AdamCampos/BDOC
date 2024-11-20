const axios = require('axios'); // Biblioteca para requisições HTTP
const path = require('path'); // Biblioteca para manipulação de caminhos de arquivos
const { obterOuCriarCSV, adicionarLinhaCSV } = require('./fileService'); // Importa a nova função

/**
 * Busca a URI correspondente a um OBID de documento e calcula o tamanho total do arquivo.
 * Verifica a existência de arquivos CSV na pasta, cria novos se necessário e respeita o limite de 10MB.
 * @param {string|Array} obid - O OBID do documento ou um array de OBIDs.
 * @param {Array|Object} item - Dados associados ao item.
 * @param {string} token - Token de autorização.
 * @returns {Promise<Array|Object|undefined>} - Retorna uma Promise com as URIs, dados associados e o tamanho total ou undefined se não for encontrada.
 */
async function pegaURI(obid, item, token) {
  const dirPath = path.resolve('D:\\BDOC 82\\@@@@'); // Caminho da pasta onde os arquivos CSV serão armazenados
  const csvFilePath = obterOuCriarCSV(dirPath); // Usa o fileService para lidar com o CSV
  const obidArray = Array.isArray(obid) ? obid : [obid]; // Garante que obid seja uma lista
  const uriResults = []; // Lista de resultados

  return new Promise(async (resolve) => {
    for (let i = 0; i < obidArray.length; i++) {
      const singleObid = obidArray[i];
      try {
        // Requisição para buscar a URI do arquivo
        const response = await axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Files('${singleObid}')/Intergraph.SPF.Server.API.Model.RetrieveFileUris`, {
          headers: {
            'Authorization': token,
          }
        });

        if (response.data.value[0]?.Uri) {
          const uriData = response.data.value[0];

          // Adiciona a chave "parte" ao item com o índice atual
          const itemComParte = { ...item, Parte: i, OBID: singleObid };

          // Novas propriedades para mesclar
          const adicionais = {
            Parte: i,
            OBID: singleObid,
            URI: uriData.Uri,
            Tamanho: uriData.ContentLength
          };

          delete itemComParte['0'];
          const itemProperties = itemComParte['1'] || {};
          const mesclado = { ...adicionais, ...itemProperties };

          // Adiciona o objeto mesclado à lista de resultados
          uriResults.push(mesclado);

          // Escreve os dados no arquivo CSV
          try {
            // Adiciona os dados ao CSV
            adicionarLinhaCSV(csvFilePath, mesclado);
          } catch (csvError) {
            console.error('Erro ao escrever no arquivo CSV:', csvError.message);
          }
        } else {
          console.log(`Nenhuma URI encontrada para OBID ${singleObid}`);
        }
      } catch (error) {
        console.error(`Erro ao buscar URI para OBID ${singleObid}:`, error.message);
      }
    }

    // Retorna os resultados encontrados ou o item original se nenhum resultado foi encontrado
    if (uriResults.length > 0) {
      resolve(uriResults);
    } else {
      resolve(item);
    }
  });
}

// Exporta as funções como módulo
module.exports = {
  pegaURI,
};