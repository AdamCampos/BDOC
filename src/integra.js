// Importando módulos necessários para o funcionamento do aplicativo
const express = require('express');
const router = express.Router();
const { initializeBrowser } = require('./services/browserService'); // Inicializa o navegador para automação
const { verificaToken } = require('./services/authService'); // Verifica a validade do token de autenticação
const { gerenciador, comparaArquivos } = require('./services/fileService'); // Gerencia arquivos offline e compara arquivos online e offline
const { pegaID } = require('./services/idService'); // Obtém ID associado a um arquivo específico
const { pegaOBID } = require('./services/obidService'); // Obtém OBID, que pode representar uma identificação específica de um documento
const { pegaURI, formatarTamanhoTotal } = require('./services/uriService'); // Obtém URI de um arquivo e formata o tamanho total dos arquivos
const { iniciaBuscaSkips } = require('./services/searchService'); // Inicia busca por arquivos online
const { downloadLinks } = require('./services/downloadService'); // Gera links de download para arquivos processados
const { reset } = require('./utils/helpers'); // Reseta variáveis ou estados no início da execução
const { setaServidor } = require('./services/serverConfigService'); // Configura o servidor para o processo atual
const { getDevToolsData } = require('./services/devToolsService'); // Obtém dados de ferramentas de desenvolvimento para autenticação
const pLimit = require('p-limit'); // Controla a quantidade de promessas simultâneas para evitar sobrecarga

// Variáveis globais que armazenam dados ao longo da execução do script
let projeto = '';
let matrizArquivosOffline = [];
let matrizComparaArquivos = [];
let matrizOBIDs = [];
let matrizURIs = [];
let tamanhoTotal = 0; // Variável para armazenar o tamanho total dos arquivos processados
let etapa1 = ''; // Marcador de tempo para início do processo
let etapa9 = ''; // Marcador de tempo para fim do processo

// Função principal que gerencia o fluxo do processo
async function main() {
  etapa1 = performance.now(); // Marca o início do processo
  reset(); // Reseta qualquer estado ou variável que precise ser inicializada no início
  const limit = pLimit(5); // Limita a quantidade de operações assíncronas simultâneas a 5
  let browser; // Declaração do objeto navegador para controle em caso de falha

  // Define o projeto e a pasta raiz com base nos argumentos fornecidos ao script
  projeto = process.argv.slice(2)[0];
  const raiz = projeto === '83' ? 'D:\\BDOC' : projeto === '82' ? 'D:\\BDOC 82' : '';

  if (!raiz) { // Verifica se o projeto é conhecido e tem uma pasta correspondente
    console.error('Projeto desconhecido:', projeto);
    return;
  }

  console.log('Projeto: P-' + projeto); // Log do projeto selecionado

  try {
    // Carrega a matriz de arquivos offline da pasta raiz
    matrizArquivosOffline = await gerenciador(raiz);

    // Inicializa o navegador e realiza autenticação para obter o token de acesso
    browser = await initializeBrowser();
    const bearerToken = await getDevToolsData(browser, 'https://integra-ext.petrobras.com.br/INTEGRA/#/');

    // Verifica a validade do token e, se inválido, reinicia o processo
    const tokenValido = await verificaToken(bearerToken, browser, main);
    if (!tokenValido) return; // Se o token não for válido, termina a execução

    // Configura o servidor com o token e o projeto em execução
    await setaServidor(bearerToken, projeto);

    // Busca a matriz de arquivos online a partir do token e do projeto
    const matrizArquivosOnline = await iniciaBuscaSkips(bearerToken, projeto);
    console.log('Matriz online:', matrizArquivosOnline.length);
    console.log('Matriz offline:', matrizArquivosOffline.length, (100 * (matrizArquivosOffline.length / matrizArquivosOnline.length)).toFixed(3), '%');

    // Compara as matrizes de arquivos online e offline
    matrizComparaArquivos = await comparaArquivos(matrizArquivosOnline, matrizArquivosOffline);
    console.log('Matriz comparação:', matrizComparaArquivos.length);

    // Define o intervalo de índice para processamento específico dos arquivos comparados
    const indiceInicio = 500;   // Ponto de início do intervalo
    const indiceFim = 800;      // Ponto de término do intervalo

    // Seleciona um subconjunto da matriz de comparação para processamento
    const limiteDeItens = matrizComparaArquivos.slice(indiceInicio, indiceFim);

    // Mapeia e processa os IDs dos arquivos, com controle de limite de promessas simultâneas
    const idResults = await Promise.allSettled(
      limiteDeItens.map((item, index) => {
        const nomeSemRevisao = item.split('_').slice(0, -1).join('_'); // Remove a última parte do nome (revisão)
        return limit(() => pegaID(nomeSemRevisao, bearerToken, index + indiceInicio)); // Adiciona 'indiceInicio' ao 'index' para manter o índice original
      })
    );

    // Processa os OBIDs a partir dos resultados dos IDs obtidos
    const obidResults = await Promise.allSettled(
      idResults
        .filter(retornoId => retornoId.status === 'fulfilled' && retornoId.value) // Filtra apenas resultados bem-sucedidos
        .map(retornoId => limit(() => pegaOBID(retornoId.value.Id, retornoId.value, bearerToken)))
    );

    // Constrói a matriz de OBIDs a partir dos resultados bem-sucedidos
    matrizOBIDs = obidResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    console.log('OBIDs processados:', matrizOBIDs.length);

    // Processa as URIs a partir dos OBIDs
    const uriResults = await Promise.allSettled(
      matrizOBIDs
        .filter(obid => obid) // Filtra resultados válidos
        .map(obid => limit(() => pegaURI(obid[0], obid, bearerToken)))
    );

    // Constrói a matriz de URIs e calcula o tamanho total dos arquivos
    matrizURIs = uriResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => {
        const uri = result.value;
        if (uri[3] && !isNaN(uri[3])) { // Verifica se o tamanho é um número válido
          tamanhoTotal += (1 * uri[3]); // Adiciona o tamanho de cada arquivo à soma total
        }
        const extMatch = uri[0].Uri.match(/.*\.(\w+)$/); // Extrai a extensão do arquivo
        return [uri[0].Uri, uri[2].Name + '_' + uri[2].Revision, uri[2].Title.toUpperCase(), extMatch ? extMatch[1] : ''];
      });

    console.log('Tamanho total dos arquivos:', formatarTamanhoTotal(tamanhoTotal)); // Exibe o tamanho total formatado

    // Inicializa a variável `listaFinal` com base no projeto atual para compor os links de download
    let listaFinal = '';

    if(projeto === '82'){
      listaFinal = matrizURIs.map(uri => `\n@{url = "${uri[0]}"; path = "D:\\BDOC 82\\Desordenado\\${uri[1]}.${uri[3]}"}`);
    }
    else if(projeto === '83'){
      listaFinal = matrizURIs.map(uri => `\n@{url = "${uri[0]}"; path = "D:\\BDOC\\Desordenado\\${uri[1]}.${uri[3]}"}`);
    }

    // Gera os links de download e salva em um arquivo
    downloadLinks(listaFinal, projeto);
    etapa9 = performance.now(); // Marca o fim do processo
    console.log('Total:', Math.ceil((etapa9 - etapa1) / 60000) + 'min'); // Exibe o tempo total de execução

  } catch (error) {
    // Captura e exibe erros que ocorrerem durante a execução
    console.error('Erro:', error);
  } finally {
    // Encerra e fecha o navegador caso tenha sido inicializado
    if (browser) {
      console.log('Terminando e fechando navegador.');
      await browser.close();
    }
  }
}

// Chama a função principal para iniciar a execução
main();

// Exporta o roteador para uso em outros módulos
module.exports = router;