import { Story } from '../types';

export const seedStories: Story[] = [
  // January 2024
  {
    id: '1',
    title: 'New Year Resolution',
    content: 'Started the year with a commitment to learn something new every month. Decided to focus on personal growth and career development this year.',
    type: 'short',
    date: new Date('2024-01-01'),
    tags: ['resolution', 'personal', 'growth'],
    people: [],
    mood: 'excited',
    importance: 'high',
    location: 'Home',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  // February 2024
  {
    id: '2',
    title: 'Completed First Marathon',
    content: 'After months of training, finally completed my first half-marathon! The weather was perfect and the crowd was amazing. Crossing that finish line was one of the most emotional moments of my life. All those early morning runs paid off!',
    type: 'long',
    date: new Date('2024-02-14'),
    tags: ['achievement', 'fitness', 'milestone'],
    people: ['Mike', 'Sarah'],
    mood: 'proud',
    importance: 'high',
    location: 'City Park',
    createdAt: new Date('2024-02-14'),
    updatedAt: new Date('2024-02-14')
  },
  // March 2024
  {
    id: '3',
    title: 'Spring Garden Project',
    content: 'Started a small herb garden on the balcony. Planted basil, mint, and rosemary. Excited to cook with fresh ingredients!',
    type: 'short',
    date: new Date('2024-03-15'),
    tags: ['hobby', 'home', 'nature'],
    people: [],
    mood: 'happy',
    importance: 'low',
    location: 'Home',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  },
  // April 2024
  {
    id: '4',
    title: 'Promotion at Work',
    content: 'Got promoted to Senior Developer! All the hard work and late nights finally paid off. The team threw a surprise party and my manager gave a really touching speech about my contributions. Feeling grateful for this opportunity.',
    type: 'long',
    date: new Date('2024-04-10'),
    tags: ['career', 'achievement', 'work'],
    people: ['Jessica', 'David', 'Tom'],
    mood: 'grateful',
    importance: 'high',
    location: 'Office',
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-04-10')
  },
  // May 2024
  {
    id: '5',
    title: 'Weekend Camping Trip',
    content: 'Went camping with friends in the mountains. The stars were incredible and we made s\'mores around the campfire.',
    type: 'short',
    date: new Date('2024-05-20'),
    tags: ['travel', 'friends', 'nature'],
    people: ['Mike', 'Chris', 'Amy'],
    mood: 'happy',
    importance: 'medium',
    location: 'Mountain View Campground',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-20')
  },
  // June 2024
  {
    id: '6',
    title: 'Learned to Play Guitar',
    content: 'After years of wanting to learn, finally picked up a guitar and learned my first song. It\'s amazing how music can express emotions that words can\'t. Been practicing every day and my fingers are getting used to the strings. Already thinking about writing my own songs!',
    type: 'long',
    date: new Date('2024-06-01'),
    tags: ['hobby', 'music', 'learning'],
    people: [],
    mood: 'excited',
    importance: 'medium',
    location: 'Home',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01')
  },
  // July 2024
  {
    id: '7',
    title: 'Beach Vacation',
    content: 'Spent a week at the coast. The sunsets were breathtaking!',
    type: 'short',
    date: new Date('2024-07-15'),
    tags: ['travel', 'vacation', 'relaxation'],
    people: ['Rachel', 'Kevin'],
    mood: 'happy',
    importance: 'medium',
    location: 'Sunset Beach',
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-07-15')
  },
  // August 2024
  {
    id: '8',
    title: 'Volunteered at Food Bank',
    content: 'Spent the weekend volunteering at the local food bank. It was humbling to see how many people need help, but also inspiring to see the community come together. We served over 200 families and I met some incredible volunteers who have been doing this for years. Really puts things in perspective.',
    type: 'long',
    date: new Date('2024-08-05'),
    tags: ['community', 'volunteer', 'giving'],
    people: ['Emily', 'Mark', 'Laura'],
    mood: 'grateful',
    importance: 'high',
    location: 'Community Center',
    createdAt: new Date('2024-08-05'),
    updatedAt: new Date('2024-08-05')
  },
  // September 2024
  {
    id: '9',
    title: 'Started Yoga Practice',
    content: 'Joined a yoga studio and have been going 3 times a week. Feeling more centered already.',
    type: 'short',
    date: new Date('2024-09-01'),
    tags: ['health', 'wellness', 'mindfulness'],
    people: [],
    mood: 'neutral',
    importance: 'medium',
    location: 'Zen Yoga Studio',
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-09-01')
  },
  // October 2024
  {
    id: '10',
    title: 'Halloween Party',
    content: 'Hosted a Halloween party and won best costume! Dressed up as a vintage detective.',
    type: 'short',
    date: new Date('2024-10-31'),
    tags: ['social', 'friends', 'celebration'],
    people: ['Chris', 'Amy', 'Steve', 'Anna'],
    mood: 'excited',
    importance: 'low',
    location: 'Home',
    createdAt: new Date('2024-10-31'),
    updatedAt: new Date('2024-10-31')
  },
  // November 2024
  {
    id: '11',
    title: 'Thanksgiving with Family',
    content: 'Had a wonderful Thanksgiving with extended family. Mom made her famous turkey and we all shared what we\'re grateful for. My niece announced she\'s expecting, so we\'ll have a new addition to the family next year! These moments remind me what\'s truly important in life.',
    type: 'long',
    date: new Date('2024-11-28'),
    tags: ['family', 'tradition', 'gratitude'],
    people: ['Mom', 'Dad', 'Lisa', 'John'],
    mood: 'grateful',
    importance: 'high',
    location: 'Parents\' House',
    createdAt: new Date('2024-11-28'),
    updatedAt: new Date('2024-11-28')
  },
  // December 2024
  {
    id: '12',
    title: 'Completed Year-End Goals',
    content: 'Reviewed my New Year resolutions - achieved 8 out of 10 goals! Not bad at all. Already planning for next year.',
    type: 'short',
    date: new Date('2024-12-20'),
    tags: ['reflection', 'goals', 'achievement'],
    people: [],
    mood: 'proud',
    importance: 'medium',
    location: 'Home',
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-20')
  }
];

export const seedProfile = {
  id: 'seed-profile-1',
  name: 'Alex Johnson',
  birthDate: new Date('1990-05-15'),
  location: 'San Francisco, CA',
  bio: 'Software developer passionate about learning, growth, and making a difference. Love hiking, reading, and playing guitar.'
};
