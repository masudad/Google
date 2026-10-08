import type { ReactNode } from "react";
import { ArrowRightIcon } from "../../components/Icons";
import type { Messages } from "../../i18n/messages";
import type { SetupState } from "../../lib/setup-state";
import { formatTime } from "../../lib/format";
import { PostureSummary } from "./PostureSummary";
import { Stepper } from "./Stepper";

interface WizardLayoutProps {
  activeStep: number;
  children: ReactNode;
  messages: Messages;
  nextDisabled?: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  state: SetupState;
}

export function WizardLayout({
  activeStep,
  children,
  messages,
  nextDisabled = false,
  nextLabel,
  onBack,
  onNext,
  state,
}: WizardLayoutProps) {
  const stepperIndex =
    activeStep >= 6 ? 3 : activeStep === 5 ? 2 : activeStep === 4 ? 1 : 0;
  return (
    <>
      <main className="workspace">
        <div className="wizard-main">
          <h1>{messages.title}</h1>
          <Stepper activeStep={stepperIndex} steps={messages.steps} />
          <div className="step-content">{children}</div>
          <div className="wizard-actions">
            <button
              className="secondary-action"
              disabled={stepperIndex === 0}
              onClick={onBack}
              type="button"
            >
              <span aria-hidden="true">←</span>
              {stepperIndex === 0 ? messages.back : messages.workflow.previous}
            </button>
            <button
              className="primary-action"
              disabled={nextDisabled}
              onClick={onNext}
              type="button"
            >
              {nextLabel ?? messages.workflow.next}
              <ArrowRightIcon size={19} />
            </button>
          </div>
        </div>
        <PostureSummary messages={messages} state={state} />
      </main>
      <footer className="statusbar">
        <span>
          <i className="status-dot" />
          {messages.noChanges}
        </span>
        <span>{messages.draftSaved}</span>
        <span>
          {messages.lastSaved}:{" "}
          {Date.parse(state.updatedAt) > 0
            ? formatTime(state.updatedAt)
            : messages.justNow}
        </span>
      </footer>
    </>
  );
}
