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

    // The chip is now inside a new "item-content" wrapper
    return `
      <li class="checklist-item ${
        isCompleted ? "completed" : ""
      }" data-item-id="${item.id}">
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
      this.triggerConfetti();
    }
  }

  updateItemUI(itemId) {
    const itemElement = document.querySelector(
      `.checklist-item[data-item-id="${itemId}"]`
    );
    if (!itemElement) return;

    const isCompleted = this.completedItems.has(itemId);
    itemElement.classList.toggle("completed", isCompleted);

    const checkbox = itemElement.querySelector(".custom-checkbox");
    const chip = itemElement.querySelector(".complete-chip");

    if (isCompleted) {
      checkbox.innerHTML = '<i data-lucide="check"></i>';

      // NEW: Update the chip with the formatted timestamp
      const timestamp = this.completedItems.get(itemId);
      chip.textContent = `Done: ${this.formatTimestamp(timestamp)}`;

      const checkIcon = checkbox.querySelector("svg");
      if (checkIcon) {
        anime({
          targets: checkIcon,
          scale: [0.5, 1],
          duration: 300,
          easing: "easeOutBack",
        });
      }
    } else {
      checkbox.innerHTML = "";
    }

    lucide.createIcons();
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

  triggerConfetti() {
    // First, ensure the library has been loaded
    if (typeof confetti !== "function") {
      console.error("Confetti library is not loaded!");
      return;
    }

    // A modern, Duolingo-style color palette
    const beautifulColors = [
      "#5DADE2",
      "#F7DC6F",
      "#76D7C4",
      "#F1948A",
      "#BB8FCE",
    ];

    // Function to fire a burst of confetti
    const fire = (particleRatio, opts) => {
      confetti(
        Object.assign(
          {},
          {
            origin: { y: 0.6 }, // Start slightly below the top
            particleCount: Math.floor(200 * particleRatio),
            spread: 120, // How wide the confetti spreads
            gravity: 0.8, // How fast it falls
            scalar: 1.1, // How big the particles are
            ticks: 150, // How long the particles stay on screen
            colors: beautifulColors,
            shapes: ["square", "circle"],
          },
          opts
        )
      );
    };

    // Fire multiple bursts for a more dynamic effect
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }
}
