import * as React from 'react';
import {
  getGroupVersionKindForResource,
  K8sGroupVersionKind,
  ListPageBody,
  ListPageCreateDropdown,
  ListPageFilter,
  ListPageHeader,
  ResourceLink,
  RowFilter,
  RowProps,
  TableColumn,
  TableData,
  useActiveColumns,
  useListPageFilter,
  VirtualizedTable
} from '@openshift-console/dynamic-plugin-sdk';
import { getKialiConfig, KialiConfig } from '../kialiIntegration';
import { useHistory, useParams } from 'react-router';
import { sortable } from '@patternfly/react-table';
import { istioResources, referenceFor } from '../utils/resources';
import {
  API,
  getIstioObject,
  getReconciliationCondition,
  HomeClusterName,
  IstioConfigItem,
  IstioConfigList,
  IstioObject,
  Namespace,
  ObjectValidation,
  PromisesRegistry,
  StatusCondition,
  toIstioItems
} from '@kiali/types';
import { ValidationObjectSummary } from '@kiali/core-ui';

interface IstioConfigObject extends IstioObject {
  validation: ObjectValidation;
  reconciledCondition: StatusCondition;
}

const columns: TableColumn<IstioConfigObject>[] = [
  {
    id: 'name',
    sort: 'metadata.name',
    title: 'Name',
    transforms: [sortable]
  },
  {
    id: 'namespace',
    sort: 'metadata.namespace',
    title: 'Namespace',
    transforms: [sortable]
  },
  {
    id: 'kind',
    sort: 'kind',
    title: 'Kind',
    transforms: [sortable]
  },
  {
    id: 'configuration',
    sort: 'validation.valid',
    title: 'Configuration',
    transforms: [sortable]
  }
];

const useIstioTableColumns = () => {
  const [activeColumns] = useActiveColumns<IstioConfigObject>({
    columns: columns,
    showNamespaceOverride: true,
    columnManagementID: ''
  });

  return activeColumns;
};

const Row = ({ obj, activeColumnIDs }: RowProps<IstioConfigObject>) => {
  const groupVersionKind = getGroupVersionKindForResource(obj);
  const nsGroupVersionKind: K8sGroupVersionKind = {
    group: '',
    version: 'v1',
    kind: 'Namespace'
  };
  return (
    <>
      <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
        <ResourceLink groupVersionKind={groupVersionKind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          groupVersionKind={nsGroupVersionKind}
          name={obj.metadata.namespace}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
        {obj.kind + (obj.apiVersion.includes('k8s') ? ' (K8s)' : '')}
      </TableData>
      <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
        {obj.validation ? (
          <ValidationObjectSummary
            id={obj.metadata.name + '-config-validation'}
            validations={[obj.validation]}
            reconciledCondition={obj.reconciledCondition}
          />
        ) : (
          <>N/A</>
        )}
      </TableData>
    </>
  );
};

const filters: RowFilter[] = [
  {
    filterGroupName: 'Kind',
    type: 'kind',
    reducer: (obj: IstioConfigObject) => {
      const groupVersionKind = getGroupVersionKindForResource(obj);
      return groupVersionKind.group + '.' + obj.kind;
    },
    filter: (input, obj: IstioConfigObject) => {
      if (!input.selected?.length) {
        return true;
      }

      const groupVersionKind = getGroupVersionKindForResource(obj);
      return input.selected.includes(groupVersionKind.group + '.' + obj.kind);
    },
    items: istioResources.map(({ group, kind, title }) => ({
      id: group + '.' + kind,
      title: title ? title : kind
    }))
  }
];

type IstioTableProps = {
  columns: TableColumn<IstioConfigObject>[];
  data: IstioConfigObject[];
  unfilteredData: IstioConfigObject[];
  loaded: boolean;
  loadError?: {
    message?: string;
  };
};

const IstioTable = ({ columns, data, unfilteredData, loaded, loadError }: IstioTableProps) => {
  return (
    <VirtualizedTable<IstioConfigObject>
      data={data}
      unfilteredData={unfilteredData}
      loaded={loaded}
      loadError={loadError}
      columns={columns}
      Row={Row}
    />
  );
};

const newIstioResourceList = {
  authorization_policy: 'AuthorizationPolicy',
  gateway: 'Gateway',
  k8s_gateway: 'K8sGateway',
  peer_authentication: 'PeerAuthentication',
  request_authentication: 'RequestAuthentication',
  service_entry: 'ServiceEntry',
  sidecar: 'Sidecar'
};

const IstioConfigList = () => {
  const { ns } = useParams<{ ns: string }>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [kialiConfig, setKialiConfig] = React.useState<KialiConfig>(undefined);
  const [listItems, setListItems] = React.useState<any[]>([]);
  const history = useHistory();

  const promises = new PromisesRegistry();

  // Fetch the Istio configs, convert to istio items and map them into flattened list items
  const fetchIstioConfigs = async (istioAPIEnabled: boolean): Promise<IstioConfigItem[]> => {
    const validate = istioAPIEnabled ? true : false;
    let getNamespacesData, getIstioConfigData;
    if (ns) {
      getIstioConfigData = promises.register('getIstioConfig', API.getIstioConfig(ns, [], validate, '', ''));
    } else {
      // If no namespace is selected, get istio config for all namespaces
      getNamespacesData = promises.register('getNamespaces', API.getNamespaces());
      getIstioConfigData = promises.register('getIstioConfig', API.getAllIstioConfigs([], [], validate, '', ''));
    }
    return Promise.all([getNamespacesData, getIstioConfigData]).then(response => {
      if (ns) {
        return toIstioItems(response[1].data as IstioConfigList, HomeClusterName);
      } else {
        let istioItems: IstioConfigItem[] = [];
        // convert istio objects from all namespaces
        const namespaces: Namespace[] = response[0].data;
        namespaces.forEach(namespace => {
          istioItems = istioItems.concat(toIstioItems(response[1].data[namespace.name], HomeClusterName));
        });
        return istioItems;
      }
    });
  };

  const onCreate = (reference: string) => {
    const { group, version, kind } = istioResources.find(res => res.id === reference);
    const path = `/k8s/ns/${ns ?? 'default'}/${referenceFor(group, version, kind)}/~new`;
    history.push(path);
  };

  React.useEffect(() => {
    getKialiConfig()
      .then(kialiConfig => {
        setKialiConfig(kialiConfig);

        if (!kialiConfig.server.gatewayAPIEnabled) {
          delete newIstioResourceList['k8s_gateway'];
        }
      })
      .catch(error => console.error('Error getting Kiali API config', error));
  }, []);

  React.useEffect(() => {
    if (kialiConfig) {
      fetchIstioConfigs(kialiConfig.status.istioEnvironment.istioAPIEnabled).then(istioConfigs => {
        const istioConfigObjects = istioConfigs.map(istioConfig => {
          const istioConfigObject = getIstioObject(istioConfig) as IstioConfigObject;
          istioConfigObject.validation = istioConfig.validation;
          istioConfigObject.reconciledCondition = getReconciliationCondition(istioConfig);

          return istioConfigObject;
        });
        setListItems(istioConfigObjects);
        setLoaded(true);
      });
    }
  }, [kialiConfig, ns]);

  const [data, filteredData, onFilterChange] = useListPageFilter(listItems, filters);

  const columns = useIstioTableColumns();

  return (
    <>
      <ListPageHeader title="Istio Config">
        <ListPageCreateDropdown items={newIstioResourceList} onClick={onCreate}>
          Create
        </ListPageCreateDropdown>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} rowFilters={filters} onFilterChange={onFilterChange} />
        <IstioTable columns={columns} data={filteredData} unfilteredData={data} loaded={loaded} />
      </ListPageBody>
    </>
  );
};

export default IstioConfigList;