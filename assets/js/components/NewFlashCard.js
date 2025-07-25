class NewFlashCard extends CardComponent {
  constructor(data) {
    super(data);
    this.data = data;
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
                                  status = "not-done";
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
                            }><i data-lucide="undo-2"></i></button>
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
    const iconName = this.getIconName(card.icon);
    const typeIconName = this.getIconName(card.type);

    // --- UPDATED: Access styles from the top-level 'styles' object ---
    const gradient = card.styles.gradient || ["#FFFFFF", "#E0E0E0"];
    const textColor = card.styles.textColor || "#111827";

    // Create a single style string for both front and back
    const cardFaceStyle = `style="background-image: linear-gradient(to bottom right, ${gradient[0]}, ${gradient[1]}); color: ${textColor};"`;

    // Style for the front of the card, also setting the --card-text-color variable
    const frontStyle = `style="--card-text-color: ${textColor}; background-image: linear-gradient(to bottom right, ${gradient[0]}, ${gradient[1]}); color: ${textColor};"`;

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
                        <div class="card-background-icon"><i data-lucide="${iconName}"></i></div>
                        <div class="card-type-label"><i data-lucide="${typeIconName}"></i><span>${
      card.type
    }</span></div>
                        <button class="favorite-btn ${
                          isFavorited ? "favorited" : ""
                        }"><i data-lucide="heart"></i></button>
                        
                        <div class="card-main-content">
                            <h3>${card.front.title}</h3>
                            <p>${card.front.description}</p>
                        </div>
                    </div>
                    <div class="new-flashcard-back" ${cardFaceStyle}>
                         <div class="card-main-content">
                            <h3>${card.back.title}</h3>
                            <p>${card.back.description}</p>
                        </div>
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
                        <div class="results-deco-svg">
                            <svg width="100" height="100" viewBox="0 0 100 100">
                                <circle class="deco-circle" cx="20" cy="20" r="15"/>
                                <rect class="deco-rect" x="60" y="60" width="30" height="30"/>
                            </svg>
                        </div>
                        <h3 class="results-title">You're doing great!</h3>
                        <p class="results-subtitle">Keep focusing on the tough terms.</p>
                        
                        <div class="results-progress-container">
                            <div class="circular-progress">
                                <svg width="150" height="150" viewBox="0 0 150 150">
                                    <circle class="progress-bg" cx="75" cy="75" r="${radius}"></circle>
                                    <circle class="progress-bar" cx="75" cy="75" r="${radius}"
                                        stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" data-offset="${offset}">
                                    </circle>
                                </svg>
                                <div class="progress-text">
                                    <div class="progress-percentage">${accuracy}%</div>
                                </div>
                            </div>
                            <div class="results-summary">
                                <div class="summary-chip done">Know <span>${doneCount}</span></div>
                                <div class="summary-chip not-done">Still learning <span>${notDoneCount}</span></div>
                            </div>
                        </div>

                        <div class="results-actions">
                            <button class="restart-btn primary">Restart Deck</button>
                            <button class="close-btn secondary">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  getIconName(apiIcon) {
    if (typeof apiIcon !== "string" || !apiIcon) {
      return "box";
    }
    const iconMap = {
      shapes: "gem",
      sparkles: "sparkles",
      brain: "brain",
      tip: "lightbulb",
      insight: "brain",
    };
    return iconMap[apiIcon.trim().toLowerCase()] || "box";
  }

  // --- NEW: Add this entire method to your class ---
  _animateCardEntry() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    if (!cards.length) return;

    // Instantly set the starting position of the cards (fanned out and invisible)
    // The final stack position is already set by the inline styles from render()
    const baseAngle = -10;
    anime.set(cards, {
      opacity: 0,
      translateY: (el, i) => {
        // Start them lower down
        return 60;
      },
      rotate: (el, i) => {
        // Fan them out slightly
        const middle = Math.floor(cards.length / 2);
        return (i - middle) * baseAngle;
        // return baseAngle * (i + 1);
      },
    });

    // Animate the cards to their final position
    anime({
      targets: cards,
      opacity: 1,
      rotate: 0, // Straighten the cards
      // Animate to the final translateY/scale values from the inline style
      translateY: (el, i) => {
        const offset = Math.min(i - this.currentIndex, 2) * 10;
        return offset;
      },
      scale: (el, i) => {
        const scale = 1 - Math.min(i - this.currentIndex, 2) * 0.05;
        return scale;
      },
      // Stagger the animation of each card for a nice flowing effect
      // delay: (el, i) => i * 100,
      delay: anime.stagger(100, { easing: "easeOutQuad" }),
      duration: 800,
      easing: "easeOutQuint", // A smooth easing function
    });
  }

  attachEventListeners() {
    this._animateCardEntry();

    if (this.currentIndex >= this.data.cards.length) {
      this.attachResultsListeners();
      return;
    }

    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    const recallBtn = componentRoot.querySelector(".recall-btn");

    recallBtn.addEventListener("click", () => this.recallCard());

    cards.forEach((card, index) => {
      if (index < this.currentIndex) card.style.display = "none";

      if (index === this.currentIndex) {
        this.attachInteractiveListeners(card);
      }
    });
  }

  attachInteractiveListeners(card) {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    const flipper = card.querySelector(".new-flashcard-flipper");
    const favoriteBtn = card.querySelector(".favorite-btn");
    const leftGlow = componentRoot.querySelector(".left-glow");
    const rightGlow = componentRoot.querySelector(".right-glow");

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
      flipper.classList.add("is-panning");
      const rotation = ev.deltaX / 20;
      flipper.style.transform = `translate(${ev.deltaX}px, ${ev.deltaY}px) rotate(${rotation}deg)`;
      rightGlow.style.opacity = Math.max(0, ev.deltaX / 100);
      leftGlow.style.opacity = Math.max(0, -ev.deltaX / 100);
    });

    hammertime.on("panend", (ev) => {
      flipper.classList.remove("is-panning");
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

        this.nextCard(isDone); // Call nextCard without timeout
      } else {
        flipper.style.transform = "";
      }
    });
  }

  attachResultsListeners() {
    const restartBtn = document.querySelector(".restart-btn");
    const closeBtn = document.querySelector(".close-btn");

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.resetState();
        this.updateUI();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("card-display-area").innerHTML =
          '<div class="placeholder"><i data-lucide="mouse-pointer-click"></i><h2>Welcome!</h2><p>Open the menu to select a card.</p></div>';
        lucide.createIcons();
      });
    }

    if (window.anime) {
      const progressBar = document.querySelector(
        ".flashcard-results .progress-bar"
      );
      const finalOffset = progressBar.dataset.offset;
      const tl = anime.timeline({ easing: "easeOutExpo", duration: 800 });
      tl.add({ targets: ".results-card", scale: [0.8, 1], opacity: [0, 1] })
        .add(
          {
            targets: ".results-title, .results-subtitle",
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
          },
          "-=600"
        )
        .add(
          {
            targets: progressBar,
            strokeDashoffset: [anime.setDashoffset, finalOffset],
            duration: 1200,
          },
          "-=500"
        )
        .add(
          {
            targets: ".results-summary .summary-chip, .results-actions button",
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
          },
          "-=800"
        )
        .add(
          {
            targets: ".results-deco-svg .deco-circle",
            translateX: [-20, 0],
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 600,
          },
          "-=1000"
        )
        .add(
          {
            targets: ".results-deco-svg .deco-rect",
            translateX: [20, 0],
            translateY: [20, 0],
            opacity: [0, 1],
            rotate: [-45, 0],
            duration: 600,
          },
          "-=900"
        );
    }
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

      // --- THIS IS THE FIX ---
      // Instead of a full re-render, we animate the next card into place.
      this.animateNextCard();
    }
  }

  animateNextCard() {
    if (this.currentIndex >= this.data.cards.length) {
      this.updateUI(); // Re-render for results page
      return;
    }

    const newTopCard = document.querySelector(
      `.new-flashcard-slide[data-index="${this.currentIndex}"]`
    );
    const cardBelow = document.querySelector(
      `.new-flashcard-slide[data-index="${this.currentIndex + 1}"]`
    );

    if (newTopCard) {
      anime({
        targets: newTopCard,
        translateY: "0px",
        scale: 1,
        duration: 400,
        easing: "easeOutQuint",
        complete: () => {
          this.attachInteractiveListeners(newTopCard);
        },
      });
    }
    if (cardBelow) {
      anime({
        targets: cardBelow,
        translateY: "10px",
        scale: 0.95,
        duration: 400,
        easing: "easeOutQuint",
      });
    }
    this.updateHeaderUI();
  }

  updateHeaderUI() {
    const counter = document.querySelector(".card-counter");
    if (counter)
      counter.textContent = `${this.currentIndex + 1} / ${
        this.data.cards.length
      }`;

    const progressSegments = document.querySelectorAll(".progress-segment");
    progressSegments.forEach((segment, index) => {
      const card = this.data.cards[index];
      segment.classList.remove("active", "completed", "not-done");
      if (this.doneCards.has(card.id)) segment.classList.add("completed");
      if (this.notDoneCards.has(card.id)) segment.classList.add("not-done");
      if (index === this.currentIndex) segment.classList.add("active");
    });

    const recallBtn = document.querySelector(".recall-btn");
    if (recallBtn) recallBtn.disabled = this.swipeHistory.length === 0;
  }

  recallCard() {
    if (this.swipeHistory.length > 0) {
      // Full re-render is simplest for recall
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
      lucide.createIcons();
      this.attachEventListeners();
    }
  }
}
