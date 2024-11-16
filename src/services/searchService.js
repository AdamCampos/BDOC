const axios = require('axios');

async function pegaContagemSkips(token, projeto) {
  const etapaInicio = performance.now();

  return new Promise((resolve, reject) => {
    let url = '';

    if (projeto === '83') {
      url = 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=25&%24filter=(contains(Name%2C%27*3010.2J*%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true';
    } else if (projeto === '82') {
      url = 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=25&%24filter=(contains(Name%2C%27*3010.2N*%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true';
    } else {
      console.error('Erro: Projeto desconhecido. Valor recebido:', projeto);
      reject(new Error('Projeto desconhecido.'));
      return;
    }

    axios.get(url, {
      headers: {
        'Authorization': token,
      }
    }).then((response) => {
      if (response.data['@odata.count']) {
        resolve(Math.floor(response.data['@odata.count'] / 1000));
      } else {
        reject(new Error('Contagem de itens não encontrada.'));
      }
    }).catch((error) => {
      console.error('Erro ao obter a contagem de itens:', error);
      reject(error);
    });
  });
}

async function pesquisas(numeroSkip, token, projeto) {
  try {
    const arrayDePromessas = [];
    let urlParte;

    if (projeto === '83') {
      urlParte = '3010.2J';
    } else if (projeto === '82') {
      urlParte = '3010.2N';
    } else {
      throw new Error('Projeto desconhecido');
    }

    for (let i = 0; i <= numeroSkip; i++) {
      const url = `https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=1000&%24filter=(contains(Name%2C%27${urlParte}%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true&%24skip=${1000 * i}`;
      arrayDePromessas.push(
        axios.get(url, {
          headers: {
            'Authorization': token,
          },
        })
      );
    }

    const resultados = await Promise.all(arrayDePromessas);

    // Processa os resultados e preenche a matriz de arquivos online
    const matrizArquivosOnline = [];
    resultados.forEach(item => {
      item.data.value.forEach(dado => {
        matrizArquivosOnline.push(dado.Name + '_' + dado.Revision);
      });
    });

    console.log('Matriz online:', matrizArquivosOnline.length);
    return matrizArquivosOnline;

  } catch (error) {
    console.error('Erro durante a execução das pesquisas:', error);
    throw error;
  }
}

async function iniciaBuscaSkips(token, projeto) {
  try {
    const numeroSkip = await pegaContagemSkips(token, projeto);
    return await pesquisas(numeroSkip, token, projeto);
  } catch (error) {
    console.error('Falhou em alguma das buscas:', error);
    throw error;
  }
}

// Exporta as funções como módulo
module.exports = {
  pegaContagemSkips,
  pesquisas,
  iniciaBuscaSkips,
};
