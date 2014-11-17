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

    params = {};
    // Default parameters

    _prepare_options(options);

    // TODO format sheet, remove unrelated rows

    // Do calculate
    var result_json_data = {};
    var result_workbook = {};
    var result_sheet = {};


    var sheet = json_data[params.sheet_name];
    var result_map = _calculate_and_addup(sheet);

    // Generate xlsx json from result_map
    // Group students
    _grouping(result_map, result_workbook, result_sheet);

    // Add the rest in groupinfo
    _grouping_rest(result_workbook, result_sheet);

    result_workbook['all'] = result_sheet;
    result_json_data['records'] = result_workbook;
    result_json_data['titles'] = result_row_name;

    callback(0, result_json_data);

}

function _grouping_rest (result_workbook, result_sheet) {

    var rest_map = {}
    for(var employee_num in params.members) {
        var name = params.members[employee_num]['name'];
        var leader = params.members[employee_num]['leader'];

        if(typeof result_sheet[employee_num] == 'undefined') {

            rest_map[employee_num] = _create_new_row();
            rest_map[employee_num][result_row_name.name] = name;
            rest_map[employee_num][result_row_name.employee_id] = employee_num;

            var target_row = rest_map[employee_num];

            // add to sheet

            if (typeof result_workbook[leader] == 'undefined') {
                result_workbook[leader] = {};
            }
            result_workbook[leader][employee_num] = target_row;
            result_sheet[employee_num] = target_row;
        }
    }
}

function _grouping (result_map, result_workbook, result_sheet) {

    var is_first = true;
    for (var k in result_map) {
        var target_row = result_map[k];

        // Calculate weekend workover days' count
        var total_present_hrs = target_row[result_row_name.present_hrs];
        var should_w_dys = target_row[result_row_name.should_work_dys];
        var should_w_hrs = params.min_weekday_hrs * should_w_dys;

        target_row[result_row_name.present_hrs] = _to_fixed(total_present_hrs);
        target_row[result_row_name.average_valid_work_hrs] = _to_fixed(total_present_hrs / should_w_dys);

        if (total_present_hrs > should_w_hrs) {
            target_row[result_row_name.extra_work_hrs] = _to_fixed(total_present_hrs - should_w_hrs);
            target_row[result_row_name.regular_extra_work_hrs] = _to_fixed(total_present_hrs - should_w_hrs);
        }
        else {
            target_row[result_row_name.leave_hrs] = _to_fixed(should_w_hrs - total_present_hrs);
        }

        if (is_first) {
            target_row[result_row_name.subsidy] = params.subsidy_formula;
            is_first = false;
        }

        if (typeof params.members[k] == 'undefined') {
            if (typeof result_workbook['ungrouped'] == 'undefined') {
                result_workbook['ungrouped'] = {};
            }
            result_workbook['ungrouped'][k] = target_row;
        } else {
            var leader = params.members[k]['leader'];
            if (typeof result_workbook[leader] == 'undefined') {
                result_workbook[leader] = {};
            }
            result_workbook[leader][k] = target_row;
        }
        result_sheet[k] = target_row;
        console.log(JSON.stringify(target_row));
    }
}

function _to_fixed (num) {
    if (typeof num === 'number') {
        return num.toFixed(params.number_fixed);
    }

    return num;
}

function _prepare_options (options) {

    params.sheet_name              = prop.get_property(options['sheet_name']               ,   '考勤明细');
    params.row_start               = prop.get_property(options['row_start']                ,   0        );
    params.row_end                 = prop.get_property(options['row_end']                  ,   1071     );
    params.col_start               = prop.get_property(options['col_start']                ,   0        );
    params.col_end                 = prop.get_property(options['col_end']                  ,   11       );

    params.name_coln               = prop.get_property(options['name_coln']                ,   '姓名'    );
    params.date_coln               = prop.get_property(options['date_coln']                ,   '日期'    );
    params.week_coln               = prop.get_property(options['week_coln']                ,   '星期'    );
    params.noonperiod_coln         = prop.get_property(options['noonperiod_coln']          ,   '签到时间');
    params.afternoonperiod_coln    = prop.get_property(options['afternoonperiod_coln']     ,   '签退时间');
    params.employee_num_coln       = prop.get_property(options['employee_num_coln']        ,   '员工编号');
    params.holidays                = prop.get_property(options['holidays']                 ,   []       ); // Holidays [YYYY-MM-DD], use weekends as default

    // Conditions
    params.weekday_begin           = prop.get_property(options['weekday_begin']            , {hour:  9, minute: 40});
    params.weekday_end             = prop.get_property(options['weekday_end']              , {hour: 16, minute: 50});
    params.weekday_workover        = prop.get_property(options['weekday_workover']         , {hour: 21            });

    params.min_weekday_hrs         = prop.get_property(options['min_weekday_hrs']          , 7);
    params.min_half_weekday_hours  = prop.get_property(options['min_half_weekday_hours']   , 0);

    params.lunch_hours             = prop.get_property(options['lunch_hours']              , 1.5         );
    params.diner_hours             = prop.get_property(options['diner_hours']              , 1           );
    params.time_point_1            = prop.get_property(options['time_point_1']             , {hour: 18}  );
    params.time_point_2            = prop.get_property(options['time_point_2']             , {hour: 19}  );

    // Float Precision
    params.number_fixed            = prop.get_property(options['number_fixed']             , 2           );

    params.subsidy_formula        = '=H4*4+(I4+G4-F4+J4*L4)/7*(M4/22)-E4*40';
    // read groupinfo from file groupinfo.json
    params.members     =  {};

    // fs.readFile('./groupinfo.json',
    //         function(err, data) {
    //             params.members = JSON.parse(data);
    //         }
    // );
    params.members = require('../../groupinfo.json');

    params.members     = prop.get_property(options['members'], params.members);

    // Patterns
    params.time_format = prop.get_property(options['time_format'], 'HH:mm:ss');
    params.date_format = prop.get_property(options['date_format'], 'YYYY-MM-DD');

//    params.pattern_start   = /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)toN\/A$/i;
//    params.pattern_end     = /^N\/Ato\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i;
//    params.pattern_period  = /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)to\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i;
    params.pattern_start   = prop.get_property(options['pattern_start'] , /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)toN\/A$/i);
    params.pattern_end     = prop.get_property(options['pattern_end']   , /^N\/Ato([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i);
    params.pattern_period  = prop.get_property(options['pattern_period'], /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)to([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/i);

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
        regular_extra_work_hrs          : '总一般加班时长（小时）',
        average_valid_work_hrs          : '日均有效工作（小时）',
        //regular_extra_work_tms          : '一般晚上加班（次）', //6
        //regular_weekend_extra_work_hrs  : '一般周末加班（小时）', //7
        //force_extra_work_tms            : '强制晚加班（次）', //8
        //force_weekend_extra_work_hrs    : '强制周末加班（小时）', //9
        extra_work_rate                 : '加班效果评价', //10
        base_salary                     : '基本工资',
        subsidy                         : '补贴计算', //11
        comment                         : '备注说明', //12
        employee_id                     : '员工编号' //13

    };
}

function _calculate_and_addup (sheet) {

    var result_map = {};
    var last_row = null;
    for (var row = 0; row < sheet.length; row++) {
        var name = sheet[row][result_row_name.name];
        var employee_num = sheet[row][result_row_name.employee_id];
        console.log('=========================');
//        console.log('0weekday ' + sheet[row][params.date_coln] +  ': ' + moment(sheet[row][params.date_coln]).isoWeekday());
        if (typeof sheet[row] == 'undefined' || typeof name == 'undefined') {
//            console.log('*****************************************row undefined');
            continue;
        }

//        console.log('===========' + row + '==============');
//        console.log(last_row);
//        console.log(sheet[row]);

        var row_merged = null;
        if (row != 0) {
            var is_same_day = sheet[row][params.date_coln] == last_row[params.date_coln];
            if (!is_same_day) {
                if (!_is_weekend(moment(sheet[row][params.date_coln], params.date_format))) {
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
//        if (row_merged[params.date_coln] == '2013-11-03') {
//            console.log(row_merged);
//        }

        var res = _judge(row_merged);
        last_row = sheet[row]

        var target_row = {};
        if (typeof result_map[employee_num] == 'undefined') {
            result_map[employee_num] = _create_new_row();
            result_map[employee_num][result_row_name.name] = name;
            result_map[employee_num][result_row_name.employee_id] = employee_num;

        }
        target_row = result_map[employee_num];
        _add_up_cells_of_row(target_row, res);
    }

    return result_map;
}

function _create_new_row () {
    var row = {};
    row[result_row_name.name] = '';
    row[result_row_name.should_work_dys] = 0;
    row[result_row_name.present_dys] = 0;
    row[result_row_name.present_hrs] = 0.0;
    row[result_row_name.late_early_tms] = 0;
    row[result_row_name.leave_hrs] = 0.0;
    row[result_row_name.business_trip_hrs] = 0.0;
    row[result_row_name.extra_work_hrs] = 0.0;
    row[result_row_name.force_extra_work_hrs] = 0.0;
    row[result_row_name.regular_extra_work_hrs] = 0.0;
    row[result_row_name.average_valid_work_hrs] = 0.0;
    row[result_row_name.extra_work_rate] = 0.0;
    row[result_row_name.base_salary] = 0;
    row[result_row_name.subsidy] = 0;
    row[result_row_name.comment] = '';
    row[result_row_name.employee_id] = '';

    return row;
}

var _merge_rows_of_same_day = function(row1, row2) {
    var row_merged = row1
    var noon_up = row1[params.noonperiod_coln]?row1[params.noonperiod_coln].split(' ')[1]:'N/A';
    var noon_down = row1[params.afternoonperiod_coln]?row1[params.afternoonperiod_coln].split(' ')[1]:'N/A';
    var after_up = row2!=undefined&&row2[params.noonperiod_coln]?row2[params.noonperiod_coln].split(' ')[1]:'N/A';
    var after_down = row2!=undefined&&row2[params.afternoonperiod_coln]?row2[params.afternoonperiod_coln].split(' ')[1]:'N/A';
//    console.log(row1);
//    console.log(row2);
//    console.log(noon_up + ' ' + noon_down + ' ' + after_up + ' ' + after_down );

    row_merged[params.noonperiod_coln] = noon_up + 'to' + noon_down;

    if (_is_weekend(moment(row1[params.date_coln]))) {
        row_merged[params.afternoonperiod_coln] = 'N/A' + 'to' + 'N/A';
    } else {
        row_merged[params.afternoonperiod_coln] = after_up + 'to' + after_down;
    }

    return row_merged;
}

var _add_up_cells_of_row = function(target_row, row) {
    target_row[result_row_name.should_work_dys] += row[result_row_name.should_work_dys];
    target_row[result_row_name.present_dys] += row[result_row_name.present_dys];
    target_row[result_row_name.present_hrs] += row[result_row_name.present_hrs];
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
    var time_day_str    = row[params.date_coln];
    var time_noonper_str    = row[params.noonperiod_coln];
    var time_afterper_str   = row[params.afternoonperiod_coln];

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
    if (params.pattern_start.test(time_str_only)) {
//        start = moment(time_str, params.date_format + ' HH:mm:sstoN/A');
        start = moment(time_str, 'HH:mm:sstoN/A');
    }
    else if (params.pattern_end.test(time_str_only)) {
//        end = moment(time_str, 'N/Ato' + params.date_format + ' HH:mm:ss');
        end = moment(time_str, 'N/AtoHH:mm:ss');
    }
    else if (params.pattern_period.test(time_str_only)) {
        var time_array  = time_str_only.split('to');

//        start   = moment(time_array[0], params.date_format + ' HH:mm:ss');
//        end     = moment(time_array[1], params.date_format + ' HH:mm:ss');
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
    if (total >= params.min_half_weekday_hours && total < params.min_weekday_hrs) {
        return 0.5;
    }
    else if (total < params.min_half_weekday_hours) {
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
    var curr_date = moment(row[params.date_coln], params.date_format);
    // Check if it is specified holiday
    console.log('Date: ' + row[params.date_coln]);
    //console.log('begin: ' + end);
    //console.log('end: ' + start);
    //console.log('end - start: ' + moment(end-start).valueOf() / 60000 + ' minutes');

    if (params.holidays.indexOf(row[params.date_coln]) != -1) {
        console.log(row[params.date_coln] + ": holiday.");
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
            if (start.isAfter(moment(params.weekday_begin)) || end.isBefore(moment(params.weekday_end))) {
//                console.log('start: ' + moment(start).format() + ' end: ' + moment(end).format());
                result[result_row_name.late_early_tms] = 1;
                console.log('Late/Early: 1');
            }
            else {
                if (end.isAfter(moment(params.weekday_workover))) {
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
    result[result_row_name.should_work_dys] = 0;
    result[result_row_name.present_dys] = 0;
    result[result_row_name.present_hrs] = 0.0;
    result[result_row_name.late_early_tms] = 0;

    var time_array = _get_time_array(row);
    var endpoints_array = _get_endpoints(time_array);
    var start   = endpoints_array[0];
    var end     = endpoints_array[1];
    var absence_count = _calculate_absence_count(start, end);

    var curr_date = moment(row[params.date_coln], params.date_format);
    // Check if it is specified holiday
    console.log('Date: ' + row[params.date_coln]);
    //console.log('begin: ' + end);
    //console.log('end: ' + start);
    //console.log('end - start: ' + moment(end-start).valueOf() / 60000 + ' minutes');

    var week_day = curr_date.isoWeekday();


    var wo_hours = _get_duration_hours(start, end);

    if (_is_holiday(row[params.date_coln]) ) {
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
            if (start.isAfter(moment(params.weekday_begin)) || end.isBefore(moment(params.weekday_end))) {
                result[result_row_name.late_early_tms] = 1;
                console.log('Late/Early: 1');
            }

            if (end.isAfter(moment(params.time_point_2))) {
                result[result_row_name.present_hrs] = wo_hours - params.lunch_hours - params.diner_hours;
            }
            else if (end.isAfter(moment(params.time_point_1))) {
                result[result_row_name.present_hrs] = _get_duration_hours(start, moment(params.time_point_1)) - params.lunch_hours;
            }
            else {
                result[result_row_name.present_hrs] = wo_hours - params.lunch_hours;
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
    return params.holidays.indexOf(date_str) !== -1;
}

// day moment
function _is_weekend (day) {
    var num = day.isoWeekday();
    return num == 6 || num == 7;
}

