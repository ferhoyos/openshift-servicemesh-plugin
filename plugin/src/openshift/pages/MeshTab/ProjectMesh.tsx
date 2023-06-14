import * as React from 'react';
import { Provider } from 'react-redux';
import { useHistory } from 'react-router';
import { ActionKeys } from 'actions/ActionKeys';
import { store } from 'store/ConfigStore';
import GraphPage from 'pages/Graph/GraphPage';
import KialiController from '../../components/KialiController';
import { initKialiListeners } from '../../utils/KialiIntegration';

const ProjectMeshTab = () => {
  initKialiListeners();
  
  const history = useHistory();
  const path = history.location.pathname.substring(8);
  const items = path.split('/');
  const namespace = items[2];

  // Set namespace of the project as active namespace in redux store
  store.dispatch({ type: ActionKeys.SET_ACTIVE_NAMESPACES, payload: [{ name: namespace }] });

  return (
    <Provider store={store}>
      <KialiController>
        <GraphPage></GraphPage>
      </KialiController>
    </Provider>
  );
};

export default ProjectMeshTab;
