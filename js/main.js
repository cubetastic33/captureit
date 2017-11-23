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

if (localStorage.getItem('refLoc') == 'game/gameReset') {
  $('#levelSelector').val('userVsAI');
} else if (localStorage.getItem('refLoc') == 'game') {
  $('#levelSelector').val('userVsRandom');
} else {
  localStorage.setItem('refLoc', 'game');
}

var level = $('#levelSelector').find(':selected').val();

function chooseLevel() {
  level = $('#levelSelector').find(':selected').val();
  initialize();
}

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
var allyTiles = [];
var surrounding = [];
var allyMovableLocation = [];
var enemyMovableLocation = [];
var commonTileMovable = [];

function initialize() {
  if (level == 'userVsRandom') {
    if (localStorage.getItem('refLoc') != 'game') {
      localStorage.setItem('refLoc', 'game');
      window.location.href="refreshValues.html";
    }
    $('#introMsg').text('\
    Welcome to Capture it! The objective of this game is to use your tiles to surround \
    all enemy tiles (in red) in right, left, top, and bottom sides with your ally tiles \
    (in blue). Simple, right? All tiles can move any number of tiles in right, left, top, \
    or bottom directions. You are allowed to play with a friend, with whom you can \
    communicate using chat.\
    ');
    usersTurn();
  }
  
  if (level == 'userVsAI') {
    if (localStorage.getItem('refLoc') != 'game/gameReset') {
      localStorage.setItem('refLoc', 'game/gameReset');
      window.location.href="refreshValues.html";
    }
    $('#introMsg').text('\
    Welcome to Capture it! The objective of this game is to use your tiles to surround \
    any one enemy tile (in red) in right, left, top, and bottom sides with your ally tiles \
    (in blue). Simple, right? All tiles can move 1 tile in right, left, top, \
    or bottom directions. You are allowed to play with a friend, with whom you can \
    communicate using chat.\
    ');
    userTurn();
  }
}

initialize();

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
        var edge = [0, 1, 2, 3, 4, 5, 11, 17, 23, 29, 35, 34, 33, 32, 31, 30, 24, 18, 12, 6];
        edge.forEach(function(item) {
          var existingClass = $('#c'+item).attr('class');
          session.child($('#c'+item).attr('id')).set(existingClass+' exception');
        });

        if ($(this).attr('class') == 'exception') {
          alert('This is an edge piece, still under developement.');
          if ((currentId%6 == 17) && (currentId == c)) {
            usersTurn();
          } /*else if ((currentId%6 == 5) && (currentId == b )) {
            usersTurn();
          } else if (((currentId == 1) || (currentId == 2) || (currentId == 3) || (currentId == 4)  && (currentId == c))) {
            alert("Invalid Move, Please move the tile to any of the adjacent empty tiles in the 4 major directions");
            usersTurn();
          } else if((currentClass == 'empty') && ((currentId == 31) || (currentId == 32) || (currentId == 33) || (currentId == 34)  && (currentId == d))) {
            alert("Invalid Move, Please move the tile to any of the adjacent empty tiles in the 4 major directions");
            usersTurn();
          } else if((currentClass == 'empty') && ((currentId == 0) && ((currentId == c) || (currentId ==e) ) ) ) {
            alert("Invalid Move, Please move the tile to any of the adjacent empty tiles in the 4 major directions");
            usersTurn();
          } else if ((currentId == 5) && ((currentId == b) || (currentId == e))) {
            alert("Invalid Move, Please move the tile to any of the adjacent empty tiles in the 4 major directions");
            usersTurn();
          } else if ((currentId == 35)  && ((currentId == d) || (currentId == b))) {
            alert("Invalid Move, Please move the tile to any of the adjacent empty tiles in the 4 major directions");
            usersTurn();
          } else if ((currentId == d) || (currentId == c)) {
            alert("Invalid Move, Please move the tile to any of the adjacent empty tiles in the 4 major directions");
            usersTurn();
          }*/
        } else if ((currentId == b) || (currentId == c) || (currentId == d) || (currentId == e)) {
          session.child($('.selected').attr('id')).set('empty').then(function() {
            session.child(id).set('ally');
            while (enemyTiles.length > 0) {
              enemyTiles.pop();
            }
            $('.enemy').each(function() {
              enemyTiles.push(this.id);
            });
            enemysTurn(true);
          });
        } else {
          session.child($('.selected').attr('id')).set('ally');
        }
      } else if ($(this).attr('class') == 'ally') {
        var session = db.ref('game/session');
        session.child($('.selected').attr('id')).set('ally');
        console.log($('.selected'));
      }
    }
  });
}

function enemysTurn(fromUsersTurn) {
  if (enemyTiles.length > 0) {
    var selectedEnemy = enemyTiles[random(0, enemyTiles.length)];
    var locId = selectedEnemy.substr(1, selectedEnemy.length);
    surrounding = [locId+1, locId-1, locId+6, locId-6];
    enemysMove(selectedEnemy);
  } else {
    alert('game over!');
  }
}

function enemysMove(selectedEnemy, fromUsersTurn) {
  if (surrounding.length > 0) {
    var moveTo = surrounding[random(0, surrounding.length)];
    if ($('#c'+moveTo).attr('class') == 'empty') {
      var session = db.ref('game/session');
      session.child(selectedEnemy).set('empty');
      session.child('c'+moveTo).set('enemy');
      if (fromUsersTurn == true) {
        usersTurn();
      } else {
        userTurn();
      }
    } else {
      removeFromArray(surrounding, moveTo);
      enemysMove(selectedEnemy, fromUsersTurn);
    }
  } else {
    removeFromArray(enemyTiles, selectedEnemy);
    enemysTurn(fromUsersTurn);
  }
}

function intersection(a, b){
  var rs = [], x = a.length;
  while (x--) b.indexOf(a[x])!=-1 && rs.push(a[x]);
  return rs.sort();
}

function userTurn() {
  $('div').click(function() {
    if ($(this).attr('id').substr(0, 1) == 'c') {
      if ((!$('.selected').attr('id')) && ($(this).attr('class') == 'ally')) {
        var session = db.ref('game/session');
        session.child($(this).attr('id')).set('ally selected');
      } else if (($('.selected').attr('id')) && ($(this).attr('class') == 'empty')) {
        var id = $(this).attr('id');
        var currentId = parseInt($(this).attr('id').substr(1));
        var a = parseInt($('.selected').attr('id').substr(1));
        var b = a+1;
        var c = a-1;
        var d = a+6;
        var e = a-6;
        var session = db.ref('game/session');
        if ((currentId == b) || (currentId == c) || (currentId == d) || (currentId == e)) {
          session.child($('.selected').attr('id')).set('empty');
          session.child(id).set('ally').then(function() {
            while (enemyTiles.length > 0) {
              enemyTiles.pop();
            }
            while(enemyMovableLocation.length > 0){
              enemyMovableLocation.pop();
            }
            $('.enemy').each(function() {
              enemyTiles.push(this.id);
              var idNum = parseInt(this.id.substr(1));
              enemyMovableLocation.push(idNum-1);
              enemyMovableLocation.push(idNum+1);
              enemyMovableLocation.push(idNum+6);
              enemyMovableLocation.push(idNum-6);
            });
            while (allyTiles.length > 0) {
              allyTiles.pop();
            }
            while(allyMovableLocation.length > 0){
              allyMovableLocation.pop();
            }
            $('.ally').each(function() {
              allyTiles.push(this.id);
              var idNumAlly= parseInt(this.id.substr(1));
              allyMovableLocation.push(idNumAlly-1);
              allyMovableLocation.push(idNumAlly+1);
              allyMovableLocation.push(idNumAlly+6);
              allyMovableLocation.push(idNumAlly-6);
            });
            commonTileMovable = [intersection(allyMovableLocation, enemyMovableLocation)];
            commonTileMovable = commonTileMovable[0];
            if (commonTileMovable.length > 0) {
              enemyTurn();
            } else {
              enemysTurn(false);
            }
          });
        } else {
          session.child($('.selected').attr('id')).set('ally');
        }
      } else if ($(this).attr('class') == 'ally') {
        var session = db.ref('game/session');
        session.child($('.selected').attr('id')).set('ally');
        console.log($('.selected'));
      }
    }
  });
}

function enemyTurn() {
  if (enemyTiles.length == 6) {
    var tileToMove = commonTileMovable[random(0, commonTileMovable.length)];
    surrounding = [tileToMove +1, tileToMove-1, tileToMove+6, tileToMove-6];
    surrounding.forEach(function(item) {
      if (($('#c'+item).attr('class') == 'empty') || ($('#c'+item).attr('class') == 'ally')) {
        removeFromArray(surrounding, item);
      }
    });
    var selectedEnemy = surrounding[random(0, surrounding.length)];
    console.log(selectedEnemy);
    var session = db.ref('game/session');
    session.child('c'+selectedEnemy).set('empty').then(function() {
      session.child('c'+tileToMove).set('enemy');
      userTurn();
    });
  } else {
    responsiveVoice.speak('Well played. You win!');
    alert('game over!');
  }
}
