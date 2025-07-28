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
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }
    const reg = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    ); // Use absolute path
    console.log("Service Worker registered:", reg);
    const readyReg = await navigator.serviceWorker.ready;
    console.log("Service Worker ready:", readyReg);
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
  // --- ✨ Get elements for the combined form ---
  const usernameInput = document.getElementById("username-input");
  const appnameInput = document.getElementById("appname-input");
  const useridInput = document.getElementById("userid-input");
  const appidInput = document.getElementById("appid-input");
  const customActionInput = document.getElementById("customAction");
  const saveDetailsBtn = document.getElementById("save-details-btn");

  function populateUserDetailsForm() {
    usernameInput.value = userName;
    appnameInput.value = appName;
    useridInput.value = userId;
    appidInput.value = appId;
    customActionInput.value = localStorage.getItem("last_action") || "";
  }

  // --- ✨ UPDATED: Combined event listener for the single button ---
  saveDetailsBtn.addEventListener("click", async () => {
    // 1. Read and save all user details
    const newUsername = usernameInput.value.trim();
    const newAppname = appnameInput.value.trim();
    const newUserid = useridInput.value.trim();
    const newAppid = appidInput.value.trim();
    const customAction = customActionInput.value.trim();

    userName = newUsername;
    appName = newAppname;
    userId = newUserid;
    appId = newAppid;

    localStorage.setItem("username", newUsername);
    localStorage.setItem("appname", newAppname);
    localStorage.setItem("user_id", newUserid);
    localStorage.setItem("app_id", newAppid);
    localStorage.setItem("last_action", customAction);

    // 2. If there is a custom action, get a notification for it
    if (customAction) {
      if (localStorage.getItem("card-fcm-token")) {
        theToken = localStorage.getItem("card-fcm-token");
        getNotification(customAction);
      } else {
        await getTokenAndShow();
        getNotification(customAction);
      }
    }

    // 3. Provide user feedback
    saveDetailsBtn.textContent = "Saved!";
    setTimeout(() => {
      saveDetailsBtn.textContent = "Save & Get Notification";
    }, 1500);
  });

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

  const urlParams = new URLSearchParams(window.location.search);
  renderUserActions();

  if (urlParams.get("theme") === "dark")
    document.body.classList.remove("light-theme");

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

  populateUserDetailsForm();

  const cardDisplayArea = document.getElementById("card-display-area");
  const notificationPanel = document.getElementById("notification-panel");
  const menuBtn = document.getElementById("menu-btn");
  const closeNotificationsBtn = document.getElementById(
    "close-notifications-btn"
  );
  const overlay = document.getElementById("overlay");
  const notificationService = new NotificationService("notification-list");

  menuBtn.addEventListener("click", toggleNotificationPanel);
  closeNotificationsBtn.addEventListener("click", toggleNotificationPanel);
  overlay.addEventListener("click", toggleNotificationPanel);

  function toggleNotificationPanel() {
    notificationPanel.classList.toggle("open");
    overlay.classList.toggle("visible");
  }

  const messsages = [
    "Loading your awesome content... 🚀 Knowledge incoming!",
    "⚡ Did you know? Octopuses have three hearts! Your flashcards are loading...",
    "Fun fact: Bananas are berries, but strawberries aren't 🍓 Almost ready!",
    "Compiling your achievements 📊 Stay tuned for greatness!",
    "🧠 Building epic action tasks... Get ready to crush it!",
    "Random fact: A group of flamingos is called a 'flamboyance' ✨ Loading...",
    "Prime your mind 🔥 Success is just seconds away!",
    "Did you know honey never spoils? 🍯 Your study cards are almost done!",
    "⚡ Making learning magical... Please wait!",
    "Fun trivia: Penguins propose with pebbles 🐧 Your content is loading!",
    "Crafting your perfect learning experience 🎨 Almost there!",
    "Random fact: A day on Venus is longer than its year! 🪐 Loading awesome stuff...",
    "🎯 Your personalized tasks are cooking...Hang tight!",
  ];

  let loadingOverlay = null;
  let loadingMsgIndex = 0;
  let loadingMsgInterval = null;

  function showLoadingMessages() {
    if (loadingOverlay) return;
    loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="loader-graphic">
  <div class="box box-1">
    <div class="side-left"></div>
    <div class="side-right"></div>
    <div class="side-top"></div>
  </div>
  <div class="box box-2">
    <div class="side-left"></div>
    <div class="side-right"></div>
    <div class="side-top"></div>
  </div>
  <div class="box box-3">
    <div class="side-left"></div>
    <div class="side-right"></div>
    <div class="side-top"></div>
  </div>
  <div class="box box-4">
    <div class="side-left"></div>
    <div class="side-right"></div>
    <div class="side-top"></div>
  </div>
</div>
      <div class="loading-message"></div>
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
    const apiData = await ApiService.fetchCardsApi(
      userId,
      appId,
      interactionId
    );
    let cardData;
    const interactionType = apiData?.data?.int_type;
    if (interactionType === "checklist") {
      cardData = apiData?.data?.acd_data?.data;
    } else {
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
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("history")) {
      const historyData = await ApiService.fetchInteractionList(userId, appId);
      if (historyData?.data?.interactions) {
        const matchingInteraction = historyData.data.interactions.find(
          (interaction) => interaction.id == interactionId
        );
        if (matchingInteraction && matchingInteraction.user_activity) {
          try {
            let activity;
            if (typeof matchingInteraction.user_activity === "string") {
              activity = JSON.parse(matchingInteraction.user_activity);
            } else {
              activity = matchingInteraction.user_activity;
            }
            const progressData = activity.activities[0];
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
            console.error(
              "Problematic user_activity data:",
              matchingInteraction.user_activity
            );
          }
        }
      }
    }
  }

  const notifications = ApiService.getNotifications();
  notificationService.renderNotifications(notifications);
  lucide.createIcons();

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
    localStorage.setItem("user_action", action);
    showLoadingMessages();
    let payload = {
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
    };
    if (lang != "") payload.language = lang;
    else payload.language = "en";
    fetch(
      `https://card-system-api-199903473791.asia-south1.run.app/firestorm-two/api/action/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        hideLoadingMessages();
      })
      .catch((error) => {
        console.log(error.message);
        hideLoadingMessages();
      });
  }
});

messaging.onMessage((payload) => {
  alert("Message received in foreground:");
  console.log("Message received in foreground:", payload);
  const { title, body } = payload.notification;
  const clickAction = payload.data.click_action;
  const notificationElement = document.getElementById("in-app-notification");
  notificationElement.innerHTML = `
    <div class="in-app-notification-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
    </div>
    <div class="in-app-notification-content">
        <h4>${title}</h4>
        <p>${body}</p>
    </div>
  `;
  notificationElement.onclick = () => {
    window.open(clickAction, "_blank");
    notificationElement.classList.remove("show");
  };
  const urlParams2 = new URLSearchParams(window.location.search);
  if (!urlParams2.has("interaction_id"))
    notificationElement.classList.add("show");
  setTimeout(() => {
    notificationElement.classList.remove("show");
  }, 5000);
});
