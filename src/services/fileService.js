const fs = require('fs');
const path = require('path');

const gerenciador = async (directoryPath) => {
  const matrizArquivosOffline = []; // Inicializa a matriz dentro do serviço

  try {
    await loopBuscaArquivos(directoryPath, matrizArquivosOffline);
  } catch (error) {
    console.error('Erro ao ler arquivos offline:', error);
  }

  return matrizArquivosOffline; // Retorna a matriz, caso necessário
};

const loopBuscaArquivos = (caminhoDiretorio, matrizArquivosOffline) => {
  const leDiretorio = (dir, nivel = 0, maxDepth = 2) => {
    return promiseLerDiretorio(dir)
      .then(items => {
        const promises = items.map(item => {
          const caminhoCompleto = path.join(dir, item.name);

          if (item.isDirectory()) {
            if (nivel === 0) {
              return leDiretorio(caminhoCompleto, nivel + 1, 2);
            } else if (nivel === 1) {
              return leDiretorio(caminhoCompleto, nivel + 1, maxDepth);
            } else if (nivel === 2) {
              if (!matrizArquivosOffline.includes(item.name)) {
                matrizArquivosOffline.push(item.name);
              }
              return leDiretorio(caminhoCompleto, nivel + 1, maxDepth);
            }
          } else if (item.isFile()) {
            if (nivel === 2) {
              if (!matrizArquivosOffline.includes(item.name)) {
                const nomeSemExtensao = item.name.split('.').slice(0, -1).join('.');
                matrizArquivosOffline.push(nomeSemExtensao);
              }
            }
          }
          return Promise.resolve();
        });
        return Promise.all(promises);
      });
  };

  return leDiretorio(caminhoDiretorio, 0, 2).then(() => matrizArquivosOffline);
};

const promiseLerDiretorio = (directoryPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, { withFileTypes: true }, (err, items) => {
      if (err) {
        reject(err);
      } else {
        resolve(items);
      }
    });
  });
};

// Função de comparação para unir com o `fileService`
async function comparaArquivos(matrizArquivosOnline, matrizArquivosOffline) {
  return new Promise((resolve) => {
    const resultado = matrizArquivosOnline.filter(item => !matrizArquivosOffline.includes(item));
    resolve(resultado);
  });
}

/**
 * Obtém o caminho do CSV mais recente na pasta ou cria um novo se necessário.
 * @param {string} dirPath - Caminho do diretório onde o CSV será salvo.
 * @param {number} maxSizeMB - Tamanho máximo permitido do arquivo (em MB).
 * @returns {string} - Caminho do arquivo CSV válido.
 */
const obterOuCriarCSV = (dirPath, maxSizeMB = 10) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const arquivos = fs.readdirSync(dirPath).filter(file => file.endsWith('.csv'));
  let csvFilePath;

  if (arquivos.length > 0) {
    arquivos.sort((a, b) => fs.statSync(path.join(dirPath, b)).mtime - fs.statSync(path.join(dirPath, a)).mtime);
    csvFilePath = path.join(dirPath, arquivos[0]);

    // Verifica o tamanho do arquivo mais recente
    const stats = fs.statSync(csvFilePath);
    if (stats.size > maxSizeMB * 1024 * 1024) {
      csvFilePath = null; // Força a criação de um novo arquivo
    }
  }

  // Cria um novo arquivo se necessário
  if (!csvFilePath) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    csvFilePath = path.join(dirPath, `arquivosBaixados_${timestamp}.csv`);
    const headers = 'Timestamp, Parte,OBID,Tamanho,Name,Revision,Status,Title,Release_Status,Folder_Path,ManufacturerDesigner_Code,SignOff_Date,Creation_Date,Updated_By,Last_Update_Date,Config,Id\n';
    fs.writeFileSync(csvFilePath, headers, 'utf8');
  }

  return csvFilePath;
};

/**
 * Adiciona uma linha ao arquivo CSV com os dados fornecidos.
 * @param {string} csvFilePath - Caminho do arquivo CSV.
 * @param {Object} data - Objeto com os dados para salvar no CSV.
 */
const adicionarLinhaCSV = (csvFilePath, data) => {
  try {
    // Gera o timestamp no formato yyyyMMdd_HHmmss considerando o timezone local
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; // Offset em milissegundos
    const localDate = new Date(now.getTime() - offset); // Ajusta para o timezone local

    const timestamp = localDate.toISOString().replace(/[-T:Z]/g, '').slice(0, 15); // yyyyMMddHHmmss
    const formattedTimestamp = `${timestamp.slice(0, 8)}_${timestamp.slice(8)}`; // yyyyMMdd_HHmmss

    const { URI, UID, Release_Status, Workflow_Status, Workflow_Name, SignOff_By, Created_By,
      ...filteredData } = data;

    const linha = {
      Timestamp: formattedTimestamp,
      ...filteredData, // Inclui apenas os campos relevantes
    };
    const csv = require('json2csv').parse(linha, { header: false });
    fs.appendFileSync(csvFilePath, csv + '\n', 'utf8');
  } catch (error) {
    console.error('Erro ao adicionar linha ao CSV:', error.message);
  }
};

/**
 * Formata o tamanho total dos arquivos em uma unidade legível.
 * @param {number} tamanhoTotal - O tamanho total em bytes.
 * @returns {string} - O tamanho formatado.
 */
const formatarTamanhoTotal = (tamanhoTotal) => {
  if (tamanhoTotal > 1073741824) {
    return `${(tamanhoTotal / 1073741824).toFixed(2)} GB`;
  } else if (tamanhoTotal > 1048576) {
    return `${(tamanhoTotal / 1048576).toFixed(2)} MB`;
  } else if (tamanhoTotal > 1024) {
    return `${(tamanhoTotal / 1024).toFixed(2)} kB`;
  } else {
    return `${tamanhoTotal} bytes`;
  }
};

module.exports = {
  gerenciador,
  loopBuscaArquivos,
  promiseLerDiretorio,
  comparaArquivos,
  obterOuCriarCSV,
  adicionarLinhaCSV,
  formatarTamanhoTotal, // Exporta a nova função
};