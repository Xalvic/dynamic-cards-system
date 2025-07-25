class NewFlashCard extends CardComponent {
  constructor(data) {
    super(data);
    this.data = data; // Store original data
    this.resetState();
  }

  resetState() {
    this.currentIndex = 0;
    this.swipeHistory = [];
    this.favoritedCards = new Set();
    this.doneCards = new Set();
    this.notDoneCards = new Set();
  }

  render() {
    // --- THIS IS THE FIX for the results page ---
    // If all cards have been swiped, show the results screen
    if (this.currentIndex >= this.data.cards.length) {
      return this.renderResults();
    }

    const canRecall = this.swipeHistory.length > 0;

    return `
            <div class="card new-flashcard-set" id="card-${this.data.id}">
                <div class="card-content">
                    <div class="new-flashcard-header">
                        <div class="progress-bar-container">
                            ${this.data.cards
                              .map((card, index) => {
                                let status = "";
                                if (this.doneCards.has(card.id))
                                  status = "completed";
                                if (this.notDoneCards.has(card.id))
                                  status = "not-done"; // New status
                                if (index === this.currentIndex)
                                  status += " active";
                                return `<div class="progress-segment ${status}"></div>`;
                              })
                              .join("")}
                        </div>
                        <div class="header-controls">
                            <span class="card-counter">${
                              this.currentIndex + 1
                            } / ${this.data.cards.length}</span>
                            <button class="recall-btn" ${
                              !canRecall ? "disabled" : ""
                            }><i class="fas fa-undo"></i></button>
                        </div>
                    </div>

                    <div class="new-flashcard-stack-container">
                        <div class="new-flashcard-stack">
                            ${this.data.cards
                              .map((card, index) =>
                                this.renderCard(card, index)
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
                <div class="swipe-glow left-glow"></div>
                <div class="swipe-glow right-glow"></div>
            </div>
        `;
  }

  renderCard(card, index) {
    const isFavorited = this.favoritedCards.has(card.id);
    const frontStyle = `style="background-image: linear-gradient(to bottom right, ${card.styles.gradient[0]}, ${card.styles.gradient[1]}); color: ${card.styles.textColor};"`;
    const iconClass = `fas fa-${this.getIconName(card.icon)}`;

    const offset = Math.min(index - this.currentIndex, 2) * 10;
    const scale = 1 - Math.min(index - this.currentIndex, 2) * 0.05;
    const cardStyle = `style="z-index: ${
      this.data.cards.length - index
    }; transform: translateY(${offset}px) scale(${scale});"`;

    return `
            <div class="new-flashcard-slide" data-index="${index}" data-id="${
      card.id
    }" ${cardStyle}>
                <div class="new-flashcard-flipper">
                    <div class="new-flashcard-front" ${frontStyle}>
                        <button class="favorite-btn ${
                          isFavorited ? "favorited" : ""
                        }"><i class="fas fa-star"></i></button>
                        <div class="card-icon"><i class="${iconClass}"></i></div>
                        <h3>${card.front.title}</h3>
                        <p>${card.front.description}</p>
                        <div class="card-hint">Tap to flip</div>
                    </div>
                    <div class="new-flashcard-back">
                         <h3>${card.back.title}</h3>
                        <p>${card.back.description}</p>
                    </div>
                </div>
            </div>
        `;
  }

  renderResults() {
    const total = this.data.cards.length;
    const doneCount = this.doneCards.size;
    const notDoneCount = this.notDoneCards.size;
    const accuracy = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (accuracy / 100) * circumference;

    return `
            <div class="card new-flashcard-set" id="card-${this.data.id}">
                <div class="flashcard-results">
                    <div class="results-card">
                        <h3>Deck Complete!</h3>
                        <div class="circular-progress">
                            <svg width="150" height="150" viewBox="0 0 150 150">
                                <circle class="progress-bg" cx="75" cy="75" r="${radius}"></circle>
                                <circle class="progress-bar" cx="75" cy="75" r="${radius}"
                                    style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                                </circle>
                            </svg>
                            <div class="progress-text">
                                <div class="progress-percentage">${accuracy}%</div>
                                <div class="progress-label">Completed</div>
                            </div>
                        </div>
                        <div class="results-summary">
                            <div class="summary-chip done">${doneCount} Done</div>
                            <div class="summary-chip not-done">${notDoneCount} Not Done</div>
                        </div>
                        <button class="restart-btn">Restart Deck</button>
                    </div>
                </div>
            </div>
        `;
  }

  getIconName(apiIcon) {
    const iconMap = { Shapes: "shapes", Sparkles: "sparkles", Brain: "brain" };
    return iconMap[apiIcon] || "star";
  }

  attachEventListeners() {
    // If we are on the results page, only attach the restart listener
    if (this.currentIndex >= this.data.cards.length) {
      const restartBtn = document.querySelector(".restart-btn");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          this.resetState();
          this.updateUI();
        });
      }
      return;
    }

    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    const recallBtn = componentRoot.querySelector(".recall-btn");
    const leftGlow = componentRoot.querySelector(".left-glow");
    const rightGlow = componentRoot.querySelector(".right-glow");

    recallBtn.addEventListener("click", () => this.recallCard());

    cards.forEach((card, index) => {
      if (index < this.currentIndex) card.style.display = "none";

      if (index === this.currentIndex) {
        const flipper = card.querySelector(".new-flashcard-flipper");
        const favoriteBtn = card.querySelector(".favorite-btn");

        flipper.addEventListener("click", (e) => {
          if (!e.target.closest(".favorite-btn")) {
            flipper.classList.toggle("flipped");
          }
        });

        favoriteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const cardId = card.dataset.id;
          if (this.favoritedCards.has(cardId)) {
            this.favoritedCards.delete(cardId);
          } else {
            this.favoritedCards.add(cardId);
          }
          e.currentTarget.classList.toggle("favorited");
        });

        const hammertime = new Hammer(card);
        hammertime.on("pan", (ev) => {
          card.classList.add("is-panning");
          const rotation = ev.deltaX / 20;
          card.style.transform = `translate(${ev.deltaX}px, ${ev.deltaY}px) rotate(${rotation}deg)`;

          rightGlow.style.opacity = Math.max(0, ev.deltaX / 100);
          leftGlow.style.opacity = Math.max(0, -ev.deltaX / 100);
        });

        hammertime.on("panend", (ev) => {
          card.classList.remove("is-panning");
          rightGlow.style.opacity = 0;
          leftGlow.style.opacity = 0;

          const threshold = 100;
          if (Math.abs(ev.deltaX) > threshold) {
            const moveOutWidth = window.innerWidth;
            const isDone = ev.deltaX > 0;
            const endX = isDone ? moveOutWidth : -moveOutWidth;
            card.style.transform = `translate(${endX}px, ${
              ev.deltaY * 2
            }px) rotate(${ev.deltaX / 10}deg)`;

            setTimeout(() => this.nextCard(isDone), 300);
          } else {
            card.style.transform = "";
          }
        });
      }
    });
  }

  nextCard(isDone) {
    if (this.currentIndex < this.data.cards.length) {
      const cardId = this.data.cards[this.currentIndex].id;
      this.swipeHistory.push({
        cardId,
        wasDone: this.doneCards.has(cardId),
        wasNotDone: this.notDoneCards.has(cardId),
      });

      if (isDone) {
        this.doneCards.add(cardId);
        this.notDoneCards.delete(cardId);
      } else {
        this.notDoneCards.add(cardId);
        this.doneCards.delete(cardId);
      }
      this.currentIndex++;
      this.updateUI();
    }
  }

  recallCard() {
    if (this.swipeHistory.length > 0) {
      const lastAction = this.swipeHistory.pop();
      this.currentIndex--;

      if (lastAction.wasDone) this.doneCards.add(lastAction.cardId);
      else this.doneCards.delete(lastAction.cardId);

      if (lastAction.wasNotDone) this.notDoneCards.add(lastAction.cardId);
      else this.notDoneCards.delete(lastAction.cardId);

      this.updateUI();
    }
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
