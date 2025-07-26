class Checklist extends CardComponent {
  constructor(data) {
    super(data);
    this.completedItems = new Map(
      data.items
        .filter((item) => item.completed)
        .map((item) => [item.id, Date.now()])
    );
    this.expandedItemId = null; // Tracks the currently expanded item
    this.completionSound = new Audio("../../../assets/sounds/sucess.mp3");
    this.activeTimers = new Map();
  }

  resetState() {
    this.completedItems.clear();
    this.expandedItemId = null;
    this.updateUI(); // Re-render to clear the view
  }

  render() {
    const totalItems = this.data.items.length;
    const completedCount = this.completedItems.size;
    const remainingCount = totalItems - completedCount;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

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
            ${this.data.items.map((item) => this.renderListItem(item)).join("")}
          </ul>
        </div>
      </div>
    `;
  }

  renderListItem(item) {
    const isCompleted = this.completedItems.has(item.id);
    const isExpanded = this.expandedItemId === item.id;

    return `
      <li class="task-item ${isCompleted ? "completed" : ""} ${
      isExpanded ? "expanded" : ""
    }" data-item-id="${item.id}">
        <div class="task-fill-bg"></div>
        <div class="task-completed-overlay">
            <i data-lucide="check-circle-2"></i>
            <span>Completed</span>
        </div>
        <div class="task-header">
          <div class="task-info">
            <h3 class="task-title">${item.id}</h3>
            <p class="task-text">${item.text}</p>
          </div>
          ${
            item.timeToComplete
              ? `<div class="time-chip">${item.timeToComplete}</div>`
              : ""
          }
        </div>
        <div class="task-actions">
          <div class="timer-display" data-timer-for="${item.id}">00:00</div>
          <button class="action-btn timer-btn"><i data-lucide="timer"></i> <span>Start Timer<span/></button>
          <button class="action-btn schedule-btn"><i data-lucide="calendar-plus"></i> Schedule</button>
          <button class="action-btn complete-btn"><i data-lucide="check"></i> Mark Complete</button>
        </div>
      </li>
    `;
  }

  attachEventListeners() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    // Event delegation for all task-related clicks
    componentRoot.querySelector(".task-list").addEventListener("click", (e) => {
      const taskItem = e.target.closest(".task-item");
      if (!taskItem || taskItem.classList.contains("completed")) return;

      const itemId = taskItem.dataset.itemId;

      // Handle clicks on action buttons
      if (e.target.closest(".action-btn")) {
        if (e.target.closest(".complete-btn")) {
          this.markItemComplete(itemId);
        } else if (e.target.closest(".timer-btn")) {
          this.toggleTimer(itemId);
        } else if (e.target.closest(".schedule-btn")) {
          this.scheduleItem(itemId);
        }
      } else {
        // Handle click on the main task body to expand/collapse
        this.toggleTaskExpansion(itemId);
      }
    });

    // Reset button listener
    componentRoot.querySelector(".reset-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to reset your progress?")) {
        this.resetState();
      }
    });
  }
  stopTimer(itemId) {
    // Check if a timer is running for this item
    if (this.activeTimers.has(itemId)) {
      const timerData = this.activeTimers.get(itemId);
      clearInterval(timerData.intervalId); // Stop the interval
      this.activeTimers.delete(itemId); // Remove from active timers

      // Also reset the button's UI
      const taskItem = document.querySelector(
        `.task-item[data-item-id="${itemId}"]`
      );
      if (taskItem) {
        taskItem.classList.remove("timer-active");
        const timerBtn = taskItem.querySelector(".timer-btn span");
        if (timerBtn) timerBtn.textContent = "Start Timer";
        const timerDisplay = taskItem.querySelector(".timer-display");
        if (timerDisplay) timerDisplay.textContent = "00:00";
      }
    }
  }
  toggleTimer(itemId) {
    const taskItem = document.querySelector(
      `.task-item[data-item-id="${itemId}"]`
    );
    const timerBtn = taskItem.querySelector(".timer-btn span");
    const timerDisplay = taskItem.querySelector(".timer-display");

    // Check if a timer is already running for this item
    if (this.activeTimers.has(itemId)) {
      // --- STOP THE TIMER ---
      this.stopTimer(itemId);
    } else {
      // --- START THE TIMER ---
      taskItem.classList.add("timer-active");
      timerBtn.textContent = "Stop Timer";

      const startTime = Date.now();

      const intervalId = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, "0");
        const seconds = String(elapsedTime % 60).padStart(2, "0");
        timerDisplay.textContent = `${minutes}:${seconds}`;
      }, 1000);

      // Store the timer's data so we can stop it later
      this.activeTimers.set(itemId, { intervalId, startTime });
    }
  }
  async scheduleItem(itemId) {
    const itemData = this.data.items.find((i) => i.id === itemId);
    if (!itemData) return;

    // 1. Get the desired date and time from the user
    // const scheduleTime = prompt(
    //   `When do you want to schedule "${itemData.text}"?\n\ne.g., "tomorrow at 3pm" or "Aug 15 at 10:00"`
    // );

    // if (!scheduleTime) return;

    // --- IMPORTANT ---
    // The next step is to convert the user's text (e.g., "tomorrow at 3pm")
    // into a specific date. In a real app, you would use a date-parsing library
    // like `date-fns` or an API call.
    // For this example, we'll simulate it by creating a date for the next day.

    const now = new Date();
    const eventDate = new Date(now);
    eventDate.setDate(now.getDate() + 1); // Set to tomorrow
    eventDate.setHours(15, 0, 0, 0); // Set to 3:00 PM

    const startTime = eventDate;
    // Set end time 1 hour later for this example
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // 2. Format dates into the required Google Calendar format (YYYYMMDDTHHMMSSZ)
    // The 'Z' indicates UTC time.
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d{3}/g, "");

    // 3. Build the Google Calendar URL
    const params = new URLSearchParams();
    params.append("action", "TEMPLATE");
    params.append("text", itemData.text); // Event Title
    params.append(
      "details",
      `Task ID: ${itemData.id}\nEstimated Time: ${
        itemData.timeToComplete || "Not set"
      }`
    );
    params.append("dates", `${formatDate(startTime)}/${formatDate(endTime)}`);
    params.append("ctz", "UTC"); // Specify Timezone as UTC

    const googleCalendarUrl = `https://www.google.com/calendar/render?${params.toString()}`;

    // 4. Open the link in a new tab. This triggers the app on mobile.
    window.open(googleCalendarUrl, "_blank");
  }
  toggleTaskExpansion(itemId) {
    const previouslyExpandedId = this.expandedItemId;

    // Collapse the previously open item if there is one
    if (previouslyExpandedId && previouslyExpandedId !== itemId) {
      const prevItemEl = document.querySelector(
        `.task-item[data-item-id="${previouslyExpandedId}"]`
      );
      if (prevItemEl) prevItemEl.classList.remove("expanded");
    }

    // Toggle the current item
    const currentItemEl = document.querySelector(
      `.task-item[data-item-id="${itemId}"]`
    );
    if (currentItemEl) {
      const isNowExpanded = currentItemEl.classList.toggle("expanded");
      this.expandedItemId = isNowExpanded ? itemId : null;
    }
  }

  markItemComplete(itemId) {
    if (this.completedItems.has(itemId)) return;
    this.stopTimer(itemId);

    this.completedItems.set(itemId, Date.now());
    const itemElement = document.querySelector(
      `.task-item[data-item-id="${itemId}"]`
    );
    if (!itemElement) return;
    // Collapse the actions before animating
    itemElement.classList.remove("expanded");
    this.expandedItemId = null;

    const fillBg = itemElement.querySelector(".task-fill-bg");
    const completedOverlay = itemElement.querySelector(
      ".task-completed-overlay"
    );

    anime
      .timeline({
        easing: "easeOutExpo",
        duration: 800,
        complete: () => {
          // After animation, add the final completed class which disables pointer events
          itemElement.classList.add("completed");
        },
      })
      .add({
        // The energy fill animation
        targets: fillBg,
        width: "100%",
        duration: 600,
      })
      .add(
        {
          // Fade in the "Completed" overlay
          targets: completedOverlay,
          opacity: [0, 1],
          scale: [0.8, 1],
          easing: "easeOutElastic(1, .8)",
          duration: 700,
        },
        "-=400"
      ); // Overlap with the fill animation

    this.updateProgressUI();
    // this.addTapAnimation(itemElement);
    if (this.completedItems.size === this.data.items.length) {
      document.getElementById("card-display-area").scrollTo({
        top: 0,
        behavior: "smooth",
      });
      this.triggerCompletionCelebration();
    }
  }

  updateProgressUI() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const totalItems = this.data.items.length;
    const completedCount = this.completedItems.size;
    const remainingCount = totalItems - completedCount;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    // Selectors for the new stat values
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

    // Update the text content of the new stat boxes
    if (statTaken) statTaken.textContent = completedCount;
    if (statRemaining) statRemaining.textContent = remainingCount;
    if (statProgress) statProgress.textContent = `${Math.round(progress)}%`;

    // Animate the progress bar width
    if (progressBar) {
      anime({
        targets: progressBar,
        width: `${progress}%`,
        duration: 600,
        easing: "easeOutQuad",
      });
    }
  }

  // The main updateUI method is now only needed for major resets
  updateUI() {
    const cardSetElement = document.getElementById(`card-${this.data.id}`);
    if (cardSetElement) {
      const mainAppContainer = document.getElementById("card-display-area");
      mainAppContainer.innerHTML = this.render();
      lucide.createIcons();
      this.attachEventListeners();
    }
  }
  addTapAnimation(el) {
    const itemDim = el.getBoundingClientRect(),
      itemSize = {
        x: itemDim.right - itemDim.left,
        y: itemDim.bottom - itemDim.top,
      },
      shapes = ["line", "zigzag"],
      colors = ["#2FB5F3", "#FF0A47", "#FF0AC2", "#47FF0A"];
    const chosenC = Math.floor(Math.random() * colors.length),
      chosenS = Math.floor(Math.random() * shapes.length);
    const burst = new mojs.Burst({
      left: itemDim.left + itemSize.x / 2,
      top: itemDim.top + itemSize.y / 2,
      radiusX: itemSize.x,
      radiusY: itemSize.y,
      count: 8,

      children: {
        shape: shapes[chosenS],
        radius: 10,
        scale: { 0.8: 1 },
        fill: "none",
        points: 7,
        stroke: colors[chosenC],
        strokeDasharray: "100%",
        strokeDashoffset: { "-100%": "100%" },
        duration: 350,
        delay: 100,
        easing: "quad.out",
        isShowEnd: false,
      },
    });
    burst.play();
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
        // --- THE FIX IS HERE: REMOVED THE QUOTES ---
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
