// Create pie chart slices - exported for testing
export const createPieSlice = (percentage: number, offset: number, radius: number = 40) => {
  const angle = (percentage * 360) / 100;
  const startAngle = (offset * 360) / 100;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = ((startAngle + angle) * Math.PI) / 180;
  
  const x1 = 50 + radius * Math.cos(startRad);
  const y1 = 50 + radius * Math.sin(startRad);
  const x2 = 50 + radius * Math.cos(endRad);
  const y2 = 50 + radius * Math.sin(endRad);
  
  const largeArc = angle > 180 ? 1 : 0;
  
  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};
