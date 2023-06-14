import * as React from 'react';
import { Provider } from 'react-redux';
import { store } from 'store/ConfigStore';
import OverviewPage from 'pages/Overview/OverviewPage';
import KialiController from '../components/KialiController';
import { initKialiListeners } from '../utils/KialiIntegration';
import { useHistory } from 'react-router';

const OverviewContainer = () => {
  initKialiListeners();

  const history = useHistory();
  console.log(history.location.pathname);

  return (
    <Provider store={store}>
      <KialiController>
        <OverviewPage></OverviewPage>
      </KialiController>
    </Provider>
  );
};

export default OverviewContainer;
