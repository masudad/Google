import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ConnectionStatus, Locale } from "../lib/setup-state";
import type { Messages } from "../i18n/messages";
import type { OperationsView } from "../features/operations/OperationsPage";
import {
  BookIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CubeIcon,
  DocumentIcon,
  HelpIcon,
  KeyIcon,
  LockIcon,
  PlusCircleIcon,
  ShieldIcon,
  ShieldNetworkIcon,
  SignOutIcon,
} from "./Icons";
import { LanguageMenu } from "./LanguageMenu";

export type AppView = "setup" | OperationsView | "guide" | "cepDeployer";

interface AppShellProps {
  children: ReactNode;
  locale: Locale;
  messages: Messages;
  activeView: AppView;
  cloudProject: string;
  workspaceAdmin: string;
  cloudStatus?: ConnectionStatus;
  cloudIdentityDetail?: string;
  cloudError?: string;
  workspaceStatus?: ConnectionStatus;
  customerId?: string;
  workspaceError?: string;
  onProjectIdChange?: (projectId: string) => void;
  onCustomerIdChange?: (customerId: string) => void;
  onValidateCloud?: () => Promise<void>;
  onBootstrapCloud?: () => Promise<void>;
  onSwitchCloudAccount?: () => Promise<void>;
  onSignInWorkspace?: () => Promise<void>;
  onSwitchWorkspaceAccount?: () => Promise<void>;
  onLocaleChange: (locale: Locale) => void;
  onNavigate: (view: AppView) => void;
  onSignOut: () => void;
  showCepDeployer: boolean;
}

export function AppShell({
  children,
  locale,
  messages,
  activeView,
  cloudProject,
  workspaceAdmin,
  cloudStatus = "not_connected",
  cloudIdentityDetail = "",
  cloudError = "",
  workspaceStatus = "not_connected",
  customerId = "",
  workspaceError = "",
  onProjectIdChange,
  onCustomerIdChange,
  onValidateCloud,
  onBootstrapCloud,
  onSwitchCloudAccount,
  onSignInWorkspace,
  onSwitchWorkspaceAccount,
  onLocaleChange,
  onNavigate,
  onSignOut,
  showCepDeployer,
}: AppShellProps) {
  const isSgwActive =
    activeView === "setup" ||
    activeView === "deployments" ||
    activeView === "evidence";

  const [sgwMenuOpen, setSgwMenuOpen] = useState(true);
  const showSgwSubmenu = isSgwActive || sgwMenuOpen;

  const [openPopover, setOpenPopover] = useState<"cloud" | "workspace" | null>(null);
  const [cloudBootstrapBusy, setCloudBootstrapBusy] = useState(false);
  const [cloudSwitchBusy, setCloudSwitchBusy] = useState(false);
  const [workspaceAuthBusy, setWorkspaceAuthBusy] = useState(false);
  const [workspaceSwitchBusy, setWorkspaceSwitchBusy] = useState(false);
  const cloudMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        openPopover === "cloud" &&
        !cloudMenuRef.current?.contains(target)
      ) {
        setOpenPopover(null);
      } else if (
        openPopover === "workspace" &&
        !workspaceMenuRef.current?.contains(target)
      ) {
        setOpenPopover(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openPopover]);

  const sgwSubItems: Array<{
    label: string;
    view: AppView;
    icon: typeof CubeIcon;
  }> = [
    { label: messages.nav.deployments, view: "deployments", icon: CubeIcon },
    { label: messages.nav.newSetup, view: "setup", icon: PlusCircleIcon },
    { label: messages.nav.evidence, view: "evidence", icon: DocumentIcon },
  ];

  const handleToggleSgw = () => {
    if (!isSgwActive) {
      setSgwMenuOpen(true);
      onNavigate("setup");
    } else {
      setSgwMenuOpen((open) => !open);
    }
  };

  const canonicalCustomerId = /^C[A-Za-z0-9]+$/.test(customerId.trim())
    ? customerId.trim()
    : "";
  const isWorkspaceConnected =
    workspaceStatus === "connected" || canonicalCustomerId !== "" || Boolean(workspaceAdmin);
  const isCloudConnected = cloudStatus === "connected";

  const handleTopbarWorkspaceSignIn = async () => {
    if (!onSignInWorkspace || workspaceAuthBusy || workspaceSwitchBusy) return;
    setWorkspaceAuthBusy(true);
    try {
      await onSignInWorkspace();
    } finally {
      setWorkspaceAuthBusy(false);
    }
  };

  const handleTopbarWorkspaceSwitchAccount = async () => {
    if (!onSwitchWorkspaceAccount || workspaceSwitchBusy || workspaceAuthBusy) return;
    setWorkspaceSwitchBusy(true);
    try {
      await onSwitchWorkspaceAccount();
    } finally {
      setWorkspaceSwitchBusy(false);
    }
  };

  const handleTopbarCloudBootstrap = async () => {
    if (!onBootstrapCloud || cloudBootstrapBusy || cloudSwitchBusy) return;
    setCloudBootstrapBusy(true);
    try {
      await onBootstrapCloud();
    } finally {
      setCloudBootstrapBusy(false);
    }
  };

  const handleTopbarCloudSwitchAccount = async () => {
    if (!onSwitchCloudAccount || cloudSwitchBusy || cloudBootstrapBusy) return;
    setCloudSwitchBusy(true);
    try {
      await onSwitchCloudAccount();
    } finally {
      setCloudSwitchBusy(false);
    }
  };

  const t = messages.topbarAuth;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark" aria-label={messages.productName}>
          <ShieldNetworkIcon size={44} />
        </div>
        <nav aria-label="Primary navigation" className="primary-nav">
          {/* 1. Guide (Top-level dedicated documentation tab) */}
          <button
            aria-label={messages.nav.guide}
            aria-current={activeView === "guide" ? "page" : undefined}
            className={activeView === "guide" ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate("guide")}
            type="button"
          >
            <BookIcon size={24} />
            <span>{messages.nav.guide}</span>
          </button>

          {/* 2. Easy PoC */}
          {showCepDeployer && (
            <button
              aria-label={messages.nav.easyPoc}
              aria-current={activeView === "cepDeployer" ? "page" : undefined}
              className={activeView === "cepDeployer" ? "nav-item active" : "nav-item"}
              onClick={() => onNavigate("cepDeployer")}
              type="button"
            >
              <ShieldNetworkIcon size={24} />
              <span>{messages.nav.easyPoc}</span>
            </button>
          )}

          {/* 3. Secure Gateway Deployer (Collapsible dropdown parent) */}
          <div className={`nav-dropdown-group ${isSgwActive ? "active-parent" : ""} ${showSgwSubmenu ? "open" : ""}`}>
            <button
              aria-label={messages.nav.sgwDeployer}
              aria-expanded={showSgwSubmenu}
              className={`nav-item nav-dropdown-trigger ${isSgwActive ? "active" : ""}`}
              onClick={handleToggleSgw}
              type="button"
            >
              <CubeIcon size={24} />
              <div className="nav-label-with-arrow">
                <span>{messages.nav.sgwDeployer}</span>
                {showSgwSubmenu ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
              </div>
            </button>

            {/* Submenu containing the 3 SGW tabs */}
            {showSgwSubmenu && (
              <div className="nav-submenu">
                {sgwSubItems.map((item) => {
                  const SubIcon = item.icon;
                  const active = activeView === item.view;
                  return (
                    <button
                      aria-current={active ? "page" : undefined}
                      className={`nav-subitem ${active ? "active" : ""}`}
                      key={item.view}
                      onClick={() => {
                        setSgwMenuOpen(true);
                        onNavigate(item.view);
                      }}
                      type="button"
                    >
                      <SubIcon size={15} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item sidebar-sign-out"
            onClick={onSignOut}
            title={messages.signOut}
            type="button"
          >
            <SignOutIcon size={22} />
            <span>{messages.signOut}</span>
          </button>
        </div>
      </aside>

      <div className="app-frame">
        <header className="topbar">
          <div className="product-title">
            <div className="product-title-headings">
              <strong className="product-main-title">{messages.mainTitle}</strong>
              <span className="product-sub-title">{messages.productName}</span>
            </div>
            <span className="local-status">
              <LockIcon size={16} />
              {messages.localOnly}
            </span>
          </div>
          <div className="header-actions">
            {/* Google Cloud Trigger & Popover */}
            <div className="identity-menu" ref={cloudMenuRef}>
              <button
                aria-expanded={openPopover === "cloud"}
                aria-haspopup="dialog"
                className={`identity-control identity-control-btn ${isCloudConnected ? "connected" : ""} ${openPopover === "cloud" ? "open" : ""}`}
                onClick={() => setOpenPopover((curr) => (curr === "cloud" ? null : "cloud"))}
                type="button"
              >
                <span aria-hidden="true" className="google-cloud-symbol">
                  G
                </span>
                <span className="identity-copy">
                  <span className="identity-copy-label">
                    <span
                      className={`identity-status-dot ${isCloudConnected ? "connected" : cloudProject.trim() ? "configured" : "idle"}`}
                    />
                    {messages.cloudIdentity}
                  </span>
                  <strong>{cloudProject || messages.cloudProject}</strong>
                </span>
                <ChevronDownIcon className={openPopover === "cloud" ? "rotated" : ""} size={16} />
              </button>

              {openPopover === "cloud" && (
                <div
                  aria-label={t.cloudPopoverTitle}
                  className="identity-popover"
                  role="dialog"
                >
                  <div className="identity-popover-header">
                    <strong>{t.cloudPopoverTitle}</strong>
                    <p>{t.cloudPopoverDesc}</p>
                  </div>

                  <div className="identity-popover-field">
                    <label htmlFor="topbar-cloud-project-id">{t.cloudProjectIdLabel}</label>
                    <input
                      autoComplete="off"
                      disabled={cloudBootstrapBusy}
                      id="topbar-cloud-project-id"
                      onChange={(e) => onProjectIdChange?.(e.target.value)}
                      placeholder={t.cloudProjectIdPlaceholder}
                      spellCheck={false}
                      type="text"
                      value={cloudProject}
                    />
                  </div>

                  {cloudIdentityDetail && (
                    <div className="identity-popover-status">
                      <CheckCircleIcon size={15} />
                      <div>
                        <small>{t.cloudOperatorLabel}</small>
                        <code>{cloudIdentityDetail}</code>
                      </div>
                    </div>
                  )}

                  {cloudError && (
                    <p className="identity-popover-error" role="alert">
                      {cloudError}
                    </p>
                  )}

                  <div className="identity-popover-actions">
                    <button
                      className="btn btn-primary btn-block"
                      disabled={!cloudProject.trim() || cloudStatus === "checking" || cloudBootstrapBusy || cloudSwitchBusy}
                      onClick={() => void onValidateCloud?.()}
                      type="button"
                    >
                      {cloudStatus === "checking" ? t.cloudVerifyingBtn : t.cloudVerifyBtn}
                    </button>
                    <button
                      className="btn btn-secondary btn-block"
                      disabled={!cloudProject.trim() || cloudBootstrapBusy || cloudSwitchBusy || cloudStatus === "checking"}
                      onClick={() => void handleTopbarCloudBootstrap()}
                      type="button"
                    >
                      <ShieldIcon size={15} />
                      <span>
                        {cloudBootstrapBusy ? t.cloudBootstrappingBtn : t.cloudBootstrapBtn}
                      </span>
                    </button>
                    {onSwitchCloudAccount && (
                      <button
                        className="btn btn-secondary btn-block"
                        disabled={cloudBootstrapBusy || cloudSwitchBusy || cloudStatus === "checking"}
                        onClick={() => void handleTopbarCloudSwitchAccount()}
                        type="button"
                      >
                        <KeyIcon size={15} />
                        <span>
                          {cloudSwitchBusy ? t.cloudSwitchingAccountBtn : t.cloudSwitchAccountBtn}
                        </span>
                      </button>
                    )}
                  </div>

                  <p className="identity-popover-note">{t.cloudSharedNote}</p>
                  <p className="identity-popover-note">{t.dualAccountHint}</p>
                </div>
              )}
            </div>

            {/* Google Workspace Trigger & Popover */}
            <div className="identity-menu" ref={workspaceMenuRef}>
              <button
                aria-expanded={openPopover === "workspace"}
                aria-haspopup="dialog"
                className={`identity-control identity-control-btn ${isWorkspaceConnected ? "connected" : ""} ${openPopover === "workspace" ? "open" : ""}`}
                onClick={() =>
                  setOpenPopover((curr) => (curr === "workspace" ? null : "workspace"))
                }
                type="button"
              >
                <span aria-hidden="true" className="workspace-symbol">
                  A
                </span>
                <span className="identity-copy">
                  <span className="identity-copy-label">
                    <span
                      className={`identity-status-dot ${isWorkspaceConnected ? "connected" : "idle"}`}
                    />
                    {messages.workspaceIdentity}
                  </span>
                  <strong>
                    {workspaceAdmin || canonicalCustomerId || messages.adminEmail}
                  </strong>
                </span>
                <ChevronDownIcon
                  className={openPopover === "workspace" ? "rotated" : ""}
                  size={16}
                />
              </button>

              {openPopover === "workspace" && (
                <div
                  aria-label={t.workspacePopoverTitle}
                  className="identity-popover"
                  role="dialog"
                >
                  <div className="identity-popover-header">
                    <strong>{t.workspacePopoverTitle}</strong>
                    <p>{t.workspacePopoverDesc}</p>
                  </div>

                  {isWorkspaceConnected && (
                    <div className="identity-popover-status">
                      <CheckCircleIcon size={15} />
                      <div>
                        {workspaceAdmin && (
                          <>
                            <small>{t.workspaceAdminLabel}</small>
                            <strong>{workspaceAdmin}</strong>
                          </>
                        )}
                        {canonicalCustomerId && (
                          <code>
                            {t.workspaceCustomerIdLabel}: {canonicalCustomerId}
                          </code>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="identity-popover-actions">
                    <button
                      className="btn btn-primary btn-block"
                      disabled={workspaceAuthBusy || workspaceSwitchBusy || workspaceStatus === "checking"}
                      onClick={() => void handleTopbarWorkspaceSignIn()}
                      type="button"
                    >
                      <KeyIcon size={15} />
                      <span>
                        {workspaceAuthBusy || workspaceStatus === "checking"
                          ? t.workspaceSigningInBtn
                          : isWorkspaceConnected
                            ? t.workspaceReverifyBtn
                            : t.workspaceSignInBtn}
                      </span>
                    </button>
                    {onSwitchWorkspaceAccount && (
                      <button
                        className="btn btn-secondary btn-block"
                        disabled={workspaceAuthBusy || workspaceSwitchBusy || workspaceStatus === "checking"}
                        onClick={() => void handleTopbarWorkspaceSwitchAccount()}
                        type="button"
                      >
                        <KeyIcon size={15} />
                        <span>
                          {workspaceSwitchBusy
                            ? t.workspaceSwitchingAccountBtn
                            : t.workspaceSwitchAccountBtn}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="identity-popover-field">
                    <label htmlFor="topbar-workspace-customer-id">
                      {t.workspaceCustomerIdLabel}
                    </label>
                    <input
                      autoComplete="off"
                      id="topbar-workspace-customer-id"
                      onChange={(e) => onCustomerIdChange?.(e.target.value)}
                      placeholder="C012abcde / my_customer"
                      spellCheck={false}
                      type="text"
                      value={customerId}
                    />
                  </div>

                  {workspaceError && (
                    <p className="identity-popover-error" role="alert">
                      {workspaceError}
                    </p>
                  )}

                  <p className="identity-popover-note">{t.workspaceSharedNote}</p>
                  <p className="identity-popover-note">{t.dualAccountHint}</p>
                </div>
              )}
            </div>

            <LanguageMenu
              locale={locale}
              messages={messages}
              onChange={onLocaleChange}
            />
            <a
              className="help-control"
              href="https://docs.cloud.google.com/chrome-enterprise-premium/docs/security-gateway-private-web-apps"
              rel="noreferrer"
              target="_blank"
            >
              <HelpIcon size={20} />
              <span>{messages.help}</span>
            </a>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
