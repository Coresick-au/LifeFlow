import { db } from '../store/timelineStore';
import { generateExtendedSampleData, generateSampleRelationships } from '../store/timelineStore';
import { useStoryMutations, useUserProfileMutations } from '../hooks/useDexieData';

export const seedSampleData = async () => {
  try {
    // Clear existing data
    await db.table('stories').clear();
    await db.table('relationships').clear();
    
    // Generate new sample data
    const generatedStories = generateExtendedSampleData();
    const generatedRelationships = generateSampleRelationships();
    
    // Add to IndexedDB
    await db.table('stories').bulkAdd(generatedStories);
    await db.table('relationships').bulkAdd(generatedRelationships);
    
    // Set a default user profile
    const { saveProfile } = useUserProfileMutations();
    await saveProfile({
      name: 'John Doe',
      birthDate: new Date('1990-01-01'),
      bio: 'Sample user profile',
      location: 'San Francisco, CA'
    });
    
    return true;
  } catch (error) {
    console.error('Failed to seed data:', error);
    throw error;
  }
};
