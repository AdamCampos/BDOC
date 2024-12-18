const fs = require('fs');
const path = require('path');
const { executarScriptPowerShell } = require('./powershellService');
const { agora } = require('../utils/helpers'); // Importação da função agora() do módulo helpers

/**
 * Função que cria um script de download e executa etapas de processamento subsequentes.
 * @param {Array} listaFinal - Lista de objetos contendo URL e caminho para download.
 * @param {string} projeto - Identificador do projeto (ex: '83', '82').
 */
async function downloadLinks(listaFinal, projeto) {
  if (!listaFinal || !Array.isArray(listaFinal) || listaFinal.length === 0) {
    throw new Error('A lista de arquivos para download está vazia ou inválida.');
  }


  let append = `
$workers = foreach ($f in $files) {
$wc = New-Object System.Net.WebClient 
Write-Output $wc.DownloadFileTaskAsync($f.url, $f.path) 
}
$workers.Result
`;

  let origem = '';

  if (projeto === '83') {
    origem = 'D:\\BDOC';
  } else if (projeto === '82') {
    origem = 'D:\\BDOC 82';
  } else {
    throw new Error('Projeto desconhecido. Caminho de origem não definido.');
  }

  const caminhoSaida = path.join(origem, 'listaDownload.ps1');

  try {
    // Cria o arquivo listaDownload.ps1 com a lista de arquivos para download
    fs.writeFileSync(caminhoSaida, '$files = @(\n' + listaFinal.join(',\n') + '\n)' + append);
    agora();
    console.log('Inicia download');
    // Executa o script listaDownload.ps1 para realizar o download dos arquivos
    await executarScriptPowerShell(path.join(origem, 'listaDownload.ps1'));
    
    agora();
    // Após a expansão, executa a criação de pastas e movimentação dos arquivos
    await executarScriptPowerShell(path.join(origem, 'ajustePartes.ps1'));
    agora();

    console.log('Inicia expansão');
    // Após o download, executa o script de extração
    await executarScriptPowerShell(path.join(origem, 'expandClear7.ps1'));
    agora();

    console.log('Inicia cópia local');
    // Após a expansão, executa o script de cópia (local)
    await executarScriptPowerShell(path.join(origem, 'robo1.ps1'));
    agora();

    if (projeto === 82) {
      console.log('Inicia cópia P-82');
      // Após a expansão, executa o script de cópia (P83)
      await executarScriptPowerShell(path.join(origem, 'robo2.ps1'));
      agora();
    }
    else if (projeto === 83) {
      console.log('Inicia cópia P-83');
      // Após a expansão, executa o script de cópia (P83)
      await executarScriptPowerShell(path.join(origem, 'robo2.ps1'));
      agora();

      console.log('Inicia cópia P-80');
      // Após a expansão, executa o script de cópia (P80)
      await executarScriptPowerShell(path.join(origem, 'robo3.ps1'));
      agora();

    }

    console.log('Inicia limpeza');
    // Após as cópias, deleta o conteúdo
    await executarScriptPowerShell(path.join(origem, 'deletaDesordenado.ps1'));
    agora();

    console.log('Limpeza finalizada');
  } catch (error) {
    console.error('Erro durante o processo de download ou execução de scripts:', error);
    throw error;
  }
}

module.exports = {
  downloadLinks,
};
