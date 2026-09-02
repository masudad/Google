import type { Messages } from "../../i18n/messages";
import { CheckIcon, CodeIcon, InfoIcon, LockIcon, NetworkIcon, ShieldIcon } from "../../components/Icons";
import { runtimeCapabilities } from "../../lib/api";

interface GuidePageProps {
  messages: Messages;
}

export function GuidePage({ messages }: GuidePageProps) {
  const guide = messages.guide;
  const architectures = runtimeCapabilities.internalHttpsLbArchitecture
    ? guide.architectures
    : guide.architectures.filter((_architecture, index) => index !== 1);

  return (
    <main className="guide-page">
      <header className="guide-heading">
        <p className="eyebrow">{guide.eyebrow}</p>
        <h1>{guide.title}</h1>
        <p>{guide.intro}</p>
      </header>

      <nav className="guide-sticky-nav" aria-label="Guide navigation">
        <a className="guide-nav-pill" href="#architecture-section">
          🏛️ {guide.quickOverviewTitle}
        </a>
        <a className="guide-nav-pill" href="#implementation-section">
          📦 {guide.implementationTitle}
        </a>
        <a className="guide-nav-pill" href="#technical-deep-dive-section">
          🛠️ {guide.technicalDeepDiveTitle}
        </a>
        {guide.faqs && guide.faqs.length > 0 && (
          <a className="guide-nav-pill" href="#faq-section">
            ❓ {guide.faqTitle}
          </a>
        )}
      </nav>

      <aside className="guide-poc-notice">
        <InfoIcon size={24} />
        <div>
          <strong>{guide.pocNoticeTitle}</strong>
          <p>{guide.pocNoticeBody}</p>
        </div>
      </aside>

      {/* TOP SECTION: Quick Overview & Architecture Decisions */}
      <section className="architecture-section" id="architecture-section" aria-labelledby="architecture-title">
        <header className="architecture-heading">
          <p className="eyebrow">{guide.quickOverviewTitle}</p>
          <h2 id="architecture-title">
            {runtimeCapabilities.internalHttpsLbArchitecture
              ? guide.architectureTitle
              : guide.extensionArchitectureTitle}
          </h2>
          <p>
            {runtimeCapabilities.internalHttpsLbArchitecture
              ? guide.architectureIntro
              : guide.extensionArchitectureIntro}
          </p>
          {!runtimeCapabilities.internalHttpsLbArchitecture ? (
            <p>{guide.extensionArchitectureNote}</p>
          ) : null}
          <h3>{guide.costOverviewTitle}</h3>
          <p>{guide.costOverviewIntro}</p>
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
                  <strong>💰 {architecture.estimatedCost}</strong>
                  <span className="cost-tag">{guide.costTag}</span>
                </div>
                <div className="architecture-cost-details">
                  <div className="cost-detail-row">
                    <span className="cost-type-fixed">{guide.fixedCostLabel}</span>
                    <span>{architecture.costFixed}</span>
                  </div>
                  <div className="cost-detail-row">
                    <span className="cost-type-variable">{guide.variableCostLabel}</span>
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

      {/* TOP SECTION: Implementation Inventory */}
      <section className="implementation-section" id="implementation-section" aria-labelledby="implementation-title">
        <header className="architecture-heading">
          <p className="eyebrow">{guide.implementationEyebrow}</p>
          <h2 id="implementation-title">{guide.implementationTitle}</h2>
          <p>{guide.implementationIntro}</p>
        </header>
        <div className="implementation-grid">
          {guide.implementationGroups.map((group) => (
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
          <p className="eyebrow">{guide.technicalEyebrow}</p>
          <h2 id="technical-deep-dive-title">{guide.technicalDeepDiveTitle}</h2>
          <p>{guide.technicalDeepDiveIntro}</p>
        </header>

        <div className="guide-step-jump-bar" aria-label="Step quick navigation">
          {guide.steps.map((_s, idx) => (
            <a className="guide-step-jump-pill" href={`#guide-step-${idx + 1}`} key={idx}>
              #{idx + 1}
            </a>
          ))}
        </div>

        <ol className="guide-steps">
          {guide.steps.map((step, index) => (
            <li className="guide-step technical-step-card" id={`guide-step-${index + 1}`} key={step.title}>
              <div className="guide-step-number" aria-hidden="true">
                {index + 1}
              </div>
              <div className="guide-step-copy">
                <div className="step-title-group">
                  <span className="step-badge">{guide.stepLabel(index + 1)}</span>
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
      {guide.faqs && guide.faqs.length > 0 && (
        <section className="faq-section" id="faq-section" aria-labelledby="faq-title">
          <header className="architecture-heading">
            <p className="eyebrow">{guide.faqEyebrow}</p>
            <h2 id="faq-title">{guide.faqTitle}</h2>
            <p>{guide.faqIntro}</p>
          </header>

          <div className="faq-grid">
            {guide.faqs.map((faq) => (
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
    </main>
  );
}

