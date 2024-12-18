Param (
    [string]$TargetDirectory = "D:\\BDOC 82"
)

# Verifica se o diretório de destino existe
if (-Not (Test-Path -Path $TargetDirectory)) {
    Write-Host "O diretório $TargetDirectory não existe." -ForegroundColor Red
    exit
}

# Função para processar diretórios recursivamente
function ProcessDirectory {
    param (
        [string]$DirectoryPath
    )

    # Define as extensões que NÃO devem ser zeradas
    $allowedExtensions = @(".pdf", ".xlsx", ".docx", ".doc", ".rar", ".xls")

    # Obtém todos os arquivos no diretório atual
    $allFiles = Get-ChildItem -Path $DirectoryPath -File

    foreach ($file in $allFiles) {
        try {
            # Verifica se a extensão do arquivo não está na lista permitida
            if ($allowedExtensions -notcontains $file.Extension.ToLower()) {
                # Remove o arquivo existente
                Remove-Item -Path $file.FullName -Force

                # Cria um novo arquivo vazio com o mesmo nome e extensão
                New-Item -Path $file.FullName -ItemType File | Out-Null

                Write-Host "Arquivo $($file.FullName) substituído com sucesso." -ForegroundColor Green
            }
        } catch {
            Write-Host "Erro ao processar o arquivo $($file.FullName): $_" -ForegroundColor Red
        }
    }

    # Processa os subdiretórios recursivamente
    $subDirectories = Get-ChildItem -Path $DirectoryPath -Directory
    foreach ($subDir in $subDirectories) {
        ProcessDirectory -DirectoryPath $subDir.FullName
    }
}

# Inicia o processamento apenas nos subdiretórios do diretório alvo
$subDirectories = Get-ChildItem -Path $TargetDirectory -Directory

foreach ($subDir in $subDirectories) {
    Write-Host "Processando diretório: $($subDir.FullName)" -ForegroundColor Yellow
    ProcessDirectory -DirectoryPath $subDir.FullName
}

Write-Host "Processamento concluído." -ForegroundColor Cyan
