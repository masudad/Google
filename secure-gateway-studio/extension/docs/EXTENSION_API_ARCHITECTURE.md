# Secure Gateway Studio — Chrome Extension Complete API & Architecture Reference

This document provides an exhaustive, end-to-end mapping of all API interactions, service-to-service flows, request schemas, response schemas, and rollback compensation mechanisms across the **Secure Gateway Studio Chrome Extension** (`secure-gateway-studio/extension/`).

---

## 1. High-Level Architecture Diagram

The extension runtime operates as a Chrome Manifest V3 service worker executing in an encrypted sandbox with two distinct authorization channels:
1. **Administrator Identity** (via `chrome.identity.getAuthToken()`): Used for Workspace Directory, Chrome Policy, Cloud Identity DLP, and initial Cloud Deployer bootstrap.
2. **Impersonated Service Account** (via `iamcredentials.googleapis.com`): Restricted project-scoped deployer identity (`secure-gateway-studio-deployer`) used for all Cloud Infrastructure mutations.

```mermaid
flowchart TB
    subgraph BrowserUI ["Chrome Extension Frontend (UI Layer)"]
        UI["Extension Popup / Full Tab React UI"]
        Transport["UI Transport Layer (ui/transport.ts)"]
    end

    subgraph ServiceWorker ["Chrome MV3 Service Worker (Background)"]
        Router["Internal Router (background/router.ts)"]
        EncryptedDB[("Encrypted IndexedDB & AES-256 State")]
        AuthManager["Auth & Token Manager (auth/tokens.ts)"]
        
        subgraph Providers ["Core Engine Providers"]
            Catalog["Catalog Provider (catalog.ts)"]
            Discovery["Discovery Provider (discovery.ts)"]
            Bootstrap["Bootstrap Provider (bootstrap.ts)"]
            Executor["Resource Executor (executor*.ts)"]
            CEP["CEP Provider (cep-provider.ts)"]
            Licensing["License Manager (licensing.ts)"]
            Observability["Observability Provider (observability.ts)"]
            Verifier["Acceptance Verifier (acceptance.ts)"]
        end
    end

    subgraph GoogleApis ["Google Cloud & Google Workspace APIs"]
        OAuth["OAuth2 / Chrome Identity (chrome.identity)"]
        IAMCreds["IAM Credentials API (iamcredentials.googleapis.com)"]
        CRM["Cloud Resource Manager API (cloudresourcemanager.googleapis.com)"]
        ServiceUsage["Service Usage API (serviceusage.googleapis.com)"]
        IAM["IAM API (iam.googleapis.com)"]
        Compute["Compute Engine API (compute.googleapis.com)"]
        DNS["Cloud DNS API (dns.googleapis.com)"]
        BeyondCorp["BeyondCorp Security Gateway API (beyondcorp.googleapis.com)"]
        ACM["Access Context Manager API (accesscontextmanager.googleapis.com)"]
        SecretManager["Secret Manager API (secretmanager.googleapis.com)"]
        PrivateCA["Certificate Authority Service (privateca.googleapis.com)"]
        Logging["Cloud Logging API (logging.googleapis.com)"]
        Directory["Workspace Admin Directory API (admin.googleapis.com)"]
        ChromePolicy["Chrome Policy API (chromepolicy.googleapis.com)"]
        CloudIdentity["Cloud Identity Policy API (cloudidentity.googleapis.com)"]
        EnterpriseLicense["Enterprise License Manager API (licensing.googleapis.com)"]
    end

    UI -->|chrome.runtime.sendMessage| Router
    Router <--> EncryptedDB
    Router --> AuthManager
    AuthManager -->|1. Operator OAuth Token| OAuth
    AuthManager -->|2. Mint Deployer Token| IAMCreds

    Router --> Catalog & Discovery & Bootstrap & Executor & CEP & Licensing & Observability & Verifier

    Catalog --> CRM & ACM & Directory & Compute
    Discovery --> CRM & ServiceUsage & Compute & DNS & BeyondCorp & ACM & ChromePolicy & Directory
    Bootstrap --> IAM & CRM & ACM
    Executor --> Compute & DNS & BeyondCorp & SecretManager & PrivateCA & ChromePolicy & CRM
    CEP --> ChromePolicy & Directory & CloudIdentity & ACM & CRM
    Licensing --> EnterpriseLicense & Directory
    Observability --> Logging
    Verifier --> BeyondCorp & Compute & DNS & ChromePolicy
```

---

## 2. Detailed API Sequence Diagrams

### 2.1. Authentication & Service Account Impersonation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Workspace / Cloud Admin
    participant UI as Extension UI
    participant BG as Service Worker (auth/tokens.ts)
    participant ChromeIdent as chrome.identity
    participant IAMCreds as IAM Credentials API
    participant CRM as Cloud Resource Manager

    Note over Operator,CRM: Phase 1: Administrator Authentication
    Operator->>UI: Click "Sign in with Google" / Verify
    UI->>BG: POST /api/v1/auth/sign-in
    BG->>ChromeIdent: chrome.identity.getAuthToken({ interactive: true })
    ChromeIdent-->>BG: Operator OAuth2 Access Token
    BG->>CRM: GET /v1/projects/{projectId}:testIamPermissions
    CRM-->>BG: Returns caller permissions & verifies token

    Note over Operator,CRM: Phase 2: Deployer Impersonation (Keyless ADC)
    BG->>IAMCreds: POST /v1/projects/-/serviceAccounts/secure-gateway-studio-deployer@{projectId}.iam.gserviceaccount.com:generateAccessToken
    Note right of IAMCreds: Request Body:<br/>{ delegates: [], scope: [...scopes], lifetime: "3600s" }
    IAMCreds-->>BG: 200 OK: { accessToken, expireTime }
    BG->>BG: Cache Deployer Token in memory for cloud mutations
```

---

### 2.2. Connection Validation & Catalog Discovery Flow

```mermaid
sequenceDiagram
    autonumber
    participant UI as Extension UI (Setup Step 1-3)
    participant BG as Background Service Worker
    participant CRM as Cloud Resource Manager
    participant ACM as Access Context Manager
    participant AdminDir as Admin Directory API
    participant Compute as Compute Engine API

    UI->>BG: POST /api/v1/connections/google-cloud/validate { project_id }
    BG->>CRM: GET /v3/projects/{project_id}
    CRM-->>BG: Project details (Project Number, Organization Parent)
    BG->>CRM: POST /v1/projects/{project_id}:testIamPermissions
    CRM-->>BG: { permissions: ["resourcemanager.projects.get", ...] }
    BG->>ACM: GET /v1/accessPolicies?parent=organizations/{org_id}
    ACM-->>BG: { accessPolicies: [{ name: "accessPolicies/123456", title: "Org Policy" }] }
    BG-->>UI: { status: "connected", access_policy_id: "123456", principal_hint: "admin@corp.com" }

    UI->>BG: POST /api/v1/connections/workspace/validate { customer_id }
    BG->>AdminDir: GET /admin/directory/v1/customers/{customer_id}
    AdminDir-->>BG: 200 OK: { id: "C0123456", customerDomain: "corp.com" }
    BG-->>UI: { status: "connected", customer_id: "C0123456" }

    UI->>BG: POST /api/v1/setup-options/organizational-units { customer_id }
    BG->>AdminDir: GET /admin/directory/v1/customer/{customer_id}/orgunits?type=all
    AdminDir-->>BG: { organizationUnits: [{ orgUnitId: "id:01", orgUnitPath: "/Sales", name: "Sales" }] }
    BG-->>UI: { options: [{ value: "id:01", label: "/Sales", description: "..." }] }

    UI->>BG: POST /api/v1/setup-options/vpc-networks { project_id }
    BG->>Compute: GET /compute/v1/projects/{project_id}/global/networks
    Compute-->>BG: { items: [{ name: "default", selfLink: "..." }] }
    BG-->>UI: { options: [{ value: "default", label: "default (VPC Network)", description: "..." }] }
```

---

### 2.3. Deployer Bootstrap Flow (`POST /api/v1/bootstrap/google-cloud/deployer`)

```mermaid
sequenceDiagram
    autonumber
    participant UI as Extension UI
    participant BG as Bootstrap Provider (bootstrap.ts)
    participant IAM as IAM API
    participant CRM as Cloud Resource Manager
    participant ACM as Access Context Manager

    UI->>BG: POST /api/v1/bootstrap/google-cloud/deployer { project_id, confirmation: "BOOTSTRAP" }
    
    Note over BG,IAM: 1. Service Account Creation / Verification
    BG->>IAM: GET /v1/projects/{project_id}/serviceAccounts/secure-gateway-studio-deployer@{project_id}.iam.gserviceaccount.com
    alt Service account does not exist
        BG->>IAM: POST /v1/projects/{project_id}/serviceAccounts<br/>{ accountId: "secure-gateway-studio-deployer", serviceAccount: { displayName: "Secure Gateway Studio Deployer" } }
        IAM-->>BG: 200 OK: { uniqueId: "10987654321", email: "..." }
    else Service account exists
        IAM-->>BG: 200 OK: { uniqueId: "10987654321", email: "..." }
    end

    Note over BG,IAM: 2. Custom Role Creation / Sync
    BG->>IAM: GET /v1/projects/{project_id}/roles/secureGatewayStudioDeployer
    alt Role does not exist
        BG->>IAM: POST /v1/projects/{project_id}/roles<br/>{ roleId: "secureGatewayStudioDeployer", role: { title: "...", includedPermissions: [50+ permissions] } }
    else Role exists
        BG->>IAM: PATCH /v1/projects/{project_id}/roles/secureGatewayStudioDeployer<br/>{ includedPermissions: [...] }
    end
    IAM-->>BG: 200 OK: { name: "projects/{project_id}/roles/secureGatewayStudioDeployer", etag: "..." }

    Note over BG,CRM: 3. Grant Service Account Project IAM Policy Binding
    BG->>CRM: POST /v1/projects/{project_id}:getIamPolicy
    CRM-->>BG: { bindings: [...], etag: "BwY..." }
    BG->>CRM: POST /v1/projects/{project_id}:setIamPolicy<br/>{ bindings: [...add role/secureGatewayStudioDeployer to serviceAccount], etag: "BwY..." }
    CRM-->>BG: 200 OK

    Note over BG,IAM: 4. Grant Operator Service Account Token Creator
    BG->>IAM: POST /v1/projects/{project_id}/serviceAccounts/{deployerEmail}:getIamPolicy
    IAM-->>BG: { bindings: [...], etag: "..." }
    BG->>IAM: POST /v1/projects/{project_id}/serviceAccounts/{deployerEmail}:setIamPolicy<br/>{ bindings: [roles/iam.serviceAccountTokenCreator -> user:operator@corp.com] }
    IAM-->>BG: 200 OK

    Note over BG,ACM: 5. Grant Deployer Access Context Manager Policy Editor
    BG->>ACM: POST /v1/accessPolicies/{policyId}:getIamPolicy
    ACM-->>BG: { bindings: [...], etag: "..." }
    BG->>ACM: POST /v1/accessPolicies/{policyId}:setIamPolicy<br/>{ bindings: [roles/accesscontextmanager.policyEditor -> serviceAccount:deployer] }
    ACM-->>BG: 200 OK

    BG-->>UI: 200 OK: { service_account_email, unique_id, access_policy_id }
```

---

### 2.4. Apply & Execution Flow (Infrastructure Provisioning)

```mermaid
sequenceDiagram
    autonumber
    participant UI as Extension UI
    participant Engine as Run Engine (runtime/run-engine.ts)
    participant Exec as Resource Executor (providers/executor*.ts)
    participant ServiceUsage as Service Usage API
    participant Compute as Compute Engine API
    participant SecretMgr as Secret Manager API
    participant BeyondCorp as BeyondCorp API
    participant ChromePolicy as Chrome Policy API

    UI->>Engine: POST /api/v1/runs { approval_id }
    Engine->>Engine: Lock single-use execution slot & record run in IndexedDB

    Note over Engine,ServiceUsage: Step 1: Enable Required Google APIs
    Engine->>Exec: execute(enable_services)
    Exec->>ServiceUsage: POST /v1/projects/{project_id}/services:batchEnable<br/>{ serviceIds: ["beyondcorp.googleapis.com", "compute.googleapis.com", "dns.googleapis.com", "secretmanager.googleapis.com", "chromepolicy.googleapis.com"] }
    ServiceUsage-->>Exec: 200 OK Operation

    Note over Engine,SecretMgr: Step 2: TLS Secret Provisioning (Secret Manager)
    Engine->>Exec: execute(tls_secret)
    Exec->>SecretMgr: POST /v1/projects/{project_id}/secrets?secretId={secret_name}
    SecretMgr-->>Exec: 200 OK: { name: "projects/.../secrets/{secret_name}" }
    Exec->>SecretMgr: POST /v1/projects/{project_id}/secrets/{secret_name}:addVersion<br/>{ payload: { data: base64({ cert_pem, chain_pem, private_key }) } }
    SecretMgr-->>Exec: 200 OK: { name: "projects/.../versions/1" }

    Note over Engine,Compute: Step 3: Compute Infrastructure (MIG / ILB / Cloud NAT / DNS)
    Engine->>Exec: execute(compute_resources)
    Exec->>Compute: POST /compute/v1/projects/{id}/global/instanceTemplates
    Exec->>Compute: POST /compute/v1/projects/{id}/regions/{region}/regionInstanceGroupManagers
    Exec->>Compute: POST /compute/v1/projects/{id}/regions/{region}/healthChecks
    Exec->>Compute: POST /compute/v1/projects/{id}/regions/{region}/backendServices
    Exec->>Compute: POST /compute/v1/projects/{id}/regions/{region}/forwardingRules
    Compute-->>Exec: All Compute resources active

    Note over Engine,BeyondCorp: Step 4: BeyondCorp Security Gateway & Application
    Engine->>Exec: execute(beyondcorp_gateway_and_app)
    Exec->>BeyondCorp: POST /v1/projects/{id}/locations/global/securityGateways?securityGatewayId={gw_id}
    BeyondCorp-->>Exec: 200 OK: { name: "projects/.../securityGateways/{gw_id}", state: "RUNNING" }
    Exec->>BeyondCorp: POST /v1/projects/{id}/locations/global/securityGateways/{gw_id}/applications?applicationId={app_id}<br/>{ endpointMatchers: [{ hostname: "app.internal", port: 443 }] }
    BeyondCorp-->>Exec: 200 OK: { name: "projects/.../applications/{app_id}" }
    Exec->>BeyondCorp: POST /v1/projects/{id}/locations/global/securityGateways/{gw_id}:setIamPolicy (serviceDiscoveryUser)
    Exec->>BeyondCorp: POST /v1/projects/{id}/locations/global/securityGateways/{gw_id}/applications/{app_id}:setIamPolicy (sgApplicationUser with CEL Condition)
    BeyondCorp-->>Exec: 200 OK

    Note over Engine,ChromePolicy: Step 5: Chrome Enterprise Policy Publication
    Engine->>Exec: execute(chrome_policy)
    Exec->>ChromePolicy: POST /v1/customers/{customer_id}/policies:resolve (Check current schema & policies)
    Exec->>ChromePolicy: POST /v1/customers/{customer_id}/policies/orgunits:batchModify<br/>{ requests: [Set SecurityGatewayConfig, ForceInstall SEB Extension, Set SafeBrowsing] }
    ChromePolicy-->>Exec: 200 OK

    Engine-->>UI: Run completed successfully (status: "succeeded")
```

---

### 2.5. Chrome Enterprise Premium (CEP) Provisioning & License Assignment Flow

```mermaid
sequenceDiagram
    autonumber
    participant UI as Extension UI (CEP Tab)
    participant BG as Background CEP Provider (cep-provider.ts)
    participant Dir as Admin Directory API
    participant Policy as Chrome Policy API
    participant Identity as Cloud Identity Policies API
    participant License as Enterprise License Manager

    UI->>BG: POST /api/v1/cep/provision { customer_id, target_ou_id, policies: [...], dlp_matrix: {...} }
    
    Note over BG,Dir: 1. Target OU Verification
    BG->>Dir: GET /admin/directory/v1/customer/{customer_id}/orgunits/{target_ou_id}
    Dir-->>BG: { orgUnitId: "03ph8a2z1234", orgUnitPath: "/PilotOU", name: "PilotOU" }

    Note over BG,Policy: 2. Discover Policy Schemas & Modify Policies
    BG->>Policy: GET /v1/customers/{customer_id}/policySchemas
    Policy-->>BG: { policySchemas: [ "chrome.users.SafeBrowsingProtectionLevel", "chrome.users.ThreatReporting", ... ] }
    BG->>Policy: POST /v1/customers/{customer_id}/policies/orgunits:batchModify<br/>{ requests: [{ policyTargetKey: { targetResource: "orgunits/03ph8a2z1234" }, policyValue: { value: { ... } } }] }
    Policy-->>BG: 200 OK

    Note over BG,Identity: 3. Cloud Identity DLP Rules (Watermark, Warnings, Upload/Download)
    BG->>Identity: POST /v1beta1/policies<br/>{ customer: "customers/C012345", setting: { type: "settings/rule.dlp", value: { dlpRule: { name: "CEP PoC - Universal Warning", condition: "...", action: { ... } } } } }
    Identity-->>BG: 200 OK: { name: "policies/abc-123-xyz" }

    Note over UI,License: 4. Assign CEP Licenses to Pilot OU Users
    UI->>BG: POST /api/v1/cep/assign-licenses { customer_id, target_ou_id, sku_id: "1010370001" }
    BG->>Dir: GET /admin/directory/v1/users?customer={customer_id}&orgUnitPath=/PilotOU&maxResults=10
    Dir-->>BG: { users: [{ primaryEmail: "alice@corp.com" }, { primaryEmail: "bob@corp.com" }] }
    
    loop For each user in Pilot OU
        BG->>License: POST /apps/licensing/v1/product/Google-Chrome-Enterprise-Premium/sku/1010370001/user<br/>{ userId: "alice@corp.com" }
        License-->>BG: 200 OK: { userId: "alice@corp.com", skuId: "1010370001" }
    end
    BG-->>UI: 200 OK: { assigned_count: 2, users: ["alice@corp.com", "bob@corp.com"] }
```

---

## 3. Exhaustive Google API Call & Response Reference

Below is the exhaustive catalog of every external Google API endpoint invoked by the extension.

| # | Service & Base URI | Method & Endpoint | Caller Identity | Request Body / Parameters | Response Structure | Purpose & Context |
|---|---|---|---|---|---|---|
| **1** | **OAuth 2.0 / Chrome Identity** | `chrome.identity.getAuthToken` | Operator User | `{ interactive: boolean, scopes: string[] }` | `token: string` | Acquires Google OAuth token for administrator Workspace/Cloud actions. |
| **2** | **OAuth 2.0** | `POST https://oauth2.googleapis.com/revoke` | Operator User | `?token={token}` | `200 OK` | Revokes the current access token upon sign-out. |
| **3** | **Cloud Resource Manager** `cloudresourcemanager.googleapis.com` | `GET /v3/projects/{projectId}` | Operator / Deployer | None | `{ name, projectId, projectNumber, state, parent: "organizations/{orgId}" }` | Discovers project number, organization parent, and verifies project existence. |
| **4** | **Cloud Resource Manager** | `POST /v1/projects/{projectId}:testIamPermissions` | Operator / Deployer | `{ permissions: string[] }` | `{ permissions: string[] }` | Tests whether current token holds critical permissions (IAM, Compute, BeyondCorp). |
| **5** | **Cloud Resource Manager** | `POST /v1/projects/{projectId}:getIamPolicy` | Operator User | `{ options: { requestedPolicyVersion: 3 } }` | `{ bindings: [{ role, members, condition }], etag, version }` | Reads project IAM bindings to calculate custom role bindings for deployer. |
| **6** | **Cloud Resource Manager** | `POST /v1/projects/{projectId}:setIamPolicy` | Operator User | `{ policy: { bindings, etag, version: 3 } }` | `{ bindings, etag, version: 3 }` | Binds `roles/secureGatewayStudioDeployer` to the deployer service account. |
| **7** | **IAM API** `iam.googleapis.com` | `GET /v1/projects/{projectId}/serviceAccounts/{email}` | Operator User | None | `{ name, projectId, uniqueId, email, displayName }` | Reads deployer service account identity and immutable `uniqueId`. |
| **8** | **IAM API** | `POST /v1/projects/{projectId}/serviceAccounts` | Operator User | `{ accountId: "secure-gateway-studio-deployer", serviceAccount: { displayName } }` | `{ name, uniqueId, email }` | Creates the dedicated, minimal-privilege deployer service account. |
| **9** | **IAM API** | `GET /v1/projects/{projectId}/roles/{roleId}` | Operator User | None | `{ name, title, includedPermissions: string[], stage, etag }` | Inspects current definition and etag of the product custom role. |
| **10** | **IAM API** | `POST /v1/projects/{projectId}/roles` | Operator User | `{ roleId: "secureGatewayStudioDeployer", role: { title, includedPermissions } }` | `{ name, includedPermissions, etag }` | Creates project custom role with exact required permissions. |
| **11** | **IAM API** | `PATCH /v1/projects/{projectId}/roles/{roleId}` | Operator User | `{ includedPermissions: string[], etag }` | `{ name, includedPermissions, etag }` | Synchronizes custom role permissions when schema updates occur. |
| **12** | **IAM API** | `POST /v1/projects/{projectId}/serviceAccounts/{email}:getIamPolicy` | Operator User | None | `{ bindings: [...], etag }` | Reads Service Account IAM policy to check Token Creator bindings. |
| **13** | **IAM API** | `POST /v1/projects/{projectId}/serviceAccounts/{email}:setIamPolicy` | Operator User | `{ policy: { bindings: [roles/iam.serviceAccountTokenCreator -> operatorEmail] } }` | `{ bindings: [...], etag }` | Grants operator permission to impersonate the deployer service account. |
| **14** | **IAM Credentials API** `iamcredentials.googleapis.com` | `POST /v1/projects/-/serviceAccounts/{email}:generateAccessToken` | Operator User | `{ delegates: [], scope: string[], lifetime: "3600s" }` | `{ accessToken: string, expireTime: string }` | Generates short-lived impersonated OAuth access token for cloud execution. |
| **15** | **Service Usage API** `serviceusage.googleapis.com` | `GET /v1/projects/{projectId}/services/{service}` | Deployer SA | None | `{ name, state: "ENABLED" \| "DISABLED" }` | Checks if required Google API services (e.g. `dns.googleapis.com`) are enabled. |
| **16** | **Service Usage API** | `POST /v1/projects/{projectId}/services:batchEnable` | Deployer SA | `{ serviceIds: string[] }` | Operation `{ name, done: true, response: {} }` | Batch-enables Compute, DNS, BeyondCorp, and Secret Manager APIs. |
| **17** | **Access Context Manager** `accesscontextmanager.googleapis.com` | `GET /v1/accessPolicies?parent=organizations/{orgId}` | Operator User | None | `{ accessPolicies: [{ name: "accessPolicies/123", title: "..." }] }` | Discovers available Access Context Manager access policy IDs for the organization. |
| **18** | **Access Context Manager** | `GET /v1/accessPolicies/{policyId}/accessLevels` | Operator / Deployer | `?accessLevelFormat=CEL` | `{ accessLevels: [{ name, title, basic \| custom }] }` | Lists existing Access Levels to populate UI access-level selector. |
| **19** | **Access Context Manager** | `POST /v1/accessPolicies/{policyId}/accessLevels` | Deployer SA | `{ name, title, custom: { expr: { expression: "..." } } }` | Operation -> `{ name, title, custom }` | Automatically provisions Managed Chrome Access Level (Profile or Browser). |
| **20** | **Access Context Manager** | `DELETE /v1/accessPolicies/{policyId}/accessLevels/{levelName}` | Deployer SA | None | Operation -> `{ done: true }` | Removes created Access Level during teardown / rollback. |
| **21** | **Access Context Manager** | `POST /v1/accessPolicies/{policyId}:getIamPolicy` | Operator User | None | `{ bindings: [...], etag }` | Reads Access Policy IAM policy to verify Policy Editor permissions. |
| **22** | **Access Context Manager** | `POST /v1/accessPolicies/{policyId}:setIamPolicy` | Operator User | `{ policy: { bindings: [roles/accesscontextmanager.policyEditor -> deployerSA] } }` | `{ bindings: [...], etag }` | Grants deployer service account Policy Editor rights on the access policy. |
| **23** | **Compute Engine API** `compute.googleapis.com` | `GET /compute/v1/projects/{projectId}/global/networks` | Deployer SA | `?maxResults=500` | `{ items: [{ name, selfLink, autoCreateSubnetworks }] }` | Enumerates VPC networks for network topology selection. |
| **24** | **Compute Engine API** | `GET /compute/v1/projects/{projectId}/regions/{region}/subnetworks` | Deployer SA | None | `{ items: [{ name, ipCidrRange, purpose, role }] }` | Enumerates subnets; checks proxy-only subnet presence for Option B. |
| **25** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/regions/{region}/subnetworks` | Deployer SA | `{ name, ipCidrRange, purpose: "REGIONAL_MANAGED_PROXY", role: "ACTIVE" }` | Regional Operation -> Subnetwork | Creates `REGIONAL_MANAGED_PROXY` subnetwork for Internal Application Load Balancer. |
| **26** | **Compute Engine API** | `GET /compute/v1/projects/{projectId}/global/firewalls` | Deployer SA | None | `{ items: [{ name, sourceRanges, allowed: [{ IPProtocol, ports }] }] }` | Reads firewall rules to verify ingress rules from BeyondCorp gateway IPs (`136.124.16.0/20`). |
| **27** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/global/firewalls` | Deployer SA | `{ name, network, sourceRanges: ["136.124.16.0/20"], allowed: [{ IPProtocol: "tcp", ports: ["443"] }] }` | Global Operation -> Firewall | Creates VPC ingress firewall rule for Secure Gateway proxy traffic. |
| **28** | **Compute Engine API** | `DELETE /compute/v1/projects/{projectId}/global/firewalls/{firewall}` | Deployer SA | None | Global Operation | Tears down created firewall rules upon teardown. |
| **29** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/global/instanceTemplates` | Deployer SA | `{ name, properties: { machineType, disks, networkInterfaces, metadata: { startup-script } } }` | Global Operation -> Template | Provisions Nginx offload instance template with hardened configuration. |
| **30** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/regions/{region}/regionInstanceGroupManagers` | Deployer SA | `{ name, instanceTemplate, targetSize, distributionPolicy: { zones } }` | Regional Operation -> MIG | Provisions regional Managed Instance Group spanning 2 zones. |
| **31** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/regions/{region}/regionAutoscalers` | Deployer SA | `{ name, target: MIG_URL, autoscalingPolicy: { minNumReplicas: 2, maxNumReplicas: 20, cpuUtilization: { utilizationTarget: 0.8 } } }` | Regional Operation -> Autoscaler | Configures CPU autoscaling for offload tier replicas. |
| **32** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/regions/{region}/healthChecks` | Deployer SA | `{ name, type: "SSL", sslHealthCheck: { port: 443 } }` | Regional Operation -> HealthCheck | Creates regional SSL health check for Internal Load Balancer. |
| **33** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/regions/{region}/backendServices` | Deployer SA | `{ name, protocol: "TCP", loadBalancingScheme: "INTERNAL", backends: [{ group: MIG_URL }] }` | Regional Operation -> BackendService | Configures regional Backend Service for Network/Application Load Balancer. |
| **34** | **Compute Engine API** | `POST /compute/v1/projects/{projectId}/regions/{region}/forwardingRules` | Deployer SA | `{ name, loadBalancingScheme: "INTERNAL", network, subnetwork, ports: ["443"], backendService }` | Regional Operation -> ForwardingRule | Provisions regional internal forwarding rule with private VIP. |
| **35** | **Compute Engine API** | `DELETE /compute/v1/projects/{projectId}/...` (All Compute resources) | Deployer SA | None | Operations | Reverses compute infrastructure in strict reverse-dependency order on teardown. |
| **36** | **Cloud DNS API** `dns.googleapis.com` | `GET /dns/v1/projects/{projectId}/managedZones` | Deployer SA | None | `{ managedZones: [{ name, dnsName, visibility: "private" }] }` | Lists Cloud DNS zones to find private matching zone for gateway endpoint. |
| **37** | **Cloud DNS API** | `POST /dns/v1/projects/{projectId}/managedZones` | Deployer SA | `{ name, dnsName: "app.internal.", visibility: "private", privateVisibilityConfig: { networks: [...] } }` | `{ name, id, dnsName }` | Creates private Cloud DNS zone bound to the target VPC network. |
| **38** | **Cloud DNS API** | `POST /dns/v1/projects/{projectId}/managedZones/{zone}/changes` | Deployer SA | `{ additions: [{ name: "app.internal.", type: "A", ttl: 300, rrdatas: [VIP_IP] }], deletions: [] }` | `{ id, status: "pending" \| "done" }` | Creates / deletes DNS `A` records routing app hostname to internal VIP. |
| **39** | **Secret Manager API** `secretmanager.googleapis.com` | `POST /v1/projects/{projectId}/secrets?secretId={secretId}` | Deployer SA | `{ replication: { automatic: {} } }` | `{ name: "projects/.../secrets/{id}", createTime }` | Creates Secret resource to hold TLS certificate bundle and private keys. |
| **40** | **Secret Manager API** | `POST /v1/projects/{projectId}/secrets/{secretId}:addVersion` | Deployer SA | `{ payload: { data: base64(JSON_STRING) } }` | `{ name: "projects/.../versions/1", state: "ENABLED" }` | Writes encrypted TLS certificate bundle version to Secret Manager. |
| **41** | **Secret Manager API** | `GET /v1/projects/{projectId}/secrets/{secretId}/versions/{version}:access` | Deployer SA | None | `{ payload: { data: base64 } }` | Reads secret version to verify certificate validity during preflight. |
| **42** | **Secret Manager API** | `DELETE /v1/projects/{projectId}/secrets/{secretId}` | Deployer SA | None | `{}` | Deletes secret upon teardown. |
| **43** | **Private CA Service** `privateca.googleapis.com` | `POST /v1/projects/{projectId}/locations/{loc}/caPools/{pool}/certificates:createCertificate` | Deployer SA | `{ certificate: { config: { subjectConfig, x509Config }, lifetime: "2592000s" } }` | Certificate Object with `{ pemCertificate, pemCertificateChain }` | Issues server TLS certificate from Google Cloud Certificate Authority Service. |
| **44** | **BeyondCorp API** `beyondcorp.googleapis.com` | `GET /v1/projects/{projectId}/locations/global/securityGateways` | Deployer SA | None | `{ securityGateways: [{ name, state, hubs }] }` | Discovers existing BeyondCorp Security Gateways in the project. |
| **45** | **BeyondCorp API** | `POST /v1/projects/{projectId}/locations/global/securityGateways?securityGatewayId={gwId}` | Deployer SA | `{ displayName: "...", hubs: [{ region: "us-central1" }] }` | Long-Running Operation -> SecurityGateway | Creates BeyondCorp Security Gateway resource. |
| **46** | **BeyondCorp API** | `POST /v1/projects/{projectId}/locations/global/securityGateways/{gwId}/applications?applicationId={appId}` | Deployer SA | `{ displayName, endpointMatchers: [{ hostname: "...", port: 443 }] }` | Long-Running Operation -> Application | Registers private web application behind the Security Gateway. |
| **47** | **BeyondCorp API** | `POST /v1/projects/{projectId}/locations/global/securityGateways/{gwId}:getIamPolicy` | Deployer SA | `{ options: { requestedPolicyVersion: 3 } }` | `{ bindings, etag }` | Reads Gateway IAM policy (`roles/beyondcorp.serviceDiscoveryUser`). |
| **48** | **BeyondCorp API** | `POST /v1/projects/{projectId}/locations/global/securityGateways/{gwId}:setIamPolicy` | Deployer SA | `{ policy: { bindings, etag } }` | `{ bindings, etag }` | Binds Service Discovery User role to target user group. |
| **49** | **BeyondCorp API** | `POST /v1/projects/{projectId}/locations/global/securityGateways/{gwId}/applications/{appId}:getIamPolicy` | Deployer SA | `{ options: { requestedPolicyVersion: 3 } }` | `{ bindings, etag }` | Reads Application IAM policy (`roles/beyondcorp.sgApplicationUser`). |
| **50** | **BeyondCorp API** | `POST /v1/projects/{projectId}/locations/global/securityGateways/{gwId}/applications/{appId}:setIamPolicy` | Deployer SA | `{ policy: { bindings: [{ role: "roles/beyondcorp.sgApplicationUser", members: [...], condition: { title, expression: "'accessPolicies/...' in request.auth.access_levels" } }], etag } }` | `{ bindings, etag }` | Binds Application User role with CEL Managed Chrome Access Level condition. |
| **51** | **Cloud Logging API** `logging.googleapis.com` | `POST /v2/entries:list` | Deployer SA | `{ resourceNames: ["projects/{id}"], filter: "resource.type=... AND timestamp >= ...", pageSize: 100 }` | `{ entries: [{ logName, timestamp, jsonPayload, severity }] }` | Fetches gateway connection logs, Nginx access logs, and audit trails. |
| **52** | **Workspace Admin Directory** `admin.googleapis.com` | `GET /admin/directory/v1/customers/{customerId}` | Operator User | None | `{ id: "C0123456", customerDomain: "corp.com", postalAddress }` | Discovers canonical customer ID (`C...`) from domain name or alias. |
| **53** | **Workspace Admin Directory** | `GET /admin/directory/v1/customer/{customerId}/orgunits` | Operator User | `?type=all` | `{ organizationUnits: [{ orgUnitId, orgUnitPath, name, parentOrgUnitId }] }` | Lists all Organizational Units in the tenant to populate OU pickers. |
| **54** | **Workspace Admin Directory** | `POST /admin/directory/v1/customer/{customerId}/orgunits` | Operator User | `{ name: "CEP Users", parentOrgUnitPath: "/Pilot" }` | `{ orgUnitId, orgUnitPath, name }` | Creates child pilot sub-OUs (`CEP Users`, `CEP Browsers`) if requested. |
| **55** | **Workspace Admin Directory** | `GET /admin/directory/v1/groups?customer={customerId}` | Operator User | `?maxResults=200` | `{ groups: [{ id, email, name, description }] }` | Lists Google Workspace groups to select target user principal group. |
| **56** | **Workspace Admin Directory** | `GET /admin/directory/v1/users?customer={customerId}&orgUnitPath={ouPath}` | Operator User | `?maxResults=10` | `{ users: [{ primaryEmail, name, id }] }` | Enumerates users within the exact pilot OU for license assignment. |
| **57** | **Chrome Policy API** `chromepolicy.googleapis.com` | `GET /v1/customers/{customerId}/policySchemas` | Operator User | None | `{ policySchemas: [{ name: "chrome.users.SecurityGatewayConfig", definition: {...} }] }` | Discovers live supported policy schemas and fields for the tenant. |
| **58** | **Chrome Policy API** | `POST /v1/customers/{customerId}/policies:resolve` | Operator User | `{ policyTargetKey: { targetResource: "orgunits/{ouId}" }, policySchemaFilter: "chrome.users.*" }` | `{ resolvedPolicies: [{ policyValue: { value: {...} }, sourceKey: {...} }] }` | Resolves existing active policy values before applying modifications. |
| **59** | **Chrome Policy API** | `POST /v1/customers/{customerId}/policies/orgunits:batchModify` | Operator User | `{ requests: [{ policyTargetKey: { targetResource: "orgunits/{ouId}" }, policyValue: { policyNamespace: "chrome.users", value: { ... } }, updateMask: "..." }] }` | `{ responses: [{ ... }] }` | Applies Security Gateway routes, SEB extension force-install, and DLP connectors. |
| **60** | **Cloud Identity Policy API** `cloudidentity.googleapis.com` | `POST /v1beta1/policies` | Operator User | `{ customer: "customers/{id}", setting: { type: "settings/rule.dlp", value: { dlpRule: { name: "CEP PoC - Watermark", condition: "...", action: { watermark: true } } } } }` | `{ name: "policies/dlp-12345", createTime }` | Creates starter Data Loss Prevention (DLP) rules (watermark, download warning). |
| **61** | **Cloud Identity Policy API** | `DELETE /v1beta1/policies/{policyId}` | Operator User | None | `{}` | Deletes created Cloud Identity DLP rule upon rollback. |
| **62** | **Enterprise License Manager** `licensing.googleapis.com` | `POST /apps/licensing/v1/product/{productId}/sku/{skuId}/user` | Operator User | `{ userId: "user@corp.com" }` | `{ kind: "licenseAssignment", userId, productId, skuId }` | Directly assigns Chrome Enterprise Premium SKU licenses to pilot OU users. |
| **63** | **Enterprise License Manager** | `DELETE /apps/licensing/v1/product/{productId}/sku/{skuId}/user/{userId}` | Operator User | None | `204 No Content` | Removes assigned CEP license from user upon rollback. |

---

## 4. Rollback, Failure Recovery & Compensation Mechanisms

The extension enforces strict lifecycle safety rules during failures:

```mermaid
flowchart TD
    FailureNode["API Failure Occurs during Operation"] --> CheckType{"Failure Type"}
    
    CheckType -->|IAM Etag Conflict / 409| Backoff["Exponential Backoff & Fresh Etag Re-fetch"]
    Backoff --> RetryIAM["Re-apply Exact Modified Delta with Fresh Etag"]
    
    CheckType -->|Unfinished Apply / Network Loss| CrashRecovery["Worker Re-wakes -> IndexedDB Checkpoint Reconciled"]
    CrashRecovery --> ResumeSlot["Resume Apply from Exact Durable Step"]
    
    CheckType -->|Terminal Step Failure| Rollback["Ownership-Bounded Teardown in Reverse Order"]
    Rollback --> DelApp["1. Delete Gateway Application"]
    DelApp --> DelGW["2. Delete Security Gateway (if no other apps)"]
    DelGW --> DelCompute["3. Teardown Compute MIG / Backend Service / HealthCheck"]
    DelCompute --> DelSecret["4. Destroy Secret Manager Versions"]
    DelSecret --> RestoreIAM["5. Restore IAM Policies to exact Before-Images"]
```

### Safety Guarantees:
1. **Never Delete Shared Resources:** If a VPC network or DNS zone was pre-existing (`owned: false`, `shared: true`), it is untouched; only newly added records are removed.
2. **Reverse-Order Dependency Deletion:** Teardown strictly follows dependency DAG in reverse order (Applications $\rightarrow$ Gateways $\rightarrow$ Forwarding Rules $\rightarrow$ MIGs $\rightarrow$ Instances $\rightarrow$ Templates $\rightarrow$ Secrets $\rightarrow$ Roles).
3. **Fail-Closed IAM Restoration:** Application and Gateway IAM policies always record exact `beforeImage` copies in IndexedDB before mutation. In case of partial failure, `restoreIamPolicyWithFreshEtag` rolls back bindings safely.
4. **Encrypted State at Rest:** All sensitive credentials, tokens, plans, before-images, and audit events are encrypted with **AES-256-GCM** in IndexedDB, preventing disk-level leakage.
