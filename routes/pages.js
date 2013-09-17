
/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', { title: 'Visual Pipes' });
};

exports.login = function(req, res) {
    res.render('login', {});
}

exports.signup = function(req, res) {
    res.render('signup', {});
}

exports.home = function(req, res) {
    res.render('home', {});
}

exports.reset_password = function(req, res) {
    res.render('reset', {});
}
