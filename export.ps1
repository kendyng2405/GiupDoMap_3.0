$lines = Get-Content -Path "D:\giupDoMap2-main\giupDoMap2-main\danh-sach-3321-xa-phuong-utf8.csv" -Encoding UTF8
$result = @{}
for ($i = 1; $i -lt $lines.Count; $i++) {
    $parts = $lines[$i] -split ","
    if ($parts.Count -lt 6) { continue }
    $wardName = $parts[1].Trim() -replace '"',''
    $provName = $parts[$parts.Count - 1].Trim() -replace '"',''
    if ([string]::IsNullOrWhiteSpace($wardName) -or [string]::IsNullOrWhiteSpace($provName)) { continue }
    if (-not $result.ContainsKey($provName)) { $result[$provName] = @() }
    $result[$provName] += $wardName
}
$jsonArray = @()
foreach ($key in $result.Keys) {
    $jsonArray += @{ name = $key; wards = ($result[$key] | Sort-Object) }
}
$jsonArray = $jsonArray | Sort-Object name
$jsonString = $jsonArray | ConvertTo-Json -Depth 5 -Compress
[System.IO.File]::WriteAllText("D:\giupDoMap2-main\giupDoMap2-main\public\data\provinces.json", $jsonString, [System.Text.Encoding]::UTF8)
Write-Output "Done JS export."
