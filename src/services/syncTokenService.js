import SyncToken from "../models/syncTokenModel.js";

export const getSyncToken = async () => {
  try {
    const record = await SyncToken.findById("globalSyncToken").lean();
    return record ? record.syncToken : null;
  } catch (error) {
    console.error("Error fetching syncToken:", error);
    throw new Error("Error fetching syncToken");
  }
};

export const saveSyncToken = async (syncToken) => {
  try {
    const result = await SyncToken.findByIdAndUpdate(
      "globalSyncToken",
      { syncToken },
      { upsert: true, new: true, runValidators: true }
    );
    return result;
  } catch (error) {
    console.error("Error saving syncToken:", error);
    throw new Error("Error saving syncToken");
  }
};
