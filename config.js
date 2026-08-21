require("dotenv").config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,

  // Channel & Group Usernames
  REQUIRED_CHANNEL: process.env.REQUIRED_CHANNEL || "@BSTaskZoneChannel",
  REQUIRED_GROUP: process.env.REQUIRED_GROUP || "@BSTaskZoneHelp",

  // Your Vercel Web App URL
  WEB_APP_URL: process.env.WEB_APP_URL || "https://bs-task-zone-bot.vercel.app",

  PORT: process.env.PORT || 3000,
  REFERRAL_POINTS: 100,
  SPIN_COST: 500,
  MAX_SPIN_REWARD: 20,
  SPIN_REWARDS: [ 10, 12, 15, 18, 20]
};
