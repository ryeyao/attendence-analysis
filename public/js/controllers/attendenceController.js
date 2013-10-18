/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 10/10/13
 * Time: 2:30 PM
 */

function AttendenceController() {
    var that = this;

    var today = new Date();
    $('#holidays').multiDatesPicker({
        dateFormat: 'yy-mm-dd',
        onSelect: function(dateText, inst){
            $('#holidays-preview').append($('<pre></pre>', {text: dateText}));
        }
    });

    $('#save-btn').click(function() {
        that.exportTableToXLSX();
    });

    $('#emails-list').submit(function(e) {
        e.preventDefault();

        var file = that.buildXLSXFile();
        $.ajax({
            url: '/send-email',
            type: 'POST',
            beforeSubmit : function(formData, jqForm, options){
                var emails = ['123@123.com'];
                formData.push({file:file, emails:emails});
                return true;
            },
            success	: function(responseText, status, xhr, $form){
                if (status == 'success') {
                    console.log('Email Sent!');
                }
            },
            error : function(e){
                console.log('Sending email error ' + e);
            }
        })
    });

    var prev_key = null;
    $('#emails-input').tagsinput({
//        if ((event.which == 4
        confirmKeys: [13, 44, 188, 32, 186, 9]
    })

    this.exportTableToXLSX = function() {
        var file = this.buildXLSXFile();
        var result = xlsx(file);
        this.file = result;
        window.location = result.href();
    }

    this.buildXLSXFile = function() {
        var file = {
            worksheets: [],
            creator: 'Time2Money',
            created: new Date(),
            lastModifiedBy: this.user?this.user.email?this.user.email:'Time2Money':'Time2Money',
            modified: new Date(),
            activeworksheet: 0
        };
        var ws = file.worksheets;
        $('#attendence-div').find('table').each(function() {
            var sheet = [];
            var sheet_obj = {};
            var i = ws.push(sheet_obj) - 1;
            sheet_obj.data = sheet;
            sheet_obj.name = this.id;

            $(this).find('tr').each(function() {
                var r = sheet.push([]) - 1;
                $(this).find('input').each(function() {
                    sheet[r].push(this.value);
                })
            });
            ws[i] = sheet_obj;
        });
//        console.log(JSON.stringify(ws));

        return file;
    }

}
