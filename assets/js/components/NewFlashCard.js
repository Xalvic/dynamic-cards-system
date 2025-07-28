class NewFlashCard extends CardComponent {
  constructor(data) {
    super(data);
    this.data = data;
    // --- MODIFIED: Store original cards for "Restart" and "Review" ---
    this.originalCards = [...data.cards];
    this.interactionId = data.interactionId;
    // --- ✨ NEW: To store progress between sessions ---
    this.knownFromPreviousSession = new Set();
    this.initializeState(data.progress);
    this.completionSound = new Audio("../../../assets/sounds/complete.mp3");
  }

  async handleShare() {
    const resultsPage = document.querySelector(".results-page");
    if (!resultsPage) return;

    // Temporarily hide the share button itself from the screenshot
    const shareButton = resultsPage.querySelector(".share-btn");
    if (shareButton) shareButton.style.opacity = "0";

    try {
      const canvas = await html2canvas(resultsPage, {
        useCORS: true, // Important for external images/fonts
        backgroundColor: "#f8fafc", // Set a background for transparency
      });

      // Restore the share button's visibility
      if (shareButton) shareButton.style.opacity = "1";

      // Convert canvas to a Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("Canvas to Blob conversion failed.");
          return;
        }

        const file = new File([blob], "flashcard-results.png", {
          type: "image/png",
        });
        const shareData = {
          files: [file],
          title: "My Flashcard Results!",
          text: "Check out my progress on my learning journey.",
        };

        // Use the Web Share API if available
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback for browsers that don't support Web Share API (like desktop)
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "flashcard-results.png";
          link.click();
          URL.revokeObjectURL(link.href);
        }
      }, "image/png");
    } catch (error) {
      console.error("Error capturing or sharing the image:", error);
      if (shareButton) shareButton.style.opacity = "1"; // Ensure button is visible on error
    }
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

  // --- MODIFIED: Handles different types of resets ---
  resetState(fullReset = true) {
    if (fullReset) {
      this.data.cards = [...this.originalCards];
      // On a full restart, clear the carried-over progress
      this.knownFromPreviousSession.clear();
    }
    this.currentIndex = 0;
    this.currentStatus = false;
    this.progressHistory = [];
    // Reset session-specific progress
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
    const payload = {
      userId: localStorage.getItem("user_id"),
      appId: localStorage.getItem("app_id"),
      interactionId: this.interactionId,
      progress: this.progressHistory,
      currentIndex: this.currentIndex,
      completed: true,
    };
    ApiService.updateActivityProgress(payload);

    const totalKnownCount =
      this.knownFromPreviousSession.size + this.doneCards.size;
    const totalLearningCount = this.originalCards.length - totalKnownCount;
    const accuracy =
      this.originalCards.length > 0
        ? Math.round((totalKnownCount / this.originalCards.length) * 100)
        : 0;

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

    const knownPercent =
      this.originalCards.length > 0
        ? totalKnownCount / this.originalCards.length
        : 0;
    const learningPercent =
      this.originalCards.length > 0
        ? totalLearningCount / this.originalCards.length
        : 0;

    const learningArcEnd = learningPercent * 359.99;
    const knownArcEnd = learningArcEnd + knownPercent * 359.99;

    return `
      <div class="card new-flashcard-set" id="card-${this.data.id}">
        <div class="results-page" data-accuracy="${accuracy}">
        <div class="result-wrapper">
          <div class="results-header">
            <button class="results-action-btn share-btn" id="share-btn"><i data-lucide="share-2"></i></button>
            <h3>${title}</h3>
            <p>${subtitle}</p>
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
                <div class="bar-item"><div class="bar-label"><span class="bar-color-dot known"></span><span>Known</span></div><span class="bar-count">${totalKnownCount}</span></div>
                <div class="bar-item"><div class="bar-label"><span class="bar-color-dot learning"></span><span>Still learning</span></div><span class="bar-count">${totalLearningCount}</span></div>
              </div>
            </div>
            <button class="recall-last-btn" ${
              this.progressHistory.length === 0 ? "disabled" : ""
            }><i data-lucide="undo-2"></i> Back to the last question</button>
          </div>
          <div class="results-footer">
            <button class="results-btn secondary" id="review-btn" ${
              totalLearningCount === 0 ? "disabled" : ""
            }><div class="button-overlay"></div> <span>Keep reviewing ${totalLearningCount} terms</span></button>
            <button class="results-btn tertiary" id="restart-btn">Restart Flashcards</button>
          </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- ✨ NEW METHOD ---
  reviewIncorrectCards() {
    this.doneCards.forEach((cardId) =>
      this.knownFromPreviousSession.add(cardId)
    );
    const incorrectCardIds = new Set(this.notDoneCards);
    const reviewDeck = this.originalCards.filter((card) =>
      incorrectCardIds.has(card.id)
    );

    if (reviewDeck.length > 0) {
      this.data.cards = reviewDeck;
      this.resetState(false);
      this.updateUI();
    }
  }

  // --- ✨ ADDED BACK: Your animation methods ---
  triggerBonusParticles() {
    const resultsPage = document.querySelector(".results-page");
    if (!resultsPage) return;

    const container = document.createElement("div");
    container.classList.add("celebration-container");
    resultsPage.appendChild(container);

    const colors = ["#A8D0E6", "#F7D4A2", "#84DCC6", "#FFAAA5"];

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
        complete: () => {
          if (container.contains(particle)) container.removeChild(particle);
        },
      });
    }

    setTimeout(() => {
      if (resultsPage.contains(container)) {
        resultsPage.removeChild(container);
      }
    }, 2500);
  }

  triggerResultsCelebration(score) {
    this.completionSound.play();
    if (typeof customElements.get("dotlottie-player") === "undefined") {
      console.error("DotLottie player not loaded.");
      return;
    }
    let lottiePath = "";
    if (score >= 90) {
      lottiePath = "../../../assets/animations/Confetti-3.lottie";
    } else if (score >= 60) {
      lottiePath = "../../../assets/animations/Confetti-2.lottie";
    } else {
      return;
    }

    const lottiePlayer = document.createElement("dotlottie-player");
    lottiePlayer.src = lottiePath;
    lottiePlayer.setAttribute("autoplay", true);
    lottiePlayer.style.position = "fixed";
    lottiePlayer.style.top = "0";
    lottiePlayer.style.left = "0";
    lottiePlayer.style.width = "100%";
    lottiePlayer.style.height = "100%";
    lottiePlayer.style.zIndex = "9999";
    lottiePlayer.style.pointerEvents = "none";

    document.body.appendChild(lottiePlayer);

    lottiePlayer.addEventListener("complete", () => {
      if (document.body.contains(lottiePlayer)) {
        document.body.removeChild(lottiePlayer);
      }
    });
  }

  // --- ✨ REWRITTEN METHOD to call animations ---
  attachResultsListeners() {
    const reviewBtn = document.getElementById("review-btn");
    const restartBtn = document.getElementById("restart-btn");
    const recallBtn = document.querySelector(".recall-last-btn");
    const resultsPage = document.querySelector(".results-page");
    const shareBtn = document.getElementById("share-btn");

    if (shareBtn) {
      shareBtn.addEventListener("click", () => this.handleShare());
    }

    if (reviewBtn) {
      reviewBtn.addEventListener("click", () => this.reviewIncorrectCards());
    }
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.resetState(true);
        this.updateUI();
      });
    }
    if (recallBtn) {
      recallBtn.addEventListener("click", () => this.recallCard());
    }

    if (resultsPage) {
      const accuracy = parseInt(resultsPage.dataset.accuracy, 10);
      if (!isNaN(accuracy)) {
        // 1. Animate the progress ring arcs
        const learningArc = resultsPage.querySelector(
          ".progress-ring-arc.learning"
        );
        const knownArc = resultsPage.querySelector(".progress-ring-arc.known");

        [learningArc, knownArc].forEach((arc) => {
          if (arc) {
            const length = arc.getTotalLength();
            arc.style.strokeDasharray = length;
            arc.style.strokeDashoffset = length;
            anime({
              targets: arc,
              strokeDashoffset: [length, 0],
              duration: 1500,
              easing: "easeInOutSine",
              delay: 200,
            });
          }
        });
        // 2. Animate the count-up for Known and Still Learning
        const barItems = resultsPage.querySelectorAll(".bar-item");
        anime({
          targets: barItems,
          opacity: [0, 1],
          translateY: [20, 0], // Slide up from below
          delay: anime.stagger(150, { start: 400 }), // Stagger the animation of each bar
          duration: 800,
          easing: "easeOutExpo",
        });
        // 3. Trigger the celebration Lottie/particle animations
        setTimeout(() => {
          this.triggerResultsCelebration(accuracy);
          if (accuracy >= 90) {
            this.triggerBonusParticles();
          }
        }, 500);
      }
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
              <div class="progress-bar-unified">
                <div class="progress-bar-unified-fill" style="width: ${
                  totalCards > 0 ? (completedCount / totalCards) * 100 : 0
                }%"></div>
              </div>
            </div>
            <div class="header-controls">
              <div class="streak-counter-container"></div>
              <div class="card-counter">${
                this.currentIndex + 1
              } / ${totalCards}</div>
            </div>
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
      rotate: (el, i) => baseAngle * (i + 1),
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
    streakMessage.innerHTML = `${this.correctStreak} IN A ROW <i data-lucide="flame" class="streak-flame"></i>`;
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
    if (counter) {
      const currentCardNumber = Math.min(this.currentIndex + 1, totalCards);
      counter.textContent = `${currentCardNumber} / ${totalCards}`;
    }
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
      this.correctStreak = 0;
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
    let cards = document.querySelectorAll(".new-flashcard-slide");
    cards.forEach((element) => {
      element.classList.remove("auto");
    });
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
    currentCard.classList.add("auto");
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
      }, 1700);
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
    }, 1200);
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
