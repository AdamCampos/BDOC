const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function executarScriptPowerShell(scriptPath) {
  const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      //console.error(`Erro de execução: ${stderr}`);
    }

    //console.log(`Saída:\n${stdout}`);
  } catch (error) {
    console.error(`Erro ao executar o script: ${error.message}`);
  }
}

// Exporta a função como módulo
module.exports = {
  executarScriptPowerShell,
};
