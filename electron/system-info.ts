import * as si from 'systeminformation';

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
    rxSpeed: number;  // bytes per second
    txSpeed: number;  // bytes per second
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

let lastNetworkStats: { rx: number; tx: number; timestamp: number } | null = null;

export async function getSystemInfo(): Promise<SystemInfo> {
  const [cpuLoad, cpuInfo, mem, networkStats, fsSize] = await Promise.all([
    si.currentLoad(),
    si.cpu(),
    si.mem(),
    si.networkStats(),
    si.fsSize(),
  ]);

  // 計算網路速度
  const currentNetwork = networkStats.reduce(
    (acc, iface) => ({
      rx: acc.rx + iface.rx_bytes,
      tx: acc.tx + iface.tx_bytes,
    }),
    { rx: 0, tx: 0 }
  );
  const now = Date.now();

  let rxSpeed = 0;
  let txSpeed = 0;

  if (lastNetworkStats) {
    const timeDiff = (now - lastNetworkStats.timestamp) / 1000;
    if (timeDiff > 0) {
      rxSpeed = (currentNetwork.rx - lastNetworkStats.rx) / timeDiff;
      txSpeed = (currentNetwork.tx - lastNetworkStats.tx) / timeDiff;
    }
  }

  lastNetworkStats = { ...currentNetwork, timestamp: now };

  // 計算磁碟使用量（取主要磁碟）
  const mainDisk = fsSize.find((fs) => fs.mount === '/') || fsSize[0];
  const diskUsed = mainDisk?.used || 0;
  const diskTotal = mainDisk?.size || 1;

  // 時間格式化
  const nowDate = new Date();
  const timeStr = nowDate.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStr = nowDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return {
    cpu: {
      usage: Math.round(cpuLoad.currentLoad * 10) / 10,
      cores: cpuInfo.cores,
      model: cpuInfo.brand,
    },
    memory: {
      used: mem.active,  // 使用 active 而非 used，排除快取
      total: mem.total,
      usagePercent: Math.round((mem.active / mem.total) * 1000) / 10,
    },
    network: {
      rxSpeed: Math.round(rxSpeed),
      txSpeed: Math.round(txSpeed),
    },
    disk: {
      used: diskUsed,
      total: diskTotal,
      usagePercent: Math.round((diskUsed / diskTotal) * 1000) / 10,
    },
    time: {
      current: timeStr,
      date: dateStr,
    },
  };
}
