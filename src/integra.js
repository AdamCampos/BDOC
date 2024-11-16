const express = require('express');
const router = express.Router();
const { initializeBrowser } = require('./services/browserService');
const { calculaToken } = require('./services/authService');
const { gerenciador, comparaArquivos } = require('./services/fileService');
const { pegaID } = require('./services/idService');
const { pegaOBID } = require('./services/obidService');
const { pegaURI } = require('./services/uriService');
const { iniciaBuscaSkips } = require('./services/searchService');
const { downloadLinks } = require('./services/downloadService');
const { reset } = require('./utils/helpers');
const { setaServidor } = require('./services/serverConfigService');
const { getDevToolsData } = require('./services/devToolsService');
const pLimit = require('p-limit');

let projeto = '';
let matrizArquivosOffline = [];
let matrizComparaArquivos = [];
let matrizOBIDs = [];
let matrizURIs = [];
let etapa1 = '';
let etapa9 = '';

// Função principal que gerencia todo o fluxo do processo
async function main() {
  // Reseta variáveis globais e inicia o processo
  reset();
  const limit = pLimit(5); // Define um limite de execução concorrente de promessas

  // Captura argumentos de linha de comando para definir o projeto
  const args = process.argv.slice(2);
  projeto = args[0];
  const raiz = projeto === '83' ? 'D:\\BDOC' : projeto === '82' ? 'D:\\BDOC 82' : '';

  // Verifica se o projeto é válido
  if (!raiz) {
    console.error('Projeto desconhecido:', projeto);
    return;
  }

  console.log('Projeto: P-' + projeto);

  // Gera a lista de arquivos offline para posterior comparação
  matrizArquivosOffline = await gerenciador(raiz);
  etapa1 = performance.now(); // Marca o tempo de início do processo

  // Inicia o navegador e captura o token de autenticação necessário
  const browser = await initializeBrowser();
  const bearerToken = await getDevToolsData(browser, 'https://integra-ext.petrobras.com.br/INTEGRA/#/');

  // Verifica se o token foi obtido com sucesso
  if (!bearerToken) {
    console.log('Erro ou timeout: Token não capturado em 2 minutos');
    await browser.close();
    setTimeout(main, 120000);
    return;
  }

  try {
    // Calcula o tempo de expiração do token e renova se necessário
    let expira = calculaToken(bearerToken);
    if (expira < 5) {
      await browser.close();
      console.log('Renovando o token...');
      setTimeout(main, (expira + 1) * 60000);
      return;
    }

    // Configura o projeto correto no servidor
    await setaServidor(bearerToken, projeto);

    // Lista de itens online e log da quantidade
    const matrizArquivosOnline = await iniciaBuscaSkips(bearerToken, projeto);
    console.log('Matriz online:', matrizArquivosOnline.length);
    console.log('Matriz offline:', matrizArquivosOffline.length, (100 * (matrizArquivosOffline.length / matrizArquivosOnline.length)).toFixed(3), '%');

    // Passo 4: Compara as listas online e offline e log do resultado
    matrizComparaArquivos = await comparaArquivos(matrizArquivosOnline, matrizArquivosOffline);
    console.log('Matriz comparação:', matrizComparaArquivos.length);

    // Limite de itens para processar (exemplo: 50)
    const limiteDeItens = 50;

    /**
     * Busca os IDs correspondentes aos documentos.
     * Limita a quantidade de itens e utiliza `p-limit` para controlar a concorrência.
     */
    const idResults = await Promise.allSettled(
      matrizComparaArquivos.slice(0, limiteDeItens).map((item, index) => {
        const nomeSemRevisao = item.split('_').slice(0, -1).join('_');
        return limit(() => pegaID(nomeSemRevisao, bearerToken, index));
      })
    );

    // Processa os IDs retornados e busca os OBIDs
    const matrizPromisesOBIDs = [];
    for (const retornoId of idResults) {
      if (retornoId.status === 'fulfilled' && retornoId.value) {
        try {
          matrizPromisesOBIDs.push(limit(() => pegaOBID(retornoId.value.Id, retornoId.value, bearerToken)));
        } catch (error) {
          console.error('Erro ao adicionar promessa de OBID:', error);
        }
        // Delay de 100ms entre as chamadas para evitar sobrecarga no servidor
        await new Promise(resolve => setTimeout(resolve, 100));
      } else if (retornoId.status === 'rejected') {
        console.error('Erro na promessa de ID:', retornoId.reason);
      }
    }

    /**
     * Resolve as promessas de OBID.
     * Filtra as promessas bem-sucedidas e adiciona ao array de OBIDs processados.
     */
    matrizOBIDs = (await Promise.allSettled(matrizPromisesOBIDs))
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    console.log('OBIDs processados:', matrizOBIDs.length);

    /**
     * Busca as URIs correspondentes aos OBIDs obtidos.
     * Limita a quantidade de requisições simultâneas usando `p-limit`.
     */
    const matrizPromisesURIs = matrizOBIDs.map(obid => obid ? limit(() => pegaURI(obid[0], obid, bearerToken)) : null);

    /**
     * Processa as promessas de URIs.
     * Filtra as URIs válidas e as formata para download.
     */
    matrizURIs = (await Promise.allSettled(matrizPromisesURIs))
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => {
        const uri = result.value;
        const extMatch = uri[0].Uri.match(/.*\.(\w+)$/);
        return [uri[0].Uri, uri[2].Name + '_' + uri[2].Revision, uri[2].Title.toUpperCase(), extMatch ? extMatch[1] : ''];
      });

    console.log('URIs processadas:', matrizURIs.length);

    // Gera a lista final para download e inicia o processo de download
    let listaFinal = matrizURIs.map(uri => `\n@{url = "${uri[0]}"; path = "D:\\BDOC\\Desordenado\\${uri[1]}.${uri[3]}"}`);
    downloadLinks(listaFinal, projeto);
    etapa9 = performance.now(); // Marca o tempo final
    console.log('Total:', Math.ceil((etapa9 - etapa1) / 60000) + 'min');
  } catch (error) {
    console.log('Erro:', error);
  } finally {
    console.log('Terminando e fechando navegador.');
    await browser.close();
  }
}

main();

module.exports = router;
