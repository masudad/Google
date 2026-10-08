import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import type { Locale } from "../../lib/setup-state";
import {
  ChartIcon,
  CheckCircleIcon,
  DownloadIcon,
  ExclamationCircleIcon,
  ExternalLinkIcon,
  ShieldIcon,
  UploadIcon,
} from "../../components/Icons";
import { parseLogFile } from "./csv";
import { autoMapColumns, mergeMappings, normalizeFile, type NormalizedFile } from "./columns";
import { SANCTIONED_PRESETS } from "./domains";
import { ALL_CHANNELS, analyze, defaultSettings, suggestCorporateDomains } from "./analyze";
import { SAMPLE_FILE_NAME, generateSampleCsv } from "./sample-data";
import { buildDeckHtml } from "./deck-html";
import { buildForensicCsv, buildSummaryJson, downloadTextFile, fileStamp } from "./exports";
import { CHANNEL_COLORS, donutSvg, horizontalBarsSvg, hourHistogramSvg, outcomeBarSvg, stackedBarSvg } from "./charts";
import { getCeraMessages, type CeraMessages } from "./messages";
import type {
  AnalysisResult,
  Channel,
  ColumnKey,
  ColumnMapping,
  DestinationStat,
  EasyPocPreset,
  ParsedFile,
  RoadmapHorizon,
} from "./types";
import { COLUMN_KEYS, THREAT_CHANNELS } from "./types";
import { HIGH_RISK_CATEGORIES } from "./domains";

export interface CeraPageProps {
  locale: Locale;
  workspaceIdentity?: string;
  showEasyPoc?: boolean;
  onOpenEasyPoc?: (preset: EasyPocPreset) => void;
}

interface LoadedFile {
  id: string;
  parsed: ParsedFile;
}

type Step = 1 | 2 | 3;

const CERA_LOGS_URL = "https://goo.gle/cera-logs";
const CERA_HELP_URL = "https://support.google.com/a/answer/9393909";
const MAX_FILE_BYTES = 200 * 1024 * 1024;

function SvgChart({ markup, className = "" }: { markup: string; className?: string }) {
  return <div className={`cera-chart ${className}`} dangerouslySetInnerHTML={{ __html: markup }} />;
}

function Kpi({ label, value, tone = "default", sub }: { label: string; value: string; tone?: "default" | "danger" | "warning" | "success" | "muted"; sub?: string }) {
  return (
    <div className={`cera-kpi cera-kpi-${tone}`}>
      <span className="cera-kpi-value tabular-nums">{value}</span>
      <span className="cera-kpi-label">{label}</span>
      {sub ? <span className="cera-kpi-sub">{sub}</span> : null}
    </div>
  );
}

const NUMERIC_CELL = /^[\d\s.,%+−–-]+$/;

function isNumericCell(cell: ReactNode): boolean {
  return typeof cell === "string" && cell.length > 0 && NUMERIC_CELL.test(cell);
}

function DataTable({ headers, rows, caption }: { headers: ReactNode[]; rows: ReactNode[][]; caption?: string }) {
  if (rows.length === 0) return null;
  // Right-align a column only when its cells are numeric; text columns keep
  // their natural alignment and are allowed to wrap, which keeps the tables
  // inside the half-width report cards.
  const numeric = headers.map((_, column) => column > 0 && rows.some((row) => isNumericCell(row[column])) && rows.every((row) => row[column] === "" || row[column] === "—" || isNumericCell(row[column])));
  return (
    <div className="cera-table-wrap">
      <table className="cera-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} scope="col" className={numeric[i] ? "num" : ""}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className={numeric[c] ? "num" : ""}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "ja" ? "ja-JP" : "en-US");
}

function pct(value: number, locale: Locale): string {
  return `${(value * 100).toLocaleString(locale === "ja" ? "ja-JP" : "en-US", { maximumFractionDigits: 1 })}%`;
}

function dateLabel(timestamp: number | null, offsetMinutes: number): string {
  if (timestamp === null) return "—";
  const local = new Date(timestamp + offsetMinutes * 60_000);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
}

function destinationRows(items: DestinationStat[], m: CeraMessages, locale: Locale, withRisk = false): ReactNode[][] {
  return items.map((item) => {
    const highRisk = withRisk && HIGH_RISK_CATEGORIES.includes(item.category);
    const category = highRisk ? (
      <span className="cera-cat-risk" key="c" title={`${m.report.columns.risk}: ${m.report.columns.highRisk}`}>
        <span aria-hidden="true" className="cera-dot cera-dot-risk" />
        {m.labels.categories[item.category]}
        <span className="sr-only">{` (${m.report.columns.risk}: ${m.report.columns.highRisk})`}</span>
      </span>
    ) : (
      m.labels.categories[item.category]
    );
    return [
      <span className="cera-mono" key="h">{item.host}</span>,
      category,
      fmt(item.actions, locale),
      fmt(item.users, locale),
      fmt(item.sensitive, locale),
      fmt(item.blocked, locale),
    ];
  });
}

export function CeraPage({ locale, workspaceIdentity = "", showEasyPoc = false, onOpenEasyPoc }: CeraPageProps) {
  const m = getCeraMessages(locale);
  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [overrides, setOverrides] = useState<ColumnMapping>({});
  const [showMapping, setShowMapping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [corporateText, setCorporateText] = useState("");
  const [partnerText, setPartnerText] = useState("");
  const [sanctionedAiText, setSanctionedAiText] = useState(defaultSettings().sanctionedAiHosts.join(", "));
  const [sanctionedText, setSanctionedText] = useState(defaultSettings().sanctionedHosts.join(", "));
  const [extraGenAiText, setExtraGenAiText] = useState("");
  const [extraMessagingText, setExtraMessagingText] = useState("");
  const [workStart, setWorkStart] = useState(8);
  const [workEnd, setWorkEnd] = useState(20);
  const [tzHours, setTzHours] = useState<number>(() => {
    const browserOffset = -new Date().getTimezoneOffset() / 60;
    return locale === "ja" ? 9 : browserOffset;
  });
  const [mask, setMask] = useState(true);
  const [deckLocale, setDeckLocale] = useState<Locale>(locale);
  const [reportTitle, setReportTitle] = useState("");
  const [customer, setCustomer] = useState("");

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  const timezoneOffsetMinutes = Math.round(tzHours * 60);

  const normalizedFiles: NormalizedFile[] = useMemo(
    () => files.map((file) => normalizeFile(file.parsed, overrides, timezoneOffsetMinutes)),
    [files, overrides, timezoneOffsetMinutes],
  );

  const allHeaders = useMemo(() => {
    const seen = new Set<string>();
    for (const file of files) for (const header of file.parsed.headers) seen.add(header);
    return Array.from(seen);
  }, [files]);

  const autoMapping = useMemo(() => autoMapColumns(allHeaders), [allHeaders]);
  const effectiveMapping = useMemo(() => mergeMappings(autoMapping.mapping, overrides), [autoMapping, overrides]);
  const mappedCount = COLUMN_KEYS.filter((key) => effectiveMapping[key]).length;
  const totalRows = files.reduce((sum, file) => sum + file.parsed.rows.length, 0);
  const totalEvents = normalizedFiles.reduce((sum, file) => sum + file.events.length, 0);
  const missing = (["timestamp", "event", "actor", "url", "trigger", "result"] as ColumnKey[]).filter((key) => !effectiveMapping[key]);

  const suggestedDomains = useMemo(() => {
    const events = normalizedFiles.flatMap((file) => file.events);
    return suggestCorporateDomains(events, workspaceIdentity);
  }, [normalizedFiles, workspaceIdentity]);

  useEffect(() => {
    if (corporateText.trim() === "" && suggestedDomains.length > 0) {
      setCorporateText(suggestedDomains[0]);
    }
    // Only prefill once data arrives; the operator owns the field afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedDomains.join("|")]);

  const addParsedFiles = useCallback((parsedFiles: ParsedFile[], errors: string[]) => {
    setFiles((current) => {
      const next = [...current];
      for (const parsed of parsedFiles) {
        const id = `${parsed.name}-${parsed.rows.length}-${next.length}-${Date.now()}`;
        next.push({ id, parsed });
      }
      return next;
    });
    setFileErrors(errors);
    setResult(null);
  }, []);

  const ingestFiles = useCallback(
    async (list: FileList | File[]) => {
      const parsedFiles: ParsedFile[] = [];
      const errors: string[] = [];
      for (const file of Array.from(list)) {
        if (file.size > MAX_FILE_BYTES) {
          errors.push(m.ingest.readError(file.name));
          continue;
        }
        try {
          const text = await file.text();
          const parsed = parseLogFile(file.name, text);
          if (parsed.rows.length === 0) {
            errors.push(m.ingest.noRows(file.name));
            continue;
          }
          parsedFiles.push(parsed);
        } catch {
          errors.push(m.ingest.readError(file.name));
        }
      }
      addParsedFiles(parsedFiles, errors);
    },
    [addParsedFiles, m],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer?.files?.length) void ingestFiles(event.dataTransfer.files);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void ingestFiles(event.target.files);
    event.target.value = "";
  };

  const handleSample = () => {
    const csv = generateSampleCsv();
    addParsedFiles([parseLogFile(SAMPLE_FILE_NAME, csv)], []);
    if (!reportTitle) setReportTitle(m.settings.reportTitlePlaceholder);
    // The synthetic tenant is generated with JST business hours; keep the
    // off-hours metrics meaningful regardless of the browser's time zone.
    setTzHours(9);
  };

  const removeFile = (id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
    setResult(null);
  };

  const clearFiles = () => {
    setFiles([]);
    setFileErrors([]);
    setResult(null);
    setOverrides({});
    setStep(1);
  };

  const runAnalysis = () => {
    if (normalizedFiles.length === 0) return;
    setAnalyzing(true);
    setAnalysisError("");
    setTimeout(() => {
      try {
        const next = analyze({
          files: normalizedFiles,
          settings: defaultSettings({
            corporateDomains: corporateText.split(/[\s,;、，]+/),
            partnerDomains: partnerText.split(/[\s,;、，]+/),
            sanctionedAiHosts: sanctionedAiText.split(/[\s,;、，]+/),
            sanctionedHosts: sanctionedText.split(/[\s,;、，]+/),
            extraGenAiHosts: extraGenAiText.split(/[\s,;、，]+/),
            extraMessagingHosts: extraMessagingText.split(/[\s,;、，]+/),
            workHoursStart: workStart,
            workHoursEnd: workEnd,
            timezoneOffsetMinutes,
            maskIdentities: mask,
          }),
        });
        setResult(next);
        setStep(3);
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : String(error));
      } finally {
        setAnalyzing(false);
      }
    }, 20);
  };

  const flashNotice = (text: string) => {
    setExportNotice(text);
    setTimeout(() => setExportNotice(""), 4000);
  };

  const handleDownloadDeck = () => {
    if (!result) return;
    const html = buildDeckHtml(result, { locale: deckLocale, title: reportTitle, customer });
    downloadTextFile(`cera-deck-${fileStamp(result.generatedAt)}.html`, html, "text/html;charset=utf-8");
    flashNotice(m.report.exportDeck);
  };

  const handleDownloadCsv = () => {
    if (!result) return;
    downloadTextFile(`cera-actions-${fileStamp(result.generatedAt)}.csv`, buildForensicCsv(result, getCeraMessages(deckLocale)), "text/csv;charset=utf-8");
    flashNotice(m.report.exportCsv);
  };

  const handleDownloadJson = () => {
    if (!result) return;
    downloadTextFile(`cera-summary-${fileStamp(result.generatedAt)}.json`, buildSummaryJson(result), "application/json;charset=utf-8");
    flashNotice(m.report.exportJson);
  };

  const addSanctionedPreset = (hosts: readonly string[]) => {
    const current = sanctionedText.split(/[\s,;、，]+/).filter(Boolean);
    const merged = [...current];
    for (const host of hosts) if (!merged.includes(host)) merged.push(host);
    setSanctionedText(merged.join(", "));
  };

  const addCorporateDomain = (domain: string) => {
    const current = corporateText.split(/[\s,;、，]+/).filter(Boolean);
    if (!current.includes(domain)) setCorporateText([...current, domain].join(", "));
  };

  const canGoStep2 = totalEvents > 0;
  const canGoStep3 = result !== null;

  const applyButton = (preset: EasyPocPreset) =>
    showEasyPoc && onOpenEasyPoc ? (
      <button className="btn btn-secondary btn-sm cera-apply-btn" onClick={() => onOpenEasyPoc(preset)} type="button">
        <ShieldIcon size={14} />
        <span>
          {m.report.applyInEasyPoc} · {m.labels.presets[preset]}
        </span>
      </button>
    ) : null;

  const renderControl = (ids: string[]) => {
    if (!result) return null;
    const items = result.roadmap.filter((item) => ids.includes(item.id));
    if (items.length === 0) return null;
    return items.map((item) => {
      const copy = m.roadmap[item.id];
      if (!copy) return null;
      return (
        <aside className="cera-control" key={item.id}>
          <p className="cera-control-eyebrow">
            {m.deck.suggestedControls} · {m.deck.easyPocPreset}: {m.labels.presets[item.preset]}
          </p>
          <h4>{copy.title}</h4>
          <p>{copy.rationale(item.metric, item.metricUsers)}</p>
          <ul>
            {copy.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          {applyButton(item.preset)}
        </aside>
      );
    });
  };

  const c = m.report.columns;

  return (
    <main className="cera-page" aria-labelledby="cera-title">
      <header className="cera-hero">
        <div>
          <p className="eyebrow">{m.page.eyebrow}</p>
          <h1 id="cera-title">{m.page.title}</h1>
          <p className="cera-hero-intro">{m.page.intro}</p>
        </div>
        <span className="cera-local-badge">
          <CheckCircleIcon size={16} />
          {m.page.localBadge}
        </span>
      </header>

      <nav className="cera-stepper" aria-label="CERA steps">
        {m.page.steps.map((label, index) => {
          const value = (index + 1) as Step;
          const enabled = value === 1 || (value === 2 && canGoStep2) || (value === 3 && canGoStep3);
          return (
            <button
              aria-current={step === value ? "step" : undefined}
              className={`cera-step ${step === value ? "active" : ""} ${enabled ? "" : "disabled"}`}
              disabled={!enabled}
              key={label}
              onClick={() => setStep(value)}
              type="button"
            >
              <strong>{label}</strong>
              <small>{m.page.stepHints[index]}</small>
            </button>
          );
        })}
      </nav>

      {step === 1 ? (
        <section className="cera-section" aria-labelledby="cera-ingest-title">
          <h2 id="cera-ingest-title">{m.ingest.title}</h2>
          <p>{m.ingest.intro}</p>
          <div className="cera-two-col cera-ingest-grid">
            <div>
              <div
                className={`cera-dropzone ${dragging ? "dragging" : ""}`}
                onDragLeave={() => setDragging(false)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDrop={handleDrop}
                role="group"
                aria-label={m.ingest.dropTitle}
              >
                <UploadIcon size={32} />
                <strong>{m.ingest.dropTitle}</strong>
                <small>{m.ingest.dropHint}</small>
                <div className="cera-dropzone-actions">
                  <button className="btn btn-primary" onClick={() => inputRef.current?.click()} type="button">
                    {m.ingest.browse}
                  </button>
                  <button className="btn btn-secondary" onClick={handleSample} type="button">
                    {m.ingest.sample}
                  </button>
                </div>
                <small className="cera-muted">{m.ingest.sampleHint}</small>
                <input accept=".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,application/json" className="cera-hidden-input" multiple onChange={handleInput} ref={inputRef} type="file" aria-label={m.ingest.browse} />
              </div>

              {fileErrors.length > 0 ? (
                <div className="cera-notice cera-notice-warning" role="alert">
                  <ExclamationCircleIcon size={18} />
                  <ul>
                    {fileErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <h3>{m.ingest.filesTitle}</h3>
              {files.length === 0 ? (
                <p className="cera-muted">{m.ingest.empty}</p>
              ) : (
                <>
                  <DataTable
                    headers={[...m.ingest.fileHeaders, ""]}
                    rows={normalizedFiles.map((file) => [
                      <span className="cera-mono" key="n">{file.file.name}</span>,
                      file.file.format.toUpperCase(),
                      fmt(file.file.rows.length, locale),
                      fmt(file.events.length, locale),
                      fmt(file.skipped, locale),
                      <button className="btn btn-link btn-sm" key="r" onClick={() => removeFile(files[normalizedFiles.indexOf(file)]?.id ?? "")} type="button">
                        {m.ingest.remove}
                      </button>,
                    ])}
                  />
                  <div className="cera-inline-actions">
                    <span className="cera-muted">{m.ingest.totalRows(totalRows, totalEvents)}</span>
                    <button className="btn btn-link btn-sm" onClick={clearFiles} type="button">
                      {m.ingest.clearAll}
                    </button>
                  </div>
                </>
              )}

              {files.length > 0 ? (
                <details className="cera-mapping" open={showMapping || missing.length > 0} onToggle={(event) => setShowMapping((event.target as HTMLDetailsElement).open)}>
                  <summary>
                    <strong>{m.mapping.title}</strong>
                    <span className="cera-muted">{m.mapping.autoMapped(mappedCount, COLUMN_KEYS.length)}</span>
                  </summary>
                  <p>{m.mapping.intro}</p>
                  {missing.length > 0 ? (
                    <div className="cera-notice cera-notice-warning">
                      <ExclamationCircleIcon size={18} />
                      <span>{m.mapping.missing(missing.map((key) => m.mapping.columnLabels[key]).join(", "))}</span>
                    </div>
                  ) : null}
                  <div className="cera-mapping-grid">
                    {COLUMN_KEYS.map((key) => (
                      <label className="cera-field" key={key}>
                        <span>
                          {m.mapping.columnLabels[key]}
                          {key === "timestamp" || key === "actor" ? <em> · {m.mapping.required}</em> : null}
                        </span>
                        <select
                          onChange={(event) => setOverrides((current) => ({ ...current, [key]: event.target.value }))}
                          value={effectiveMapping[key] ?? ""}
                        >
                          <option value="">{m.mapping.ignore}</option>
                          {allHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <div className="cera-inline-actions">
                    {autoMapping.unmapped.length > 0 ? (
                      <span className="cera-muted">
                        {m.mapping.unmapped}: {autoMapping.unmapped.join(", ")}
                      </span>
                    ) : null}
                    <button className="btn btn-link btn-sm" onClick={() => setOverrides({})} type="button">
                      {m.mapping.reset}
                    </button>
                  </div>
                </details>
              ) : null}
            </div>

            <aside className="cera-card">
              <h3>{m.ingest.exportTitle}</h3>
              <ol className="cera-steps-list">
                {m.ingest.exportSteps.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ol>
              <div className="cera-link-list">
                <a className="guide-inline-link" href={CERA_LOGS_URL} rel="noreferrer" target="_blank">
                  {m.ingest.exportLink} <ExternalLinkIcon size={13} />
                </a>
                <a className="guide-inline-link" href={CERA_HELP_URL} rel="noreferrer" target="_blank">
                  {m.ingest.helpLink} <ExternalLinkIcon size={13} />
                </a>
              </div>
              {showEasyPoc && onOpenEasyPoc ? (
                <button className="btn btn-secondary btn-sm" onClick={() => onOpenEasyPoc("audit")} type="button">
                  <ShieldIcon size={14} />
                  <span>{m.ingest.auditLink}</span>
                </button>
              ) : null}
            </aside>
          </div>
          <div className="cera-actions">
            <button className="btn btn-primary" disabled={!canGoStep2} onClick={() => setStep(2)} type="button">
              {m.page.next}
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="cera-section" aria-labelledby="cera-settings-title">
          <h2 id="cera-settings-title">{m.settings.title}</h2>
          <p>{m.settings.intro}</p>
          <div className="cera-settings-grid">
            <label className="cera-field">
              <span>{m.settings.corporateDomains}</span>
              <input onChange={(event) => setCorporateText(event.target.value)} placeholder={m.settings.listPlaceholder} value={corporateText} />
              <small>{m.settings.corporateDomainsHint}</small>
              {suggestedDomains.length > 0 ? (
                <span className="cera-chips">
                  <span className="cera-muted">{m.settings.suggested}:</span>
                  {suggestedDomains.map((domain) => (
                    <button className="cera-chip" key={domain} onClick={() => addCorporateDomain(domain)} type="button">
                      + {domain}
                    </button>
                  ))}
                </span>
              ) : null}
            </label>
            <label className="cera-field">
              <span>{m.settings.partnerDomains}</span>
              <input onChange={(event) => setPartnerText(event.target.value)} placeholder={m.settings.listPlaceholder} value={partnerText} />
              <small>{m.settings.partnerDomainsHint}</small>
            </label>
            <label className="cera-field">
              <span>{m.settings.sanctionedAi}</span>
              <input onChange={(event) => setSanctionedAiText(event.target.value)} value={sanctionedAiText} />
              <small>{m.settings.sanctionedAiHint}</small>
            </label>
            <label className="cera-field cera-field-wide">
              <span>{m.settings.sanctionedSuites}</span>
              <textarea onChange={(event) => setSanctionedText(event.target.value)} rows={3} value={sanctionedText} />
              <small>{m.settings.sanctionedSuitesHint}</small>
              <span className="cera-chips">
                <span className="cera-muted">{m.settings.quickAdd}:</span>
                {SANCTIONED_PRESETS.map((preset) => (
                  <button className="cera-chip" key={preset.id} onClick={() => addSanctionedPreset(preset.hosts)} type="button">
                    + {preset.label}
                  </button>
                ))}
              </span>
            </label>
            <label className="cera-field">
              <span>{m.settings.extraGenAi}</span>
              <input onChange={(event) => setExtraGenAiText(event.target.value)} value={extraGenAiText} />
              <small>{m.settings.extraGenAiHint}</small>
            </label>
            <label className="cera-field">
              <span>{m.settings.extraMessaging}</span>
              <input onChange={(event) => setExtraMessagingText(event.target.value)} value={extraMessagingText} />
              <small>{m.settings.extraMessagingHint}</small>
            </label>
            <div className="cera-field">
              <span>{m.settings.workHours}</span>
              <div className="cera-inline-inputs">
                <input max={23} min={0} onChange={(event) => setWorkStart(Number(event.target.value))} type="number" value={workStart} aria-label={`${m.settings.workHours} start`} />
                <span>–</span>
                <input max={24} min={1} onChange={(event) => setWorkEnd(Number(event.target.value))} type="number" value={workEnd} aria-label={`${m.settings.workHours} end`} />
              </div>
              <small>{m.settings.workHoursHint}</small>
            </div>
            <label className="cera-field">
              <span>{m.settings.timezone}</span>
              <input max={14} min={-12} onChange={(event) => setTzHours(Number(event.target.value))} step={0.5} type="number" value={tzHours} />
              <small>{m.settings.timezoneHint}</small>
            </label>
            <label className="cera-field cera-field-check">
              <input checked={mask} onChange={(event) => setMask(event.target.checked)} type="checkbox" />
              <span>
                <strong>{m.settings.mask}</strong>
                <small>{m.settings.maskHint}</small>
              </span>
            </label>
            <label className="cera-field">
              <span>{m.settings.deckLanguage}</span>
              <select onChange={(event) => setDeckLocale(event.target.value as Locale)} value={deckLocale}>
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="cera-field">
              <span>{m.settings.reportTitle}</span>
              <input onChange={(event) => setReportTitle(event.target.value)} placeholder={m.settings.reportTitlePlaceholder} value={reportTitle} />
            </label>
            <label className="cera-field">
              <span>{m.settings.customer}</span>
              <input onChange={(event) => setCustomer(event.target.value)} placeholder={m.settings.customerPlaceholder} value={customer} />
            </label>
          </div>
          {analysisError ? (
            <div className="cera-notice cera-notice-danger" role="alert">
              <ExclamationCircleIcon size={18} />
              <span>{analysisError}</span>
            </div>
          ) : null}
          <div className="cera-actions">
            <button className="btn btn-secondary" onClick={() => setStep(1)} type="button">
              {m.page.back}
            </button>
            <button className="btn btn-primary" disabled={analyzing || !canGoStep2} onClick={runAnalysis} type="button">
              <ChartIcon size={16} />
              <span>{analyzing ? m.page.analyzing : result ? m.page.reanalyze : m.page.analyze}</span>
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 && result ? (
        <section className="cera-section cera-report" aria-labelledby="cera-report-title">
          <div className="cera-report-head">
            <div>
              <h2 id="cera-report-title">{reportTitle || m.report.title}</h2>
              <p>
                {m.report.intro(result.totals.events, result.totals.actions, result.dateRange.days)} {m.report.period}: {dateLabel(result.dateRange.start, timezoneOffsetMinutes)} – {dateLabel(result.dateRange.end, timezoneOffsetMinutes)}
              </p>
            </div>
            <div className="cera-export-bar">
              <button className="btn btn-primary" onClick={handleDownloadDeck} type="button">
                <DownloadIcon size={16} />
                <span>{m.report.exportDeck}</span>
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadCsv} type="button">
                {m.report.exportCsv}
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadJson} type="button">
                {m.report.exportJson}
              </button>
              <small className="cera-muted">{m.report.exportDeckHint}</small>
              {exportNotice ? (
                <span className="cera-export-notice" role="status">
                  <CheckCircleIcon size={14} /> {exportNotice}
                </span>
              ) : null}
            </div>
          </div>

          {result.totals.actions === 0 ? (
            <div className="cera-notice cera-notice-warning" role="alert">
              <ExclamationCircleIcon size={18} />
              <span>{m.report.noData}</span>
            </div>
          ) : null}

          <div className="cera-kpi-grid">
            <Kpi label={m.report.kpis.outbound} value={fmt(result.totals.outbound, locale)} />
            <Kpi label={m.report.kpis.threat} tone="danger" value={fmt(result.totals.threatActions, locale)} sub={`${fmt(result.totals.threatUsers, locale)} ${c.users}`} />
            <Kpi label={m.report.kpis.sensitive} tone="warning" value={fmt(result.totals.sensitiveOutbound, locale)} />
            <Kpi label={m.report.kpis.shadowAi} tone="warning" value={fmt(result.channels.shadow_ai.actions, locale)} sub={`${fmt(result.channels.shadow_ai.users, locale)} ${c.users}`} />
            <Kpi label={m.report.kpis.personal} tone="danger" value={fmt(result.channels.personal_account.actions, locale)} sub={`${fmt(result.channels.personal_account.users, locale)} ${c.users}`} />
            <Kpi label={m.report.kpis.unmanaged} value={fmt(result.channels.unmanaged.actions, locale)} sub={`${fmt(result.channels.unmanaged.users, locale)} ${c.users}`} />
            <Kpi label={m.report.kpis.messaging} value={fmt(result.channels.messaging.actions, locale)} />
            <Kpi label={m.report.kpis.downloads} tone="muted" value={fmt(result.totals.downloads, locale)} />
            <Kpi label={m.report.kpis.prints} tone="muted" value={fmt(result.totals.prints, locale)} />
            <Kpi label={m.report.kpis.blocked} tone="muted" value={fmt(result.totals.blocked, locale)} />
            <Kpi label={m.report.kpis.users} tone="muted" value={fmt(result.totals.users, locale)} />
            <Kpi label={m.report.kpis.destinations} tone="muted" value={fmt(result.totals.destinations, locale)} />
          </div>

          <div className="cera-grid-2 cera-grid-wide-left cera-grid-wider-left">
            <article className="cera-card">
              <h3>{m.report.sections.matrix}</h3>
              <p className="cera-muted">{m.report.sections.matrixIntro}</p>
              <DataTable
                headers={[c.channel, c.actions, c.uploads, c.pastes, c.users, c.sensitive, c.blocked, c.allowed]}
                rows={ALL_CHANNELS.map((channel: Channel) => {
                  const s = result.channels[channel];
                  const threat = THREAT_CHANNELS.includes(channel);
                  return [
                    <span className={`cera-channel ${threat ? "" : "cera-channel-benign"}`} key="c">
                      <i className={`cera-dot cera-dot-${channel}`} aria-hidden="true" />
                      <span>
                        <strong>{m.labels.channels[channel]}</strong>
                        <small>{m.labels.channelDescriptions[channel]}</small>
                      </span>
                    </span>,
                    fmt(s.actions, locale),
                    fmt(s.uploads, locale),
                    fmt(s.pastes, locale),
                    fmt(s.users, locale),
                    fmt(s.sensitive, locale),
                    fmt(s.blocked + s.warned, locale),
                    fmt(s.allowed + s.bypassed, locale),
                  ];
                })}
              />
            </article>
            <article className="cera-card cera-card-center">
              <h3>{m.report.kpis.threat}</h3>
              <SvgChart
                markup={donutSvg(
                  THREAT_CHANNELS.map((channel) => ({ label: m.labels.channels[channel], value: result.channels[channel].actions, color: CHANNEL_COLORS[channel] })),
                  220,
                  c.actions,
                  fmt(result.totals.threatActions, locale),
                )}
              />
              <ul className="cera-legend">
                {THREAT_CHANNELS.map((channel) => (
                  <li key={channel}>
                    <i className={`cera-dot cera-dot-${channel}`} aria-hidden="true" />
                    {m.labels.channels[channel]} <strong className="tabular-nums">{fmt(result.channels[channel].actions, locale)}</strong>
                  </li>
                ))}
              </ul>
              <div className="cera-mini-kpis">
                <Kpi label={m.report.kpis.offHours} tone="warning" value={pct(result.concentration.offHoursShare, locale)} />
                <Kpi label={m.report.kpis.weekend} tone="warning" value={pct(result.concentration.weekendShare, locale)} />
                <Kpi label={m.report.kpis.hhi} tone="muted" value={fmt(Math.round(result.concentration.destinationHhi * 10000), locale)} />
                <Kpi label={m.report.kpis.topUsers} tone="muted" value={pct(result.concentration.top10PercentUserShare, locale)} />
                <Kpi label={m.report.kpis.multiPortal} tone="muted" value={fmt(result.concentration.multiPortalUsers, locale)} />
              </div>
            </article>
          </div>

          <article className="cera-card">
            <h3>{m.report.sections.daily}</h3>
            <p className="cera-muted">{m.report.sections.dailyIntro}</p>
            <div className="cera-grid-2 cera-grid-wide-left">
              <div>
                <SvgChart
                  className="cera-chart-wide"
                  markup={stackedBarSvg({
                    width: 760,
                    height: 300,
                    categories: result.daily.map((p) => p.date),
                    series: [
                      { label: m.deck.legendUploads, color: "#1967d2", values: result.daily.map((p) => p.uploads) },
                      { label: m.deck.legendPastes, color: "#8ab4f8", values: result.daily.map((p) => p.pastes) },
                    ],
                    line: { label: m.deck.legendSensitive, color: "#c5221f", values: result.daily.map((p) => p.sensitive) },
                    highlight: new Set(result.anomalies.map((a) => a.date)),
                    ariaLabel: m.report.sections.daily,
                  })}
                />
                {result.peakDay ? <p className="cera-muted">{m.report.peakDay(result.peakDay.date, result.peakDay.outbound)}</p> : null}
              </div>
              <div>
                <h4>{m.deck.hourLabel}</h4>
                <SvgChart markup={hourHistogramSvg(result.concentration.hourHistogram, 360, 110, result.settings.workHoursStart, result.settings.workHoursEnd)} />
                <h4>{m.report.sections.anomalies}</h4>
                {result.anomalies.length > 0 ? (
                  <DataTable headers={[c.date, c.actions, c.zScore, c.baseline]} rows={result.anomalies.map((a) => [a.date, fmt(a.outbound, locale), String(a.zScore), String(a.baseline)])} />
                ) : (
                  <p className="cera-muted">{m.report.sections.noAnomalies}</p>
                )}
              </div>
            </div>
          </article>

          <div className="cera-grid-2 cera-grid-wide-left cera-grid-wider-left">
            <article className="cera-card">
              <h3>{m.report.sections.orgUnits}</h3>
              <DataTable
                headers={[c.orgUnit, c.uploads, c.pastes, c.downloads, c.prints, c.sensitive, c.threat, c.users]}
                rows={result.orgUnits.map((ou) => [ou.orgUnit, fmt(ou.uploads, locale), fmt(ou.pastes, locale), fmt(ou.downloads, locale), fmt(ou.prints, locale), fmt(ou.sensitive, locale), fmt(ou.threat, locale), fmt(ou.users, locale)])}
              />
            </article>
            <article className="cera-card">
              <h3>{m.report.sections.categories}</h3>
              {result.categories.length > 0 ? (
                <SvgChart
                  markup={horizontalBarsSvg(
                    result.categories.map((cat) => ({
                      label: m.labels.categories[cat.category],
                      value: cat.actions,
                      color: cat.category === "genai" ? "#e37400" : HIGH_RISK_CATEGORIES.includes(cat.category) ? "#c5221f" : "#1967d2",
                      suffix: ` · ${pct(cat.share, locale)}`,
                    })),
                    340,
                    26,
                    136,
                  )}
                />
              ) : (
                <p className="cera-muted">{m.deck.noneObserved}</p>
              )}
            </article>
          </div>

          <div className="cera-grid-2">
            <article className="cera-card">
              <h3>
                <i className="cera-dot cera-dot-personal_account" aria-hidden="true" />
                {m.report.sections.personal}
              </h3>
              <div className="cera-mini-kpis">
                <Kpi label={c.actions} tone="danger" value={fmt(result.channels.personal_account.actions, locale)} />
                <Kpi label={c.users} value={fmt(result.channels.personal_account.users, locale)} />
                <Kpi label={c.sensitive} tone="warning" value={fmt(result.channels.personal_account.sensitive, locale)} />
                <Kpi label={`${m.labels.channels.personal_account} + ${m.labels.channels.sanctioned}`} tone="muted" value={fmt(result.concentration.usersWithPersonalAndCorporate, locale)} />
              </div>
              <DataTable headers={[c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked]} rows={destinationRows(result.personalAccountDestinations.slice(0, 8), m, locale)} />
              <DataTable headers={[c.identityDomain, c.actions, c.users]} rows={result.personalIdentityDomains.map((row) => [<span className="cera-mono" key="d">{row.domain}</span>, fmt(row.actions, locale), fmt(row.users, locale)])} />
              {renderControl(["personal_account_block"])}
            </article>
            <article className="cera-card">
              <h3>
                <i className="cera-dot cera-dot-shadow_ai" aria-hidden="true" />
                {m.report.sections.shadowAi}
              </h3>
              <div className="cera-mini-kpis">
                <Kpi label={m.labels.channels.shadow_ai} tone="danger" value={fmt(result.channels.shadow_ai.actions, locale)} sub={`${fmt(result.channels.shadow_ai.users, locale)} ${c.users}`} />
                <Kpi label={`${m.labels.channels.shadow_ai} · ${c.sensitive}`} tone="warning" value={fmt(result.channels.shadow_ai.sensitive, locale)} />
                <Kpi label={`${m.labels.channels.shadow_ai} · ${c.pastes}`} tone="muted" value={result.channels.shadow_ai.actions ? pct(result.channels.shadow_ai.pastes / result.channels.shadow_ai.actions, locale) : "0%"} />
                <Kpi label={m.labels.channels.sanctioned_ai} tone="success" value={fmt(result.channels.sanctioned_ai.actions, locale)} sub={`${fmt(result.channels.sanctioned_ai.users, locale)} ${c.users}`} />
              </div>
              <DataTable caption={m.labels.channels.shadow_ai} headers={[c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked]} rows={destinationRows(result.shadowAiDestinations.slice(0, 8), m, locale)} />
              <DataTable caption={m.labels.channels.sanctioned_ai} headers={[c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked]} rows={destinationRows(result.sanctionedAiDestinations.slice(0, 4), m, locale)} />
              {renderControl(["shadow_ai_block", "sanctioned_ai_dlp"])}
            </article>
          </div>

          <div className="cera-grid-2">
            <article className="cera-card">
              <h3>
                <i className="cera-dot cera-dot-unmanaged" aria-hidden="true" />
                {m.report.sections.unmanaged}
              </h3>
              <div className="cera-mini-kpis">
                <Kpi label={c.actions} tone="danger" value={fmt(result.channels.unmanaged.actions, locale)} sub={`${fmt(result.channels.unmanaged.users, locale)} ${c.users}`} />
                <Kpi label={c.sensitive} tone="warning" value={fmt(result.channels.unmanaged.sensitive, locale)} />
                <Kpi label={m.report.kpis.destinations} tone="muted" value={fmt(result.unmanagedDestinations.length, locale)} />
              </div>
              <DataTable headers={[c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked]} rows={destinationRows(result.unmanagedDestinations, m, locale, true)} />
              {renderControl(["unmanaged_warn"])}
            </article>
            <article className="cera-card">
              <h3>
                <i className="cera-dot cera-dot-messaging" aria-hidden="true" />
                {m.report.sections.messaging}
              </h3>
              <div className="cera-mini-kpis">
                <Kpi label={c.actions} tone="danger" value={fmt(result.channels.messaging.actions, locale)} sub={`${fmt(result.channels.messaging.users, locale)} ${c.users}`} />
                <Kpi label={c.uploads} value={fmt(result.channels.messaging.uploads, locale)} />
                <Kpi label={c.pastes} value={fmt(result.channels.messaging.pastes, locale)} />
                <Kpi label={c.sensitive} tone="warning" value={fmt(result.channels.messaging.sensitive, locale)} />
              </div>
              <DataTable headers={[c.destination, c.category, c.actions, c.users, c.sensitive, c.blocked]} rows={destinationRows(result.messagingDestinations.slice(0, 8), m, locale)} />
              <DataTable
                caption={c.user}
                headers={[c.user, c.orgUnit, c.actions, c.sensitive, c.destination]}
                rows={result.channels.messaging.topUsers.slice(0, 5).map((user) => [<span className="cera-mono" key="u">{user.actorMasked}</span>, user.orgUnit || "—", fmt(user.actions, locale), fmt(user.sensitive, locale), fmt(user.destinations, locale)])}
              />
            </article>
          </div>

          <div className="cera-grid-2">
            <article className="cera-card">
              <h3>{m.report.sections.print}</h3>
              <div className="cera-mini-kpis">
                <Kpi label={c.prints} value={fmt(result.print.actions, locale)} />
                <Kpi label={c.users} value={fmt(result.print.users, locale)} />
                <Kpi label={c.sensitive} tone="warning" value={fmt(result.print.sensitive, locale)} />
                <Kpi label={c.blocked} tone="muted" value={fmt(result.print.blocked, locale)} />
              </div>
              <DataTable caption={c.document} headers={[c.document, c.actions]} rows={result.print.topDocuments.map((doc) => [doc.name, fmt(doc.actions, locale)])} />
              <DataTable caption={c.user} headers={[c.user, c.orgUnit, c.actions, c.sensitive]} rows={result.print.topUsers.slice(0, 6).map((user) => [<span className="cera-mono" key="u">{user.actorMasked}</span>, user.orgUnit || "—", fmt(user.actions, locale), fmt(user.sensitive, locale)])} />
              {renderControl(["print_watermark"])}
            </article>
            <article className="cera-card">
              <h3>{m.report.sections.inbound}</h3>
              <div className="cera-mini-kpis">
                <Kpi label={c.downloads} value={fmt(result.inbound.downloads, locale)} sub={`${fmt(result.inbound.users, locale)} ${c.users}`} />
                <Kpi label={c.malware} tone="danger" value={fmt(result.inbound.malware, locale)} />
                <Kpi label={c.unscanned} tone="warning" value={fmt(result.inbound.unscanned, locale)} />
                <Kpi label={c.sensitive} tone="warning" value={fmt(result.inbound.sensitive, locale)} />
              </div>
              <DataTable caption={c.source} headers={[c.source, c.category, c.actions, c.users, c.sensitive, c.blocked]} rows={destinationRows(result.inbound.topSources.slice(0, 6), m, locale)} />
              <p className="cera-pill-row">
                {result.inbound.topFileTypes.map((ft) => (
                  <span className="cera-pill" key={ft.type}>
                    {ft.type} {fmt(ft.actions, locale)}
                  </span>
                ))}
              </p>
              <h4>{m.report.sections.policy}</h4>
              <SvgChart markup={outcomeBarSvg({ blocked: result.totals.blocked, warned: result.totals.warned, bypassed: result.totals.bypassed, detected: result.totals.detected, allowed: result.totals.allowed }, { blocked: c.blocked, warned: c.warned, bypassed: c.bypassed, detected: c.detected, allowed: c.allowed }, 520)} />
              <DataTable headers={[c.rule, c.actions, c.blocked, c.warned, c.bypassed, c.allowed]} rows={result.rules.slice(0, 8).map((rule) => [rule.rule, fmt(rule.actions, locale), fmt(rule.blocked, locale), fmt(rule.warned, locale), fmt(rule.bypassed, locale), fmt(rule.allowed + rule.detected, locale)])} />
              {renderControl(["download_scanning"])}
            </article>
          </div>

          <article className="cera-card">
            <h3>{m.report.sections.signals}</h3>
            <div className="cera-kpi-grid">
              <Kpi label={c.malware} tone="danger" value={fmt(result.signals.malware, locale)} />
              <Kpi label={c.unscanned} tone="warning" value={fmt(result.signals.unscanned, locale)} />
              <Kpi label="Password reuse" tone="danger" value={fmt(result.signals.passwordReuse, locale)} sub={`${fmt(result.signals.passwordReuseUsers, locale)} ${c.users}`} />
              <Kpi label="Unsafe site visits" tone="warning" value={fmt(result.signals.unsafeSiteVisits, locale)} />
              <Kpi label="URL filtering" tone="muted" value={fmt(result.signals.urlFilteringInterstitials, locale)} />
              <Kpi label="Login events" tone="muted" value={fmt(result.signals.loginEvents, locale)} />
              <Kpi label={c.extension} tone="muted" value={fmt(result.signals.extensionInstalls, locale)} sub={`${fmt(result.signals.distinctExtensions, locale)} distinct`} />
              <Kpi label="Browser launches" tone="muted" value={fmt(result.signals.browserLaunches, locale)} />
            </div>
            <div className="cera-grid-2">
              <DataTable caption="Unsafe hosts" headers={["Host", c.events]} rows={result.signals.topUnsafeHosts.map((h) => [<span className="cera-mono" key="h">{h.host}</span>, fmt(h.events, locale)])} />
              <DataTable caption={c.extension} headers={[c.extension, c.installs]} rows={result.signals.topExtensions.map((e) => [e.name, fmt(e.installs, locale)])} />
            </div>
            {renderControl(["password_alert"])}
          </article>

          <article className="cera-card">
            <h3>{m.report.sections.roadmap}</h3>
            <p className="cera-muted">{m.deck.roadmapSubtitle}</p>
            <div className="cera-roadmap-grid">
              {(["now", "next", "later"] as RoadmapHorizon[]).map((horizon) => (
                <div className="cera-road-col" key={horizon}>
                  <h4>
                    {m.labels.horizons[horizon]} <small>{m.labels.horizonWindows[horizon]}</small>
                  </h4>
                  {result.roadmap
                    .filter((item) => item.horizon === horizon)
                    .map((item) => {
                      const copy = m.roadmap[item.id];
                      if (!copy) return null;
                      return (
                        <div className="cera-road-card" key={item.id}>
                          <span className="cera-pill cera-pill-preset">{m.labels.presets[item.preset]}</span>
                          <strong>{copy.title}</strong>
                          <p>{copy.rationale(item.metric, item.metricUsers)}</p>
                          <ul>
                            {copy.actions.map((action) => (
                              <li key={action}>{action}</li>
                            ))}
                          </ul>
                          {applyButton(item.preset)}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
            {showEasyPoc ? <p className="cera-muted">{m.report.applyHint}</p> : null}
          </article>

          <details className="cera-card cera-methodology">
            <summary>
              <strong>{m.report.sections.methodology}</strong>
            </summary>
            <ul>
              {m.report.methodologyItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <DataTable headers={[...m.ingest.fileHeaders]} rows={result.files.map((file) => [<span className="cera-mono" key="n">{file.name}</span>, file.format.toUpperCase(), fmt(file.rows, locale), fmt(file.parsedEvents, locale), fmt(file.skippedRows, locale)])} />
            {result.unmappedHeaders.length > 0 ? (
              <p className="cera-muted">
                {m.mapping.unmapped}: {result.unmappedHeaders.join(", ")}
              </p>
            ) : null}
          </details>

          <div className="cera-actions">
            <button className="btn btn-secondary" onClick={() => setStep(2)} type="button">
              {m.page.back}
            </button>
            <button className="btn btn-primary" onClick={handleDownloadDeck} type="button">
              <DownloadIcon size={16} />
              <span>{m.report.exportDeck}</span>
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
