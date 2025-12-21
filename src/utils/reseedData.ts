import { db } from '../store/timelineStore';
import { useTimelineStore } from '../store/timelineStore';

// Utility function to clear and reseed data with new career test data
export async function reseedWithCareerData() {
  const store = useTimelineStore.getState();
  
  try {
    // Clear existing stories
    await db.table('stories').clear();
    
    // Generate new career test data
    const { generateExtendedSampleData } = await import('../data/generateSampleData');
    const newStories = generateExtendedSampleData();
    
    // Add to database
    await db.table('stories').bulkAdd(newStories);
    
    // Reload stories in store
    await store.loadStories();
    
    console.log('Successfully reseeded with career test data');
    return true;
  } catch (error) {
    console.error('Failed to reseed data:', error);
    return false;
  }
}
