import * as React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { OverviewPage } from 'pages/Overview/OverviewPage';
import { setRouterBasename, useInitKialiListeners } from '../utils/KialiIntegration';
import { KialiContainer } from 'openshift/components/KialiContainer';

const OverviewPageOSSMC: React.FC<void> = () => {
  const { pathname } = useLocation();

  setRouterBasename(pathname);

  useInitKialiListeners();

  return (
    <KialiContainer>
      <OverviewPage></OverviewPage>
    </KialiContainer>
  );
};

export default OverviewPageOSSMC;
