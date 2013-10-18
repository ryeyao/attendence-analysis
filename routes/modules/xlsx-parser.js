/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 10/10/13
 * Time: 8:23 PM
 */

var XLSX = require('xlsx');
var XLS = require('./xlsjs/xls');
exports.parse = function(path, callback) {

    var EXCEL = XLSX;
    console.log('Parsing ' + path);
    if (path.trim().endsWith('.xls')) {
        EXCEL = XLS;
    }
    excel = EXCEL.readFile(path);

    var sheet_name_list = excel.SheetNames;
    // TODO do parse xls/xlsx to json
    var result = {};
    sheet_name_list.forEach(function(sheetName) {
        var roa = EXCEL.utils.sheet_to_row_object_array(excel.Sheets[sheetName]);
        if (roa.length > 0) {
            result[sheetName] = roa;
        }
    });
    callback(0, result);

}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
