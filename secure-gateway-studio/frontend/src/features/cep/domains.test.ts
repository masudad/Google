import { describe, expect, it } from "vitest";
import {
  dataBoundaryPolicyPreview,
  effectiveAllowedDomains,
  parseAllowedDomains,
} from "./domains";

describe("parseAllowedDomains", () => {
  it("splits on commas, semicolons, whitespace, newlines, and Japanese commas", () => {
    expect(
      parseAllowedDomains("a.example, b.example;c.example\nd.example、e.example，f.example").domains,
    ).toEqual(["a.example", "b.example", "c.example", "d.example", "e.example", "f.example"]);
  });

  it("canonicalises common spellings and de-duplicates", () => {
    const parsed = parseAllowedDomains(
      " Sub.Example.co.jp \n*@alias.example\n@Example.com\nhttps://www.example.org/path\nsub.example.co.jp.",
    );
    expect(parsed.domains).toEqual([
      "sub.example.co.jp",
      "alias.example",
      "example.com",
      "www.example.org",
    ]);
    expect(parsed.invalid).toEqual([]);
  });

  it("reports tokens that are not DNS names without dropping valid ones", () => {
    const parsed = parseAllowedDomains("corp.example, localhost, not_a_domain, -bad.example, ok.example");
    expect(parsed.domains).toEqual(["corp.example", "ok.example"]);
    expect(parsed.invalid).toEqual(["localhost", "not_a_domain", "-bad.example"]);
  });

  it("returns nothing for empty input", () => {
    expect(parseAllowedDomains("   \n ")).toEqual({ domains: [], invalid: [] });
  });
});

describe("effectiveAllowedDomains", () => {
  it("puts the detected primary domain first and never repeats it", () => {
    expect(effectiveAllowedDomains("Example.com", ["corp.example", "example.com"])).toEqual([
      "example.com",
      "corp.example",
    ]);
  });

  it("works without a detected primary domain", () => {
    expect(effectiveAllowedDomains(null, ["corp.example"])).toEqual(["corp.example"]);
    expect(effectiveAllowedDomains(undefined, [])).toEqual([]);
  });
});

describe("dataBoundaryPolicyPreview", () => {
  it("keeps the historical single-domain shapes", () => {
    expect(dataBoundaryPolicyPreview(["example.com"])).toEqual({
      allowedDomainsForApps: "example.com",
      restrictAccountsToPatterns: ["*@example.com"],
      restrictSigninToPattern: ".*@example\\.com$",
    });
  });

  it("builds a comma list, one glob per domain, and one escaped alternation", () => {
    expect(dataBoundaryPolicyPreview(["example.com", "sub.example.co.jp"])).toEqual({
      allowedDomainsForApps: "example.com,sub.example.co.jp",
      restrictAccountsToPatterns: ["*@example.com", "*@sub.example.co.jp"],
      restrictSigninToPattern: ".*@(example\\.com|sub\\.example\\.co\\.jp)$",
    });
  });
});
