class NewFlashCard extends CardComponent {
  constructor(data) {
    super(data);
    this.data = data;
    this.interactionId = data.interactionId;
    this.resetState();
  }

  resetState() {
    this.currentIndex = 0;
    this.currentStatus = false;
    // this.swipeHistory = [];
    this.progressHistory = [];
    this.favoritedCards = new Set();
    this.doneCards = new Set();
    this.notDoneCards = new Set();
    this.correctStreak = 0;
    this.messageIndex = 0;
    this.autoPlay = false;
    this.autoPlayInterval = null;
  }

  render() {
    console.log(this.data);
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
                                  totalCards > 0
                                    ? (completedCount / totalCards) * 100
                                    : 0
                                }%"></div>
                            </div>
                        </div>
                        <div class="header-controls">
                            <!-- Removed duplicate recall button from header-controls -->
                        </div>
                        <span class="card-counter">${completedCount} / ${totalCards}</span>
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

  renderResults() {
    const payload = {
      userId: localStorage.getItem("user_id"),
      appId: localStorage.getItem("app_id"),
      interactionId: this.interactionId,
      progress: this.progressHistory,
      currentIndex: this.currentIndex,
      completed: true, // Mark as completed
    };
    ApiService.updateActivityProgress(payload);

    const total = this.data.cards.length;
    const doneCount = this.doneCards.size;
    const notDoneCount = this.notDoneCards.size;
    const accuracy = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    // --- NEW: Dynamic title and subtitle based on score ---
    let title = "";
    let subtitle = "";
    if (accuracy >= 90) {
      title = "Excellent Work!";
      subtitle = "You've mastered this set. Time for a new challenge!";
    } else if (accuracy >= 60) {
      title = "Great Progress!";
      subtitle =
        "You're getting the hang of it. Keep reviewing the tough ones!";
    } else {
      title = "Keep Going!";
      subtitle = "Practice makes perfect. Let's give this set another try.";
    }

    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (accuracy / 100) * circumference;

    return `
      <div class="card new-flashcard-set" id="card-${this.data.id}">
          <div class="flashcard-results">
              <div class="results-card" data-accuracy="${accuracy}">
                  <h3 class="results-title">${title}</h3>
                  <p class="results-subtitle">${subtitle}</p>
                  
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
                          <div class="summary-chip not-done">Learning <span>${notDoneCount}</span></div>
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
  triggerBonusParticles() {
    const resultsCard = document.querySelector(".results-card");
    if (!resultsCard) return;

    const container = document.createElement("div");
    container.classList.add("celebration-container");
    resultsCard.appendChild(container);

    const colors = ["#A8D0E6", "#F7D4A2", "#84DCC6", "#FFAAA5"];

    // This creates the particle burst using anime.js
    for (let i = 0; i < 60; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");
      particle.style.backgroundColor =
        colors[anime.random(0, colors.length - 1)];
      particle.style.left = `${anime.random(10, 90)}%`;
      particle.style.top = `${anime.random(20, 80)}%`;
      container.appendChild(particle);

      anime({
        targets: particle,
        scale: [0, anime.random(0.5, 1.2)],
        opacity: [1, 0],
        translateY: [0, anime.random(-100, 100)],
        duration: anime.random(1000, 2000),
        easing: "easeOutExpo",
        complete: () => container.removeChild(particle),
      });
    }

    setTimeout(() => {
      if (resultsCard.contains(container)) {
        resultsCard.removeChild(container);
      }
    }, 2500);
  }
  triggerResultsCelebration(score) {
    // Ensure the <dotlottie-player> component is loaded
    if (typeof customElements.get("dotlottie-player") === "undefined") {
      console.error("DotLottie player not loaded.");
      return;
    }

    let lottiePath = "";

    // --- Select the animation based on score ---
    if (score >= 90) {
      // IMPORTANT: Change to your "grand" animation file path
      lottiePath = "../../../assets/animations/Confetti-3.lottie";
    } else if (score >= 60) {
      // IMPORTANT: Change to your "simple" animation file path
      lottiePath = "../../../assets/animations/Confetti-2.lottie";
    } else {
      return; // No animation for low scores
    }

    const lottiePlayer = document.createElement("dotlottie-player");
    lottiePlayer.src = lottiePath;
    lottiePlayer.setAttribute("autoplay", true);

    // Append to the body for a full-screen effect
    document.body.appendChild(lottiePlayer);

    // Add an event listener to automatically remove the player when it's done
    lottiePlayer.addEventListener("complete", () => {
      if (document.body.contains(lottiePlayer)) {
        document.body.removeChild(lottiePlayer);
      }
    });
  }

  speakText(text) {
    if ("speechSynthesis" in window && text) {
      // Cancel any currently playing speech to avoid overlap
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // You can configure utterance.voice, utterance.rate, etc. here if needed
      window.speechSynthesis.speak(utterance);
    }
  }

  getIconName(apiIcon) {
    // console.log(apiIcon);
    return apiIcon;
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
  getTypeIconName(apiIcon) {
    // console.log(apiIcon);
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

  // --- NEW: Add this entire method to your class ---
  _animateCardEntry() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    if (!cards.length) return;

    // Instantly set the starting position of the cards (fanned out and invisible)
    // The final stack position is already set by the inline styles from render()
    const baseAngle = 5;
    anime.set(cards, {
      opacity: 0,
      translateY: (el, i) => {
        // Start them lower down
        return 60;
      },
      rotate: (el, i) => {
        // Fan them out slightly
        // const middle = Math.floor(cards.length / 2);
        // return (i - middle) * baseAngle;
        if (i === this.currentIndex) return baseAngle * (i + 1) - 120;
        return baseAngle * (i + 1);
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
  _animateCardRecall() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    if (!cards.length) return;

    const card = cards[this.currentIndex];
    if (!card) return;

    // console.log(this.currentStatus);

    // Optionally: Set starting position if recalling from off-screen
    // Uncomment if needed based on your logic
    // anime.set(card, {
    //   translateX: fromLeft ? -window.innerWidth : window.innerWidth,
    //   rotate: fromLeft ? -30 : 30,
    // });
    anime.set(card, {
      translateX: this.currentStatus ? 100 : -100,
      translateY: 10,
      rotate: this.currentStatus ? 10 : -10,
      opacity: 0,
    });

    // Animate back to center
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
    if (!recall) this._animateCardEntry();
    else this._animateCardRecall();

    if (this.currentIndex >= this.data.cards.length) {
      this.attachResultsListeners();
      return;
    }

    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    const cards = componentRoot.querySelectorAll(".new-flashcard-slide");
    const recallBtn = document.getElementById(`recall-btn-${this.data.id}`);
    const autoplayBtn = componentRoot.querySelector(".autoplay-btn");

    function addTapAnimation(el) {
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

    recallBtn.addEventListener("click", () => {
      addTapAnimation(recallBtn);
      this.stopAutoPlay();
      this.recallCard();
    });
    autoplayBtn.addEventListener("click", () => {
      addTapAnimation(autoplayBtn);
      // Bounce animation for autoplay button only
      autoplayBtn.classList.remove("bounce");
      void autoplayBtn.offsetWidth;
      autoplayBtn.classList.add("bounce");
      this.toggleAutoPlay();
    });

    // Remove global touch handler for stopping auto-play
    // Only stop auto-play if a card is touched/swiped
    cards.forEach((card, index) => {
      if (index < this.currentIndex) card.style.display = "none";

      if (index === this.currentIndex) {
        this.attachInteractiveListeners(card);
        // Add touch/swipe handler to stop auto-play
        card.addEventListener("touchstart", () => {
          if (this.autoPlay) {
            this.stopAutoPlay();
          }
        });
        card.addEventListener("pointerdown", () => {
          if (this.autoPlay) {
            this.stopAutoPlay();
          }
        });
      }
    });
  }

  attachInteractiveListeners(card) {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    const flipper = card.querySelector(".new-flashcard-flipper");
    const favoriteBtn = card.querySelector(".favorite-btn");
    const ttsBtnFront = card.querySelector(".new-flashcard-front .tts-btn");
    const ttsBtnBack = card.querySelector(".new-flashcard-back .tts-btn");
    const leftGlow = componentRoot.querySelector(".left-glow");
    const rightGlow = componentRoot.querySelector(".right-glow");

    // Stop autoplay on any card interaction (flip, swipe, etc)
    const stopAutoplayIfNeeded = () => {
      if (this.autoPlay) this.stopAutoPlay();
    };

    flipper.addEventListener("click", (e) => {
      stopAutoplayIfNeeded();
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

    ttsBtnFront.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card from flipping
      stopAutoplayIfNeeded();
      const cardData = this.data.cards[card.dataset.index];
      this.speakText(cardData.front.title);
    });

    ttsBtnBack.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card from flipping
      stopAutoplayIfNeeded();
      const cardData = this.data.cards[card.dataset.index];
      this.speakText(cardData.back.description);
    });

    const hammertime = new Hammer(card);

    hammertime.on("pan", (ev) => {
      stopAutoplayIfNeeded();
      flipper.classList.add("is-panning");
      const rotation = ev.deltaX / 20;
      // We are reverting to the original logic that allows diagonal movement
      flipper.style.transform = `translate(${ev.deltaX}px, ${ev.deltaY}px) rotate(${rotation}deg)`;

      rightGlow.style.opacity = Math.max(0, ev.deltaX / 100);
      leftGlow.style.opacity = Math.max(0, -ev.deltaX / 100);
    });

    hammertime.on("panend", (ev) => {
      stopAutoplayIfNeeded();
      flipper.classList.remove("is-panning");
      // rightGlow.style.opacity = 0;
      // leftGlow.style.opacity = 0;

      const threshold = 100;
      if (Math.abs(ev.deltaX) > threshold) {
        // SUCCESSFUL SWIPE
        // We REMOVED the lines that set glow opacity to 0 from here.
        // The glow will now stay visible as the card animates away.
        const moveOutWidth = window.innerWidth * 1.5;
        const isDone = ev.deltaX > 0;
        this.currentStatus = isDone;
        const endX = isDone ? moveOutWidth : -moveOutWidth;
        card.style.transform = `translate(${endX}px, ${
          ev.deltaY * 2
        }px) rotate(${ev.deltaX / 10}deg)`;

        this.nextCard(isDone);
      } else {
        // FAILED SWIPE
        // We still hide the glow when the card snaps back to center.
        rightGlow.style.opacity = 0;
        leftGlow.style.opacity = 0;
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
          '<div class="placeholder"><i data-lucide="mouse-pointer-click"></i><h2>Welcome!</h2><p>Open the menu to select a user action.</p></div>';
        lucide.createIcons();
      });
    }

    if (window.anime) {
      const resultsCard = document.querySelector(".results-card");
      const progressBar = resultsCard.querySelector(".progress-bar");
      const finalOffset = progressBar.dataset.offset;
      const accuracy = parseInt(resultsCard.dataset.accuracy, 10);

      const tl = anime.timeline({
        easing: "spring(1, 80, 10, 0)", // Use a bouncy spring easing
        duration: 800,
      });

      tl.add({
        targets: ".results-card",
        scale: [0.8, 1],
        opacity: [0, 1],
      })
        .add(
          {
            targets: ".results-title, .results-subtitle",
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100, { easing: "easeOutQuad" }),
          },
          "-=600"
        )
        .add(
          {
            targets: progressBar,
            strokeDashoffset: [anime.setDashoffset, finalOffset],
            opacity: 1,
            duration: 1500,
            easing: "easeInOutCirc",
          },
          "-=500"
        )
        .add(
          {
            targets: ".results-summary .summary-chip, .results-actions button",
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100, { easing: "easeOutQuad" }),
          },
          "-=1200"
        );

      // Trigger the score-based celebration after a short delay
      setTimeout(() => {
        this.triggerResultsCelebration(accuracy);
        if (accuracy >= 90) {
          this.triggerBonusParticles();
        }
      }, 500);
    }
  }

  nextCard(isDone) {
    if (this.currentIndex < this.data.cards.length) {
      setTimeout(() => {
        // Find the current glow elements at the moment of fade-out
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

      // 1. Add the latest swipe to our progress history
      const impression = isDone ? "right" : "left";
      this.progressHistory.push({ card_id: cardId, impression: impression });

      // 2. Prepare the payload for the API
      const payload = {
        userId: localStorage.getItem("user_id"),
        appId: localStorage.getItem("app_id"),
        interactionId: this.interactionId,
        progress: this.progressHistory,
        currentIndex: this.currentIndex + 1, // API wants the *next* index
        completed: false, // Not completed yet
      };

      // 3. Call the tracking function (it runs in the background)
      ApiService.updateActivityProgress(payload);

      // this.swipeHistory.push({
      //   cardId,
      //   wasDone: this.doneCards.has(cardId),
      //   wasNotDone: this.notDoneCards.has(cardId),
      // });

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

    // --- 1. SCORE LOGIC UPDATE ---
    // Progress is now based on cards answered, not the current index.
    const completedCount = this.doneCards.size + this.notDoneCards.size;
    const totalCards = this.data.cards.length;

    const counter = cardSetElement.querySelector(".card-counter");
    if (counter) {
      counter.textContent = `${completedCount} / ${totalCards}`;
    }

    const progressBarFill = cardSetElement.querySelector(
      ".progress-bar-unified-fill"
    );
    if (progressBarFill) {
      const percentage =
        totalCards > 0 ? (completedCount / totalCards) * 100 : 0;
      progressBarFill.style.width = `${percentage}%`;
    }

    // --- 2. "ON FIRE" MODE LOGIC ---
    // Check if 50% or more cards are marked correct.
    const progressBar = cardSetElement.querySelector(".progress-bar-unified");
    if (progressBar) {
      const correctPercentage =
        totalCards > 0 ? this.doneCards.size / totalCards : 0;
      if (correctPercentage >= 0.5) {
        progressBar.classList.add("is-on-fire");
      } else {
        progressBar.classList.remove("is-on-fire");
      }
    }

    const header = cardSetElement.querySelector(".new-flashcard-header");
    if (header) {
      const correctPercentage =
        totalCards > 0 ? this.doneCards.size / totalCards : 0;
      if (correctPercentage >= 0.5) {
        header.classList.add("is-on-fire");
      } else {
        header.classList.remove("is-on-fire");
      }
    }

    const recallBtn = cardSetElement.querySelector(".recall-btn");
    if (recallBtn) {
      recallBtn.disabled = this.progressHistory.length === 0;
    }
  }
  recallCard() {
    if (this.progressHistory.length > 0) {
      // Full re-render is simplest for recall
      const lastAction = this.progressHistory.pop();
      const cardId = lastAction.card_id;

      if (lastAction.impression === "right") {
        this.doneCards.delete(cardId);
      } else {
        this.notDoneCards.delete(cardId);
      }
      // 3. Revert the currentIndex
      this.currentIndex--;

      // 4. Update the API with the new, reverted state
      const payload = {
        userId: localStorage.getItem("user_id"),
        appId: localStorage.getItem("app_id"),
        interactionId: this.interactionId,
        progress: this.progressHistory,
        currentIndex: this.currentIndex,
        completed: false,
      };
      ApiService.updateActivityProgress(payload);

      // 5. Re-render the UI
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
    this.updateAutoPlayButton(); // Ensure icon is always in sync
    // Enable/disable floating recall button based on swipeHistory
    const recallBtn = document.getElementById(`recall-btn-${this.data.id}`);
    if (recallBtn) {
      recallBtn.disabled = this.progressHistory.length === 0;
    }
    if (recallBounce) {
      // Bounce the recall button after re-render
      if (recallBtn) {
        recallBtn.classList.remove("bounce");
        void recallBtn.offsetWidth;
        recallBtn.classList.add("bounce");
      }
    }
  }

  toggleAutoPlay() {
    if (this.autoPlay) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
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
      // Set icon directly for immediate update
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

    // Check if card is flipped (showing back)
    const isFlipped = flipper.classList.contains("flipped");

    if (!isFlipped) {
      // Flip the card to show back
      flipper.classList.add("flipped");
      // Wait 2 seconds then swipe left
      this.autoPlayInterval = setTimeout(() => {
        this.autoPlaySwipeLeft(currentCard);
      }, 2000);
    } else {
      // Card is already flipped, swipe left immediately
      this.autoPlaySwipeLeft(currentCard);
    }
  }

  autoPlaySwipeLeft(currentCard) {
    if (!this.autoPlay) return;

    // Simulate swipe left (not done)
    const moveOutWidth = window.innerWidth * 1.5;
    currentCard.style.transform = `translate(${-moveOutWidth}px, 0px) rotate(-10deg)`;

    // Process the card as not done
    this.nextCard(false);

    // Continue with next card after animation
    setTimeout(() => {
      this.autoPlayNextCard();
    }, 400);
  }

  applyProgress(progressData) {
    if (!progressData) return;

    console.log("Applying restored progress:", progressData);

    this.currentIndex = progressData.current_index || 0;
    this.progressHistory = progressData.progress || [];

    // Clear and re-populate the done/not-done sets from the history
    this.doneCards.clear();
    this.notDoneCards.clear();
    this.progressHistory.forEach((item) => {
      if (item.impression === "right") {
        this.doneCards.add(item.card_id);
      } else {
        this.notDoneCards.add(item.card_id);
      }
    });

    // If the session was already completed, go straight to the results screen
    if (progressData.completed) {
      const cardDisplayArea = document.getElementById("card-display-area");
      cardDisplayArea.innerHTML = this.renderResults();
      this.attachResultsListeners();
      lucide.createIcons();
    } else {
      // Otherwise, update the UI to the restored state (progress bar, etc.)
      this.updateUI();
    }
  }
}
