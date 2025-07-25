class Quiz extends CardComponent {
  constructor(data) {
    super(data);
    this.data = data;
    this.resetQuiz();
  }

  resetQuiz() {
    this.questions = this.data.questions.map((q) => {
      const correctAnswer = q.options
        .find((opt) => opt.startsWith("*"))
        .substring(1);
      return {
        ...q,
        options: q.options.map((opt) => opt.replace("*", "")),
        correctAnswer: correctAnswer,
      };
    });
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.userAnswers = new Array(this.questions.length).fill(null);
    // NEW: Track seen questions to control animation
    this.seenQuestions = new Set();
  }

  render() {
    return `
            <div class="card quiz" id="card-${this.data.id}">
                <div class="card-content">
                    ${this.renderQuizUI()}
                </div>
            </div>
        `;
  }

  renderQuizUI() {
    if (this.currentQuestionIndex < this.questions.length) {
      const question = this.questions[this.currentQuestionIndex];
      const userAnswer = this.userAnswers[this.currentQuestionIndex];

      // NEW: Conditional animation logic
      const hasBeenSeen = this.seenQuestions.has(this.currentQuestionIndex);
      const animationClass = hasBeenSeen ? "no-animation" : "";
      const animatedQuestion = question.question
        .split(" ")
        .map(
          (word, index) =>
            `<span class="word" style="animation-delay: ${
              index * 0.08
            }s">${word}</span>`
        )
        .join("");

      // Mark as seen after rendering
      if (!hasBeenSeen) {
        this.seenQuestions.add(this.currentQuestionIndex);
      }

      const prevBtnDisabled = this.currentQuestionIndex === 0 ? "disabled" : "";
      const nextBtnDisabled = userAnswer === null ? "disabled" : "";

      return `
                <div class="quiz-main-content">
                    ${this.renderHeader()}
                    <div class="quiz-question-area">
                        <h2 class="quiz-question ${animationClass}">${animatedQuestion}</h2>
                    </div>
                    <div class="quiz-options-area">
                        <div class="quiz-options">
                            ${question.options
                              .map((opt) =>
                                this.renderOptionButton(
                                  opt,
                                  question,
                                  userAnswer
                                )
                              )
                              .join("")}
                        </div>
                        <div class="quiz-footer">
                            <button class="quiz-nav-btn" id="prev-btn" ${prevBtnDisabled}>Previous</button>
                            <button class="quiz-nav-btn" id="next-btn" ${nextBtnDisabled}>Next</button>
                        </div>
                    </div>
                </div>
            `;
    } else {
      return this.renderResults();
    }
  }

  renderHeader() {
    const segments = this.questions
      .map((_, index) => {
        let className = "progress-segment";
        if (this.userAnswers[index] !== null) className += " filled";
        if (index === this.currentQuestionIndex) className += " active";
        return `<div class="${className}"></div>`;
      })
      .join("");

    return `
            <div class="quiz-header">
                <div class="quiz-progress-bar">${segments}</div>
                <div class="quiz-score">Score: ${this.score} / ${this.questions.length}</div>
            </div>
        `;
  }

  renderOptionButton(optionText, question, userAnswer) {
    let classes = "";
    const isAnswered = userAnswer !== null;
    if (isAnswered) {
      const { selected, isCorrect } = userAnswer;
      if (optionText === selected) {
        classes = `selected ${isCorrect ? "correct" : "incorrect"}`;
      } else if (optionText === question.correctAnswer) {
        classes = "correct-answer";
      }
    }
    return `<button class="${classes}" ${
      isAnswered ? "disabled" : ""
    }>${optionText}</button>`;
  }

  renderResults() {
    const accuracy = Math.round((this.score / this.questions.length) * 100);
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (accuracy / 100) * circumference;

    return `
            <div class="quiz-results">
                <div class="results-card">
                    <h3>Quiz Complete!</h3>
                    <div class="circular-progress">
                        <svg width="150" height="150" viewBox="0 0 150 150">
                            <circle class="progress-bg" cx="75" cy="75" r="${radius}"></circle>
                            <circle class="progress-bar" cx="75" cy="75" r="${radius}"
                                style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                            </circle>
                        </svg>
                        <div class="progress-text">
                            <div class="progress-percentage">${accuracy}%</div>
                            <div class="progress-label">Accuracy</div>
                        </div>
                    </div>
                    <button class="try-again-btn">Try Again</button>
                </div>
            </div>
        `;
  }

  update() {
    const contentArea = document.querySelector(
      `#card-${this.data.id} .card-content`
    );
    if (contentArea) {
      contentArea.innerHTML = this.renderQuizUI();
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    if (this.currentQuestionIndex >= this.questions.length) {
      const tryAgainBtn = document.querySelector(".try-again-btn");
      if (tryAgainBtn) {
        tryAgainBtn.addEventListener("click", () => {
          this.resetQuiz();
          this.update();
        });
      }
      return;
    }

    const options = document.querySelectorAll(".quiz-options button");
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");

    options.forEach((button) => {
      if (button.disabled) return;
      button.addEventListener(
        "click",
        (e) => {
          const selectedAnswer = e.target.textContent;
          const isCorrect =
            selectedAnswer ===
            this.questions[this.currentQuestionIndex].correctAnswer;

          if (this.userAnswers[this.currentQuestionIndex] === null) {
            if (isCorrect) this.score++;
          }

          this.userAnswers[this.currentQuestionIndex] = {
            selected: selectedAnswer,
            isCorrect,
          };
          this.update();
        },
        { once: true }
      );
    });

    nextBtn.addEventListener("click", () => {
      this.currentQuestionIndex++;
      this.update();
    });

    prevBtn.addEventListener("click", () => {
      // NEW: When going back, remove from seen so it animates again
      this.seenQuestions.delete(this.currentQuestionIndex - 1);
      this.seenQuestions.delete(this.currentQuestionIndex); // Also remove current one
      this.currentQuestionIndex--;
      this.update();
    });
  }
}
