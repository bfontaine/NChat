(function(doc) {

    var socket = io.connect( document.location.origin ),

        msgs   = doc.getElementById('chat-msgs'),
        newmsg = doc.getElementById('new-msg'),

        username = prompt("Username");

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

    socket.on( 'registration-ok', function(data) {
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
        username = prompt(data.text+" Choose an username");
        socket.emit( 'registration', {
            username: username
        });
    })
    socket.on( 'msg-fail', function(data) {
        console.log(data);
    })

    socket.emit( 'registration', {
        username: username
    });

    newmsg.focus();

})(document);
