class Checklist extends CardComponent {
  constructor(data) {
    super(data);
    // Initialize the state of completed items
    this.completedItems = new Set(
      data.items.filter((item) => item.completed).map((item) => item.id)
    );
  }

  render() {
    const totalItems = this.data.items.length;
    const completedCount = this.completedItems.size;
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    return `
            <div class="card checklist" id="card-${this.data.id}">
                <div class="card-content">
                    <h2 class="card-title">${this.data.title}</h2>
                    <p class="card-subtitle">${this.data.subtitle}</p>

                    <!-- New Progress Header -->
                    <div class="checklist-progress-header">
                        <div class="progress-header-top">
                            <i class="fas fa-book-open"></i>
                            <span>Development Progress</span>
                            <span class="progress-counter">${completedCount}/${totalItems}</span>
                            <button class="reset-btn"><i class="fas fa-sync-alt"></i></button>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fg" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-header-bottom">
                            <span>${Math.round(progress)}% Complete</span>
                            <span>Building foundational understanding</span>
                        </div>
                    </div>

                    <!-- Redesigned Checklist -->
                    <ul class="checklist-list">
                        ${this.data.items
                          .map((item) => this.renderListItem(item))
                          .join("")}
                    </ul>
                </div>
            </div>
        `;
  }

  renderListItem(item) {
    const isCompleted = this.completedItems.has(item.id);
    return `
            <li class="checklist-item ${
              isCompleted ? "completed" : ""
            }" data-item-id="${item.id}">
                <div class="custom-checkbox">
                    ${isCompleted ? '<i class="fas fa-check"></i>' : ""}
                </div>
                <label>${item.text}</label>
                ${
                  isCompleted
                    ? '<span class="complete-chip">Complete</span>'
                    : ""
                }
            </li>
        `;
  }

  attachEventListeners() {
    const componentRoot = document.getElementById(`card-${this.data.id}`);
    if (!componentRoot) return;

    // Handle item clicks
    componentRoot.querySelectorAll(".checklist-item").forEach((item) => {
      item.addEventListener("click", () => {
        const itemId = item.dataset.itemId;
        if (this.completedItems.has(itemId)) {
          this.completedItems.delete(itemId);
        } else {
          this.completedItems.add(itemId);
        }
        this.updateUI();
      });
    });

    // Handle reset button click
    componentRoot.querySelector(".reset-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent item click from firing
      this.completedItems.clear();
      this.updateUI();
    });
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
