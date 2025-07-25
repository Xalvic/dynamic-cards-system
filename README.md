# Dynamic Card System

A modern, responsive, and mobile-first PWA designed as an intelligent notification and learning platform. This front-end prototype dynamically generates and displays interactive learning cards, including quizzes, flashcards, and checklists, based on user notifications.

The application features a sleek, dark-themed UI with sophisticated animations and is built with a clean, component-based architecture using vanilla JavaScript, HTML, and CSS.

---

## ✨ Features

- **Component-Based Architecture**: Modular and easy-to-maintain structure using vanilla JavaScript components for different card types.
- **Dynamic Card Rendering**: The app dynamically renders different UI components based on mock data:
    - **Quizzes**: A multi-question quiz component with a story-style progress bar, live score tracking, previous/next navigation, and a polished results screen.
    - **Flashcards**: An interactive flashcard set displayed in a grid. Cards animate into a focused, flippable modal view where users can confirm actions.
    - **Checklists**: A sleek checklist with a progress header, glassmorphism UI, and a reset functionality.
- **Mobile-First Responsive Design**: The UI is fully responsive and designed to feel like a native application on mobile devices.
- **Modern UI/UX**:
    - Default dark theme with an optional light theme (activated via URL parameter `?theme=light`).
    - Subtle noise texture and decorative gradients for a premium feel.
    - Smooth, fluid animations on all interactive elements.
    - Slide-in notification panel for a clean and focused main view.
- **PWA Ready**: Includes a `manifest.json` file, making the web app installable on a user's home screen.

---

## 🛠️ Tech Stack

- **HTML5**
- **CSS3** (with Custom Properties for theming)
- **Vanilla JavaScript (ES6+)**: No frameworks, just modern, clean JavaScript.
- **Font Awesome**: For icons.
- **Google Fonts**: For the Poppins and PT Serif typefaces.

---

## 📂 Project Structure

The project is organized with a clear separation of concerns, making it easy to navigate and debug.


/dynamic-card-system
|-- index.html              # Main HTML entry point
|-- manifest.json           # PWA configuration
|-- README.md               # You are here!
|-- /assets
|   |-- /css
|   |   |-- main.css        # Main CSS hub (imports other stylesheets)
|   |   |-- base.css        # Global styles, variables, and layout
|   |   |-- /components
|   |   |   |-- checklist.css
|   |   |   |-- flashcard.css
|   |   |   |-- notifications.css
|   |   |   |-- quiz.css
|   |-- /js
|   |   |-- main.js         # Main application logic
|   |   |-- /components
|   |   |   |-- CardComponent.js  # Base class for all cards
|   |   |   |-- Checklist.js
|   |   |   |-- FlashCard.js
|   |   |   |-- Quiz.js
|   |   |-- /services
|   |   |   |-- MockData.js
|   |   |   |-- NotificationService.js


---

## 🚀 Getting Started

To run this project locally, you don't need any complex setup.

1.  **Clone or Download**: Download the project files and place them in a folder on your computer.
2.  **Open `index.html`**: The easiest way to run the app is to use a live server extension.
    - **Using VS Code Live Server**: If you have Visual Studio Code, install the "Live Server" extension. Right-click on `index.html` and select "Open with Live Server".
    - **Without a Live Server**: You can also open the `index.html` file directly in your web browser, though some features might work best when served.

---

## 🕹️ How to Use

1.  **Open the App**: When you first load the app, you'll see a welcome screen.
2.  **Access Notifications**: Click the floating hamburger menu icon on the top-left to open the notification panel.
3.  **Select a Card**: Click on any notification (e.g., "Quiz: Deep Work Principles") to load the corresponding component into the main view.
4.  **Interact with Cards**:
    - **Quiz**: Answer questions, navigate with "Next" and "Previous", and view your score on the results screen.
    - **Flashcards**: Click on a card in the grid to open the animated focus view. Flip the card and click "I've Done This" to mark it as complete.
    - **Checklist**: Click on items to mark them as complete and see your progress update in real-time. Click the refresh icon to reset.
5.  **Switch Themes**: To view the light theme, add `?theme=light` to the end of the URL in your browser's address bar.

---