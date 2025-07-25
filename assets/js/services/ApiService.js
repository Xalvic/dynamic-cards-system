const ApiService = {
  async fetchCardData(actionId) {
    // Updated to handle both old and new flashcard types
    // newDrawingFlashcards

    if (actionId === "newDrawingFlashcards") {
      return this.transformApiData(this.getMockData(actionId), actionId);
    }
    if (actionId === "drawingFlashcards") {
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
          description: "",
          hint: "Tap to flip",
        },
        back: {
          title: "",
          description:
            card.content,
        },
        icon: card.icon, // Pass the icon name
        type: card.type, // Pass the icon name
        styles: {
          gradient: card["background-gradient-color"],
          textColor: card["text-color"],
        },
      })),
    };
  },

  getNotifications() {
    return [
      // {
      //   id: "notif1",
      //   type: "quiz",
      //   title: "Quiz: Deep Work Principles",
      //   actionId: "deepWorkQuiz",
      // },
      // {
      //   id: "notif_api",
      //   type: "flashcards",
      //   title: "Flashcards: Drawing Tips (Grid)",
      //   actionId: "drawingFlashcards",
      // },
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
      newDrawingFlashcards: {
        cards: [
          {
            "background-gradient-color": ["#F0FDF4", "#DCFCE7"],
            content:
              "The face can be divided into equal sections to guide accurate placement of features. Practice the basic proportions before adding details.",
            icon: "Ruler",
            "text-color": "#064E3B",
            title: "Understanding Facial Proportions",
            type: "insight",
          },
          {
            "background-gradient-color": ["#FEF2F2", "#FEE2E2"],
            content:
              "Begin by sketching simple shapes like ovals and lines to map out the head and facial features. This provides a solid foundation.",
            icon: "Shapes",
            "text-color": "#B91C1C",
            title: "Start with Basic Shapes",
            type: "tip",
          },
          {
            "background-gradient-color": ["#ECFDF5", "#D1FAE5"],
            content:
              '"Art is not what you see, but what you make others see." - Edgar Degas. Take your time and enjoy the process.',
            icon: "Brush",
            "text-color": "#065F46",
            title: "Patience is Key",
            type: "quote",
          },
          {
            "background-gradient-color": ["#FFFBEB", "#FEF3C7"],
            content:
              "Observe how light falls on the face to create depth and form. Use shading techniques to define contours and add realism.",
            icon: "Sun",
            "text-color": "#713F12",
            title: "Light and Shadow",
            type: "insight",
          },
          {
            "background-gradient-color": ["#E0F2FE", "#BAE6FD"],
            content:
              "Eyes are the windows to the soul. Pay close attention to the shape, highlights, and shadows to capture their expressiveness.",
            icon: "Eye",
            "text-color": "#075985",
            title: "Practice Eye Details",
            type: "tip",
          },
          {
            "background-gradient-color": ["#F5F3FF", "#EDE9FE"],
            content:
              "Every artist makes mistakes. Don't be afraid to experiment and learn from your errors. Keep practicing and you'll improve.",
            icon: "Sparkles",
            "text-color": "#5B21B6",
            title: "Embrace Imperfection",
            type: "motivation",
          },
          {
            "background-gradient-color": ["#F0F9FF", "#E0F2FE"],
            content:
              "Understanding the underlying bone structure and muscles of the face will greatly enhance your ability to draw realistic portraits.",
            icon: "Brain",
            "text-color": "#0369A1",
            title: "Study Anatomy",
            type: "insight",
          },
        ],
        id: "newDrawingFlashcards",
        type: "new-flashcards",
        subtitle:
          "Unlock your artistic potential with these essential drawing tips.",
        title: "Mastering the Human Face",
      },
    };
    return mockData[actionId] || null;
  },
};
