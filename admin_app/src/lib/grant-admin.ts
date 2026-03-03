import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function grantSuperAdmin() {
    const uid = 'KVr9ocTPHJhmznHDdkz2HXBAKq42';
    await setDoc(doc(db, 'users', uid), {
        uid: uid,
        displayName: 'Adonis Muzata',
        email: 'adonismuzataet@gmail.com',
        role: 'super_admin',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp() // Set both for a fresh account
    }, { merge: true });
    console.log('✅ Role super_admin granted to Adonis Muzata');
}
grantSuperAdmin();
