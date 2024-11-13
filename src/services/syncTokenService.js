import SyncToken from '../models/syncTokenModel.js';

export const getSyncToken = async () => {
  const record = await SyncToken.findById('globalSyncToken');
  return record ? record.syncToken : null;
};

export const saveSyncToken = async (syncToken) => {
  await SyncToken.findByIdAndUpdate(
    'globalSyncToken',
    { syncToken },
    { upsert: true, new: true }
  );
};
