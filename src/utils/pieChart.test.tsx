import { describe, it, expect } from 'vitest'
import { createPieSlice } from './pieChart'

describe('Pie Chart Calculations', () => {
  it('should create a valid SVG path for a full circle', () => {
    const path = createPieSlice(100, 0)
    expect(path).toMatch(/^M 50 50 L \d+\.?\d* \d+\.?\d* A 40 40 0 1 1 \d+\.?\d* \d+\.?\d* Z$/)
  })

  it('should create a valid SVG path for a quarter circle', () => {
    const path = createPieSlice(25, 0)
    expect(path).toMatch(/^M 50 50 L \d+\.?\d* \d+\.?\d* A 40 40 0 0 1 \d+\.?\d* \d+\.?\d* Z$/)
  })

  it('should create a valid SVG path for half circle', () => {
    const path = createPieSlice(50, 0)
    expect(path).toMatch(/^M 50 50 L \d+\.?\d* \d+\.?\d* A 40 40 0 0 1 \d+\.?\d* \d+\.?\d* Z$/)
  })

  it('should handle offset correctly', () => {
    const path1 = createPieSlice(25, 0)
    const path2 = createPieSlice(25, 25)
    expect(path1).not.toBe(path2)
  })

  it('should handle small percentages', () => {
    const path = createPieSlice(1, 0)
    expect(path).toContain('M 50 50 L')
    expect(path).toContain('A 40 40')
  })

  it('should handle different radius sizes', () => {
    const path = createPieSlice(25, 0, 50)
    expect(path).toContain('A 50 50')
  })
})

describe('Category Data Calculation', () => {
  it('should correctly calculate category distribution', () => {
    const mockStories = [
      { tags: ['career'] },
      { tags: ['career'] },
      { tags: ['health'] },
      { tags: ['travel'] },
      { tags: ['travel'] },
      { tags: ['travel'] },
    ] as any[]

    const categoryCounts: Record<string, number> = {}
    mockStories.forEach(story => {
      const category = story.tags[0]
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    expect(categoryCounts).toEqual({
      career: 2,
      health: 1,
      travel: 3,
    })
  })

  it('should calculate percentages correctly', () => {
    const categoryCounts = {
      career: 2,
      health: 1,
      travel: 3,
    }
    const total = 6

    const percentages = Object.entries(categoryCounts).map(([_, count]) => 
      (count / total) * 100
    )

    expect(percentages).toEqual([33.33333333333333, 16.666666666666664, 50])
  })
})
