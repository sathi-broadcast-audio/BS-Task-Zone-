// Navigation Switcher Logic
document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-button");
  const screens = document.querySelectorAll(".screen");

  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetScreenId = button.getAttribute("data-screen");

      // Remove active class from all buttons and screens
      navButtons.forEach(btn => btn.classList.remove("active"));
      screens.forEach(screen => screen.classList.remove("active"));

      // Add active class to clicked button and target screen
      button.classList.add("active");
      const targetScreen = document.getElementById(targetScreenId);
      if (targetScreen) {
        targetScreen.classList.add("active");
      }
    });
  });

  // Method Button Toggle for Withdraw
  const methodButtons = document.querySelectorAll(".method-button");
  methodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      methodButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
});
