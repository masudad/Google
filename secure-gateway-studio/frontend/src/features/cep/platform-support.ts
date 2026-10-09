import type { CepDlpDeviceScope, CepDlpOperation } from "../../lib/api";

/**
 * Which Chrome platforms enforce each Data protection rule operation.
 *
 * The matrix lets an operator target Android / iOS BYOD devices with the same
 * five operations that exist on desktop, but Chrome on mobile does not enforce
 * all of them. Showing a selectable "Block" cell for an operation the mobile
 * browser ignores would make a demo look protected when it is not, so every
 * cell is gated by this table and the service worker refuses to create rules
 * for operations the targeted platform cannot enforce.
 *
 * Kept deliberately small and data-driven: when Chrome ships a new mobile
 * capability, flip one entry and bump `DLP_PLATFORM_SUPPORT_VERIFIED_ON`.
 * The extension keeps an identical copy in
 * `extension/src/providers/cep-platform-support.ts`; `verify-cep.ts` fails
 * when the two tables drift apart.
 *
 * Status as of the verification date below (Chrome Data protection rules
 * created through the Cloud Identity Policies API, evaluated by Chrome
 * Enterprise Premium):
 * - Desktop (Windows, macOS, Linux, ChromeOS): every operation.
 * - Android / iOS (managed Chrome profile): "File downloaded" rules are
 *   enforced. "File uploaded", "Content pasted" and "Page printed" rules are
 *   not enforced by the mobile browser yet. The watermark row is partial:
 *   the URL-visited warning and the screenshot block apply, the watermark
 *   overlay itself does not.
 */
export type DlpPlatform = "desktop" | "android" | "ios";

export type DlpSupportLevel = "supported" | "partial" | "unsupported";

export const DLP_PLATFORM_SUPPORT_VERIFIED_ON = "2026-10-09";

export const DLP_PLATFORMS: readonly DlpPlatform[] = ["desktop", "android", "ios"];

export const DLP_OPERATIONS: readonly CepDlpOperation[] = [
  "upload",
  "download",
  "paste",
  "print",
  "watermark",
];

export const DLP_PLATFORM_SUPPORT: Readonly<
  Record<DlpPlatform, Readonly<Record<CepDlpOperation, DlpSupportLevel>>>
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

/** Platforms a device scope can match. Scopes without an OS filter match all. */
export function platformsForScope(scope: CepDlpDeviceScope): readonly DlpPlatform[] {
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
      return DLP_PLATFORMS;
  }
}

export interface ScopeOperationSupport {
  /** Combined verdict for the scope: enforced on every platform it matches,
   *  on some of them, partially, or on none of them. */
  level: "supported" | "mixed" | "partial" | "unsupported";
  /** Platforms in scope that do not enforce the operation at all. */
  unsupportedPlatforms: DlpPlatform[];
  /** Platforms in scope that enforce only part of the operation. */
  partialPlatforms: DlpPlatform[];
}

export function supportForScope(
  scope: CepDlpDeviceScope,
  operation: CepDlpOperation,
): ScopeOperationSupport {
  const platforms = platformsForScope(scope);
  const unsupportedPlatforms = platforms.filter(
    (platform) => DLP_PLATFORM_SUPPORT[platform][operation] === "unsupported",
  );
  const partialPlatforms = platforms.filter(
    (platform) => DLP_PLATFORM_SUPPORT[platform][operation] === "partial",
  );
  const supportedCount = platforms.length - unsupportedPlatforms.length;
  let level: ScopeOperationSupport["level"];
  if (supportedCount === 0) {
    level = "unsupported";
  } else if (unsupportedPlatforms.length > 0) {
    level = "mixed";
  } else if (partialPlatforms.length > 0) {
    level = "partial";
  } else {
    level = "supported";
  }
  return { level, unsupportedPlatforms, partialPlatforms };
}

/** True when at least one platform in the scope enforces the operation. */
export function isOperationEnforceable(
  scope: CepDlpDeviceScope,
  operation: CepDlpOperation,
): boolean {
  return supportForScope(scope, operation).level !== "unsupported";
}
