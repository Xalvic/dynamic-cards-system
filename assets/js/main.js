document.addEventListener("DOMContentLoaded", () => {
  // --- THEME SETUP ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("theme") === "dark") {
    document.body.classList.remove("light-theme");
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
      markNotificationAsActive(li);
      if (window.innerWidth < 768) {
        toggleNotificationPanel();
      }

      const cardData = await ApiService.fetchCardData(actionId);

      hideLoadingMessages();
      if (cardData) {
        displayCard(cardData);
      } else {
        cardDisplayArea.innerHTML = `<div class="placeholder"><h2>Error</h2><p>Could not load card data.</p></div>`;
      }
    }
  });

  // 3. Display the selected card content
  function displayCard(data) {
    let cardComponent;

    switch (data.type) {
      case "flashcards":
        cardComponent = new FlashCard(data);
        break;
      case "new-flashcards":
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
    // --- NEW: Call Lucide to render icons after new content is added ---
    lucide.createIcons();
  }

  // 4. Mark notification as active
  function markNotificationAsActive(notificationElement) {
    notificationService.listElement.querySelectorAll("li").forEach((item) => {
      item.classList.remove("active");
    });
    notificationElement.classList.add("active");
  }
});
