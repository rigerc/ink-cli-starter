import {Box, Text, useInput} from 'ink';
import {useState} from 'react';
import {
  Confirm,
  KeyValue,
  Muted,
  Select,
  Spinner,
  StatusMessage,
  Step,
  Stepper,
  StepperNavigation,
  useStepper,
} from '../components';

export type WizardResult = 'completed' | 'cancelled';

function TemplateStep({
  onSelect,
  isActive,
}: {
  onSelect: (value: string) => void;
  isActive: boolean;
}) {
  const {goNext, goBack} = useStepper();
  useInput(
    (_input, key) => {
      if (key.escape) void goBack();
    },
    {isActive},
  );

  return (
    <Box flexDirection="column">
      <Text>Choose an example layout</Text>
      <Select
        isActive={isActive}
        items={[
          {value: 'compact', label: 'Compact'},
          {value: 'detailed', label: 'Detailed'},
        ]}
        onSelect={(value) => {
          onSelect(value);
          void goNext();
        }}
      />
      <Muted>arrows choose / enter select / esc back</Muted>
    </Box>
  );
}

function ReviewStep({template, isActive}: {template: string; isActive: boolean}) {
  const {goNext, goBack, cancel, isValidating} = useStepper();
  useInput(
    (_input, key) => {
      if (key.escape) void goBack();
    },
    {isActive},
  );

  return (
    <Box flexDirection="column" gap={1}>
      <KeyValue
        items={[
          {label: 'Preview', value: 'Sample wizard'},
          {label: 'Layout', value: template},
        ]}
      />
      {isValidating ? (
        <Spinner label="Validating example" />
      ) : (
        <Confirm
          isActive={isActive}
          message="Finish the sample wizard?"
          defaultValue
          onConfirm={(yes) => {
            if (yes) void goNext();
            else cancel();
          }}
        />
      )}
      <Muted>esc back / no cancels / preview only</Muted>
    </Box>
  );
}

/** Standalone example of reusable wizard controls and step navigation. */
export function SetupWizard({
  onFinish,
  isActive = true,
}: {
  onFinish?: (result: WizardResult) => void;
  isActive?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [template, setTemplate] = useState('compact');
  const [result, setResult] = useState<WizardResult>();

  const finish = (next: WizardResult) => {
    setResult(next);
    onFinish?.(next);
  };

  if (result)
    return (
      <StatusMessage tone={result === 'completed' ? 'success' : 'warn'}>
        {result === 'completed'
          ? `Example complete: ${template}. No files were changed.`
          : 'Example cancelled. No files were changed.'}
      </StatusMessage>
    );

  return (
    <Stepper
      keyboardNav={isActive && current === 0}
      onStepChange={setCurrent}
      onComplete={() => finish('completed')}
      onCancel={() => finish('cancelled')}
    >
      <Step name="Welcome">
        <Box flexDirection="column" gap={1}>
          <Text>Explore a three-step wizard.</Text>
          <Muted>This wizard stays in normal terminal scrollback.</Muted>
          <StepperNavigation />
        </Box>
      </Step>
      <Step name="Layout">
        <TemplateStep isActive={isActive} onSelect={setTemplate} />
      </Step>
      <Step
        name="Review"
        canProceed={() => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 500))}
      >
        <ReviewStep isActive={isActive} template={template} />
      </Step>
    </Stepper>
  );
}
