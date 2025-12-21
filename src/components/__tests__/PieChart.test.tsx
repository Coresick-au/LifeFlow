import { describe, it, expect } from 'vitest'
import { createPieSlice } from '../../utils/pieChart'

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
})
