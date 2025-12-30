export interface VibeCodingData {
  meta: {
    date: string;
    sign: string;
    engine_version: string;
  };
  scores: {
    vibe_score: number;
    rating: string;
  };
  almanac: {
    good_for: string[];
    bad_for: string[];
    description: string;
  };
  astrology: {
    planet_status: string;
    dev_impact: string;
  };
  iching: {
    hexagram: string;
    system_status: string;
    interpretation: string;
  };
  recommendation: {
    verdict: string;
    music_genre: string;
  };
}
