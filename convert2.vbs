Set objExcel = CreateObject("Excel.Application")
objExcel.DisplayAlerts = False
Set objWorkbook = objExcel.Workbooks.Open("D:\giupDoMap2-main\giupDoMap2-main\danh-sach-3321-xa-phuong.xls")
objWorkbook.SaveAs "D:\giupDoMap2-main\giupDoMap2-main\danh-sach-3321-xa-phuong.txt", 42
objWorkbook.Close False
objExcel.Quit
