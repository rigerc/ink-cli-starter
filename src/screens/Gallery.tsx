import {Box, Text} from 'ink';
import {useState} from 'react';
import {Badge, Muted, Panel, ScreenLayout, SearchSelect} from '../components';
import {useHasInputCapture, useKeymap} from '../hooks';
import {GalleryExample, galleryItems} from './GalleryExamples';

/**
 * One component family is mounted at a time.
 * [ / ] switch examples; / explicitly opens the searchable picker.
 * The focused SearchSelect captures input and suspends gallery/global shortcuts.
 */
export function GalleryScreen() {
  const [index, setIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const captured = useHasInputCapture();
  const current = galleryItems[index]!;

  const choose = (next: number) => {
    setIndex((next + galleryItems.length) % galleryItems.length);
    setSearchActive(false);
    setPickerOpen(false);
  };

  useKeymap(
    [
      {key: '[', run: () => choose(index - 1)},
      {key: ']', run: () => choose(index + 1)},
      {key: '/', run: () => setPickerOpen(true)},
      {
        key: 'enter',
        run: () => {
          if (current.id === 'search') setSearchActive(true);
        },
      },
    ],
    {isActive: !captured && !pickerOpen && !searchActive, scope: 'screen'},
  );

  return (
    <ScreenLayout
      title="Component gallery"
      description="One component at a time; use [ ] to browse or / to choose"
      actions={
        <Badge tone="accent" variant="outline">
          {index + 1}/{galleryItems.length}
        </Badge>
      }
    >
      {pickerOpen ? (
        <Panel title="Choose component" footer="Type to filter  ↑/↓ move  Enter choose  Esc cancel">
          <SearchSelect
            items={galleryItems.map((item) => ({
              value: item.id,
              label: item.label,
              hint: item.hint,
            }))}
            maxVisible={6}
            onSelect={(id) => choose(galleryItems.findIndex((item) => item.id === id))}
            onCancel={() => setPickerOpen(false)}
          />
        </Panel>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Panel title={current.label} footer={current.hint}>
            <GalleryExample
              key={current.id}
              id={current.id}
              searchActive={searchActive}
              onSearchActiveChange={setSearchActive}
            />
          </Panel>
          <Muted>[ previous ] next / find component</Muted>
          <Text dimColor>Only the selected example receives keyboard input.</Text>
        </Box>
      )}
    </ScreenLayout>
  );
}
