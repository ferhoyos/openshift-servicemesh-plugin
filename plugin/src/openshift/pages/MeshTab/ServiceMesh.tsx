import * as React from 'react';
import { Provider } from 'react-redux';
import { useHistory } from 'react-router';
import { store } from 'store/ConfigStore';
import ServiceId from 'types/ServiceId';
import ServiceDetailsPage from 'pages/ServiceDetails/ServiceDetailsPage';
import KialiController from '../../components/KialiController';
import { initKialiListeners } from '../../utils/KialiIntegration';

const ServiceMeshTab = () => {
  initKialiListeners();

  const history = useHistory();
  const path = history.location.pathname.substring(8);
  const items = path.split('/');
  const namespace = items[0];
  const service = items[2];

  const serviceId: ServiceId = {
    namespace,
    service
  };

  return (
    <Provider store={store}>
      <KialiController>
        <ServiceDetailsPage serviceId={serviceId}></ServiceDetailsPage>
      </KialiController>
    </Provider>
  );
};

export default ServiceMeshTab;
