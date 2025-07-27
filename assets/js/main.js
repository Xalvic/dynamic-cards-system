const firebaseConfig = {
  apiKey: "AIzaSyAoX0Hpkkr4PUY8lHNyEagBPQqfYQlf3Ss",
  authDomain: "streak-ria-01.firebaseapp.com",
  projectId: "streak-ria-01",
  storageBucket: "streak-ria-01.firebasestorage.app",
  messagingSenderId: "550871367316",
  appId: "1:550871367316:web:b485cf0cdc44ea352fbe81",
  measurementId: "G-JF05EKZG7N",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

let theToken = "";
let userName = localStorage.getItem("username") || "John Doe";
let appName = localStorage.getItem("appname") || "Yoga App";
let userId = localStorage.getItem("user_id") || "user119";
let appId = localStorage.getItem("app_id") || "app119";
async function getTokenAndShow() {
  const output = document.getElementById("output");

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    // Register service worker
    const reg = await navigator.serviceWorker.register(
      "../../firebase-messaging-sw.js"
    );
    console.log("Service Worker registered:", reg);

    // Wait until SW is active
    const readyReg = await navigator.serviceWorker.ready;
    console.log("Service Worker ready:", readyReg);

    // Get FCM token
    const token = await messaging.getToken({
      serviceWorkerRegistration: readyReg,
      vapidKey:
        "BHQyd_LW38dh-gEhTjGjX5UOp-rBcFr3I96DqcfKRlRuEYKWKm8_XKDbNLGD4xsInUKFDdFYYtD8Iv9uzeDL3lU",
    });

    theToken = token;
    localStorage.setItem("card-fcm-token", token);
    console.log("FCM token:", token);
  } catch (err) {
    console.error("Error:", err);
  }
}

let userActions = ["Completed one stack!", "Completed 100 days of yoga!"];

document.addEventListener("DOMContentLoaded", async () => {
  function renderUserActions() {
    let userActionsContainer = document.querySelector(".user-actions");
    userActions.forEach((action) => {
      let userAction = document.createElement("BUTTON");
      userAction.textContent = action;
      userAction.addEventListener("click", async () => {
        if (localStorage.getItem("card-fcm-token")) {
          theToken = localStorage.getItem("card-fcm-token");
          getNotification(action);
        } else {
          await getTokenAndShow();
          getNotification(action);
        }
      });
      userActionsContainer.append(userAction);
    });
  }
  let customActionBtn = document.getElementById("customActionBtn");
  customActionBtn.addEventListener("click", async () => {
    if (document.getElementById("customAction").value == "") return;
    if (localStorage.getItem("card-fcm-token")) {
      theToken = localStorage.getItem("card-fcm-token");
      getNotification(document.getElementById("customAction").value);
    } else {
      await getTokenAndShow();
      getNotification(document.getElementById("customAction").value);
    }
  });
  const urlParams = new URLSearchParams(window.location.search);

  // if (localStorage.getItem("card-fcm-token")) {
  //   theToken = localStorage.getItem("card-fcm-token");
  //   renderUserActions();
  // } else {
  // await getTokenAndShow();
  renderUserActions();
  // }
  // document.querySelector(".token-text").textContent = theToken;
  // --- THEME SETUP ---
  if (urlParams.get("theme") === "dark")
    document.body.classList.remove("light-theme");
  // Details FETCH
  if (urlParams.has("username") && urlParams.get("username") !== "") {
    userName = urlParams.get("username");
    localStorage.setItem("username", userName);
  }
  if (urlParams.has("appname") && urlParams.get("appname") !== "") {
    appName = urlParams.get("appname");
    localStorage.setItem("appname", appName);
  }
  if (urlParams.has("user_id") && urlParams.get("user_id") !== "") {
    userId = urlParams.get("user_id");
    localStorage.setItem("user_id", userId);
  }
  if (urlParams.has("app_id") && urlParams.get("app_id") !== "") {
    appId = urlParams.get("app_id");
    localStorage.setItem("app_id", appId);
  }

  // --- UI ELEMENTS ---
  const cardDisplayArea = document.getElementById("card-display-area");
  const notificationPanel = document.getElementById("notification-panel");
  const menuBtn = document.getElementById("menu-btn");
  const closeNotificationsBtn = document.getElementById(
    "close-notifications-btn"
  );
  const overlay = document.getElementById("overlay");
  const notificationService = new NotificationService("notification-list");
  const initialPlaceholder = cardDisplayArea.innerHTML;

  // --- EVENT LISTENERS ---
  menuBtn.addEventListener("click", toggleNotificationPanel);
  closeNotificationsBtn.addEventListener("click", toggleNotificationPanel);
  overlay.addEventListener("click", toggleNotificationPanel);

  function toggleNotificationPanel() {
    notificationPanel.classList.toggle("open");
    overlay.classList.toggle("visible");
  }

  const messsages = [
    "Loading… because knowledge takes a second to get awesome",
    "Bringing your learning streak back online!",
    "Just a moment… making your goals easy to track",
    "Compiling your achievements in progress… Stay tuned!",
    "Great things come to those who review—your cards are almost ready.",
    "Prime your mind… Success is a few seconds away!",
    "Tracking your progress, building your mastery.",
  ];

  // --- LOADING PAGE WITH CYCLING MESSAGES ---
  let loadingOverlay = null;
  let loadingMsgIndex = 0;
  let loadingMsgInterval = null;

  function showLoadingMessages() {
    if (loadingOverlay) return; // Already shown
    loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
      <div class="cloud cloud-4"></div>
      <div class="loading-message-container">
        <div class="loading-message"></div>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
    loadingMsgIndex = 0;
    const msgEl = loadingOverlay.querySelector(".loading-message");
    function showNextMsg() {
      msgEl.style.opacity = 0;
      setTimeout(() => {
        msgEl.textContent = messsages[loadingMsgIndex];
        msgEl.style.opacity = 1;
        loadingMsgIndex = (loadingMsgIndex + 1) % messsages.length;
      }, 400);
    }
    showNextMsg();
    loadingMsgInterval = setInterval(showNextMsg, 2200);
  }

  function hideLoadingMessages() {
    if (loadingOverlay) {
      clearInterval(loadingMsgInterval);
      loadingMsgInterval = null;
      document.body.removeChild(loadingOverlay);
      loadingOverlay = null;
    }
  }

  // GET INTERACTION ID AND PASS TO API
  if (urlParams.has("interaction_id")) {
    ApiService.trackNotificationOpen(
      userId,
      appId,
      urlParams.get("interaction_id")
    );
    renderCards(urlParams.get("interaction_id"));
  }

  async function renderCards(interactionId) {
    showLoadingMessages();

    // --- STEP 1: Fetch and render the initial card deck ---
    const apiData = await ApiService.fetchCardsApi(
      userId,
      appId,
      interactionId
    );

    // This part needs to be flexible based on the card type
    let cardData;
    const interactionType = apiData?.data?.int_type;

    if (interactionType === "checklist") {
      // For checklists, the data is structured differently
      cardData = apiData?.data?.acd_data?.data;
    } else {
      // For flashcards, we transform the data
      const apiCardData = apiData?.data?.acd_data?.data;
      apiCardData.type = "new-flashcards";
      cardData = await ApiService.transformApiData(
        apiCardData,
        "newDrawingFlashcards"
      );
    }

    if (!cardData) {
      hideLoadingMessages();
      cardDisplayArea.innerHTML = `<div class="placeholder"><h2>Error</h2><p>Could not load card data.</p></div>`;
      return;
    }

    cardData.interactionId = interactionId;
    cardData.type = interactionType;
    const cardComponent = displayCard(cardData);
    hideLoadingMessages();

    if (!cardComponent) return;

    // --- STEP 2: Check for history parameter and apply progress ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("history")) {
      const historyData = await ApiService.fetchInteractionList(userId, appId);

      if (historyData?.data?.interactions) {
        console.log(historyData?.data?.interactions);
        console.log(interactionId);
        const matchingInteraction = historyData.data.interactions.find(
          (interaction) => interaction.id == interactionId
        );
        console.log(matchingInteraction);

        if (matchingInteraction && matchingInteraction.user_activity) {
          try {
            console.log(matchingInteraction.user_activity);
            const activity = JSON.parse(matchingInteraction.user_activity);
            const progressData = activity.activities[0];

            // --- ✨ NEW: Check the interaction type before applying progress ---
            if (
              matchingInteraction.int_type === "flashcards" &&
              cardComponent instanceof NewFlashCard
            ) {
              cardComponent.applyProgress(progressData);
            } else if (
              matchingInteraction.int_type === "checklist" &&
              cardComponent instanceof Checklist
            ) {
              cardComponent.applyProgress(progressData);
            }
          } catch (e) {
            console.error("Could not apply history:", e);
          }
        }
      }
    }
  }

  // 1. Load and display initial notifications
  const notifications = ApiService.getNotifications();
  notificationService.renderNotifications(notifications);
  lucide.createIcons(); // Initial call for icons in the panel

  // 2. Handle notification clicks (ASYNC)
  notificationService.listElement.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (li) {
      const actionId = li.dataset.actionId;

      cardDisplayArea.innerHTML = `<div class="placeholder"><h2>Loading...</h2></div>`;
      showLoadingMessages();
      if (window.innerWidth < 768) {
        toggleNotificationPanel();
      }
      window.location.href = `../../history.html?app_id=${appId}&user_id=${userId}`;
    }
  });

  // 3. Display the selected card content
  function displayCard(data) {
    const cardDisplayArea = document.getElementById("card-display-area");
    let cardComponent;

    switch (data.type) {
      case "flashcards":
        cardComponent = new NewFlashCard(data);
        break;
      case "checklist":
        cardComponent = new Checklist(data);
        break;
      case "quiz":
        cardComponent = new Quiz(data);
        break;
      default:
        cardDisplayArea.innerHTML =
          '<div class="placeholder"><h2>Error</h2><p>Unsupported card type.</p></div>';
        return;
    }

    cardDisplayArea.innerHTML = cardComponent.render();
    cardComponent.attachEventListeners();
    lucide.createIcons();

    return cardComponent;
  }

  function getNotification(action) {
    showLoadingMessages();
    fetch(
      "https://card-system-api-199903473791.asia-south1.run.app/firestorm-two/api/action/update",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          app_id: appId,
          app_name: appName,
          user_name: userName,
          action_qry: action,
          push_token: theToken,
          more_details: {
            screen: "settings",
            clicked_at: "2025-07-26T12:34:56Z",
          },
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.message)
          // document.querySelector(".error-text").textContent = data.message;
          hideLoadingMessages();
      })
      .catch((error) => {
        console.log(error.message);
        if (error.message)
          document.querySelector(
            ".error-text"
          ).textContent = `FROM ERROR ${error.message}`;
        hideLoadingMessages();
      });
  }
});

// Listen to foreground messages
messaging.onMessage((payload) => {
  console.log("Message received in foreground:", payload);
  // document.querySelector(".users-text").textContent = JSON.stringify(payload);

  const { title, body } = payload.notification;
  const clickAction = payload.data.click_action;

  const notificationElement = document.getElementById("in-app-notification");
  notificationElement.innerHTML = `
    <h4>${title}</h4>
    <p>${body}</p>
  `;
  // Make it clickable
  notificationElement.onclick = () => {
    window.open(clickAction, "_blank");
    notificationElement.classList.remove("show");
  };

  // Show the notification
  const urlParams2 = new URLSearchParams(window.location.search);
  if (!urlParams2.has("interaction_id"))
    notificationElement.classList.add("show");
  setTimeout(() => {
    notificationElement.classList.remove("show");
  }, 5000);

  const options = {
    body: body,
    icon: payload.data.icon || "/default-icon.png",
    data: {
      url: payload.data.click_action,
    },
  };

  if (Notification.permission === "granted") {
    const n = new Notification(title, options);
    n.onclick = (e) => {
      e.preventDefault();
      window.open(options.data.url, "_blank");
    };
  }
});
