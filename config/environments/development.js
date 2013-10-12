/**
 * @file development.js
 * @brief 
 * @author Rye Yao
 * @version 0.1
 * @date 2013-09-11
 */

var express = require('express');
module.exports = function(app) {

    console.log('Initializing development environment...');
    app.mongodb = {
        host  : "localhost",
        database: "dev_vpipes",
        dbstring: "mongodb://localhost/dev_vpipes"
    };

    app.coocieSecret = 'visual pipes';

    app.use(express.errorHandler());
}
