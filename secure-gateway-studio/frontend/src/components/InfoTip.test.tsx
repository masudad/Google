import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InfoTip } from "./InfoTip";

function renderTip() {
  render(
    <h2>
      Certificate strategy
      <InfoTip label="About the certificate strategy">
        Local PoC CA needs no inputs.
      </InfoTip>
    </h2>,
  );
  const trigger = screen.getByRole("button", { name: "About the certificate strategy" });
  const root = trigger.parentElement as HTMLElement;
  return { trigger, root };
}

describe("InfoTip", () => {
  it("renders a real button that owns and describes its explanation", () => {
    const { trigger } = renderTip();
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(trigger).toHaveAttribute("aria-describedby", panelId as string);
    const panel = document.getElementById(panelId as string) as HTMLElement;
    expect(panel).toHaveAttribute("role", "tooltip");
    expect(panel).toHaveTextContent("Local PoC CA needs no inputs.");
  });

  it("pins the panel open on click and closes it on a second click", () => {
    const { trigger, root } = renderTip();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(root.classList.contains("is-open")).toBe(true);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(root.classList.contains("is-open")).toBe(false);
  });

  it("closes a pinned panel when the user clicks elsewhere", () => {
    const { trigger, root } = renderTip();
    fireEvent.click(trigger);
    expect(root.classList.contains("is-open")).toBe(true);
    fireEvent.pointerDown(document.body);
    expect(root.classList.contains("is-open")).toBe(false);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a pinned panel open when the click lands inside the panel", () => {
    const { trigger, root } = renderTip();
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("tooltip"));
    expect(root.classList.contains("is-open")).toBe(true);
  });

  it("dismisses on Escape and recovers once the pointer or focus leaves", () => {
    const { trigger, root } = renderTip();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(root.classList.contains("is-dismissed")).toBe(true);
    fireEvent.mouseLeave(root);
    expect(root.classList.contains("is-dismissed")).toBe(false);

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(root.classList.contains("is-dismissed")).toBe(true);
    fireEvent.blur(trigger);
    expect(root.classList.contains("is-dismissed")).toBe(false);
  });
});
