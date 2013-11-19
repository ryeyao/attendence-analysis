/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 10/10/13
 * Time: 8:25 PM
 */

var moment = require('moment');

exports.calculate = function(json_data, options, callback) {
    if (typeof callback == 'undefined') {
        if (typeof options == 'undefined') {
            return;
        }
        callback = options;
        options = {};
    }
    // Default parameters
    sheet_name  = options['sheet_name'] ?options['sheet_name']:'考勤统计';
    row_start   = options['row_start']  ?options['row_start']:0;
    row_end     = options['row_end']    ?options['row_end']:1071;
    col_start   = options['col_start']  ?options['col_start']:0;
    col_end     = options['col_end']    ?options['col_end']:11;

    name_coln = options['name_coln']?options['name_coln']:'姓名';
    date_coln = options['date_coln']?options['date_coln']:'日期';
    week_coln = options['week_coln']?options['week_coln']:'星期';
    noonperiod_coln = options['noonperiod_coln']?options['noonperiod_coln']:'签到时间';
    afternoonperiod_coln = options['afternoonperiod_coln']?options['afternoonperiod_coln']:'签退时间';
    holidays    = options['holidays']?options['holidays']:[]; // Holidays [YYYY-MM-DD], use weekends as default
    members     = options['members']?options['members']: {
        "甘伟": {"leader": "石志强"},
        "李晓森": {
            "leader": "石志强"
        },
        "尚传人": {
            "leader": "石志强"
        },
        "杨安": {
            "leader": "石志强"
        },
        "王小山": {
            "leader": "石志强"
        },
        "王洪涛": {
            "leader": "石志强"
        },
        "许宝东": {
            "leader": "葛仕明"
        },
        "杨睿": {
            "leader": "葛仕明"
        },
        "秦沛熙": {
            "leader": "葛仕明"
        },
        "文辉": {
            "leader": "葛仕明"
        },
        "易锋": {
            "leader": "葛仕明"
        },
        "高山岩": {
            "leader": "秦伟俊"
        },
        "郑洋": {
            "leader": "秦伟俊"
        },
        "魏朝辉": {
            "leader": "秦伟俊"
        },
        "牟楠": {
            "leader": "秦伟俊"
        },
        "车东剑": {
            "leader": "李志"
        },
        "娄学政": {
            "leader": "李志"
        },
        "王振戌": {
            "leader": "李志"
        },
        "张鹤": {
            "leader": "李志"
        },
        "刘华舟": {
            "leader": "李志"
        },
        "任春林": {
            "leader": "李志"
        },
        "阮书涵": {
            "leader": "李志"
        },
        "宋子龙": {
            "leader": "朱红松"
        },
        "郝轶": {
            "leader": "朱红松"
        },
        "姚睿尧": {
            "leader": "朱红松"
        },
        "陈磊": {
            "leader": "朱红松"
        },
        "李宗枝": {
            "leader": "朱红松"
        },
        "陈祠": {
            "leader": "朱红松"
        },
        "张萌": {
            "leader": "朱红松"
        },
        "肖松": {
            "leader": "朱红松"
        },
        "陈磊": {
            "leader": "朱红松"
        },
        "刘玉红": {
            "leader": "朱红松"
        },
        "刘伟": {
            "leader": "朱红松"
        },
        "李强": {
            "leader": "朱红松"
        },
        "李红": {
            "leader": "朱红松"
        },
        "何云华": {
            "leader": "朱红松"
        },
        "党项凛": {
            "leader": "黄文军"
        },
        "吴腾": {
            "leader": "黄文军"
        },
        "蔡小伟": {
            "leader": "黄文军"
        }
    }

    // Conditions
    weekday_begin   = options['weekday_begin']  ?   options['weekday_begin']    :{hour: 9, minute: 30};
    weekday_end     = options['weekday_end']    ?   options['weekday_end']  :{hour:17};
    weekday_workover= options['weekday_workover']?  options['weekday_workover'] :{hour:21};
    min_weekday_hours = options['min_weekday_hours'] ? options['min_weekday_hours'] : 8;
    min_half_weekday_hours = options['min_half_weekday_hours'] ? options['min_half_weekday_hours'] : 4;

    // Patterns
    time_format = 'HH:mm:ss';
    date_format = 'YYYY-MM-DD';
//    pattern_start   = /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)toN\/A$/i;
//    pattern_end     = /^N\/Ato\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i;
//    pattern_period  = /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)to\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i;
    pattern_start   = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)toN\/A$/i;
    pattern_end     = /^N\/Ato([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i;
    pattern_period  = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)to([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i;

    // Result record format
    result_row_name = ['姓名', '出勤（天）', '迟到/早退（次）', '病事假（天）', '出差（天）', '总加班（次）', '一般晚上加班(次)', '一般周末加班(小时)', '强制晚加班(次)', '强制周末加班(小时)', '加班效果评价', '补贴计算', '备注说明'];

    // TODO format sheet, remove unrelated rows
    // Group



    // Do calculate
    var result_json_data = {};
    var result_workbook = {};
    var result_sheet = {};
    var result_map = {};

    var sheet = json_data[sheet_name];

    var last_row = null;
//    console.log(sheet);
//    for (var row in sheet) {
    for (var row = 0; row < sheet.length; row++) {
        var name = sheet[row][result_row_name[0]];
        console.log('=========================');
        console.log('0weekday ' + sheet[row][date_coln] +  ': ' + moment(sheet[row][date_coln]).isoWeekday());
        if (typeof sheet[row] == 'undefined' || typeof name == 'undefined') {
            console.log('*****************************************row undefined');
            continue;
        }

//        console.log('===========' + row + '==============');
//        console.log(last_row);
//        console.log(sheet[row]);

        var row_merged = null;
        if (row != 0) {
            var is_same_day = sheet[row][date_coln] == last_row[date_coln];
            if (!is_same_day) {
                var week_day = moment(sheet[row][date_coln], date_format).isoWeekday();
//                console.log('week_day: ' + week_day);
                if (week_day != 6 && week_day != 7) {
                    last_row = sheet[row]
                    continue;
                }
                row_merged = merge_rows_of_same_day(sheet[row], sheet[row]);
            } else {
                row_merged = merge_rows_of_same_day(last_row, sheet[row]);
            }
        } else {
            last_row = sheet[row];
            continue;
        }

        // Merge rows of the same day
//        console.log(last_row);
//        console.log(sheet[row]);
        last_row = sheet[row]
        if (row_merged[date_coln] == '2013-11-03') {
            console.log(row_merged);
        }

        var res = judge(row_merged);
        last_row = sheet[row]

        var target_row = {};
        if (typeof result_map[name] == 'undefined') {
            result_map[name] = {};
            for (var i = 0; i < result_row_name.length; i++) {
                var key = result_row_name[i];
                if (key == '姓名') {
                    result_map[name][key] = name;
                }
                else if (i == 1 || i == 2 || i == 3 || i == 4 || i == 5 || i == 6 || i == 7 || i == 8 || i == 9 || i == 10) {
                    result_map[name][key] = 0;
                }
                else if (i == 11) {

                }
                else {
                    result_map[name][key] = '';
                }
            }
//            result_map[name] = row;
        }
        target_row = result_map[name];
        add_up_cells_of_row(target_row, res);
    }
    // Generate xlsx json from result_map
    // Group students
    var is_first = true;
    for (var k in result_map) {
        var target_row = result_map[k];
        target_row[result_row_name[0]] = k;
        if (is_first) {
            target_row[result_row_name[11]] = '=F4*15+I4*40+(J4/8)*100+(G4*40+(H4/8)*100)*K4+E4*100-D4*100-C4*40'
            is_first = false;
        }
//        console.log(target_row);

        if (typeof members[k] == 'undefined') {
            if (typeof result_workbook['ungrouped'] == 'undefined') {
                result_workbook['ungrouped'] = {};
            }
            result_workbook['ungrouped'][k] = target_row;
        } else {
            var leader = members[k]['leader'];
            if (typeof result_workbook[leader] == 'undefined') {
                result_workbook[leader] = {};
            }
            result_workbook[leader][k] = target_row;
        }
        result_sheet[k] = target_row;
    }

    result_workbook['all'] = result_sheet;
    result_json_data['records'] = result_workbook;
    result_json_data['titles'] = result_row_name;

    callback(0, result_json_data);

}

var merge_rows_of_same_day = function(row1, row2) {
    var row_merged = row1
    var noon_up = row1[noonperiod_coln]?row1[noonperiod_coln].split(' ')[1]:'N/A';
    var noon_down = row1[afternoonperiod_coln]?row1[afternoonperiod_coln].split(' ')[1]:'N/A';
    var after_up = row2!=undefined&&row2[noonperiod_coln]?row2[noonperiod_coln].split(' ')[1]:'N/A';
    var after_down = row2!=undefined&&row2[afternoonperiod_coln]?row2[afternoonperiod_coln].split(' ')[1]:'N/A';
//    console.log(row1);
//    console.log(row2);
//    console.log(noon_up + ' ' + noon_down + ' ' + after_up + ' ' + after_down );

    row_merged[noonperiod_coln] = noon_up + 'to' + noon_down;

    var week_day = moment(row1[date_coln]).isoWeekday();
//    console.log(week_day);
    if ( week_day == 6 || week_day == 7) {
        row_merged[afternoonperiod_coln] = 'N/A' + 'to' + 'N/A';
    } else {
        row_merged[afternoonperiod_coln] = after_up + 'to' + after_down;
    }

    return row_merged;
}

var add_up_cells_of_row = function(target_row, row) {
    target_row[result_row_name[1]] += row[result_row_name[1]];
    target_row[result_row_name[2]] += row[result_row_name[2]];
    target_row[result_row_name[3]] += row[result_row_name[3]];
    target_row[result_row_name[5]] += row[result_row_name[5]];
    target_row[result_row_name[6]] += row[result_row_name[6]];
    target_row[result_row_name[7]] += row[result_row_name[7]];

    console.log('wo_hours' + target_row[result_row_name[7]]);
}

var get_endpoints = function(time_array) {
    var start = 0;
    var end   = 0;

    var i = 0, j = time_array.length - 1;
    for(; i < j; i++) {
        if (time_array[i] !== 0) {
            start = time_array[i];
            break;
        }
    }
    for (; i < j; j--) {
        if (time_array[j] != 0) {
            end = time_array[j];
            break;
        }
    }

//    console.log('start-end: ' + start + '-' + end);
    return [start, end];
}

var get_time_array = function(row) {
    var time_day_str    = row[date_coln];
    var time_noonper_str    = row[noonperiod_coln];
    var time_afterper_str   = row[afternoonperiod_coln];

    var noonper_array = [];
    var afterper_array = [];
    if (time_noonper_str == 'N/AtoN/A') {
        noonper_array = [0, 0];
    }
    else {
        noonper_array = parse_time(time_noonper_str);
    }

    if (time_afterper_str == 'N/AtoN/A') {
        afterper_array = [0, 0];
    }
    else {
        afterper_array = parse_time(time_afterper_str);
    }
    var time_array = [noonper_array[0], noonper_array[1], afterper_array[0], afterper_array[1]];
//    console.log(time_array);
    return time_array;
}

// @PARAM time_array contains a time string representing either period.
// @RETURN time_points is an array contains two time points aka start & end
//         [0, 0] if either start or end is 0
var parse_time = function(time_str) {
    var start = 0;
    var end = 0;
    var time_str_only = time_str;

//    console.log(time_str);
    if (pattern_start.test(time_str_only)) {
//        start = moment(time_str, date_format + ' HH:mm:sstoN/A');
        start = moment(time_str, 'HH:mm:sstoN/A');
    }
    else if (pattern_end.test(time_str_only)) {
//        end = moment(time_str, 'N/Ato' + date_format + ' HH:mm:ss');
        end = moment(time_str, 'N/AtoHH:mm:ss');
    }
    else if (pattern_period.test(time_str_only)) {
        var time_array  = time_str_only.split('to');

//        start   = moment(time_array[0], date_format + ' HH:mm:ss');
//        end     = moment(time_array[1], date_format + ' HH:mm:ss');
        start   = moment(time_array[0], 'HH:mm:ss');
        end     = moment(time_array[1], 'HH:mm:ss');
    }
    return [start, end];
}

// FIXME
// @PARAM start in milliseconds
// @PARAM end in milliseconds
var calculate_absence_count = function(start, end) {
    if (start === 0 || end === 0) {
        return 1;
    }

    var total = (moment(end).hours() + moment(end).minutes() / 60.0) - (moment(start).hours() + moment(start).minutes() / 60.0);
//    console.log('total: ' + total);
    if (total >= min_half_weekday_hours && total < min_weekday_hours) {
        return 0.5;
    }
    else if (total < min_half_weekday_hours) {
        return 1;
    }
    else {
        return 0;
    }
}

var judge = function(row) {
    var result = {};
    result[result_row_name[1]] = 0.0;
    result[result_row_name[2]] = 0;
    result[result_row_name[3]] = 0.0;
    result[result_row_name[5]] = 0.0;
    result[result_row_name[6]] = 0;
    result[result_row_name[7]] = 0;
    var time_array = get_time_array(row);
    var endpoints_array = get_endpoints(time_array);
    var start   = endpoints_array[0];
    var end     = endpoints_array[1];
    var absence_count = calculate_absence_count(start, end);

//    console.log(absence_count);
    var curr_date = moment(row[date_coln], date_format);
    // Check if it is holiday

    if (holidays.indexOf(row[date_coln]) != -1) {
        if (start !== 0 && end !== 0) {
            var duration = (end - start) / 1000.0
            var wo_hours = duration / 3600.0;
            result[result_row_name[7]]   = wo_hours;
            result[result_row_name[5]]   = 1;
        }
    }
    else {
        var week_day = curr_date.isoWeekday();
        console.log('2week_day: ' + week_day);

        if (!holidays.length && (curr_date.isoWeekday() == 6 || curr_date.isoWeekday() == 7)) {
            if (start !== 0 && end !== 0) {
                console.log('end: ' + end);
                console.log('start: ' + start);
                console.log('end - start= ' + moment(end-start).minutes());
                var duration = (end - start) / 1000.0
                var wo_hours = duration / 3600.0;
                result[result_row_name[7]]   = wo_hours;
                result[result_row_name[5]]   = 1;
            }
        }
        else if (absence_count !== 0) {
            result[result_row_name[3]] = absence_count;
            result[result_row_name[1]] = 1 - absence_count;
        }
        else {
            if (start.isAfter(moment(weekday_begin)) || end.isBefore(moment(weekday_end))) {
//                console.log('start: ' + moment(start).format() + ' end: ' + moment(end).format());
                result[result_row_name[2]] = 1;
            }
            else {
                if (end.isAfter(moment(weekday_workover))) {
                    result[result_row_name[6]] = 1;
                    result[result_row_name[5]] = 1;
                }
            }
            result[result_row_name[1]]   = 1;
        }
//        result[result_row_name[1]] += 1 - absence_count;
    }
    return result;
}