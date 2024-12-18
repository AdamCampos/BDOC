# Define o caminho do diretório
$diretorio = "D:\BDOC 82\DESORDENADO"

# Verifica se o diretório existe
if (Test-Path -Path $diretorio) {
    # Lista o conteúdo do diretório
    Get-ChildItem -Path $diretorio | ForEach-Object {
        # Obtém o nome do arquivo ou pasta
        $nomeOriginal = $_.Name

        # Remove a extensão e o termo "_PARTE_XX"
        $nomeSemExtensao = [System.IO.Path]::GetFileNameWithoutExtension($nomeOriginal)
        $nomeSemParte = $nomeSemExtensao -replace "_PARTE_\d+$", ""

        # Define o caminho para a nova pasta
        $novaPasta = Join-Path -Path $diretorio -ChildPath $nomeSemParte

        # Cria a pasta se ela ainda não existir
        if (-not (Test-Path -Path $novaPasta)) {
            New-Item -ItemType Directory -Path $novaPasta | Out-Null
            Write-Host "Pasta criada: $novaPasta"
        } else {
            Write-Host "Pasta já existe: $novaPasta"
        }

        # Copia o arquivo para a nova pasta
        if ($_.PSIsContainer -eq $false) {
            $caminhoDestino = Join-Path -Path $novaPasta -ChildPath $nomeOriginal
            Copy-Item -Path $_.FullName -Destination $caminhoDestino -Force
            Write-Host "Arquivo copiado para: $caminhoDestino"
        }
    }

    # Remove todos os arquivos da raiz do diretório, mantendo apenas as pastas
    Get-ChildItem -Path $diretorio -File | ForEach-Object {
        Remove-Item -Path $_.FullName -Force
        Write-Host "Arquivo removido da raiz: $($_.FullName)"
    }

    # Renomeia os arquivos em cada pasta, removendo o termo "_PARTE_XX"
    Get-ChildItem -Path $diretorio -Directory | ForEach-Object {
        $pasta = $_.FullName
        Get-ChildItem -Path $pasta -File | ForEach-Object {
            $arquivoOriginal = $_.FullName
            $nomeSemParte = $_.Name -replace "_PARTE_\d+", ""
            $novoCaminho = Join-Path -Path $pasta -ChildPath $nomeSemParte

            Rename-Item -Path $arquivoOriginal -NewName $novoCaminho -Force
            Write-Host "Arquivo renomeado: $arquivoOriginal para $novoCaminho"
        }
    }
} else {
    Write-Host "O diretório '$diretorio' não foi encontrado. Verifique o caminho e tente novamente."
}
