
var jade    = require('jade'),

    msg_tpl = jade.compile('<li class="msg" id="#{id}" style="color:#{color}">'
                           + '<time>[#{hh}:#{mm}:#{ss}]&nbsp;'
                           + '<span class="user">'
                           + '#{username}</span>&nbsp;:&nbsp;#{msg}</li>'),

    re_noalphanumerics = /[^a-z0-9]/gi,

    re_spaces = /\s/g,

    re_username = /^[a-z][-.@\w]+$/i,

    usernames_colors = {};


function makeHTML( username, msg, id , color) {

    var now = new Date(),
        hh  = now.getHours(),
        mm  = now.getMinutes(),
        ss  = now.getSeconds();

    hh = (hh < 10 ? '0' : '') + hh;
    mm = (mm < 10 ? '0' : '') + mm;
    ss = (ss < 10 ? '0' : '') + ss;
        
    return msg_tpl({

        hh: hh,
        mm: mm,
        ss: ss,

        username: username,
        msg: msg,
        id: 'm_' + id,

        color: color ? color : colorUsername( username )

    });

}

function colorUsername( username ) {
    var color;

    if (color = usernames_colors[username]) {
        return color;
    }

    var n = parseInt(username.replace(re_noalphanumerics, ''), 36);

    var n3 = n/3,

        r = Math.min(140, Math.floor(Math.random()*n3) % 256).toString(16),
        g = Math.min(140, Math.floor(Math.random()*n3) % 256).toString(16),
        b = Math.min(140, Math.floor(Math.random()*n3) % 256).toString(16);

    if (r.length === 1) r = '0' + r;
    if (g.length === 1) g = '0' + g;
    if (b.length === 1) b = '0' + b;

    return usernames_colors[username] =
            '#' + r.toString(16) + g.toString(16) + b.toString(16);

}

function validUsername( username ) {
    var u = username.trim();

    return u.length > 2 && u.length < 15 && re_username.test(username);
}

function executeCmd( cmd, args, infos ) {

    switch(cmd) {

        // all commands are defined here

        case '/me':
            return 'Username: ' + infos.username
                    + ', IP: ' + infos.remote_addr + '.';

        case '/list':
            return 'Connected users: '
                        + Object.keys(infos.users).join(', ') + '.';

    }


    return null;
}

// commands; return HTML
function processCmd( cmd, infos ) {

    var words = cmd.split(re_spaces),

        result = executeCmd(words[0], words.slice(1), infos);


    return result ? makeHTML( '<command>', result, '_', '#888') : false;
}

exports.makeHTML      = makeHTML;
exports.validUsername = validUsername;
exports.processCmd    = processCmd;
