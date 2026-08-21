const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const supabase = require("./database/supabase");

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
// Supabase User Management Helpers
// --------------------------------------------------

async function getOrCreateUser(telegramUser, referralCode = null) {
  const telegramId = telegramUser.id;

  // Check if user already exists
  let { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Handle referral if new user
  let referrerId = null;
  if (referralCode && String(referralCode) !== String(telegramId)) {
    const { data: refUser } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("telegram_id", referralCode)
      .single();
    
    if (refUser) {
      referrerId = refUser.telegram_id;
      
      // Update referrer's points and count
      await supabase.rpc('increment_referral', { ref_id: referrerId }); // Or handle via standard update
    }
  }

  // Create new user in Supabase
  const newUser = {
    telegram_id: telegramId,
    username: telegramUser.username || "",
    first_name: telegramUser.first_name || "",
    photo_url: "",
    main_balance: 0,
    referral_points: 0,
    referral_count: 0,
    is_verified: false,
    referred_by: referrerId
  };

  const { data: insertedUser, error: insertError } = await supabase
    .from("users")
    .insert([newUser])
    .select()
    .single();

  if (insertError) {
    console.error("Error creating user:", insertError.message);
    return null;
  }

  return insertedUser;
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
  const referralCode = match && match[1] ? String(match[1]).trim() : null;

  const user = await getOrCreateUser(telegramUser, referralCode);

  // Check required channel
  const verified = await checkChannelMembership(
    telegramUser.id
  );

  // Update verification status in DB
  await supabase
    .from("users")
    .update({ is_verified: verified })
    .eq("telegram_id", telegramUser.id);

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

  const verified = await checkChannelMembership(
    telegramUser.id
  );

  await supabase
    .from("users")
    .update({ is_verified: verified })
    .eq("telegram_id", telegramUser.id);

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

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", userId)
    .single();

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const verified = await checkChannelMembership(userId);

  res.json({
    success: true,
    user: {
      id: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      photoUrl: user.photo_url,
      balance: user.main_balance,
      referralPoints: user.referral_points,
      verified: verified
    }
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

  const verified = await checkChannelMembership(userId);

  await supabase
    .from("users")
    .update({ is_verified: verified })
    .eq("telegram_id", userId);

  res.json({
    success: true,
    verified
  });
});

// --------------------------------------------------
// API: Tasks
// --------------------------------------------------

app.get("/api/tasks", async (req, res) => {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true);

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

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

  const { data: user } = await supabase
    .from("users")
    .select("main_balance, referral_points, is_verified")
    .eq("telegram_id", userId)
    .single();

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({
    success: true,
    balance: user.main_balance,
    referralPoints: user.referral_points,
    verified: user.is_verified
  });
});

// --------------------------------------------------
// API: Referral
// --------------------------------------------------

app.get("/api/referral/:id", async (req, res) => {
  const userId = Number(req.params.id);

  const { data: user } = await supabase
    .from("users")
    .select("referral_count, referral_points")
    .eq("telegram_id", userId)
    .single();

  const { data: referralsList } = await supabase
    .from("users")
    .select("first_name, created_at")
    .eq("referred_by", userId);

  const botUsername =
    process.env.BOT_USERNAME || "YOUR_BOT_USERNAME";

  const referralLink =
    `https://t.me/${botUsername}?start=${userId}`;

  res.json({
    success: true,
    referralLink,
    referralCount: user ? user.referral_count : 0,
    referralPoints: user ? user.referral_points : 0,
    referrals: referralsList || []
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
      
