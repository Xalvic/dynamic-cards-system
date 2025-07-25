const ApiService = {
  // This function now determines which data to fetch
  async fetchCardData(actionId) {
    // If the action is for our new API-driven flashcards, fetch from the server.
    if (actionId === "drawingFlashcards") {
      return this.fetchDrawingFlashcards();
    }

    // Otherwise, return the local mock data for other components.
    return this.getMockData(actionId);
  },

  // --- NEW: API Fetching Logic ---
  async fetchDrawingFlashcards() {
    const apiUrl =
      "https://us-central1-riafy-public.cloudfunctions.net/genesis?otherFunctions=dexDirect&type=r10-apps-ftw";
    const requestBody = {
      appname: "re-engage",
      ogQuery:
        '{"appname":"Learn drawing App","recent-user-actions":["Took course to draw human face"]}',
      "reply-mode": "json",
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const apiData = await response.json();

      // Transform the API data into the format our component expects
      return this.transformApiData(apiData.data);
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      // Return null or a default error state if the API fails
      return null;
    }
  },

  // --- NEW: Data Transformation Logic ---
  transformApiData(data) {
    // The API response for flashcards is under the 'cards' key
    if (!data.cards) return null;

    return {
      id: "drawingFlashcards",
      type: "flashcards", // This tells the app which component to render
      title: data.title,
      subtitle: data.subtitle,
      cards: data.cards.map((card, index) => ({
        id: `api_fc_${index}`,
        step: `Tip ${index + 1} of ${data.cards.length}`,
        duration: "1 minute", // Adding a default duration
        front: {
          title: card.title,
          description: card.content,
          hint: "Tap to flip",
        },
        back: {
          title: "Reflection",
          description:
            "How can you apply this insight to your next drawing session? Take a moment to think about it.",
        },
        // Store the dynamic styling information
        styles: {
          gradient: card["background-gradient-color"],
          textColor: card["text-color"],
        },
      })),
    };
  },

  // This function provides the notifications, including our new one
  getNotifications() {
    return [
      {
        id: "notif1",
        type: "quiz",
        title: "Quiz: Deep Work Principles",
        actionId: "deepWorkQuiz",
      },
      {
        id: "notif_api",
        type: "flashcards",
        title: "New! Drawing Tips", // This will trigger the API call
        actionId: "drawingFlashcards",
      },
      {
        id: "notif3",
        type: "checklist",
        title: "Checklist: Deep Work Setup",
        actionId: "deepWorkChecklist",
      },
    ];
  },

  // This holds the local mock data for components not using the API yet
  getMockData(actionId) {
    const mockData = {
      deepWorkQuiz: {
        id: "deepWorkQuiz",
        type: "quiz",
        title: "Deep Work - Quiz",
        subtitle: "Test your knowledge of Cal Newport's Deep Work",
        // Correct answers are marked with an asterisk for processing
        questions: [
          {
            question: "What is Deep Work?",
            options: [
              "*Professional activities performed in a state of distraction-free concentration",
              "Shallow tasks completed quickly",
              "Multitasking on several projects",
              "Networking and collaboration",
            ],
          },
          {
            question: "What is the Deep Work Hypothesis?",
            options: [
              "Deep work is not important in today's economy",
              "*The ability to perform deep work is becoming increasingly rare and valuable",
              "Shallow work is more efficient",
              "Deep work leads to burnout",
            ],
          },
          {
            question: "What strategies can help cultivate deep work?",
            options: [
              "Embrace shallow work completely",
              "*Ritualize, execute, and review your deep work habits",
              "Avoid all technology",
              "Only work when you feel inspired",
            ],
          },
          {
            question: "What is the Deep Work Hypothesis?",
            options: [
              "Deep work is not important in today's economy",
              "*The ability to perform deep work is becoming increasingly rare and valuable",
              "Shallow work is more efficient",
              "Deep work leads to burnout",
            ],
          },
        ],
      },
      deepWorkChecklist: {
        id: "deepWorkChecklist",
        type: "checklist",
        title: "Deep Work Implementation",
        subtitle: "Practical steps to transform your focus and productivity.",
        // Renamed 'tasks' to 'items' and 'task' to 'text' for component consistency
        items: [
          {
            id: "item1",
            text: "Set up a dedicated deep work space with no distractions (phone in another room, notifications off).",
            completed: false,
          },
          {
            id: "item2",
            text: "Block 2-hour focused work sessions in your calendar for your most important project this week.",
            completed: false,
          },
          {
            id: "item3",
            text: "Install a website blocker (Cold Turkey, Freedom) and block social media during work hours.",
            completed: false,
          },
          {
            id: "item4",
            text: "Create a shutdown ritual: write tomorrow's priorities, close laptop, and say 'schedule shutdown complete'.",
            completed: false,
          },
          {
            id: "item5",
            text: "Track your deep work hours this week using a simple timer or app like Toggl.",
            completed: false,
          },
        ],
      },
    };
    return mockData[actionId] || null;
  },
};
