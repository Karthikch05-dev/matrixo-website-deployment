'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaChartLine,
  FaDownload,
  FaUsers,
  FaBuilding,
  FaRocket,
  FaEye,
  FaShieldAlt,
} from 'react-icons/fa';
import { useImpactVault } from '@/hooks/useImpactVault';
import { DashboardTab } from '@/lib/impactvault/types';
import { generateStudentsCSV } from '@/lib/impactvault/analytics-engine';
import AccessGate from './AccessGate';
import OverviewPanel from './OverviewPanel';
import StudentIntelligence from './StudentIntelligence';
import DepartmentAnalytics from './DepartmentAnalytics';
import PlacementReadiness from './PlacementReadiness';

const tabs: { key: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: FaEye },
  { key: 'students', label: 'Students', icon: FaUsers },
  { key: 'departments', label: 'Departments', icon: FaBuilding },
  { key: 'placement', label: 'Placement', icon: FaRocket },
];

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  institution_admin: 'Institution Admin',
  faculty: 'Faculty',
  student: 'Student View',
};

export default function ImpactVault() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showDebug, setShowDebug] = useState(false);

  const {
    loading,
    error,
    role,
    institution,
    institutionMetrics,
    departmentMetrics,
    studentAnalytics,
    placementMetrics,
    currentUserUid,
    debugInfo,
  } = useImpactVault();

  const handleExport = () => {
    const csv = generateStudentsCSV(studentAnalytics);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `impactvault-${institution || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccessGate loading={loading} role={role} institution={institution} error={error}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/10 dark:to-emerald-900/10 py-20">
        <div className="container-custom px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full mb-3">
                  <FaChartLine className="animate-pulse" />
                  <span className="font-bold">ImpactVault™ Analytics</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Institutional Dashboard
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <p className="text-gray-600 dark:text-gray-400">
                    {institution
                      ? `Analytics for ${institution}`
                      : 'Platform-wide analytics'}
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                    <FaShieldAlt className="text-[10px]" />
                    {roleLabels[role] || role}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Debug Toggle (dev only) */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showDebug ? 'Hide Debug' : 'Debug'}
                  </button>
                )}
                {/* Export Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg shadow-lg font-medium flex items-center gap-2 hover:shadow-xl border border-gray-200/30 dark:border-white/[0.06]"
                >
                  <FaDownload /> Export CSV
                </motion.button>
              </div>
            </div>

            {/* Debug Panel */}
            {showDebug && debugInfo && (
              <div className="mb-4 p-4 bg-gray-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto">
                <pre>{debugInfo}</pre>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-xl shadow-lg p-1 border border-gray-200/30 dark:border-white/[0.06] overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="text-sm" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewPanel metrics={institutionMetrics} />
            )}
            {activeTab === 'students' && (
              <StudentIntelligence students={studentAnalytics} currentUserUid={currentUserUid} />
            )}
            {activeTab === 'departments' && (
              <DepartmentAnalytics departments={departmentMetrics} />
            )}
            {activeTab === 'placement' && (
              <PlacementReadiness metrics={placementMetrics} />
            )}
          </motion.div>
        </div>
      </div>
    </AccessGate>
  );
}
