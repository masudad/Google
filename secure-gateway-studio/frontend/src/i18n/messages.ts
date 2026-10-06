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
  cloudRequiredRolesTitle: string;
  cloudRequiredRoles: readonly string[];
  workspaceRequiredRolesTitle: string;
  workspaceRequiredRoles: readonly string[];
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
  cloudStep1Label: string;
  cloudStep2Label: string;
  cloudStep2DeferHint: string;
  cloudStep3Label: string;
  customerIdAutoHint: string;
  resolveSampleImageQuick: string;
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
  networkHttpsCategoryLabel: string;
  networkHttpCategoryLabel: string;
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
  directLaunchSampleVmCheckbox: string;
  directLaunchSampleVmDescription: string;
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
  accessOuVsPrincipalNotice: string;
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
  gateDetail: (gateId: string, status: string, detail: string) => string;
  openChromeRootStoreConsole: string;
  reviewDeployerSaTitle: string;
  reviewDeployerSaPendingDesc: string;
  reviewDeployerSaReadyDesc: string;
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
  preflightStage5Detail: string;
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
  recallCardTitle: string;
  recallCardIntro: string;
  recallIntoWizardButton: string;
  recallCopyJsonButton: string;
  recallCopiedBadge: string;
  recallDownloadJsonButton: string;
  recallExcludedLabel: string;
  recallExcludedValue: string;
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
  recallCardTitle: string;
  recallCardIntro: string;
  recallIntoWizardButton: string;
  recallCopyJsonButton: string;
  recallCopiedBadge: string;
  recallDownloadJsonButton: string;
  recallExcludedLabel: string;
  recallExcludedValue: string;
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

export interface EasyPocGuideMessages {
  eyebrow: string;
  title: string;
  intro: string;
  pocNoticeTitle: string;
  pocNoticeBody: string;
  quickOverviewTitle: string;
  scenariosTitle: string;
  scenariosIntro: string;
  scopeTag: string;
  targetLabel: string;
  authRequirementLabel: string;
  scenarios: readonly {
    eyebrow: string;
    title: string;
    summary: string;
    estimatedTime: string;
    targetScope: string;
    authRequirement: string;
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
  steps: readonly GuideStep[];
  faqTitle: string;
  faqIntro: string;
  faqEyebrow: string;
  faqs: readonly GuideFaqItem[];
}

export interface GuideMessages {
  portalEyebrow: string;
  portalTitle: string;
  portalIntro: string;
  beginnerNavLabel: string;
  beginnerEyebrow: string;
  beginnerTitle: string;
  beginnerIntro: string;
  beginnerPillars: readonly {
    badge: string;
    title: string;
    analogy: string;
    description: string;
    whereUrl: string;
  }[];
  stepZeroEyebrow: string;
  stepZeroTitle: string;
  stepZeroIntro: string;
  stepZeroChecklist: readonly {
    stepBadge: string;
    title: string;
    summary: string;
    details: readonly string[];
  }[];
  glossaryEyebrow: string;
  glossaryTitle: string;
  glossaryIntro: string;
  glossaryTermHeader: string;
  glossaryAnalogyHeader: string;
  glossaryMeaningHeader: string;
  glossaryItems: readonly {
    term: string;
    analogy: string;
    meaning: string;
  }[];
  sharedAuthTitle: string;
  sharedAuthIntro: string;
  sharedAuthItems: readonly {
    label: string;
    detail: string;
  }[];
  easyPocTabLabel: string;
  easyPocTabSubtitle: string;
  sgwTabLabel: string;
  sgwTabSubtitle: string;
  openEasyPocCta: string;
  openSgwDeployerCta: string;
  easyPocGuide: EasyPocGuideMessages;
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
  topbarAuth: {
    cloudPopoverTitle: string;
    cloudPopoverDesc: string;
    cloudProjectIdLabel: string;
    cloudProjectIdPlaceholder: string;
    cloudOperatorLabel: string;
    cloudVerifyBtn: string;
    cloudVerifyingBtn: string;
    cloudBootstrapBtn: string;
    cloudBootstrappingBtn: string;
    cloudSharedNote: string;
    workspacePopoverTitle: string;
    workspacePopoverDesc: string;
    workspaceSignInBtn: string;
    workspaceSigningInBtn: string;
    workspaceReverifyBtn: string;
    workspaceCustomerIdLabel: string;
    workspaceAdminLabel: string;
    workspaceSharedNote: string;
    sharedHeaderConnectedBanner: string;
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
  autoDetectCustomerIdBtn: string;
  autoDetectingCustomerIdBtn: string;
  googleAccountVerifiedBanner: (customerId: string, ouCount: number, groupCount: number) => string;
  dlpMatrixCustomizePrefix: string;
  dlpMatrixCustomizeMiddle: string;
  dlpMatrixCustomizeSuffix: string;
  verifyGoogleAccount: string;
  verifyingGoogleAccount: string;
  verifyGoogleAccountHint: string;
  retry: string;
  refreshOus: string;
  reloading: string;
  createPilotOuLabel: string;
  createPilotOuPlaceholder: string;
  createPilotOuBtn: string;
  creatingPilotOuBtn: string;
  createPilotOuHint: string;
  pilotOuCreatedBanner: (ouPath: string) => string;
  autoCreateSubOus: string;
  autoCreateSubOusHint: string;
  presetsTitle: string;
  presetsSubtitle: string;
  presetFullPoc: string;
  presetFullPocDesc: string;
  presetAiProtection: string;
  presetAiProtectionDesc: string;
  presetPersonalAccount: string;
  presetPersonalAccountDesc: string;
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
  accessLevelAutoCorpOwned: string;
  accessLevelAutoByod: string;
  accessLevelAutoAndroidByod: string;
  accessLevelAutoIosByod: string;
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
  rolesScopeManualChecklistTitle: string;
  rolesScopeManualChecklistDesc: string;
  rolesScopeManualSteps: readonly string[];
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

  dlpEnvBuilderTitle: string;
  dlpEnvBuilderSubtitle: string;
  dlpEnvCorpPc: string;
  dlpEnvByodPc: string;
  dlpEnvCorpAndroid: string;
  dlpEnvCorpIos: string;
  dlpEnvByodAndroid: string;
  dlpEnvByodIos: string;
  dlpEnvApplyBtn: string;
  dlpEnvSummaryNotice: string;

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
  dlpRowAndroidByod: string;
  dlpRowAndroidByodDesc: string;
  dlpRowIosByod: string;
  dlpRowIosByodDesc: string;
  dlpRowWatermark: string;
  dlpRowWatermarkDesc: string;
  dlpRowGenAiBlock: string;
  dlpRowGenAiBlockDesc: string;

  dlpScopeAll: string;
  dlpScopeByodOnly: string;
  dlpScopeSelectByodOnly: string;
  dlpScopeSelectCorpOnly: string;
  dlpScopeSelectDesktopByod: string;
  dlpScopeSelectMobileByod: string;
  dlpScopeSelectAndroidByod: string;
  dlpScopeSelectIosByod: string;
  dlpScopeSelectAndroidAll: string;
  dlpScopeSelectIosAll: string;
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
  dlpPresetByodMobile: string;
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
  projectIdOptionalLabel: string;
  projectIdOptionalHint: string;
  projectIdOptionalPlaceholder: string;
  statusLogApiCallCount: (count: number) => string;
  assessStatusWatermarkOn: string;
  assessStatusEnabled: string;
  assessStatusDisabled: string;
  assessStatusAllowlistManaged: string;
  assessStatusCloudLogging: string;
  assessStatusVpcScProtected: string;
  assessStatusStandard: string;
  assessSelectedCountSuffix: string;
  dlpRegionJapanLabel: string;
  dlpPresetsLabel: string;
  httpHeadersTitle: string;
  httpHeadersSubtitle: string;
  httpHeadersPresetLabel: string;
  httpHeadersAddCustomBtn: string;
  httpHeadersEmptyHint: string;
  httpHeadersRemoveRuleBtn: string;
  httpHeadersPatternsLabel: string;
  httpHeadersTenantValueLabel: string;
  httpHeadersNameLabel: string;
  httpHeadersValueLabel: string;
  httpHeadersBoxNote: string;
  httpHeadersM365ContextLabel: string;
}

function friendlyDiagnosticTarget(raw: string, locale: Locale): string {
  const known: Record<string, { en: string; ja: string }> = {
    "cloud-billing": {
      en: "Cloud Billing API",
      ja: "Cloud Billing API",
    },
    "service-usage": {
      en: "Service Usage API",
      ja: "Service Usage API",
    },
    "project-permissions": {
      en: "Google Cloud project IAM permissions",
      ja: "Google Cloud プロジェクト IAM 権限",
    },
    "upstream-project-permissions": {
      en: "Upstream Google Cloud project IAM permissions",
      ja: "アップストリーム Google Cloud プロジェクト IAM 権限",
    },
    "target-ou-invalid": {
      en: "Target organizational unit",
      ja: "対象の組織部門",
    },
    "chrome-policy": {
      en: "Chrome Policy API",
      ja: "Chrome Policy API",
    },
    "chrome-group-policy": {
      en: "Chrome Group Policy API",
      ja: "Chrome グループポリシー API",
    },
    "chrome-root-store": {
      en: "Chrome Root Store policy",
      ja: "Chrome Root Store ポリシー",
    },
    "secretmanager.googleapis.com": {
      en: "Secret Manager API",
      ja: "Secret Manager API",
    },
    "compute.googleapis.com": {
      en: "Compute Engine API",
      ja: "Compute Engine API",
    },
    "dns.googleapis.com": {
      en: "Cloud DNS API",
      ja: "Cloud DNS API",
    },
    "beyondcorp.googleapis.com": {
      en: "Cloud BeyondCorp API",
      ja: "Cloud BeyondCorp API",
    },
    "privateca.googleapis.com": {
      en: "Certificate Authority Service API",
      ja: "Certificate Authority Service API",
    },
    "iam.googleapis.com": {
      en: "IAM API",
      ja: "IAM API",
    },
  };
  if (known[raw]) return known[raw][locale];
  if (raw.startsWith("secretmanager:secret_iam:")) {
    const name = raw.slice("secretmanager:secret_iam:".length);
    return locale === "ja"
      ? `Secret Manager IAM ポリシー: ${name}`
      : `Secret Manager IAM policy: ${name}`;
  }
  if (raw.startsWith("secretmanager:secret_version:")) {
    const name = raw.slice("secretmanager:secret_version:".length);
    return locale === "ja"
      ? `Secret Manager バージョン: ${name}`
      : `Secret Manager secret version: ${name}`;
  }
  if (raw.startsWith("secretmanager:secret:")) {
    const name = raw.slice("secretmanager:secret:".length);
    return locale === "ja"
      ? `Secret Manager シークレット: ${name}`
      : `Secret Manager secret: ${name}`;
  }
  if (raw.startsWith("compute:")) {
    const name = raw.slice("compute:".length);
    return locale === "ja" ? `Compute Engine リソース: ${name}` : `Compute Engine resource: ${name}`;
  }
  if (raw.startsWith("beyondcorp:")) {
    const name = raw.slice("beyondcorp:".length);
    return locale === "ja" ? `Secure Gateway リソース: ${name}` : `Secure Gateway resource: ${name}`;
  }
  if (raw.startsWith("dns:")) {
    const name = raw.slice("dns:".length);
    return locale === "ja" ? `Cloud DNS リソース: ${name}` : `Cloud DNS resource: ${name}`;
  }
  if (raw.startsWith("iam:")) {
    const name = raw.slice("iam:".length);
    return locale === "ja" ? `IAM サービスアカウント: ${name}` : `IAM service account: ${name}`;
  }
  if (raw.startsWith("accesscontextmanager:")) {
    return locale === "ja"
      ? "Access Context Manager アクセスレベル"
      : "Access Context Manager access level";
  }
  return raw;
}

function formatDiagnosticMessage(locale: Locale, code: string, fallback: string): string {
  if (code === "legacy-pac-policy-detected") {
    return locale === "ja"
      ? "親OUから継承した旧PACポリシーがこのテストOUで有効です。"
      : "An inherited legacy PAC policy is active on this test OU.";
  }
  if (code === "chrome-extension-group-policy-conflict") {
    return locale === "ja"
      ? "Chromeのグループポリシーが対象OUのSecure Enterprise Browser設定を上書きしています。"
      : "A Chrome group policy overrides the target OU's Secure Enterprise Browser setting.";
  }
  if (code === "invalid-chrome-managed-configuration") {
    return locale === "ja"
      ? "対象OUのChrome拡張機能設定が有効なJSON形式ではありません。"
      : "The Chrome extension configuration in the target OU is not valid JSON.";
  }
  if (code === "billing-disabled") {
    return locale === "ja"
      ? "対象プロジェクトに有効なCloud Billing請求先アカウントが紐付いていません。"
      : "The deployment project has no active billing association.";
  }
  if (code === "workspace-oauth-required" && locale === "ja") {
    return "サービスアカウントのChrome管理者ロール確認が必要です。";
  }
  if (code === "chrome-enterprise-premium-license-not-detected" && locale === "ja") {
    return "Chrome Enterprise Premiumのユーザー割り当てが検出されませんでした。";
  }
  if (code === "chrome-enterprise-premium-manual-confirmation" && locale === "ja") {
    return "Chrome Enterprise Premiumの利用権をAPIで自動確認できませんでした。";
  }
  if (code === "managed-certificate-rotation-required" && locale === "ja") {
    return "管理対象TLS証明書がローテーション期間に入っています。";
  }
  if (code === "api-unavailable") {
    const plannedMatch = fallback.match(
      /^([^ ]+) is currently disabled in the project and will be enabled during Apply:/,
    );
    if (plannedMatch?.[1]) {
      const target = friendlyDiagnosticTarget(plannedMatch[1], locale);
      return locale === "ja"
        ? `${target} は未有効です。Apply実行時に自動で有効化されます。`
        : `${target} is not enabled yet and will be enabled automatically during Apply.`;
    }
    const inspectMatch = fallback.match(/^([^ ]+) could not be inspected: ([\s\S]+)$/);
    if (inspectMatch?.[1] && inspectMatch[2]) {
      const target = friendlyDiagnosticTarget(inspectMatch[1], locale);
      const detail = inspectMatch[2];
      if (
        detail.includes("(SERVICE_DISABLED)") ||
        /API has not been used in project [^\s]+ before or it is disabled/i.test(detail)
      ) {
        return locale === "ja"
          ? `${target} がこのプロジェクトで無効化されています。`
          : `${target} is disabled in this project.`;
      }
      if (detail.includes("Chrome managed configuration is not valid JSON")) {
        return locale === "ja"
          ? "対象OUのChrome拡張機能設定が有効なJSON形式ではありません。"
          : "The Chrome extension configuration in the target OU is not valid JSON.";
      }
      return locale === "ja"
        ? `${target} の状態を確認できませんでした。`
        : `Could not inspect ${target}.`;
    }
  }
  return fallback;
}

function formatDiagnosticRemediation(
  locale: Locale,
  code: string,
  fallback: string | null,
): string {
  if (code === "legacy-pac-policy-detected") {
    return locale === "ja"
      ? "Applyでは選択したテストOUだけを上書きし、親OUと既存PACは変更しません。"
      : "Apply overrides only the selected test OU; the parent OU and existing PAC file are unchanged.";
  }
  if (code === "chrome-extension-group-policy-conflict") {
    return locale === "ja"
      ? "該当グループの［アプリと拡張機能］で不整合な設定を削除するか、テストOUと同じ設定に揃えてください。"
      : "Remove the conflicting group extension config or match it to the test OU.";
  }
  if (code === "invalid-chrome-managed-configuration") {
    return locale === "ja"
      ? "Apply実行時に、対象OUの拡張機能設定を承認済みJSON構成で上書きします。"
      : "Apply will replace the target OU's extension config with the approved JSON payload.";
  }
  if (code === "billing-disabled" && locale === "ja") {
    return "Apply前にプロジェクトへ有効な請求先アカウントをリンクしてください。";
  }
  if (code === "workspace-oauth-required" && locale === "ja") {
    return "テストOUに対するChrome管理者ロールを付与し、Chrome Policy APIアクセスを確認してください。";
  }
  if (code === "chrome-enterprise-premium-license-not-detected" && locale === "ja") {
    return "対象ユーザーへのCEPライセンス割り当てまたはドメイン全体の利用権を確認してください。";
  }
  if (code === "chrome-enterprise-premium-manual-confirmation" && locale === "ja") {
    return "管理コンソールで対象ユーザーのライセンスまたはドメイン全体の利用権を確認してください。";
  }
  if (code === "managed-certificate-rotation-required" && locale === "ja") {
    return "証明書発行とSecret Managerのローテーションを承認してください。";
  }
  if (code === "api-unavailable" && locale === "ja") {
    const raw = fallback ?? "";
    const urlMatch = raw.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/[^\s,)]+/i);
    if (raw.includes("serviceusage:project_services:required-apis")) {
      return urlMatch
        ? `Applyの最初のステップで自動有効化されます。事前確認で検査する場合は ${urlMatch[0]} で有効化してください。`
        : "Applyの最初のステップで自動的に有効化されます。";
    }
    if (urlMatch) {
      return `${urlMatch[0]} でAPIを有効化してから事前確認を再実行してください。`;
    }
    if (raw.includes("Chrome Policy API")) {
      return "Chrome Policy APIの有効化と、管理者の対象OU・グループ読み取り権限を確認してください。";
    }
    if (raw === "Confirm the API is enabled and the deployer has read access.") {
      return "対象APIの有効化とデプロイヤーSAの読み取り権限を確認してください。";
    }
  }
  return fallback ?? "";
}

function formatGateDetail(
  locale: Locale,
  gateId: string,
  status: string,
  detail: string,
): string {
  if (locale !== "ja") {
    return detail;
  }
  if (gateId === "chrome-root-store") {
    if (detail.includes("Could not inspect Chrome Root Store policy")) {
      return "Chrome Root Store ポリシーの状態をAPIで確認できませんでした。Apply完了後に公開ルートPEMをダウンロードし、Google管理コンソール [Chrome] > [コネクタ] > [Chrome Root Store] でテスト用OUへ手動登録してください。";
    }
    if (detail.includes("Direct HTTPS uses a private CA")) {
      return "直接HTTPS接続でプライベートCA証明書を使用します。発行元ルートCAの公開PEMを、Google管理コンソール [Chrome] > [コネクタ] > [Chrome Root Store] でテスト用OUへ登録してください。";
    }
    return "ローカルPoC CAを使用します。Apply完了後にステップ7で公開ルートPEMをダウンロードし、Google管理コンソール [Chrome] > [コネクタ] > [Chrome Root Store] でテスト用OUへ手動登録してください。";
  }
  if (gateId === "endpoint-verification") {
    if (status === "planned") {
      return "対象テストOUで Endpoint Verification が未設定のため、承認済みApplyで自動配信します。";
    }
    return "対象テストOUで Endpoint Verification の収集を有効化するよう手動確認が必要です。";
  }
  if (gateId === "required-apis") {
    const match = detail.match(/:\s*(.+)$/);
    const apis = match?.[1] ?? "";
    if (status === "planned") {
      return apis
        ? `未有効の必須APIを承認済みApplyで自動有効化します: ${apis}`
        : "未有効の必須APIを承認済みApplyで自動有効化します。";
    }
    return apis
      ? `必須APIが不足しています: ${apis}`
      : "必須APIの有効状態を確認できませんでした。";
  }
  if (gateId === "apply-permissions") {
    if (detail.startsWith("Verified after required API enablement")) {
      return "必須APIの自動有効化後にIAM権限を検証します。";
    }
    if (detail.startsWith("Requires active Google Cloud identity")) {
      return "Google Cloud の認証情報が必要です。";
    }
  }
  if (gateId === "enterprise-license") {
    if (detail.includes("Confirmed manually by administrator")) {
      return "Chrome Enterprise Premium の利用権を管理者が手動確認しました。";
    }
    return "対象ユーザーへの Chrome Enterprise Premium ライセンス割り当てを確認できませんでした。ステップ5で割り当て状況を確認してください。";
  }
  if (gateId === "workspace-services") {
    return "対象ユーザーの追加GoogleサービスとGoogle Cloudアクセスが有効であることをステップ5で確認してください。";
  }
  if (gateId === "managed-chrome-profile") {
    if (detail.startsWith("Target test OU is configured")) {
      return "対象テストOUは設定済みです。管理対象Chromeプロファイルの初回ポリシー同期を待っています。";
    }
    return "対象テストOUで管理対象Chromeプロファイルのポリシー同期を確認できませんでした。";
  }
  if (gateId === "secure-enterprise-browser-client") {
    if (status === "planned") {
      return "承認済みApplyで対象テストOUへ Secure Enterprise Browser 拡張機能を強制インストールします。";
    }
    if (detail.includes("Group policy conflict")) {
      return "グループポリシーの拡張機能設定が対象テストOUの Secure Enterprise Browser 設定と競合しています。";
    }
    return "対象テストOUの Secure Enterprise Browser 拡張機能設定を確認してください。";
  }
  if (gateId === "global-access") {
    if (status === "planned") {
      return "承認済みApplyで対象テストOUの Global Access ルーティングを有効化します。";
    }
    return "対象テストOUの Global Access 設定を確認してください。";
  }
  if (gateId === "private-egress") {
    if (status === "planned") {
      return "承認済みApplyで専用VPCに Cloud Router と Cloud NAT を自動作成します。";
    }
    return "既存VPCから対象サブネットのプライベート送信経路 Cloud NAT または カスタムデフォルトルート を確認できませんでした。";
  }
  if (gateId === "backend-connectivity") {
    return "既存バックエンドへのプライベート経路、DNS解決、ファイアウォール許可の設定確認が必要です。";
  }
  if (gateId === "immutable-image") {
    return "サンプルVM用のバージョン固定 Compute Engine OSイメージを確認できませんでした。";
  }
  if (gateId === "billing-enabled") {
    return "対象プロジェクトで有効な Cloud Billing 請求先アカウントを確認できませんでした。";
  }
  if (gateId === "test-ou") {
    return "非本番の専用テストOUを選択し、ステップ5で確認チェックを入れてください。";
  }
  if (gateId === "group-policy-discovery") {
    return "Chrome グループポリシーの読み取り結果を確認してください。";
  }
  if (gateId === "cloud-identity") {
    return "Google Cloud の認証情報が未接続です。";
  }
  if (gateId === "workspace-identity") {
    return "Google Workspace 管理者アカウントが未接続です。";
  }
  if (gateId === "public-certificate-binding") {
    return "Secret Manager の公開TLS証明書バンドルと秘密鍵の整合性を確認してください。";
  }
  if (gateId === "resource-conflicts") {
    return "計画されたリソースと競合する既存リソースが検出されました。下の検出状態を確認してください。";
  }
  if (gateId === "human-approval") {
    return "変更内容を確認し、デプロイ実行計画を承認してください。";
  }
  return detail;
}

const en: Messages = {
  mainTitle: "Chrome Enterprise Premium PoC Deployer",
  productName: "Administrator deployment console",
  localOnly: "Runs locally",
  cloudIdentity: "Google Cloud",
  cloudProject: "Not connected",
  workspaceIdentity: "Google Workspace",
  adminEmail: "Not connected",
  help: "Help",
  signOut: "Sign Out / Reset",
  signOutConfirm: "Sign out and clear local session tokens?",
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
  modeTitle: "1. Start a Secure Gateway PoC",
  poc: "PoC",
  pocDescription:
    "Deploy to a test OU with safety gates and clean teardown.",
  production: "Production",
  productionDescription:
    "Enterprise PKI and multi-zone HA (outside PoC scope).",
  productionUnavailable: "TBD",
  platformsTitle: "Managed Chrome platforms",
  managedChromeOnly: "",
  platformNote:
    "Select platforms for acceptance testing.",
  infrastructureTitle: "2. Infrastructure strategy",
  dedicatedNetwork: "Dedicated network",
  recommended: "Standard",
  dedicatedDescription: "Create a dedicated VPC for Secure Gateway.",
  existingVpc: "Existing VPC",
  existingDescription: "Deploy into an existing VPC.",
  certificateTitle: "3. Certificate strategy",
  enterpriseCa: "Enterprise PKI / CA Service",
  enterpriseCaDescription: "Issue internal TLS certificates via Cloud CA Service.",
  publicCertificate: "Publicly trusted certificate",
  publicCertificateDescription:
    "Use a public DNS hostname and a validated Secret Manager certificate bundle.",
  localPocCa: "Local PoC CA",
  disabledProduction: "disabled in Production",
  localPocAdminConsole: "Admin console upload required",
  localPocCaDescription:
    "Generate a PoC root CA and upload the public PEM to Chrome Root Store for the test OU.",
  posture: "Deployment posture",
  mode: "Mode",
  managedPlatforms: "Managed Chrome platforms",
  platformCount: (count: number) =>
    count === 4 ? "All platforms (macOS / Windows / Linux / ChromeOS)" : `${count} platforms selected`,
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
  gateNote: "All gates must pass before Apply.",
  back: "Back",
  continue: "Continue to identities",
  noChanges: "No changes applied",
  draftSaved: "Draft saved",
  lastSaved: "Last saved",
  justNow: "just now",
  languages: { english: "English", japanese: "日本語" },
  topbarAuth: {
    cloudPopoverTitle: "Google Cloud Configuration",
    cloudPopoverDesc: "Shared across Easy PoC and Secure Gateway Deployer.",
    cloudProjectIdLabel: "Google Cloud Project ID",
    cloudProjectIdPlaceholder: "e.g. enterprise-secgw-01",
    cloudOperatorLabel: "Active Credential",
    cloudVerifyBtn: "Verify Connection",
    cloudVerifyingBtn: "Verifying…",
    cloudBootstrapBtn: "Create & Connect SGW Deployer SA",
    cloudBootstrappingBtn: "Preparing Deployer SA…",
    cloudSharedNote: "Shared across Easy PoC and Secure Gateway Deployer.",
    workspacePopoverTitle: "Google Workspace Authentication",
    workspacePopoverDesc: "Sign in once to share Customer ID, OUs, and Groups across both tools.",
    workspaceSignInBtn: "Sign in with Google",
    workspaceSigningInBtn: "Signing in…",
    workspaceReverifyBtn: "Re-verify Workspace Connection",
    workspaceCustomerIdLabel: "Customer ID",
    workspaceAdminLabel: "Signed-in Administrator",
    workspaceSharedNote: "OUs and Groups load automatically.",
    sharedHeaderConnectedBanner: "Connected via top-right header.",
  },
  workflow: {
    identitiesTitle: "Connect administrator identities",
    identitiesIntro:
      "Connect Google Cloud via keyless service-account impersonation and Google Workspace via OAuth.",
    cloudAccount: "Google Cloud deployer",
    cloudAccountDescription:
      "Discovers, plans, and applies approved GCP changes.",
    workspaceAccount: "Workspace and Chrome administrator",
    workspaceAccountDescription:
      "Reads OUs/Groups and manages Chrome policies and CEP licenses.",
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
      "Google Cloud validation failed. Check the project ID and permissions.",
    workspaceValidationFailed:
      "Workspace validation failed. Check the customer ID and admin roles.",
    workspaceRequiredRolesHint:
      "Requires Chrome Policy, OU/Group read, and License Management privileges. Cloud Identity DLP rules require a Super Admin account.",
    cloudRequiredRolesTitle: "Minimum Google Cloud Roles:",
    cloudRequiredRoles: [
      "Service Account Admin (roles/iam.serviceAccountAdmin)",
      "Role Admin (roles/iam.roleAdmin)",
      "Project IAM Admin (roles/resourcemanager.projectIamAdmin)",
      "Access Context Manager Policy Editor",
    ],
    workspaceRequiredRolesTitle: "Required Workspace Privileges:",
    workspaceRequiredRoles: [
      "Chrome Policy & OU Read/Write",
      "Group & User Read",
      "License Management",
      "Super Admin (for Cloud Identity DLP rules)",
    ],
    specInvalid: "Invalid or missing deployment fields.",
    connectionNotice:
      "Connection validation is read-only.",
    bootstrapDeployer: "Create deployer and product-scoped role",
    bootstrapDeployerHint:
      "Creates the keyless deployer service account and custom role.",
    bootstrapConfirm:
      "Create or update the deployer service account, custom role, and IAM bindings?",
    bootstrapLegacyMigrationConfirm:
      "A legacy 0.2.0 deployer was found without an immutable ownership pin. Audit its numeric identity, custom role, and IAM bindings before adopting it?",
    bootstrapReplacementConfirm:
      "The legacy deployer did not match the audit and was left untouched. Create an isolated replacement deployer and role under fresh reserved names?",
    bootstrapDeletedDeployerConfirm:
      "The pinned deployer no longer exists. The extension will verify that project IAM and Access Policy IAM contain no residual binding, retire the old numeric identity, safely restore the soft-deleted role when required, and create a new deployer. Continue?",
    bootstrapWorking: "Creating deployer…",
    bootstrapValidating: "Waiting for IAM permissions…",
    bootstrapComplete: "Deployer service account ready",
    bootstrapNext:
      "Deployer service account and bindings are ready.",
    bootstrapFailed: "Automatic deployer setup failed",
    signInGoogle: "Sign in with Google",
    signingInGoogle: "Waiting for Google…",
    signInGoogleHint:
      "Required once per Chrome profile before setting up the deployer.",
    signInRequired:
      "Sign in with Google first, then retry.",
    signInOperatorChanged:
      "The signed-in account differs from the bound operator. Sign in with the original account or create a replacement deployer.",
    cloudStep1Label: "Step 1: Sign in with Google",
    cloudStep2Label: "Step 2: Validate project connection (or create deployer SA in Step 6 after Preflight)",
    cloudStep2DeferHint:
      "To run read-only Preflight first, click 'Validate connection' below. You can create and connect the dedicated deployer Service Account in Step 6 (Review) after Preflight.",
    cloudStep3Label: "Step 3: Create & connect keyless deployer SA (optional before Preflight)",
    customerIdAutoHint:
      "Leave as my_customer to auto-detect your Customer ID.",
    resolveSampleImageQuick: "Auto-fill Debian 12 PoC image",
    progressTitle: "Deployment progress",
    progressCount: (completed: number, total: number) =>
      `${completed} of ${total} operations complete`,
    currentOperation: "Current operation",
    failedOperation: "Failed operation",
    failedOperations: "Failed operations",
    manualCleanupTitle: "Manual cleanup required",
    manualCleanupDescription:
      "Automated rollback is unavailable. Remove the residual resources below in Google Cloud before resetting.",
    waitingForOperation: "Waiting for the first operation…",
    environmentTitle: "Configure the private environment",
    environmentIntro:
      "Select the deployment architecture and network parameters.",
    deploymentName: "Deployment name",
    region: "Region",
    zone: "Zone",
    secondaryZone: "Secondary zone (Production HA)",
    sourceImage: "Immutable VM image",
    sourceImageHint:
      "Full versioned Compute image resource path.",
    sourceImageAutoHint:
      "Preflight auto-fills the verified Debian 12 image for PoC sample VMs.",
    sampleImageResolving: "Resolving PoC image…",
    sampleImageResolveFailed:
      "Could not resolve the Debian 12 PoC image.",
    sampleImageConnectionRequired:
      "Validate Google Cloud connection first.",
    sampleImageResolved: "Immutable PoC image configured",
    minimumReplicas: "Minimum Nginx replicas",
    maximumReplicas: "Maximum Nginx replicas",
    cpuTarget: "Autoscaling CPU target (0.1–0.9)",
    autoscalingHint:
      "Two-zone regional MIG with CPU autoscaling.",
    network: "Connection method by destination app protocol (HTTPS / HTTP)",
    networkHttpsCategoryLabel:
      "1. Destination app speaks HTTPS (or launch a standalone sample VM — recommended · $0 LB)",
    networkHttpCategoryLabel:
      "2. Destination app speaks HTTP only (HTTPS offload via Internal ALB or Nginx VM)",
    vpcName: "Existing VPC name",
    vpcSameProjectHint:
      "Loaded from the deployment project. Set Upstream project ID only for Shared VPC.",
    vpcOptionsFailed: "Could not load VPCs.",
    subnetName: "Existing subnet name",
    upstreamVpcProjectId: "Upstream VPC project ID (optional)",
    upstreamVpcProjectIdHint:
      "Leave empty unless using a Shared or cross-project VPC.",
    upstreamVpcCrossProjectPrerequisite:
      "Cross-project prerequisite: before validation or preflight, grant compute.networks.get, compute.networks.use, resourcemanager.projects.get, resourcemanager.projects.getIamPolicy, and resourcemanager.projects.setIamPolicy in the upstream project. Bootstrap configures only the deployment project. A project custom role created in the deployment project cannot be granted in the upstream project.",
    managedSample: "Sample HTTP backend + Nginx VM (Option C)",
    managedSampleDescription:
      "Create a private HTTP sample backend VM and an Nginx HTTPS proxy VM.",
    existingBackend: "Existing HTTP app (http://) + Nginx VM (Option C)",
    existingBackendDescription:
      "Terminate HTTPS on an Nginx VM and forward to an existing private HTTP endpoint.",
    directHttps: "HTTPS App — Direct connection / Sample VM (Option A)",
    directHttpsDescription:
      "Connect directly to an existing HTTPS endpoint (https://), or check 'Launch a private sample VM' below ($0 LB cost).",
    internalHttpsLb:
      "HTTP App — HTTPS offload with Internal Application Load Balancer (Option B)",
    internalHttpsLbDescription:
      "For HTTP-only apps: terminates HTTPS on a regional Internal ALB and forwards HTTP to a private sample VM.",
    configureSampleVm: "Create a private sample VM during approved Apply",
    configureSampleVmDescription:
      "Configures Option B defaults and creates the private sample VM during Apply.",
    directLaunchSampleVmCheckbox:
      "Launch a private sample VM during Apply (auto-creates HTTPS VM, Private DNS, and firewall)",
    directLaunchSampleVmDescription:
      "Creates a private HTTPS sample VM on TCP 443, Private DNS, and firewall rules during Apply without an Internal ALB.",
    directSampleVmAction: "Switch to HTTP App + Internal ALB (Option B)",
    directSampleVmDescription:
      "Option A requires an existing private HTTPS application. Check 'Launch a private sample VM' below or switch to Option B to create a sample VM during approved Apply.",
    managedSampleVmAction: "Create the private sample VM during Apply",
    managedSampleVmDescription:
      "Creates a private HTTP sample VM and Option C Nginx tier during Apply.",
    existingSampleVmDescription:
      "Requires a reachable private HTTP backend, or switch to Sample HTTP backend + Nginx VM.",
    legacyNginxTitle: "HTTP App — HTTPS offload with Nginx VM (Option C · Low-cost proxy)",
    legacyNginxDescription:
      "For HTTP-only apps without an Internal ALB: terminates HTTPS on a lightweight Nginx VM and forwards to an HTTP backend.",
    proxySubnetCidr: "ILB proxy-only subnet CIDR",
    backendUrl: "Backend URL (http://)",
    directHttpsUrl: "Private HTTPS endpoint (https://host[:port])",
    applicationEgressRegion: "Egress region (optional)",
    applicationEgressRegionHint:
      "Defaults to the deployment region. Leave empty for Global dynamic routing.",
    backendLocation: "Backend hosting location",
    backendLocationGcp: "Google Cloud",
    backendLocationAws: "AWS",
    backendLocationAzure: "Azure",
    backendLocationOnPrem: "On premises",
    confirmBackendConnectivity:
      "I confirm private routing, DNS, and backend firewall access already exist from the selected GCP VPC/subnet",
    backendConnectivityHint:
      "This PoC configures Nginx and verifies upstream connectivity; it does not create AWS/Azure VPNs, Cloud VPN, or Interconnect.",
    cloudConsoleLinks: "Google Cloud & Workspace Console Links",
    openInCloudConsole: "Open in Cloud Console",
    computeInstancesLink: "Compute Engine VM Instances",
    computeResourcesHint:
      "Run-scoped Nginx and/or sample-backend VM resources.",
    securityGatewaysLink: "BeyondCorp Security Gateways",
    securityGatewayHint:
      "Check the run inventory for exact gateway names.",
    vpcNetworksLink: "VPC Networks & Firewalls",
    cloudNatLink: "Cloud NAT",
    cloudNatHint:
      "Created for a dedicated-VPC path with private VMs; an existing VPC must provide verified private egress.",
    chromeAdminLink: "Chrome Admin Policies",
    architectureBlueprint: "Architecture Blueprint",
    directHttpsConnectivity:
      "I confirm the selected VPC resolves this hostname, routes to the HTTPS app, allows TCP from 136.124.16.0/20, and has a return path",
    directHttpsConnectivityHint:
      "For AWS, Azure, or on-premises, configure VPN/Interconnect, DNS forwarding, firewall rules, and return routing for 136.124.16.0/20 first.",
    hostname: "Private application hostname",
    noExternalIpNotice:
      "Created VMs have no external IPs. A dedicated-VPC path with private VMs creates Cloud NAT; an existing VPC must provide verified private egress. The internal-HTTPS-LB path has no Nginx tier but does create its private sample-backend VM.",
    certificateStepTitle: "Configure TLS certificate source",
    certificateIntro:
      "Certificates are read at runtime from Secret Manager.",
    internalLbCertificateIntro:
      "The regional Internal ALB terminates HTTPS using a certificate stored in Secret Manager.",
    caPool: "CA pool resource",
    caName: "Issuing CA resource",
    secretName: "Secret Manager certificate secret",
    certificateNotice:
      "After Apply, download the public root PEM and add it at Chrome > Connectors > Chrome Root Store for the test OU.",
    internalLbCertificateNotice:
      "After Apply, upload the public root PEM to Chrome Root Store for the test OU and restart Chrome.",
    directCertificateIntro:
      "The HTTPS application terminates TLS directly.",
    directCertificateNotice:
      "Publicly trusted certs need no Root Store setup. For a private CA, add its root PEM at Chrome > Connectors > Chrome Root Store for the test OU.",
    directPrivateCertificate: "Private app CA / manual Chrome Root Store trust",
    accessTitle: "Limit Chrome policy and application access",
    accessIntro:
      "Select the dedicated test OU and authorized principals.",
    customerId: "Workspace customer ID",
    targetOuId: "Dedicated test OU ID",
    managedChromeAccessLevel: "Managed Chrome access level",
    managedChromeAccessLevelHint:
      "Select None or an existing Access Context Manager resource name.",
    managedChromeAccessLevelNone: "None — do not require an access level",
    managedChromeAccessLevelNoneHint:
      "Access is restricted to the selected IAM principals without a device condition.",
    optionsLoadedHint:
      "Options are loaded read-only using your authenticated Cloud and Workspace identities.",
    optionsLoading: "Loading options…",
    chooseOption: "Select an option",
    noOptions: "No options available",
    retryOptions: "Retry",
    ouOptionsFailed:
      "Could not load OUs. Check Admin SDK API and OU read permissions.",
    accessLevelOptionsFailed:
      "Could not load access levels. Check Access Context Manager Policy Editor permissions.",
    groupOptionsFailed:
      "Could not load groups. Check Groups read permissions.",
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
      "Force-installs Secure Gateway and Endpoint Verification on the selected OU and its descendants.",
    accessOuVsPrincipalNotice:
      "Test OU receives the Chrome browser policies; Principals below receive IAM access through the gateway.",
    reviewTitle: "Review detected state and automatic changes",
    reviewIntro:
      "Run preflight to inspect existing resources and approve the change plan.",
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
      "Ready = verified · Automatic on Apply = provisioned on Apply · Manual check = verify in console · Action required = blocks Apply.",
    gateLabels: {
      "immutable-image": "Immutable VM image",
      "billing-enabled": "Cloud Billing",
      "enterprise-license": "Chrome Enterprise Premium license",
      "chrome-root-store": "Chrome Root Store trust",
      "workspace-services": "Workspace services",
      "managed-chrome-profile": "Managed Chrome profile",
      "secure-enterprise-browser-client": "Secure Enterprise Browser client",
      "endpoint-verification": "Endpoint Verification",
      "global-access": "Chrome Global Access routing",
      "no-external-ips": "No external IPs",
      "private-egress": "Cloud NAT",
      "backend-connectivity": "Existing backend connectivity",
      "test-ou": "Target OU",
      "group-policy-discovery": "Chrome group policy discovery",
      "cloud-identity": "Google Cloud deployer",
      "workspace-identity": "Workspace and Chrome administrator",
      "required-apis": "Required APIs",
      "apply-permissions": "Apply permissions",
      "public-certificate-binding": "Public certificate bundle",
      "resource-conflicts": "Resource conflicts",
      "human-approval": "Approval",
    },
    gateDescriptions: {
      "immutable-image": "Verifies the exact Compute image resource and numeric ID.",
      "billing-enabled": "Checks that the project has an active billing account.",
      "enterprise-license": "Checks assigned Chrome Enterprise Premium licenses.",
      "chrome-root-store": "Upload the root CA to Chrome Root Store for the test OU after Apply.",
      "workspace-services": "Requires admin confirmation of Workspace service access.",
      "managed-chrome-profile": "Checks active Chrome profiles in the selected OU.",
      "secure-enterprise-browser-client": "Checks the Secure Enterprise Browser extension.",
      "endpoint-verification": "Checks or force-installs Endpoint Verification on Apply.",
      "global-access": "Verifies or enables Chrome Global Access routing on the test OU.",
      "no-external-ips": "Created VMs omit external IPs.",
      "private-egress": "A dedicated-VPC path with private VMs creates Cloud NAT; an existing VPC must provide verified private egress.",
      "backend-connectivity": "Verifies private routing to the target backend.",
      "test-ou": "Confirms a non-production test OU is selected.",
      "group-policy-discovery": "Verifies that Chrome group policies do not conflict with the test OU.",
      "cloud-identity": "Google Cloud deployer validated.",
      "workspace-identity": "Workspace administrator validated.",
      "required-apis": "Enables missing required APIs during Apply.",
      "apply-permissions": "Checks required deployer IAM permissions.",
      "public-certificate-binding": "Verifies the public certificate bundle in Secret Manager.",
      "resource-conflicts": "Checks existing resources for conflicts.",
      "human-approval": "Binds operator approval to the configuration hash.",
    },
    gateDetail: (gateId, status, detail) => formatGateDetail("en", gateId, status, detail),
    openChromeRootStoreConsole: "Open Google Admin Console (Chrome Root Store)",
    reviewDeployerSaTitle: "Connect Deployer Service Account before Approval & Apply",
    reviewDeployerSaPendingDesc:
      "Preflight ran using your signed-in administrator account. Before approving and applying changes, click below to create and connect the dedicated keyless deployer Service Account.",
    reviewDeployerSaReadyDesc:
      "Dedicated keyless deployer Service Account is connected and ready for Approval & Apply.",
    managedProfileEvidence: (total, profileOnly, sync) =>
      `${total} profile(s) (${profileOnly} BYOD). Last sync: ${sync ?? "none"}.`,
    clientExtensionEvidence: (name, version, installed) =>
      installed
        ? `${name} ${version ?? ""} is installed and enabled.`
        : `${name} is not reported yet.`,
    missingPermissions: (count: number) =>
      `${count} required permissions are missing.`,
    approvePlan: "Approve this exact plan",
    approvePlanDescription:
      "Bound to the configuration hash; invalidated if settings change.",
    generatePlan: "Run preflight and generate plan",
    runPreflight: "Run trusted preflight",
    preparingPlan: "Discovering resources and generating plan…",
    planReady: "Plan ready",
    planBlocked: "Plan has blocking gates",
    changesCount: (count: number) =>
      count === 1
        ? "1 mutating operation requires approval"
        : `${count} mutating operations require approval`,
    preflightProgressTitle: "Preflight Progress",
    preflightStage1: "1/5: Checking Service Usage & IAM...",
    preflightStage2: "2/5: Checking Cloud Billing...",
    preflightStage3: "3/5: Discovering Gateway & VPC...",
    preflightStage4: "4/5: Checking Chrome & OU policies...",
    preflightStage5: "5/5: Evaluating safety gates...",
    preflightStage5Detail: "Building diff & evaluating safety gates",
    preflightComplete: "Preflight complete",
    plannedChangesTitle: "Exact changes requiring approval",
    plannedChangesIntro:
      "Shows only create and update operations.",
    changeAction: (action) =>
      ({ create: "Create / override", update: "Update" })[action] ?? action,
    changeRisk: (risk) =>
      ({ low: "Low risk", medium: "Medium risk", high: "High risk", blocking: "Blocking" })[
        risk
      ] ?? risk,
    changeSummary: (resourceType, fallback) =>
      resourceType === "service_discovery_proxy"
        ? "Override inherited PAC in the test OU to enable Service Discovery routing."
        : fallback,
    diagnosticsTitle: "Detected conditions",
    apiEvidence: "API evidence",
    diagnosticMessage: (code, fallback) => formatDiagnosticMessage("en", code, fallback),
    diagnosticRemediation: (code, fallback) => formatDiagnosticRemediation("en", code, fallback),
    approveWorking: "Binding approval…",
    approvalReady: "Exact plan approved",
    continueToApply: "Continue to Apply",
    applyTitle: "Apply with checkpoints and evidence",
    applyIntro:
      "Applies changes in dependency order and rolls back owned resources on failure.",
    preflight: "Preflight",
    desiredStatePlan: "Desired-state plan",
    applyChanges: "Apply approved changes",
    applyLocked: "Complete preflight and approval to unlock Apply",
    applying: "Applying approved changes…",
    runSucceeded: "Deployment succeeded",
    runRollingBack: "Rolling back applied changes…",
    runRollbackUnavailable:
      "Apply failed and automated rollback was unavailable.",
    runRollbackFailed:
      "Apply failed and at least one owned change could not be rolled back.",
    runRolledBack: "Deployment failed and owned changes were rolled back",
    runFinalized: "Run finished",
    noActiveOperation: "No operation is running",
    finalizedOperationCount: (count: number) =>
      `Run finalized (${count} operations)`,
    runInterrupted:
      "Apply was interrupted. Resume reconciles checkpoints with live resources.",
    resumeRun: "Resume interrupted Apply",
    resumingRun: "Reconciling and resuming…",
    retryRollback: "Retry failed rollback",
    retryingRollback: "Retrying rollback…",
    runFailed: "Deployment requires operator attention",
    operationCount: (count: number) => `${count} operations recorded`,
    evidenceNotice:
      "All actions are recorded in the local audit chain.",
    caHandoffTitle: "Complete managed Chrome trust",
    caHandoffDescription:
      "Upload the PoC Root CA to Google Admin Console before browser testing.",
    caHandoffSteps: [
      "Download the public PoC root certificate below.",
      "In Google Admin Console > Chrome > Connectors > Chrome Root Store, add the PEM as a Root certificate.",
      "Bind the configuration to the test OU, save, and restart Chrome.",
    ],
    downloadRootCa: "Download public root CA",
    downloadingRootCa: "Preparing download…",
    openAdminConsoleGuide: "Open Google's CA setup guide",
    caDownloadFailed:
      "Could not download root CA. Confirm Apply succeeded and retry.",
    connectionHandoffTitle: "Connection verification",
    testUrlLabel: "Private Web App URL",
    sebTroubleshootingHint:
      "If Chrome shows NXDOMAIN, reload the Secure Enterprise Browser extension at chrome://extensions or re-sign in to refresh routes.",
    recallCardTitle: "Recalled deployment configuration · non-sensitive",
    recallCardIntro:
      "Review, copy, download, or reload the deployed non-sensitive parameters into the wizard. Private keys, OAuth tokens, and secret payloads are excluded.",
    recallIntoWizardButton: "Recall configuration into wizard",
    recallCopyJsonButton: "Copy configuration JSON",
    recallCopiedBadge: "✓ Copied non-sensitive configuration JSON",
    recallDownloadJsonButton: "Download configuration JSON",
    recallExcludedLabel: "Excluded sensitive data",
    recallExcludedValue:
      "TLS private keys, OAuth tokens, Secret Manager payloads, ownership tokens",
    previous: "Back",
    next: "Continue",
  },
  operations: {
    deploymentsTitle: "Deployment runs",
    deploymentsIntro:
      "Inspect recorded runs, logs, resources, and teardown.",
    evidenceTitle: "Audit evidence",
    evidenceIntro:
      "Verify the hash chain and export a JSON evidence bundle.",
    loading: "Loading…",
    loadFailed: "Could not load recorded state.",
    noRuns: "No deployment runs recorded.",
    noEvents: "No audit events recorded.",
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
        managed_sample: "HTTP App · Nginx HTTPS offload (Sample VM)",
        existing_http: "HTTP App · Nginx HTTPS offload (Existing HTTP app)",
        direct_https: "HTTPS App · Direct private HTTPS",
        internal_https_lb: "HTTP App · Internal Application Load Balancer HTTPS offload",
      })[kind] ?? kind,
    recallCardTitle: "Recalled deployment configuration · non-sensitive",
    recallCardIntro:
      "Review, copy, download, or reload the deployed non-sensitive parameters into the wizard. Private keys, OAuth tokens, and secret payloads are excluded.",
    recallIntoWizardButton: "Recall configuration into wizard",
    recallCopyJsonButton: "Copy configuration JSON",
    recallCopiedBadge: "✓ Copied non-sensitive configuration JSON",
    recallDownloadJsonButton: "Download configuration JSON",
    recallExcludedLabel: "Excluded sensitive data",
    recallExcludedValue:
      "TLS private keys, OAuth tokens, Secret Manager payloads, ownership tokens",
    accessLevelControlTitle: "Access Control & Access Level Policies",
    accessLevelControlIntro:
      "Update the Access Context Manager condition and allowed principals.",
    selectAccessLevelLabel: "Target Access Level Policy",
    principalsLabel: "Allowed Principals (Users, Groups, Domains)",
    principalsHelper: "Comma-separated (e.g. user:admin@example.com, group:devs@example.com)",
    noAccessLevelRequired: "No Access Level constraint",
    boundGroup: "Target IAM Group",
    updateAccessLevelButton: "Update Access Level Policy",
    updatingAccessLevel: "Updating IAM Policy...",
    accessLevelSaved: "Access Level updated",
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
      "Query gateway access, connection, admin, and Nginx logs from Cloud Logging.",
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
    noLogs: "No matching log entries found.",
    logQueryFailed:
      "Could not query Cloud Logging. Verify gateway and logging read permissions.",
    dataAccessNotice:
      "Access decisions require BeyondCorp Enterprise Data Access audit logs.",
    gatewayLoggingEnabled:
      "Secure Gateway connection logging is enabled in this deployment project.",
    gatewayLoggingDisabled:
      "Secure Gateway connection logging is disabled. Connection entries will not be produced; review the gateway in Google Cloud before relying on this view.",
    nginxNotice:
      "Nginx logs require Cloud Ops Agent collecting sgstudio-access.log.",
    principal: "Principal",
    method: "Method",
    requestId: "Request ID",
    callerIp: "Caller IP",
    payload: "Sanitized payload",
    specInvalid: "Invalid or missing deployment fields.",
    teardownTitle: "Teardown this deployment",
    teardownIntro:
      "Restores shared policies and deletes only resources owned by this run.",
    teardownSharedNotice:
      "Shared IAM and Chrome policies are restored only when their current state matches this run's recorded managed-after state; a sending write with an unknown result or later drift is retained. Reused resources are retained, and the Gateway is deleted only when no applications remain.",
    teardownUnavailable: "No owned resources available for teardown.",
    teardownConfirmation: "Exact confirmation",
    teardownConfirmationHint: "Type the exact phrase shown above",
    startTeardown: "Restore and delete run changes",
    teardownRunning: "Restoring and deleting run changes…",
    teardownSucceeded: "Teardown completed",
    teardownInterrupted:
      "The execution worker or local service stopped during teardown. Resuming reconciles checkpoints before continuing.",
    teardownFailed: "Teardown stopped and requires review",
    resumeTeardown: "Resume interrupted teardown",
    resumingTeardown: "Reconciling and resuming…",
    teardownActionFailed: "Could not start or refresh teardown.",
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
      "Run automated checks and record managed Chrome test results.",
    noSuccessfulRun: "Complete a deployment run before acceptance testing.",
    runSystemChecks: "Run automated system checks",
    runningSystemChecks: "Verifying resources…",
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
      "Record sanitized observations or hashes only; never enter secrets or tokens.",
    testCase: "Test case",
    testInstruction: (testId, caseKey) =>
      testId === "T06"
        ? "Open an existing HTTPS control app in the managed profile, or record Skipped for a greenfield PoC."
        : testId === "T07"
          ? `Open the deployed private HTTPS app in the managed Chrome profile on ${caseKey}.`
          : testId === "T08"
            ? "Correlate gateway, offload, and backend log events."
            : testId === "T09"
              ? "Confirm unauthorized or unmanaged access is denied."
              : "Record the observed result.",
    evidenceOutcome: "Observed outcome",
    outcomePassed: "Passed",
    outcomeFailed: "Failed",
    outcomeSkipped: "Skipped",
    evidenceSummary: "Result summary",
    evidenceDetail: "Sanitized evidence or artifact SHA-256",
    recordEvidence: "Record confirmation",
    recordingEvidence: "Recording…",
    evidenceRecorded: "Acceptance evidence recorded.",
    acceptanceActionFailed: "Acceptance action failed.",
    statusSucceeded: "Success",
    statusDeleted: "Torn down",
    statusRunning: "Running",
    statusPending: "Pending",
    statusFailed: "Failed",
    t07DiagnosticsTitle: "Managed Chrome client diagnostics",
    t07DiagnosticsIntro:
      "Common browser symptoms and quick fixes:",
    t07Diagnostics: [
      {
        symptom: "ERR_NAME_NOT_RESOLVED",
        meaning:
          "The private hostname was not captured by the Secure Enterprise Browser extension or was bypassed by a legacy PAC.",
        actions: [
          "Verify the test OU overrides any inherited PAC policy.",
          "Confirm Secure Enterprise Browser is installed and synced in the active Chrome profile.",
          "Verify gateway route and Service Discovery IAM bindings.",
        ],
      },
      {
        symptom: "Access Denied (403)",
        meaning:
          "Gateway reached, but IAM principal or Access Context Manager condition was not met.",
        actions: [
          "Click Sync now in the Endpoint Verification extension.",
          "Confirm the user/group has Service Discovery and application IAM bindings.",
          "Check that the Access Level permits the test device or profile.",
        ],
      },
      {
        symptom: "Certificate authority error",
        meaning:
          "The PoC root CA is not yet trusted by this Chrome profile.",
        actions: [
          "Download the PoC root certificate from Apply.",
          "Add the PEM at Chrome > Connectors > Chrome Root Store for the test OU and restart Chrome.",
        ],
      },
    ],
  },
  guide: {
    portalEyebrow: "Chrome Enterprise Premium · Operations Guide",
    portalTitle: "Documentation & Step-by-Step PoC Guide",
    portalIntro:
      "Use Easy PoC for agentless browser DLP, GenAI controls, and SaaS tenant restrictions, or Secure Gateway Deployer for VPN-less private web apps.",
    beginnerNavLabel: "Quick Start",
    beginnerEyebrow: "Core Building Blocks",
    beginnerTitle: "New to Google Workspace or Google Cloud? Understand the 3 Building Blocks",
    beginnerIntro:
      "How the three Google consoles and scopes used by this tool map to general IT terms:",
    beginnerPillars: [
      {
        badge: "1. Identity & Browser Console",
        title: "[Google Admin Console](https://admin.google.com)",
        analogy: "Equivalent to Microsoft Entra ID + Intune",
        description:
          "Manages users, organizational units, groups, and Chrome policies. Easy PoC runs entirely against this console.",
        whereUrl: "[admin.google.com](https://admin.google.com)",
      },
      {
        badge: "2. Policy Target Scope",
        title: "Organizational Units & Google Groups",
        analogy: "Equivalent to Active Directory OUs & Security Groups",
        description:
          "The top-level Root OU `/` affects everyone and is blocked in code. Pick a child test OU such as `/CEP-PoC` or a Google Group.",
        whereUrl: "[admin.google.com](https://admin.google.com) > Directory > Organizational units / Groups",
      },
      {
        badge: "3. Cloud Infrastructure",
        title: "[Google Cloud Console](https://console.cloud.google.com)",
        analogy: "Equivalent to an AWS Account or Azure Subscription",
        description:
          "Not required for basic Easy PoC policies. Used only for Secure Gateway Deployer or Context-Aware Access device posture rules.",
        whereUrl: "[console.cloud.google.com](https://console.cloud.google.com)",
      },
    ],
    stepZeroEyebrow: "Step 0 · Pre-Flight Checklist",
    stepZeroTitle: "Three Quick Preparation Steps Before You Start",
    stepZeroIntro:
      "Complete these three steps once before deploying:",
    stepZeroChecklist: [
      {
        stepBadge: "Prep 1 · Target Scope",
        title: "Prepare a pilot OU or test Google Group",
        summary:
          "Isolate PoC policies to 1–2 test accounts.",
        details: [
          "By OU: Click '+ Create & Select Pilot OU' in Easy PoC Tab 1 to create `/CEP-PoC`, then move test users into it in [Google Admin Console](https://admin.google.com).",
          "By Group: Create a group in [Google Admin Console](https://admin.google.com) and add test users without changing their department OU.",
          "Sign in with a Workspace Super Admin account when creating DLP rules in Tab 3.",
        ],
      },
      {
        stepBadge: "Prep 2 · Top-Right Sign-In",
        title: "Sign in from the top-right header buttons",
        summary:
          "Easy PoC and Secure Gateway Deployer share the top-right authentication bar.",
        details: [
          "Click 'Google Workspace' at the top right to sign in and auto-load your Customer ID, OUs, and Groups.",
          "For Secure Gateway or device posture rules, click 'Google Cloud' and enter your Project ID from [Google Cloud Console](https://console.cloud.google.com).",
        ],
      },
      {
        stepBadge: "Prep 3 · Test Browser",
        title: "Sign in to a test Chrome profile and reload policies",
        summary:
          "Policies sync to signed-in Chrome profiles within seconds.",
        details: [
          "Sign in to a Chrome profile with your test user account.",
          "Open `chrome://policy` and click 'Reload policies' after deploying.",
        ],
      },
    ],
    glossaryEyebrow: "Google vs. General IT Terms",
    glossaryTitle: "Quick Glossary of Google Terms Appearing in This Tool",
    glossaryIntro:
      "Plain-language equivalents for Google terms used across the UI:",
    glossaryTermHeader: "Term",
    glossaryAnalogyHeader: "General IT Equivalent",
    glossaryMeaningHeader: "Meaning",
    glossaryItems: [
      {
        term: "Customer ID",
        analogy: "Entra Tenant ID",
        meaning: "Your tenant ID starting with `C...`, auto-resolved on sign-in.",
      },
      {
        term: "Organizational Unit / OU",
        analogy: "Active Directory OU",
        meaning: "Folder hierarchy in [Google Admin Console](https://admin.google.com). Always target a child OU rather than Root `/`.",
      },
      {
        term: "Google Group",
        analogy: "Security Group",
        meaning: "Applies policies to group members without moving users across OUs.",
      },
      {
        term: "Enterprise Connectors",
        analogy: "Agentless Browser Sensor",
        meaning: "Built-in Chrome inspection for uploads, downloads, pastes, and printing.",
      },
      {
        term: "Cloud Identity DLP",
        analogy: "Endpoint DLP Rule",
        meaning: "Evaluates file and clipboard content to Audit, Warn, Block, or apply a watermark.",
      },
      {
        term: "Context-Aware Access",
        analogy: "Conditional Access",
        meaning: "Checks whether the user is on a managed Chrome profile or an unmanaged BYOD device.",
      },
      {
        term: "Endpoint Verification",
        analogy: "Posture Extension",
        meaning: "Official Chrome extension reporting OS and encryption status to [Google Admin Console](https://admin.google.com).",
      },
      {
        term: "Security Gateway",
        analogy: "Zscaler ZPA / Private Access",
        meaning: "Zero-trust proxy granting VPN-less Chrome access to private web apps.",
      },
      {
        term: "Project ID",
        analogy: "AWS Account / Azure Subscription",
        meaning: "The [Google Cloud Console](https://console.cloud.google.com) project ID where gateway resources are created.",
      },
      {
        term: "Keyless Service Account",
        analogy: "IAM Role / Managed Identity",
        meaning: "Automation identity used via short-lived OAuth impersonation without JSON keys.",
      },
    ],
    sharedAuthTitle: "Shared Top-Right Sign-In",
    sharedAuthIntro:
      "Both workflows share the Google Workspace and Google Cloud buttons in the top-right header.",
    sharedAuthItems: [
      {
        label: "Google Workspace",
        detail: "Auto-resolves Customer ID, OUs, and Groups via Chrome Identity OAuth.",
      },
      {
        label: "Google Cloud",
        detail: "Optional for Easy PoC; required for Secure Gateway Deployer.",
      },
      {
        label: "Dropdown Selection",
        detail: "Pick your target OU or Group directly from the dropdown.",
      },
    ],
    easyPocTabLabel: "Easy PoC Guide",
    easyPocTabSubtitle: "Browser DLP · GenAI & SaaS Controls · Licensing & Roles",
    sgwTabLabel: "Secure Gateway Deployer Guide",
    sgwTabSubtitle: "VPN-less Private Web Apps · Direct HTTPS / ILB / Nginx",
    openEasyPocCta: "Open Easy PoC",
    openSgwDeployerCta: "Open Secure Gateway Deployer",
    easyPocGuide: {
      eyebrow: "Easy PoC · Core CEP Protections",
      title: "How Easy PoC Configures Chrome Enterprise Premium",
      intro:
        "Deploys browser DLP, malware scanning, clipboard boundaries, SaaS tenant restrictions, and Gemini Zero Trust controls to a pilot OU or Google Group without provisioning VMs.",
      pocNoticeTitle: "Pilot Scope Isolation & Rollback",
      pocNoticeBody:
        "Root `/` is blocked in code. Deploy each tab independently to a child OU or Group, and use Tab 4 Rollback to restore inherited defaults.",
      quickOverviewTitle: "Core Protection Scenarios",
      scenariosTitle: "Three Core Evaluation Scenarios in Easy PoC",
      scenariosIntro:
        "Agentless browser controls across data loss prevention, Shadow AI governance, and Gemini Zero Trust.",
      scopeTag: "Agentless Control",
      targetLabel: "Target scope",
      authRequirementLabel: "Required role",
      scenarios: [
        {
          eyebrow: "Scenario 1 · Browser DLP & Deep Scanning",
          title: "Real-Time File, Clipboard, Print, and Watermark Controls",
          summary:
            "Inspects uploads, downloads, bulk pastes, and print actions via Chrome Connectors and Cloud Identity DLP, with optional BYOD-only enforcement.",
          estimatedTime: "Time: ~30s",
          targetScope: "Pilot OU or Google Group.",
          authRequirement: "Workspace Super Admin.",
          nodes: [
            { label: "Managed Chrome", detail: "OU/Group sync + Endpoint Verification", costBadge: "Profile / Device" },
            { label: "Enterprise Connectors", detail: "Upload, download, paste & print", costBadge: "Real-time scan" },
            { label: "Cloud Identity DLP", detail: "PCI, National ID & file/paste rules", costBadge: "Audit / Warn / Block" },
            { label: "Protected Workspace", detail: "Screen watermark + audit logs", costBadge: "Admin Audit" },
          ],
          supports: [
            { label: "7-Row Threat Matrix", detail: "Upload, Download, Paste, Print, and Watermark per row" },
            { label: "BYOD-Only Scope", detail: "Stricter rules on unmanaged devices" },
            { label: "Clipboard Boundary", detail: "Block copy/paste from internal URLs to external sites" },
            { label: "Custom User Message", detail: "Custom guidance on Warn/Block dialogs" },
            { label: "Deep Malware Scan", detail: "Safe Browsing Enhanced Protection" },
            { label: "1-Click Test Data", detail: "Built-in test credit card, National ID, and source code" },
          ],
        },
        {
          eyebrow: "Scenario 2 · Shadow AI & SaaS Governance",
          title: "Consumer GenAI Blocking + HTTP Header SaaS Tenant Restrictions",
          summary:
            "Blocks unapproved consumer AI while permitting corporate Gemini, and injects HTTP headers to block sign-in to personal SaaS accounts.",
          estimatedTime: "Time: ~20s",
          targetScope: "Pilot OU or Google Group.",
          authRequirement: "Workspace Admin.",
          nodes: [
            { label: "Managed Chrome", detail: "Incognito & Guest modes disabled", costBadge: "Bypass prevention" },
            { label: "URL Governance", detail: "Blocks shadow AI; permits corporate Gemini", costBadge: "AI governance" },
            { label: "HttpHeaderInjection", detail: "Attaches tenant headers on SaaS domains", costBadge: "6 SaaS presets" },
            { label: "Corporate SaaS", detail: "Only authorized corporate tenants load", costBadge: "Personal blocked" },
          ],
          supports: [
            { label: "Google Workspace", detail: "X-GoogApps-Allowed-Domains" },
            { label: "Slack & GitHub", detail: "Allowed Workspaces & Organizations headers" },
            { label: "Box & ChatGPT", detail: "Allowed Enterprise & Workspace ID headers" },
            { label: "Microsoft 365", detail: "Restrict-Access-To-Tenants + Context headers" },
            { label: "GenAI Prompt DLP", detail: "Blocks sensitive file uploads and pastes to AI sites" },
            { label: "Custom Headers", detail: "Add arbitrary URL patterns and HTTP headers" },
          ],
        },
        {
          eyebrow: "Scenario 3 · Gemini Enterprise Zero Trust",
          title: "Context-Aware Access + Restricted Client Access + VPC Service Controls",
          summary:
            "Protects Gemini and Vertex AI endpoints with managed Chrome posture, Cloud Identity Group bindings, and a VPC-SC perimeter.",
          estimatedTime: "Time: ~45s",
          targetScope: "GCP Project + Org Access Policy + Group.",
          authRequirement: "GCP Org / ACM Admin + Workspace Admin.",
          nodes: [
            { label: "Layer 1 · Chrome Posture", detail: "ACM Access Level for managed Chrome", costBadge: "Device check" },
            { label: "Layer 2 · Restricted Client", detail: "Group accessPolicyBindings", costBadge: "Identity binding" },
            { label: "Layer 3 · VPC-SC", detail: "Restricts discoveryengine & aiplatform APIs", costBadge: "Dry-Run / Enforced" },
            { label: "Gemini Enterprise", detail: "Blocks unmanaged API/token access", costBadge: "Zero Trust AI" },
          ],
          supports: [
            { label: "Folder Discovery", detail: "Walks parent folders to resolve Org ID" },
            { label: "Dry-Run Default", detail: "Provisions VPC-SC in Dry-Run mode by default" },
            { label: "Lockout Guard", detail: "Preserves existing perimeter members" },
          ],
        },
      ],
      implementationTitle: "What Is Implemented in Easy PoC",
      implementationIntro:
        "Calls official Google Workspace, Chrome Policy, Cloud Identity, and Google Cloud REST APIs directly from your browser session.",
      implementationEyebrow: "Feature inventory",
      implementationGroups: [
        {
          eyebrow: "Auth & Targeting",
          title: "Shared Auth, 1-Click Pilot OU & Group Scope",
          items: [
            "Shares top-right Workspace and Cloud sign-in state with Secure Gateway Deployer.",
            "Auto-resolves Customer ID and loads OUs, Groups, and Access Levels.",
            "Creates `/CEP-PoC` in 1 click or targets a Google Group while blocking Root `/`.",
          ],
        },
        {
          eyebrow: "Risk Assessment",
          title: "15-Point Security Assessment",
          items: [
            "15-question checklist across GenAI, Browser Posture, SaaS Boundary, and Audit.",
            "Maps selected risks to Chrome policies, clipboard boundaries, and the 7-row DLP matrix.",
          ],
        },
        {
          eyebrow: "Browser & SaaS",
          title: "Chrome Policies & HTTP Header Injection",
          items: [
            "Verifies live policy schemas and applies Safe Browsing, Password Alert, Ephemeral Profiles, and DoH.",
            "Force-installs Endpoint Verification and injects tenant-restriction headers for 6 SaaS presets.",
          ],
        },
        {
          eyebrow: "Content DLP",
          title: "Connectors & Cloud Identity DLP Matrix",
          items: [
            "Enables upload, download, bulk paste, print, and security event connectors.",
            "Creates regex detectors and 7 matrix rules using `access_levels.meets_access_requirements` CEL syntax.",
          ],
        },
        {
          eyebrow: "Administration",
          title: "Pilot Licensing & Custom Admin Roles",
          items: [
            "Assigns CEP licenses to up to 10 direct users in the pilot OU within a 5-second deadline.",
            "Creates least-privilege CEP Security Admin and CEP Auditor custom roles.",
          ],
        },
        {
          eyebrow: "Audit & Cleanup",
          title: "Per-Tab Execution, Trace & Rollback",
          items: [
            "Deploys each tab independently, logs HTTP traces, and exports `provision-cep-poc.sh`.",
            "1-click Rollback restores inherited Chrome policies and deletes only PoC DLP rules.",
          ],
        },
      ],
      stepLabel: (step) => `Tab ${step}`,
      technicalDeepDiveTitle: "4-Tab Workflow & REST API Reference",
      technicalDeepDiveIntro:
        "Each tab executes only its own scope so you can deploy and test incrementally.",
      technicalEyebrow: "Step-by-step workflow",
      steps: [
        {
          title: "1. Setup Wizard",
          subtitle: "Target scope, core Chrome policies, connectors, CAA, and SaaS headers",
          summary:
            "Select or create a pilot OU in 1 click, choose modules, and deploy baseline Chrome policies, connectors, clipboard boundaries, and SaaS header rules.",
          actions: [
            "Sign in via 'Google Workspace' at the top right to load your Customer ID, OUs, and Groups.",
            "Select an OU or Group—or click '+ Create & Select Pilot OU' to create `/CEP-PoC`.",
            "Configure optional Context-Aware Access, Clipboard Boundary, and SaaS HTTP headers, then click 'Deploy Selected Policies'.",
          ],
          optionsBehavior: [
            {
              name: "OU vs. Google Group Scope",
              behavior:
                "OU mode uses `orgunits:batchModify` and supports 1-click `/CEP-PoC` creation. Group mode uses `groups:batchModify` without moving users across OUs.",
            },
            {
              name: "Context-Aware Access",
              behavior:
                "Creates or reuses `secgw_chrome_managed` when a GCP Project ID is set; skipped cleanly when blank.",
            },
            {
              name: "SaaS HTTP Header Injection",
              behavior:
                "Configures `chrome.users.HttpHeaderInjection` and disables Incognito/Guest modes.",
            },
          ],
          apiCalls: [
            {
              method: "GET",
              endpoint: "https://admin.googleapis.com/admin/directory/v1/customers/my_customer",
              purpose: "Resolves my_customer to Customer ID.",
            },
            {
              method: "POST",
              endpoint: "https://admin.googleapis.com/admin/directory/v1/customer/{customerId}/orgunits",
              purpose: "Creates the `/CEP-PoC` pilot OU in 1 click.",
            },
            {
              method: "POST",
              endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:batchModify",
              purpose: "Applies Chrome policies, connectors, clipboard rules, and HTTP headers to the OU.",
            },
            {
              method: "POST",
              endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/groups:batchModify",
              purpose: "Applies group-scoped Chrome policies and connectors.",
            },
          ],
          safetyNote:
            "Tab 1 deploys only browser policies and connectors without creating DLP rules, and never modifies Root `/`.",
        },
        {
          title: "2. License & Roles",
          subtitle: "Pilot CEP license assignment and custom Admin roles",
          summary:
            "Assign CEP licenses to pilot OU users and create least-privilege custom Admin roles.",
          actions: [
            "Select the pilot OU and click 'Assign CEP Licenses' in [Google Admin Console](https://admin.google.com/ac/billing/licensesettings).",
            "Choose CEP Security Admin or CEP Auditor and click 'Create / Verify Custom Roles' for [Admin Roles](https://admin.google.com/ac/roles).",
          ],
          optionsBehavior: [
            {
              name: "Pilot License Guardrail",
              behavior:
                "Non-recursive exact OU match capped at 10 users, 4 pages, and a 5-second deadline.",
            },
            {
              name: "Role Privilege Intersection",
              behavior:
                "Intersects requested privilege IDs against the tenant's live `roleprivileges` catalog.",
            },
          ],
          apiCalls: [
            {
              method: "POST",
              endpoint: "https://licensing.googleapis.com/apps/licensing/v1/product/Chrome-Enterprise-Premium/sku/1010310003/user",
              purpose: "Assigns CEP licenses to pilot users.",
            },
            {
              method: "POST",
              endpoint: "https://admin.googleapis.com/admin/directory/v1/customer/{customerId}/roles",
              purpose: "Creates custom Admin roles.",
            },
          ],
          safetyNote:
            "License assignment is non-recursive and capped at 10 users.",
        },
        {
          title: "3. DLP & Threat Matrix",
          subtitle: "7-row Cloud Identity DLP matrix, BYOD scope, watermark, and Gemini Zero Trust",
          summary:
            "Configure Audit, Warn, or Block across 7 threat rows, set internal watermark URLs, and optionally provision Gemini 3-layer Zero Trust.",
          actions: [
            "Select a DLP preset or customize Upload, Download, Paste, Print, and Watermark per row.",
            "Set Device Scope to 'All Devices' or 'BYOD Only' and enter internal URLs for watermarking.",
            "Click 'Deploy Selected Policies' to provision regex detectors and DLP rules.",
          ],
          optionsBehavior: [
            {
              name: "Cloud Identity CEL Syntax",
              behavior:
                "Generates `access_levels.meets_access_requirements(['...'])` and `!access_levels.meets_access_requirements(['...'])`.",
            },
            {
              name: "Semantic Rule Reuse",
              behavior:
                "Reuses matching `settings/rule.dlp` rules instead of creating duplicates.",
            },
          ],
          apiCalls: [
            {
              method: "POST",
              endpoint: "https://cloudidentity.googleapis.com/v1beta1/policies (setting.type: settings/detector.custom_regex)",
              purpose: "Creates PCI and National ID regex detectors.",
            },
            {
              method: "POST",
              endpoint: "https://cloudidentity.googleapis.com/v1beta1/policies (setting.type: settings/rule.dlp)",
              purpose: "Creates Cloud Identity DLP rules for the target OU or Group.",
            },
            {
              method: "PATCH",
              endpoint: "https://accesscontextmanager.googleapis.com/v1/accessPolicies/{policyId}/servicePerimeters/{perimeterName}",
              purpose: "Updates the Gemini VPC-SC perimeter.",
            },
          ],
          safetyNote:
            "If Watermark is enabled without internal URLs, only the watermark rule is skipped while all other DLP rules deploy.",
        },
        {
          title: "4. Audit & Cleanup",
          subtitle: "1-click test data, API execution trace, and Rollback",
          summary:
            "Verify DLP rules with safe test payloads, inspect API traces, or roll back PoC settings in 1 click.",
          actions: [
            "Open `chrome://policy` in the test browser, click 'Reload policies', and check `chrome://connectors-internals`.",
            "Copy the built-in test credit card, National ID, or >100-char source code and test pasting or uploading.",
            "Click 'Rollback PoC Policies' after testing to restore inherited defaults.",
          ],
          optionsBehavior: [
            {
              name: "100-Character Paste Threshold",
              behavior:
                "Chrome's bulk text connector scans pastes of ~100 characters or more; built-in test payloads exceed 100 characters.",
            },
            {
              name: "Scoped Rollback",
              behavior:
                "Resets managed Chrome schemas on the target OU/Group and deletes only `CEP PoC - *` DLP rules.",
            },
          ],
          apiCalls: [
            {
              method: "POST",
              endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:inherit",
              purpose: "Restores OU Chrome policies to parent inheritance.",
            },
            {
              method: "DELETE",
              endpoint: "https://cloudidentity.googleapis.com/v1beta1/policies/{policyName}",
              purpose: "Deletes `CEP PoC - *` DLP rules for the target scope.",
            },
          ],
          safetyNote:
            "Pre-existing DLP rules and shared detectors are untouched during Rollback.",
        },
      ],
      faqTitle: "Easy PoC Troubleshooting FAQ",
      faqIntro:
        "Quick answers for common Easy PoC questions:",
      faqEyebrow: "Troubleshooting",
      faqs: [
        {
          id: "cep-faq-super-admin",
          category: "Permissions",
          question: "Why do Cloud Identity DLP rules or Custom Roles return 403 Permission Denied?",
          answer:
            "Google's Cloud Identity Policies API and Role Management API require a Google Workspace Super Admin account.",
          checklist: [
            "Sign in via the top-right 'Google Workspace' button with a Super Admin account before deploying Tab 2 or Tab 3.",
          ],
        },
        {
          id: "cep-faq-ou-vs-group",
          category: "Target Scope",
          question: "Should I target an Organizational Unit or a Google Group?",
          answer:
            "Use an OU for full browser policy coverage and Tab 2 license assignment. Use a Google Group when you cannot move users out of their department OUs.",
          checklist: [
            "Use Tab 1's '+ Create & Select Pilot OU' button to create `/CEP-PoC` in one click.",
          ],
        },
        {
          id: "cep-faq-paste-threshold",
          category: "DLP Verification",
          question: "Why didn't Paste DLP trigger when pasting only a 16-digit card number?",
          answer:
            "Chrome's `OnBulkDataEntryEnterpriseConnector` only scans pasted text of roughly 100 characters or more.",
          checklist: [
            "Use the >100-character test payload in Tab 4, or test short strings via file upload.",
          ],
        },
        {
          id: "cep-faq-cel-access-level",
          category: "BYOD Scope",
          question: "How do BYOD-only DLP rules work?",
          answer:
            "Easy PoC compiles device checks with `access_levels.meets_access_requirements` and negates it for BYOD-only rules.",
          checklist: [
            "Enter a GCP Project ID in the top-right 'Google Cloud' button when using Access Levels.",
          ],
        },
        {
          id: "cep-faq-saas-headers",
          category: "SaaS Controls",
          question: "How does HTTP Header Injection block personal SaaS sign-ins?",
          answer:
            "Chrome attaches allowed-tenant headers to HTTPS requests while blocking Incognito and Guest modes.",
          checklist: [
            "Select a SaaS preset in Tab 1 and enter your corporate domain or workspace ID.",
          ],
        },
        {
          id: "cep-faq-rollback-safety",
          category: "Rollback",
          question: "Does Rollback affect existing production DLP rules?",
          answer:
            "No. Rollback only resets Easy PoC Chrome schemas on the selected OU/Group and deletes `CEP PoC - *` rules for that scope.",
          checklist: [
            "Select the same pilot OU or Group in Tab 4 before clicking Rollback.",
          ],
        },
      ],
    },
    eyebrow: "New setup guide",
    title: "What happens in each setup step",
    intro:
      "The wizard builds a discovered, reviewable, and approved Secure Gateway deployment. Before final Apply, it changes only the deployer service account, custom role, and IAM bindings that you explicitly confirm during bootstrap; discovery and all other setup steps are read-only.",
    pocNoticeTitle: "PoC deployment scope and safety guardrails",
    pocNoticeBody:
      "Production mode is disabled in this release. Use a dedicated non-production OU and test principals; do not route production traffic through this workflow.",
    quickOverviewTitle: "Quick Overview & Core Concepts",
    quickOverviewIntro:
      "Summary of the 3 architecture paths and 7 setup steps.",
    technicalDeepDiveTitle: "Step-by-Step Technical Deep Dive & API Calls",
    technicalDeepDiveIntro:
      "Configuration behavior and Google REST APIs invoked at each step.",
    technicalEyebrow: "Technical reference & API calls",
    checklistLabel: "Checklist & actions",
    optionsBehaviorLabel: "Option Behaviors & Logic",
    apiCallsLabel: "Key Google Cloud & Workspace REST API calls",
    safetyGuardrailLabel: "Safety & Rollback Guardrails",
    architectureTitle: "Three independent deployment architectures",
    architectureIntro:
      "Choose one path per app. Options A and B are the primary PoC paths; Option C provides the legacy Nginx method.",
    extensionArchitectureTitle: "Extension-supported deployment architectures",
    extensionArchitectureIntro:
      "Choose Direct HTTPS, regional Internal HTTPS Load Balancer offload, or the legacy Nginx path.",
    extensionArchitectureNote:
      "The Chrome extension plans and applies all three PoC paths. Option B creates its private sample VM only during approved Apply.",
    costOverviewTitle: "Cost drivers",
    costOverviewIntro:
      "Pricing varies by region, usage, and your CEP agreement. Confirm current [Google Cloud Console](https://console.cloud.google.com) pricing before applying.",
    costTag: "Verify current pricing",
    fixedCostLabel: "Provisioned resources",
    variableCostLabel: "Usage drivers",
    architectures: [
      {
        eyebrow: "HTTPS App · Direct Connection (Option A)",
        title: "Secure Gateway + existing private HTTPS app",
        summary:
          "Routes Secure Gateway directly to an existing HTTPS app in your VPC without creating VMs, NAT, or offload certificates.",
        estimatedCost: "Estimated monthly PoC: USD 0 new infrastructure",
        costFixed: "No new VM, load balancer, Cloud NAT, offload certificate, or managed DNS record.",
        costVariable: "Existing DNS, network data transfer, and app infrastructure charges.",
        nodes: [
          { label: "Managed Chrome", detail: "User identity + device/profile context", costBadge: "CEP license required" },
          { label: "Secure Gateway", detail: "Hostname:port matcher + access policy", costBadge: "Check CEP agreement" },
          { label: "Upstream VPC", detail: "Delegating SA has upstreamAccess", costBadge: "Network usage billed" },
          { label: "HTTPS app", detail: "Existing certificate and TLS termination", costBadge: "Existing infrastructure" },
        ],
        supports: [
          { label: "DNS resolution", detail: "Cloud DNS private or forwarding zone" },
          { label: "Network policy", detail: "Allow TCP from 136.124.16.0/20 and return route" },
          { label: "Regional routing", detail: "Optional egress region or Global Access" },
        ],
      },
      {
        eyebrow: "HTTP App · Internal ALB HTTPS Offload (Option B)",
        title: "Secure Gateway + internal HTTPS load balancer + private sample VM",
        summary:
          "Creates a regional Internal Application Load Balancer and one run-owned private sample VM on port 80.",
        estimatedCost: "Estimated monthly PoC: about USD 80–90",
        costFixed: "720 hours in asia-northeast1: 3 ILB proxies (~USD 54/mo), 1 e2-small VM + 20 GB disk, Cloud DNS, and dedicated-VPC Cloud NAT.",
        costVariable: "Traffic, logging, and region changes; delete the run after testing to stop hourly charges.",
        nodes: [
          { label: "Managed Chrome", detail: "Trusts issuing root via Chrome Root Store", costBadge: "CEP license required" },
          { label: "Secure Gateway", detail: "Identity, context, and hostname:443 policy", costBadge: "Check CEP agreement" },
          { label: "Regional internal Application LB", detail: "HTTPS termination with server certificate", costBadge: "Region and usage billed" },
          { label: "HTTP backend", detail: "Run-owned private sample VM on port 80", costBadge: "Compute/disk billed" },
        ],
        supports: [
          { label: "Proxy-only subnet", detail: "REGIONAL_MANAGED_PROXY subnet for Envoy proxies" },
          { label: "TLS ownership", detail: "Enterprise CA, local PoC CA, or existing secret" },
          { label: "Chrome trust", detail: "Upload public root PEM to Chrome Root Store for the test OU" },
          { label: "Managed L7 path", detail: "HTTP health check, backend service, URL map, HTTPS proxy, forwarding rule" },
          { label: "Private egress", detail: "Dedicated VPC creates Router/NAT; existing VPC requires private egress" },
          { label: "Safe lifecycle", detail: "Discovery, conflict checks, reverse rollback, and ownership teardown" },
        ],
      },
      {
        eyebrow: "HTTP App · Nginx VM HTTPS Offload (Option C)",
        title: "Secure Gateway + Nginx + HTTP app",
        summary:
          "Use only when an HTTP app or Nginx offload is required. PoC uses one private Nginx VM.",
        estimatedCost: "Estimated monthly PoC: about USD 45–60",
        costFixed: "Compute Engine instances, disks, Cloud DNS, and Cloud NAT for the Nginx path.",
        costVariable: "VM runtime, network transfer, NAT processing, DNS queries, and replica count.",
        nodes: [
          { label: "Managed Chrome", detail: "User identity + device/profile context", costBadge: "CEP license required" },
          { label: "Secure Gateway", detail: "Service Discovery + access policy", costBadge: "Check CEP agreement" },
          { label: "Nginx offload tier", detail: "PoC: 1 private VM · Scale-ready: passthrough ILB + 2-zone MIG", costBadge: "Compute/network billed" },
          { label: "HTTP app", detail: "GCP, AWS, Azure, or on premises", costBadge: "Existing infrastructure" },
        ],
        supports: [
          { label: "CPU autoscaling", detail: "Scale-ready default 2–20 replicas at 60% CPU" },
          { label: "Healthy capacity gate", detail: "Apply waits for the minimum healthy replica count" },
          { label: "Two-zone resilience", detail: "Regional MIG across two zones" },
          { label: "Private DNS", detail: "App hostname resolves to Nginx internal IP" },
          { label: "TLS material", detail: "CA Service, local CA, or existing secret" },
          { label: "Private path", detail: "VPN/Interconnect and firewall when off-GCP" },
          { label: "Discovery + conflicts", detail: "MIG and autoscaler state checked before mutation" },
          { label: "Rollback", detail: "Owned MIG/autoscaler changes roll back on failure" },
          { label: "Product-scoped IAM", detail: "Preflight verifies required permissions for the selected path" },
        ],
      },
    ],
    implementationTitle: "What is implemented",
    implementationIntro:
      "Current codebase capabilities. Scale-ready items exist in the backend while Production selection remains disabled.",
    implementationEyebrow: "Implementation inventory",
    implementationGroups: [
      {
        eyebrow: "Data plane",
        title: "HTTP offload and direct HTTPS",
        items: [
          "Nginx HTTP offload supports a managed sample or an existing HTTP app in GCP, AWS, Azure, or on premises; ILB HTTPS offload uses a run-owned private sample VM.",
          "Option B creates the private sample VM, unmanaged instance group, REGIONAL_MANAGED_PROXY subnet, health check, backend service, URL map, server certificate, HTTPS proxy, forwarding rule, and private DNS.",
          "Direct HTTPS routes hostname:port through an existing VPC without Nginx, offload TLS, NAT, or managed A records.",
          "A dedicated VPC adds Cloud Router/NAT for created VMs; an existing VPC requires verified private egress.",
        ],
      },
      {
        eyebrow: "Scale-ready HTTP tier",
        title: "Regional Nginx availability and autoscaling",
        items: [
          "Implements a two-zone regional Nginx MIG, internal passthrough Network Load Balancer, and regional TLS health check.",
          "CPU autoscaling defaults to 2–20 replicas at 60% CPU and waits for the configured minimum number of healthy replicas.",
          "Includes MIG/autoscaler discovery, conflict detection, and ownership-bounded reverse rollback.",
        ],
      },
      {
        eyebrow: "Google control plane",
        title: "Cloud and Chrome API automation",
        items: [
          "Orchestrates Service Usage, IAM, Compute, Cloud DNS, Secret Manager, CA Service, BeyondCorp, Access Context Manager, Chrome Policy/Management, Licensing, and Billing.",
          "Bootstraps a keyless deployer SA and custom role, and enables missing approved APIs during Apply.",
          "Force-installs Secure Enterprise Browser and Endpoint Verification on the test OU and configures the gateway route.",
        ],
      },
      {
        eyebrow: "TLS and identity",
        title: "Certificates and managed Chrome access",
        items: [
          "Supports Enterprise CA, a validated existing public certificate secret, and a local PoC CA with exported public root PEM.",
          "Stores private keys in Secret Manager with dedicated accessor IAM bindings.",
          "Guides Chrome Root Store upload and OU binding in [Google Admin Console](https://admin.google.com).",
        ],
      },
      {
        eyebrow: "Safe Apply",
        title: "Discovery, approval, progress, and rollback",
        items: [
          "Trusted discovery builds a desired-state diff and blocks incompatible existing resources.",
          "Approvals are bound to the configuration hash, expire, are single-use, and revoke on edit.",
          "Apply records checkpoints and rolls back only owned changes in reverse order while preserving shared before-images.",
        ],
      },
      {
        eyebrow: "Verification and local security",
        title: "Acceptance evidence and operator protections",
        items: [
          "Records automated system checks, managed Chrome client evidence, and access denial tests in a signed JSON bundle with a SHA-256 audit chain.",
          "Uses an isolated MV3 origin, strict CSP, session-only ephemeral private keys, and encrypted IndexedDB without writing JSON keys to disk.",
          "Google Cloud mutations after bootstrap use the pinned keyless deployer service account. Workspace, Chrome, Cloud Identity, and licensing mutations use the signed-in administrator. Service-account JSON keys and AWS/Azure credentials are not accepted.",
        ],
      },
    ],
    stepLabel: (step) => `Step ${step}`,
    steps: [
      {
        title: "Mode",
        subtitle: "Deployment boundary and strategy selection",
        summary:
          "Define the deployment scope, network strategy, and certificate authority model.",
        actions: [
          "Keep rapid PoC mode enabled and explicitly select a dedicated non-production project, VPC, and OU. PoC mode does not prove that selected existing resources are non-production.",
          "Choose between creating a dedicated VPC network or routing through an existing corporate VPC.",
          "Select the TLS certificate source: Enterprise CA, Public Secret, or Local PoC CA.",
        ],
        optionsBehavior: [
          {
            name: "PoC vs. Production Mode",
            behavior:
              "PoC mode enforces a single-zone topology and disables Production mode; select dedicated non-production resources and review the plan.",
          },
          {
            name: "Dedicated VPC vs. Existing VPC",
            behavior:
              "Dedicated VPC provisions a new network with a 10.42.0.0/24 subnet; discovery blocks overlaps or resource collisions it can detect. Existing VPC routes through the selected network.",
          },
          {
            name: "Certificate Strategy",
            behavior:
              "Enterprise CA uses Google Private CA Service, Public Secret uses an existing secret, and Local PoC CA generates a self-signed Root CA.",
          },
        ],
        apiCalls: [],
        safetyNote: "Distribute Local PoC CA only to a dedicated non-production test OU.",
      },
      {
        title: "Identities",
        subtitle: "Keyless cloud and workspace authentication",
        summary:
          "Establish keyless administrator sessions and bootstrap the deployer service account.",
        actions: [
          "Use browser-managed OAuth without exporting or storing service-account JSON keys.",
          "Bootstrap the keyless deployer service account `secure-gateway-deployer` and its custom role.",
          "Validate read access to your [Google Cloud Console](https://console.cloud.google.com) project and [Google Admin Console](https://admin.google.com) Chrome Policy.",
        ],
        optionsBehavior: [
          {
            name: "Google Cloud Project ID",
            behavior:
              "Target GCP project where Secure Gateway and network resources are provisioned.",
          },
          {
            name: "Google Workspace Customer ID",
            behavior:
              "Target Workspace tenant for Chrome Enterprise policy distribution.",
          },
          {
            name: "Bootstrap Deployer Action",
            behavior:
              "Provisions the deployer SA and custom role, granting Token Creator only to the signed-in admin.",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts",
            purpose: "Creates the dedicated keyless deployer service account.",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/roles",
            purpose: "Creates the compatibility-named custom role for deployment, rollback, and teardown; roleId is supplied in the request body.",
          },
          {
            method: "PATCH",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/roles/{roleId}",
            purpose: "Updates the existing compatibility-named custom role with required permissions.",
          },
          {
            method: "POST",
            endpoint: "https://cloudresourcemanager.googleapis.com/v1/projects/{projectId}:setIamPolicy",
            purpose: "Binds the custom deployer role to the service account.",
          },
          {
            method: "GET",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policySchemas",
            purpose: "Validates Chrome Policy schema read access.",
          },
        ],
        safetyNote: "Uses Google OAuth and short-lived impersonated tokens instead of JSON keys.",
      },
      {
        title: "Environment",
        subtitle: "Data plane architecture and routing specification",
        summary:
          "Configure the target VPC, region, private hostname, and architecture path. Option B creates a private sample backend VM.",
        actions: [
          "Specify the application private hostname, port, and upstream VPC network.",
          "For a Shared VPC or cross-project upstream, grant the deployer SA an upstream custom role with compute.networks.get, compute.networks.use, resourcemanager.projects.get, resourcemanager.projects.getIamPolicy, and resourcemanager.projects.setIamPolicy before preflight.",
          "Option B configures a proxy-only subnet CIDR and creates a run-owned private sample backend VM.",
        ],
        optionsBehavior: [
          {
            name: "Option A · Direct HTTPS",
            behavior:
              "Routes directly to an existing private HTTPS endpoint without Nginx or an ILB.",
          },
          {
            name: "Option B · ILB HTTPS Offload",
            behavior:
              "Creates a Regional Internal Application Load Balancer, Envoy proxy subnet, and private sample VM on port 80.",
          },
          {
            name: "Option C · Nginx HTTPS Offload",
            behavior:
              "Deploys a private Compute Engine VM or MIG running Nginx.",
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
            purpose: "Registers the private application route.",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/global/firewalls",
            purpose: "Allows TCP ingress from 136.124.16.0/20.",
          },
          {
            method: "POST",
            endpoint: "https://dns.googleapis.com/dns/v1/projects/{projectId}/managedZones",
            purpose: "Creates the Cloud DNS private zone.",
          },
        ],
        safetyNote: "Enable Global Access on regional ILBs when routing across regions.",
      },
      {
        title: "Certificate",
        subtitle: "TLS ownership and trust propagation",
        summary:
          "Configure certificate issuance, Secret Manager storage, and Chrome Root Store trust.",
        actions: [
          "Choose Enterprise CA Service, an existing secret, or a local PoC CA.",
          "Store TLS private keys in Secret Manager with least-privilege accessor IAM.",
          "Download the public root PEM and add it to Chrome Root Store in [Google Admin Console](https://admin.google.com).",
        ],
        optionsBehavior: [
          {
            name: "Enterprise CA Service",
            behavior:
              "Issues certificates from an existing Google Cloud CA pool.",
          },
          {
            name: "Public Secret",
            behavior:
              "Uses a validated server certificate stored in Secret Manager.",
          },
          {
            name: "Local PoC CA",
            behavior:
              "Generates ephemeral 3072-bit RSA keys in WebCrypto and signs the server certificate in memory.",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://secretmanager.googleapis.com/v1/projects/{projectId}/secrets",
            purpose: "Creates the secret container for TLS certificates and keys.",
          },
          {
            method: "POST",
            endpoint: "https://secretmanager.googleapis.com/v1/projects/{projectId}/secrets/{secretId}:addVersion",
            purpose: "Uploads the certificate payload version.",
          },
        ],
        safetyNote:
          "The root CA private key is never exported, and the server private key is cleared from session storage once uploaded to Secret Manager.",
      },
      {
        title: "Access",
        subtitle: "Zero-Trust policy and user authorization",
        summary:
          "Bind Context-Aware Access levels and push Chrome policies to the test OU.",
        actions: [
          "Select the target test OU from the Directory dropdown.",
          "Attach an optional Context-Aware Access level.",
          "Grant Secure Gateway application access to test users, groups, or domains.",
        ],
        optionsBehavior: [
          {
            name: "Target Organizational Unit",
            behavior:
              "Pushes gateway policies only to managed browsers in the selected test OU.",
          },
          {
            name: "Managed Chrome Access Level",
            behavior:
              "Restricts gateway access to profiles or devices meeting your posture policy.",
          },
          {
            name: "Principals",
            behavior:
              "Binds `roles/beyondcorp.sgApplicationUser` to authorized test identities.",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:batchModify",
            purpose: "Force-installs extensions and configures gateway routing on the test OU.",
          },
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways/{gw}/applications/{app}:setIamPolicy",
            purpose: "Binds application IAM roles and access levels.",
          },
        ],
        safetyNote: "Inherited parent PAC policies are overridden only on the selected test OU.",
      },
      {
        title: "Review",
        subtitle: "Deterministic preflight and cryptographic approval",
        summary:
          "Run read-only discovery, evaluate all safety gates, and bind approval to a SHA-256 hash.",
        actions: [
          "Scan Cloud and Workspace resources to build a desired-state diff.",
          "Evaluate safety gates for APIs, permissions, CIDRs, licenses, and certificates.",
          "Approve the exact configuration hash.",
        ],
        optionsBehavior: [
          {
            name: "Preflight Discovery",
            behavior:
              "Runs read-only probes to detect resource conflicts before execution.",
          },
          {
            name: "Safety Gates",
            behavior:
              "Checks billing, CEP licenses, DNS, and IAM prerequisites.",
          },
          {
            name: "SHA-256 Approval Binding",
            behavior:
              "Binds approval to the canonical plan hash and revokes it on any edit.",
          },
        ],
        apiCalls: [
          {
            method: "GET",
            endpoint: "https://serviceusage.googleapis.com/v1/projects/{projectId}/services",
            purpose: "Checks enabled Google Cloud APIs.",
          },
          {
            method: "POST",
            endpoint: "https://cloudresourcemanager.googleapis.com/v1/projects/{projectId}:testIamPermissions",
            purpose: "Verifies required IAM permissions.",
          },
        ],
        safetyNote: "Approval is disabled while any blocking safety gate remains unresolved.",
      },
      {
        title: "Apply",
        subtitle: "Ordered orchestration, rollback, and evidence capture",
        summary:
          "Execute approved changes in dependency order with ownership tracking and acceptance verification.",
        actions: [
          "Provision subnets, certificates, backend, gateway, DNS, and Chrome policies in dependency order.",
          "Track resource ownership and reverse-rollback owned changes on failure.",
          "Run automated system checks and record managed Chrome verification in Operations.",
        ],
        optionsBehavior: [
          {
            name: "Dependency-Ordered Execution",
            behavior:
              "Provisions network and secret prerequisites before binding higher-level services.",
          },
          {
            name: "Automated Reverse Rollback",
            behavior:
              "Rolls back owned resources in reverse order on failure while preserving shared assets.",
          },
          {
            name: "Separate acceptance verification and evidence",
            behavior:
              "Apply only persists the matrix. Run automated system checks and record client evidence in Operations.",
          },
        ],
        apiCalls: [],
        safetyNote:
          "Resumes from durable checkpoints if suspended, or rolls back owned resources if an ephemeral TLS key is lost.",
      },
    ],
    faqTitle: "Frequently Asked Questions & Troubleshooting",
    faqIntro:
      "Troubleshooting steps for routing, certificates, OAuth distribution, and teardown.",
    faqEyebrow: "Troubleshooting & operations",
    faqChecklistLabel: "Verification checklist",
    faqs: [
      {
        id: "faq-503-unavailable",
        category: "Routing & Data Path",
        question: "Why does Chrome show '503 Service Unavailable' when accessing a private app?",
        answer:
          "BeyondCorp Security Gateway cannot reach the approved run-scoped backend hostname and reserved private address over TCP/TLS. Check the Compute target, firewall, private DNS, and Cloud NAT.",
        checklist: [
          "Run automated system checks from the run's Resources and Logs panels.",
          "Confirm the firewall rule allows the backend port from 136.124.16.0/20.",
          "Verify Cloud Router and Cloud NAT, when required by the approved network strategy, are configured for the created subnet in the VPC selected in this run.",
          "Confirm the Cloud DNS private zone maps the approved hostname to the reserved private IP.",
        ],
      },
      {
        id: "faq-cert-authority-invalid",
        category: "Certificates & Root CA",
        question: "Why does Chrome report 'net::ERR_CERT_AUTHORITY_INVALID'?",
        answer:
          "The server certificate's root CA is not linked to the test OU in Chrome Root Store, or the managed profile has not reloaded policies yet.",
        checklist: [
          "Download the public PoC root PEM from Apply or Deployment Manager.",
          "In [Google Admin Console](https://admin.google.com), add the PEM at Chrome > Connectors > Chrome Root Store and bind it to the test OU.",
          "Open `chrome://policy` in the managed profile and click 'Reload policies'.",
        ],
      },
      {
        id: "faq-oauth-external-mode",
        category: "OAuth & Distribution",
        question: "How should the OAuth Consent Screen be configured for external testers?",
        answer:
          "Use External / Testing for named testers outside your domain. Because this extension requests sensitive scopes, external production distribution requires Google OAuth branding and scope verification.",
        checklist: [
          "In [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > OAuth consent screen, set User Type to External.",
          "Add each tester under Test users while in Testing mode.",
        ],
      },
      {
        id: "faq-extension-id-mismatch",
        category: "OAuth & Distribution",
        question: "How do we prevent 'OAuth2 request failed: Bad Client ID' on tester machines?",
        answer:
          "Ensure the `key` in `manifest.json` keeps the Extension ID identical to the Item ID registered on your GCP OAuth 2.0 Client ID.",
        checklist: [
          "Compare the extension ID on `chrome://extensions` with the Item ID in [Google Cloud Console](https://console.cloud.google.com).",
          "Use the packaged ZIP, which embeds the fixed public key.",
        ],
      },
      {
        id: "faq-access-level-cel",
        category: "Zero Trust & Security",
        question: "How does Access Context Manager enforce Managed Chrome requirements?",
        answer:
          "BeyondCorp Application IAM bindings evaluate `device.chrome.management_state` via Access Context Manager and deny non-compliant requests at Google's edge.",
        checklist: [
          "Select NONE or an existing `accessPolicies/.../accessLevels/...` resource in Deployment Manager.",
          "All modifications are logged to the tamper-evident cryptographic audit trail.",
        ],
      },
      {
        id: "faq-owned-teardown",
        category: "Operations & Teardown",
        question: "How do we safely remove resources created by a deployment?",
        answer:
          "Run Teardown in Deployment Manager to delete owned resources in reverse dependency order. Shared IAM and Chrome policies are restored only when the current value safely matches that run's recorded managed-after state; drift or an unknown write is retained.",
        checklist: [
          "Review the owned, restored, and retained resource lists in Deployment Manager > Teardown.",
          "Type the exact confirmation phrase to start teardown.",
        ],
      },
      {
        id: "faq-existing-default-gateway",
        category: "Shared Gateway Coexistence",
        question: "What happens if our project already has an existing 'default' Security Gateway?",
        answer:
          "Preflight automatically marks an active compatible `default` gateway for non-destructive reuse (`action: reuse`, `owned_after_apply: false`), adds only the new Application route, and retains the gateway during Teardown.",
        checklist: [
          "Confirm the existing `default` gateway is RUNNING without custom `serviceDiscovery` or `proxyProtocolConfig`.",
          "Use a unique Private Application Hostname to avoid application ID collisions.",
        ],
      },
    ],
  },
  cepDeployer: {
    title: "Easy PoC for Chrome Enterprise Premium",
    subtitle:
      "Apply a CEP evaluation baseline to a pilot OU or Google Group.",
    intro:
      "Applies threat protection, content inspection, and data boundary policies to a pilot scope. Cleanup inspection is read-only and retains Chrome Policy, Access Level, and DLP candidates for review.",
    targetOuCardTitle: "1. Target organizational unit",
    targetOuCardSubtitle:
      "Pick an isolated non-production pilot OU. Root is blocked.",
    targetScopeCardTitle: "1. Target scope",
    targetScopeCardSubtitle:
      "Choose an Organizational Unit or Google Group. Groups apply policies without moving users.",
    targetTypeOu: "Organizational Unit",
    targetTypeGroup: "Google Group",
    selectTargetGroup: "Target Google Group",
    selectTargetGroupPlaceholder: "Select or enter a Google Group",
    refreshGroups: "↻ Refresh Groups",
    targetGroupImpact:
      "Chrome policies and DLP rules apply directly to members of the selected Google Group without moving users between OUs.",
    targetGroupConfirmationLabel: "Confirm the target group email",
    targetGroupConfirmationHint:
      "Cleared after each change. Type the group email above to confirm.",
    copyTargetGroupEmail: "Copy Group Email",
    groupLoadFailed: "Groups could not be loaded. Enter the group email manually.",
    customGroupInputPlaceholder: "e.g. poc-team@yourdomain.com",
    orEnterGroupEmail: "Or enter group email directly:",
    selectTargetOu: "Target organizational unit",
    selectTargetOuPlaceholder: "Select a non-root pilot OU",
    rootOuUnavailable: "root — unavailable",
    targetOuImpact:
      "Policies and OU-scoped DLP rules inherit to the selected OU and descendant OUs. License assignment targets only users directly inside the selected OU.",
    targetOuConfirmationLabel: "Confirm the target OU path",
    targetOuConfirmationHint:
      "Cleared after each change. Type the displayed OU path to confirm.",
    ouLoadFailed:
      "OUs could not be loaded. Verify the Workspace connection above.",
    canonicalCustomerIdRequired:
      "Verify Workspace first. DLP rules require a Customer ID starting with C rather than my_customer.",
    autoDetectCustomerIdBtn: "Auto-detect Customer ID",
    autoDetectingCustomerIdBtn: "Detecting Customer ID…",
    googleAccountVerifiedBanner: (customerId, ouCount, groupCount) =>
      `Google Account Verified · Customer ID: ${customerId} · ${ouCount} OUs · ${groupCount} Groups`,
    dlpMatrixCustomizePrefix: "Customize ",
    dlpMatrixCustomizeMiddle: " rules in the ",
    dlpMatrixCustomizeSuffix: " tab",
    verifyGoogleAccount: "Verify Google Account & Load Directory",
    verifyingGoogleAccount: "Verifying & Loading Directory…",
    verifyGoogleAccountHint: "Sign in with Google OAuth to load OUs and Google Groups.",
    retry: "Retry",
    refreshOus: "↻ Refresh OUs",
    reloading: "Reloading…",
    createPilotOuLabel: "Create a pilot child OU under / in 1 click:",
    createPilotOuPlaceholder: "CEP-PoC",
    createPilotOuBtn: "＋ Create & Select Pilot OU",
    creatingPilotOuBtn: "Creating Pilot OU…",
    createPilotOuHint:
      "Creates or reuses a child OU under '/' and selects it. Then move 1–2 test users into this OU in admin.google.com > Directory > Users.",
    pilotOuCreatedBanner: (path) =>
      `Pilot OU '${path}' selected. Move 1–2 test users into '${path}' in admin.google.com > Directory > Users.`,
    autoCreateSubOus: "Create \"CEP Users\" and \"CEP Browsers\" sub OUs",
    autoCreateSubOusHint:
      "Creates optional child OUs that inherit policies from the selected pilot OU.",
    presetsTitle: "2. Presets",
    presetsSubtitle:
      "Select a baseline preset and adjust individual modules below.",
    presetFullPoc: "Full evaluation",
    presetFullPocDesc:
      "All modules: threat protection, content inspection, reporting, posture signals, paste inspection, and personal account blocking.",
    presetAiProtection: "Generative AI and data leaks",
    presetAiProtectionDesc:
      "Paste and upload inspection for external AI tools plus personal account blocking.",
    presetPersonalAccount: "Block personal Google accounts",
    presetPersonalAccountDesc:
      "Enforces AllowedDomainsForApps, RestrictAccountsToPatterns, RestrictSigninToPattern, BrowserSignin, and disables Guest and Incognito modes.",
    presetEndpoint: "Endpoint hardening",
    presetEndpointDesc:
      "Enhanced Safe Browsing, real-time URL checks, Endpoint Verification, Context-Aware Access, and personal account blocking.",
    presetAudit: "Visibility and warnings",
    presetAuditDesc: "Reporting and warning-only Chrome DLP rules without blocking.",
    modulesTitle: "3. Policy modules",
    modulesSubtitle:
      "Each module is applied in its own batch.",
    moduleCorePolicies: "Chrome core security policies",
    moduleCorePoliciesDesc:
      "Enhanced Safe Browsing, password reuse warnings, and Chrome cloud/profile reporting.",
    moduleForceExtensions: "Force-install Endpoint Verification",
    moduleForceExtensionsDesc:
      "Pushes Google's Endpoint Verification extension for device posture signals.",
    moduleConnectors: "Content inspection connectors",
    moduleConnectorsDesc:
      "Real-time URL checks, file upload/download inspection, and security event reporting.",
    accessLevelTitle: "Context-Aware Access Level",
    accessLevelSelectPrompt: "Select an Access Level to enforce",
    accessLevelHint:
      "Applies DLP unmanaged-device rules and Gateway controls via CEL access_levels.meets_access_requirements.",
    accessLevelNone: "None",
    accessLevelNoneDesc: "Do not require an access level.",
    accessLevelAutoProfile: "Create one: managed Chrome profile",
    accessLevelAutoBrowser: "Create one: managed Chrome browser",
    accessLevelAutoAny: "Create one: managed profile or browser",
    accessLevelAutoCorpOwned: "Create one: company-owned device or managed browser",
    accessLevelAutoByod: "Create one: BYOD / personal devices",
    accessLevelAutoAndroidByod: "Create one: Android BYOD devices",
    accessLevelAutoIosByod: "Create one: iPhone / iOS BYOD devices",
    accessLevelExistingGroup: "Existing access levels",
    accessLevelLoadFailed:
      "Access levels could not be listed. Requires a GCP project under an organization with an Access Context Manager policy.",
    moduleDlpDetectors: "DLP detector for internal sites",
    moduleDlpDetectorsDesc:
      "Unavailable: settings/detector.url_list is not supported by the policy mutation API.",
    moduleDlpRules: "Starter DLP rules",
    moduleDlpRulesDesc:
      "Creates warn/block rules for sensitive data transfers and watermarks internal URLs.",
    betaBadge: "Beta",
    dlpBetaNote:
      "Uses the Cloud Identity policy API for settings/rule.dlp mutations.",
    dlpRegionTitle: "National identifier to scan for",
    dlpRegionHint:
      "Selects the regional Cloud DLP detector used by the national ID rule.",
    dlpRulesTableTitle: "Rules and actions",
    dlpRulesTableHint:
      "Supported actions: Audit only, Allow with warning, Block, or Off.",
    dlpActionOff: "Do not create",
    dlpActionAudit: "Audit only",
    dlpActionWarn: "Allow with warning",
    dlpActionBlock: "Block",
    dlpRuleNationalId: "National ID numbers pasted into pages",
    dlpRulePaymentCard: "Payment card numbers in uploads",
    dlpRuleAccessLevel: "Uploads from unmanaged Chrome",
    dlpRuleWatermark: "Watermark internal pages",
    dlpNoticeByodTitle: "Context-Aware Access Level Enforcement",
    dlpNoticeByodDesc: "BYOD and OS-scoped rows use CEL access_levels.meets_access_requirements to target company-owned, BYOD, Android, or iOS devices.",
    activePresetBadge: "Active",
    dataBoundaryModeTitle: "Data boundary",
    dataBoundaryModeCopyPaste: "Inspect pasted content + block personal accounts",
    dataBoundaryModeCopyPasteDesc:
      "Inspects pasted text and enforces AllowedDomainsForApps, RestrictAccountsToPatterns, RestrictSigninToPattern, BrowserSignin, and Guest/Incognito blocking.",
    dataBoundaryModeBlockNonCorp: "Block non-corporate / personal Google accounts",
    dataBoundaryModeBlockNonCorpDesc:
      "Enforces AllowedDomainsForApps, RestrictAccountsToPatterns, RestrictSigninToPattern, BrowserSignin, and disables Guest and Incognito modes.",
    dataBoundaryModeNone: "None",
    dataBoundaryModeNoneDesc:
      "Inherit clipboard and account settings from the parent OU.",
    httpHeadersTitle: "SaaS Tenant Restriction Headers",
    httpHeadersSubtitle:
      "Inject HTTP headers on matching URLs to restrict SaaS logins to your corporate tenant.",
    httpHeadersPresetLabel: "Add SaaS Preset:",
    httpHeadersAddCustomBtn: "+ Custom Header Rule",
    httpHeadersEmptyHint:
      "Select a SaaS preset above to restrict logins to your organization's tenant.",
    httpHeadersRemoveRuleBtn: "Remove",
    httpHeadersPatternsLabel: "Target URL Patterns",
    httpHeadersTenantValueLabel: "Allowed Tenant / Workspace / Enterprise ID",
    httpHeadersNameLabel: "Header Name",
    httpHeadersValueLabel: "Header Value",
    httpHeadersBoxNote:
      "Box primarily enforces tenant boundaries via vanity URLs and IdP Conditional Access.",
    httpHeadersM365ContextLabel: "Directory Tenant GUID for Restrict-Access-Context",
    internalUrlsTitle: "Protected Internal Sites",
    internalUrlsPlaceholder: "https://intranet.example.com\nhttps://portal.corp.example.com",
    internalUrlsHint:
      "Applies dynamic watermarks and blocks screenshots on these URLs. One URL per line.",
    rolesCardTitle: "4. Workspace administrator access",
    rolesCardSubtitle:
      "Assign Workspace privileges in the Admin console. GCP IAM roles do not grant Chrome Policy access.",
    roleAdminLabel: "Policy operator",
    roleAdminDesc:
      "Scoped Admin role with Chrome and OU privileges. DLP rules require a Super Admin.",
    roleAuditorLabel: "Read-only reviewer",
    roleAuditorDesc:
      "Separate Admin role with Chrome and OU read privileges.",
    roleAssigneeEmailLabel: "Assignee Administrator Email",
    roleAssigneeEmailPlaceholder: "admin@example.com",
    roleAssigneeEmailHint: "Leave blank to create roles without assigning a user.",
    roleTypeSelectLabel: "Target Roles",
    roleTypeBoth: "Both: Policy Operator & Auditor",
    roleTypeAdminOnly: "Policy Operator Only",
    roleTypeAuditorOnly: "Auditor Only",
    roleScopeOuCheckbox: "Limit role scope to selected OU",
    roleCreateAssignBtn: "Create & Assign Workspace Roles",
    roleCreatingBtn: "Creating & Assigning Roles...",
    rolesAdminConsoleLink: "Open Admin roles in Google Admin console",
    rolesVerificationNote:
      "Run Verify Google Account after assigning roles.",
    rolesScopeManualChecklistTitle:
      "Admin Console Role Setup",
    rolesScopeManualChecklistDesc:
      "If role creation returns HTTP 403, assign privileges in Google Admin Console > Account > Admin roles:",
    rolesScopeManualSteps: [
      "Policy Operator: Chrome Management > Settings and Admin API Privileges > Organization Units scoped to the pilot OU.",
      "Read-Only Auditor: Chrome Management > Settings Read and Security Center > Audit Logs.",
      "Cloud Identity DLP Rules: Requires a Workspace Super Administrator account.",
    ],
    testingScenariosTitle: "5. Testing the result",
    testingScenariosSubtitle:
      "Safe dummy values to trigger DLP detectors without using real data.",
    copyDummyData: "Copy",
    copiedToClipboard: "Copied",
    dummyPiiLabel: "Sample national ID number",
    dummyPiiValue: "1234-5678-9012",
    dummyPiiHint: "Dummy My Number / SSN format.",
    dummyCreditCardLabel: "Sample card number",
    dummyCreditCardValue: "4532015112830366",
    dummyCreditCardHint: "Visa Luhn test number.",
    dummySourceCodeLabel: "Sample API key in source",
    dummySourceCodeValue:
      "const GCP_SECRET_KEY = 'AIzaSyA_DEMO_CONFIDENTIAL_KEY_FOR_TESTING';",
    dummySourceCodeHint: "Dummy API key pattern.",
    scenarioGenAiTitle: "Paste inspection",
    scenarioGenAiStep:
      "Paste the sample API key into an external AI tool to verify paste inspection.",
    scenarioDataBoundaryTitle: "Data boundary",
    scenarioDataBoundaryStep:
      "Sign in to a personal Google account in the managed profile to verify sign-in blocking.",
    scenarioWatermarkTitle: "Upload inspection",
    scenarioWatermarkStep:
      "Upload a file containing the sample card number to verify upload inspection and logging.",
    manualChecklistTitle: "Manual Admin Console steps",
    manualChecklistSubtitle:
      "Complete these settings in the Admin Console before testing.",
    manualChecklistItems: [
      {
        title: "Turn on sensitive content storage",
        detail: "Security > Access and data control > Data protection.",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "Turn on optical character recognition",
        detail: "Required to inspect text inside images.",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "Enable automatic CEP licensing",
        detail: "Billing > License settings for the pilot OU.",
        href: "https://admin.google.com/ac/billing/licensesettings",
      },
    ],
    btnDeploy: "Apply to the target OU",
    btnDeploying: "Applying...",
    btnRollback: "Roll back DLP rules & inspect cleanup candidates",
    btnRollingBack: "Rolling back DLP rules...",
    btnDownloadScript: "Export Chrome policies as Python",
    confirmRollback:
      "Delete CEP PoC DLP rules for the selected target scope and inspect remaining Chrome Policy and Access Level cleanup candidates. Continue?",
    downloadFailed: "The script could not be generated",
    noModulesSelected: "Select at least one policy module.",
    appliedTitle: "Applied",
    skippedTitle: "Skipped",
    statusLogTitle: "Execution trace",
    noActionYet: "Select a target scope and modules, then apply.",

    licenseCardTitle: "License Management",
    licenseCardSubtitle:
      "Assign CEP licenses directly to users in the target OU.",
    licensePilotLimitNotice:
      "Targets only users directly in the selected non-root OU: at most 10 unique users within 4 Directory pages and a 5-second deadline, excluding sub-OUs. Lost POST responses reconcile via exact GET.",
    licenseAutoAssignWarning:
      "Keep auto-assignment turned OFF on the Root OU to prevent domain-wide license consumption.",
    licenseAutoAssignWarningLink: "Open Google Admin Console License Settings",
    licenseAutoAssignSteps: [
      "1. Open Billing > License settings on the Root OU.",
      "2. Turn Auto-assign OFF for Chrome Enterprise Premium.",
      "3. Assign licenses only to the pilot OU or use the button below.",
    ],
    btnAssignLicensesToOu: "Assign CEP licenses · max 10 direct-OU users",
    copyTargetOuPath: "Auto-fill path",
    tabSetup: "1. Setup Wizard",
    tabLicensing: "2. Users & Licensing",
    tabDlp: "3. DLP & Threat Matrix",
    tabOperations: "4. Operations & Testing",
    tabAll: "View All Sections",
    btnAssigningLicenses: "Assigning licenses...",
    licenseAssignUsersFound: "Processed users in OU",
    noUsersFoundInOu: "No users found in this organizational unit.",

    dlpMatrixTitle: "DLP Control Matrix",
    dlpMatrixSubtitle:
      "Configure Block, Warn, or Off across Upload, Download, Paste, Print, Watermark, and Device/OS Scope.",
    dlpColThreat: "Data & Threat Category",
    dlpColUpload: "Upload",
    dlpColDownload: "Download",
    dlpColPaste: "Paste",
    dlpColPrint: "Print",
    dlpColWatermark: "Watermark",
    dlpColDeviceScope: "Supported Scope",

    dlpEnvBuilderTitle: "Company Device & OS Environment",
    dlpEnvBuilderSubtitle:
      "Select which device ownership types and mobile OS exist in your organization, then auto-configure DLP scopes with one click.",
    dlpEnvCorpPc: "Company-Owned PC · Windows / Mac / ChromeOS",
    dlpEnvByodPc: "PC BYOD · Personal Windows / Mac",
    dlpEnvCorpAndroid: "Company-Owned Android",
    dlpEnvCorpIos: "Company-Owned iPhone / iPad",
    dlpEnvByodAndroid: "Android BYOD · Personal Android",
    dlpEnvByodIos: "iPhone / iOS BYOD · Personal iPhone / iPad",
    dlpEnvApplyBtn: "Auto-Configure DLP Matrix for Selected Environment",
    dlpEnvSummaryNotice:
      "Selected environment rules are applied to per-row device scopes via Access Context Manager CEL conditions.",

    dlpRowUniversalUpload: "All file uploads",
    dlpRowUniversalUploadDesc: "Controls all file uploads from Chrome.",
    dlpRowUniversalDownload: "All file downloads",
    dlpRowUniversalDownloadDesc: "Controls all file downloads in Chrome.",
    dlpRowPaymentCard: "Credit card / Payment data",
    dlpRowPaymentCardDesc: "Detects payment card numbers in uploads, pastes, and prints.",
    dlpRowNationalId: "National ID / PII data",
    dlpRowNationalIdDesc: "Detects regional national ID numbers such as My Number or SSN.",
    dlpRowAccessLevel: "Unmanaged / Context-Aware non-compliant devices",
    dlpRowAccessLevelDesc: "Enforces DLP controls via CEL access_levels.meets_access_requirements.",
    dlpRowAndroidByod: "Android BYOD device controls",
    dlpRowAndroidByodDesc: "Enforces DLP controls on Android BYOD devices via OsType.ANDROID && !is_corp_owned_device.",
    dlpRowIosByod: "iPhone / iOS BYOD device controls",
    dlpRowIosByodDesc: "Enforces DLP controls on iPhone and iPad BYOD devices via OsType.IOS && !is_corp_owned_device.",
    dlpRowWatermark: "Internal sites / Watermark",
    dlpRowWatermarkDesc: "Applies dynamic watermarks and restricts screenshots on internal URLs.",
    dlpRowGenAiBlock: "Unapproved GenAI · allow Gemini",
    dlpRowGenAiBlockDesc: "Blocks unapproved AI sites while allowing corporate Gemini.",

    dlpScopeAll: "All Devices",
    dlpScopeByodOnly: "Access Level · CAA",
    dlpScopeSelectByodOnly: "BYOD Only · PC & Mobile",
    dlpScopeSelectCorpOnly: "Company-Owned Only",
    dlpScopeSelectDesktopByod: "PC BYOD Only · Win / Mac",
    dlpScopeSelectMobileByod: "Mobile BYOD Only · Android + iOS",
    dlpScopeSelectAndroidByod: "Android BYOD Only",
    dlpScopeSelectIosByod: "iPhone / iOS BYOD Only",
    dlpScopeSelectAndroidAll: "All Android · Corp + BYOD",
    dlpScopeSelectIosAll: "All iPhone / iOS · Corp + BYOD",
    dlpActionBadgeBlock: "Block",
    dlpActionBadgeWarn: "Warn",
    dlpActionBadgeAudit: "Unsupported",
    dlpActionBadgeAuditOnly: "Audit",
    dlpActionBadgeOff: "Off",

    dlpActionParamsTitle: "Action Parameters",
    dlpActionParamsSubtitle: "Optional message and evidence settings for triggered DLP rules",
    dlpCustomMessageLabel: "Custom End-User Message",
    dlpCustomMessagePlaceholder: "e.g. This action violates corporate data protection policy.",
    dlpCustomMessageHint: "Shown in Chrome when a rule warns or blocks.",
    dlpSaveContentLabel: "Save Matched Content Evidence",
    dlpSaveContentHint: "Stores matched content for security investigation.",

    dlpPresetRecommended: "Standard PoC",
    dlpPresetRecommendedDesc: "Warn on sensitive data, block unapproved GenAI, and watermark internal sites.",
    dlpPresetStrictZeroTrust: "Strict Zero Trust",
    dlpPresetStrictZeroTrustDesc: "Block sensitive uploads and pastes across all selected surfaces.",
    dlpPresetGenAiSecure: "Secure GenAI Pilot",
    dlpPresetGenAiSecureDesc: "Block unapproved AI and allow Gemini with paste inspection.",
    dlpPresetAuditOnly: "Warning First",
    dlpPresetAuditOnlyDesc: "Use warning actions across all selected surfaces.",
    dlpPresetByodMobile: "BYOD & Mobile Split",
    geminiEnterpriseTitle: "Gemini Enterprise & Vertex AI Search Protection",
    geminiEnterpriseSubtitle:
      "Layered protection across Chrome, Identity, and Google Cloud perimeters.",
    geminiLayer1Title: "1. Chrome Endpoint & DLP Protection",
    geminiLayer1Desc:
      "Inspect prompts and downloads on generative AI web apps.",
    geminiLayer1Bullet1:
      "Block or warn when pasting PII, API keys, or confidential data into prompts.",
    geminiLayer1Bullet2:
      "Apply watermarks on AI reports and internal search pages.",
    geminiLayer2Title: "2. Context-Aware Access",
    geminiLayer2Desc:
      "Restrict authentication to compliant enterprise browsers.",
    geminiLayer2Bullet1:
      "Require managed Chrome browsers or corporate IP ranges.",
    geminiLayer2Bullet2:
      "Assign Workspace CAA policies directly to the Gemini app.",
    geminiLayer3Title: "3. VPC Service Controls & Agent Gateway",
    geminiLayer3Desc:
      "Protect Discovery Engine APIs inside a VPC-SC perimeter.",
    geminiLayer3Bullet1:
      "Isolate discoveryengine.googleapis.com inside a service perimeter.",
    geminiLayer3Bullet2:
      "Enforce mTLS and DPoP token binding for agent traffic.",
    geminiCliTitle: "VPC-SC & Access Level CLI Commands",
    geminiCliCopyBtn: "Copy commands",
    dlpPresetGeminiEnterprise: "Gemini Enterprise",
    geminiAutoProvisionTitle: "Gemini Enterprise Zero-Trust Provisioning",
    geminiAutoProvisionSubtitle:
      "Provision ACM access levels and VPC Service Controls perimeters.",
    geminiTargetProjectLabel: "Target Google Cloud Project ID",
    geminiPolicyIdLabel: "ACM Policy ID · auto-detected if blank",
    geminiPerimeterNameLabel: "VPC-SC Perimeter Identifier",
    geminiEnforceAccessLevelLabel: "Create & bind ACM Access Level requiring Managed Chrome",
    geminiAccessLevelSelectLabel: "ACM Access Level",
    geminiAccessLevelDefaultOption: "Auto-create: secgw_chrome_managed",
    geminiAccessLevelSelectHint: "Select an existing ACM Access Level or auto-create one for Managed Chrome.",
    geminiEnforcePerimeterLabel: "Create VPC-SC Perimeter for discoveryengine.googleapis.com",
    geminiDryRunLabel: "Create in Dry-Run mode · log violations without blocking",
    geminiAutoProvisionBtn: "Provision Zero-Trust Perimeter",
    geminiAutoProvisioningBtn: "Provisioning Zero-Trust...",
    geminiSuccessTitle: "Zero-Trust Security Perimeter Provisioned",
    geminiStep1: "1. Resolving GCP Project & Access Policy",
    geminiStep2: "2. Ensuring ACM Access Level",
    geminiStep3: "3. Ensuring VPC-SC Perimeter",
    geminiStep4: "4. Verifying Zero-Trust Posture",
    geminiStep5Rca: "5. Creating RCA User Access Binding",
    geminiAdminLockoutWarningTitle: "GCP Console Admin Access Notice",
    geminiAdminLockoutWarningText:
      "Enforcing VPC-SC on discoveryengine.googleapis.com requires GCP admins to use a Managed Chrome browser as well. Use Approach 2 RCA group binding or ingress rules to avoid unmanaged console 403 errors.",
    geminiEnforceRcaLabel: "Approach 2: Bind Restricted Client Application to Google Group",
    geminiRcaGroupKeyLabel: "Target Google Group Email or ID",
    geminiRcaGroupKeyPlaceholder: "e.g. gemini-enterprise-users@example.com",
    geminiRcaGroupKeyHint:
      "Binds Gemini Enterprise access levels only to the target group via ACM.",
    geminiRcaBindingLabel: "RCA Cloud Binding",
    geminiRcaCliTitle: "RCA gcloud Provisioning Commands",
    geminiRcaCliCopyBtn: "Copy RCA commands",

    deployProgressTitle: "Deploying Chrome Enterprise Premium...",
    deployStep1: "1. Target Scope Validation",
    deployStep2: "2. Policy Generation",
    deployStep3: "3. DLP Rule Registration",
    deployStep4: "4. Finalization & Audit Logging",

    rollbackProgressTitle: "Rolling Back DLP Rules & Inspecting Candidates...",
    rollbackStep1: "1. Identifying Resources",
    rollbackStep2: "2. Checking OU Policies",
    rollbackStep3: "3. Deleting CEP PoC DLP Rules & Checking Access Levels",
    rollbackStep4: "4. Rollback & Inspection Complete",

    roleProgressTitle: "Creating & Assigning Workspace Roles...",
    roleStep1: "1. Verifying Directory Privileges",
    roleStep2: "2. Creating Operator & Auditor Roles",
    roleStep3: "3. Assigning Roles",
    roleStep4: "4. Role Assignment Complete",

    licenseProgressTitle: "Assigning Evaluation Licenses...",
    licenseStep1: "1. Listing Users in Target OU",
    licenseStep2: "2. Assigning CEP Licenses",
    licenseStep3: "3. License Assignment Complete",
    errDiagIamTitle: "Google Cloud IAM Permission Insufficient",
    errDiagIamCause: "The signed-in account lacks Access Context Manager permissions such as roles/accesscontextmanager.policyAdmin.",
    errDiagIamRemediation: "Grant roles/accesscontextmanager.policyAdmin at the organization level and retry.",
    errDiagIamConsoleLink: "Open Google Cloud IAM Console",
    errDiagWorkspaceTitle: "Google Workspace Super Admin Required",
    errDiagWorkspaceCause: "The signed-in account lacks Workspace Super Admin privileges or Admin SDK access.",
    errDiagWorkspaceRemediation: "Sign in with a Workspace Super Admin account or grant Admin SDK privileges.",
    errDiagWorkspaceConsoleLink: "Open Admin Console Roles",
    errDiagVpcScConflictTitle: "VPC Service Controls Perimeter Conflict",
    errDiagVpcScConflictCause: "This GCP project already belongs to another VPC-SC perimeter or the perimeter name exists.",
    errDiagVpcScConflictRemediation: "Use an isolated evaluation project or update the existing perimeter in Cloud Console.",
    errDiagVpcScConsoleLink: "Open VPC Service Controls Console",
    errDiagOuConfirmTitle: "Target Scope Confirmation Mismatch",
    errDiagOuConfirmCause: "The confirmation text does not match the selected OU path or group email.",
    errDiagOuConfirmRemediation: "Copy the exact target path or email shown above into the confirmation field.",
    errDiagRateLimitTitle: "Google Cloud API Rate Limit Exceeded",
    errDiagRateLimitCause: "Cloud Identity or Resource Manager API requests exceeded quota.",
    errDiagRateLimitRemediation: "Wait 10–30 seconds and click Retry.",
    errDiagWorkerTitle: "Extension Service Worker Suspended",
    errDiagWorkerCause: "Chrome suspended the background service worker during the request.",
    errDiagWorkerRemediation: "Click Retry below or reload the extension page.",
    errDiagProjectNoOrgTitle: "GCP Project Not in an Organization",
    errDiagProjectNoOrgCause: "Access Context Manager and VPC-SC require a project under a Google Cloud Organization.",
    errDiagProjectNoOrgRemediation: "Select a GCP project belonging to your organization.",
    errDiagPolicyNotFoundTitle: "Access Context Manager Policy Not Found",
    errDiagPolicyNotFoundCause: "No Access Policy exists in the organization or the policy ID could not be resolved.",
    errDiagPolicyNotFoundRemediation: "Create an Access Policy in Cloud Console or enter the policy ID manually.",
    errDiagPolicyConsoleLink: "Open Access Context Manager Console",
    errDiagOuStaleTitle: "Target OU Not Found",
    errDiagOuStaleCause: "The selected OU was deleted or moved in Workspace Directory.",
    errDiagOuStaleRemediation: "Refresh OUs and select the target OU again.",
    errDiagRootOuForbiddenTitle: "Root OU Blocked",
    errDiagRootOuForbiddenCause: "Applying policies or licenses directly to the Root OU is blocked for safety.",
    errDiagRootOuForbiddenRemediation: "Select a dedicated child OU or Google Group.",
    errDiagScopeInvalidTitle: "Invalid Workspace Customer Scope",
    errDiagScopeInvalidCause: "A valid Workspace Customer ID and target scope are required.",
    errDiagScopeInvalidRemediation: "Verify the Workspace connection and select a target OU or group.",
    errDiagProjectRequiredTitle: "Google Cloud Project ID Required",
    errDiagProjectRequiredCause: "ACM, VPC-SC, and IAM operations require a Google Cloud Project ID.",
    errDiagProjectRequiredRemediation: "Enter a valid Google Cloud Project ID.",
    errDiagGeminiTitle: "Gemini Enterprise Access Denied",
    errDiagGeminiCause:
      "Access to Discovery Engine was blocked by ACM or VPC-SC because the browser is not managed.",
    errDiagGeminiRemediation:
      "Access from a Managed Chrome browser or use Approach 2 RCA group binding.",
    errDiagGeminiConsoleLink: "Open Vertex AI Search Console",
    geminiConfirmProjectLabel: "Confirm Project ID",
    geminiConfirmProjectHint: "Type the target Project ID to confirm strict perimeter enforcement.",
    geminiConfirmProjectMismatch: "Type the exact target Project ID before provisioning in strict mode.",
    errDiagGenericTitle: "Operation Failed",
    errDiagGenericCause: "An unexpected error occurred during execution.",
    errDiagGenericRemediation: "Check the technical details below and verify API enablement.",
    errDiagCauseLabel: "Cause:",
    errDiagRemediationLabel: "Remediation:",
    errDiagCommandHeader: "Fix Command:",
    errDiagRetryBtn: "Retry Operation",
    errDiagRawDetails: "Technical Error Details",

    assessOpenBtn: "Security Requirements & Policy Wizard",
    assessModalTitle: "Security Requirements & Policy Wizard",
    assessModalSubtitle: "Select your security requirements to configure the CEP policy baseline and DLP matrix.",
    assessPresetLabel: "Quick Presets",
    assessPresetGenAi: "GenAI Safe Adoption",
    assessPresetCost: "Exit VDI / Replace CASB",
    assessPresetRemote: "Remote Work & BYOD",
    assessPresetAll: "Select All",
    assessPresetClear: "Clear All",
    assessGroupGenAi: "GenAI & Cloud Data Protection",
    assessGroupPosture: "Device Posture & Remote Access",
    assessGroupSaas: "SaaS Protection & Zero Trust",
    assessGroupCost: "Cost & Endpoint Simplification",
    assessQ1Title: "Prevent sensitive copy/paste into GenAI and Web apps",
    assessQ1Risk: "Pasting source code or customer data into external AI tools.",
    assessQ1Solution: "Real-time clipboard inspection and blocking on web AI apps.",
    assessQ2Title: "Restrict Web upload/download of PII and financial data",
    assessQ2Risk: "Downloading customer CSVs to personal devices or unapproved clouds.",
    assessQ2Solution: "Real-time DLP file inspection for national IDs and payment cards.",
    assessQ3Title: "Restrict confidential printing and apply screen watermarks",
    assessQ3Risk: "Printing or photographing sensitive screens.",
    assessQ3Solution: "Browser print blocking and dynamic user/timestamp watermarks.",
    assessQ4Title: "Control SaaS access from unmanaged BYOD devices",
    assessQ4Risk: "Accessing corporate SaaS from unmanaged personal computers.",
    assessQ4Solution: "Context-Aware Access restricting login to Managed Chrome browsers.",
    assessQ5Title: "Block devices with outdated OS or unencrypted disks",
    assessQ5Risk: "Unpatched endpoints connecting to internal apps.",
    assessQ5Solution: "Endpoint Verification checks for OS version, lock, and disk encryption.",
    assessQ6Title: "Verify corporate devices with client certificates",
    assessQ6Risk: "Stolen credentials used from unauthorized devices.",
    assessQ6Solution: "Chrome Certificate Store binding for mTLS device checks.",
    assessQ7Title: "Enforce zero-trust access for Workspace, M365, and Salesforce",
    assessQ7Risk: "Password/MFA sessions exposed to cookie theft.",
    assessQ7Solution: "Chrome Enterprise and Access Context Manager conditional access.",
    assessQ8Title: "Block access from untrusted IP ranges or regions",
    assessQ8Risk: "Unauthorized access attempts from untrusted networks.",
    assessQ8Solution: "IP and region-based Context-Aware Access policies.",
    assessQ9Title: "Move from legacy VPN to browser-based zero-trust access",
    assessQ9Risk: "VPN bandwidth bottlenecks and appliance maintenance overhead.",
    assessQ9Solution: "Direct zero-trust access via Chrome and BeyondCorp Secure Gateway.",
    assessQ10Title: "Block unauthorized browser extensions",
    assessQ10Risk: "Malicious extensions reading page content or session cookies.",
    assessQ10Solution: "Extension allowlisting with ExtensionInstallBlocklist.",
    assessQ11Title: "Export Chrome security logs to SIEM or BigQuery",
    assessQ11Risk: "Missing browser audit trails during incident investigations.",
    assessQ11Solution: "Export DLP, URL, and file events to Cloud Logging and BigQuery.",
    assessQ12Title: "Automate browser security updates",
    assessQ12Risk: "Delayed browser patching leaving endpoints exposed.",
    assessQ12Solution: "Automated background Chrome updates and version governance.",
    assessQ13Title: "Consolidate third-party CASB/SWG browser controls",
    assessQ13Risk: "Overlapping third-party proxy and CASB licensing costs.",
    assessQ13Solution: "Browser-native DLP and access controls inside Chrome.",
    assessQ14Title: "Reduce VDI infrastructure footprint",
    assessQ14Risk: "High VDI hardware refresh and maintenance expenses.",
    assessQ14Solution: "Enforce data boundary controls directly in local Managed Chrome.",
    assessQ15Title: "Reduce endpoint agent overhead",
    assessQ15Risk: "Multiple endpoint agents slowing down user devices.",
    assessQ15Solution: "Run DLP, access checks, and reporting natively in Chrome.",
    assessDefaultDlpCustomMessage: "Confidential data transfer is restricted by corporate security policy.",
    assessRecHeader: "Selected Policy Baseline",
    assessRecDlpHeader: "DLP Matrix:",
    assessRecModulesHeader: "Policy Modules:",
    assessRoiHeader: "Expected Outcomes:",
    assessRoiCostTitle: "Infrastructure Simplification",
    assessRoiCostDesc: "Consolidate browser security controls and reduce VDI/proxy overhead.",
    assessRoiPerfTitle: "Agentless Browser Enforcement",
    assessRoiPerfDesc: "Apply DLP and posture checks natively in Chrome without extra agents.",
    assessRoiSecurityTitle: "Data Boundary & Threat Protection",
    assessRoiSecurityDesc: "Control uploads, pastes, downloads, and watermarks in the browser.",
    assessApplyRecBtn: "Apply Configuration to PoC",
    assessAppliedBanner: "✓ Applied policy configuration and DLP matrix.",
    geminiArchDetailsToggle: "View 3-Tier Security Architecture & CLI Commands",
    assessShowDetails: "Show Risk & Solution Details",
    assessHideDetails: "Hide Details",
    projectIdOptionalLabel: "Google Cloud Project ID · Optional for CAA & Gemini Zero Trust",
    projectIdOptionalHint: "Leave blank for Workspace-only PoC. Enter a GCP Project ID only when using Access Context Manager or VPC-SC.",
    projectIdOptionalPlaceholder: "e.g. my-gcp-project-id",
    statusLogApiCallCount: (count: number) => `${count} API calls`,
    assessStatusWatermarkOn: "ON",
    assessStatusEnabled: "✓ Enabled",
    assessStatusDisabled: "Disabled",
    assessStatusAllowlistManaged: "✓ Allowlist Managed",
    assessStatusCloudLogging: "✓ Cloud Logging Linked",
    assessStatusVpcScProtected: "✓ VPC-SC Protected",
    assessStatusStandard: "Standard",
    assessSelectedCountSuffix: "selected",
    dlpRegionJapanLabel: "Japan · My Number / Bank Account",
    dlpPresetsLabel: "Presets:",
  },
};

const ja: Messages = {
  mainTitle: "Chrome Enterprise Premium PoC Deployer",
  productName: "管理者向けデプロイコンソール",
  localOnly: "ローカル実行",
  cloudIdentity: "Google Cloud",
  cloudProject: "未接続",
  workspaceIdentity: "Google Workspace",
  adminEmail: "未接続",
  help: "ヘルプ",
  signOut: "サインアウト / 初期化",
  signOutConfirm: "サインアウトしてセッションを初期化しますか？ローカルの認証トークンとキャッシュを削除し、初期状態に戻ります。",
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
  modeTitle: "1. Secure Gateway の PoC を開始",
  poc: "PoC",
  pocDescription:
    "テスト用OU向けにリソースを構築し、評価完了後に安全に削除します。",
  production: "本番環境",
  productionDescription:
    "エンタープライズPKIや高可用性を備えた本番構成です。本ツールの対象外です。",
  productionUnavailable: "未定",
  platformsTitle: "管理対象 Chrome プラットフォーム",
  managedChromeOnly: "",
  platformNote: "検証対象のOSを選択します。複数選択可能です。",
  infrastructureTitle: "2. ネットワーク構成",
  dedicatedNetwork: "専用ネットワーク",
  recommended: "標準",
  dedicatedDescription: "Secure Gateway専用の新しいVPCを作成します。",
  existingVpc: "既存VPC",
  existingDescription: "管理中の既存VPCへデプロイします。",
  certificateTitle: "3. 証明書方式",
  enterpriseCa: "エンタープライズPKI / CA Service",
  enterpriseCaDescription: "組織CAまたはCloud CA Serviceで内部TLS証明書を発行します。",
  publicCertificate: "パブリック証明書",
  publicCertificateDescription:
    "公開DNSホスト名とSecret Manager内の公的証明書チェーンを使用します。",
  localPocCa: "ローカルPoC CA",
  disabledProduction: "本番では無効",
  localPocAdminConsole: "管理コンソールへの登録が必要",
  localPocCaDescription:
    "ルート証明書とサーバー証明書を自動生成します。適用後に公開ルートをGoogle管理コンソールのテストOUへ登録します。",
  posture: "デプロイ方針",
  mode: "モード",
  managedPlatforms: "管理対象 Chrome",
  platformCount: (count: number) =>
    count === 4 ? "全プラットフォーム対応 · macOS / Windows / Linux / ChromeOS" : `${count} プラットフォーム`,
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
  gateNote: "適用前にすべてのゲートを通過する必要があります。",
  back: "戻る",
  continue: "ID設定へ進む",
  noChanges: "変更はまだ適用されていません",
  draftSaved: "下書きをローカル保存",
  lastSaved: "最終保存",
  justNow: "数秒前",
  languages: { english: "English", japanese: "日本語" },
  topbarAuth: {
    cloudPopoverTitle: "Google Cloud 接続・プロジェクト設定",
    cloudPopoverDesc: "Easy PoC と Secure Gateway Deployer で共通利用します。",
    cloudProjectIdLabel: "Google Cloud プロジェクトID",
    cloudProjectIdPlaceholder: "例: enterprise-secgw-01",
    cloudOperatorLabel: "検証済みクレデンシャル",
    cloudVerifyBtn: "接続を確認",
    cloudVerifyingBtn: "確認中…",
    cloudBootstrapBtn: "SGWデプロイ用サービスアカウントを作成して接続",
    cloudBootstrappingBtn: "サービスアカウントを準備中…",
    cloudSharedNote: "Easy PoC は管理者OAuthを、Secure Gateway Deployer は専用デプロイヤーSAを使用します。",
    workspacePopoverTitle: "Google Workspace 管理者ログイン",
    workspacePopoverDesc: "一度ログインすると、Easy PoC と Secure Gateway Deployer で顧客ID・OU・グループを共有します。",
    workspaceSignInBtn: "Googleでログインして自動設定",
    workspaceSigningInBtn: "ログイン・顧客IDを取得中…",
    workspaceReverifyBtn: "Workspace接続を再確認",
    workspaceCustomerIdLabel: "顧客ID",
    workspaceAdminLabel: "ログイン中の管理者",
    workspaceSharedNote: "組織部門とグループ一覧は各画面で自動的に読み込まれます。",
    sharedHeaderConnectedBanner: "右上のヘッダーから接続済み · Easy PoC / SGW Deployer 共通",
  },
  workflow: {
    identitiesTitle: "Google Cloud と Workspace の接続設定",
    identitiesIntro:
      "左の Google Cloud と右の Google Workspace に順番に接続します。サービスアカウントキーは作成せず、権限借用で安全に動作します。",
    cloudAccount: "Google Cloud デプロイヤー",
    cloudAccountDescription: "GCPプロジェクトIDを入力し、上から順番にボタンを押して接続します。",
    workspaceAccount: "Workspace／Chrome管理者",
    workspaceAccountDescription:
      "「接続を確認」を押して Google Workspace に接続します。初期値 my_customer のままで構いません。",
    projectId: "Google Cloud プロジェクトID",
    operatorIdentity: "接続済みのサービスアカウント",
    adminIdentity: "接続済みの管理者アカウント",
    connect: "接続を確認",
    connected: "接続済み",
    notConnected: "未接続",
    checking: "接続を確認中…",
    connectionFailed: "接続確認に失敗しました",
    adcUnavailable:
      "Application Default Credentials がありません。gcloud auth application-default login を実行して再試行してください。",
    cloudValidationFailed:
      "Google Cloud の検証に失敗しました。プロジェクトIDと読み取り権限を確認してください。",
    workspaceValidationFailed:
      "Workspace の検証に失敗しました。顧客IDと管理者権限を確認してください。",
    workspaceRequiredRolesHint:
      "Chrome Policy、OU、グループ／ユーザー読み取り、ライセンス管理の権限が必要です。Cloud Identity DLP ルールの操作には特権管理者が必要です。",
    cloudRequiredRolesTitle: "必要な Google Cloud 最小ロール:",
    cloudRequiredRoles: [
      "サービス アカウント管理者 · roles/iam.serviceAccountAdmin",
      "ロール管理者 · roles/iam.roleAdmin",
      "プロジェクト IAM 管理者 · roles/resourcemanager.projectIamAdmin",
      "Access Context Manager の Policy Editor またはセキュリティ管理者",
    ],
    workspaceRequiredRolesTitle: "必要な Workspace 権限:",
    workspaceRequiredRoles: [
      "Chrome 設定 & OU 読み取り",
      "グループ & ユーザー読み取り",
      "ライセンス管理",
      "特権管理者 · Cloud Identity DLP ルール作成時",
    ],
    specInvalid: "デプロイ設定に無効または不足している項目があります。",
    connectionNotice:
      "接続検証は読み取り専用です。適用権限は事前確認で検証します。",
    bootstrapDeployer: "サービスアカウントを作成して接続",
    bootstrapDeployerHint:
      "専用サービスアカウントとカスタムロールを作成し、そのまま接続確認まで完了します。",
    bootstrapConfirm:
      "デプロイヤーSA、カスタムロール、プロジェクトIAM、Access Policy Editor、Token Creator権限を作成・更新します。続行しますか？",
    bootstrapLegacyMigrationConfirm:
      "予約名を持つ未固定のデプロイヤー候補が見つかりました。SAの不変な数値ID、カスタムロール定義、IAM許可リストを監査し、一致した場合だけ移行しますか？",
    bootstrapReplacementConfirm:
      "旧デプロイヤーは移行監査に一致しませんでした。旧デプロイヤーを監査用に残し、別の予約名で新しいデプロイヤーSAとロールを作成しますか？",
    bootstrapDeletedDeployerConfirm:
      "固定されたデプロイヤーがCloud上に存在しません。残存IAMバインディングがないことを検証した上で、旧数値IDを恒久的に廃止し、必要なら論理削除中のロールを安全に復元して新しいデプロイヤーを作成します。続行しますか？",
    bootstrapWorking: "1/2: サービスアカウントを作成中…",
    bootstrapValidating: "2/2: IAM権限の反映と接続を確認中…",
    bootstrapComplete: "Google Cloud の接続準備が完了しました",
    bootstrapNext:
      "Google Cloud の準備が完了しました。右側の Google Workspace も接続済みになったら「続行」を押してください。",
    bootstrapFailed: "サービスアカウントの自動準備に失敗しました",
    signInGoogle: "Google でサインイン",
    signingInGoogle: "Google の応答を待っています…",
    signInGoogleHint:
      "Google の承認画面を開きます。初回のみ実行してください。",
    signInRequired:
      "先に「Google でサインイン」を押して承認してから再実行してください。",
    signInOperatorChanged:
      "サインイン中のアカウントがデプロイヤーの運用者と異なります。元のアカウントを使うか、デプロイヤーを再作成してください。",
    cloudStep1Label: "手順 1: Google アカウントの承認 · 初回のみ",
    cloudStep2Label: "手順 2: プロジェクト接続を確認 · 事前確認のみ先に実行する場合",
    cloudStep2DeferHint:
      "先に事前確認だけを実行する場合は、下の「接続を確認」を押せばそのまま進めます。デプロイ用サービスアカウントの作成と接続は、ステップ6で事前確認を実行した後に行えます。",
    cloudStep3Label: "手順 3: デプロイ用サービスアカウントの作成と自動接続 · 事前確認後でも実行可能",
    customerIdAutoHint:
      "my_customer のまま接続を確認すると、C で始まる顧客IDを自動取得します。",
    resolveSampleImageQuick: "Debian 12 PoC イメージを自動取得",
    progressTitle: "デプロイ進捗",
    progressCount: (completed: number, total: number) =>
      `${total}件中${completed}件を完了`,
    currentOperation: "現在の操作",
    failedOperation: "失敗した操作",
    failedOperations: "失敗した操作一覧",
    manualCleanupTitle: "手動削除が必要です",
    manualCleanupDescription:
      "自動ロールバックを利用できません。以下の残存リソースを Google Cloud コンソールで手動削除してください。",
    waitingForOperation: "最初の操作を待っています…",
    environmentTitle: "プライベート環境を設定",
    environmentIntro:
      "望ましい状態を定義します。変更前に既存リソースを検出します。",
    deploymentName: "デプロイ名",
    region: "リージョン",
    zone: "ゾーン",
    secondaryZone: "セカンダリゾーン",
    sourceImage: "サンプルVM用 OSイメージ",
    sourceImageHint:
      "作成するVMで使用するバージョン固定のCompute Engineイメージパスです。",
    sourceImageAutoHint:
      "Debian 12イメージが自動設定されます。カスタムイメージを使う場合のみ変更してください。",
    sampleImageResolving: "サンプルVM用イメージを取得中…",
    sampleImageResolveFailed:
      "Debian 12イメージを取得できませんでした。",
    sampleImageConnectionRequired:
      "先にステップ2でGoogle Cloud接続を完了してください。",
    sampleImageResolved: "サンプルVM用イメージを設定しました",
    minimumReplicas: "Nginx最小レプリカ数",
    maximumReplicas: "Nginx最大レプリカ数",
    cpuTarget: "オートスケーリングCPU目標値 · 0.1〜0.9",
    autoscalingHint:
      "本番では2ゾーンのリージョンMIGを使用し、CPU使用率で自動スケールします。",
    network: "接続先アプリのプロトコルで選ぶ接続方式 (HTTPS / HTTP)",
    networkHttpsCategoryLabel:
      "① 接続先が HTTPS アプリの場合 (またはサンプルVMで最短・最安検証 — 推奨・LB費用 $0)",
    networkHttpCategoryLabel:
      "② 接続先が HTTP のみのアプリの場合 (前段の LB または Nginx VM で HTTPS 化)",
    vpcName: "既存VPC名",
    vpcSameProjectHint:
      "対象プロジェクトのVPCを取得します。Shared VPCの場合のみアップストリームプロジェクトを入力してください。",
    vpcOptionsFailed: "VPC一覧を取得できませんでした。",
    subnetName: "既存サブネット名",
    upstreamVpcProjectId: "アップストリームVPCのプロジェクトID · 任意",
    upstreamVpcProjectIdHint:
      "同一プロジェクト内のVPCでは空欄にします。Shared VPCの場合のみネットワーク所有プロジェクトIDを入力します。",
    upstreamVpcCrossProjectPrerequisite:
      "クロスプロジェクトの前提条件: 事前確認より前に、アップストリームプロジェクトで compute.networks.get、compute.networks.use、resourcemanager.projects.get、resourcemanager.projects.getIamPolicy、resourcemanager.projects.setIamPolicy をデプロイヤーSAに付与してください。初回準備が構成するのはデプロイ先プロジェクトだけです。",
    managedSample: "サンプルHTTPアプリ + Nginx VMを作成 (Option C)",
    managedSampleDescription:
      "検証用のプライベートHTTPバックエンドVMとNginx HTTPSプロキシVMを作成します。",
    existingBackend: "既存HTTPアプリ (http://) + Nginx VMを作成 (Option C)",
    existingBackendDescription:
      "Nginx VMでHTTPSを終端し、既存のプライベートHTTPエンドポイントへ転送します。",
    directHttps: "HTTPS アプリ — 直接接続 / サンプルVM起動 (Option A · 推奨)",
    directHttpsDescription:
      "既存のHTTPSアプリ (https://) へ直接接続します。下の「サンプルVMをローンチする」にチェックを入れるとテスト用VMも自動作成できます。",
    internalHttpsLb:
      "HTTP アプリ — 内部ロードバランサ (Internal ALB) でHTTPS化 (Option B)",
    internalHttpsLbDescription:
      "HTTPのみのアプリの前段にGoogle Cloudの内部HTTPSロードバランサを配置してTLSを終端し、非公開サンプルVMへHTTP転送します。",
    configureSampleVm: "サンプルVMのOSイメージを自動設定 · Debian 12",
    configureSampleVmDescription:
      "Option Bでは、適用時に外部IPなしの非公開サンプルVMを1台自動作成します。",
    directLaunchSampleVmCheckbox:
      "サンプルVMをローンチする (HTTPSテスト用VM・Private DNS・FWを自動作成)",
    directLaunchSampleVmDescription:
      "内部ロードバランサを使わずに、HTTPSテスト用VM・Private DNS・ファイアウォールを承認済みApplyで自動作成します。",
    directSampleVmAction: "HTTP アプリ + 内部ALB (Option B) へ切り替える",
    directSampleVmDescription:
      "既存HTTPSアプリがない場合は、下の「サンプルVMをローンチする」にチェックを入れるか、内部ALB方式 (Option B) へ切り替えてください。",
    managedSampleVmAction: "サンプルVMのOSイメージを自動設定 · Debian 12",
    managedSampleVmDescription:
      "管理対象サンプルでは、Option CのNginx層とプライベートHTTPバックエンドVMを最終承認済みApplyで作成します。",
    existingSampleVmDescription:
      "既存HTTP方式には到達可能なプライベートHTTPバックエンドが必要です。サンプルVMを作成する場合は「サンプルHTTPアプリ + Nginx VMを作成」へ切り替えてください。",
    legacyNginxTitle: "HTTP アプリ — Nginx リバースプロキシVMでHTTPS化 (Option C · 低コスト構成)",
    legacyNginxDescription:
      "ロードバランサ費用を抑え、小規模なNginx VMでTLSを終端して既存HTTPアプリまたはサンプルVMへ転送します。",
    proxySubnetCidr: "ILB Proxy-onlyサブネットCIDR",
    backendUrl: "バックエンドURL · http://",
    directHttpsUrl: "プライベートHTTPSエンドポイント · https://host[:port]",
    applicationEgressRegion: "下りリージョン · 任意",
    applicationEgressRegionHint:
      "Secure GatewayがVPCへ出るリージョンです。空欄時はデプロイリージョンを使用します。",
    backendLocation: "バックエンドのホスティング先",
    backendLocationGcp: "Google Cloud",
    backendLocationAws: "AWS",
    backendLocationAzure: "Azure",
    backendLocationOnPrem: "オンプレミス",
    confirmBackendConnectivity:
      "選択したVPCからのプライベートルーティング、DNS、ファイアウォール許可が設定済みです",
    backendConnectivityHint:
      "VPNやInterconnectは本ツールでは作成しません。事前にプライベート経路を確立してください。",
    cloudConsoleLinks: "Google Cloud & Workspace コンソール直リンク",
    openInCloudConsole: "コンソールで確認",
    computeInstancesLink: "Compute Engine VM インスタンス一覧",
    computeResourcesHint:
      "作成したVMの名前とプライベートIPはリソース一覧で確認できます。",
    securityGatewaysLink: "BeyondCorp Security Gateways",
    securityGatewayHint:
      "Gatewayリソース名と稼働状態はリソース一覧で確認できます。",
    vpcNetworksLink: "VPC ネットワーク & サブネット",
    cloudNatLink: "Cloud NAT",
    cloudNatHint:
      "プライベートVMを持つ専用VPC方式で自動作成されます。",
    chromeAdminLink: "Chrome 管理ポリシー · Root Store",
    architectureBlueprint: "アーキテクチャ設計図 & テレメトリ",
    directHttpsConnectivity:
      "選択したVPCでホスト名を解決でき、136.124.16.0/20からのTCP許可と戻り経路が設定済みです",
    directHttpsConnectivityHint:
      "AWS・Azure・オンプレミス接続時は、事前にCloud VPN/Interconnect、Cloud DNS、136.124.16.0/20への戻り経路を設定してください。",
    hostname: "プライベートアプリのホスト名",
    noExternalIpNotice:
      "作成されるVMは外部IPを持ちません。プライベートVMを持つ専用VPC方式はCloud NATを作成し、既存VPCは検証済みのプライベート送信経路を提供する必要があります。内部HTTPS LB方式はNginxを作成しませんが、非公開サンプルバックエンドVMを作成します。",
    certificateStepTitle: "TLS証明書ソースを設定",
    certificateIntro:
      "証明書はSecret Managerで安全に管理され、起動スクリプトには秘密鍵を書き込みません。",
    internalLbCertificateIntro:
      "内部HTTPSロードバランサがリージョンサーバー証明書でTLSを終端します。",
    caPool: "CAプールのリソース名",
    caName: "発行CAのリソース名",
    secretName: "Secret Managerの証明書シークレット",
    certificateNotice:
      "ローカルCAはPoC専用です。適用後に公開ルートPEMをダウンロードし、[Chrome] > [コネクタ] > [Chrome Root Store] でテストOUへ登録してください。",
    internalLbCertificateNotice:
      "適用後に公開ルートPEMを管理コンソールのChrome Root StoreでテストOUへ登録し、Chromeを再起動して接続を確認します。",
    directCertificateIntro:
      "HTTPSアプリ自身がTLS終端を行います。本ツールは証明書や秘密鍵を作成しません。",
    directCertificateNotice:
      "プライベートCA証明書を使う場合は、発行元ルートPEMを [Chrome] > [コネクタ] > [Chrome Root Store] でテストOUへ登録してください。",
    directPrivateCertificate: "アプリのプライベートCA / Chrome Root Store手動信頼",
    accessTitle: "Chromeポリシーとアプリへのアクセスを制限",
    accessIntro: "専用テストOUと許可プリンシパルを指定します。",
    customerId: "Workspace 顧客ID",
    targetOuId: "専用テストOU ID",
    managedChromeAccessLevel: "管理対象Chromeのアクセスレベル",
    managedChromeAccessLevelHint:
      "なし、または既存のAccess Context Managerリソース名を選択します。",
    managedChromeAccessLevelNone: "なし — アクセスレベルを要求しない",
    managedChromeAccessLevelNoneHint:
      "アクセスレベル条件は追加せず、指定したIAMプリンシパルのみに許可します。",
    optionsLoadedHint:
      "組織部門・アクセスレベル・グループを読み取り専用で取得します。",
    optionsLoading: "選択肢を取得中…",
    chooseOption: "選択してください",
    noOptions: "選択肢がありません",
    retryOptions: "再取得",
    ouOptionsFailed:
      "組織部門を取得できませんでした。Admin SDK APIと管理者権限を確認してください。",
    accessLevelOptionsFailed:
      "アクセスレベルを取得できませんでした。サービスアカウントにAccess Context ManagerのPolicy Editorを付与してください。",
    groupOptionsFailed:
      "グループを取得できませんでした。管理者ロールのグループ読み取り権限を確認してください。",
    prerequisitesTitle: "手動の前提条件確認",
    confirmEnterpriseLicense:
      "対象ユーザーにChrome Enterprise Premiumライセンスを割り当て済み",
    confirmWorkspaceServices:
      "対象ユーザーの追加GoogleサービスとGoogle Cloudアクセスを有効化済み",
    confirmEndpointVerification:
      "このOUでEndpoint Verificationを有効化済み",
    confirmTestOu: "非本番のテストOUであることを確認しました",
    principalType: "プリンシパル種別",
    principalValue: "プリンシパル",
    addPrincipal: "プリンシパルを追加",
    removePrincipal: "削除",
    user: "ユーザー",
    group: "グループ",
    domain: "ドメイン",
    accessNotice:
      "選択したテストOUにSecure GatewayとEndpoint Verificationを配信します。設定は配下OUにも継承されます。",
    accessOuVsPrincipalNotice:
      "専用テストOUはChromeポリシーの配信先、プリンシパルはアプリ接続を許可するユーザーまたはグループです。",
    reviewTitle: "検出結果と自動設定予定を確認",
    reviewIntro:
      "APIの検出結果とApplyでの変更予定を表示します。この画面ではまだ変更しません。",
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
      "検証済み: API確認完了 / Applyで自動設定: 承認後に自動作成 / 手動確認: 管理者確認が必要 / 要対応: 適用前に解消が必要",
    gateLabels: {
      "immutable-image": "サンプルVM用 OSイメージ",
      "billing-enabled": "Cloud Billing",
      "enterprise-license": "Chrome Enterprise Premiumライセンス",
      "chrome-root-store": "Chrome Root Store信頼配布",
      "workspace-services": "Workspaceサービス",
      "managed-chrome-profile": "管理対象Chromeプロファイル",
      "secure-enterprise-browser-client": "Secure Enterprise Browserクライアント",
      "endpoint-verification": "Endpoint Verification",
      "global-access": "Chrome Global Access ルーティング",
      "no-external-ips": "外部IPなし",
      "private-egress": "Cloud NAT",
      "backend-connectivity": "既存バックエンド接続",
      "test-ou": "対象OU",
      "group-policy-discovery": "Chrome グループポリシー競合確認",
      "cloud-identity": "Google Cloudデプロイヤー",
      "workspace-identity": "Workspace／Chrome管理者",
      "required-apis": "必須API",
      "apply-permissions": "Apply実行権限",
      "public-certificate-binding": "パブリック証明書バンドル検証",
      "resource-conflicts": "既存リソース競合",
      "human-approval": "承認",
    },
    gateDescriptions: {
      "immutable-image": "作成するVMのOSイメージパスと数値IDを検証します。",
      "billing-enabled": "プロジェクトに有効な課金アカウントが紐付いているか確認します。",
      "enterprise-license": "CEPライセンスの割り当て数を確認します。",
      "chrome-root-store": "Apply後に公開ルートPEMを管理コンソールのChrome Root Storeへ登録します。",
      "workspace-services": "対象ユーザーのWorkspaceサービス設定を確認します。",
      "managed-chrome-profile": "対象OUの管理対象Chromeプロファイルとポリシー同期を確認します。",
      "secure-enterprise-browser-client": "クライアント拡張機能のインストール状態を確認します。",
      "endpoint-verification": "Endpoint Verificationの状態を確認し、未導入ならApplyで配信します。",
      "global-access": "対象テストOUの Global Access ルーティング状態を確認し、未設定ならApplyで有効化します。",
      "no-external-ips": "作成するVMに外部IPを付与しないことを検証します。",
      "private-egress": "プライベートVMを持つ専用VPC方式はCloud NATを作成します。既存VPC方式は検証済みのプライベート送信経路が必要です。",
      "backend-connectivity": "バックエンドへのプライベート経路、DNS、ファイアウォールを確認します。",
      "test-ou": "選択したOUが非本番テスト用であることを確認済みです。",
      "group-policy-discovery": "ChromeグループポリシーがテストOUの設定と競合していないか確認します。",
      "cloud-identity": "Google Cloudデプロイヤーを検証済みです。",
      "workspace-identity": "Workspace／Chrome管理者IDを検証済みです。",
      "required-apis": "不足しているAPIはApply中に自動で有効化します。",
      "apply-permissions": "計画した操作に必要なIAM権限が揃っているか確認します。",
      "public-certificate-binding": "Secret Manager内のパブリック証明書チェーンと秘密鍵を検証します。",
      "resource-conflicts": "既存リソースとの競合がないか確認します。",
      "human-approval": "Apply前に構成ハッシュへ紐付いたプランを承認します。",
    },
    gateDetail: (gateId, status, detail) => formatGateDetail("ja", gateId, status, detail),
    openChromeRootStoreConsole: "Google管理コンソール Chrome Root Store を開く",
    reviewDeployerSaTitle: "Apply実行用のサービスアカウント接続 · 事前確認後の接続",
    reviewDeployerSaPendingDesc:
      "現在はサインイン中の管理者アカウントで事前確認を表示しています。計画を承認してApplyを実行する前に、下のボタンを押してデプロイ専用サービスアカウントを作成・接続してください。",
    reviewDeployerSaReadyDesc:
      "デプロイ専用サービスアカウントが接続済みです。このまま計画を承認してApplyへ進めます。",
    managedProfileEvidence: (total, profileOnly, sync) =>
      `検出プロファイル: ${total}件 · BYOD: ${profileOnly}件 · 最終同期: ${sync ?? "未同期"}`,
    clientExtensionEvidence: (name, version, installed) =>
      installed
        ? `Profiles APIで${name} ${version ?? ""}の有効状態を確認しました。`
        : `${name}の有効報告はまだありません。`,
    missingPermissions: (count: number) =>
      `デプロイヤーに必要な権限が${count}件不足しています。`,
    approvePlan: "デプロイ実行計画を承認",
    approvePlanDescription:
      "承認は構成ハッシュに紐付き、設定を変更すると無効になります。",
    generatePlan: "事前確認を実行してプランを生成",
    runPreflight: "事前確認を実行",
    preparingPlan: "環境を検査し、実行計画を作成しています…",
    planReady: "事前確認が完了し、実行計画を作成しました",
    planBlocked: "要対応の項目があります。解消後に再実行してください。",
    changesCount: (count: number) => `承認が必要な変更 ${count} 件`,
    preflightProgressTitle: "事前確認の進捗",
    preflightStage1: "1/5: Service Usage & IAM 権限を確認中...",
    preflightStage2: "2/5: Cloud Billing を確認中...",
    preflightStage3: "3/5: Security Gateway & VPC を検出中...",
    preflightStage4: "4/5: Chrome テスト OU ポリシーを照合中...",
    preflightStage5: "5/5: 差分計画と安全ゲートを判定中...",
    preflightStage5Detail: "差分プランの構築と全セーフティゲートの評価",
    preflightComplete: "すべての事前確認が完了しました",
    plannedChangesTitle: "承認対象の変更内容",
    plannedChangesIntro:
      "新規作成・更新する項目だけを表示します。既存リソースは変更しません。",
    changeAction: (action) =>
      ({ create: "新規作成", update: "更新" })[action] ?? action,
    changeRisk: (risk) =>
      ({ low: "低リスク", medium: "中リスク", high: "高リスク", blocking: "ブロック" })[
        risk
      ] ?? risk,
    changeSummary: (resourceType, fallback) =>
      resourceType === "service_discovery_proxy"
        ? "対象テストOUで継承中の旧PACを上書きし、Service Discoveryルーティングへ切り替えます。"
        : fallback,
    diagnosticsTitle: "検出した状態",
    apiEvidence: "API検出値",
    diagnosticMessage: (code, fallback) => formatDiagnosticMessage("ja", code, fallback),
    diagnosticRemediation: (code, fallback) => formatDiagnosticRemediation("ja", code, fallback),
    approveWorking: "承認を紐付けています…",
    approvalReady: "実行計画を承認済み",
    continueToApply: "適用へ進む",
    applyTitle: "チェックポイントとエビデンス付きで適用",
    applyIntro:
      "依存関係順に適用します。失敗時は即座に停止し、本実行で作成したリソースのみを逆順ロールバックします。",
    preflight: "事前確認",
    desiredStatePlan: "望ましい状態プラン",
    applyChanges: "承認済み変更を適用",
    applyLocked: "事前確認と承認を完了すると適用できます",
    applying: "承認済み変更を適用しています…",
    runSucceeded: "デプロイに成功しました",
    runRollingBack: "適用された変更をロールバック中…",
    runRollbackUnavailable:
      "適用に失敗し、自動ロールバックを利用できません。GCP上の残存リソースを確認してください。",
    runRollbackFailed:
      "一部の変更をロールバックできませんでした。下の失敗した操作とエラーを確認してください。",
    runRolledBack: "デプロイに失敗し、所有する変更をロールバックしました",
    runFinalized: "処理は完了しています",
    noActiveOperation: "現在実行中の操作はありません",
    finalizedOperationCount: (count: number) =>
      `処理完了 · ${count} 件の操作を記録`,
    runInterrupted:
      "適用中にワーカーが停止しました。再開するとチェックポイントと実リソースを照合して続行します。",
    resumeRun: "中断した適用を再開",
    resumingRun: "照合して再開しています…",
    retryRollback: "失敗したロールバックを再試行",
    retryingRollback: "残存リソースを照合してロールバックを再試行しています…",
    runFailed: "オペレーターによる確認が必要です",
    operationCount: (count: number) => `${count} 件の操作を記録`,
    evidenceNotice:
      "すべての操作の監査イベント、マスク済みリクエスト、結果、所有権を記録します。",
    caHandoffTitle: "管理対象Chromeの信頼設定を完了",
    caHandoffDescription:
      "公開ルート証明書を管理コンソールのChrome Root Storeに登録してテストOUへ紐付けます。",
    caHandoffSteps: [
      "下から公開PoCルート証明書をダウンロードします。",
      "Google管理コンソールで [Chrome] > [コネクタ] > [新しいプロバイダの設定] > [Chrome Root Store] を開き、PEMを登録します。",
      "専用テストOUを選択し、[証明書コネクタ] > [Chrome Root Store] で作成した構成を割り当てて保存し、Chromeを再起動します。",
    ],
    downloadRootCa: "公開ルートCAをダウンロード",
    downloadingRootCa: "ダウンロードを準備中…",
    openAdminConsoleGuide: "GoogleのCA設定ガイドを開く",
    caDownloadFailed:
      "ルートCAをダウンロードできませんでした。適用完了後に再試行してください。",
    connectionHandoffTitle: "接続確認とトラブルシューティング",
    testUrlLabel: "プライベート Web アプリ URL",
    sebTroubleshootingHint:
      "接続できない場合は、管理対象Chromeプロファイルから一度サインアウトして再サインインするか、chrome://extensions で Secure Enterprise Browser 拡張機能を再読み込みしてください。",
    recallCardTitle: "デプロイ構成リコール · 機密情報なし",
    recallCardIntro:
      "適用された機密情報以外の構成パラメータを確認・出力、またはウィザードへ再読み込みできます。秘密鍵・OAuthトークン・Secretの実データは含まれません。",
    recallIntoWizardButton: "この構成をウィザードにリコール",
    recallCopyJsonButton: "構成JSONをコピー",
    recallCopiedBadge: "✓ 機密情報なしの構成JSONをコピーしました",
    recallDownloadJsonButton: "構成JSONをダウンロード",
    recallExcludedLabel: "除外された機密データ",
    recallExcludedValue:
      "TLS秘密鍵 / OAuthアクセストークン / Secret Manager実データ / 所有権トークン",
    previous: "戻る",
    next: "続行",
  },
  operations: {
    deploymentsTitle: "デプロイ実行履歴",
    deploymentsIntro:
      "記録された適用処理と最終状態を確認します。",
    evidenceTitle: "監査証跡",
    evidenceIntro:
      "ハッシュチェーンを検証し、JSON証跡を出力します。",
    loading: "記録済みの状態を読み込み中…",
    loadFailed: "記録済みの状態を読み込めませんでした。",
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
        managed_sample: "HTTP アプリ · Nginx HTTPS化 (サンプルVM)",
        existing_http: "HTTP アプリ · Nginx HTTPS化 (既存HTTPアプリ)",
        direct_https: "HTTPS アプリ · 直接接続",
        internal_https_lb: "HTTP アプリ · 内部ロードバランサ (Internal ALB) HTTPS化",
      })[kind] ?? kind,
    recallCardTitle: "デプロイ構成リコール · 機密情報なし",
    recallCardIntro:
      "適用された機密情報以外の構成パラメータを確認・出力、またはウィザードへ再読み込みできます。秘密鍵・OAuthトークン・Secretの実データは含まれません。",
    recallIntoWizardButton: "この構成をウィザードにリコール",
    recallCopyJsonButton: "構成JSONをコピー",
    recallCopiedBadge: "✓ 機密情報なしの構成JSONをコピーしました",
    recallDownloadJsonButton: "構成JSONをダウンロード",
    recallExcludedLabel: "除外された機密データ",
    recallExcludedValue:
      "TLS秘密鍵 / OAuthアクセストークン / Secret Manager実データ / 所有権トークン",
    accessLevelControlTitle: "アクセス制御・アクセスレベル設定",
    accessLevelControlIntro:
      "BeyondCorp Application のアクセスレベル条件と許可プリンシパルを即時更新します。",
    selectAccessLevelLabel: "適用するアクセスレベル",
    principalsLabel: "許可するプリンシパル · ユーザー / グループ / ドメイン",
    principalsHelper: "カンマ区切りで指定 · 例: user:admin@test-domain.dev, domain:test-domain.dev",
    noAccessLevelRequired: "アクセスレベル制限なし · 許可プリンシパル全員",
    boundGroup: "対象 IAM グループ",
    updateAccessLevelButton: "アクセスレベルを即時更新",
    updatingAccessLevel: "IAMポリシーを更新中...",
    accessLevelSaved: "アクセスレベルを更新し、監査チェーンに記録しました",
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
      "Cloud Loggingからアクセス判定、Gateway接続、管理操作、Nginxログを取得します。",
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
    noLogs: "対象期間のログはありません。管理対象Chromeからアクセスすると表示されます。",
    logQueryFailed:
      "Cloud Logging を取得できませんでした。デプロイヤーの権限と Gateway の状態を確認してください。",
    dataAccessNotice:
      "アクセス判定ログにはBeyondCorp Enterprise APIのData Access Audit Logsが必要です。",
    gatewayLoggingEnabled:
      "このプロジェクトでは Secure Gateway の接続ログが有効です。",
    gatewayLoggingDisabled:
      "Secure Gateway の接続ログが無効です。Google Cloud コンソールで設定を確認してください。",
    nginxNotice:
      "NginxログにはCloud Ops Agentによるsgstudio-access.logの収集が必要です。",
    principal: "プリンシパル",
    method: "メソッド",
    requestId: "リクエストID",
    callerIp: "発信元IP",
    payload: "サニタイズ済みペイロード",
    specInvalid: "デプロイ設定に無効または不足している項目があります。",
    teardownTitle: "このデプロイを削除",
    teardownIntro:
      "共有ポリシーを変更前状態へ復元し、この実行が所有するリソースだけを逆順削除します。",
    teardownSharedNotice:
      "共有 IAM／Chrome Policy は、現在値がこのrunの記録済みmanaged-after状態と安全に一致する場合だけ復元します。送信結果が不明な変更や後発ドリフト、既存VPC、Access Levelなどの共有リソースは保持します。",
    teardownUnavailable: "削除可能な所有リソースがこの実行にはありません。",
    teardownConfirmation: "確認フレーズの入力",
    teardownConfirmationHint: "上記の確認フレーズをそのまま入力",
    startTeardown: "実行の変更を復元・削除",
    teardownRunning: "実行の変更を復元・削除中…",
    teardownSucceeded: "削除完了",
    teardownInterrupted:
      "削除中にワーカーが停止しました。再開するとチェックポイントを照合して続行します。",
    resumeTeardown: "中断した削除を再開",
    resumingTeardown: "照合して再開しています…",
    teardownFailed: "削除を停止しました。確認が必要です",
    teardownActionFailed: "削除処理を開始できませんでした。",
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
      "自動システム検証を実行し、管理対象Chromeでの実機テスト結果と監査証跡を記録します。",
    noSuccessfulRun: "受入テストには成功したデプロイ実行が必要です。",
    runSystemChecks: "自動システム検証を実行",
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
      "マスク済みの観測結果またはSHA-256ハッシュだけを記録してください。秘密鍵や認証情報は入力しないでください。",
    testCase: "テスト項目",
    testInstruction: (testId, caseKey) =>
      testId === "T06"
        ? "管理対象プロファイルで既存のHTTPS制御アプリを開き、証明書警告なしで表示されたら合格を記録します。新規PoCでは理由を添えてスキップできます。"
        : testId === "T07"
          ? `${caseKey}の管理対象ChromeプロファイルでプライベートHTTPSアプリを開き、表示結果と時刻を記録します。`
          : testId === "T08"
            ? "マスク済みリクエストIDと時刻でGateway・オフロード・バックエンドのログを相関します。"
            : testId === "T09"
              ? "未承認ケースが拒否され、バックエンドへ到達しないことを確認します。"
              : "観測した結果を記録します。",
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
      "ブラウザのエラー表示から、ルーティング・IAM認可・証明書信頼のどこに原因があるか切り分けます。",
    t07Diagnostics: [
      {
        symptom: "ERR_NAME_NOT_RESOLVED",
        meaning:
          "プライベートホスト名が捕捉されていません。拡張機能が未同期か、親OUの旧PACが優先されています。",
        actions: [
          "事前確認を実行し、旧PACが検出された場合はテストOUでの上書きを確認します。",
          "管理対象プロファイルでSecure Enterprise Browser拡張機能が有効か確認します。",
          "GatewayルートとIAM権限を確認します。",
        ],
      },
      {
        symptom: "Access Denied · 403",
        meaning:
          "Gatewayへ到達しましたが、プリンシパルまたはAccess Context Manager条件を満たしていません。",
        actions: [
          "Endpoint Verificationを開き、［今すぐ同期］を実行します。",
          "ユーザーまたはグループにGatewayとアプリのIAM権限があるか確認します。",
          "Access Levelが対象プロファイルや端末を許可しているか確認します。",
        ],
      },
      {
        symptom: "NET::ERR_CERT_AUTHORITY_INVALID · 証明書エラー",
        meaning:
          "Gateway経由で接続できていますが、端末がPoCルートCAを信頼していません。",
        actions: [
          "Apply画面から公開PoCルート証明書をダウンロードします。",
          "管理コンソールの [Chrome] > [コネクタ] > [Chrome Root Store] でPEMをテストOUへ登録し、Chromeを再起動します。",
          "プライベートHTTPS URLへ再度アクセスします。",
        ],
      },
    ],
  },
  guide: {
    portalEyebrow: "Chrome Enterprise Premium PoC Deployer · ガイド",
    portalTitle: "機能別ドキュメント & ステップバイステップ PoC ガイド",
    portalIntro:
      "本拡張機能は 2 つの機能を備えています。インフラ構築なしで Chrome の情報漏洩対策・生成 AI 制御・SaaS テナント制限を構成する「Easy PoC」と、VPN なしで社内 Web アプリへ接続する「Secure Gateway Deployer」です。",
    beginnerNavLabel: "基本ガイド",
    beginnerEyebrow: "Google 管理画面の基本構造",
    beginnerTitle: "Google の管理画面が初めての方へ：まず押さえるべき「3つの基本要素」",
    beginnerIntro:
      "本ツールが操作する Google の 3 つの管理単位を、一般的な IT 用語と対比してまとめます。",
    beginnerPillars: [
      {
        badge: "1. ユーザー・ブラウザ管理",
        title: "[Google 管理コンソール](https://admin.google.com)",
        analogy: "Microsoft Entra ID ＋ Intune に相当",
        description:
          "社員アカウント、組織部門、グループ、Chrome ポリシーを一括管理する画面です。有料の Google Workspace がなくても、無料の Cloud Identity Free で利用できます。Easy PoC はこの画面だけで完結します。",
        whereUrl: "[admin.google.com](https://admin.google.com)",
      },
      {
        badge: "2. 適用対象の範囲",
        title: "組織部門と Google グループ",
        analogy: "Active Directory の OU とセキュリティグループに相当",
        description:
          "ポリシーを効かせる対象範囲です。最上位の `/` は全社員に影響するため、本ツールでは書き込みをブロックしています。検証用の子 OU または Google グループを選択します。",
        whereUrl: "[admin.google.com](https://admin.google.com) > ディレクトリ > 組織部門 / グループ",
      },
      {
        badge: "3. クラウド基盤",
        title: "[Google Cloud コンソール](https://console.cloud.google.com)",
        analogy: "AWS アカウント / Azure サブスクリプションに相当",
        description:
          "ゲートウェイや VM を作成するクラウド環境です。Easy PoC の基本機能では不要で、Secure Gateway Deployer や端末状態判定を使う場合のみ利用します。",
        whereUrl: "[console.cloud.google.com](https://console.cloud.google.com)",
      },
    ],
    stepZeroEyebrow: "ステップ 0 · 事前準備",
    stepZeroTitle: "デプロイを始める前に行う 3 つの準備",
    stepZeroIntro:
      "デプロイ前に以下の 3 点だけを準備します。",
    stepZeroChecklist: [
      {
        stepBadge: "準備 1 · 適用対象",
        title: "検証用の子 OU またはテスト用グループを用意する",
        summary:
          "全社への誤適用を防ぐため、テスト用アカウント 1〜2 名を入れる子 OU またはグループを用意します。",
        details: [
          "組織部門で試す場合：Easy PoC タブ 1 の［＋ 検証用 OU を作成して選択］を押すと `/CEP-PoC` を自動作成できます。作成後、[Google 管理コンソール](https://admin.google.com) の［ディレクトリ］>［ユーザー］でテストユーザーを移動します。",
          "グループで試す場合：[Google 管理コンソール](https://admin.google.com) の［ディレクトリ］>［グループ］でテスト用グループを作成し、対象ユーザーを追加します。",
          "管理者権限：タブ 3 の DLP ルール作成には Google Workspace の特権管理者アカウントを使用します。",
        ],
      },
      {
        stepBadge: "準備 2 · 右上でログイン",
        title: "画面右上の「Google Workspace」からログインする",
        summary:
          "画面右上のボタンが Easy PoC と Secure Gateway Deployer 共通のログイン窓口です。",
        details: [
          "右上の［Google Workspace］からログインすると、顧客ID・組織部門・グループ一覧が自動取得されます。",
          "Secure Gateway Deployer や端末状態判定を使う場合のみ、右上の［Google Cloud］に [Google Cloud コンソール](https://console.cloud.google.com) のプロジェクト ID を入力します。",
        ],
      },
      {
        stepBadge: "準備 3 · テスト用 Chrome",
        title: "検証用 Chrome にテストアカウントでログインし、chrome://policy を開く",
        summary:
          "デプロイしたポリシーはテストアカウントでログインした Chrome へ数秒で配信されます。",
        details: [
          "検証用 PC の Chrome プロファイルにテスト用 Google アカウントでログインします。",
          "デプロイ後、アドレスバーに `chrome://policy` と入力し、左上の［ポリシーを再読み込み］を押すと設定が即時反映されます。",
        ],
      },
    ],
    glossaryEyebrow: "用語早見表",
    glossaryTitle: "画面に出てくる Google 用語のかんたん解説表",
    glossaryIntro:
      "画面に登場する Google 用語と一般的な IT 用語の対応表です。",
    glossaryTermHeader: "画面上の用語",
    glossaryAnalogyHeader: "一般 IT での相当用語",
    glossaryMeaningHeader: "概要",
    glossaryItems: [
      {
        term: "顧客ID / my_customer",
        analogy: "Entra テナント ID",
        meaning: "契約ごとに割り当てられる C から始まる ID です。右上からログインすると自動取得されます。",
      },
      {
        term: "組織部門 / OU",
        analogy: "AD の OU フォルダ",
        meaning: "ユーザーを階層管理するフォルダです。最上位 `/` 以外の検証用子 OU を選択します。",
      },
      {
        term: "Google グループ",
        analogy: "セキュリティグループ",
        meaning: "所属部署を変えずに、グループメンバーへ Chrome ポリシーや DLP ルールを適用する単位です。",
      },
      {
        term: "Chrome Enterprise Connectors",
        analogy: "ブラウザ内蔵センサー",
        meaning: "専用エージェントなしでファイルの送受信・ペースト・印刷をリアルタイム検査する機能です。",
      },
      {
        term: "Cloud Identity DLP ルール",
        analogy: "Endpoint DLP ルール",
        meaning: "機密データのブロック・警告や社内サイトへの透かし表示を定義するルールです。",
      },
      {
        term: "Context-Aware Access",
        analogy: "条件付きアクセス",
        meaning: "管理対象 Chrome か私物端末かなど、接続元の端末状態を判定する条件です。",
      },
      {
        term: "Endpoint Verification",
        analogy: "端末情報収集拡張機能",
        meaning: "OS 状態や暗号化有無を管理コンソールへ報告する Google 公式の Chrome 拡張機能です。",
      },
      {
        term: "BeyondCorp Security Gateway",
        analogy: "ZPA / Private Access",
        meaning: "VPN クライアントなしで Chrome から非公開 Web アプリへ接続する中継ゲートウェイです。",
      },
      {
        term: "Google Cloud プロジェクト ID",
        analogy: "AWS アカウント / Azure サブスクリプション",
        meaning: "ゲートウェイや VM を作成する単位です。[Google Cloud コンソール](https://console.cloud.google.com) のプロジェクト ID を指定します。",
      },
      {
        term: "キーレス サービスアカウント",
        analogy: "IAM ロール / マネージド ID",
        meaning: "鍵ファイルを端末に保存せずクラウド環境を構築する作業用 ID です。",
      },
    ],
    sharedAuthTitle: "右上ヘッダーでの共通ログイン",
    sharedAuthIntro:
      "画面右上の「Google Workspace」と「Google Cloud」で一度ログインすると、両機能で認証情報が共有されます。",
    sharedAuthItems: [
      {
        label: "Google Workspace",
        detail: "右上のボタンからログインすると、顧客ID・OU・グループ一覧が自動取得されます。",
      },
      {
        label: "Google Cloud",
        detail: "Secure Gateway Deployer や端末状態判定を使う場合のみプロジェクト ID を入力します。",
      },
      {
        label: "ドロップダウン選択",
        detail: "適用先の OU やグループはドロップダウンから選ぶだけで確定します。",
      },
    ],
    easyPocTabLabel: "Easy PoC ガイド",
    easyPocTabSubtitle: "ブラウザDLP・生成AI / SaaSテナント制御・ライセンス / ロール管理",
    sgwTabLabel: "Secure Gateway Deployer ガイド",
    sgwTabSubtitle: "ゼロトラスト社内Web接続・Direct HTTPS / ILB / Nginx・撤去",
    openEasyPocCta: "Easy PoC を開く",
    openSgwDeployerCta: "Secure Gateway Deployer を開く",
    easyPocGuide: {
      eyebrow: "Easy PoC · 機能ガイド",
      title: "Easy PoC の機能構成と各タブで実行すること",
      intro:
        "Easy PoC は、インフラ構築なしで検証用 OU または Google グループにブラウザ DLP、生成 AI 制御、SaaS テナント制限、Gemini Enterprise 境界制御を即時展開します。",
      pocNoticeTitle: "パイロット範囲の分離とロールバック",
      pocNoticeBody:
        "最上位 `/` への適用はコード上でブロックされています。子 OU またはグループへ段階的に適用でき、タブ 4 から元の継承状態へ戻せます。",
      quickOverviewTitle: "3つの主要保護シナリオ",
      scenariosTitle: "Easy PoC で検証できる3つの主要セキュリティシナリオ",
      scenariosIntro:
        "情報漏洩対策・シャドーAI統制・Gemini 境界保護を Chrome 単体で検証できます。",
      scopeTag: "エージェントレス制御",
      targetLabel: "対象スコープ",
      authRequirementLabel: "必要な権限",
      scenarios: [
        {
          eyebrow: "シナリオ 1 · ブラウザDLP & マルウェア深層検査",
          title: "ファイル・クリップボード・印刷・透かしのリアルタイム制御",
          summary:
            "ファイルのアップロード・ダウンロード、100 文字以上のペースト、印刷をリアルタイム検査し、管理端末と BYOD で異なる制御を適用します。",
          estimatedTime: "所要時間: 約 30 秒",
          targetScope: "検証用の子 OU または Google グループ",
          authRequirement: "Google Workspace 特権管理者",
          nodes: [
            { label: "管理対象 Chrome", detail: "ポリシー同期 + Endpoint Verification", costBadge: "端末管理" },
            { label: "Enterprise Connectors", detail: "ファイル・ペースト・印刷・イベント検査", costBadge: "リアルタイム検査" },
            { label: "Cloud Identity DLP", detail: "カード番号・マイナンバー・機密コード検出", costBadge: "監査 / 警告 / ブロック" },
            { label: "業務環境保護", detail: "画面透かし表示 + 監査ログ記録", costBadge: "証跡管理" },
          ],
          supports: [
            { label: "7行の脅威対策マトリクス", detail: "脅威ごとにファイル・ペースト・印刷・透かしを個別設定" },
            { label: "BYOD端末限定スコープ", detail: "非管理端末だけを厳格制限する条件式を自動設定" },
            { label: "クリップボード境界", detail: "社内 URL から外部サイトへのコピー持ち出しを禁止" },
            { label: "カスタム警告文", detail: "ブロック時に社内規定や申請先リンクを表示" },
            { label: "マルウェア深層スキャン", detail: "セーフブラウジング保護強化とパスワード警告を有効化" },
            { label: "ワンクリック検証データ", detail: "テスト用カード番号・マイナンバー・機密コードを用意" },
          ],
        },
        {
          eyebrow: "シナリオ 2 · 生成AIガバナンス & SaaSテナント制限",
          title: "未承認の生成AIブロック + HTTPヘッダー注入による個人SaaSログイン禁止",
          summary:
            "未承認の生成 AI サイトを遮断して法人契約 Gemini を許可し、HTTP ヘッダー注入で個人 SaaS アカウントへのログインを禁止します。",
          estimatedTime: "所要時間: 約 20 秒",
          targetScope: "検証用の子 OU または Google グループ",
          authRequirement: "Google Workspace 管理者",
          nodes: [
            { label: "管理対象 Chrome", detail: "シークレット・ゲストモードを無効化", costBadge: "迂回防止" },
            { label: "URL ガバナンス", detail: "未承認 AI を遮断し gemini.google.com を許可", costBadge: "シャドーAI統制" },
            { label: "HttpHeaderInjection", detail: "対象 SaaS へテナント制限ヘッダーを自動付与", costBadge: "6種のプリセット" },
            { label: "法人契約 SaaS", detail: "許可された法人テナントのみログイン許可", costBadge: "個人利用遮断" },
          ],
          supports: [
            { label: "Google Workspace", detail: "X-GoogApps-Allowed-Domains で許可ドメイン以外を遮断" },
            { label: "Slack & GitHub", detail: "許可された Workspace / Organization のみ接続許可" },
            { label: "Box & ChatGPT", detail: "指定した Enterprise / Workspace ID のみ接続許可" },
            { label: "Microsoft 365", detail: "テナント制限用の 2 ヘッダーを自動設定" },
            { label: "生成AIプロンプトDLP", detail: "AI サイトへの機密ファイル添付・コード貼り付けを制限" },
            { label: "カスタムヘッダー", detail: "任意の URL パターンとヘッダーを自由に追加" },
          ],
        },
        {
          eyebrow: "シナリオ 3 · Gemini Enterprise 3層ゼロトラスト制御",
          title: "Context-Aware Access + Restricted Client Access + VPC Service Controls",
          summary:
            "Google Cloud 上の Gemini / Vertex AI エンドポイントを、管理対象 Chrome 検証・グループ制御・VPC Service Controls 境界の 3 層で保護します。",
          estimatedTime: "所要時間: 約 45 秒",
          targetScope: "Google Cloud プロジェクト + 組織 Access Policy + グループ",
          authRequirement: "Google Cloud 組織管理者 + Workspace 管理者",
          nodes: [
            { label: "第1層 · Chrome ポスチャ", detail: "管理対象 Chrome を要求する Access Level", costBadge: "端末検証" },
            { label: "第2層 · グループ拘束", detail: "Cloud Identity グループのセッション制御", costBadge: "ID拘束" },
            { label: "第3層 · VPC-SC 境界", detail: "discoveryengine / aiplatform API を境界保護", costBadge: "Dry-Run 対応" },
            { label: "Gemini Enterprise", detail: "非管理端末からの API 呼び出しを遮断", costBadge: "ゼロトラストAI" },
          ],
          supports: [
            { label: "組織階層の自動探索", detail: "親フォルダを辿って組織 ID と Access Policy を自動特定" },
            { label: "Dry-Run 初期値", detail: "既存環境への影響を防ぐため初期状態は監査モードで構成" },
            { label: "ロックアウト防止", detail: "プロジェクト ID 確認と既存メンバー保持で誤遮断を防止" },
          ],
        },
      ],
      implementationTitle: "Easy PoC の実装機能一覧",
      implementationIntro:
        "ブラウザの管理者セッションから Google Workspace・Chrome Policy・Cloud Identity・Google Cloud API を直接呼び出します。",
      implementationEyebrow: "実装モジュール一覧",
      implementationGroups: [
        {
          eyebrow: "認証・ターゲット選択",
          title: "右上共通ログイン・検証用 OU ワンクリック作成・グループ指定",
          items: [
            "右上の Google Workspace / Google Cloud ボタンで認証状態を共有します。",
            "顧客ID・組織部門・Google グループ・Access Level 一覧を自動取得します。",
            "［＋ 検証用 OU を作成して選択］から `/CEP-PoC` をワンクリック作成でき、グループ単位の適用にも対応します。",
            "最上位 `/` への変更はコードレベルで拒否します。",
          ],
        },
        {
          eyebrow: "リスク診断",
          title: "15項目のセキュリティ診断 & プリセット自動反映",
          items: [
            "15 項目のチェックリストから自社のリスク課題を整理できます。",
            "選択項目に応じて Chrome ポリシーと 7 行の DLP マトリクスを自動選択します。",
            "ワンクリックでウィザードとマトリクスへ設定値を反映できます。",
          ],
        },
        {
          eyebrow: "ブラウザ制御・SaaS統制",
          title: "Chrome 基本ポリシー & HTTP ヘッダー注入",
          items: [
            "適用前にテナントの policySchemas を検証し、ターゲット単位でバッチ適用します。",
            "セーフブラウジング保護強化、パスワード警告、一時プロファイル、セカンダリアカウント制限を構成します。",
            "Endpoint Verification 拡張機能を対象 OU またはグループへ強制配信します。",
            "HttpHeaderInjection で主要 6 種の SaaS テナント制限ヘッダーを設定し、シークレットモードを無効化します。",
          ],
        },
        {
          eyebrow: "コンテンツ検査・DLP",
          title: "Enterprise Connectors & Cloud Identity DLP マトリクス",
          items: [
            "ファイル送受信・大量テキスト入力・印刷・イベント報告の 5 コネクタを構成します。",
            "カスタム正規表現検出器と 7 行の Cloud Identity DLP ルールを作成します。",
            "Cloud Identity 対応のアクセスレベル関数で管理端末限定および BYOD 限定ルールを生成します。",
            "カスタム警告メッセージと社内 URL への画面透かし表示に対応します。",
          ],
        },
        {
          eyebrow: "ライセンス・権限委任",
          title: "CEP ライセンス一括付与 & カスタム管理者ロール",
          items: [
            "選択 OU 直下のユーザー最大 10 名へ CEP ライセンスを一括付与します。",
            "CEP Security Admin と CEP Auditor の最小権限カスタムロールを作成・割り当てます。",
            "[Google 管理コンソールのロール画面](https://admin.google.com/ac/roles) と [ライセンス設定画面](https://admin.google.com/ac/billing/licensesettings) への直リンクを提供します。",
          ],
        },
        {
          eyebrow: "検証・ロールバック",
          title: "タブ別の独立実行・APIトレース・ワンクリック撤去",
          items: [
            "タブ 1・2・3 はそれぞれ自身のスコープのみを独立実行します。",
            "同等の API 呼び出しを再現する `provision-cep-poc.sh` を出力できます。",
            "全 API の HTTP メソッド・URL・ステータスを Execution Trace に記録します。",
            "タブ 4 のロールバックで Chrome ポリシーを継承状態へ戻し、作成した PoC 用 DLP ルールのみを削除します。",
          ],
        },
      ],
      stepLabel: (step) => `タブ ${step}`,
      technicalDeepDiveTitle: "4つの機能タブの動作と API リファレンス",
      technicalDeepDiveIntro:
        "各タブは独立して動作するため、必要な機能だけを段階的に適用できます。",
      technicalEyebrow: "タブ別の動作仕様",
      steps: [
        {
          title: "1. セットアップウィザード",
          subtitle: "適用スコープ選択・基本ポリシー・コネクタ・SaaS ヘッダー制限",
          summary:
            "検証用の子 OU またはグループを選択し、Chrome 基本ポリシー、Endpoint Verification、Enterprise Connectors、クリップボード境界、SaaS テナント制限を適用します。",
          actions: [
            "右上の［Google Workspace］からログインし、顧客ID・OU・グループ一覧を読み込みます。",
            "ドロップダウンから対象を選ぶか、［＋ 検証用 OU を作成して選択］で `/CEP-PoC` を自動作成します。",
            "有効化するモジュール、データ境界、SaaS テナント制限を設定し、［選択したポリシーをデプロイ］を押します。",
          ],
          optionsBehavior: [
            {
              name: "組織部門 vs Google グループ",
              behavior: "OU 指定時は orgunits:batchModify を使用し、ボタンから `/CEP-PoC` を自動作成できます。グループ指定時は groups:batchModify で所属部署を変えずに適用します。",
            },
            {
              name: "Context-Aware Access 連携",
              behavior: "GCP プロジェクト ID 入力時のみ Access Level を作成・再利用し、空欄時は Chrome ポリシーのみを適用します。",
            },
            {
              name: "SaaS テナント制限",
              behavior: "HttpHeaderInjection にテナント制限ヘッダーを設定し、シークレットモードとゲストモードを無効化します。",
            },
          ],
          apiCalls: [
            {
              method: "GET",
              endpoint: "https://admin.googleapis.com/admin/directory/v1/customers/my_customer",
              purpose: "テナントの顧客IDを解決します。",
            },
            {
              method: "POST",
              endpoint: "https://admin.googleapis.com/admin/directory/v1/customer/{customerId}/orgunits",
              purpose: "検証用の子 OU `/CEP-PoC` およびサブ OU を作成します。",
            },
            {
              method: "POST",
              endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:batchModify",
              purpose: "選択 OU へ Chrome ポリシー・コネクタ・HTTP ヘッダー注入を一括適用します。",
            },
            {
              method: "POST",
              endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/groups:batchModify",
              purpose: "選択グループへ Chrome ポリシーとコネクタを一括適用します。",
            },
          ],
          safetyNote:
            "タブ 1 のデプロイはブラウザ基本設定とコネクタのみを適用し、タブ 3 の DLP ルールは作成しません。",
        },
        {
          title: "2. ライセンス・管理者ロール",
          subtitle: "CEP ライセンス一括付与と最小権限カスタムロール作成",
          summary:
            "選択 OU 直下のテストユーザーへ CEP ライセンスを付与し、運用・監査用のカスタム管理者ロールを作成します。",
          actions: [
            "対象のパイロット OU を選び、［選択した OU のユーザーに CEP ライセンスを一括付与］を押します。",
            "ロール種別と割り当て先メールアドレスを指定し、［カスタムロールを作成・確認］を押します。",
          ],
          optionsBehavior: [
            {
              name: "パイロット付与の上限ガード",
              behavior: "選択 OU 直下のユーザー最大 10 名までに制限して SKU 1010310003 を付与し、付与済みユーザーはスキップします。",
            },
            {
              name: "ロール権限の自動照合",
              behavior: "テナントで利用可能な roleprivileges と照合してロールを作成するため、エディション差によるエラーを防ぎます。",
            },
          ],
          apiCalls: [
            {
              method: "GET",
              endpoint: "https://admin.googleapis.com/admin/directory/v1/users?customer={customerId}&query=orgUnitPath='{ouPath}'",
              purpose: "選択 OU 直下のアクティブユーザー最大 10 名を取得します。",
            },
            {
              method: "POST",
              endpoint: "https://licensing.googleapis.com/apps/licensing/v1/product/Chrome-Enterprise-Premium/sku/1010310003/user",
              purpose: "対象ユーザーへ CEP ライセンスを割り当てます。",
            },
            {
              method: "POST",
              endpoint: "https://admin.googleapis.com/admin/directory/v1/customer/{customerId}/roles",
              purpose: "CEP Security Admin / CEP Auditor ロールを作成します。",
            },
          ],
          safetyNote:
            "大量消費を防ぐため、直下 OU・最大 10 名・5 秒タイムアウトの上限が組み込まれています。",
        },
        {
          title: "3. DLP・脅威対策マトリクス",
          subtitle: "7行の Cloud Identity DLP ルール・BYOD 制御・透かし・Gemini 境界保護",
          summary:
            "7 つの脅威行ごとに操作別アクションと対象端末範囲を設定し、カスタム検出器と Cloud Identity DLP ルールを展開します。",
          actions: [
            "DLP プリセットを選ぶか、7 行のマトリクスで各操作のアクションと対象端末範囲を設定します。",
            "透かし表示用の社内サイト URL とカスタム警告文を入力し、［選択したポリシーをデプロイ］を押します。",
            "Gemini Enterprise の境界保護も試す場合は、下部カードでプロジェクト ID を確認して実行します。",
          ],
          optionsBehavior: [
            {
              name: "Cloud Identity 用アクセスレベル式",
              behavior: "Cloud Identity がサポートする `access_levels.meets_access_requirements` 関数で管理端末・BYOD 条件を生成します。",
            },
            {
              name: "既存 DLP ルールの再利用",
              behavior: "同一スコープ・同一条件のルールが既に存在する場合は重複作成せず再利用します。",
            },
            {
              name: "Gemini 3層ゼロトラスト構成",
              behavior: "Access Level、グループバインディング、VPC-SC サービス境界を一括構成します。",
            },
          ],
          apiCalls: [
            {
              method: "POST",
              endpoint: "https://cloudidentity.googleapis.com/v1beta1/policies",
              purpose: "カスタム正規表現検出器および 7 行の Cloud Identity DLP ルールを作成します。",
            },
            {
              method: "PATCH",
              endpoint: "https://accesscontextmanager.googleapis.com/v1/accessPolicies/{policyId}/servicePerimeters/{perimeterName}",
              purpose: "Gemini Enterprise 用の VPC Service Controls 境界を更新します。",
            },
          ],
          safetyNote:
            "透かし用 URL が未入力の場合は透かしルールのみをスキップし、他の DLP ルールは正常に適用されます。",
        },
        {
          title: "4. 検証・クリーンアップ",
          subtitle: "ワンクリック検証データ・API実行トレース・ロールバック",
          summary:
            "ダミーデータを使って実機 Chrome で DLP 動作を検証し、確認後はワンクリックでロールバックします。",
          actions: [
            "検証用 Chrome の `chrome://policy` でポリシーを再読み込みし、`chrome://connectors-internals` で有効化を確認します。",
            "ダミーのマイナンバー・カード番号・100 文字超の機密コードをコピーし、外部サイトへの貼り付けやファイル添付を試します。",
            "検証終了後は［PoC ポリシーをロールバック］を押し、Chrome ポリシーの継承復元と PoC 用 DLP ルール削除を実行します。",
          ],
          optionsBehavior: [
            {
              name: "ペースト検査の 100 文字しきい値",
              behavior: "Chrome のペースト検査は約 100 文字以上の貼り付けで起動します。タブ 4 のダミーコードは 100 文字超のためそのまま検証できます。",
            },
            {
              name: "スコープ限定のロールバック",
              behavior: "選択した OU またはグループの Chrome ポリシーを継承へ戻し、`CEP PoC - ` で始まる該当 DLP ルールのみを削除します。",
            },
          ],
          apiCalls: [
            {
              method: "POST",
              endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:inherit",
              purpose: "対象 OU の Chrome ポリシーを親 OU の継承状態へ戻します。",
            },
            {
              method: "DELETE",
              endpoint: "https://cloudidentity.googleapis.com/v1beta1/policies/{policyName}",
              purpose: "対象スコープの `CEP PoC - *` DLP ルールを削除します。",
            },
          ],
          safetyNote:
            "既存の他部門向け DLP ルールや他ルールが参照する検出器は削除されません。",
        },
      ],
      faqTitle: "Easy PoC よくある質問",
      faqIntro:
        "権限、OU とグループの選び方、ペースト検査の文字数、ロールバックの仕様をまとめています。",
      faqEyebrow: "トラブルシューティング",
      faqs: [
        {
          id: "cep-faq-super-admin",
          category: "管理者権限",
          question: "DLP ルールやカスタムロールの作成で 403 Permission Denied になる理由は？",
          answer:
            "Cloud Identity Policies API とロール管理 API は Google Workspace の仕様により特権管理者権限を要求します。タブ 2・タブ 3 を実行する際は特権管理者でログインしてください。",
          checklist: [
            "右上の［Google Workspace］から特権管理者アカウントでログインし直します。",
            "[Google 管理コンソールのロール画面](https://admin.google.com/ac/roles) で自身のアカウントに特権管理者が付与されているか確認します。",
          ],
        },
        {
          id: "cep-faq-ou-vs-group",
          category: "適用スコープ",
          question: "組織部門と Google グループのどちらを選ぶべきですか？",
          answer:
            "全ポリシーとタブ 2 のライセンス自動付与を使う場合は組織部門を選びます。ユーザーの所属部署を動かせない環境では Google グループを選ぶと部署移動なしで検証できます。",
          checklist: [
            "タブ 2 の CEP ライセンス一括付与を使う場合は組織部門を選択します。",
            "グループ選択時は OU 専用の一部のブラウザ設定が自動スキップされます。",
          ],
        },
        {
          id: "cep-faq-paste-threshold",
          category: "DLP 検証",
          question: "16桁のカード番号だけをペーストしたときに反応しないのはなぜですか？",
          answer:
            "Chrome のペースト検査コネクタは約 100 文字以上の貼り付け時にスキャンを起動します。16 桁単体では文字数が足りないため起動しません。",
          checklist: [
            "タブ 4 の 100 文字超のダミーデータをコピーして貼り付けます。",
            "またはカード番号を入れた `.txt` ファイルを添付して検証します。",
          ],
        },
        {
          id: "cep-faq-cel-access-level",
          category: "BYOD 制御",
          question: "BYOD 限定ルールには Google Cloud プロジェクト ID が必要ですか？",
          answer:
            "端末種別を判定する Access Level は Google Cloud 組織の Access Context Manager で管理されるため、BYOD 限定ルールを使う場合のみ右上の［Google Cloud］にプロジェクト ID を入力します。",
          checklist: [
            "全端末を対象にする場合は Google Cloud プロジェクト ID なしで全 DLP ルールを作成できます。",
          ],
        },
        {
          id: "cep-faq-saas-headers",
          category: "SaaS テナント制限",
          question: "HTTP ヘッダー注入はどのように個人アカウント利用を防ぎますか？",
          answer:
            "管理対象 Chrome が対象 SaaS へ通信する際、許可された法人テナント ID を示す HTTP ヘッダーを自動付与します。SaaS 側がヘッダーを検証し、個人アカウントでのログインを拒否します。",
          checklist: [
            "タブ 1 で対象 SaaS のプリセットを選び、自社ドメインやテナント ID を入力します。",
          ],
        },
        {
          id: "cep-faq-rollback-safety",
          category: "ロールバック",
          question: "ロールバックを実行すると既存の本番 DLP ルールまで消えませんか？",
          answer:
            "消えません。選択した OU またはグループの Chrome ポリシー継承復元と、`CEP PoC - ` で始まる該当スコープのルール削除のみを行います。",
          checklist: [
            "適用時と同じ OU またはグループを選択してロールバックを実行します。",
          ],
        },
      ],
    },
    eyebrow: "新規セットアップガイド",
    title: "各セットアップ手順で実行すること",
    intro:
      "ウィザードは現在の状態を検出し、確認・承認可能な Secure Gateway デプロイを作成します。最後の「適用」より前に変更するのは、初回準備で明示的に確認したデプロイヤーSA、カスタムロール、IAMバインディングだけです。検出とその他の設定手順は読み取り専用です。",
    pocNoticeTitle: "PoC 検証環境のスコープと安全上の注意事項",
    pocNoticeBody:
      "本番モードはこのリリースでは無効化されています。非本番専用の組織部門とテスト用アカウントを使用し、本番トラフィックを流さないでください。",
    quickOverviewTitle: "クイック概要 & 基本アーキテクチャ",
    quickOverviewIntro:
      "3つのデプロイアーキテクチャと7つのセットアップステップの概要です。",
    technicalDeepDiveTitle: "ステップ別の技術詳細と Google REST API 連携",
    technicalDeepDiveIntro:
      "各ステップの内部処理、オプションごとの挙動、呼び出される REST API の一覧です。",
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
    costOverviewTitle: "コスト要因",
    costOverviewIntro:
      "料金はリージョン、使用量、選択リソース、Chrome Enterprise Premium契約によって変わります。適用前に [Google Cloud コンソール](https://console.cloud.google.com) の最新料金と CEP 契約を確認してください。",
    costTag: "最新料金を要確認",
    fixedCostLabel: "作成リソース",
    variableCostLabel: "従量要因",
    architectures: [
      {
        eyebrow: "① HTTPS アプリ · 直接接続 / サンプルVM (Option A)",
        title: "接続先が HTTPS アプリ: Secure Gateway から直接接続 (またはサンプルVM起動)",
        summary:
          "アプリが既にHTTPSを提供する場合、またはサンプルVMで最短検証する場合に使います。既存HTTPSアプリ接続時はNginx、VM、NAT、オフロード証明書を作成しません。",
        estimatedCost: "月額概算: 新規インフラ USD 0",
        costFixed: "新しいVM、ロードバランサー、Cloud NAT、オフロード証明書、管理対象DNSレコードは作成しません。",
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
        eyebrow: "② HTTP アプリ · 内部ロードバランサでHTTPS化 (Option B)",
        title: "接続先が HTTP アプリ: 内部HTTPSロードバランサ (Internal ALB) でTLS終端",
        summary:
          "承認済みrunがRegional Internal Application Load Balancerとrun所有の非公開サンプルバックエンドVM 1台を作成します。ILBがサーバー証明書を提示し、復号後のHTTPをそのVMのTCP 80へ転送します。",
        estimatedCost: "月額概算: 約 USD 80～90",
        costFixed: "asia-northeast1で720時間・軽負荷を想定。ILBの最小3プロキシが約USD 54/月で、e2-small VM 1台、20GBディスク、Cloud DNS、専用VPCのCloud NATを加えた概算です。",
        costVariable: "通信量、ログ、リージョンで変動します。検証後にrunを削除すると時間課金を止められます。",
        nodes: [
          { label: "管理対象Chrome", detail: "Chrome Root Storeから発行元Root CAを信頼", costBadge: "CEPライセンスが必要" },
          { label: "Secure Gateway", detail: "ID・コンテキスト・hostname:443ポリシー", costBadge: "CEP契約を確認" },
          { label: "Regional Internal Application LB", detail: "リージョンサーバー証明書でHTTPS終端", costBadge: "リージョン・使用量で課金" },
          { label: "HTTPバックエンド", detail: "run所有の非公開サンプルVM・TCP 80", costBadge: "Compute・ディスク課金" },
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
        eyebrow: "② HTTP アプリ · Nginx VMでHTTPS化 (Option C)",
        title: "接続先が HTTP アプリ: Nginx リバースプロキシVMでTLS終端",
        summary:
          "HTTPしか提供しないプライベートアプリ、または従来のNginx構成が必要な場合だけ使用します。PoCは非公開Nginx VM 1台を使用します。",
        estimatedCost: "月額概算: 約 USD 45～60",
        costFixed: "Nginx方式ではCompute Engineインスタンス、ディスク、Cloud DNS、Cloud NATを作成します。",
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
      "現在のコードベースに実装されている技術要素です。「スケール対応」はバックエンドに実装済みですが、Productionが無効な間は選択できません。",
    implementationEyebrow: "実装機能一覧",
    implementationGroups: [
      {
        eyebrow: "データプレーン",
        title: "HTTPオフロードと直接HTTPS",
        items: [
          "Nginx HTTPオフロード方式は管理対象サンプルまたは既存プライベートHTTPアプリに対応し、ILB HTTPSオフロードはrun所有の非公開サンプルバックエンドVMに対応します。",
          "拡張機能のILB HTTPSオフロード方式は、非公開サンプルVMとunmanaged instance group、REGIONAL_MANAGED_PROXYサブネット、HTTP health check、INTERNAL_MANAGED backend service、regional URL map/サーバー証明書/target HTTPS proxy、内部forwarding rule、Private DNSを作成します。",
          "直接HTTPSは既存VPC経由の正確なhostname:portルートを作り、Nginx、オフロードTLS、NAT、管理Aレコードを作成しません。",
          "専用VPCでは作成VM用Cloud Router/NATを追加し、既存VPCではプライベートegress確認ゲートを必須にします。",
        ],
      },
      {
        eyebrow: "スケール対応HTTP層",
        title: "Regional Nginxの可用性とオートスケール",
        items: [
          "2ゾーンRegional Nginx MIG、内部パススルーNetwork Load Balancer、リージョンTLSヘルスチェックをスケール対応方式に実装しています。",
          "CPUオートスケールは既定2～20台・CPU 60%で、最小レプリカ数がHealthyになるまでデプロイを待機します。",
          "MIG/Autoscalerの検出、互換性・競合判定、所有範囲限定の逆順ロールバック、必須IAM権限確認を実装しています。",
        ],
      },
      {
        eyebrow: "Google制御プレーン",
        title: "CloudとChrome APIの自動化",
        items: [
          "選択方式に応じ、Service Usage、IAM、Compute、Cloud DNS、Secret Manager、CA Service、BeyondCorp、Access Context Manager、Chrome Policy/Management、Licensing、Billingを検出・操作します。",
          "キーレスデプロイヤーSAとカスタムロールを準備し、不足する許可済みAPIを自動有効化します。",
          "テストOUへSecure Enterprise BrowserとEndpoint Verificationを強制インストールし、Gateway routeを設定します。",
        ],
      },
      {
        eyebrow: "TLSとID",
        title: "証明書と管理対象Chromeアクセス",
        items: [
          "HTTPオフロードはEnterprise CA、検証済み公開証明書Secret、公開ルートPEMを出力するローカルPoC CAに対応します。",
          "秘密鍵は専用accessor identity付きSecret Managerに保持します。",
          "[Google 管理コンソール](https://admin.google.com) の Chrome Root Store へのアップロードと OU 接続手順を案内します。",
        ],
      },
      {
        eyebrow: "安全なApply",
        title: "検出、承認、進捗、ロールバック",
        items: [
          "信頼済みDiscoveryが望ましい状態との差分を作成し、新規作成/更新/変更なし/競合を分類します。",
          "承認は正確な構成ハッシュに紐付き、有効期限・1回限り・編集時無効化を持ちます。",
          "Applyは操作チェックポイントを記録し、中断時は共有リソースの変更前状態を守りつつ所有変更のみを逆順にロールバックします。",
        ],
      },
      {
        eyebrow: "検証とローカル保護",
        title: "Acceptance証跡とオペレーター保護",
        items: [
          "受入マトリクスには自動システム検証、管理対象Chromeによる実機接続検証、アクセス拒否の検証結果を記録し、改ざん防止監査チェーン付きのJSON証跡として出力します。",
          "拡張機能は隔離されたMV3オリジン、厳格なCSP、セッション限定の一時秘密鍵、および暗号化IndexedDBを使用し、端末ローカルに永続的な秘密鍵やサービスアカウントJSONキーを出力・保存しません。",
          "初回準備後のGoogle Cloud変更は、固定したキーレスデプロイヤーSAで実行します。Workspace、Chrome、Cloud Identity、ライセンスの変更は、各APIがWorkspaceユーザー権限を必要とするためログイン中の管理者で実行します。サービスアカウントJSONキーや他クラウドの認証情報は受け付けません。",
        ],
      },
    ],
    stepLabel: (step) => `ステップ ${step}`,
    steps: [
      {
        title: "モード",
        subtitle: "PoC 境界の画定と戦略の選択",
        summary:
          "PoC の対象範囲、VPC ネットワーク戦略、および TLS 認証局モデルを決定します。",
        actions: [
          "軽量構成には迅速なPoCモードを使い、専用の非本番project、VPC、OUを明示的に選択します。PoCモードだけでは、選択した既存リソースが非本番であることを保証しません。",
          "新規の専用 VPC を自動作成するか、既存の社内 VPC に直接ルーティングするかを選択します。",
          "TLS 証明書の発行元として Enterprise CA、パブリック証明書、またはローカル PoC CA を選択します。",
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
              "専用VPCは10.42.0.0/24サブネットを持つ新規ネットワークを作成します。無競合を保証するのではなく、検出できたCIDR重複やリソース衝突を事前検出でブロックします。既存VPCは選択したネットワークを経由します。",
          },
          {
            name: "証明書戦略",
            behavior:
              "Enterprise CA は Google CA Service と連携、Public は既存 Secret を参照、Local PoC CA はローカルで一時的な自己署名 Root CA を自動生成します。",
          },
        ],
        apiCalls: [],
        safetyNote: "Local PoC CA を使用する場合は、本番環境ではなく専用のテスト用 OU に限定して配布してください。",
      },
      {
        title: "ID",
        subtitle: "完全キーレスなクラウド & Workspace 管理者認証",
        summary:
          "サービスアカウントJSONキーを発行・保存せず、管理者アカウントによるキーレスのサービスアカウント借用認証を確立します。",
        actions: [
          "ブラウザ管理の管理者OAuthによるキーレス認証を使用し、サービスアカウントJSONキーを発行・保存しません。",
          "製品の全対応パスに限定したカスタムロールを持つ専用デプロイヤーSAを自動プロビジョニングします。",
          "[Google Cloud コンソール](https://console.cloud.google.com) のプロジェクトおよび [Google 管理コンソール](https://admin.google.com) の Chrome Policy への読み取りアクセスを検証します。",
        ],
        optionsBehavior: [
          {
            name: "Google Cloud プロジェクト ID",
            behavior:
              "Secure Gateway やロードバランサーを構築する対象 GCP プロジェクトを指定します。",
          },
          {
            name: "Google Workspace 顧客 ID",
            behavior:
              "Chrome Enterprise ポリシーを配布する対象テナントを指定します。",
          },
          {
            name: "デプロイヤー自動作成",
            behavior:
              "SA `secure-gateway-deployer` と専用ロールを作成し、ログイン中管理者だけに Token Creator を付与します。",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/serviceAccounts",
            purpose: "キーレスデプロイヤー専用サービスアカウントを新規作成します。",
          },
          {
            method: "POST",
            endpoint: "https://iam.googleapis.com/v1/projects/{projectId}/roles",
            purpose: "全デプロイ・ロールバック・削除経路の権限を持つカスタムロールを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://cloudresourcemanager.googleapis.com/v1/projects/{projectId}:setIamPolicy",
            purpose: "プロジェクトレベルでカスタムロールをバインドします。",
          },
          {
            method: "GET",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policySchemas",
            purpose: "Chrome Policy スキーマの読み取り権限を検証します。",
          },
        ],
        safetyNote: "サービスアカウント JSON 鍵は生成・保存せず、Google OAuth と短命の偽装認証情報を使用します。",
      },
      {
        title: "環境",
        subtitle: "データプレーン設計とプライベートルーティングの定義",
        summary:
          "ターゲット VPC、リージョン、プライベートホスト名、およびアーキテクチャパスを構成します。Option B は専用の非公開サンプルバックエンドVMを作成します。",
        actions: [
          "アプリのプライベートホスト名、ポート、および Upstream VPC ネットワークを指定します。",
          "Shared VPCなど別プロジェクトのアップストリームを使う場合、アップストリームプロジェクトの管理者がデプロイヤーSAへ `compute.networks.get`、`compute.networks.use`、`resourcemanager.projects.get`、`resourcemanager.projects.getIamPolicy`、`resourcemanager.projects.setIamPolicy` の5権限を含むカスタムロールを事前付与します。",
          "Option BではGoogle管理Envoyプロキシ用のProxy-OnlyサブネットCIDRを設定し、run所有の非公開サンプルバックエンドVMを作成します。",
        ],
        optionsBehavior: [
          {
            name: "Option A · Direct HTTPS",
            behavior:
              "既存の HTTPS アプリへ直接 Secure Gateway をルーティングします。Nginx や ILB は作成しません。",
          },
          {
            name: "Option B · ILB HTTPS Offload",
            behavior:
              "Regional Internal Application Load Balancer、Envoy Proxyサブネット、run所有の非公開サンプルVMを作成し、TLS終端後のHTTPをそのVMのTCP 80へ転送します。",
          },
          {
            name: "Option C · Nginx HTTPS Offload",
            behavior:
              "専用の Nginx VM または MIG を VPC 内にデプロイし、HTTPS 終端と HTTP 転送を行います。",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways",
            purpose: "Secure Gateway リソースを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways/{gw}/applications",
            purpose: "プライベートアプリケーションを登録します。",
          },
          {
            method: "POST",
            endpoint: "https://compute.googleapis.com/compute/v1/projects/{projectId}/global/firewalls",
            purpose: "送信元 136.124.16.0/20 からの TCP 通信を許可するルールを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://dns.googleapis.com/dns/v1/projects/{projectId}/managedZones",
            purpose: "対象 VPC に紐づく Cloud DNS 限定公開ゾーンを作成します。",
          },
        ],
        safetyNote: "リージョンILBをクロスリージョンで利用する場合はFrontendのGlobal Access有効化が必須です。",
      },
      {
        title: "証明書",
        subtitle: "TLS 所有権と Chrome Root Store への信頼伝播",
        summary:
          "証明書の発行元を定義し、Secret Manager で秘密鍵を隔離保管した上で、Chrome Root Store による信頼配布を準備します。",
        actions: [
          "Enterprise CA Service、既存 Secret、またはブラウザ自動生成の Local PoC CA を指定します。",
          "TLS 秘密鍵を Secret Manager に暗号化保管し、最小権限のアクセス権を設定します。",
          "生成された公開 Root PEM をダウンロードし、[Google 管理コンソール](https://admin.google.com) の Chrome Root Store に登録します。",
        ],
        optionsBehavior: [
          {
            name: "Enterprise CA Service",
            behavior:
              "Google Cloud CA Service の既存 CA プールからサーバー証明書を発行します。",
          },
          {
            name: "Public Secret",
            behavior:
              "Secret Manager に事前格納されたサーバー証明書を参照します。",
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
            purpose: "TLS 証明書および秘密鍵を格納するシークレットを作成します。",
          },
          {
            method: "POST",
            endpoint: "https://secretmanager.googleapis.com/v1/projects/{projectId}/secrets/{secretId}:addVersion",
            purpose: "証明書・鍵のバージョンを追加します。",
          },
        ],
        safetyNote:
          "Root CA の秘密鍵はエクスポートしません。サーバー秘密鍵は実行中だけセッションストレージに保持し、Secret Manager へ送信後に消去します。",
      },
      {
        title: "アクセス",
        subtitle: "ゼロトラスト認可と Chrome ポリシーの配信",
        summary:
          "Context-Aware Access レベルを適用し、テスト OU の管理対象ブラウザにポリシーを配信します。",
        actions: [
          "Google Workspace Directory API から対象の組織部門を選択します。",
          "BeyondCorp のデバイス・プロファイル状態を検証するアクセスレベルを紐付けます。",
          "テスト対象のユーザー、グループ、またはドメインに Secure Gateway アプリ利用権限を付与します。",
        ],
        optionsBehavior: [
          {
            name: "対象組織部門",
            behavior:
              "テスト OU 配下のブラウザだけに Gateway 設定を配信します。",
          },
          {
            name: "Managed Chrome Access Level",
            behavior:
              "Endpoint Verification 等の条件を満たす端末・プロファイルのみ通信を許可します。",
          },
          {
            name: "プリンシパル",
            behavior:
              "IAM で `roles/beyondcorp.sgApplicationUser` ロールを対象 ID にバインドします。",
          },
        ],
        apiCalls: [
          {
            method: "POST",
            endpoint: "https://chromepolicy.googleapis.com/v1/customers/{customerId}/policies/orgunits:batchModify",
            purpose: "拡張機能の強制インストールと Gateway ルーティングを設定します。",
          },
          {
            method: "POST",
            endpoint: "https://beyondcorp.googleapis.com/v1/projects/{projectId}/locations/global/securityGateways/{gw}/applications/{app}:setIamPolicy",
            purpose: "アプリ利用権限とアクセスレベル条件をバインドします。",
          },
        ],
        safetyNote: "親 OU から継承されたレガシー PAC ポリシーが存在する場合、対象テスト OU だけをバイパス上書きします。",
      },
      {
        title: "確認",
        subtitle: "決定論的事前ディスカバリーと暗号的承認",
        summary:
          "既存リソースの非破壊スキャンを実行し、すべての安全ゲートを評価した上で、構成ハッシュに紐づく承認を行います。",
        actions: [
          "Google Cloud / Workspace のリソースを読み取り専用スキャンし、望ましい状態との差分プランを作成します。",
          "課金、ライセンス、API、CIDR 重複、IAM 権限などの安全ゲートを評価します。",
          "設定ハッシュに拘束される人手承認を実施します。",
        ],
        optionsBehavior: [
          {
            name: "事前確認ディスカバリー",
            behavior:
              "変更を加えることなく全 API をプローブし、既存インフラとの互換性や競合を事前検出します。",
          },
          {
            name: "安全ゲート",
            behavior:
              "前提条件が満たされているか自動判定します。",
          },
          {
            name: "SHA-256 承認バインディング",
            behavior:
              "プラン全体の正規化ハッシュを算出して承認を記録します。設定が変更されると承認は即時失効します。",
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
            purpose: "必要なすべての IAM 権限を呼び出し元 SA が持っているか検証します。",
          },
        ],
        safetyNote: "ブロック判定の安全ゲートが残っている間は承認操作ができません。",
      },
      {
        title: "適用",
        subtitle: "依存順オーケストレーション、逆順ロールバック、受入検証",
        summary:
          "承認済みオペレーションを依存順に実行して所有権を追跡し、その後の個別検証用に受入マトリクスを保存します。",
        actions: [
          "サブネット → 証明書 → バックエンド → Gateway → DNS → Chrome ポリシーの依存順で作成します。",
          "作成したリソースの所有権を記録し、異常発生時は作成済みリソースのみを逆順ロールバックします。",
          "適用後に［運用］画面から自動システム検証を実行し、管理対象Chromeの実機接続テスト証跡を記録します。",
        ],
        optionsBehavior: [
          {
            name: "依存関係順のデプロイ実行",
            behavior:
              "下位インフラが準備完了してから上位サービスをバインドします。",
          },
          {
            name: "所有範囲限定の自動ロールバック",
            behavior:
              "途中で失敗した場合、既存の共有リソースを傷つけることなく、本デプロイで作成したリソースのみを逆順削除します。",
          },
          {
            name: "個別の受入検証と証跡出力",
            behavior:
              "Applyはマトリクスの保存だけを行います。［運用］画面で自動システム検証を実行し、管理対象Chromeでの実機テスト証跡や未許可アクセスの拒否結果を記録します。",
          },
        ],
        apiCalls: [],
        safetyNote:
          "MV3 ワーカーの停止は永続チェックポイントから再開します。ブラウザセッション終了により一時 TLS 秘密鍵を失った場合は安全側に失敗し、実行の所有範囲に限定してロールバックします。",
      },
    ],
    faqTitle: "よくある質問とトラブルシューティング",
    faqIntro:
      "Secure Gateway 構築・検証時のトラブル対処法、証明書信頼、OAuth 配布設定、削除手順をまとめています。",
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
          "対象実行の［リソース］と［ログ］を開き、自動システム検証を実行します。",
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
          "デプロイ管理画面から最新の公開PoCルートPEMをダウンロードし、フィンガープリントを照合します。",
          "[Google 管理コンソール](https://admin.google.com) の［Chrome］>［コネクタ］>［Chrome Root Store］でPEMを追加し、その構成を専用テストOUだけに接続します。",
          "同じ管理対象の仕事用プロファイルで `chrome://policy` を開き、［ポリシーを再読み込み］を実行します。",
          "同じ管理対象プロファイルで承認済みプライベートHTTPSホスト名を再試験します。",
        ],
      },
      {
        id: "faq-oauth-external-mode",
        category: "OAuth・配布設定",
        question: "社外のテスターや複数ドメインのユーザーに拡張機能を配布する場合、OAuth 同意画面はどのように設定しますか？",
        answer:
          "同一 Workspace 組織内だけなら「内部」を使用できます。組織外のテスターには「外部／テスト中」を使い、明示したテストユーザーだけを登録します。この拡張機能は機密スコープを要求するため、外部向け本番配布には Google の OAuth ブランド審査とスコープ審査が必要です。",
        checklist: [
          "[Google Cloud コンソール](https://console.cloud.google.com) の［APIとサービス］>［OAuth 同意画面］でユーザータイプを「外部」に変更する。",
          "「テスト中」では各テスターを［テストユーザー］に追加する。",
          "外部向け本番利用の前に、リポジトリの OAuth ブランド／スコープ審査チェックリストを完了する。",
        ],
      },
      {
        id: "faq-extension-id-mismatch",
        category: "OAuth・配布設定",
        question: "テスターの PC で「OAuth2 request failed: Bad Client ID」エラーが出るのを防ぐには？",
        answer:
          "manifest.json に固定公開鍵がない未パッケージ拡張は、読み込むフォルダによって Chrome 拡張機能 ID が変わります。GCP の OAuth クライアント ID で指定したアイテム ID とテスター側の拡張機能 ID を一致させる必要があります。",
        checklist: [
          "[Google Cloud コンソール](https://console.cloud.google.com) の［認証情報］>［OAuth 2.0 クライアント ID］に設定されているアイテム ID と、`chrome://extensions` の ID が一致しているか確認する。",
          "本プロジェクトのバージョン付き `secure-gateway-studio` ZIP は固定公開鍵を含むため、どの PC で解凍しても同一の拡張機能 ID に固定されます。",
        ],
      },
      {
        id: "faq-access-level-cel",
        category: "ゼロトラスト・アクセス制御",
        question: "Access Context Manager で「管理対象 Chrome のみ」にアクセス制限する仕組みは？",
        answer:
          "BeyondCorp Application の IAM ポリシーは、`device.chrome.management_state` を CEL で評価する Access Context Manager レベルを参照します。検証済みレベルを満たさない通信は Google のエッジで拒否されます。",
        checklist: [
          "デプロイ管理画面では NONE または Google から取得した既存の `accessPolicies/.../accessLevels/...` リソースを選択します。",
          "画面が更新するのはアプリケーションの条件付き IAM バインディングとプリンシパルであり、Access Context Manager レベル自体は作成しません。",
        ],
      },
      {
        id: "faq-owned-teardown",
        category: "運用・クリーンアップ",
        question: "デプロイで作成したリソースを安全に削除するにはどうすればよいですか？",
        answer:
          "デプロイ管理画面の「削除」タブからTeardownを実行します。そのrunが所有すると記録されたリソースだけを依存関係の逆順で削除します。共有 IAM／Chrome Policy の変更前状態は、現在値がそのrunの記録済みmanaged-after状態と安全に一致する場合だけ復元し、ドリフトや送信結果不明の変更は保持して手動照合します。",
        checklist: [
          "削除タブに表示される所有・復元・保持リソースを確認し、画面の確認文を正確に入力します。",
          "確認後に、そのrunに紐づくTeardownだけを実行します。",
        ],
      },
      {
        id: "faq-existing-default-gateway",
        category: "ゼロトラスト・アクセス制御",
        question: "プロジェクトに既存の BeyondCorp Security Gateway が存在する場合、上書きされたり削除されたりしませんか？",
        answer:
          "いいえ。すでに `default` ゲートウェイが存在する場合、本ツールはそれを変更せずそのまま再利用し、今回の PoC 用の Application とテスト用 VM だけを追加します。既存ゲートウェイは所有リソースとして記録されないため、Teardown を実行しても削除されません。",
        checklist: [
          "ステップ 6 の事前検証で既存の `default` ゲートウェイが検出された場合は再利用として扱われます。",
          "同じ Application ID または VM 名がすでに存在する場合は、別の ID や名前に変更することで競合を回避できます。",
        ],
      },
    ],
  },
  cepDeployer: {
    title: "Chrome Enterprise Premium 向け Easy PoC",
    subtitle: "CEPの評価用ベースラインをパイロットOUまたはグループに適用します。",
    intro:
      "脅威対策・コンテンツ検査・データ境界のポリシーをパイロット対象に適用します。削除候補の確認は読み取り専用で動作します。",
    targetOuCardTitle: "1. 対象の組織部門",
    targetOuCardSubtitle:
      "非本番のパイロットOUを選択します。ルートOUへの適用はブロックされます。",
    targetScopeCardTitle: "1. 対象のスコープ",
    targetScopeCardSubtitle:
      "組織部門またはGoogleグループを選択します。グループ指定ならユーザーのOU移動が不要です。",
    targetTypeOu: "組織部門 · OU",
    targetTypeGroup: "Google グループ",
    selectTargetGroup: "対象の Google グループ",
    selectTargetGroupPlaceholder: "Google グループを選択または直接入力",
    refreshGroups: "↻ グループを再読込",
    targetGroupImpact:
      "選択したGoogleグループのメンバーに直接ポリシーとDLPルールを適用します。ユーザーのOU移動は不要です。",
    targetGroupConfirmationLabel: "確認のため、対象グループのメールアドレスを入力",
    targetGroupConfirmationHint:
      "誤適用防止のため、上に表示されたグループのメールアドレスを入力してください。",
    copyTargetGroupEmail: "グループアドレスを入力",
    groupLoadFailed: "グループ一覧を取得できませんでした。メールアドレスを直接入力できます。",
    customGroupInputPlaceholder: "例: poc-security@yourdomain.com",
    orEnterGroupEmail: "またはグループのアドレスを直接入力:",
    selectTargetOu: "対象の組織部門",
    selectTargetOuPlaceholder: "ルート以外のパイロット OU を選択",
    rootOuUnavailable: "ルート — 使用不可",
    targetOuImpact:
      "ChromeポリシーとDLPルールは選択OUと配下OUに継承されます。ライセンス割り当ては選択OU直下のユーザーだけが対象で、配下OUは除外します。",
    targetOuConfirmationLabel: "確認のため、対象の OU パスを入力",
    targetOuConfirmationHint:
      "誤適用防止のため、上に表示された対象OUパスを入力してください。",
    ouLoadFailed:
      "組織部門を取得できませんでした。ヘッダーからWorkspace接続を確認してください。",
    canonicalCustomerIdRequired:
      "先にWorkspace接続を確認してください。DLPルール作成にはCで始まる顧客IDが必要です。",
    autoDetectCustomerIdBtn: "顧客 ID を自動取得して読み込む",
    autoDetectingCustomerIdBtn: "顧客 ID を自動取得中…",
    googleAccountVerifiedBanner: (customerId, ouCount, groupCount) =>
      `Google アカウント認証完了 · 顧客 ID: ${customerId} · OU: ${ouCount} 件 · グループ: ${groupCount} 件`,
    dlpMatrixCustomizePrefix: "",
    dlpMatrixCustomizeMiddle: " の詳細設定は「",
    dlpMatrixCustomizeSuffix: "」タブで変更できます",
    verifyGoogleAccount: "Google アカウントを認証して組織とグループを読み込む",
    verifyingGoogleAccount: "組織とグループを取得中…",
    verifyGoogleAccountHint: "Google OAuthで組織部門とGoogleグループを一覧取得します。",
    retry: "再試行",
    refreshOus: "↻ OUを再読込",
    reloading: "再読込中…",
    createPilotOuLabel: "検証用の子 OU をルート / 直下にワンクリック作成:",
    createPilotOuPlaceholder: "CEP-PoC",
    createPilotOuBtn: "＋ 検証用 OU を作成して選択",
    creatingPilotOuBtn: "検証用 OU を作成中…",
    createPilotOuHint:
      "ルート / 直下に検証用子OUを作成または再利用して選択します。作成後、admin.google.com の［ディレクトリ］>［ユーザー］でテストユーザーを移動してください。",
    pilotOuCreatedBanner: (path) =>
      `検証用 OU「${path}」を選択しました。admin.google.com の［ディレクトリ］>［ユーザー］でテストユーザーを移動してください。`,
    autoCreateSubOus: "サブ OU「CEP Users」「CEP Browsers」を作成する",
    autoCreateSubOusHint:
      "選択したパイロットOU配下に整理用の子OUを作成します。ポリシーは子OUにも継承されます。",
    presetsTitle: "2. プリセット",
    presetsSubtitle: "評価パターンの出発点を選択し、下のモジュールで調整します。",
    presetFullPoc: "フル評価",
    presetFullPocDesc:
      "脅威対策、コンテンツ検査、レポート、端末シグナル、貼り付け検査、個人アカウントのブロックを一括で有効化します。",
    presetAiProtection: "生成 AI とデータ漏えい対策",
    presetAiProtectionDesc:
      "外部AIツールへの貼り付け・アップロード検査と、個人Googleアカウントのブロックを有効化します。",
    presetPersonalAccount: "個人アカウントのブロック",
    presetPersonalAccountDesc:
      "AllowedDomainsForApps、RestrictAccountsToPatterns、RestrictSigninToPattern、BrowserSignin、ゲスト・シークレットモード禁止を一括設定します。",
    presetEndpoint: "端末ハードニング",
    presetEndpointDesc:
      "強化セーフブラウジング、リアルタイムURL検査、Endpoint Verification、アクセス制御、個人アカウントのブロックを有効化します。",
    presetAudit: "可視化・警告",
    presetAuditDesc: "レポートと警告のみのDLPルールを適用し、遮断は行いません。",
    modulesTitle: "3. ポリシーモジュール",
    modulesSubtitle:
      "モジュール単位で個別に適用します。",
    moduleCorePolicies: "Chrome コアセキュリティポリシー",
    moduleCorePoliciesDesc:
      "強化セーフブラウジング、パスワード使い回し警告、クラウドレポートを有効化します。",
    moduleForceExtensions: "Endpoint Verification の強制インストール",
    moduleForceExtensionsDesc:
      "Endpoint Verification拡張機能を自動配信し、端末状態を収集します。",
    moduleConnectors: "コンテンツ検査コネクタ",
    moduleConnectorsDesc:
      "リアルタイムURL検査、ファイルのアップロード・ダウンロード検査、イベント送信を有効化します。",
    accessLevelTitle: "コンテキストアウェアアクセスレベル",
    accessLevelSelectPrompt: "適用するアクセスレベルを選択",
    accessLevelHint:
      "未管理端末向けのDLPルールやGateway制御に適用するアクセスレベルを選択します。不要な場合は「なし」を選択します。",
    accessLevelNone: "なし",
    accessLevelNoneDesc: "アクセスレベルによる制限を行いません。",
    accessLevelAutoProfile: "新規作成: 管理対象 Chrome プロファイル",
    accessLevelAutoBrowser: "新規作成: 管理対象 Chrome ブラウザ",
    accessLevelAutoAny: "新規作成: 管理対象のプロファイルまたはブラウザ",
    accessLevelAutoCorpOwned: "新規作成: 会社所有端末 · PC / Android / iOS",
    accessLevelAutoByod: "新規作成: 私物 BYOD 端末 · 社有以外",
    accessLevelAutoAndroidByod: "新規作成: Android BYOD 端末 · 私物 Android",
    accessLevelAutoIosByod: "新規作成: iPhone / iOS BYOD 端末 · 私物 iOS",
    accessLevelExistingGroup: "既存のアクセスレベル",
    accessLevelLoadFailed:
      "既存のアクセスレベルを取得できませんでした。Access Context Managerが有効な組織配下のGCPプロジェクトが必要です。",
    moduleDlpDetectors: "社内サイト用の DLP 検出器",
    moduleDlpDetectorsDesc:
      "利用できません。settings/detector.url_list は Policy API で未対応です。",
    moduleDlpRules: "DLP ルール一式",
    moduleDlpRulesDesc:
      "機密データ送信の警告・遮断ルールと、社内サイトへの透かし・画面キャプチャ制限ルールを作成します。",
    betaBadge: "ベータ",
    dlpBetaNote:
      "Cloud Identity Policy API を使用して DLP ルールを作成します。",
    dlpRegionTitle: "検出対象とする個人番号の国・地域",
    dlpRegionHint:
      "個人番号ルールで使用する Cloud DLP 検出器の国を選択します。",
    dlpRulesTableTitle: "ルールごとの動作",
    dlpRulesTableHint:
      "各ルールの動作を「監査のみ」「警告」「ブロック」「オフ」から選択します。",
    dlpActionOff: "作成しない",
    dlpActionAudit: "監査のみ",
    dlpActionWarn: "警告して許可",
    dlpActionBlock: "ブロック",
    dlpRuleNationalId: "ページへの個人番号の貼り付け",
    dlpRulePaymentCard: "アップロードに含まれるカード番号",
    dlpRuleAccessLevel: "管理対象外 Chrome からのアップロード",
    dlpRuleWatermark: "社内ページへの電子透かし",
    dlpNoticeByodTitle: "BYOD・会社所有・OS別のコンテキストアウェアDLP連動",
    dlpNoticeByodDesc: "各ルールの端末区分で BYOD のみ・会社所有のみ・Android / iOS BYOD を選ぶと、Access Context Manager の CEL 条件を自動作成・適用して端末・OS ごとに DLP アクションを出し分けます。",
    activePresetBadge: "選択中",
    dataBoundaryModeTitle: "データ境界",
    dataBoundaryModeCopyPaste: "貼り付け内容を検査する ＋ 個人アカウントをブロック",
    dataBoundaryModeCopyPasteDesc:
      "貼り付けテキストを検査し、AllowedDomainsForApps、RestrictAccountsToPatterns、RestrictSigninToPattern、BrowserSignin、ゲスト・シークレットモード禁止を設定します。",
    dataBoundaryModeBlockNonCorp: "個人・非社用の Google アカウントを遮断する",
    dataBoundaryModeBlockNonCorpDesc:
      "AllowedDomainsForApps、RestrictAccountsToPatterns、RestrictSigninToPattern、BrowserSignin、ゲスト・シークレットモード禁止を一括設定します。",
    dataBoundaryModeNone: "なし",
    dataBoundaryModeNoneDesc:
      "親OUの設定をそのまま継承します。",
    httpHeadersTitle: "SaaS テナント制限・カスタム HTTP ヘッダー",
    httpHeadersSubtitle:
      "指定URLへの通信にHTTPヘッダーを付与し、SaaSへのログインを自社テナントのみに制限します。",
    httpHeadersPresetLabel: "SaaS プリセットを追加:",
    httpHeadersAddCustomBtn: "+ カスタムルールを追加",
    httpHeadersEmptyHint:
      "上のSaaSプリセットを選択すると、テナント制限ルールを追加できます。",
    httpHeadersRemoveRuleBtn: "削除",
    httpHeadersPatternsLabel: "対象 URL パターン",
    httpHeadersTenantValueLabel: "許可する自社テナント / ワークスペース / Enterprise ID",
    httpHeadersNameLabel: "ヘッダー名",
    httpHeadersValueLabel: "ヘッダー値",
    httpHeadersBoxNote:
      "Boxは主に企業専用URLとIdP条件付きアクセスでテナント境界を制御します。",
    httpHeadersM365ContextLabel: "ディレクトリ GUID · Restrict-Access-Context 用",
    internalUrlsTitle: "社内機密サイト・透かし保護対象 URL",
    internalUrlsPlaceholder: "https://intranet.example.com\nhttps://portal.corp.example.com",
    internalUrlsHint:
      "登録したURLの表示時に電子透かしを重ね、画面キャプチャを遮断します。1行に1件入力してください。",
    rolesCardTitle: "4. Workspace 管理者権限",
    rolesCardSubtitle:
      "Workspaceの管理者ロールを割り当てます。GCPのIAMロールではChromeポリシー権限を付与できません。",
    roleAdminLabel: "ポリシー実施者",
    roleAdminDesc:
      "Chrome設定とOU権限を持つ管理コンソールロールです。DLPルール変更には特権管理者が必要です。",
    roleAuditorLabel: "読み取り専用の確認者",
    roleAuditorDesc:
      "ChromeとOUの読み取り権限だけを持つ確認用ロールです。",
    roleAssigneeEmailLabel: "割り当て先管理者メールアドレス · 任意",
    roleAssigneeEmailPlaceholder: "admin@example.com",
    roleAssigneeEmailHint: "空欄の場合はロール作成のみ行います。",
    roleTypeSelectLabel: "対象ロール",
    roleTypeBoth: "両方 · ポリシー実施者 ＋ 監査担当者",
    roleTypeAdminOnly: "ポリシー実施者のみ",
    roleTypeAuditorOnly: "監査担当者のみ",
    roleScopeOuCheckbox: "選択中の組織部門にスコープを限定する",
    roleCreateAssignBtn: "Workspace 管理者ロールを作成・アサイン",
    roleCreatingBtn: "ロール作成・アサイン中...",
    rolesAdminConsoleLink: "Google 管理コンソールの管理者ロールを開く",
    rolesVerificationNote:
      "ロール割り当て後に組織情報の再取得を実行してください。",
    rolesScopeManualChecklistTitle:
      "Google 管理コンソールでの手動設定手順",
    rolesScopeManualChecklistDesc:
      "APIで403が返る場合は、Google管理コンソールの［アカウント］>［管理者ロール］で以下を付与してください。",
    rolesScopeManualSteps: [
      "ポリシー実施者: ［サービス］>［Chrome 管理］>［設定］と［Admin API 権限］>［組織部門］を対象OUに付与します。",
      "読み取り専用の確認者: ［Chrome 管理］>［設定の読み取り］と［監査ログ］を有効化します。",
      "Cloud Identity DLP ルール: 特権管理者アカウントを使用します。",
    ],
    testingScenariosTitle: "5. 結果を確認する",
    testingScenariosSubtitle:
      "実データを使わずにDLP動作を確認できるテスト用ダミー値です。",
    copyDummyData: "コピー",
    copiedToClipboard: "コピーしました",
    dummyPiiLabel: "サンプルの個人番号",
    dummyPiiValue: "1234-5678-9012",
    dummyPiiHint: "マイナンバー／SSN形式のダミー値です。",
    dummyCreditCardLabel: "サンプルのカード番号",
    dummyCreditCardValue: "4532015112830366",
    dummyCreditCardHint: "Luhnチェックを通るVisaテスト番号です。",
    dummySourceCodeLabel: "サンプルの API キー入りソースコード",
    dummySourceCodeValue:
      "const GCP_SECRET_KEY = 'AIzaSyA_DEMO_CONFIDENTIAL_KEY_FOR_TESTING';",
    dummySourceCodeHint: "APIキー形式のダミー文字列です。",
    scenarioGenAiTitle: "貼り付け検査",
    scenarioGenAiStep:
      "外部AIツールにサンプルAPIキーを貼り付け、検査・警告動作を確認します。",
    scenarioDataBoundaryTitle: "データ境界",
    scenarioDataBoundaryStep:
      "管理対象プロファイルで個人Googleアカウントへのログインが遮断されることを確認します。",
    scenarioWatermarkTitle: "アップロード検査",
    scenarioWatermarkStep:
      "サンプルカード番号を含むファイルをアップロードし、検査とログ記録を確認します。",
    manualChecklistTitle: "管理コンソールでの手動設定項目",
    manualChecklistSubtitle:
      "API非対応のため、動作テスト前にGoogle管理コンソールで設定してください。",
    manualChecklistItems: [
      {
        title: "機密コンテンツの保存を有効化",
        detail: "セキュリティ › アクセスとデータ管理 › データ保護",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "光学文字認識 · OCR を有効化",
        detail: "画像内のテキスト検出に使用します。",
        href: "https://admin.google.com/ac/dp",
      },
      {
        title: "CEP ライセンスの自動割り当てを有効化",
        detail: "お支払い › ライセンス設定でパイロットOUに設定します。",
        href: "https://admin.google.com/ac/billing/licensesettings",
      },
    ],
    btnDeploy: "対象 OU に適用",
    btnDeploying: "適用中...",
    btnRollback: "DLPルールをロールバック・削除候補を確認",
    btnRollingBack: "DLPルールをロールバック中...",
    btnDownloadScript: "Chrome ポリシーを Python で出力",
    confirmRollback:
      "選択した対象スコープのCEP PoC DLPルールを削除し、Chrome PolicyとAccess Levelの削除候補を確認します。続行しますか？",
    downloadFailed: "スクリプトを生成できませんでした",
    noModulesSelected: "ポリシーモジュールを 1 つ以上選択してください。",
    appliedTitle: "適用した設定",
    skippedTitle: "スキップした設定",
    statusLogTitle: "実行トレース",
    noActionYet: "対象スコープとモジュールを選択して適用してください。",

    licenseCardTitle: "ライセンス管理と自動割り当て制御",
    licenseCardSubtitle:
      "対象OUのユーザーにのみCEPライセンスを割り当てます。",
    licensePilotLimitNotice:
      "選択した非ルートOU直下のユーザーだけを対象とし、最大10名、配下OUは除外します。4ページ以内で全件列挙できない場合や5秒の期限を超過した場合は変更しません。POST応答が失われた場合はGETで照合して結果を確認します。",
    licenseAutoAssignWarning:
      "全社への意図しない消費を防ぐため、ルートOUではCEPの自動割り当てをオフにしてください。",
    licenseAutoAssignWarningLink: "Google 管理コンソールのライセンス設定を開く",
    licenseAutoAssignSteps: [
      "1. 管理コンソールの［お支払い］>［ライセンス設定］でルートOUを選択します。",
      "2. Chrome Enterprise Premium の自動割り当てをオフにします。",
      "3. パイロットOUのみオンにするか、下のボタンから直接割り当てます。",
    ],
    btnAssignLicensesToOu: "CEPライセンスを割り当て · OU直下最大10名",
    copyTargetOuPath: "このパスを自動入力",
    tabSetup: "1. セットアップ",
    tabLicensing: "2. ユーザー & ライセンス",
    tabDlp: "3. DLP & 脅威対策",
    tabOperations: "4. 運用 & 検証",
    tabAll: "すべて表示",
    btnAssigningLicenses: "ライセンスを割り当て中...",
    licenseAssignUsersFound: "OU 内のユーザーを処理しました",
    noUsersFoundInOu: "選択された組織部門内にユーザーは見つかりませんでした。",

    dlpMatrixTitle: "DLP コントロール マトリクス",
    dlpMatrixSubtitle:
      "対象スコープ内の端末に対し、会社所有 / BYOD や PC / Android / iPhone の構成に合わせてアップロード・ダウンロード・貼り付け・印刷・透かしの動作を設定します。",
    dlpEnvBuilderTitle: "自社環境の端末・OS構成セレクター",
    dlpEnvBuilderSubtitle:
      "社内に存在する端末とOSのチェックを入れるだけで、会社所有とBYOD・Android・iPhoneの分離ルールを自動構成できます。",
    dlpEnvCorpPc: "会社所有 PC · Windows / Mac / ChromeOS",
    dlpEnvByodPc: "PC BYOD · 私物 Windows / Mac",
    dlpEnvCorpAndroid: "会社所有 Android · 社用スマホ・タブレット",
    dlpEnvCorpIos: "会社所有 iPhone / iPad · 社用 iOS",
    dlpEnvByodAndroid: "Android BYOD · 私物 Android",
    dlpEnvByodIos: "iPhone / iOS BYOD · 私物 iPhone・iPad",
    dlpEnvApplyBtn: "選択した端末・OS構成に合わせてDLPマトリクスを自動設定",
    dlpEnvSummaryNotice:
      "各行の右端の「対象スコープ内の端末」プルダウンから、全端末・BYODのみ・会社所有のみ・PC BYODのみ・モバイルBYODのみ・Android BYODのみ・iPhone BYODのみを個別に変更できます。",
    dlpColThreat: "データ・脅威種別",
    dlpColUpload: "アップロード",
    dlpColDownload: "ダウンロード",
    dlpColPaste: "貼り付け",
    dlpColPrint: "印刷",
    dlpColWatermark: "画面透かし",
    dlpColDeviceScope: "対象スコープ内の端末",

    dlpRowUniversalUpload: "すべてのファイルアップロード",
    dlpRowUniversalUploadDesc: "Chromeからの全ファイルアップロードを制御します。",
    dlpRowUniversalDownload: "すべてのファイルダウンロード",
    dlpRowUniversalDownloadDesc: "Chromeでの全ファイルダウンロードを制御します。",
    dlpRowPaymentCard: "クレジットカード・金融情報",
    dlpRowPaymentCardDesc: "アップロード・貼り付け・印刷時のカード番号を検知します。",
    dlpRowNationalId: "マイナンバー・個人識別情報",
    dlpRowNationalIdDesc: "マイナンバーやSSNなどの個人番号送信を検知します。",
    dlpRowAccessLevel: "未管理・BYOD端末からの操作一括制御",
    dlpRowAccessLevelDesc: "会社所有以外のBYODや未管理端末からのアップロード・ダウンロード・貼り付け・印刷を制御します。",
    dlpRowAndroidByod: "Android BYOD · 私物 Android からの操作制御",
    dlpRowAndroidByodDesc: "私物Android端末からのファイル転送・貼り付け・印刷を個別に制限します。",
    dlpRowIosByod: "iPhone / iOS BYOD · 私物 iPhone からの操作制御",
    dlpRowIosByodDesc: "私物iPhone / iPadからのファイル転送・貼り付け・印刷を個別に制限します。",
    dlpRowWatermark: "社内機密サイト保護・透かし",
    dlpRowWatermarkDesc: "登録した社内サイトに動的透かしを表示し、画面キャプチャを制限します。",
    dlpRowGenAiBlock: "未承認の生成AI利用ブロック · Geminiのみ許可",
    dlpRowGenAiBlockDesc: "未承認の外部AIサイトを遮断し、社内Geminiのみ利用を許可します。",

    dlpScopeAll: "対象内の全端末",
    dlpScopeByodOnly: "アクセスレベル連動",
    dlpScopeSelectByodOnly: "BYOD・未管理端末のみ",
    dlpScopeSelectCorpOnly: "会社所有・管理端末のみ",
    dlpScopeSelectDesktopByod: "PC BYOD のみ · Win/Mac",
    dlpScopeSelectMobileByod: "モバイル BYOD のみ · Android/iOS",
    dlpScopeSelectAndroidByod: "Android BYOD のみ",
    dlpScopeSelectIosByod: "iPhone / iOS BYOD のみ",
    dlpScopeSelectAndroidAll: "すべての Android 端末",
    dlpScopeSelectIosAll: "すべての iPhone / iOS 端末",
    dlpActionBadgeBlock: "ブロック",
    dlpActionBadgeWarn: "警告",
    dlpActionBadgeAudit: "未対応",
    dlpActionBadgeAuditOnly: "監査のみ",
    dlpActionBadgeOff: "オフ",

    dlpActionParamsTitle: "追加アクション パラメータ",
    dlpActionParamsSubtitle: "DLPルール発動時の表示メッセージと証拠保存設定",
    dlpCustomMessageLabel: "エンドユーザー向けカスタムメッセージ",
    dlpCustomMessagePlaceholder: "例: 社内規定によりこの操作は制限されています。",
    dlpCustomMessageHint: "警告またはブロック時にChrome上に表示するメッセージです。",
    dlpSaveContentLabel: "検出されたコンテンツの証拠保存",
    dlpSaveContentHint: "監査のため、検知した機密コンテンツのコピーを保存します。",

    dlpPresetRecommended: "標準構成",
    dlpPresetRecommendedDesc: "機密データ送信時に警告を表示し、未承認AIの遮断と社内サイトへの透かしを適用します。",
    dlpPresetStrictZeroTrust: "厳格なゼロトラスト",
    dlpPresetStrictZeroTrustDesc: "機密データのアップロードと貼り付けをブロックします。",
    dlpPresetByodMobile: "BYOD・モバイル分離",
    dlpPresetGenAiSecure: "生成AIセキュア活用",
    dlpPresetGenAiSecureDesc: "未承認AIを遮断し、貼り付け検査付きでGeminiの利用を許可します。",
    dlpPresetAuditOnly: "警告ファースト",
    dlpPresetAuditOnlyDesc: "選択した全操作に警告アクションを設定します。",
    geminiEnterpriseTitle: "Gemini Enterprise & Vertex AI Search ゼロトラスト保護",
    geminiEnterpriseSubtitle:
      "Chrome・アイデンティティ・Google Cloud境界の3層で生成AIと社内検索を保護します。",
    geminiLayer1Title: "1. Chrome エンドポイント & DLP 保護",
    geminiLayer1Desc:
      "生成AIアプリへのプロンプト入力とダウンロードを検査します。",
    geminiLayer1Bullet1:
      "個人情報、APIキー、機密コードの貼り付け・アップロードを遮断または警告します。",
    geminiLayer1Bullet2:
      "検索結果や生成レポートの表示・ダウンロード時に電子透かしを適用します。",
    geminiLayer2Title: "2. コンテキストアウェア アクセス",
    geminiLayer2Desc:
      "管理対象ブラウザや社内ネットワークからのみアクセスを許可します。",
    geminiLayer2Bullet1:
      "管理対象Chromeブラウザまたは社内IPアドレスを条件に設定します。",
    geminiLayer2Bullet2:
      "Google WorkspaceのCAA設定でGeminiアプリを保護します。",
    geminiLayer3Title: "3. VPC Service Controls & Agent Gateway",
    geminiLayer3Desc:
      "API境界でDiscovery Engineを隔離・保護します。",
    geminiLayer3Bullet1:
      "VPC Service Controls境界内で discoveryengine.googleapis.com を保護します。",
    geminiLayer3Bullet2:
      "エージェント間通信にmTLSとDPoPトークンバインディングを適用します。",
    geminiCliTitle: "VPC-SC 境界 & ACM アクセスレベル設定コマンド",
    geminiCliCopyBtn: "コマンドをコピー",
    dlpPresetGeminiEnterprise: "Gemini Enterprise 保護",
    geminiAutoProvisionTitle: "Gemini Enterprise ゼロトラスト境界のプロビジョニング",
    geminiAutoProvisionSubtitle:
      "ACMアクセスレベルとVPC Service Controls境界を作成・適用します。",
    geminiTargetProjectLabel: "対象 Google Cloud プロジェクト ID",
    geminiPolicyIdLabel: "Access Context Manager ポリシー ID · 空欄時は自動検出",
    geminiPerimeterNameLabel: "VPC-SC 境界識別名",
    geminiEnforceAccessLevelLabel: "管理対象 Chrome を必須化する ACM アクセスレベルを作成・バインド",
    geminiAccessLevelSelectLabel: "適用する ACM アクセスレベル",
    geminiAccessLevelDefaultOption: "新規作成: secgw_chrome_managed",
    geminiAccessLevelSelectHint: "既存レベルを選択するか、管理対象Chrome専用レベルを新規作成します。",
    geminiEnforcePerimeterLabel: "discoveryengine.googleapis.com を保護する VPC-SC 境界を作成",
    geminiDryRunLabel: "ドライランモードで作成 · 遮断せず Cloud Logging に記録",
    geminiAutoProvisionBtn: "ゼロトラスト境界を作成・適用",
    geminiAutoProvisioningBtn: "プロビジョニング中...",
    geminiSuccessTitle: "ゼロトラスト境界の自動作成が完了しました",
    geminiStep1: "1. Google Cloud プロジェクト & Access Policy 解決",
    geminiStep2: "2. ACM アクセスレベル作成",
    geminiStep3: "3. VPC-SC サービス境界作成",
    geminiStep4: "4. ゼロトラスト環境検証 & 完了",
    geminiStep5Rca: "5. Restricted Client Applications アクセスバインディング作成",
    geminiAdminLockoutWarningTitle: "注意: Google Cloud コンソール管理者のアクセス要件",
    geminiAdminLockoutWarningText:
      "discoveryengine.googleapis.com にVPC-SCを適用すると、GCP管理者も管理対象Chromeからの接続が必要になります。未管理端末での403エラーを避けるには、Approach 2のグループ限定バインドまたはIngress例外を併用してください。",
    geminiEnforceRcaLabel: "Approach 2: Restricted Client Applications をグループにバインドする",
    geminiRcaGroupKeyLabel: "対象 Google グループのメールアドレスまたは ID",
    geminiRcaGroupKeyPlaceholder: "例: gemini-users@example.com",
    geminiRcaGroupKeyHint:
      "指定したグループのみにGemini Enterpriseのアクセスレベルを適用します。",
    geminiRcaBindingLabel: "RCA Cloud Binding",
    geminiRcaCliTitle: "RCA gcloud コマンドスニペット",
    geminiRcaCliCopyBtn: "RCA コマンドをコピー",

    deployProgressTitle: "Chrome Enterprise Premium デプロイ進行中...",
    deployStep1: "1. 対象スコープの検証",
    deployStep2: "2. ポリシー設定の生成",
    deployStep3: "3. DLP ルールの登録",
    deployStep4: "4. 完了 & 証跡の記録",

    rollbackProgressTitle: "DLPルールをロールバック・削除候補を確認中...",
    rollbackStep1: "1. 対象リソースの特定",
    rollbackStep2: "2. OU ポリシーの確認",
    rollbackStep3: "3. CEP PoC DLP ルールの削除 & レベルの確認",
    rollbackStep4: "4. ロールバック・確認完了",

    roleProgressTitle: "Workspace 管理者ロールを作成・アサイン中...",
    roleStep1: "1. ディレクトリ権限の確認",
    roleStep2: "2. 運用・監査ロールの作成",
    roleStep3: "3. 対象管理者へのアサイン",
    roleStep4: "4. 権限設定完了",

    licenseProgressTitle: "試用ライセンスを割り当て中...",
    licenseStep1: "1. 対象 OU ユーザーの取得",
    licenseStep2: "2. CEP ライセンスの割り当て",
    licenseStep3: "3. ライセンス適用完了",
    errDiagIamTitle: "Google Cloud IAM 権限不足",
    errDiagIamCause: "現在のアカウントに roles/accesscontextmanager.policyAdmin などの組織権限がありません。",
    errDiagIamRemediation: "組織管理者に roles/accesscontextmanager.policyAdmin の付与を依頼するか、以下のコマンドを実行してください。",
    errDiagIamConsoleLink: "Google Cloud IAM コンソールを開く",
    errDiagWorkspaceTitle: "Google Workspace 特権管理者権限が必要",
    errDiagWorkspaceCause: "サインイン中のアカウントに特権管理者権限またはAdmin SDKアクセス権がありません。",
    errDiagWorkspaceRemediation: "特権管理者アカウントでサインインし直すか、管理コンソールでAdmin SDKを有効化してください。",
    errDiagWorkspaceConsoleLink: "Workspace 管理ロール画面を開く",
    errDiagVpcScConflictTitle: "VPC Service Controls 境界の競合",
    errDiagVpcScConflictCause: "対象プロジェクトが既に別のVPC-SC境界に属しているか、同名の境界が存在します。",
    errDiagVpcScConflictRemediation: "別の検証用プロジェクトを指定するか、既存境界に Discovery Engine API を追加してください。",
    errDiagVpcScConsoleLink: "VPC Service Controls コンソールを開く",
    errDiagOuConfirmTitle: "対象スコープの一致確認エラー",
    errDiagOuConfirmCause: "確認入力欄の文字列が選択中のOUパスまたはグループアドレスと一致していません。",
    errDiagOuConfirmRemediation: "画面に表示されているパスまたはメールアドレスをそのまま入力してください。",
    errDiagRateLimitTitle: "Google Cloud API レート制限 · 429",
    errDiagRateLimitCause: "APIリクエスト頻度が上限を超過しました。",
    errDiagRateLimitRemediation: "10〜30秒待ってから［操作を再試行］を押してください。",
    errDiagWorkerTitle: "拡張機能バックグラウンドワーカーの一時休止",
    errDiagWorkerCause: "Service Workerが一時休止したか、拡張機能が再読み込みされました。",
    errDiagWorkerRemediation: "下の［操作を再試行］を押すか、ページを再読み込みしてください。",
    errDiagProjectNoOrgTitle: "Google Cloud プロジェクトが組織に未所属",
    errDiagProjectNoOrgCause: "Access Context ManagerとVPC-SCには組織配下のプロジェクトが必要です。",
    errDiagProjectNoOrgRemediation: "企業組織配下のGCPプロジェクトを選択してください。",
    errDiagPolicyNotFoundTitle: "Access Context Manager ポリシー未検出",
    errDiagPolicyNotFoundCause: "組織内にAccess Policyが存在しないか、ポリシーIDを取得できませんでした。",
    errDiagPolicyNotFoundRemediation: "コンソールでAccess Policyを作成するか、ポリシーIDを手動入力してください。",
    errDiagPolicyConsoleLink: "Access Context Manager コンソールを開く",
    errDiagOuStaleTitle: "対象組織部門が見つかりません",
    errDiagOuStaleCause: "選択したOUが削除または移動されました。",
    errDiagOuStaleRemediation: "［↻ OUを再読込］を押して対象OUを選び直してください。",
    errDiagRootOuForbiddenTitle: "ルート組織部門への適用はブロックされています",
    errDiagRootOuForbiddenCause: "最上位のルートOU / への直接適用は全ユーザーに影響するためブロックされています。",
    errDiagRootOuForbiddenRemediation: "検証用の子OUまたはGoogleグループを選択してください。",
    errDiagScopeInvalidTitle: "無効な Workspace 顧客 ID または対象スコープ",
    errDiagScopeInvalidCause: "有効な顧客IDまたは対象スコープが指定されていません。",
    errDiagScopeInvalidRemediation: "Workspace接続を確認し、対象OUまたはグループを選択してください。",
    errDiagProjectRequiredTitle: "Google Cloud プロジェクト ID が未指定です",
    errDiagProjectRequiredCause: "ACM、VPC-SC、IAM操作にはGoogle CloudプロジェクトIDが必要です。",
    errDiagProjectRequiredRemediation: "有効なGoogle CloudプロジェクトIDを入力してください。",
    errDiagGeminiTitle: "Gemini Enterprise へのアクセスが拒否されました",
    errDiagGeminiCause:
      "現在のブラウザが管理対象Chromeではないため、ACMまたはVPC-SCにより遮断されました。",
    errDiagGeminiRemediation:
      "管理対象Chromeから接続するか、Approach 2のグループ限定バインドを設定してください。",
    errDiagGeminiConsoleLink: "Vertex AI Search コンソールを開く",
    geminiConfirmProjectLabel: "プロジェクト ID の確認入力",
    geminiConfirmProjectHint: "厳格モードで境界を適用するため、対象プロジェクトIDを再入力してください。",
    geminiConfirmProjectMismatch: "対象プロジェクトIDを正確に入力してください。",
    errDiagGenericTitle: "処理中にエラーが発生しました",
    errDiagGenericCause: "実行中に予期しないエラーが返されました。",
    errDiagGenericRemediation: "下の技術詳細とAPIの有効化状況を確認してください。",
    errDiagCauseLabel: "発生原因:",
    errDiagRemediationLabel: "修復手順:",
    errDiagCommandHeader: "修復用コマンド:",
    errDiagRetryBtn: "操作を再試行",
    errDiagRawDetails: "技術詳細ログ",

    assessOpenBtn: "セキュリティ要件・ポリシー構成ウィザード",
    assessModalTitle: "セキュリティ要件・ポリシー構成ウィザード",
    assessModalSubtitle: "セキュリティ課題を選択すると、対応するCEPポリシーとDLPマトリクスを自動設定します。",
    assessPresetLabel: "クイック一括選択",
    assessPresetGenAi: "生成AI安全活用 & 漏洩防止",
    assessPresetCost: "脱VDI・脱CASB コスト最適化",
    assessPresetRemote: "リモートワーク・BYOD対策",
    assessPresetAll: "全項目を選択",
    assessPresetClear: "クリア",
    assessGroupGenAi: "生成AI & クラウドデータ保護",
    assessGroupPosture: "端末ポスチャ & リモートアクセス",
    assessGroupSaas: "SaaS保護 & ゼロトラスト移行",
    assessGroupCost: "コスト削減 & エージェント軽量化",
    assessQ1Title: "生成AIや外部Webへの機密コピペ・プロンプト漏洩防止",
    assessQ1Risk: "生成AIへのソースコードや顧客情報の貼り付けによる情報流出",
    assessQ1Solution: "Chrome DLPによるクリップボード貼り付けのリアルタイム検査・遮断",
    assessQ2Title: "個人情報・顧客名簿のWebダウンロード・アップロード制限",
    assessQ2Risk: "SaaSから個人情報CSVを私用端末や外部クラウドへ持ち出されるリスク",
    assessQ2Solution: "マイナンバーやカード番号を含むファイルのアップロード・ダウンロード遮断",
    assessQ3Title: "機密画面の印刷制限と画面キャプチャ抑止の電子透かし表示",
    assessQ3Risk: "顧客情報や設計図面の印刷・画面撮影による持ち出しリスク",
    assessQ3Solution: "印刷ブロックとユーザー名・日時の動的電子透かし表示",
    assessQ4Title: "社外ネットワーク・私用端末からのSaaSアクセス制御",
    assessQ4Risk: "未承認PCからのSaaSアクセスによる情報漏洩リスク",
    assessQ4Solution: "Context-Aware Accessによる管理対象Chromeブラウザ限定アクセス",
    assessQ5Title: "OS未更新・ディスク未暗号化端末のアクセス遮断",
    assessQ5Risk: "パッチ未適用端末からの社内システム接続リスク",
    assessQ5Solution: "Endpoint VerificationによるOSバージョン・暗号化・画面ロック確認",
    assessQ6Title: "クライアント証明書による会社支給PCの特定",
    assessQ6Risk: "認証情報漏洩時に第三者端末からログインされるリスク",
    assessQ6Solution: "Chrome証明書ストアと連携したmTLSクライアント証明書検証",
    assessQ7Title: "Google Workspace / M365 / Salesforceへのアクセス認可強化",
    assessQ7Risk: "ID・パスワードのみのログインによるセッション乗っ取りリスク",
    assessQ7Solution: "Chrome EnterpriseとAccess Context Managerによる多層認可",
    assessQ8Title: "海外・不審IPからの不正アクセス遮断",
    assessQ8Risk: "不審なIP範囲からの不正アクセス試行",
    assessQ8Solution: "IP範囲・地域ポリシーに基づくアクセス拒否とアラート発行",
    assessQ9Title: "VPNレスのゼロトラストアクセスへの移行",
    assessQ9Risk: "VPN帯域逼迫とゲートウェイ保守コストの増加",
    assessQ9Solution: "ChromeとSecure GatewayによるVPN不要のゼロトラスト接続",
    assessQ10Title: "不正なブラウザ拡張機能の検知・ブロック",
    assessQ10Risk: "非公認の拡張機能による通信内容やCookieの詐取リスク",
    assessQ10Solution: "拡張機能の許可リスト管理と未承認拡張のブロック",
    assessQ11Title: "セキュリティ監査ログのSIEM / BigQuery連携",
    assessQ11Risk: "事故調査に必要なブラウザ操作ログの不足",
    assessQ11Solution: "URL訪問・DLPイベント・ファイル操作ログのCloud Logging / BigQuery連携",
    assessQ12Title: "ゼロデイ脆弱性パッチの自動配信とバージョン管理",
    assessQ12Risk: "手動更新の遅れによるブラウザ脆弱性の放置",
    assessQ12Solution: "Chrome自動アップデートによる迅速なセキュリティパッチ適用",
    assessQ13Title: "サードパーティCASB / SWGライセンスの見直し",
    assessQ13Risk: "外部CASBやプロキシ製品のライセンス・運用コスト負担",
    assessQ13Solution: "ブラウザ内蔵DLPとアクセス制御による構成の簡素化",
    assessQ14Title: "画面転送VDIのサーバー更新・維持費削減",
    assessQ14Risk: "VDI基盤の更新・維持にかかる高額なインフラ費用",
    assessQ14Solution: "管理対象Chromeによるデータ境界制御でVDI対象業務を縮小",
    assessQ15Title: "複数エンドポイントエージェントによる端末負荷の軽減",
    assessQ15Risk: "複数エージェントの常駐によるPCの動作遅延",
    assessQ15Solution: "追加エージェントなしでChrome単体でのDLP・アクセス制御・監査を実現",
    assessDefaultDlpCustomMessage: "社内セキュリティポリシーにより、機密データの外部送信・貼り付けは制限されています。",
    assessRecHeader: "選定されたポリシー構成",
    assessRecDlpHeader: "DLP マトリクス設定:",
    assessRecModulesHeader: "構成モジュール設定:",
    assessRoiHeader: "期待される効果:",
    assessRoiCostTitle: "ライセンス・インフラ運用の効率化",
    assessRoiCostDesc: "ブラウザ標準機能への集約により、外部CASBやVDIの運用コストを抑えます。",
    assessRoiPerfTitle: "端末エージェントの集約と負荷軽減",
    assessRoiPerfDesc: "常駐エージェントを追加せず、Chrome標準機能で制御を完結します。",
    assessRoiSecurityTitle: "生成AIおよびWebからの情報漏洩抑止",
    assessRoiSecurityDesc: "機密データの送信・ダウンロード・画面キャプチャをポリシーと透かしで制御します。",
    assessApplyRecBtn: "この構成を PoC 設定に反映する",
    assessAppliedBanner: "✓ 選択した要件に基づき、ポリシー構成とDLPマトリクスを反映しました。",
    geminiArchDetailsToggle: "3層セキュリティ境界アーキテクチャ・CLI コマンドを表示",
    assessShowDetails: "リスク・解決策の詳細を表示",
    assessHideDetails: "詳細を折りたたむ",
    projectIdOptionalLabel: "Google Cloud プロジェクト ID · CAA / Gemini ゼロトラスト利用時のみ任意指定",
    projectIdOptionalHint: "Chromeポリシー、DLPルール、ライセンス割り当てはWorkspace顧客IDのみで動作します。Access Context ManagerやVPC-SCを使う場合のみ入力してください。",
    projectIdOptionalPlaceholder: "例: my-gcp-project-id",
    statusLogApiCallCount: (count: number) => `API 呼び出し ${count} 件`,
    assessStatusWatermarkOn: "ON",
    assessStatusEnabled: "✓ 有効",
    assessStatusDisabled: "無効",
    assessStatusAllowlistManaged: "✓ 許可リスト管理",
    assessStatusCloudLogging: "✓ Cloud Logging 連携",
    assessStatusVpcScProtected: "✓ VPC-SC 境界保護",
    assessStatusStandard: "標準",
    assessSelectedCountSuffix: "項目反映",
    dlpRegionJapanLabel: "Japan · マイナンバー / 銀行口座",
    dlpPresetsLabel: "プリセット:",
  },
};

export function getMessages(locale: Locale): Messages {
  return locale === "ja" ? ja : en;
}

