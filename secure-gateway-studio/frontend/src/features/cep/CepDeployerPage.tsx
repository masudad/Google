import { useEffect, useState } from "react";
import type { Messages } from "../../i18n/messages";
import type {
  CepDataBoundaryMode,
  CepDlpMatrixState,
  CepGeminiZeroTrustConfig,
  CepGeminiZeroTrustResult,
  CepLicenseAssignResult,
  CepRoleResult,
  CepProvisionConfig,
  CepProvisionResult,
  SetupOption,
} from "../../lib/api";
import {
  assignCepLicenses,
  createCepCustomRoles,
  generateCepScript,
  listAccessLevelOptions,
  listGroupOptions,
  listOrganizationalUnitOptions,
  provisionCepPolicies,
  provisionGeminiZeroTrust,
  signInSession,
  rollbackCepPolicies,
} from "../../lib/api";
import {
  CheckCircleIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ExternalLinkIcon,
  KeyIcon,
  ShieldNetworkIcon,
  SparklesIcon,
  UsersIcon,
} from "../../components/Icons";
import { ErrorDiagnosticCard } from "../../components/ErrorDiagnosticCard";
import {
  SecurityAssessmentModal,
  type RecommendedPolicyConfig,
} from "./SecurityAssessmentModal";
import { DEFAULT_DLP_MATRIX, DlpMatrixTable } from "./DlpMatrixTable";

interface CepDeployerPageProps {
  messages: Messages;
  customerId: string;
  projectId: string;
}

interface ModuleState {
  corePolicies: boolean;
  forceExtensions: boolean;
  connectors: boolean;
  accessLevel: string;
  dlpDetectors: boolean;
  dlpRules: boolean;
  dlpRegion: string;
  dataBoundaryMode: CepDataBoundaryMode;
}

/** Countries whose national identifier Cloud DLP can detect. */
const DLP_REGIONS: Array<{ value: string; label: string }> = [
  { value: "JP", label: "Japan" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
  { value: "IN", label: "India" },
];

type PresetName = "full" | "ai" | "endpoint" | "audit";

/**
 * Sentinels the worker understands, shared with the deployment wizard's access
 * step. Anything else in the dropdown is a real access level resource name.
 */
const ACCESS_LEVEL_NONE = "NONE";
const AUTO_CREATE_ANY = "AUTO_CREATE_CHROME_ANY";
const AUTO_CREATE_SENTINELS = [
  AUTO_CREATE_ANY,
  "AUTO_CREATE_PROFILE_MANAGED",
  "AUTO_CREATE_BROWSER_MANAGED",
];

const PRESETS: Record<PresetName, ModuleState> = {
  full: {
    corePolicies: true,
    forceExtensions: true,
    connectors: true,
    accessLevel: AUTO_CREATE_ANY,
    dlpDetectors: false,
    dlpRules: true,
    dlpRegion: "JP",
    dataBoundaryMode: "copy_paste",
  },
  ai: {
    corePolicies: true,
    forceExtensions: false,
    connectors: true,
    accessLevel: ACCESS_LEVEL_NONE,
    dlpDetectors: false,
    dlpRules: true,
    dlpRegion: "JP",
    dataBoundaryMode: "block_non_corp",
  },
  endpoint: {
    corePolicies: true,
    forceExtensions: true,
    connectors: true,
    accessLevel: AUTO_CREATE_ANY,
    dlpDetectors: false,
    dlpRules: false,
    dlpRegion: "JP",
    dataBoundaryMode: "none",
  },
  audit: {
    corePolicies: true,
    forceExtensions: false,
    connectors: true,
    accessLevel: ACCESS_LEVEL_NONE,
    dlpDetectors: false,
    dlpRules: true,
    dlpRegion: "JP",
    dataBoundaryMode: "none",
  },
};

const PRESET_MATRICES: Record<PresetName, CepDlpMatrixState> = {
  full: DEFAULT_DLP_MATRIX,
  ai: {
    ...DEFAULT_DLP_MATRIX,
    genai_block: { ...DEFAULT_DLP_MATRIX.genai_block, paste: "blockContent", upload: "blockContent" },
    national_id: { ...DEFAULT_DLP_MATRIX.national_id, paste: "warnUser" },
  },
  endpoint: {
    universal_upload: { upload: "off" },
    universal_download: { download: "off" },
    payment_card: { upload: "off", paste: "off" },
    national_id: { upload: "off", paste: "off" },
    access_level: { upload: "off" },
    watermark: { watermark: false },
    genai_block: { paste: "off", upload: "off" },
  },
  audit: {
    universal_upload: { upload: "warnUser" },
    universal_download: { download: "warnUser" },
    payment_card: { upload: "warnUser", paste: "warnUser" },
    national_id: { upload: "warnUser", paste: "warnUser" },
    access_level: { upload: "off", download: "off", paste: "off", print: "off", byodOnly: false },
    watermark: { watermark: false },
    genai_block: { paste: "warnUser", upload: "warnUser" },
  },
};

export function CepDeployerPage({
  messages,
  customerId,
  projectId,
}: CepDeployerPageProps) {
  const m = messages.cepDeployer;
  const canonicalCustomerId = /^C[A-Za-z0-9]+$/.test(customerId.trim())
    ? customerId.trim()
    : "";

  const [targetType, setTargetType] = useState<"ou" | "group">("ou");
  const [organizationalUnits, setOrganizationalUnits] = useState<SetupOption[]>([]);
  const [selectedOu, setSelectedOu] = useState<string>("");
  const [targetOuConfirmation, setTargetOuConfirmation] = useState<string>("");
  const [ouError, setOuError] = useState<boolean>(false);
  const [groups, setGroups] = useState<SetupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [targetGroupConfirmation, setTargetGroupConfirmation] = useState<string>("");
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [groupsLoaded, setGroupsLoaded] = useState<boolean>(false);
  const [groupsError, setGroupsError] = useState<boolean>(false);
  // This write-capable Directory action must be an affirmative administrator
  // choice; merely opening Easy PoC must not opt the tenant into OU creation.
  const [autoSubOus, setAutoSubOus] = useState<boolean>(false);

  const [modules, setModules] = useState<ModuleState>(PRESETS.full);
  const [activePreset, setActivePreset] = useState<string | null>("full");
  const [activeTab, setActiveTab] = useState<"setup" | "licensing" | "dlp" | "operations" | "all">("setup");
  const [dlpMatrix, setDlpMatrix] = useState<CepDlpMatrixState>(DEFAULT_DLP_MATRIX);
  const [internalUrls, setInternalUrls] = useState<string>("");
  const [dlpCustomMessage, setDlpCustomMessage] = useState<string>("");
  const [dlpSaveContent, setDlpSaveContent] = useState<boolean>(false);

  const [accessLevels, setAccessLevels] = useState<SetupOption[]>([]);
  const [accessLevelError, setAccessLevelError] = useState<boolean>(false);

  const [assigningLicenses, setAssigningLicenses] = useState<boolean>(false);
  const [licenseResult, setLicenseResult] = useState<CepLicenseAssignResult | null>(null);
  const [licenseError, setLicenseError] = useState<unknown>(null);

  const [roleType, setRoleType] = useState<"both" | "administrator" | "auditor">("both");
  const [assignedUserEmail, setAssignedUserEmail] = useState<string>("");
  const [scopeRoleToOu, setScopeRoleToOu] = useState<boolean>(true);
  const [creatingRoles, setCreatingRoles] = useState<boolean>(false);
  const [roleResult, setRoleResult] = useState<CepRoleResult | null>(null);
  const [roleError, setRoleError] = useState<unknown>(null);

  const [busy, setBusy] = useState<"deploy" | "rollback" | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [lastResult, setLastResult] = useState<CepProvisionResult | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string>("");

  // Progress indicators for long-running operations
  const [deployStep, setDeployStep] = useState<number>(0);
  const [rollbackStep, setRollbackStep] = useState<number>(0);
  const [roleStep, setRoleStep] = useState<number>(0);
  const [licenseStep, setLicenseStep] = useState<number>(0);

  // Gemini Zero Trust Automated Provisioning
  const [geminiProjectInput, setGeminiProjectInput] = useState<string>(projectId);
  const [geminiProjectConfirmation, setGeminiProjectConfirmation] = useState<string>("");
  const [geminiPolicyIdInput, setGeminiPolicyIdInput] = useState<string>("");
  const [geminiPerimeterName, setGeminiPerimeterName] = useState<string>("gemini_zero_trust_poc");
  const [geminiEnforceAccessLevel, setGeminiEnforceAccessLevel] = useState<boolean>(true);
  const [geminiAccessLevelName, setGeminiAccessLevelName] = useState<string>("");
  const [geminiEnforcePerimeter, setGeminiEnforcePerimeter] = useState<boolean>(true);
  const [geminiEnforceRca, setGeminiEnforceRca] = useState<boolean>(false);
  const [geminiRcaGroupKey, setGeminiRcaGroupKey] = useState<string>("");
  const [geminiDryRun, setGeminiDryRun] = useState<boolean>(true);
  const [provisioningGemini, setProvisioningGemini] = useState<boolean>(false);
  const [geminiStep, setGeminiStep] = useState<number>(0);
  const [geminiResult, setGeminiResult] = useState<CepGeminiZeroTrustResult | null>(null);
  const [geminiError, setGeminiError] = useState<unknown>(null);

  async function handleProvisionGeminiZeroTrust() {
    const targetProject = (geminiProjectInput || projectId).trim();
    if (!targetProject) {
      setGeminiError(new Error("Target Google Cloud Project ID is required."));
      return;
    }
    if (!geminiDryRun && geminiProjectConfirmation.trim() !== targetProject) {
      setGeminiError(
        new Error(
          m.geminiConfirmProjectMismatch ||
            "Type the exact target Project ID before provisioning in strict mode.",
        ),
      );
      return;
    }
    setProvisioningGemini(true);
    setGeminiError(null);
    setGeminiResult(null);
    setGeminiStep(1);

    const t1 = setTimeout(() => setGeminiStep(2), 1100);
    const t2 = setTimeout(() => setGeminiStep(3), 2400);
    const t3 = geminiEnforceRca ? setTimeout(() => setGeminiStep(4), 3800) : undefined;

    try {
      const res = await provisionGeminiZeroTrust({
        project_id: targetProject,
        policy_id: geminiPolicyIdInput.trim() || undefined,
        perimeter_name: geminiPerimeterName.trim() || "gemini_zero_trust_poc",
        enforce_access_level: geminiEnforceAccessLevel,
        access_level_name: geminiAccessLevelName.trim() || undefined,
        enforce_perimeter: geminiEnforcePerimeter,
        enforce_rca: geminiEnforceRca,
        rca_group_key: geminiRcaGroupKey.trim() || undefined,
        dry_run: geminiDryRun,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      if (t3) clearTimeout(t3);
      setGeminiStep(geminiEnforceRca ? 5 : 4);
      setGeminiResult(res);
      if (!res.success) {
        setGeminiError(res);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      if (t3) clearTimeout(t3);
      setGeminiError(err);
    } finally {
      setProvisioningGemini(false);
    }
  }

  const geminiVpcScSnippet = `# 1. Google Cloud ACM: Create Access Level requiring Managed Chrome
gcloud access-context-manager levels create managed_chrome_access \\
  --title="Managed Chrome Endpoints" \\
  --basic-level-spec=<(cat <<EOF
- devicePolicy:
    requireScreenlock: true
    osConstraints:
      - osType: DESKTOP_CHROME_OS
      - osType: DESKTOP_WINDOWS
      - osType: DESKTOP_MAC
EOF
) \\
  --policy=\${POLICY_ID}

# 2. Google Cloud VPC-SC: Protect Discovery Engine (Gemini Enterprise API)
gcloud access-context-manager perimeters create gemini_enterprise_perimeter \\
  --title="Gemini Enterprise Security Perimeter" \\
  --resources="projects/\${PROJECT_NUMBER}" \\
  --restricted-services="discoveryengine.googleapis.com" \\
  --access-levels="accessPolicies/\${POLICY_ID}/accessLevels/managed_chrome_access" \\
  --policy=\${POLICY_ID}`;

  const geminiRcaSnippet = `# 1. Create YAML for Gemini Enterprise application binding (ge-rca.yaml)
cat << 'EOF' > ge-rca.yaml
scopedAccessSettings:
- scope:
    clientScope:
      restrictedClientApplication:
        name: "Gemini Enterprise"
  activeSettings:
    accessLevels:
    - accessPolicies/\${POLICY_ID}/accessLevels/managed_chrome_access
EOF

# 2. Create the Cloud User Access Binding via gcloud
gcloud access-context-manager cloud-bindings create \\
  --organization="\${ORG_ID}" \\
  --group-key="${geminiRcaGroupKey || "YOUR_GROUP_KEY"}" \\
  --binding-file="ge-rca.yaml"`;

  const [assessmentModalOpen, setAssessmentModalOpen] = useState<boolean>(false);
  const [assessmentAppliedNotice, setAssessmentAppliedNotice] = useState<string>("");

  const handleApplyRecommendation = (config: RecommendedPolicyConfig) => {
    setModules((prev) => ({
      ...prev,
      corePolicies: config.corePolicies,
      forceExtensions: config.forceExtensions,
      connectors: config.connectors,
      accessLevel: config.accessLevel,
      dlpRules: config.dlpRules,
    }));
    setDlpMatrix(config.dlpMatrix);
    setAutoSubOus(config.autoSubOus);
    setGeminiEnforceAccessLevel(config.geminiEnforceAccessLevel);
    setGeminiEnforcePerimeter(config.geminiEnforcePerimeter);
    if (config.internalUrls) setInternalUrls(config.internalUrls);
    if (config.dlpCustomMessage) setDlpCustomMessage(config.dlpCustomMessage);
    setAssessmentAppliedNotice(m.assessAppliedBanner);
    setTimeout(() => setAssessmentAppliedNotice(""), 6000);
    setActiveTab("dlp");
  };

  const [ouLoaded, setOuLoaded] = useState<boolean>(false);
  const [loadingOus, setLoadingOus] = useState<boolean>(false);

  async function handleCreateRoles() {
    if (!canonicalCustomerId) return;
    setCreatingRoles(true);
    setRoleError(null);
    setRoleResult(null);
    setRoleStep(1);
    const t1 = setTimeout(() => setRoleStep(2), 700);
    const t2 = setTimeout(() => setRoleStep(3), 1500);

    try {
      const res = await createCepCustomRoles({
        customer_id: canonicalCustomerId,
        project_id: projectId,
        role_type: roleType,
        assigned_user_email: assignedUserEmail.trim() || undefined,
        target_ou_id: scopeRoleToOu && selectedOu ? selectedOu : undefined,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      setRoleStep(4);
      setRoleResult(res);
      if (!res.success) {
        setRoleError(res);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setRoleError(err);
    } finally {
      setCreatingRoles(false);
    }
  }

  const handleLoadOus = async () => {
    // A refresh is a new authorization decision. Never retain or infer a
    // target from the first (normally root) Directory result.
    setSelectedOu("");
    setTargetOuConfirmation("");
    if (canonicalCustomerId === "") {
      setOuError(true);
      setOuLoaded(true);
      return;
    }
    setLoadingOus(true);
    setOuError(false);
    try {
      // The button promises to verify the Google account. Ask for consent
      // first so a profile that never granted it is not told, silently and
      // wrongly, that it has no organizational units.
      await signInSession();
      const options = await listOrganizationalUnitOptions(canonicalCustomerId);
      setOrganizationalUnits(options);
      setOuError(options.length === 0);
      setOuLoaded(true);

      // Also attempt to load groups for zero-touch PoC evaluation
      try {
        setLoadingGroups(true);
        const groupOptions = await listGroupOptions(canonicalCustomerId);
        setGroups(groupOptions);
        setGroupsLoaded(true);
        setGroupsError(false);
      } catch {
        setGroupsLoaded(true);
        setGroupsError(true);
      } finally {
        setLoadingGroups(false);
      }

      if (projectId) {
        try {
          const accessOptions = await listAccessLevelOptions(projectId);
          const existing = accessOptions.filter(
            (option) =>
              option.value !== ACCESS_LEVEL_NONE &&
              !AUTO_CREATE_SENTINELS.includes(option.value),
          );
          setAccessLevels(existing);
          setAccessLevelError(false);
        } catch {
          setAccessLevelError(true);
        }
      }
    } catch {
      setOuError(true);
      setOuLoaded(true);
    } finally {
      setLoadingOus(false);
    }
  };

  const handleLoadGroups = async () => {
    setSelectedGroup("");
    setTargetGroupConfirmation("");
    if (canonicalCustomerId === "") {
      setGroupsError(true);
      setGroupsLoaded(true);
      return;
    }
    setLoadingGroups(true);
    setGroupsError(false);
    try {
      await signInSession();
      const groupOptions = await listGroupOptions(canonicalCustomerId);
      setGroups(groupOptions);
      setGroupsLoaded(true);
    } catch {
      setGroupsError(true);
      setGroupsLoaded(true);
    } finally {
      setLoadingGroups(false);
    }
  };

  const selectedUnit = organizationalUnits.find((unit) => unit.value === selectedOu);
  const targetOuConfirmed =
    selectedUnit !== undefined &&
    selectedUnit.label !== "/" &&
    targetOuConfirmation === selectedUnit.label;
  const targetGroupConfirmed =
    targetType === "group" &&
    selectedGroup.trim() !== "" &&
    targetGroupConfirmation.trim().toLowerCase() === selectedGroup.trim().toLowerCase();
  const targetConfirmed = targetType === "group" ? targetGroupConfirmed : targetOuConfirmed;

  const anyModuleSelected =
    modules.corePolicies ||
    modules.forceExtensions ||
    modules.connectors ||
    modules.accessLevel !== ACCESS_LEVEL_NONE ||
    modules.dlpRules ||
    modules.dataBoundaryMode !== "none";
  const canDeploy =
    canonicalCustomerId !== "" &&
    (targetType === "group" ? selectedGroup.trim() !== "" : selectedOu !== "") &&
    targetConfirmed &&
    anyModuleSelected &&
    busy === null;

  function update<K extends keyof ModuleState>(key: K, value: ModuleState[K]) {
    setActivePreset(null);
    setModules((current) => ({ ...current, [key]: value }));
  }

  function currentConfig(
    confirmation = (targetType === "group" ? targetGroupConfirmation : targetOuConfirmation),
  ): CepProvisionConfig {
    return {
      customer_id: canonicalCustomerId,
      project_id: projectId,
      target_type: targetType,
      target_ou_id: targetType === "group" ? (selectedOu || undefined) : selectedOu,
      target_ou_path: targetType === "group" ? undefined : selectedUnit?.label,
      target_ou_confirmation: targetType === "group" ? undefined : confirmation,
      target_group_key: targetType === "group" ? selectedGroup.trim() : undefined,
      target_group_confirmation: targetType === "group" ? confirmation : undefined,
      create_sub_ous: targetType === "group" ? false : autoSubOus,
      core_policies: modules.corePolicies,
      force_extensions: modules.forceExtensions,
      connectors: modules.connectors,
      access_level: modules.accessLevel,
      dlp_detectors: false,
      dlp_rules: modules.dlpRules,
      dlp_region: modules.dlpRegion,
      dlp_matrix: dlpMatrix,
      dlp_custom_message: dlpCustomMessage,
      dlp_save_content: dlpSaveContent,
      data_boundary_mode: modules.dataBoundaryMode,
      internal_urls: internalUrls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
    };
  }

  const handleAssignLicenses = async () => {
    if (!selectedOu || canonicalCustomerId === "" || !targetOuConfirmed) return;
    const confirmation = targetOuConfirmation;
    setTargetOuConfirmation("");
    setAssigningLicenses(true);
    setLicenseError(null);
    setLicenseResult(null);
    setLicenseStep(1);
    const t1 = setTimeout(() => setLicenseStep(2), 800);

    try {
      const res = await assignCepLicenses({
        customer_id: canonicalCustomerId,
        project_id: projectId,
        target_ou_id: selectedOu,
        target_ou_path: selectedUnit?.label,
        target_ou_confirmation: confirmation,
      });
      clearTimeout(t1);
      setLicenseStep(3);
      setLicenseResult(res);
      if (!res.success) {
        setLicenseError(res);
      }
    } catch (err) {
      clearTimeout(t1);
      setLicenseError(err);
    } finally {
      setAssigningLicenses(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(""), 2500);
  };

  const applyResult = (result: CepProvisionResult) => {
    setLastResult(result);
    setActionSuccess(result.success ? result.message : "");
    setActionError(result.success ? null : result);
  };

  const handleDeploy = async () => {
    if (canonicalCustomerId === "" || !targetConfirmed) return;
    const config = currentConfig();
    setTargetOuConfirmation("");
    setTargetGroupConfirmation("");
    setBusy("deploy");
    setDeployStep(1);
    setActionError(null);
    setActionSuccess("");
    const t1 = setTimeout(() => setDeployStep(2), 600);
    const t2 = setTimeout(() => setDeployStep(3), 1600);
    try {
      const res = await provisionCepPolicies(config);
      clearTimeout(t1);
      clearTimeout(t2);
      setDeployStep(4);
      applyResult(res);
    } catch (error) {
      clearTimeout(t1);
      clearTimeout(t2);
      setActionError(error);
    } finally {
      setBusy(null);
    }
  };

  const handleRollback = async () => {
    if (canonicalCustomerId === "") return;
    if (!window.confirm(m.confirmRollback)) return;
    setBusy("rollback");
    setRollbackStep(1);
    setActionError(null);
    setActionSuccess("");
    const t1 = setTimeout(() => setRollbackStep(2), 600);
    const t2 = setTimeout(() => setRollbackStep(3), 1600);
    try {
      const res = await rollbackCepPolicies({
        customer_id: canonicalCustomerId,
        project_id: projectId,
        target_type: targetType,
        target_ou_id: targetType === "group" ? undefined : selectedOu,
        target_ou_path: targetType === "group" ? undefined : selectedUnit?.label,
        target_group_key: targetType === "group" ? selectedGroup.trim() : undefined,
        target_group_confirmation: targetType === "group" ? targetGroupConfirmation.trim() : undefined,
        access_level: modules.accessLevel,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      setRollbackStep(4);
      applyResult(res);
    } catch (error) {
      clearTimeout(t1);
      clearTimeout(t2);
      setActionError(error);
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadScript = async () => {
    if (canonicalCustomerId === "") return;
    setActionError(null);
    try {
      const result = await generateCepScript(currentConfig());
      const url = URL.createObjectURL(new Blob([result.script], { type: "text/x-python" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename || "cep_configure.py";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(error);
    }
  };

  const samples = [
    {
      key: "pii",
      label: m.dummyPiiLabel,
      value: m.dummyPiiValue,
      hint: m.dummyPiiHint,
    },
    {
      key: "card",
      label: m.dummyCreditCardLabel,
      value: m.dummyCreditCardValue,
      hint: m.dummyCreditCardHint,
    },
    {
      key: "code",
      label: m.dummySourceCodeLabel,
      value: m.dummySourceCodeValue,
      hint: m.dummySourceCodeHint,
    },
  ];

  const moduleToggles: Array<{
    key: keyof Omit<
      ModuleState,
      "dataBoundaryMode" | "accessLevel" | "dlpRegion" | "dlpRuleActions"
    >;
    label: string;
    description: string;
    beta?: boolean;
  }> = [
    {
      key: "corePolicies",
      label: m.moduleCorePolicies,
      description: m.moduleCorePoliciesDesc,
    },
    {
      key: "forceExtensions",
      label: m.moduleForceExtensions,
      description: m.moduleForceExtensionsDesc,
    },
    { key: "connectors", label: m.moduleConnectors, description: m.moduleConnectorsDesc },
    {
      key: "dlpRules",
      label: m.moduleDlpRules,
      description: m.moduleDlpRulesDesc,
      beta: true,
    },
  ];

  const anyDlpSelected = modules.dlpRules;

  const boundaryModes: Array<{
    value: CepDataBoundaryMode;
    label: string;
    description: string;
  }> = [
    {
      value: "copy_paste",
      label: m.dataBoundaryModeCopyPaste,
      description: m.dataBoundaryModeCopyPasteDesc,
    },
    {
      value: "block_non_corp",
      label: m.dataBoundaryModeBlockNonCorp,
      description: m.dataBoundaryModeBlockNonCorpDesc,
    },
    {
      value: "none",
      label: m.dataBoundaryModeNone,
      description: m.dataBoundaryModeNoneDesc,
    },
  ];

  const presets: Array<{ name: PresetName; label: string; description: string }> = [
    { name: "full", label: m.presetFullPoc, description: m.presetFullPocDesc },
    { name: "ai", label: m.presetAiProtection, description: m.presetAiProtectionDesc },
    { name: "endpoint", label: m.presetEndpoint, description: m.presetEndpointDesc },
    { name: "audit", label: m.presetAudit, description: m.presetAuditDesc },
  ];

  return (
    <main className="cep-page">
      <header className="cep-heading">
        <span className="cep-heading-mark" aria-hidden="true">
          <ShieldNetworkIcon size={26} />
        </span>
        <div>
          <h1>{m.title}</h1>
          <p className="cep-subtitle">{m.subtitle}</p>
        </div>
      </header>

            <div className="cep-assessment-banner">
        <div className="cep-assessment-banner-text">
          <h3>
            <SparklesIcon size={20} />
            <span>{m.assessModalTitle}</span>
          </h3>
          <p>{m.assessModalSubtitle}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setAssessmentModalOpen(true)}
          type="button"
        >
          <SparklesIcon size={16} />
          <span>{m.assessOpenBtn}</span>
        </button>
      </div>

      {assessmentAppliedNotice !== "" && (
        <p className="cep-banner cep-banner-ok" role="status">
          <CheckCircleIcon size={18} />
          <span>{assessmentAppliedNotice}</span>
        </p>
      )}

      <nav className="cep-nav-tabs" aria-label="CEP PoC Sections">
        <button
          type="button"
          className={`cep-nav-tab ${activeTab === "setup" ? "active" : ""}`}
          onClick={() => setActiveTab("setup")}
          aria-pressed={activeTab === "setup"}
        >
          🚀 {m.tabSetup}
        </button>
        <button
          type="button"
          className={`cep-nav-tab ${activeTab === "licensing" ? "active" : ""}`}
          onClick={() => setActiveTab("licensing")}
          aria-pressed={activeTab === "licensing"}
        >
          👥 {m.tabLicensing}
        </button>
        <button
          type="button"
          className={`cep-nav-tab ${activeTab === "dlp" ? "active" : ""}`}
          onClick={() => setActiveTab("dlp")}
          aria-pressed={activeTab === "dlp"}
        >
          🛡️ {m.tabDlp}
        </button>
        <button
          type="button"
          className={`cep-nav-tab ${activeTab === "operations" ? "active" : ""}`}
          onClick={() => setActiveTab("operations")}
          aria-pressed={activeTab === "operations"}
        >
          📊 {m.tabOperations}
        </button>
        <button
          type="button"
          className={`cep-nav-tab cep-nav-tab-all ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
          aria-pressed={activeTab === "all"}
        >
          📋 {m.tabAll}
        </button>
      </nav>

      {/* TAB 1: SETUP WIZARD */}
      <div
        className={`cep-tab-panel ${activeTab === "setup" || activeTab === "all" ? "active" : "hidden"}`}
      >
<section className="cep-section" aria-labelledby="cep-ou-title">
        <h2 id="cep-ou-title">{m.targetScopeCardTitle || m.targetOuCardTitle}</h2>
        <p>{targetType === "group" ? (m.targetScopeCardSubtitle || m.targetOuCardSubtitle) : m.targetOuCardSubtitle}</p>
        {canonicalCustomerId === "" && (
          <p className="cep-inline-error" role="alert">
            {m.canonicalCustomerIdRequired}
          </p>
        )}

        {/* Google OAuth Verification Bar */}
        {!ouLoaded && !groupsLoaded ? (
          <div className="cep-verify-box">
            <button
              className="btn btn-primary cep-auth-btn"
              disabled={canonicalCustomerId === "" || loadingOus || loadingGroups}
              onClick={() => void handleLoadOus()}
              type="button"
            >
              <KeyIcon size={16} />
              <span>{loadingOus || loadingGroups ? m.verifyingGoogleAccount : m.verifyGoogleAccount}</span>
            </button>
            <p className="cep-verify-hint">
              {m.verifyGoogleAccountHint}
            </p>
          </div>
        ) : (
          <div className="cep-auth-status-bar">
            <div className="cep-auth-status-left">
              <CheckCircleIcon size={18} />
              <span>
                <strong>Google アカウント認証完了</strong> (顧客 ID: <code>{canonicalCustomerId}</code> / OU: <strong className="tabular-nums">{organizationalUnits.length}</strong> 件, グループ: <strong className="tabular-nums">{groups.length}</strong> 件)
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-secondary cep-reauth-btn"
              disabled={loadingOus || loadingGroups}
              onClick={() => void handleLoadOus()}
            >
              {loadingOus || loadingGroups ? m.reloading : m.refreshOus}
            </button>
          </div>
        )}

        <div className="cep-target-type-nav" role="tablist" aria-label="Target Scope Type">
          <button
            type="button"
            role="tab"
            aria-selected={targetType === "ou"}
            className={`cep-target-type-btn ${targetType === "ou" ? "active" : ""}`}
            onClick={() => setTargetType("ou")}
          >
            🏢 {m.targetTypeOu || "組織部門 (OU)"}
            {organizationalUnits.length > 0 && (
              <span className="cep-badge-count tabular-nums">{organizationalUnits.length}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={targetType === "group"}
            className={`cep-target-type-btn ${targetType === "group" ? "active" : ""}`}
            onClick={() => setTargetType("group")}
          >
            👥 {m.targetTypeGroup || "Google グループ"}
            {groups.length > 0 && (
              <span className="cep-badge-count tabular-nums">{groups.length}</span>
            )}
          </button>
        </div>

        {targetType === "ou" ? (
          <>
            {ouError ? (
              <div>
                <p className="cep-inline-error" role="alert">
                  {m.ouLoadFailed}
                </p>
                <button
                  className="cep-btn cep-btn-secondary cep-retry-action"
                  disabled={loadingOus}
                  onClick={() => void handleLoadOus()}
                  type="button"
                >
                  {m.retry}
                </button>
              </div>
            ) : ouLoaded ? (
              <div className="cep-field">
                <div className="cep-field-heading">
                  <label htmlFor="cep-target-ou">{m.selectTargetOu}</label>
                  <button
                    className="text-action cep-refresh-action"
                    disabled={loadingOus}
                    onClick={() => void handleLoadOus()}
                    type="button"
                  >
                    {loadingOus ? m.reloading : m.refreshOus}
                  </button>
                </div>
                <select
                  id="cep-target-ou"
                  onChange={(event) => {
                    setSelectedOu(event.target.value);
                    setTargetOuConfirmation("");
                  }}
                  value={selectedOu}
                >
                  <option value="">{m.selectTargetOuPlaceholder}</option>
                  {organizationalUnits.map((unit) => (
                    <option disabled={unit.label === "/"} key={unit.value} value={unit.value}>
                      {unit.label === "/" ? `${unit.label} (${m.rootOuUnavailable})` : unit.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {selectedUnit !== undefined && selectedUnit.label !== "/" && (
              <div className="cep-license-warning-box">
                <div className="cep-license-warning-header">
                  <ExclamationCircleIcon size={20} />
                  <strong>{m.targetOuImpact}</strong>
                </div>
                <div className="cep-field">
                  <label htmlFor="cep-target-ou-confirmation">
                    {m.targetOuConfirmationLabel}
                  </label>
                  <div className="cep-ou-confirmation-row">
                    <code>{selectedUnit.label}</code>
                    <button
                      type="button"
                      className="btn btn-secondary cep-autofill-btn"
                      onClick={() => setTargetOuConfirmation(selectedUnit.label)}
                    >
                      {m.copyTargetOuPath}
                    </button>
                  </div>
                  <input
                    autoComplete="off"
                    id="cep-target-ou-confirmation"
                    onChange={(event) => setTargetOuConfirmation(event.target.value)}
                    placeholder={selectedUnit.label}
                    spellCheck={false}
                    type="text"
                    value={targetOuConfirmation}
                  />
                  <small>{m.targetOuConfirmationHint}</small>
                </div>
              </div>
            )}

            <label className="cep-check">
              <input
                checked={autoSubOus}
                onChange={(event) => setAutoSubOus(event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>{m.autoCreateSubOus}</strong>
                <small>{m.autoCreateSubOusHint}</small>
              </span>
            </label>
          </>
        ) : (
          <>
            {groupsLoaded || ouLoaded ? (
              <div className="cep-field">
                <div className="cep-field-heading">
                  <label htmlFor="cep-target-group">{m.selectTargetGroup}</label>
                  <button
                    className="text-action cep-refresh-action"
                    disabled={loadingGroups}
                    onClick={() => void handleLoadGroups()}
                    type="button"
                  >
                    {loadingGroups ? m.reloading : m.refreshGroups}
                  </button>
                </div>
                {groups.length > 0 ? (
                  <select
                    id="cep-target-group"
                    onChange={(event) => {
                      setSelectedGroup(event.target.value);
                      setTargetGroupConfirmation("");
                    }}
                    value={selectedGroup}
                  >
                    <option value="">{m.selectTargetGroupPlaceholder}</option>
                    {groups.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label ? `${group.label} (${group.value})` : group.value}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-muted">{m.groupLoadFailed}</p>
                )}
                <div className="cep-custom-group-input-row">
                  <label htmlFor="cep-target-group-manual" className="text-muted">
                    {m.orEnterGroupEmail}
                  </label>
                  <input
                    id="cep-target-group-manual"
                    type="email"
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                      setTargetGroupConfirmation("");
                    }}
                    placeholder={m.customGroupInputPlaceholder}
                  />
                </div>
              </div>
            ) : null}

            {selectedGroup.trim() !== "" && (
              <div className="cep-license-warning-box">
                <div className="cep-license-warning-header">
                  <ExclamationCircleIcon size={20} />
                  <strong>{m.targetGroupImpact}</strong>
                </div>
                <div className="cep-field">
                  <label htmlFor="cep-target-group-confirmation">
                    {m.targetGroupConfirmationLabel}
                  </label>
                  <div className="cep-ou-confirmation-row">
                    <code>{selectedGroup.trim()}</code>
                    <button
                      type="button"
                      className="btn btn-secondary cep-autofill-btn"
                      onClick={() => setTargetGroupConfirmation(selectedGroup.trim())}
                    >
                      {m.copyTargetGroupEmail}
                    </button>
                  </div>
                  <input
                    autoComplete="off"
                    id="cep-target-group-confirmation"
                    onChange={(event) => setTargetGroupConfirmation(event.target.value)}
                    placeholder={selectedGroup.trim()}
                    spellCheck={false}
                    type="text"
                    value={targetGroupConfirmation}
                  />
                  <small>{m.targetGroupConfirmationHint}</small>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      
<section className="cep-section" aria-labelledby="cep-presets-title">
        <h2 id="cep-presets-title">{m.presetsTitle}</h2>
        <p>{m.presetsSubtitle}</p>
        <div className="cep-preset-grid">
          {presets.map((preset) => {
            const isActive = activePreset === preset.name;
            return (
              <button
                className={`cep-preset ${isActive ? "active" : ""}`}
                key={preset.name}
                onClick={() => {
                  setActivePreset(preset.name);
                  setModules(PRESETS[preset.name]);
                  setDlpMatrix(PRESET_MATRICES[preset.name]);
                }}
                type="button"
                aria-pressed={isActive}
              >
                <div className="cep-preset-header">
                  <strong>{preset.label}</strong>
                  {isActive && (
                    <span className="cep-preset-badge">
                      <CheckIcon size={12} /> {m.activePresetBadge || "Active"}
                    </span>
                  )}
                </div>
                <span>{preset.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      
<section className="cep-section" aria-labelledby="cep-modules-title">
        <h2 id="cep-modules-title">{m.modulesTitle}</h2>
        <p>{m.modulesSubtitle}</p>

        <div className="cep-module-list">
          {moduleToggles.map((module) => (
            <label className="cep-check cep-module" key={module.key}>
              <input
                checked={modules[module.key]}
                onChange={(event) => update(module.key, event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>
                  {module.label}
                  {module.beta === true && <em className="cep-badge">{m.betaBadge}</em>}
                </strong>
                <small>{module.description}</small>
              </span>
            </label>
          ))}
        </div>
        {anyDlpSelected && <p className="cep-inline-note">{m.dlpBetaNote}</p>}

        {modules.dlpRules && (
          <div className="cep-dlp-hint-row">
            <p className="cep-inline-note">
              🛡️ {m.dlpMatrixTitle} の設定は「<button type="button" className="text-action" onClick={() => setActiveTab("dlp")}>{m.tabDlp}</button>」タブでカスタマイズできます。
            </p>
          </div>
        )}
        <fieldset className="cep-fieldset">
          <legend className="sr-only">{m.accessLevelTitle}</legend>
          <div className="cep-field">
            <label htmlFor="cep-access-level">{m.accessLevelTitle}</label>
            <select
              id="cep-access-level"
              onChange={(event) => update("accessLevel", event.target.value)}
              value={modules.accessLevel}
            >
              <option value={ACCESS_LEVEL_NONE}>{m.accessLevelNone}</option>
              <option value="AUTO_CREATE_CHROME_ANY">{m.accessLevelAutoAny}</option>
              <option value="AUTO_CREATE_PROFILE_MANAGED">{m.accessLevelAutoProfile}</option>
              <option value="AUTO_CREATE_BROWSER_MANAGED">{m.accessLevelAutoBrowser}</option>
              {accessLevels.length > 0 && (
                <optgroup label={m.accessLevelExistingGroup}>
                  {accessLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <small>{m.accessLevelHint}</small>
          </div>
          {accessLevelError && accessLevels.length === 0 && (
            <p className="cep-inline-note">{m.accessLevelLoadFailed}</p>
          )}
        </fieldset>

        <fieldset className="cep-fieldset">
          <legend>{m.dataBoundaryModeTitle}</legend>
          <div className="cep-module-list">
            {boundaryModes.map((mode) => (
              <label className="cep-check cep-module" key={mode.value}>
                <input
                  checked={modules.dataBoundaryMode === mode.value}
                  name="cep-data-boundary"
                  onChange={() => update("dataBoundaryMode", mode.value)}
                  type="radio"
                />
                <span>
                  <strong>{mode.label}</strong>
                  <small>{mode.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="cep-field">
          <label htmlFor="cep-internal-urls">{m.internalUrlsTitle}</label>
          <textarea
            id="cep-internal-urls"
            onChange={(event) => setInternalUrls(event.target.value)}
            placeholder={m.internalUrlsPlaceholder}
            rows={3}
            value={internalUrls}
          />
          <small>{m.internalUrlsHint}</small>
        </div>
      </section>

      
      </div>

      {/* TAB 2: USERS & LICENSING */}
      <div
        className={`cep-tab-panel ${activeTab === "licensing" || activeTab === "all" ? "active" : "hidden"}`}
      >
<section className="cep-section cep-license-section" aria-labelledby="cep-license-title">
        <h2 id="cep-license-title">{m.licenseCardTitle}</h2>
        <p>{m.licenseCardSubtitle}</p>
        <p className="cep-inline-note">{m.licensePilotLimitNotice}</p>

        <div className="cep-license-warning-box">
          <div className="cep-license-warning-header">
            <ExclamationCircleIcon size={20} />
            <strong>{m.licenseAutoAssignWarning}</strong>
          </div>
          <ol className="cep-license-steps">
            {m.licenseAutoAssignSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <a
            className="cep-license-link"
            href="https://admin.google.com/ac/billing/licensesettings"
            rel="noreferrer"
            target="_blank"
          >
            {m.licenseAutoAssignWarningLink} ↗
          </a>
        </div>

        <div className="cep-license-card">
          <div className="cep-license-card-info">
            <div className="cep-license-card-title">
              <UsersIcon size={18} className="cep-license-card-icon" />
              <span>{selectedUnit?.label ? selectedUnit.label : m.selectTargetOu}</span>
            </div>
          </div>
          <button
            className="btn btn-primary cep-license-btn"
            disabled={
              canonicalCustomerId === "" ||
              selectedOu === "" ||
              !targetOuConfirmed ||
              assigningLicenses
            }
            onClick={handleAssignLicenses}
            type="button"
          >
            <UsersIcon size={16} />
            {assigningLicenses ? m.btnAssigningLicenses : m.btnAssignLicensesToOu}
          </button>
        </div>

        {assigningLicenses && (
          <div className="cep-progress-box" role="status" aria-live="polite">
            <div className="cep-progress-header">
              <span>{m.licenseProgressTitle}</span>
              <span className="cep-progress-percentage">{Math.round((licenseStep / 3) * 100)}%</span>
            </div>
            <progress className="cep-progress-bar-el" max={100} value={Math.round((licenseStep / 3) * 100)} />
            <div className="cep-progress-steps">
              <span className={`cep-progress-step-item ${licenseStep >= 1 ? (licenseStep > 1 ? "done" : "active") : "pending"}`}>
                {licenseStep > 1 ? "✓ " : "• "}{m.licenseStep1}
              </span>
              <span className={`cep-progress-step-item ${licenseStep >= 2 ? (licenseStep > 2 ? "done" : "active") : "pending"}`}>
                {licenseStep > 2 ? "✓ " : "• "}{m.licenseStep2}
              </span>
              <span className={`cep-progress-step-item ${licenseStep >= 3 ? "done" : "pending"}`}>
                {licenseStep >= 3 ? "✓ " : "• "}{m.licenseStep3}
              </span>
            </div>
          </div>
        )}

        {licenseResult !== null && licenseResult.success && (
          <div className="cep-banner cep-banner-ok">
            <CheckCircleIcon size={18} />
            <div>
              <strong>{licenseResult.message}</strong>
            </div>
          </div>
        )}
        {licenseError != null && (
          <ErrorDiagnosticCard
            error={licenseError}
            messages={messages}
            onRetry={handleAssignLicenses}
          />
        )}
      </section>

      
      </div>

      {/* TAB 3: DLP & THREAT MATRIX */}
      <div
        className={`cep-tab-panel ${activeTab === "dlp" || activeTab === "all" ? "active" : "hidden"}`}
      >
        <section className="cep-section" aria-labelledby="cep-dlp-matrix-heading">
{modules.dlpRules && (
          <DlpMatrixTable
            customMessage={dlpCustomMessage}
            matrix={dlpMatrix}
            messages={messages}
            onChange={setDlpMatrix}
            onCustomMessageChange={setDlpCustomMessage}
            onRegionChange={(reg) => update("dlpRegion", reg)}
            onSaveContentChange={setDlpSaveContent}
            region={modules.dlpRegion}
            saveContent={dlpSaveContent}
          />
        )}

        
        </section>
      </div>

      {/* TAB 4: OPERATIONS & TESTING */}
      <div
        className={`cep-tab-panel ${activeTab === "operations" || activeTab === "all" ? "active" : "hidden"}`}
      >
<section className="cep-section" aria-labelledby="cep-roles-title">
        <h2 id="cep-roles-title">{m.rolesCardTitle}</h2>
        <p>{m.rolesCardSubtitle}</p>

        <div className="cep-role-grid">
          <article className="cep-role">
            <strong>{m.roleAdminLabel}</strong>
            <span>{m.roleAdminDesc}</span>
          </article>
          <article className="cep-role">
            <strong>{m.roleAuditorLabel}</strong>
            <span>{m.roleAuditorDesc}</span>
          </article>
        </div>

        <div className="cep-role-form cep-role-form-panel">
          <div className="cep-field">
            <label htmlFor="role-type-select">{m.roleTypeSelectLabel}</label>
            <select
              id="role-type-select"
              onChange={(e) => setRoleType(e.target.value as "both" | "administrator" | "auditor")}
              value={roleType}
            >
              <option value="both">{m.roleTypeBoth}</option>
              <option value="administrator">{m.roleTypeAdminOnly}</option>
              <option value="auditor">{m.roleTypeAuditorOnly}</option>
            </select>
          </div>

          <div className="cep-field">
            <label htmlFor="role-assignee-email">{m.roleAssigneeEmailLabel}</label>
            <input
              id="role-assignee-email"
              onChange={(e) => setAssignedUserEmail(e.target.value)}
              placeholder={m.roleAssigneeEmailPlaceholder}
              type="email"
              value={assignedUserEmail}
            />
            <small>{m.roleAssigneeEmailHint}</small>
          </div>
        </div>

        {selectedOu && (
          <label className="cep-check cep-role-ou-check">
            <input
              checked={scopeRoleToOu}
              onChange={(e) => setScopeRoleToOu(e.target.checked)}
              type="checkbox"
            />
            <span>{m.roleScopeOuCheckbox} ({selectedUnit?.label || selectedOu})</span>
          </label>
        )}

        <div className="cep-role-actions">
          <button
            className="btn btn-primary"
            disabled={creatingRoles || !canonicalCustomerId}
            onClick={handleCreateRoles}
            type="button"
          >
            {creatingRoles ? m.roleCreatingBtn : m.roleCreateAssignBtn}
          </button>

          <a
            className="btn btn-secondary cep-role-action-btn"
            href="https://admin.google.com/ac/roles"
            rel="noreferrer"
            target="_blank"
          >
            <span>{m.rolesAdminConsoleLink}</span>
            <ExternalLinkIcon size={14} />
          </a>
        </div>

        {creatingRoles && (
          <div className="cep-progress-box" role="status" aria-live="polite">
            <div className="cep-progress-header">
              <span>{m.roleProgressTitle}</span>
              <span className="cep-progress-percentage">{roleStep * 25}%</span>
            </div>
            <progress className="cep-progress-bar-el" max={100} value={roleStep * 25} />
            <div className="cep-progress-steps">
              <span className={`cep-progress-step-item ${roleStep >= 1 ? (roleStep > 1 ? "done" : "active") : "pending"}`}>
                {roleStep > 1 ? "✓ " : "• "}{m.roleStep1}
              </span>
              <span className={`cep-progress-step-item ${roleStep >= 2 ? (roleStep > 2 ? "done" : "active") : "pending"}`}>
                {roleStep > 2 ? "✓ " : "• "}{m.roleStep2}
              </span>
              <span className={`cep-progress-step-item ${roleStep >= 3 ? (roleStep > 3 ? "done" : "active") : "pending"}`}>
                {roleStep > 3 ? "✓ " : "• "}{m.roleStep3}
              </span>
              <span className={`cep-progress-step-item ${roleStep >= 4 ? "done" : "pending"}`}>
                {roleStep >= 4 ? "✓ " : "• "}{m.roleStep4}
              </span>
            </div>
          </div>
        )}

        {roleResult && roleResult.success && (
          <p className="cep-banner cep-banner-success cep-role-banner" role="status">
            {roleResult.message}
          </p>
        )}
        {roleError != null && (
          <ErrorDiagnosticCard
            error={roleError}
            messages={messages}
            onRetry={handleCreateRoles}
          />
        )}

        <p className="cep-inline-note">{m.rolesVerificationNote}</p>
      </section>

      <section className="cep-section" aria-labelledby="cep-gemini-enterprise-title">
        <div className="cep-section-header">
          <div className="cep-title-with-badge">
            <h2 id="cep-gemini-enterprise-title">{m.geminiEnterpriseTitle}</h2>
            <span className="cep-badge-ai">Gemini Enterprise / Vertex AI</span>
          </div>
          <p>{m.geminiEnterpriseSubtitle}</p>
        </div>

        <div className="cep-warning-banner" role="note">
          <ExclamationCircleIcon size={18} />
          <div className="cep-warning-banner-body">
            <strong>{m.geminiAdminLockoutWarningTitle}</strong>
            <p>{m.geminiAdminLockoutWarningText}</p>
          </div>
        </div>

        <div className="cep-gemini-form">
          <div className="cep-section-header">
            <h3>{m.geminiAutoProvisionTitle}</h3>
            <p>{m.geminiAutoProvisionSubtitle}</p>
          </div>

          <div className="cep-form-grid">
            <div className="cep-form-field">
              <label htmlFor="gemini-project-input">{m.geminiTargetProjectLabel}</label>
              <input
                id="gemini-project-input"
                onChange={(e) => setGeminiProjectInput(e.target.value)}
                placeholder={projectId || "e.g. my-gemini-project"}
                type="text"
                value={geminiProjectInput}
              />
            </div>
            <div className="cep-form-field">
              <label htmlFor="gemini-policy-input">{m.geminiPolicyIdLabel}</label>
              <input
                id="gemini-policy-input"
                onChange={(e) => setGeminiPolicyIdInput(e.target.value)}
                placeholder="e.g. 123456789012 (optional)"
                type="text"
                value={geminiPolicyIdInput}
              />
            </div>
          </div>

          <div className="cep-form-field">
            <label htmlFor="gemini-perim-name">{m.geminiPerimeterNameLabel}</label>
            <input
              id="gemini-perim-name"
              onChange={(e) => setGeminiPerimeterName(e.target.value)}
              placeholder="gemini_zero_trust_poc"
              type="text"
              value={geminiPerimeterName}
            />
          </div>

          <div className="cep-checkbox-list">
            <label>
              <input
                checked={geminiEnforceAccessLevel}
                onChange={(e) => setGeminiEnforceAccessLevel(e.target.checked)}
                type="checkbox"
              />
              <span>{m.geminiEnforceAccessLevelLabel}</span>
            </label>
            {geminiEnforceAccessLevel && (
              <div className="cep-form-field cep-gemini-level-box">
                <label htmlFor="gemini-access-level-select">{m.geminiAccessLevelSelectLabel}</label>
                <select
                  id="gemini-access-level-select"
                  onChange={(e) => setGeminiAccessLevelName(e.target.value)}
                  value={geminiAccessLevelName}
                >
                  <option value="">{m.geminiAccessLevelDefaultOption}</option>
                  {accessLevels.length > 0 && (
                    <optgroup label={m.accessLevelExistingGroup}>
                      {accessLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <small>{m.geminiAccessLevelSelectHint}</small>
              </div>
            )}
            <label>
              <input
                checked={geminiEnforcePerimeter}
                onChange={(e) => setGeminiEnforcePerimeter(e.target.checked)}
                type="checkbox"
              />
              <span>{m.geminiEnforcePerimeterLabel}</span>
            </label>
            <label>
              <input
                checked={geminiEnforceRca}
                onChange={(e) => setGeminiEnforceRca(e.target.checked)}
                type="checkbox"
              />
              <span>{m.geminiEnforceRcaLabel}</span>
            </label>
            <label>
              <input
                checked={geminiDryRun}
                onChange={(e) => setGeminiDryRun(e.target.checked)}
                type="checkbox"
              />
              <span>{m.geminiDryRunLabel}</span>
            </label>
          </div>

          {geminiEnforceRca && (
            <div className="cep-form-field cep-rca-group-box">
              <label htmlFor="gemini-rca-group-input">{m.geminiRcaGroupKeyLabel}</label>
              <input
                id="gemini-rca-group-input"
                onChange={(e) => setGeminiRcaGroupKey(e.target.value)}
                placeholder={m.geminiRcaGroupKeyPlaceholder}
                type="text"
                value={geminiRcaGroupKey}
              />
              <small>{m.geminiRcaGroupKeyHint}</small>
            </div>
          )}

          {!geminiDryRun && (
            <div className="cep-form-field cep-gemini-confirm-box">
              <label htmlFor="gemini-project-confirm">
                {m.geminiConfirmProjectLabel}
              </label>
              <input
                autoComplete="off"
                id="gemini-project-confirm"
                onChange={(e) => setGeminiProjectConfirmation(e.target.value)}
                placeholder={(geminiProjectInput || projectId).trim()}
                spellCheck={false}
                type="text"
                value={geminiProjectConfirmation}
              />
              <small>{m.geminiConfirmProjectHint}</small>
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={
              provisioningGemini ||
              (!geminiProjectInput.trim() && !projectId) ||
              (!geminiDryRun &&
                geminiProjectConfirmation.trim() !==
                  (geminiProjectInput || projectId).trim())
            }
            onClick={handleProvisionGeminiZeroTrust}
            type="button"
          >
            {provisioningGemini ? m.geminiAutoProvisioningBtn : m.geminiAutoProvisionBtn}
          </button>

          {provisioningGemini && (
            <div className="cep-progress-box" role="status" aria-live="polite">
              <div className="cep-progress-header">
                <span>{m.geminiAutoProvisioningBtn}</span>
                <span className="cep-progress-percentage">
                  {Math.min(100, Math.round((geminiStep / (geminiEnforceRca ? 5 : 4)) * 100))}%
                </span>
              </div>
              <progress
                className="cep-progress-bar-el"
                max={100}
                value={Math.min(100, Math.round((geminiStep / (geminiEnforceRca ? 5 : 4)) * 100))}
              />
              <div className="cep-progress-steps">
                <span className={`cep-progress-step-item ${geminiStep >= 1 ? (geminiStep > 1 ? "done" : "active") : "pending"}`}>
                  {geminiStep > 1 ? "✓ " : "• "}{m.geminiStep1}
                </span>
                <span className={`cep-progress-step-item ${geminiStep >= 2 ? (geminiStep > 2 ? "done" : "active") : "pending"}`}>
                  {geminiStep > 2 ? "✓ " : "• "}{m.geminiStep2}
                </span>
                <span className={`cep-progress-step-item ${geminiStep >= 3 ? (geminiStep > 3 ? "done" : "active") : "pending"}`}>
                  {geminiStep > 3 ? "✓ " : "• "}{m.geminiStep3}
                </span>
                <span className={`cep-progress-step-item ${geminiStep >= 4 ? (geminiStep > 4 || !geminiEnforceRca ? "done" : "active") : "pending"}`}>
                  {geminiStep > 4 || (!geminiEnforceRca && geminiStep >= 4) ? "✓ " : "• "}{m.geminiStep4}
                </span>
                {geminiEnforceRca && (
                  <span className={`cep-progress-step-item ${geminiStep >= 5 ? "done" : "pending"}`}>
                    {geminiStep >= 5 ? "✓ " : "• "}{m.geminiStep5Rca}
                  </span>
                )}
              </div>
            </div>
          )}

          {geminiResult && geminiResult.success && (
            <div className="cep-result-summary" role="status">
              <h4>✓ {m.geminiSuccessTitle}</h4>
              <p>{geminiResult.message}</p>
              <ul>
                {geminiResult.access_policy_name && (
                  <li><strong>Access Policy:</strong> <code>{geminiResult.access_policy_name}</code></li>
                )}
                {geminiResult.access_level_name && (
                  <li><strong>Access Level:</strong> <code>{geminiResult.access_level_name}</code></li>
                )}
                {geminiResult.service_perimeter_name && (
                  <li><strong>Service Perimeter:</strong> <code>{geminiResult.service_perimeter_name}</code></li>
                )}
                {geminiResult.rca_binding_name && (
                  <li><strong>{m.geminiRcaBindingLabel}:</strong> <code>{geminiResult.rca_binding_name}</code></li>
                )}
                {geminiResult.project_number && (
                  <li><strong>Project Number:</strong> <code>{geminiResult.project_number}</code></li>
                )}
                <li><strong>Mode:</strong> {geminiResult.dry_run ? "Dry-Run / Audit (Logging Only)" : "Enforced (Strict)"}</li>
              </ul>
            </div>
          )}

          {geminiError != null && (
            <ErrorDiagnosticCard
              error={geminiError}
              messages={messages}
              onRetry={handleProvisionGeminiZeroTrust}
            />
          )}
        </div>

        <details className="step-collapsible cep-gemini-arch-details">
          <summary className="step-collapsible-summary">
            {m.geminiArchDetailsToggle}
          </summary>
          <div className="cep-gemini-layers-grid">
            <div className="cep-gemini-layer-card">
              <span className="layer-badge">Layer 1: Web UI &amp; Data Protection</span>
              <h3>{m.geminiLayer1Title}</h3>
              <p>{m.geminiLayer1Desc}</p>
              <ul>
                <li><code>vertexaisearch.cloud.google.com</code> &amp; <code>gemini.google.com</code></li>
                <li>{m.geminiLayer1Bullet1}</li>
                <li>{m.geminiLayer1Bullet2}</li>
              </ul>
            </div>

            <div className="cep-gemini-layer-card">
              <span className="layer-badge">Layer 2: Context-Aware Access (CAA)</span>
              <h3>{m.geminiLayer2Title}</h3>
              <p>{m.geminiLayer2Desc}</p>
              <ul>
                <li>{m.geminiLayer2Bullet1}</li>
                <li>{m.geminiLayer2Bullet2}</li>
              </ul>
            </div>

            <div className="cep-gemini-layer-card">
              <span className="layer-badge">Layer 3: Google Cloud VPC-SC &amp; Agent Gateway</span>
              <h3>{m.geminiLayer3Title}</h3>
              <p>{m.geminiLayer3Desc}</p>
              <ul>
                <li><code>discoveryengine.googleapis.com</code></li>
                <li>{m.geminiLayer3Bullet1}</li>
                <li>{m.geminiLayer3Bullet2}</li>
              </ul>
            </div>
          </div>

          <div className="cep-gemini-cli-box">
            <div className="cli-header">
              <strong>{m.geminiCliTitle}</strong>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopy(geminiVpcScSnippet, "gemini-vpc-sc")}
                type="button"
              >
                {copiedSnippet === "gemini-vpc-sc" ? m.copiedToClipboard : m.geminiCliCopyBtn}
              </button>
            </div>
            <pre className="cli-code">
              <code>{geminiVpcScSnippet}</code>
            </pre>
          </div>

          <div className="cep-gemini-cli-box">
            <div className="cli-header">
              <strong>{m.geminiRcaCliTitle}</strong>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopy(geminiRcaSnippet, "gemini-rca")}
                type="button"
              >
                {copiedSnippet === "gemini-rca" ? m.copiedToClipboard : m.geminiRcaCliCopyBtn}
              </button>
            </div>
            <pre className="cli-code">
              <code>{geminiRcaSnippet}</code>
            </pre>
          </div>
        </details>
      </section>

      <section className="cep-section" aria-labelledby="cep-testing-title">
        <h2 id="cep-testing-title">{m.testingScenariosTitle}</h2>
        <p>{m.testingScenariosSubtitle}</p>

        <div className="cep-sample-list">
          {samples.map((sample) => (
            <div className="cep-sample" key={sample.key}>
              <div>
                <span className="cep-sample-label">{sample.label}</span>
                <code>{sample.value}</code>
                <small>{sample.hint}</small>
              </div>
              <button
                onClick={() => handleCopy(sample.value, sample.key)}
                type="button"
              >
                {copiedSnippet === sample.key ? m.copiedToClipboard : m.copyDummyData}
              </button>
            </div>
          ))}
        </div>

        <ol className="cep-scenarios">
          <li>
            <strong>{m.scenarioGenAiTitle}</strong>
            <p>{m.scenarioGenAiStep}</p>
          </li>
          <li>
            <strong>{m.scenarioDataBoundaryTitle}</strong>
            <p>{m.scenarioDataBoundaryStep}</p>
          </li>
          <li>
            <strong>{m.scenarioWatermarkTitle}</strong>
            <p>{m.scenarioWatermarkStep}</p>
          </li>
        </ol>
      </section>

      
<section className="cep-section cep-manual" aria-labelledby="cep-manual-title">
        <h2 id="cep-manual-title">{m.manualChecklistTitle}</h2>
        <p>{m.manualChecklistSubtitle}</p>
        <ul className="cep-manual-list">
          {m.manualChecklistItems.map((item) => (
            <li key={item.title}>
              <a href={item.href} rel="noreferrer" target="_blank">
                {item.title}
              </a>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      
      </div>

      {/* PERSISTENT ACTIONS & RESULTS ACROSS ALL TABS */}
<div className="cep-actions">
        <button
          className="primary-action"
          disabled={!canDeploy}
          onClick={handleDeploy}
          type="button"
        >
          {busy === "deploy" ? m.btnDeploying : m.btnDeploy}
        </button>
        <button
          className="secondary-action"
          disabled={canonicalCustomerId === "" || selectedOu === "" || busy !== null}
          onClick={handleDownloadScript}
          type="button"
        >
          {m.btnDownloadScript}
        </button>
        <button
          className="danger-action cep-rollback"
          disabled={
            canonicalCustomerId === "" ||
            (targetType === "group" ? selectedGroup.trim() === "" : selectedOu === "") ||
            busy !== null
          }
          onClick={handleRollback}
          type="button"
        >
          {busy === "rollback" ? m.btnRollingBack : m.btnRollback}
        </button>
      </div>

      {busy === "deploy" && (
        <div className="cep-progress-box" role="status" aria-live="polite">
          <div className="cep-progress-header">
            <span>{m.deployProgressTitle}</span>
            <span className="cep-progress-percentage">{deployStep * 25}%</span>
          </div>
          <progress className="cep-progress-bar-el" max={100} value={deployStep * 25} />
          <div className="cep-progress-steps">
            <span className={`cep-progress-step-item ${deployStep >= 1 ? (deployStep > 1 ? "done" : "active") : "pending"}`}>
              {deployStep > 1 ? "✓ " : "• "}{m.deployStep1}
            </span>
            <span className={`cep-progress-step-item ${deployStep >= 2 ? (deployStep > 2 ? "done" : "active") : "pending"}`}>
              {deployStep > 2 ? "✓ " : "• "}{m.deployStep2}
            </span>
            <span className={`cep-progress-step-item ${deployStep >= 3 ? (deployStep > 3 ? "done" : "active") : "pending"}`}>
              {deployStep > 3 ? "✓ " : "• "}{m.deployStep3}
            </span>
            <span className={`cep-progress-step-item ${deployStep >= 4 ? "done" : "pending"}`}>
              {deployStep >= 4 ? "✓ " : "• "}{m.deployStep4}
            </span>
          </div>
        </div>
      )}

      {busy === "rollback" && (
        <div className="cep-progress-box" role="status" aria-live="polite">
          <div className="cep-progress-header">
            <span>{m.rollbackProgressTitle}</span>
            <span className="cep-progress-percentage">{rollbackStep * 25}%</span>
          </div>
          <progress className="cep-progress-bar-el" max={100} value={rollbackStep * 25} />
          <div className="cep-progress-steps">
            <span className={`cep-progress-step-item ${rollbackStep >= 1 ? (rollbackStep > 1 ? "done" : "active") : "pending"}`}>
              {rollbackStep > 1 ? "✓ " : "• "}{m.rollbackStep1}
            </span>
            <span className={`cep-progress-step-item ${rollbackStep >= 2 ? (rollbackStep > 2 ? "done" : "active") : "pending"}`}>
              {rollbackStep > 2 ? "✓ " : "• "}{m.rollbackStep2}
            </span>
            <span className={`cep-progress-step-item ${rollbackStep >= 3 ? (rollbackStep > 3 ? "done" : "active") : "pending"}`}>
              {rollbackStep > 3 ? "✓ " : "• "}{m.rollbackStep3}
            </span>
            <span className={`cep-progress-step-item ${rollbackStep >= 4 ? "done" : "pending"}`}>
              {rollbackStep >= 4 ? "✓ " : "• "}{m.rollbackStep4}
            </span>
          </div>
        </div>
      )}
      {!anyModuleSelected && <p className="cep-inline-note">{m.noModulesSelected}</p>}

      {actionSuccess !== "" && (
        <p className="cep-banner cep-banner-ok">
          <CheckCircleIcon size={18} />
          <span>{actionSuccess}</span>
        </p>
      )}
      {actionError != null && (
        <ErrorDiagnosticCard
          error={actionError}
          messages={messages}
          onRetry={busy === "deploy" ? handleDeploy : handleRollback}
        />
      )}

      {lastResult !== null && lastResult.created_items.length > 0 && (
        <section className="cep-outcome" aria-labelledby="cep-applied-title">
          <h3 id="cep-applied-title">{m.appliedTitle}</h3>
          <ul>
            {lastResult.created_items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {lastResult !== null && lastResult.skipped_items.length > 0 && (
        <section className="cep-outcome cep-outcome-skipped" aria-labelledby="cep-skipped-title">
          <h3 id="cep-skipped-title">{m.skippedTitle}</h3>
          <ul>
            {lastResult.skipped_items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="cep-outcome" aria-labelledby="cep-trace-title">
        <h3 id="cep-trace-title">{m.statusLogTitle}</h3>
        {lastResult !== null && lastResult.debug_trace.length > 0 ? (
          <details className="cep-trace-details" open={false}>
            <summary className="cep-trace-summary">
              <span>{m.statusLogTitle}</span>
              <span className="cep-trace-count">（{lastResult.debug_trace.length} 件の API 呼び出し）</span>
            </summary>
            <ul className="cep-trace">
              {lastResult.debug_trace.map((entry, index) => (
                <li className={entry.ok ? "ok" : "failed"} key={`${entry.label}-${index}`}>
                  <span>
                    {entry.method} {entry.label}
                  </span>
                  <small>{entry.error ?? `HTTP ${entry.status}`}</small>
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <p>{m.noActionYet}</p>
        )}
      </section>
    
      <SecurityAssessmentModal
        isOpen={assessmentModalOpen}
        onClose={() => setAssessmentModalOpen(false)}
        onApplyRecommendation={handleApplyRecommendation}
        messages={messages}
      />
    </main>
  );
}
