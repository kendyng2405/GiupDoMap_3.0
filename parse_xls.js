const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('danh-sach-3321-xa-phuong.xls');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const result = {};

for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 6) continue;
    const wardName = row[1];
    const provName = row[5];
    if (!wardName || !provName) continue;
    
    if (!result[provName]) {
        result[provName] = [];
    }
    result[provName].push(wardName);
}

const jsonArray = Object.keys(result).map(key => ({
    name: key,
    wards: result[key].sort()
})).sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync('public/data/provinces.json', JSON.stringify(jsonArray, null, 2), 'utf8');
console.log('Successfully generated provinces.json with ' + jsonArray.length + ' provinces.');

