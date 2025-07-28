class Checklist extends CardComponent {
  constructor(data) {
    super(data);
    this.interactionId = data.interactionId;
    this.completedItems = new Map(
      data.tasks
        .filter((item) => item.completed)
        .map((item) => [item.task, Date.now()])
    );
    this.completionSound = new Audio("../../../assets/sounds/sucess.mp3");
    this.taskSound = new Audio("../../../assets/sounds/task.mp3");
    this.taskGradients = this.generateGradients(data.tasks);
  }

  generateGradients(tasks) {
    const gradientColors = [
      ["#B2EBF2", "#4DD0E1"], // soft aqua
      ["#C8E6C9", "#81C784"], // fresh minty green
      ["#E1BEE7", "#BA68C8"], // soft purple with more depth
      ["#FFF59D", "#FFD54F"], // pastel yellow with warmth
      ["#FFCCBC", "#FFAB91"], // gentle peach-orange
      ["#BBDEFB", "#64B5F6"], // light blue with clarity
    ];
    return tasks.map(() => {
      const colors =
        gradientColors[Math.floor(Math.random() * gradientColors.length)];
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    });
  }

  async handleGetNewTask() {
    const queryInput = document.getElementById("new-task-query");
    const more_qry = queryInput.value.trim();

    if (!more_qry) {
      console.error("Please enter a prompt for the new task.");
      return;
    }

    const current_data = this.data.tasks
      .map((task) => task.action_to_take)
      .join(". ");

    if (!current_data) {
      console.error("Please describe the task or context.");
      // A visual error indication could be added here later
      return;
    }

    const saveBtn = document.getElementById("save-task-btn");
    saveBtn.textContent = "Generating...";
    saveBtn.disabled = true;

    const newTaskData = await ApiService.getNewChecklistTask({
      interactionId: this.interactionId,
      current_data: current_data,
      more_qry: more_qry,
    });

    if (newTaskData) {
      this.data.tasks.push(newTaskData);
      this.taskGradients = this.generateGradients(this.data.tasks);
      this.toggleBottomSheet(false);
      this.updateUI();
    } else {
      console.error("Failed to get a new task from the API.");
    }

    saveBtn.textContent = "Suggest Task";
    saveBtn.disabled = false;
  }

  // --- ✨ NEW METHOD: Toggles the bottom sheet visibility ---
  toggleBottomSheet(show) {
    const overlay = document.getElementById("bottom-sheet-overlay");
    if (overlay) {
      if (show) {
        overlay.classList.add("show");
        document.getElementById("new-task-query").value = "";
        document.getElementById("new-task-query").focus();
      } else {
        overlay.classList.remove("show");
      }
    }
  }

  applyProgress(progressData) {
    if (!progressData || !progressData.items) {
      console.warn("Checklist: Invalid progress data, cannot apply history.");
      return;
    }
    this.completedItems.clear();
    progressData.items.forEach((item) => {
      if (item.checked) {
        this.completedItems.set(item.item_id, Date.now());
      }
    });
    this.updateUI();
  }

  syncProgressWithApi() {
    if (!this.interactionId) {
      console.warn(
        "Checklist: interactionId is missing, cannot sync progress."
      );
      return;
    }
    const itemsPayload = this.data.tasks.map((item) => ({
      item_id: item.task,
      checked: this.completedItems.has(item.task),
    }));
    const isCompleted = this.completedItems.size === this.data.tasks.length;
    const payload = {
      userId: localStorage.getItem("user_id"),
      appId: localStorage.getItem("app_id"),
      interactionId: this.interactionId,
      items: itemsPayload,
      completed: isCompleted,
    };
    ApiService.updateChecklistActivity(payload);
  }

  resetState() {
    this.completedItems.clear();
    this.updateUI();
    this.syncProgressWithApi();
  }

  adjustFlipperHeight(flipperElement) {
    const container = flipperElement.closest(".task-item-container-v2");
    if (!container) return;

    const frontFace = flipperElement.querySelector(".task-card-front-v2");
    const backFace = flipperElement.querySelector(".task-card-back-v2");

    flipperElement.style.transition = "none";
    flipperElement.classList.add("is-measuring");

    const frontHeight = frontFace.scrollHeight;
    const backHeight = backFace.scrollHeight;

    const maxHeight = Math.max(frontHeight, backHeight);
    container.style.height = `${maxHeight + 16}px`;

    flipperElement.classList.remove("is-measuring");
    flipperElement.style.transition = "";
  }

  render() {
    const totalItems = this.data.tasks.length;
    const completedCount = this.completedItems.size;
    const remainingCount = totalItems - completedCount;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    return `
      <div class="card checklist" id="card-checklist">
        <div class="card-content">
          <div class="deck-info">
            <h4 class="deck-title">${this.data.title}</h4>
            <p class="deck-subtitle">${this.data.subtitle}</p>
          </div>
          <div class="checklist-progress-header">
            <button class="reset-btn"><i data-lucide="rotate-cw"></i></button>
            <div class="header-stats">
              <div class="stat-box"><span class="stat-value stat-taken">${completedCount}</span><span class="stat-label">Actions Taken</span></div>
              <div class="stat-box"><span class="stat-value stat-remaining">${remainingCount}</span><span class="stat-label">Remaining</span></div>
            </div>
            <div class="segmented-progress-bar">
              ${Array(totalItems)
                .fill("")
                .map(
                  (_, i) =>
                    `<div class="progress-segment ${
                      i < completedCount ? "active" : ""
                    }"></div>`
                )
                .join("")}
            </div>
            <p class="progress-percentage-text">${Math.round(
              progress
            )}% Complete</p>
          </div>
          <ul class="task-list-v2">
            ${this.data.tasks
              .map((item, index) => this.renderListItem(item, index))
              .join("")}
          </ul>
          <button class="add-task-btn" id="add-task-btn">
            <i data-lucide="plus"></i>
            <span>Make yours ✨</span>
          </button>
        </div>
        <div class="bottom-sheet-overlay" id="bottom-sheet-overlay">
            <div class="bottom-sheet">
                <div class="bottom-sheet-header">
                    <h3>Want to create a custom task?</h3>
                    <button class="close-sheet-btn" id="close-sheet-btn"><i data-lucide="x"></i></button>
                </div>
                <div class="bottom-sheet-content">
                    <div class="form-group">
                        <label for="new-task-query">What do you have in mind?</label>
                        <input type="text" id="new-task-query" placeholder="Write what's on your mind, set a goal, plan something fun...">
                    </div>
                    <button class="save-task-btn" id="save-task-btn">Surprise me✨</button>
                </div>
            </div>
        </div>
      </div>
    `;
  }

  renderListItem(item, index) {
    const isCompleted = this.completedItems.has(item.task);
    const timeStr = item.time || "";
    const showScheduleBtn =
      timeStr &&
      !timeStr.toLowerCase().includes("minute") &&
      !timeStr.toLowerCase().includes("hour");
    const backgroundStyle = `style="background-image: ${this.taskGradients[index]}"`;

    return `
      <li class="task-item-container-v2 ${
        isCompleted ? "completed" : ""
      }" data-item-id="${item.task}">
        <div class="task-card-flipper-v2">
          <div class="task-card-front-v2" ${backgroundStyle}>
            <div class="task-content-v2">
              <div class="task-checkbox-v2">
                <input type="checkbox" id="checkbox-${
                  item.task
                }" class="complete-checkbox-v2" ${isCompleted ? "checked" : ""}>
                <label for="checkbox-${
                  item.task
                }" class="complete-checkbox-label-v2"><i data-lucide="check"></i></label>
              </div>
              <div class="task-info-v2">
                <div class="task-title-v2">${item.task}</div>
                <p class="task-text-v2">${item.action_to_take}</p>
              </div>
              ${timeStr ? `<div class="time-chip-v2">${timeStr}</div>` : ""}
            </div>
            <div class="task-footer-v2">
                ${
                  showScheduleBtn
                    ? `<button class="action-btn-v2 schedule-btn-v2"><i data-lucide="calendar-plus"></i> Schedule</button>`
                    : "<div></div>"
                }
                <button class="flip-btn-v2"><i data-lucide="chevron-right"></i></button>
            </div>
          </div>
          <div class="task-card-back-v2" ${backgroundStyle}>
            <div class="back-content-v2">
              <h4>Why this task is important</h4>
              <p>${item.why_this_task || "No details provided."}</p>
              ${
                item.statistic
                  ? `<div class="statistic-box-v2"><i data-lucide="trending-up"></i><span>${item.statistic}</span></div>`
                  : ""
              }
            </div>
            <button class="flip-btn-v2 back"><i data-lucide="arrow-left"></i></button>
          </div>
        </div>
      </li>
    `;
  }

  attachEventListeners() {
    const componentRoot = document.getElementById(`card-checklist`);
    if (!componentRoot) return;

    // --- ✨ NEW: Event listeners for the bottom sheet ---
    const addTaskBtn = document.getElementById("add-task-btn");
    const closeSheetBtn = document.getElementById("close-sheet-btn");
    const overlay = document.getElementById("bottom-sheet-overlay");
    const saveTaskBtn = document.getElementById("save-task-btn");

    if (addTaskBtn)
      addTaskBtn.addEventListener("click", () => this.toggleBottomSheet(true));
    if (closeSheetBtn)
      closeSheetBtn.addEventListener("click", () =>
        this.toggleBottomSheet(false)
      );
    if (overlay)
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.toggleBottomSheet(false);
      });
    if (saveTaskBtn)
      saveTaskBtn.addEventListener("click", () => this.handleGetNewTask());

    // --- The rest of your event listeners ---
    const taskList = componentRoot.querySelector(".task-list-v2");
    taskList.addEventListener("click", (e) => {
      const taskItem = e.target.closest(".task-item-container-v2");
      if (!taskItem || taskItem.classList.contains("completed")) return;
      const itemId = taskItem.dataset.itemId;
      const flipper = taskItem.querySelector(".task-card-flipper-v2");
      if (e.target.closest(".complete-checkbox-label-v2")) {
        e.preventDefault();
        this.markItemComplete(itemId);
      } else if (e.target.closest(".schedule-btn-v2")) {
        e.stopPropagation();
        this.scheduleItem(itemId);
      } else {
        flipper.classList.toggle("is-flipped");
      }
    });
    componentRoot
      .querySelectorAll(".task-card-flipper-v2")
      .forEach((flipper) => {
        this.adjustFlipperHeight(flipper);
      });
    const firstTask = taskList.querySelector(
      ".task-item-container-v2:not(.completed)"
    );
    if (firstTask) {
      setTimeout(() => {
        firstTask.classList.add("wiggle");
        setTimeout(() => firstTask.classList.remove("wiggle"), 1500);
      }, 100);
    }
    componentRoot.querySelector(".reset-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.resetState();
    });
  }
  triggerTaskCompletionParticles(taskElement) {
    if (!window.anime) return;

    const container = document.createElement("div");
    container.className = "task-particle-container";
    taskElement.appendChild(container);

    const colors = ["#A8D0E6", "#F7D4A2", "#84DCC6", "#FFAAA5", "#A3A8E6"];

    // ✨ INCREASED particle count from 20 to 30
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "task-particle";
      particle.style.backgroundColor =
        colors[anime.random(0, colors.length - 1)];
      container.appendChild(particle);

      anime({
        targets: particle,
        // ✨ INCREASED travel distance for a bigger burst
        translateX: anime.random(-90, 90),
        translateY: anime.random(-90, 90),
        // ✨ MODIFIED scale to pop in and then fade out
        scale: [
          { value: anime.random(1, 1.5), duration: 400, easing: "easeOutQuad" },
          { value: 0, duration: 600, easing: "easeInQuad" },
        ],
        opacity: [
          { value: 1, duration: 400 },
          { value: 0, duration: 600 },
        ],
        // ✨ INCREASED duration for a slightly longer effect
        duration: anime.random(1000, 1400),
        easing: "easeOutExpo",
        complete: () => {
          if (container.contains(particle)) {
            container.removeChild(particle);
          }
        },
      });
    }

    // Clean up the container after the animation is done
    setTimeout(() => {
      if (taskElement.contains(container)) {
        taskElement.removeChild(container);
      }
    }, 1600);
  }

  markItemComplete(itemId) {
    if (this.completedItems.has(itemId)) return;
    this.completedItems.set(itemId, Date.now());

    const itemElement = document.querySelector(
      `.task-item-container-v2[data-item-id="${itemId}"]`
    );
    if (itemElement) {
      this.triggerTaskCompletionParticles(itemElement);
      itemElement.classList.add("completed");
    }

    this.updateProgressUI();
    this.syncProgressWithApi();
    if (this.completedItems.size !== this.data.tasks.length) {
      this.taskSound.currentTime = 0;
      this.taskSound.play();
    }

    if (this.completedItems.size === this.data.tasks.length) {
      document
        .getElementById("card-display-area")
        .scrollTo({ top: 0, behavior: "smooth" });
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

  // --- ✨ REWRITTEN: updateProgressUI method for new elements ---
  updateProgressUI() {
    const componentRoot = document.getElementById(`card-checklist`);
    if (!componentRoot) return;
    const totalItems = this.data.tasks.length;
    const completedCount = this.completedItems.size;
    const remainingCount = totalItems - completedCount;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    // --- ✨ MODIFIED: Using class selectors instead of dynamic IDs ---
    const statTaken = componentRoot.querySelector(".stat-taken");
    const statRemaining = componentRoot.querySelector(".stat-remaining");
    const segmentedBar = componentRoot.querySelector(".segmented-progress-bar");
    const progressText = componentRoot.querySelector(
      ".progress-percentage-text"
    );

    if (statTaken) statTaken.textContent = completedCount;
    if (statRemaining) statRemaining.textContent = remainingCount;
    if (segmentedBar) {
      const segments = segmentedBar.querySelectorAll(".progress-segment");
      segments.forEach((segment, index) => {
        if (index < completedCount) {
          segment.classList.add("active");
        } else {
          segment.classList.remove("active");
        }
      });
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}% Complete`;
    }
  }

  updateUI() {
    const cardSetElement = document.getElementById(`card-checklist`);
    if (cardSetElement) {
      const mainAppContainer = document.getElementById("card-display-area");
      mainAppContainer.innerHTML = this.render();
      lucide.createIcons();
      this.attachEventListeners();
    }
  }

  triggerCompletionCelebration() {
    this.completionSound.play();

    // Ensure the <dotlottie-player> component is loaded
    if (typeof customElements.get("dotlottie-player") === "undefined") {
      console.error("DotLottie player not loaded.");
      return;
    }

    // Since the checklist is fully complete, we'll always use the "grand" celebration animation
    const lottiePath = "../../../assets/animations/Confetti-3.lottie";

    const lottiePlayer = document.createElement("dotlottie-player");
    lottiePlayer.src = lottiePath;
    lottiePlayer.setAttribute("autoplay", true);

    // Add styles to make the animation a full-screen overlay
    lottiePlayer.style.position = "fixed";
    lottiePlayer.style.top = "0";
    lottiePlayer.style.left = "0";
    lottiePlayer.style.width = "100%";
    lottiePlayer.style.height = "100%";
    lottiePlayer.style.zIndex = "9999";
    lottiePlayer.style.pointerEvents = "none";

    // Append to the body for the full-screen effect
    document.body.appendChild(lottiePlayer);

    // Add an event listener to automatically remove the player when it's done
    lottiePlayer.addEventListener("complete", () => {
      if (document.body.contains(lottiePlayer)) {
        document.body.removeChild(lottiePlayer);
      }
    });
  }
}
