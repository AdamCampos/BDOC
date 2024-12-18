# Definindo os caminhos das pastas que deseja limpar
$foldersToClear = @("D:\BDOC\DESORDENADO", "D:\BDOC 82\DESORDENADO")

foreach ($folderPath in $foldersToClear) {
    # Verifica se a pasta existe
    if (Test-Path -Path $folderPath) {
        # Remove todos os arquivos e subpastas
        Get-ChildItem -Path $folderPath -Recurse | Remove-Item -Force -Recurse
        Write-Host "Conteúdo da pasta $folderPath foi deletado com sucesso."
    } else {
        Write-Host "A pasta $folderPath não existe."
    }
}
