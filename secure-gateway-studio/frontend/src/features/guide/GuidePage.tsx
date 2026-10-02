import { useState, type ReactNode } from "react";
import type { Messages } from "../../i18n/messages";
import { BookIcon, CheckIcon, CodeIcon, InfoIcon, NetworkIcon, ShieldIcon } from "../../components/Icons";
import { runtimeCapabilities } from "../../lib/api";

interface GuidePageProps {
  messages: Messages;
  onNavigate?: (view: "setup" | "evidence" | "guide" | "deployments" | "cepDeployer") => void;
}

export function renderInlineLinks(text: string): ReactNode {
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, label, href] = match;
    parts.push(
      <a
        key={`${href}-${match.index}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="guide-inline-link"
      >
        {label} ↗
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (parts.length === 0) {
    return text;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function GuidePage({ messages, onNavigate }: GuidePageProps) {
  const guide = messages.guide;
  const [activeGuideTab, setActiveGuideTab] = useState<"easyPoc" | "sgw">(() =>
    runtimeCapabilities.cepDeployer ? "easyPoc" : "sgw",
  );

  const isEasyPoc = activeGuideTab === "easyPoc";
  const activeGuide = isEasyPoc ? guide.easyPocGuide : guide;

  const architectures = isEasyPoc
    ? guide.easyPocGuide.scenarios.map((scenario) => ({
        eyebrow: scenario.eyebrow,
        title: scenario.title,
        summary: scenario.summary,
        estimatedCost: scenario.estimatedTime,
        costFixed: scenario.targetScope,
        costVariable: scenario.authRequirement,
        nodes: scenario.nodes,
        supports: scenario.supports,
      }))
    : runtimeCapabilities.internalHttpsLbArchitecture
      ? guide.architectures
      : guide.architectures.filter((_architecture, index) => index !== 1);

  const architectureTitle = isEasyPoc
    ? guide.easyPocGuide.scenariosTitle
    : runtimeCapabilities.internalHttpsLbArchitecture
      ? guide.architectureTitle
      : guide.extensionArchitectureTitle;

  const architectureIntro = isEasyPoc
    ? guide.easyPocGuide.scenariosIntro
    : runtimeCapabilities.internalHttpsLbArchitecture
      ? guide.architectureIntro
      : guide.extensionArchitectureIntro;

  const costTag = isEasyPoc ? guide.easyPocGuide.scopeTag : guide.costTag;
  const fixedCostLabel = isEasyPoc ? guide.easyPocGuide.targetLabel : guide.fixedCostLabel;
  const variableCostLabel = isEasyPoc
    ? guide.easyPocGuide.authRequirementLabel
    : guide.variableCostLabel;

  return (
    <main className="guide-page">
      {/* ABOVE THE FOLD: Portal Header + Shared Primer (Common to Both Workflows) */}
      <header className="guide-portal-header">
        <p className="eyebrow">{guide.portalEyebrow}</p>
        <h1>{guide.portalTitle}</h1>
        <p className="guide-portal-intro">{renderInlineLinks(guide.portalIntro)}</p>
      </header>

      {/* SHARED SECTION: 3 Building Blocks + 3 Preparation Steps + Glossary */}
      <section
        className="guide-beginner-section"
        id="beginner-primer-section"
        aria-labelledby="guide-beginner-title"
      >
        <header className="guide-beginner-header">
          <p className="eyebrow">{guide.beginnerEyebrow}</p>
          <h2 id="guide-beginner-title">{guide.beginnerTitle}</h2>
          <p>{renderInlineLinks(guide.beginnerIntro)}</p>
        </header>

        <div className="guide-pillars-grid">
          {guide.beginnerPillars.map((pillar) => (
            <article className="guide-pillar-card" key={pillar.badge}>
              <span className="guide-pillar-badge">{pillar.badge}</span>
              <h3>{renderInlineLinks(pillar.title)}</h3>
              <p className="guide-pillar-analogy">{renderInlineLinks(pillar.analogy)}</p>
              <p className="guide-pillar-desc">{renderInlineLinks(pillar.description)}</p>
              {pillar.whereUrl ? (
                <p className="guide-pillar-where">{renderInlineLinks(pillar.whereUrl)}</p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="guide-step-zero-box">
          <header className="guide-step-zero-header">
            <p className="eyebrow">{guide.stepZeroEyebrow}</p>
            <h3>{guide.stepZeroTitle}</h3>
            <p>{renderInlineLinks(guide.stepZeroIntro)}</p>
          </header>

          <div className="guide-step-zero-grid">
            {guide.stepZeroChecklist.map((prep, index) => (
              <article className="guide-step-zero-card" key={prep.stepBadge}>
                <div className="guide-step-zero-top">
                  <span className="guide-step-zero-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <span className="guide-step-zero-badge">{prep.stepBadge}</span>
                    <h4>{renderInlineLinks(prep.title)}</h4>
                  </div>
                </div>
                <p className="guide-step-zero-summary">{renderInlineLinks(prep.summary)}</p>
                <ul className="guide-step-zero-list">
                  {prep.details.map((detail) => (
                    <li key={detail}>
                      <CheckIcon size={15} />
                      <span>{renderInlineLinks(detail)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <details className="guide-glossary-details">
          <summary className="guide-glossary-summary">
            <span className="guide-glossary-summary-title">
              <BookIcon size={18} />
              <span>{guide.glossaryTitle}</span>
            </span>
            <small className="guide-glossary-summary-hint">{guide.glossaryEyebrow}</small>
          </summary>
          <div className="guide-glossary-body">
            <p className="guide-glossary-intro">{renderInlineLinks(guide.glossaryIntro)}</p>
            <div className="guide-glossary-table-wrap">
              <table className="guide-glossary-table">
                <thead>
                  <tr>
                    <th scope="col">{guide.glossaryTermHeader}</th>
                    <th scope="col">{guide.glossaryAnalogyHeader}</th>
                    <th scope="col">{guide.glossaryMeaningHeader}</th>
                  </tr>
                </thead>
                <tbody>
                  {guide.glossaryItems.map((item) => (
                    <tr key={item.term}>
                      <td className="guide-glossary-term">{item.term}</td>
                      <td className="guide-glossary-analogy">{item.analogy}</td>
                      <td className="guide-glossary-meaning">{renderInlineLinks(item.meaning)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>

      {/* WORKFLOW MODE SWITCHER: Easy PoC Guide vs. Secure Gateway Deployer Guide */}
      <div className="guide-mode-tabs" role="tablist" aria-label={guide.portalTitle}>
        <button
          type="button"
          role="tab"
          id="guide-tab-easy-poc"
          aria-selected={isEasyPoc}
          aria-controls="guide-tabpanel-content"
          className={`guide-mode-tab ${isEasyPoc ? "active" : ""}`}
          onClick={() => setActiveGuideTab("easyPoc")}
        >
          <span className="guide-mode-tab-icon" aria-hidden="true">
            <ShieldIcon size={24} />
          </span>
          <span className="guide-mode-tab-copy">
            <strong>{guide.easyPocTabLabel}</strong>
            <small>{guide.easyPocTabSubtitle}</small>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          id="guide-tab-sgw"
          aria-selected={!isEasyPoc}
          aria-controls="guide-tabpanel-content"
          className={`guide-mode-tab ${!isEasyPoc ? "active" : ""}`}
          onClick={() => setActiveGuideTab("sgw")}
        >
          <span className="guide-mode-tab-icon" aria-hidden="true">
            <NetworkIcon size={24} />
          </span>
          <span className="guide-mode-tab-copy">
            <strong>{guide.sgwTabLabel}</strong>
            <small>{guide.sgwTabSubtitle}</small>
          </span>
        </button>
      </div>

      {/* Active Guide Content Panel (Workflow-Specific Only) */}
      <div
        id="guide-tabpanel-content"
        role="tabpanel"
        aria-labelledby={isEasyPoc ? "guide-tab-easy-poc" : "guide-tab-sgw"}
        className="guide-tabpanel"
      >
        {/* Active Guide Banner + Direct Action CTA */}
        <header className="guide-heading">
          <div className="guide-heading-row">
            <div>
              <p className="eyebrow">{activeGuide.eyebrow}</p>
              <h2>{activeGuide.title}</h2>
              <p>{renderInlineLinks(activeGuide.intro)}</p>
            </div>
            {onNavigate ? (
              <div className="guide-heading-actions">
                {isEasyPoc ? (
                  <button
                    type="button"
                    className="guide-cta-button"
                    onClick={() => onNavigate("cepDeployer")}
                  >
                    <ShieldIcon size={18} />
                    <span>{guide.openEasyPocCta}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="guide-cta-button"
                    onClick={() => onNavigate("setup")}
                  >
                    <NetworkIcon size={18} />
                    <span>{guide.openSgwDeployerCta}</span>
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </header>

        {/* Sticky 4-Chapter Navigation in Chronological Order */}
        <nav className="guide-sticky-nav" aria-label="Guide navigation">
          <a className="guide-nav-pill" href="#technical-deep-dive-section">
            1. {activeGuide.technicalDeepDiveTitle}
          </a>
          <a className="guide-nav-pill" href="#architecture-section">
            2. {activeGuide.quickOverviewTitle}
          </a>
          <a className="guide-nav-pill" href="#implementation-section">
            3. {activeGuide.implementationTitle}
          </a>
          <a className="guide-nav-pill" href="#faq-section">
            4. {activeGuide.faqTitle}
          </a>
          <a className="guide-nav-pill" href="#beginner-primer-section">
            ↑ {guide.beginnerNavLabel}
          </a>
        </nav>

        <aside className="guide-poc-notice">
          <InfoIcon size={24} />
          <div>
            <strong>{activeGuide.pocNoticeTitle}</strong>
            <p>{renderInlineLinks(activeGuide.pocNoticeBody)}</p>
          </div>
        </aside>

        {/* CHAPTER 1: Step-by-Step Operating Walkthrough (with Technical / API drawers collapsed by default) */}
        <section
          className="technical-deep-dive-section"
          id="technical-deep-dive-section"
          aria-labelledby="technical-deep-dive-title"
        >
          <header className="architecture-heading">
            <p className="eyebrow">{activeGuide.technicalEyebrow}</p>
            <h2 id="technical-deep-dive-title">{activeGuide.technicalDeepDiveTitle}</h2>
            <p>{renderInlineLinks(activeGuide.technicalDeepDiveIntro)}</p>
          </header>

          <div className="guide-step-jump-bar" aria-label="Step quick navigation">
            {activeGuide.steps.map((_s, idx) => (
              <a className="guide-step-jump-pill" href={`#guide-step-${idx + 1}`} key={idx}>
                #{idx + 1}
              </a>
            ))}
          </div>

          <ol className="guide-steps">
            {activeGuide.steps.map((step, index) => (
              <li className="guide-step technical-step-card" id={`guide-step-${index + 1}`} key={step.title}>
                <div className="guide-step-number" aria-hidden="true">
                  {index + 1}
                </div>
                <div className="guide-step-copy">
                  <div className="step-title-group">
                    <span className="step-badge">{activeGuide.stepLabel(index + 1)}</span>
                    <h2>{step.title}</h2>
                    {step.subtitle && <p className="step-subtitle">{renderInlineLinks(step.subtitle)}</p>}
                  </div>
                  <p className="step-summary-text">{renderInlineLinks(step.summary)}</p>

                  <div className="step-section-block">
                    <h4 className="step-subheading">
                      <CheckIcon size={16} />
                      <span>{guide.checklistLabel}</span>
                    </h4>
                    <ul className="step-actions-list">
                      {step.actions.map((action) => (
                        <li key={action}>
                          <CheckIcon size={16} />
                          <span>{renderInlineLinks(action)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.safetyNote && (
                    <div className="step-safety-note">
                      <ShieldIcon size={18} />
                      <div>
                        <strong>{guide.safetyGuardrailLabel}</strong>
                        <p>{renderInlineLinks(step.safetyNote)}</p>
                      </div>
                    </div>
                  )}

                  {step.optionsBehavior && step.optionsBehavior.length > 0 && (
                    <div className="step-section-block">
                      <details className="step-collapsible">
                        <summary className="step-collapsible-summary">
                          <NetworkIcon size={16} />
                          <span>{guide.optionsBehaviorLabel} ({step.optionsBehavior.length})</span>
                        </summary>
                        <div className="options-behavior-grid">
                          {step.optionsBehavior.map((opt) => (
                            <div className="option-behavior-card" key={opt.name}>
                              <strong>{opt.name}</strong>
                              <p>{renderInlineLinks(opt.behavior)}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {step.apiCalls && step.apiCalls.length > 0 && (
                    <div className="step-section-block">
                      <details className="step-collapsible">
                        <summary className="step-collapsible-summary">
                          <CodeIcon size={16} />
                          <span>{guide.apiCallsLabel} ({step.apiCalls.length})</span>
                        </summary>
                        <div className="api-calls-list">
                          {step.apiCalls.map((api) => (
                            <div className="api-call-row" key={`${api.method}-${api.endpoint}`}>
                              <span className={`api-badge api-badge-${api.method.toLowerCase()}`}>
                                {api.method}
                              </span>
                              <div className="api-call-content">
                                <code className="api-endpoint">{api.endpoint}</code>
                                <p className="api-purpose">{renderInlineLinks(api.purpose)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CHAPTER 3: Architecture / Scenarios Visual Overview & Feature Inventory */}
        <section className="architecture-section" id="architecture-section" aria-labelledby="architecture-title">
          <header className="architecture-heading">
            <p className="eyebrow">{activeGuide.quickOverviewTitle}</p>
            <h2 id="architecture-title">{architectureTitle}</h2>
            <p>{renderInlineLinks(architectureIntro)}</p>
            {!isEasyPoc && !runtimeCapabilities.internalHttpsLbArchitecture ? (
              <p>{renderInlineLinks(guide.extensionArchitectureNote)}</p>
            ) : null}
            {!isEasyPoc ? (
              <>
                <h3>{guide.costOverviewTitle}</h3>
                <p>{renderInlineLinks(guide.costOverviewIntro)}</p>
              </>
            ) : null}
          </header>
          <div className="architecture-grid">
            {architectures.map((architecture) => (
              <article className="architecture-card" key={architecture.title}>
                <div className="architecture-card-heading">
                  <span>{architecture.eyebrow}</span>
                  <h3>{architecture.title}</h3>
                  <p>{renderInlineLinks(architecture.summary)}</p>
                </div>

                <div className="architecture-cost-box">
                  <div className="architecture-cost-header">
                    <strong>{architecture.estimatedCost}</strong>
                    <span className="cost-tag">{costTag}</span>
                  </div>
                  <div className="architecture-cost-details">
                    <div className="cost-detail-row">
                      <span className="cost-type-fixed">{fixedCostLabel}</span>
                      <span>{renderInlineLinks(architecture.costFixed)}</span>
                    </div>
                    <div className="cost-detail-row">
                      <span className="cost-type-variable">{variableCostLabel}</span>
                      <span>{renderInlineLinks(architecture.costVariable)}</span>
                    </div>
                  </div>
                </div>

                <div className="architecture-flow" role="list">
                  {architecture.nodes.map((node, index) => (
                    <div className="architecture-flow-item" key={node.label} role="listitem">
                      <div className="architecture-node">
                        {node.costBadge && (
                          <span className="node-cost-badge">{node.costBadge}</span>
                        )}
                        <strong>{node.label}</strong>
                        <small>{node.detail}</small>
                      </div>
                      {index < architecture.nodes.length - 1 ? (
                        <span className="architecture-arrow" aria-hidden="true">
                          <i />
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="architecture-supports">
                  {architecture.supports.map((support) => (
                    <div className="architecture-support" key={support.label}>
                      <span aria-hidden="true" />
                      <div>
                        <strong>{support.label}</strong>
                        <small>{support.detail}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="implementation-section" id="implementation-section" aria-labelledby="implementation-title">
          <header className="architecture-heading">
            <p className="eyebrow">{activeGuide.implementationEyebrow}</p>
            <h2 id="implementation-title">{activeGuide.implementationTitle}</h2>
            <p>{renderInlineLinks(activeGuide.implementationIntro)}</p>
          </header>
          <div className="implementation-grid">
            {activeGuide.implementationGroups.map((group) => (
              <article className="implementation-card" key={group.title}>
                <div className="implementation-card-heading">
                  <span>{group.eyebrow}</span>
                  <h3>{group.title}</h3>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>
                      <CheckIcon size={17} />
                      <span>{renderInlineLinks(item)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* CHAPTER 4: Troubleshooting FAQ */}
        <section className="faq-section" id="faq-section" aria-labelledby="faq-title">
          {activeGuide.faqs && activeGuide.faqs.length > 0 && (
            <>
              <header className="architecture-heading">
                <p className="eyebrow">{activeGuide.faqEyebrow}</p>
                <h2 id="faq-title">{activeGuide.faqTitle}</h2>
                <p>{renderInlineLinks(activeGuide.faqIntro)}</p>
              </header>

              <div className="faq-grid">
                {activeGuide.faqs.map((faq) => (
                  <details className="faq-card" key={faq.id}>
                    <summary className="faq-summary">
                      <span className="faq-category-tag">{faq.category}</span>
                      <strong className="faq-question">{faq.question}</strong>
                    </summary>
                    <div className="faq-content">
                      <p className="faq-answer">{renderInlineLinks(faq.answer)}</p>
                      {faq.checklist && faq.checklist.length > 0 && (
                        <div className="faq-checklist-box">
                          <div className="faq-checklist-title">
                            <CheckIcon size={16} />
                            <span>{guide.faqChecklistLabel}</span>
                          </div>
                          <ul className="faq-checklist">
                            {faq.checklist.map((item, idx) => (
                              <li key={idx}>
                                <span>{renderInlineLinks(item)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
