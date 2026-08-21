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
  channelLink: "https://t.me/BSTaskZoneChannel",
  groupLink: "https://t.me/BSTaskZoneHelp",
  spinCost: 500,
  spinRewards: [5, 6, 7, 8, 10, 12, 15, 18, 20]
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

  // ব্রাউজারে টেস্ট করার জন্য ডেমো ডেটা
  return {
    id: 123456789,
    username: "demo_user",
    first_name: "Telegram User",
    photo_url: ""
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

  // সঠিক বটের ইউজারনেম দিয়ে রেফারেল লিংক তৈরি করা
  if (state.userId && !state.referralLink) {
    state.referralLink = `https://t.me/BSTaskZone_bot?start=ref_${state.userId}`;
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
  const topAvatar = document.getElementById("profile-avatar");
  const profilePhoto = document.getElementById("profile-photo");

  if (state.photoUrl) {
    if (topAvatar) {
      topAvatar.innerHTML = `<img src="${escapeHtml(state.photoUrl)}" alt="Profile" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }
    if (profilePhoto) {
      profilePhoto.innerHTML = `<img src="${escapeHtml(state.photoUrl)}" alt="Profile" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }
  } else {
    // ছবি না থাকলে ডিফল্ট আইকন
    if (topAvatar) topAvatar.innerHTML = "👤";
    if (profilePhoto) profilePhoto.innerHTML = "👤";
  }
}


/* =========================================
   Balance UI
========================================= */

function updateBalanceUI() {
  const balance = Number(state.balance || 0).toFixed(2);

  const ids = ["main-balance", "wallet-balance", "profile-balance"];
  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = balance;
    }
  });

  const pointsIds = ["referral-points", "wallet-points", "profile-points", "refer-page-points"];
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
    linkInput.value = state.referralLink || (state.userId ? `https://t.me/BSTaskZone_bot?start=ref_${state.userId}` : "");
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
      const status = referral.verified ? "🟢 Verified" : "🔴 Unverified";

      return `
        <div class="referral-user" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #1e293b; font-size:13px;">
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
        <p style="color:#20d889;">✓ Your account is verified. All available features are unlocked.</p>
      `;
    }
    if (warning) warning.style.display = "none";
    if (withdrawForm) withdrawForm.style.display = "block";
  } else {
    if (status) {
      status.textContent = "UNVERIFIED";
      status.classList.remove("verified");
      status.classList.add("unverified");
    }
    if (verificationContent) {
      verificationContent.innerHTML = `
        <p>Join both Official Channel and Group to verify your account and unlock withdrawal and referral benefits.</p>
        <a href="${APP_CONFIG.channelLink}" target="_blank" class="join-channel-button">✈️ JOIN OFFICIAL CHANNEL</a>
        <a href="${APP_CONFIG.groupLink}" target="_blank" class="join-channel-button" style="margin-top: 8px; background: #2563eb;">👥 JOIN OFFICIAL GROUP</a>
        <button id="verify-button" class="verify-button" type="button" style="margin-top: 10px;">✓ VERIFY NOW</button>
      `;
      attachVerificationButton();
    }
    if (warning) warning.style.display = "block";
    if (withdrawForm) withdrawForm.style.display = "none";
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
    if (!response.ok) throw new Error("Unable to load user");

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
      state.referralLink = data.referralLink || `https://t.me/BSTaskZone_bot?start=ref_${state.userId}`;
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
   Navigation & Event Listeners
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
      if (target) target.classList.add("active");

      buttons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");

      if (screenId === "task-screen") loadTasks();
      if (screenId === "wallet-screen") updateSpinButton();

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
      alert("🔴 Please join both Channel and Group first.");
    }
  } catch (error) {
    alert("Verification failed. Try again.");
  }

  if (button) button.disabled = false;
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
        <div class="task-card" data-task-id="${task.id}" style="background:#0b192c; border:1px solid #1e293b; padding:12px; border-radius:12px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div>
              <h3 style="font-size:14px; margin-bottom:2px;">${escapeHtml(task.title)}</h3>
              <p style="font-size:12px; color:#94a3b8;">${escapeHtml(task.description)}</p>
            </div>
            <div style="color:#3b82f6; font-weight:bold;">+৳${Number(task.reward || 0)}</div>
          </div>
          <button class="task-action" type="button" onclick="openTask(${Number(task.id)})" style="background:#3b82f6; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:12px; width:100%; cursor:pointer;">OPEN TASK</button>
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
      alert("🔒 Please verify your membership in both Channel and Group first.");
      return;
    }

    const numberInput = document.getElementById("withdraw-number");
    const amountInput = document.getElementById("withdraw-amount");
    if (!numberInput || !amountInput) return;

    const number = numberInput.value.trim();
    const amount = Number(amountInput.value);

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

    alert(`Withdraw request submitted: ${state.withdrawMethod} ৳${amount}`);
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
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
         }
      
