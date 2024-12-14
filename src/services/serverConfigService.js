const axios = require('axios');

/**
 * Função genérica para executar operações com retentativas em caso de falhas específicas.
 * @param {Function} fn - Função assíncrona a ser executada.
 * @param {number} retries - Número máximo de retentativas.
 * @param {number} delayMs - Tempo de espera entre retentativas em milissegundos.
 * @returns {Promise<*>} - Retorna o resultado da função em caso de sucesso.
 */
async function withRetries(fn, retries = 5, delayMs = 10000) {
    let attempt = 0;
    while (attempt <= retries) {
        try {
            return await fn();
        } catch (error) {
            const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'socket hang up'];
            const isRetryable = retryableErrors.includes(error.code) || error.message.includes('socket hang up');

            console.error(`[Tentativa ${attempt + 1}] Erro: ${error.code || error.message}`);

            if (attempt >= retries || !isRetryable) {
                console.error('Erro não recuperável ou tentativas esgotadas.');
                throw error;
            }

            attempt++;
            console.log(`Aguardando ${delayMs}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

/**
 * Função para buscar configurações do servidor com retentativas.
 * @param {string} token - Token de autenticação.
 * @returns {Promise<Object>} - Retorna os dados das configurações do servidor.
 */
async function buscaConfiguracoes(token) {
    return withRetries(async () => {
        console.log('[INFO] Buscando configurações do servidor...');
        const response = await axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/User/Configs', {
            headers: { 'Authorization': token },
        });
        return response.data;
    });
}

/**
 * Função para configurar o servidor com os dados fornecidos, utilizando retentativas.
 * @param {string} token - Token de autenticação.
 * @param {Object} config - Dados de configuração do servidor.
 * @returns {Promise<Object>} - Retorna a resposta da configuração.
 */
async function configuraServidor(token, config) {
    return withRetries(async () => {
        console.log('[INFO] Configurando o servidor...');
        const response = await axios.post('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/SetConfig', config, {
            headers: { 'Authorization': token },
        });
        return response.data;
    });
}

/**
 * Função principal para definir a configuração do servidor para o projeto correto.
 * @param {string} token - Token de autenticação.
 * @param {string} projeto - Identificador do projeto (ex: '83', '82').
 * @returns {Promise<string>} - Retorna uma mensagem indicando o status da configuração.
 */
async function setaServidor(token, projeto) {
    try {
        const configs = await buscaConfiguracoes(token);
        let projetoCorreto = false;
        let config = null;

        // Define configurações baseadas no projeto
        configs.value.forEach((item) => {
            if (projeto === '83') {
                config = {
                    QueryConfigUIDs: ["PR_PRJ-0000000003", "PR_PRJ-0000000005"],
                    CreateConfigUID: "PR_PRJ-0000000003",
                };

                if (item.DisplayName === 'PRJ-0000000003' && item.CreateSelected === true) {
                    projetoCorreto = true;
                }
            } else if (projeto === '82') {
                config = {
                    QueryConfigUIDs: ["PR_PRJ-0000000003", "PR_PRJ-0000000005"],
                    CreateConfigUID: "PR_PRJ-0000000005",
                };

                if (item.DisplayName === 'PRJ-0000000005' && item.CreateSelected === true) {
                    projetoCorreto = true;
                }
            } else {
                throw new Error('Projeto desconhecido');
            }
        });

        // Verifica se o projeto já está configurado
        if (projetoCorreto) {
            console.log(`Projeto ${projeto} já configurado corretamente.`);
            return 'Projeto já está configurado corretamente';
        }

        console.log('Projeto incorreto, configurando...');
        await configuraServidor(token, config);

        console.log(`Projeto ${projeto} configurado com sucesso.`);
        return 'Projeto configurado com sucesso';

    } catch (error) {
        console.error(`Erro ao configurar o servidor para o projeto ${projeto}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    withRetries,
    buscaConfiguracoes,
    configuraServidor,
    setaServidor,
};
