const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

/**
 * Busca a URI correspondente a um OBID de documento e calcula o tamanho total do arquivo.
 * @param {string|Array} obid - O OBID do documento ou um array de OBIDs.
 * @param {Array|Object} item - Dados associados ao item.
 * @param {string} token - Token de autorização.
 * @returns {Promise<Array|Object|undefined>} - Retorna uma Promise com as URIs, dados associados e o tamanho total ou undefined se não for encontrada.
 */
async function pegaURI(obid, item, token) {
  const csvFilePath = path.join('D:\\BDOC 82\\@@@@', 'arquivosBaixados.csv'); // Caminho do arquivo CSV

  // Verifica se o arquivo CSV existe; se não, cria com cabeçalhos
  if (!fs.existsSync(csvFilePath)) {
    const headers = 'Parte,OBID,URI,Tamanho,UID,Name,Revision,Status,Title,Release_Status,Purpose_Signoff,Workflow_Status,Workflow_Name,Folder_Path,ManufacturerDesigner_Code,SignOff_Date,SignOff_By,Created_By,Creation_Date,Updated_By,Last_Update_Date,Config,Id\n';
    fs.writeFileSync(csvFilePath, headers, 'utf8');
  }

  // Verifica se obid é um array; se não for, converte para array
  const obidArray = Array.isArray(obid) ? obid : [obid];
  const uriResults = [];

  // Processa cada OBID individualmente
  return new Promise(async (resolve) => {
    for (let i = 0; i < obidArray.length; i++) {
      const singleObid = obidArray[i];
      try {
        const response = await axios.get(`https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Files('${singleObid}')/Intergraph.SPF.Server.API.Model.RetrieveFileUris`, {
          headers: {
            'Authorization': token,
          }
        });

        if (response.data.value[0]?.Uri) {
          const uriData = response.data.value[0];

          // Adiciona a chave "parte" ao item com o índice atual
          const itemComParte = { ...item, Parte: i, OBID: obid[i] };

          // Novas propriedades para mesclar
          const adicionais = {
            Parte: i,
            OBID: obid[i],
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
            const csv = parse(mesclado, { header: false });
            fs.appendFileSync(csvFilePath, csv + '\n', 'utf8');
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
