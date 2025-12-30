export interface HoroscopeFortune {
  all: number;
  health: number;
  love: number;
  money: number;
  work: number;
}

export interface HoroscopeData {
  title: string;
  type: string;
  fortune: HoroscopeFortune;
  fortunetext: {
    all: string;
    health: string;
    love: string;
    money: string;
    work: string;
  };
  index: {
    all: string;
    health: string;
    love: string;
    money: string;
    work: string;
  };
  luckycolor: string;
  luckyconstellation: string;
  luckynumber: string;
  lastUpdate: string;
}
