document.addEventListener("DOMContentLoaded", () => {
  // --- THEME SETUP ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("theme") === "light") {
    document.body.classList.add("light-theme");
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

  // --- EVENT LISTENERS ---
  menuBtn.addEventListener("click", toggleNotificationPanel);
  closeNotificationsBtn.addEventListener("click", toggleNotificationPanel);
  overlay.addEventListener("click", toggleNotificationPanel);

  function toggleNotificationPanel() {
    notificationPanel.classList.toggle("open");
    overlay.classList.toggle("visible");
  }

  // 1. Load and display initial notifications
  const notifications = MockData.getNotifications();
  notificationService.renderNotifications(notifications);

  // 2. Handle notification clicks
  notificationService.listElement.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) {
      const actionId = li.dataset.actionId;
      const cardData = MockData.getCardData(actionId);
      if (cardData) {
        displayCard(cardData);
        markNotificationAsActive(li);
        toggleNotificationPanel(); // Close panel after selection
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
  }

  // 4. Mark notification as active
  function markNotificationAsActive(notificationElement) {
    notificationService.listElement
      .querySelectorAll("li")
      .forEach((item) => item.classList.remove("active"));
    notificationElement.classList.add("active");
  }
});
