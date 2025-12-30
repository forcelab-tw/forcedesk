export interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    used: number;
    total: number;
    usagePercent: number;
  };
  network: {
    rxSpeed: number;
    txSpeed: number;
  };
  disk: {
    used: number;
    total: number;
    usagePercent: number;
  };
  time: {
    current: string;
    date: string;
  };
}

export interface TimeData {
  current: string;
  date: string;
}
