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

// Função para registrar o horário atual em formato de log
function agora() {
    let agora = new Date();
    let horas = agora.getHours().toString().padStart(2, '0');
    let minutos = agora.getMinutes().toString().padStart(2, '0');
    console.log(`Iniciando: ${horas}:${minutos}`);
}

module.exports = { reset, PromiseTimeout, agora };
