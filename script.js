/* =========================================
   BS TASK ZONE
   Frontend Controller
========================================= */

const state = {
  userId: null,
  username: "",
  firstName: "",
  photoUrl: "",
  balance: 0,
  referralPoints: 0,
  referralCount: 0,
  referrals: [],
  verified: false,
  referralLink: "",
  withdrawMethod: "bKash",
  spinning: false
};


/* =========================================
   CONFIG
========================================= */

const APP_CONFIG = {
  channelLink: "https://t.me/YOUR_CHANNEL_USERNAME",
  groupLink: "https://t.me/YOUR_GROUP_USERNAME",

  spinCost: 500,

  spinRewards: [
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


/* =========================================
   Telegram WebApp
========================================= */

const telegramWebApp =
  window.Telegram && window.Telegram.WebApp
    ? window.Telegram.WebApp
    : null;


if (telegramWebApp) {
  telegramWebApp.ready();
  telegramWebApp.expand();
}


/* =========================================
   Get Telegram User
========================================= */

function getTelegramUser() {

  if (
    telegramWebApp &&
    telegramWebApp.initDataUnsafe &&
    telegramWebApp.initDataUnsafe.user
  ) {

    return telegramWebApp.initDataUnsafe.user;

  }

  return {
    id: 0,
    username: "demo_user",
    first_name: "Demo User"
  };
}


/* =========================================
   Initialize User
========================================= */

function initializeUser() {

  const user = getTelegramUser();

  state.userId = user.id;
  state.username = user.username || "";
  state.firstName = user.first_name || "User";

  if (user.photo_url) {
    state.photoUrl = user.photo_url;
  }

  updateUserInterface();
  loadUserData();
}


/* =========================================
   Update User Interface
========================================= */

function updateUserInterface() {

  const username = state.firstName || "User";

  const usernameElement = document.getElementById("home-username");
  if (usernameElement) {
    usernameElement.textContent = username;
  }

  const profileName = document.getElementById("profile-name");
  if (profileName) {
    profileName.textContent = username;
  }

  const profileUsername = document.getElementById("profile-username");
  if (profileUsername) {
    profileUsername.textContent = state.username
      ? `@${state.username}`
      : "Telegram User";
  }

  const telegramId = document.getElementById("telegram-id");
  if (telegramId) {
    telegramId.textContent = state.userId || "-";
  }

  updateBalanceUI();
  updateReferralUI();
  updateProfileUI();
  updateProfilePhoto();
}


/* =========================================
   Profile Photo
========================================= */

function updateProfilePhoto() {

  if (!state.photoUrl) {
    return;
  }

  const topAvatar = document.getElementById("profile-avatar");
  const profilePhoto = document.getElementById("profile-photo");

  if (topAvatar) {
    topAvatar.innerHTML = `<img src="${escapeHtml(state.photoUrl)}" alt="Profile">`;
  }

  if (profilePhoto) {
    profilePhoto.innerHTML = `<img src="${escapeHtml(state.photoUrl)}" alt="Profile">`;
  }
}


/* =========================================
   Balance UI
========================================= */

function updateBalanceUI() {

  const balance = Number(state.balance || 0).toFixed(2);

  const ids = [
    "main-balance",
    "wallet-balance",
    "profile-balance"
  ];

  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = balance;
    }
  });

  const pointsIds = [
    "referral-points",
    "wallet-points",
    "profile-points",
    "refer-page-points"
  ];

  pointsIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = Number(state.referralPoints || 0);
    }
  });
}


/* =========================================
   Referral UI
========================================= */

function updateReferralUI() {

  const count = document.getElementById("referral-count");
  if (count) {
    count.textContent = state.referralCount || 0;
  }

  const linkInput = document.getElementById("referral-link");
  if (linkInput) {
    linkInput.value = state.referralLink || "";
  }

  renderReferralList();
}


/* =========================================
   Referral List
========================================= */

function renderReferralList() {

  const container = document.getElementById("referral-list");
  if (!container) {
    return;
  }

  if (!state.referrals || state.referrals.length === 0) {
    container.innerHTML = `<div class="empty-state">No referrals yet.</div>`;
    return;
  }

  container.innerHTML = state.referrals
    .map(referral => {
      const name = referral.username
        ? `@${referral.username}`
        : referral.name || "Telegram User";

      const status = referral.verified
        ? "🟢 Verified"
        : "🔴 Unverified";

      return `
        <div class="referral-user">
          <span>${escapeHtml(name)}</span>
          <strong>${status}</strong>
        </div>
      `;
    })
    .join("");
}


/* =========================================
   Profile UI
========================================= */

function updateProfileUI() {

  const status = document.getElementById("verification-status");
  const verificationContent = document.getElementById("verification-content");
  const warning = document.getElementById("withdraw-verification");
  const withdrawForm = document.getElementById("withdraw-form");

  if (state.verified) {
    if (status) {
      status.textContent = "VERIFIED";
      status.classList.remove("unverified");
      status.classList.add("verified");
    }

    if (verificationContent) {
      verificationContent.innerHTML = `
        <p style="color:#20d889;">
          ✓ Your account is verified. All available features are unlocked.
        </p>
      `;
    }

    if (warning) {
      warning.style.display = "none";
    }

    if (withdrawForm) {
      withdrawForm.style.display = "block";
    }
  } else {
    if (status) {
      status.textContent = "UNVERIFIED";
      status.classList.remove("verified");
      status.classList.add("unverified");
    }

    if (verificationContent) {
      verificationContent.innerHTML = `
        <p>
          Join the Official Channel and verify your account to unlock withdrawal and referral benefits.
        </p>
        <a id="verification-channel-link" href="${APP_CONFIG.channelLink}" target="_blank" class="join-channel-button">
          ✈️ JOIN OFFICIAL CHANNEL
        </a>
        <button id="verify-button" class="verify-button" type="button">
          ✓ VERIFY NOW
        </button>
      `;
      attachVerificationButton();
    }

    if (warning) {
      warning.style.display = "block";
    }

    if (withdrawForm) {
      withdrawForm.style.display = "none";
    }
  }
}


/* =========================================
   Load User Data
========================================= */

async function loadUserData() {

  if (!state.userId) {
    return;
  }

  try {
    const response = await fetch(`/api/user/${state.userId}`);
    if (!response.ok) {
      throw new Error("Unable to load user");
    }

    const data = await response.json();
    if (data.success && data.user) {
      const user = data.user;
      state.balance = Number(user.balance || 0);
      state.referralPoints = Number(user.referralPoints || 0);
      state.verified = Boolean(user.verified);
      state.referrals = user.referrals || [];
    }
  } catch (error) {
    console.warn("User data loading failed:", error.message);
  }

  loadReferralData();
  updateBalanceUI();
  updateReferralUI();
  updateProfileUI();
}


/* =========================================
   Referral Data
========================================= */

async function loadReferralData() {

  if (!state.userId) {
    return;
  }

  try {
    const response = await fetch(`/api/referral/${state.userId}`);
    const data = await response.json();

    if (data.success) {
      state.referralLink = data.referralLink || "";
      state.referralCount = data.referralCount || 0;
      state.referralPoints = data.referralPoints || 0;
      state.referrals = data.referrals || [];
    }
  } catch (error) {
    console.warn("Referral data failed:", error.message);
  }

  updateReferralUI();
  updateBalanceUI();
}


/* =========================================
   Navigation & Init Execution
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeUser();
  setupNavigation();
  setupLinks();
  setupReferralButtons();
  setupWithdrawMethods();
  setupWithdraw();
  setupSpin();
});

function setupNavigation() {
  const buttons = document.querySelectorAll(".nav-button");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const screenId = button.dataset.screen;
      if (!screenId) return;

      document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
      });

      const target = document.getElementById(screenId);
      if (target) {
        target.classList.add("active");
      }

      buttons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");

      if (screenId === "task-screen") {
        loadTasks();
      }

      if (screenId === "wallet-screen") {
        updateSpinButton();
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function setupLinks() {
  const channel = document.getElementById("channel-link");
  const group = document.getElementById("group-link");

  if (channel) channel.href = APP_CONFIG.channelLink;
  if (group) group.href = APP_CONFIG.groupLink;
}

function attachVerificationButton() {
  const button = document.getElementById("verify-button");
  if (!button) return;
  button.addEventListener("click", verifyChannel);
}

async function verifyChannel() {
  if (!state.userId) return;

  const button = document.getElementById("verify-button");
  if (button) {
    button.disabled = true;
    button.textContent = "VERIFYING...";
  }

  try {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: state.userId })
    });

    const data = await response.json();
    state.verified = Boolean(data.verified);
    updateProfileUI();

    if (state.verified) {
      alert("🟢 Verification Successful!");
      await loadUserData();
    } else {
      alert("🔴 Please join the Official Channel first.");
    }
  } catch (error) {
    alert("Verification failed. Try again.");
  }

  if (button) {
    button.disabled = false;
    button.textContent = "✓ VERIFY NOW";
  }
}

async function loadTasks() {
  const container = document.getElementById("task-list");
  if (!container) return;

  container.innerHTML = `<div class="loading">Loading Tasks...</div>`;

  try {
    const response = await fetch("/api/tasks");
    const data = await response.json();

    if (!data.success || !data.tasks.length) {
      container.innerHTML = `<div class="empty-state">No tasks available right now.</div>`;
      return;
    }

    container.innerHTML = data.tasks
      .map(task => `
        <div class="task-card" data-task-id="${task.id}">
          <div class="task-top">
            <div>
              <h3>${escapeHtml(task.title)}</h3>
              <p>${escapeHtml(task.description)}</p>
            </div>
            <div class="task-reward">+৳${Number(task.reward || 0)}</div>
          </div>
          <button class="task-action" type="button" onclick="openTask(${Number(task.id)})">
            OPEN TASK
          </button>
        </div>
      `)
      .join("");
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Unable to load tasks.</div>`;
  }
}

async function openTask(taskId) {
  try {
    const response = await fetch("/api/tasks");
    const data = await response.json();
    const task = data.tasks.find(item => Number(item.id) === Number(taskId));

    if (!task || !task.link) return;

    if (telegramWebApp) {
      telegramWebApp.openTelegramLink(task.link);
    } else {
      window.open(task.link, "_blank");
    }
  } catch (error) {
    alert("Unable to open task.");
  }
}

function setupReferralButtons() {
  const copyButton = document.getElementById("copy-referral");
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      if (!state.referralLink) return;
      try {
        await navigator.clipboard.writeText(state.referralLink);
        alert("✅ Referral link copied!");
      } catch (error) {
        alert("Unable to copy link.");
      }
    });
  }

  const shareButton = document.getElementById("share-referral");
  if (shareButton) {
    shareButton.addEventListener("click", () => {
      if (!state.referralLink) return;
      const text = encodeURIComponent("Join BS TASK ZONE and complete tasks to earn rewards!");
      const url = encodeURIComponent(state.referralLink);
      const telegramShare = `https://t.me/share/url?url=${url}&text=${text}`;

      if (telegramWebApp) {
        telegramWebApp.openTelegramLink(telegramShare);
      } else {
        window.open(telegramShare, "_blank");
      }
    });
  }
}

function setupWithdrawMethods() {
  const buttons = document.querySelectorAll(".method-button");
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      state.withdrawMethod = button.dataset.method || "bKash";
    });
  });
}

function setupWithdraw() {
  const button = document.getElementById("withdraw-button");
  if (!button) return;

  button.addEventListener("click", () => {
    if (!state.verified) {
      alert("🔒 Please verify your Official Channel first.");
      return;
    }

    const number = document.getElementById("withdraw-number").value.trim();
    const amount = Number(document.getElementById("withdraw-amount").value);

    if (!/^01[0-9]{9}$/.test(number)) {
      alert("Enter a valid 11-digit account number.");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Enter a valid withdraw amount.");
      return;
    }

    if (amount > state.balance) {
      alert("Insufficient balance.");
      return;
    }

    alert(`Withdraw request: ${state.withdrawMethod} ৳${amount}`);
  });
}

function setupSpin() {
  const button = document.getElementById("spin-button");
  if (!button) return;

  button.addEventListener("click", performSpin);
  updateSpinButton();
}

function updateSpinButton() {
  const button = document.getElementById("spin-button");
  if (!button) return;

  const points = Number(state.referralPoints || 0);

  if (points >= APP_CONFIG.spinCost && !state.spinning) {
    button.disabled = false;
    button.textContent = "🎰 SPIN NOW";
  } else {
    button.disabled = true;
    button.textContent = `🔒 Need ${APP_CONFIG.spinCost} Points`;
  }
}

async function performSpin() {
  if (state.spinning) return;

  if (Number(state.referralPoints) < APP_CONFIG.spinCost) {
    alert(`You need ${APP_CONFIG.spinCost} Referral Points.`);
    return;
  }

  const result = document.getElementById("spin-result");
  state.spinning = true;
  updateSpinButton();

  const rewards = APP_CONFIG.spinRewards;
  const randomReward = rewards[Math.floor(Math.random() * rewards.length)];

  if (result) {
    result.textContent = `৳${randomReward}`;
  }

  try {
    const response = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: state.userId })
    });
    const data = await response.json();
    if (data.success) {
      state.balance = data.balance;
      state.referralPoints = data.referralPoints;
      updateBalanceUI();
    }
  } catch (error) {
    console.warn("Spin sync failed:", error);
  }

  setTimeout(() => {
    state.spinning = false;
    updateSpinButton();
    alert(`🎉 Congratulations! You won ৳${randomReward}`);
  }, 1500);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
      }
  
