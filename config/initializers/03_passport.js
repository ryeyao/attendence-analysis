/**
 * @file 02_passport.js
 * @brief 
 * @author Rye Yao
 * @version 0.1
 * @date 2013-09-11
 */

var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');

module.exports = function(app, done) {

    passport.serializeUser(function(user, done) {
        console.log('Serialize User id ' + user._id);
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {

        console.log('De-Serialize User');
            userModel.get(id, function(err, user) {
                console.log('err ' + err);
                if (err) {
                    done(err);
                } else {
                    done(err, user);
                }
            })
    });

    passport.use(new LocalStrategy({usernameField:'email', passwordField:'pass'},
        function(email, password, done) {
            console.log('passport.use ' + email + password);
            console.log('Auth ok, email: ' + email + ' pass ' + password);
            app.user_model.sync();
            app.user_model.find({email:email}, function(err, user) {
                if (err || !user.length) {
                    console.log('No User Found! err ' + err + ' length ' + user.length);
                    done(err);
                } else {
                    if (user.length) {
                        console.log('User ' + user[0] + ' found.');
                        account_manager.validatePassword(password, user[0].pass, function(err, res) {
                            if (res){
                                done(err, user[0]);
                            } else {
                                done(err, user[0]);
                            }
                        });
                    }
                }
            })
        }
    ));

    app.use(passport.initialize());
    app.use(passport.session());

    app.passport = passport;
    done(null, null);

}
