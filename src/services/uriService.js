const axios = require('axios'); // Biblioteca para requisições HTTP
const fs = require('fs'); // Biblioteca para manipulação de arquivos
const path = require('path'); // Biblioteca para manipulação de caminhos de arquivos
const { parse } = require('json2csv'); // Biblioteca para converter JSON para CSV

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

  // Obtém o arquivo CSV mais recente na pasta
  const arquivos = fs.readdirSync(dirPath).filter(file => file.endsWith('.csv'));
  let csvFilePath;
  if (arquivos.length > 0) {
    arquivos.sort((a, b) => fs.statSync(path.join(dirPath, b)).mtime - fs.statSync(path.join(dirPath, a)).mtime);
    csvFilePath = path.join(dirPath, arquivos[0]);

    // Verifica o tamanho do arquivo mais recente
    const stats = fs.statSync(csvFilePath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      csvFilePath = null; // Sinaliza que um novo arquivo deve ser criado
    }
  }

  // Cria um novo arquivo CSV se necessário
  if (!csvFilePath) {
    const date = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // Formato yyyyMMddHHmm
    csvFilePath = path.join(dirPath, `arquivosBaixados_${date}.csv`);
    const headers = 'Parte,OBID,URI,Tamanho,UID,Name,Revision,Status,Title,Release_Status,Purpose_Signoff,Workflow_Status,Workflow_Name,Folder_Path,ManufacturerDesigner_Code,SignOff_Date,SignOff_By,Created_By,Creation_Date,Updated_By,Last_Update_Date,Config,Id\n';
    fs.writeFileSync(csvFilePath, headers, 'utf8'); // Cria o arquivo com os cabeçalhos
  }

  const obidArray = Array.isArray(obid) ? obid : [obid]; // Converte OBID para array, se não for
  const uriResults = []; // Armazena os resultados das URIs

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
