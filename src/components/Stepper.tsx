import {Box, Text} from 'ink';
import {useManagedInput} from '../hooks/useKeymap';
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {toErrorMessage} from '../lib/errors';
import {useTheme} from '../theme/context';
import {StatusMessage} from './Status';
import {Kbd, Muted} from './typography';

/** API inspired by https://github.com/archcorsair/ink-stepper (MIT). */
export interface StepContext {
  currentStep: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  isValidating: boolean;
  goNext: () => Promise<void>;
  goBack: () => Promise<void>;
  /** Raw jump: skips canProceed, but still calls onExitStep. */
  goTo: (index: number) => Promise<void>;
  cancel: () => void;
}

export interface StepProps {
  name: string;
  canProceed?: boolean | (() => boolean | Promise<boolean>);
  children: ReactNode | ((context: StepContext) => ReactNode);
}

/** Declarative marker. Only the current Step's content is mounted by Stepper. */
export function Step(_props: StepProps) {
  return null;
}

export interface StepperProps {
  /** Direct Step children or fragments of Steps; use keys for conditional steps. */
  children: ReactNode;
  onComplete: () => void;
  onCancel?: () => void;
  onStepChange?: (index: number) => void;
  onExitStep?: (index: number) => void | boolean | Promise<void | boolean>;
  onEnterStep?: (index: number) => void;
  onError?: (cause: unknown) => void;
  step?: number;
  initialStep?: number;
  keyboardNav?: boolean;
  showProgress?: boolean;
  renderProgress?: (context: StepperProgressProps) => ReactNode;
}

export interface StepperProgressProps {
  steps: readonly {id: string; name: string}[];
  /** Zero-based; steps.length marks every step completed. */
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
}

/** Wrapping labels keep progress usable in narrow terminals. */
export function StepperProgress({
  steps,
  currentStep,
  orientation = 'horizontal',
}: StepperProgressProps) {
  const t = useTheme();

  return (
    <Box
      flexDirection={orientation === 'vertical' ? 'column' : 'row'}
      flexWrap="wrap"
      columnGap={2}
    >
      {steps.map((item, index) => {
        const complete = index < currentStep;
        const current = index === currentStep;

        return (
          <Text
            key={item.id}
            bold={current}
            color={t.color[complete ? 'success' : current ? 'primary' : 'muted']}
            dimColor={t.mono && !current}
          >
            {complete ? t.symbols.success : current ? t.symbols.pointer : t.symbols.pending}{' '}
            {index + 1}. {item.name}
          </Text>
        );
      })}
    </Box>
  );
}

const Context = createContext<StepContext | null>(null);

export function useStepper(): StepContext {
  const context = useContext(Context);

  if (!context) throw new Error('useStepper must be used inside Stepper');

  return context;
}

/** Optional hints; disable keyboardNav when a child input owns Enter/Escape. */
export function StepperNavigation() {
  const {isFirst, isLast, isValidating} = useStepper();

  if (isValidating) return <Muted>Validating...</Muted>;

  return (
    <Box columnGap={2} flexWrap="wrap">
      <Text>
        <Kbd>enter</Kbd> {isLast ? 'finish' : 'next'}
      </Text>
      <Text>
        <Kbd>esc</Kbd> {isFirst ? 'cancel' : 'back'}
      </Text>
    </Box>
  );
}

function collectSteps(
  children: ReactNode,
  prefix = '',
): {id: string; element: ReactElement<StepProps>}[] {
  return Children.toArray(children).flatMap((child, index) => {
    if (!isValidElement<StepProps>(child))
      throw new Error('Stepper children must be Step elements or fragments');
    const id = `${prefix}/${child.key ?? index}`;

    if (child.type === Fragment) {
      // SAFETY: React fragments contain child nodes, never render callbacks.
      return collectSteps(child.props.children as ReactNode, id);
    }

    if (child.type !== Step) throw new Error('Stepper children must be Step elements or fragments');

    return [{id, element: child}];
  });
}

function clamp(index: number, length: number) {
  return Math.max(0, Math.min(Number.isFinite(index) ? Math.trunc(index) : 0, length - 1));
}

export function Stepper({
  children,
  onComplete,
  onCancel,
  onStepChange,
  onExitStep,
  onEnterStep,
  onError,
  step,
  initialStep = 0,
  keyboardNav = true,
  showProgress = true,
  renderProgress,
}: StepperProps) {
  const steps = collectSteps(children);

  const [position, setPosition] = useState<{index: number; id: string | null}>({
    index: initialStep,
    id: null,
  });

  const identityIndex = position.id === null ? -1 : steps.findIndex((s) => s.id === position.id);

  const currentStep = clamp(
    step ?? (identityIndex < 0 ? position.index : identityIndex),
    steps.length,
  );

  const active = steps[currentStep];
  const [isValidating, setValidating] = useState(false);
  const [error, setError] = useState<string>();
  const [finished, setFinished] = useState(false);
  const locked = useRef(false);
  const ended = useRef(false);
  const mounted = useRef(true);

  // Invalidate an in-flight transition if its source step changes or disappears.
  const source = useRef({
    id: active?.id,
    index: currentStep,
    steps: steps.map((s) => s.id).join('|'),
  });

  source.current = {id: active?.id, index: currentStep, steps: steps.map((s) => s.id).join('|')};
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (step === undefined && active)
      setPosition((p) =>
        p.id === active.id && p.index === currentStep ? p : {id: active.id, index: currentStep},
      );
  }, [active?.id, currentStep, step]);

  const cancel = () => {
    if (ended.current || locked.current || !active) return;
    ended.current = true;
    setFinished(true);
    onCancel?.();
  };

  const navigate = async (direction: 'next' | 'back' | number) => {
    if (locked.current || ended.current || !active) return;

    const target =
      direction === 'next'
        ? currentStep + 1
        : direction === 'back'
          ? currentStep - 1
          : clamp(direction, steps.length);

    if (target === currentStep) return;
    locked.current = true;
    setValidating(true);
    setError(undefined);
    const origin = source.current;

    const stillCurrent = () =>
      mounted.current &&
      source.current.id === origin.id &&
      source.current.index === origin.index &&
      source.current.steps === origin.steps;

    try {
      // Yield once so repeated calls in the same event share the synchronous lock.
      await Promise.resolve();

      if (!stillCurrent()) return;
      const guard = active.element.props.canProceed ?? true;

      if (direction === 'next' && !(guard instanceof Function ? await guard() : guard)) return;

      if (!stillCurrent()) return;

      if (onExitStep && (await onExitStep(currentStep)) === false) return;

      if (!stillCurrent()) return;

      if (target < 0 || target >= steps.length) {
        ended.current = true;
        setFinished(true);

        if (target < 0) onCancel?.();
        else onComplete();
      } else {
        if (step === undefined) setPosition({index: target, id: steps[target]!.id});
        onStepChange?.(target);
        onEnterStep?.(target);
      }
    } catch (cause) {
      if (stillCurrent()) {
        setError(toErrorMessage(cause));
        onError?.(cause);
      }
    } finally {
      if (mounted.current) setValidating(false);
      locked.current = false;
    }
  };

  const context: StepContext = {
    currentStep,
    totalSteps: steps.length,
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
    isValidating,
    goNext: () => navigate('next'),
    goBack: () => navigate('back'),
    goTo: (i) => navigate(i),
    cancel,
  };

  useManagedInput(
    (_input, key) => {
      if (key.return) {
        void context.goNext();
        return true;
      }

      if (key.escape) {
        void context.goBack();
        return true;
      }

      return false;
    },
    {isActive: keyboardNav && !finished && steps.length > 0, scope: 'control'},
  );

  if (!active) return null;
  const progress = {steps: steps.map((s) => ({id: s.id, name: s.element.props.name})), currentStep};
  const content = active.element.props.children;

  return (
    <Context.Provider value={context}>
      <Box flexDirection="column" gap={1}>
        {showProgress &&
          (renderProgress ? renderProgress(progress) : <StepperProgress {...progress} />)}
        <Box key={active.id} flexDirection="column">
          {content instanceof Function ? content(context) : content}
        </Box>
        {error && <StatusMessage tone="danger">{error}</StatusMessage>}
      </Box>
    </Context.Provider>
  );
}
