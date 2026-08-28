$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$NodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($NodeCommand) {
  $Node = $NodeCommand.Source
} else {
  $Node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
}

if (-not (Test-Path -LiteralPath $Node)) {
  throw "Node.js 20+ nao foi encontrado. Instale Node.js ou execute dentro do Codex com o runtime embutido."
}

Set-Location -LiteralPath $Root
& $Node (Join-Path $Root "tests\run-all.js")
