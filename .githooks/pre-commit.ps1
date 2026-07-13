$staged = git diff --cached --name-status
$addedOrModified = $staged | Where-Object { $_ -notmatch '^D\s' }

if (($addedOrModified | Measure-Object).Count -gt 50) {
  Write-Host "ERROR: 50超のファイルがstaged。'git add -A' の疑い。"
  exit 1
}
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -in @("main","master")) {
  Write-Host "ERROR: main への直接コミットは禁止。"
  exit 1
}
if ($addedOrModified -match '\.env$|credentials|secret|\.pem$|api[_-]?key') {
  Write-Host "ERROR: 秘匿ファイルの可能性。"
  exit 1
}