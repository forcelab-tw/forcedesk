/**
 * Electron Builder AfterPack Hook
 * 在打包後移除不需要的檔案以減少應用程式大小
 */

const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;

  console.log('Running afterPack hook...');
  console.log('App output directory:', appOutDir);
  console.log('Platform:', platform);

  // macOS 特定優化
  if (platform === 'darwin') {
    const appPath = path.join(appOutDir, `${context.packager.appInfo.productFilename}.app`);
    const resourcesPath = path.join(appPath, 'Contents', 'Resources');

    // 移除不需要的語言包（保留 zh-TW 和 en）
    const keepLanguages = ['zh_TW.lproj', 'en.lproj'];
    const files = fs.readdirSync(resourcesPath);

    let removedCount = 0;
    let savedSize = 0;

    files.forEach(file => {
      if (file.endsWith('.lproj') && !keepLanguages.includes(file)) {
        const lprojPath = path.join(resourcesPath, file);
        try {
          const stats = fs.statSync(lprojPath);
          fs.rmSync(lprojPath, { recursive: true, force: true });
          removedCount++;
          savedSize += stats.size;
        } catch (err) {
          console.warn(`Failed to remove ${file}:`, err.message);
        }
      }
    });

    console.log(`✓ Removed ${removedCount} unnecessary language packs`);
    console.log(`✓ Saved approximately ${(savedSize / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('AfterPack hook completed!');
};
