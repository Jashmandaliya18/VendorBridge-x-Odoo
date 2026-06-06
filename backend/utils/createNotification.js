import Notification from '../models/Notification.js';

export const createNotification = async ({ userId, title, message, type, entityId }) => {
  return Notification.create({
    user: userId,
    title,
    message,
    type,
    entityId,
  });
};
