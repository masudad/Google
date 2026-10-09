import type { CepDlpDeviceScope, CepDlpOperation } from "./cep-provider.ts";

/**
 * Which Chrome platforms enforce each Chrome Data protection rule operation.
 *
 * Mirror of `frontend/src/features/cep/platform-support.ts`; `verify-cep.ts`
 * fails when the two tables drift apart. The provider consults this table so
 * that a rule the targeted browser cannot enforce is reported as skipped
 * instead of being created and silently never firing.
 *
 * Status as of `CEP_DLP_PLATFORM_SUPPORT_VERIFIED_ON`:
 * - Desktop (Windows, macOS, Linux, ChromeOS): every operation.
 * - Android / iOS (managed Chrome profile): "File downloaded" rules are
 *   enforced; "File uploaded", "Content pasted" and "Page printed" rules are
 *   not enforced by the mobile browser yet. The watermark row (URL visited +
 *   watermark + screenshot block) is partial: the warning and the screenshot
 *   block apply, the watermark overlay does not.
 */
export type CepDlpPlatform = "desktop" | "android" | "ios";

export type CepDlpSupportLevel = "supported" | "partial" | "unsupported";

export const CEP_DLP_PLATFORM_SUPPORT_VERIFIED_ON = "2026-10-09";

export const CEP_DLP_PLATFORMS: readonly CepDlpPlatform[] = ["desktop", "android", "ios"];

export const CEP_DLP_PLATFORM_SUPPORT: Readonly<
  Record<CepDlpPlatform, Readonly<Record<CepDlpOperation, CepDlpSupportLevel>>>
> = {
  desktop: {
    upload: "supported",
    download: "supported",
    paste: "supported",
    print: "supported",
    watermark: "supported",
  },
  android: {
    upload: "unsupported",
    download: "supported",
    paste: "unsupported",
    print: "unsupported",
    watermark: "partial",
  },
  ios: {
    upload: "unsupported",
    download: "supported",
    paste: "unsupported",
    print: "unsupported",
    watermark: "partial",
  },
};

export const CEP_DLP_PLATFORM_LABELS: Readonly<Record<CepDlpPlatform, string>> = {
  desktop: "Windows / macOS / Linux / ChromeOS",
  android: "Android",
  ios: "iOS",
};

/** Platforms a device scope can match. Scopes without an OS filter match all. */
export function platformsForDeviceScope(scope: CepDlpDeviceScope): readonly CepDlpPlatform[] {
  switch (scope) {
    case "desktop_byod":
      return ["desktop"];
    case "mobile_byod":
      return ["android", "ios"];
    case "android_byod":
    case "android_all":
      return ["android"];
    case "ios_byod":
    case "ios_all":
      return ["ios"];
    case "all":
    case "byod_only":
    case "corp_only":
      return CEP_DLP_PLATFORMS;
  }
}

/** Platforms in the scope that do not enforce the operation at all. */
export function unsupportedPlatformsFor(
  scope: CepDlpDeviceScope,
  operation: CepDlpOperation,
): CepDlpPlatform[] {
  return platformsForDeviceScope(scope).filter(
    (platform) => CEP_DLP_PLATFORM_SUPPORT[platform][operation] === "unsupported",
  );
}

/**
 * True when at least one platform in the scope enforces the operation, i.e.
 * creating the rule has an effect somewhere. A scope made only of platforms
 * that ignore the operation yields false and the provider skips the rule.
 */
export function isDlpOperationEnforceable(
  scope: CepDlpDeviceScope,
  operation: CepDlpOperation,
): boolean {
  const platforms = platformsForDeviceScope(scope);
  return unsupportedPlatformsFor(scope, operation).length < platforms.length;
}

/** Human-readable reason used in `skipped_items`. */
export function unenforceableRuleReason(
  scope: CepDlpDeviceScope,
  operation: CepDlpOperation,
): string {
  const platforms = unsupportedPlatformsFor(scope, operation)
    .map((platform) => CEP_DLP_PLATFORM_LABELS[platform])
    .join(" / ");
  return (
    `Chrome on ${platforms} does not enforce "${operation}" Data protection rules ` +
    `(platform support verified ${CEP_DLP_PLATFORM_SUPPORT_VERIFIED_ON}); ` +
    `the rule was not created for the ${scope} scope. Use a desktop or mixed scope for this operation.`
  );
}
