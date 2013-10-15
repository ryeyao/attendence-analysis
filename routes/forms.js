/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 9/16/13
 * Time: 3:07 PM
 */

var AM = require('./modules/account-manager');
var ED = require('./modules/email-dispatcher');
var XP = require('./modules/xlsx-parser');
var AS = require('./modules/attendence-statistics');

exports.signup = function(req, res) {

    AM.new_account(req.models.user, {
        email   : req.param('email'),
        name    : req.param('name'),
        pass    : req.param('pass')
    }, function(err) {
        if (err) {
            res.send(err, 400);
        } else {
            res.send('ok', 200);
        }
    })
}

exports.update_account = function(req, res) {

    AM.update_account(req.models.user, {
        email   : req.param('email'),
        name    : req.param('name'),
        pass    : req.param('pass')
    }, function(err) {
        if (err) {
            res.send(err, 400);
        } else {
            res.send('ok', 200);
        }
    })
}

exports.login = function(req, res) {
    // NOTE: No need to do anything. Passport.authenticate will handle this request.
    console.log('Oh!');
    if (req.param('remember-me') == 'true') {
        console.log('Yes!');
        res.cookie('email', req.param('email'), {maxAge: 900000});
        res.cookie('pass', req.param('pass'), {maxAge: 900000});
    }
}


exports.upload_file = function(req, res) {
    XP.parse(req.files.file.path, function(err, json_data) {
        console.log('holidays: ' + req.param.holidays);
        AS.calculate(json_data, {holidays:req.param.holidays}, function(err, json_result) {
            if (err) {

            }
            else {
                console.log(json_result);
                res.send(json_result);
            }
        })
    })
}
