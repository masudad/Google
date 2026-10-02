import { useState } from "react";
import type { Messages } from "../../i18n/messages";
import { CheckIcon, CodeIcon, InfoIcon, LockIcon, NetworkIcon, ShieldIcon } from "../../components/Icons";
import { runtimeCapabilities } from "../../lib/api";

interface GuidePageProps {
  messages: Messages;
  onNavigate?: (view: "setup" | "evidence" | "guide" | "deployments" | "cepDeployer") => void;
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
      {/* Top-level Guide Portal Header */}
      <header className="guide-portal-header">
        <p className="eyebrow">{guide.portalEyebrow}</p>
        <h1>{guide.portalTitle}</h1>
        <p className="guide-portal-intro">{guide.portalIntro}</p>
      </header>

      {/* Shared Header Login & Credential Architecture Callout */}
      <section className="guide-shared-auth-card" aria-labelledby="guide-shared-auth-title">
        <div className="guide-shared-auth-header">
          <span className="guide-shared-auth-icon" aria-hidden="true">
            <LockIcon size={20} />
          </span>
          <div>
            <h2 id="guide-shared-auth-title">{guide.sharedAuthTitle}</h2>
            <p>{guide.sharedAuthIntro}</p>
          </div>
        </div>
        <ul className="guide-shared-auth-list">
          {guide.sharedAuthItems.map((item) => (
            <li key={item.label}>
              <CheckIcon size={16} />
              <div>
                <strong>{item.label}: </strong>
                <span>{item.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Prominent 2-Tab Switcher: Easy PoC Guide vs. Secure Gateway Deployer Guide */}
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

      {/* Active Guide Content Panel */}
      <div
        id="guide-tabpanel-content"
        role="tabpanel"
        aria-labelledby={isEasyPoc ? "guide-tab-easy-poc" : "guide-tab-sgw"}
        className="guide-tabpanel"
      >
        <header className="guide-heading">
          <div className="guide-heading-row">
            <div>
              <p className="eyebrow">{activeGuide.eyebrow}</p>
              <h2>{activeGuide.title}</h2>
              <p>{activeGuide.intro}</p>
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

        <nav className="guide-sticky-nav" aria-label="Guide navigation">
          <a className="guide-nav-pill" href="#architecture-section">
            {activeGuide.quickOverviewTitle}
          </a>
          <a className="guide-nav-pill" href="#implementation-section">
            {activeGuide.implementationTitle}
          </a>
          <a className="guide-nav-pill" href="#technical-deep-dive-section">
            {activeGuide.technicalDeepDiveTitle}
          </a>
          {activeGuide.faqs && activeGuide.faqs.length > 0 && (
            <a className="guide-nav-pill" href="#faq-section">
              {activeGuide.faqTitle}
            </a>
          )}
        </nav>

        <aside className="guide-poc-notice">
          <InfoIcon size={24} />
          <div>
            <strong>{activeGuide.pocNoticeTitle}</strong>
            <p>{activeGuide.pocNoticeBody}</p>
          </div>
        </aside>

        {/* TOP SECTION: Quick Overview & Architecture Decisions */}
        <section className="architecture-section" id="architecture-section" aria-labelledby="architecture-title">
          <header className="architecture-heading">
            <p className="eyebrow">{activeGuide.quickOverviewTitle}</p>
            <h2 id="architecture-title">{architectureTitle}</h2>
            <p>{architectureIntro}</p>
            {!isEasyPoc && !runtimeCapabilities.internalHttpsLbArchitecture ? (
              <p>{guide.extensionArchitectureNote}</p>
            ) : null}
            {!isEasyPoc ? (
              <>
                <h3>{guide.costOverviewTitle}</h3>
                <p>{guide.costOverviewIntro}</p>
              </>
            ) : null}
          </header>
          <div className="architecture-grid">
            {architectures.map((architecture) => (
              <article className="architecture-card" key={architecture.title}>
                <div className="architecture-card-heading">
                  <span>{architecture.eyebrow}</span>
                  <h3>{architecture.title}</h3>
                  <p>{architecture.summary}</p>
                </div>

                <div className="architecture-cost-box">
                  <div className="architecture-cost-header">
                    <strong>{architecture.estimatedCost}</strong>
                    <span className="cost-tag">{costTag}</span>
                  </div>
                  <div className="architecture-cost-details">
                    <div className="cost-detail-row">
                      <span className="cost-type-fixed">{fixedCostLabel}</span>
                      <span>{architecture.costFixed}</span>
                    </div>
                    <div className="cost-detail-row">
                      <span className="cost-type-variable">{variableCostLabel}</span>
                      <span>{architecture.costVariable}</span>
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

        {/* MIDDLE SECTION: Implementation Inventory */}
        <section className="implementation-section" id="implementation-section" aria-labelledby="implementation-title">
          <header className="architecture-heading">
            <p className="eyebrow">{activeGuide.implementationEyebrow}</p>
            <h2 id="implementation-title">{activeGuide.implementationTitle}</h2>
            <p>{activeGuide.implementationIntro}</p>
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
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* BOTTOM SECTION: Step-by-Step Technical Deep Dive & REST API Reference */}
        <section className="technical-deep-dive-section" id="technical-deep-dive-section" aria-labelledby="technical-deep-dive-title">
          <header className="architecture-heading">
            <p className="eyebrow">{activeGuide.technicalEyebrow}</p>
            <h2 id="technical-deep-dive-title">{activeGuide.technicalDeepDiveTitle}</h2>
            <p>{activeGuide.technicalDeepDiveIntro}</p>
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
                    {step.subtitle && <p className="step-subtitle">{step.subtitle}</p>}
                  </div>
                  <p className="step-summary-text">{step.summary}</p>

                  <div className="step-section-block">
                    <h4 className="step-subheading">
                      <CheckIcon size={16} />
                      <span>{guide.checklistLabel}</span>
                    </h4>
                    <ul className="step-actions-list">
                      {step.actions.map((action) => (
                        <li key={action}>
                          <CheckIcon size={16} />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.optionsBehavior && step.optionsBehavior.length > 0 && (
                    <div className="step-section-block">
                      <details className="step-collapsible" open>
                        <summary className="step-collapsible-summary">
                          <NetworkIcon size={16} />
                          <span>{guide.optionsBehaviorLabel}</span>
                        </summary>
                        <div className="options-behavior-grid">
                          {step.optionsBehavior.map((opt) => (
                            <div className="option-behavior-card" key={opt.name}>
                              <strong>{opt.name}</strong>
                              <p>{opt.behavior}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {step.apiCalls && step.apiCalls.length > 0 && (
                    <div className="step-section-block">
                      <details className="step-collapsible" open>
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
                                <p className="api-purpose">{api.purpose}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {step.safetyNote && (
                    <div className="step-safety-note">
                      <ShieldIcon size={18} />
                      <div>
                        <strong>{guide.safetyGuardrailLabel}</strong>
                        <p>{step.safetyNote}</p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ & Troubleshooting Section */}
        {activeGuide.faqs && activeGuide.faqs.length > 0 && (
          <section className="faq-section" id="faq-section" aria-labelledby="faq-title">
            <header className="architecture-heading">
              <p className="eyebrow">{activeGuide.faqEyebrow}</p>
              <h2 id="faq-title">{activeGuide.faqTitle}</h2>
              <p>{activeGuide.faqIntro}</p>
            </header>

            <div className="faq-grid">
              {activeGuide.faqs.map((faq) => (
                <details className="faq-card" key={faq.id}>
                  <summary className="faq-summary">
                    <span className="faq-category-tag">{faq.category}</span>
                    <strong className="faq-question">{faq.question}</strong>
                  </summary>
                  <div className="faq-content">
                    <p className="faq-answer">{faq.answer}</p>
                    {faq.checklist && faq.checklist.length > 0 && (
                      <div className="faq-checklist-box">
                        <div className="faq-checklist-title">
                          <CheckIcon size={16} />
                          <span>{guide.faqChecklistLabel}</span>
                        </div>
                        <ul className="faq-checklist">
                          {faq.checklist.map((item, idx) => (
                            <li key={idx}>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
