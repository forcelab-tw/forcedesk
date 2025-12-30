export interface DinoState {
  stage: 'egg' | 'hatching' | 'baby' | 'juvenile' | 'adult';
  accumulatedTime: number;
  totalEggs: number;
  currentEggs: number;
}
