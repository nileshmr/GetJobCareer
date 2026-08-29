const Subscriber = require("../models/Subscriber");
const NotificationLog = require("../models/NotificationLog");




const getEligibleSubscribers = async (job) => {
  try {
    const subscribers = await Subscriber.find({
      isActive: true,
    });

    const eligibleSubscribers = subscribers.filter((subscriber) => {
      // Agar subscriber ne koi category select nahi ki hai,
      // to usko sabhi jobs ke liye eligible maanenge.
      if (!subscriber.categories || subscriber.categories.length === 0) {
            return true;
        }

      return subscriber.categories.includes(job.category);
    });

    return eligibleSubscribers;
  } catch (error) {
    throw new Error(
      `Failed to find eligible subscribers: ${error.message}`
    );
  }
};

const processJobNotifications = async (job) => {
  try {
    const subscribers = await getEligibleSubscribers(job);

    const emailSubscribers = subscribers.filter(
      (subscriber) => subscriber.emailOptIn
    );

    const whatsappSubscribers = subscribers.filter(
      (subscriber) => subscriber.whatsappOptIn
    );

    const notificationLog = await NotificationLog.create({
      job: job._id,
      totalSubscribers: subscribers.length,
      emailSubscribers: emailSubscribers.length,
      whatsappSubscribers: whatsappSubscribers.length,
      status: "processed",
    });

    console.log("================================");
    console.log("JOB NOTIFICATION PROCESS");
    console.log("Job:", job.title);
    console.log("Email subscribers:", emailSubscribers.length);
    console.log("WhatsApp subscribers:", whatsappSubscribers.length);
    console.log("Notification log:", notificationLog._id);
    console.log("================================");

    return {
      totalSubscribers: subscribers.length,
      emailSubscribers: emailSubscribers.length,
      whatsappSubscribers: whatsappSubscribers.length,
      notificationLogId: notificationLog._id,
    };
  } catch (error) {
    throw new Error(
      `Failed to process job notifications: ${error.message}`
    );
  }
};

module.exports = {
  getEligibleSubscribers,
  processJobNotifications,
};



