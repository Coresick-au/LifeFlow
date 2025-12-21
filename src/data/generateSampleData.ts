import { Story } from '../types';
import { generateCareerTestData } from './generateCareerTestData';

// Sample event templates for different categories
const eventTemplates = {
  career: [
    { title: "Started new job", content: "Began an exciting new chapter in my career journey.", importance: "high" as const },
    { title: "Completed major project", content: "Successfully delivered a critical project at work.", importance: "high" as const },
    { title: "Received promotion", content: "Hard work paid off with a well-deserved promotion.", importance: "high" as const },
    { title: "Learned new skill", content: "Acquired a valuable professional skill.", importance: "medium" as const },
    { title: "Team celebration", content: "Celebrated team success with colleagues.", importance: "low" as const },
  ],
  personal: [
    { title: "Personal milestone", content: "Reached an important personal goal.", importance: "medium" as const },
    { title: "Started new hobby", content: "Discovered a new passion and hobby.", importance: "low" as const },
    { title: "Overcame challenge", content: "Successfully navigated through a difficult period.", importance: "high" as const },
    { title: "Made new friend", content: "Formed a meaningful new friendship.", importance: "medium" as const },
    { title: "Personal reflection", content: "Took time for self-reflection and growth.", importance: "low" as const },
  ],
  health: [
    { title: "Started fitness routine", content: "Committed to a regular exercise schedule.", importance: "medium" as const },
    { title: "Ran personal best", content: "Achieved a new personal record in running.", importance: "medium" as const },
    { title: "Health checkup", content: "Completed annual health examination.", importance: "low" as const },
    { title: "Tried new sport", content: "Explored a new physical activity.", importance: "low" as const },
    { title: "Meditation milestone", content: "Reached 100 days of consistent meditation.", importance: "medium" as const },
  ],
  travel: [
    { title: "Weekend getaway", content: "Escaped for a refreshing weekend trip.", importance: "low" as const },
    { title: "International adventure", content: "Explored a new country and culture.", importance: "high" as const },
    { title: "Road trip", content: "Embarked on an epic road trip adventure.", importance: "medium" as const },
    { title: "Visit family", content: "Traveled to spend quality time with family.", importance: "medium" as const },
    { title: "Spontaneous trip", content: "Took an unplanned adventure.", importance: "low" as const },
  ],
  learning: [
    { title: "Completed course", content: "Finished an educational course successfully.", importance: "medium" as const },
    { title: "Read influential book", content: "Read a book that changed my perspective.", importance: "medium" as const },
    { title: "Attended workshop", content: "Participated in an insightful workshop.", importance: "low" as const },
    { title: "Learned language basics", content: "Started learning a new language.", importance: "medium" as const },
    { title: "Certification achieved", content: "Earned a professional certification.", importance: "high" as const },
  ],
  family: [
    { title: "Family gathering", content: "Enjoyed a wonderful family reunion.", importance: "medium" as const },
    { title: "Celebrated milestone", content: "Celebrated a family member's achievement.", importance: "high" as const },
    { title: "Helped relative", content: "Provided support to a family member in need.", importance: "medium" as const },
    { title: "Family tradition", content: "Participated in a beloved family tradition.", importance: "low" as const },
    { title: "Created memories", content: "Made lasting memories with loved ones.", importance: "medium" as const },
  ],
};

const moods = ['happy', 'neutral', 'excited', 'proud', 'grateful'] as const;
const locations = [
  'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Boston, MA', 'Seattle, WA', 'Austin, TX', 'Portland, OR',
  'Denver, CO', 'Miami, FL', 'Paris, France', 'Tokyo, Japan',
  'London, UK', 'Barcelona, Spain', 'Rome, Italy', 'Amsterdam, Netherlands'
];
const people = [
  'Sarah', 'Mike', 'Jessica', 'David', 'Emma', 'John', 'Lisa', 'Chris',
  'Amy', 'Tom', 'Rachel', 'Kevin', 'Emily', 'Mark', 'Laura', 'Steve',
  'Anna', 'Paul', 'Michelle', 'Ryan', 'Sophie', 'Ben', 'Olivia', 'Nathan'
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateStoryForYear(year: number, index: number): Story {
  const categories: Array<keyof typeof eventTemplates> = ['career', 'personal', 'health', 'travel', 'learning', 'family'];
  const category = randomChoice(categories);
  const template = randomChoice(eventTemplates[category]);
  const date = randomDate(new Date(year, 0, 1), new Date(year, 11, 31));
  
  const tags: string[] = [category];
  if (Math.random() > 0.5) {
    // Add a second tag sometimes
    const extraTags: Record<keyof typeof eventTemplates, string[]> = {
      career: ['work', 'achievement', 'success'],
      personal: ['growth', 'reflection', 'milestone'],
      health: ['fitness', 'wellness', 'exercise'],
      travel: ['adventure', 'exploration', 'vacation'],
      learning: ['education', 'skill', 'knowledge'],
      family: ['love', 'tradition', 'celebration'],
    };
    tags.push(randomChoice(extraTags[category]));
  }

  const moodArray: ('happy' | 'neutral' | 'excited' | 'proud' | 'grateful')[] = ['happy', 'neutral', 'excited', 'proud', 'grateful'];

  // Add 1-3 random people to the story
  const storyPeople: string[] = [];
  const numPeople = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numPeople; i++) {
    const person = randomChoice(people);
    if (!storyPeople.includes(person)) {
      storyPeople.push(person);
    }
  }

  return {
    id: `story-${year}-${index}`,
    title: template.title,
    content: template.content,
    type: Math.random() > 0.7 ? 'long' : 'short',
    date: date,
    tags: tags,
    people: storyPeople,
    mood: randomChoice(moodArray),
    importance: template.importance,
    location: randomChoice(locations),
    createdAt: date,
    updatedAt: date,
  };
}

export function generateExtendedSampleData(): Story[] {
  // Return realistic career test data instead of random data
  const careerStories = generateCareerTestData();
  
  // Add some non-career stories for variety
  const nonCareerStories: Story[] = [
    {
      id: 'personal-1',
      title: 'Learned to Play Guitar',
      content: 'Started learning guitar as a new hobby. Practicing daily and already learned basic chords.',
      type: 'short',
      date: new Date(2020, 2, 15),
      tags: ['personal', 'hobby', 'skill'],
      people: [],
      importance: 'low',
      mood: 'happy',
      location: 'New York, NY',
      createdAt: new Date(2020, 2, 15),
      updatedAt: new Date(2020, 2, 15),
      images: [],
      metadata: {},
      fuzzyDate: false
    },
    {
      id: 'travel-1',
      title: 'Backpacking Through Europe',
      content: 'Two-week backpacking trip through Italy, France, and Spain. Visited 8 cities and experienced amazing cultures.',
      type: 'long',
      date: new Date(2021, 6, 10),
      endDate: new Date(2021, 6, 25),
      tags: ['travel', 'adventure', 'personal'],
      people: ['Mike', 'Jessica'],
      importance: 'medium',
      mood: 'excited',
      location: 'Europe',
      createdAt: new Date(2021, 6, 10),
      updatedAt: new Date(2021, 6, 25),
      images: [],
      metadata: {},
      fuzzyDate: false
    },
    {
      id: 'health-1',
      title: 'Ran First 10K Race',
      content: 'Completed first 10K race with a time of 52 minutes. Training consistently for 3 months paid off!',
      type: 'short',
      date: new Date(2022, 4, 20),
      tags: ['health', 'fitness', 'achievement'],
      people: [],
      importance: 'medium',
      mood: 'proud',
      location: 'Central Park, NY',
      createdAt: new Date(2022, 4, 20),
      updatedAt: new Date(2022, 4, 20),
      images: [],
      metadata: {},
      fuzzyDate: false
    }
  ];
  
  // Combine and sort by date
  return [...careerStories, ...nonCareerStories].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export const seedProfile = {
  id: 'seed-profile-1',
  name: 'Alex Johnson',
  birthDate: new Date('1990-05-15'),
  location: 'San Francisco, CA',
  bio: 'Software developer passionate about learning, growth, and making a difference. Love hiking, reading, and playing guitar.'
};
