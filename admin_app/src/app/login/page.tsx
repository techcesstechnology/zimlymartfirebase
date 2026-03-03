'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            // Verify that the signed-in user has an admin role
            const snap = await getDoc(doc(db, 'users', cred.user.uid));
            if (!snap.exists() || !snap.data()?.role) {
                await auth.signOut();
                setError('Access denied. This account has no admin privileges.');
                return;
            }
            router.replace('/dashboard');
        } catch (e: any) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <p className="text-2xl font-bold text-white tracking-tighter">ZIMLYMART</p>
                    <p className="text-gray-400 text-sm mt-1">Admin Portal</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-green-600/10 rounded-2xl">
                            <Lock className="w-6 h-6 text-green-500" />
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-green-600 outline-none transition-all placeholder-gray-600"
                                placeholder="admin@zimlymart.co.zw" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-green-600 outline-none transition-all"
                                placeholder="••••••••" />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-semibold transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
