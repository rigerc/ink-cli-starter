import {renderToString, Text} from 'ink';
import {describe, expect, it, vi} from 'vite-plus/test';
import {App} from '../src/app';
import {MultiSelect, PaginatedList, SearchSelect, Toggle} from '../src/components';
import {ThemeProvider} from '../src/theme/context';
import {themeNames} from '../src/theme/tokens';
import stringWidth from 'string-width';
import {mount} from './helpers/terminal';

const items = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map((label) => ({
  value: label.toLowerCase(),
  label,
}));

describe('MultiSelect', () => {
  it('toggles options and submits valid selections in item order', async () => {
    const change = vi.fn();
    const submit = vi.fn();
    const app = await mount(
      <MultiSelect
        items={items}
        defaultValue={['beta', 'missing']}
        onChange={change}
        onSubmit={submit}
        maxVisible={2}
      />,
    );
    await app.key(' ');
    expect(change).toHaveBeenLastCalledWith(['alpha', 'beta']);
    await app.key('\u001b[B');
    await app.key(' ');
    expect(change).toHaveBeenLastCalledWith(['alpha']);
    await app.key('\r');
    expect(submit).toHaveBeenLastCalledWith(['alpha']);
    await app.key('\u001b[F'); // End scrolls to the last option.
    expect(app.frame()).toContain('Epsilon');
    expect(app.frame()).not.toContain('Alpha');
    await app.key(' ');
    await app.key('\r');
    expect(submit).toHaveBeenLastCalledWith(['alpha', 'epsilon']);
  });

  it('leaves controlled selection to the parent and ignores keys when inactive', async () => {
    const change = vi.fn();
    const app = await mount(<MultiSelect items={items} value={[]} onChange={change} />);
    await app.key(' ');
    expect(change).toHaveBeenCalledWith(['alpha']);
    expect(app.frame()).toContain('0 selected');
    app.instance.rerender(
      <MultiSelect items={items} value={['alpha']} onChange={change} isActive={false} />,
    );
    await app.settle();
    await app.key(' ');
    expect(app.frame()).toContain('[x] Alpha');
    expect(change).toHaveBeenCalledOnce();
  });

  it('handles empty and shrinking options without submitting removed values', async () => {
    const submit = vi.fn();
    const app = await mount(
      <MultiSelect items={items} defaultValue={['epsilon']} onSubmit={submit} />,
    );
    await app.key('\u001b[F');
    app.instance.rerender(<MultiSelect items={items.slice(0, 1)} onSubmit={submit} />);
    await app.settle();
    await app.key(' ');
    await app.key('\r');
    expect(submit).toHaveBeenLastCalledWith(['alpha']);
    app.instance.rerender(<MultiSelect items={[]} onSubmit={submit} />);
    await app.settle();
    await app.key(' ');
    await app.key('\r');
    expect(app.frame()).toContain('No options available');
    expect(submit).toHaveBeenCalledOnce();
  });
});

describe('SearchSelect', () => {
  it('filters labels/hints without case sensitivity and selects a matching item', async () => {
    const select = vi.fn();
    const app = await mount(
      <SearchSelect
        items={[...items, {value: 'extra', label: 'Extra', hint: 'Testing'}]}
        onSelect={select}
        maxVisible={2}
      />,
    );
    await app.key('TEST');
    expect(app.frame()).toContain('Extra');
    expect(app.frame()).not.toContain('Alpha');
    await app.key('\r');
    expect(select).toHaveBeenLastCalledWith('extra');
    await app.key('\u0015'); // Ctrl+U clears the query.
    await app.key('\u001b[A');
    await app.key('\r'); // Up wraps to the last match.
    expect(select).toHaveBeenLastCalledWith('extra');
    expect(app.frame()).toContain('5-6 of 6 matches');
  });

  it('shows no matches, ignores Enter, and backspaces a whole Unicode grapheme', async () => {
    const select = vi.fn();
    const query = vi.fn();
    const app = await mount(<SearchSelect items={items} onSelect={select} onQueryChange={query} />);
    await app.key('👩‍💻');
    await app.key('\r');
    expect(app.frame()).toContain('No matches found');
    expect(select).not.toHaveBeenCalled();
    await app.key('\u007f');
    expect(query).toHaveBeenLastCalledWith('');
    expect(app.frame()).toContain('Alpha');
  });

  it('honors a controlled query and resets navigation when it changes', async () => {
    const select = vi.fn();
    const change = vi.fn();
    const app = await mount(
      <SearchSelect items={items} query="" onQueryChange={change} onSelect={select} />,
    );
    await app.key('z');
    expect(change).toHaveBeenCalledWith('z');
    expect(app.frame()).toContain('Alpha');
    await app.key('\u001b[B');
    app.instance.rerender(
      <SearchSelect items={items} query="gam" onQueryChange={change} onSelect={select} />,
    );
    await app.settle();
    await app.key('\r');
    expect(select).toHaveBeenLastCalledWith('gamma');
  });

  it('does not consume keys while inactive', async () => {
    const select = vi.fn();
    const change = vi.fn();
    const app = await mount(
      <SearchSelect items={items} onSelect={select} onQueryChange={change} isActive={false} />,
    );
    await app.key('a');
    await app.key('\r');
    expect(select).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
});

describe('Toggle', () => {
  it('toggles with Space/Enter and sets an explicit state with arrows', async () => {
    const change = vi.fn();
    const app = await mount(<Toggle label="Cache" onChange={change} />);
    expect(app.frame()).toContain('Cache: Off');
    await app.key(' ');
    expect(app.frame()).toContain('Cache: On');
    await app.key('\u001b[C'); // Already on: no duplicate notification.
    expect(change).toHaveBeenCalledOnce();
    await app.key('\u001b[D');
    await app.key('\r');
    expect(change.mock.calls).toEqual([[true], [false], [true]]);
  });

  it('supports controlled values, custom labels, and inactive previews', async () => {
    const change = vi.fn();
    const app = await mount(
      <Toggle
        label="Cache"
        value={false}
        onChange={change}
        onLabel="Enabled"
        offLabel="Disabled"
      />,
    );
    await app.key(' ');
    expect(change).toHaveBeenCalledWith(true);
    expect(app.frame()).toContain('Disabled');
    app.instance.rerender(<Toggle label="Cache" value onChange={change} isActive={false} />);
    await app.settle();
    await app.key(' ');
    expect(app.frame()).toContain('Cache: On');
    expect(change).toHaveBeenCalledOnce();
  });
});

describe('PaginatedList', () => {
  const getKey = (item: (typeof items)[number]) => item.value;
  const renderItem = (item: (typeof items)[number], index: number) => `${index}: ${item.label}`;

  it('pages without wrapping and gives renderItem the absolute index', async () => {
    const change = vi.fn();
    const app = await mount(
      <PaginatedList
        items={items}
        pageSize={2}
        getKey={getKey}
        renderItem={renderItem}
        onPageChange={change}
      />,
    );
    expect(app.frame()).toContain('Page 1/3');
    await app.key('\u001b[D');
    expect(change).not.toHaveBeenCalled();
    await app.key('\u001b[6~');
    expect(app.frame()).toContain('2: Gamma');
    expect(app.frame()).not.toContain('Alpha');
    await app.key('\u001b[F');
    expect(app.frame()).toContain('4: Epsilon');
    expect(app.frame()).toContain('5-5 of 5');
    await app.key('\u001b[C');
    expect(change.mock.calls).toEqual([[1], [2]]);
    await app.key('\u001b[5~');
    await app.key('\u001b[H');
    expect(app.frame()).toContain('Page 1/3');
  });

  it('keeps controlled page changes external and disables inactive keys', async () => {
    const change = vi.fn();
    const app = await mount(
      <PaginatedList
        items={items}
        pageSize={2}
        page={0}
        getKey={getKey}
        renderItem={renderItem}
        onPageChange={change}
      />,
    );
    await app.key('\u001b[C');
    expect(change).toHaveBeenCalledWith(1);
    expect(app.frame()).toContain('Page 1/3');
    app.instance.rerender(
      <PaginatedList
        items={items}
        pageSize={2}
        page={1}
        getKey={getKey}
        renderItem={renderItem}
        onPageChange={change}
        isActive={false}
      />,
    );
    await app.settle();
    await app.key('\u001b[C');
    expect(app.frame()).toContain('Page 2/3');
    expect(change).toHaveBeenCalledOnce();
  });

  it('clamps after data shrinks and handles empty/invalid sizes', async () => {
    const app = await mount(
      <PaginatedList
        items={items}
        pageSize={2}
        initialPage={100}
        getKey={getKey}
        renderItem={renderItem}
      />,
    );
    expect(app.frame()).toContain('Page 3/3');
    app.instance.rerender(
      <PaginatedList
        items={items.slice(0, 1)}
        pageSize={2}
        getKey={getKey}
        renderItem={renderItem}
      />,
    );
    await app.settle();
    expect(app.frame()).toContain('Page 1/1');
    app.instance.rerender(
      <PaginatedList items={[]} pageSize={0} getKey={getKey} renderItem={renderItem} />,
    );
    await app.settle();
    await app.key('\u001b[C');
    expect(app.frame()).toContain('No items.');
    for (const pageSize of [0, -5, NaN, Infinity]) {
      const out = renderToString(
        <PaginatedList items={items} pageSize={pageSize} getKey={getKey} renderItem={renderItem} />,
      );
      expect(out).toContain('Alpha');
      expect(out).not.toContain('NaN');
    }
  });
});

describe('gallery input ownership', () => {
  it('pauses global letter shortcuts during search and restores them on Escape', async () => {
    const app = await mount(
      <App options={{theme: 'mono', ascii: true, debug: false, screen: 'gallery'}} />,
    );
    await app.key('/');
    await expect.poll(() => app.frame()).toContain('SearchSelect');
    await expect.poll(() => app.frame()).toContain('leave search');
    await app.key('q');
    await app.key('t');
    await app.key('r');
    await app.key('1');
    await app.key('?');
    expect(app.frame()).toContain('Search: qtr1?');
    expect(app.frame()).toContain('SearchSelect');
    expect(app.frame()).toContain('leave search');
    await app.key('\u001b');
    await expect.poll(() => app.frame()).toContain('shortcuts restored');
    await app.key('o');
    await app.key(' ');
    expect(app.frame()).toContain('Enable caching: Off');
    await app.key('p');
    await app.key('\u001b[C');
    expect(app.frame()).toContain('Page 2/3');
    await app.key('w');
    expect(app.frame()).toContain('Setup wizard');
    await app.key('1');
    expect(app.frame()).toContain('Welcome');
    expect(app.frame()).not.toContain('Interactive components');
  });
});

describe('collection rendering', () => {
  for (const theme of themeNames)
    for (const columns of [40, 60, 120]) {
      it(`fits ${columns} columns with ${theme} theme`, () => {
        const components = [
          <MultiSelect items={items} maxVisible={2} isActive={false} />,
          <SearchSelect items={items} onSelect={() => {}} maxVisible={2} isActive={false} />,
          <Toggle label="Cache" isActive={false} />,
          <PaginatedList
            items={items}
            getKey={(i) => i.value}
            renderItem={(i) => <Text>{i.label}</Text>}
            pageSize={2}
            isActive={false}
          />,
        ];
        for (const component of components) {
          const out = renderToString(
            <ThemeProvider name={theme} ascii>
              {component}
            </ThemeProvider>,
            {columns},
          );
          for (const line of out.split('\n'))
            expect(stringWidth(line)).toBeLessThanOrEqual(columns);
          expect(out).not.toMatch(/[✔✖⚠ℹ❯█░─╭╮╰╯│○]/);
        }
      });
    }
});
