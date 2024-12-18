# Caminho do executável do 7-Zip (substitua se necessário)
$7zipPath = "C:\Program Files\7-Zip\7z.exe"

# Caminho da pasta onde os arquivos compactados estão
$sourcePath = "D:\BDOC 82\DESORDENADO"

# Lista para armazenar os arquivos processados
$processedFiles = @()

# Função para contornar problemas com caminhos longos no Windows
function Get-LongPath {
    param (
        [string]$Path
    )
    if ($Path.Length -gt 260) {
        return "\\?\$Path"
    }
    return $Path
}

# Função para extrair arquivos compactados de qualquer tipo suportado pelo 7-Zip
function Extract-Archive {
    param (
        [string]$filePath
    )

    $longFilePath = Get-LongPath $filePath
    $extractTo = Split-Path -Parent $filePath  # Diretório atual do arquivo
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($filePath)  # Nome do arquivo sem extensão
    $extractToFolder = Join-Path $extractTo $fileName  # Cria o caminho da nova pasta para extração

    # Cria a pasta de extração se não existir
    if (-not (Test-Path $extractToFolder)) {
        New-Item -ItemType Directory -Path $extractToFolder | Out-Null
    }

    # Comando para extrair usando o 7-Zip
    $arguments = "x `"$longFilePath`" -o`"$extractToFolder`" -y"

    # Executa o 7-Zip com os argumentos fornecidos
    Start-Process -FilePath $7zipPath -ArgumentList $arguments -Wait

    # Armazena o caminho do arquivo processado
    $processedFiles += $filePath

    # Apaga o arquivo compactado original após a extração
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
    }

    # Processa recursivamente a nova pasta para mais arquivos compactados
    Process-Folder $extractToFolder
}

# Função para processar recursivamente todas as pastas a partir de um diretório
function Process-Folder {
    param (
        [string]$folderPath
    )

    # Lista todos os arquivos compactados na pasta, incluindo subpastas
    Get-ChildItem -Path $folderPath -Recurse -Include *.zip, *.7z | ForEach-Object {
        Extract-Archive $_.FullName
    }
}

# Inicia o processamento da pasta raiz
Process-Folder $sourcePath

# Exibe os arquivos processados ao final
Write-Host "Processo concluído! Arquivos processados:"
$processedFiles | ForEach-Object { Write-Host $_ }
