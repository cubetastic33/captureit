firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var username = user.displayName;
    $("#loggedStatus").html('\
      <ul>\
        <li>'+username+'\
          <ul class="logout">\
            <li><a href="" onclick="signOutUser()">Sign out</a></li>\
          </ul>\
        </li>\
      </ul>\
    ');
    $("#signinreq").show();
  } else {
    // No user is signed in.
    if (document.getElementById("loggedStatus").innerHTML == "") {
      $("#loggedStatus").html('\
        <ul class="logout">\
          <li>\
            <a href="signin.html">Sign in</a>\
          </li>\
        </ul>\
      ');
    }
    $("#signinreqmessage").html('You need to <a href="signin.html">sign in</a> to be able to see this page!');
    $("#signinreq").hide();
  }
});
