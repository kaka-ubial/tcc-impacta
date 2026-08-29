

param(
    [string]$Saida = "C:\windows_exporter\textfile_inputs\github_actions.prom",
    [int]$Limite = 100
)

$ErrorActionPreference = "Stop"


$temp = "$Saida.tmp"
$dir = Split-Path $Saida -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

$runs = gh run list --limit $Limite --json name,headBranch,status,conclusion,createdAt,updatedAt |
        ConvertFrom-Json

$principais = @("develop", "release", "main")
foreach ($r in $runs) {
    $b = if ($principais -contains $r.headBranch) { $r.headBranch } else { "feature" }
    $r | Add-Member -NotePropertyName branch -NotePropertyValue $b -Force
}

$linhas = [System.Collections.Generic.List[string]]::new()

function Add-Metrica($nome, $ajuda, $tipo, $amostras) {
    $linhas.Add("# HELP $nome $ajuda")
    $linhas.Add("# TYPE $nome $tipo")
    foreach ($a in $amostras) { $linhas.Add($a) }
    $linhas.Add("")
}

# --- 1. duracao da ultima execucao de cada workflow x branch ---------------
$amostras = @()
$maisRecente = $runs |
    Where-Object { $_.status -eq "completed" } |
    Group-Object { "$($_.name)|$($_.branch)" } |
    ForEach-Object { $_.Group | Sort-Object createdAt -Descending | Select-Object -First 1 }

foreach ($r in $maisRecente) {
    $dur = [math]::Round(([datetime]$r.updatedAt - [datetime]$r.createdAt).TotalSeconds, 0)
    $amostras += 'impacta_pipeline_duracao_segundos{workflow="' + $r.name + '",branch="' + $r.branch + '"} ' + $dur
}
Add-Metrica "impacta_pipeline_duracao_segundos" `
            "Duracao da ultima execucao concluida, por workflow e branch" `
            "gauge" $amostras

# --- 2. resultado da ultima execucao (1 = sucesso, 0 = falha) --------------
$amostras = @()
foreach ($r in $maisRecente) {
    $ok = if ($r.conclusion -eq "success") { 1 } else { 0 }
    $amostras += 'impacta_pipeline_ultimo_resultado{workflow="' + $r.name + '",branch="' + $r.branch + '"} ' + $ok
}
Add-Metrica "impacta_pipeline_ultimo_resultado" `
            "Resultado da ultima execucao: 1 sucesso, 0 falha" `
            "gauge" $amostras

# --- 3. total de execucoes por resultado ----------------------------------
$amostras = @()
$runs | Where-Object { $_.status -eq "completed" } |
    Group-Object { "$($_.name)|$($_.branch)|$($_.conclusion)" } |
    ForEach-Object {
        $p = $_.Name -split "\|"
        $amostras += 'impacta_pipeline_execucoes{workflow="' + $p[0] + '",branch="' + $p[1] + '",resultado="' + $p[2] + '"} ' + $_.Count
    }
Add-Metrica "impacta_pipeline_execucoes" `
            "Execucoes concluidas nas ultimas $Limite, por resultado" `
            "gauge" $amostras

# --- 4. quando esta coleta rodou ------------------------------------------
Add-Metrica "impacta_pipeline_coleta_timestamp_segundos" `
            "Momento da ultima coleta bem-sucedida" `
            "gauge" @("impacta_pipeline_coleta_timestamp_segundos $([int][double]::Parse((Get-Date -UFormat %s)))")

[IO.File]::WriteAllText($temp, ($linhas -join "`n") + "`n")
Move-Item -Path $temp -Destination $Saida -Force

Write-Output "$($linhas.Count) linhas escritas em $Saida ($($maisRecente.Count) workflows x branch)"
