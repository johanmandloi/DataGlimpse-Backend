// // src/services/guestTransferService.js
// import Dataset from "../models/Dataset.js";
// import GuestSession from "../models/GuestSession.js";

// /**
//  * Transfer datasets from a guest session to a registered user.
//  * @param {string} guestSessionId - The guest session ID
//  * @param {string} userId - The new registered user's ID
//  */
// export const transferGuestDataToUser = async (guestSessionId, userId) => {
//   try {
//     // Find the guest session
//     const guestSession = await GuestSession.findOne({ sessionId: guestSessionId });
//     if (!guestSession) {
//       console.warn(`[GuestTransfer] Guest session not found for ID: ${guestSessionId}`);
//       return false; // nothing to transfer
//     }

//     const datasetIds = guestSession.datasets || [];
//     if (datasetIds.length > 0) {
//       // Update datasets: assign to user, mark as registered, remove sessionId
//       const result = await Dataset.updateMany(
//         { _id: { $in: datasetIds } },
//         { 
//           $set: { userId, isGuestFile: false }, 
//           $unset: { sessionId: "" } 
//         }
//       );
//       console.log(`[GuestTransfer] Transferred ${result.modifiedCount} dataset(s) from guest to user ${userId}`);
//     } else {
//       console.log(`[GuestTransfer] No datasets found for guest session ${guestSessionId}`);
//     }

//     // Delete the guest session record
//     await GuestSession.deleteOne({ sessionId: guestSessionId });
//     console.log(`[GuestTransfer] Deleted guest session ${guestSessionId}`);

//     return true; // success

//   } catch (error) {
//     console.error(`[GuestTransfer] Error transferring guest data:`, error);
//     throw error; // propagate error for upstream handling
//   }
// };


// src/services/guestTransferService.js
import Dataset from "../models/Dataset.js";
import GuestSession from "../models/GuestSession.js";

/**
 * Transfer datasets from a guest session to a registered user.
 * @param {string} guestSessionId - The guest session ID
 * @param {string} userId - The new registered user's ID
 * @returns {object} - Transfer summary
 */

export const transferGuestDataToUser = async (guestSessionId, userId) => {
  try {
    // 1️⃣ Find the guest session
    const guestSession = await GuestSession.findOne({ sessionId: guestSessionId });
    if (!guestSession) {
      console.warn(`[GuestTransfer] No guest session found for ID: ${guestSessionId}`);
      return { success: false, message: "Guest session not found" };
    }

    const datasetIds = guestSession.datasets || [];
    if (datasetIds.length === 0) {
      console.log(`[GuestTransfer] No datasets found for guest session: ${guestSessionId}`);
    } else {
      // 2️⃣ Update datasets: assign to new user, remove sessionId, mark as registered
      const result = await Dataset.updateMany(
        { _id: { $in: datasetIds } },
        { $set: { userId, isGuestFile: false }, $unset: { sessionId: "" } }
      );
      console.log(`[GuestTransfer] Transferred ${result.modifiedCount} datasets to user ${userId}`);
    }

    // 3️⃣ Delete the guest session AFTER datasets are updated
    await GuestSession.deleteOne({ sessionId: guestSessionId });
    console.log(`[GuestTransfer] Deleted guest session ${guestSessionId}`);

    return { success: true, transferredCount: datasetIds.length };
  } catch (error) {
    console.error("[GuestTransfer] Error transferring guest data:", error);
    return { success: false, message: "Error during transfer" };
  }
};


// // src/services/guestTransferService.js
// import Dataset from "../models/Dataset.js";
// import GuestSession from "../models/GuestSession.js";

// /**
//  * Transfers datasets from a guest session to a registered user account.
//  * @param {string} guestSessionId - The guest's temporary session ID (token prefix guest_*)
//  * @param {string} userId - The newly registered user's MongoDB ID
//  * @returns {Promise<object>} - Result of the transfer
//  */

// export const transferGuestDataToUser = async (guestSessionId, userId) => {
//   try {
//     if (!guestSessionId || !userId) {
//       console.warn("[GuestTransfer] Missing required parameters.");
//       return { success: false, message: "Missing guestSessionId or userId" };
//     }

//     // 1️⃣ Find the guest session document
//     const guestSession = await GuestSession.findOne({ sessionId: guestSessionId });
//     if (!guestSession) {
//       console.warn(`[GuestTransfer] Guest session not found for ID: ${guestSessionId}`);
//       return { success: false, message: "Guest session not found" };
//     }

//     const datasetIds = guestSession.datasets || [];

//     // 2️⃣ If datasets exist, re-assign them to the new user
//     if (datasetIds.length > 0) {
//       const result = await Dataset.updateMany(
//         { _id: { $in: datasetIds } },
//         {
//           $set: { userId, isGuestFile: false },
//           $unset: { sessionId: "" },
//         }
//       );

//       console.log(
//         `[GuestTransfer] ✅ ${result.modifiedCount}/${datasetIds.length} datasets transferred to user ${userId}`
//       );
//     } else {
//       console.log(`[GuestTransfer] ⚠️ No datasets found for guest session: ${guestSessionId}`);
//     }

//     // 3️⃣ Clean up the guest session (important to prevent duplicates)
//     await GuestSession.deleteOne({ sessionId: guestSessionId });
//     console.log(`[GuestTransfer] 🗑️ Guest session ${guestSessionId} deleted`);

//     // 4️⃣ Return final summary
//     return {
//       success: true,
//       transferredCount: datasetIds.length,
//       message: datasetIds.length
//         ? `Transferred ${datasetIds.length} datasets`
//         : "No datasets to transfer",
//     };
//   } catch (error) {
//     console.error("[GuestTransfer] ❌ Error during guest data transfer:", error);
//     return { success: false, message: "Error during guest data transfer", error: error.message };
//   }
// };
