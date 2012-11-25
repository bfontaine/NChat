
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

var usernames = {}, u,
    msgs_id   = 0,

    connected_users = {},

    server    = http.createServer( app ),
    io        = require( 'socket.io' ).listen( server );
    
server.listen( app.get( 'port' ) );

io.enable('browser client minification');

io.sockets.on( 'connection', function(socket) {

    var known_user  = false,
        remote_addr = socket.handshake.address.address;

    // looking for an existent username
    for (u in usernames) {
        if (!usernames.hasOwnProperty(u))
            continue;

        if (usernames[u] === remote_addr) {
            connected_users[u] = true;
            socket.emit( 'username-lookup', { username: u });
            known_user = true;
            break;
        }
    }

    if (!known_user) {
        socket.emit( 'username-lookup', { username: false });
    }

    socket.on( 'registration', function(data) {

        socket.volatile.emit( 'progression', { text: 'Checking username…' });

        if (!data || !data.username || !nchat.validUsername( data.username )) {
            socket.emit( 'registration-fail', { text: "No username provided." } );
            return;
        }

        var u = data.username;

        socket.volatile.emit( 'progression', { text: 'Username OK' });

        if (usernames[u]) {

            socket.volatile.emit( 'progression', { text: 'Username found.' });

            if (usernames[u] === remote_addr) {
                socket.emit( 'registration-ok',   { username: u } );
            } else {
                socket.emit( 'registration-fail', { text: "Bad username." } );
            }
        }
        else {

            socket.volatile.emit( 'progression', { text: 'Registering username' });

            usernames[u] = remote_addr;
            socket.set('username', u, function() {
                connected_users[u] = true;
                socket.emit( 'registration-ok', { username: u } );
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

                    var msg = data.text, cmd_result;

                    if (msg.charAt(0) === '/' && cmd_result = nchat.processCmd(msg)) {

                        socket.emit( 'cmd-ok', { result: cmd_result });

                        return;
                    }

                    var html = nchat.makeHTML(username, msg, ++msgs_id);
                    
                    socket.emit( 'msg-ok', { html: html, id: msgs_id } );
                    socket.broadcast.emit( 'new-msg', { html: html, id: msgs_id } );

                }

            });
        }

    });

    socket.on( 'disconnect', function() {
        socket.get('username', function(err, username) {
            if (!err) {
                delete connected_users[username];
            }
        });
    })

});
