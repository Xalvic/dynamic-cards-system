class CardComponent {
  constructor(data) {
    this.data = data;
  }

  createHeader() {
    const iconClass = {
      flashcard: "fa-solid fa-clone",
      checklist: "fa-solid fa-list-check",
      quiz: "fa-solid fa-question-circle",
    }[this.data.type];

    return `
            <div class="card-header">
                <h3 class="card-title">${this.data.title}</h3>
                <i class="card-type-icon ${iconClass}"></i>
            </div>
        `;
  }

  render() {
    // This method should be overridden by subclasses
    throw new Error("Render method must be implemented by subclasses");
  }

  attachEventListeners() {
    // This method can be overridden by subclasses if needed
  }
}
