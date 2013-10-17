
var ES = require('./email-settings');
var EM = {};

module.exports = EM;

//EM.server = require("emailjs/email").server.connect({
//
//    host        : ES.host,
//    port        : ES.port,
//    user        : ES.user,
//    password    : ES.password,
//    tls         : ES.tls,
//    domain      : ES.domain,
//    email       : ES.email,
//    sender      : ES.sender
//});

EM.server = require('emailjs/email').server.connect(ES);

EM.dispatchXLSXFile = function(accounts, file, callback) {
    console.log('dispatchXLSXFile');
    EM.server.send({
        from         : 'time2money <time2money@iiewsn>',
        to           : 'Rye <rye.y.cn@gmail.com>, Rye Yao <fox2mail@foxmail.com>',
        subject      : 'Attendence Statistics',
        text         : 'Hey!'
//        attachment   : {data:file, alternative:true}
    }, callback );
}

EM.dispatchResetPasswordLink = function(account, callback)
{
    EM.server.send({
        from         : ES.sender,
        to           : account.email,
        subject      : 'Password Reset',
        text         : 'something went wrong... :(',
        attachment   : EM.composeEmail(account)
    }, callback );
}

EM.composeEmail = function(o)
{
    var link = 'http://node-login.braitsch.io/reset-password?e='+o.email+'&p='+o.pass;
    var html = "<html><body>";
        html += "Hi "+o.name+",<br><br>";
        html += "Your email is :: <b>"+o.email+"</b><br><br>";
        html += "<a href='"+link+"'>Please click here to reset your password</a><br><br>";
        html += "Cheers,<br>";
        html += "<a href='http://twitter.com/braitsch'>braitsch</a><br><br>";
        html += "</body></html>";
    return  [{data:html, alternative:true}];
}