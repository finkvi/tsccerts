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

reg
  .on('mail', function (mail){
    console.info('Get mail from ' + mail.address);
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
    
    console.info('Unreg. Get mail from ' + mail.address);
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
         name: name,
         date: date
        }, function(err, body) {
            if (!err) {
                //console.info(body);
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