const ApiService = {
  async fetchCardData(actionId) {
    // Updated to handle both old and new flashcard types
    if (
      actionId === "drawingFlashcards" ||
      actionId === "newDrawingFlashcards"
    ) {
      return this.fetchDrawingFlashcards(actionId);
    }
    return this.getMockData(actionId);
  },

  async fetchDrawingFlashcards(actionId) {
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

      if (!response.ok) throw new Error(`API request failed`);

      const apiData = await response.json();

      // Pass the actionId to the transformer
      return this.transformApiData(apiData.data, actionId);
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      return null;
    }
  },

  transformApiData(data, actionId) {
    if (!data.cards) return null;

    // Determine the 'type' based on which notification was clicked
    const componentType =
      actionId === "newDrawingFlashcards" ? "new-flashcards" : "flashcards";

    return {
      id: actionId,
      type: componentType,
      title: data.title,
      subtitle: data.subtitle,
      cards: data.cards.map((card, index) => ({
        id: `api_fc_${index}`,
        step: `Tip ${index + 1} of ${data.cards.length}`,
        duration: "1 minute",
        front: {
          title: card.title,
          description: card.content,
          hint: "Tap to flip",
        },
        back: {
          title: "Reflection",
          description:
            "How can you apply this insight to your next drawing session?",
        },
        icon: card.icon, // Pass the icon name
        styles: {
          gradient: card["background-gradient-color"],
          textColor: card["text-color"],
        },
      })),
    };
  },

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
        title: "Flashcards: Drawing Tips (Grid)",
        actionId: "drawingFlashcards",
      },
      {
        id: "notif_new_api",
        type: "new-flashcards",
        title: "Flashcards: Drawing Tips (Slider)",
        actionId: "newDrawingFlashcards",
      },
      {
        id: "notif3",
        type: "checklist",
        title: "Checklist: Deep Work Setup",
        actionId: "deepWorkChecklist",
      },
    ];
  },

  getMockData(actionId) {
    const mockData = {
      deepWorkQuiz: {
        id: "deepWorkQuiz",
        type: "quiz",
        title: "Deep Work - Quiz",
        subtitle: "Test your knowledge of Cal Newport's Deep Work",
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
        ],
      },
      deepWorkChecklist: {
        id: "deepWorkChecklist",
        type: "checklist",
        title: "Deep Work Implementation",
        subtitle: "Practical steps to transform your focus and productivity.",
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
        ],
      },
    };
    return mockData[actionId] || null;
  },
};
