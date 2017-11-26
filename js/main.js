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

if (signin == true) {0
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

var enemyTiles = [];
var allyTiles = [];
var surrounding = [];
var allyMovableLocation = [];
var enemyMovableLocation = [];
var commonTileMovable = [];
var exceptions = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c12', 'c18', 'c24', 'c30', 'c11', 'c17', 'c23', 'c29',
 'c35', 'c34', 'c33', 'c32', 'c31'];
var c0 = ['c1', 'c6'];
var c5 = ['c4', 'c11'];
var c30 = ['c24', 'c31'];
var c35 = ['c34', 'c29'];
var c1 = ['c0', 'c2', 'c7'];
var c2 = ['c1', 'c3', 'c8'];
var c3 = ['c2', 'c4', 'c9'];
var c4 = ['c3', 'c5', 'c10'];
var c6 = ['c0', 'c7', 'c12'];
var c11 = ['c5', 'c10', 'c17'];
var c12 = ['c6', 'c13', 'c18'];
var c17 = ['c11', 'c16', 'c23'];
var c18 = ['c12', 'c19', 'c24'];
var c23 = ['c17', 'c22', 'c29'];
var c24 = ['c18', 'c19', 'c30'];
var c29 = ['c23', 'c28', 'c35'];
var c31 = ['c25', 'c30', 'c32'];
var c32 = ['c26', 'c31', 'c33'];
var c33 = ['c27', 'c32', 'c34'];
var c34 = ['c28', 'c33', 'c35'];

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
        var session = db.ref('game/session');        
        var id = $(this).attr('id');
        var currentId = parseInt($(this).attr('id').substr(1));
        var a = parseInt($('.selected').attr('id').substr(1));
        var b = a+1 ;
        var c = a-1;
        var d = a+6;
        var e = a-6;
        var ok = false;
        console.log($('.selected'));
        
        if (exceptions.indexOf($('.selected').attr('id')) > -1) {
          var selectedId = $('.selected').attr('id');
          var id = $(this).attr('id');
          currentId = false;
          if ((selectedId == 'c0') && (c0.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c1') && (c1.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c2') && (c2.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c3') && (c3.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c4') && (c4.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c5') && (c5.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c6') && (c6.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c11') && (c11.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c12') && (c12.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c17') && (c17.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c18') && (c18.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c23') && (c23.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c24') && (c24.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c29') && (c29.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c30') && (c30.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c31') && (c31.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c32') && (c32.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c33') && (c33.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c34') && (c34.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c35') && (c35.indexOf(id) > -1)) {ok = true}
        }
        if ((ok == true) || (currentId == b) || (currentId == c) || (currentId == d) || (currentId == e)) {
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
    surrounded.forEach(function(itemLoc) {
      if (($('#c'+itemLoc).attr('class') == 'ally') || ($('#c'+itemLoc).attr('class') == 'enemy')) {
        cantMove.push(itemLoc);
      }
      if (cantMove.length == 10) {
        alert('Well played, you win!');
      }
    });
  });
  var selectedEnemy = enemyTiles[random(0, enemyTiles.length)];
  console.log(selectedEnemy);
  var locId = selectedEnemy.substr(1, selectedEnemy.length);
  if (exceptions.indexOf(selectedEnemy) > -1) {
    if (selectedEnemy == 'c0') {surrounding = c0}
    else if (selectedEnemy == 'c1') {surrounding = c1}
    else if (selectedEnemy == 'c2') {surrounding = c2}
    else if (selectedEnemy == 'c3') {surrounding = c3}
    else if (selectedEnemy == 'c4') {surrounding = c4}
    else if (selectedEnemy == 'c5') {surrounding = c5}
    else if (selectedEnemy == 'c6') {surrounding = c6}
    else if (selectedEnemy == 'c11') {surrounding = c11}
    else if (selectedEnemy == 'c12') {surrounding = c12}
    else if (selectedEnemy == 'c17') {surrounding = c17}
    else if (selectedEnemy == 'c18') {surrounding = c18}
    else if (selectedEnemy == 'c23') {surrounding = c23}
    else if (selectedEnemy == 'c24') {surrounding = c24}
    else if (selectedEnemy == 'c29') {surrounding = c29}
    else if (selectedEnemy == 'c30') {surrounding = c30}
    else if (selectedEnemy == 'c31') {surrounding = c31}
    else if (selectedEnemy == 'c32') {surrounding = c32}
    else if (selectedEnemy == 'c33') {surrounding = c33}
    else if (selectedEnemy == 'c34') {surrounding = c34}
    else if (selectedEnemy == 'c35') {surrounding = c35}
  } else {
    surrounding = [locId+1, locId-1, locId+6, locId-6];
  }
  enemysMove(selectedEnemy);
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
        var ok = false;
        var b = a+1;
        var c = a-1;
        var d = a+6;
        var e = a-6;
        var session = db.ref('game/session');

        if (exceptions.indexOf($('.selected').attr('id')) > -1) {
          var selectedId = $('.selected').attr('id');
          var id = $(this).attr('id');
          currentId = false;
          if ((selectedId == 'c0') && (c0.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c1') && (c1.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c2') && (c2.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c3') && (c3.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c4') && (c4.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c5') && (c5.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c6') && (c6.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c11') && (c11.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c12') && (c12.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c17') && (c17.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c18') && (c18.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c23') && (c23.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c24') && (c24.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c29') && (c29.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c30') && (c30.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c31') && (c31.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c32') && (c32.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c33') && (c33.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c34') && (c34.indexOf(id) > -1)) {ok = true}
          else if ((selectedId == 'c35') && (c35.indexOf(id) > -1)) {ok = true}
        }
        if ((ok === true) || (currentId == b) || (currentId == c) || (currentId == d) || (currentId == e)) {
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
    if (exceptions.indexOf(tileToMove) > -1) {
      if (tileToMove == 'c0') {surrounding = c0}
      else if (tileToMove == 'c1') {surrounding = c1}
      else if (tileToMove == 'c2') {surrounding = c2}
      else if (tileToMove == 'c3') {surrounding = c3}
      else if (tileToMove == 'c4') {surrounding = c4}
      else if (tileToMove == 'c5') {surrounding = c5}
      else if (tileToMove == 'c6') {surrounding = c6}
      else if (tileToMove == 'c11') {surrounding = c11}
      else if (tileToMove == 'c12') {surrounding = c12}
      else if (tileToMove == 'c17') {surrounding = c17}
      else if (tileToMove == 'c18') {surrounding = c18}
      else if (tileToMove == 'c23') {surrounding = c23}
      else if (tileToMove == 'c24') {surrounding = c24}
      else if (tileToMove == 'c29') {surrounding = c29}
      else if (tileToMove == 'c30') {surrounding = c30}
      else if (tileToMove == 'c31') {surrounding = c31}
      else if (tileToMove == 'c32') {surrounding = c32}
      else if (tileToMove == 'c33') {surrounding = c33}
      else if (tileToMove == 'c34') {surrounding = c34}
      else if (tileToMove == 'c35') {surrounding = c35}
    } else {
      surrounding = ['c'+(tileToMove+1), 'c'+(tileToMove-1), 'c'+(tileToMove+6), 'c'+(tileToMove-6)];
    }
    var enemySelectList = intersection(enemyTiles, surrounding);
    console.log(enemyTiles);
    console.log(surrounding);
    console.log(enemySelectList);
    var selectedEnemy = enemySelectList[random(0, enemySelectList.length)];
    console.log(selectedEnemy);
    var session = db.ref('game/session');
    session.child(selectedEnemy).set('empty');
    session.child('c'+tileToMove).set('enemy').then(function() {
      userTurn();
    });
  } else if (enemyTiles.length > 6) {
    responsiveVoice.speak('Well played. You win!');
    alert('Ha Ha ha! I made a special move, as you seem to be talented.');
  } else {
    alert('Well, I\'ve made the game easier for you.');
  }
}
