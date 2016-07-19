var express = require("express");
var mongo = require("mongodb").MongoClient;
var api = require("./app/api.js");
var index = require('./app/index.js');

var app = express();
var url = process.env.MONGOLAB_URI;      

mongo.connect(url, function(err, db) {
    if(err) {
        throw err;
    }
    
    app.set('env', 'production');
    app.set('views', __dirname);
    app.set('view engine', 'pug');

    api(app, db);
    index(app);
    
    app.listen(process.env.PORT || 8080, function () {
        console.log('App is listening');
    });

    
});