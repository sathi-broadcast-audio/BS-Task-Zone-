require("dotenv").config();

module.exports = {
  // Telegram Bot Token
  BOT_TOKEN: process.env.BOT_TOKEN,

  // Official Channel & Group for Join Verification
  REQUIRED_CHANNEL: process.env.REQUIRED_CHANNEL || "@BSTaskZoneChannel",
  REQUIRED_GROUP: process.env.REQUIRED_GROUP || "@BSTaskZoneHelp",

  // Vercel/Web App URL
  WEB_APP_URL:
    process.env.WEB_APP_URL || "https://bs-task-zone.vercel.app/",

  // Server Port
  PORT: process.env.PORT || 3000,

  // Referral System
  REFERRAL_POINTS: 100,

  // Lucky Spin
  SPIN_COST: 500,

  // Lucky Spin-এর সর্বোচ্চ Reward
  MAX_SPIN_REWARD: 20,

  // Lucky Spin-এর Reward Options
  SPIN_REWARDS: [
    5,
    6,
    7,
    8,
    10,
    12,
    15,
    18,
    20
  ]
};
