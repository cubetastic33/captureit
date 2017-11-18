// Initialize Firebase
var config = {
  apiKey: "AIzaSyCaqneE7oZdUSxsqoh1d2Opa2nl3-cQWRw",
  authDomain: "capture-it-34478.firebaseapp.com",
  databaseURL: "https://capture-it-34478.firebaseio.com",
  projectId: "capture-it-34478",
  storageBucket: "capture-it-34478.appspot.com",
  messagingSenderId: "205728693849"
};
firebase.initializeApp(config);

var db = firebase.database();

if (signin == true) {
  // FirebaseUI config.
  var uiConfig = {
    signInSuccessUrl: 'index.html',
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '<your-tos-url>'
  };
  
  // Initialize the FirebaseUI Widget using Firebase.
  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  // The start method will wait until the DOM is loaded.
  ui.start('#firebaseui-auth-container', uiConfig);
  signin == false;
}

firebase.auth().onAuthStateChanged(function(user) {
  if ((user) && (signin == false)) {
    var uid = user.uid;
    var username = user.displayName;
    var email = user.email;
    db.ref('users/'+uid).child('email').set(email);
    db.ref('users/'+uid).child('username').set(username);
    db.ref('users/'+uid).child('uid').set(uid);
    console.log('Updated user info');
  }
});

function signOutUser() {
  firebase.auth().signOut();
}

var permitted;

firebase.auth().onAuthStateChanged(function(user) {
  if (!localStorage.getItem('refreshedClasses')) {
    localStorage.setItem('refreshedClasses', 'false');
  }
  if ((user) && (signin == false) && (localStorage.getItem('refreshedClasses').indexOf('false') > -1)) {
    window.location.href = 'refreshValues.html';
    localStorage.setItem('refreshedClasses', 'true');
  } else if ((user) && (signin == false) && (localStorage.getItem('refreshedClasses').indexOf('true') > -1)) {
    permitted = true;
    updateClasses();
    localStorage.setItem('refreshedClasses', 'false');
  }
});

function updateClasses() {
  db.ref('game/session').on('value', function(snapshot) {
    for (var i = 0; i < 36; i++) {
      $('#c'+i).attr('class', snapshot.child('c'+i).val());
    }
  });
}

var moving = 'false';

$('div').click(function() {
  if ($(this).attr('id').substr(0, 1) == 'c') {
    if ((moving == 'false') && ($(this).attr('class') != 'empty')) {
      var existingClass = $(this).attr('class');
      moving = existingClass;
      var session = db.ref('game/session');
      session.child($(this).attr('id')).set(existingClass+' selected');
      session.on('value', function(data) {
        while ((data.child($('.selected').attr('id')).val()) == 'ally') {
          console.log(existingClass);
          alert(data.child($('.selected').attr('id')).val());
        }
      });
    } else {
      var session = db.ref('game/session');
      if ($(this).attr('class') == 'empty') {
        session.child($('.selected').attr('id')).set('empty');
        session.child($(this).attr('id')).set(moving);
      } else {
        session.child($('.selected').attr('id')).set(moving);
      }
      moving = 'false';
    }
  }
});
