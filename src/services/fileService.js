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

// Exporta as funções como módulo
module.exports = {
  gerenciador,
  loopBuscaArquivos,
  promiseLerDiretorio,
  comparaArquivos,
};
