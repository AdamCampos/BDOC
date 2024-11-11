const express = require('express');
const router = express.Router();
const axios = require('axios');
const app = express();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { writeToString } = require('@fast-csv/format');
const bodyParser = require('body-parser');
const FormData = require('form-data');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');

// Caminho para o executável do Chromium (substitua pelo caminho correto no seu sistema)
const CHROME_PATH = 'C:\\Users\\nvmj\\Desktop\\NodeJS\\chrome\\win64-127.0.6533.72\\chrome-win64\\chrome.exe';

var matrizArquivosOnline = [];
var matrizArquivosOffline = [];
var matrizComparaArquivos = [];

var contadorErro = 0;

app.listen(3333);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var skip = 0;
var termo = '*';
var top = 50000;
var token = '';

let nrItens = 0;

// ====================================================================================================================================================

// Acessa o Integra e busca uma lista de documentos. Os parâmetros são o tipo (DE, LI, ET, MD, ...) e a quantidade máxima (top)
// O que for obtido é endereçado no objeto 'res' 
app.get('/lista', (req, res) => {

  console.log('Buscando termo: ' + req.query.termo + ' skip: ' + req.query.skip + ' top: ' + req.query.top);

  if (req.query.skip >= 0) {
    skip = req.query.skip;
  }

  if (req.query.top >= 0) {
    top = req.query.top;
  }

  //Encodings: 
  //            %20 = espaço
  //            %24 = $
  //            %27 = '

  if (req.query.termo.includes('*')) {

    axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=' +
      top + '&%24filter=(contains(Name%2C%27' + req.query.termo + '%27)%20and%20Status%20eq%20%27CURRENT%27)&%24count=true&%24skip=' +
      skip, {
      headers: {
        'Authorization': 'Bearer ' + req.query.token
      }

    }).then((response) => {
      // console.log(response);
      return (
        res.json(response.data));
    }).catch(function (error) {
      if (error) {
        res.json(error);
        console.log(error);
      }
    })
  }
  else {
    axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/BrDocTecEngAll?%24format=json&%24top=' +
      top + '&%24filter=(Name%20eq%20%27' + req.query.termo + '%27%20and%20Status%20eq%20%27CURRENT%27)&%24count=false&%24skip=' +
      skip, {
      headers: {
        'Authorization': 'Bearer ' + req.query.token
      }

    }).then((response) => {
      return (
        res.json(response.data));
    }).catch(function (error) {
      if (error) {
        res.json(error);
        console.log(error);
      }
    })
  }





});

// ====================================================================================================================================================

app.get('/obid/:id', (req, res) => {

  // console.log('Buscando obid - id: ' + req.params.id);

  axios.get('https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Objects?$filter=(OBID%20eq%20%27' + req.params.id + '%27)&$select=Name,OBID&$expand=SPFFileComposition_21($filter=Interfaces%20eq%20%27ISPFBusinessFile%27%20and%20SPFViewInd%20eq%20%27true%27%20or%20SPFEditInd%20eq%20%27true%27)&$top=' + top + '&$count=true', {
    headers: {
      'Authorization': 'Bearer ' + req.query.token
    }
  }).then((response) => {
    if (response.data.value[0].OBID && response.data.value[0].SPFFileComposition_21[0] && response.data.value[0].SPFFileComposition_21[0].OBID) {

      //console.log('Buscando OBID de ID: ' + req.params.id + ' OBID0: ' + response.data.value[0].OBID + ' OBID1: ' + response.data.value[0].SPFFileComposition_21[0].OBID);
      return (res.json(response.data));
    }
    else {

      contadorErro++;
      console.log(response);
      console.log(contadorErro + ' OBID - erro em ' + req.params.id);

      return (
        res.json('Erro ' + req.params.id)
      )
    }
  }).catch(function (error) {
    if (error) {
      console.log('Erro buscando uri de ID: ' + req.params.id);
      console.log(error)
    }
    return (
      res.json(response.error)
    )
  })
})

// ====================================================================================================================================================

app.get('/uri/:obid', (req, res) => {

  // console.log('Buscando uri: ' + req.params.obid);

  axios.get("https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/SDA/Files('" + req.params.obid + "')/Intergraph.SPF.Server.API.Model.RetrieveFileUris", {
    // responseType: 'blob',
    headers: {
      'Authorization': 'Bearer ' + req.query.token
    }
  }).then(function (response) {

    console.log('Buscando uri de OBID: ' + req.params.obid + ' status: ' + response.status + ' >>> ' + response.data.value[0].FileId);

    return (
      res.json(response.data))
  }).catch(function (error) {
    if (error) {
      console.log('Erro buscando uri de OBID: ' + req.params.obid);
      console.log(error)
      return (
        res.json(response.error)
      )
    }
  })
});

// ====================================================================================================================================================
app.use(bodyParser.json());
//Esta função irá obter um arquivo com uma lista de nome de outros arquivos. Normalmente seria a lista 
// de arquivos que estariam presentes no Integra.
app.get('/buscaArquivosOffline', async (req, res) => {

  console.log('==== INICIO COMPARACAO ====');

  matrizArquivosOffline = [];

  try {

    //Local onde os arquivos locais (offline) serão procurados
    let raiz = 'D:\\BDOC';
    // let raiz = 'C:\\Users\\nvmj\\PETROBRAS\\BUZIOS PPO IPO PRE-OP-P83 GEPLAT - 10- Documentação Técnica';
    // let raiz = 'C:\\Users\\nvmj\\PETROBRAS\\BUZIOS PPO IPO PRE-OP-P80 - 06.0 Documentação Fase 4 (P80 e P83)';

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Main function to coordinate the operations
    const gerenciador = (directoryPath) => {

      //Linha 491
      loopBuscaArquivos(directoryPath)
        .then(() => {
          console.log('Terminado loop por todos arquivos');
          console.log('Obtida matriz offline com ' + matrizArquivosOffline.length + ' arquivos.');
          res.json(matrizArquivosOffline);
        }
        )
        .catch(error => {
          console.error('An error occurred:', error);
        });
    };

    //Chama a função acima, passando o diretório raíz local
    gerenciador(raiz);
    ////////////////////////////////////////////////////////////////////////////////////////////////////

  } catch (err) {
    console.log('Erro ' + err);
    res.status(500).json({ error: 'Não pode ler: ' + err.message });
  }

  raiz = null;
  matrizArquivosOffline = [];
  matrizArquivosOnline = [];
  matrizComparaArquivos = [];
  contadorErro = 0;

});


// ====================================================================================================================================================

app.get('/uploadCSV', async (req, res) => {

  console.log('==== INICIO UPLOAD CSV ====');

  try {

    let raiz = 'D:\\BDOC';
    //let raiz = 'C:\\Users\\nvmj\\PETROBRAS\\BUZIOS PPO IPO PRE-OP-P80 - 06.0 Documentação Fase 4 (P80 e P83)';

    // Main function to coordinate the operations
    const mainFunction = (directoryPath) => {
      loopBuscaArquivos(directoryPath)
        .then(fileNames => {
          processFileNames(fileNames);
        })
        .catch(error => {
          console.error('An error occurred:', error);
        });
    };

    mainFunction(raiz);

    let arrayResultado = [];

    // Function to execute after getting the file names
    const processFileNames = (fileNames) => {
      console.log('Processing file names:', fileNames.length);
      const resultadoComparacao = (leCadaLinha(0, 1000000));
      resultadoComparacao.then(async () => {

        matrizComparaArquivos.map((item) => {
          arrayResultado.push({ nome: item });
        })

        const csvString = await writeToString(arrayResultado, { headers: true });

        res.setHeader('Content-Disposition', 'attachment; filename="arquivosNaoEncontrados.csv"');
        res.setHeader('Content-Type', 'text/csv');
        res.status(200).send(csvString);
        console.log('==== FIM ====');
      }
      );
    };

  } catch (err) {
    console.log('Erro ' + err);
    res.status(500).json({ error: 'Não pode ler: ' + err.message });
  }

  raiz = null;
  matrizArquivosOffline = [];
  matrizArquivosOnline = [];
  matrizComparaArquivos = [];

});


// ====================================================================================================================================================
//Esta função irá obter um arquivo com uma lista de nome de outros arquivos. Normalmente seria a lista 
// de arquivos que estariam presentes no Integra.
app.get('/upload', async (req, res) => {

  console.log('==== INICIO UPLOAD ====');
  matrizArquivosOffline = [];

  //Quando a lista é mjito grande, pode ser necessário utilizar apenas trechos da mesma
  const min = req.query.min;
  const max = req.query.max;

  try {

    //Seta quais arquivos serão testados. Deveria ser o diretório raíz, onde cada item da lista
    //é confrontado com o nome de cada arquivo ou pasta, em níveis cada vez mais profundos.
    let raiz = 'D:\\BDOC';
    //let raiz = 'C:\\Users\\nvmj\\PETROBRAS\\BUZIOS PPO IPO PRE-OP-P80 - 06.0 Documentação Fase 4 (P80 e P83)';

    // Usage example

    let arrayResultado = [];

    // Main function to coordinate the operations
    const mainFunction = (directoryPath) => {
      loopBuscaArquivos(directoryPath)
        .then(fileNames => {
          processFileNames(fileNames);
        })
        .catch(error => {
          console.error('An error occurred:', error);
        });
    };

    mainFunction(raiz);

    const processFileNames = (fileNames) => {
      console.log('Processing file names:', fileNames.length);

      //Processa cada linha do arquivo de dados online
      const resultadoComparacao = (leCadaLinha(0, 1000000));

      //Chama a função acima.
      resultadoComparacao.then(async () => {

        //matrizComparaArquivos é o que será retornado para a tela do cliente
        //Só serão inseridos nesta matriz os itens que estão presentes no Integra mas não no arquivo local
        matrizComparaArquivos.map((item) => {
          arrayResultado.push({ nome: item });
        })

        res.json(matrizComparaArquivos);
        console.log('==== FIM ====');
      }
      );
    };


  } catch (err) {
    console.log('Erro ' + err);
    res.status(500).json({ error: 'Não pode ler: ' + err.message });
  }

  raiz = null;
  matrizArquivosOffline = [];
  matrizArquivosOnline = [];
  matrizComparaArquivos = [];
  contadorErro = 0;

});

// ====================================================================================================================================================

async function leCadaLinha(min, max) {

  var nrLinhas = 0;

  // const fs = require('fs');

  //Lê cada linha do arquivo que lista os arquivos atuais do Integra (fileStream)
  const readline = require('readline');
  var listaIntegraOnline = 'D:\\BDOC\\data.csv';

  return new Promise((resolve, reject) => {

    let inicio = new Date();

    const rl = readline.createInterface({
      input: fs.createReadStream(listaIntegraOnline),
      crlfDelay: Infinity
    });

    //https://nodejs.org/api/readline.html#class-interfaceconstructor
    //The 'line' event is emitted whenever the input stream receives an end-of-line input (\n, \r, or \r\n). 
    rl.on('line', (line) => {
      nrLinhas++;
      let doc = line.replace(',', '');

      //Lê cada linha do arquivo com dados do Integra e os coloca sem repetição em uma matriz.
      if (nrLinhas >= min && nrLinhas <= max) {
        montaMatrizArquivosOnline(doc);
      }

    });

    rl.on('close', () => {

      comparaArquivos();

      //Ordena a matriz e então a mostra
      matrizComparaArquivos.sort((a, b) => a - b);

      resolve(matrizComparaArquivos);

      console.log(matrizComparaArquivos);

      console.log('Fechando arquivo');
      console.log('Início: ' + inicio);
      console.log('Fim: ' + new Date());

      listaIntegraOnline = null;
      nrLinhas = 0;

    });
  });
}

// ====================================================================================================================================================
async function montaMatrizArquivosOnline(doc) {

  try {
    if (!matrizArquivosOnline.includes(doc)) {
      matrizArquivosOnline.push(doc);
    }
  } catch (error) { }
}

// ====================================================================================================================================================
function comparaArquivos() {
  return new Promise((resolve) => {
    matrizComparaArquivos = matrizArquivosOnline.filter(item => {
      if (!matrizArquivosOffline.includes(item)) {
        console.log(item);
        matrizComparaArquivos.push(item);
      }
    })
  })

  // return new Promise((resolve) => {
  //   let nrArquivosOnline = 0;
  //   let nrArquivosEncontrados = 0;
  //   let nrArquivosNaoEncontrados = 0;
  //   let nrOperacoes = 0;
  //   let encontrado = false;

  //   matrizArquivosOnline.forEach(arquivoOnline => {
  //     nrArquivosOnline++;

  //     let padrao = new RegExp((arquivoOnline));

  //     matrizArquivosOffline.forEach(arquivoOffline => {

  //       nrOperacoes++;

  //       if (padrao.test(arquivoOffline)) {
  //         encontrado = true;
  //         return;
  //       }

  //     });
  //     //Fim do loop interno
  //     if (encontrado) {
  //     } else {
  //       nrArquivosNaoEncontrados++;

  //       if (!matrizComparaArquivos.includes(arquivoOnline)) {
  //         matrizComparaArquivos.push(arquivoOnline);
  //         // console.log('Adding: ' + arquivoOnline);
  //       }
  //     }
  //     encontrado = false;
  //   });
  //   console.log('Não encontrados: ' + nrArquivosNaoEncontrados);
  //   // console.log(matrizComparaArquivos);
  // });
}

// ====================================================================================================================================================



// Promisify the fs.readdir function to use it with Promises
const readdirPromise = (directoryPath) => {
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


// Function to recursively get file names in a directory and its subdirectories
const loopBuscaArquivos = (directoryPath) => {
  const readDirectory = (dir, depth = 0, maxDepth = 2) => {
    return readdirPromise(dir)
      .then(items => {
        const promises = items.map(item => {
          const fullPath = path.join(dir, item.name);

          // console.log('Analisando ' + item.name);

          if (item.isDirectory()) {
            // If the item is a directory, recursively get file names in this directory
            if (depth === 0) {
              return readDirectory(fullPath, depth + 1, 2);
            }
            else if (depth === 1) {
              return readDirectory(fullPath, depth + 1, maxDepth);
            }
            else if (depth === 2) {

              if (!matrizArquivosOffline.includes(item.name)) {
                matrizArquivosOffline.push(item.name);
              }
              return readDirectory(fullPath, depth + 1, maxDepth);
            }

          } else if (item.isFile()) {
            if (depth === 2) {

              if (!matrizArquivosOffline.includes(item.name)) {
                matrizArquivosOffline.push(item.name);
              }
            }
          }
          return Promise.resolve();
        });
        return Promise.all(promises);
      });
  };

  return readDirectory(directoryPath, 0, 2).then(() => matrizArquivosOffline);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const COOKIES_FILE_PATH = 'C:\\Users\\nvmj\\Desktop\\NodeJS\\chrome\\win64-127.0.6533.72\\chrome-win64\\cookies\\cookies.json';

app.post('/pup', async (req, res) => {

  async function main() {

    //await startChromium();

    //Espera apenas para garantir que o Chrome iniciou
    //await PromiseTimeout(10000);

    let browser;
    try {
      // Verifica se há algum navegador já aberto
      console.log('Buscando intâncias na porta 9222...');
      browser = await puppeteer.connect({ browserWSEndpoint: 'ws://localhost:9222' });
    } catch (e) {
      console.log(e);
      console.log('Inciando intância na porta 9222...');
      // Se não houver nenhum navegador aberto, abre um novo
      browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true, // Define como 'false' para ver o navegador em ação
        devtools: true // Abre o DevTools automaticamente
      });
    }

    await getDevToolsData(browser, 'https://integra-ext.petrobras.com.br/INTEGRA/#/');

  }

  //////////////////////////////////////////////////////////////
  async function getDevToolsData(browser, url) {

    console.log('Abrindo chrome...');

    // Abre uma nova página
    const page = await browser.newPage();
    await loadCookies(page);

    let headers = null;
    await page.setRequestInterception(true);


    page.on('request', request => {

      if (request.url() == 'https://integra-ext.petrobras.com.br/INTEGRAServer/api/v2/User') {
        headers = request.headers();
        if (headers['authorization']) {
          console.log(headers['authorization'])
        };
      }
      request.continue();
    });

    // Acessa a URL especificada
    await page.goto(url);

    try {
      await page.waitForSelector('#i0116');
      await page.type('#i0116', "adamson@petrobras.com.br");

      await page.waitForSelector('#idSIButton9');
      await page.click('#idSIButton9');

      await page.waitForSelector('#i0118');
      await page.type('#i0118', "cS52408d9686!");

      page.removeAllListeners('#idSIButton9');

      setTimeout(() => {
        page.click('#idSIButton9')
      }, 2000);

      //Aqui é necessário o uso do Authenticator
      await PromiseTimeout(30000);

      // Verifica se o checkbox com o ID KmsiCheckboxField existe e o marca
      const checkboxExists = await page.$('#KmsiCheckboxField') !== null;
      if (checkboxExists) {
        const isChecked = await page.$eval('#KmsiCheckboxField', el => el.checked);
        if (!isChecked) {
          await page.click('#KmsiCheckboxField');

          setTimeout(() => {
            page.click('#idSIButton9')
          }, 2000);

        }
      }
    } catch (error) { }

    await saveCookies(page);
  }

  main();

})

//////////////////////////////////////////////////////////////
function PromiseTimeout(delayms) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, delayms);
  });
}
//////////////////////////////////////////////////////////////
async function saveCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookies, null, 2));
  console.log('Cookies salvos em', COOKIES_FILE_PATH);
}
//////////////////////////////////////////////////////////////
async function loadCookies(page) {
  if (fs.existsSync(COOKIES_FILE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE_PATH));
    await page.setCookie(...cookies);
    console.log('Cookies carregados de', COOKIES_FILE_PATH);
  }
}
//////////////////////////////////////////////////////////////
// async function startChromium() {
//   exec(`${CHROME_PATH} --remote-debugging-port=9222`, (err, stdout, stderr) => {
//     if (err) {
//       console.error('Erro ao iniciar o Chromium:', err);
//     }
//     console.log(stdout);
//     console.error(stderr);
//   });
// }
//////////////////////////////////////////////////////////////
module.exports = router;














































