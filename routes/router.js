/**
 * Created with JetBrains WebStorm.
 * Author: rye
 * Date: 9/12/13
 * Time: 10:34 AM
 */

var pages = require('./pages');
var forms = require('./forms');
var user = require('./user');

module.exports = function(app) {

    passport = app.passport;

    auto_auth = passport.authenticate('local', {usernameField:'email', passwordField:'pass', failureRedirect: '/', successRedirect: '/home'});

    app.get('/', pages.index);
    app.get('/login', pages.login);
    app.post('/login', auto_auth, forms.login);
    app.get('/home', pages.home);
    app.get('/reset-password', pages.reset_password);
    app.get('/signup', pages.signup);
    app.post('/signup', forms.signup);
    app.post('/update-account', forms.update_account);
    app.get('/users', user.list);

}
