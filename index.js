const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const supabase = require("./database/supabase");

const {
  BOT_TOKEN,
  REQUIRED_CHANNEL,
  REQUIRED_GROUP,
  WEB_APP_URL,
  PORT = 3000
} = require("./config");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public web interface
app.use(express.static(__dirname));

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

  let { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  let referrerId = null;
  if (referralCode && String(referralCode) !== String(telegramId)) {
    const { data: refUser } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("telegram_id", referralCode)
      .single();
    
    if (refUser) {
      referrerId = refUser.telegram_id;
      await supabase.rpc('increment_referral', { ref_id: referrerId });
    }
  }

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
// Dual Membership Verification (Channel & Group)
// --------------------------------------------------

async function checkChannelAndGroupMembership(userId) {
  const validStatuses = ["creator", "administrator", "member"];

  let channelVerified = false;
  let groupVerified = false;

  try {
    if (REQUIRED_CHANNEL) {
      const channelMember = await bot.getChatMember(REQUIRED_CHANNEL, userId);
      channelVerified = validStatuses.includes(channelMember.status);
    }
  } catch (error) {
    console.error("Channel verification error:", error.message);
  }

  try {
    if (REQUIRED_GROUP) {
      const groupMember = await bot.getChatMember(REQUIRED_GROUP, userId);
      groupVerified = validStatuses.includes(groupMember.status);
    }
  } catch (error) {
    console.error("Group verification error:", error.message);
  }

  return channelVerified && groupVerified;
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

  await getOrCreateUser(telegramUser, referralCode);

  const verified = await checkChannelAndGroupMembership(telegramUser.id);

  await supabase
    .from("users")
    .update({ is_verified: verified })
    .eq("telegram_id", telegramUser.id);

  const verificationText = verified ? "🟢 Verified" : "🔴 Unverified";

  await bot.sendMessage(
    telegramUser.id,
    `👋 Welcome to BS TASK ZONE!

🎯 Complete Tasks & Earn Rewards

🔐 Status: ${verificationText}

📌 চ্যানেল এবং গ্রুপ দুটিতে জয়েন করে অ্যাপ ওপেন করুন।`,
    mainKeyboard()
  );
});

// --------------------------------------------------
// /verify
// --------------------------------------------------

bot.onText(/^\/verify$/, async (msg) => {
  const telegramUser = msg.from;

  const verified = await checkChannelAndGroupMembership(telegramUser.id);

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
      "🔴 আপনি এখনো অফিশিয়াল চ্যানেল অথবা গ্রুপ দুটির যেকোনো একটিতে (বা উভয়টিতে) জয়েন করেননি। দুটোতেই জয়েন করে আবার /verify দিন।"
    );
  }
});

// --------------------------------------------------
// API: User
// --------------------------------------------------

app.get("/api/user/:id", async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", userId)
    .single();

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const verified = await checkChannelAndGroupMembership(userId);

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
    return res.status(400).json({ success: false, message: "User ID required" });
  }

  const verified = await checkChannelAndGroupMembership(userId);

  await supabase
    .from("users")
    .update({ is_verified: verified })
    .eq("telegram_id", userId);

  res.json({ success: true, verified });
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

  res.json({ success: true, tasks });
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
    .select("first_name, created_at, username")
    .eq("referred_by", userId);

  const botUsername = process.env.BOT_USERNAME || "YOUR_BOT_USERNAME";
  const referralLink = `https://t.me/${botUsername}?start=${userId}`;

  res.json({
    success: true,
    referralLink,
    referralCount: user ? user.referral_count : 0,
    referralPoints: user ? user.referral_points : 0,
    referrals: referralsList || []
  });
});

// --------------------------------------------------
// API: Spin Action
// --------------------------------------------------

app.post("/api/spin", async (req, res) => {
  const { userId, reward } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", userId)
    .single();

  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  if (user.referral_points < 500) {
    return res.json({ success: false, message: "Insufficient points" });
  }

  const newBalance = Number(user.main_balance) + Number(reward);
  const newPoints = Number(user.referral_points) - 500;

  await supabase
    .from("users")
    .update({ main_balance: newBalance, referral_points: newPoints })
    .eq("telegram_id", userId);

  res.json({
    success: true,
    balance: newBalance,
    referralPoints: newPoints
  });
});

// --------------------------------------------------
// Home route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({ status: "online", bot: "BS TASK ZONE" });
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`BS TASK ZONE server running on port ${PORT}`);
});
  
