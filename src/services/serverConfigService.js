// src/services/serverConfigService.js
const axios = require('axios');

/**
 * Função para definir a configuração do servidor para o projeto correto.
 * @param {string} token - Token de autenticação.
 * @param {string} projeto - Identificador do projeto (ex: '83', '82').
 * @returns {Promise} - Retorna uma promessa que resolve quando a configuração for bem-sucedida.
 */
async function setaServidor(token, projeto) {
  return new Promise((resolve, reject) => {
    let projetoCorreto = false;
    let config = null;

    // Primeiro faz a solicitação GET
    axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/User/Configs', {
      headers: {
        'Authorization': token
      }
    }).then((resultado) => {
      resultado.data.value.forEach((item) => {
        // Configuração para o projeto 83
        if (projeto === '83') {
          config = {
            QueryConfigUIDs: ["PR_PRJ-0000000003", "PR_PRJ-0000000005"],
            CreateConfigUID: "PR_PRJ-0000000003"
          };

          if (item.DisplayName === 'PRJ-0000000003' && item.CreateSelected === true) {
            projetoCorreto = true;
          }
        }
        // Configuração para o projeto 82
        else if (projeto === '82') {
          config = {
            QueryConfigUIDs: ["PR_PRJ-0000000003", "PR_PRJ-0000000005"],
            CreateConfigUID: "PR_PRJ-0000000005"
          };

          if (item.DisplayName === 'PRJ-0000000005' && item.CreateSelected === true) {
            projetoCorreto = true;
          }
        } else {
          reject(new Error('Projeto desconhecido'));
          return;
        }
      });

      // Verifica se o projeto já está correto
      if (projetoCorreto) {
        console.log('Projeto', projeto, 'correto');
        resolve('Projeto já está configurado corretamente');
      } else {
        console.log('Vamos setar corretamente', config);
        // Realiza a configuração correta se necessário
        axios.post('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/SetConfig', config, {
          headers: {
            'Authorization': token
          }
        }).then(() => {
          console.log('Setando', projeto);
          resolve('Projeto configurado com sucesso');
        }).catch((error) => {
          console.error('Erro ao configurar o projeto:', error);
          reject(error);
        });
      }
    }).catch((error) => {
      console.error('Erro ao buscar configurações:', error);
      reject(error);
    });
  });
}

module.exports = { setaServidor };
