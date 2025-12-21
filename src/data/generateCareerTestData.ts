import { Story } from '../types';

// Generate realistic career test data for the Career Leverage features
export function generateCareerTestData(): Story[] {
  const stories: Story[] = [];
  const currentDate = new Date();
  
  // Career timeline from 2015 to present
  const careerEvents = [
    // First job - 4 years without promotion (loyalty penalty)
    {
      title: "Started as Junior Developer",
      content: "Joined TechStart Inc. as a junior software developer working on frontend applications. Learned React and modern JavaScript frameworks.",
      type: "short" as const,
      date: new Date(2015, 5, 15), // June 2015
      endDate: new Date(2019, 6, 31), // July 2019
      tags: ["career", "work", "position"],
      people: ["Sarah Chen", "Mike Johnson"],
      importance: "high" as const,
      location: "San Francisco, CA",
      mood: "excited" as const
    },
    
    // Achievement during first job
    {
      title: "Led Major Feature Release",
      content: "Successfully led the development and launch of the customer dashboard feature, resulting in 30% increase in user engagement.",
      type: "short" as const,
      date: new Date(2017, 8, 10), // September 2017
      tags: ["career", "work", "project", "achievement", "leadership"],
      people: ["Sarah Chen", "David Park"],
      importance: "high" as const,
      location: "San Francisco, CA",
      mood: "proud" as const
    },
    
    // Skill development
    {
      title: "Completed AWS Certification",
      content: "Earned AWS Solutions Architect Associate certification to expand cloud infrastructure knowledge.",
      type: "short" as const,
      date: new Date(2018, 2, 20), // March 2018
      tags: ["career", "work", "skill", "learning", "certification"],
      people: [],
      importance: "medium" as const,
      location: "San Francisco, CA",
      mood: "proud" as const
    },
    
    // Job change after loyalty penalty
    {
      title: "Senior Developer at DataCorp",
      content: "Joined DataCorp as Senior Software Developer with 25% salary increase. Focus on big data processing and analytics platform.",
      type: "short" as const,
      date: new Date(2019, 8, 1), // August 2019
      endDate: new Date(2021, 11, 15), // December 2021
      tags: ["career", "work", "position"],
      people: ["Lisa Wang", "Tom Martinez"],
      importance: "high" as const,
      location: "New York, NY",
      mood: "excited" as const
    },
    
    // Promotion at DataCorp
    {
      title: "Promoted to Tech Lead",
      content: "Promoted to Technical Lead role managing a team of 5 developers. Responsible for architectural decisions and mentorship.",
      type: "short" as const,
      date: new Date(2021, 0, 15), // January 2021
      tags: ["career", "work", "promotion", "leadership"],
      people: ["Lisa Wang", "Rachel Green"],
      importance: "high" as const,
      location: "New York, NY",
      mood: "proud" as const
    },
    
    // Major project
    {
      title: "Launched Microservices Architecture",
      content: "Architected and led the migration from monolithic to microservices architecture, reducing deployment time by 60%.",
      type: "short" as const,
      date: new Date(2021, 5, 30), // June 2021
      tags: ["career", "work", "project", "achievement", "technical"],
      people: ["Tom Martinez", "Kevin Lee"],
      importance: "high" as const,
      location: "New York, NY",
      mood: "proud" as const
    },
    
    // Current position - 3+ years (potential loyalty penalty)
    {
      title: "Principal Engineer at InnovateLabs",
      content: "Joined InnovateLabs as Principal Engineer focusing on AI/ML integration and product innovation. Leading the technical strategy for new product lines.",
      type: "short" as const,
      date: new Date(2022, 0, 10), // January 2022
      tags: ["career", "work", "position"],
      people: ["Amy Foster", "Ben Carter"],
      importance: "high" as const,
      location: "Austin, TX",
      mood: "excited" as const
    },
    
    // Recent skill
    {
      title: "Completed Machine Learning Course",
      content: "Completed advanced machine learning course covering deep learning, NLP, and computer vision applications.",
      type: "short" as const,
      date: new Date(2023, 3, 25), // April 2023
      tags: ["career", "work", "skill", "learning", "ai"],
      people: [],
      importance: "medium" as const,
      location: "Austin, TX",
      mood: "grateful" as const
    },
    
    // Recent achievement
    {
      title: "Patent Filed for AI Algorithm",
      content: "Filed patent for novel algorithm optimizing neural network training efficiency, potentially saving 40% in computational costs.",
      type: "short" as const,
      date: new Date(2023, 9, 5), // October 2023
      tags: ["career", "work", "achievement", "innovation"],
      people: ["Amy Foster", "Sophie Turner"],
      importance: "high" as const,
      location: "Austin, TX",
      mood: "proud" as const
    },
    
    // Non-career life skills that translate to professional competencies
    {
      title: "Organized Community Tech Workshop",
      content: "Organized and taught a free coding workshop for 50+ local high school students, developing curriculum and mentoring skills.",
      type: "short" as const,
      date: new Date(2023, 6, 15), // July 2023
      tags: ["achievement", "skill", "learning", "mentoring"],
      people: ["Community Volunteers"],
      importance: "medium" as const,
      location: "Austin, TX",
      mood: "grateful" as const
    },
    
    // Another non-career achievement
    {
      title: "Completed Marathon",
      content: "Ran first marathon after 6 months of disciplined training, demonstrating perseverance and goal-setting abilities.",
      type: "short" as const,
      date: new Date(2023, 11, 10), // December 2023
      tags: ["achievement", "personal", "fitness"],
      people: [],
      importance: "medium" as const,
      location: "Houston, TX",
      mood: "proud" as const
    },
    
    // Recent project with leadership
    {
      title: "Cross-Team AI Initiative",
      content: "Led cross-functional initiative integrating AI across three product teams, improving feature delivery speed by 35%.",
      type: "short" as const,
      date: new Date(2024, 1, 20), // February 2024
      tags: ["career", "work", "project", "leadership", "innovation"],
      people: ["Ben Carter", "Olivia Davis", "Nathan White"],
      importance: "high" as const,
      location: "Austin, TX",
      mood: "excited" as const
    }
  ];
  
  // Convert to Story format
  careerEvents.forEach((event, index) => {
    stories.push({
      id: `career-test-${index}`,
      ...event,
      createdAt: event.date,
      updatedAt: event.date,
      images: [],
      metadata: {},
      lockedUntil: undefined,
      fuzzyDate: false
    });
  });
  
  return stories;
}
