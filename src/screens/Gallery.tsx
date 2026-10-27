import {Text} from 'ink';
import {useState} from 'react';
import {
  MultiSelect,
  PaginatedList,
  Panel,
  ScreenLayout,
  ScreenState,
  Stack,
  Table,
} from '../components';
import {useAsync, useInputCapture, useKeymap, useRouter} from '../hooks';
import {itemStatus, listItems, refreshItems} from '../features/example/items';

export type ExampleRoutes = {gallery: undefined; 'gallery-detail': {id: string}};

export function GalleryScreen() {
  const router = useRouter<ExampleRoutes>();
  const result = useAsync(refreshItems);
  const [statuses, setStatuses] = useState<string[]>(itemStatus.options);
  const [filtering, setFiltering] = useState(false);
  const [selected, setSelected] = useState(0);
  useInputCapture(filtering);
  const items = listItems(result.status === 'success' ? result.data : listItems(), statuses);
  const index = Math.min(selected, Math.max(0, items.length - 1));
  useKeymap(
    [
      {key: 'up', run: () => setSelected(Math.max(0, index - 1))},
      {key: 'down', run: () => setSelected(Math.min(items.length - 1, index + 1))},
      {
        key: 'enter',
        run: () => {
          if (items[index]) router.push('gallery-detail', {id: items[index].id});
        },
      },
      {key: 'f', run: () => setFiltering(true)},
      {
        key: 'r',
        run: () => {
          void result.run('ready');
        },
      },
      {
        key: 'e',
        run: () => {
          void result.run('empty');
        },
      },
      {
        key: 'x',
        run: () => {
          void result.run('error');
        },
      },
    ],
    {isActive: !filtering, scope: 'screen'},
  );
  useKeymap([{key: 'esc', run: () => setFiltering(false)}], {
    isActive: filtering,
    allowWhenCaptured: true,
    scope: 'screen',
  });
  const status =
    result.status === 'loading'
      ? 'loading'
      : result.status === 'error'
        ? 'error'
        : items.length
          ? 'success'
          : 'empty';
  return (
    <ScreenLayout title="Gallery" description="A small list and detail application">
      <Stack gap={1}>
        <Panel title="Status summary">
          <Table
            columns={[
              {key: 'status', header: 'Status'},
              {key: 'count', header: 'Count', align: 'right'},
            ]}
            rows={itemStatus.options.map((value) => ({
              status: value,
              count: items.filter((item) => item.status === value).length,
            }))}
          />
        </Panel>
        {filtering ? (
          <Panel title="Filter statuses">
            <MultiSelect
              items={itemStatus.options.map((value) => ({value, label: value}))}
              value={statuses}
              onChange={(values) => {
                setStatuses(values);
                setSelected(0);
              }}
              onSubmit={() => setFiltering(false)}
              allowWhenCaptured
            />
          </Panel>
        ) : (
          <Panel title="Example work items">
            <ScreenState
              status={status}
              error={result.status === 'error' ? result.error : undefined}
              message={
                status === 'empty'
                  ? 'No matching items. Press f to filter or r to reload.'
                  : undefined
              }
            >
              {status === 'success' && (
                <PaginatedList
                  items={items}
                  pageSize={3}
                  page={Math.floor(index / 3)}
                  onPageChange={(page) => setSelected(page * 3)}
                  getKey={(item) => item.id}
                  renderItem={(item, offset) => (
                    <Text
                      aria-label={`${item.name}, ${item.status}${offset === index ? ', selected' : ''}`}
                      wrap="truncate-end"
                    >
                      {offset === index ? '>' : ' '} {item.name} [{item.status}]
                    </Text>
                  )}
                />
              )}
            </ScreenState>
          </Panel>
        )}
        <Text dimColor>Up/down select; enter opens details.</Text>
        <Text dimColor>f filter; r reload; e empty; x error.</Text>
      </Stack>
    </ScreenLayout>
  );
}

export function GalleryDetailScreen() {
  const router = useRouter<ExampleRoutes>();
  const id = router.paramsFor('gallery-detail')?.id;
  const item = listItems().find((entry) => entry.id === id);
  useKeymap(
    [{key: 'esc', run: () => (router.canGoBack ? router.pop() : router.replace('gallery'))}],
    {scope: 'screen'},
  );
  return (
    <ScreenLayout title={item?.name ?? 'Item details'}>
      <Panel title={item?.status ?? 'No item selected'}>
        <Text>{item?.description ?? 'Open Gallery and select an item.'}</Text>
        <Text dimColor>esc returns to the list</Text>
      </Panel>
    </ScreenLayout>
  );
}
