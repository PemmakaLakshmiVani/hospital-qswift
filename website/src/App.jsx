import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider, useQueue } from './context/QueueContext';
import Navbar from './components/common/Navbar';
import DiscoveryFeed from './components/patient/DiscoveryFeed';
import HospitalDetail from './components/patient/HospitalDetail';
import LiveTokenView from './components/patient/LiveTokenView';
import VisitHistory from './components/patient/VisitHistory';
import UserProfile from './components/patient/UserProfile';
import StaffDashboard from './components/staff/StaffDashboard';
import DoctorManagement from './components/staff/DoctorManagement';
import StaffAccountManager from './components/staff/StaffAccountManager';
import DoctorProfile from './components/staff/DoctorProfile';
import LeaveApprovals from './components/staff/LeaveApprovals';
import QueueAnalytics from './components/staff/QueueAnalytics';
import ReviewsConsole from './components/staff/ReviewsConsole';
import OnboardingModal from './components/staff/OnboardingModal';
import LoginModal from './components/common/LoginModal';
import ProtectedRoute from './components/common/ProtectedRoute';
import BottomNav from './components/common/BottomNav';

function MainApp() {
  const { userMode, userRole, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    setActiveTab('hospital-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTokenCreated = (newToken) => {
    setActiveTab('tokens');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keep activeTab in sync with userMode & userRole so staff/doctor screens never render blank
  React.useEffect(() => {
    const patientTabs = ['discover', 'hospital-detail', 'tokens', 'history', 'profile'];
    const staffTabs = ['staff-dashboard', 'doctor-profile', 'leave-approvals', 'staff-doctors', 'staff-accounts', 'staff-analytics', 'staff-reviews'];

    if (userMode === 'staff') {
      if (patientTabs.includes(activeTab) || !staffTabs.includes(activeTab)) {
        setActiveTab(userRole === 'doctor' ? 'doctor-profile' : 'staff-dashboard');
      }
    } else if (userMode === 'patient') {
      if (staffTabs.includes(activeTab) || !patientTabs.includes(activeTab)) {
        setActiveTab('discover');
      }
    }
  }, [userMode, userRole]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenOnboarding={() => setShowOnboardingModal(true)}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <main className="flex-1 pb-20 md:pb-6">
        {userMode === 'patient' ? (
          <>
            {activeTab === 'discover' && (
              <DiscoveryFeed onSelectHospital={handleSelectHospital} />
            )}

            {activeTab === 'hospital-detail' && selectedHospital && (
              <HospitalDetail
                hospital={selectedHospital}
                onBack={() => setActiveTab('discover')}
                onTokenCreated={handleTokenCreated}
                onRequireLogin={() => setShowLoginModal(true)}
              />
            )}

            {activeTab === 'tokens' && (
              <ProtectedRoute allowedRoles={['patient']} onRequireLogin={() => setShowLoginModal(true)}>
                <LiveTokenView onSelectHospital={handleSelectHospital} />
              </ProtectedRoute>
            )}

            {activeTab === 'history' && (
              <ProtectedRoute allowedRoles={['patient']} onRequireLogin={() => setShowLoginModal(true)}>
                <VisitHistory />
              </ProtectedRoute>
            )}

            {activeTab === 'profile' && (
              <ProtectedRoute allowedRoles={['patient']} onRequireLogin={() => setShowLoginModal(true)}>
                <UserProfile />
              </ProtectedRoute>
            )}
          </>
        ) : (
          <>
            {activeTab === 'staff-dashboard' && (
              <ProtectedRoute allowedRoles={['staff', 'doctor', 'admin', 'business_owner', 'staff_operator']} onRequireLogin={() => setShowLoginModal(true)}>
                <StaffDashboard />
              </ProtectedRoute>
            )}

            {activeTab === 'doctor-profile' && (
              <ProtectedRoute allowedRoles={['staff', 'doctor', 'admin', 'business_owner', 'staff_operator']} onRequireLogin={() => setShowLoginModal(true)}>
                <DoctorProfile />
              </ProtectedRoute>
            )}

            {activeTab === 'leave-approvals' && (
              <ProtectedRoute allowedRoles={['staff', 'doctor', 'admin', 'business_owner', 'staff_operator']} onRequireLogin={() => setShowLoginModal(true)}>
                <LeaveApprovals />
              </ProtectedRoute>
            )}

            {activeTab === 'staff-doctors' && (
              <ProtectedRoute allowedRoles={['staff', 'admin', 'business_owner']} onRequireLogin={() => setShowLoginModal(true)}>
                <DoctorManagement />
              </ProtectedRoute>
            )}

            {activeTab === 'staff-accounts' && (
              <ProtectedRoute allowedRoles={['staff', 'admin', 'business_owner']} onRequireLogin={() => setShowLoginModal(true)}>
                <StaffAccountManager />
              </ProtectedRoute>
            )}

            {activeTab === 'staff-analytics' && (
              <ProtectedRoute allowedRoles={['staff', 'admin', 'business_owner']} onRequireLogin={() => setShowLoginModal(true)}>
                <QueueAnalytics />
              </ProtectedRoute>
            )}

            {activeTab === 'staff-reviews' && (
              <ProtectedRoute allowedRoles={['staff', 'doctor', 'admin', 'business_owner', 'staff_operator']} onRequireLogin={() => setShowLoginModal(true)}>
                <ReviewsConsole />
              </ProtectedRoute>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#FFFFFF] border-t border-slate-200 py-6 mt-12 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-ink-muted space-y-2">
          <p className="font-semibold text-ink">
            Hospital Qswift — Realtime Walk-in OPD Doctor Token Platform
          </p>
          <p>Built with React, Leaflet Maps & Supabase Postgres Realtime. No paid APIs required.</p>
          <div className="pt-1">
            <button
              onClick={() => {
                if (window.confirm('Reset all tokens, new clinics, and local storage back to initial sample data?')) {
                  window.localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-3 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
            >
              🔄 Reset Sample Data & Clear Local Storage
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop / web browser) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Hospital Onboarding Modal */}
      {showOnboardingModal && (
        <OnboardingModal onClose={() => setShowOnboardingModal(false)} />
      )}

      {/* Initial Login / About Website Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onOpenOnboarding={() => setShowOnboardingModal(true)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <MainApp />
      </QueueProvider>
    </AuthProvider>
  );
}
