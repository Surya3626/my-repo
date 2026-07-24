import React from 'react';
import { OnboardingWizard } from './OnboardingWizard';

export const AdminOnboardingWizard: React.FC = () => {
  return <OnboardingWizard isAdminMode={true} />;
};
