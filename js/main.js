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
    any one enemy tile (in red) in right, left, top, and bottom sides with your ally tiles \
    (in blue). Simple, right? All tiles can move 1 tile in right, left, top, \
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
        var edge = [0, 1, 2, 3, 4, 5, 6, 12, 18, 24, 30, 11, 17, 23, 29, 35, 34, 33, 32, 31];
        edge.forEach(function(item) {
          var existingClass = $('#c'+item).attr('class');
          //session.child($('#c'+item).attr('id')).set(existingClass+' exception');
        });

        if ((currentId == b) || (currentId == c) || (currentId == d) || (currentId == e)) {
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
  var cantMove = [];
  $('.enemy').each(function(item) {
    var surrounded = [item+1, item-1, item+6, item-6];
    cantMove = [];
    surrounded.forEach(function(itemLoc) {
      if (($('#c'+itemLoc).attr('class') == 'ally') && ($('#c'+itemLoc).attr('class') == 'enemy')) {
        cantMove.push(itemLoc);
      }
      if (cantMove.length == 4) {
        responsiveVoice.speak('Well played, you win!');
      }
    });
  });
  if (cantMove.length < 4) {
    var selectedEnemy = enemyTiles[random(0, enemyTiles.length)];
    console.log(selectedEnemy);
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
        var edge = [0, 1, 2, 3, 4, 5, 6, 12, 18, 24, 30, 11, 17, 23, 29, 35, 34, 33, 32, 31];
        if ((currentId == b) || (currentId == c) || (currentId == d) || (currentId == e)) {
          session.child($('.selected').attr('id')).set('empty');
          session.child(id).set('ally').then(function() {
            edge.forEach(function(item) {
              var existingClass = $('#c'+item).attr('class');
              session.child($('#c'+item).attr('id')).set(existingClass+' exception');
            });
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
              var idNumAlly = parseInt(this.id.substr(1));
              allyMovableLocation.push(idNumAlly-1);
              allyMovableLocation.push(idNumAlly+1);
              allyMovableLocation.push(idNumAlly+6);
              allyMovableLocation.push(idNumAlly-6);
            });
            commonTileMovable = intersection(allyMovableLocation, enemyMovableLocation);
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
    enemyTiles.forEach(function(item) {
      var cantMove = [];
      var canMove = [];
      var surrounded = [item+1, item-1, item+6, item-6];
      surrounded.forEach(function(itemLoc) {
        if ($('#'+item).attr('class') == 'empty') {
          canMove.push(item);
        }
        if ((cantMove.length == 3) && (canMove.length > 0)) {
          selectedEnemy = item;
          var session = db.ref('game/session');
          session.child('c'+selectedEnemy).set('empty').then(function() {
            session.child('c'+canMove[0]).set('enemy');
            userTurn();
          });
        } else if ((cantMove.length == 4) && (canMove.length == 0)) {
          alert('You win!');
        }
      });
    });
    var tileToMove = commonTileMovable[random(0, commonTileMovable.length)];
    alert(tileToMove);
    surrounding = ['c'+(tileToMove+1), 'c'+(tileToMove-1), 'c'+(tileToMove+6), 'c'+(tileToMove-6)];
    var enemySelectList = intersection(enemyTiles, surrounding);
    console.log(enemyTiles);
    console.log(surrounding);
    console.log(enemySelectList);
    var selectedEnemy = enemySelectList[random(0, enemySelectList.length)];
    console.log(selectedEnemy);
    var session = db.ref('game/session');
    session.child(selectedEnemy).set('empty').then(function() {
      session.child('c'+tileToMove).set('enemy');
      userTurn();
    });
  } else {
    responsiveVoice.speak('Well played. You win!');
    alert('game over!');
  }
}
