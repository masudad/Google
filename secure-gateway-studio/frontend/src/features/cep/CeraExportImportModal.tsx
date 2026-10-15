import React, { useMemo, useRef, useState } from "react";
import { CheckCircleIcon, ShieldIcon, SparklesIcon } from "../../components/Icons";
import type { Messages } from "../../i18n/messages";
import type { RecommendedPolicyConfig } from "./SecurityAssessmentModal";
import {
  type CeraEnforcementMode,
  type CeraImportedProfile,
  type CeraSpreadsheetPayload,
  computeConfigFromCeraProfile,
  createSampleCeraProfile,
  parseCeraExportFile,
  parseCeraSpreadsheetPayload,
} from "./cera-import";

interface CeraExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConfig: (config: RecommendedPolicyConfig) => void;
  messages: Messages;
  primaryDomain?: string | null;
}

export function CeraExportImportModal({
  isOpen,
  onClose,
  onApplyConfig,
  messages,
  primaryDomain,
}: CeraExportImportModalProps) {
  const m = messages.cepDeployer;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<CeraImportedProfile | null>(() =>
    createSampleCeraProfile(primaryDomain),
  );
  const [rolloutMode, setRolloutMode] = useState<CeraEnforcementMode>("block");
  const [autoSelectOu, setAutoSelectOu] = useState<boolean>(true);
  const [sheetUrlOrId, setSheetUrlOrId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const computedConfig = useMemo(() => {
    if (!profile) return null;
    return computeConfigFromCeraProfile(profile, rolloutMode, {
      applyTopOu: autoSelectOu,
      customMessage: m.assessDefaultDlpCustomMessage,
    });
  }, [profile, rolloutMode, autoSelectOu, m.assessDefaultDlpCustomMessage]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const rawText = await file.text();
      const parsed = parseCeraExportFile(file.name, rawText, primaryDomain);
      setProfile(parsed);
      if (parsed.outcomeModeHint) {
        setRolloutMode(parsed.outcomeModeHint);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to parse CERA export file.",
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLoadSample = () => {
    setErrorMessage("");
    setProfile(createSampleCeraProfile(primaryDomain));
    setRolloutMode("block");
  };

  const handleImportSheet = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const g = globalThis as Record<string, unknown>;
      const bridgeFn = g.__sgsImportCeraSheet as
        | ((urlOrId: string) => Promise<CeraSpreadsheetPayload>)
        | undefined;
      if (typeof bridgeFn === "function") {
        const res = await bridgeFn(sheetUrlOrId.trim());
        if (!res || res.ok === false) {
          throw new Error(
            res?.error || "Could not read CERA data from the specified Google Sheet.",
          );
        }
        const parsed = parseCeraSpreadsheetPayload(res, primaryDomain);
        setProfile(parsed);
        if (parsed.outcomeModeHint) {
          setRolloutMode(parsed.outcomeModeHint);
        }
      } else {
        throw new Error(
          "Direct Google Sheets import is available inside the Google Sheets Easy PoC container. In browser extension mode, export the sheet as CSV/TSV and upload it above.",
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to import CERA Google Sheet.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!profile || !computedConfig) return;
    let activeCount = 0;
    if (computedConfig.corePolicies) activeCount += 1;
    if (computedConfig.forceExtensions) activeCount += 1;
    if (computedConfig.connectors) activeCount += 1;
    if (computedConfig.dlpRules) activeCount += 1;
    if (computedConfig.dataBoundaryMode !== "none") activeCount += 1;
    if (computedConfig.dlpMatrix.universal_upload?.upload && computedConfig.dlpMatrix.universal_upload.upload !== "off") activeCount += 1;
    if (computedConfig.dlpMatrix.universal_download?.download && computedConfig.dlpMatrix.universal_download.download !== "off") activeCount += 1;
    if (computedConfig.dlpMatrix.payment_card?.upload && computedConfig.dlpMatrix.payment_card.upload !== "off") activeCount += 1;
    if (computedConfig.dlpMatrix.national_id?.upload && computedConfig.dlpMatrix.national_id.upload !== "off") activeCount += 1;
    if (computedConfig.dlpMatrix.genai_block?.paste && computedConfig.dlpMatrix.genai_block.paste !== "off") activeCount += 1;
    if (computedConfig.dlpMatrix.watermark?.watermark) activeCount += 1;

    onApplyConfig({
      ...computedConfig,
      appliedBannerMessage: m.ceraImportAppliedBanner(
        profile.sourceName,
        activeCount,
      ),
    });
    onClose();
  };

  const signalsTotal = profile
    ? profile.sensitiveEvents +
      profile.malwareEvents +
      profile.passwordReuseEvents +
      profile.unsafeSiteEvents
    : 0;

  return (
    <div
      className="cep-assessment-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cera-import-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cep-assessment-modal cera-import-modal">
        <div className="cep-assessment-header">
          <div className="cep-title-with-badge">
            <SparklesIcon size={22} />
            <h2 id="cera-import-modal-title">{m.ceraImportModalTitle}</h2>
          </div>
          <button
            className="cep-modal-close-btn"
            id="btn-close-cera-import"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>

        <p className="cep-assessment-subtitle">{m.ceraImportModalSubtitle}</p>

        <div className="cera-import-body">
          <div className="cera-import-sources-grid">
            <div className="cera-import-source-card">
              <div className="cera-import-source-label">{m.ceraImportUploadLabel}</div>
              <div className="cera-import-source-actions">
                <input
                  ref={fileInputRef}
                  id="cera-export-file-input"
                  type="file"
                  accept=".csv,.tsv,.json,.txt"
                  className="cera-hidden-file-input"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  id="btn-cera-select-file"
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {m.ceraImportUploadBtn}
                </button>
                <button
                  type="button"
                  id="btn-cera-load-sample"
                  className="btn btn-secondary btn-sm"
                  disabled={loading}
                  onClick={handleLoadSample}
                >
                  {m.ceraImportSampleBtn}
                </button>
              </div>
            </div>

            <div className="cera-import-source-card">
              <div className="cera-import-source-label">{m.ceraImportSheetLabel}</div>
              <div className="cera-import-sheet-row">
                <input
                  id="cera-sheet-url-input"
                  type="text"
                  className="cera-sheet-input"
                  placeholder={m.ceraImportSheetPlaceholder}
                  value={sheetUrlOrId}
                  onChange={(e) => setSheetUrlOrId(e.target.value)}
                />
                <button
                  type="button"
                  id="btn-cera-import-sheet"
                  className="btn btn-secondary btn-sm"
                  disabled={loading}
                  onClick={handleImportSheet}
                >
                  {loading ? m.ceraImportSheetLoading : m.ceraImportSheetBtn}
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="cera-import-error" id="cera-import-error-banner">
              {errorMessage}
            </div>
          )}

          {profile && computedConfig && (
            <>
              <div className="cera-import-detected-bar">
                <div className="cera-import-detected-badge">
                  <span className="cera-import-detected-label">
                    {m.ceraImportDetectedSource}:
                  </span>
                  <strong id="cera-detected-source-name">{profile.sourceName}</strong>
                </div>
                <div className="cera-import-detected-meta">
                  <span>
                    {m.ceraImportTotalVolume}:{" "}
                    <strong id="cera-detected-total-actions">
                      {profile.totalEvents.toLocaleString()}
                    </strong>
                    {profile.totalVolumeGb !== null
                      ? ` (${profile.totalVolumeGb} GB)`
                      : ""}
                  </span>
                  {profile.corporateDomains.length > 0 && (
                    <span>
                      {m.ceraImportDetectedDomains}:{" "}
                      <strong id="cera-detected-domains">
                        {profile.corporateDomains.join(", ")}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="cera-import-section-title">{m.ceraImportSummaryHeader}</div>
              <div className="cera-import-metrics-grid">
                <div
                  className={`cera-metric-card ${
                    profile.shadowAiEvents > 0 ? "is-detected" : ""
                  }`}
                >
                  <div className="cera-metric-title">{m.ceraImportShadowAi}</div>
                  <div className="cera-metric-value" id="cera-metric-shadow-ai">
                    {profile.shadowAiEvents.toLocaleString()}
                  </div>
                  {profile.shadowAiTopDomains.length > 0 && (
                    <div className="cera-metric-tags">
                      {profile.shadowAiTopDomains.slice(0, 4).join(", ")}
                    </div>
                  )}
                </div>

                <div
                  className={`cera-metric-card ${
                    profile.personalAccountEvents > 0 ? "is-detected" : ""
                  }`}
                >
                  <div className="cera-metric-title">{m.ceraImportPersonalAcct}</div>
                  <div className="cera-metric-value" id="cera-metric-personal">
                    {profile.personalAccountEvents.toLocaleString()}
                  </div>
                  {profile.personalAccountTopDomains.length > 0 && (
                    <div className="cera-metric-tags">
                      {profile.personalAccountTopDomains.slice(0, 4).join(", ")}
                    </div>
                  )}
                </div>

                <div
                  className={`cera-metric-card ${
                    profile.unmanagedEvents > 0 ? "is-detected" : ""
                  }`}
                >
                  <div className="cera-metric-title">{m.ceraImportUnmanagedApps}</div>
                  <div className="cera-metric-value" id="cera-metric-unmanaged">
                    {profile.unmanagedEvents.toLocaleString()}
                  </div>
                  {profile.unmanagedTopDomains.length > 0 && (
                    <div className="cera-metric-tags">
                      {profile.unmanagedTopDomains.slice(0, 4).join(", ")}
                    </div>
                  )}
                </div>

                <div
                  className={`cera-metric-card ${
                    profile.messagingEvents > 0 ? "is-detected" : ""
                  }`}
                >
                  <div className="cera-metric-title">{m.ceraImportMessaging}</div>
                  <div className="cera-metric-value" id="cera-metric-messaging">
                    {profile.messagingEvents.toLocaleString()}
                  </div>
                  {profile.messagingTopDomains.length > 0 && (
                    <div className="cera-metric-tags">
                      {profile.messagingTopDomains.slice(0, 4).join(", ")}
                    </div>
                  )}
                </div>

                <div
                  className={`cera-metric-card ${
                    profile.printEvents + profile.downloadEvents > 0
                      ? "is-detected"
                      : ""
                  }`}
                >
                  <div className="cera-metric-title">{m.ceraImportPrintsDownloads}</div>
                  <div
                    className="cera-metric-value"
                    id="cera-metric-prints-downloads"
                  >
                    {(profile.printEvents + profile.downloadEvents).toLocaleString()}
                  </div>
                  <div className="cera-metric-tags">
                    Print: {profile.printEvents.toLocaleString()} · Download:{" "}
                    {profile.downloadEvents.toLocaleString()}
                  </div>
                </div>

                <div
                  className={`cera-metric-card ${
                    signalsTotal > 0 ? "is-detected" : ""
                  }`}
                >
                  <div className="cera-metric-title">{m.ceraImportSecuritySignals}</div>
                  <div className="cera-metric-value" id="cera-metric-signals">
                    {signalsTotal.toLocaleString()}
                  </div>
                  <div className="cera-metric-tags">
                    DLP: {profile.sensitiveEvents} · Malware:{" "}
                    {profile.malwareEvents} · Pwd: {profile.passwordReuseEvents}
                  </div>
                </div>
              </div>

              <div className="cera-import-controls-bar">
                <div className="cera-mode-selector-group">
                  <span className="cera-mode-selector-label">
                    {m.ceraImportActionModeLabel}:
                  </span>
                  <div className="cera-mode-buttons">
                    <button
                      type="button"
                      id="cera-mode-block"
                      className={`cera-mode-btn ${
                        rolloutMode === "block" ? "is-active" : ""
                      }`}
                      onClick={() => setRolloutMode("block")}
                    >
                      {m.ceraImportActionBlock}
                    </button>
                    <button
                      type="button"
                      id="cera-mode-warn"
                      className={`cera-mode-btn ${
                        rolloutMode === "warn" ? "is-active" : ""
                      }`}
                      onClick={() => setRolloutMode("warn")}
                    >
                      {m.ceraImportActionWarn}
                    </button>
                    <button
                      type="button"
                      id="cera-mode-audit"
                      className={`cera-mode-btn ${
                        rolloutMode === "audit" ? "is-active" : ""
                      }`}
                      onClick={() => setRolloutMode("audit")}
                    >
                      {m.ceraImportActionAudit}
                    </button>
                  </div>
                </div>

                {profile.topOu && (
                  <label className="cera-ou-checkbox-label">
                    <input
                      type="checkbox"
                      id="cera-auto-select-ou"
                      checked={autoSelectOu}
                      onChange={(e) => setAutoSelectOu(e.target.checked)}
                    />
                    <span>
                      {m.ceraImportTopOu}: <strong>{profile.topOu}</strong> —{" "}
                      {m.ceraImportAutoSelectOu}
                    </span>
                  </label>
                )}
              </div>

              <div className="cep-recommendation-card cera-preview-card">
                <div className="card-header">
                  <ShieldIcon size={18} />
                  <h3>{m.ceraImportPreviewHeader}</h3>
                </div>

                <div className="cera-preview-columns">
                  <div className="rec-section">
                    <strong>{m.assessRecDlpHeader}</strong>
                    <ul>
                      <li>
                        {m.dlpColUpload}:{" "}
                        <code>
                          {computedConfig.dlpMatrix.universal_upload?.upload || "off"}
                        </code>
                      </li>
                      <li>
                        {m.dlpColDownload}:{" "}
                        <code>
                          {computedConfig.dlpMatrix.universal_download?.download || "off"}
                        </code>
                      </li>
                      <li>
                        {m.dlpColPaste} (GenAI):{" "}
                        <code>
                          {computedConfig.dlpMatrix.genai_block?.paste || "off"}
                        </code>
                      </li>
                      <li>
                        {m.dlpColPrint}:{" "}
                        <code>
                          {computedConfig.dlpMatrix.national_id?.print || "off"}
                        </code>
                      </li>
                      <li>
                        {m.dlpColWatermark}:{" "}
                        <code>
                          {computedConfig.dlpMatrix.watermark?.watermark
                            ? m.assessStatusWatermarkOn
                            : "OFF"}
                        </code>
                      </li>
                    </ul>
                  </div>

                  <div className="rec-section">
                    <strong>{m.assessRecModulesHeader}</strong>
                    <ul>
                      <li>
                        Core Policies:{" "}
                        {computedConfig.corePolicies
                          ? m.assessStatusEnabled
                          : m.assessStatusDisabled}
                      </li>
                      <li>
                        Data Boundary:{" "}
                        <code>{computedConfig.dataBoundaryMode}</code>
                      </li>
                      <li>
                        Force Extensions:{" "}
                        {computedConfig.forceExtensions
                          ? m.assessStatusAllowlistManaged
                          : m.assessStatusDisabled}
                      </li>
                      <li>
                        Connectors / Log Sync:{" "}
                        {computedConfig.connectors
                          ? m.assessStatusCloudLogging
                          : m.assessStatusDisabled}
                      </li>
                      <li>
                        Gemini Enterprise Zero Trust:{" "}
                        {computedConfig.geminiEnforceAccessLevel
                          ? m.assessStatusVpcScProtected
                          : m.assessStatusStandard}
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-apply-cera-config"
                  className="btn btn-primary btn-block cep-apply-rec-btn"
                  onClick={handleApply}
                >
                  <CheckCircleIcon size={16} />
                  <span>{m.ceraImportApplyBtn}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
