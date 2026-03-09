"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Leaf, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

const AUTH_ERRORS: Record<string, string> = {
    "auth/user-not-found":        "No account found with this email address.",
    "auth/invalid-email":         "Please enter a valid email address.",
    "auth/too-many-requests":     "Too many attempts. Please wait before trying again.",
    "auth/network-request-failed":"Network error. Check your connection.",
};

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { setError("Please enter your email address."); return; }
        setLoading(true);
        setError("");
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? "";
            setError(AUTH_ERRORS[code] ?? "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-8">
                <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
                    <Leaf className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tighter">
                    zimly<span className="text-green-600">mart</span>
                </span>
            </Link>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

                {sent ? (
                    /* ── Success state ── */
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Check your email</h1>
                        <p className="text-sm text-gray-500 mb-1">
                            We sent a password reset link to
                        </p>
                        <p className="font-bold text-gray-800 text-sm mb-6">{email}</p>
                        <p className="text-xs text-gray-400 mb-8">
                            Didn&apos;t receive it? Check your spam folder or{" "}
                            <button
                                onClick={() => setSent(false)}
                                className="text-green-600 font-semibold hover:underline"
                            >
                                try again
                            </button>.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    /* ── Form state ── */
                    <>
                        <div className="mb-7">
                            <h1 className="text-2xl font-black text-gray-900">Reset your password</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Enter your email and we&apos;ll send you a reset link.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Send Reset Link
                            </button>
                        </form>

                        <div className="flex items-center justify-center mt-6">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-green-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
