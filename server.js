require("console-stamp")(console, {
    pattern:"dd.mm.yyyy HH:MM:ss.l",
    metadata:'[' + process.pid + ']',
});

const config = require('./config.json');

var express = require('express');
var server = express();
var path = require('path');
var nano = require('nano')(config.database.link);
var tsccert= nano.db.use(config.database.name);

//Отдаём статику, но это мне не нравится, лучше потом пусть её nginx отдаст
server.use(express.static(path.resolve(__dirname, 'client')));

//Функция получения списка участников
function getListOfUsers(callback) {
    console.info('Get list of users');
    tsccert.view('reg', 'reg',
        {include_docs: true}, 
        function(err, body) {
            if (!err) {
                console.info('Users listed');
                return callback(err, body);
            }
            else {
                console.error('Database error: ' + err);
                return callback(err, body);
            }
        });
}

//Роутер на функцию получения списка участников
server.get('/regdata', function (req, res) {
    getListOfUsers(function(err, body){
        if (!err) {
            //Обработка ответа для отобажения
            var data = [];
            body.rows.forEach(function(doc) {
              data.push(doc.doc);
              //console.log(doc);
            });
            res.send(data);
        }
        else
            res.send(err);
    });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    //var addr = server.address();
    console.info("Backend Server started at ", (process.env.IP || "0.0.0.0") + ":" + (process.env.PORT || 3000));
});
