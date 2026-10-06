import { useState } from "react";
import type { Messages } from "../../i18n/messages";
import type {
  CepDlpAction,
  CepDlpDeviceScope,
  CepDlpMatrixRuleConfig,
  CepDlpMatrixState,
  CepDlpRuleId,
} from "../../lib/api";

interface DlpMatrixTableProps {
  messages: Messages;
  matrix: CepDlpMatrixState;
  onChange: (matrix: CepDlpMatrixState) => void;
  region: string;
  onRegionChange: (region: string) => void;
  customMessage?: string;
  onCustomMessageChange?: (message: string) => void;
  saveContent?: boolean;
  onSaveContentChange?: (save: boolean) => void;
  onEnsureAccessLevel?: (suggestedSentinel: string) => void;
}

interface CompanyDeviceEnvState {
  corpPc: boolean;
  byodPc: boolean;
  corpAndroid: boolean;
  corpIos: boolean;
  byodAndroid: boolean;
  byodIos: boolean;
}

const DLP_REGIONS: Array<{ value: string; label: string }> = [
  { value: "JP", label: "Japan (My Number / Bank Account)" },
  { value: "US", label: "United States (SSN / Driver's License)" },
  { value: "GB", label: "United Kingdom (National Insurance)" },
  { value: "DE", label: "Germany (Identity Card)" },
  { value: "FR", label: "France (NIR)" },
  { value: "CA", label: "Canada (SIN)" },
  { value: "AU", label: "Australia (TFN)" },
  { value: "KR", label: "South Korea (RRN)" },
  { value: "SG", label: "Singapore (NRIC)" },
  { value: "IN", label: "India (Aadhaar)" },
];

const ACTION_CYCLE: CepDlpAction[] = ["auditOnly", "warnUser", "blockContent", "off"];

export const DEFAULT_DLP_MATRIX: CepDlpMatrixState = {
  universal_upload: { upload: "warnUser", byodOnly: false },
  universal_download: { download: "warnUser", byodOnly: false },
  payment_card: { upload: "warnUser", paste: "warnUser", print: "warnUser", byodOnly: false },
  national_id: { upload: "warnUser", paste: "warnUser", print: "warnUser", byodOnly: false },
  access_level: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: false },
  android_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "android_byod" },
  ios_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "ios_byod" },
  watermark: { watermark: true, byodOnly: false },
  genai_block: { paste: "blockContent", upload: "blockContent", byodOnly: false },
};

export function DlpMatrixTable({
  messages,
  matrix,
  onChange,
  region,
  onRegionChange,
  customMessage,
  onCustomMessageChange,
  saveContent,
  onSaveContentChange,
  onEnsureAccessLevel,
}: DlpMatrixTableProps) {
  const m = messages.cepDeployer;
  const [envState, setEnvState] = useState<CompanyDeviceEnvState>({
    corpPc: true,
    byodPc: true,
    corpAndroid: false,
    corpIos: false,
    byodAndroid: true,
    byodIos: true,
  });

  const currentMatrix = { ...DEFAULT_DLP_MATRIX, ...matrix };

  function updateRule(id: CepDlpRuleId, updater: (prev: CepDlpMatrixRuleConfig) => CepDlpMatrixRuleConfig) {
    const existing = currentMatrix[id] ?? {};
    const updated = updater(existing);
    onChange({ ...currentMatrix, [id]: updated });
  }

  function cycleAction(id: CepDlpRuleId, op: "upload" | "download" | "paste" | "print") {
    updateRule(id, (prev) => {
      const current = prev[op] ?? "off";
      const nextIndex = (ACTION_CYCLE.indexOf(current) + 1) % ACTION_CYCLE.length;
      const nextAction = ACTION_CYCLE[nextIndex];
      if (nextAction !== "off" && (id === "access_level" || id === "android_byod" || id === "ios_byod")) {
        onEnsureAccessLevel?.("AUTO_CREATE_CORP_OWNED");
      }
      return { ...prev, [op]: nextAction };
    });
  }

  function toggleWatermark(id: CepDlpRuleId) {
    updateRule(id, (prev) => ({ ...prev, watermark: !prev.watermark }));
  }

  function updateDeviceScope(id: CepDlpRuleId, nextScope: CepDlpDeviceScope) {
    if (nextScope !== "all") {
      onEnsureAccessLevel?.("AUTO_CREATE_CORP_OWNED");
    }
    updateRule(id, (prev) => ({
      ...prev,
      deviceScope: nextScope,
      byodOnly: nextScope !== "all" && nextScope !== "corp_only",
    }));
  }

  function toggleEnvKey(key: keyof CompanyDeviceEnvState) {
    setEnvState((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function applyEnvironmentProfile() {
    const hasAnyByod = envState.byodPc || envState.byodAndroid || envState.byodIos;
    const hasAnyCorp = envState.corpPc || envState.corpAndroid || envState.corpIos;

    let aggregateByodScope: CepDlpDeviceScope = "all";
    if (hasAnyByod) {
      if (envState.byodPc && (envState.byodAndroid || envState.byodIos)) {
        aggregateByodScope = "byod_only";
      } else if (envState.byodPc) {
        aggregateByodScope = "desktop_byod";
      } else if (envState.byodAndroid && envState.byodIos) {
        aggregateByodScope = "mobile_byod";
      } else if (envState.byodAndroid) {
        aggregateByodScope = "android_byod";
      } else if (envState.byodIos) {
        aggregateByodScope = "ios_byod";
      }
      onEnsureAccessLevel?.("AUTO_CREATE_CORP_OWNED");
    }

    const uploadScope: CepDlpDeviceScope = hasAnyByod && hasAnyCorp ? aggregateByodScope : "all";
    const uploadAction: CepDlpAction = hasAnyByod ? "blockContent" : "warnUser";

    onChange({
      universal_upload: {
        upload: uploadAction,
        deviceScope: uploadScope,
        byodOnly: uploadScope !== "all" && uploadScope !== "corp_only",
      },
      universal_download: {
        download: uploadAction,
        deviceScope: uploadScope,
        byodOnly: uploadScope !== "all" && uploadScope !== "corp_only",
      },
      payment_card: {
        upload: "blockContent",
        paste: "warnUser",
        print: "blockContent",
        deviceScope: "all",
        byodOnly: false,
      },
      national_id: {
        upload: "blockContent",
        paste: "warnUser",
        print: "blockContent",
        deviceScope: "all",
        byodOnly: false,
      },
      access_level: {
        upload: envState.byodPc ? "blockContent" : "off",
        download: envState.byodPc ? "blockContent" : "off",
        paste: envState.byodPc ? "warnUser" : "off",
        print: envState.byodPc ? "blockContent" : "off",
        deviceScope: "byod_only",
        byodOnly: true,
      },
      android_byod: {
        upload: envState.byodAndroid ? "blockContent" : "off",
        download: envState.byodAndroid ? "blockContent" : "off",
        paste: envState.byodAndroid ? "warnUser" : "off",
        print: envState.byodAndroid ? "blockContent" : "off",
        deviceScope: "android_byod",
        byodOnly: true,
      },
      ios_byod: {
        upload: envState.byodIos ? "blockContent" : "off",
        download: envState.byodIos ? "blockContent" : "off",
        paste: envState.byodIos ? "warnUser" : "off",
        print: envState.byodIos ? "blockContent" : "off",
        deviceScope: "ios_byod",
        byodOnly: true,
      },
      watermark: {
        watermark: true,
        deviceScope: hasAnyByod && hasAnyCorp ? aggregateByodScope : "all",
        byodOnly: hasAnyByod && hasAnyCorp,
      },
      genai_block: {
        paste: "blockContent",
        upload: "blockContent",
        deviceScope: "all",
        byodOnly: false,
      },
    });
  }

  function applyPreset(presetName: "recommended" | "strict" | "byod_mobile" | "genai" | "audit" | "gemini") {
    switch (presetName) {
      case "recommended":
        onChange({
          universal_upload: { upload: "warnUser", byodOnly: false },
          universal_download: { download: "warnUser", byodOnly: false },
          payment_card: { upload: "warnUser", paste: "warnUser", print: "warnUser", byodOnly: false },
          national_id: { upload: "warnUser", paste: "warnUser", print: "warnUser", byodOnly: false },
          access_level: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: false },
          android_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "android_byod" },
          ios_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "ios_byod" },
          watermark: { watermark: true, byodOnly: false },
          genai_block: { paste: "blockContent", upload: "blockContent", byodOnly: false },
        });
        break;
      case "strict":
        onChange({
          universal_upload: { upload: "warnUser", byodOnly: false },
          universal_download: { download: "warnUser", byodOnly: false },
          payment_card: { upload: "blockContent", paste: "blockContent", print: "blockContent", byodOnly: false },
          national_id: { upload: "blockContent", paste: "blockContent", print: "blockContent", byodOnly: false },
          access_level: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: false },
          android_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "android_byod" },
          ios_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "ios_byod" },
          watermark: { watermark: true, byodOnly: false },
          genai_block: { paste: "blockContent", upload: "blockContent", byodOnly: false },
        });
        break;
      case "byod_mobile":
        onEnsureAccessLevel?.("AUTO_CREATE_CORP_OWNED");
        onChange({
          universal_upload: { upload: "blockContent", byodOnly: true, deviceScope: "byod_only" },
          universal_download: { download: "blockContent", byodOnly: true, deviceScope: "byod_only" },
          payment_card: { upload: "blockContent", paste: "warnUser", print: "blockContent", byodOnly: false, deviceScope: "all" },
          national_id: { upload: "blockContent", paste: "warnUser", print: "blockContent", byodOnly: false, deviceScope: "all" },
          access_level: { upload: "blockContent", download: "blockContent", paste: "warnUser", print: "blockContent", byodOnly: true, deviceScope: "byod_only" },
          android_byod: { upload: "blockContent", download: "blockContent", paste: "warnUser", print: "blockContent", byodOnly: true, deviceScope: "android_byod" },
          ios_byod: { upload: "blockContent", download: "blockContent", paste: "warnUser", print: "blockContent", byodOnly: true, deviceScope: "ios_byod" },
          watermark: { watermark: true, byodOnly: true, deviceScope: "byod_only" },
          genai_block: { paste: "blockContent", upload: "blockContent", byodOnly: false, deviceScope: "all" },
        });
        break;
      case "genai":
        onChange({
          universal_upload: { upload: "off", byodOnly: false },
          universal_download: { download: "off", byodOnly: false },
          payment_card: { upload: "warnUser", paste: "warnUser", print: "off", byodOnly: false },
          national_id: { upload: "warnUser", paste: "warnUser", print: "off", byodOnly: false },
          access_level: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: false },
          android_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "android_byod" },
          ios_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "ios_byod" },
          watermark: { watermark: false, byodOnly: false },
          genai_block: { paste: "blockContent", upload: "blockContent", byodOnly: false },
        });
        break;
      case "audit":
        onChange({
          universal_upload: { upload: "auditOnly", byodOnly: false },
          universal_download: { download: "auditOnly", byodOnly: false },
          payment_card: { upload: "auditOnly", paste: "auditOnly", print: "auditOnly", byodOnly: false },
          national_id: { upload: "auditOnly", paste: "auditOnly", print: "auditOnly", byodOnly: false },
          access_level: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: false },
          android_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "android_byod" },
          ios_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "ios_byod" },
          watermark: { watermark: false, byodOnly: false },
          genai_block: { paste: "auditOnly", upload: "auditOnly", byodOnly: false },
        });
        break;
      case "gemini":
        onEnsureAccessLevel?.("AUTO_CREATE_CORP_OWNED");
        onChange({
          universal_upload: { upload: "warnUser", byodOnly: false },
          universal_download: { download: "warnUser", byodOnly: false },
          payment_card: { upload: "blockContent", paste: "blockContent", print: "blockContent", byodOnly: false },
          national_id: { upload: "blockContent", paste: "blockContent", print: "blockContent", byodOnly: false },
          access_level: { upload: "blockContent", download: "blockContent", paste: "blockContent", print: "blockContent", byodOnly: false },
          android_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "android_byod" },
          ios_byod: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: true, deviceScope: "ios_byod" },
          watermark: { watermark: true, byodOnly: false },
          genai_block: { paste: "blockContent", upload: "blockContent", byodOnly: false },
        });
        break;
    }
  }

  function resolveRowScope(ruleConfig: CepDlpMatrixRuleConfig | undefined): CepDlpDeviceScope {
    if (ruleConfig?.deviceScope) {
      return ruleConfig.deviceScope;
    }
    if (ruleConfig?.byodOnly) {
      return "byod_only";
    }
    return "all";
  }

  function renderScopeSelect(id: CepDlpRuleId, rowLabel: string) {
    const scope = resolveRowScope(currentMatrix[id]);
    return (
      <select
        aria-label={`${rowLabel} - ${m.dlpColDeviceScope}`}
        className={`dlp-scope-select ${scope !== "all" ? "scoped" : ""}`}
        onChange={(e) => updateDeviceScope(id, e.target.value as CepDlpDeviceScope)}
        value={scope}
      >
        <option value="all">{m.dlpScopeAll}</option>
        <option value="byod_only">{m.dlpScopeSelectByodOnly}</option>
        <option value="corp_only">{m.dlpScopeSelectCorpOnly}</option>
        <option value="desktop_byod">{m.dlpScopeSelectDesktopByod}</option>
        <option value="mobile_byod">{m.dlpScopeSelectMobileByod}</option>
        <option value="android_byod">{m.dlpScopeSelectAndroidByod}</option>
        <option value="ios_byod">{m.dlpScopeSelectIosByod}</option>
        <option value="android_all">{m.dlpScopeSelectAndroidAll}</option>
        <option value="ios_all">{m.dlpScopeSelectIosAll}</option>
      </select>
    );
  }

  function renderActionBadge(action: CepDlpAction | undefined, onClick: () => void, label: string) {
    const act = action ?? "off";
    const badgeClass =
      act === "blockContent"
        ? "dlp-badge dlp-badge-block"
        : act === "warnUser"
        ? "dlp-badge dlp-badge-warn"
        : act === "auditOnly"
        ? "dlp-badge dlp-badge-audit"
        : "dlp-badge dlp-badge-off";

    const text =
      act === "blockContent"
        ? m.dlpActionBadgeBlock
        : act === "warnUser"
        ? m.dlpActionBadgeWarn
        : act === "auditOnly"
        ? m.dlpActionBadgeAuditOnly
        : m.dlpActionBadgeOff;

    return (
      <button
        aria-label={`${label}: ${text}`}
        className={badgeClass}
        onClick={onClick}
        title={`${label} (${text})`}
        type="button"
      >
        {text}
      </button>
    );
  }

  const envItems: Array<{ key: keyof CompanyDeviceEnvState; icon: string; label: string }> = [
    { key: "corpPc", icon: "💻", label: m.dlpEnvCorpPc },
    { key: "byodPc", icon: "🏠", label: m.dlpEnvByodPc },
    { key: "corpAndroid", icon: "🤖", label: m.dlpEnvCorpAndroid },
    { key: "corpIos", icon: "📱", label: m.dlpEnvCorpIos },
    { key: "byodAndroid", icon: "🤖", label: m.dlpEnvByodAndroid },
    { key: "byodIos", icon: "🍎", label: m.dlpEnvByodIos },
  ];

  return (
    <div className="dlp-matrix-container">
      <div className="dlp-matrix-header">
        <div>
          <h3>{m.dlpMatrixTitle}</h3>
          <p className="dlp-matrix-desc">{m.dlpMatrixSubtitle}</p>
        </div>
        <div className="dlp-region-selector">
          <label htmlFor="cep-dlp-matrix-region">{m.dlpRegionTitle}:</label>
          <select
            id="cep-dlp-matrix-region"
            onChange={(e) => onRegionChange(e.target.value)}
            value={region}
          >
            {DLP_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.value === "JP" ? m.dlpRegionJapanLabel : r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dlp-env-builder-card" role="region" aria-label={m.dlpEnvBuilderTitle}>
        <div className="dlp-env-builder-head">
          <div>
            <h4>🏢 {m.dlpEnvBuilderTitle}</h4>
            <p className="dlp-env-builder-desc">{m.dlpEnvBuilderSubtitle}</p>
          </div>
          <button
            className="btn btn-primary btn-sm dlp-env-apply-btn"
            onClick={applyEnvironmentProfile}
            type="button"
          >
            {m.dlpEnvApplyBtn}
          </button>
        </div>
        <div className="dlp-env-chip-grid">
          {envItems.map((item) => {
            const checked = envState[item.key];
            return (
              <label
                className={`dlp-env-chip ${checked ? "active" : ""}`}
                key={item.key}
              >
                <input
                  checked={checked}
                  onChange={() => toggleEnvKey(item.key)}
                  type="checkbox"
                />
                <span className="dlp-env-chip-icon" aria-hidden="true">{item.icon}</span>
                <span className="dlp-env-chip-text">{item.label}</span>
              </label>
            );
          })}
        </div>
        <p className="dlp-env-summary-note">{m.dlpEnvSummaryNotice}</p>
      </div>

      <div className="dlp-matrix-presets">
        <span className="dlp-presets-label">{m.dlpPresetsLabel}</span>
        <button
          className="btn btn-secondary btn-sm dlp-preset-btn"
          onClick={() => applyPreset("recommended")}
          type="button"
        >
          {m.dlpPresetRecommended}
        </button>
        <button
          className="btn btn-secondary btn-sm dlp-preset-btn"
          onClick={() => applyPreset("strict")}
          type="button"
        >
          {m.dlpPresetStrictZeroTrust}
        </button>
        <button
          className="btn btn-secondary btn-sm dlp-preset-btn"
          onClick={() => applyPreset("byod_mobile")}
          type="button"
        >
          {m.dlpPresetByodMobile}
        </button>
        <button
          className="btn btn-secondary btn-sm dlp-preset-btn"
          onClick={() => applyPreset("genai")}
          type="button"
        >
          {m.dlpPresetGenAiSecure}
        </button>
        <button
          className="btn btn-secondary btn-sm dlp-preset-btn"
          onClick={() => applyPreset("audit")}
          type="button"
        >
          {m.dlpPresetAuditOnly}
        </button>
        <button
          className="btn btn-secondary btn-sm dlp-preset-btn"
          onClick={() => applyPreset("gemini")}
          type="button"
        >
          {m.dlpPresetGeminiEnterprise}
        </button>
      </div>

      <div className="dlp-table-wrapper">
        <table className="dlp-matrix-table" aria-label={m.dlpMatrixTitle}>
          <thead>
            <tr>
              <th scope="col" className="col-threat">{m.dlpColThreat}</th>
              <th scope="col" className="col-op">{m.dlpColUpload}</th>
              <th scope="col" className="col-op">{m.dlpColDownload}</th>
              <th scope="col" className="col-op">{m.dlpColPaste}</th>
              <th scope="col" className="col-op">{m.dlpColPrint}</th>
              <th scope="col" className="col-op">{m.dlpColWatermark}</th>
              <th scope="col" className="col-scope">{m.dlpColDeviceScope}</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. All File Uploads */}
            <tr>
              <th scope="row">
                <strong>📤 {m.dlpRowUniversalUpload}</strong>
                <small>{m.dlpRowUniversalUploadDesc}</small>
              </th>
              <td>
                {renderActionBadge(
                  currentMatrix.universal_upload?.upload,
                  () => cycleAction("universal_upload", "upload"),
                  `${m.dlpRowUniversalUpload} ${m.dlpColUpload}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td>
                {renderScopeSelect("universal_upload", m.dlpRowUniversalUpload)}
              </td>
            </tr>

            {/* 2. All File Downloads */}
            <tr>
              <th scope="row">
                <strong>📥 {m.dlpRowUniversalDownload}</strong>
                <small>{m.dlpRowUniversalDownloadDesc}</small>
              </th>
              <td className="cell-na">—</td>
              <td>
                {renderActionBadge(
                  currentMatrix.universal_download?.download,
                  () => cycleAction("universal_download", "download"),
                  `${m.dlpRowUniversalDownload} ${m.dlpColDownload}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td>
                {renderScopeSelect("universal_download", m.dlpRowUniversalDownload)}
              </td>
            </tr>

            {/* 3. Payment Card Data */}
            <tr>
              <th scope="row">
                <strong>💳 {m.dlpRowPaymentCard}</strong>
                <small>{m.dlpRowPaymentCardDesc}</small>
              </th>
              <td>
                {renderActionBadge(
                  currentMatrix.payment_card?.upload,
                  () => cycleAction("payment_card", "upload"),
                  `${m.dlpRowPaymentCard} ${m.dlpColUpload}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                {renderActionBadge(
                  currentMatrix.payment_card?.paste,
                  () => cycleAction("payment_card", "paste"),
                  `${m.dlpRowPaymentCard} ${m.dlpColPaste}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.payment_card?.print,
                  () => cycleAction("payment_card", "print"),
                  `${m.dlpRowPaymentCard} ${m.dlpColPrint}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                {renderScopeSelect("payment_card", m.dlpRowPaymentCard)}
              </td>
            </tr>

            {/* 4. National ID / PII Data */}
            <tr>
              <th scope="row">
                <strong>🪪 {m.dlpRowNationalId}</strong>
                <small>{m.dlpRowNationalIdDesc}</small>
              </th>
              <td>
                {renderActionBadge(
                  currentMatrix.national_id?.upload,
                  () => cycleAction("national_id", "upload"),
                  `${m.dlpRowNationalId} ${m.dlpColUpload}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                {renderActionBadge(
                  currentMatrix.national_id?.paste,
                  () => cycleAction("national_id", "paste"),
                  `${m.dlpRowNationalId} ${m.dlpColPaste}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.national_id?.print,
                  () => cycleAction("national_id", "print"),
                  `${m.dlpRowNationalId} ${m.dlpColPrint}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                {renderScopeSelect("national_id", m.dlpRowNationalId)}
              </td>
            </tr>

            {/* 5. Unmanaged / BYOD Devices */}
            <tr>
              <th scope="row">
                <strong>💻 {m.dlpRowAccessLevel}</strong>
                <small>{m.dlpRowAccessLevelDesc}</small>
              </th>
              <td>
                {renderActionBadge(
                  currentMatrix.access_level?.upload,
                  () => cycleAction("access_level", "upload"),
                  `${m.dlpRowAccessLevel} ${m.dlpColUpload}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.access_level?.download,
                  () => cycleAction("access_level", "download"),
                  `${m.dlpRowAccessLevel} ${m.dlpColDownload}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.access_level?.paste,
                  () => cycleAction("access_level", "paste"),
                  `${m.dlpRowAccessLevel} ${m.dlpColPaste}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.access_level?.print,
                  () => cycleAction("access_level", "print"),
                  `${m.dlpRowAccessLevel} ${m.dlpColPrint}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                <span className="dlp-scope-pill access-level fixed">{m.dlpScopeSelectByodOnly}</span>
              </td>
            </tr>

            {/* 6. Android BYOD Devices */}
            <tr>
              <th scope="row">
                <strong>🤖 {m.dlpRowAndroidByod}</strong>
                <small>{m.dlpRowAndroidByodDesc}</small>
              </th>
              <td>
                {renderActionBadge(
                  currentMatrix.android_byod?.upload,
                  () => cycleAction("android_byod", "upload"),
                  `${m.dlpRowAndroidByod} ${m.dlpColUpload}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.android_byod?.download,
                  () => cycleAction("android_byod", "download"),
                  `${m.dlpRowAndroidByod} ${m.dlpColDownload}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.android_byod?.paste,
                  () => cycleAction("android_byod", "paste"),
                  `${m.dlpRowAndroidByod} ${m.dlpColPaste}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.android_byod?.print,
                  () => cycleAction("android_byod", "print"),
                  `${m.dlpRowAndroidByod} ${m.dlpColPrint}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                <span className="dlp-scope-pill access-level fixed">{m.dlpScopeSelectAndroidByod}</span>
              </td>
            </tr>

            {/* 7. iPhone / iOS BYOD Devices */}
            <tr>
              <th scope="row">
                <strong>🍎 {m.dlpRowIosByod}</strong>
                <small>{m.dlpRowIosByodDesc}</small>
              </th>
              <td>
                {renderActionBadge(
                  currentMatrix.ios_byod?.upload,
                  () => cycleAction("ios_byod", "upload"),
                  `${m.dlpRowIosByod} ${m.dlpColUpload}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.ios_byod?.download,
                  () => cycleAction("ios_byod", "download"),
                  `${m.dlpRowIosByod} ${m.dlpColDownload}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.ios_byod?.paste,
                  () => cycleAction("ios_byod", "paste"),
                  `${m.dlpRowIosByod} ${m.dlpColPaste}`,
                )}
              </td>
              <td>
                {renderActionBadge(
                  currentMatrix.ios_byod?.print,
                  () => cycleAction("ios_byod", "print"),
                  `${m.dlpRowIosByod} ${m.dlpColPrint}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                <span className="dlp-scope-pill access-level fixed">{m.dlpScopeSelectIosByod}</span>
              </td>
            </tr>

            {/* 8. Internal Sites & Watermark */}
            <tr>
              <th scope="row">
                <strong>🔒 {m.dlpRowWatermark}</strong>
                <small>{m.dlpRowWatermarkDesc}</small>
              </th>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td>
                <button
                  className={currentMatrix.watermark?.watermark ? "dlp-badge dlp-badge-warn" : "dlp-badge dlp-badge-off"}
                  onClick={() => toggleWatermark("watermark")}
                  type="button"
                >
                  {currentMatrix.watermark?.watermark
                    ? `${m.dlpActionBadgeWarn} + ${m.dlpColWatermark}`
                    : m.dlpActionBadgeOff}
                </button>
              </td>
              <td>
                {renderScopeSelect("watermark", m.dlpRowWatermark)}
              </td>
            </tr>

            {/* 9. Unapproved GenAI Block */}
            <tr>
              <th scope="row">
                <strong>🤖 {m.dlpRowGenAiBlock}</strong>
                <small>{m.dlpRowGenAiBlockDesc}</small>
              </th>
              <td>
                {renderActionBadge(
                  currentMatrix.genai_block?.upload,
                  () => cycleAction("genai_block", "upload"),
                  `${m.dlpRowGenAiBlock} ${m.dlpColUpload}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td>
                {renderActionBadge(
                  currentMatrix.genai_block?.paste,
                  () => cycleAction("genai_block", "paste"),
                  `${m.dlpRowGenAiBlock} ${m.dlpColPaste}`,
                )}
              </td>
              <td className="cell-na">—</td>
              <td className="cell-na">—</td>
              <td>
                {renderScopeSelect("genai_block", m.dlpRowGenAiBlock)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="dlp-action-params-card">
        <h4>⚙️ {m.dlpActionParamsTitle}</h4>
        <p className="dlp-action-params-subtitle">{m.dlpActionParamsSubtitle}</p>
        <div className="dlp-action-params-grid">
          <label className="cep-check">
            <input
              checked={saveContent ?? false}
              onChange={(e) => onSaveContentChange?.(e.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>{m.dlpSaveContentLabel}</strong>
              <small>{m.dlpSaveContentHint}</small>
            </span>
          </label>
          <div className="cep-field">
            <label htmlFor="dlp-custom-message">
              {m.dlpCustomMessageLabel}
            </label>
            <input
              id="dlp-custom-message"
              onChange={(e) => onCustomMessageChange?.(e.target.value)}
              placeholder={m.dlpCustomMessagePlaceholder}
              type="text"
              value={customMessage ?? ""}
            />
            <small>{m.dlpCustomMessageHint}</small>
          </div>
        </div>
      </div>

      <div className="dlp-matrix-notice" role="note">
        <span className="dlp-notice-icon">💡</span>
        <div className="dlp-notice-content">
          <strong>{m.dlpNoticeByodTitle}</strong>
          <p>{m.dlpNoticeByodDesc}</p>
        </div>
      </div>
    </div>
  );
}

