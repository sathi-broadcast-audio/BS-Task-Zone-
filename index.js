const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const {
  BOT_TOKEN,
  REQUIRED_CHANNEL,
  WEB_APP_URL,
  PORT = 3000
} = require("./config");

const {
  getTaskList
} = require("./tasks");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public web interface
app.use(express.static(path.join(__dirname, "public")));

// --------------------------------------------------
// Telegram Bot
// --------------------------------------------------

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

// --------------------------------------------------
// Basic in-memory user data
// Database will be connected later through Supabase.
// --------------------------------------------------

const users = new Map();

function createUser(user) {
  if (!users.has(user.id)) {
    users.set(user.id, {
      id: user.id,
      username: user.username || "",
      firstName: user.first_name || "",
      photoUrl: "",
      balance: 0,
      referralPoints: 0,
      referrals: [],
      verified: false,
      createdAt: new Date().toISOString()
    });
  }

  return users.get(user.id);
}

// --------------------------------------------------
// Channel Verification
// --------------------------------------------------

async function checkChannelMembership(userId) {
  if (!REQUIRED_CHANNEL) {
    return false;
  }

  try {
    const member = await bot.getChatMember(
      REQUIRED_CHANNEL,
      userId
    );

    const validStatuses = [
      "creator",
      "administrator",
      "member"
    ];

    return validStatuses.includes(member.status);
  } catch (error) {
    console.error(
      "Channel verification error:",
      error.message
    );

    return false;
  }
}

// --------------------------------------------------
// Main Menu
// --------------------------------------------------

function mainKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Open BS TASK ZONE",
            web_app: {
              url: WEB_APP_URL
            }
          }
        ]
      ]
    }
  };
}

// --------------------------------------------------
// /start
// --------------------------------------------------

bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
  const telegramUser = msg.from;

  const user = createUser(telegramUser);

  // Referral code
  const referralCode = match && match[1]
    ? String(match[1]).trim()
    : null;

  if (
    referralCode &&
    String(referralCode) !== String(telegramUser.id)
  ) {
    user.pendingReferrer = referralCode;
  }

  // Check required channel
  const verified = await checkChannelMembership(
    telegramUser.id
  );

  user.verified = verified;

  const verificationText = verified
    ? "🟢 Verified"
    : "🔴 Unverified";

  await bot.sendMessage(
    telegramUser.id,
    `👋 Welcome to BS TASK ZONE!

🎯 Complete Tasks & Earn Rewards

🔐 Channel Status: ${verificationText}

📌 Open the app below to access Home, Tasks, Refer, Wallet and Profile.`,
    mainKeyboard()
  );
});

// --------------------------------------------------
// /verify
// --------------------------------------------------

bot.onText(/^\/verify$/, async (msg) => {
  const telegramUser = msg.from;

  const user = createUser(telegramUser);

  const verified = await checkChannelMembership(
    telegramUser.id
  );

  user.verified = verified;

  if (verified) {
    await bot.sendMessage(
      telegramUser.id,
      "🟢 Verification Successful!\n\nআপনার account এখন Verified।"
    );
  } else {
    await bot.sendMessage(
      telegramUser.id,
      "🔴 আপনি এখনো Required Channel-এ Join করেননি।\n\nChannel-এ Join করে আবার /verify দিন।"
    );
  }
});

// --------------------------------------------------
// API: User
// --------------------------------------------------

app.get("/api/user/:id", async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid Telegram User ID"
    });
  }

  const telegramUser = {
    id: userId
  };

  const user = createUser(telegramUser);

  const verified = await checkChannelMembership(userId);

  user.verified = verified;

  res.json({
    success: true,
    user
  });
});

// --------------------------------------------------
// API: Verify
// --------------------------------------------------

app.post("/api/verify", async (req, res) => {
  const userId = Number(req.body.userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID required"
    });
  }

  const user = createUser({
    id: userId
  });

  const verified = await checkChannelMembership(userId);

  user.verified = verified;

  res.json({
    success: true,
    verified
  });
});

// --------------------------------------------------
// API: Tasks
// --------------------------------------------------

app.get("/api/tasks", (req, res) => {
  const tasks = getTaskList();

  res.json({
    success: true,
    tasks
  });
});

// --------------------------------------------------
// API: Wallet
// --------------------------------------------------

app.get("/api/wallet/:id", async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid User ID"
    });
  }

  const user = createUser({
    id: userId
  });

  const verified = await checkChannelMembership(userId);

  user.verified = verified;

  res.json({
    success: true,
    balance: user.balance,
    referralPoints: user.referralPoints,
    verified: user.verified
  });
});

// --------------------------------------------------
// API: Referral
// --------------------------------------------------

app.get("/api/referral/:id", async (req, res) => {
  const userId = Number(req.params.id);

  const user = createUser({
    id: userId
  });

  const botUsername =
    process.env.BOT_USERNAME || "YOUR_BOT_USERNAME";

  const referralLink =
    `https://t.me/${botUsername}?start=${userId}`;

  res.json({
    success: true,
    referralLink,
    referralCount: user.referrals.length,
    referralPoints: user.referralPoints,
    referrals: user.referrals
  });
});

// --------------------------------------------------
// Home route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: "BS TASK ZONE"
  });
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `BS TASK ZONE server running on port ${PORT}`
  );
});
