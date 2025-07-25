class FlashCard extends CardComponent {
  constructor(data) {
    super(data);
    this.completedCards = new Set();
  }

  render() {
    const totalCards = this.data.cards.length;
    const completedCount = this.completedCards.size;
    const progress = totalCards > 0 ? (completedCount / totalCards) * 100 : 0;

    return `
            <div class="card flashcard-set" id="card-${this.data.id}">
                <div class="card-content">
                    <div class="flashcard-set-header">
                        <h2 class="card-title">${this.data.title}</h2>
                        <p class="card-subtitle">${this.data.subtitle}</p>
                        <div class="progress-container">
                            <div class="progress-info">
                                <span>Progress</span>
                                <span>${completedCount}/${totalCards}</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fg" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="flashcard-grid">
                        ${this.data.cards
                          .map((card, index) =>
                            this.renderGridItem(card, index)
                          )
                          .join("")}
                    </div>
                </div>
                <div class="flashcard-summary">
                    <div class="summary-item"><strong>${completedCount}</strong><span>Actions Taken</span></div>
                    <div class="summary-item"><strong>${
                      totalCards - completedCount
                    }</strong><span>Remaining</span></div>
                    <div class="summary-item"><strong>${Math.round(
                      progress
                    )}%</strong><span>Progress</span></div>
                </div>
                <div class="flashcard-modal-overlay"></div>
            </div>
        `;
  }

  renderGridItem(card, index) {
    const isCompleted = this.completedCards.has(card.id);
    return `
            <div class="flashcard-grid-item ${
              isCompleted ? "completed" : ""
            }" data-index="${index}">
                <div class="grid-item-header">
                    <i class="fas fa-shield-halved"></i>
                    <span>${card.step}</span>
                </div>
                <h3>${card.front.title}</h3>
                <div class="grid-item-footer">
                    <i class="fas fa-lightbulb"></i>
                    <span>Tap to open</span>
                </div>
            </div>
        `;
  }

  renderModalContent(index) {
    const card = this.data.cards[index];
    const isCompleted = this.completedCards.has(card.id);
    return `
            <div class="flashcard-modal-content">
                <div class="flashcard-flipper">
                    <div class="flashcard-front">
                        <div class="card-header-info">
                            <span>${card.step}</span>
                            <span><i class="far fa-clock"></i> ${
                              card.duration
                            }</span>
                        </div>
                        <h3>${card.front.title}</h3>
                        <p>${card.front.description}</p>
                        <div class="card-footer-hint">${card.front.hint}</div>
                    </div>
                    <div class="flashcard-back">
                         <!-- <div class="card-header-info"><span>Action Step</span></div> -->
                        <h3>${card.back.title}</h3>
                        <p>${card.back.description}</p>
                        <button class="complete-action-btn" data-id="${
                          card.id
                        }" ${isCompleted ? "disabled" : ""}>
                            ${
                              isCompleted
                                ? '<i class="fas fa-check"></i> Completed'
                                : "I've Done This"
                            }
                        </button>
                    </div>
                </div>
            </div>
            <button class="close-modal-btn">&times;</button>
        `;
  }

  attachEventListeners() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    componentRoot.addEventListener("click", (e) => {
      const gridItem = e.target.closest(".flashcard-grid-item");
      if (gridItem && !gridItem.classList.contains("is-animating")) {
        this.openCard(gridItem);
      }
    });
  }

  openCard(gridItem) {
    const index = parseInt(gridItem.dataset.index, 10);
    const modalOverlay = document.querySelector(".flashcard-modal-overlay");
    modalOverlay.innerHTML = this.renderModalContent(index);

    const modalContent = modalOverlay.querySelector(".flashcard-modal-content");
    const startRect = gridItem.getBoundingClientRect();

    const finalWidth = Math.min(window.innerWidth * 0.9, 400);
    const finalHeight = Math.min(window.innerHeight * 0.6, 500);

    const scaleX = startRect.width / finalWidth;
    const scaleY = startRect.height / finalHeight;

    const translateX =
      startRect.left + startRect.width / 2 - window.innerWidth / 2;
    const translateY =
      startRect.top + startRect.height / 2 - window.innerHeight / 2;

    modalContent.style.setProperty(
      "--start-transform",
      `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scaleX}, ${scaleY})`
    );

    gridItem.style.opacity = "0";
    gridItem.classList.add("is-animating");
    modalOverlay.style.display = "block";

    requestAnimationFrame(() => {
      modalContent.classList.add("animate-in");
    });

    this.attachModalListeners(modalOverlay, gridItem);
  }

  closeCard(modalOverlay, gridItem) {
    const modalContent = modalOverlay.querySelector(".flashcard-modal-content");
    modalContent.classList.remove("animate-in");

    // --- THIS IS THE FIX ---
    // Use a reliable setTimeout matching the CSS transition duration (400ms)
    // to clean up the animation state.
    setTimeout(() => {
      modalOverlay.style.display = "none";
      modalOverlay.innerHTML = "";
      gridItem.style.opacity = "1";
      gridItem.classList.remove("is-animating");
    }, 400);
  }

  attachModalListeners(modalOverlay, gridItem) {
    const flipper = modalOverlay.querySelector(".flashcard-flipper");

    const handleClose = () => {
      this.closeCard(modalOverlay, gridItem);
    };

    const handleComplete = (e) => {
      const btn = e.target.closest(".complete-action-btn");
      if (btn && !btn.disabled) {
        this.completedCards.add(btn.dataset.id);
        // No need to call updateUI here, just close the card.
        // The main view will be correct when it's next rendered.
        handleClose();
      }
    };

    const handleFlip = (e) => {
      if (!e.target.closest(".complete-action-btn")) {
        flipper.classList.toggle("flipped");
      }
    };

    const clickHandler = (e) => {
      if (
        e.target === modalOverlay ||
        e.target.classList.contains("close-modal-btn")
      ) {
        handleClose();
      }
      if (e.target.closest(".flashcard-flipper")) handleFlip(e);
      if (e.target.closest(".complete-action-btn")) handleComplete(e);
    };

    modalOverlay.addEventListener("click", clickHandler);

    // A small change to the close logic to re-render the UI after closing
    // This ensures the progress bars and stats are always up to date.
    const originalCloseCard = this.closeCard;
    this.closeCard = (overlay, gridEl) => {
      originalCloseCard(overlay, gridEl);
      // After the animation is done, re-render the whole component
      // to ensure the grid item shows its 'completed' state correctly.
      setTimeout(() => this.updateUI(), 410);
    };
  }

  updateUI() {
    const cardSetElement = document.getElementById(`card-${this.data.id}`);
    if (cardSetElement) {
      const mainAppContainer = document.getElementById("card-display-area");
      mainAppContainer.innerHTML = this.render();
      this.attachEventListeners();
    }
  }
}
