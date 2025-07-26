class Checklist extends CardComponent {
  constructor(data) {
    super(data);
    this.completedItems = new Map(
      data.items
        .filter((item) => item.completed)
        .map((item) => [item.id, Date.now()]) // Store with a timestamp
    );
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
    const checkbox = itemElement.querySelector(".custom-checkbox");
    const chip = itemElement.querySelector(".complete-chip");

    // --- NEW: Read the color values from CSS first ---
    const computedStyle = getComputedStyle(document.body);
    const successColor = computedStyle
      .getPropertyValue("--accent-success-dark")
      .trim();
    const defaultBorderColor = computedStyle
      .getPropertyValue("--border-color")
      .trim();

    const timeline = anime.timeline({
      duration: 400,
      easing: "easeOutExpo",
    });

    if (isCompleted) {
      itemElement.classList.add("completed");
      checkbox.innerHTML = '<i data-lucide="check"></i>';
      lucide.createIcons();
      const checkIcon = checkbox.querySelector("svg");

      timeline
        .add({
          targets: checkbox,
          // --- Use the concrete color value instead of the variable ---
          backgroundColor: successColor,
          borderColor: successColor,
          borderBottomWidth: "2px",
          transform: "translateY(2px)",
          duration: 200,
        })
        .add(
          {
            targets: checkIcon,
            scale: [0.5, 1],
            rotate: "360deg",
            easing: "easeOutBack",
          },
          "-=300"
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
      itemElement.classList.remove("completed");
      this.triggerUncheckParticles(checkbox);

      timeline
        .add({
          targets: checkbox,
          backgroundColor: "#FFFFFF",
          // --- Use the concrete color value here too ---
          borderColor: defaultBorderColor,
          borderBottomWidth: "4px",
          transform: "translateY(0px)",
          duration: 200,
        })
        .add(
          {
            targets: checkbox.querySelector("svg"),
            scale: 0,
            rotate: "-360deg",
            easing: "easeInBack",
            duration: 300,
            complete: () => {
              checkbox.innerHTML = "";
            },
          },
          "-=400"
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
    // We target the main card element now, not just the header
    const cardElement = document.getElementById(`card-${this.data.id}`);
    const header = cardElement.querySelector(".checklist-progress-header");
    if (!cardElement || !header) return;

    const celebrationContainer = document.createElement("div");
    celebrationContainer.classList.add("celebration-container");
    // Append to the main card so it doesn't affect the header's layout
    cardElement.appendChild(celebrationContainer);

    // Calculate the origin point to be the center of the header
    const headerRect = header.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();
    const originX = headerRect.left - cardRect.left + headerRect.width / 2;
    const originY = headerRect.top - cardRect.top + headerRect.height / 2;

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");
      // Position the particle at the calculated origin before animating
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.backgroundColor = `hsl(${anime.random(
        190,
        230
      )}, 100%, 70%)`;
      particle.style.width = `${anime.random(5, 15)}px`;
      particle.style.height = particle.style.width;
      celebrationContainer.appendChild(particle);

      anime({
        targets: particle,
        translateX: anime.random(-150, 150),
        translateY: anime.random(-100, 100),
        scale: [0, 1, 0],
        opacity: [1, 0],
        duration: anime.random(800, 1200),
        easing: "easeOutExpo",
        complete: () => celebrationContainer.removeChild(particle),
      });
    }

    anime({
      targets: header,
      scale: [1, 1.05, 1],
      duration: 600,
      easing: "easeInOutSine",
    });

    // Clean up the main container after the animation is well over
    setTimeout(() => {
      if (cardElement.contains(celebrationContainer)) {
        cardElement.removeChild(celebrationContainer);
      }
    }, 2000);
  }
}
