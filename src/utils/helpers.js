// src/utils/helpers.js

// Função para resetar as variáveis globais
function reset() {
    matrizArquivosOnline = [];
    matrizArquivosOffline = [];
    matrizComparaArquivos = [];
    matrizPromisesIds = [];
    matrizPromisesOBIDs = [];
    matrizPromisesURIs = [];
    matrizConcatenada = [];
    matrizIDs = [];
    matrizOBIDs = [];
    matrizURIs = [];

    // Define o comprimento de todas as matrizes como 0
    matrizArquivosOnline.length = 0;
    matrizArquivosOffline.length = 0;
    matrizComparaArquivos.length = 0;
    matrizPromisesIds.length = 0;
    matrizPromisesOBIDs.length = 0;
    matrizPromisesURIs.length = 0;
    matrizConcatenada.length = 0;
    matrizIDs.length = 0;
    matrizOBIDs.length = 0;
    matrizURIs.length = 0;
}

// Função para adicionar um atraso de tempo (em milissegundos)
function PromiseTimeout(delayms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, delayms);
    });
}

// Função para formatar o horário atual no formato ddMM-hh:mm:ss
function getCurrentTime() {
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    return `${dia}${mes}-${horas}:${minutos}:${segundos}`;
}

// Função para personalizar o console.log
function consoleLog() {
    const originalLog = console.log; // Preserva o método original

    console.log = (...args) => {
        const timestamp = getCurrentTime(); // Usa o timestamp formatado
        originalLog(`[${timestamp}]`, ...args);
    };
}

// Matriz para armazenar as mensagens do log
const logTableData = [];

// Função para registrar logs e consolidar na tabela
function tableLog(label, value) {
    logTableData.push({ Label: label, Value: value });
}

// Função para exibir todos os logs armazenados em formato de tabela
function displayLogTable() {
    console.table(logTableData);
}

// Função para exibir o horário atual como uma mensagem de log (pode ser usada de forma independente)
function agora() {
    console.log(getCurrentTime());
}

module.exports = { reset, PromiseTimeout, consoleLog, getCurrentTime, tableLog, displayLogTable, agora };
