/**
 * BS TASK ZONE
 * Task Management File
 *
 * ভবিষ্যতে Task যোগ / পরিবর্তন / বন্ধ করার
 * মূল কাজ এই ফাইল থেকেই করা যাবে।
 */

const tasks = [
  {
    id: 1,

    title: "Official Telegram Channel Join",

    description:
      "আমাদের Official Telegram Channel-এ Join করুন।",

    type: "telegram_channel",

    reward: 0,

    link:
      "https://t.me/YOUR_CHANNEL_USERNAME",

    verificationRequired: true,

    active: true
  },

  {
    id: 2,

    title: "Telegram Group Join",

    description:
      "আমাদের Official Telegram Group-এ Join করুন।",

    type: "telegram_group",

    reward: 0,

    link:
      "https://t.me/YOUR_GROUP_USERNAME",

    verificationRequired: true,

    active: true
  }

  // ------------------------------------------------
  // ভবিষ্যতে নতুন Task এখানে যোগ করবে।
  //
  // উদাহরণ:
  //
  // {
  //   id: 3,
  //   title: "New Task",
  //   description: "Task description",
  //   type: "telegram_channel",
  //   reward: 5,
  //   link: "https://t.me/example",
  //   verificationRequired: true,
  //   active: true
  // }
  // ------------------------------------------------
];

/**
 * শুধু Active Task ফেরত দেবে
 */
function getTaskList() {
  return tasks.filter(task => task.active);
}

/**
 * নির্দিষ্ট Task খুঁজে বের করবে
 */
function getTaskById(taskId) {
  return tasks.find(
    task => Number(task.id) === Number(taskId)
  );
}

/**
 * সব Task ফেরত দেবে
 */
function getAllTasks() {
  return tasks;
}

module.exports = {
  getTaskList,
  getTaskById,
  getAllTasks
};
