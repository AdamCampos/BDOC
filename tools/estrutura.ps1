# Script para listar a estrutura de pastas e arquivos e salvar em um arquivo de texto
$projectPath = "C:\Users\nvmj\Desktop\NodeJS"  # Substitua pelo caminho do seu projeto
$outputFile = "C:\Users\nvmj\Desktop\NodeJS\estrutura_projeto.txt"  # Substitua pelo caminho do arquivo de saída

# Gera a estrutura de diretórios e arquivos
Get-ChildItem -Path $projectPath -Recurse -Force |
    Select-Object FullName, Name, Mode |
    Out-File -FilePath $outputFile -Encoding utf8

Write-Host "A estrutura de pastas e arquivos foi salva em $outputFile"
