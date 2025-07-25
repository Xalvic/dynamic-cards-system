const MockData = {
  getNotifications: () => [
    {
      id: "notif1",
      type: "quiz",
      title: "Quiz: Deep Work Principles",
      actionId: "deepWorkQuiz",
    },
    {
      id: "notif2",
      type: "flashcards", // Changed from 'flashcard'
      title: "Flashcards: Deep Work Mastery",
      actionId: "deepWorkFlashcards",
    },
    {
      id: "notif3",
      type: "checklist",
      title: "Checklist: Deep Work Setup",
      actionId: "deepWorkChecklist",
    },
  ],

  getCardData: (actionId) => {
    const cards = {
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
      deepWorkFlashcards: {
        id: "deepWorkFlashcards",
        type: "flashcards",
        title: "Deep Work Mastery",
        subtitle:
          "Transform your focus and productivity using Cal Newport's principles for distraction-free work.",
        cards: [
          {
            id: "fc_1",
            step: "Step 1 of 3",
            duration: "5 minutes",
            front: {
              title: "Block Distracting Websites",
              description:
                "Eliminate digital temptations to enter a state of deep concentration.",
              hint: "Tap to see action step",
            },
            back: {
              title: "Action Step",
              description:
                "Install a website blocker like Freedom or Cold Turkey. Create a blocklist of your most distracting sites (social media, news) and activate it during your scheduled deep work blocks.",
            },
          },
          {
            id: "fc_2",
            step: "Step 2 of 3",
            duration: "10 minutes",
            front: {
              title: "Schedule Your Deep Work",
              description:
                "Proactively block out time in your calendar for focused work sessions.",
              hint: "Tap to see action step",
            },
            back: {
              title: "Action Step",
              description:
                'Open your calendar now. Find a 90-minute slot every day for the next week. Create an event named "Deep Work" and treat it as an unbreakable appointment.',
            },
          },
          {
            id: "fc_3",
            step: "Step 3 of 3",
            duration: "2 minutes",
            front: {
              title: "Create a Shutdown Ritual",
              description:
                "Signal to your brain that the workday is over to prevent work from bleeding into your personal time.",
              hint: "Tap to see action step",
            },
            back: {
              title: "Action Step",
              description:
                'At the end of your workday, say "Shutdown complete" out loud. This simple phrase creates a clear boundary, helping you to fully disconnect and recharge.',
            },
          },
        ],
      },
    };
    return cards[actionId] || null;
  },
};
