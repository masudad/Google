import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getMessages } from "../i18n/messages";
import { AppShell } from "./AppShell";

describe("AppShell runtime capabilities", () => {
  it("shows and routes the extension-only Easy PoC entry when enabled", () => {
    const onNavigate = vi.fn();

    render(
      <AppShell
        activeView="setup"
        cloudProject="project-1"
        locale="en"
        messages={getMessages("en")}
        onLocaleChange={vi.fn()}
        onNavigate={onNavigate}
        onSignOut={vi.fn()}
        showCepDeployer
        workspaceAdmin="admin@example.com"
      >
        <main>content</main>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Easy PoC" }));

    expect(onNavigate).toHaveBeenCalledWith("cepDeployer");
  });

  it("always shows the local-only CERA entry, even without the Easy PoC capability", () => {
    const onNavigate = vi.fn();

    render(
      <AppShell
        activeView="guide"
        cloudProject=""
        locale="ja"
        messages={getMessages("ja")}
        onLocaleChange={vi.fn()}
        onNavigate={onNavigate}
        onSignOut={vi.fn()}
        showCepDeployer={false}
        workspaceAdmin=""
      >
        <main>content</main>
      </AppShell>,
    );

    expect(screen.queryByRole("button", { name: "Easy PoC" })).not.toBeInTheDocument();
    const ceraButton = screen.getByRole("button", { name: "CERA" });
    expect(ceraButton).not.toHaveAttribute("aria-current");
    fireEvent.click(ceraButton);

    expect(onNavigate).toHaveBeenCalledWith("cera");
  });
});
