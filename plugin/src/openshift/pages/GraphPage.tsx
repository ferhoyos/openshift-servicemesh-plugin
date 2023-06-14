import * as React from 'react';
import { Provider } from 'react-redux';
import { store } from 'store/ConfigStore';
import GraphPage from 'pages/Graph/GraphPage';
import KialiController from '../components/KialiController';
import { initKialiListeners } from '../utils/KialiIntegration';
import { useHistory } from 'react-router';

const GraphContainer = () => {
  initKialiListeners();

  const history = useHistory();
  console.log(history.location.pathname);

  return (
    <Provider store={store}>
      <KialiController>
        <GraphPage></GraphPage>
      </KialiController>
    </Provider>
  );
};

export default GraphContainer;
