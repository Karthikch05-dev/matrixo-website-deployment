'use client';

import { useAuth } from '@/lib/AuthContext';
import { storeRedirectAfterLogin } from '@/lib/authRedirect';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaLock, FaChartLine, FaSignInAlt } from 'react-icons/fa';
import { ImpactVaultRole } from '@/lib/impactvault/types';

interface AccessGateProps {
  loading: boolean;
  role: ImpactVaultRole;
  institution: string;
  error: string | null;
  children: React.ReactNode;
}

export default function AccessGate({
  loading,
  role,
  institution,
  error,
  children,
}: AccessGateProps) {
  const { user, loading: authLoading } = useAuth();

  // Auth loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/10 dark:to-emerald-900/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl animate-pulse">
            <FaChartLine />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading ImpactVault Analytics...
          </p>
        </motion.div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/10 dark:to-emerald-900/10 flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md mx-4 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl">
            <FaLock />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sign in to access ImpactVault institutional analytics dashboard.
          </p>
          <Link
            href="/auth"
            onClick={() => storeRedirectAfterLogin()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <FaSignInAlt /> Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && !institution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/10 dark:to-emerald-900/10 flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md mx-4 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-2xl">
            <FaChartLine />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Institution Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please update your profile with your college/institution name to access analytics.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Update Profile
          </Link>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
