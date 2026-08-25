Add-Type -Path "D:\giupDoMap2-main\giupDoMap2-main\exceldatareader\lib\net45\ExcelDataReader.dll"
Add-Type -Path "D:\giupDoMap2-main\giupDoMap2-main\exceldatareader.dataset\lib\net35\ExcelDataReader.DataSet.dll"
$stream = [System.IO.File]::Open("D:\giupDoMap2-main\giupDoMap2-main\danh-sach-3321-xa-phuong.xls", [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read)
$readerConfig = New-Object ExcelDataReader.ExcelReaderConfiguration
$readerConfig.FallbackEncoding = [System.Text.Encoding]::GetEncoding(1258)
$reader = [ExcelDataReader.ExcelReaderFactory]::CreateReader($stream, $readerConfig)
$ds = [ExcelDataReader.ExcelDataReaderExtensions]::AsDataSet($reader)
$table = $ds.Tables[0]

$result = @{}
for ($i = 1; $i -lt $table.Rows.Count; $i++) {
    $wardName = $table.Rows[$i][1]
    $provName = $table.Rows[$i][5]
    if ([string]::IsNullOrWhiteSpace($wardName) -or [string]::IsNullOrWhiteSpace($provName)) { continue }
    $wardName = $wardName.ToString().Trim() -replace '"','' -replace "
", " "
    $provName = $provName.ToString().Trim() -replace '"',''
    if (-not $result.ContainsKey($provName)) { $result[$provName] = @() }
    $result[$provName] += $wardName
}
$stream.Close()

$jsonArray = @()
foreach ($key in $result.Keys) {
    $jsonArray += @{ name = $key; wards = ($result[$key] | Sort-Object) }
}
$jsonArray = $jsonArray | Sort-Object name
$jsonString = $jsonArray | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("D:\giupDoMap2-main\giupDoMap2-main\public\data\provinces.json", $jsonString, [System.Text.Encoding]::UTF8)
Write-Output "Done"
