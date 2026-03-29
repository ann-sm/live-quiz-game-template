const basePoints = 1000;

export const calculateScore = (timeRemaining: number, timeLimit: number) => {
  if (timeRemaining <= 0) return 0;
  return Math.floor(basePoints * (timeRemaining / timeLimit));
}