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

// Australian locations for sample data
const locations = [
  'Brisbane CBD', 'South Bank, Brisbane', 'Fortitude Valley', 'West End, Brisbane',
  'Paddington, Brisbane', 'New Farm, Brisbane', 'Toowong, Brisbane', 'Ashgrove, Brisbane',
  'Gold Coast, Queensland', 'Sunshine Coast, Queensland', 'Noosa, Queensland',
  'Cairns, Queensland', 'Sydney, NSW', 'Melbourne, VIC', 'Byron Bay, NSW',
  'Bali, Indonesia', 'Tokyo, Japan', 'Singapore', 'Auckland, New Zealand'
];

const people = [
  'Sarah', 'Matt', 'Jessica', 'David', 'Emma', 'John', 'Lisa', 'Chris',
  'Amy', 'Tom', 'Rachel', 'Kevin', 'Emily', 'Mark', 'Laura', 'Steve',
  'Anna', 'Paul', 'Michelle', 'Ryan', 'Sophie', 'Ben', 'Olivia', 'Nathan'
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
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
      location: 'Home - Paddington',
      createdAt: new Date(2020, 2, 15),
      updatedAt: new Date(2020, 2, 15),
      images: [],
      metadata: {},
      fuzzyDate: false
    },
    {
      id: 'travel-1',
      title: 'Bali Holiday',
      content: 'Two-week holiday in Bali with friends. Visited Ubud, Seminyak, and the Gili Islands. Perfect escape from Brisbane winter!',
      type: 'long',
      date: new Date(2021, 6, 10),
      endDate: new Date(2021, 6, 25),
      tags: ['travel', 'adventure', 'personal'],
      people: ['Matt', 'Jessica'],
      importance: 'medium',
      mood: 'excited',
      location: 'Bali, Indonesia',
      createdAt: new Date(2021, 6, 10),
      updatedAt: new Date(2021, 6, 25),
      images: [],
      metadata: {},
      fuzzyDate: false
    },
    {
      id: 'health-1',
      title: 'Completed Bridge to Brisbane',
      content: 'Completed the Bridge to Brisbane 10km run with a time of 52 minutes. Training consistently for 3 months paid off!',
      type: 'short',
      date: new Date(2022, 7, 28),
      tags: ['health', 'fitness', 'achievement'],
      people: [],
      importance: 'medium',
      mood: 'proud',
      location: 'Brisbane CBD',
      createdAt: new Date(2022, 7, 28),
      updatedAt: new Date(2022, 7, 28),
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
  name: 'James Mitchell',
  birthDate: new Date('1986-02-01'),
  location: 'Brisbane, Queensland',
  bio: 'Brisbane local passionate about learning, property investing, and making a difference in the community. Love hiking, live music, and weekend cricket.'
};
