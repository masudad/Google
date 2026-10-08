/**
 * Corporate domain allowlist for the data boundary sign-in policies.
 *
 * The extension has no Directory `domains` scope, so secondary domains and
 * domain aliases cannot be discovered; the administrator types them. This
 * module turns that free text into the canonical list the worker expects and
 * previews the three policy values the list produces, so the operator sees
 * exactly what Chrome will enforce before Apply.
 */

export const ALLOWED_DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export const MAX_ALLOWED_DOMAINS = 50;

export interface ParsedAllowedDomains {
  /** Canonical, de-duplicated, valid domains in input order. */
  domains: string[];
  /** Tokens that are not DNS names, as typed, for the inline warning. */
  invalid: string[];
}

/** Lower-case and strip the prefixes administrators tend to paste. */
export function canonicalDomain(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^\*@/, "")
    .replace(/^@/, "")
    .replace(/\.$/, "");
}

/** Split on commas, semicolons, whitespace, and newlines. */
export function parseAllowedDomains(raw: string): ParsedAllowedDomains {
  const seen = new Set<string>();
  const domains: string[] = [];
  const invalid: string[] = [];
  for (const token of raw.split(/[\s,;、，]+/)) {
    if (token.trim() === "") continue;
    const domain = canonicalDomain(token);
    if (domain === "" || !ALLOWED_DOMAIN_PATTERN.test(domain)) {
      if (!invalid.includes(token.trim())) invalid.push(token.trim());
      continue;
    }
    if (seen.has(domain)) continue;
    seen.add(domain);
    if (domains.length < MAX_ALLOWED_DOMAINS) domains.push(domain);
  }
  return { domains, invalid };
}

/**
 * The effective list the worker will enforce: the detected primary domain
 * first, then the entered domains without repeating it.
 */
export function effectiveAllowedDomains(
  primaryDomain: string | null | undefined,
  entered: readonly string[],
): string[] {
  const primary = primaryDomain ? canonicalDomain(primaryDomain) : "";
  const list = primary && ALLOWED_DOMAIN_PATTERN.test(primary) ? [primary] : [];
  for (const domain of entered) {
    if (!list.includes(domain)) list.push(domain);
  }
  return list;
}

export interface DataBoundaryPolicyPreview {
  allowedDomainsForApps: string;
  restrictAccountsToPatterns: string[];
  restrictSigninToPattern: string;
}

/** Mirrors the worker's value builders so the preview cannot drift from Apply. */
export function dataBoundaryPolicyPreview(domains: readonly string[]): DataBoundaryPolicyPreview {
  const escaped = domains.map((domain) => domain.replace(/\./g, "\\."));
  return {
    allowedDomainsForApps: domains.join(","),
    restrictAccountsToPatterns: domains.map((domain) => `*@${domain}`),
    restrictSigninToPattern:
      escaped.length === 1 ? `.*@${escaped[0]}$` : `.*@(${escaped.join("|")})$`,
  };
}
