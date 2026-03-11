// Configuration for beta vs production features
const checkIsBeta = () => {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_SITE_MODE === 'beta') {
    return true;
  }
  
  // Check hostname in browser
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'beta.matrixo.in';
  }
  
  // Check Vercel URL during build/server
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return process.env.NEXT_PUBLIC_VERCEL_URL.includes('beta');
  }
  
  return false;
};

export const isBetaSite = checkIsBeta();

export const config = {
  isBeta: isBetaSite,
  siteName: isBetaSite ? 'matriXO Beta' : 'matriXO',
  features: {
    // Beta-only features - matriXO Vision Platform
    skillDNA: isBetaSite,           // AI-based skill assessment
    growGrid: isBetaSite,           // Adaptive learning pathways
    playCred: isBetaSite,           // Blockchain credentials
    mentorMatrix: isBetaSite,       // AI-matched mentorship
    impactVault: isBetaSite,        // Analytics dashboard
    
    // Legacy features
    advancedAnalytics: isBetaSite,
    enhancedEventManagement: isBetaSite,
    communityFeatures: isBetaSite,
    revenueTracking: isBetaSite,
    partnershipPortal: isBetaSite,
  }
};

export default config;
