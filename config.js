global.token = "8057445800:AAEsG-SW8GjeiABGNpr9qBaG965b0LA6qcY"
global.ownername = "VinnCode"
global.ownerid = "6424764970"
global.premid = ""
global.botname = "riri asisten"
global.prefix = ["/", ".", "#", "!"]
global.wib = 7
global.wait = "お待ちください..."
global.wm = "© Riri Asisten"
// Message
global.message = {
  rowner: "Vinz限定機能",
  owner: "この機能はRENZオーナー専用です",
  premium: "このコマンドは_*プレミアム*_メンバー専用です。",
  group: "このコマンドはグループ内でのみ使用できます。",
  private: "このコマンドはプライベートチャットでのみ使用できます。",
  admin: "このコマンドはグループ管理者のみが使用できます。",
  error: "エラーが発生しました。しばらくしてからもう一度お試しください。",
};

// Port configuration
global.ports = [4000, 3000, 5000, 8000];

// Database configuration
global.limit = 100;

global.APIs = {
  //lann: 'https://api.betabotz.eu.org',
  ryzumi: 'https://api.ryzumi.vip',
  
}
global.APIKeys = {
  //'https://api.betabotz.eu.org': 'API_KEY', 
}

import fs from 'fs';
import chalk from 'chalk';

const file = new URL(import.meta.url);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update 'config.js'`));
});
