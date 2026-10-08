import { describe, expect, it } from "vitest";
import type { DeploymentSpec } from "./api";
import {
  buildNonSensitiveRecallRecord,
  defaultSetupState,
  recallSetupStateFromSpec,
  specPlatformList,
  specPrincipalList,
} from "./setup-state";

const spec: DeploymentSpec = {
  name: "secure-gateway-http-offload",
  mode: "poc",
  platforms: ["windows", "macos"],
  locale: "en",
  project_id: "montreal-436802",
  region: "asia-northeast1",
  zone: "asia-northeast1-a",
  secondary_zone: "asia-northeast1-b",
  backend_kind: "managed_sample",
  network_strategy: "dedicated",
  vpc_name: null,
  subnet_name: null,
  subnet_cidr: "10.42.0.0/24",
  proxy_subnet_cidr: "10.42.1.0/24",
  private_hostname: "demo.internal",
  gateway_id: "default",
  certificate_strategy: "local_poc",
  ca_pool: null,
  ca_name: null,
  public_certificate_secret: null,
  customer_id: "C01234567",
  target_ou_id: "03pilot",
  managed_chrome_access_level: "NONE",
  chrome_enterprise_premium_license_confirmed: true,
  workspace_services_confirmed: true,
  endpoint_verification_confirmed: true,
  principals: [{ type: "group", value: "run-owner@example.com" }],
  test_ou_confirmed: true,
  existing_backend_url: null,
  existing_backend_location: null,
  existing_backend_connectivity_confirmed: false,
  application_egress_region: null,
  upstream_vpc_project_id: null,
  source_image: "projects/debian-cloud/global/images/debian-12-bookworm-v20260701",
  offload_min_replicas: 2,
  offload_max_replicas: 20,
  offload_cpu_target: 0.6,
  schema_version: 1,
  certificate_lifetime_days: 90,
  allow_external_ips: false,
  require_cloud_nat: true,
  require_human_approval: true,
};

describe("specPlatformList", () => {
  it("accepts arrays and Sets in canonical order", () => {
    expect(specPlatformList(["windows", "macos"])).toEqual(["macos", "windows"]);
    expect(specPlatformList(new Set(["chromeos", "linux"]))).toEqual(["linux", "chromeos"]);
  });

  it("treats a serialised Set ({}) and junk as no platforms", () => {
    expect(specPlatformList({})).toEqual([]);
    expect(specPlatformList(undefined)).toEqual([]);
    expect(specPlatformList(["ios", 42, null, "macos"])).toEqual(["macos"]);
  });
});

describe("specPrincipalList", () => {
  it("keeps only well-formed principals", () => {
    expect(
      specPrincipalList([
        { type: "group", value: "a@example.com" },
        { type: "robot", value: "x@example.com" },
        { type: "user", value: "" },
        { type: "domain" },
        null,
        "user:b@example.com",
      ]),
    ).toEqual([{ type: "group", value: "a@example.com" }]);
    expect(specPrincipalList(undefined)).toEqual([]);
  });
});

describe("buildNonSensitiveRecallRecord", () => {
  it("summarises a well-formed specification", () => {
    const record = buildNonSensitiveRecallRecord(spec, {
      runId: "run-1",
      configurationHash: "hash",
    });
    expect(record.run_id).toBe("run-1");
    expect(record.configuration.platforms).toEqual(["macos", "windows"]);
    expect(record.configuration.principals).toEqual([
      { type: "group", value: "run-owner@example.com" },
    ]);
    expect(record.excluded_sensitive_fields).toContain("private_key_pem");
  });

  it("does not throw when platforms arrive as a serialised Set and arrays are missing", () => {
    const serialised = {
      ...spec,
      platforms: {} as unknown as DeploymentSpec["platforms"],
      principals: undefined as unknown as DeploymentSpec["principals"],
      vpc_name: undefined as unknown as string | null,
    };
    const record = buildNonSensitiveRecallRecord(serialised);
    expect(record.configuration.platforms).toEqual([]);
    expect(record.configuration.principals).toEqual([]);
    expect(record.configuration.vpc_name).toBeNull();
    expect(record.run_id).toBeNull();
  });
});

describe("recallSetupStateFromSpec", () => {
  it("maps platforms and principals from a well-formed specification", () => {
    const state = recallSetupStateFromSpec(defaultSetupState, spec, 2);
    expect(state.currentStep).toBe(2);
    expect(state.platforms).toEqual({
      macos: true,
      windows: true,
      linux: false,
      chromeos: false,
    });
    expect(state.principals).toEqual([
      { id: "principal-1", type: "group", value: "run-owner@example.com" },
    ]);
    expect(state.deploymentName).toBe("secure-gateway-http-offload");
    expect(state.approvalConfirmed).toBe(false);
  });

  it("falls back safely when the specification is partially serialised", () => {
    const serialised = {
      ...spec,
      platforms: {} as unknown as DeploymentSpec["platforms"],
      principals: undefined as unknown as DeploymentSpec["principals"],
      name: undefined as unknown as string,
      private_hostname: undefined as unknown as string,
      project_id: undefined as unknown as string,
      test_ou_confirmed: undefined as unknown as boolean,
    };
    const state = recallSetupStateFromSpec(defaultSetupState, serialised, 9);
    expect(state.currentStep).toBe(6);
    expect(state.platforms).toEqual({
      macos: false,
      windows: false,
      linux: false,
      chromeos: false,
    });
    expect(state.principals).toEqual(defaultSetupState.principals);
    expect(state.deploymentName).toBe("");
    expect(state.privateHostname).toBe("");
    expect(state.projectId).toBe("");
    expect(state.testOuConfirmed).toBe(false);
  });
});
