importScripts('https://www.gstatic.com/firebasejs/4.5.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.5.1/firebase-messaging.js');

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

const messaging = firebase.messaging();

//Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener('install', function(event) {
  var offlinePage = new Request('offline.html');
  event.waitUntil(
  fetch(offlinePage).then(function(response) {
    return caches.open('comet-offline').then(function(cache) {
      console.log('Cached offline page during Install'+ response.url);
      return cache.put(offlinePage, response);
    });
  }));
});

//If any fetch fails, it will show the offline page.
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function(error) {
        console.error('Network request Failed. Serving offline page ' + error);
        return caches.open('comet-offline').then(function(cache) {
          return cache.match('offline.html');
      });
    }));
});

//This is a event that can be fired from your page to tell the SW to update the offline page
self.addEventListener('refreshOffline', function(response) {
  return caches.open('comet-offline').then(function(cache) {
    console.log('Offline page updated from refreshOffline event: '+ response.url);
    return cache.put(offlinePage, response);
  });
});
