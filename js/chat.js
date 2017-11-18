firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    $("#insideGroup, header, footer").hide();
    showGroups();
    var messageVal;
    $("#chatMessage").on('keyup', function(e) {if (e.keyCode == 13) {initializeMessage();}});
  }
  else {
    $("#chat-holder").html('You need to sign in to be able to chat!');
  }
});

function groupExists(groupName) {
  var groupDoesExist;
  var looped;
  var ref = db.ref("users");
  ref.on("value", function(snapshot) {
    var uids = Object.keys(snapshot.val());
    for (var i = 0; i < uids.length; i++) {
      var groupNamesRef = db.ref("users/"+uids[i]+"/groups");
      groupNamesRef.on("value", function(data) {
        data.forEach(function(child) {
          if (child.val() == groupName) {
            groupDoesExist = true;
            $("#msg").html('Group with the name "'+groupName+'" already exists. Please enter a different name!');
          } else {
            $("#msg").html('"'+groupName+'" is available!');
          }
        });
      });
      looped = true;
    }
  });
  if (groupDoesExist == true) {
    return true;
  } else if (looped == true) {
    looped = null;
    return false;
  }
}

function memberExists(memberName) {
  var memberExists;
  var myUsername = db.ref("users/"+firebase.auth().currentUser.uid+"/username");
  myUsername.on("value", function(data) {myUsername = data.val();});
  var ref = db.ref("users").orderByChild("username").equalTo(memberName);
  ref.on("child_added", function(snapshot) {
    var usersdata = snapshot.val();
    if (usersdata.username == myUsername) {
      $("#msg").html("You can't create a group with only yourself");
    } else if (usersdata.username == memberName) {
      $("#msg").html(usersdata.username+" exists.");
      memberExists = true;
    }
  });
}

function newGroup() {
  $("#newGroup").show();
  $("#newGroup").append('\
    <div id="msg"></div>\
    <label>Enter the name of the group you want create.</label><br>\
    <input type="text" id="groupName" placeholder="Group name" required><br>\
    <label>Enter the username of any person in the group. Others can be added later.</label><br>\
    <input type="text" id="groupMember" placeholder="username" required><br><br>\
    <button type="submit" id="createGroup">Create Group</button>\
    <button onclick="closeNewGroupForm()">Back</button>\
  ');
  $("#groupName").keyup(function() {
    if ($("#groupName").val() != "") {groupExists($("#groupName").val());} else {$("#msg").html("");}
  });
  $("#groupMember").keyup(function() {
    memberExists($("#groupMember").val());
  });
  $("#newGroup").submit(function(e) {
    e.preventDefault();
    var groupName = $("#groupName").val();
    var groupMember = $("#groupMember").val();

    if (5 == 5) {
      var uid = firebase.auth().currentUser.uid;
      db.ref("users/"+uid+"/groups").push(groupName);
      addMember(groupMember, groupName);
      closeNewGroupForm();
    }
  });
}

function closeNewGroupForm() {
  $("#newGroup").empty();
  $("#newGroup").css("display", "none");
}

function cancelAddMember() {
  $("#addMember").empty();
  $("#addMember").hide();
}

function addMemberForm() {
  $("#addMember").empty();
  $("#addMember").show();
  $("#addMember").append('\
    <input type="text" id="newMember" placeholder="Enter username of new member..." required>\
    <button type="submit" id="addMemberBtn">Add member</button>\
    <button onclick="cancelAddMember()">Cancel</button>\
  ');
  $("#addMember").submit(function() {
    var member = $("#newMember").val();
    var group = $("#groupHeading").text();
    addMember(member, group);
    alert('New member "'+member+'" has been added succesfully!');
    $("#addMember").empty();
    $("#addMember").hide();
  });
}

function addMember(username, groupName) {
  var usersRef = db.ref("users").orderByChild("username").equalTo(username);
  usersRef.once("child_added", function(snapshot) {
    var usersUid = snapshot.val().uid;
    db.ref("users/"+usersUid+"/groups").push(groupName);
  });
}

function showGroups() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var uid = firebase.auth().currentUser.uid;
      var groups = db.ref("users/"+uid+"/groups");
      groups.on("value", function(data) {
        var groupNames = data.val();
        var keys = Object.keys(groupNames);
        $("#groupOption").empty();
        for (var i = 0; i < keys.length; i++) {
          var groupName = groupNames[keys[i]];
          $("#groupOption").append('<p onclick="openGroup(\''+groupName+'\')">'+groupName+'</p>');
        }
      });
    }
  });
}

var group;
var prevMessages;

function openGroup(groupName) {
  group = groupName;
  var uid = firebase.auth().currentUser.uid;
  $("#newGroupBtn").hide();
  $("#groupOption").hide();
  $("#insideGroup, header, footer").show();
  $("#groupHeading").text(group);
  var messagesRef = db.ref("chat/"+group);
  messagesRef.on("value", function(data) {
    if (data.hasChildren() == true) {
      var messages = data.val();
      var keys = Object.keys(messages);
      $("#messages").empty();
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var occurance = messages[k].message.indexOf('class="permittedAndFormattable"');
        if (occurance > -1) {
          if (messages[k].uid == uid) {
            $("#messages").append('<div class="messageByMe">'+messages[k].message+'</div><br><br>');
          } else if (messages[k].uid != uid) {
            $("#messages").append('<div class="messageByMe">'+messages[k].message+'</div><br><br>');
          }
        } else if (messages[k].uid == uid) {
          $("#messages").append('<xmp class="messageByMe">'+messages[k].message+'</xmp><br><br>');
        } else if (messages[k].uid != uid) {
          $("#messages").append('<xmp class="messageByOthers">'+messages[k].message+'</xmp><br><br>');
        }
        window.scrollTo(0, document.body.scrollHeight);
      }
    }
  });
}

function goBackToGroups() {
  $("#insideGroup, header, footer").hide();
  $("#newGroupBtn").show();
  $("#groupOption").show();
  $("#messages").empty();
}

function openGroupSettings() {
  $("#groupSettings").toggle();
}

function initializeMessage() {
  messageVal = $("#chatMessage").val();
  $("#chatMessage").val("");
  sendMessage(messageVal);
}

function sendMessage(message) {
  var uid = firebase.auth().currentUser.uid;
  var dt = new Date();
  var group = $("#groupHeading").text();
  var time = dt.getUTCHours()+":"+dt.getUTCMinutes()+":"+dt.getUTCSeconds();
  var date = dt.getUTCDate()+"."+(dt.getUTCMonth() + 1)+"."+dt.getUTCFullYear();
  if ((message.indexOf('xmp') > -1) && (message.indexOf('>') > -1)) {
    alert("Your message contains text that is not permitted. Please see and remove stuff like xmp tags or something like that.");
  } else {
    var usersChatRef = db.ref("chat/"+group).push();
    usersChatRef.child("message").set(message);
    usersChatRef.child("time").set(time);
    usersChatRef.child("date").set(date);
    usersChatRef.child("uid").set(uid);
  }
}
