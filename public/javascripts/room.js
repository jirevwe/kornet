function Room (name, creator, id, priv, password, isDM) {
    this.name = name;
    this.creator = creator;
    this.id = id;
    this.members = [];
    this.isDM = isDM;

    this.isPrivate = priv;
    this.password = password;

    this.addMember = function(memberID) {
        this.members.push(memberID);
    };

    this.removeMember = function(memberID) {
        var index = this.members.indexOf(memberID);
        if (index > -1) {
            this.members.splice(index, 1);
        }
    };

    this.isMember = function(memberID) {
        for(m in this.members) {
            if (m == memberID) {
                return true;
            }
        }
        return false;
    };
}

function Person (name, id, roomOwn, roomIn) {
    this.name = name;
    this.id = id;
    this.owns = roomOwn;
    this.inRoom = roomIn;
}

var user;
var user_db;
var rooms = [];
var roomChatCount = {};
var activeRoom = null;
var isPrivate;
var password;
var curRooms = {};
var users = {};
let uploadfiles = [];



var toMem;

function zeroPad(num, size) {
    var s = num + "";
    while (s.length < size)
        s = "0" + s;
    return s;
}

// Format the time specified in ms from 1970 into local HH:MM:SS
function timeFormat(msTime) {
    var d = new Date(msTime);
    return zeroPad(d.getHours(), 2) + ":" +
        zeroPad(d.getMinutes(), 2) + ":" +
        zeroPad(d.getSeconds(), 2) + " ";
}

var socketio = io.connect();
socketio.on("new_user_to_client", function(data) {
    user = data;
    $.ajax({
        method: "GET",
        url: "http://localhost:3000/chat/room-user",
        success: function(data) {
            console.log(data);
            user_db = data;
        },
        error: function(err) {
            console.log(err);
        }
    });
});

socketio.on("user_exists_to_client", function(data) {
    //user = data;
    alert(user.name+" already exists");
    location.reload();

});

socketio.on("room_list", function(data) {
    curRooms = data;
    var rooms = [];
    for (r in curRooms) {
        console.log(curRooms[r].id);
        rooms.push(curRooms[r].id);
    }
    $.ajaxSetup({
        headers: {"X-CSRF-Token": "{{csrfToken}}" }
    });

    //console.log(rooms);
    $.ajax({
        method: "POST",
        url: "http://localhost:3000/chat/room-creator",
        data: {rooms:rooms},
        success: function(data) {
            for(i = 0; i < data.all_results.length; i++){
                room = data.all_results[i];
                creator = room.creator;
                if(room.isDM == 'true'){
                    console.log("dm");
                    $('#numMembers').hide();
                    if(user_db._id == creator._id){
                        //$('#chatName').html(fromMem.name);
                        $("#activeDms").append('<li id="' + room.room_id + '" class="active">' + room.name + '</li>');
                        //activeRoom.name = fromMem.name;
                    }
                    if(user_db._id != creator._id){
                        //$('#chatName').html(toMem.name);
                        $("#activeDms").append('<li id="' + room.room_id + '" class="active">' + creator.name + '</li>');
                        //activeRoom.name = toMem.name;
                    }
                }
                else{
                    console.log("nodm");
                    if(user_db._id == creator._id){
                        $("#activeRooms").append('<li id="' + room.room_id + '" class="active">' + room.name + '</li>');
                    }else if(user_db.user_domain == creator.user_domain){
                        $("#activeRooms").append('<li id="' + room.room_id + '" class="active">' + room.name + '</li>');
                    }
                    else if($.inArray(user_db._id, room.members) != -1){
                        $("#activeRooms").append('<li id="' + room.room_id + '" class="active">' + room.name + '</li>');
                    }
                    else if(creator.user_type == 'Government' && room.is_private == false){
                        $("#activeRooms").append('<li id="' + room.room_id + '" class="active">' + room.name + '</li>');
                    }
                }
            }
        },
        error: function(err) {
            console.log(err);
        }
    });
});

socketio.on("create_room_to_client", function(data) {
    var room = data['room'];
    var toMem = data['toMem'];
    var fromMem = data['fromMem'];
    var creator = [];
    console.log("room is dm: "+room.isDM);
    roomChatCount[room.id] = 0;

    console.log(room);

    $.ajaxSetup({
        headers: {"X-CSRF-Token": "{{csrfToken}}" }
    });

    $.ajax({
        method: "POST",
        url: "http://localhost:3000/chat/add-room",
        data: room,
        success: function(data) {
            //console.log(data);
            $.ajax({
                method: "GET",
                url: "http://localhost:3000/chat/room-creator/"+room.id,
                success: function(data) {
                    console.log(data);
                    console.log(user_db);
                    creator = data;

                    console.log(room);

                    if(room.isDM){
                        $('#numMembers').hide();
                        if(user.name == toMem.name){
                            //$('#chatName').html(fromMem.name);
                            $("#activeDms").append('<li id="' + room.id + '"class="active">' + fromMem.name + '</li>');
                            activeRoom.name = fromMem.name;
                        }
                        if(user.name == fromMem.name){
                            //$('#chatName').html(toMem.name);
                            $("#activeDms").append('<li id="' + room.id + '"class="active">' + toMem.name + '</li>');
                            activeRoom.name = toMem.name;
                        }
                    }
                    else{
                        if(user_db._id == creator._id){
                            $("#activeRooms").append('<li id="' + room.id + '"class="active">' + room.name + '</li>');
                        }else if(user_db.user_domain == creator.user_domain){
                            $("#activeRooms").append('<li id="' + room.id + '"class="active">' + room.name + '</li>');
                        }else if(creator.user_type == 'Government' && room.is_private == false){
                            $("#activeRooms").append('<li id="' + room.id + '"class="active">' + room.name + '</li>');
                        }
                    }

                    curRooms[room.id] = room;

                    $('input[type="radio"]').prop('checked', false);
                    $('#reveal-if-active').hide();
                    $('#roomPass').val("");
                },
                error: function(err) {
                    console.log(err);
                }
            });
        },
        error: function(err) {
            console.log(err);
        }
    });
});


socketio.on("enter_room_to_client", function(data) {
    var room = data['room'];
    console.log("sender is "+data['user'].name);
    console.log(room);


    $.ajaxSetup({
        headers: {"X-CSRF-Token": "{{csrfToken}}" }
    });

    $.ajax({
        method: "POST",
        url: "http://localhost:3000/chat/update-room",
        data: room,
        success: function(data) {
            console.log(data);
        },
        error: function(err) {
            console.log(err);
        }
    });

    if(data['room'].isDM == 'true'){
        $('#numMembers').hide();
    }
    else{
        $('#numMembers').show();
    }
    if(user.name == data['user'].name) {
        roomChatCount[data['room'].id] = 0;
        var sidebar = $("#"+data['room'].id+"");
        sidebar.find("span").remove();

        $('#chatroom-wrapper').show();
        $('#dm-wrapper').hide();
        $('#header').show();
        //$('#chatlog').empty();
        $('#footer').show();
    }

    //document.getElementById("chatlog").appendChild(document.createTextNode(data.name  + " has joined!"));
    //document.getElementById("chatlog").appendChild(document.createElement("hr"));
    //document.getElementById('bottomspan').scrollIntoView();
});

socketio.on("list_mems_to_client", function(data) {
    room = data;

    $.ajaxSetup({
        cache:false
    });
    $.ajax({
        url: "http://localhost:3000/chat/room-members/"+room.id,
        type: "GET"
    }).success(function (data) {
        users = data;
        for (m in data) {
            var member = data[m];
            if(member.name == user.name) {
                $("#memsList").append('<li id="' + member._id + '" class="active"> You </li>');
            }else{
                $("#memsList").append('<li id="' + member._id + '" class="active">' + member.name + '</li>');
            }
            $('#memHeader').empty();
            $('#actionList').empty();
        }
    });
});

socketio.on("invite_mems_to_client", function(data) {
    //room = data;
    $.ajaxSetup({
        cache:false
    });
    $.ajax({
        url: "http://localhost:3000/contacts",
        type: "GET"
    }).success(function (data) {
        var contacts = data.contacts;
        if(contacts.length > 0){
            contacts.forEach(function (contact) {
                $("#members_contacts").append('<option value="' + contact.email + '">' + contact.name + '</option>');
            });
        }else{
            $("#members_contacts").append(' No contacts found ');
            $('#invite_members_button').addClass("disabled");
        }

    });
});

socketio.on("message_to_client", function(data) {
    console.log("active room: "+activeRoom.id);
    console.log("message room: "+data['room'].id);
    if(activeRoom.id != data['room'].id){
        roomChatCount[data['room'].id]++;
        console.log("roomchatcount "+roomChatCount);
        var message = roomChatCount[data['room'].id] > 0 ? '<span class="badge pull-right">'+roomChatCount[data['room'].id]+'</span>' : '';
        var sidebar = $("#"+data['room'].id+"");
        sidebar.find("span").remove();
        sidebar.append(message);
        //$("#sidebar-wrapper #"+data['room'].id+"").html( + message);
    }
    else{
        if(data['user'] == user.name) {
            $( "#chatlog" ).append("<div class='row'> " +
                "<div style='padding: 2%;'  class='col-md-6 pull-left bg-success'><pre style='background-color:transparent; border:0;'><strong>"
                +  data['user'] + "</strong>: <br>" + data['message'] + "<div class='pull-right text-mute'>"+timeFormat(new Date().getTime())+"</div>" +
                "</pre></div> " +
                "</div>");

            document.getElementById("chatlog").appendChild(document.createElement("br"));
            document.getElementById("chatlog").append(document.createElement("hr"));
            //document.getElementById("chatlog").append("<div class='half-col pull-left bg-success'>" +  data['user'] + ": " + data['message'] + "</div>");
        }else{
            $( "#chatlog" ).append("<div class='row'> " +
                "<div style='padding: 2%;' class='col-md-6 pull-right bg-warning'><pre style='background-color:transparent; border:0;'><strong>"
                +  data['user'] + "</strong>: <br>" + data['message'] + "<div class='pull-right text-mute'>"+timeFormat(new Date().getTime())+"</div>" +
                "</pre></div> " +
                "</div>");

            document.getElementById("chatlog").appendChild(document.createElement("br"));
            document.getElementById("chatlog").appendChild(document.createElement("hr"));
            // document.getElementById("chatlog").appendChild(document.createTextNode("<div class='half-col pull-right bg-warning'>" + data['user'] + ": " + data['message']+ "</div>"));
        }


        var div = document.getElementById('chatlog');
        //var elem = document.getElementById('data');
        div.scrollTop = div.scrollHeight;
        document.getElementById('bottomspan').scrollIntoView();
    }

});

socketio.on("send_pic_to_client", function(data) {
    if(activeRoom.id != data['room'].id){
        roomChatCount[data['room'].id]++;
        console.log("roomchatcount "+roomChatCount);
        var message = roomChatCount[data['room'].id] > 0 ? '<span class="badge pull-right">'+roomChatCount[data['room'].id]+'</span>' : '';
        var sidebar = $("#"+data['room'].id+"");
        sidebar.find("span").remove();
        sidebar.append(message);
        //$("#sidebar-wrapper #"+data['room'].id+"").html( + message);
    }
    else{
        if(data['user'] == user.name) {
            $( "#chatlog" ).append("<div class='row'> " +
                "<div style='padding: 2%;'  class='col-md-6 pull-left bg-success'>"+data['message']+"</div> " +
                "</div>");
            document.getElementById("chatlog").appendChild(document.createElement("br"));
            document.getElementById("chatlog").append(document.createElement("hr"));
        }
        else{
            $( "#chatlog" ).append("<div class='row'> " +
                "<div style='padding: 2%;'  class='col-md-6 pull-right bg-warning'>"+data['message']+"</div> " +
                "</div>");
            document.getElementById("chatlog").appendChild(document.createElement("br"));
            document.getElementById("chatlog").append(document.createElement("hr"));
        }
    }

    var div = document.getElementById('chatlog');
    //var elem = document.getElementById('data');
    div.scrollTop = div.scrollHeight;
    document.getElementById('bottomspan').scrollIntoView();
});

socketio.on("kick_mem_to_client", function(data) {
    document.getElementById("chatlog").appendChild(document.createTextNode(data));
    document.getElementById("chatlog").appendChild(document.createElement("hr"));
});

socketio.on("kicked_mem_to_client", function(data) {
    $('#header').hide();
    $('#chatlog').empty();
    $('#footer').hide();

    document.getElementById("chatlog").appendChild(document.createTextNode(data));
    document.getElementById("chatlog").appendChild(document.createElement("hr"));
});

socketio.on("ban_mem_to_client", function(data) {
    document.getElementById("chatlog").appendChild(document.createTextNode(data));
    document.getElementById("chatlog").appendChild(document.createElement("hr"));
});

socketio.on("banned_mem_to_client", function(data) {
    var id = '#' + data['room'];
    $(id).remove();
    console.log(id);
    $('#header').hide();
    $('#chatlog').empty();
    $('#footer').hide();

    document.getElementById("chatlog").appendChild(document.createTextNode(data['message']));
    document.getElementById("chatlog").appendChild(document.createElement("hr"));

});

function sendMessage(){
    var msg = $("#message_input").val();
    $("#message_input").val("");
    socketio.emit("message_to_server", {user:user, message:msg});
}

function enterRoom(id){
    activeRoom = curRooms[id];

    console.log("active rooms");
    console.log(activeRoom.isPrivate);

    if (activeRoom.isPrivate == "true" ){
        $('#privateChatModal').modal('show');

        $("#privateChatSubmit").click(function(){
            var isPass = $('#enterRoomPass').val();

            $.ajax({
                method: "POST",
                url: "http://localhost:3000/chat/password/",
                data: {password:activeRoom.password},
                success: function (data) {
                    console.log("data");
                    console.log(data.password);
                    console.log(activeRoom.password);
                    if (data.password == isPass) {
                        if (user.inRoom != null && user.inRoom != id) {
                            $('#chatlog').empty();
                            socketio.emit("leave_room_to_server", {user: user, id: id});
                        }
                        user.inRoom = activeRoom.id;
                        socketio.emit("enter_room_to_server", user);
                        $('#chatroom-wrapper').show();
                        $("#chatName").html("<h4>" + activeRoom.name + "</h4>");
                        $('#privateChatModal').modal('hide');
                        $('#enterRoomPass').val("");
                    } else {
                        alert("Invalid Password!");
                    }
                }
            });
        });
    } else {
        if (user.inRoom != null && user.inRoom != id) {
            $('#chatlog').empty();
            socketio.emit("leave_room_to_server", {user: user, id: id});
        }

        user.inRoom = activeRoom.id;
        socketio.emit("enter_room_to_server", user);
        $('#dm-wrapper').hide();
        $('#chatroom-wrapper').show();
        $("#chatName").html("<h4>" + activeRoom.name + "</h4>");

    }

}

socketio.on("leave_room_to_client", function(data) {
    var room = data['room'];
    if(room.isDM == false && room.id == activeRoom.id) {
        document.getElementById("chatlog").appendChild(document.createTextNode(data['userdata']));
        document.getElementById("chatlog").appendChild(document.createElement("hr"));
    }
});

socketio.on("history", function(data) {
    chathistory = data['chathistory'];
    userdata = data['userdata'];
    console.log("history length "+chathistory.length);
    if (userdata.name == user.name) {

        if (chathistory.length != 0) {
            $("#chatlog").empty();
            //$("#chatlog").append("<li><strong><span class='text-warning'>Last 10 messages:</li>");
            $.each(chathistory, function (chathistory, msg) {
                var str = msg;
                newstr = str.replace("<pre style='background-color:transparent; border:0;'>", "");
                str = newstr.substr(0, msg.indexOf(':'));
                console.log(str);
                console.log(newstr);
                //str = str.split(":").pop();

                //console.log("str is "+str);
                //console.log("user is "+user.name);
                if (str.indexOf("<strong>" + user.name + "</strong>") >= 0) {
                    $("#chatlog").append("<div class='row'> " +
                        "<div style='padding: 2%;'  class='col-md-6 pull-left bg-success'>" + msg +
                        "</div> " +
                        "</div>");

                    document.getElementById("chatlog").appendChild(document.createElement("br"));
                    document.getElementById("chatlog").append(document.createElement("hr"));
                    //document.getElementById("chatlog").append("<div class='half-col pull-left bg-success'>" +  data['user'] + ": " + data['message'] + "</div>");
                } else {
                    $("#chatlog").append("<div class='row'> " +
                        "<div style='padding: 2%;'  class='col-md-6 pull-right bg-warning'>" + msg +
                        "</div> " +
                        "</div>");

                    document.getElementById("chatlog").appendChild(document.createElement("br"));
                    document.getElementById("chatlog").appendChild(document.createElement("hr"));
                    // document.getElementById("chatlog").appendChild(document.createTextNode("<div class='half-col pull-right bg-warning'>" + data['user'] + ": " + data['message']+ "</div>"));
                }
                //$("#chatlog").append(msg);
            });
        }

    }
    var div = document.getElementById('chatlog');
    //var elem = document.getElementById('data');
    div.scrollTop = div.scrollHeight;
    document.getElementById('bottomspan').scrollIntoView();
});

function directMsg() {
    var id = $("#dmButton").attr("class");
    var result = $.grep(users, function(e){ return e._id == id; });
    toMem =  result[0];
    console.log("tomem");
    console.log(toMem);

    //console.log("toMem is "+toMem.name);
    fromMem = user;
    //console.log("toMem is "+toMem.name);
    var name;
    if(user.name == fromMem.name){
        name = toMem.name;
    }
    if(user.name == toMem.name){
        name = fromMem.name;
    }

    var exist = roomExist(name);
    console.log("exist is: "+exist);
    isPrivate = false;
    password = "";
    if(exist == false){
        console.log(name);
        activeRoom = new Room(name, user.id, null, isPrivate, password, true);

        rooms[rooms.length] = activeRoom;

        socketio.emit("create_room_to_server", {activeRoom: activeRoom, toMem:toMem});

        //$('#dmHeader').append('Direct Message to ' + toMem['name']);

        $('#memModal').modal('hide');
    }
    else{
        //enterRoom(exist.id);
        $('#memModal').modal('hide');
        $('#numMembers').show();
    }

}

function roomExist(roomname){
    var room_name = roomname;
    var roomexists = false;
    $.each(curRooms, function(rooms, room) {
        console.log("DM room: "+room.name);
        console.log("new DM: "+room_name);
        if(room.name == room_name){
            roomexists = room;
            return false;
        }
    });
    return roomexists;
}

function kickMem() {
    $('#memModal').modal('hide');
    var id = $("#kickButton").attr("class")
    toMem = users[id];
    socketio.emit("kick_mem_to_server", {fromMem:user, toMem:toMem});
};

function banMem() {
    $('#memModal').modal('hide');
    var id = $("#banButton").attr("class")
    toMem = users[id];
    socketio.emit("ban_mem_to_server", {fromMem:user, toMem:toMem});
};

$(document).ready(function() {
    // show password box for private chats
    $('input[type="radio"]').click(function() {
        if($(this).attr('id') == 'private') {
            $('#reveal-if-active').show();
            isPrivate = true;
        } else {
            $('#reveal-if-active').hide();
            isPrivate = false;
            password = "";
        }
    });

    // create new room
    $("#newRoomSubmit").click(function(){
        var roomName = $('#roomName').val();

        //reset form
        $('#roomName').val("");

        if (isPrivate) {
            password = $('#roomPass').val();
        }

        $('input[type="radio"]').prop('checked', false);

        var exist = false;
//                $.each(curRooms, function(rooms, room) {
//                    console.log("exsting rooms "+room.name);
//                    console.log("new room "+roomName);
//
//                    if(room.name == roomName) {
//                        exist = true;
//                    }
//                });

        if(exist) {
            alert('Room already exists');
        }else {
            toMem = null;
            activeRoom = new Room(roomName, user.id, null, isPrivate, password, false);

            rooms[rooms.length] = activeRoom;

            socketio.emit("create_room_to_server", {activeRoom:activeRoom, toMem:toMem});
        }
    });


    function getEventTarget(e) {
        e = e || window.event;
        return e.target || e.srcElement;
    }

    var ul = document.getElementById('activeRooms');
    ul.onclick = function(event) {
        var target = getEventTarget(event);
        var id = $(target).attr('id');
        if(id != 'createNewRoom') {
            enterRoom(id);
        }
    };

    var ulDM = document.getElementById('activeDms');
    ulDM.onclick = function(event) {
        var target = getEventTarget(event);
        var id = $(target).attr('id');
        console.log("id is "+id);
        if(id != 'DirectMessages') {
            enterRoom(id);
        }
    };

    var mems = document.getElementById('memsList');
    mems.onclick = function(event) {
        var target = getEventTarget(event);
        var id = $(target).attr('id');
        console.log("user ID "+user.id);
        console.log("ID "+id);
        if (id != user.id) {
            memActions(id);
        }

    };


    function memActions(id) {
        var result = $.grep(users, function(e){ return e._id == id; });
        var mem = result[0];

        console.log("mems");
        console.log(mem);

        $('#memHeader').append("<h4>" + mem.name + "</h4>");
        $('#actionList').append('<button id="dmButton" class="' + id + '"onclick="directMsg()">Direct Message</button>    ');

        if (user.id == activeRoom.creator) {
            $('#actionList').append('<button id="kickButton" class="' + id + '" onclick="kickMem()">Kick Out</button>    ');
            $('#actionList').append('<button id="banButton" class="' + id + '" onclick="banMem()">Ban</button>');
        }
        $('#chatMemsModal').modal('hide');
        $('#memModal').modal('show');
    };

    $("#chatMemsButton").click(function(){
        $("#memsList").empty();
        socketio.emit("list_mems_to_server", activeRoom.id);
    });

    $("#inviteMemsButton").click(function(){
        //$("#memsList").empty();
        $('#invite_members_button').removeClass("disabled");
        socketio.emit("invite_mems_to_server", activeRoom.id);
    });

    $("#uploadSubmit").click(function(){
        socketio.emit("send_pic_to_server", {user:user, files:uploadfiles});
    });

});

// login modal function
$(window).load(function(){
    tempUser = new Person ('{{user.name}}', '{{user._id}}', null, null);
    socketio.emit("new_user_to_server", tempUser);
});

$(document).ready(function() {
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });

    $('#message_input').keyup(function (event) {
        var send_input = $('#message_input');
        var rows = send_input.attr('rows');
        if (event.keyCode == 13 && event.shiftKey) {
            rows++;
            send_input.attr('rows', rows);
            send_input.val(send_input.val());
            console.log(send_input.val());
            var content = send_input.val();
            var caret = getCaret(send_input);
            send_input.val(content.substring(0,caret)+"\n"+content.substring(carent,content.length-1));
            event.stopPropagation();
        }else if(event.keyCode == 13 && !event.shiftKey)
        {
            //console.log(send_input.val());
            if(send_input.val() != ""){
                send_input.attr('rows', 1);
                sendMessage();
            }
        }
    });


    function getCaret(el) {
        if (el.selectionStart) {
            return el.selectionStart;
        } else if (document.selection) {
            el.focus();

            var r = document.selection.createRange();
            if (r == null) {
                return 0;
            }

            var re = el.createTextRange(),
                rc = re.duplicate();
            re.moveToBookmark(r.getBookmark());
            rc.setEndPoint('EndToStart', re);

            return rc.text.length;
        }
        return 0;
    }
});

String.prototype.getExtension = function() {
    var basename = this.split(/[\\/]/).pop(),  // extract file name from full path ...
        // (supports `\\` and `/` separators)
        pos = basename.lastIndexOf(".");       // get last position of `.`

    if (basename === "" || pos < 1)            // if file name is empty or ...
        return "";                             //  `.` not found (-1) or comes first (0)

    return basename.slice(pos + 1);            // extract extension ignoring `.`
};

Array.prototype.indexOf || (Array.prototype.indexOf = function(d, e) {
    var a;
    if (null == this) throw new TypeError('"this" is null or not defined');
    var c = Object(this),
        b = c.length >>> 0;
    if (0 === b) return -1;
    a = +e || 0;
    Infinity === Math.abs(a) && (a = 0);
    if (a >= b) return -1;
    for (a = Math.max(0 <= a ? a : b - Math.abs(a), 0); a < b;) {
        if (a in c && c[a] === d) return a;
        a++
    }
    return -1
});


Dropzone.options.uploadzone = {
    url:'/chat/upload',
    addRemoveLinks: true,
    paramName: 'attachment',
    maxFilesize: 2,
    maxFiles: 6,
    acceptedFiles: '.png, .jpg, .jpeg, .gif, .pdf, .zip, .docx, .doc, .JPG, .JPEG, .xlsx, .csv, .CSV',
    headers: {
        'x-csrf-token': "{{csrfToken}}"
    },
    renameFilename: (name) => {
        return activeRoom.id + '||' + name;
    },
    init: function() {
        //let myDropzone = this;

        this.on('success', function(file, resp){
            uploadfiles.push(resp);
        });
        this.on('error',  function (file, error, xhr){
            //console.log(error);
        });
        this.on('removedfile', function(file){
            let file_index = uploadfiles.find((n) => { return n.originalname == activeRoom.id + '-' +file.name });
            $.ajax({
                url: "http://localhost:3000/chat/uploads/delete",
                type: "POST",
                data: {file : file_index}
            });
            uploadfiles.splice(uploadfiles.indexOf(file_index), 1);
        });
    },
    accept: function(file, done) {
        let ext = file.name.toString().getExtension();
        if( ext == 'pdf' || ext == 'jpg' || ext == 'png'|| ext == 'jpeg' || ext == 'docx' || ext == 'doc' || ext == 'xlsx' || ext == 'zip' || ext == 'JPG' || ext == 'JPEG' || ext == 'csv' || ext == 'CSV'){
            done();
        }
        else
            done('Invalid file type');
    }
};

function invite_members(){
    var array = [];
    if($('#select_all_members_button').is(':checked')){
        $.each($('#members_contacts').prop('options'), function () {
            array.push(this.value);
        });
    }
    else {
        array = $('select#members_contacts').val();
    }

    $.ajaxSetup({
        headers: {"X-CSRF-Token": "{{csrfToken}}" }
    });

    $.ajax({
        method: "POST",
        url: "http://localhost:3000/chat/invite-members",
        data: {members:array, room_id: activeRoom.id},
        success: function(data) {
            $('#invite_alert').addClass('alert-success');
            $('#invite_alert').html('Invites have been sent');
        },
        error: function(err) {
            $('#invite_alert').addClass('alert-success');
            $('#invite_alert').html('Error sending invites');
        }
    });

    console.log(array);
}