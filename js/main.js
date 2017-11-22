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

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function removeFromArray(array, element) {
  const index = array.indexOf(element);
  array.splice(index, 1);
}

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

var moving = false;
var enemyTiles = [];
var surrounding = [];

function usersTurn() {
  $('div').click(function() {
    if ($(this).attr('id').substr(0, 1) == 'c') {
      if ((!$('.selected').attr('id')) && ($(this).attr('class') == 'ally')) {
        var session = db.ref('game/session');
        session.child($(this).attr('id')).set('ally selected');
      } else if (($('.selected').attr('id')) && ($(this).attr('class') == 'empty')) {
        var id = $(this).attr('id');
        var currentId = parseInt($(this).attr('id').substr(1));
        var a = parseInt($('.selected').attr('id').substr(1));
        var b = a+1 ;
        var c = a-1;
        var d = a+6;
        var e = a-6;
        var session = db.ref('game/session');
        if ((currentId == b) || (currentId == c) || (currentId == d) || (currentId == e)) {
          session.child($('.selected').attr('id')).set('empty').then(function() {
            session.child(id).set('ally');
            $('.enemy').each(function() {
              while (enemyTiles.length > 0) {
                enemyTiles.pop();
              }
              enemyTiles.push(this.id);
            });
            enemysTurn();
          });
        } else {
          session.child($('.selected').attr('id')).set('ally');
        }
      } else if ($(this).attr('class') == 'ally') {
        var session = db.ref('game/session');
        session.child($('.selected').attr('id')).set('ally');
        console.log($('.selected'))
      }
    }
  });
}

function enemysTurn() {
  if ((enemyTiles.length > 0) && (enemyTiles.length < 4)) {
    var selectedEnemy = enemyTiles[random(0, enemyTiles.length)];
    var locId = selectedEnemy.substr(1, selectedEnemy.length);
    surrounding = [locId+1, locId-1, locId+6, locId-6];
    enemysMove(selectedEnemy);
  } else {
    alert('game over!');
  }
}

function enemysMove(selectedEnemy) {
  if (surrounding.length > 0) {
    var moveTo = surrounding[random(0, surrounding.length)];
    if ($('#c'+moveTo).attr('class') == 'empty') {
      var session = db.ref('game/session');
      session.child(selectedEnemy).set('empty');
      session.child('c'+moveTo).set('enemy');
      usersTurn();
    } else {
      removeFromArray(surrounding, moveTo);
      enemysMove(selectedEnemy);
    }
  } else {
    removeFromArray(enemyTiles, selectedEnemy);
    enemysTurn();
  }
}

usersTurn();
