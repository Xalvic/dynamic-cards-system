
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAoX0Hpkkr4PUY8lHNyEagBPQqfYQlf3Ss",
  authDomain: "streak-ria-01.firebaseapp.com",
  projectId: "streak-ria-01",
  storageBucket: "streak-ria-01.firebasestorage.app",
  messagingSenderId: "550871367316",
  appId: "1:550871367316:web:b485cf0cdc44ea352fbe81",
});

const messaging = firebase.messaging();

// Handle background messages and show notification
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.data.icon || '/icon.png', // fallback icon if you want
    data: payload.data, // optional, for click_action
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
