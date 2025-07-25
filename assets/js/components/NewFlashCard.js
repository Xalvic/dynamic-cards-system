class NewFlashCard extends CardComponent {
  constructor(data) {
    super(data);
    this.currentIndex = 0;
    this.completedCards = new Set();
  }

  render() {
    return `
            <div class="card new-flashcard-set" id="card-${this.data.id}">
                <div class="card-content">
                    <div class="new-flashcard-header">
                        <div class="progress-bar-container">
                            ${this.data.cards
                              .map(
                                (_, index) =>
                                  `<div class="progress-segment ${
                                    this.completedCards.has(
                                      this.data.cards[index].id
                                    )
                                      ? "completed"
                                      : ""
                                  } ${
                                    index === this.currentIndex ? "active" : ""
                                  }"></div>`
                              )
                              .join("")}
                        </div>
                        <h2 class="card-title">${this.data.title}</h2>
                        <p class="card-subtitle">${this.data.subtitle}</p>
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

                    <div class="new-flashcard-nav">
                        <span class="card-counter">${this.currentIndex + 1} / ${
      this.data.cards.length
    }</span>
                    </div>
                </div>
                <div id="animation-container"></div>
            </div>
        `;
  }

  renderCard(card, index) {
    const isCompleted = this.completedCards.has(card.id);
    const frontStyle = `style="background-image: linear-gradient(to bottom right, ${card.styles.gradient[0]}, ${card.styles.gradient[1]}); color: ${card.styles.textColor};"`;
    const iconClass = `fas fa-${this.getIconName(card.icon)}`;

    // Stacking effect
    const offset = Math.min(index - this.currentIndex, 2) * 10;
    const scale = 1 - Math.min(index - this.currentIndex, 2) * 0.05;
    const cardStyle = `style="z-index: ${
      this.data.cards.length - index
    }; transform: translateY(${offset}px) scale(${scale});"`;

    return `
            <div class="new-flashcard-slide" data-index="${index}" ${cardStyle}>
                <div class="new-flashcard-flipper">
                    <div class="new-flashcard-front" ${frontStyle}>
                        <div class="card-icon"><i class="${iconClass}"></i></div>
                        <h3>${card.front.title}</h3>
                        <p>${card.front.description}</p>
                        <div class="card-hint">Tap to flip</div>
                    </div>
                    <div class="new-flashcard-back">
                        <h3>${card.back.title}</h3>
                        <p>${card.back.description}</p>
                        <button class="complete-action-btn" data-id="${
                          card.id
                        }" ${isCompleted ? "disabled" : ""}>
                             ${
                               isCompleted
                                 ? '<i class="fas fa-check"></i> Done!'
                                 : "I've Done This"
                             }
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  getIconName(apiIcon) {
    const iconMap = { Shapes: "shapes", Sparkles: "sparkles", Brain: "brain" };
    return iconMap[apiIcon] || "star";
  }

  triggerCelebration() {
    const container = document.getElementById("animation-container");
    if (!container || !window.anime) return;

    for (let i = 0; i < 30; i++) {
      const el = document.createElement("div");
      el.classList.add("confetti");
      el.style.backgroundColor = ["#00aaff", "#e94560", "#2dce89", "#f5f3ff"][
        Math.floor(Math.random() * 4)
      ];
      container.appendChild(el);
    }

    anime({
      targets: ".confetti",
      translateX: () => anime.random(-150, 150),
      translateY: () => anime.random(-150, 150),
      scale: () => anime.random(0.5, 1.5),
      rotate: () => anime.random(-90, 90),
      opacity: [1, 0],
      duration: 1500,
      easing: "easeOutExpo",
      complete: () => {
        container.innerHTML = "";
      },
    });
  }

  attachEventListeners() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");

    cards.forEach((card, index) => {
      if (index < this.currentIndex) {
        card.style.display = "none"; // Hide swiped cards
      }

      // Only make the top card interactive
      if (index === this.currentIndex) {
        const flipper = card.querySelector(".new-flashcard-flipper");
        const actionBtn = card.querySelector(".complete-action-btn");

        flipper.addEventListener("click", (e) => {
          if (!e.target.closest(".complete-action-btn")) {
            flipper.classList.toggle("flipped");
          }
        });

        actionBtn.addEventListener("click", (e) => {
          if (e.target.disabled) return;
          this.completedCards.add(e.target.dataset.id);
          this.triggerCelebration();
          setTimeout(() => this.nextCard(), 300);
        });

        // --- Hammer.js Swipe Logic ---
        const hammertime = new Hammer(card);
        hammertime.on("pan", (ev) => {
          card.classList.add("is-panning");
          let transform = `translate(${ev.deltaX}px, ${ev.deltaY}px) rotate(${
            ev.deltaX / 20
          }deg)`;
          card.style.transform = transform;
        });

        hammertime.on("panend", (ev) => {
          card.classList.remove("is-panning");
          const threshold = 100;
          if (Math.abs(ev.deltaX) > threshold) {
            card.style.transform = `translate(${
              ev.deltaX > 0 ? 500 : -500
            }px, ${ev.deltaY}px) rotate(${ev.deltaX / 10}deg)`;
            this.nextCard();
          } else {
            card.style.transform = ""; // Spring back
          }
        });
      }
    });
  }

  nextCard() {
    if (this.currentIndex < this.data.cards.length) {
      this.currentIndex++;
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
