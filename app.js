
/**
 * Module dependencies.
 */

var express = require('express'),
    routes  = require('./routes'),
    http    = require('http'),
    path    = require('path'),
    nchat   = require('./nchat'),

    app     = express();

app.configure(function(){

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var usernames = {},
    msgs_id   = 0,

    server    = http.createServer( app ),
    io        = require( 'socket.io' ).listen( server );
    
server.listen( app.get( 'port' ) );

io.enable('browser client minification');

io.sockets.on( 'connection', function(socket) {

    socket.on( 'registration', function(data) {

        if (!data || !data.username) {
            socket.emit( 'registration-fail', { text: "No username provided." } );
        }
        else if (usernames[data.username]) {
            socket.get('username', function (err, username) {
                
                if (err || username !== data.username)
                    socket.emit( 'registration-fail', { text: "Bad username." } );
                else
                    socket.emit( 'registration-ok', { username: username } );
            });
        }
        else {
            socket.set('username', data.username, function() {

                if (!nchat.validUsername( data.username )) {
                    socket.emit( 'registration-fail', { text: "Bad username." } );
                    return;
                }


                usernames[data.username] = 1;
                socket.emit( 'registration-ok', { username: data.username } );
            });
        }

    });

    socket.on( 'msg', function(data) {

        if (!data || !data.text) {
            socket.emit( 'msg-fail', { text: "No message provided" });
        }
        else {
            socket.get('username', function(err, username) {

                if (err)
                    socket.emit( 'msg-fail', { text: "No registered username." } );

                else {

                    var html = nchat.makeHTML(username, data.text, ++msgs_id);
                    
                    socket.emit( 'msg-ok', { html: html, id: msgs_id } );
                    socket.broadcast.emit( 'new-msg', { html: html, id: msgs_id } );

                }

            });
        }

    });

    socket.on( 'disconnect', function() {
        socket.get('username', function(err, username) {
            if (!err) {
                delete usernames[username];
            }
        });
    })

});
