//#region importações
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');
const caminhoCurto = require('path');
const path = require('path');
const CHROME_PATH = 'C:\\Users\\nvmj\\Desktop\\NodeJS\\chrome\\win64-127.0.6533.72\\chrome-win64\\chrome.exe';
const COOKIES_FILE_PATH = 'C:\\Users\\nvmj\\AppData\\Local\\Google\\Chrome for Testing\\User Data\\Default\\Network\\cookies.json';
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const arrayDePromessas = [];
let raiz = '';
let projeto = '';
let matrizArquivosOnline = [];
let matrizArquivosOffline = [];
let matrizComparaArquivos = [];
let matrizPromisesIds = [];
let matrizPromisesOBIDs = [];
let matrizPromisesURIs = [];
let matrizConcatenada = [];
let matrizIDs = [];
let matrizOBIDs = [];
let matrizURIs = [];
let tamanho = 0;
let etapa1 = '';
let etapa2 = '';
let etapa3 = '';
let etapa4 = '';
let etapa5 = '';
let etapa6 = '';
let etapa7 = '';
let etapa8 = '';
let etapa9 = '';
//#endregion importações

async function main() {

  //#region definição de projeto
  const args = process.argv.slice(2);
  projeto = args[0];
  if (projeto === '83') {
    raiz = 'D:\\BDOC';
  }
  else if (projeto === '82') {
    raiz = 'D:\\BDOC 82';
  }

  console.log('Projeto: P-' + projeto);
  //#endregion definição de projeto

  //Limpa as variáveis
  reset();

  //Inicia busca offline
  await gerenciador(raiz);

  //=====================================================================================================================================================//

  //Usado para contar o tempo dercorrido. Etapa 1 é o tempo inicial.
  etapa1 = performance.now();

  //#region navegador e token

  //Passo 1: Abre o navegador usando o endpoint do express (localhost:9222).
  //Pode abrir com ou sem a janela. Com a janela aljuda a depurar problemas, como login
  //a variável browser é assíncrona. Então será necessário resolvê-la para ser usada

  try {
    browser = await puppeteer.connect({ browserWSEndpoint: 'ws://localhost:9222' });
  } catch (e) {
    console.log('Iniciando navegador...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=9222', '--user-data-dir=C:\\Users\\nvmj\\Desktop\\NodeJS\\api']
    });
  }
  //=====================================================================================================================================================//

  //Assim que conseguir abrir o browser, é iniciada uma sequência. O browser tenta abrir o site do Integra e espera algumas respostas via DevTools, inclusive 
  //o token. Esta etapa deve demorar cerca de 30 segundos, e existe um timeout para, caso o site não responda, se encerrar a sessão em 2 minutos.
  //Quando expirar o tempo de 2 minutos, o navegador é reabero e tenta-se novamente, entrando neste loop.
  const bearerToken = await getDevToolsData(browser, 'https://integra-ext.petrobras.com.br/INTEGRA/#/');

  if (!bearerToken || bearerToken === '') {
    console.log('Erro ou timeout: Token não capturado em 2 minutos');
    await browser.close();
    setTimeout(() => {
      main();
    }, 120000);  // Reexecuta em 120 segundos
    return;
  }
  //=====================================================================================================================================================//

  //Se conseguir na etapa anterior um token, é necessário saber se ele vai estar ativo até o final da sessão. Se ele expirar antes de terminar desta etapa 
  //até o fim dos downloads algumas inconsitências acontecerão. Pode não conseguir obter informações online ou não conseguir baixar os documentos.
  let expira = calculaToken(bearerToken);

  //Se o token estiver prestes a expirar, ele esperará expirar e reiniciará o processo.
  if (expira < 5) {
    console.log(`Token prestes a expirar ${expira} . Renovando token...`);
    await browser.close();
    setTimeout(() => {
      main();
    }, ((expira + 1) * 60000));
    return;
  }
  //=====================================================================================================================================================//
  if (bearerToken && bearerToken !== '') {
    try {
      let expira = calculaToken(bearerToken);
      if (expira < 5) {
        await browser.close();
        console.log('Renovando o token...');
        setTimeout(() => {
          main();
        }, ((expira + 1) * 60000));
      }

      //=====================================================================================================================================================//

      //Seta o projeto correto no Integra. Isto é necessário por que a query é realizada em todos os bancos, mas só é interessante o retorno do banco correto.
      await setaServidor(bearerToken, projeto);

      //#endregion navegador e token
      
      
  //=====================================================================================================================================================//
      
  //Passo 2: conseguir o número de itens online.
  //Esta etapa é bem complexa, exige vários passos. A ideia é saber quantos itens com status current existe no Integra.
  //Depois é necessário saber quais os nomes destes arquivos. Ao mesmo tempo o programa está obtendo as informações sobre os arquivos offline.
  //As istas online e offline são confrontadas, e o que houver divergência na lista offline, será atualizado com dados online.
  //Então é listado o resumo do que se deve buscar no Integra.
  contagemOnLine = await pegaContagemSkips(bearerToken);

      //Passo 3: conseguir uma lista de itens online
      const numeroPaginas = await iniciaBuscaSkips(contagemOnLine, bearerToken);

      //Lê linha a linha da resposta e concatena o nome à revisão do documento.
      //Esta concatenação deverá ser comparada aos arquivos atuais offline.

      processarNumeroPaginas(numeroPaginas);

      async function processarNumeroPaginas(numeroPaginas) {

        // Função que retorna uma Promise com um atraso de 100ms
        function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Itera sobre cada item de forma assíncrona com delay
        for (const item of numeroPaginas) {
          await Promise.all(item.data.value.map(async (dado) => {
            matrizArquivosOnline.push(dado.Name + '_' + dado.Revision);

            // Aguarda 100ms antes de continuar para o próximo item
            await delay(100);
          }));
        }

        etapa4 = performance.now();
        console.log('Matriz online             :', matrizArquivosOnline.length);
        console.log('Matriz offline            :', matrizArquivosOffline.length, (100 * (matrizArquivosOffline.length / matrizArquivosOnline.length)).toFixed(3), '%');

        //Passo 4: Comparar as listas online e offline. Isto irá gerar uma matriz menor
        //A matriz pode demorar a ser populada, então espera-se o resultado.
        try {
          matrizComparaArquivos = await comparaArquivos(matrizArquivosOnline, matrizArquivosOffline);
          console.log('Matriz comparação         :', matrizComparaArquivos.length);

          etapa5 = performance.now();
          //console.log('Tempo para comparação: ', Math.ceil((etapa5 - etapa4) / 1000) + 's');

        } catch (erro) {
          console.error('Ocorreu um erro:', erro);
        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //Etapas apenas com os itens filtrados

        //Passo 5: Busca online o ID dado um nome de documento sem a revisão.
        //Item carrega o nome do documento e a revisão. A função pegaId é chamada uma vez por item na lista 
        //e recebe o nome do arquivo sem a revisão. Para cada chamada da função é retornado o ID.
        //Dentro do retonrno há um objeto, e um dos parâmetros é o ID.
        //O ID é inserido em uma lista (matrizPromiseIds) e será usado para se obter o OBID. 

        matrizOBIDs = await retornaPrimeiraParte(bearerToken, matrizComparaArquivos, 0);

        // Passo 7: Busca URI dado um OBID de documento.
        try {

          const reg = new RegExp('https://integra-ext.petrobras.com.br/SPFViewDir/.*/.*/(.*)');
          const regExtensao = new RegExp('(.*)[.]([a-zA-Z0-9]{1,5}$)');

          matrizPromisesURIs = matrizOBIDs.map((obid) => {
            if (obid && obid !== undefined) {
              return pegaURI(obid[0], obid, bearerToken);
            }
          });

          console.log('Matriz URI                :', matrizPromisesURIs.length);

          matrizURIs = (await Promise.all(matrizPromisesURIs)).map((uri, index) => {
            if (uri && uri !== undefined) {
              tamanho += (1 * uri[0].ContentLength);
              const matchRegex = uri[0].Uri.match(reg);
              const matchRegexExtensao = matchRegex[1].match(regExtensao);

              if (index + 1 >= matrizPromisesURIs.length) {
                //console.log('1', Math.ceil(tamanho));

                if (1 * tamanho > 1073741824) {
                  console.log('Tamanho do download       :', (1 * tamanho / (1073741824)).toFixed(1), 'GB');
                }
                else if (1 * tamanho > 1048576) {
                  console.log('Tamanho do download       :', (1 * tamanho / (1048576)).toFixed(1), 'MB');
                }
                else if (1 * tamanho > 1024) {
                  console.log('Tamanho do download       :', (tamanho / 1024).toFixed(1), 'kB');
                }
              }

              return [uri[0].Uri, uri[2].Name + '_' + uri[2].Revision, uri[2].Title.toUpperCase(), matchRegexExtensao[2].toLowerCase()];
            }
          });


          etapa8 = performance.now();
          //console.log('URI filtrado: ', Math.ceil((etapa8 - etapa7) / 1000) + 's');

        } catch (erro) {
          console.error('Ocorreu um erro em URI:', erro);
        } finally {
          console.log('Fechando navegador        |');
          try {
            await browser.close();
          }
          catch (error) {
            //console.log(error);
          }
        }

        //Passo 8: Download.
        let listaFinal = [];
        matrizURIs.map((uri, index) => {
          if (uri) {
            //console.log(index, uri);
            if (projeto === '83') {
              listaFinal.push('\n@{url = "' + uri[0] + '"; path = "D:\\BDOC\\Desordenado\\' + uri[1] + '.' + uri[3] + '"}');
            }
            else if (projeto === '82') {
              listaFinal.push('\n@{url = "' + uri[0] + '"; path = "D:\\BDOC 82\\Desordenado\\' + uri[1] + '.' + uri[3] + '"}');
            }
          }

          if (index + 1 >= matrizURIs.length && index > 0) {
            downloadLinks(listaFinal);
            etapa9 = performance.now();
            console.log('Total                     : ', Math.ceil((etapa9 - etapa1) / 60000) + 'min');
          }

        })

      }
      console.log('==================================================================================================================');
    } catch (error) {
      console.log('Fechando navegador por erro.', error);
      try {
        await browser.close();
      }
      catch (error) {
        //console.log(error);
      }
    } finally {
      console.log('Terminando e fechando navegador.');
      try {
        await browser.close();
      }
      catch (error) {
        console.log(error);
      }
    }
  }
}

//////////////////////////////////////////////////////////////
async function retornaPrimeiraParte(bearerToken, matrizComparaArquivos, i) {
  try {

    matrizPromisesIds = matrizComparaArquivos.map((item, index) => {
      if (index >= 0 && index < 500) {
        const nomeSemRevisao = item.split('_').slice(0, -1).join('_');
        return pegaID(nomeSemRevisao, bearerToken, index);
      }
    });

    // etapa6 = performance.now();
    //console.log('ID filtrado: ', Math.ceil((etapa6 - etapa5) / 1000) + 's');
    console.log('Matriz ID                 :', matrizPromisesIds.length);

    //Passo 6: Busca online o OBID dado um ID de documento.
    await Promise.allSettled(matrizPromisesIds).then((item, index) => {

      console.log('*matrizPromisesIds', item);
      item.forEach((retornoId, index) => {

        if (retornoId && retornoId.value && retornoId.value.Id && retornoId.value !== undefined) {
          console.log('*retornoId.value', retornoId.value);
          matrizPromisesOBIDs.push(pegaOBID(retornoId.value.Id, retornoId.value, bearerToken));
        }
      })
    });

    try {

      console.log('Matriz OBID               :', matrizPromisesOBIDs.length);

      matrizOBIDs = (await Promise.all(matrizPromisesOBIDs)).map((obid) => {
        if (obid && obid !== undefined) {
          return obid;
        }
      });

      etapa7 = performance.now();
      console.log('OBID filtrado: ', Math.ceil((etapa7 - etapa6) / 1000) + 's');

    } catch (erro) {
      console.error('Ocorreu um erro em OBID:', erro);
    }

    return matrizOBIDs;

  } catch (erro) {
    console.error('Ocorreu um erro:', erro);
  }
}
//////////////////////////////////////////////////////////////
async function comparaArquivos(matrizArquivosOnline, matrizArquivosOffline) {

  return new Promise((resolve) => {
    // Filtrar os itens que estão em matrizArquivosOnline mas não em matrizArquivosOffline
    const resultado = matrizArquivosOnline.filter(item => !matrizArquivosOffline.includes(item));
    resolve(resultado);
  });
};
//////////////////////////////////////////////////////////////
const gerenciador = async (directoryPath) => {
  try {
    await loopBuscaArquivos(directoryPath);
  } catch (error) {
    console.error('Erro ao ler arquivos offline:', error);
  }
};
//////////////////////////////////////////////////////////////
const loopBuscaArquivos = (caminhoDiretorio) => {
  const leDiretorio = (dir, nivel = 0, maxDepth = 2) => {
    return promiseLerDiretorio(dir)
      .then(items => {
        const promises = items.map(item => {

          const caminhoCompleto = caminhoCurto.join(dir, item.name);

          //Testa se o item lido é pasta
          if (item.isDirectory()) {

            //D:\BDOC
            if (nivel === 0) {
              return leDiretorio(caminhoCompleto, nivel + 1, 2);
            }
            //D:\BDOC\1200
            else if (nivel === 1) {
              return leDiretorio(caminhoCompleto, nivel + 1, maxDepth);
            }
            //D:\BDOC\1200\DE
            else if (nivel === 2) {

              if (!matrizArquivosOffline.includes(item.name)) {
                matrizArquivosOffline.push(item.name);
              }
              return leDiretorio(caminhoCompleto, nivel + 1, maxDepth);
            }

            //Testa se o item lido é arquivo
          } else if (item.isFile()) {

            //D:\BDOC\1200\DE
            if (nivel === 2) {

              if (!matrizArquivosOffline.includes(item.name)) {
                //Retira extensão
                const nomeSemExtensao = item.name.split('.').slice(0, -1).join('.');
                matrizArquivosOffline.push(nomeSemExtensao);
              }
            }
          }
          return Promise.resolve();
        });
        return Promise.all(promises);
      });
  };

  return leDiretorio(caminhoDiretorio, 0, 2).then(() => matrizArquivosOffline);
};
//////////////////////////////////////////////////////////////
const promiseLerDiretorio = (directoryPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, { withFileTypes: true }, (err, items) => {
      if (err) {
        reject(err);
      } else {
        resolve(items);
      }
    });
  });
};
//////////////////////////////////////////////////////////////
async function getDevToolsData(browser, url) {

  // Abre uma nova página
  const page = await browser.newPage();
  await carregaCookies(page);

  let headers = null;
  await page.setRequestInterception(true);


  let retornaToken = ''
  await page.on('request', request => {

    if (request.url() == 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/User') {
      headers = request.headers();
      if (headers['authorization']) {
        retornaToken = (headers['authorization'].toString());
      };
    }
    request.continue();
  });

  // Acessa a URL especificada
  await page.goto(url, { timeout: 60000 });

  await PromiseTimeout(120000);

  await salvaCookies(page);
  return retornaToken;

};
//////////////////////////////////////////////////////////////
function PromiseTimeout(delayms) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, delayms);
  });
};
//////////////////////////////////////////////////////////////
async function pegaID(termo, token, index) {

  return new Promise((resolve, reject) => {
    //console.log('***PEGAID***', termo, index);
    axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=1&%24filter=(Name%20eq%20%27'
      + termo + '%27%20and%20Status%20eq%20%27CURRENT%27)&%24count=false&%24skip=0', {
      headers: {
        'Authorization': token
      }
    }).then((response) => {
      //console.log('*response', termo, index, response);
      resolve(response.data.value[0]);
    }).catch((error) => {
      if (error.response) {
        console.log('status', error.status);
        resolve('');
      }
    })
  });

};
//////////////////////////////////////////////////////////////
async function pegaOBID(id, item, token) {

  console.log('Pegando OBID - Item:', item, 'iD:', id);

  return new Promise((resolve, reject) => {
    //console.log('id', id, 'item', item);
    axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Objects?$filter=(OBID%20eq%20%27' + id
      + '%27)&$select=Name,OBID&$expand=SPFFileComposition_21($filter=Interfaces%20eq%20%27ISPFBusinessFile%27%20and%20SPFViewInd%20eq%20%27true%27%20or%20SPFEditInd%20eq%20%27true%27)&$top=1&$count=true', {
      headers: {
        'Authorization': token
      }
    }).then((response) => {
      console.log(response.data.value[0]);
      if (response.data.value[0].OBID && response.data.value[0].SPFFileComposition_21[0] && response.data.value[0].SPFFileComposition_21[0].OBID) {
        console.log('Buscando OBID de ID: ' + id + ' OBID0: ' + response.data.value[0].OBID + ' OBID1: ' + response.data.value[0].SPFFileComposition_21[0].OBID);
        resolve([response.data.value[0].SPFFileComposition_21[0].OBID, item]);
      }
      else if (response.data.value[0].OBID) {
        resolve([response.data.value[0].OBID, item]);
      }
      else {
        resolve(item);
      }
    }).catch((error) => {
      //console.log(error);
      resolve(item);
    })
  })
};
//////////////////////////////////////////////////////////////
async function pegaURI(obid, item, token) {

  return new Promise((resolve, reject) => {

    axios.get("https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Files('" + obid + "')/Intergraph.SPF.Server.API.Model.RetrieveFileUris", {
      headers: {
        'Authorization': token
      }
    }).then((response) => {

      if (response.data.value[0].Uri) {
        resolve([response.data.value[0], ...item]);
      }
      else {
        resolve(item);
      }

    }).catch((error) => {
      if (error) {
        //console.log('Erro buscando uri de OBID :', obid, item[1].Name);
        resolve(error.status);
      }
      resolve(error.status);
    })

  })
};
//////////////////////////////////////////////////////////////
async function salvaCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookies, null, 2));
  //console.log('Cookies salvos em', COOKIES_FILE_PATH);
};
//////////////////////////////////////////////////////////////
async function carregaCookies(page) {
  if (fs.existsSync(COOKIES_FILE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE_PATH));
    await page.setCookie(...cookies);
    //console.log('Cookies carregados de', COOKIES_FILE_PATH);
  }
};
//////////////////////////////////////////////////////////////
//A função resolve() retorna o valor para a função chamadora
async function pegaContagemSkips(token) {

  etapa2 = performance.now();

  //console.log('Busca do token: ', Math.ceil((etapa2 - etapa1) / 1000) + 's');

  return new Promise((resolve, reject) => {

    let url = '';

    if (projeto === '83') {
      url = 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=25&%24filter=(contains(Name%2C%27*3010.2J*%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true';
    } else if (projeto === '82') {
      url = 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=25&%24filter=(contains(Name%2C%27*3010.2N*%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true';
    }

    axios.get(url, {
      headers: {
        'Authorization': token
      }

    }).then((response) => {

      if (response.data['@odata.count']) {
        resolve(Math.floor(response.data['@odata.count'] / 1000));
        etapa3 = performance.now();
        console.log('Busca do número de itens online: ', 'itens:', response.data['@odata.count'], Math.ceil((etapa3 - etapa2) / 1000) + 's');
      }
    })
  })
};
//////////////////////////////////////////////////////////////
//O Integra separa a visualização de resultados em páginas com até 1.000 itens.
//Se a pesquisa anterior (pegaContagemSkips(bearerToken)) por exemplo retornar 43.000 itens
//quer dizer que haverá 43 links, diferenciando-se apenas pelo valor do skip, que irá 
//de 0 a 42.
async function iniciaBuscaSkips(numeroSkip, bearerToken) {

  try {
    //A etapa abaixo esperará o término da função (chamaMultiplasPesquisas(numeroSkip, bearerToken))
    return await pesquisas(numeroSkip, bearerToken)

  } catch (error) {
    console.error('Falhou em alguma das buscas: ', error);
  }
};
//////////////////////////////////////////////////////////////
const pesquisas = async (numeroSkip, bearerToken) => {

  try {

    //Chama função que dispara várias pesquisas. Esta função é simples, mas resultará em 
    //uma lista de Promises, carregada em arrayDePromessas.
    agendaPromessas(numeroSkip, bearerToken);

    //Espera todas as pesquisas executarem.
    return await Promise.all(arrayDePromessas);

  }
  catch (error) {
    console.error('Erro ao buscar:', error);
  }
};
//////////////////////////////////////////////////////////////
async function agendaPromessas(numeroSkip, bearerToken) {

  //Faz quantas pesquisas forem necessárias, definidas por numeroSkip
  for (let i = 0; i < numeroSkip + 1; i++) {
    //É necessário colocar todas as promises dentro de um array para Promises.all conseguir resolver
    //A função buscaPeloSkip, parametriza a pesquisa usando o valor de i. O retorno deve ser uma lista com
    //até 1.000 itens por chamada.
    //O arrayDePromessas recebe apenas a promessa de execução. Caso seja executado, será possível
    //aplicar um then().
    arrayDePromessas.push(buscaPeloSkip(i, bearerToken));
  }
};
//////////////////////////////////////////////////////////////
const buscaPeloSkip = (i, bearerToken) => {

  let url = '';
  if (projeto === '83') {
    url = '3010.2J';
  } else if (projeto === '82') {
    url = '3010.2N';
  }

  //O resultado de cada pesquisa irá ser colocado dentro da matriz arrayDePromessas
  return axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=' +
    1000 + '&%24filter=(contains(Name%2C%27' + url + '%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true&%24skip=' +
    (1000 * i), {
    headers: {
      'Authorization': bearerToken
    }
  }).then(retorno => {
    return retorno;
  })

};
//////////////////////////////////////////////////////////////
function calculaToken(t) {
  const base64 = t.split('.')[1].replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64).split("").map(function (item) {
      return "%" + ("00" + item.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
  const { exp } = JSON.parse(jsonPayload);
  let expiraEm = ((((exp * 1000) - Date.now()) / 60000).toFixed(0));

  return expiraEm;
};
//////////////////////////////////////////////////////////////
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
        }

        else {
          reject(new Error('Projeto desconhecido'));
          return;
        }

      });

      // Verifica se o projeto já está correto
      if (projetoCorreto) {
        console.log('Projeto', projeto, 'correto');
        resolve('Projeto já está configurado corretamente');
        return;
      } else {

        console.log('Vamos setar corretamente', config);

        // Realiza a configuração correta se necessário
        axios.post('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/SetConfig', config, {
          headers: {
            'Authorization': token
          }
        }).then((response) => {
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
//////////////////////////////////////////////////////////////
// Função para download e criação do script PowerShell de download
async function downloadLinks(listaFinal) {
  let append = '\n$workers = foreach ($f in $files) {\n$wc = New-Object System.Net.WebClient \nWrite-Output $wc.DownloadFileTaskAsync($f.url, $f.path) \n}\n$workers.Result';

  let caminhoSaida = '';
  let origem = '';

  if (projeto === '83') {
    origem = 'D:\\BDOC';
    caminhoSaida = path.join(origem, 'listaDownload.ps1');
  } else if (projeto === '82') {
    origem = 'D:\\BDOC 82';
    caminhoSaida = path.join(origem, 'listaDownload.ps1');
  }

  // Cria o arquivo listaDownload.ps1 com a lista de arquivos para download
  fs.writeFileSync(caminhoSaida, '$files = @(\n' + listaFinal + '\n)' + append);

  agora();
  console.log('Inicia download');
  // Executa o script listaDownload.ps1 para realizar o download dos arquivos
  await executarScriptPowerShell(caminhoSaida);
  agora();
  console.log('Inicia expansão');
  // Após o download, executa o script de extração
  caminhoSaida = path.join(origem, 'expandClear7.ps1');
  await executarScriptPowerShell(caminhoSaida);
  agora();
  console.log('Inicia cópia local');
  // Após a expansão, executa o script de cópia (local)
  caminhoSaida = path.join(origem, 'robo1.ps1');
  await executarScriptPowerShell(caminhoSaida);
  agora();
  console.log('Inicia cópia P-83');
  // Após a expansão, executa o script de cópia (P83)
  caminhoSaida = path.join(origem, 'robo2.ps1');
  await executarScriptPowerShell(caminhoSaida);
  agora();
  console.log('Inicia cópia P-80');
  // Após a expansão, executa o script de cópia (P80)
  caminhoSaida = path.join(origem, 'robo3.ps1');
  await executarScriptPowerShell(caminhoSaida);
  agora();
  console.log('Inicia limpeza');
  // Após as cópias, deleta o conteúdo
  caminhoSaida = path.join(origem, 'deletaDesordenado.ps1');
  await executarScriptPowerShell(caminhoSaida);
  agora();
  console.log('Inicia limpeza');
}
//////////////////////////////////////////////////////////////
async function executarScriptPowerShell(scriptPath) {
  const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error(`Erro de execução: ${stderr}`);
    }

    console.log(`Saída:\n${stdout}`);
  } catch (error) {
    console.error(`Erro ao executar o script: ${error.message}`);
  }
}
//////////////////////////////////////////////////////////////
function agora() {
  let agora = new Date();
  let horas = agora.getHours().toString().padStart(2, '0');
  let minutos = agora.getMinutes().toString().padStart(2, '0');
  console.log(`Iniciando: ${horas}:${minutos}`);
}
//////////////////////////////////////////////////////////////
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
//////////////////////////////////////////////////////////////
main();

module.exports = router;














































