require("console-stamp")(console, {
    pattern:"dd.mm.yyyy HH:MM:ss.l",
    metadata:'[' + process.pid + ']',
});

const config = require('./config.json');

const notifier = require('mail-notifier');

const nano = require('nano')(config.database.link);
const tsccerts = nano.db.use(config.database.name);

const regimap = {
  user: config.mailreg.mail,
  password: config.mailreg.pass,
  host: "imap.yandex.ru",
  port: 993, // imap port
  tls: true,// use secure connection
  tlsOptions: { rejectUnauthorized: false }
};

const unregimap = {
  user: config.mailunreg.mail,
  password: config.mailunreg.pass,
  host: "imap.yandex.ru",
  port: 993, // imap port
  tls: true,// use secure connection
  tlsOptions: { rejectUnauthorized: false }
};

const voiceimap = {
  user: config.mailvoice.mail,
  password: config.mailvoice.pass,
  host: "imap.yandex.ru",
  port: 993, // imap port
  tls: true,// use secure connection
  tlsOptions: { rejectUnauthorized: false }
};

const reg = notifier(regimap);
const unreg = notifier(unregimap);
const voice = notifier(voiceimap);

reg
  .on('mail', function (mail){
    console.info('Get mail from ' + mail.from[0].name);
    
    if (false) {
      //First Load
      var sleep = require('sleep');
      
      console.log('Start load');
      for (var att of mail.attachments) {
          var s = att.content.toString();
          var regFrom = /\nFrom:(.+)/;
          var name = s.match(regFrom)[1].match(/(.+)</)[1];
          var email = s.match(regFrom)[1].match(/\<(.+)>/)[1];
          var date = new Date (s.match(/Date:(.+)/)[1]);
            
          newUser(email, name, date.toString(), 
            function(err, body){
              if (!err) {
                  //console.info('User ' + email + ' added to database');
                   sleep.sleep(10);
              }
              else
                  console.error('Error user registration');
                   sleep.sleep(10);
            });
          
      }
    }
    
    if (!isLegalMail (mail)) {
        console.info('Not valid email. Ignore mail');
        return false;
    }
    else {
        newUser(mail.from[0].address, mail.from[0].name, mail.receivedDate.toString(), 
        function(err, body){
          if (!err) {
              console.info('User ' + mail.from[0].address + ' added to database');
          }
          else
              console.error('Error user registration');
        });
    }
  })
  .start();

unreg
  .on('mail', function (mail){
    
    console.info('Unreg. Get mail from ' + mail.from[0].address);
    if (!isLegalMail (mail)) {
        console.info('Not valid email. Ignore mail');
        return false;
    }
    else {
        dropUser(mail.from[0].address, 
        function(err, body){
          if (!err) {
              console.info('User ' + mail.from[0].address + ' removed from database');
          }
          else
              console.error('Error user deactivation');
        });
    }
  })
  .start();

voice
  .on('mail', function (mail){
    
    console.info('Voice. Get voice from ' + mail.from[0].address);
    if (!isLegalMail (mail)) {
        console.info('Not valid email. Ignore mail');
        return false;
    }
    else {
      let to =  mail.subject;
      let from =  mail.from[0].address;
      
      console.info("Get voice from user: " + from);
      console.info("User voited for: " + to);
      
      //Проверяем есть ли тот, за кого голосуют
      tsccerts.get(to, function (err, doc) {
        if (!err) {
          if (doc._rev) {
            //Проверяем есть ли тот, кто голосует
            tsccerts.get(from, function (err, doc) {
              if (err) {
                console.error("Error get User: " + err);
                return false;
              }
              
              if (doc._rev) {
                //Create new vote
                console.info("Create New vote");
                tsccerts.insert(
                    {_id: from + '->' + to,
                     type: "voice",
                     from: from,
                     to: to,
                     date: mail.receivedDate.toString()
                    }, function(err, body) {
                        if (!err) {
                            console.info("New Voice " + from + '->' + to + " added to DataBase");
                        } 
                        else {
                            console.error("Error insert New Voice: " + err);
                        }
                });
              } else {
                console.info("Cannot find user. Nothing to do");
              }
            });
          }
          else {
            console.info("Cannot find user. Nothing to do");
          }
        } else {
          console.error("Error get User: " + err);
        }
        
      });
    }
  })
  .start();
  
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
  if (mail.from[0].address.search(regexp) > 0) return true;
  
  return false;
}

function newUser(email, name, date, callback){
    
    console.info("Create New User");
    tsccerts.insert(
        {_id: email,
         type: "user",
         name: name,
         date: date,
         rate: 0
        }, function(err, body) {
            if (!err) {
                console.info("User " + email + " added to DataBase");
                return callback(err, body);
            } 
            else {
                console.error("Error insert New User: " + err);
                return callback(err, body);
            }
    });
}

function dropUser(email, callback){
    
    console.info("Drop User: " + email);
    tsccerts.get(email, function (err, doc) {
      if (!err) {
        if (doc._rev)
          tsccerts.destroy(
            email,
            doc._rev,
            function(err, body) {
                if (!err) {
                    //console.info(body);
                    return callback(err, body);
                } 
                else {
                    console.error("Error destroy User: " + err);
                    return callback(err, body);
                }
          });
        else {
          console.info("Cannot find User. Nothing to do");
        }
      } else {
        console.error("Error get User: " + err);
        return callback(err, doc);
      }
      
    });
    

}