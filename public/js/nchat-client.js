/*! NChat client
 *  github.com/bfontaine/NChat
 *  MIT Licensed
 */
(function(doc, undef) {

    var socket = io.connect( document.location.origin ),

        msgs   = doc.getElementById('chat-msgs'),
        newmsg = doc.getElementById('new-msg'),

        title  = document.title,

        undef_s = ''+undef,

        msgs_count = 0;

    function progression(text) {

        document.title = !text ? title : title + ' | ' + text;

    }

    function send_msg() {
        var msg = newmsg.innerHTML.trim();

        if (!msg) { return; }

        toggleNewMsg(false);

        socket.emit( 'msg', {
            text: msg
        });
        newmsg.innerHTML = '';
    }

    function toggleNewMsg(editable) {
        newmsg.setAttribute('contenteditable', editable);
        if (editable)
            newmsg.focus();
    }

    newmsg.onkeypress = newmsg.onkeydown = function(e) {
        if ((e.which || e.keyCode) === 13) {
           send_msg();
        }
    }
    newmsg.onfocus = function() { Tinycon.setBubble(0); };

    toggleNewMsg(false);

    socket.on( 'registration-ok', function(data) {
        progression();
        toggleNewMsg(true);
    });

    var receive_msg = function(data, is_me) {
        msgs.innerHTML += data.html;
        if (is_me)
            doc.querySelector('#m_'+data.id+' .user').className += ' me';

        msgs.scrollTop = msgs.scrollHeight;
        Tinycon.setBubble(++msgs_count);
    };

    socket.on( 'msg-ok', function(data) {
        msgs_count = -1;
        receive_msg(data, true);
        toggleNewMsg(true)
    });

    socket.on( 'cmd-ok', function(data) {
        receive_msg(data);
        toggleNewMsg(true);
    });

    socket.on( 'new-msg', receive_msg);

    socket.on( 'registration-fail', function(data) {
        socket.emit( 'registration', {
            username: prompt(data.text+" Choose an username")
        });
    })
    socket.on( 'msg-fail', function(data) {
        if (/no registered username/i.test(data)) {
            socket.emit( 'registration', {
                username: prompt(data.text+" Choose an username")
            });
        }
    })

    socket.on( 'username-lookup', function(data) {
        if (data.username) {
            progression();
            toggleNewMsg(true);
        newmsg.focus();
        }
        else {

            socket.emit( 'registration', {
                username: prompt("Choose an username")
            });

        }
    });

    socket.on( 'registration-ok', function(){

        progression();
        toggleNewMsg(true);
        newmsg.focus();

    });

    socket.on( 'progression', function(data) {
        progression(data.text);
    });

    // page visibility: [ property, event prefix ]
    var visibility = (typeof doc.hidden !== undef_s)
                    ? ['hidden', '']
                    : typeof doc.mozHidden !== undef_s
                        ? ['mozHidden', 'moz']
                        : typeof doc.msHidden !== undef_s
                            ? ['msHidden', 'ms']
                            : typeof doc.webkitHidden !== undef_s
                                ? ['webkitHidden', 'webkit']
                                : ['', ''];

    document.addEventListener( visibility[1]+'visibilitychange', function() {

        msgs_count = 0;

        if (!document[visibility[0]]) {
            Tinycon.reset();
        }

    }, false);

})(document);
