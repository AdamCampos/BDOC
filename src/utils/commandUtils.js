// src/utils/commandUtils.js

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec); // Converter exec para uma função que retorna Promise

// Função para executar comandos de forma assíncrona
async function executeCommand(command) {
    try {
        const result = await execAsync(command);
        return result;
    } catch (error) {
        console.error('Erro ao executar o comando:', error);
    }
}

module.exports = { executeCommand };
