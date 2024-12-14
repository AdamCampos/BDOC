const axios = require('axios');

// Criação da instância do axios com timeout configurado
const axiosInstance = axios.create({
  timeout: 180000, // Timeout de 180 segundos
});

async function pegaContagemSkips(token, projeto) {
  const maxRetries = 10; // Número máximo de tentativas
  const retryDelay = 30000; // Tempo entre tentativas (em milissegundos)

  const executeRequest = async () => {
    let url;

    if (projeto === '83') {
      url = 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=1&%24filter=(contains(Name%2C%27*3010.2J*%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true';
    } else if (projeto === '82') {
      url = 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=1&%24filter=(contains(Name%2C%27*3010.2N*%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true';
    } else {
      throw new Error(`Projeto desconhecido: ${projeto}`);
    }

    for (let attempts = 1; attempts <= maxRetries; attempts++) {
      try {
        const response = await axiosInstance.get(url, {
          headers: { 'Authorization': token },
        });

        if (response.data['@odata.count']) {
          return Math.floor(response.data['@odata.count'] / 1000); // Retorna a contagem
        } else {
          throw new Error('Contagem de itens não encontrada.');
        }
      } catch (error) {
        console.error(`Erro na tentativa ${attempts} de ${maxRetries}: ${error.message}`);
        if (attempts === maxRetries) throw new Error('Todas as tentativas falharam.');
        await new Promise((resolve) => setTimeout(resolve, retryDelay)); // Aguarda antes da próxima tentativa
      }
    }
  };

  return executeRequest();
}

async function pesquisas(numeroSkip, token, projeto) {
  const axiosInstance = axios.create({
    timeout: 180000, // Timeout de 180 segundos
  });

  const maxRetries = 10; // Número máximo de tentativas
  const retryDelay = 30000; // Tempo entre tentativas (em milissegundos)
  const delayBetweenRequests = 150; // Atraso entre cada requisição (em milissegundos)

  const executeRequest = async () => {
    const matrizArquivosOnline = [];
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

      for (let attempts = 1; attempts <= maxRetries; attempts++) {
        try {
          // Faz a requisição
          const response = await axiosInstance.get(url, {
            headers: { 'Authorization': token },
          });

          // Processa os dados da resposta
          response.data.value.forEach((dado) => {
            matrizArquivosOnline.push(dado.Name + '_' + dado.Revision);
          });

          break; // Sai do loop de retry ao obter sucesso
        } catch (error) {
          console.error(`Erro na tentativa ${attempts} de ${maxRetries} para skip ${i}: ${error.message}`);
          if (attempts === maxRetries) throw new Error('Todas as tentativas falharam.');
          await new Promise((resolve) => setTimeout(resolve, retryDelay)); // Aguarda antes de tentar novamente
        }
      }

      // Atraso entre as pesquisas
      if (i < numeroSkip) {
        const progress = ((100 * (i + 1)) / numeroSkip).toFixed(2); // Calcula a porcentagem com duas casas decimais
        process.stdout.write(`Buscando IDs ${delayBetweenRequests / 1000}s ... Progresso: ${progress}%\r`);
        await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
      }
    }
    return matrizArquivosOnline;
  };

  return executeRequest();
}

async function iniciaBuscaSkips(token, projeto) {
  try {
    const numeroSkip = await pegaContagemSkips(token, projeto);
    console.log('Número de skips calculado:', numeroSkip);
    return await pesquisas(numeroSkip, token, projeto);
  } catch (error) {
    console.error('Falhou em alguma das buscas:', error.message);
    throw error;
  }
}

// Exporta as funções como módulo
module.exports = {
  pegaContagemSkips,
  pesquisas,
  iniciaBuscaSkips,
};
