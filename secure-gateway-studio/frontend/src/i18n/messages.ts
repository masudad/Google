import type { Locale } from "../lib/setup-state";

export interface WorkflowMessages {
  identitiesTitle: string;
  identitiesIntro: string;
  cloudAccount: string;
  cloudAccountDescription: string;
  workspaceAccount: string;
  workspaceAccountDescription: string;
  projectId: string;
  operatorIdentity: string;
  adminIdentity: string;
  connect: string;
  connected: string;
  notConnected: string;
  checking: string;
  connectionFailed: string;
  adcUnavailable: string;
  cloudValidationFailed: string;
  workspaceValidationFailed: string;
  workspaceRequiredRolesHint: string;
  specInvalid: string;
  connectionNotice: string;
  bootstrapDeployer: string;
  bootstrapDeployerHint: string;
  bootstrapConfirm: string;
  bootstrapLegacyMigrationConfirm: string;
  bootstrapReplacementConfirm: string;
  bootstrapDeletedDeployerConfirm: string;
  bootstrapWorking: string;
  bootstrapValidating: string;
  bootstrapComplete: string;
  bootstrapNext: string;
  bootstrapFailed: string;
  signInGoogle: string;
  signingInGoogle: string;
  signInGoogleHint: string;
  signInRequired: string;
  signInOperatorChanged: string;
  progressTitle: string;
  progressCount: (completed: number, total: number) => string;
  currentOperation: string;
  failedOperation: string;
  failedOperations: string;
  manualCleanupTitle: string;
  manualCleanupDescription: string;
  waitingForOperation: string;
  environmentTitle: string;
  environmentIntro: string;
  deploymentName: string;
  region: string;
  zone: string;
  secondaryZone: string;
  sourceImage: string;
  sourceImageHint: string;
  sourceImageAutoHint: string;
  sampleImageResolving: string;
  sampleImageResolveFailed: string;
  sampleImageConnectionRequired: string;
  sampleImageResolved: string;
  minimumReplicas: string;
  maximumReplicas: string;
  cpuTarget: string;
  autoscalingHint: string;
  network: string;
  vpcName: string;
  vpcSameProjectHint: string;
  vpcOptionsFailed: string;
  subnetName: string;
  upstreamVpcProjectId: string;
  upstreamVpcProjectIdHint: string;
  upstreamVpcCrossProjectPrerequisite: string;
  managedSample: string;
  managedSampleDescription: string;
  existingBackend: string;
  existingBackendDescription: string;
  directHttps: string;
  directHttpsDescription: string;
  internalHttpsLb: string;
  internalHttpsLbDescription: string;
  configureSampleVm: string;
  configureSampleVmDescription: string;
  directSampleVmAction: string;
  directSampleVmDescription: string;
  managedSampleVmAction: string;
  managedSampleVmDescription: string;
  existingSampleVmDescription: string;
  legacyNginxTitle: string;
  legacyNginxDescription: string;
  proxySubnetCidr: string;
  backendUrl: string;
  directHttpsUrl: string;
  applicationEgressRegion: string;
  applicationEgressRegionHint: string;
  backendLocation: string;
  backendLocationGcp: string;
  backendLocationAws: string;
  backendLocationAzure: string;
  backendLocationOnPrem: string;
  confirmBackendConnectivity: string;
  backendConnectivityHint: string;
  cloudConsoleLinks: string;
  openInCloudConsole: string;
  computeInstancesLink: string;
  computeResourcesHint: string;
  securityGatewaysLink: string;
  securityGatewayHint: string;
  vpcNetworksLink: string;
  cloudNatLink: string;
  cloudNatHint: string;
  chromeAdminLink: string;
  architectureBlueprint: string;
  directHttpsConnectivity: string;
  directHttpsConnectivityHint: string;
  hostname: string;
  noExternalIpNotice: string;
  certificateStepTitle: string;
  certificateIntro: string;
  internalLbCertificateIntro: string;
  caPool: string;
  caName: string;
  secretName: string;
  certificateNotice: string;
  internalLbCertificateNotice: string;
  directCertificateIntro: string;
  directCertificateNotice: string;
  directPrivateCertificate: string;
  accessTitle: string;
  accessIntro: string;
  customerId: string;
  targetOuId: string;
  managedChromeAccessLevel: string;
  managedChromeAccessLevelHint: string;
  managedChromeAccessLevelNone: string;
  managedChromeAccessLevelNoneHint: string;
  optionsLoadedHint: string;
  optionsLoading: string;
  chooseOption: string;
  noOptions: string;
  retryOptions: string;
  ouOptionsFailed: string;
  accessLevelOptionsFailed: string;
  groupOptionsFailed: string;
  prerequisitesTitle: string;
  confirmEnterpriseLicense: string;
  confirmWorkspaceServices: string;
  confirmEndpointVerification: string;
  confirmTestOu: string;
  principalType: string;
  principalValue: string;
  addPrincipal: string;
  removePrincipal: string;
  user: string;
  group: string;
  domain: string;
  accessNotice: string;
  reviewTitle: string;
  reviewIntro: string;
  configuration: string;
  safetyGates: string;
  ready: string;
  incomplete: string;
  verified: string;
  plannedOnApply: string;
  manualCheck: string;
  actionRequired: string;
  approvalPending: string;
  reviewGateLegend: string;
  gateLabels: Record<string, string>;
  gateDescriptions: Record<string, string>;
  managedProfileEvidence: (total: number, profileOnly: number, sync: string | null) => string;
  clientExtensionEvidence: (name: string, version: string | null, installed: boolean) => string;
  missingPermissions: (count: number) => string;
  approvePlan: string;
  approvePlanDescription: string;
  generatePlan: string;
  runPreflight: string;
  preparingPlan: string;
  planReady: string;
  planBlocked: string;
  changesCount: (count: number) => string;
  preflightProgressTitle: string;
  preflightStage1: string;
  preflightStage2: string;
  preflightStage3: string;
  preflightStage4: string;
  preflightStage5: string;
  preflightComplete: string;
  plannedChangesTitle: string;
  plannedChangesIntro: string;
  changeAction: (action: string) => string;
  changeRisk: (risk: string) => string;
  changeSummary: (resourceType: string, fallback: string) => string;
  diagnosticsTitle: string;
  apiEvidence: string;
  diagnosticMessage: (code: string, fallback: string) => string;
  diagnosticRemediation: (code: string, fallback: string | null) => string;
  approveWorking: string;
  approvalReady: string;
  continueToApply: string;
  applyTitle: string;
  applyIntro: string;
  preflight: string;
  desiredStatePlan: string;
  applyChanges: string;
  applyLocked: string;
  applying: string;
  runSucceeded: string;
  runRollingBack: string;
  runRollbackUnavailable: string;
  runRollbackFailed: string;
  runRolledBack: string;
  runFinalized: string;
  noActiveOperation: string;
  finalizedOperationCount: (count: number) => string;
  runInterrupted: string;
  resumeRun: string;
  resumingRun: string;
  retryRollback: string;
  retryingRollback: string;
  runFailed: string;
  operationCount: (count: number) => string;
  evidenceNotice: string;
  caHandoffTitle: string;
  caHandoffDescription: string;
  caHandoffSteps: readonly [string, string, string];
  downloadRootCa: string;
  downloadingRootCa: string;
  openAdminConsoleGuide: string;
  caDownloadFailed: string;
  connectionHandoffTitle: string;
  testUrlLabel: string;
  sebTroubleshootingHint: string;
  previous: string;
  next: string;
}

export interface OperationsMessages {
  deploymentsTitle: string;
  deploymentsIntro: string;
  evidenceTitle: string;
  evidenceIntro: string;
  loading: string;
  loadFailed: string;
  noRuns: string;
  noEvents: string;
  runId: string;
  status: string;
  started: string;
  operationsCount: string;
  manage: string;
  close: string;
  overviewTab: string;
  logsTab: string;
  resourcesTab: string;
  deleteTab: string;
  deploymentName: string;
  project: string;
  gateway: string;
  application: string;
  architecture: string;
  ownershipRun: string;
  architectureLabel: (kind: string) => string;
  accessLevelControlTitle: string;
  accessLevelControlIntro: string;
  selectAccessLevelLabel: string;
  principalsLabel: string;
  principalsHelper: string;
  noAccessLevelRequired: string;
  boundGroup: string;
  updateAccessLevelButton: string;
  updatingAccessLevel: string;
  accessLevelSaved: string;
  ownedResources: string;
  restoredResources: string;
  retainedResources: string;
  resourceAction: (action: string) => string;
  logsTitle: string;
  logsIntro: string;
  logCategory: (category: string) => string;
  hours24: string;
  hours168: string;
  refreshLogs: string;
  refreshingLogs: string;
  noLogs: string;
  logQueryFailed: string;
  dataAccessNotice: string;
  gatewayLoggingEnabled: string;
  gatewayLoggingDisabled: string;
  nginxNotice: string;
  principal: string;
  method: string;
  requestId: string;
  callerIp: string;
  payload: string;
  specInvalid: string;
  teardownTitle: string;
  teardownIntro: string;
  teardownSharedNotice: string;
  teardownUnavailable: string;
  teardownConfirmation: string;
  teardownConfirmationHint: string;
  startTeardown: string;
  teardownRunning: string;
  teardownSucceeded: string;
  teardownInterrupted: string;
  teardownFailed: string;
  resumeTeardown: string;
  resumingTeardown: string;
  teardownActionFailed: string;
  teardownProgress: (completed: number, total: number) => string;
  exportEvidence: string;
  integrityValid: string;
  integrityInvalid: string;
  eventCount: (count: number) => string;
  chainHead: string;
  recentEvents: string;
  notAvailable: string;
  acceptanceTitle: string;
  acceptanceIntro: string;
  noSuccessfulRun: string;
  runSystemChecks: string;
  runningSystemChecks: string;
  acceptanceComplete: string;
  acceptancePending: string;
  requiredProgress: (satisfied: number, required: number) => string;
  acceptanceTest: (testId: string) => string;
  acceptanceScope: (caseKey: string) => string;
  acceptanceStatus: (status: string) => string;
  evidenceSource: (source: string) => string;
  missingEvidence: string;
  viewEvidence: string;
  operatorEvidenceTitle: string;
  operatorEvidenceIntro: string;
  testCase: string;
  testInstruction: (testId: string, caseKey: string) => string;
  evidenceOutcome: string;
  outcomePassed: string;
  outcomeFailed: string;
  outcomeSkipped: string;
  evidenceSummary: string;
  evidenceDetail: string;
  recordEvidence: string;
  recordingEvidence: string;
  evidenceRecorded: string;
  acceptanceActionFailed: string;
  statusSucceeded: string;
  statusDeleted: string;
  statusRunning: string;
  statusPending: string;
  statusFailed: string;
  t07DiagnosticsTitle: string;
  t07DiagnosticsIntro: string;
  t07Diagnostics: readonly {
    symptom: string;
    meaning: string;
    actions: readonly string[];
  }[];
}

export interface GuideFaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  checklist?: readonly string[];
}

export interface GuideStepApiCall {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  endpoint: string;
  purpose: string;
}

export interface GuideStepOptionBehavior {
  name: string;
  behavior: string;
}

export interface GuideStep {
  title: string;
  subtitle: string;
  summary: string;
  actions: readonly string[];
  optionsBehavior?: readonly GuideStepOptionBehavior[];
  apiCalls?: readonly GuideStepApiCall[];
  safetyNote?: string;
}

export interface GuideMessages {
  eyebrow: string;
  title: string;
  intro: string;
  pocNoticeTitle: string;
  pocNoticeBody: string;
  quickOverviewTitle: string;
  quickOverviewIntro: string;
  architectureTitle: string;
  architectureIntro: string;
  extensionArchitectureTitle: string;
  extensionArchitectureIntro: string;
  extensionArchitectureNote: string;
  costOverviewTitle: string;
  costOverviewIntro: string;
  costTag: string;
  fixedCostLabel: string;
  variableCostLabel: string;
  architectures: readonly {
    eyebrow: string;
    title: string;
    summary: string;
    estimatedCost: string;
    costFixed: string;
    costVariable: string;
    nodes: readonly { label: string; detail: string; costBadge?: string }[];
    supports: readonly { label: string; detail: string }[];
  }[];
  implementationTitle: string;
  implementationIntro: string;
  implementationEyebrow: string;
  implementationGroups: readonly {
    eyebrow: string;
    title: string;
    items: readonly string[];
  }[];
  stepLabel: (step: number) => string;
  technicalDeepDiveTitle: string;
  technicalDeepDiveIntro: string;
  technicalEyebrow: string;
  checklistLabel: string;
  optionsBehaviorLabel: string;
  apiCallsLabel: string;
  safetyGuardrailLabel: string;
  steps: readonly GuideStep[];
  faqTitle: string;
  faqIntro: string;
  faqEyebrow: string;
  faqChecklistLabel: string;
  faqs: readonly GuideFaqItem[];
}

export interface Messages {
  productName: string;
  localOnly: string;
  cloudIdentity: string;
  cloudProject: string;
  workspaceIdentity: string;
  adminEmail: string;
  help: string;
  signOut: string;
  signOutConfirm: string;
  nav: {
    deployments: string;
    newSetup: string;
    policies: string;
    evidence: string;
    settings: string;
    guide: string;
    cepDeployer: string;
    easyPoc: string;
    sgwDeployer: string;
  };
  title: string;
  steps: readonly string[];
  modeTitle: string;
  poc: string;
  pocDescription: string;
  production: string;
  productionDescription: string;
  productionUnavailable: string;
  platformsTitle: string;
  managedChromeOnly: string;
  platformNote: string;
  infrastructureTitle: string;
  dedicatedNetwork: string;
  recommended: string;
  dedicatedDescription: string;
  existingVpc: string;
  existingDescription: string;
  certificateTitle: string;
  enterpriseCa: string;
  enterpriseCaDescription: string;
  publicCertificate: string;
  publicCertificateDescription: string;
  localPocCa: string;
  disabledProduction: string;
  localPocAdminConsole: string;
  localPocCaDescription: string;
  posture: string;
  mode: string;
  managedPlatforms: string;
  platformCount: (count: number) => string;
  infrastructure: string;
  certificateStrategy: string;
  targetOu: string;
  testOuAvailable: string;
  deploymentGates: string;
  noExternalIps: string;
  cloudNat: string;
  upstreamVpc: string;
  privateDnsRoute: string;
  applicationOwnedTls: string;
  apiPreflight: string;
  approval: string;
  required: string;
  willValidate: string;
  gateNote: string;
  back: string;
  continue: string;
  noChanges: string;
  draftSaved: string;
  lastSaved: string;
  justNow: string;
  languages: {
    english: string;
    japanese: string;
  };
  mainTitle: string;
  workflow: WorkflowMessages;
  operations: OperationsMessages;
  guide: GuideMessages;
  cepDeployer: CepDeployerMessages;
}

export interface CepDeployerMessages {
  title: string;
  subtitle: string;
  intro: string;
  targetOuCardTitle: string;
  targetOuCardSubtitle: string;
  targetScopeCardTitle: string;
  targetScopeCardSubtitle: string;
  targetTypeOu: string;
  targetTypeGroup: string;
  selectTargetGroup: string;
  selectTargetGroupPlaceholder: string;
  refreshGroups: string;
  targetGroupImpact: string;
  targetGroupConfirmationLabel: string;
  targetGroupConfirmationHint: string;
  copyTargetGroupEmail: string;
  groupLoadFailed: string;
  customGroupInputPlaceholder: string;
  orEnterGroupEmail: string;
  selectTargetOu: string;
  selectTargetOuPlaceholder: string;
  rootOuUnavailable: string;
  targetOuImpact: string;
  targetOuConfirmationLabel: string;
  targetOuConfirmationHint: string;
  ouLoadFailed: string;
  canonicalCustomerIdRequired: string;
  verifyGoogleAccount: string;
  verifyingGoogleAccount: string;
  verifyGoogleAccountHint: string;
  retry: string;
  refreshOus: string;
  reloading: string;
  autoCreateSubOus: string;
  autoCreateSubOusHint: string;
  presetsTitle: string;
  presetsSubtitle: string;
  presetFullPoc: string;
  presetFullPocDesc: string;
  presetAiProtection: string;
  presetAiProtectionDesc: string;
  presetEndpoint: string;
  presetEndpointDesc: string;
  presetAudit: string;
  presetAuditDesc: string;
  modulesTitle: string;
  modulesSubtitle: string;
  moduleCorePolicies: string;
  moduleCorePoliciesDesc: string;
  moduleForceExtensions: string;
  moduleForceExtensionsDesc: string;
  moduleConnectors: string;
  moduleConnectorsDesc: string;
  accessLevelTitle: string;
  accessLevelSelectPrompt: string;
  accessLevelHint: string;
  dlpNoticeByodTitle: string;
  dlpNoticeByodDesc: string;
  activePresetBadge: string;
  accessLevelNone: string;
  accessLevelNoneDesc: string;
  accessLevelAutoProfile: string;
  accessLevelAutoBrowser: string;
  accessLevelAutoAny: string;
  accessLevelExistingGroup: string;
  accessLevelLoadFailed: string;
  moduleDlpDetectors: string;
  moduleDlpDetectorsDesc: string;
  moduleDlpRules: string;
  moduleDlpRulesDesc: string;
  betaBadge: string;
  dlpBetaNote: string;
  dlpRegionTitle: string;
  dlpRegionHint: string;
  dlpRulesTableTitle: string;
  dlpRulesTableHint: string;
  dlpActionOff: string;
  dlpActionAudit: string;
  dlpActionWarn: string;
  dlpActionBlock: string;
  dlpRuleNationalId: string;
  dlpRulePaymentCard: string;
  dlpRuleAccessLevel: string;
  dlpRuleWatermark: string;
  dataBoundaryModeTitle: string;
  dataBoundaryModeCopyPaste: string;
  dataBoundaryModeCopyPasteDesc: string;
  dataBoundaryModeBlockNonCorp: string;
  dataBoundaryModeBlockNonCorpDesc: string;
  dataBoundaryModeNone: string;
  dataBoundaryModeNoneDesc: string;
  internalUrlsTitle: string;
  internalUrlsPlaceholder: string;
  internalUrlsHint: string;
  rolesCardTitle: string;
  rolesCardSubtitle: string;
  roleAdminLabel: string;
  roleAdminDesc: string;
  roleAuditorLabel: string;
  roleAuditorDesc: string;
  roleAssigneeEmailLabel: string;
  roleAssigneeEmailPlaceholder: string;
  roleAssigneeEmailHint: string;
  roleTypeSelectLabel: string;
  roleTypeBoth: string;
  roleTypeAdminOnly: string;
  roleTypeAuditorOnly: string;
  roleScopeOuCheckbox: string;
  roleCreateAssignBtn: string;
  roleCreatingBtn: string;
  rolesAdminConsoleLink: string;
  rolesVerificationNote: string;
  testingScenariosTitle: string;
  testingScenariosSubtitle: string;
  copyDummyData: string;
  copiedToClipboard: string;
  dummyPiiLabel: string;
  dummyPiiValue: string;
  dummyPiiHint: string;
  dummyCreditCardLabel: string;
  dummyCreditCardValue: string;
  dummyCreditCardHint: string;
  dummySourceCodeLabel: string;
  dummySourceCodeValue: string;
  dummySourceCodeHint: string;
  scenarioGenAiTitle: string;
  scenarioGenAiStep: string;
  scenarioDataBoundaryTitle: string;
  scenarioDataBoundaryStep: string;
  scenarioWatermarkTitle: string;
  scenarioWatermarkStep: string;
  manualChecklistTitle: string;
  manualChecklistSubtitle: string;
  manualChecklistItems: ReadonlyArray<{
    title: string;
    detail: string;
    href: string;
  }>;
  btnDeploy: string;
  btnDeploying: string;
  btnRollback: string;
  btnRollingBack: string;
  btnDownloadScript: string;
  confirmRollback: string;
  downloadFailed: string;
  noModulesSelected: string;
  appliedTitle: string;
  skippedTitle: string;
  statusLogTitle: string;
  noActionYet: string;

  // License assignment & Auto-assign guidance
  licenseCardTitle: string;
  licenseCardSubtitle: string;
  licensePilotLimitNotice: string;
  licenseAutoAssignWarning: string;
  licenseAutoAssignWarningLink: string;
  licenseAutoAssignSteps: ReadonlyArray<string>;
  btnAssignLicensesToOu: string;
  copyTargetOuPath: string;
  tabSetup: string;
  tabLicensing: string;
  tabDlp: string;
  tabOperations: string;
  tabAll: string;
  btnAssigningLicenses: string;
  licenseAssignUsersFound: string;
  noUsersFoundInOu: string;

  // DLP Controls Matrix
  dlpMatrixTitle: string;
  dlpMatrixSubtitle: string;
  dlpColThreat: string;
  dlpColUpload: string;
  dlpColDownload: string;
  dlpColPaste: string;
  dlpColPrint: string;
  dlpColWatermark: string;
  dlpColDeviceScope: string;

  dlpRowUniversalUpload: string;
  dlpRowUniversalUploadDesc: string;
  dlpRowUniversalDownload: string;
  dlpRowUniversalDownloadDesc: string;
  dlpRowPaymentCard: string;
  dlpRowPaymentCardDesc: string;
  dlpRowNationalId: string;
  dlpRowNationalIdDesc: string;
  dlpRowAccessLevel: string;
  dlpRowAccessLevelDesc: string;
  dlpRowWatermark: string;
  dlpRowWatermarkDesc: string;
  dlpRowGenAiBlock: string;
  dlpRowGenAiBlockDesc: string;

  dlpScopeAll: string;
  dlpScopeByodOnly: string;
  dlpActionBadgeBlock: string;
  dlpActionBadgeWarn: string;
  dlpActionBadgeAudit: string;
  dlpActionBadgeAuditOnly: string;
  dlpActionBadgeOff: string;

  dlpActionParamsTitle: string;
  dlpActionParamsSubtitle: string;
  dlpCustomMessageLabel: string;
  dlpCustomMessagePlaceholder: string;
  dlpCustomMessageHint: string;
  dlpSaveContentLabel: string;
  dlpSaveContentHint: string;

  dlpPresetRecommended: string;
  dlpPresetRecommendedDesc: string;
  dlpPresetStrictZeroTrust: string;
  dlpPresetStrictZeroTrustDesc: string;
  dlpPresetGenAiSecure: string;
  dlpPresetGenAiSecureDesc: string;
  dlpPresetAuditOnly: string;
  dlpPresetAuditOnlyDesc: string;
  geminiEnterpriseTitle: string;
  geminiEnterpriseSubtitle: string;
  geminiLayer1Title: string;
  geminiLayer1Desc: string;
  geminiLayer1Bullet1: string;
  geminiLayer1Bullet2: string;
  geminiLayer2Title: string;
  geminiLayer2Desc: string;
  geminiLayer2Bullet1: string;
  geminiLayer2Bullet2: string;
  geminiLayer3Title: string;
  geminiLayer3Desc: string;
  geminiLayer3Bullet1: string;
  geminiLayer3Bullet2: string;
  geminiCliTitle: string;
  geminiCliCopyBtn: string;
  dlpPresetGeminiEnterprise: string;
  geminiAutoProvisionTitle: string;
  geminiAutoProvisionSubtitle: string;
  geminiTargetProjectLabel: string;
  geminiPolicyIdLabel: string;
  geminiPerimeterNameLabel: string;
  geminiEnforceAccessLevelLabel: string;
  geminiAccessLevelSelectLabel: string;
  geminiAccessLevelDefaultOption: string;
  geminiAccessLevelSelectHint: string;
  geminiEnforcePerimeterLabel: string;
  geminiDryRunLabel: string;
  geminiAutoProvisionBtn: string;
  geminiAutoProvisioningBtn: string;
  geminiSuccessTitle: string;
  geminiStep1: string;
  geminiStep2: string;
  geminiStep3: string;
  geminiStep4: string;
  geminiStep5Rca: string;
  geminiAdminLockoutWarningTitle: string;
  geminiAdminLockoutWarningText: string;
  geminiEnforceRcaLabel: string;
  geminiRcaGroupKeyLabel: string;
  geminiRcaGroupKeyPlaceholder: string;
  geminiRcaGroupKeyHint: string;
  geminiRcaBindingLabel: string;
  geminiRcaCliTitle: string;
  geminiRcaCliCopyBtn: string;

  deployProgressTitle: string;
  deployStep1: string;
  deployStep2: string;
  deployStep3: string;
  deployStep4: string;

  rollbackProgressTitle: string;
  rollbackStep1: string;
  rollbackStep2: string;
  rollbackStep3: string;
  rollbackStep4: string;

  roleProgressTitle: string;
  roleStep1: string;
  roleStep2: string;
  roleStep3: string;
  roleStep4: string;

  licenseProgressTitle: string;
  licenseStep1: string;
  licenseStep2: string;
  licenseStep3: string;
  // Error Diagnostic Resolver
  errDiagIamTitle: string;
  errDiagIamCause: string;
  errDiagIamRemediation: string;
  errDiagIamConsoleLink: string;
  errDiagWorkspaceTitle: string;
  errDiagWorkspaceCause: string;
  errDiagWorkspaceRemediation: string;
  errDiagWorkspaceConsoleLink: string;
  errDiagVpcScConflictTitle: string;
  errDiagVpcScConflictCause: string;
  errDiagVpcScConflictRemediation: string;
  errDiagVpcScConsoleLink: string;
  errDiagOuConfirmTitle: string;
  errDiagOuConfirmCause: string;
  errDiagOuConfirmRemediation: string;
  errDiagRateLimitTitle: string;
  errDiagRateLimitCause: string;
  errDiagRateLimitRemediation: string;
  errDiagWorkerTitle: string;
  errDiagWorkerCause: string;
  errDiagWorkerRemediation: string;
  errDiagProjectNoOrgTitle: string;
  errDiagProjectNoOrgCause: string;
  errDiagProjectNoOrgRemediation: string;
  errDiagPolicyNotFoundTitle: string;
  errDiagPolicyNotFoundCause: string;
  errDiagPolicyNotFoundRemediation: string;
  errDiagPolicyConsoleLink: string;
  errDiagOuStaleTitle: string;
  errDiagOuStaleCause: string;
  errDiagOuStaleRemediation: string;
  errDiagRootOuForbiddenTitle: string;
  errDiagRootOuForbiddenCause: string;
  errDiagRootOuForbiddenRemediation: string;
  errDiagScopeInvalidTitle: string;
  errDiagScopeInvalidCause: string;
  errDiagScopeInvalidRemediation: string;
  errDiagProjectRequiredTitle: string;
  errDiagProjectRequiredCause: string;
  errDiagProjectRequiredRemediation: string;
  errDiagGeminiTitle: string;
  errDiagGeminiCause: string;
  errDiagGeminiRemediation: string;
  errDiagGeminiConsoleLink: string;
  geminiConfirmProjectLabel: string;
  geminiConfirmProjectHint: string;
  geminiConfirmProjectMismatch: string;
  errDiagGenericTitle: string;
  errDiagGenericCause: string;
  errDiagGenericRemediation: string;
  errDiagCauseLabel: string;
  errDiagRemediationLabel: string;
  errDiagCommandHeader: string;
  errDiagRetryBtn: string;
  errDiagRawDetails: string;

  // Security Assessment & Policy Recommender
  assessOpenBtn: string;
  assessModalTitle: string;
  assessModalSubtitle: string;
  assessPresetLabel: string;
  assessPresetGenAi: string;
  assessPresetCost: string;
  assessPresetRemote: string;
  assessPresetAll: string;
  assessPresetClear: string;
  assessGroupGenAi: string;
  assessGroupPosture: string;
  assessGroupSaas: string;
  assessGroupCost: string;
  assessQ1Title: string; assessQ1Risk: string; assessQ1Solution: string;
  assessQ2Title: string; assessQ2Risk: string; assessQ2Solution: string;
  assessQ3Title: string; assessQ3Risk: string; assessQ3Solution: string;
  assessQ4Title: string; assessQ4Risk: string; assessQ4Solution: string;
  assessQ5Title: string; assessQ5Risk: string; assessQ5Solution: string;
  assessQ6Title: string; assessQ6Risk: string; assessQ6Solution: string;
  assessQ7Title: string; assessQ7Risk: string; assessQ7Solution: string;
  assessQ8Title: string; assessQ8Risk: string; assessQ8Solution: string;
  assessQ9Title: string; assessQ9Risk: string; assessQ9Solution: string;
  assessQ10Title: string; assessQ10Risk: string; assessQ10Solution: string;
  assessQ11Title: string; assessQ11Risk: string; assessQ11Solution: string;
  assessQ12Title: string; assessQ12Risk: string; assessQ12Solution: string;
  assessQ13Title: string; assessQ13Risk: string; assessQ13Solution: string;
  assessQ14Title: string; assessQ14Risk: string; assessQ14Solution: string;
  assessQ15Title: string; assessQ15Risk: string; assessQ15Solution: string;
  assessDefaultDlpCustomMessage: string;
  assessRecHeader: string;
  assessRecDlpHeader: string;
  assessRecModulesHeader: string;
  assessRoiHeader: string;
  assessRoiCostTitle: string; assessRoiCostDesc: string;
  assessRoiPerfTitle: string; assessRoiPerfDesc: string;
  assessRoiSecurityTitle: string; assessRoiSecurityDesc: string;
  assessApplyRecBtn: string;
  assessAppliedBanner: string;
  geminiArchDetailsToggle: string;
  assessShowDetails: string;
  assessHideDetails: string;
}

const en: Messages = {
  mainTitle: "Secure Gateway Studio",
  productName: "Administrator deployment console",
  localOnly: "Runs locally",
  cloudIdentity: "Google Cloud",
  cloudProject: "Not connected",
  workspaceIdentity: "Google Workspace",
  adminEmail: "Not connected",
  help: "Help",
  signOut: "Sign Out / Reset",
  signOutConfirm: "Are you sure you want to sign out and reset the session? This will clear local authentication tokens and unblock the consent screen for a new session.",
  nav: {
    deployments: "Deployments",
    newSetup: "New setup",
    policies: "Policies",
    evidence: "Evidence",
    settings: "Settings",
    guide: "Guide",
    cepDeployer: "Easy PoC",
    easyPoc: "Easy PoC",
    sgwDeployer: "Secure Gateway Deployer",
  },
  title: "New secure gateway setup",
  steps: ["Mode", "Identities", "Environment", "Certificate", "Access", "Review", "Apply"],
  modeTitle: "1. Start a rapid Secure Gateway PoC",
  poc: "Rapid proof of concept",
  pocDescription:
    "Build a test-OU deployment quickly with disposable resources and explicit safety gates. A local CA can be uploaded to managed Chrome through the Admin console.",
  production: "Production",
  productionDescription:
    "Enterprise PKI, regional high availability, dedicated product-scoped service identities, and auditable change control are retained for a future release.",
  productionUnavailable: "coming later",
  platformsTitle: "2. Managed Chrome platforms",
  managedChromeOnly: "targets managed Google Chrome only",
  platformNote:
    "Select only platforms you can test during this PoC. Each selected platform creates a required T07 end-to-end acceptance case. Other browsers are not targeted.",
  infrastructureTitle: "3. Infrastructure strategy",
  dedicatedNetwork: "Dedicated network",
  recommended: "Recommended",
  dedicatedDescription: "Create a new VPC dedicated to Secure Gateway services.",
  existingVpc: "Existing VPC",
  existingDescription: "Deploy into an existing VPC that you manage.",
  certificateTitle: "4. Certificate strategy",
  enterpriseCa: "Enterprise PKI / CA Service",
  enterpriseCaDescription: "Use organization CA or Cloud CA Service for internal TLS certificates.",
  publicCertificate: "Publicly trusted certificate",
  publicCertificateDescription:
    "Requires a registrable public DNS hostname and an exact Secret Manager certificate bundle. T03 validates the hostname and chain with the VM system's public trust roots; private, self-signed, and internal-name certificates fail.",
  localPocCa: "Local PoC CA",
  disabledProduction: "disabled in Production",
  localPocAdminConsole: "Admin console upload required",
  localPocCaDescription:
    "Generate a private root and leaf certificate, download the public root after Apply, then upload it for the test OU and selected platforms in the Google Admin console.",
  posture: "Deployment posture",
  mode: "Mode",
  managedPlatforms: "Managed Chrome platforms",
  platformCount: (count: number) => `${count} platforms selected`,
  infrastructure: "Infrastructure",
  certificateStrategy: "Certificate strategy",
  targetOu: "Target OU",
  testOuAvailable: "Test OU available",
  deploymentGates: "Deployment gates",
  noExternalIps: "No external IPs",
  cloudNat: "Cloud NAT",
  upstreamVpc: "Existing upstream VPC",
  privateDnsRoute: "Private DNS, firewall, and return route",
  applicationOwnedTls: "TLS owned by the HTTPS application",
  apiPreflight: "API preflight",
  approval: "Approval",
  required: "Required",
  willValidate: "Will validate",
  gateNote: "All gates must pass before deployment can be applied.",
  back: "Back",
  continue: "Continue to identities",
  noChanges: "No changes have been applied",
  draftSaved: "Draft saved locally",
  lastSaved: "Last saved",
  justNow: "just now",
  languages: { english: "English", japanese: "日本語" },
  workflow: {
    identitiesTitle: "Connect administrator identities",
    identitiesIntro:
      "Use keyless service-account impersonation for Google Cloud mutations. The extension starts from administrator OAuth; the local app starts from Application Default Credentials. JSON keys are never accepted or stored.",
    cloudAccount: "Google Cloud deployer",
    cloudAccountDescription:
      "Used for discovery, planning, and applying approved GCP changes.",
    workspaceAccount: "Workspace and Chrome administrator",
    workspaceAccountDescription:
      "The extension uses the signed-in administrator's OAuth session; the local app uses an identity with directly assigned Workspace administrator privileges. Required access covers Chrome Policy, Directory reads, and License Management.",
    projectId: "Google Cloud project ID",
    operatorIdentity: "Validated credential",
    adminIdentity: "Validated administrator credential",
    connect: "Validate connection",
    connected: "Connected",
    notConnected: "Not connected",
    checking: "Checking…",
    connectionFailed: "Validation failed",
    adcUnavailable:
      "Keyless Application Default Credentials are unavailable. Run “gcloud auth application-default login --impersonate-service-account=SERVICE_ACCOUNT_EMAIL”, then retry.",
    cloudValidationFailed:
      "Google Cloud validation failed. Verify the project ID and read permissions.",
    workspaceValidationFailed:
      "Workspace validation failed. Verify the customer ID and Chrome Policy administrator permissions.",
    workspaceRequiredRolesHint:
      "Assign only the needed Chrome Policy, OU, group/user read, and License Management privileges. License Manager is required even for the CEP licence preflight because that API has no read-only scope. Listing or creating Chrome DLP rules through the Cloud Identity Policy API requires a Super Administrator; use a dedicated test administrator and pilot OU.",
    specInvalid: "The deployment specification contains invalid or missing fields.",
    connectionNotice:
      "Connection validation is read-only. Apply permissions are checked separately during preflight.",
    bootstrapDeployer: "Create deployer and product-scoped role",
    bootstrapDeployerHint:
      "Required operator roles: Service Account Admin (roles/iam.serviceAccountAdmin), Role Administrator (roles/iam.roleAdmin), Project IAM Admin (roles/resourcemanager.projectIamAdmin), and permission to grant Policy Editor on the selected Access Context Manager policy. Alternatively, Security Admin (roles/iam.securityAdmin) or Owner plus the Access Policy grant.",
    bootstrapConfirm:
      "Create or update the deployer service account, custom role, project bindings, Access Policy Editor binding, and your Token Creator binding?",
    bootstrapLegacyMigrationConfirm:
      "A deployer candidate using Secure Gateway Studio 0.2.0-compatible reserved names was found without an immutable ownership pin. If no local record exists, also require that it has no user-managed keys; then audit its numeric service-account identity, exact custom role, and service-account/project IAM allowlists before adopting it. Migration stops without changes if anything differs.",
    bootstrapReplacementConfirm:
      "The legacy deployer failed the exact migration audit and was not changed. Create a new isolated Secure Gateway Studio deployer and role under fresh reserved names, leaving the legacy identity untouched for separate review?",
    bootstrapDeletedDeployerConfirm:
      "The immutable deployer pinned to this browser no longer exists. Confirm that its Cloud resources were deliberately deleted. The extension will verify that the exact service account is absent, the custom role is absent or in Google's deleted state with the exact SGS definition, and project IAM and Access Policy IAM contain no residual binding. It will then permanently retire the old numeric identity, safely restore the soft-deleted role when required, and create a new deployer. Continue?",
    bootstrapWorking: "Creating deployer…",
    bootstrapValidating: "Waiting for IAM permissions…",
    bootstrapComplete: "Deployer service account ready",
    bootstrapNext:
      "The deployer service account, all-supported-path project role, and Access Policy Editor binding were configured in Google Cloud. Subsequent calls use the active keyless authentication path.",
    bootstrapFailed: "Automatic deployer setup failed",
    signInGoogle: "Sign in with Google",
    signingInGoogle: "Waiting for Google…",
    signInGoogleHint:
      "Opens Google's consent window. Required once per Chrome profile before the deployer can be set up.",
    signInRequired:
      "This Chrome profile has not authorized Secure Gateway Studio yet. Sign in with Google to grant access, then retry.",
    signInOperatorChanged:
      "The signed-in Google account differs from the operator this deployer is bound to. Sign in with the original account, or create a replacement deployer.",
    progressTitle: "Deployment progress",
    progressCount: (completed: number, total: number) =>
      `${completed} of ${total} operations complete`,
    currentOperation: "Current operation",
    failedOperation: "Failed operation",
    failedOperations: "Failed operations",
    manualCleanupTitle: "Manual cleanup required",
    manualCleanupDescription:
      "Automated rollback is permanently unavailable. Review and remove every residual resource below in Google Cloud before resetting local extension state.",
    waitingForOperation: "Waiting for the first operation…",
    environmentTitle: "Configure the private environment",
    environmentIntro:
      "Define the desired state. Existing resources are discovered before any mutation.",
    deploymentName: "Deployment name",
    region: "Region",
    zone: "Zone",
    secondaryZone: "Secondary zone (Production HA)",
    sourceImage: "Immutable VM image",
    sourceImageHint:
      "Every VM-backed path requires a full, versioned Compute image resource name. Image families are rejected; Production images must have Python 3 and Nginx preinstalled.",
    sourceImageAutoHint:
      "For a PoC sample VM, trusted preflight resolves Google Debian 12 to its exact immutable image and verifies the numeric image ID before filling this field. Enter another full image resource name to override it.",
    sampleImageResolving: "Resolving immutable PoC image…",
    sampleImageResolveFailed:
      "Could not resolve the immutable Google Debian 12 image for the PoC sample VM.",
    sampleImageConnectionRequired:
      "Validate the Google Cloud connection before configuring the PoC sample VM image.",
    sampleImageResolved: "Immutable PoC image configured",
    minimumReplicas: "Minimum Nginx replicas",
    maximumReplicas: "Maximum Nginx replicas",
    cpuTarget: "Autoscaling CPU target (0.1–0.9)",
    autoscalingHint:
      "Production uses a two-zone regional managed instance group. CPU autoscaling is used because passthrough load-balancer utilization is not an autoscaling signal.",
    network: "Deployment architecture",
    vpcName: "Existing VPC name",
    vpcSameProjectHint:
      "VPCs are loaded read-only from the deployment project. Enter an upstream project only for Shared VPC or another cross-project network.",
    vpcOptionsFailed: "Could not load VPCs from the deployment project.",
    subnetName: "Existing subnet name",
    upstreamVpcProjectId: "Upstream VPC project ID (optional)",
    upstreamVpcProjectIdHint:
      "Leave empty when the VPC is in the deployment project. For a Shared VPC or other cross-project VPC, enter the project that owns the selected network; discovery and upstreamAccess IAM target that exact project.",
    upstreamVpcCrossProjectPrerequisite:
      "Cross-project prerequisite: before validation or preflight, an administrator of the upstream project must manually create and grant the deployment-project deployer a project-level custom role containing exactly compute.networks.get, compute.networks.use, resourcemanager.projects.get, resourcemanager.projects.getIamPolicy, and resourcemanager.projects.setIamPolicy. Bootstrap configures only the deployment project; it does not create or grant this cross-project role. A project custom role created in the deployment project cannot be granted in the upstream project.",
    managedSample: "Managed sample backend (Nginx)",
    managedSampleDescription:
      "Create a private HTTP backend for validation and evidence collection.",
    existingBackend: "Existing HTTP backend (Nginx)",
    existingBackendDescription:
      "Route to an administrator-managed private HTTP endpoint over connectivity that already exists.",
    directHttps: "Option A — Connect directly to an existing HTTPS app",
    directHttpsDescription:
      "Connect Secure Gateway directly to an existing HTTPS endpoint through its VPC. No Nginx, VM, NAT, or offload certificate is created.",
    internalHttpsLb:
      "Option B — HTTPS offload with Internal Application Load Balancer",
    internalHttpsLbDescription:
      "Terminate HTTPS on a regional internal Application Load Balancer in a dedicated VPC, then forward HTTP to a private sample VM backend. Dedicated VPC, subnet, ILB, and sample VM are created automatically.",
    configureSampleVm: "Create a private sample VM during approved Apply",
    configureSampleVmDescription:
      "Selects the owned Option B PoC defaults. The VM is created only by the final approved Apply, is private-only, and is recorded for teardown.",
    directSampleVmAction: "Use Option B's private sample VM",
    directSampleVmDescription:
      "Option A requires an existing private HTTPS application; it does not create a VM. If no HTTPS test target exists, switch to Option B and create its private sample VM during approved Apply.",
    managedSampleVmAction: "Create the private sample VM during Apply",
    managedSampleVmDescription:
      "Managed Sample creates a private HTTP backend VM together with the Option C Nginx tier during the final approved Apply.",
    existingSampleVmDescription:
      "Existing HTTP requires a reachable private HTTP backend. If none exists, switch to Managed Sample; the approved Apply creates the private backend VM.",
    legacyNginxTitle: "Option C — Legacy Nginx method / advanced settings",
    legacyNginxDescription:
      "Expand only when an HTTP application or the previous Nginx-based deployment is required.",
    proxySubnetCidr: "ILB proxy-only subnet CIDR",
    backendUrl: "Backend URL (http://)",
    directHttpsUrl: "Private HTTPS endpoint (https://host[:port])",
    applicationEgressRegion: "Egress region (optional)",
    applicationEgressRegionHint:
      "Specifies the Google Cloud region for Gateway VPC egress. Defaults to the deployment region; set the target app's region for cross-region backends, or leave empty if the VPC uses Global dynamic routing.",
    backendLocation: "Backend hosting location",
    backendLocationGcp: "Google Cloud",
    backendLocationAws: "AWS",
    backendLocationAzure: "Azure",
    backendLocationOnPrem: "On premises",
    confirmBackendConnectivity:
      "I confirm private routing, DNS, and backend firewall access already exist from the selected GCP VPC/subnet",
    backendConnectivityHint:
      "This PoC configures Nginx and verifies the upstream with T02. It does not create AWS/Azure VPNs, Cloud VPN, Interconnect, or on-premises routing. Establish that private path first; do not enter public endpoints or credentials here.",
    cloudConsoleLinks: "Google Cloud & Workspace Console Deep-Links",
    openInCloudConsole: "Open in Cloud Console",
    computeInstancesLink: "Compute Engine VM Instances",
    computeResourcesHint:
      "Run-scoped Nginx and/or sample-backend VM resources; use the run inventory for exact names and private addresses.",
    securityGatewaysLink: "BeyondCorp Security Gateways",
    securityGatewayHint:
      "Use the run inventory for the exact gateway resource name and live state.",
    vpcNetworksLink: "VPC Networks & Firewalls",
    cloudNatLink: "Cloud NAT",
    cloudNatHint:
      "Created for a dedicated-VPC path with private VMs; an existing VPC must provide verified private egress.",
    chromeAdminLink: "Chrome Admin Policies",
    architectureBlueprint: "Architecture Blueprint & Telemetry",
    directHttpsConnectivity:
      "I confirm the selected VPC resolves this hostname, routes to the HTTPS app, allows TCP from 136.124.16.0/20, and has a return path",
    directHttpsConnectivityHint:
      "Secure Gateway connects directly to the HTTPS app. For AWS, Azure, or on-premises, first configure Cloud VPN/Interconnect, Cloud DNS forwarding, firewall rules, and an explicit return route for 136.124.16.0/20.",
    hostname: "Private application hostname",
    noExternalIpNotice:
      "Any VM created by this workflow has external IPs disabled. A dedicated-VPC path with private VMs creates Cloud NAT; an existing VPC must provide verified private egress. The internal-HTTPS-LB path has no Nginx tier but does create its private sample-backend VM.",
    certificateStepTitle: "Configure TLS certificate source",
    certificateIntro:
      "The offload VM reads certificate material at runtime from Secret Manager; private keys are never written into startup scripts.",
    internalLbCertificateIntro:
      "The regional internal Application Load Balancer terminates HTTPS with a regional server certificate. Certificate material moves directly from memory to the Compute API and remains in Secret Manager for controlled lifecycle management.",
    caPool: "CA pool resource",
    caName: "Issuing CA resource",
    secretName: "Secret Manager certificate secret",
    certificateNotice:
      "Local CA is PoC-only. After Apply, download the public PEM root, add it at Chrome > Connectors > Chrome Root Store, and connect that configuration to the dedicated test OU. Public APIs cannot reliably inspect or perform this handoff; verify trust with T07. Production still requires enterprise-pretrusted PKI or a publicly trusted certificate.",
    internalLbCertificateNotice:
      "For a local CA, the ILB presents the generated server certificate. After Apply, distribute only its public PEM root through Chrome Root Store to the test OU, restart Chrome, and verify HTTPS with T07. The private key is never distributed to Chrome.",
    directCertificateIntro:
      "The HTTPS application owns TLS termination. Secure Gateway does not create or store its certificate or private key.",
    directCertificateNotice:
      "For a publicly trusted app certificate, no Root Store action is needed. For a private CA, obtain the issuing root PEM from the application owner and add it manually at Chrome > Connectors > Chrome Root Store for the test OU; this configuration cannot be read or written reliably through the public API.",
    directPrivateCertificate: "Private app CA / manual Chrome Root Store trust",
    accessTitle: "Limit Chrome policy and application access",
    accessIntro:
      "Start with the dedicated test OU and the smallest possible principal set.",
    customerId: "Workspace customer ID",
    targetOuId: "Dedicated test OU ID",
    managedChromeAccessLevel: "Managed Chrome access level",
    managedChromeAccessLevelHint:
      "Select None or an existing full Access Context Manager resource name. This setup never creates an access level; create and review it separately before Apply.",
    managedChromeAccessLevelNone: "None — do not require an access level",
    managedChromeAccessLevelNoneHint:
      "No Access Context Manager condition is added. Access is still limited to the selected IAM principals.",
    optionsLoadedHint:
      "Options are loaded read-only with the active authenticated identities: the product-scoped deployer for Google Cloud and the validated Workspace administrator for Directory data.",
    optionsLoading: "Loading options…",
    chooseOption: "Select an option",
    noOptions: "No options available",
    retryOptions: "Retry",
    ouOptionsFailed:
      "Organizational units could not be loaded. Enable Admin SDK API and grant the validated Workspace administrator Organizational Units read access.",
    accessLevelOptionsFailed:
      "Access levels could not be loaded. Grant the service account Policy Editor on the intended Access Context Manager policy; this also permits CEP AUTO_CREATE access-level lifecycle operations.",
    groupOptionsFailed:
      "Groups could not be loaded. Add Groups read permission to the validated Workspace administrator role.",
    prerequisitesTitle: "Manual prerequisite confirmation",
    confirmEnterpriseLicense:
      "Chrome Enterprise Premium licenses are assigned to the target users",
    confirmWorkspaceServices:
      "Additional Google services and Google Cloud access are enabled for the target users",
    confirmEndpointVerification:
      "Endpoint Verification device-signal collection is enabled for this OU",
    confirmTestOu: "I confirm this is a non-production test OU",
    principalType: "Principal type",
    principalValue: "Principal",
    addPrincipal: "Add principal",
    removePrincipal: "Remove",
    user: "User",
    group: "Group",
    domain: "Domain",
    accessNotice:
      "The app conditionally grants application access through the verified managed-Chrome access level, and force-installs Secure Gateway plus Endpoint Verification in this OU; Chrome policy inheritance can also affect descendant OUs.",
    reviewTitle: "Review detected state and automatic changes",
    reviewIntro:
      "Compare what the APIs verified, what Apply will configure, and what still needs attention. This screen makes no changes.",
    configuration: "Configuration",
    safetyGates: "Safety gates",
    ready: "Ready",
    incomplete: "Incomplete",
    verified: "Ready",
    plannedOnApply: "Automatic on Apply",
    manualCheck: "Manual check",
    actionRequired: "Action required",
    approvalPending: "Awaiting approval",
    reviewGateLegend:
      "Ready = resolved by API discovery, administrator confirmation, or a configuration invariant. Automatic on Apply = created or updated after approval. Manual check = not reliably detectable by the available API. Action required = blocks Apply.",
    gateLabels: {
      "immutable-image": "Immutable VM image",
      "billing-enabled": "Cloud Billing",
      "enterprise-license": "Chrome Enterprise Premium license",
      "chrome-root-store": "Chrome Root Store trust",
      "workspace-services": "Workspace services",
      "managed-chrome-profile": "Managed Chrome profile",
      "secure-enterprise-browser-client": "Secure Enterprise Browser client",
      "endpoint-verification": "Endpoint Verification",
      "no-external-ips": "No external IPs",
      "private-egress": "Cloud NAT",
      "backend-connectivity": "Existing backend connectivity",
      "test-ou": "Target OU",
      "cloud-identity": "Google Cloud deployer",
      "workspace-identity": "Workspace and Chrome administrator",
      "required-apis": "Required APIs",
      "apply-permissions": "Apply permissions",
      "resource-conflicts": "Resource conflicts",
      "human-approval": "Approval",
    },
    gateDescriptions: {
      "immutable-image": "The exact Compute image resource and its immutable numeric identity are verified before any VM-backed path is approved or applied.",
      "billing-enabled": "Cloud Billing API checks that the project has an active billing association.",
      "enterprise-license": "Enterprise License Manager API checks assigned Chrome Enterprise Premium licenses; administrator confirmation remains a fallback.",
      "chrome-root-store": "Chrome Root Store configuration, certificate upload, and OU binding are not reliably exposed by public APIs. Complete this one-time Admin console step after Apply, then verify trust with the platform-specific T07 HTTPS test.",
      "workspace-services": "The target users' Workspace service settings require administrator confirmation.",
      "managed-chrome-profile": "Chrome Management Profiles API checks actual profile and policy-sync reports for the selected OU.",
      "secure-enterprise-browser-client": "Chrome Management Profiles API checks the installed and enabled client extension.",
      "endpoint-verification": "Chrome Management Profiles API checks the actual client; Apply force-installs it when it has not reported yet.",
      "no-external-ips": "Every VM or instance template created by Apply omits an external access configuration. Direct HTTPS creates no VM; the internal HTTPS load balancer creates a private sample-backend VM but no Nginx VM.",
      "private-egress": "A dedicated-VPC path with private VMs creates Cloud NAT. An existing-VPC path with private VMs must expose a verified private egress path. Only direct HTTPS needs no package egress.",
      "backend-connectivity": "The managed sample is created in the deployment VPC. For existing HTTP, the operator confirms private routing, DNS, and firewall access and T02 validates the path from Nginx. Direct HTTPS uses the separately confirmed selected-VPC route; the internal HTTPS load balancer uses backend health. This PoC does not create cross-cloud VPN or Interconnect resources.",
      "test-ou": "The selected OU was confirmed as a non-production test OU.",
      "cloud-identity": "The Google Cloud deployer identity was validated read-only.",
      "workspace-identity": "The Workspace and Chrome administrator identity was validated read-only.",
      "required-apis": "Missing allowlisted APIs are enabled automatically during Apply.",
      "apply-permissions": "The API checks whether the deployer has every permission required by the planned operations.",
      "resource-conflicts": "Existing resources are checked for compatibility with the desired state.",
      "human-approval": "An authorized operator approves the exact configuration hash before Apply.",
    },
    managedProfileEvidence: (total, profileOnly, sync) =>
      `${total} reporting profile(s), including ${profileOnly} profile-managed BYOD profile(s). Latest policy sync: ${sync ?? "not reported"}.`,
    clientExtensionEvidence: (name, version, installed) =>
      installed
        ? `${name} ${version ?? ""} is installed and enabled according to the Profiles API.`
        : `${name} has not reported as installed and enabled yet.`,
    missingPermissions: (count: number) =>
      `${count} required permissions are missing from the deployer.`,
    approvePlan: "Approve this exact plan",
    approvePlanDescription:
      "Approval is bound to the configuration hash and becomes invalid when settings change.",
    generatePlan: "Run preflight and generate plan",
    runPreflight: "Run trusted preflight",
    preparingPlan: "Discovering resources and generating an exact plan…",
    planReady: "Server-attested plan is ready",
    planBlocked: "The plan has blocking gates",
    changesCount: (count: number) =>
      count === 1
        ? "1 mutating operation requires approval"
        : `${count} mutating operations require approval`,
    preflightProgressTitle: "Preflight Discovery Progress",
    preflightStage1: "1/5: Verifying Service Usage & IAM permissions...",
    preflightStage2: "2/5: Validating Cloud Billing & Project association...",
    preflightStage3: "3/5: Discovering BeyondCorp Gateway & VPC network...",
    preflightStage4: "4/5: Resolving Chrome Management & Test OU policies...",
    preflightStage5: "5/5: Compiling change plan & evaluating safety gates...",
    preflightComplete: "All preflight checks and safety gates verified",
    plannedChangesTitle: "Exact changes requiring approval",
    plannedChangesIntro:
      "Only create and update operations are shown here. Reused and unchanged resources are not mutated.",
    changeAction: (action) =>
      ({ create: "Create / override", update: "Update" })[action] ?? action,
    changeRisk: (risk) =>
      ({ low: "Low risk", medium: "Medium risk", high: "High risk", blocking: "Blocking" })[
        risk
      ] ?? risk,
    changeSummary: (resourceType, fallback) =>
      resourceType === "service_discovery_proxy"
        ? "Override the inherited legacy PAC in the test OU with Allow user to configure, enabling Service Discovery routing without a PAC file."
        : fallback,
    diagnosticsTitle: "Detected conditions",
    apiEvidence: "API evidence",
    diagnosticMessage: (code, fallback) =>
      code === "legacy-pac-policy-detected"
        ? "A legacy PAC policy inherited from a parent OU is still active for this test OU."
        : code === "chrome-extension-group-policy-conflict"
          ? "A Chrome group policy overrides the Secure Enterprise Browser configuration from the target OU."
        : fallback,
    diagnosticRemediation: (code, fallback) =>
      code === "legacy-pac-policy-detected"
        ? "A hostname omitted from the PAC falls through to DIRECT, where private DNS commonly returns ERR_NAME_NOT_RESOLVED. Apply will override only the selected test OU; the parent OU and existing PAC file are not changed."
        : code === "chrome-extension-group-policy-conflict"
          ? "Review the named group in Apps & extensions. Remove its empty or incompatible managed configuration, or set it to the same Secure Gateway configuration as the test OU. This is blocked because changing a group affects every member."
        : fallback ?? "",
    approveWorking: "Binding approval…",
    approvalReady: "Exact plan approved",
    continueToApply: "Continue to Apply",
    applyTitle: "Apply with checkpoints and evidence",
    applyIntro:
      "Changes execute in dependency order. On failure, the run stops and offers rollback only for resources owned by this deployment.",
    preflight: "Preflight",
    desiredStatePlan: "Desired-state plan",
    applyChanges: "Apply approved changes",
    applyLocked: "Complete preflight and approval to unlock Apply",
    applying: "Applying approved changes…",
    runSucceeded: "Deployment succeeded",
    runRollingBack: "Rolling back applied changes…",
    runRollbackUnavailable:
      "Apply failed and automated rollback was unavailable. Managed resources may remain in Google Cloud.",
    runRollbackFailed:
      "Apply failed, and at least one owned change could not be rolled back. Review the failed operation and error below before changing Google Cloud manually.",
    runRolledBack: "Deployment failed and owned changes were rolled back",
    runFinalized: "Run finished",
    noActiveOperation: "No operation is running",
    finalizedOperationCount: (count: number) =>
      `Run finalized after ${count} recorded operations`,
    runInterrupted:
      "The execution worker or local service stopped during Apply. Resume safely reconciles durable checkpoints with live resources before continuing.",
    resumeRun: "Resume interrupted Apply",
    resumingRun: "Reconciling and resuming…",
    retryRollback: "Retry failed rollback",
    retryingRollback: "Reconciling residual resources and retrying rollback…",
    runFailed: "Deployment requires operator attention",
    operationCount: (count: number) => `${count} operations recorded`,
    evidenceNotice:
      "Every action records an audit event, redacted request metadata, result, and ownership for safe rollback.",
    caHandoffTitle: "Complete managed Chrome trust",
    caHandoffDescription:
      "Chrome Root Store configuration, certificate upload, and OU binding cannot be reliably inspected or performed through public APIs. Complete this one-time Admin console handoff before end-to-end testing.",
    caHandoffSteps: [
      "Download the public PoC root certificate below; it never contains the private key.",
      "In Google Admin console, open All browsers and devices, then Chrome > Connectors > New provider configuration > Chrome Root Store. Add the PEM as a Root certificate and add the configuration.",
      "Select the dedicated test OU. Under Certificate connectors > Chrome Root Store, select the new configuration and Save. Restart Chrome and verify it under chrome://certificate-manager > Local certificates.",
    ],
    downloadRootCa: "Download public root CA",
    downloadingRootCa: "Preparing download…",
    openAdminConsoleGuide: "Open Google's CA setup guide",
    caDownloadFailed:
      "The root CA could not be downloaded. Confirm that Apply succeeded and retry.",
    connectionHandoffTitle: "Connection verification & troubleshooting",
    testUrlLabel: "Private Web App URL",
    sebTroubleshootingHint:
      "If Chrome displays NXDOMAIN or fails to connect, the Secure Enterprise Browser (SEB) extension may be in its 2-hour backoff state after an initial sync race. Sign out of your managed Chrome profile and sign back in (or reload the SEB extension at chrome://extensions) to trigger an immediate route refresh.",
    previous: "Back",
    next: "Continue",
  },
  operations: {
    deploymentsTitle: "Deployment runs",
    deploymentsIntro:
      "Review server-recorded Apply attempts and their terminal state.",
    evidenceTitle: "Audit evidence",
    evidenceIntro:
      "Verify the local hash chain and export a portable JSON evidence bundle.",
    loading: "Loading recorded state…",
    loadFailed: "Recorded state could not be loaded from the execution API.",
    noRuns: "No deployment runs have been recorded.",
    noEvents: "No audit events have been recorded.",
    runId: "Run",
    status: "Status",
    started: "Started",
    operationsCount: "Operations",
    manage: "Manage",
    close: "Close",
    overviewTab: "Overview",
    logsTab: "Logs",
    resourcesTab: "Resources",
    deleteTab: "Teardown",
    deploymentName: "Deployment",
    project: "Project",
    gateway: "Secure Gateway",
    application: "Application route",
    architecture: "Architecture",
    ownershipRun: "Resource ownership run",
    architectureLabel: (kind) =>
      ({
        managed_sample: "Nginx HTTP offload · managed sample",
        existing_http: "Nginx HTTP offload · existing backend",
        direct_https: "Direct private HTTPS",
        internal_https_lb: "Internal Application Load Balancer HTTPS offload",
      })[kind] ?? kind,
    accessLevelControlTitle: "Access Control & Access Level Policies",
    accessLevelControlIntro:
      "Update the Access Context Manager condition bound to the BeyondCorp Application IAM policy.",
    selectAccessLevelLabel: "Target Access Level Policy",
    principalsLabel: "Allowed Principals (Users, Groups, Domains)",
    principalsHelper: "Comma-separated list (e.g. user:admin@test-domain.dev, domain:test-domain.dev)",
    noAccessLevelRequired: "(No Access Level constraint / All authenticated group users)",
    boundGroup: "Target IAM Group",
    updateAccessLevelButton: "Update Access Level Policy",
    updatingAccessLevel: "Updating IAM Policy...",
    accessLevelSaved: "Access Level updated and audited in hash chain",
    ownedResources: "Owned deployment resources",
    restoredResources: "Shared policy values restored from before-images",
    retainedResources: "Shared or reused resources retained",
    resourceAction: (action) =>
      ({
        delete: "Delete",
        delete_if_empty: "Delete only if no applications remain",
        restore: "Restore exact before-image",
        retain: "Retain",
      })[action] ?? action,
    logsTitle: "Secure Gateway logs",
    logsIntro:
      "Query access decisions, gateway connections, administrative activity, and collected Nginx entries from Cloud Logging.",
    logCategory: (category) =>
      ({
        access: "Access decisions",
        connection: "Connections",
        admin: "Admin activity",
        nginx: "Nginx requests",
      })[category] ?? category,
    hours24: "Last 24 hours",
    hours168: "Last 7 days",
    refreshLogs: "Refresh logs",
    refreshingLogs: "Querying Cloud Logging…",
    noLogs: "No matching log entries were found yet for this time range. Access the application from a managed Chrome browser to produce logs.",
    logQueryFailed:
      "Cloud Logging or the current Secure Gateway logging state could not be verified. Confirm the deployer can read the gateway and list log entries, then retry. No log query is sent when the gateway state is malformed.",
    dataAccessNotice:
      "Access decisions require Data Access audit logs for the BeyondCorp Enterprise API.",
    gatewayLoggingEnabled:
      "Secure Gateway connection logging is enabled in this deployment project.",
    gatewayLoggingDisabled:
      "Secure Gateway connection logging is disabled. Connection entries will not be produced; review the gateway in Google Cloud before relying on this view.",
    nginxNotice:
      "Nginx entries require the Google Cloud Ops Agent to collect sgstudio-access.log.",
    principal: "Principal",
    method: "Method",
    requestId: "Request ID",
    callerIp: "Caller IP",
    payload: "Sanitized payload",
    specInvalid: "The deployment specification contains invalid or missing fields.",
    teardownTitle: "Teardown this deployment",
    teardownIntro:
      "Restore recorded shared-policy before-images and delete only resources owned by this successful Apply, in reverse dependency order.",
    teardownSharedNotice:
      "Shared IAM and Chrome policies are restored only when an exact before-image was recorded and their current state still matches this run's recorded managed-after state. A sending write with an unknown result or later drift is retained for manual reconciliation. Existing VPCs, Access Levels, project APIs, and other reused resources are retained. A Gateway created by this run is deleted only when no applications remain.",
    teardownUnavailable: "This run has no safely owned resources available for teardown.",
    teardownConfirmation: "Exact confirmation",
    teardownConfirmationHint: "Type the exact phrase shown above",
    startTeardown: "Restore and delete run changes",
    teardownRunning: "Restoring and deleting run changes…",
    teardownSucceeded: "Teardown completed",
    teardownInterrupted:
      "The execution worker or local service stopped during teardown. Resume reconciles durable checkpoints before continuing.",
    teardownFailed: "Teardown stopped and requires review",
    resumeTeardown: "Resume interrupted teardown",
    resumingTeardown: "Reconciling and resuming…",
    teardownActionFailed: "Teardown could not be started or refreshed.",
    teardownProgress: (completed, total) => `${completed} of ${total} operations complete`,
    exportEvidence: "Export evidence",
    integrityValid: "Audit chain verified",
    integrityInvalid: "Audit chain verification failed",
    eventCount: (count: number) => `${count} chained events`,
    chainHead: "Chain head SHA-256",
    recentEvents: "Recent audit events",
    notAvailable: "Not available",
    acceptanceTitle: "Acceptance certification",
    acceptanceIntro:
      "Run machine checks for T01–T05, then record endpoint and log evidence from the managed Chrome test.",
    noSuccessfulRun: "A successful deployment run is required before acceptance testing.",
    runSystemChecks: "Verify T01–T05",
    runningSystemChecks: "Verifying Google Cloud resources…",
    acceptanceComplete: "PoC acceptance complete",
    acceptancePending: "Acceptance evidence incomplete",
    requiredProgress: (satisfied, required) =>
      `${satisfied} of ${required} required cases satisfied`,
    acceptanceTest: (testId) =>
      ({
        T01: "HTTP backend response",
        T02: "Offload-to-backend response",
        T03: "TLS termination",
        T04: "Private DNS",
        T05: "Secure Gateway matcher",
        T06: "Direct HTTPS control",
        T07: "Managed Chrome end to end",
        T08: "Log correlation",
        T09: "Unauthorized / unmanaged denial",
      })[testId] ?? testId,
    acceptanceScope: (caseKey) =>
      ({
        default: "Deployment-wide",
        macos: "macOS",
        windows: "Windows",
        linux: "Linux",
        chromeos: "ChromeOS",
        unauthorized_principal: "Unauthorized principal",
        unmanaged_browser: "Unmanaged browser",
      })[caseKey] ?? caseKey,
    acceptanceStatus: (status) =>
      ({
        passed: "Passed",
        failed: "Failed",
        user_confirmed: "Operator confirmed",
        skipped: "Skipped",
        missing: "Missing",
      })[status] ?? status,
    evidenceSource: (source) =>
      source === "system" || source === "system_verified" ? "System verified" : "Operator evidence",
    missingEvidence: "No evidence recorded",
    viewEvidence: "View sanitized evidence",
    operatorEvidenceTitle: "Record endpoint evidence",
    operatorEvidenceIntro:
      "Store only sanitized observations or artifact hashes. Never paste tokens, cookies, private keys, or credentials.",
    testCase: "Test case",
    testInstruction: (testId, caseKey) =>
      testId === "T06"
        ? "Open an existing HTTPS Secure Gateway control application in the same managed work profile (the source guide uses https://demo-server1.internal/). Record Passed only if it opens without a certificate warning. For a greenfield PoC with no existing control application, record Skipped with that reason; Production still requires a pass."
        : testId === "T07"
          ? `Open the newly deployed private HTTPS application in the authorized managed Chrome profile on ${caseKey}. Record the visible result and timestamp.`
          : testId === "T08"
            ? "Correlate gateway, offload, and backend events using a sanitized request identifier and timestamp."
            : testId === "T09"
              ? "Confirm the selected unauthorized case is denied and that the backend receives no successful request."
              : "Record the observed result for this acceptance case.",
    evidenceOutcome: "Observed outcome",
    outcomePassed: "Passed",
    outcomeFailed: "Failed",
    outcomeSkipped: "Skipped",
    evidenceSummary: "Result summary",
    evidenceDetail: "Sanitized evidence or artifact SHA-256",
    recordEvidence: "Record confirmation",
    recordingEvidence: "Recording…",
    evidenceRecorded: "Acceptance evidence recorded.",
    acceptanceActionFailed: "Acceptance action failed. Check the execution API and credentials.",
    statusSucceeded: "Success",
    statusDeleted: "Torn down",
    statusRunning: "Running",
    statusPending: "Pending",
    statusFailed: "Failed",
    t07DiagnosticsTitle: "Managed Chrome client diagnostics",
    t07DiagnosticsIntro:
      "Match the browser result before recording T07. These symptoms identify whether routing, authorization, or certificate trust is still incomplete.",
    t07Diagnostics: [
      {
        symptom: "ERR_NAME_NOT_RESOLVED",
        meaning:
          "The private hostname was not captured. The managed extension may be inactive, or Service Discovery may be unable to load the route because an inherited legacy PAC still controls this profile.",
        actions: [
          "Run preflight in this app. If it detects a legacy PAC, review the exact target-OU-only override before approval.",
          "Confirm the same Chrome work profile reports Secure Enterprise Browser as administrator-installed and recently synchronized.",
          "If no PAC is active, confirm the gateway route, Service Discovery IAM binding, and application access binding.",
        ],
      },
      {
        symptom: "Access Denied (403)",
        meaning:
          "Service Discovery reached Secure Gateway, but the principal or Access Context Manager condition was not satisfied.",
        actions: [
          "Open Endpoint Verification in the same work profile, add the corporate account if prompted, and run Sync now.",
          "Confirm the user or group has both gateway Service Discovery and application access bindings.",
          "Check that the selected access level accepts PROFILE_MANAGED Chrome for a BYOD test.",
        ],
      },
      {
        symptom: "Certificate authority error",
        meaning:
          "Secure Gateway routing and TLS offload are active, but the PoC root CA is not trusted by this endpoint.",
        actions: [
          "Download the generated PoC root certificate from Apply.",
          "In Admin console, add the PEM at Chrome > Connectors > Chrome Root Store, then connect the configuration to the dedicated test OU and restart Chrome.",
          "Verify the certificate fingerprint before trusting it and retry the private HTTPS URL.",
        ],
      },
    ],
  },
  guide: {
    eyebrow: "New setup guide",
    title: "What happens in each setup step",
    intro:
      "The wizard turns a small set of PoC choices into a discovered, reviewable, and approved Secure Gateway deployment. Before final Apply, it changes only the deployer service account, custom role, and IAM bindings that you explicitly confirm during the initial bootstrap; discovery and all other setup steps are read-only.",
    pocNoticeTitle: "Built for doing a Secure Gateway PoC ASAP",
    pocNoticeBody:
      "Production is shown for future readiness but is disabled in this release. Use a dedicated non-production OU and test principals; do not route production traffic through this workflow.",
    quickOverviewTitle: "Quick Overview & Core Concepts",
    quickOverviewIntro:
      "A fast summary of the 3 architecture deployment paths and the 7-step wizard workflow.",
    technicalDeepDiveTitle: "Step-by-Step Technical Deep Dive & API Calls",
    technicalDeepDiveIntro:
      "Comprehensive breakdown of the underlying logic, configuration behaviors, and Google Cloud / Workspace REST APIs invoked at every stage.",
    technicalEyebrow: "Technical reference & API calls",
    checklistLabel: "Checklist & actions",
    optionsBehaviorLabel: "Option Behaviors & Logic",
    apiCallsLabel: "Key Google Cloud & Workspace REST API calls",
    safetyGuardrailLabel: "Safety & Rollback Guardrails",
    architectureTitle: "Three independent deployment architectures",
    architectureIntro:
      "Choose one path per application. Options A and B are the primary PoC paths; the previous Nginx method remains available as Option C under Legacy / advanced settings.",
    extensionArchitectureTitle: "Extension-supported deployment architectures",
    extensionArchitectureIntro:
      "Choose Direct HTTPS, regional Internal HTTPS Load Balancer offload, or the legacy Nginx path for each PoC application.",
    extensionArchitectureNote:
      "The Chrome extension plans and applies all three PoC paths. Option B creates its private sample VM only during the final approved Apply.",
    costOverviewTitle: "Cost drivers — verify current pricing before deployment",
    costOverviewIntro:
      "Pricing varies by region, usage, selected resources, and your Chrome Enterprise Premium agreement. These cards are a resource inventory, not a quote. Confirm the current Google Cloud price pages or Pricing Calculator and your CEP contract before applying a plan.",
    costTag: "Verify current pricing",
    fixedCostLabel: "Provisioned resources",
    variableCostLabel: "Usage drivers",
    architectures: [
      {
        eyebrow: "Option A · Direct HTTPS",
        title: "Secure Gateway + existing private HTTPS app",
        summary:
          "Use when the application already serves HTTPS. Secure Gateway routes directly through the selected VPC; no Nginx, VM, NAT, or offload certificate is created.",
        estimatedCost: "Estimated monthly PoC: USD 0 new infrastructure",
        costFixed: "No new VM, load balancer, Cloud NAT, offload certificate, or managed DNS record. The existing application and its private DNS remain operator-owned.",
        costVariable: "Existing DNS, network data transfer, and the application's own infrastructure charges.",
        nodes: [
          { label: "Managed Chrome", detail: "User identity + device/profile context", costBadge: "CEP license required" },
          { label: "Secure Gateway", detail: "Hostname:port matcher + access policy", costBadge: "Check CEP agreement" },
          { label: "Upstream VPC", detail: "Delegating service account has upstreamAccess", costBadge: "Network usage billed" },
          { label: "HTTPS app", detail: "Existing certificate and TLS termination", costBadge: "Existing infrastructure" },
        ],
        supports: [
          { label: "DNS resolution", detail: "Cloud DNS private zone or forwarding zone" },
          { label: "Network policy", detail: "Allow TCP from 136.124.16.0/20 and return route" },
          { label: "Regional routing", detail: "Optional egress region, or Global Access for regional LB" },
        ],
      },
      {
        eyebrow: "Option B · ILB HTTPS offload",
        title: "Secure Gateway + internal HTTPS load balancer + private sample VM",
        summary:
          "The approved run creates a regional internal Application Load Balancer and one run-owned private sample backend VM. The ILB presents the server certificate and forwards decrypted HTTP to that VM on port 80; this path cannot target an existing HTTP endpoint, and Nginx is not deployed.",
        estimatedCost: "Estimated monthly PoC: about USD 80–90",
        costFixed: "720 hours in asia-northeast1, light traffic: minimum three ILB proxies are about USD 54/month; one e2-small VM plus a 20 GB disk, Cloud DNS, and dedicated-VPC Cloud NAT make up the remainder.",
        costVariable: "Excludes Chrome Enterprise Premium/Secure Gateway contract pricing and tax. Traffic, logging, image licensing, exchange rates, and region changes alter the total; delete the run after testing to stop hourly charges.",
        nodes: [
          { label: "Managed Chrome", detail: "Trusts the issuing root through Chrome Root Store", costBadge: "CEP license required" },
          { label: "Secure Gateway", detail: "Identity, context, and hostname:443 policy", costBadge: "Check CEP agreement" },
          { label: "Regional internal Application LB", detail: "HTTPS termination with a regional server certificate", costBadge: "Region and usage billed" },
          { label: "HTTP backend", detail: "Run-owned private sample VM on port 80; no existing-endpoint option", costBadge: "Compute/disk billed" },
        ],
        supports: [
          { label: "Proxy-only subnet", detail: "REGIONAL_MANAGED_PROXY subnet dedicated to Google-managed Envoy proxies" },
          { label: "TLS ownership", detail: "Enterprise CA, local PoC CA, or validated existing certificate secret" },
          { label: "Chrome trust", detail: "Download the public root PEM and connect it to the test OU through Chrome Root Store" },
          { label: "Managed L7 path", detail: "HTTP health check, backend service, URL map, target HTTPS proxy, and internal forwarding rule" },
          { label: "Private egress", detail: "Dedicated VPC creates Router/NAT; existing VPC requires verified private egress" },
          { label: "Safe lifecycle", detail: "Discovery, conflict checks, reverse rollback, ownership-only teardown, and a dedicated change identity" },
        ],
      },
      {
        eyebrow: "Option C · Legacy Nginx / advanced",
        title: "Secure Gateway + Nginx + HTTP app",
        summary:
          "Use only when the private application speaks HTTP or the previous Nginx deployment is required. PoC uses one private Nginx VM; the implemented scale-ready path uses an internal passthrough Network Load Balancer and two-zone Nginx MIG (Production selection is disabled).",
        estimatedCost: "Estimated monthly PoC: about USD 45–60",
        costFixed: "Compute Engine instances, disks, Cloud DNS, and Cloud NAT are provisioned for the Nginx path. The local backend's scale-ready path also adds a passthrough load balancer.",
        costVariable: "VM runtime, network data transfer, NAT processing and assigned IPs, DNS queries, and autoscaled replica count.",
        nodes: [
          { label: "Managed Chrome", detail: "User identity + device/profile context", costBadge: "CEP license required" },
          { label: "Secure Gateway", detail: "Service Discovery + access policy", costBadge: "Check CEP agreement" },
          { label: "Nginx offload tier", detail: "PoC: 1 private VM · Scale-ready: passthrough ILB + 2-zone MIG", costBadge: "Compute/network billed" },
          { label: "HTTP app", detail: "GCP, AWS, Azure, or on premises", costBadge: "Existing infrastructure" },
        ],
        supports: [
          { label: "CPU autoscaling", detail: "Scale-ready default 2–20 replicas at 60%; min, max, and target are configurable" },
          { label: "Healthy capacity gate", detail: "Apply waits until the configured minimum replica count is healthy" },
          { label: "Two-zone resilience", detail: "Regional MIG distributes Nginx replicas across two zones" },
          { label: "Private DNS", detail: "App hostname resolves to the Nginx internal IP" },
          { label: "TLS material", detail: "CA Service/local CA or existing secret for Nginx" },
          { label: "Private path", detail: "VPN/Interconnect and backend firewall when off-GCP" },
          { label: "Discovery + conflicts", detail: "MIG and autoscaler state is discovered before mutations" },
          { label: "Rollback", detail: "Owned MIG/autoscaler changes participate in deployment rollback" },
          { label: "Product-scoped IAM", detail: "The shared role covers supported paths; preflight checks the selected path's required permissions" },
        ],
      },
    ],
    implementationTitle: "What is implemented",
    implementationIntro:
      "This is the implementation inventory for the current codebase. “Scale-ready” items exist in the backend but are not selectable while Production remains disabled; they are not presented as an active PoC resource.",
    implementationEyebrow: "Implementation inventory",
    implementationGroups: [
      {
        eyebrow: "Data plane",
        title: "HTTP offload and direct HTTPS",
        items: [
          "The Nginx HTTP-offload paths support either a managed sample backend or an existing private HTTP app in GCP, AWS, Azure, or on premises. The separate ILB HTTPS-offload path supports only its run-owned private sample backend VM.",
          "The extension's ILB HTTPS offload path creates the private sample VM, its unmanaged instance group, a REGIONAL_MANAGED_PROXY subnet, HTTP health check, INTERNAL_MANAGED backend service, regional URL map, regional server certificate, target HTTPS proxy, internal forwarding rule, and private DNS record without an Nginx offload VM.",
          "Direct HTTPS creates an exact hostname:port Secure Gateway application route through an existing VPC and omits Nginx, offload TLS, NAT, and managed A records.",
          "Dedicated-VPC and existing-VPC strategies, private-only VM addressing, private DNS, and the 136.124.16.0/20 gateway firewall source are modeled. A dedicated VPC adds Cloud Router/NAT for created VMs; an existing VPC must pass the private-egress confirmation gate.",
          "Off-GCP connectivity is consumed, not created: VPN/Interconnect, private DNS forwarding, backend firewall, and return routes remain explicit prerequisites.",
        ],
      },
      {
        eyebrow: "Scale-ready HTTP tier",
        title: "Regional Nginx availability and autoscaling",
        items: [
          "A two-zone regional Nginx managed instance group, internal passthrough Network Load Balancer, regional TLS health check, and health-check firewall are implemented for the scale-ready path. TLS remains on Nginx.",
          "CPU autoscaling defaults to 2–20 replicas at 60% CPU; minimum, maximum, and CPU target are configurable in English and Japanese.",
          "Deployment waits for the configured minimum number of healthy replicas before continuing.",
          "MIG/autoscaler discovery, compatibility and conflict detection, ownership-bounded reverse rollback, and required IAM permission checks are implemented.",
        ],
      },
      {
        eyebrow: "Google control plane",
        title: "Cloud and Chrome API automation",
        items: [
          "Service Usage, IAM, Compute Engine, Cloud DNS, Secret Manager, CA Service, BeyondCorp, Access Context Manager, Chrome Policy, Chrome Management, Licensing, and Billing are discovered or orchestrated as required by the selected architecture.",
          "The helper bootstraps a keyless deployer service account, product-scoped all-path custom role and bindings; Apply enables missing approved APIs.",
          "Secure Gateway, Service Discovery user IAM, delegating-account upstreamAccess, application matcher, application IAM, and optional Access Level condition are planned and applied.",
          "The test OU receives Secure Enterprise Browser and Endpoint Verification force-install policies, gateway route configuration, and the inherited legacy PAC override; OU, group, and Access Level options are fetched from APIs.",
        ],
      },
      {
        eyebrow: "TLS and identity",
        title: "Certificates and managed Chrome access",
        items: [
          "HTTP offload supports Enterprise CA, a validated existing public certificate secret, and a generated local PoC CA with its public root exported as PEM.",
          "Private keys remain in Secret Manager with a dedicated accessor identity. Owned offload secrets use a managed active-version alias for rotation; an approved public-certificate input is pinned to its numeric SecretVersion and digest. Renewal checks, offload refresh, and failure compensation are implemented.",
          "Chrome Root Store upload and OU connection are documented as a manual Admin console handoff because the public API cannot reliably read or mutate that configuration.",
          "Profile-managed BYOD Chrome and browser-managed Chrome can be represented by the selected Access Context Manager level; current profile, client, and Endpoint Verification reporting is surfaced separately.",
        ],
      },
      {
        eyebrow: "Safe Apply",
        title: "Discovery, approval, progress, and rollback",
        items: [
          "Trusted discovery builds a desired-state diff, labels create/update/no-op/conflict actions, and blocks incompatible existing resources before mutation.",
          "Billing, licenses, Workspace prerequisites, test OU, APIs, deployer identities, permissions, private connectivity, certificates, and Chrome signals are shown as API-verified, automatic, manual, or blocking gates.",
          "Approvals are bound to the exact configuration hash, expire, are single-use, and are invalidated by edits; browser-supplied audit actors are rejected.",
          "Apply records operation checkpoints and visual progress, permits one active run, detects interruption, and rolls back only owned changes in reverse order while preserving shared resources and exact IAM/Chrome Policy before-images.",
          "The Deploy tab exposes sanitized Secure Gateway and Nginx log queries, an owned/shared resource inventory, and an exact-confirmation teardown that deletes only recorded ownership in reverse dependency order.",
        ],
      },
      {
        eyebrow: "Verification and local security",
        title: "Acceptance evidence and operator protections",
        items: [
          "The durable acceptance matrix records applicable T01–T05 system findings, operator-provided T06/T07 evidence, and—in Production only—operator-provided T08 plus two T09 denial cases; evidence exports as portable JSON.",
          "A SHA-256 audit chain, deployment history, sanitized logs, generated request IDs, and query/credential redaction preserve traceability without recording secrets.",
          "The local app enforces loopback Host/Origin checks, a per-launch nonce, CSP, no-store responses, and a 0600 SQLite database. The extension uses its isolated MV3 origin, strict CSP, affirmative disclosure, session-only private keys, and encrypted IndexedDB state.",
          "Google Cloud mutations after bootstrap use the pinned keyless deployer service account. Workspace, Chrome, Cloud Identity, and licensing mutations use the signed-in administrator because those APIs require Workspace user authority. Service-account JSON keys and AWS/Azure credentials are not accepted. The workflow and configuration UI are available in English and Japanese.",
        ],
      },
    ],
    stepLabel: (step) => `Step ${step}`,
    steps: [
      {
        title: "Mode",
        subtitle: "Deployment boundary and strategy selection",
        summary:
          "Define the operational scope, client platform targets, network strategy, and certificate authority model.",
        actions: [
          "Keep rapid PoC mode enabled for the lightweight topology, and explicitly select a dedicated non-production project, VPC, and OU. PoC mode does not prove that selected existing resources are non-production.",
          "Select target Chrome client platforms (macOS, Windows, Linux, ChromeOS) for acceptance testing.",
          "Choose between creating a dedicated VPC network or integrating with an existing corporate VPC.",
          "Select the TLS certificate issuance strategy (Enterprise CA, Public Secret, or Local PoC CA).",
        ],
        optionsBehavior: [
          {
            name: "PoC vs. Production Mode",
            behavior:
              "PoC mode enforces the lightweight single-zone topology and disables this UI's Production topology. It does not isolate an existing project or VPC; the administrator must select dedicated non-production resources and review the plan.",
          },
          {
            name: "Dedicated VPC vs. Existing VPC",
            behavior:
              "Dedicated VPC provisions a new network with a 10.42.0.0/24 subnet; discovery blocks overlaps or resource collisions it can detect rather than guaranteeing a conflict-free range. Existing VPC routes through the selected network (and its owning project for direct HTTPS).",
          },
          {
            name: "Certificate Strategy",
            behavior:
              "Enterprise CA connects to Google Private CA Service; Public Secret uses pre-existing TLS certs; Local PoC CA generates a local self-signed Root CA for testing.",
          },
        ],
        apiCalls: [],
        safetyNote: "Local PoC CA should only be distributed to non-production test Organizational Units.",
      },
      {
        title: "Identities",
        subtitle: "Keyless cloud and workspace authentication",
        summary:
          "Establish keyless administrator sessions and bootstrap a dedicated product-scoped service account for impersonation.",
        actions: [
          "Use browser-managed administrator OAuth in the extension or keyless ADC in the local app; neither path exports a service-account JSON key.",
          "Bootstrap the keyless deployer service account (`secure-gateway-deployer`) with the documented all-supported-path custom role.",
          "Validate read-only API access to Google Cloud project and Google Workspace Chrome Policy.",
        ],
        optionsBehavior: [
          {
            name: "Google Cloud Project ID",
            behavior:
              "Identifies the target GCP project where Secure Gateway and network infrastructure are provisioned.",
          },
          {
            name: "Google Workspace Customer ID",
            behavior:
              "Identifies the Workspace tenant (e.g. C012abcde) for Chrome Enterprise policy distribution.",
          },
          {
            name: "Bootstrap Deployer Action",
            behavior:
              "Automatically provisions the compatibility deployer and role. If an explicitly reviewed 0.2.0 migration fails closed, a separate confirmation can create isolated `secure-gateway-studio-deployer` / `secureGatewayStudioDeployer` names without adopting or modifying the legacy identity.",
          },
        ],
        apiCalls: [
          {
            method: "GET",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts/{saEmail}",
            purpose: "Checks if the deployer service account already exists.",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts",
            purpose: "Creates the dedicated keyless deployer service account.",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/roles",
            purpose: "Creates the compatibility-named custom role with permissions for every supported deployment, rollback, and teardown path; roleId is supplied in the request body.",
          },
          {
            method: "PATCH",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/roles/{roleId}",
            purpose: "Updates the existing compatibility-named custom role with permissions for every supported deployment, rollback, and teardown path.",
          },
          {
            method: "POST",
            endpoint: "https://cloudresourcemanager.googleapis.com/v1/projects/{projectId}:setIamPolicy",
            purpose: "Binds custom deployer role, roles/browser, and roles/serviceusage.serviceUsageConsumer to the SA.",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts/{saEmail}:setIamPolicy",
            purpose: "Grants roles/iam.serviceAccountTokenCreator to the administrator on the service account.",
          },
          {
            method: "GET",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policySchemas",
            purpose: "Validates Chrome Policy schema read access; target-OU validation then uses policies:resolve.",
          },
        ],
        safetyNote: "No service-account JSON key is generated or stored; Google OAuth and short-lived impersonated credentials are used instead.",
      },
      {
        title: "Environment",
        subtitle: "Data plane architecture and routing specification",
        summary:
          "Configure the target VPC, regional placement, private hostname, and backend architecture tier. Option B always creates its own private sample backend VM.",
        actions: [
          "In the Chrome extension, Option B creates a private sample VM and regional internal Application Load Balancer through the same approval, ownership, rollback, and teardown workflow as the other paths.",
          "Specify the application private hostname, port, and upstream VPC network.",
          "For a Shared VPC or any cross-project upstream, before validation/preflight an upstream-project administrator must manually create and grant the deployment-project deployer an upstream-project custom role containing exactly compute.networks.get, compute.networks.use, resourcemanager.projects.get, resourcemanager.projects.getIamPolicy, and resourcemanager.projects.setIamPolicy. Bootstrap is deployment-project-only, and project custom roles cannot be granted outside the project that owns them.",
          "Option B requires a dedicated proxy-only subnet CIDR and creates a run-owned private sample backend VM. A dedicated VPC adds Router/NAT; an existing VPC requires verified private egress.",
        ],
        optionsBehavior: [
          {
            name: "Option A (Direct HTTPS)",
            behavior:
              "Routes traffic directly to an existing private HTTPS endpoint. Bypasses Nginx and Load Balancer creation.",
          },
          {
            name: "Option B (ILB HTTPS Offload)",
            behavior:
              "Creates a Regional Internal Application Load Balancer with an Envoy proxy subnet and a run-owned private sample VM, then terminates TLS and forwards HTTP to that VM on port 80. Existing HTTP endpoints are not supported.",
          },
          {
            name: "Option C (Nginx HTTPS Offload)",
            behavior:
              "Deploys a dedicated private Compute Engine VM or Managed Instance Group running Nginx reverse proxy.",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways",
            purpose: "Provisions the Secure Gateway resource.",
          },
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways/{gw}/applications",
            purpose: "Registers the private application with hostname:port matcher and VPC route.",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/global/firewalls",
            purpose: "Creates ingress firewall rule allowing TCP from 136.124.16.0/20 gateway source range.",
          },
          {
            method: "POST",
            endpoint: "https://dns.googleapis.com/dns/v1/projects/{projectId}/managedZones",
            purpose: "Creates Cloud DNS private zone bound to the target VPC network.",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/regions/{region}/subnetworks",
            purpose: "Provisions REGIONAL_MANAGED_PROXY subnet for Option B ILB Envoy proxies.",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/zones/{zone}/instances",
            purpose: "Creates Option B's run-owned private sample backend VM with no external IP.",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/regions/{region}/forwardingRules",
            purpose: "Creates internal HTTPS forwarding rule for ILB offload tier.",
          },
        ],
        safetyNote: "Regional ILBs must have Global Access enabled if accessed across regions. Option B mutations use the same approved run and teardown inventory as the other extension paths.",
      },
      {
        title: "Certificate",
        subtitle: "TLS ownership and trust propagation",
        summary:
          "Manage certificate issuance, Secret Manager key encapsulation, and Chrome Root Store connector distribution.",
        actions: [
          "Choose certificate origin: Enterprise CA Service, existing secret, or browser-generated local PoC CA.",
          "Store TLS private keys securely in Google Cloud Secret Manager with least-privilege accessor bindings.",
          "Download generated root CA PEM and link it to Chrome Root Store in Google Admin console.",
        ],
        optionsBehavior: [
          {
            name: "Enterprise CA Service",
            behavior:
              "Issues certificates through an existing Google Cloud CA Service pool and authority.",
          },
          {
            name: "Public Secret",
            behavior:
              "References pre-existing validated server certificates stored in Secret Manager.",
          },
          {
            name: "Local PoC CA",
            behavior:
              "Generates ephemeral 3072-bit RSA root and server keys in WebCrypto, then signs the server certificate with the in-memory root key.",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://secretmanager.googleapis.com/v1/projects/{projectId}/secrets",
            purpose: "Creates encrypted secret container for TLS certificates and private keys.",
          },
          {
            method: "POST",
            endpoint: "https://secretmanager.googleapis.com/v1/projects/{projectId}/secrets/{secretId}:addVersion",
            purpose: "Uploads certificate payload version with automatic accessor IAM restriction.",
          },
        ],
        safetyNote:
          "The root CA private key is never exported. The server private key exists only in the active run's in-memory/session bundle, is uploaded to Secret Manager, and is cleared from extension session storage when the run finishes. Public certificate material is encrypted at rest in IndexedDB and may be downloaded; chrome.storage.local is not used after the accepted 0.2.0 migration.",
      },
      {
        title: "Access",
        subtitle: "Zero-Trust policy and user authorization",
        summary:
          "Bind Context-Aware Access levels and enforce Chrome Enterprise browser policies on the test OU.",
        actions: [
          "Select the target Organizational Unit (OU) from Google Workspace Directory API.",
          "Apply Context-Aware Access Level condition (e.g. Managed Chrome device/profile required).",
          "Grant Secure Gateway application access to specific test users, groups, or domains.",
        ],
        optionsBehavior: [
          {
            name: "Target Organizational Unit (OU)",
            behavior:
              "Scopes Chrome policy push so only managed browsers in the dedicated test OU receive gateway configuration.",
          },
          {
            name: "Managed Chrome Access Level",
            behavior:
              "Restricts application access at the gateway level to devices/profiles satisfying BeyondCorp posture.",
          },
          {
            name: "Principal Types (User, Group, Domain)",
            behavior:
              "Binds `roles/beyondcorp.sgApplicationUser` to authorized test identities in IAM.",
          },
        ],
        apiCalls: [
          {
            method: "GET",
            endpoint: "https://admin.googleapis.com/admin/directory/v1/customer/{customerId}/orgunits",
            purpose: "Retrieves organizational unit hierarchy from Google Workspace.",
          },
          {
            method: "GET",
            endpoint: "https://accesscontextmanager.googleapis.com/v1/accessPolicies/{policyId}/accessLevels",
            purpose: "Lists available Context-Aware Access Levels.",
          },
          {
            method: "POST",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:batchModify",
            purpose: "Force-installs Secure Enterprise Browser & Endpoint Verification extensions and sets routing policy.",
          },
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways/{gw}/applications/{app}:setIamPolicy",
            purpose: "Binds application user roles and access level conditions to test principals.",
          },
        ],
        safetyNote: "Existing PAC policies on parent OUs are overridden only within the target test OU.",
      },
      {
        title: "Review",
        subtitle: "Deterministic preflight and cryptographic approval",
        summary:
          "Perform comprehensive read-only discovery, evaluate all safety gates, and bind approval to a SHA-256 hash.",
        actions: [
          "Scan existing Google Cloud and Workspace assets to build an exact desired-state diff.",
          "Evaluate safety gates (APIs, permissions, CIDR conflicts, licenses, existing certificates).",
          "Confirm human approval bound cryptographically to the exact configuration payload hash.",
        ],
        optionsBehavior: [
          {
            name: "Preflight Discovery",
            behavior:
              "Runs non-mutating scans across all required APIs to detect resource conflicts before execution.",
          },
          {
            name: "Safety Gates Verification",
            behavior:
              "Enforces prerequisites (Billing, CEP license, Private DNS, Firewalls) with Pass / Planned / Blocked status.",
          },
          {
            name: "SHA-256 Approval Binding",
            behavior:
              "Calculates a deterministic canonical hash of the plan. Any subsequent modification immediately revokes the approval.",
          },
        ],
        apiCalls: [
          {
            method: "GET",
            endpoint: "https://serviceusage.googleapis.com/v1/projects/{projectId}/services",
            purpose: "Audits enabled Google Cloud APIs.",
          },
          {
            method: "POST",
            endpoint: "https://cloudresourcemanager.googleapis.com/v1/projects/{projectId}:testIamPermissions",
            purpose: "Validates caller possesses all necessary IAM permissions for planned changes.",
          },
        ],
        safetyNote: "Approval cannot be granted while any blocking safety gate remains unresolved.",
      },
      {
        title: "Apply",
        subtitle: "Ordered orchestration, rollback, and evidence capture",
        summary:
          "Execute approved mutations in topological dependency order with ownership tracking, then persist the applicable acceptance matrix for separate verification.",
        actions: [
          "Provision the selected runtime path sequentially: subnets -> certificates -> Nginx VM/MIG (or the local-app-only HTTPS ILB) -> gateway -> DNS -> Chrome policies.",
          "Track resource ownership in IndexedDB audit store; reverse-rollback only owned assets on failure.",
          "After Apply, separately run the applicable T01–T05 system checks from Operations and record operator evidence for T06/T07. Production additionally requires T08 and two T09 denial cases before exporting audited JSON evidence.",
        ],
        optionsBehavior: [
          {
            name: "Dependency-Ordered Execution",
            behavior:
              "Ensures prerequisite infrastructure (VPC, Subnets, Secrets) exists before higher-level services bind to them.",
          },
          {
            name: "Automated Reverse Rollback",
            behavior:
              "If any step fails, undoes previously created resources in strict reverse order while preserving pre-existing shared assets.",
          },
          {
            name: "Separate acceptance verification and evidence",
            behavior:
              "Apply only persists the matrix. Operations runs applicable system-verifiable T01–T05 checks; the operator records T06/T07 and, in Production, T08 plus unauthorized-principal and unmanaged-browser T09 cases.",
          },
        ],
        apiCalls: [],
        safetyNote:
          "MV3 worker suspension resumes from durable checkpoints. If the browser session loses an ephemeral TLS private key, the run fails closed into ownership-bounded rollback; operator reconciliation is required only if cleanup cannot complete.",
      },
    ],
    faqTitle: "Frequently Asked Questions & Troubleshooting (FAQ)",
    faqIntro:
      "Essential guides, troubleshooting procedures, certificate trust mechanisms, and operational best practices derived from real-world Secure Gateway deployments.",
    faqEyebrow: "Troubleshooting & best practices",
    faqChecklistLabel: "Verification checklist & resolution steps",
    faqs: [
      {
        id: "faq-503-unavailable",
        category: "Routing & Data Path",
        question: "Why does Chrome show '503 Service Unavailable' or connection failure when accessing private applications?",
        answer:
          "A 503 error indicates that BeyondCorp Security Gateway cannot establish a TCP/TLS connection with the approved run-scoped backend hostname and reserved private address. Verify the selected or run-owned Compute target, firewall, private DNS, and—only when the approved architecture requires it—Cloud NAT.",
        checklist: [
          "Open this run's Resources and Logs panels, then run T01–T05 verification; use only the run-scoped inventory and sanitized evidence when comparing live resources.",
          "Verify the approved firewall rule allows the required backend port from the Secure Gateway source range 136.124.16.0/20, never from 0.0.0.0/0.",
          "Verify Cloud Router and Cloud NAT, when required by the approved network strategy, are configured for the created subnet in the VPC selected in this run.",
          "Ensure the run-scoped Cloud DNS private zone maps the approved hostname to the exact reserved private address shown in that run's resource inventory.",
        ],
      },
      {
        id: "faq-cert-authority-invalid",
        category: "Certificates & Root CA",
        question: "Why does Chrome report 'net::ERR_CERT_AUTHORITY_INVALID' or 'Not Secure' with a certificate warning?",
        answer:
          "This occurs when the TLS server certificate is not covered by the root configured for the dedicated test OU in Chrome Root Store, or when the managed work profile has not received the updated policy yet.",
        checklist: [
          "Download the latest public PoC root PEM from Apply (Step 7) or Deployment Manager and verify its fingerprint.",
          "In Google Admin console, add the PEM at Chrome > Connectors > Chrome Root Store and connect that configuration only to the dedicated test OU.",
          "In the same managed work profile, open chrome://policy and click 'Reload policies', then restart Chrome if the policy has not refreshed.",
          "Retry the approved private HTTPS hostname in that same managed profile; do not bypass the certificate warning or use Incognito as a trust test.",
        ],
      },
      {
        id: "faq-oauth-external-mode",
        category: "OAuth & Distribution",
        question: "How should the Google Cloud OAuth Consent Screen be configured when sharing the extension with external testers?",
        answer:
          "Use External / Testing only for explicitly named testers outside your Workspace domain. This extension requests sensitive scopes, so external production distribution requires Google OAuth branding and scope verification; Production status does not make an unverified app unrestricted.",
        checklist: [
          "In Google Cloud Console -> APIs & Services -> OAuth consent screen, set User Type to External.",
          "In Testing mode, add each tester under Test users. The unverified-app user cap still applies, and grants for sensitive scopes may expire after seven days.",
          "Before external production use, complete the repository's OAuth branding/scope-verification checklist. Workspace administrator access policies can still block authorization.",
        ],
      },
      {
        id: "faq-extension-id-mismatch",
        category: "OAuth & Distribution",
        question: "How do we prevent 'OAuth2 request failed: Bad Client ID' errors on testers' computers?",
        answer:
          "Unpacked extensions calculate their Extension ID from local directory paths unless a fixed public key ('key') is specified in manifest.json. Ensure the extension ID matches the Item ID configured in GCP OAuth 2.0 Client Credentials.",
        checklist: [
          "Verify the Item ID in GCP Credentials -> OAuth 2.0 Client IDs matches the extension ID on chrome://extensions.",
          "The versioned secure-gateway-studio ZIP includes a fixed key to guarantee the exact same extension ID on every tester machine.",
        ],
      },
      {
        id: "faq-access-level-cel",
        category: "Zero Trust & Security",
        question: "How does Access Context Manager (CEL) enforce Managed Chrome device/profile requirements?",
        answer:
          "BeyondCorp Application IAM bindings reference an Access Context Manager level whose CEL uses device.chrome.management_state (for example, PROFILE_MANAGED or BROWSER_MANAGED). Requests that do not satisfy that verified level are denied at Google's edge.",
        checklist: [
          "In Deployment Manager, select NONE or an existing full accessPolicies/.../accessLevels/... resource returned by Google.",
          "The manager updates the application's conditional IAM binding and principals; it never creates an Access Context Manager level.",
          "All modifications are logged to the tamper-evident cryptographic audit trail.",
        ],
      },
      {
        id: "faq-owned-teardown",
        category: "Operations & Teardown",
        question: "How do we safely remove the resources created by a deployment?",
        answer:
          "Use Teardown in Deployment Manager. It deletes only resources recorded as owned by that run, in reverse dependency order. Shared IAM and Chrome policy before-images are restored only when the current value safely matches that run's recorded managed-after state; drift or a write with an unknown result is retained for manual reconciliation. Other pre-existing resources are retained.",
        checklist: [
          "In Deployment Manager -> Teardown, type the exact confirmation phrase to execute the run-scoped teardown.",
          "Review the owned, restored, and retained resource lists before confirming the run-scoped operation.",
        ],
      },
    ],
  },
  cepDeployer: {
    title: "Easy PoC for Chrome Enterprise Premium",
    subtitle:
      "Apply a CEP evaluation baseline to one organizational unit and inspect exact cleanup candidates afterward.",
    intro:
      "Writes Chrome policies for threat protection, content inspection, and data boundaries into a pilot OU. Cleanup inspection is read-only because CEP does not yet persist three-way before/managed-after ownership; Chrome Policy, Access Level, and Cloud Identity DLP candidates are retained for manual review. Workspace administrator access is assigned separately in the Admin console, and every policy is checked against live schemas before it is written.",
    targetOuCardTitle: "1. Target organizational unit",
    targetOuCardSubtitle:
      "Pick an isolated non-production pilot OU. Root is blocked; OU-scoped policy can affect the selected OU and its descendants.",
    targetScopeCardTitle: "1. Target scope (Organizational Unit / Google Group)",
    targetScopeCardSubtitle:
      "Select whether to apply policies to an Organizational Unit (OU) or a Google Group for zero-touch PoC evaluation without moving users.",
    targetTypeOu: "Organizational Unit (OU)",
    targetTypeGroup: "Google Group",
    selectTargetGroup: "Target Google Group",
    selectTargetGroupPlaceholder: "Select or enter a Google Group",
    refreshGroups: "↻ Refresh Groups",
    targetGroupImpact:
      "Chrome policies (via groups:batchModify) and Cloud Identity DLP rules will apply directly to members of the selected Google Group. Users do not need to be moved to a different OU.",
    targetGroupConfirmationLabel: "Confirm the target group by typing its exact email address",
    targetGroupConfirmationHint:
      "This field is cleared after every mutation. Type the displayed group email to confirm deployment.",
    copyTargetGroupEmail: "Copy Group Email",
    groupLoadFailed: "Groups could not be loaded. You can still type the group email manually.",
    customGroupInputPlaceholder: "e.g. poc-team@yourdomain.com",
    orEnterGroupEmail: "Or enter group email directly:",
    selectTargetOu: "Target organizational unit",
    selectTargetOuPlaceholder: "Select a non-root pilot OU",
    rootOuUnavailable: "root — unavailable",
    targetOuImpact:
      "Chrome policies and OU-scoped DLP rules can affect the selected OU and descendant OUs through inheritance. Creating an access level adds an organization-scoped resource but does not attach it to an application here. Licence assignment is limited to users whose current Directory path exactly equals the selected OU; descendants are excluded.",
    targetOuConfirmationLabel: "Confirm the target by typing its exact OU path",
    targetOuConfirmationHint:
      "This field is cleared after every provision or licence action. Review the impact above, then type the displayed path again before each mutation.",
    ouLoadFailed:
      "Organizational units could not be loaded. Confirm the Google Workspace connection on the setup screen, then reopen this tab.",
    canonicalCustomerIdRequired:
      "Verify the Workspace connection first. DLP changes require the canonical customer ID returned by Directory (it begins with C); my_customer is never sent to Cloud Identity Policy create.",
    verifyGoogleAccount: "Verify Google Account & Load Directory",
    verifyingGoogleAccount: "Verifying Google Account & Loading OUs & Groups…",
    verifyGoogleAccountHint: "Click above to authenticate with Google OAuth and automatically load your Organizational Units (OUs) and Google Groups at once.",
    retry: "Retry",
    refreshOus: "↻ Refresh OUs",
    reloading: "Reloading…",
    autoCreateSubOus: "Create \"CEP Users\" and \"CEP Browsers\" sub OUs",
    autoCreateSubOusHint:
      "Creates or reuses optional child OUs for later organization. Policies stay on the selected pilot OU, cover its current occupants, and inherit to these children unless overridden there; users and enrolled browsers are not moved automatically.",
    presetsTitle: "2. Presets",
    presetsSubtitle:
      "A starting point for the usual evaluation shapes. Adjust the modules below afterwards.",
    presetFullPoc: "Full evaluation",
    presetFullPocDesc:
      "Every module: threat protection, content inspection, reporting, posture signals, and copy/paste boundaries.",
    presetAiProtection: "Generative AI and data leaks",
    presetAiProtectionDesc:
      "Paste and upload inspection aimed at prompts typed into external AI tools, plus non-corporate account blocking.",
    presetEndpoint: "Endpoint hardening",
    presetEndpointDesc:
      "Enhanced Safe Browsing, real-time URL checks, forced Endpoint Verification, and Context-Aware Access.",
    presetAudit: "Visibility and warnings",
    presetAuditDesc: "Reporting plus warning-only Chrome DLP rules. Nothing is blocked.",
    modulesTitle: "3. Policy modules",
    modulesSubtitle:
      "Each module is applied as its own batch, so one unsupported policy does not take the others with it.",
    moduleCorePolicies: "Chrome core security policies",
    moduleCorePoliciesDesc:
      "Enhanced Safe Browsing, a warning when a corporate password is reused elsewhere, and Chrome cloud and profile reporting.",
    moduleForceExtensions: "Force-install Endpoint Verification",
    moduleForceExtensionsDesc:
      "Pushes Google's Endpoint Verification extension so device posture signals reach Context-Aware Access.",
    moduleConnectors: "Content inspection connectors",
    moduleConnectorsDesc:
      "Real-time URL checks plus file upload and download inspection, and security event reporting to Google.",
    accessLevelTitle: "Context-Aware Access (CAA) Level",
    accessLevelSelectPrompt: "Select an Access Level to enforce",
    accessLevelHint:
      "Enforces DLP unmanaged device rules and Secure Gateway controls on devices matching this Access Level (CEL: access_levels.exists). Leave as 'None' if not required.",
    accessLevelNone: "None",
    accessLevelNoneDesc: "Do not require an access level.",
    accessLevelAutoProfile: "Create one: managed Chrome profile",
    accessLevelAutoBrowser: "Create one: managed Chrome browser",
    accessLevelAutoAny: "Create one: managed profile or browser",
    accessLevelExistingGroup: "Existing access levels",
    accessLevelLoadFailed:
      "Existing access levels could not be listed. A Google Cloud project attached to an organization with an Access Context Manager policy is required to create one.",
    moduleDlpDetectors: "DLP detector for internal sites",
    moduleDlpDetectorsDesc:
      "Unavailable: settings/detector.url_list is not supported by the policy mutation API.",
    moduleDlpRules: "Starter DLP rules",
    moduleDlpRulesDesc:
      "Creates supported warn/block rules with LOW alert-center severity for sensitive operations, plus an allow-with-warning URL rule that watermarks internal pages and restricts screenshots.",
    betaBadge: "Beta",
    dlpBetaNote:
      "Creating supported settings/rule.dlp policies uses the Cloud Identity policy API, whose mutation methods are still in beta. Unsupported URL-list detector and access-level/BYOD conditions are not sent. Refused calls are reported with their reason.",
    dlpRegionTitle: "National identifier to scan for",
    dlpRegionHint:
      "Sets which Cloud DLP detector the national ID rule uses. A detector for the wrong country matches nothing, and a rule that never fires looks the same as one that works.",
    dlpRulesTableTitle: "Rules and what each one does",
    dlpRulesTableHint:
      "Chrome DLP Policy API supports three actions: Audit only (log event), Allow with warning, and Block. Choose Off if you do not want a rule created.",
    dlpActionOff: "Do not create",
    dlpActionAudit: "Audit only (log event)",
    dlpActionWarn: "Allow with warning",
    dlpActionBlock: "Block",
    dlpRuleNationalId: "National ID numbers pasted into pages",
    dlpRulePaymentCard: "Payment card numbers in uploads",
    dlpRuleAccessLevel: "Uploads from unmanaged Chrome",
    dlpRuleWatermark: "Watermark internal pages",
    dlpNoticeByodTitle: "Context-Aware Access Level Enforcement",
    dlpNoticeByodDesc: "Rules in this row use CEL contextCondition: access_levels.exists(level, level == \x27<ACCESS_LEVEL>\x27) to apply controls directly to unmanaged or non-compliant devices.",
    activePresetBadge: "Active",
    dataBoundaryModeTitle: "Data boundary",
    dataBoundaryModeCopyPaste: "Inspect pasted content",
    dataBoundaryModeCopyPasteDesc:
      "Bulk text pasted into a page is inspected, and Google apps only accept accounts on your primary domain.",
    dataBoundaryModeBlockNonCorp: "Block non-corporate Google accounts",
    dataBoundaryModeBlockNonCorpDesc:
      "Google apps only accept accounts on your primary domain, which closes the personal-Gmail-tab route.",
    dataBoundaryModeNone: "None",
    dataBoundaryModeNoneDesc:
      "Leave clipboard and account behaviour inherited from the parent OU.",
    internalUrlsTitle: "Protected Internal Sites (Watermark & Screenshot Block)",
    internalUrlsPlaceholder: "https://intranet.example.com\nhttps://portal.corp.example.com",
    internalUrlsHint:
      "Overlays a dynamic watermark and blocks screenshots when users access these internal sites. Enter one URL per line.",
    rolesCardTitle: "4. Workspace administrator access",
    rolesCardSubtitle:
      "Assign Workspace privileges in the Google Admin console. Google Cloud project IAM roles cannot grant Chrome Policy access or the required OAuth authority.",
    roleAdminLabel: "Policy operator",
    roleAdminDesc:
      "Assign a scoped Admin console role with Chrome settings and organizational-unit privileges. Cloud Identity DLP mutations require a Super Admin account.",
    roleAuditorLabel: "Read-only reviewer",
    roleAuditorDesc:
      "Create a separate Admin console role limited to the Chrome and OU read privileges needed for review; do not reuse the deployment account.",
    roleAssigneeEmailLabel: "Assignee Administrator Email (Optional)",
    roleAssigneeEmailPlaceholder: "admin@example.com",
    roleAssigneeEmailHint: "Leave blank to create roles without assigning to a user.",
    roleTypeSelectLabel: "Target Roles",
    roleTypeBoth: "Both (Policy Operator & Auditor)",
    roleTypeAdminOnly: "Policy Operator Only",
    roleTypeAuditorOnly: "Auditor Only",
    roleScopeOuCheckbox: "Limit role scope to selected Organizational Unit (OU)",
    roleCreateAssignBtn: "Create & Assign Workspace Roles",
    roleCreatingBtn: "Creating & Assigning Roles...",
    rolesAdminConsoleLink: "Open Admin roles in Google Admin console",
    rolesVerificationNote:
      "Use “Verify Google Account & Load OUs” after assignment. Deployment then calls the real Chrome Policy and Cloud Identity APIs and reports any authorization failure explicitly; no role is inferred from a project IAM binding.",
    testingScenariosTitle: "5. Testing the result",
    testingScenariosSubtitle:
      "Sample values that trip the detectors, so you can demonstrate an interception without using real data.",
    copyDummyData: "Copy",
    copiedToClipboard: "Copied",
    dummyPiiLabel: "Sample national ID number",
    dummyPiiValue: "1234-5678-9012",
    dummyPiiHint: "Formatted as a Japanese My Number / US SSN. Not a real identifier.",
    dummyCreditCardLabel: "Sample card number",
    dummyCreditCardValue: "4532015112830366",
    dummyCreditCardHint: "A Visa test number that passes the Luhn check. Not a real card.",
    dummySourceCodeLabel: "Sample API key in source",
    dummySourceCodeValue:
      "const GCP_SECRET_KEY = 'AIzaSyA_DEMO_CONFIDENTIAL_KEY_FOR_TESTING';",
    dummySourceCodeHint: "Shaped like a Google API key. Not a working credential.",
    scenarioGenAiTitle: "Paste inspection",
    scenarioGenAiStep:
      "Open an external AI tool and paste the sample API key. With paste inspection on, Chrome holds the paste until the verdict returns.",
    scenarioDataBoundaryTitle: "Data boundary",
    scenarioDataBoundaryStep:
      "Sign in to a personal Google account in the managed profile. With non-corporate accounts blocked, the sign-in is refused.",
    scenarioWatermarkTitle: "Upload inspection",
    scenarioWatermarkStep:
      "Upload a file containing the sample card number to any site outside your internal list. The upload is held for inspection and the event reaches the security investigation tool.",
    manualChecklistTitle: "Steps this tool cannot perform",
    manualChecklistSubtitle:
      "Google exposes no API for these, so complete them in the Admin Console before running the tests above.",
    manualChecklistItems: [
      {
        title: "Turn on sensitive content storage",
        detail: "Security > Access and data control > Data protection.",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "Turn on optical character recognition",
        detail: "Needed for detectors to read text inside images.",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "Enable automatic CEP licensing",
        detail: "Billing > License settings, for the pilot OU.",
        href: "https://admin.google.com/ac/billing/licensesettings",
      },
    ],
    btnDeploy: "Apply to the target OU",
    btnDeploying: "Applying...",
    btnRollback: "Inspect cleanup candidates",
    btnRollingBack: "Inspecting...",
    btnDownloadScript: "Export Chrome policies as Python",
    confirmRollback:
      "Inspect the exact Chrome Policy, Access Level, and Cloud Identity DLP cleanup candidates. This action is read-only and retains every candidate for ownership review. Continue?",
    downloadFailed: "The script could not be generated",
    noModulesSelected: "Select at least one policy module.",
    appliedTitle: "Applied",
    skippedTitle: "Skipped",
    statusLogTitle: "Execution trace",
    noActionYet: "Nothing has run yet. Pick a target OU and the modules you want, then apply.",

    licenseCardTitle: "License Management & Auto-Assignment Control",
    licenseCardSubtitle:
      "Prevent unexpected domain-wide license consumption and assign CEP licenses directly to the target OU.",
    licensePilotLimitNotice:
      "Safety Guard: Safely assigns licenses exclusively to users directly in the selected pilot OU (maximum 10 users).",
    licenseAutoAssignWarning:
      "To prevent unintended license consumption across the company, ensure auto-assignment is turned OFF on the Root OU in the Admin console.",
    licenseAutoAssignWarningLink: "Open Google Admin Console License Settings",
    licenseAutoAssignSteps: [
      "1. Open License Settings in Google Admin Console and select the Root OU.",
      "2. Turn Auto-assign OFF for Chrome Enterprise Premium.",
      "3. Either turn Auto-assign ON only for this pilot OU, or use the button below to assign licenses directly.",
    ],
    btnAssignLicensesToOu: "Assign CEP licenses (maximum 10 exact-OU users)",
    copyTargetOuPath: "Auto-fill path",
    tabSetup: "1. Setup Wizard",
    tabLicensing: "2. Users & Licensing",
    tabDlp: "3. DLP & Threat Matrix",
    tabOperations: "4. Operations & Testing",
    tabAll: "View All Sections",
    btnAssigningLicenses: "Assigning licenses to OU users...",
    licenseAssignUsersFound: "Processed users in OU",
    noUsersFoundInOu: "No users found in this organizational unit.",

    dlpMatrixTitle: "DLP Control Matrix",
    dlpMatrixSubtitle:
      "Configure supported actions (Block, Warn, Off) across Upload, Download, Paste, Print, and Watermark for all devices and Context-Aware Access level conditions.",
    dlpColThreat: "Data & Threat Category",
    dlpColUpload: "Upload",
    dlpColDownload: "Download",
    dlpColPaste: "Paste",
    dlpColPrint: "Print",
    dlpColWatermark: "Watermark",
    dlpColDeviceScope: "Supported Scope",

    dlpRowUniversalUpload: "All file uploads",
    dlpRowUniversalUploadDesc: "Inspects and warns/blocks all file uploads from Chrome.",
    dlpRowUniversalDownload: "All file downloads",
    dlpRowUniversalDownloadDesc: "Inspects and warns/blocks all file downloads in Chrome.",
    dlpRowPaymentCard: "Credit card / Payment data",
    dlpRowPaymentCardDesc: "Detects credit card numbers in uploads, pastes, and prints.",
    dlpRowNationalId: "National ID / PII data",
    dlpRowNationalIdDesc: "Detects regional PII / National ID numbers (e.g. My Number / SSN).",
    dlpRowAccessLevel: "Unmanaged / Context-Aware non-compliant devices",
    dlpRowAccessLevelDesc: "Enforces Chrome DLP controls on devices matching the Access Level via CEL condition (access_levels.exists).",
    dlpRowWatermark: "Internal sites / Watermark",
    dlpRowWatermarkDesc: "Allows navigation with a warning, overlays a watermark, and restricts screenshots on internal sites.",
    dlpRowGenAiBlock: "Unapproved GenAI (allow Gemini)",
    dlpRowGenAiBlockDesc: "Blocks ChatGPT, Claude, DeepSeek, etc. while allowing corporate Gemini.",

    dlpScopeAll: "All Devices",
    dlpScopeByodOnly: "Access Level (CAA)",
    dlpActionBadgeBlock: "Block",
    dlpActionBadgeWarn: "Warn",
    dlpActionBadgeAudit: "Unsupported",
    dlpActionBadgeAuditOnly: "Audit",
    dlpActionBadgeOff: "Off",

    dlpActionParamsTitle: "Action Parameters (actionParams)",
    dlpActionParamsSubtitle: "Attach additional controls to triggered DLP rules",
    dlpCustomMessageLabel: "Custom End-User Message (customEndUserMessage)",
    dlpCustomMessagePlaceholder: "e.g. This action violates corporate data protection policy. Contact Security.",
    dlpCustomMessageHint: "Custom message displayed to the end user in Chrome when warning or blocking.",
    dlpSaveContentLabel: "Save Matched Content Evidence (saveContent)",
    dlpSaveContentHint: "Preserve a copy of the matched sensitive content for incident investigation and audit.",

    dlpPresetRecommended: "Recommended PoC",
    dlpPresetRecommendedDesc: "Warn on sensitive data, block unapproved GenAI, and watermark internal sites without BYOD scoping.",
    dlpPresetStrictZeroTrust: "Strict Zero Trust",
    dlpPresetStrictZeroTrustDesc: "Block supported sensitive uploads and pastes; configure unmanaged-device conditions manually.",
    dlpPresetGenAiSecure: "Secure GenAI Pilot",
    dlpPresetGenAiSecureDesc: "Block unapproved consumer AI, permit Gemini with paste inspection.",
    dlpPresetAuditOnly: "Warning First",
    dlpPresetAuditOnlyDesc: "Use the least disruptive Chrome DLP action supported by the API across all selected surfaces.",
    geminiEnterpriseTitle: "Gemini Enterprise & Vertex AI Search Protection",
    geminiEnterpriseSubtitle:
      "Enterprise Generative AI & Agentic Search requires coordinated defense across Chrome, Identity, and Google Cloud perimeters.",
    geminiLayer1Title: "1. Chrome Endpoint & DLP Protection",
    geminiLayer1Desc:
      "Inspect and protect data sent to or retrieved from enterprise generative AI web applications.",
    geminiLayer1Bullet1:
      "Block paste and uploads containing PII, API keys, and confidential customer identifiers into AI prompts.",
    geminiLayer1Bullet2:
      "Enforce dynamic watermarking on downloaded AI summaries, synthesized reports, and generated charts.",
    geminiLayer2Title: "2. Context-Aware Access (CAA)",
    geminiLayer2Desc:
      "Restrict user authentication to compliant enterprise endpoints before access is granted.",
    geminiLayer2Bullet1:
      "Require Endpoint Verification (device.chrome.management_state == BROWSER_MANAGED) or trusted IP ranges.",
    geminiLayer2Bullet2:
      "Native Google Workspace CAA policy assignment now officially covers the Gemini app.",
    geminiLayer3Title: "3. VPC Service Controls & Agent Gateway",
    geminiLayer3Desc:
      "Prevent data exfiltration at the API and internal autonomous agent communication tiers.",
    geminiLayer3Bullet1:
      "Enforce discoveryengine.googleapis.com (Gemini Enterprise backend) inside a secure VPC-SC perimeter.",
    geminiLayer3Bullet2:
      "Enforce mutual TLS (mTLS) and DPoP (RFC 9449) token binding for Agent-to-Agent interactions.",
    geminiCliTitle: "Google Cloud VPC-SC & Access Level Provisioning Commands",
    geminiCliCopyBtn: "Copy commands",
    dlpPresetGeminiEnterprise: "Gemini Enterprise",
    geminiAutoProvisionTitle: "🚀 Automated Gemini Enterprise Zero-Trust Provisioning",
    geminiAutoProvisionSubtitle:
      "Automatically provision Google Cloud Access Context Manager (ACM) access levels and VPC Service Controls security perimeters in one click.",
    geminiTargetProjectLabel: "Target Google Cloud Project ID",
    geminiPolicyIdLabel: "Access Context Manager Policy ID (auto-detected if blank)",
    geminiPerimeterNameLabel: "VPC-SC Perimeter Identifier",
    geminiEnforceAccessLevelLabel: "Create & bind ACM Access Level (require Managed Chrome: BROWSER_MANAGED)",
    geminiAccessLevelSelectLabel: "ACM Access Level",
    geminiAccessLevelDefaultOption: "Auto-create: secgw_chrome_managed (Managed Chrome Browser)",
    geminiAccessLevelSelectHint: "Select an existing ACM Access Level or let SGS create a new level requiring Managed Chrome.",
    geminiEnforcePerimeterLabel: "Create VPC-SC Service Perimeter protecting discoveryengine.googleapis.com",
    geminiDryRunLabel: "Create in Dry-Run / Audit mode (log violations in Cloud Logging without blocking traffic)",
    geminiAutoProvisionBtn: "🚀 Auto-provision Zero-Trust Perimeter",
    geminiAutoProvisioningBtn: "Provisioning Zero-Trust...",
    geminiSuccessTitle: "Zero-Trust Security Perimeter Provisioned Successfully",
    geminiStep1: "1. Resolving GCP Project & Access Policy",
    geminiStep2: "2. Ensuring ACM Access Level (Managed Chrome)",
    geminiStep3: "3. Ensuring VPC-SC Perimeter (Discovery Engine)",
    geminiStep4: "4. Verifying & Finalizing Zero-Trust Posture",
    geminiStep5Rca: "5. Creating Restricted Client Application (RCA) User Access Binding",
    geminiAdminLockoutWarningTitle: "Important: GCP Console Administrator Access Requirement",
    geminiAdminLockoutWarningText:
      "Enforcing an Access Level on discoveryengine.googleapis.com (VPC-SC) requires GCP administrators managing Gemini Enterprise from the Cloud Console to also access it from a Managed Chrome browser. Unmanaged browsers will receive HTTP 403 errors in the Cloud Console. To avoid admin lockout on unmanaged devices, consider Approach 2 (RCA group binding) or Ingress user exceptions.",
    geminiEnforceRcaLabel: "Approach 2: Bind Restricted Client Application (RCA) to Google Group",
    geminiRcaGroupKeyLabel: "Target Google Group (Email or Group ID)",
    geminiRcaGroupKeyPlaceholder: "e.g. gemini-enterprise-users@example.com or 0184mhaj3tyhbjb",
    geminiRcaGroupKeyHint:
      "Directly binds Gemini Enterprise app access levels to the specified group via Access Context Manager (avoids GCP admin console lockouts and VPC-SC perimeter conflicts).",
    geminiRcaBindingLabel: "RCA Cloud Binding",
    geminiRcaCliTitle: "Restricted Client Application (RCA) gcloud Provisioning Commands",
    geminiRcaCliCopyBtn: "Copy RCA commands",

    deployProgressTitle: "Deploying Chrome Enterprise Premium...",
    deployStep1: "1. Target OU Validation",
    deployStep2: "2. Policy Generation",
    deployStep3: "3. DLP Rule & Detector Registration",
    deployStep4: "4. Finalization & Evidence Logging",

    rollbackProgressTitle: "Executing Rollback...",
    rollbackStep1: "1. Identifying Resources to Revert",
    rollbackStep2: "2. Resetting Sub-OU Policies",
    rollbackStep3: "3. Cleaning DLP Rules & Access Levels",
    rollbackStep4: "4. Rollback Complete",

    roleProgressTitle: "Creating & Assigning Workspace Roles...",
    roleStep1: "1. Verifying Directory Privileges",
    roleStep2: "2. Creating CEP Operator & Auditor Roles",
    roleStep3: "3. Assigning Roles to Target Administrator",
    roleStep4: "4. Role Assignment Complete",

    licenseProgressTitle: "Assigning Evaluation Licenses...",
    licenseStep1: "1. Querying Users in Target OU",
    licenseStep2: "2. Assigning Chrome Enterprise Licenses",
    licenseStep3: "3. License Assignment Complete",
    // Error Diagnostic Resolver
    errDiagIamTitle: "Google Cloud IAM Permission Insufficient",
    errDiagIamCause: "The current Google account lacks organizational or project-level Access Context Manager permissions (e.g. roles/accesscontextmanager.policyAdmin).",
    errDiagIamRemediation: "Request your Organization Administrator to grant roles/accesscontextmanager.policyAdmin, or run the command below with an admin account.",
    errDiagIamConsoleLink: "Open Google Cloud IAM Console",
    errDiagWorkspaceTitle: "Google Workspace Super Admin Required",
    errDiagWorkspaceCause: "The Directory API or Chrome Policy API rejected the request because the signed-in account lacks Workspace Super Administrator privileges, or Third-Party API Client access is restricted.",
    errDiagWorkspaceRemediation: "Sign in with a Google Workspace Super Administrator account or grant Admin SDK privileges in the Google Admin Console.",
    errDiagWorkspaceConsoleLink: "Open Admin Console Roles",
    errDiagVpcScConflictTitle: "VPC Service Controls Perimeter Conflict",
    errDiagVpcScConflictCause: "This Google Cloud project is already assigned to another VPC Service Controls perimeter or the perimeter identifier already exists.",
    errDiagVpcScConflictRemediation: "Specify an isolated evaluation project, or modify the existing perimeter in Google Cloud Console to add Discovery Engine.",
    errDiagVpcScConsoleLink: "Open VPC Service Controls Console",
    errDiagOuConfirmTitle: "Target OU Path Confirmation Mismatch",
    errDiagOuConfirmCause: "To prevent accidental deployment to parent or root organizational units, you must type the exact path of the target OU.",
    errDiagOuConfirmRemediation: "Copy the exact path shown in the prompt and paste it into the confirmation field.",
    errDiagRateLimitTitle: "Google Cloud API Rate Limit Exceeded (429)",
    errDiagRateLimitCause: "Cloud Identity or Resource Manager API requests exceeded the standard quota (1 QPS).",
    errDiagRateLimitRemediation: "Wait 10-30 seconds. Secure Gateway Studio uses automatic backoff, so retrying now should succeed.",
    errDiagWorkerTitle: "Chrome Extension Background Worker Suspended",
    errDiagWorkerCause: "Chrome put the Manifest V3 service worker to sleep, or the extension was reloaded mid-request.",
    errDiagWorkerRemediation: "Click the Retry button below or reload the extension page to re-establish the connection.",
    errDiagProjectNoOrgTitle: "Google Cloud Project Not in Organization",
    errDiagProjectNoOrgCause: "Access Context Manager and VPC Service Controls require projects to belong to a Google Cloud Organization.",
    errDiagProjectNoOrgRemediation: "Select a project under your company organization rather than an unassociated standalone project.",
    errDiagPolicyNotFoundTitle: "Access Context Manager Policy Not Found",
    errDiagPolicyNotFoundCause: "No Access Policy exists in your organization, or the default policy ID could not be resolved.",
    errDiagPolicyNotFoundRemediation: "Create an Access Policy in Access Context Manager console or specify your policy ID manually.",
    errDiagPolicyConsoleLink: "Open Access Context Manager Console",
    errDiagOuStaleTitle: "Target Organizational Unit Not Found or Stale",
    errDiagOuStaleCause: "The selected organizational unit ID is no longer present or its path changed in Google Workspace Directory.",
    errDiagOuStaleRemediation: "Click 'Reload OU List' to refresh the organization structure and reselect the target organizational unit.",
    errDiagRootOuForbiddenTitle: "Root Organizational Unit Not Permitted",
    errDiagRootOuForbiddenCause: "Deploying CEP policies or assigning licenses directly to the root organizational unit (/) can impact all users across the domain.",
    errDiagRootOuForbiddenRemediation: "Select a child organizational unit dedicated to your evaluation group or test users.",
    errDiagScopeInvalidTitle: "Invalid Workspace Customer Scope or Identity",
    errDiagScopeInvalidCause: "A valid Workspace Customer ID and target organizational unit ID are required for this operation.",
    errDiagScopeInvalidRemediation: "Verify the Workspace customer ID in deployment settings and ensure an organizational unit is selected.",
    errDiagProjectRequiredTitle: "Google Cloud Project ID Required",
    errDiagProjectRequiredCause: "Cloud Access Context Manager, VPC Service Controls, or IAM mutations require a valid Google Cloud Project ID.",
    errDiagProjectRequiredRemediation: "Enter or select a valid Google Cloud Project ID in the configuration field.",
    errDiagGeminiTitle: "Gemini Enterprise / Discovery Engine Access Denied",
    errDiagGeminiCause:
      "Access to Gemini Enterprise (vertexaisearch.cloud.google.com or discoveryengine.googleapis.com) was blocked because the current browser is not recognized as a Managed Chrome Browser meeting the Access Level, or a GCP administrator is attempting to access the Cloud Console from an unmanaged device.",
    errDiagGeminiRemediation:
      "Ensure you are using a company-managed Chrome browser with policy sync enabled. If you are a GCP administrator, access the Cloud Console from a Managed Chrome browser or configure an ingress exception rule.",
    errDiagGeminiConsoleLink: "Open Vertex AI Search & Conversation Console",
    geminiConfirmProjectLabel: "Confirm Project ID (Strict Enforcement Safeguard)",
    geminiConfirmProjectHint: "To run Gemini Zero Trust provisioning with strict perimeter enforcement, re-type the exact target Project ID.",
    geminiConfirmProjectMismatch: "Type the exact target Project ID before provisioning in strict mode.",
    errDiagGenericTitle: "Operation Failed with Error",
    errDiagGenericCause: "An unexpected error occurred during execution.",
    errDiagGenericRemediation: "Check the technical details below and verify API enablement and network connectivity.",
    errDiagCauseLabel: "Cause:",
    errDiagRemediationLabel: "Remediation Steps:",
    errDiagCommandHeader: "Fix Command / Admin Request Template:",
    errDiagRetryBtn: "Retry Operation",
    errDiagRawDetails: "Technical Error Details (for debugging)",

    // Security Assessment & Policy Recommender
    assessOpenBtn: "🎯 Security Assessment & Recommended Policies",
    assessModalTitle: "🎯 Enterprise Security Assessment & Policy Recommender",
    assessModalSubtitle: "Select your company's top security risks and operational challenges. Chrome Enterprise Premium will automatically calculate the optimal recommended policy baseline, DLP matrix, and projected ROI.",
    assessPresetLabel: "Quick Presets",
    assessPresetGenAi: "GenAI Safe Adoption",
    assessPresetCost: "Exit VDI / Replace CASB (Cost Cut)",
    assessPresetRemote: "Remote Work & BYOD Posture",
    assessPresetAll: "Enterprise Max Security (Select All)",
    assessPresetClear: "Clear All",
    assessGroupGenAi: "GenAI & Cloud Data Protection",
    assessGroupPosture: "Device Posture & Remote Access",
    assessGroupSaas: "SaaS Protection & Zero Trust Modernization",
    assessGroupCost: "Cost Optimization & Zero-Agent Endpoint",
    assessQ1Title: "Prevent confidential copy/pasting into GenAI (ChatGPT, Gemini, etc.) and Web",
    assessQ1Risk: "Employees pasting confidential source code or customer data into external GenAI causing data leakage",
    assessQ1Solution: "Chrome Enterprise DLP enforces real-time clipboard paste inspection and blocking/warning on web AI apps",
    assessQ2Title: "Restrict Web upload/download of Personal Data (PII, Customer lists, Financials)",
    assessQ2Risk: "Downloading PII/customer CSVs from SaaS or Web apps to unapproved personal PCs or clouds",
    assessQ2Solution: "Real-time DLP file inspection blocking sensitive national IDs, credit cards, and customer data",
    assessQ3Title: "Confidential screen printing restriction & screen capture watermark overlay",
    assessQ3Risk: "Printing confidential designs/customer lists or taking phone camera screen photos to take off-site",
    assessQ3Solution: "Browser print blocking + dynamic electronic watermark (user email, timestamp) over sensitive pages",
    assessQ4Title: "SaaS access control from unmanaged BYOD / untrusted networks",
    assessQ4Risk: "Accessing corporate SaaS from personal unapproved PCs leading to malware infection or credential theft",
    assessQ4Solution: "Context-Aware Access (CAA) strictly restricting access to Managed Chrome browsers (BROWSER_MANAGED)",
    assessQ5Title: "Block access from devices with outdated OS or unencrypted disks",
    assessQ5Risk: "Vulnerable unpatched PCs connecting to internal systems becoming ransomware entry points",
    assessQ5Solution: "Endpoint Verification posture checking enforcing minimum OS version, screen lock, and disk encryption",
    assessQ6Title: "Strict corporate device identification using client certificates (mTLS)",
    assessQ6Risk: "Credential leak allows unauthorized third-party devices to log in to corporate services",
    assessQ6Solution: "Chrome Certificate Store binding corporate client certificates for strict mTLS device identification",
    assessQ7Title: "Strict zero-trust authorization for Google Workspace, M365, Salesforce",
    assessQ7Risk: "Critical SaaS relying solely on passwords/basic MFA remains vulnerable to cookie hijacking",
    assessQ7Solution: "Chrome Enterprise + Google Cloud Access Context Manager multi-layered zero-trust authorization",
    assessQ8Title: "Geographic access control (blocking untrusted/foreign IP ranges)",
    assessQ8Risk: "Detecting and blocking unauthorized brute force or access attempts from foreign/suspicious IP ranges",
    assessQ8Solution: "Granular IP-based and geographic CAA policies with automatic security alerts",
    assessQ9Title: "Need to transition to VPN-less direct secure access (SWG breakout)",
    assessQ9Risk: "VPN bandwidth saturation, frequent gateway crashes, and soaring hardware appliance maintenance costs",
    assessQ9Solution: "Chrome + Cloud Secure Web Gateway (SWG) enabling secure direct internet breakout (Exit VPN)",
    assessQ10Title: "Malicious Extension detection & force-uninstall",
    assessQ10Risk: "Employees installing unauthorized rogue browser extensions that steal session cookies and screen data",
    assessQ10Solution: "Extension whitelist enforcement (ExtensionInstallBlocklist: *, only corporate vetted extensions allowed)",
    assessQ11Title: "Long-term security audit logging & SIEM/BigQuery instant synchronization",
    assessQ11Risk: "Lack of forensic browser activity logs to investigate security incidents and regulatory compliance",
    assessQ11Solution: "Direct telemetry export of Chrome URL visits, DLP events, file transfers to Cloud Logging and BigQuery",
    assessQ12Title: "Immediate zero-day vulnerability patching & browser version governance",
    assessQ12Risk: "Lag in manual OS/browser patching leaves multi-week blank vulnerability window when zero-days emerge",
    assessQ12Solution: "Silent background auto-updates ensuring zero-day vulnerabilities are patched within hours org-wide",
    assessQ13Title: "Review and replace expensive CASB/SWG licenses (Netskope, Zscaler, etc.)",
    assessQ13Risk: "Paying tens to hundreds of millions of yen annually for third-party CASB/proxy subscription licenses",
    assessQ13Solution: "Browser-native CEP DLP and Cloud SWG integration directly replacing costly third-party CASB/proxies",
    assessQ14Title: "VDI (Citrix, VMware Horizon) server hardware refresh & maintenance cost reduction",
    assessQ14Risk: "Exorbitant multi-million dollar quotes for upcoming VDI server refreshes prompts need to exit VDI",
    assessQ14Solution: "Secure Enterprise Browser transforms local PCs into secure workspaces, slashing 80%+ of VDI/DaaS costs",
    assessQ15Title: "Eliminate PC slowness caused by multiple heavy endpoint agents",
    assessQ15Risk: "Stacking heavy agents (EDR, DLP, asset mgmt, encryption) causes slow PCs and endless user complaints",
    assessQ15Solution: "Zero additional agents required; DLP, access control, and auditing run natively inside Chrome",
    assessDefaultDlpCustomMessage: "Confidential data transfer is blocked by corporate security policy. Contact your security administrator if you require an exemption.",
    assessRecHeader: "Recommended Policy Baseline",
    assessRecDlpHeader: "🛡️ Data Loss Prevention (DLP) Matrix:",
    assessRecModulesHeader: "📦 Recommended Module Configuration:",
    assessRoiHeader: "Expected Business ROI & Impact:",
    assessRoiCostTitle: "Direct Cost Reduction",
    assessRoiCostDesc: "Replace expensive CASB licenses (Netskope/Zscaler) and eliminate VDI hardware refresh costs.",
    assessRoiPerfTitle: "Zero-Agent PC Lightening",
    assessRoiPerfDesc: "No heavy third-party endpoint agents required; eliminate PC lag and employee complaints.",
    assessRoiSecurityTitle: "Absolute Data Leakage Defense",
    assessRoiSecurityDesc: "Block GenAI prompt leaks, stop unapproved downloads, and prevent screen photography with dynamic watermarks.",
    assessApplyRecBtn: "🚀 Apply Recommended Policy to PoC",
    assessAppliedBanner: "✓ Recommended policy configuration applied successfully from security assessment.",
    geminiArchDetailsToggle: "View 3-Tier Security Architecture & CLI Commands",
    assessShowDetails: "Show Risk & Solution Details",
    assessHideDetails: "Hide Details",
  },
};

const ja: Messages = {
  mainTitle: "Secure Gateway Studio",
  productName: "管理者向けデプロイコンソール",
  localOnly: "ローカル実行",
  cloudIdentity: "Google Cloud",
  cloudProject: "未接続",
  workspaceIdentity: "Google Workspace",
  adminEmail: "未接続",
  help: "ヘルプ",
  signOut: "サインアウト / 初期化",
  signOutConfirm: "サインアウトしてセッションを初期化しますか？ローカルの認証トークンとキャッシュがクリアされ、初期状態（同意画面）に戻ります。",
  nav: {
    deployments: "デプロイ",
    newSetup: "新規セットアップ",
    policies: "ポリシー",
    evidence: "エビデンス",
    settings: "設定",
    guide: "ガイド",
    cepDeployer: "Easy PoC",
    easyPoc: "Easy PoC",
    sgwDeployer: "Secure Gateway Deployer",
  },
  title: "セキュア ゲートウェイの新規セットアップ",
  steps: ["モード", "ID", "環境", "証明書", "アクセス", "確認", "適用"],
  modeTitle: "1. Secure Gateway の迅速な PoC を開始",
  poc: "迅速なPoC",
  pocDescription:
    "明示的な安全ゲートと削除可能なリソースを使い、テストOUへ迅速に構築します。管理コンソール経由で管理対象ChromeへローカルCAを配布できます。",
  production: "本番",
  productionDescription:
    "エンタープライズPKI、リージョン高可用性、製品用途に限定した専用サービスID、監査可能な変更管理などの本番向け機能は、今後のリリースで提供予定です。",
  productionUnavailable: "今後対応",
  platformsTitle: "2. 管理対象 Chrome プラットフォーム",
  managedChromeOnly: "管理対象 Google Chrome のみ",
  platformNote:
    "このPoC期間中に実機テストできるプラットフォームだけを選択してください。選択した各プラットフォームが必須のT07 E2E受入ケースになります。他のブラウザは対象外です。",
  infrastructureTitle: "3. ネットワーク構成",
  dedicatedNetwork: "専用ネットワーク",
  recommended: "推奨",
  dedicatedDescription: "Secure Gateway サービス専用の新しいVPCを作成します。",
  existingVpc: "既存VPC",
  existingDescription: "管理している既存VPCへデプロイします。",
  certificateTitle: "4. 証明書方式",
  enterpriseCa: "エンタープライズPKI / CA Service",
  enterpriseCaDescription: "組織CAまたはCloud CA Serviceで内部TLS証明書を発行します。",
  publicCertificate: "公開信頼済み証明書",
  publicCertificateDescription:
    "登録可能な公開DNSホスト名と、Secret Manager内の一致する証明書バンドルが必要です。T03はVMのシステム公開信頼ルートだけでホスト名と証明書チェーンを検証するため、プライベートCA、自己署名、内部名の証明書は失敗します。",
  localPocCa: "ローカルPoC CA",
  disabledProduction: "本番では無効",
  localPocAdminConsole: "管理コンソールへのアップロードが必要",
  localPocCaDescription:
    "プライベートルート証明書とサーバー証明書を生成します。適用後に公開ルートをダウンロードし、Google管理コンソールでテストOUと対象プラットフォームへアップロードします。",
  posture: "デプロイ方針",
  mode: "モード",
  managedPlatforms: "管理対象 Chrome",
  platformCount: (count: number) => `${count} プラットフォーム`,
  infrastructure: "ネットワーク",
  certificateStrategy: "証明書方式",
  targetOu: "対象OU",
  testOuAvailable: "テスト用OUの確認",
  deploymentGates: "デプロイゲート",
  noExternalIps: "外部IPなし",
  cloudNat: "Cloud NAT",
  upstreamVpc: "既存Upstream VPC",
  privateDnsRoute: "Private DNS・ファイアウォール・戻り経路",
  applicationOwnedTls: "HTTPSアプリ所有のTLS",
  apiPreflight: "API事前確認",
  approval: "承認",
  required: "必須",
  willValidate: "適用時に検証",
  gateNote: "適用するには、すべてのゲートを通過する必要があります。",
  back: "戻る",
  continue: "ID設定へ進む",
  noChanges: "変更はまだ適用されていません",
  draftSaved: "下書きをローカル保存",
  lastSaved: "最終保存",
  justNow: "数秒前",
  languages: { english: "English", japanese: "日本語" },
  workflow: {
    identitiesTitle: "管理者IDを接続",
    identitiesIntro:
      "Google Cloud のリソース変更には、専用サービス アカウントのキーレス権限借用（Service Account Impersonation）を使用します。拡張機能は管理者 OAuth セッションを使用します。静的な JSON 秘密鍵ファイルは一切使用せず、安全にデプロイを実行します。",
    cloudAccount: "Google Cloud デプロイヤー",
    cloudAccountDescription: "GCP変更の検出、計画、承認後の適用に使用します。",
    workspaceAccount: "Workspace／Chrome管理者",
    workspaceAccountDescription:
      "拡張機能はログイン中の管理者OAuthセッションを使用し、ローカルアプリはWorkspace管理者権限を直接割り当てたIDを使用します。Chrome Policy、Directory読み取り、ライセンス管理の権限が必要です。",
    projectId: "Google Cloud プロジェクトID",
    operatorIdentity: "検証済み認証情報",
    adminIdentity: "検証済み管理者認証情報",
    connect: "接続を検証",
    connected: "接続済み",
    notConnected: "未接続",
    checking: "検証中…",
    connectionFailed: "検証に失敗しました",
    adcUnavailable:
      "キーレス Application Default Credentials がありません。「gcloud auth application-default login --impersonate-service-account=SERVICE_ACCOUNT_EMAIL」を実行し、再試行してください。",
    cloudValidationFailed:
      "Google Cloud の検証に失敗しました。プロジェクトIDと読み取り権限を確認してください。",
    workspaceValidationFailed:
      "Workspace の検証に失敗しました。顧客IDと Chrome Policy 管理者権限を確認してください。",
    workspaceRequiredRolesHint:
      "必要な Chrome Policy、OU、グループ／ユーザー読み取り、ライセンス管理の権限だけを割り当てます。Enterprise License Manager API には読み取り専用スコープがないため、CEP ライセンスの事前確認だけでもライセンス管理権限が必要です。Cloud Identity Policy API で Chrome DLP ルールを一覧・作成する操作には特権管理者が必要です。専用のテスト管理者とパイロット OU を使用してください。",
    specInvalid: "デプロイ設定に無効または不足している項目があります。",
    connectionNotice:
      "接続検証は読み取り専用です。適用権限は事前確認で別途検証します。",
    bootstrapDeployer: "SAと製品用途限定ロールを自動作成",
    bootstrapDeployerHint:
      "必要な最小ロール: サービス アカウント管理者 (roles/iam.serviceAccountAdmin)、ロール管理者 (roles/iam.roleAdmin)、プロジェクト IAM 管理者 (roles/resourcemanager.projectIamAdmin)、および対象の Access Context Manager ポリシーにおける Policy Editor 付与権限（またはプロジェクトのセキュリティ管理者／オーナー権限）。",
    bootstrapConfirm:
      "デプロイヤーSA、カスタムロール、プロジェクトIAM、Access Policy Editor、あなたのToken Creator権限を作成または更新します。続行しますか？",
    bootstrapLegacyMigrationConfirm:
      "Secure Gateway Studio 0.2.0互換の予約名を持つ、所有者ピンのないデプロイヤー候補が見つかりました。ローカル記録がない場合はユーザー管理キーが存在しないことも含め、SAの不変な数値ID、カスタムロールの完全な定義、SA／プロジェクトIAMの許可リストを監査し、一致した場合だけ移行しますか？差異があれば変更せず停止します。",
    bootstrapReplacementConfirm:
      "旧デプロイヤーは厳密な移行監査に一致せず、変更されていません。旧デプロイヤーを監査用にそのまま残し、別の予約名で新しい分離デプロイヤーSAとロールを作成しますか？",
    bootstrapDeletedDeployerConfirm:
      "このブラウザに不変IDで固定されたデプロイヤーはCloud上に存在しません。意図してCloudリソースを削除したことを確認してください。拡張機能は、対象SAが存在しないこと、カスタムロールが存在しないかGoogleの削除済み状態でSGSの完全な定義と一致すること、プロジェクトIAMとAccess Policy IAMに残存バインディングがないことを検証します。その後、旧数値IDを恒久的に廃止し、必要なら論理削除中のロールを安全に復元して、新しいデプロイヤーを作成します。続行しますか？",
    bootstrapWorking: "デプロイヤーを作成中…",
    bootstrapValidating: "IAM権限の反映を待機中…",
    bootstrapComplete: "デプロイヤーの自動構成が完了しました",
    bootstrapNext:
      "デプロイヤー用サービス アカウント、最小権限カスタムロール、および Access Policy 権限の構成が完了しました。以降の API 呼び出しは安全なキーレス認証経路を経由して実行されます。",
    bootstrapFailed: "デプロイヤーの自動準備に失敗しました",
    signInGoogle: "Google でサインイン",
    signingInGoogle: "Google の応答を待っています…",
    signInGoogleHint:
      "Google の同意画面を開きます。デプロイヤーを準備する前に、Chrome プロファイルごとに一度だけ必要です。",
    signInRequired:
      "この Chrome プロファイルはまだ Secure Gateway Studio を承認していません。Google でサインインして権限を付与してから、もう一度実行してください。",
    signInOperatorChanged:
      "サインイン中の Google アカウントが、このデプロイヤーに紐づく運用者と異なります。元のアカウントでサインインするか、置き換え用のデプロイヤーを作成してください。",
    progressTitle: "デプロイ進捗",
    progressCount: (completed: number, total: number) =>
      `${total}件中${completed}件を完了`,
    currentOperation: "現在の操作",
    failedOperation: "失敗した操作",
    failedOperations: "失敗した操作一覧",
    manualCleanupTitle: "手動削除が必要です",
    manualCleanupDescription:
      "本デプロイの自動ロールバックは利用できません。拡張機能のローカル状態をリセットする前に、以下の残存リソースを Google Cloud コンソールで確認し、手動で削除してください。",
    waitingForOperation: "最初の操作を待っています…",
    environmentTitle: "プライベート環境を設定",
    environmentIntro:
      "望ましい状態を定義します。変更前に既存リソースを検出します。",
    deploymentName: "デプロイ名",
    region: "リージョン",
    zone: "ゾーン",
    secondaryZone: "セカンダリゾーン（本番HA）",
    sourceImage: "不変のVMイメージ",
    sourceImageHint:
      "VMを使うすべての方式で、バージョン固定されたComputeイメージの完全なリソース名が必要です。イメージファミリーは使用できません。本番用イメージにはPython 3とNginxを事前導入してください。",
    sourceImageAutoHint:
      "PoCのサンプルVMでは、信頼済み事前確認がGoogle Debian 12を完全な不変イメージ名へ解決し、イメージの数値IDを検証してからこの欄へ設定します。別のイメージを使う場合は完全なリソース名を入力してください。",
    sampleImageResolving: "不変のPoCイメージを解決中…",
    sampleImageResolveFailed:
      "PoCサンプルVM用の不変なGoogle Debian 12イメージを取得できませんでした。",
    sampleImageConnectionRequired:
      "PoCサンプルVMのイメージを設定する前に、Google Cloud接続を検証してください。",
    sampleImageResolved: "不変のPoCイメージを設定しました",
    minimumReplicas: "Nginx最小レプリカ数",
    maximumReplicas: "Nginx最大レプリカ数",
    cpuTarget: "オートスケーリングCPU目標値（0.1～0.9）",
    autoscalingHint:
      "本番では2ゾーンのリージョンManaged Instance Groupを使用します。パススルー型ロードバランサの使用率はスケーリング指標にできないため、CPUで自動スケールします。",
    network: "デプロイ方式",
    vpcName: "既存VPC名",
    vpcSameProjectHint:
      "デプロイ先プロジェクトのVPCを読み取り専用で取得します。Shared VPCなど別プロジェクトの場合だけアップストリームプロジェクトを入力してください。",
    vpcOptionsFailed: "デプロイ先プロジェクトのVPC一覧を取得できませんでした。",
    subnetName: "既存サブネット名",
    upstreamVpcProjectId: "アップストリームVPCのプロジェクトID（任意）",
    upstreamVpcProjectIdHint:
      "VPCがデプロイ先プロジェクト内にある場合は空欄にします。Shared VPCなど別プロジェクトのVPCでは、選択したネットワークを所有するプロジェクトを入力します。検出とupstreamAccess IAMはそのプロジェクトだけを対象にします。",
    upstreamVpcCrossProjectPrerequisite:
      "クロスプロジェクトの前提条件: 検証または事前確認より前に、アップストリームプロジェクトの管理者が、デプロイ先プロジェクトのデプロイヤーSAにプロジェクトレベルのカスタムロールを手動で作成・付与する必要があります。権限は compute.networks.get、compute.networks.use、resourcemanager.projects.get、resourcemanager.projects.getIamPolicy、resourcemanager.projects.setIamPolicy の5つだけです。初回準備が構成するのはデプロイ先プロジェクトだけで、このクロスプロジェクトロール／付与は作成しません。デプロイ先プロジェクトで作成したプロジェクトカスタムロールをアップストリームプロジェクトへ付与することもできません。",
    managedSample: "管理対象サンプルバックエンド（Nginx）",
    managedSampleDescription:
      "検証とエビデンス収集用のプライベートHTTPバックエンドを作成します。",
    existingBackend: "既存HTTPバックエンド（Nginx）",
    existingBackendDescription:
      "既に確立済みのプライベート接続を使い、管理者が管理するHTTPエンドポイントへ転送します。",
    directHttps: "Option A — 既存HTTPSアプリへ直接接続",
    directHttpsDescription:
      "Secure Gatewayから既存HTTPSエンドポイントへVPC経由で直接接続します。Nginx、VM、NAT、オフロード証明書は作成しません。",
    internalHttpsLb:
      "Option B — Internal Application Load BalancerでHTTPSオフロード",
    internalHttpsLbDescription:
      "専用VPC内でRegional Internal Application Load BalancerがHTTPSを終端し、プライベートサンプルVMへHTTP転送します。専用VPC・サブネット・ILB・サンプルVMが自動作成されます。",
    configureSampleVm: "承認済みApplyでプライベートサンプルVMを作成",
    configureSampleVmDescription:
      "Option Bの安全なPoC既定値を設定します。VMは最終Applyの明示承認後だけ作成され、外部IPを持たず、削除対象としてrunに記録されます。",
    directSampleVmAction: "Option BのプライベートサンプルVMを使う",
    directSampleVmDescription:
      "Option Aには既存のプライベートHTTPSアプリが必要で、VMは作成しません。HTTPSテスト先がない場合はOption Bへ切り替え、承認済みApplyでプライベートサンプルVMを作成します。",
    managedSampleVmAction: "ApplyでプライベートサンプルVMを作成",
    managedSampleVmDescription:
      "管理対象サンプルでは、Option CのNginx層とプライベートHTTPバックエンドVMを最終承認済みApplyで作成します。",
    existingSampleVmDescription:
      "既存HTTP方式には到達可能なプライベートHTTPバックエンドが必要です。存在しない場合は管理対象サンプルへ切り替えると、承認済みApplyでバックエンドVMを作成します。",
    legacyNginxTitle: "Option C — 旧Nginx方式 / Legacy・詳細設定",
    legacyNginxDescription:
      "HTTPアプリ、または従来のNginxベース構成が必要な場合だけ展開します。",
    proxySubnetCidr: "ILB Proxy-onlyサブネットCIDR",
    backendUrl: "バックエンドURL（http://）",
    directHttpsUrl: "プライベートHTTPSエンドポイント（https://host[:port]）",
    applicationEgressRegion: "下り（外向き）リージョン（任意）",
    applicationEgressRegionHint:
      "Secure GatewayがVPCへ下りるGoogle Cloudリージョンを指定します。既定値はデプロイリージョンです。クロスリージョンの場合はターゲットVMのあるリージョンを指定してください。VPCがGlobal動的ルーティングの場合は空欄でも動作します。",
    backendLocation: "バックエンドのホスティング先",
    backendLocationGcp: "Google Cloud",
    backendLocationAws: "AWS",
    backendLocationAzure: "Azure",
    backendLocationOnPrem: "オンプレミス",
    confirmBackendConnectivity:
      "選択したGCP VPC/サブネットからのプライベートルーティング、DNS、バックエンドのファイアウォール許可が確立済みです",
    backendConnectivityHint:
      "本PoCではNginxを構成し、T02でアップストリームを検証します。AWS/Azure VPN、Cloud VPN、Interconnect、オンプレミス側ルートは作成しません。先にプライベート経路を確立し、公開エンドポイントや認証情報は入力しないでください。",
    cloudConsoleLinks: "Google Cloud & Workspace コンソール直リンク",
    openInCloudConsole: "コンソールで確認",
    computeInstancesLink: "Compute Engine VM インスタンス一覧",
    computeResourcesHint:
      "runに紐づくNginxおよび／またはサンプルバックエンドVM。正確な名前とプライベートアドレスはrunのリソース一覧で確認します。",
    securityGatewaysLink: "BeyondCorp Security Gateways",
    securityGatewayHint:
      "正確なGatewayリソース名とライブ状態はrunのリソース一覧で確認します。",
    vpcNetworksLink: "VPC ネットワーク & サブネット",
    cloudNatLink: "Cloud NAT",
    cloudNatHint:
      "プライベートVMを持つ専用VPC方式で作成します。既存VPCは検証済みのプライベート送信経路を提供する必要があります。",
    chromeAdminLink: "Chrome 管理ポリシー (Root Store)",
    architectureBlueprint: "アーキテクチャ設計図 & テレメトリ",
    directHttpsConnectivity:
      "選択したVPCでホスト名を解決でき、HTTPSアプリへの経路、136.124.16.0/20からのTCP許可、戻り経路が設定済みです",
    directHttpsConnectivityHint:
      "Secure GatewayはHTTPSアプリへ直接接続します。AWS・Azure・オンプレミスでは、先にCloud VPN/Interconnect、Cloud DNS転送ゾーン、ファイアウォール、136.124.16.0/20への明示的な戻り経路を設定します。",
    hostname: "プライベートアプリのホスト名",
    noExternalIpNotice:
      "このワークフローが作成するVMは外部IPを持ちません。プライベートVMを持つ専用VPC方式はCloud NATを作成し、既存VPCは検証済みのプライベート送信経路を提供する必要があります。内部HTTPS LB方式はNginxを作成しませんが、非公開サンプルバックエンドVMを作成します。",
    certificateStepTitle: "TLS証明書ソースを設定",
    certificateIntro:
      "オフロードVMは実行時にSecret Managerから証明書を読み取ります。秘密鍵は起動スクリプトに書き込まれません。",
    internalLbCertificateIntro:
      "Regional Internal Application Load Balancerがリージョンサーバー証明書でHTTPSを終端します。証明書データはメモリからCompute APIへ直接送信し、Secret Managerでライフサイクル管理します。",
    caPool: "CAプールのリソース名",
    caName: "発行CAのリソース名",
    secretName: "Secret Managerの証明書シークレット",
    certificateNotice:
      "ローカルCAはPoC専用です。適用後に公開ルート証明書（PEM）をダウンロードし、[Chrome] > [コネクタ] > [Chrome Root Store] へ追加して専用テストOUへ接続します。公開APIではこの引き渡しを確実に参照・実行できないため、T07で信頼を検証します。本番ではエンタープライズPKIまたは公開信頼済み証明書が必要です。",
    internalLbCertificateNotice:
      "ローカルCAではILBが生成済みサーバー証明書を提示します。Apply（適用）後に公開ルート証明書（PEM）を管理コンソールのChrome Root Store経由でテストOUへ配布し、Chrome再起動後にT07でHTTPS接続を検証します。秘密鍵はChromeへ配布しません。",
    directCertificateIntro:
      "HTTPSアプリ自身がTLS終端を行います。Secure Gatewayはアプリの証明書や秘密鍵を作成・保存しません。",
    directCertificateNotice:
      "公開信頼済み証明書ならRoot Store操作は不要です。プライベートCAの場合はアプリ管理者から発行元ルートPEMを入手し、[Chrome] > [コネクタ] > [Chrome Root Store] でテストOUへ手動配布します。この構成は公開APIで確実に参照・変更できません。",
    directPrivateCertificate: "アプリのプライベートCA / Chrome Root Store手動信頼",
    accessTitle: "Chromeポリシーとアプリへのアクセスを制限",
    accessIntro: "専用テストOUと最小限のプリンシパルから開始します。",
    customerId: "Workspace 顧客ID",
    targetOuId: "専用テストOU ID",
    managedChromeAccessLevel: "管理対象Chromeのアクセスレベル",
    managedChromeAccessLevelHint:
      "なし、または既存のAccess Context Managerリソース名全体を選択します。このセットアップはアクセスレベルを作成しません。Apply前に別途作成・確認してください。",
    managedChromeAccessLevelNone: "なし — アクセスレベルを要求しない",
    managedChromeAccessLevelNoneHint:
      "Access Context Manager条件は追加されません。アクセスは選択したIAMプリンシパルに引き続き限定されます。",
    optionsLoadedHint:
      "Google Cloudには製品用途限定デプロイヤー、Directoryデータには検証済みWorkspace管理者を使用し、選択肢を読み取り専用で取得します。",
    optionsLoading: "選択肢を取得中…",
    chooseOption: "選択してください",
    noOptions: "選択肢がありません",
    retryOptions: "再取得",
    ouOptionsFailed:
      "組織部門を取得できませんでした。Admin SDK APIと、検証済みWorkspace管理者の組織部門読み取り権限を確認してください。",
    accessLevelOptionsFailed:
      "アクセスレベルを取得できませんでした。対象のAccess Context ManagerポリシーでサービスアカウントにPolicy Editorを付与してください。このロールはCEPのAUTO_CREATEアクセスレベル作成・削除にも使用します。",
    groupOptionsFailed:
      "グループを取得できませんでした。検証済みWorkspace管理者ロールにグループ読み取り権限を追加してください。",
    prerequisitesTitle: "手動の前提条件確認",
    confirmEnterpriseLicense:
      "対象ユーザーにChrome Enterprise Premiumライセンスを割り当て済み",
    confirmWorkspaceServices:
      "対象ユーザーの追加のGoogleサービスとGoogle Cloudアクセスを有効化済み",
    confirmEndpointVerification:
      "このOUでEndpoint Verificationのデバイス信号収集を有効化済み",
    confirmTestOu: "非本番のテストOUであることを確認しました",
    principalType: "プリンシパル種別",
    principalValue: "プリンシパル",
    addPrincipal: "プリンシパルを追加",
    removePrincipal: "削除",
    user: "ユーザー",
    group: "グループ",
    domain: "ドメイン",
    accessNotice:
      "検証済みの管理対象Chromeアクセスレベルを条件にアプリへのアクセスを付与し、このOUにSecure GatewayとEndpoint Verificationを強制配布します。Chromeポリシーの継承により配下OUにも影響する場合があります。",
    reviewTitle: "検出結果と自動設定予定を確認",
    reviewIntro:
      "APIで確認できた状態、Applyで自動設定する項目、対応が必要な項目を分けて表示します。この画面ではまだ変更しません。",
    configuration: "構成",
    safetyGates: "安全ゲート",
    ready: "準備完了",
    incomplete: "未完了",
    verified: "検証済み",
    plannedOnApply: "Applyで自動設定",
    manualCheck: "手動確認",
    actionRequired: "要対応",
    approvalPending: "承認待ち",
    reviewGateLegend:
      "【検証済み】API検出や構成条件で確認完了 / 【Applyで自動設定】承認後に自動プロビジョニング / 【手動確認】管理者の確認が必要な項目 / 【要対応】適用をブロックする問題です。",
    gateLabels: {
      "immutable-image": "不変のVMイメージ",
      "billing-enabled": "Cloud Billing",
      "enterprise-license": "Chrome Enterprise Premiumライセンス",
      "chrome-root-store": "Chrome Root Store信頼配布",
      "workspace-services": "Workspaceサービス",
      "managed-chrome-profile": "管理対象Chromeプロファイル",
      "secure-enterprise-browser-client": "Secure Enterprise Browserクライアント",
      "endpoint-verification": "Endpoint Verification",
      "no-external-ips": "外部IPなし",
      "private-egress": "Cloud NAT",
      "backend-connectivity": "既存バックエンド接続",
      "test-ou": "対象OU",
      "cloud-identity": "Google Cloudデプロイヤー",
      "workspace-identity": "Workspace／Chrome管理者",
      "required-apis": "必須API",
      "apply-permissions": "Apply実行権限",
      "resource-conflicts": "既存リソース競合",
      "human-approval": "承認",
    },
    gateDescriptions: {
      "immutable-image": "VMを使う方式の承認・適用前に、Computeイメージの完全なリソース名と不変の数値IDを検証します。",
      "billing-enabled": "Cloud Billing APIでプロジェクトに有効な課金アカウントが紐付いているか確認します。",
      "enterprise-license": "Enterprise License Manager APIでChrome Enterprise Premiumの割り当て数を確認します。APIで確認できない場合のみ管理者確認を使用します。",
      "chrome-root-store": "Chrome Root Store構成、証明書アップロード、OUバインドは公開APIで確実に参照できません。Apply後にこの1回限りの管理コンソール操作を完了し、各プラットフォームのT07 HTTPSテストで信頼を検証します。",
      "workspace-services": "対象ユーザーのWorkspaceサービス設定は管理者による確認が必要です。",
      "managed-chrome-profile": "Chrome Management Profiles APIで対象OUの実プロファイルとポリシー同期報告を確認します。",
      "secure-enterprise-browser-client": "Chrome Management Profiles APIでクライアント拡張機能のインストール・有効状態を確認します。",
      "endpoint-verification": "Chrome Management Profiles APIで実クライアントを確認し、未報告の場合はApplyで対象OUへ強制インストールします。",
      "no-external-ips": "Applyが作成するすべてのVM／インスタンステンプレートは外部アクセス構成を持ちません。直接HTTPSはVMを作成せず、内部HTTPS LBはNginxではなく非公開サンプルバックエンドVMを作成します。",
      "private-egress": "プライベートVMを持つ専用VPC方式はCloud NATを作成します。プライベートVMを持つ既存VPC方式は検証済みのプライベート送信経路が必要です。パッケージ送信経路が不要なのは直接HTTPSだけです。",
      "backend-connectivity": "管理対象サンプルはデプロイVPC内に作成します。既存HTTPではプライベートルーティング、DNS、ファイアウォール許可を確認し、T02がNginxからの経路を検証します。直接HTTPSは個別確認済みの選択VPC経路、内部HTTPS LBはbackend healthを使用します。本PoCではクロスクラウドVPNやInterconnectを作成しません。",
      "test-ou": "選択したOUが非本番テスト用であることを確認済みです。",
      "cloud-identity": "Google Cloudデプロイヤーを読み取り専用で検証済みです。",
      "workspace-identity": "Workspace／Chrome管理者IDを読み取り専用で検証済みです。",
      "required-apis": "不足している許可済みAPIはApply中に自動で有効化します。",
      "apply-permissions": "計画した操作に必要な全権限がデプロイヤーにあるかAPIで確認します。",
      "resource-conflicts": "既存リソースが望ましい状態と互換性を持つか確認します。",
      "human-approval": "Apply前に、構成ハッシュへ紐付いたプランを管理者が承認します。",
    },
    managedProfileEvidence: (total, profileOnly, sync) =>
      `検出されたプロファイル数: ${total}件（プロファイル管理BYOD: ${profileOnly}件）、最終ポリシー同期: ${sync ?? "未同期"}`,
    clientExtensionEvidence: (name, version, installed) =>
      installed
        ? `Profiles APIで${name} ${version ?? ""}のインストール済み・有効を確認しました。`
        : `${name}のインストール済み・有効報告はまだありません。`,
    missingPermissions: (count: number) =>
      `デプロイヤーに必要な権限が${count}件不足しています。`,
    approvePlan: "デプロイ実行計画（プラン）を承認",
    approvePlanDescription:
      "承認は構成ハッシュに紐付き、設定を変更すると無効になります。",
    generatePlan: "事前確認を実行してプランを生成",
    runPreflight: "信頼済み事前確認を実行",
    preparingPlan: "リソースの現状を検出し、実行計画を生成しています…",
    planReady: "サーバー検証済みプランを生成しました",
    planBlocked: "プランにブロッキングゲートがあります",
    changesCount: (count: number) => `承認が必要な実変更 ${count} 件`,
    preflightProgressTitle: "事前確認・リソース検出の進捗",
    preflightStage1: "1/5: Service Usage & IAM 権限の検証中...",
    preflightStage2: "2/5: Cloud Billing & プロジェクト関連付けの検証中...",
    preflightStage3: "3/5: BeyondCorp Security Gateway & VPC リソースの検出中...",
    preflightStage4: "4/5: Chrome Management & テスト OU ポリシーの照合中...",
    preflightStage5: "5/5: 差分計画の構築 & セーフティゲートの判定中...",
    preflightComplete: "すべての事前確認とセーフティゲートの検証が完了しました",
    plannedChangesTitle: "承認対象の変更内容（実行計画）",
    plannedChangesIntro:
      "作成・更新する項目だけを表示します。再利用または変更なしのリソースは更新しません。",
    changeAction: (action) =>
      ({ create: "新規作成", update: "更新" })[action] ?? action,
    changeRisk: (risk) =>
      ({ low: "低リスク", medium: "中リスク", high: "高リスク", blocking: "ブロック" })[
        risk
      ] ?? risk,
    changeSummary: (resourceType, fallback) =>
      resourceType === "service_discovery_proxy"
        ? "対象テストOUで継承中の旧PACを［ユーザーによる設定を許可］で上書きし、PACファイルなしのService Discoveryルーティングへ切り替えます。"
        : fallback,
    diagnosticsTitle: "検出した状態",
    apiEvidence: "API検出値",
    diagnosticMessage: (code, fallback) =>
      code === "legacy-pac-policy-detected"
        ? "親OUから継承した旧PACポリシーが、このテストOUでまだ有効です。"
        : code === "chrome-extension-group-policy-conflict"
          ? "Chromeのグループポリシーが、対象OUのSecure Enterprise Browser設定を上書きしています。"
        : fallback,
    diagnosticRemediation: (code, fallback) =>
      code === "legacy-pac-policy-detected"
        ? "PACに定義されていないホスト名はDIRECT（直接接続）となり、通常DNSで名前解決できずに ERR_NAME_NOT_RESOLVED が発生します。Applyでは選択したテストOUだけを上書きし、親OUと既存PACファイルは変更しません。"
        : code === "chrome-extension-group-policy-conflict"
          ? "表示されたグループの［アプリと拡張機能］を確認し、空または不整合な管理対象設定を削除するか、テストOUと同じSecure Gateway設定にします。グループ変更は全メンバーへ影響するため、自動適用せずブロックします。"
        : fallback ?? "",
    approveWorking: "承認を紐付けています…",
    approvalReady: "実行計画を承認済み",
    continueToApply: "適用へ進む",
    applyTitle: "チェックポイントとエビデンス付きで適用",
    applyIntro:
      "依存関係に従って順番に変更を適用します。途中で失敗した場合は即座に停止し、本デプロイで作成されたリソースのみを安全にロールバックします。",
    preflight: "事前確認",
    desiredStatePlan: "望ましい状態プラン",
    applyChanges: "承認済み変更を適用",
    applyLocked: "事前確認と承認を完了すると適用できます",
    applying: "承認済み変更を適用しています…",
    runSucceeded: "デプロイに成功しました",
    runRollingBack: "適用された変更をロールバック中…",
    runRollbackUnavailable:
      "適用に失敗しましたが自動ロールバックは利用できません。GCP上にリソースが残存している可能性があります。",
    runRollbackFailed:
      "適用に失敗し、所有する変更の一部をロールバックできませんでした。GCPを手動変更する前に、下の失敗した操作とエラーを確認してください。",
    runRolledBack: "デプロイに失敗し、所有する変更をロールバックしました",
    runFinalized: "処理は完了しています",
    noActiveOperation: "現在実行中の操作はありません",
    finalizedOperationCount: (count: number) =>
      `処理完了（${count} 件の操作を記録）`,
    runInterrupted:
      "適用中に実行ワーカーまたはローカルサービスが停止しました。再開すると、永続化済みチェックポイントと実リソースを安全に照合してから処理を続行します。",
    resumeRun: "中断した適用を再開",
    resumingRun: "照合して再開しています…",
    retryRollback: "失敗したロールバックを再試行",
    retryingRollback: "残存リソースを照合してロールバックを再試行しています…",
    runFailed: "オペレーターによる確認が必要です",
    operationCount: (count: number) => `${count} 件の操作を記録`,
    evidenceNotice:
      "すべての操作について、監査イベント、マスク済みリクエスト情報、結果、所有権を記録します。",
    caHandoffTitle: "管理対象Chromeの信頼設定を完了",
    caHandoffDescription:
      "Chrome Root Store構成、証明書アップロード、OUバインドは公開APIで確実に参照・実行できません。E2Eテスト前に、この1回限りの管理コンソール引き渡しを完了してください。",
    caHandoffSteps: [
      "下から公開PoCルート証明書をダウンロードします。秘密鍵は含まれません。",
      "Google管理コンソールで [すべてのブラウザとデバイス] を開き、[Chrome] > [コネクタ] > [新しいプロバイダの設定] > [Chrome Root Store] と進みます。PEMを [ルート] 証明書として追加し、構成を追加します。",
      "専用テストOUを選択し、[証明書コネクタ] > [Chrome Root Store] で新しい構成を選んで保存します。Chromeを再起動し、chrome://certificate-manager > [ローカル証明書] で確認します。",
    ],
    downloadRootCa: "公開ルートCAをダウンロード",
    downloadingRootCa: "ダウンロードを準備中…",
    openAdminConsoleGuide: "GoogleのCA設定ガイドを開く",
    caDownloadFailed:
      "ルートCAをダウンロードできませんでした。適用が成功していることを確認して再試行してください。",
    connectionHandoffTitle: "接続確認とトラブルシューティング",
    testUrlLabel: "プライベート Web アプリ URL",
    sebTroubleshootingHint:
      "Chrome で NXDOMAIN が表示される、または接続できない場合、初期同期のタイミングによって Secure Enterprise Browser（SEB）拡張機能が 2 時間の更新待機（バックオフ）に入っている可能性があります。管理対象 Chrome プロファイルから一度サインアウトして再サインインする（または chrome://extensions で SEB 拡張機能を再読み込みする）ことで、即座に最新ルートを取得できます。",
    previous: "戻る",
    next: "続行",
  },
  operations: {
    deploymentsTitle: "デプロイ実行履歴",
    deploymentsIntro:
      "サーバーに記録された適用処理と、その最終状態を確認します。",
    evidenceTitle: "監査証跡",
    evidenceIntro:
      "ローカルのハッシュチェーンを検証し、持ち運び可能なJSON証跡を出力します。",
    loading: "記録済みの状態を読み込み中…",
    loadFailed: "実行APIから記録済みの状態を読み込めませんでした。",
    noRuns: "デプロイ実行履歴はまだありません。",
    noEvents: "監査イベントはまだありません。",
    runId: "実行ID",
    status: "状態",
    started: "開始日時",
    operationsCount: "操作数",
    manage: "管理",
    close: "閉じる",
    overviewTab: "概要",
    logsTab: "ログ",
    resourcesTab: "リソース",
    deleteTab: "復元・削除",
    deploymentName: "デプロイ",
    project: "プロジェクト",
    gateway: "Secure Gateway",
    application: "Application route",
    architecture: "アーキテクチャ",
    ownershipRun: "リソース所有権を記録した実行",
    architectureLabel: (kind) =>
      ({
        managed_sample: "Nginx HTTPオフロード・管理サンプル",
        existing_http: "Nginx HTTPオフロード・既存バックエンド",
        direct_https: "プライベートHTTPS直接接続",
        internal_https_lb: "Internal Application Load Balancer HTTPSオフロード",
      })[kind] ?? kind,
    accessLevelControlTitle: "アクセス制御・アクセスレベル設定",
    accessLevelControlIntro:
      "BeyondCorp Application の IAM ポリシーにバインドされている Access Context Manager のアクセスレベル条件や許可プリンシパルを即時更新します。",
    selectAccessLevelLabel: "適用するアクセスレベル",
    principalsLabel: "許可するプリンシパル（ユーザー / グループ / ドメイン）",
    principalsHelper: "カンマ区切りで指定（例: user:admin@test-domain.dev, domain:test-domain.dev）",
    noAccessLevelRequired: "（アクセスレベル制限なし・認証済みグループ全ユーザー）",
    boundGroup: "対象 IAM グループ",
    updateAccessLevelButton: "アクセスレベルを即時更新",
    updatingAccessLevel: "IAMポリシーを更新中...",
    accessLevelSaved: "アクセスレベルを更新し、暗号化ハッシュチェーンに記録しました",
    ownedResources: "このデプロイが所有するリソース",
    restoredResources: "変更前の状態へ復元する共有ポリシー",
    retainedResources: "保持する共有・再利用リソース",
    resourceAction: (action) =>
      ({
        delete: "削除",
        delete_if_empty: "Applicationが残っていない場合だけ削除",
        restore: "正確な変更前状態へ復元",
        retain: "保持",
      })[action] ?? action,
    logsTitle: "Secure Gatewayログ",
    logsIntro:
      "Cloud Loggingからアクセス判定、Gateway接続、管理操作、収集済みNginxログを取得します。",
    logCategory: (category) =>
      ({
        access: "アクセス判定",
        connection: "接続",
        admin: "管理操作",
        nginx: "Nginxリクエスト",
      })[category] ?? category,
    hours24: "過去24時間",
    hours168: "過去7日間",
    refreshLogs: "ログを更新",
    refreshingLogs: "Cloud Loggingを照会中…",
    noLogs: "指定期間に一致するログはまだ記録されていません。管理対象Chromeブラウザからアクセスすると順次表示されます。",
    logQueryFailed:
      "Cloud Logging または現在の Secure Gateway ログ設定を検証できません。デプロイヤーが Gateway の読み取りとログ一覧取得を行えることを確認して再試行してください。Gateway の状態が不正な場合、ログ照会は送信しません。",
    dataAccessNotice:
      "アクセス判定ログにはBeyondCorp Enterprise APIのData Access Audit Logsが必要です。",
    gatewayLoggingEnabled:
      "このデプロイ先プロジェクトでは Secure Gateway の接続ログが有効です。",
    gatewayLoggingDisabled:
      "Secure Gateway の接続ログが無効です。接続ログは生成されないため、この画面を証跡として使う前に Google Cloud で Gateway を確認してください。",
    nginxNotice:
      "NginxログにはGoogle Cloud Ops Agentによるsgstudio-access.logの収集が必要です。",
    principal: "プリンシパル",
    method: "メソッド",
    requestId: "リクエストID",
    callerIp: "発信元IP",
    payload: "サニタイズ済みペイロード",
    specInvalid: "デプロイ設定に無効または不足している項目があります。",
    teardownTitle: "このデプロイを削除",
    teardownIntro:
      "記録済みの共有ポリシーを変更前状態へ復元し、成功した Apply が所有するリソースだけを依存関係の逆順で削除します。",
    teardownSharedNotice:
      "共有 IAM／Chrome Policy は、正確な変更前状態を記録し、現在値がこのrunの記録済みmanaged-after状態と一致する場合だけ復元します。送信結果が不明な変更や後発ドリフトは保持し、手動で照合します。既存 VPC、Access Level、Project API、その他の共有・再利用リソースは保持します。この実行が作成した Gateway も、Application が残っていない場合だけ削除します。",
    teardownUnavailable: "安全に削除できる所有リソースがこの実行にはありません。",
    teardownConfirmation: "確認フレーズの入力",
    teardownConfirmationHint: "上記の確認フレーズをそのまま入力",
    startTeardown: "実行の変更を復元・削除",
    teardownRunning: "実行の変更を復元・削除中…",
    teardownSucceeded: "削除完了",
    teardownInterrupted:
      "削除中に実行ワーカーまたはローカルサービスが停止しました。再開すると、永続化済みチェックポイントを照合してから処理を続行します。",
    teardownFailed: "削除を停止しました。確認が必要です",
    resumeTeardown: "中断した削除を再開",
    resumingTeardown: "照合して再開しています…",
    teardownActionFailed: "削除処理を開始または更新できませんでした。",
    teardownProgress: (completed, total) => `${total}件中${completed}件の操作が完了`,
    exportEvidence: "証跡を出力",
    integrityValid: "監査チェーン検証済み",
    integrityInvalid: "監査チェーンの検証に失敗",
    eventCount: (count: number) => `${count}件の連結イベント`,
    chainHead: "チェーン先頭 SHA-256",
    recentEvents: "最近の監査イベント",
    notAvailable: "利用できません",
    acceptanceTitle: "受入検証・テスト",
    acceptanceIntro:
      "T01〜T05の自動システム検証を実行し、管理対象Chrome（T06〜T09）のテスト結果と監査ログ証跡を記録・管理します。",
    noSuccessfulRun: "受入テストを開始するには、成功したデプロイ実行が必要です。",
    runSystemChecks: "T01〜T05を検証",
    runningSystemChecks: "Google Cloudリソースを検証しています…",
    acceptanceComplete: "PoC受入を完了",
    acceptancePending: "受入証跡が未完了",
    requiredProgress: (satisfied, required) =>
      `必須ケース ${required}件中 ${satisfied}件を充足`,
    acceptanceTest: (testId) =>
      ({
        T01: "HTTPバックエンド応答",
        T02: "オフロードからバックエンドへの応答",
        T03: "TLS終端",
        T04: "プライベートDNS",
        T05: "Secure Gatewayマッチャー",
        T06: "既存の直接HTTPS制御アプリ",
        T07: "管理対象ChromeのE2E",
        T08: "ログ相関",
        T09: "未承認・非管理端末の拒否",
      })[testId] ?? testId,
    acceptanceScope: (caseKey) =>
      ({
        default: "デプロイ全体",
        macos: "macOS",
        windows: "Windows",
        linux: "Linux",
        chromeos: "ChromeOS",
        unauthorized_principal: "未承認プリンシパル",
        unmanaged_browser: "非管理ブラウザ",
      })[caseKey] ?? caseKey,
    acceptanceStatus: (status) =>
      ({
        passed: "合格",
        failed: "不合格",
        user_confirmed: "オペレーター確認済み",
        skipped: "スキップ",
        missing: "未記録",
      })[status] ?? status,
    evidenceSource: (source) =>
      source === "system" || source === "system_verified" ? "システム検証" : "オペレーター証跡",
    missingEvidence: "証跡は未記録です",
    viewEvidence: "マスク済み証跡を表示",
    operatorEvidenceTitle: "エンドポイント証跡を記録",
    operatorEvidenceIntro:
      "マスク済みの観測結果または成果物のハッシュだけを保存してください。トークン、Cookie、秘密鍵、認証情報は入力しないでください。",
    testCase: "テスト項目",
    testInstruction: (testId, caseKey) =>
      testId === "T06"
        ? "同じ管理対象仕事用プロファイルで既存のHTTPS Secure Gatewayコントロールアプリを開きます（例: https://demo-server1.internal/）。証明書警告なしで開いた場合だけ合格として記録します。既存の制御アプリがない新規PoCでは、その理由を付けて［スキップ］を記録できます。本番では引き続き合格が必須です。"
        : testId === "T07"
          ? `${caseKey}の許可済み管理対象Chromeプロファイルで、新しくデプロイしたプライベートHTTPSアプリを開き、表示結果と時刻を記録します。`
          : testId === "T08"
            ? "マスク済みリクエスト識別子と時刻を使い、Gateway・オフロード・バックエンドのイベントを相関します。"
            : testId === "T09"
              ? "選択した未承認ケースが拒否され、バックエンドへ成功リクエストが届いていないことを確認します。"
              : "この受入ケースで観測した結果を記録します。",
    evidenceOutcome: "観測結果",
    outcomePassed: "合格",
    outcomeFailed: "不合格",
    outcomeSkipped: "スキップ",
    evidenceSummary: "結果の概要",
    evidenceDetail: "マスク済み証跡または成果物のSHA-256",
    recordEvidence: "確認結果を記録",
    recordingEvidence: "記録中…",
    evidenceRecorded: "受入証跡を記録しました。",
    acceptanceActionFailed:
      "受入操作に失敗しました。実行APIと認証情報を確認してください。",
    statusSucceeded: "適用完了",
    statusDeleted: "撤去完了",
    statusRunning: "実行中",
    statusPending: "待機中",
    statusFailed: "エラー",
    t07DiagnosticsTitle: "管理対象Chromeクライアント診断",
    t07DiagnosticsIntro:
      "T07受入テストを記録する前に、ブラウザで発生した事象を診断・切り分けます。エラー内容に応じて、ルーティング、IAM認可、証明書信頼のどの設定に問題があるかを特定できます。",
    t07Diagnostics: [
      {
        symptom: "ERR_NAME_NOT_RESOLVED",
        meaning:
          "プライベートホスト名が捕捉されていません。管理対象拡張機能が未有効、または親OUから継承した旧PACがこのプロファイルを制御してService Discoveryのルートを読み込めない状態が考えられます。",
        actions: [
          "このアプリで事前確認を実行し、旧PACが検出された場合は対象テストOUだけの上書き内容を承認前に確認します。",
          "同じChrome仕事用プロファイルでSecure Enterprise Browserが管理者によるインストール済みかつ最近同期済みであることを確認します。",
          "PACが有効でなければ、Gatewayルート、Service Discovery IAM、アプリ利用IAMを確認します。",
        ],
      },
      {
        symptom: "Access Denied（403）",
        meaning:
          "Service DiscoveryはSecure Gatewayへ到達しましたが、プリンシパルまたはAccess Context Manager条件を満たしていません。",
        actions: [
          "同じ仕事用プロファイルでEndpoint Verificationを開き、必要なら会社アカウントを追加して［今すぐ同期］を実行します。",
          "ユーザーまたはグループにGatewayのService Discovery権限とアプリ利用権限の両方があることを確認します。",
          "BYODテストでは選択したAccess LevelがPROFILE_MANAGED Chromeを許可していることを確認します。",
        ],
      },
      {
        symptom: "NET::ERR_CERT_AUTHORITY_INVALID（証明書エラー）",
        meaning:
          "Secure GatewayのルーティングとTLSオフロードは動作していますが、この端末がPoCルートCAを信頼していません。",
        actions: [
          "Apply画面から生成済みPoCルート証明書をダウンロードします。",
          "管理コンソールの [Chrome] > [コネクタ] > [Chrome Root Store] でPEMを追加し、その構成を専用テストOUへ接続してからChromeを再起動します。",
          "信頼前に証明書フィンガープリントを照合し、プライベートHTTPS URLを再試験します。",
        ],
      },
    ],
  },
  guide: {
    eyebrow: "新規セットアップガイド",
    title: "各セットアップ手順で実行すること",
    intro:
      "ウィザードは少数のPoC設定から現在の状態を検出し、確認・承認可能なSecure Gatewayデプロイを作成します。最後の「適用」より前に変更するのは、初回準備で明示的に確認したデプロイヤーSA、カスタムロール、IAMバインディングだけです。検出とその他の設定手順は読み取り専用です。",
    pocNoticeTitle: "Secure Gateway の PoC を最短で実施するためのツール",
    pocNoticeBody:
      "本番モードは将来対応を示すために表示していますが、このリリースでは無効です。非本番専用OUとテスト用プリンシパルを使用し、本番トラフィックはこの手順へ流さないでください。",
    quickOverviewTitle: "クイック概要 & 基本アーキテクチャ",
    quickOverviewIntro:
      "3つのデプロイアーキテクチャと7つのセットアップステップの概要です。",
    technicalDeepDiveTitle: "ステップ別の技術詳細と Google REST API 連携",
    technicalDeepDiveIntro:
      "各ステップで内部的に行われる処理、オプションごとの挙動、および呼び出される Google Cloud / Workspace REST API の詳細解説です。",
    technicalEyebrow: "技術リファレンスと API コール",
    checklistLabel: "チェックリストと実行内容",
    optionsBehaviorLabel: "オプションの挙動と動作ロジック",
    apiCallsLabel: "主な Google REST API コール",
    safetyGuardrailLabel: "安全制御とロールバック保護",
    architectureTitle: "独立した3つのデプロイアーキテクチャ",
    architectureIntro:
      "アプリごとに1方式を選択します。Option A/Bを主要PoC方式とし、従来のNginx方式はOption CとしてLegacy／詳細設定に残します。",
    extensionArchitectureTitle: "拡張機能で対応するデプロイアーキテクチャ",
    extensionArchitectureIntro:
      "PoCアプリごとに、直接HTTPS、リージョン内部HTTPSロードバランサー、または旧Nginx方式を選択できます。",
    extensionArchitectureNote:
      "Chrome拡張機能は3方式すべてを計画・適用します。Option BのプライベートサンプルVMは、最終承認済みApplyでのみ作成します。",
    costOverviewTitle: "コスト要因（デプロイ前に最新料金を確認）",
    costOverviewIntro:
      "料金はリージョン、使用量、選択リソース、Chrome Enterprise Premium契約によって変わります。以下は見積もりではなく、課金対象になり得るリソースの一覧です。適用前にGoogle Cloudの最新料金ページまたは料金計算ツールとCEP契約を確認してください。",
    costTag: "最新料金を要確認",
    fixedCostLabel: "作成リソース",
    variableCostLabel: "従量要因",
    architectures: [
      {
        eyebrow: "Option A · 既存HTTPSへ直接接続",
        title: "Secure Gateway + 既存プライベートHTTPSアプリ",
        summary:
          "アプリが既にHTTPSを提供する場合に使います。Secure Gatewayが選択VPC経由で直接ルーティングし、Nginx、VM、NAT、オフロード証明書は作成しません。",
        estimatedCost: "月額概算: 新規インフラ USD 0",
        costFixed: "新しいVM、ロードバランサー、Cloud NAT、オフロード証明書、管理対象DNSレコードは作成しません。既存アプリと限定公開DNSはオペレーター管理のままです。",
        costVariable: "既存DNS、ネットワークデータ転送、アプリ側のインフラ料金。",
        nodes: [
          { label: "管理対象Chrome", detail: "ユーザーID + 端末/プロファイル情報", costBadge: "CEPライセンスが必要" },
          { label: "Secure Gateway", detail: "hostname:port matcher + アクセスポリシー", costBadge: "CEP契約を確認" },
          { label: "Upstream VPC", detail: "委任SAにupstreamAccessを付与", costBadge: "ネットワーク利用を課金" },
          { label: "HTTPSアプリ", detail: "既存証明書でアプリ自身がTLS終端", costBadge: "既存インフラ" },
        ],
        supports: [
          { label: "DNS解決", detail: "Cloud DNS限定公開ゾーンまたは転送ゾーン" },
          { label: "ネットワーク制御", detail: "136.124.16.0/20からTCP許可 + 戻り経路" },
          { label: "リージョン経路", detail: "任意egress region、またはregional LBのGlobal Access" },
        ],
      },
      {
        eyebrow: "Option B · ILB HTTPSオフロード",
        title: "Secure Gateway + 内部HTTPSロードバランサー + 非公開サンプルVM",
        summary:
          "承認済みrunがRegional Internal Application Load Balancerとrun所有の非公開サンプルバックエンドVM 1台を作成します。ILBがサーバー証明書を提示し、復号後のHTTPをそのVMのTCP 80へ転送します。既存HTTPエンドポイントは指定できず、Nginxは作成しません。",
        estimatedCost: "月額概算: 約 USD 80～90",
        costFixed: "asia-northeast1で720時間・軽負荷を想定。ILBの最小3プロキシが約USD 54/月で、e2-small VM 1台、20GBディスク、Cloud DNS、専用VPCのCloud NATを加えた概算です。",
        costVariable: "Chrome Enterprise Premium／Secure Gatewayの契約料金と税は含みません。通信量、ログ、イメージライセンス、為替、リージョンで変動します。検証後にrunを削除すると時間課金を止められます。",
        nodes: [
          { label: "管理対象Chrome", detail: "Chrome Root Storeから発行元Root CAを信頼", costBadge: "CEPライセンスが必要" },
          { label: "Secure Gateway", detail: "ID・コンテキスト・hostname:443ポリシー", costBadge: "CEP契約を確認" },
          { label: "Regional Internal Application LB", detail: "リージョンサーバー証明書でHTTPS終端", costBadge: "リージョン・使用量で課金" },
          { label: "HTTPバックエンド", detail: "run所有の非公開サンプルVM（TCP 80）。既存endpointは指定不可", costBadge: "Compute・ディスク課金" },
        ],
        supports: [
          { label: "Proxy-onlyサブネット", detail: "Google管理Envoy専用のREGIONAL_MANAGED_PROXYサブネット" },
          { label: "TLS所有", detail: "Enterprise CA、ローカルPoC CA、または検証済み既存Secret" },
          { label: "Chrome信頼", detail: "公開Root PEMをダウンロードしてChrome Root StoreからテストOUへ接続" },
          { label: "管理型L7経路", detail: "HTTP health check、backend service、URL map、target HTTPS proxy、内部forwarding rule" },
          { label: "プライベートegress", detail: "専用VPCはRouter/NATを作成。既存VPCは検証済みegressが必要" },
          { label: "安全なライフサイクル", detail: "検出、競合判定、逆順ロールバック、所有範囲限定削除、専用の変更実行ID" },
        ],
      },
      {
        eyebrow: "Option C · 旧Nginx方式 / Legacy・詳細設定",
        title: "Secure Gateway + Nginx + HTTPアプリ",
        summary:
          "HTTPしか提供しないプライベートアプリ、または従来のNginx構成が必要な場合だけ使用します。PoCは非公開Nginx VM 1台を使い、実装済みスケール対応方式は内部パススルーNetwork Load Balancerと2ゾーンNginx MIGを使用します（Production選択は無効）。",
        estimatedCost: "月額概算: 約 USD 45～60",
        costFixed: "Nginx方式ではCompute Engineインスタンス、ディスク、Cloud DNS、Cloud NATを作成します。ローカルバックエンドのスケール対応方式ではパススルーロードバランサーも追加します。",
        costVariable: "VM稼働時間、ネットワーク転送、NAT処理と割当IP、DNSクエリ、オートスケールしたレプリカ数。",
        nodes: [
          { label: "管理対象Chrome", detail: "ユーザーID + 端末/プロファイル情報", costBadge: "CEPライセンスが必要" },
          { label: "Secure Gateway", detail: "Service Discovery + アクセスポリシー", costBadge: "CEP契約を確認" },
          { label: "Nginxオフロード層", detail: "PoC: 非公開VM 1台 · スケール対応: パススルーILB + 2ゾーンMIG", costBadge: "Compute・ネットワーク課金" },
          { label: "HTTPアプリ", detail: "GCP・AWS・Azure・オンプレミス", costBadge: "既存インフラ" },
        ],
        supports: [
          { label: "CPUオートスケール", detail: "スケール対応の既定2～20台・CPU 60%。最小、最大、CPU目標を設定可能" },
          { label: "Healthy台数ゲート", detail: "設定した最小レプリカ数がHealthyになるまでApplyが待機" },
          { label: "2ゾーン冗長化", detail: "Regional MIGがNginxレプリカを2つのゾーンへ分散" },
          { label: "Private DNS", detail: "アプリ名をNginx内部IPへ解決" },
          { label: "TLS証明書", detail: "CA Service・ローカルCA・既存SecretをNginxで利用" },
          { label: "プライベート経路", detail: "GCP外ではVPN/Interconnectとbackend firewall" },
          { label: "検出 + 競合判定", detail: "変更前にMIGとAutoscalerの既存状態・互換性を検出" },
          { label: "ロールバック", detail: "所有するMIG/Autoscaler変更をデプロイ失敗時に巻き戻し" },
          { label: "製品用途限定IAM", detail: "共通ロールは対応全パスを含み、事前確認では選択したパスの必須権限を検証" },
        ],
      },
    ],
    implementationTitle: "実装済み機能の全体像",
    implementationIntro:
      "現在のコードベースに実装されている技術要素を列挙しています。「スケール対応」はバックエンドに実装済みですが、Productionが無効な間は選択できず、PoCで作成済みのリソースとしては表示しません。",
    implementationEyebrow: "実装機能一覧",
    implementationGroups: [
      {
        eyebrow: "データプレーン",
        title: "HTTPオフロードと直接HTTPS",
        items: [
          "Nginx HTTPオフロード方式は、管理対象サンプルまたはGCP・AWS・Azure・オンプレミスの既存プライベートHTTPアプリに対応します。別方式のILB HTTPSオフロードは、run所有の非公開サンプルバックエンドVMだけに対応します。",
          "拡張機能のILB HTTPSオフロード方式は、非公開サンプルVMとunmanaged instance group、REGIONAL_MANAGED_PROXYサブネット、HTTP health check、INTERNAL_MANAGED backend service、regional URL map/サーバー証明書/target HTTPS proxy、内部forwarding rule、Private DNSを作り、NginxオフロードVMを作成しません。",
          "直接HTTPSは既存VPC経由の正確なhostname:portルートを作り、Nginx、オフロードTLS、NAT、管理Aレコードを作成しません。",
          "専用/既存VPC、VM外部IPなし、Private DNS、Secure Gateway送信元136.124.16.0/20のFWをモデル化しています。専用VPCでは作成VM用Cloud Router/NATを追加し、既存VPCではプライベートegress確認ゲートを必須にします。",
          "GCP外へのVPN/Interconnect、DNS転送、backend firewall、戻り経路は作成せず、明示的な事前条件として利用します。",
        ],
      },
      {
        eyebrow: "スケール対応HTTP層",
        title: "Regional Nginxの可用性とオートスケール",
        items: [
          "2ゾーンRegional Nginx MIG、内部パススルーNetwork Load Balancer、リージョンTLSヘルスチェック、ヘルスチェック用FWをスケール対応方式に実装し、TLS終端はNginxに残します。",
          "CPUオートスケールは既定2～20台・CPU 60%。最小、最大、CPU目標を日本語/英語UIから設定できます。",
          "設定した最小レプリカ数がHealthyになるまでデプロイを待機します。",
          "MIG/Autoscalerの検出、互換性・競合判定、所有範囲限定の逆順ロールバック、必須IAM権限確認を実装しています。",
        ],
      },
      {
        eyebrow: "Google制御プレーン",
        title: "CloudとChrome APIの自動化",
        items: [
          "選択方式に応じ、Service Usage、IAM、Compute、Cloud DNS、Secret Manager、CA Service、BeyondCorp、Access Context Manager、Chrome Policy/Management、Licensing、Billingを検出・操作します。",
          "ヘルパーがキーレスデプロイヤーSA、製品の全対応パス用カスタムロールとバインディングを準備し、Applyが不足する許可済みAPIを自動有効化します。",
          "Secure Gateway、Service Discovery利用IAM、委任SAのupstreamAccess、application matcher、application IAM、任意Access Level条件をPlan/Applyします。",
          "テストOUへSecure Enterprise BrowserとEndpoint Verificationを強制インストールし、Gateway routeと継承PAC overrideを設定します。OU、グループ、Access LevelはAPIから取得します。",
        ],
      },
      {
        eyebrow: "TLSとID",
        title: "証明書と管理対象Chromeアクセス",
        items: [
          "HTTPオフロードはEnterprise CA、検証済み公開証明書Secret、公開ルートPEMを出力するローカルPoC CAに対応します。",
          "秘密鍵は専用accessor identity付きSecret Managerに保持します。所有するオフロードSecretは更新用のactive aliasを管理し、承認した公開証明書入力は数値SecretVersionとダイジェストへ固定します。更新期限確認、offload refresh、失敗時補償も実装しています。",
          "Chrome Root StoreへのアップロードとOU接続は、公開APIで直接更新できないため管理コンソールでの手動登録手順として案内します。",
          "選択したAccess Context Managerレベルでプロファイル管理BYOD Chromeとブラウザ管理Chromeを表現でき、プロファイル・クライアント・Endpoint Verificationの報告状態を個別表示します。",
        ],
      },
      {
        eyebrow: "安全なApply",
        title: "検出、承認、進捗、ロールバック",
        items: [
          "信頼済みDiscoveryが望ましい状態との差分を作成し、新規作成/更新/変更なし/競合を分類して互換性のない既存リソースを変更前に安全に停止します。",
          "Billing、License、Workspace、テストOU、API、デプロイヤーID、権限、プライベート接続性、証明書、ChromeシグナルをAPI確認/自動/手動/ブロックに分類します。",
          "承認は正確な構成ハッシュに紐付き、有効期限・1回限り・編集時無効化を持ちます。ブラウザから直接指定された監査アクターは拒否します。",
          "Applyは操作チェックポイントとビジュアル進捗を記録し、同時実行を1件に制限。中断を検出し、共有リソースとIAM/Chrome Policyの変更前状態（before-image）を守りつつ所有変更のみを逆順にロールバックします。",
          "デプロイ管理画面でサニタイズ済みSecure Gateway/Nginxログ、所有/共有リソース一覧、正確な確認文を必要とする所有範囲限定の逆順削除を提供します。",
        ],
      },
      {
        eyebrow: "検証とローカル保護",
        title: "Acceptance証跡とオペレーター保護",
        items: [
          "永続的な受入マトリクスには、該当するT01～T05のシステム検証、オペレーターが記録するT06/T07、本番時だけ必要なT08と2種類のT09拒否ケースを保存し、証跡をJSON出力します。",
          "SHA-256監査チェーン、デプロイ履歴、サニタイズ済みログ、リクエストID、クエリ/認証情報除去により秘密情報を残さず完全な追跡性を確保します。",
          "ローカルアプリはループバックのHost/Origin検証、起動ごとのnonce、CSP、no-store、権限0600のSQLiteを適用します。拡張機能は隔離されたMV3オリジン、厳格なCSP、明示的なデータ同意、セッション限定の秘密鍵、暗号化IndexedDBを使用します。",
          "初回準備後のGoogle Cloud変更は、固定したキーレスデプロイヤーSAで実行します。Workspace、Chrome、Cloud Identity、ライセンスの変更は、各APIがWorkspaceユーザー権限を必要とするためログイン中の管理者で実行します。サービスアカウントJSONキーや他クラウドの認証情報は受け付けません。ワークフローと設定UIは日本語／英語に対応しています。",
        ],
      },
    ],
    stepLabel: (step) => `ステップ ${step}`,
    steps: [
      {
        title: "モード",
        subtitle: "PoC 境界の画定と戦略の選択",
        summary:
          "PoC の対象範囲、対象クライアント OS、VPC ネットワーク戦略、および TLS 認証局モデルを決定します。",
        actions: [
          "軽量構成には迅速なPoCモードを使い、専用の非本番project、VPC、OUを明示的に選択します。PoCモードだけでは、選択した既存リソースが非本番であることを保証しません。",
          "受入テスト対象とする管理対象 Chrome プラットフォーム（macOS, Windows, Linux, ChromeOS）を選択します。",
          "新規の専用 VPC を自動作成するか、既存の社内 VPC に直接ルーティングするかを選択します。",
          "TLS 証明書の発行元（Enterprise CA / パブリック証明書 / ローカル PoC CA）を選択します。",
        ],
        optionsBehavior: [
          {
            name: "PoC モード vs 本番モード",
            behavior:
              "PoCモードは単一ゾーンの軽量構成に限定し、このUIの本番構成を無効にしますが、既存projectやVPCを隔離しません。管理者が専用の非本番リソースを選び、プランを確認する必要があります。",
          },
          {
            name: "専用 VPC vs 既存 VPC",
            behavior:
              "専用VPCは10.42.0.0/24サブネットを持つ新規ネットワークを作成します。無競合を保証するのではなく、検出できたCIDR重複やリソース衝突を事前検出でブロックします。既存VPCは選択したネットワーク（直接HTTPSではその所有プロジェクト）を経由します。",
          },
          {
            name: "証明書戦略（Enterprise / Public / Local）",
            behavior:
              "Enterprise CA は Google CA Service と連携、Public は既存 Secret を参照、Local PoC CA はローカルで一時的な自己署名 Root CA を自動生成します。",
          },
        ],
        apiCalls: [],
        safetyNote: "Local PoC CA を使用する場合は、本番環境ではなく必ず専用のテスト用 OU に限定して配布してください。",
      },
      {
        title: "ID",
        subtitle: "完全キーレスなクラウド & Workspace 管理者認証",
        summary:
          "サービスアカウントキー（JSON）を発行・保存せず、管理者アカウントによる安全なキーレスのサービスアカウント借用（Impersonation）認証を確立します。",
        actions: [
          "拡張機能ではブラウザ管理の管理者OAuth、ローカルアプリではキーレスADCを使用し、どちらもサービスアカウントJSONキーを出力しません。",
          "製品の全対応パスに限定したカスタムロールを持つ専用デプロイヤーSAを自動プロビジョニングします。0.2.0移行監査が不一致なら、追加確認後に旧IDを変更せず分離デプロイヤーを作成できます。",
          "GCP プロジェクトおよび Google Workspace Chrome Policy への読み取り専用 API アクセスを検証します。",
        ],
        optionsBehavior: [
          {
            name: "Google Cloud プロジェクト ID",
            behavior:
              "Secure Gateway やロードバランサーなどのインフラリソースを構築する対象 GCP プロジェクトを指定します。",
          },
          {
            name: "Google Workspace 顧客 ID",
            behavior:
              "Chrome Enterprise ポリシーを配布する対象テナント（例: C012abcde）を指定します。",
          },
          {
            name: "デプロイヤー自動作成（Bootstrap）",
            behavior:
              "通常はSA `secure-gateway-deployer` を作成します。0.2.0の厳密な移行監査に不一致がある場合は、旧IDを採用・変更せず、追加確認後に `secure-gateway-studio-deployer` と専用ロールを作成します。いずれもログイン中管理者だけにToken Creatorを付与します。",
          },
        ],
        apiCalls: [
          {
            method: "GET",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts/{saEmail}",
            purpose: "デプロイヤー用サービスアカウントが既に存在するか確認します。",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts",
            purpose: "キーレスデプロイヤー専用サービスアカウントを新規作成します。",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/roles",
            purpose: "リクエスト本文の roleId を使い、対応する全デプロイ・ロールバック・削除経路の権限を持つ互換IDのカスタムロール（secureGatewayPocDeployer）を作成します。",
          },
          {
            method: "PATCH",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/roles/{roleId}",
            purpose: "互換IDの既存カスタムロール（secureGatewayPocDeployer）を、対応する全デプロイ・ロールバック・削除経路の権限で更新します。",
          },
          {
            method: "POST",
            endpoint: "https://cloudresourcemanager.googleapis.com/v1/projects/{projectId}:setIamPolicy",
            purpose: "プロジェクトレベルでカスタムロール、roles/browser、roles/serviceusage.serviceUsageConsumer をバインドします。",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts/{saEmail}:setIamPolicy",
            purpose: "サービスアカウントに対して、管理者に roles/iam.serviceAccountTokenCreator を付与します。",
          },
          {
            method: "GET",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policySchemas",
            purpose: "Chrome Policy スキーマの読み取り権限を検証し、対象 OU は続けて policies:resolve で検証します。",
          },
        ],
        safetyNote: "サービスアカウント JSON 鍵は生成・保存せず、Google OAuth と短命の偽装認証情報を使用します。",
      },
      {
        title: "環境",
        subtitle: "データプレーン設計とプライベートルーティングの定義",
        summary:
          "ターゲット VPC、リージョン、プライベートホスト名、および実行環境で対応するアーキテクチャパスを構成します。Option B は常に専用の非公開サンプルバックエンドVMを作成します。",
        actions: [
          "Chrome拡張機能のOption Bは、他の方式と同じ承認・所有権・ロールバック・削除フローで、非公開サンプルVMとRegional Internal Application Load Balancerを作成します。",
          "アプリのプライベートホスト名、ポート、および Upstream VPC ネットワークを指定します。",
          "Shared VPCなど別プロジェクトのアップストリームを使う場合、検証／事前確認より前に、アップストリームプロジェクトの管理者がデプロイ先プロジェクトのデプロイヤーSAへ、compute.networks.get、compute.networks.use、resourcemanager.projects.get、resourcemanager.projects.getIamPolicy、resourcemanager.projects.setIamPolicy の5権限だけを含むアップストリームプロジェクトのカスタムロールを手動で作成・付与します。初回準備はデプロイ先プロジェクトだけを構成し、プロジェクトカスタムロールは作成元プロジェクトの外では付与できません。",
          "Option BではGoogle管理Envoyプロキシ用のProxy-OnlyサブネットCIDRを設定し、run所有の非公開サンプルバックエンドVMを作成します。専用VPCではRouter/NATを追加し、既存VPCでは検証済みプライベートegressが必要です。",
        ],
        optionsBehavior: [
          {
            name: "Option A（Direct HTTPS）",
            behavior:
              "既存の HTTPS アプリへ直接 Secure Gateway をルーティングします。Nginx や ILB は作成しません。",
          },
          {
            name: "Option B（ILB HTTPS Offload）",
            behavior:
              "Regional Internal Application Load Balancer、Envoy Proxyサブネット、run所有の非公開サンプルVMを作成し、TLS終端後のHTTPをそのVMのTCP 80へ転送します。既存HTTPエンドポイントには対応しません。",
          },
          {
            name: "Option C（Nginx HTTPS Offload）",
            behavior:
              "専用の Nginx VM または MIG を VPC 内にデプロイし、リバースプロキシとして HTTPS 終端と HTTP 転送を行います。",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways",
            purpose: "Secure Gateway リソースを作成・プロビジョニングします。",
          },
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways/{gw}/applications",
            purpose: "ホスト名:ポートのマッチャーと VPC ルートを持つプライベートアプリケーションを登録します。",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/global/firewalls",
            purpose: "送信元 136.124.16.0/20（Gateway IP 範囲）からの TCP 通信を許可する Ingress ルールを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://dns.googleapis.com/dns/v1/projects/{projectId}/managedZones",
            purpose: "対象 VPC ネットワークに紐づく Cloud DNS 限定公開ゾーンを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/regions/{region}/subnetworks",
            purpose: "Option B 用に Google 管理 Envoy プロキシ専用の REGIONAL_MANAGED_PROXY サブネットを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/zones/{zone}/instances",
            purpose: "Option B用に外部IPを持たないrun所有の非公開サンプルバックエンドVMを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/regions/{region}/forwardingRules",
            purpose: "ILB オフロード用の内部 HTTPS フォワーディングルールを作成します。",
          },
        ],
        safetyNote: "リージョンILBをクロスリージョンで利用する場合はFrontendのGlobal Access有効化が必須です。Option Bの変更も、他の拡張機能パスと同じ承認済みrunと削除インベントリを使用します。",
      },
      {
        title: "証明書",
        subtitle: "TLS 所有権と Chrome Root Store への信頼伝播",
        summary:
          "証明書の発行元を定義し、Secret Manager で秘密鍵を隔離保管した上で、Chrome Root Store コネクタによる信頼配布を準備します。",
        actions: [
          "Enterprise CA Service、既存 Secret、またはブラウザ自動生成の Local PoC CA を指定します。",
          "TLS 秘密鍵を Secret Manager に暗号化保管し、最小権限のアクセス権を設定します。",
          "生成されたパブリック Root PEM をダウンロードし、Google 管理コンソールの Chrome Root Store に登録します。",
        ],
        optionsBehavior: [
          {
            name: "Enterprise CA Service",
            behavior:
              "Google Cloud CA Service の既存 CA プールおよび認証局からサーバー証明書を発行します。",
          },
          {
            name: "Public Secret",
            behavior:
              "Secret Manager に事前に格納・検証されたパブリック信頼サーバー証明書を参照します。",
          },
          {
            name: "Local PoC CA",
            behavior:
              "WebCrypto で一時的な 3072-bit RSA の Root 鍵とサーバー鍵を生成し、メモリ内の Root 鍵でサーバー証明書に署名します。",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://secretmanager.googleapis.com/v1/projects/{projectId}/secrets",
            purpose: "TLS 証明書および秘密鍵を格納する暗号化シークレットコンテナを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://secretmanager.googleapis.com/v1/projects/{projectId}/secrets/{secretId}:addVersion",
            purpose: "証明書・鍵のバージョンを追加し、専用サービスアカウントへのアクセス権限を自動設定します。",
          },
        ],
        safetyNote:
          "Root CA の秘密鍵はエクスポートしません。サーバー秘密鍵は実行中だけメモリ／chrome.storage.session の証明書バンドルに保持し、Secret Manager へ送信後、実行終了時にセッションストレージから消去します。公開証明書は IndexedDB で保存時暗号化し、ダウンロードできます。承認済みの 0.2.0 移行後は chrome.storage.local を使用しません。",
      },
      {
        title: "アクセス",
        subtitle: "ゼロトラスト認可と Chrome ポリシーの配信",
        summary:
          "コンテキストに応じたアクセスレベル（Context-Aware Access）を適用し、テスト OU の管理対象ブラウザにポリシーを強制配信します。",
        actions: [
          "Google Workspace Directory API から対象の組織部門（OU）を選択します。",
          "BeyondCorp のデバイス・プロファイル状態を検証するアクセスレベルを紐付けます。",
          "テスト対象のユーザー、グループ、またはドメインに Secure Gateway アプリケーション利用権限を付与します。",
        ],
        optionsBehavior: [
          {
            name: "対象組織部門（OU）",
            behavior:
              "Chrome Enterprise ポリシーの適用範囲を限定し、テスト OU 配下のブラウザだけに Gateway 設定を配信します。",
          },
          {
            name: "Managed Chrome Access Level",
            behavior:
              "Endpoint Verification 等のゼロトラストポスチャ条件を満たす端末・プロファイルのみ通信を許可します。",
          },
          {
            name: "プリンシパル（ユーザー / グループ / ドメイン）",
            behavior:
              "IAM において `roles/beyondcorp.sgApplicationUser` ロールを対象 ID にバインドします。",
          },
        ],
        apiCalls: [
          {
            method: "GET",
            endpoint: "https://admin.googleapis.com/admin/directory/v1/customer/{customerId}/orgunits",
            purpose: "Google Workspace から組織部門（OU）の階層ツリーを取得します。",
          },
          {
            method: "GET",
            endpoint: "https://accesscontextmanager.googleapis.com/v1/accessPolicies/{policyId}/accessLevels",
            purpose: "利用可能な Context-Aware Access レベルの一覧を取得します。",
          },
          {
            method: "POST",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:batchModify",
            purpose: "Secure Enterprise Browser / Endpoint Verification 拡張機能の強制インストールと Gateway ルーティングを設定します。",
          },
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways/{gw}/applications/{app}:setIamPolicy",
            purpose: "アプリ利用権限とアクセスレベル条件をテスト対象プリンシパルにバインドします。",
          },
        ],
        safetyNote: "親 OU から継承されたレガシー PAC ポリシーが存在する場合、対象テスト OU だけを安全にバイパス上書きします。",
      },
      {
        title: "確認",
        subtitle: "決定論的事前ディスカバリーと暗号的承認",
        summary:
          "既存リソースの非破壊スキャンを実行し、すべての安全ゲート（Safety Gates）を評価した上で、構成ハッシュに紐づく承認を行います。",
        actions: [
          "Google Cloud / Workspace のリソースを読み取り専用スキャンし、望ましい状態との差分プランを作成します。",
          "課金、ライセンス、API、CIDR 重複、IAM 権限などの安全ゲートを Pass / Planned / Blocked で評価します。",
          "設定ハッシュ（SHA-256）に暗号的に拘束される人手承認を実施します。",
        ],
        optionsBehavior: [
          {
            name: "事前確認ディスカバリー",
            behavior:
              "変更を加えることなく全 API をプローブし、既存インフラとの互換性や競合を事前検出します。",
          },
          {
            name: "安全ゲート（Safety Gates）",
            behavior:
              "前提条件（Billing, CEP License, Private DNS, Firewall 等）が満たされているか自動判定します。",
          },
          {
            name: "SHA-256 承認バインディング",
            behavior:
              "プラン全体の正規化ハッシュを算出して承認を記録します。設定が1文字でも変更されると承認は即時失効します。",
          },
        ],
        apiCalls: [
          {
            method: "GET",
            endpoint: "https://serviceusage.googleapis.com/v1/projects/{projectId}/services",
            purpose: "有効化されている Google Cloud API を監査します。",
          },
          {
            method: "POST",
            endpoint: "https://cloudresourcemanager.googleapis.com/v1/projects/{projectId}:testIamPermissions",
            purpose: "計画された変更を実行するために必要なすべての IAM 権限を呼び出し元 SA が持っているか検証します。",
          },
        ],
        safetyNote: "ブロック判定（Action Required）の安全ゲートが残っている間は承認操作ができません。",
      },
      {
        title: "適用",
        subtitle: "依存順オーケストレーション、逆順ロールバック、受入検証",
        summary:
          "承認済みオペレーションを依存順に実行して所有権を追跡し、その後の個別検証用に該当する受入マトリクスを保存します。",
        actions: [
          "選択した実行環境に応じて、サブネット ➡️ 証明書 ➡️ Nginx VM/MIG（またはローカルアプリ限定の HTTPS ILB）➡️ Gateway ➡️ DNS ➡️ Chrome ポリシーの依存順で作成します。",
          "作成したリソースの所有権（Ownership）を記録し、異常発生時は作成済みリソースのみを逆順ロールバックします。",
          "適用後に［運用］から該当するT01～T05のシステム検証を別途実行し、T06/T07のオペレーター証跡を記録します。本番ではさらにT08と2種類のT09拒否ケースを記録してから監査可能なJSON証跡を出力します。",
        ],
        optionsBehavior: [
          {
            name: "依存関係順のデプロイ実行",
            behavior:
              "下位インフラ（VPC, Subnet, Secret）が確実に準備完了してから上位サービス（LB, Gateway, Route）をバインドします。",
          },
          {
            name: "所有範囲限定の自動ロールバック",
            behavior:
              "途中で失敗した場合、既存の共有リソースを傷つけることなく、本デプロイで作成したリソースのみを正確に逆順削除します。",
          },
          {
            name: "個別の受入検証と証跡出力",
            behavior:
              "Applyはマトリクスの保存だけを行います。［運用］で該当するT01～T05をシステム検証し、オペレーターがT06/T07、本番ではT08と未許可プリンシパル／未管理ブラウザのT09を記録します。",
          },
        ],
        apiCalls: [],
        safetyNote:
          "MV3 ワーカーの停止は永続チェックポイントから再開します。ブラウザセッション終了により一時 TLS 秘密鍵を失った場合は安全側に失敗し、実行の所有範囲に限定してロールバックします。クリーンアップを完了できない場合だけオペレーターによる照合が必要です。",
      },
    ],
    faqTitle: "よくある質問とトラブルシューティング (FAQ)",
    faqIntro:
      "実際の Secure Gateway 構築・検証現場で発生しやすいトラブルへの対処法、証明書信頼の仕組み、OAuth 配布設定、運用ベストプラクティスをまとめています。",
    faqEyebrow: "トラブルシューティングと運用上の注意",
    faqChecklistLabel: "確認チェックリスト・解決手順",
    faqs: [
      {
        id: "faq-503-unavailable",
        category: "ルーティング・データプレーン",
        question: "Chrome でプライベートアプリにアクセスすると「503 Service Unavailable」や接続エラーになる原因は？",
        answer:
          "BeyondCorp Security Gatewayが、承認済みrunに記録されたバックエンドのホスト名と予約済みプライベートアドレスへTCP/TLS接続できない状態です。選択済みまたはrun所有のComputeターゲット、ファイアウォール、プライベートDNS、および承認構成で必要な場合だけCloud NATを確認します。",
        checklist: [
          "対象実行の［リソース］と［ログ］を開き、T01〜T05 検証を実行します。ライブ状態との照合には、その実行に紐づくインベントリとサニタイズ済み証跡だけを使用します。",
          "承認済みファイアウォールルールが必要なバックエンドポートを Secure Gateway 送信元範囲 136.124.16.0/20 からだけ許可し、0.0.0.0/0 を許可していないことを確認します。",
          "承認したネットワーク構成で必要な場合は、この実行で選択したVPC内の作成済みサブネットにCloud RouterとCloud NATが構成されていることを確認します。",
          "runに紐づくCloud DNSプライベートゾーンで、承認済みホスト名がリソース一覧に表示された正確な予約済みプライベートアドレスへ解決されることを確認します。",
        ],
      },
      {
        id: "faq-cert-authority-invalid",
        category: "証明書・Root CA 信頼",
        question: "「net::ERR_CERT_AUTHORITY_INVALID」や「保護されていない通信」の警告が出る理由は？",
        answer:
          "TLSサーバー証明書が専用テストOUのChrome Root Store構成で信頼されていないか、管理対象の仕事用プロファイルに更新済みポリシーがまだ届いていない状態です。",
        checklist: [
          "［適用（Step 7）］またはデプロイ管理画面から最新の公開PoCルートPEMをダウンロードし、フィンガープリントを照合します。",
          "Google管理コンソールの［Chrome］>［コネクタ］>［Chrome Root Store］でPEMを追加し、その構成を専用テストOUだけに接続します。",
          "同じ管理対象の仕事用プロファイルでchrome://policyを開き、［ポリシーを再読み込み］を実行します。反映されなければChromeを再起動します。",
          "同じ管理対象プロファイルで承認済みプライベートHTTPSホスト名を再試験します。警告をバイパスしたり、信頼テストにシークレットウィンドウを使ったりしないでください。",
        ],
      },
      {
        id: "faq-oauth-external-mode",
        category: "OAuth・配布設定",
        question: "社外のテスターや複数ドメインのユーザーに拡張機能を配布する場合、OAuth 同意画面はどのように設定しますか？",
        answer:
          "同一 Workspace 組織内だけなら「内部 (Internal)」を使用できます。組織外のテスターには「外部 (External)／テスト中」を使い、明示したテストユーザーだけを登録します。この拡張機能は機密スコープを要求するため、外部向け本番配布には Google の OAuth ブランド審査とスコープ審査が必要です。",
        checklist: [
          "Google Cloud Console の [APIとサービス] > [OAuth 同意画面] でユーザータイプを「外部 (External)」に変更する。",
          "「テスト中 (Testing)」では各テスターを [テストユーザー] に追加する。未検証アプリのユーザー上限は残り、機密スコープの認可は7日後に失効する場合があります。",
          "外部向け本番利用の前に、リポジトリの OAuth ブランド／スコープ審査チェックリストを完了する。Workspace 管理者のアクセス制御によって認可がブロックされる場合もあります。",
        ],
      },
      {
        id: "faq-extension-id-mismatch",
        category: "OAuth・配布設定",
        question: "テスターの PC で「OAuth2 request failed: Bad Client ID」エラーが出るのを防ぐには？",
        answer:
          "manifest.json に固定公開鍵（key）がない未パッケージ拡張は、読み込むフォルダによって Chrome 拡張機能 ID（32桁の英字）が変わります。GCP の OAuth クライアント ID で指定した「アイテム ID」とテスター側の拡張機能 ID を一致させる必要があります。",
        checklist: [
          "GCP の [認証情報] > [OAuth 2.0 クライアント ID] に設定されているアイテム ID と、chrome://extensions の ID が一致しているか確認する。",
          "本プロジェクトのバージョン付き secure-gateway-studio ZIP は固定公開鍵（key）を含むため、どの PC で解凍しても同一の拡張機能 ID に固定されます。",
        ],
      },
      {
        id: "faq-access-level-cel",
        category: "ゼロトラスト・アクセス制御",
        question: "Access Context Manager（CEL 式）で「管理対象 Chrome のみ」にアクセス制限する仕組みは？",
        answer:
          "BeyondCorp Application の IAM ポリシーは、device.chrome.management_state（PROFILE_MANAGED／BROWSER_MANAGED など）を CEL で評価する Access Context Manager レベルを参照します。検証済みレベルを満たさない通信は Google のエッジで拒否されます。",
        checklist: [
          "デプロイ管理画面では NONE または Google から取得した既存の accessPolicies/.../accessLevels/... リソースを選択します。",
          "画面が更新するのはアプリケーションの条件付き IAM バインディングとプリンシパルであり、Access Context Manager レベル自体は作成しません。",
          "変更内容はすべて暗号化監査チェーンに記録されます。",
        ],
      },
      {
        id: "faq-owned-teardown",
        category: "運用・クリーンアップ",
        question: "デプロイで作成したリソースを安全に削除するにはどうすればよいですか？",
        answer:
          "デプロイ管理画面の「削除」タブからTeardownを実行します。そのrunが所有すると記録されたリソースだけを依存関係の逆順で削除します。共有 IAM／Chrome Policy の変更前状態は、現在値がそのrunの記録済みmanaged-after状態と安全に一致する場合だけ復元し、ドリフトや送信結果不明の変更は保持して手動照合します。その他の既存リソースは保持します。",
        checklist: [
          "削除タブに表示される所有・復元・保持リソースを確認し、画面の確認文を正確に入力します。",
          "確認後に、そのrunに紐づくTeardownだけを実行します。",
        ],
      },
    ],
  },
  cepDeployer: {
    title: "Chrome Enterprise Premium 向け Easy PoC",
    subtitle: "CEP の評価用ベースラインを 1 つの組織部門に適用し、評価後の削除候補を確認します。",
    intro:
      "脅威対策・コンテンツ検査・データ境界の Chrome ポリシーをパイロット OU に適用します。CEP では適用前の状態との厳密な 3-way 所有台帳（変更前・変更後）を永続化しないため、ロールバック操作は「削除候補の確認（読み取り専用）」として安全に動作します。Chrome Policy、Access Level、Cloud Identity DLP は手動確認用に保持されます。Workspace 管理者権限は管理コンソールで別途割り当て、各ポリシーは live スキーマと照合して安全に適用されます。",
    targetOuCardTitle: "1. 対象の組織部門（OU）",
    targetOuCardSubtitle:
      "隔離された非本番のパイロット OU を選んでください。ルート OU は使用できず、OU 対象ポリシーは選択 OU とその配下へ影響する場合があります。",
    targetScopeCardTitle: "1. 対象のスコープ（組織部門 / Google グループ）",
    targetScopeCardSubtitle:
      "ポリシーの適用先として組織部門（OU）または Google グループを選択します。グループ指定ならユーザーの OU 移動が不要です。",
    targetTypeOu: "組織部門（OU）",
    targetTypeGroup: "Google グループ",
    selectTargetGroup: "対象の Google グループ",
    selectTargetGroupPlaceholder: "Google グループを選択または直接入力",
    refreshGroups: "↻ グループを再読込",
    targetGroupImpact:
      "Chrome ポリシー（groups:batchModify）および Cloud Identity DLP ルールが、選択した Google グループのメンバーに直接適用されます。ユーザーを別の OU に移動する必要はありません。",
    targetGroupConfirmationLabel: "確認のため、対象グループのメールアドレスを入力",
    targetGroupConfirmationHint:
      "誤適用を防ぐため、変更操作の直前に表示されたグループのメールアドレスを入力してください（横のボタンで自動入力できます）。",
    copyTargetGroupEmail: "グループアドレスを入力",
    groupLoadFailed: "グループ一覧を取得できませんでした。メールアドレスを直接入力して適用することも可能です。",
    customGroupInputPlaceholder: "例: poc-security@yourdomain.com",
    orEnterGroupEmail: "またはグループのアドレスを直接入力:",
    selectTargetOu: "対象の組織部門",
    selectTargetOuPlaceholder: "ルート以外のパイロット OU を選択",
    rootOuUnavailable: "ルート — 使用不可",
    targetOuImpact:
      "Chrome ポリシーと OU 対象の DLP ルールは、継承により選択 OU と配下の OU に影響する場合があります。アクセスレベルを作成すると組織スコープのリソースが追加されますが、この画面ではアプリへ割り当てません。ライセンス割り当ては Directory 上の現在のパスが選択 OU と完全一致するユーザーだけが対象で、配下 OU のユーザーは除外します。",
    targetOuConfirmationLabel: "確認のため、対象の OU パスを入力",
    targetOuConfirmationHint:
      "誤適用を防ぐため、変更操作の直前に表示された対象 OU パスを入力してください（横のボタンで自動入力できます）。",
    ouLoadFailed:
      "組織部門を取得できませんでした。セットアップ画面で Google Workspace の接続を確認してから、このタブを開き直してください。",
    canonicalCustomerIdRequired:
      "先に Workspace 接続を検証してください。DLP の変更には Directory が返す C で始まる正規顧客 ID が必要で、my_customer を Cloud Identity Policy の作成には送信しません。",
    verifyGoogleAccount: "Google アカウントを認証して組織（OU）とグループを読み込む",
    verifyingGoogleAccount: "Google アカウントを認証して組織・グループを取得中…",
    verifyGoogleAccountHint: "上をクリックして Google OAuth 認証を行い、組織部門（OU）と Google グループを一度に自動取得します。",
    retry: "再試行",
    refreshOus: "↻ OUを再読込",
    reloading: "再読込中…",
    autoCreateSubOus: "サブ OU「CEP Users」「CEP Browsers」を作成する",
    autoCreateSubOusHint:
      "後で整理するための任意の子 OU を作成または再利用します。ポリシーは選択したパイロット OU の現在の対象に適用され、子 OU 側で上書きされていなければ継承されます。ユーザーや登録済みブラウザは自動では移動しません。",
    presetsTitle: "2. プリセット",
    presetsSubtitle: "代表的な評価パターンの出発点です。適用前に下のモジュールで調整できます。",
    presetFullPoc: "フル評価",
    presetFullPocDesc:
      "全モジュール。脅威対策、コンテンツ検査、レポート、端末シグナル、コピー＆ペースト境界を含みます。",
    presetAiProtection: "生成 AI とデータ漏えい対策",
    presetAiProtectionDesc:
      "外部 AI ツールへの入力を想定した貼り付け・アップロード検査と、非社用アカウントの遮断に絞ります。",
    presetEndpoint: "端末ハードニング",
    presetEndpointDesc:
      "強化セーフブラウジング、リアルタイム URL 検査、Endpoint Verification の強制、コンテキストアウェアアクセス。",
    presetAudit: "可視化・警告",
    presetAuditDesc: "レポートと警告のみの Chrome DLP ルールを適用し、ブロックは行いません。",
    modulesTitle: "3. ポリシーモジュール",
    modulesSubtitle:
      "モジュールごとに別のバッチで適用するため、非対応のポリシーが 1 つあっても他を巻き込みません。",
    moduleCorePolicies: "Chrome コアセキュリティポリシー",
    moduleCorePoliciesDesc:
      "強化セーフブラウジング、社用パスワードの使い回し警告、Chrome のクラウドレポートおよびプロファイルレポートを有効化します。",
    moduleForceExtensions: "Endpoint Verification の強制インストール",
    moduleForceExtensionsDesc:
      "Google 公式の Endpoint Verification 拡張機能を配布し、端末の状態シグナルをコンテキストアウェアアクセスに渡します。",
    moduleConnectors: "コンテンツ検査コネクタ",
    moduleConnectorsDesc:
      "リアルタイム URL 検査、ファイルのアップロード／ダウンロード検査、Google へのセキュリティイベント送信。",
    accessLevelTitle: "コンテキストアウェアアクセス (CAA) レベル",
    accessLevelSelectPrompt: "適用するアクセスレベルを選択",
    accessLevelHint:
      "DLP の『未管理端末制御ルール』や Secure Gateway に適用するアクセスレベルを選択します（選択したレベルは CEL 条件 access_levels.exists に自動組み込みされます）。不要な場合は『なし』のままで問題ありません。",
    accessLevelNone: "なし",
    accessLevelNoneDesc: "アクセスレベルによる制限を行いません。",
    accessLevelAutoProfile: "新規作成: 管理対象 Chrome プロファイル",
    accessLevelAutoBrowser: "新規作成: 管理対象 Chrome ブラウザ",
    accessLevelAutoAny: "新規作成: 管理対象のプロファイルまたはブラウザ",
    accessLevelExistingGroup: "既存のアクセスレベル",
    accessLevelLoadFailed:
      "既存のアクセスレベルを取得できませんでした。作成するには、Access Context Manager ポリシーを持つ組織に属した Google Cloud プロジェクトが必要です。",
    moduleDlpDetectors: "社内サイト用の DLP 検出器",
    moduleDlpDetectorsDesc:
      "利用できません。settings/detector.url_list は Policy API の変更操作で未対応です。",
    moduleDlpRules: "DLP ルール（サンプル一式）",
    moduleDlpRulesDesc:
      "機密データの外部送信に対して警告・ブロックを行う DLP ルール（アラートセンター重大度: 低）や、社内サイトへのアクセス時に動的透かしを表示して画面キャプチャや情報持ち出しを抑止する URL ルールを作成します。",
    betaBadge: "ベータ",
    dlpBetaNote:
      "対応済みの settings/rule.dlp 作成にはベータ版の Cloud Identity Policy API を使用します。未対応のURLリスト検出器とアクセスレベル／BYOD条件は送信しません。拒否された呼び出しは理由付きで表示します。",
    dlpRegionTitle: "検出対象とする個人番号の国・地域",
    dlpRegionHint:
      "個人番号ルールが使用する Cloud DLP 検出器を切り替えます。国が合っていない検出器は何も検知しないため、動作しているルールと見分けがつきません。",
    dlpRulesTableTitle: "ルールごとの動作",
    dlpRulesTableHint:
      "Chrome DLP Policy API が提供する動作は「監査のみ（イベント記録）」「警告」「ブロック」の3種類です。ルールを作成しない操作は「オフ」を選択してください。",
    dlpActionOff: "作成しない",
    dlpActionAudit: "監査のみ（イベント記録）",
    dlpActionWarn: "警告して許可",
    dlpActionBlock: "ブロック",
    dlpRuleNationalId: "ページへの個人番号の貼り付け",
    dlpRulePaymentCard: "アップロードに含まれるカード番号",
    dlpRuleAccessLevel: "管理対象外 Chrome からのアップロード",
    dlpRuleWatermark: "社内ページへの電子透かし",
    dlpNoticeByodTitle: "コンテキスト アウェア アクセス（CAA）条件の連動",
    dlpNoticeByodDesc: "この行のルールは CEL 条件式（access_levels.exists(level, level == '<ACCESS_LEVEL>')）を使用し、未管理端末やポリシー非準拠端末に限定して DLP 制御を適用します。Step 1 で選択したアクセスレベルと自動連携されます。",
    activePresetBadge: "選択中",
    dataBoundaryModeTitle: "データ境界",
    dataBoundaryModeCopyPaste: "貼り付け内容を検査する",
    dataBoundaryModeCopyPasteDesc:
      "ページに貼り付けられたテキストを検査し、Google アプリでは主要ドメインのアカウントだけを許可します。",
    dataBoundaryModeBlockNonCorp: "非社用の Google アカウントを遮断する",
    dataBoundaryModeBlockNonCorpDesc:
      "Google アプリで主要ドメインのアカウントのみを許可し、個人 Gmail タブ経由の持ち出し経路を塞ぎます。",
    dataBoundaryModeNone: "なし",
    dataBoundaryModeNoneDesc:
      "クリップボードとアカウントの挙動は親 OU の設定を継承したままにします。",
    internalUrlsTitle: "社内機密サイト・透かし保護対象 URL",
    internalUrlsPlaceholder: "https://intranet.example.com\nhttps://portal.corp.example.com",
    internalUrlsHint:
      "ここに登録した社内サイトを開いた際、画面上に動的な電子透かしを表示し、画面キャプチャ（スクリーンショット）を自動的にブロックします。保護したい URL を 1 行に 1 件入力してください。",
    rolesCardTitle: "4. Workspace 管理者権限",
    rolesCardSubtitle:
      "Workspace の権限は Google 管理コンソールで割り当てます。Google Cloud プロジェクトの IAM ロールでは Chrome Policy API の権限や必要な OAuth 権限を付与できません。",
    roleAdminLabel: "ポリシー実施者",
    roleAdminDesc:
      "Chrome 設定と組織部門に限定した管理コンソールの管理者ロールを割り当てます。Cloud Identity DLP の変更には特権管理者アカウントが必要です。",
    roleAuditorLabel: "読み取り専用の確認者",
    roleAuditorDesc:
      "確認に必要な Chrome と OU の読み取り権限だけを持つ別の管理コンソールロールを作成し、デプロイ用アカウントと共用しません。",
    roleAssigneeEmailLabel: "割り当て先管理者メールアドレス（任意）",
    roleAssigneeEmailPlaceholder: "admin@example.com",
    roleAssigneeEmailHint: "空欄にした場合、ロールの作成のみを行い、ユーザーへの割り当てはスキップします。",
    roleTypeSelectLabel: "対象ロール",
    roleTypeBoth: "両方（ポリシー実施者 ＋ 監査担当者）",
    roleTypeAdminOnly: "ポリシー実施者のみ",
    roleTypeAuditorOnly: "監査担当者のみ",
    roleScopeOuCheckbox: "選択中の組織部門（OU）にスコープを限定する",
    roleCreateAssignBtn: "Workspace 管理者ロールを作成・アサイン",
    roleCreatingBtn: "ロール作成・アサイン中...",
    rolesAdminConsoleLink: "Google 管理コンソールの管理者ロールを開く",
    rolesVerificationNote:
      "ロールの割り当て完了後、「Googleアカウントを認証して組織情報を取得」を実行してください。ポリシーのデプロイに必要な Chrome Policy API および Cloud Identity API の権限が不足している場合は、実行時にエラー詳細と修復手順が表示されます。",
    testingScenariosTitle: "5. 結果を確認する",
    testingScenariosSubtitle:
      "検出器に反応するサンプル値です。実データを使わずに検知の様子を実演できます。",
    copyDummyData: "コピー",
    copiedToClipboard: "コピーしました",
    dummyPiiLabel: "サンプルの個人番号",
    dummyPiiValue: "1234-5678-9012",
    dummyPiiHint: "マイナンバー／SSN の書式に合わせたダミー値です。実在の番号ではありません。",
    dummyCreditCardLabel: "サンプルのカード番号",
    dummyCreditCardValue: "4532015112830366",
    dummyCreditCardHint: "Luhn チェックを通る Visa のテスト番号です。実在のカードではありません。",
    dummySourceCodeLabel: "サンプルの API キー入りソースコード",
    dummySourceCodeValue:
      "const GCP_SECRET_KEY = 'AIzaSyA_DEMO_CONFIDENTIAL_KEY_FOR_TESTING';",
    dummySourceCodeHint: "Google API キーの形式に似せた文字列です。実際には使えません。",
    scenarioGenAiTitle: "貼り付け検査",
    scenarioGenAiStep:
      "外部の AI ツールを開き、上のサンプル API キーを貼り付けます。貼り付け検査が有効なら、判定が返るまで Chrome が貼り付けを保留します。",
    scenarioDataBoundaryTitle: "データ境界",
    scenarioDataBoundaryStep:
      "管理対象プロファイルで個人の Google アカウントにログインします。非社用アカウントの遮断が有効なら、ログインが拒否されます。",
    scenarioWatermarkTitle: "アップロード検査",
    scenarioWatermarkStep:
      "サンプルのカード番号を含むファイルを、社内サイト一覧に無いサイトへアップロードします。検査のため保留され、イベントがセキュリティ調査ツールに届きます。",
    manualChecklistTitle: "このツールでは実施できない設定",
    manualChecklistSubtitle:
      "Google が外部設定用 API を提供していない項目です。上記の動作テストを実施する前に Google 管理コンソールで設定を完了してください。",
    manualChecklistItems: [
      {
        title: "機密コンテンツの保存を有効化",
        detail: "セキュリティ › アクセスとデータ管理 › データ保護。",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "光学文字認識（OCR）を有効化",
        detail: "画像内のテキストを検出器が読むために必要です。",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "CEP ライセンスの自動割り当てを有効化",
        detail: "お支払い › ライセンス設定で、パイロット OU に対して設定します。",
        href: "https://admin.google.com/ac/billing/licensesettings",
      },
    ],
    btnDeploy: "対象 OU に適用",
    btnDeploying: "適用中...",
    btnRollback: "削除候補を確認",
    btnRollingBack: "確認中...",
    btnDownloadScript: "Chrome ポリシーを Python で出力",
    confirmRollback:
      "Chrome Policy、Access Level、Cloud Identity DLP の削除候補を確認します。この操作は読み取り専用で、すべての候補を所有権確認用に保持します。続行しますか？",
    downloadFailed: "スクリプトを生成できませんでした",
    noModulesSelected: "ポリシーモジュールを 1 つ以上選択してください。",
    appliedTitle: "適用した設定",
    skippedTitle: "スキップした設定",
    statusLogTitle: "実行トレース",
    noActionYet: "まだ実行していません。対象 OU とモジュールを選び、適用してください。",

    licenseCardTitle: "ライセンス管理と自動割り当て制御",
    licenseCardSubtitle:
      "全社への意図しないライセンス消費を防ぎ、対象 OU のユーザーにのみ CEP ライセンスを直接割り当てます。",
    licensePilotLimitNotice:
      "※ 安全のため、選択したパイロット組織直下のユーザー（最大10名）に限定して安全に割り当てを行います。",
    licenseAutoAssignWarning:
      "全社への意図しないライセンス消費を防ぐため、ルート組織（ドメイン全体）で CEP の自動割り当てが『オフ』になっていることを確認してください。",
    licenseAutoAssignWarningLink: "Google 管理コンソールのライセンス設定を開く",
    licenseAutoAssignSteps: [
      "1. Google 管理コンソールの「お支払い › ライセンス設定」を開き、最上位組織（ルート OU）を選択します。",
      "2. Chrome Enterprise Premium の自動割り当てを「オフ」に変更します。",
      "3. このパイロット OU のみ自動割り当てを「オン」にするか、または下のボタンから対象ユーザーへ直接一括割り当てを行います。",
    ],
    btnAssignLicensesToOu: "CEPライセンスを割り当て（OU直下・最大10名）",
    copyTargetOuPath: "このパスを自動入力",
    tabSetup: "1. セットアップ",
    tabLicensing: "2. ユーザー & ライセンス",
    tabDlp: "3. DLP & 脅威対策",
    tabOperations: "4. 運用 & 検証",
    tabAll: "すべて表示",
    btnAssigningLicenses: "OU 内のユーザーへライセンスを割り当て中...",
    licenseAssignUsersFound: "OU 内のユーザーを処理しました",
    noUsersFoundInOu: "選択された組織部門内にユーザーは見つかりませんでした。",

    dlpMatrixTitle: "DLP コントロール マトリクス",
    dlpMatrixSubtitle:
      "Step 1 で選択した対象組織（OU）またはグループ内の端末に対し、各操作（アップロード・ダウンロード・貼り付け・印刷・画面透かし）の動作（ブロック・警告・オフ）を設定します。",
    dlpColThreat: "データ・脅威種別",
    dlpColUpload: "アップロード",
    dlpColDownload: "ダウンロード",
    dlpColPaste: "貼り付け",
    dlpColPrint: "印刷",
    dlpColWatermark: "画面透かし",
    dlpColDeviceScope: "対象スコープ内の端末",

    dlpRowUniversalUpload: "すべてのファイルアップロード",
    dlpRowUniversalUploadDesc: "Chrome からのあらゆるファイルアップロードを検査・制御します。",
    dlpRowUniversalDownload: "すべてのファイルダウンロード",
    dlpRowUniversalDownloadDesc: "Chrome でのファイルダウンロードを検査・不正ダウンロードを防止します。",
    dlpRowPaymentCard: "クレジットカード・金融情報",
    dlpRowPaymentCardDesc: "アップロード、貼り付け、印刷時のカード番号漏洩を検知・制御します。",
    dlpRowNationalId: "マイナンバー・個人識別情報",
    dlpRowNationalIdDesc: "各国の個人番号（マイナンバー／SSN等）の外部送信を検知・制御します。",
    dlpRowAccessLevel: "未管理端末・コンテキストアウェア非準拠からの操作",
    dlpRowAccessLevelDesc: "設定されたアクセスレベル（Context-Aware Access）に一致する端末からの操作を CEL 条件（access_levels.exists）で制御します。",
    dlpRowWatermark: "社内機密サイト保護・透かし",
    dlpRowWatermarkDesc: "警告して閲覧を許可し、登録した社内サイト上で動的透かしを表示して画面キャプチャを制限します。",
    dlpRowGenAiBlock: "未承認の生成AI利用ブロック（Geminiのみ許可）",
    dlpRowGenAiBlockDesc: "ChatGPT・Claude・DeepSeek 等のコンシューマー向け AI サービスをブロックし、社内で承認された Gemini のみ安全な利用を許可します。",

    dlpScopeAll: "対象内の全端末",
    dlpScopeByodOnly: "アクセスレベル連動",
    dlpActionBadgeBlock: "ブロック",
    dlpActionBadgeWarn: "警告",
    dlpActionBadgeAudit: "未対応",
    dlpActionBadgeAuditOnly: "監査のみ",
    dlpActionBadgeOff: "オフ",

    dlpActionParamsTitle: "追加アクション パラメータ（actionParams）",
    dlpActionParamsSubtitle: "DLP ルール発動時の挙動を拡張するオプション設定",
    dlpCustomMessageLabel: "エンドユーザー向けカスタム メッセージ（customEndUserMessage）",
    dlpCustomMessagePlaceholder: "例: 社内規定によりこの操作は制限されています。詳細はセキュリティチームにお問い合わせください。",
    dlpCustomMessageHint: "Chrome で警告またはブロックダイアログが表示された際、エンドユーザーに表示するメッセージです。",
    dlpSaveContentLabel: "検出されたコンテンツの証拠保存（saveContent）",
    dlpSaveContentHint: "インシデント調査や監査のため、検知対象となった機密コンテンツのコピーを保存します。",

    dlpPresetRecommended: "標準構成",
    dlpPresetRecommendedDesc: "機密データの送信時に警告を表示、未承認 AI は遮断し、社内サイトには動的透かしを適用して情報漏洩を防止します。",
    dlpPresetStrictZeroTrust: "厳格なゼロトラスト",
    dlpPresetStrictZeroTrustDesc: "機密データの外部送信を確実にブロックし、最も厳格なゼロトラスト ポリシーを適用します（BYOD 条件は管理コンソールで設定）。",
    dlpPresetGenAiSecure: "生成AIセキュア活用",
    dlpPresetGenAiSecureDesc: "ChatGPT 等のコンシューマー向け AI を遮断し、貼り付け検査を有効にした上で Gemini の安全な業務利用を許可します。",
    dlpPresetAuditOnly: "警告ファースト",
    dlpPresetAuditOnlyDesc: "選択した全操作で、API が Chrome 向けに提供する最も穏やかな DLP 操作を使用します。",
    geminiEnterpriseTitle: "Gemini Enterprise & Vertex AI Search ゼロトラスト保護",
    geminiEnterpriseSubtitle:
      "エンタープライズ生成AI（自社データ連携Agent・社内検索）は、Chrome・アイデンティティ・Google Cloud境界の多層防御で保護します。",
    geminiLayer1Title: "1. Chrome エンドポイント & DLP 保護",
    geminiLayer1Desc:
      "生成AI Web アプリケーションに対するプロンプト入力や生成データのダウンロードをリアルタイムで検査・保護します。",
    geminiLayer1Bullet1:
      "個人情報（PII）、API キー、機密コード等のプロンプト貼り付け・アップロードを遮断または警告。",
    geminiLayer1Bullet2:
      "社内データ検索結果や AI 生成レポートのダウンロード・画面キャプチャ時に電子透かし（ウォーターマーク）を強制適用。",
    geminiLayer2Title: "2. コンテキストアウェア アクセス (CAA)",
    geminiLayer2Desc:
      "許可された会社支給デバイスや安全なネットワークからのみサインインを許可します。",
    geminiLayer2Bullet1:
      "Endpoint Verification（管理対象 Chrome ブラウザ）または社内 IP アドレスをアクセス条件として必須化。",
    geminiLayer2Bullet2:
      "Google Workspace 管理コンソールの CAA アプリ割り当てで「Gemini」アプリへのネイティブ保護ポリシーを適用。",
    geminiLayer3Title: "3. VPC Service Controls & Agent Gateway",
    geminiLayer3Desc:
      "API レベルでのデータ持ち出し防止および自社エージェント間通信の暗号的保護を行います。",
    geminiLayer3Bullet1:
      "VPC Service Controls サービス境界内で discoveryengine.googleapis.com（Gemini Enterprise API）を隔離・保護。",
    geminiLayer3Bullet2:
      "Agent Gateway により、エージェント間通信（A2A）で mTLS および DPoP（RFC 9449）トークンバインディングを強制。",
    geminiCliTitle: "Google Cloud VPC-SC 境界 & ACM アクセスレベル設定コマンド",
    geminiCliCopyBtn: "コマンドをコピー",
    dlpPresetGeminiEnterprise: "Gemini Enterprise 保護",
    geminiAutoProvisionTitle: "🚀 Gemini Enterprise ゼロトラスト境界の自動プロビジョニング",
    geminiAutoProvisionSubtitle:
      "Access Context Manager (ACM) アクセスレベルおよび VPC Service Controls 境界を Google Cloud API 経由でワンクリック自動作成・適用します。",
    geminiTargetProjectLabel: "対象 Google Cloud プロジェクト ID",
    geminiPolicyIdLabel: "Access Context Manager ポリシー ID (省略時は自動検出)",
    geminiPerimeterNameLabel: "VPC-SC 境界識別名",
    geminiEnforceAccessLevelLabel: "ACM アクセスレベルを作成・バインド (管理対象 Chrome: BROWSER_MANAGED を必須化)",
    geminiAccessLevelSelectLabel: "適用する ACM アクセスレベル",
    geminiAccessLevelDefaultOption: "新規作成: secgw_chrome_managed (管理対象 Chrome ブラウザ)",
    geminiAccessLevelSelectHint: "Gemini Enterprise の VPC-SC 境界または RCA にバインドするアクセスレベルを指定します。Step 1 で取得した既存レベルを選択するか、管理対象 Chrome 専用レベルを新規作成します。",
    geminiEnforcePerimeterLabel: "VPC-SC サービス境界を作成 (discoveryengine.googleapis.com を境界内で隔離・保護)",
    geminiDryRunLabel: "ドライラン（試行・監査）モードで作成 (既存の通信を遮断せず Cloud Logging にのみ記録)",
    geminiAutoProvisionBtn: "🚀 ゼロトラスト環境を一括自動作成・適用",
    geminiAutoProvisioningBtn: "プロビジョニング中...",
    geminiSuccessTitle: "ゼロトラスト境界の自動作成が完了しました",
    geminiStep1: "1. Google Cloud プロジェクト & Access Policy 解決",
    geminiStep2: "2. ACM アクセスレベル作成 (管理対象 Chrome)",
    geminiStep3: "3. VPC-SC サービス境界作成 (Discovery Engine)",
    geminiStep4: "4. ゼロトラスト環境検証 & 完了",
    geminiStep5Rca: "5. Restricted Client Applications (RCA) ユーザーアクセスバインディング作成",
    geminiAdminLockoutWarningTitle: "⚠️ 重要: Google Cloud Console 管理者へのアクセス要件（ロックアウト注意）",
    geminiAdminLockoutWarningText:
      "discoveryengine.googleapis.com に対してアクセスレベルを適用（VPC-SC）すると、エンドユーザーだけでなく、Google Cloud Console から Gemini Enterprise を設定・管理する GCP 管理者自身も、管理対象ブラウザ（Managed Chrome）から接続しない限りコンソール上で 403 権限エラーとなります。管理者が未管理端末を利用する場合は、Approach 2 (RCA) のグループ限定バインドの併用または Ingress 例外設定を検討してください。",
    geminiEnforceRcaLabel: "Approach 2: Restricted Client Applications (RCA) を直接プロビジョニングする",
    geminiRcaGroupKeyLabel: "対象 Google グループ（メールアドレスまたは Group ID）",
    geminiRcaGroupKeyPlaceholder: "例: gemini-users@example.com または 0184mhaj3tyhbjb",
    geminiRcaGroupKeyHint:
      "Access Context Manager API を直接呼び出し、指定したグループのみに Gemini Enterprise アプリのアクセスレベルを直接バインドします（GCP 管理者のコンソールロックアウトや VPC-SC ペリメーター競合を回避可能）。",
    geminiRcaBindingLabel: "RCA Cloud Binding",
    geminiRcaCliTitle: "Restricted Client Application (RCA) gcloud コマンドスニペット",
    geminiRcaCliCopyBtn: "RCA コマンドをコピー",

    deployProgressTitle: "Chrome Enterprise Premium デプロイ進行中...",
    deployStep1: "1. 対象 OU の検証",
    deployStep2: "2. ポリシー設定の生成",
    deployStep3: "3. DLP ルール & 検出器の登録",
    deployStep4: "4. 完了 & 証跡の記録",

    rollbackProgressTitle: "ロールバック実行中...",
    rollbackStep1: "1. ロールバック対象の特定",
    rollbackStep2: "2. サブ OU ポリシーの初期化",
    rollbackStep3: "3. DLP ルール & レベルの解除",
    rollbackStep4: "4. ロールバック完了",

    roleProgressTitle: "Workspace 管理者ロールの作成・アサイン中...",
    roleStep1: "1. ディレクトリ権限の確認",
    roleStep2: "2. CEP PoC 運用・監査ロールの作成",
    roleStep3: "3. 対象管理者への権限アサイン",
    roleStep4: "4. 権限設定完了",

    licenseProgressTitle: "試用ライセンスの割り当て中...",
    licenseStep1: "1. 対象 OU ユーザーの取得",
    licenseStep2: "2. Chrome Enterprise ライセンスの割り当て",
    licenseStep3: "3. ライセンス適用完了",
    // Error Diagnostic Resolver
    errDiagIamTitle: "Google Cloud IAM 権限不足",
    errDiagIamCause: "現在の Google アカウントに Access Context Manager または Google Cloud 組織レベルの権限（例: roles/accesscontextmanager.policyAdmin）が付与されていません。",
    errDiagIamRemediation: "組織の特権管理者に roles/accesscontextmanager.policyAdmin ロールの付与を依頼するか、以下のコマンドを管理者アカウントで実行してください。",
    errDiagIamConsoleLink: "Google Cloud IAM コンソールを開く",
    errDiagWorkspaceTitle: "Google Workspace 特権管理者権限が必要",
    errDiagWorkspaceCause: "サインイン中のアカウントに Workspace 特権管理者（Super Admin）権限がないか、サードパーティ API クライアント アクセスが管理コンソールで制限されています。",
    errDiagWorkspaceRemediation: "Google Workspace の特権管理者アカウントでサインインし直すか、管理コンソール（admin.google.com）で Admin SDK へのアクセスを承認してください。",
    errDiagWorkspaceConsoleLink: "Workspace 管理ロール画面を開く",
    errDiagVpcScConflictTitle: "VPC Service Controls 境界の競合・重複所属",
    errDiagVpcScConflictCause: "対象の Google Cloud プロジェクトはすでに別の VPC サービス境界に所属しているか、同名の境界が既に存在します。",
    errDiagVpcScConflictRemediation: "検証専用の独立した別プロジェクトを指定するか、Google Cloud コンソールから既存の境界に Discovery Engine API を追加してください。",
    errDiagVpcScConsoleLink: "VPC Service Controls コンソールを開く",
    errDiagOuConfirmTitle: "対象 OU パスの一致確認エラー",
    errDiagOuConfirmCause: "上位組織やルート OU への誤適用事故を防止するため、対象 OU のフルパスを手動入力して完全一致させる必要があります。",
    errDiagOuConfirmRemediation: "画面に表示されている対象 OU のパスを正確にコピーし、確認入力欄に貼り付けてください。",
    errDiagRateLimitTitle: "Google Cloud API レートリミット制限 (429)",
    errDiagRateLimitCause: "Cloud Identity または Resource Manager API のリクエスト頻度が上限（1 QPS）を超過しました。",
    errDiagRateLimitRemediation: "SGS は自動バックオフ機能を備過しています。10〜30 秒待機してから [再試行] ボタンを押すと成功します。",
    errDiagWorkerTitle: "Chrome 拡張機能バックグラウンドワーカーの一時休止",
    errDiagWorkerCause: "Chrome ブラウザの省電力機能により Service Worker が休止状態になったか、拡張機能がリロードされました。",
    errDiagWorkerRemediation: "下の [再試行] ボタンを押すか、拡張機能の管理画面からページを再読み込みしてください。",
    errDiagProjectNoOrgTitle: "Google Cloud プロジェクトが組織に未所属",
    errDiagProjectNoOrgCause: "Access Context Manager および VPC Service Controls は、Google Cloud 組織（Organization）に属するプロジェクトでのみ動作します。",
    errDiagProjectNoOrgRemediation: "スタンドアロンの個人プロジェクトではなく、企業組織配下の GCP プロジェクトを選択してください。",
    errDiagPolicyNotFoundTitle: "Access Context Manager ポリシー未検出",
    errDiagPolicyNotFoundCause: "組織内に Access Policy が作成されていないか、デフォルトのポリシー ID を自動取得できませんでした。",
    errDiagPolicyNotFoundRemediation: "Access Context Manager コンソールでポリシーを新規作成するか、ポリシー ID を手動入力してください。",
    errDiagPolicyConsoleLink: "Access Context Manager コンソールを開く",
    errDiagOuStaleTitle: "対象組織部門 (OU) が見つからないか変更されています",
    errDiagOuStaleCause: "選択された組織部門 (OU) の ID が存在しないか、Google Workspace のディレクトリ構成が更新されました。",
    errDiagOuStaleRemediation: "「OU リストを再読込」をクリックして組織ツリーを更新し、対象の組織部門を再選択してください。",
    errDiagRootOuForbiddenTitle: "ルート組織部門 (Root OU) への適用は禁止されています",
    errDiagRootOuForbiddenCause: "Google Workspace の最上位ルート組織部門 (/) への直接適用は、ドメイン全体の全ユーザーに影響を与えるため安全上ブロックされています。",
    errDiagRootOuForbiddenRemediation: "検証用またはパイロット対象の配下組織部門 (子 OU) を選択してください。",
    errDiagScopeInvalidTitle: "無効な Workspace 顧客識別子または組織スコープ",
    errDiagScopeInvalidCause: "有効な Workspace Customer ID および対象の組織部門 ID が指定されていないか、形式が不正です。",
    errDiagScopeInvalidRemediation: "デプロイ設定の Workspace Customer ID を確認し、対象の組織部門が正しく選択されていることを確認してください。",
    errDiagProjectRequiredTitle: "Google Cloud プロジェクト ID が未指定です",
    errDiagProjectRequiredCause: "Access Context Manager、VPC Service Controls、または IAM 設定には Google Cloud プロジェクト ID が必須です。",
    errDiagProjectRequiredRemediation: "設定入力欄に有効な Google Cloud プロジェクト ID を入力または選択してください。",
    errDiagGeminiTitle: "Gemini Enterprise / Discovery Engine へのアクセスが拒否されました",
    errDiagGeminiCause:
      "Gemini Enterprise (vertexaisearch.cloud.google.com または discoveryengine.googleapis.com) へのアクセスが、ACM アクセスレベルまたは VPC-SC サービス境界によって遮断されました。現在のブラウザが管理対象 Chrome（BROWSER_MANAGED）ではないか、GCP 管理者が未管理端末から Cloud Console に接続しています。",
    errDiagGeminiRemediation:
      "組織の管理対象 Chrome ブラウザからアクセスしてください。GCP 管理者がコンソールにアクセスする場合は、管理対象端末から接続するか、Ingress 例外ルールまたは Approach 2 (RCA) のグループ限定バインドを設定してください。",
    errDiagGeminiConsoleLink: "Gemini Enterprise / Vertex AI Search コンソールを開く",
    geminiConfirmProjectLabel: "プロジェクト ID の確認入力（厳格適用セーフガード）",
    geminiConfirmProjectHint: "厳格モードで Gemini Enterprise のサービス境界とアクセスレベルを強制適用するには、対象プロジェクト ID を再入力してください。",
    geminiConfirmProjectMismatch: "厳格適用を行うには、対象プロジェクト ID を正確に入力してください。",
    errDiagGenericTitle: "処理中にエラーが発生しました",
    errDiagGenericCause: "処理の実行中に予期しないエラーが返されました。",
    errDiagGenericRemediation: "以下の技術詳細を確認し、API の有効化状況およびネットワーク接続を確認してください。",
    errDiagCauseLabel: "発生原因:",
    errDiagRemediationLabel: "推奨される修復手順:",
    errDiagCommandHeader: "修復用コマンド / 権限付与依頼テンプレート:",
    errDiagRetryBtn: "操作を再試行",
    errDiagRawDetails: "技術詳細ログ（デバッグ用）",

    // Security Assessment & Policy Recommender
    assessOpenBtn: "🛡️ セキュリティ要件・ポリシー構成ウィザード",
    assessModalTitle: "🛡️ セキュリティ要件・ポリシー構成ウィザード",
    assessModalSubtitle: "組織が直面しているセキュリティ課題や端末保護の要件を選択してください。課題に対応する Chrome Enterprise Premium のポリシー構成（DLP・アクセス制御）を設定します。",
    assessPresetLabel: "クイック一括選択",
    assessPresetGenAi: "生成AI安全活用 & 漏洩防止",
    assessPresetCost: "脱VDI・脱CASB コスト最適化",
    assessPresetRemote: "リモートワーク・BYOD対策",
    assessPresetAll: "エンタープライズ最高水準 (全選択)",
    assessPresetClear: "クリア",
    assessGroupGenAi: "生成AI & クラウドデータ保護",
    assessGroupPosture: "端末ポスチャ & リモートアクセス",
    assessGroupSaas: "SaaS保護 & ゼロトラスト移行",
    assessGroupCost: "コスト削減 & エージェント軽量化",
    assessQ1Title: "生成AI（ChatGPT, Gemini等）や外部Webへの機密コピペ・プロンプト漏洩防止",
    assessQ1Risk: "従業員が生成AIにソースコードや顧客情報をペーストして情報流出する懸念がある",
    assessQ1Solution: "Chrome Enterprise DLP によるクリップボード貼り付け (Paste) リアルタイム検査・ブロック & 警告",
    assessQ2Title: "個人情報（マイナンバー・顧客名簿）のWebダウンロード・アップロード制限",
    assessQ2Risk: "SaaSやWebアプリから個人情報CSVを私用PCやクラウドにダウンロードされるリスク",
    assessQ2Solution: "マイナンバー、クレジットカード番号、個人情報ファイルのWebアップロード・ダウンロード即時遮断",
    assessQ3Title: "機密画面の印刷制限 ＆ 画面キャプチャ抑止（動的電子透かし表示）",
    assessQ3Risk: "重要顧客情報や設計図面を印刷・画面撮影して社外へ持ち出されるリスク",
    assessQ3Solution: "Web画面印刷のブロック、およびブラウザ表示面へのユーザー名・日時・会社名の動的電子透かし強制表示",
    assessQ4Title: "社外ネットワーク・私用端末(BYOD)からのSaaSアクセス制御",
    assessQ4Risk: "在宅勤務や出張先から未承認PCでSaaSにアクセスされ、マルウェア感染やデータ漏洩の恐れ",
    assessQ4Solution: "Context-Aware Access (CAA) により、組織管理対象ブラウザ（BROWSER_MANAGED）のみアクセス認可",
    assessQ5Title: "OSバージョン未更新・ディスク未暗号化端末のアクセス遮断",
    assessQ5Risk: "パッチ未適用の脆弱な端末が社内システムに接続しランサムウェアの侵入口になる",
    assessQ5Solution: "Endpoint Verification デバイスポスチャ連携による OS バージョン、ディスク暗号化、画面ロック必須化",
    assessQ6Title: "端末電子証明書による正規会社支給PCの厳格な特定",
    assessQ6Risk: "ID/パスワードの漏洩により、第三者が不正な端末からログインするリスク",
    assessQ6Solution: "Chrome 証明書ストアと連携したクライアント電子証明書（mTLS）検証による会社支給端末の厳格特定",
    assessQ7Title: "Google Workspace / M365 / Salesforceへのアクセス認可厳格化",
    assessQ7Risk: "重要SaaSへのログインがID/PWや通常MFAのみで、セッションハイジャックに脆弱",
    assessQ7Solution: "Chrome Enterprise と Google Cloud Access Context Manager (ACM) の連動による多層ゼロトラスト認可",
    assessQ8Title: "地理的アクセス制御（海外・不審IPからの不正アクセス遮断）",
    assessQ8Risk: "海外拠点や不審なIP範囲からの不正アクセス試行をリアルタイムに検知・防御したい",
    assessQ8Solution: "IP 範囲・国・地域ポリシーに基づくアクセス拒否とセキュリティアラート自動発行",
    assessQ9Title: "VPNレス直接セキュア接続（ゼロトラストアクセス）への移行ニーズ",
    assessQ9Risk: "全社員のVPN集中による通信帯域逼迫、障害多発、GW保守費用の高騰に悩んでいる",
    assessQ9Solution: "Chrome + Cloud Secure Web Gateway (SWG) による安全な直接インターネットブレイクアウト (脱VPN)",
    assessQ10Title: "悪意ある拡張機能（Extension）の検知・強制アンインストール",
    assessQ10Risk: "従業員が非公認の危険なブラウザ拡張機能を導入し情報が詐取されるリスク",
    assessQ10Solution: "拡張機能の完全ホワイトリスト管理（未承認拡張の即時ブロック & 会社承認拡張の自動配信）",
    assessQ11Title: "セキュリティ監査ログの長期保管 ＆ SIEM/BigQuery即時連携",
    assessQ11Risk: "セキュリティ事故発生時にインシデント調査を行うためのブラウザ操作ログが不足",
    assessQ11Solution: "Chrome 監査ログ（ファイル操作・URL訪問・DLP違反・拡張機能イベント）の Google Cloud Logging & BigQuery 即時連携",
    assessQ12Title: "ゼロデイ脆弱性パッチの即時配信 ＆ バージョン固定管理",
    assessQ12Risk: "Chromiumゼロデイ発覚時に手動パッチ当てが追いつかず、脆弱性放置の空白期間が発生",
    assessQ12Solution: "Chrome 自動サイレントアップデート機能による数日以内のゼロデイパッチ自動適用",
    assessQ13Title: "高額なCASB/SWG（Netskope/Zscaler等）のライセンス見直し",
    assessQ13Risk: "CASBやプロキシ製品に年間数千万円〜数億円規模のライセンス料を支払っている",
    assessQ13Solution: "Chrome Enterprise Premium のブラウザネイティブ DLP ＆ Google Cloud SWG 統合による CASB 置換（コスト削減）",
    assessQ14Title: "画面転送VDI（Citrix/VMware）のサーバー更新・維持費削減",
    assessQ14Risk: "次回のVDIハードウェア更新で億単位の費用が見積もられており、脱VDIを模索中",
    assessQ14Solution: "セキュアエンタープライズブラウザによるローカルセキュアワークスペース化（脱VDI・DaaS費用の 80% 以上削減）",
    assessQ15Title: "多層エンドポイントエージェント乱立による端末負荷の解消",
    assessQ15Risk: "EDR、資産管理、暗号化ソフトの多重常駐でPCが重く、職員からの苦情が絶えない",
    assessQ15Solution: "エージェント追加不要（Chrome ブラウザ単体）で DLP、SWG、認証、監査ログが完結するゼロエージェント運用",
    assessDefaultDlpCustomMessage: "社内セキュリティポリシーにより、機密データの外部送信・コピペは制限されています。業務上の例外申請が必要な場合はセキュリティ管理者へお問い合わせください。",
    assessRecHeader: "選定されたポリシー構成",
    assessRecDlpHeader: "🛡️ DLP (データ損失防止) マトリクス設定:",
    assessRecModulesHeader: "📦 構成モジュール設定:",
    assessRoiHeader: "期待される効果と改善項目:",
    assessRoiCostTitle: "ライセンスおよびインフラ運用の効率化",
    assessRoiCostDesc: "サードパーティ CASB/SWG 機能のブラウザ統合や、VDI 環境のブラウザ移行によるコスト最適化を図ります。",
    assessRoiPerfTitle: "端末エージェントの集約と負荷軽減",
    assessRoiPerfDesc: "常駐エージェントの追加を伴わずにブラウザ標準機能で制御を完結し、端末パフォーマンスへの影響を抑えます。",
    assessRoiSecurityTitle: "生成 AI および Web からの情報漏洩抑止",
    assessRoiSecurityDesc: "Web サービスへの機密データ送信、ダウンロード、画面キャプチャを電子透かしやポリシーで制御します。",
    assessApplyRecBtn: "この構成を PoC 設定に反映する",
    assessAppliedBanner: "✓ 選択した要件に基づき、ポリシー構成および DLP マトリクスを反映しました。",
    geminiArchDetailsToggle: "🛡️ 3層セキュリティ境界アーキテクチャ・CLI コマンドの解説を見る",
    assessShowDetails: "📄 現場リスク・解決策の詳細を表示",
    assessHideDetails: "詳細を折りたたむ",
  },
};

export function getMessages(locale: Locale): Messages {
  return locale === "ja" ? ja : en;
}

