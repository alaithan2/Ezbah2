/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromCache, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Connection check as per instructions
async function testConnection() {
  try {
    // Attempting a server-side "get" to verify connection and permissions
    await getDocFromServer(doc(db, "_system_", "health-check"));
  } catch (error: any) {
    if (error?.message?.includes("client is offline") || error?.code === "unavailable") {
      console.warn("Firebase connection: Limited (Offline mode or firewall).");
    } else if (error?.code === "permission-denied") {
      // This is expected if the document doesn't exist but rules deny non-existent reads
      console.log("Firebase connection: Active (Rules enforcing access).");
    } else {
      console.error("Firebase connection error:", error);
    }
  }
}

testConnection();
