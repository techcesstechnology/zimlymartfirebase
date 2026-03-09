import { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Creates a Firestore user document for new accounts.
 * Safe to call on every sign-in — skips if the doc already exists.
 */
export async function ensureUserDoc(user: User): Promise<void> {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    await setDoc(ref, {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        role: "customer",
        isActive: true,
        preferences: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}
