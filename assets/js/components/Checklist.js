class Checklist extends CardComponent {
  constructor(data) {
    super(data);
    this.completedItems = new Map(
      data.items
        .filter((item) => item.completed)
        .map((item) => [item.id, Date.now()]) // Store with a timestamp
    );
    this.completionSound = new Audio("../../../assets/sounds/sucess.mp3");
  }
  resetState() {
    this.completedItems.clear();
    this.updateUI(); // This will re-render and clear the view
  }
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  render() {
    const totalItems = this.data.items.length;
    const completedCount = this.completedItems.size;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    return `
            <div class="card checklist" id="card-${this.data.id}">
                <div class="card-content">
                    <h2 class="card-title">${this.data.title}</h2>
                    <p class="card-subtitle">${this.data.subtitle}</p>

                    <div class="checklist-progress-header">
                        <div class="progress-header-top">
                            <i data-lucide="book-open"></i>
                            <span>Development Progress</span>
                            <span class="progress-counter">${completedCount}/${totalItems}</span>
                            <button class="reset-btn"><i data-lucide="rotate-cw"></i></button>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fg" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-header-bottom">
                            <span>${Math.round(progress)}% Complete</span>
                            <span>Building foundational understanding</span>
                        </div>
                    </div>

                    <ul class="checklist-list">
                        ${this.data.items
                          .map((item) => this.renderListItem(item))
                          .join("")}
                    </ul>
                </div>
            </div>
        `;
  }

  renderListItem(item) {
    const isCompleted = this.completedItems.has(item.id);
    const checkIcon = isCompleted ? '<i data-lucide="check"></i>' : "";

    return `
      <li class="checklist-item ${
        isCompleted ? "completed" : ""
      }" data-item-id="${item.id}">
          <div class="item-fill-bg"></div>
          <div class="custom-checkbox">
              ${checkIcon}
          </div>
          <div class="item-content">
              <label>${item.text}</label>
              <span class="complete-chip"></span>
          </div>
      </li>
    `;
  }

  attachEventListeners() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    // Listen for clicks on the list itself
    componentRoot
      .querySelector(".checklist-list")
      .addEventListener("click", (e) => {
        const item = e.target.closest(".checklist-item");
        if (item) {
          this.toggleItemState(item.dataset.itemId);
        }
      });

    // Add confirmation to the reset button
    componentRoot.querySelector(".reset-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to reset your progress?")) {
        this.completedItems.clear();
        this.updateUI(); // Full update is fine for a total reset
      }
    });
  }
  toggleItemState(itemId) {
    if (this.completedItems.has(itemId)) {
      this.completedItems.delete(itemId);
    } else {
      // When adding, also store the current time as the timestamp
      this.completedItems.set(itemId, Date.now());
    }

    this.updateItemUI(itemId);
    this.updateProgressUI();

    if (
      this.completedItems.size === this.data.items.length &&
      this.data.items.length > 0
    ) {
      this.triggerCompletionCelebration();
    }
  }

  updateItemUI(itemId) {
    const itemElement = document.querySelector(
      `.checklist-item[data-item-id="${itemId}"]`
    );
    if (!itemElement) return;

    const isCompleted = this.completedItems.has(itemId);
    const fillBg = itemElement.querySelector(".item-fill-bg");
    const checkbox = itemElement.querySelector(".custom-checkbox");
    const chip = itemElement.querySelector(".complete-chip");

    const computedStyle = getComputedStyle(document.body);
    const successColor = computedStyle
      .getPropertyValue("--accent-success-dark")
      .trim();
    const defaultBorderColor = computedStyle
      .getPropertyValue("--border-color")
      .trim();

    const timeline = anime.timeline({
      duration: 600, // Slightly longer duration for a smoother feel
      easing: "easeOutQuint",
    });

    if (isCompleted) {
      itemElement.classList.add("completed");
      checkbox.innerHTML = '<i data-lucide="check"></i>';
      lucide.createIcons();
      const checkIcon = checkbox.querySelector("svg");

      // Trigger the particle burst
      this.triggerFillParticles(itemElement);

      timeline
        .add({
          // 1. Animate the background fill
          targets: fillBg,
          width: "100%",
        })
        .add(
          {
            // 2. Animate the 3D checkbox press
            targets: checkbox,
            backgroundColor: successColor,
            borderColor: successColor,
            borderBottomWidth: "2px",
            transform: "translateY(2px)",
            duration: 200,
          },
          "-=600"
        ) // Overlap completely with the fill
        .add(
          {
            // 3. Animate the checkmark icon pop
            targets: checkIcon,
            scale: [0, 1],
            rotate: "360deg",
            easing: "spring(1, 80, 10, 0)", // A bouncy spring animation
          },
          "-=450"
        )
        .add(
          {
            begin: () => {
              const timestamp = this.completedItems.get(itemId);
              chip.textContent = `Done: ${this.formatTimestamp(timestamp)}`;
            },
          },
          "-=300"
        );
    } else {
      // UN-CHECKING
      itemElement.classList.remove("completed");
      this.triggerUncheckParticles(checkbox); // Keep the un-check poof

      timeline
        .add({
          targets: fillBg, // Animate the fill away
          width: "0%",
          easing: "easeInQuint",
        })
        .add(
          {
            // Release the 3D checkbox
            targets: checkbox,
            backgroundColor: "#FFFFFF",
            borderColor: defaultBorderColor,
            borderBottomWidth: "4px",
            transform: "translateY(0px)",
            duration: 200,
          },
          "-=600"
        )
        .add(
          {
            // Hide the checkmark icon
            targets: checkbox.querySelector("svg"),
            scale: 0,
            rotate: "-360deg",
            easing: "easeInBack",
            duration: 300,
            complete: () => {
              checkbox.innerHTML = "";
            },
          },
          "-=600"
        );
    }
  }
  updateProgressUI() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const totalItems = this.data.items.length;
    const completedCount = this.completedItems.size;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    const counter = componentRoot.querySelector(".progress-counter");
    const progressBar = componentRoot.querySelector(".progress-bar-fg");
    const percentageText = componentRoot.querySelector(
      ".progress-header-bottom span:first-child"
    );

    if (counter) counter.textContent = `${completedCount}/${totalItems}`;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (percentageText)
      percentageText.textContent = `${Math.round(progress)}% Complete`;
  }
  triggerFillParticles(itemElement) {
    const container = document.createElement("div");
    container.classList.add("fill-particle-container");
    itemElement.appendChild(container);

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.classList.add("fill-particle");
      container.appendChild(particle);

      anime({
        targets: particle,
        translateX: [0, anime.random(60, 120)], // Move horizontally
        translateY: [0, anime.random(-20, 20)], // Slight vertical spread
        scale: [anime.random(0.5, 1.2), 0],
        opacity: [1, 0],
        duration: anime.random(400, 700),
        easing: "easeOutQuad",
        complete: () => container.removeChild(particle),
      });
    }

    setTimeout(() => {
      if (itemElement.contains(container)) {
        itemElement.removeChild(container);
      }
    }, 1000);
  }
  triggerUncheckParticles(checkboxElement) {
    const container = document.createElement("div");
    container.classList.add("particle-container");
    checkboxElement.appendChild(container);

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement("div");
      particle.classList.add("uncheck-particle");
      container.appendChild(particle);

      anime({
        targets: particle,
        translateX: anime.random(-30, 30),
        translateY: anime.random(-30, 30),
        scale: [anime.random(0.5, 1), 0],
        opacity: [1, 0],
        duration: anime.random(400, 600),
        easing: "easeOutExpo",
        complete: () => {
          // Check if the particle still exists before removing
          if (container.contains(particle)) {
            container.removeChild(particle);
          }
        },
      });
    }

    // Clean up the container after a short delay
    setTimeout(() => {
      // Check if the container still exists before removing
      if (checkboxElement.contains(container)) {
        checkboxElement.removeChild(container);
      }
    }, 1000);
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
