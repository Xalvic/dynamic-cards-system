class CardComponent {
  constructor(data) {
    this.data = data;
  }

  createHeader() {
    // --- NEW: Mapped to Lucide icon names ---
    const iconName =
      {
        flashcards: "copy",
        "new-flashcards": "layout-dashboard",
        checklist: "list-checks",
        quiz: "help-circle",
      }[this.data.type] || "box"; // Default icon

    return `
            <div class="card-header">
                <h3 class="card-title">${this.data.title}</h3>
                <i class="card-type-icon" data-lucide="${iconName}"></i>
            </div>
        `;
  }

  render() {
    throw new Error("Render method must be implemented by subclasses");
  }

  attachEventListeners() {
    // Optional method for subclasses
  }
}
