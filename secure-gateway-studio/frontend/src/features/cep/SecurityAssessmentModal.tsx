import { useEffect, useRef, useState } from "react";
import type { Messages } from "../../i18n/messages";
import type { CepDlpMatrixState } from "../../lib/api";
import {
  CheckCircleIcon,
  ShieldIcon,
  SparklesIcon,
} from "../../components/Icons";

export interface RecommendedPolicyConfig {
  corePolicies: boolean;
  forceExtensions: boolean;
  connectors: boolean;
  accessLevel: string;
  dlpRules: boolean;
  autoSubOus: boolean;
  dlpMatrix: CepDlpMatrixState;
  geminiEnforceAccessLevel: boolean;
  geminiEnforcePerimeter: boolean;
  internalUrls: string;
  dlpCustomMessage: string;
}

interface SecurityAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRecommendation: (config: RecommendedPolicyConfig) => void;
  messages: Messages;
}

export function SecurityAssessmentModal({
  isOpen,
  onClose,
  onApplyRecommendation,
  messages,
}: SecurityAssessmentModalProps) {
  const m = messages.cepDeployer;
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus first focusable element inside modal
    const modalEl = modalRef.current;
    if (modalEl) {
      const focusables = modalEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "Tab" && modalEl) {
        const focusables = Array.from(
          modalEl.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first || !modalEl.contains(document.activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalEl.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 15 security question IDs
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set(["genai_paste", "pii_dlp", "print_watermark", "byod_access"]),
  );

  if (!isOpen) return null;

  const questions = [
    // Category 1: GenAI & Cloud Data Protection
    {
      id: "genai_paste",
      category: "genai",
      title: m.assessQ1Title,
      risk: m.assessQ1Risk,
      solution: m.assessQ1Solution,
    },
    {
      id: "pii_dlp",
      category: "genai",
      title: m.assessQ2Title,
      risk: m.assessQ2Risk,
      solution: m.assessQ2Solution,
    },
    {
      id: "print_watermark",
      category: "genai",
      title: m.assessQ3Title,
      risk: m.assessQ3Risk,
      solution: m.assessQ3Solution,
    },
    {
      id: "malicious_ext",
      category: "genai",
      title: m.assessQ10Title,
      risk: m.assessQ10Risk,
      solution: m.assessQ10Solution,
    },

    // Category 2: Endpoint Posture & Remote Access
    {
      id: "byod_access",
      category: "posture",
      title: m.assessQ4Title,
      risk: m.assessQ4Risk,
      solution: m.assessQ4Solution,
    },
    {
      id: "device_posture",
      category: "posture",
      title: m.assessQ5Title,
      risk: m.assessQ5Risk,
      solution: m.assessQ5Solution,
    },
    {
      id: "client_cert",
      category: "posture",
      title: m.assessQ6Title,
      risk: m.assessQ6Risk,
      solution: m.assessQ6Solution,
    },
    {
      id: "geo_restriction",
      category: "posture",
      title: m.assessQ8Title,
      risk: m.assessQ8Risk,
      solution: m.assessQ8Solution,
    },

    // Category 3: SaaS Protection & Zero Trust Modernization
    {
      id: "saas_auth",
      category: "saas",
      title: m.assessQ7Title,
      risk: m.assessQ7Risk,
      solution: m.assessQ7Solution,
    },
    {
      id: "vpnless_access",
      category: "saas",
      title: m.assessQ9Title,
      risk: m.assessQ9Risk,
      solution: m.assessQ9Solution,
    },
    {
      id: "audit_logs",
      category: "saas",
      title: m.assessQ11Title,
      risk: m.assessQ11Risk,
      solution: m.assessQ11Solution,
    },
    {
      id: "zero_day_patch",
      category: "saas",
      title: m.assessQ12Title,
      risk: m.assessQ12Risk,
      solution: m.assessQ12Solution,
    },

    // Category 4: Cost Optimization & Zero Agent
    {
      id: "casb_cost",
      category: "cost",
      title: m.assessQ13Title,
      risk: m.assessQ13Risk,
      solution: m.assessQ13Solution,
    },
    {
      id: "vdi_cost",
      category: "cost",
      title: m.assessQ14Title,
      risk: m.assessQ14Risk,
      solution: m.assessQ14Solution,
    },
    {
      id: "agent_lightening",
      category: "cost",
      title: m.assessQ15Title,
      risk: m.assessQ15Risk,
      solution: m.assessQ15Solution,
    },
  ];

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyPreset = (preset: "genai" | "cost" | "remote" | "all" | "clear") => {
    if (preset === "clear") {
      setSelectedQuestions(new Set());
    } else if (preset === "all") {
      setSelectedQuestions(new Set(questions.map((q) => q.id)));
    } else if (preset === "genai") {
      setSelectedQuestions(new Set(["genai_paste", "pii_dlp", "print_watermark", "audit_logs"]));
    } else if (preset === "cost") {
      setSelectedQuestions(
        new Set(["casb_cost", "vdi_cost", "agent_lightening", "vpnless_access", "saas_auth"]),
      );
    } else if (preset === "remote") {
      setSelectedQuestions(
        new Set(["byod_access", "device_posture", "client_cert", "geo_restriction", "malicious_ext"]),
      );
    }
  };

  // Calculate recommendation based on selections
  const computeRecommendation = (): RecommendedPolicyConfig => {
    const has = (id: string) => selectedQuestions.has(id);
    const hasAny = selectedQuestions.size > 0;

    // DLP Matrix calculation
    const blockUpload = has("pii_dlp") || has("casb_cost");
    const blockDownload = has("pii_dlp") || has("vdi_cost") || has("byod_access");
    const blockPaste = has("genai_paste");
    const blockPrint = has("print_watermark");
    const watermarkScreen = has("print_watermark") || has("vdi_cost");

    const matrix: CepDlpMatrixState = {
      universal_upload: {
        upload: blockUpload ? "blockContent" : has("genai_paste") ? "warnUser" : "off",
        byodOnly: false,
      },
      universal_download: {
        download: blockDownload ? "blockContent" : has("genai_paste") ? "warnUser" : "off",
        byodOnly: false,
      },
      payment_card: {
        upload: blockUpload ? "blockContent" : has("pii_dlp") ? "warnUser" : "off",
        paste: blockPaste ? "blockContent" : has("pii_dlp") ? "warnUser" : "off",
        print: blockPrint ? "blockContent" : "off",
        byodOnly: false,
      },
      national_id: {
        upload: blockUpload ? "blockContent" : has("pii_dlp") ? "warnUser" : "off",
        paste: blockPaste ? "blockContent" : has("pii_dlp") ? "warnUser" : "off",
        print: blockPrint ? "blockContent" : "off",
        byodOnly: false,
      },
      access_level: {
        upload: has("byod_access") ? "warnUser" : "off",
        download: has("byod_access") ? "blockContent" : "off",
        paste: has("byod_access") ? "blockContent" : "off",
        print: has("byod_access") ? "blockContent" : "off",
        byodOnly: false,
      },
      watermark: {
        watermark: watermarkScreen,
        byodOnly: false,
      },
      genai_block: {
        paste: blockPaste ? "blockContent" : has("pii_dlp") ? "warnUser" : "off",
        upload: blockUpload ? "blockContent" : has("genai_paste") ? "warnUser" : "off",
        byodOnly: false,
      },
    };

    return {
      corePolicies: hasAny,
      forceExtensions: has("malicious_ext") || has("device_posture"),
      connectors: has("audit_logs") || has("casb_cost") || has("vdi_cost"),
      accessLevel:
        has("byod_access") || has("device_posture") || has("saas_auth")
          ? "BROWSER_MANAGED"
          : "NONE",
      dlpRules:
        has("genai_paste") || has("pii_dlp") || has("print_watermark") || has("casb_cost"),
      autoSubOus: hasAny,
      dlpMatrix: matrix,
      geminiEnforceAccessLevel: has("genai_paste") || has("saas_auth"),
      geminiEnforcePerimeter: has("genai_paste"),
      internalUrls: has("vpnless_access")
        ? "https://internal.corp.example.com\nhttps://portal.example.com"
        : "",
      dlpCustomMessage: has("genai_paste")
        ? m.assessDefaultDlpCustomMessage
        : "",
    };
  };

  const handleApply = () => {
    const config = computeRecommendation();
    onApplyRecommendation(config);
    onClose();
  };

  const currentConfig = computeRecommendation();

  return (
    <div
      className="cep-assessment-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cep-assessment-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cep-assessment-modal" ref={modalRef}>
        <div className="cep-assessment-header">
          <div className="cep-title-with-badge">
            <SparklesIcon size={22} />
            <h2 id="cep-assessment-modal-title">{m.assessModalTitle}</h2>
          </div>
          <button
            className="cep-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>

        <p className="cep-assessment-subtitle">{m.assessModalSubtitle}</p>

        {/* Quick Presets */}
        <div className="cep-assessment-presets">
          <span className="preset-label">{m.assessPresetLabel}:</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset("genai")}
            type="button"
          >
            🤖 {m.assessPresetGenAi}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset("cost")}
            type="button"
          >
            💰 {m.assessPresetCost}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset("remote")}
            type="button"
          >
            💻 {m.assessPresetRemote}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset("all")}
            type="button"
          >
            🛡️ {m.assessPresetAll}
          </button>
          <button
            className="btn btn-link btn-sm"
            onClick={() => applyPreset("clear")}
            type="button"
          >
            {m.assessPresetClear}
          </button>
        </div>

        <div className="cep-assessment-content-layout">
          {/* Left: 15 Questions */}
          <div className="cep-assessment-questions-panel">
            <div className="cep-question-group">
              <h4>🤖 {m.assessGroupGenAi}</h4>
              {questions
                .filter((q) => q.category === "genai")
                .map((q) => (
                  <label
                    key={q.id}
                    className={`cep-assessment-item ${selectedQuestions.has(q.id) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                    />
                    <div className="cep-assessment-item-body">
                      <strong>{q.title}</strong>
                      <span className="risk-text">⚠️ {q.risk}</span>
                      <span className="solution-text">🛡️ {q.solution}</span>
                    </div>
                  </label>
                ))}
            </div>

            <div className="cep-question-group">
              <h4>💻 {m.assessGroupPosture}</h4>
              {questions
                .filter((q) => q.category === "posture")
                .map((q) => (
                  <label
                    key={q.id}
                    className={`cep-assessment-item ${selectedQuestions.has(q.id) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                    />
                    <div className="cep-assessment-item-body">
                      <strong>{q.title}</strong>
                      <span className="risk-text">⚠️ {q.risk}</span>
                      <span className="solution-text">🛡️ {q.solution}</span>
                    </div>
                  </label>
                ))}
            </div>

            <div className="cep-question-group">
              <h4>🏢 {m.assessGroupSaas}</h4>
              {questions
                .filter((q) => q.category === "saas")
                .map((q) => (
                  <label
                    key={q.id}
                    className={`cep-assessment-item ${selectedQuestions.has(q.id) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                    />
                    <div className="cep-assessment-item-body">
                      <strong>{q.title}</strong>
                      <span className="risk-text">⚠️ {q.risk}</span>
                      <span className="solution-text">🛡️ {q.solution}</span>
                    </div>
                  </label>
                ))}
            </div>

            <div className="cep-question-group">
              <h4>💰 {m.assessGroupCost}</h4>
              {questions
                .filter((q) => q.category === "cost")
                .map((q) => (
                  <label
                    key={q.id}
                    className={`cep-assessment-item ${selectedQuestions.has(q.id) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                    />
                    <div className="cep-assessment-item-body">
                      <strong>{q.title}</strong>
                      <span className="risk-text">⚠️ {q.risk}</span>
                      <span className="solution-text">🛡️ {q.solution}</span>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Right: Recommendation & ROI Summary */}
          <div className="cep-assessment-result-panel">
            <div className="cep-recommendation-card">
              <div className="card-header">
                <ShieldIcon size={18} />
                <h3>{m.assessRecHeader}</h3>
              </div>

              <div className="rec-section">
                <strong>{m.assessRecDlpHeader}</strong>
                <ul>
                  <li>
                    {m.dlpColUpload}:{" "}
                    <code>{currentConfig.dlpMatrix.universal_upload?.upload || "off"}</code>
                  </li>
                  <li>
                    {m.dlpColDownload}:{" "}
                    <code>{currentConfig.dlpMatrix.universal_download?.download || "off"}</code>
                  </li>
                  <li>
                    {m.dlpColPaste} (GenAI):{" "}
                    <code>{currentConfig.dlpMatrix.genai_block?.paste || "off"}</code>
                  </li>
                  <li>
                    {m.dlpColPrint}:{" "}
                    <code>{currentConfig.dlpMatrix.national_id?.print || "off"}</code>
                  </li>
                  <li>
                    {m.dlpColWatermark}:{" "}
                    <code>{currentConfig.dlpMatrix.watermark?.watermark ? "ON (有効)" : "OFF"}</code>
                  </li>
                </ul>
              </div>

              <div className="rec-section">
                <strong>{m.assessRecModulesHeader}</strong>
                <ul>
                  <li>
                    Core Policies: {currentConfig.corePolicies ? "✓ 有効" : "無効"}
                  </li>
                  <li>
                    Force Extensions: {currentConfig.forceExtensions ? "✓ ホワイトリスト管理" : "無効"}
                  </li>
                  <li>
                    Connectors / Log Sync: {currentConfig.connectors ? "✓ Cloud Logging 連携" : "無効"}
                  </li>
                  <li>
                    Context-Aware Access: <code>{currentConfig.accessLevel}</code>
                  </li>
                  <li>
                    Gemini Enterprise Zero Trust:{" "}
                    {currentConfig.geminiEnforcePerimeter ? "✓ VPC-SC 境界保護" : "標準"}
                  </li>
                </ul>
              </div>

              <div className="rec-section roi-box">
                <strong>📈 {m.assessRoiHeader}</strong>
                <ul className="roi-list">
                  <li>💰 <strong>{m.assessRoiCostTitle}:</strong> {m.assessRoiCostDesc}</li>
                  <li>⚡ <strong>{m.assessRoiPerfTitle}:</strong> {m.assessRoiPerfDesc}</li>
                  <li>🔒 <strong>{m.assessRoiSecurityTitle}:</strong> {m.assessRoiSecurityDesc}</li>
                </ul>
              </div>

              <button
                className="btn btn-primary btn-block cep-apply-rec-btn"
                onClick={handleApply}
                type="button"
              >
                <CheckCircleIcon size={16} />
                <span>{m.assessApplyRecBtn} ({selectedQuestions.size} 項目反映)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
