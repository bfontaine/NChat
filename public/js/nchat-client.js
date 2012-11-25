(function(doc) {

    var socket = io.connect( document.location.origin ),

        msgs   = doc.getElementById('chat-msgs'),
        newmsg = doc.getElementById('new-msg'),

        title  = document.title;

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
    };

    socket.on( 'msg-ok', function(data) {
        receive_msg(data, true);
        toggleNewMsg(true)
    });
    socket.on( 'new-msg', receive_msg);

    socket.on( 'registration-fail', function(data) {
        socket.emit( 'registration', {
            username: prompt(data.text+" Choose an username")
        });
    })
    socket.on( 'msg-fail', function(data) {
        console.log(data);
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

})(document);
