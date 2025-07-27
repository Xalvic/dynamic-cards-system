class Checklist extends CardComponent {
  constructor(data) {
    super(data);
    this.interactionId = data.interactionId;
    // Initialize completed items from the incoming data
    this.completedItems = new Map(
      data.tasks
        .filter((item) => item.completed)
        .map((item) => [item.task, Date.now()])
    );
    // Timer functionality has been removed
    this.completionSound = new Audio("../../../assets/sounds/sucess.mp3");
  }

  /**
   * Applies a saved state to the checklist component from history.
   * @param {object} progressData - The parsed progress object from the API.
   */
  applyProgress(progressData) {
    if (!progressData || !progressData.items) {
      console.warn("Checklist: Invalid progress data, cannot apply history.");
      return;
    }

    console.log("Applying restored checklist progress:", progressData);

    // Clear the current completed items before restoring
    this.completedItems.clear();

    // Repopulate the completedItems Map from the history data
    progressData.items.forEach((item) => {
      if (item.checked) {
        // The API uses 'item_id', which corresponds to our 'task' key
        this.completedItems.set(item.item_id, Date.now());
      }
    });

    // Re-render the entire component to reflect the restored state.
    // This is the most reliable way to update all UI elements at once.
    this.updateUI();
  }

  /**
   * Builds the payload and sends the current checklist state to the API.
   */
  syncProgressWithApi() {
    // Don't send updates if there's no interaction ID
    if (!this.interactionId) {
      console.warn(
        "Checklist: interactionId is missing, cannot sync progress."
      );
      return;
    }

    // Create the 'items' array in the format required by the API
    const itemsPayload = this.data.tasks.map((item) => ({
      item_id: item.task, // Using 'task' as the unique ID
      checked: this.completedItems.has(item.task),
    }));

    // Check if all tasks have been completed
    const isCompleted = this.completedItems.size === this.data.tasks.length;

    const payload = {
      userId: localStorage.getItem("user_id"),
      appId: localStorage.getItem("app_id"),
      interactionId: this.interactionId,
      items: itemsPayload,
      completed: isCompleted,
    };

    // Call the new ApiService function (runs in the background)
    ApiService.updateChecklistActivity(payload);
  }

  resetState() {
    this.completedItems.clear();
    this.updateUI();
    this.syncProgressWithApi();
  }

  /**
   * Adjusts the height of the card container to fit the visible face.
   * @param {HTMLElement} flipperElement - The .task-card-flipper element.
   */
  adjustFlipperHeight(flipperElement) {
    const container = flipperElement.closest(".task-item-container");
    if (!container) return;

    const frontFace = flipperElement.querySelector(".task-card-front");
    const backFace = flipperElement.querySelector(".task-card-back");

    // Use scrollHeight to get the true height of the content
    const frontHeight = frontFace.scrollHeight;
    const backHeight = backFace.scrollHeight;

    // Set the container's height based on which face is visible
    if (flipperElement.classList.contains("is-flipped")) {
      container.style.height = `${backHeight}px`;
    } else {
      container.style.height = `${frontHeight}px`;
    }
  }

  render() {
    const totalItems = this.data.tasks.length;
    const completedCount = this.completedItems.size;
    const remainingCount = totalItems - completedCount;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    // The main structure with the progress header remains the same
    return `
      <div class="card checklist" id="card-${this.data.id}">
        <div class="card-content">
          <h2 class="card-title">${this.data.title}</h2>
          <p class="card-subtitle">${this.data.subtitle}</p>

          <div class="checklist-progress-header">
            <button class="reset-btn"><i data-lucide="rotate-cw"></i></button>
            <div class="header-stats">
              <div class="stat-box">
                <span class="stat-value" id="stat-taken-${
                  this.data.id
                }">${completedCount}</span>
                <span class="stat-label">Actions Taken</span>
              </div>
              <div class="stat-box">
                <span class="stat-value" id="stat-remaining-${
                  this.data.id
                }">${remainingCount}</span>
                <span class="stat-label">Remaining</span>
              </div>
              <div class="stat-box">
                <span class="stat-value" id="stat-progress-${
                  this.data.id
                }">${Math.round(progress)}%</span>
                <span class="stat-label">Progress</span>
              </div>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fg" style="width: ${progress}%"></div>
            </div>
          </div>
          <ul class="task-list">
            ${this.data.tasks.map((item) => this.renderListItem(item)).join("")}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Renders a single task item as a flippable card.
   */
  renderListItem(item) {
    const isCompleted = this.completedItems.has(item.task);
    const timeStr = item.time || "";
    // Condition to show schedule button for multi-day tasks
    const showScheduleBtn = timeStr.includes("day") || timeStr.includes("week");

    return `
      <li class="task-item-container ${
        isCompleted ? "completed" : ""
      }" data-item-id="${item.task}">
        <div class="task-card-flipper">
          
          <div class="task-card-front">
            <div class="task-fill-bg"></div>
            <div class="task-completed-overlay">
                <i data-lucide="check-circle-2"></i>
                <span>Completed</span>
            </div>

            <div class="task-content">
              <div class="task-main-info">
                <div class="task-title">${item.task}</div>
                <p class="task-text">${item.action_to_take}</p>
                ${timeStr ? `<div class="time-chip">${timeStr}</div>` : ""}
              </div>
              <div class="task-complete-action">
                <input type="checkbox" id="checkbox-${
                  item.task
                }" class="complete-checkbox" ${isCompleted ? "checked" : ""}>
                <label for="checkbox-${
                  item.task
                }" class="complete-checkbox-label">
                  <i data-lucide="check"></i>
                </label>
              </div>
            </div>

            <div class="task-footer">
              <div class="footer-buttons">
                ${
                  showScheduleBtn
                    ? `<button class="action-btn schedule-btn"><i data-lucide="calendar-plus"></i> Schedule</button>`
                    : ""
                }
              </div>
              <button class="flip-btn"><i data-lucide="info"></i> <span>Why this task?</span></button>
            </div>
          </div>

          <div class="task-card-back">
            <div class="back-content">
              <h4>Why this task is important</h4>
              <p>${item.why_this_task || "No details provided."}</p>
              ${
                item.statistic
                  ? `
                <div class="statistic-box">
                  <i data-lucide="trending-up"></i>
                  <span>${item.statistic}</span>
                </div>
              `
                  : ""
              }
            </div>
            <button class="flip-btn"><i data-lucide="arrow-left"></i> <span>Back to task</span></button>
          </div>

        </div>
      </li>
    `;
  }

  attachEventListeners() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    componentRoot.querySelector(".task-list").addEventListener("click", (e) => {
      const taskItem = e.target.closest(".task-item-container");
      if (!taskItem || taskItem.classList.contains("completed")) return;

      const itemId = taskItem.dataset.itemId;
      const flipper = taskItem.querySelector(".task-card-flipper");

      // Handle flip button clicks
      if (e.target.closest(".flip-btn")) {
        e.stopPropagation();
        flipper.classList.toggle("is-flipped");
        this.adjustFlipperHeight(flipper);
      }
      // Handle checkbox click to mark as complete
      else if (e.target.closest(".complete-checkbox-label")) {
        e.preventDefault();
        this.markItemComplete(itemId);
      }
      // Handle schedule button click
      else if (e.target.closest(".schedule-btn")) {
        e.stopPropagation();
        this.scheduleItem(itemId);
      }
    });

    componentRoot.querySelectorAll(".task-card-flipper").forEach((flipper) => {
      this.adjustFlipperHeight(flipper);
    });

    // Reset button listener
    componentRoot.querySelector(".reset-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.resetState();
    });
  }

  markItemComplete(itemId) {
    if (this.completedItems.has(itemId)) return;

    this.completedItems.set(itemId, Date.now());
    const itemElement = document.querySelector(
      `.task-item-container[data-item-id="${itemId}"]`
    );
    if (!itemElement) return;

    const flipper = itemElement.querySelector(".task-card-flipper");
    if (flipper) flipper.classList.remove("is-flipped");

    const fillBg = itemElement.querySelector(".task-fill-bg");
    const completedOverlay = itemElement.querySelector(
      ".task-completed-overlay"
    );

    anime
      .timeline({
        easing: "easeOutExpo",
        duration: 800,
        complete: () => {
          itemElement.classList.add("completed");
        },
      })
      .add({
        targets: fillBg,
        width: "100%",
        duration: 600,
      })
      .add(
        {
          targets: completedOverlay,
          opacity: [0, 1],
          scale: [0.8, 1],
          easing: "easeOutElastic(1, .8)",
          duration: 700,
        },
        "-=400"
      );

    this.updateProgressUI();
    this.syncProgressWithApi();

    if (this.completedItems.size === this.data.tasks.length) {
      document.getElementById("card-display-area").scrollTo({
        top: 0,
        behavior: "smooth",
      });
      this.triggerCompletionCelebration();
    }
  }

  scheduleItem(itemId) {
    const itemData = this.data.tasks.find((i) => i.task === itemId);
    if (!itemData) return;

    const now = new Date();
    const eventDate = new Date(now);
    eventDate.setDate(now.getDate() + 1);
    eventDate.setHours(15, 0, 0, 0);

    const startTime = eventDate;
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d{3}/g, "");

    const params = new URLSearchParams();
    params.append("action", "TEMPLATE");
    params.append("text", itemData.task);
    params.append(
      "details",
      `Task: ${itemData.action_to_take}\nEstimated Time: ${
        itemData.time || "Not set"
      }`
    );
    params.append("dates", `${formatDate(startTime)}/${formatDate(endTime)}`);
    params.append("ctz", "UTC");

    const googleCalendarUrl = `https://www.google.com/calendar/render?${params.toString()}`;
    window.open(googleCalendarUrl, "_blank");
  }

  updateProgressUI() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const totalItems = this.data.tasks.length;
    const completedCount = this.completedItems.size;
    const remainingCount = totalItems - completedCount;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    const statTaken = componentRoot.querySelector(
      `#stat-taken-${this.data.id}`
    );
    const statRemaining = componentRoot.querySelector(
      `#stat-remaining-${this.data.id}`
    );
    const statProgress = componentRoot.querySelector(
      `#stat-progress-${this.data.id}`
    );
    const progressBar = componentRoot.querySelector(".progress-bar-fg");

    if (statTaken) statTaken.textContent = completedCount;
    if (statRemaining) statRemaining.textContent = remainingCount;
    if (statProgress) statProgress.textContent = `${Math.round(progress)}%`;

    if (progressBar) {
      anime({
        targets: progressBar,
        width: `${progress}%`,
        duration: 600,
        easing: "easeOutQuad",
      });
    }
  }

  updateUI() {
    const cardSetElement = document.getElementById(`card-${this.data.id}`);
    if (cardSetElement) {
      const mainAppContainer = document.getElementById("card-display-area");
      mainAppContainer.innerHTML = this.render();
      lucide.createIcons();
      this.attachEventListeners();
    }
  }

  triggerCompletionCelebration() {
    this.completionSound.play();
    if (typeof mojs === "undefined") {
      console.error("mo.js library is not loaded!");
      return;
    }

    const cardElement = document.getElementById(`card-${this.data.id}`);
    const header = cardElement.querySelector(".checklist-progress-header");
    if (!cardElement || !header) return;

    const headerRect = header.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();
    const originX = `${
      headerRect.left - cardRect.left + headerRect.width / 2
    }px`;
    const originY = `${
      headerRect.top - cardRect.top + headerRect.height / 2
    }px`;

    const softColors = ["#A8D0E6", "#F7D4A2", "#84DCC6", "#FFAAA5", "#A3A8E6"];

    const timeline = new mojs.Timeline();

    const mainPop = new mojs.Burst({
      parent: cardElement,
      left: originX,
      top: originY,
      radius: { 20: 80 },
      count: 5,
      children: {
        shape: "polygon",
        points: 5,
        fill: softColors,
        radius: { 10: 25 },
        scale: { 1: 0, easing: "cubic.in" },
        angle: { 0: "rand(-180, 180)" },
        duration: 1000,
      },
    });

    const driftingParticles = new mojs.Burst({
      parent: cardElement,
      left: originX,
      top: originY,
      radius: { 50: 250 },
      count: 20,
      angle: { 0: -160 },
      children: {
        shape: "circle",
        fill: softColors,
        radius: "rand(3, 8)",
        scale: { 1: 0 },
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: 1800,
      },
    });

    const confettiBits = new mojs.Burst({
      parent: cardElement,
      left: originX,
      top: originY,
      radius: { 10: 100 },
      count: 12,
      angle: { "rand(0, 360)": 0 },
      children: {
        shape: "rect",
        fill: "#FFFFFF",
        radius: "rand(2, 4)",
        scale: { 1: 0 },
        stroke: "rgba(0,0,0,0.1)",
        strokeWidth: 1,
        duration: 2000,
      },
    });

    timeline.add(mainPop, driftingParticles, confettiBits);
    timeline.play();
  }
}
