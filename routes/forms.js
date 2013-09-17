/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 9/16/13
 * Time: 3:07 PM
 */

var AM = require('./modules/account-manager');
var ED = require('./modules/email-dispatcher');

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
}
