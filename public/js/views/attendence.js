/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 10/10/13
 * Time: 2:29 PM
 */

$(document).ready(function() {

    var ac = new AttendenceController();
//    var table = $('#attendence-table');

    var table_div = $('#attendence-div');
    var table = $('<table class=\'table table-striped table-bordered table-responsive table-hover table-condensed\'></table>');
    $('#save-btn').hide();
    $('#send-email-btn').hide();

    var drop_handler = new Dropzone('div#drop', {url:'upload-file'});

    drop_handler.on('sending', function(file, xhr, formData) {
        var holidays = $('#holidays').multiDatesPicker('getDates');
        formData.append('holidays', holidays);
    });

    drop_handler.on('addedfile', function(file) {

        // Just clean the table and dropzone view
        table_div.remove();
        table_div = $('<div id="attendence-div" class=\'table-responsive tab-content\'></div>');
        $('#table-panel-div').append(table_div);

        table.remove();
        table = $('<table class=\'table table-striped table-bordered table-responsive table-hover table-condensed\'></table>');

        $('#att-tab').remove();
        $('#save-btn').show();
        $('#send-email-btn').show();
    });

    drop_handler.on('success', function(file, response) {
//        console.log('response code ' + response);
        var json_data = response;
        var titles = json_data.titles;
        var records = json_data.records;
        var tabs = $('<ul class="nav nav-tabs nav-justified" id="att-tab"></ul>');

        $('#sheet-tab').append(tabs);

        // Build workbook
        $.each(records, function(sheet_name, sheet) {
            var sheet_header_text = '小组名称：物联网支撑+无线自组织传感网';
            var header_row = $('<tr></tr>').append($('<td></td>').append($('<input>', {value : sheet_header_text})));
            var foot_rows = [
                $('<tr></tr>'),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : '1、实验室成员被要求强制加班时，超出月最低工作时间（35小时）的部分可选择将强制加班时间用于调休或获取货币津贴。'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : '绩效计算公式：总加班*15元餐补+强制晚加班*40元补贴+（强制周末加班时间/8小时）*100+（一般晚加班*40+（一般周末加班时间/8小时）*100）*效果评价+出差*100-事假*80-迟到*40'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : '2、对于货币津贴的兑现公式如下：（加班时长)*每时餐补+(强制加班时长+出差-事假+一般加班*效果评价)/7*（基本工资/22天）- 迟到*40'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : ' a) 每时餐补为4元/时；'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : '	b) 学生基本工资标准：本科1500元，硕士1800元，博士2800元；'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : ' c) 职工基本工资标准：定级工资和绩效。'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : '3、调休在年内有效，由考勤管理员负责统计记录。'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : '4、实验室外聘职工和学生奖励或处罚在当月绩效中予以体现；实验室员工奖励或处罚在年底发放年终奖中予以体现。'}))),
                $('<tr></tr>').append($('<td></td>').append($('<input>', {value : '注：每天有效工作时间按照7小时计算。'})))
            ];

            var curr_table = $('<table class=\'table table-striped table-bordered table-responsive table-hover table-condensed\'></table>');
            var content_div = $('<div class="tab-pane fade"></div>')

            // Build title line
            var title_row = $('<tr></tr>');
            $.each(titles, function(key, title) {
                $('<td></td>').append($('<input>', {value : title})).appendTo(title_row);
            });
            curr_table.append(title_row);

            curr_table.attr('id', sheet_name);
            content_div.attr('id', sheet_name);

            curr_table.append(header_row);
            curr_table.append($('<tr></tr>'));
            curr_table.append(title_row);


            // Build sheet tabs
            var tab = $('<li></li>');
            var row = $('<tr></tr>');

            tab.append($('<a href="#' + sheet_name + '" data-toggle="tab">' + sheet_name + '</a>'));
            tabs.append(tab);


            // Build sheet table
            $.each(sheet, function(name, record) {
                row = $('<tr></tr>');
                // Build sheet rows
                $.each(record, function(id, cell) {
                    $('<td></td>').append($('<input>', {value : cell})).appendTo(row);
                });
                row.appendTo(curr_table);
            });

            // Build footer line
            $.each(foot_rows, function(id, foot) {
                curr_table.append(foot);
            })

            // Build sheet tab content
            curr_table.appendTo(content_div);
            content_div.appendTo(table_div);
            $('#' + sheet_name + ' a').click(function (e) {
                e.preventDefault();
                $(this).tab('show');
            })
        });
//        console.log(table);
    });
})