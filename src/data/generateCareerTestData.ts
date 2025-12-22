import { Story } from '../types';

// Generate realistic career test data for a Brisbane-based professional
// Born 1/2/1986, started career around 2008 (age 22)
export function generateCareerTestData(): Story[] {
  const stories: Story[] = [];

  // Career timeline from 2008 to present - typical Brisbane career progression
  const careerEvents = [
    // First job - Retail/hospitality while studying or early career
    {
      title: "Started at Woolworths",
      content: "Started working part-time at Woolworths in Toowong while finishing TAFE. Great first job learning customer service and teamwork.",
      type: "short" as const,
      date: new Date(2008, 1, 15), // February 2008
      endDate: new Date(2010, 5, 30), // June 2010
      tags: ["career", "work", "position"],
      people: ["Sarah Chen", "Mike Johnson"],
      importance: "medium" as const,
      location: "Toowong, Brisbane",
      mood: "excited" as const
    },

    // Moved to admin role
    {
      title: "Admin Officer at QUT",
      content: "Joined Queensland University of Technology as an Administration Officer. Great benefits and opportunity to study part-time.",
      type: "short" as const,
      date: new Date(2010, 6, 1), // July 2010
      endDate: new Date(2013, 11, 31), // December 2013
      tags: ["career", "work", "position"],
      people: ["Lisa Wang", "Tom Martinez"],
      importance: "high" as const,
      location: "Kelvin Grove, Brisbane",
      mood: "excited" as const
    },

    // Completed qualification
    {
      title: "Completed Business Diploma",
      content: "Earned Diploma of Business Administration through part-time study at TAFE Queensland while working full-time.",
      type: "short" as const,
      date: new Date(2012, 10, 20), // November 2012
      tags: ["career", "work", "skill", "learning", "certification"],
      people: [],
      importance: "high" as const,
      location: "South Bank, Brisbane",
      mood: "proud" as const
    },

    // Moved to corporate
    {
      title: "Business Analyst at Suncorp",
      content: "Joined Suncorp as a Business Analyst. Big step up in responsibility and salary. Working on insurance systems modernization.",
      type: "short" as const,
      date: new Date(2014, 0, 13), // January 2014
      endDate: new Date(2017, 5, 30), // June 2017
      tags: ["career", "work", "position"],
      people: ["Rachel Green", "David Park"],
      importance: "high" as const,
      location: "Brisbane CBD",
      mood: "excited" as const
    },

    // Achievement during Suncorp
    {
      title: "Led Claims System Upgrade",
      content: "Successfully led the business requirements for the claims system upgrade, resulting in 25% faster processing times. Received recognition award.",
      type: "short" as const,
      date: new Date(2016, 2, 10), // March 2016
      tags: ["career", "work", "project", "achievement", "leadership"],
      people: ["Rachel Green", "Kevin Lee"],
      importance: "high" as const,
      location: "Brisbane CBD",
      mood: "proud" as const
    },

    // Skill development
    {
      title: "Completed Project Management Certificate",
      content: "Earned Certificate IV in Project Management Practice through Australian Institute of Project Management.",
      type: "short" as const,
      date: new Date(2016, 7, 20), // August 2016
      tags: ["career", "work", "skill", "learning", "certification"],
      people: [],
      importance: "medium" as const,
      location: "Brisbane CBD",
      mood: "proud" as const
    },

    // Job change with pay bump
    {
      title: "Senior Analyst at Queensland Health",
      content: "Joined Queensland Health as Senior Business Analyst with 20% salary increase. Working on digital health initiatives across the state.",
      type: "short" as const,
      date: new Date(2017, 7, 1), // August 2017
      endDate: new Date(2020, 11, 18), // December 2020
      tags: ["career", "work", "position"],
      people: ["Amy Foster", "Ben Carter"],
      importance: "high" as const,
      location: "Herston, Brisbane",
      mood: "excited" as const
    },

    // Major project
    {
      title: "Delivered COVID Response System",
      content: "Led business analysis for the COVID-19 contact tracing system during the pandemic. Intense but rewarding work supporting public health response.",
      type: "short" as const,
      date: new Date(2020, 3, 30), // April 2020
      tags: ["career", "work", "project", "achievement", "leadership"],
      people: ["Ben Carter", "Sophie Turner"],
      importance: "high" as const,
      location: "Herston, Brisbane",
      mood: "proud" as const
    },

    // Current position
    {
      title: "Principal Analyst at Brisbane City Council",
      content: "Joined Brisbane City Council as Principal Business Analyst. Leading digital transformation initiatives for city services. Great work-life balance and meaningful community impact.",
      type: "short" as const,
      date: new Date(2021, 0, 11), // January 2021
      tags: ["career", "work", "position"],
      people: ["Olivia Davis", "Nathan White"],
      importance: "high" as const,
      location: "Brisbane CBD",
      mood: "excited" as const
    },

    // Recent skill
    {
      title: "Completed Agile Certification",
      content: "Earned SAFe Agilist certification to support council's agile transformation. Useful for leading cross-functional teams.",
      type: "short" as const,
      date: new Date(2023, 2, 25), // March 2023
      tags: ["career", "work", "skill", "learning", "agile"],
      people: [],
      importance: "medium" as const,
      location: "Brisbane CBD",
      mood: "grateful" as const
    },

    // Recent achievement
    {
      title: "Smart City Initiative Launch",
      content: "Successfully launched the Smart City Sensors initiative, improving traffic flow and reducing council maintenance costs by 15%.",
      type: "short" as const,
      date: new Date(2023, 8, 5), // September 2023
      tags: ["career", "work", "achievement", "innovation"],
      people: ["Olivia Davis", "Sophie Turner"],
      importance: "high" as const,
      location: "Brisbane CBD",
      mood: "proud" as const
    },

    // Non-career achievement that shows transferable skills
    {
      title: "Organized Charity Cricket Match",
      content: "Organized a charity cricket match for 100+ participants, raising $5,000 for Foodbank Queensland. Great for networking and project management practice!",
      type: "short" as const,
      date: new Date(2023, 5, 15), // June 2023
      tags: ["achievement", "skill", "community", "leadership"],
      people: ["Community Volunteers"],
      importance: "medium" as const,
      location: "Norman Park, Brisbane",
      mood: "grateful" as const
    },

    // Fitness achievement
    {
      title: "Completed Bridge to Brisbane",
      content: "Ran the Bridge to Brisbane 10km after 4 months of training. Great atmosphere running across the Story Bridge!",
      type: "short" as const,
      date: new Date(2023, 7, 27), // August 2023
      tags: ["achievement", "personal", "fitness"],
      people: [],
      importance: "medium" as const,
      location: "Brisbane CBD",
      mood: "proud" as const
    },

    // Recent project
    {
      title: "Digital Services Transformation",
      content: "Leading the council's digital services transformation, bringing 40+ services online for residents. Major multi-year initiative.",
      type: "short" as const,
      date: new Date(2024, 1, 20), // February 2024
      tags: ["career", "work", "project", "leadership", "innovation"],
      people: ["Nathan White", "Amy Foster", "Ben Carter"],
      importance: "high" as const,
      location: "Brisbane CBD",
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
