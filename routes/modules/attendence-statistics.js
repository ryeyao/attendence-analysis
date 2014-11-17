/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 10/10/13
 * Time: 8:25 PM
 */

var moment = require('moment');
var fs = require('fs');
var prop = require('./utils/properties.js');

exports.calculate = function(json_data, options, callback) {
    if (typeof callback == 'undefined') {
        if (typeof options == 'undefined') {
            return;
        }
        callback = options;
        options = {};
    }

    var params = {};
    // Default parameters
    sheet_name              = prop.get_property(options['sheet_name']               ,   '考勤明细'                      );
    row_start               = prop.get_property(options['row_start']                ,   0                              );
    row_end                 = prop.get_property(options['row_end']                  ,   1071                           );
    col_start               = prop.get_property(options['col_start']                ,   0                              );
    col_end                 = prop.get_property(options['col_end']                  ,   11                             );

    name_coln               = prop.get_property(options['name_coln']                ,   '姓名'    );
    date_coln               = prop.get_property(options['date_coln']                ,   '日期'    );
    week_coln               = prop.get_property(options['week_coln']                ,   '星期'    );
    noonperiod_coln         = prop.get_property(options['noonperiod_coln']          ,   '签到时间');
    afternoonperiod_coln    = prop.get_property(options['afternoonperiod_coln']     ,   '签退时间');
    employee_num_coln       = prop.get_property(options['employee_num_coln']        ,   '员工编号');
    holidays                = prop.get_property(options['holidays']                 ,   []       ); // Holidays [YYYY-MM-DD], use weekends as default

    // Conditions
    weekday_begin           = prop.get_property(options['weekday_begin']            , {hour:  9, minute: 40});
    weekday_end             = prop.get_property(options['weekday_end']              , {hour: 16, minute: 50});
    weekday_workover        = prop.get_property(options['weekday_workover']         , {hour: 21            });

    min_weekday_hrs       = options['min_weekday_hrs']      ? options['min_weekday_hrs']      : 7;
    min_half_weekday_hours  = options['min_half_weekday_hours'] ? options['min_half_weekday_hours'] : 0;

    lunch_hours             = prop.get_property(options['lunch_hours']              , 1.5         );
    diner_hours             = prop.get_property(options['diner_hours']              , 1           );
    time_point_1            = prop.get_property(options['time_point_1']             , {hour: 18}  );
    time_point_2            = prop.get_property(options['time_point_2']             , {hour: 19}  );

    // Time Precision
    number_fixed = 2;

    // read groupinfo from file groupinfo.json
    members     =  {};

   // fs.readFile('./groupinfo.json',
   //         function(err, data) {
   //             members = JSON.parse(data);
   //         }
   // );
    members = require('../../groupinfo.json');

    members     = prop.get_property(options['members'], members);

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
    result_row_name = {
        name                            : '姓名', //0
        should_work_dys                 : '总工作日（天）',
        present_dys                     : '工作日出勤（天）',//1
        present_hrs                     : '总出勤（小时）',
        late_early_tms                  : '迟到/早退（次）', //2
        //leave_dys                       : '病事假（天）', //3
        leave_hrs                       : '病事假（小时）',
        //business_trip_dys               : '出差（天）', //4
        business_trip_hrs               : '出差（小时）',
        //extra_work_tms                  : '总加班（次）', //5
        extra_work_hrs                  : '总加班（小时）',
        force_extra_work_hrs            : '总强制加班时长（小时）',
        average_valid_work_hrs          : '日均有效工作（小时）',
        //regular_extra_work_tms          : '一般晚上加班（次）', //6
        //regular_weekend_extra_work_hrs  : '一般周末加班（小时）', //7
        //force_extra_work_tms            : '强制晚加班（次）', //8
        //force_weekend_extra_work_hrs    : '强制周末加班（小时）', //9
        extra_work_rate                 : '加班效果评价', //10
        subsidy                         : '补贴计算', //11
        comment                         : '备注说明', //12
        employee_id                     : '员工编号' //13

    };


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
        var name = sheet[row][result_row_name.name];
        var employee_num = sheet[row][result_row_name.employee_id];
        console.log('=========================');
//        console.log('0weekday ' + sheet[row][date_coln] +  ': ' + moment(sheet[row][date_coln]).isoWeekday());
        if (typeof sheet[row] == 'undefined' || typeof name == 'undefined') {
//            console.log('*****************************************row undefined');
            continue;
        }

//        console.log('===========' + row + '==============');
//        console.log(last_row);
//        console.log(sheet[row]);

        var row_merged = null;
        if (row != 0) {
            var is_same_day = sheet[row][date_coln] == last_row[date_coln];
            if (!is_same_day) {
                if (!_is_weekend(moment(sheet[row][date_coln], date_format))) {
                    last_row = sheet[row]
                    continue;
                }
                row_merged = _merge_rows_of_same_day(sheet[row], sheet[row]);
            } else {
                row_merged = _merge_rows_of_same_day(last_row, sheet[row]);
            }
        } else {
            last_row = sheet[row];
            continue;
        }

        // Merge rows of the same day
//        console.log(last_row);
//        console.log(sheet[row]);
        last_row = sheet[row]
//        if (row_merged[date_coln] == '2013-11-03') {
//            console.log(row_merged);
//        }

        var res = _judge(row_merged);
        last_row = sheet[row]

        var target_row = {};
        if (typeof result_map[employee_num] == 'undefined') {
            result_map[employee_num] = {};
            //for (var i = 0; i < result_row_name.length; i++) {
            //    var key = result_row_name[i];

            result_map[employee_num][result_row_name.name] = name;
            result_map[employee_num][result_row_name.present_dys] = 0;
            result_map[employee_num][result_row_name.present_hrs] = 0.0;
            result_map[employee_num][result_row_name.should_work_dys] = 0;
            result_map[employee_num][result_row_name.late_early_tms] = 0;
            result_map[employee_num][result_row_name.leave_hrs] = 0.0;
            result_map[employee_num][result_row_name.business_trip_hrs] = 0.0;
            result_map[employee_num][result_row_name.extra_work_hrs] = 0.0;
            result_map[employee_num][result_row_name.force_extra_work_hrs] = 0.0;
            result_map[employee_num][result_row_name.average_valid_work_hrs] = 0.0;
            result_map[employee_num][result_row_name.extra_work_rate] = 0.0;
            result_map[employee_num][result_row_name.subsidy] = 0;
            result_map[employee_num][result_row_name.comment] = '';
            result_map[employee_num][result_row_name.employee_id] = employee_num;

        }
        target_row = result_map[employee_num];
        _add_up_cells_of_row(target_row, res);
    }

    // Generate xlsx json from result_map
    // Group students
    var is_first = true;
    for (var k in result_map) {
        var target_row = result_map[k];

        // Calculate weekend workover days' count
        var total_present_hrs = target_row[result_row_name.present_hrs];
        var should_w_dys = target_row[result_row_name.should_work_dys];
        var should_w_hrs = min_weekday_hrs * should_w_dys;

        target_row[result_row_name.present_hrs] = total_present_hrs.toFixed(number_fixed);
        //console.log((typeof total_present_hrs) + total_present_hrs);
        //console.log((typeof should_w_dys) + should_w_dys);
        //console.log((typeof should_w_hrs) + should_w_hrs);
        //console.log(min_weekday_hrs);
        target_row[result_row_name.average_valid_work_hrs] = total_present_hrs / should_w_dys;

        if (total_present_hrs > should_w_hrs) {
            target_row[result_row_name.extra_work_hrs] = total_present_hrs - should_w_hrs;
        }
        else {
            target_row[result_row_name.leave_hrs] = should_w_hrs - total_present_hrs;
        }

//        console.log('wocount: ' + total_present_hrs);
//        console.log('wocount: ' + target_row[result_row_name.extra_work_tms]);
//        console.log('target_row: ');
//        console.log(target_row);


        //target_row[result_row_name.name] = k;
        //target_row[result_row_name.employee_id] = k;
        if (is_first) {
            target_row[result_row_name.subsidy] = '=F4*15+I4*40+(J4/8)*100+(G4*40+(H4/8)*100)*K4+E4*100-D4*80-C4*40'
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
        console.log(JSON.stringify(target_row));
    }

    // Add the rest in groupinfo
    var rest_map = {}
    for(var employee_num in members) {
        var name = members[employee_num]['name'];
        var leader = members[employee_num]['leader'];

        if(typeof result_sheet[employee_num] == 'undefined') {

            rest_map[employee_num] = {};
            rest_map[employee_num][result_row_name.name] = name;
            rest_map[employee_num][result_row_name.present_dys] = 0;
            rest_map[employee_num][result_row_name.present_hrs] = 0.0;
            rest_map[employee_num][result_row_name.should_work_dys] = 0;
            rest_map[employee_num][result_row_name.late_early_tms] = 0;
            rest_map[employee_num][result_row_name.leave_hrs] = 0.0;
            rest_map[employee_num][result_row_name.business_trip_hrs] = 0.0;
            rest_map[employee_num][result_row_name.extra_work_hrs] = 0.0;
            rest_map[employee_num][result_row_name.force_extra_work_hrs] = 0.0;
            rest_map[employee_num][result_row_name.average_valid_work_hrs] = 0.0;
            rest_map[employee_num][result_row_name.extra_work_rate] = 0.0;
            rest_map[employee_num][result_row_name.subsidy] = 0;
            rest_map[employee_num][result_row_name.comment] = '';
            rest_map[employee_num][result_row_name.employee_id] = employee_num;

            target_row = rest_map[employee_num];

            // add to sheet
                
            if (typeof result_workbook[leader] == 'undefined') {
                    result_workbook[leader] = {};
            }
            result_workbook[leader][employee_num] = target_row;
            result_sheet[employee_num] = target_row;
//            result_map[name] = row;
        }
    }
//}

//    console.log(result_workbook);
    result_workbook['all'] = result_sheet;
    result_json_data['records'] = result_workbook;
    result_json_data['titles'] = result_row_name;

    callback(0, result_json_data);

}

var _merge_rows_of_same_day = function(row1, row2) {
    var row_merged = row1
    var noon_up = row1[noonperiod_coln]?row1[noonperiod_coln].split(' ')[1]:'N/A';
    var noon_down = row1[afternoonperiod_coln]?row1[afternoonperiod_coln].split(' ')[1]:'N/A';
    var after_up = row2!=undefined&&row2[noonperiod_coln]?row2[noonperiod_coln].split(' ')[1]:'N/A';
    var after_down = row2!=undefined&&row2[afternoonperiod_coln]?row2[afternoonperiod_coln].split(' ')[1]:'N/A';
//    console.log(row1);
//    console.log(row2);
//    console.log(noon_up + ' ' + noon_down + ' ' + after_up + ' ' + after_down );

    row_merged[noonperiod_coln] = noon_up + 'to' + noon_down;

    if (_is_weekend(moment(row1[date_coln]))) {
        row_merged[afternoonperiod_coln] = 'N/A' + 'to' + 'N/A';
    } else {
        row_merged[afternoonperiod_coln] = after_up + 'to' + after_down;
    }

    return row_merged;
}

var _add_up_cells_of_row = function(target_row, row) {
    target_row[result_row_name.present_dys] += row[result_row_name.present_dys];
    target_row[result_row_name.present_hrs] += row[result_row_name.present_hrs];
    target_row[result_row_name.should_work_dys] += row[result_row_name.should_work_dys];
    target_row[result_row_name.late_early_tms] += row[result_row_name.late_early_tms];
    //target_row[result_row_name.leave_hrs] += row[result_row_name.leave_hrs];
    //target_row[result_row_name.business_trip_hrs] += row[result_row_name.business_trip_hrs];
    //target_row[result_row_name.extra_work_hrs] += row[result_row_name.extra_work_hrs];
    //target_row[result_row_name.force_extra_work_hrs] += row[result_row_name.force_extra_work_hrs];
//    console.log('work over hours: ' + target_row[result_row_name.regular_weekend_extra_work_hrs]);
}

var _get_endpoints = function(time_array) {
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

var _get_time_array = function(row) {
    var time_day_str    = row[date_coln];
    var time_noonper_str    = row[noonperiod_coln];
    var time_afterper_str   = row[afternoonperiod_coln];

    var noonper_array = [];
    var afterper_array = [];
    if (time_noonper_str == 'N/AtoN/A') {
        noonper_array = [0, 0];
    }
    else {
        noonper_array = _parse_time(time_noonper_str);
    }

    if (time_afterper_str == 'N/AtoN/A') {
        afterper_array = [0, 0];
    }
    else {
        afterper_array = _parse_time(time_afterper_str);
    }
    var time_array = [noonper_array[0], noonper_array[1], afterper_array[0], afterper_array[1]];
//    console.log(time_array);
    return time_array;
}

// @PARAM time_array contains a time string representing either period.
// @RETURN time_points is an array contains two time points aka start & end
//         [0, 0] if either start or end is 0
var _parse_time = function(time_str) {
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
var _calculate_absence_count = function(start, end) {
    if (start === 0 || end === 0) {
        return 1;
    }

//    var total = (moment(end).hours() + moment(end).minutes() / 60.0) - (moment(start).hours() + moment(start).minutes() / 60.0);
    var total = (end - start) / 3600000;
    console.log('total work hours: ' + total);
//    console.log((moment(end).hours() + moment(end).minutes() / 60.0) + ' : ' + (moment(start).hours() + moment(start).minutes() / 60.0));
    if (total >= min_half_weekday_hours && total < min_weekday_hrs) {
        return 0.5;
    }
    else if (total < min_half_weekday_hours) {
        return 1;
    }
    else {
        return 0;
    }
}

function _judge_strategy (row) {

    var result = {};
    result[result_row_name.present_dys] = 0;
    result[result_row_name.late_early_tms] = 0;
    result[result_row_name.leave_dys] = 0.0;
    result[result_row_name.extra_work_tms] = 0.0;
    result[result_row_name.regular_extra_work_tms] = 0;
    result[result_row_name.regular_weekend_extra_work_hrs] = 0;
    result[result_row_name.extra_work_hrs] = 0.0;
    result[result_row_name.force_extra_work_hrs] = 0.0;
    result[result_row_name.average_valid_work_hrs] = 0.0;

    var time_array = _get_time_array(row);
    var endpoints_array = _get_endpoints(time_array);
    var start   = endpoints_array[0];
    var end     = endpoints_array[1];
//    if (row[result_row_name.name] == '高山岩') {
//        console.log('========start ' + start);
//        console.log('end ' + end + '========');
//    }
    var absence_count = _calculate_absence_count(start, end);

//    console.log(absence_count);
    var curr_date = moment(row[date_coln], date_format);
    // Check if it is specified holiday
    console.log('Date: ' + row[date_coln]);
    //console.log('begin: ' + end);
    //console.log('end: ' + start);
    //console.log('end - start: ' + moment(end-start).valueOf() / 60000 + ' minutes');

    if (holidays.indexOf(row[date_coln]) != -1) {
        console.log(row[date_coln] + ": holiday.");
        if (start !== 0 && end !== 0) {
            var duration = (end - start) / 1000.0
            var wo_hours = duration / 3600.0;
            result[result_row_name.regular_weekend_extra_work_hrs]   = wo_hours;
//            result[result_row_name.extra_work_tms]   = 1;
        }
    }
    else {
        var week_day = curr_date.isoWeekday();
//        console.log('2week_day: ' + week_day);

        // Check if it is weekend
        if (curr_date.isoWeekday() == 6 || curr_date.isoWeekday() == 7) {
            if (start !== 0 && end !== 0) {
                var duration = (end - start) / 1000.0
                var wo_hours = duration / 3600.0;
                result[result_row_name.regular_weekend_extra_work_hrs]   = wo_hours;
                console.log('work over: ' + wo_hours + ' hours');
//                result[result_row_name.extra_work_tms]   = 1;
            }
        }
        else if (absence_count !== 0) {
            result[result_row_name.leave_dys] = absence_count;
            result[result_row_name.present_dys] = 1 - absence_count;
            console.log('Absence: ' + absence_count);
        }
        else {
            if (start.isAfter(moment(weekday_begin)) || end.isBefore(moment(weekday_end))) {
//                console.log('start: ' + moment(start).format() + ' end: ' + moment(end).format());
                result[result_row_name.late_early_tms] = 1;
                console.log('Late/Early: 1');
            }
            else {
                if (end.isAfter(moment(weekday_workover))) {
                    result[result_row_name.regular_extra_work_tms] = 1;
                    result[result_row_name.extra_work_tms] = 1;
                    console.log('Normal work over: 1');
                }
            }
            result[result_row_name.present_dys]   = 1;
        }
//        result[result_row_name.present_dys] += 1 - absence_count;
    }
    return result;

}

function _judge_strategy_new (row) {

    var result = {};
    result[result_row_name.present_hrs] = 0.0;
    result[result_row_name.late_early_tms] = 0;
    result[result_row_name.should_work_dys] = 0;
    result[result_row_name.present_dys] = 0;

    var time_array = _get_time_array(row);
    var endpoints_array = _get_endpoints(time_array);
    var start   = endpoints_array[0];
    var end     = endpoints_array[1];
    var absence_count = _calculate_absence_count(start, end);

    var curr_date = moment(row[date_coln], date_format);
    // Check if it is specified holiday
    console.log('Date: ' + row[date_coln]);
    //console.log('begin: ' + end);
    //console.log('end: ' + start);
    //console.log('end - start: ' + moment(end-start).valueOf() / 60000 + ' minutes');

    var week_day = curr_date.isoWeekday();


    var wo_hours = _get_duration_hours(start, end);

    if (_is_holiday(row[date_coln]) ) {
        if (start == 0 || end == 0) {
            return result;
        }
        result[result_row_name.present_hrs]   = wo_hours;
    }
    else {
        if (_is_weekend(curr_date)) {
            if (start == 0 || end == 0) {
                return result;
            }
            result[result_row_name.present_hrs]   = wo_hours;
        }
        else {
            result[result_row_name.should_work_dys] = 1;
            if (start == 0 || end == 0) {
                return result;
            }
            result[result_row_name.present_dys] = 1;
            if (start.isAfter(moment(weekday_begin)) || end.isBefore(moment(weekday_end))) {
                result[result_row_name.late_early_tms] = 1;
                console.log('Late/Early: 1');
            }

            if (end.isAfter(moment(time_point_2))) {
                result[result_row_name.present_hrs] = wo_hours - lunch_hours - diner_hours;
            }
            else if (end.isAfter(moment(time_point_1))) {
                result[result_row_name.present_hrs] = _get_duration_hours(start, moment(time_point_1)) - lunch_hours;
            }
            else {
                result[result_row_name.present_hrs] = wo_hours - lunch_hours;
            }
        }
    }

    return result;
}

function _get_duration_hours (start, end) {
    return (end - start) / 3600000.0;
}

function _judge (row) {
    return _judge_strategy_new(row);
}

function _is_holiday (date_str) {
    return holidays.indexOf(date_str) !== -1;
}

// day moment
function _is_weekend (day) {
    var num = day.isoWeekday();
    return num == 6 || num == 7;
}

