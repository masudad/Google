import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMessages } from "../i18n/messages";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb({ explode }: { explode: boolean }) {
  if (explode) {
    throw new TypeError("spec.platforms is not iterable");
  }
  return <p>Healthy content</p>;
}

function Harness({ initialExplode = true }: { initialExplode?: boolean }) {
  const [explode, setExplode] = useState(initialExplode);
  const [view, setView] = useState("a");
  return (
    <>
      <button onClick={() => setExplode(false)} type="button">
        defuse
      </button>
      <button onClick={() => setView("b")} type="button">
        switch view
      </button>
      <ErrorBoundary copy={getMessages("en").errorBoundary} resetKey={view}>
        <Bomb explode={explode} />
      </ErrorBoundary>
    </>
  );
}

describe("ErrorBoundary", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary copy={getMessages("en").errorBoundary}>
        <p>Healthy content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Healthy content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the localised fallback with the technical detail instead of unmounting", () => {
    render(
      <ErrorBoundary copy={getMessages("ja").errorBoundary}>
        <Bomb explode />
      </ErrorBoundary>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("この画面を表示できませんでした");
    expect(alert).toHaveTextContent("保存済みの下書きやデプロイ記録には影響しません");
    expect(screen.getByText("技術的な詳細")).toBeInTheDocument();
    expect(alert).toHaveTextContent("TypeError: spec.platforms is not iterable");
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再読み込み" })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it("recovers through retry once the cause is gone", () => {
    render(<Harness />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "defuse" }));
    // Still showing the fallback: retry is an explicit operator action.
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Healthy content")).toBeInTheDocument();
  });

  it("forgets the error when the reset key changes", () => {
    render(<Harness />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "defuse" }));
    fireEvent.click(screen.getByRole("button", { name: "switch view" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Healthy content")).toBeInTheDocument();
  });

  it("offers the secondary action and reloads on request", () => {
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload },
    });
    const onBack = vi.fn();
    try {
      render(
        <ErrorBoundary
          compact
          copy={getMessages("en").errorBoundary}
          secondaryAction={{ label: "Back to deployments", onClick: onBack }}
        >
          <Bomb explode />
        </ErrorBoundary>,
      );
      expect(screen.getByRole("alert")).toHaveClass("error-boundary-compact");
      fireEvent.click(screen.getByRole("button", { name: "Back to deployments" }));
      expect(onBack).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole("button", { name: "Reload" }));
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
