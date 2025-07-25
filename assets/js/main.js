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
  const initialPlaceholder = cardDisplayArea.innerHTML;

  // --- EVENT LISTENERS ---
  menuBtn.addEventListener("click", toggleNotificationPanel);
  closeNotificationsBtn.addEventListener("click", toggleNotificationPanel);
  overlay.addEventListener("click", toggleNotificationPanel);

  function toggleNotificationPanel() {
    notificationPanel.classList.toggle("open");
    overlay.classList.toggle("visible");
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
      markNotificationAsActive(li);
      if (window.innerWidth < 768) {
        toggleNotificationPanel();
      }

      const cardData = await ApiService.fetchCardData(actionId);

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
