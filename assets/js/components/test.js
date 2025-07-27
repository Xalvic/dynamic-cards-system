class NewFlashCard extends CardComponent {
  constructor(data) {
    super(data);
    this.data = data;
    // --- MODIFIED: Store original cards for "Restart" and "Review" ---
    this.originalCards = [...data.cards];
    this.interactionId = data.interactionId;
    this.initializeState(data.progress);
  }

  initializeState(progressData) {
    this.resetState();

    if (progressData) {
      console.log("Restoring progress from history:", progressData);

      this.currentIndex = progressData.current_index || 0;
      this.progressHistory = progressData.progress || [];

      this.progressHistory.forEach((item) => {
        if (item.impression === "right") {
          this.doneCards.add(item.card_id);
        } else {
          this.notDoneCards.add(item.card_id);
        }
      });
    }
  }

  // --- MODIFIED: Added a flag to handle different types of resets ---
  resetState(fullReset = true) {
    // If it's a full reset, restore the original full deck of cards
    if (fullReset) {
      this.data.cards = [...this.originalCards];
    }
    this.currentIndex = 0;
    this.currentStatus = false;
    this.progressHistory = [];
    this.favoritedCards = new Set();
    this.doneCards = new Set();
    this.notDoneCards = new Set();
    this.correctStreak = 0;
    this.messageIndex = 0;
    this.autoPlay = false;
    this.autoPlayInterval = null;
  }

  // --- ✨ NEW HELPER METHOD for the progress ring ---
  describeArc(x, y, radius, startAngle, endAngle) {
    const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    const d = [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
    return d;
  }

  // --- ✨ REWRITTEN: The new results page render method ---
  renderResults() {
    // The API call from your old results page is preserved
    const payload = {
      userId: localStorage.getItem("user_id"),
      appId: localStorage.getItem("app_id"),
      interactionId: this.interactionId,
      progress: this.progressHistory,
      currentIndex: this.currentIndex,
      completed: true,
    };
    ApiService.updateActivityProgress(payload);

    const total = this.data.cards.length;
    const knownCount = this.doneCards.size;
    const learningCount = this.notDoneCards.size;
    const accuracy =
      this.originalCards.length > 0
        ? Math.round((knownCount / this.originalCards.length) * 100)
        : 0;

    const knownPercent =
      this.originalCards.length > 0
        ? knownCount / this.originalCards.length
        : 0;
    const learningPercent =
      this.originalCards.length > 0
        ? learningCount / this.originalCards.length
        : 0;

    const totalPercentForArc = knownPercent + learningPercent;
    let learningArcEnd = (learningPercent / totalPercentForArc) * 359.99;
    if (isNaN(learningArcEnd)) learningArcEnd = 0;

    let knownArcEnd =
      learningArcEnd + (knownPercent / totalPercentForArc) * 359.99;
    if (isNaN(knownArcEnd)) knownArcEnd = learningArcEnd;

    return `
      <div class="card new-flashcard-set" id="card-${this.data.id}">
        <div class="results-page">
          <div class="results-header">
            <h3>Brilliant work!</h3>
            <p>Now let's try some practice questions in Learn.</p>
            <img src="https://storage.googleapis.com/production-assets/assets/flashcard-results.png" alt="Celebration" class="results-illustration"/>
          </div>
          <div class="results-body">
            <h4>Your progress</h4>
            <div class="progress-summary">
              <div class="progress-ring-container">
                <svg viewBox="0 0 120 120" class="progress-ring">
                  <circle class="progress-ring-bg" cx="60" cy="60" r="54"></circle>
                  <path class="progress-ring-arc learning" d="${this.describeArc(
                    60,
                    60,
                    54,
                    0,
                    learningArcEnd
                  )}"></path>
                  <path class="progress-ring-arc known" d="${this.describeArc(
                    60,
                    60,
                    54,
                    learningArcEnd,
                    knownArcEnd
                  )}"></path>
                </svg>
                <div class="progress-text">${accuracy}%</div>
              </div>
              <div class="progress-bars">
                <div class="bar-item"><div class="bar-label"><span class="bar-color-dot known"></span><span>Known</span></div><span class="bar-count">${knownCount}</span></div>
                <div class="bar-item"><div class="bar-label"><span class="bar-color-dot learning"></span><span>Still learning</span></div><span class="bar-count">${learningCount}</span></div>
              </div>
            </div>
            <button class="recall-last-btn" ${
              this.progressHistory.length === 0 ? "disabled" : ""
            }><i data-lucide="undo-2"></i> Back to the last question</button>
          </div>
          <div class="results-footer">
            <button class="results-btn primary" id="practise-btn">Practise with questions</button>
            <button class="results-btn secondary" id="review-btn" ${
              learningCount === 0 ? "disabled" : ""
            }>Keep reviewing ${learningCount} terms</button>
            <button class="results-btn tertiary" id="restart-btn">Restart Flashcards</button>
          </div>
        </div>
      </div>
    `;
  }

  // --- ✨ NEW METHOD ---
  reviewIncorrectCards() {
    const incorrectCardIds = new Set(this.notDoneCards);
    // Filter from the original full deck
    const reviewDeck = this.originalCards.filter((card) =>
      incorrectCardIds.has(card.id)
    );

    if (reviewDeck.length > 0) {
      this.data.cards = reviewDeck;
      this.resetState(false); // Reset state but don't overwrite the deck
      this.updateUI();
    }
  }

  // --- ✨ REWRITTEN METHOD ---
  attachResultsListeners() {
    const practiseBtn = document.getElementById("practise-btn");
    const reviewBtn = document.getElementById("review-btn");
    const restartBtn = document.getElementById("restart-btn");
    const recallBtn = document.querySelector(".recall-last-btn");

    if (practiseBtn) {
      practiseBtn.addEventListener("click", () =>
        console.log("Action: Practise with questions clicked.")
      );
    }
    if (reviewBtn) {
      reviewBtn.addEventListener("click", () => this.reviewIncorrectCards());
    }
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.resetState(true); // Pass true for a full reset to the original deck
        this.updateUI();
      });
    }
    if (recallBtn) {
      recallBtn.addEventListener("click", () => this.recallCard());
    }
  }

  // --- ALL YOUR OTHER METHODS ARE PRESERVED BELOW ---

  render() {
    if (this.currentIndex >= this.data.cards.length) {
      return this.renderResults();
    }
    const canRecall = this.progressHistory.length > 0;
    const completedCount = this.doneCards.size + this.notDoneCards.size;
    const totalCards = this.data.cards.length;

    return `
      <div class="card new-flashcard-set" id="card-${this.data.id}">
        <div class="card-content">
          <div class="new-flashcard-header">
           <div class="deck-info">
                <h4 class="deck-title">${this.data.title}</h4>
                <p class="deck-subtitle">${this.data.subtitle}</p>
            </div>
            <div class="progress-bar-container">
              <div class="streak-counter-container"></div>
              <div class="progress-bar-unified">
                <div class="progress-bar-unified-fill" style="width: ${
                  totalCards > 0 ? (completedCount / totalCards) * 100 : 0
                }%"></div>
              </div>
            </div>
            <div class="header-controls"></div>
            <span class="card-counter">${completedCount} / ${totalCards}</span>
          </div>
          <div class="new-flashcard-stack-container">
            <div class="new-flashcard-stack">
              ${this.data.cards
                .map((card, index) => this.renderCard(card, index))
                .join("")}
            </div>
          </div>
        </div>
        <div class="swipe-glow left-glow"></div>
        <div class="swipe-glow right-glow"></div>
        <button class="autoplay-btn ${
          this.autoPlay ? "active" : ""
        }" id="autoplay-btn-${this.data.id}">
          <i data-lucide="${this.autoPlay ? "pause" : "play"}"></i>
        </button>
        <button class="recall-btn" id="recall-btn-${this.data.id}" ${
      !canRecall ? "disabled" : ""
    }>
          <i data-lucide="undo-2"></i>
        </button>
      </div>
    `;
  }

  renderCard(card, index) {
    const isFavorited = this.favoritedCards.has(card.id);
    const iconName = this.getIconName(card.icon);
    const typeIconName = this.getTypeIconName(card.type);
    const gradient = card.styles.gradient || ["#FFFFFF", "#E0E0E0"];
    const textColor = card.styles.textColor || "#111827";
    const cardFaceStyle = `style="background-image: linear-gradient(to bottom right, ${gradient[0]}, ${gradient[1]}); color: ${textColor};"`;
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
            <div class="card-background-icon"><i data-lucide="${typeIconName}"></i></div>
            <div class="card-type-label"><i data-lucide="${iconName}"></i><span>${
      card.type
    }</span></div>
            <div class="card-main-content">
              <h3>${card.front.title}</h3>
              <p>${card.front.description}</p>
            </div>
            <button class="tts-btn"><i data-lucide="volume-2"></i></button>
            <button class="favorite-btn ${
              isFavorited ? "favorited" : ""
            }"><i data-lucide="heart"></i></button>
          </div>
          <div class="new-flashcard-back" ${cardFaceStyle}>
            <div class="card-main-content">
              <h3>${card.back.title}</h3>
              <p>${card.back.description}</p>
            </div>
            <button class="tts-btn"><i data-lucide="volume-2"></i></button>
          </div>
        </div>
      </div>
    `;
  }

  speakText(text) {
    if ("speechSynthesis" in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }

  getIconName(apiIcon) {
    return apiIcon;
  }
  getTypeIconName(apiIcon) {
    if (typeof apiIcon !== "string" || !apiIcon) {
      return "box";
    }
    const iconMap = {
      motivation: "trophy",
      quote: "quote",
      tip: "lightbulb",
      insight: "brain",
    };
    return iconMap[apiIcon.trim().toLowerCase()] || "box";
  }

  _animateCardEntry() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;
    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    if (!cards.length) return;
    const baseAngle = 5;
    anime.set(cards, {
      opacity: 0,
      translateY: 60,
      rotate: (el, i) =>
        i === this.currentIndex
          ? baseAngle * (i + 1) - 120
          : baseAngle * (i + 1),
    });
    anime({
      targets: cards,
      opacity: 1,
      rotate: 0,
      translateY: (el, i) => Math.min(i - this.currentIndex, 2) * 10,
      scale: (el, i) => 1 - Math.min(i - this.currentIndex, 2) * 0.05,
      delay: anime.stagger(100, { easing: "easeOutQuad" }),
      duration: 800,
      easing: "easeOutQuint",
    });
  }

  _animateCardRecall() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;
    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    if (!cards.length) return;
    const card = cards[this.currentIndex];
    if (!card) return;
    anime.set(card, {
      translateX: this.currentStatus ? 100 : -100,
      translateY: 10,
      rotate: this.currentStatus ? 10 : -10,
      opacity: 0,
    });
    anime({
      opacity: 1,
      targets: card,
      translateX: 0,
      translateY: 0,
      rotate: 0,
      scale: 1,
      duration: 100,
      easing: "easeOutQuint",
    });
  }

  attachEventListeners(recall = false) {
    if (this.currentIndex >= this.data.cards.length) {
      this.attachResultsListeners();
      lucide.createIcons();
      return;
    }

    if (!recall) this._animateCardEntry();
    else this._animateCardRecall();

    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    const recallBtn = document.getElementById(`recall-btn-${this.data.id}`);
    const autoplayBtn = componentRoot.querySelector(".autoplay-btn");

    recallBtn.addEventListener("click", () => this.recallCard());
    autoplayBtn.addEventListener("click", () => this.toggleAutoPlay());

    cards.forEach((card, index) => {
      if (index < this.currentIndex) card.style.display = "none";
      if (index === this.currentIndex) {
        this.attachInteractiveListeners(card);
        card.addEventListener("touchstart", () => {
          if (this.autoPlay) this.stopAutoPlay();
        });
        card.addEventListener("pointerdown", () => {
          if (this.autoPlay) this.stopAutoPlay();
        });
      }
    });
  }

  attachInteractiveListeners(card) {
    const flipper = card.querySelector(".new-flashcard-flipper");
    const favoriteBtn = card.querySelector(".favorite-btn");
    const ttsBtnFront = card.querySelector(".new-flashcard-front .tts-btn");
    const ttsBtnBack = card.querySelector(".new-flashcard-back .tts-btn");
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    const leftGlow = componentRoot.querySelector(".left-glow");
    const rightGlow = componentRoot.querySelector(".right-glow");

    flipper.addEventListener("click", (e) => {
      if (!e.target.closest(".favorite-btn"))
        flipper.classList.toggle("flipped");
    });
    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cardId = card.dataset.id;
      if (this.favoritedCards.has(cardId)) this.favoritedCards.delete(cardId);
      else this.favoritedCards.add(cardId);
      e.currentTarget.classList.toggle("favorited");
    });
    ttsBtnFront.addEventListener("click", (e) => {
      e.stopPropagation();
      const cardData = this.data.cards[card.dataset.index];
      this.speakText(cardData.front.title);
    });
    ttsBtnBack.addEventListener("click", (e) => {
      e.stopPropagation();
      const cardData = this.data.cards[card.dataset.index];
      this.speakText(cardData.back.description);
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
      const threshold = 100;
      if (Math.abs(ev.deltaX) > threshold) {
        const moveOutWidth = window.innerWidth * 1.5;
        const isDone = ev.deltaX > 0;
        this.currentStatus = isDone;
        const endX = isDone ? moveOutWidth : -moveOutWidth;
        card.style.transform = `translate(${endX}px, ${
          ev.deltaY * 2
        }px) rotate(${ev.deltaX / 10}deg)`;
        this.nextCard(isDone);
      } else {
        rightGlow.style.opacity = 0;
        leftGlow.style.opacity = 0;
        flipper.style.transform = "";
      }
    });
  }

  nextCard(isDone) {
    if (this.currentIndex < this.data.cards.length) {
      setTimeout(() => {
        const componentRoot = document.getElementById(`card-${this.data.id}`);
        if (componentRoot) {
          const leftGlow = componentRoot.querySelector(".left-glow");
          const rightGlow = componentRoot.querySelector(".right-glow");
          if (leftGlow) leftGlow.style.opacity = 0;
          if (rightGlow) rightGlow.style.opacity = 0;
        }
      }, 200);

      const card = this.data.cards[this.currentIndex];
      const cardId = card.id;
      const impression = isDone ? "right" : "left";
      this.progressHistory.push({ card_id: cardId, impression: impression });

      const payload = {
        userId: localStorage.getItem("user_id"),
        appId: localStorage.getItem("app_id"),
        interactionId: this.interactionId,
        progress: this.progressHistory,
        currentIndex: this.currentIndex + 1,
        completed: false,
      };
      ApiService.updateActivityProgress(payload);

      if (isDone) {
        this.doneCards.add(cardId);
        this.notDoneCards.delete(cardId);
        this.triggerProgressBarParticles();
        this.correctStreak++;
        if (this.correctStreak > 0 && this.correctStreak % 3 === 0) {
          this.triggerMidwayCelebration();
        }
      } else {
        this.notDoneCards.add(cardId);
        this.doneCards.delete(cardId);
        this.correctStreak = 0;
      }
      this.currentIndex++;
      this.animateNextCard();
      this.handleStreakUpdate();
    }
  }

  triggerProgressBarParticles() {
    const header = document.querySelector(".new-flashcard-header");
    const progressBar = document.querySelector(".progress-bar-unified");
    if (!header || !progressBar) return;

    const container = document.createElement("div");
    container.classList.add("progress-particle-container");
    header.appendChild(container);

    const fillElement = progressBar.querySelector(".progress-bar-unified-fill");
    const headerRect = header.getBoundingClientRect();
    const progressRect = progressBar.getBoundingClientRect();

    const originX =
      progressRect.left - headerRect.left + fillElement.offsetWidth;
    const originY = progressRect.top - headerRect.top + progressRect.height / 2;
    // console.log(originY);
    let circleOriginY = originY - 15;
    // --- NEW: Create and animate the circular pulse ---
    const pulse = document.createElement("div");
    pulse.classList.add("progress-pulse");
    pulse.style.left = `${originX}px`;
    pulse.style.top = `${circleOriginY}px`;
    container.appendChild(pulse);

    anime({
      targets: pulse,
      scale: [0, 2],
      opacity: [1, 0],
      duration: 500,
      easing: "easeOutExpo",
      complete: () => container.removeChild(pulse),
    });

    // --- UPDATED: Reduced particle count from 35 to 25 ---
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement("div");
      particle.classList.add("progress-particle");
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      container.appendChild(particle);

      anime({
        targets: particle,
        translateX: anime.random(-40, 40),
        translateY: anime.random(-50, 0),
        scale: [anime.random(1, 1.5), 0],
        opacity: [1, 0],
        duration: anime.random(800, 1200),
        easing: "easeOutExpo",
        complete: () => container.removeChild(particle),
      });
    }

    setTimeout(() => {
      if (header.contains(container)) {
        header.removeChild(container);
      }
    }, 1400);
  }
  handleStreakUpdate() {
    const container = document.querySelector(".streak-counter-container");
    if (!container) return;

    // Always remove the previous message to reset the animation
    const oldMessage = container.querySelector(".streak-message");
    if (oldMessage) {
      container.removeChild(oldMessage);
    }

    // Only show the streak message for 2 or more correct answers in a row
    if (this.correctStreak < 2) {
      return;
    }

    // Create the new streak message element
    const streakMessage = document.createElement("div");
    streakMessage.className = "streak-message";
    const header = document.querySelector(".new-flashcard-header");
    if (header && header.classList.contains("is-on-fire")) {
      streakMessage.classList.add("on-fire");
    }
    streakMessage.innerHTML = `${this.correctStreak} in a row! <i data-lucide="flame" class="streak-flame"></i>`;
    container.appendChild(streakMessage);
    lucide.createIcons(); // Render the new flame icon

    // Animate the message into view using anime.js
    anime({
      targets: streakMessage,
      translateY: [10, 0], // Move up from below
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 500,
      easing: "easeOutExpo",
    });
  }

  animateNextCard() {
    if (this.currentIndex >= this.data.cards.length) {
      this.updateUI();
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
        complete: () => this.attachInteractiveListeners(newTopCard),
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

  triggerMidwayCelebration() {
    const cardContainer = document.getElementById(`card-${this.data.id}`);
    if (!cardContainer) return;

    const messages = [
      "Awesome!",
      "Great!",
      "Nailed It!",
      "Superb!",
      "Brilliant!",
    ];
    const message = messages[this.messageIndex];
    this.messageIndex = (this.messageIndex + 1) % messages.length;
    const colors = ["#A8D0E6", "#F7D4A2", "#84DCC6", "#FFAAA5", "#A3A8E6"];

    const container = document.createElement("div");
    container.classList.add("midway-celebration");

    const messageEl = document.createElement("div");
    messageEl.classList.add("midway-message");
    messageEl.textContent = message;
    container.appendChild(messageEl);

    cardContainer.appendChild(container);

    const tl = anime.timeline({
      complete: () => cardContainer.removeChild(container),
    });

    tl.add({
      targets: container,
      translateX: "-50%",
      translateY: [-100, 0],
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 600,
      easing: "spring(1, 80, 15, 0)",
    }).add(
      {
        targets: container,
        translateX: "-50%",
        translateY: [0, -50],
        opacity: [1, 0],
        scale: 0.9,
        duration: 500,
        easing: "easeInExpo",
      },
      "+=500"
    );

    // Particle burst (original)
    const particleContainer = document.createElement("div");
    particleContainer.classList.add("midway-particle-container");
    container.appendChild(particleContainer);

    for (let i = 0; i < 25; i++) {
      const particle = document.createElement("div");
      particle.classList.add("midway-particle");
      particle.style.backgroundColor =
        colors[anime.random(0, colors.length - 1)];
      particleContainer.appendChild(particle);

      anime({
        targets: particle,
        translateX: anime.random(-100, 100),
        translateY: anime.random(-80, 80),
        scale: [0, anime.random(0.5, 1.2), 0],
        duration: anime.random(600, 1200),
        easing: "easeOutExpo",
      });
    }
  }

  updateHeaderUI() {
    const cardSetElement = document.getElementById(`card-${this.data.id}`);
    if (!cardSetElement) return;
    const completedCount = this.doneCards.size + this.notDoneCards.size;
    const totalCards = this.data.cards.length;
    const counter = cardSetElement.querySelector(".card-counter");
    if (counter) counter.textContent = `${completedCount} / ${totalCards}`;
    const progressBarFill = cardSetElement.querySelector(
      ".progress-bar-unified-fill"
    );
    if (progressBarFill) {
      const percentage =
        totalCards > 0 ? (completedCount / totalCards) * 100 : 0;
      progressBarFill.style.width = `${percentage}%`;
    }
    const progressBar = cardSetElement.querySelector(".progress-bar-unified");
    if (progressBar) {
      const correctPercentage =
        totalCards > 0 ? this.doneCards.size / totalCards : 0;
      if (correctPercentage >= 0.5) progressBar.classList.add("is-on-fire");
      else progressBar.classList.remove("is-on-fire");
    }
    const header = cardSetElement.querySelector(".new-flashcard-header");
    if (header) {
      const correctPercentage =
        totalCards > 0 ? this.doneCards.size / totalCards : 0;
      if (correctPercentage >= 0.5) header.classList.add("is-on-fire");
      else header.classList.remove("is-on-fire");
    }
    const recallBtn = cardSetElement.querySelector(".recall-btn");
    if (recallBtn) recallBtn.disabled = this.progressHistory.length === 0;
  }

  recallCard() {
    if (this.progressHistory.length > 0) {
      const lastAction = this.progressHistory.pop();
      const cardId = lastAction.card_id;
      if (lastAction.impression === "right") this.doneCards.delete(cardId);
      else this.notDoneCards.delete(cardId);
      this.currentIndex--;
      const payload = {
        userId: localStorage.getItem("user_id"),
        appId: localStorage.getItem("app_id"),
        interactionId: this.interactionId,
        progress: this.progressHistory,
        currentIndex: this.currentIndex,
        completed: false,
      };
      ApiService.updateActivityProgress(payload);
      this.updateUI(true, true);
    }
  }

  updateUI(recall = false, recallBounce = false) {
    const cardSetElement = document.getElementById(`card-${this.data.id}`);
    if (cardSetElement) {
      const mainAppContainer = document.getElementById("card-display-area");
      mainAppContainer.innerHTML = this.render();
      lucide.createIcons();
      this.attachEventListeners(recall);
    }
    this.updateAutoPlayButton();
    const recallBtn = document.getElementById(`recall-btn-${this.data.id}`);
    if (recallBtn) {
      recallBtn.disabled = this.progressHistory.length === 0;
      if (recallBounce) {
        recallBtn.classList.remove("bounce");
        void recallBtn.offsetWidth;
        recallBtn.classList.add("bounce");
      }
    }
  }

  toggleAutoPlay() {
    if (this.autoPlay) this.stopAutoPlay();
    else this.startAutoPlay();
  }
  startAutoPlay() {
    this.autoPlay = true;
    this.updateAutoPlayButton();
    this.autoPlayNextCard();
  }
  stopAutoPlay() {
    this.autoPlay = false;
    if (this.autoPlayInterval) {
      clearTimeout(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    this.updateAutoPlayButton();
  }
  updateAutoPlayButton() {
    const autoplayBtn = document.querySelector(`#autoplay-btn-${this.data.id}`);
    if (autoplayBtn) {
      autoplayBtn.classList.toggle("active", this.autoPlay);
      autoplayBtn.innerHTML = `<i data-lucide='${
        this.autoPlay ? "pause" : "play"
      }'></i>`;
      lucide.createIcons();
    }
  }
  autoPlayNextCard() {
    if (!this.autoPlay || this.currentIndex >= this.data.cards.length) {
      this.stopAutoPlay();
      return;
    }
    const currentCard = document.querySelector(
      `.new-flashcard-slide[data-index="${this.currentIndex}"]`
    );
    if (!currentCard) {
      this.stopAutoPlay();
      return;
    }
    const flipper = currentCard.querySelector(".new-flashcard-flipper");
    const isFlipped = flipper.classList.contains("flipped");
    if (!isFlipped) {
      flipper.classList.add("flipped");
      this.autoPlayInterval = setTimeout(() => {
        this.autoPlaySwipeLeft(currentCard);
      }, 2000);
    } else {
      this.autoPlaySwipeLeft(currentCard);
    }
  }
  autoPlaySwipeLeft(currentCard) {
    if (!this.autoPlay) return;
    const moveOutWidth = window.innerWidth * 1.5;
    currentCard.style.transform = `translate(${-moveOutWidth}px, 0px) rotate(-10deg)`;
    this.nextCard(false);
    setTimeout(() => {
      this.autoPlayNextCard();
    }, 400);
  }

  applyProgress(progressData) {
    if (!progressData) return;
    console.log("Applying restored progress:", progressData);
    this.currentIndex = progressData.current_index || 0;
    this.progressHistory = progressData.progress || [];
    this.doneCards.clear();
    this.notDoneCards.clear();
    this.progressHistory.forEach((item) => {
      if (item.impression === "right") this.doneCards.add(item.card_id);
      else this.notDoneCards.add(item.card_id);
    });
    if (progressData.completed) {
      const cardDisplayArea = document.getElementById("card-display-area");
      cardDisplayArea.innerHTML = this.renderResults();
      this.attachResultsListeners();
      lucide.createIcons();
    } else {
      this.updateUI();
    }
  }
}
