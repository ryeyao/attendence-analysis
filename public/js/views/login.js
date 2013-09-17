/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 9/16/13
 * Time: 11:23 AM
 */

$(document).ready(function() {
    
    var lv = new LoginValidator();

    // TODO: do login validate
    $('#login-form').ajaxForm({
        beforeSubmit : function(formData, jqForm, options) {
            
            if (lv.validateForm() == false) {
                return false;

            } else {
                // Write local cookie to enable 'remember-me'
                formData.push({name: 'remember-me', value : $('input:checkbox:checked').length == 1});
                return true;
            }
        },

        success : function(responseText, status, xhr, $form) {
            if (status == 'success') window.location.href = '/home';
        },

        error : function(e) {
            lv.showLoginError('Login Failure', 'Please check your email and/or password');
        }
    });

    $('#user-tf').focus();

    var ev = new EmailValidator();

    $('#get-credentials-form').ajaxForm({
        url: '/lost-password',
        beforeSubmit : function(formData, jqForm, options) {
            if (ev.validateEmail($('#email-tf').val())) {
                ev.hideEmailAlert();
                return true;
            } else {
                ev.showEmailAlert('<b> Error! </b> Please enter a valid email address');
                return false;
            }

        },

        success : function(responseText, status, xhr, $form) {
            ev.showEmailSuccess('Check your email on how to reset your password.');
        },

        error : function() {
            ev.showEmailAlert('Sorry. There was a problem, please try again later.');
        }
    })
})
