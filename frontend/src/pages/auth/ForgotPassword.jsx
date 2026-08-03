import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as authApi from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // The backend always responds successfully here regardless of
      // whether the email is registered, to avoid leaking which emails
      // exist - so this UI can't and shouldn't distinguish "not found"
      // from "sent". See auth.service.js requestPasswordReset.
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #2a1a4a 0%, #1a1230 45%, #121212 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-slate-400 mt-1">We'll email you a link to get back in</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-medium">Check your email</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl py-6 touch-manipulation disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          <Link to="/login" className="text-violet-400 font-medium hover:text-violet-300">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
