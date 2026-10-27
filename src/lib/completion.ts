import type {CommandUnknownOpts, Option} from '@commander-js/extra-typings';

export type CompletionShell = 'bash' | 'zsh' | 'fish';
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
interface CompletionNode {
  path: string;
  command: CommandUnknownOpts;
  options: readonly Option[];
}
function collect(
  command: CommandUnknownOpts,
  path = '',
  inherited: readonly Option[] = [],
): CompletionNode[] {
  const options = [...inherited, ...command.options];
  return [
    {path, command, options},
    ...command.commands.flatMap((child) =>
      collect(child, `${path} ${child.name()}`.trim(), options),
    ),
  ];
}
const flagsOf = (option: Option) =>
  [option.short, option.long].filter((value): value is string => Boolean(value));

/** Completion metadata comes entirely from the registered Commander tree. */
export function generateCompletion(program: CommandUnknownOpts, shell: CompletionShell): string {
  const nodes = collect(program);
  const executable = program.name();
  const functionName = `_${executable.replaceAll(/[^a-zA-Z0-9_]/g, '_')}_completion`;
  const transitions = nodes
    .flatMap((node) => [
      ...node.command.commands.map(
        (child) =>
          `${quote(`${node.path}:${child.name()}`)}) path=${quote(`${node.path} ${child.name()}`.trim())} ;;`,
      ),
      ...node.options
        .filter((option) => option.required || option.optional)
        .flatMap((option) =>
          flagsOf(option).map((flag) => `${quote(`${node.path}:${flag}`)}) expecting=1 ;;`),
        ),
    ])
    .join('\n      ');
  const candidates = nodes
    .map(
      (node) =>
        `${quote(node.path)}) candidates=${quote([...node.command.commands.map((child) => child.name()), ...(node.command.registeredArguments[0]?.argChoices ?? []), ...node.options.flatMap(flagsOf), '--help'].join(' '))} ;;`,
    )
    .join('\n    ');
  const choices = nodes
    .flatMap((node) =>
      node.options
        .filter((option) => option.argChoices)
        .flatMap((option) =>
          flagsOf(option).map(
            (flag) =>
              `${quote(`${node.path}:${flag}`)}) ${shell === 'bash' ? `COMPREPLY=( $(compgen -W ${quote(option.argChoices!.join(' '))} -- "$cur") ); return` : `compadd -- ${option.argChoices!.map(quote).join(' ')}; return`} ;;`,
          ),
        ),
    )
    .join('\n    ');
  if (shell === 'bash')
    return `# Generated from ${executable}'s Commander tree.
${functionName}() {
  local cur prev path='' word candidates='' expecting=0 i
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  for ((i=1; i<COMP_CWORD; i++)); do
    word="\${COMP_WORDS[i]}"
    if ((expecting)); then expecting=0; continue; fi
    case "$path:$word" in
      ${transitions}
    esac
  done
  case "$path:$prev" in
    ${choices}
    *:--config) COMPREPLY=( $(compgen -f -- "$cur") ); return ;;
  esac
  case "$path" in
    ${candidates}
  esac
  COMPREPLY=( $(compgen -W "$candidates" -- "$cur") )
}
complete -F ${functionName} -- ${quote(executable)}
`;
  if (shell === 'zsh')
    return `#compdef ${executable}
${functionName}() {
  local path='' word candidates='' expecting=0 i prev
  prev="\${words[CURRENT-1]}"
  for ((i=2; i<CURRENT; i++)); do
    word="\${words[i]}"
    if ((expecting)); then expecting=0; continue; fi
    case "$path:$word" in
      ${transitions}
    esac
  done
  case "$path:$prev" in
    ${choices}
    *:--config) _files; return ;;
  esac
  case "$path" in
    ${candidates}
  esac
  compadd -- \${=candidates}
}
compdef ${functionName} ${quote(executable)}
`;
  const fishTransitions = nodes
    .flatMap((node) => [
      ...node.command.commands.map(
        (child) =>
          `case ${quote(`${node.path}:${child.name()}`)}\n        set path ${quote(`${node.path} ${child.name()}`.trim())}`,
      ),
      ...node.options
        .filter((option) => option.required || option.optional)
        .flatMap((option) =>
          flagsOf(option).map(
            (flag) => `case ${quote(`${node.path}:${flag}`)}\n        set expecting 1`,
          ),
        ),
    ])
    .join('\n      ');
  const fishEntries = nodes
    .flatMap((node) => {
      const base = `complete -c ${quote(executable)} -n ${quote(`${functionName} ${quote(node.path)}`)}`;
      return [
        ...node.command.commands.map(
          (child) => `${base} -a ${quote(child.name())} -d ${quote(child.description())}`,
        ),
        ...(node.command.registeredArguments[0]?.argChoices ?? []).map(
          (choice) => `${base} -a ${quote(choice)}`,
        ),
        ...node.options.map(
          (option) =>
            `${base}${option.short ? ` -s ${quote(option.short.slice(1))}` : ''}${option.long ? ` -l ${quote(option.long.slice(2))}` : ''}${option.required || option.optional ? ' -r' : ''}${option.argChoices ? ` -a ${quote(option.argChoices.join(' '))}` : ''}${option.long === '--config' ? ' -F' : ''} -d ${quote(option.description)}`,
        ),
        `${base} -l help -d 'Show help'`,
      ];
    })
    .join('\n');
  return `# Generated from ${executable}'s Commander tree.
function ${functionName}
  set -l path ''
  set -l expecting 0
  set -l words (commandline -opc)
  for word in $words[2..-1]
    if test $expecting -eq 1
      set expecting 0
      continue
    end
    switch "$path:$word"
      ${fishTransitions}
    end
  end
  test "$path" = "$argv[1]"
end
complete -c ${quote(executable)} -f
${fishEntries}
`;
}
