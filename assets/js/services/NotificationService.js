class NotificationService {
  constructor(listElementId) {
    this.listElement = document.getElementById(listElementId);
  }

  renderNotifications(notifications) {
    this.listElement.innerHTML = "";
    notifications.forEach((notif) => {
      const li = document.createElement("li");
      li.textContent = notif.title;
      li.dataset.actionId = notif.actionId;
      li.dataset.notifId = notif.id;
      this.listElement.appendChild(li);
    });
  }
}
