// Importando módulos necessários para o funcionamento do aplicativo

// Módulos externos
const express = require('express');
const pLimit = require('p-limit'); // Controla a quantidade de promessas simultâneas para evitar sobrecarga

// Configuração do router
const router = express.Router();

// Serviços locais (ordenados por pasta e nome do arquivo)
const { verificaToken } = require('./services/authService'); // Verifica a validade do token de autenticação
const { initializeBrowser } = require('./services/browserService'); // Inicializa o navegador para automação
const { downloadLinks } = require('./services/powershell'); // Gera links de download para arquivos processados
const { getDevToolsData } = require('./services/devToolsService'); // Obtém dados de ferramentas de desenvolvimento para autenticação
const { gerenciador, comparaArquivos, formatarTamanhoTotal } = require('./services/fileService'); // Gerencia arquivos offline e compara arquivos online e offline
const { iniciaBuscaSkips } = require('./services/searchService'); // Inicia busca por arquivos online
const { pegaID } = require('./services/idService'); // Obtém ID associado a um arquivo específico
const { pegaOBID } = require('./services/obidService'); // Obtém OBID, que pode representar uma identificação específica de um documento
const { pegaURI } = require('./services/uriService'); // Obtém URI de um arquivo e formata o tamanho total dos arquivos
const { setaServidor } = require('./services/serverConfigService'); // Configura o servidor para o processo atual

// Utilitários
const { reset, tableLog, displayLogTable } = require('./utils/helpers'); // Reseta variáveis ou estados no início da execução
const { agora } = require('./utils/helpers'); // Importação da função agora() do módulo helpers

//==========================================================================================================================================================================//

// Variáveis globais que armazenam dados ao longo da execução do script
let projeto = '';
let matrizArquivosOffline = [];
let matrizComparaArquivos = [];
let matrizURIs = [];
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
  // const raiz = projeto === '83' ? 'D:\\BDOC' : projeto === '82' ? 'D:\\BDOC 82' : '';
  const raiz = projeto === '83' ? 'D:\\BDOC' : projeto === '82' ? 'C:\\Users\\nvmj\\PETROBRAS\\BUZIOS PPO IPO PRE-OP-P82 - 01 - INTEGRA OFFLINE' : '';

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

    // Passa a função `main` como callback para reiniciar o fluxo, ajustando a integração com `verificaToken`.
    const tokenValido = await verificaToken(bearerToken, browser, async () => {
      console.log('[Integra]: Reiniciando o fluxo principal...');
      await main(); // Chama novamente o fluxo principal
    });

    if (!tokenValido) {
      console.log('[Integra]: Processo pausado para renovação de token.');
      return; // Aguarda o reinício definido em `verificaToken`
    }

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
    //Isto é útil quando queremos processar só uma parte da matriz. OffSet é onde a contagem começará. Este valor multiplica de 
    const offSet = 5;
    const numeroDeItens = 500;

    const indiceInicio = (1 * (offSet - 1) * numeroDeItens);   // Ponto de início do intervalo
    const indiceFim = (1 * offSet * numeroDeItens);      // Ponto de término do intervalo

    // Seleciona um subconjunto da matriz de comparação para processamento
    const limiteDeItens = matrizComparaArquivos.slice(indiceInicio, indiceFim);

    // Mapeia e processa os IDs dos arquivos, com controle de limite de tempo entre as promessas
    let delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    // //==========================================================================================================================================================================//
    // [ IDs ]

    agora(`Início IDs`);

    let duration = '';

    const idResults = [];
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Função de delay

    for (let index = 0; index < limiteDeItens.length; index++) {
      const item = limiteDeItens[index];
      const nomeSemRevisao = item.split('_').slice(0, -1).join('_'); // Remove a última parte do nome (revisão)
      await delay(180); // Aplica o delay de 180ms

      try {
        const startTime = performance.now(); // Tempo inicial
        const result = await pegaID(nomeSemRevisao, bearerToken, index + indiceInicio); // Chama a função
        const endTime = performance.now(); // Tempo final

        duration = (0.001 * (endTime - startTime)).toFixed(2); // Duração em segundos
        //console.log(`[${index}] Duração: ${duration}s`);

        idResults.push({ status: 'fulfilled', value: result });
      } catch (error) {
        console.error(`[${index}] Erro ao processar pegaID: ${error.message}`);
        idResults.push({ status: 'rejected', reason: error });
      }
    }
    agora(`Duração total Id: ${duration}s`)
    console.log('IDs processados:', idResults.length);
    //==========================================================================================================================================================================//
    // [ OBIDs ]

    console.log(`OBIDs`);

    const obidResults = [];
    let loopStartTime = performance.now(); // Tempo de início do processamento

    // Processa as IDs com um delay constante e limite de concorrência
    await Promise.allSettled(
      idResults.map((retornoId, index) =>
        limit(async () => {
          if (retornoId.status === 'fulfilled' && retornoId.value) {
            await delay(180); // Delay fixo de 190 ms

            try {
              const startTime = performance.now();
              const result = await pegaOBID(retornoId.value.Id, retornoId.value, bearerToken);

              duration = ((performance.now() - loopStartTime) / 1000).toFixed(2); // Duração desde o início do processamento
              const name = Array.isArray(result) && result[1]?.Name ? result[1].Name : "N/A";

              //console.log(`[${index}] Duração: ${duration}s, Name: ${name}`);

              obidResults.push({ status: 'fulfilled', value: result });
            } catch (error) {
              console.error(`[${index}] Erro ao processar pegaOBID: ${error.message}`);
              obidResults.push({ status: 'rejected', reason: error });
            }
          }
        })
      )
    );

    // Constrói a matriz de OBIDs a partir dos resultados bem-sucedidos
    const matrizOBIDs = obidResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    console.log(`Duração total OBId: ${duration}s`);
    console.log('OBIDs processados:', matrizOBIDs.length);

    //==========================================================================================================================================================================//
    // [ URIs ]

    console.log(`URIs`);
    loopStartTime = performance.now(); // Tempo de início do loop
    let uriResults = await Promise.allSettled(
      matrizOBIDs
        .filter(obid => {
          // Garante que obid seja um array e tenha o primeiro elemento
          const isValid = Array.isArray(obid) && obid.length > 0;
          return isValid;
        })
        .map(async (obid, index) => {
          // Atrasa a execução em 150ms por índice
          await delay(180 * (index + 1));

          try {
            // Executa a função assíncrona e aguarda o resultado
            const resultado = await limit(() => pegaURI(obid[0], obid, bearerToken));

            const endTime = performance.now(); // Captura o tempo de término para cada iteração
            const durationFromLoopStart = (0.001 * (endTime - loopStartTime)).toFixed(2); // Diferença desde o início do loop

            // Mostra no console o índice, o OBID processado e o tempo de execução desde o início do loop
            //console.log(`[${index}] Duração: ${durationFromLoopStart}s, OBID: ${obid[0]}`);

            return resultado;
          } catch (error) {
            console.error(`[${index}] Erro ao processar pegaURI para OBID: ${obid[0]} - ${error.message}`);
            throw error;
          }
        })
    );

    console.log('Resultados URI processados:', uriResults.length);

    const LIMITE_GB = 4; // Limite em GB
    const LIMITE_BYTES = LIMITE_GB * 1024 * 1024 * 1024; // Limite convertido para bytes

    const resultadoFinal = []; // Armazena os itens processados
    let tamanhoTotal = 0; // Acumulador de tamanho total

    for (const result of uriResults) {
      if (result.status === 'fulfilled' && result.value) {
        const uris = result.value;

        for (const uri of uris) {
          // Verifica se já atingiu o limite
          if (tamanhoTotal >= LIMITE_BYTES) {
            break;
          }

          // Verifica e acumula o tamanho total de cada URI
          if (uri.Tamanho && !isNaN(uri.Tamanho)) {
            tamanhoTotal += (1 * uri.Tamanho); // Soma o tamanho ao total acumulado
          }

          let extMatch = '';
          try {
            // Verifica se a URI existe antes de tentar acessar
            if (uri.URI) {
              extMatch = uri.URI.match(/.*\.(\w+)$/); // Extrai a extensão do arquivo
            } else {
              console.warn(`URI ausente em: ${JSON.stringify(uri.Name)}`);
            }
          } catch (error) {
            console.error(`Erro ao extrair extensão da URI: ${uri.URI}. Detalhes: ${error.message}`);
            extMatch = null; // Define como nulo em caso de erro
          }

          // Adiciona o item ao resultado final
          resultadoFinal.push([
            uri.URI || '', // Garante que não insira `undefined`
            `${uri.Name}_${uri.Revision}_PARTE_${uri.Parte}`,
            uri.Title ? uri.Title.toUpperCase() : '', // Garante que Title existe
            extMatch ? extMatch[1].toLowerCase() : '' // Se não houver correspondência, retorna string vazia
          ]);

          // Verifica novamente após adicionar
          if (tamanhoTotal >= LIMITE_BYTES) {
            console.log(`Limite de ${LIMITE_GB} GB atingido. Parando o processamento.`);
            break;
          }
        }

        // Interrompe o processamento global após o limite
        if (tamanhoTotal >= LIMITE_BYTES) break;
      }
    }

    matrizURIs = resultadoFinal; // Atualiza a matriz com os itens processados
    console.log('Matriz URI:', matrizURIs.length);
    console.log('Tamanho total dos arquivos:', formatarTamanhoTotal(tamanhoTotal)); // Exibe o tamanho total formatado

    // Inicializa a variável `listaFinal` com base no projeto atual para compor os links de download
    let listaFinal = '';

    if (projeto === '82') {
      listaFinal = matrizURIs.map(uri => `\n@{url = "${uri[0]}"; path = "D:\\BDOC 82\\Desordenado\\${uri[1]}.${uri[3]}"}`);
    }
    else if (projeto === '83') {
      listaFinal = matrizURIs.map(uri => `\n@{url = "${uri[0]}"; path = "D:\\BDOC\\Desordenado\\${uri[1]}.${uri[3]}"}`);
    }

    // Gera os links de download e salva em um arquivo
    await downloadLinks(listaFinal, projeto);
    etapa9 = performance.now(); // Marca o fim do processo

    // Substitua os console.log por tableLog
    tableLog('Projeto', `P-${projeto}`);
    tableLog('Matriz online', matrizArquivosOnline.length);
    tableLog('Matriz offline', `${matrizArquivosOffline.length} (${(100 * (matrizArquivosOffline.length / matrizArquivosOnline.length)).toFixed(3)}%)`);
    tableLog('Matriz comparação', matrizComparaArquivos.length);
    tableLog('OBIDs processados', matrizOBIDs.length);
    tableLog('Matriz URI', matrizURIs.length);
    tableLog('Tamanho total dos arquivos', formatarTamanhoTotal(tamanhoTotal));
    tableLog('Tempo total', `${Math.ceil((etapa9 - etapa1) / 60000)}min`);
    tableLog('-----------------------------', '-----------------------------');
    // Exiba os logs no final do processo
    displayLogTable();

    // Verifica se matrizComparaArquivos é maior que 200
    if (matrizComparaArquivos.length > 200) {
      console.log('MatrizComparaArquivos contém mais de 200 itens. Reiniciando o processo.');

      // Fecha o navegador
      if (browser) {
        console.log('Fechando o navegador...');
        await browser.close();
      }

      // Aguarda 1 minuto antes de reiniciar
      console.log('Aguardando 1 minuto antes de reiniciar o processo...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Pausa de 1 minuto

      // Reinicia o processo chamando main novamente
      console.log('Reiniciando o processo...');
      await main(); // Chama a função main novamente
    } else {
      console.log('Processo finalizado. MatrizComparaArquivos contém 200 itens ou menos.');
    }

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