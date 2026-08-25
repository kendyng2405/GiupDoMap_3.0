Add-Type -AssemblyName System.Data
$connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\giupDoMap2-main\giupDoMap2-main\danh-sach-3321-xa-phuong.xls;Extended Properties='Excel 8.0;HDR=YES;IMEX=1';"
$conn = New-Object System.Data.OleDb.OleDbConnection($connString)
$conn.Open()
$schemaTable = $conn.GetOleDbSchemaTable([System.Data.OleDb.OleDbSchemaGuid]::Tables, $null)
$sheetName = $schemaTable.Rows[0]["TABLE_NAME"]
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT * FROM [$sheetName]"
$adapter = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null
$conn.Close()

$result = @{}
foreach ($row in $dt.Rows) {
    $wardName = $row[1]
    $provName = $row[5]
    if ([string]::IsNullOrWhiteSpace($wardName) -or [string]::IsNullOrWhiteSpace($provName)) { continue }
    $wardName = $wardName.ToString().Trim() -replace "
", " "
    $provName = $provName.ToString().Trim()
    
    if (-not $result.ContainsKey($provName)) { $result[$provName] = @() }
    $result[$provName] += $wardName
}

$jsonArray = @()
foreach ($key in $result.Keys) {
    $jsonArray += @{ name = $key; wards = ($result[$key] | Sort-Object) }
}
$jsonArray = $jsonArray | Sort-Object name
$jsonString = $jsonArray | ConvertTo-Json -Depth 5 -Compress
[System.IO.File]::WriteAllText("D:\giupDoMap2-main\giupDoMap2-main\public\data\provinces-temp.json", $jsonString, [System.Text.Encoding]::UTF8)
