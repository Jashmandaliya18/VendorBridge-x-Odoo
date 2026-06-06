import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ eventType, description, performedBy, entityId, entityType }) => {
  await ActivityLog.create({
    eventType,
    description,
    performedBy,
    entityId,
    entityType,
  });
};
