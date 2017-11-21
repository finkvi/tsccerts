require("console-stamp")(console, {
    pattern:"dd.mm.yyyy HH:MM:ss.l",
    metadata:'[' + process.pid + ']',
});

const config = require('./config.json');

var express = require('express');
var server = express();
var nano = require('nano')(config.database.link);
var tsccerts = nano.db.use(config.database.name);

//Отдаём статику, но это мне не нравится, лучше потом пусть её nginx отдаст
//server.use(express.static(path.resolve(__dirname, 'client')));

//Функция получения списка участников
function getListOfUsers(callback) {
    console.info('Get list of users');
    tsccerts.view('users', 'users',
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

function newUser(email, name, date, message, callback){
    
    console.info("Create New User");
    tsccerts.insert(
        {_id: email,
         name: name,
         date: date,
         message:message
        }, function(err, body) {
            if (!err) {
                console.info(body);
                return callback(err, body);
            } 
            else {
                console.error("Error insert New User: " + err);
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

//Роутер на функцию регистрации участника
server.get('/new', function (req, res) {
    var d = new Date;
    newUser("Test7@Test.ru", "From Script", "I Want",
        function(err, body){
        if (!err) {
            res.send(body);
        }
        else
            res.send('Ошибка регистрации пользователя');
    });
});

//Роутер на функцию регистрации участника
server.get('/voice', function (req, res) {
    let d = new Date;
    let from = req.query.from;
    let to = req.query.to;
    
    tsccerts.insert(
    {_id: from + '->' + to,
     type: "voice",
     from: from,
     to: to,
     date: d.toString()
    }, function(err, body) {
        if (!err) {
            console.info("New Voice " + from + '->' + to + " added to DataBase");
        } 
        else {
            console.error("Error insert New Voice: " + err);
        }
    });
});



//Роутер на проверку почты
server.get('/mail', function (req, res) {
    var m = require('./samp.json');
    
    if (!isLegalMail (m)) {
        res.send('Not valid email');
        return false;
    }
    else {
        var s = {
            "email" : m.from[0].address,
            "date" : m.receivedDate,
            "name" : m.from[0].name,
            "message" : m.html
        };
        res.send(s);
    }
});

function isLegalMail (mail, callback) {
  //Получаем заголовки письма
  var rec = mail.headers.received;
  
  //Проверяем наличие в заголовке домена tsconsulting.ru
  var regexp = /tsconsulting.ru/i;
  
  var f = false;
  for (var h of rec) {
    if (h.search(regexp) > 0) {
        f = true;
        break;
    }
  }
  if (!f) return false;
  
  //Проверяем отправилтеля
  if (mail.address.search(regexp) > 0) return true;
  
  return false;
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    //var addr = server.address();
    console.info("Backend Server started at ", (process.env.IP || "0.0.0.0") + ":" + (process.env.PORT || 3000));
});
