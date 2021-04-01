var Excel = require('exceljs');
var workbook = new Excel.Workbook(); 
function getrow() {
    return new Promise(resolve => {
     workbook.xlsx.readFile('./tes.xlsx')
    .then(function() {
        var worksheet = workbook.getWorksheet('JABOTABEK');
        let email;
        let rowCount = worksheet.rowCount;
        for (let row = 2; row < rowCount +1 ; row++) {
          //sizeOne
        email += worksheet.getCell('I'+ row).value + "|";
       
       }
      resolve(email.replace(/undefined/ , ""))
    });
})
}
    exports.getrow = getrow;