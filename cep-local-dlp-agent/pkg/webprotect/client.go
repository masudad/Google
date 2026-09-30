package webprotect

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	// EndpointProdGlobal is the default global CEP WebProtect Scotty upload endpoint.
	EndpointProdGlobal = "https://safebrowsing.google.com/safebrowsing/uploads/scan"
	// EndpointProdUS is the regional US data residency CEP WebProtect endpoint.
	EndpointProdUS = "https://scan.webprotect-us.goog/uploads"
	// EndpointProdEU is the regional EU data residency CEP WebProtect endpoint.
	EndpointProdEU = "https://scan.webprotect-eu.goog/uploads"

	// DefaultDeadlineSeconds matches Chrome's default content analysis timeout (115s).
	DefaultDeadlineSeconds = 115

	// MaxPayloadBytes is the 50 MB threshold for multipart content inspection.
	MaxPayloadBytes = 50 * 1024 * 1024

	// DefaultChromeVersion is a 4-part Chrome version string required by WebProtect's
	// Chrome version parser when evaluating management state and audit reporting.
	DefaultChromeVersion = "146.0.7680.0"
)

// ScanInput represents a single content analysis request from the local agent.
type ScanInput struct {
	DMToken        string
	ProfileDMToken string
	UserEmail      string
	ClientID       string
	URL            string
	TabURL         string
	Filename       string
	Source         string
	Destination    string
	ContentType    string
	Connector      AnalysisConnector
	Reason         Reason
	Payload        []byte
	DeviceName     string
	OSPlatform     string
	OSVersion      string
	MachineUser    string
}

// ScanVerdict contains the evaluated DLP decision from the CEP WebProtect server.
type ScanVerdict struct {
	Allowed       bool                `json:"allowed"`
	Action        TriggeredRuleAction `json:"action"`
	ActionName    string              `json:"action_name"`
	RuleName      string              `json:"rule_name,omitempty"`
	RuleID        string              `json:"rule_id,omitempty"`
	CustomMessage string              `json:"custom_message,omitempty"`
	RequestToken  string              `json:"request_token"`
	LatencyMs     int64               `json:"latency_ms"`
}

// Client communicates with the Chrome Enterprise Premium WebProtect server using the Scotty
// multipart upload protocol.
type Client struct {
	Endpoint   string
	HTTPClient *http.Client
}

// NewClient creates a new CEP WebProtect client targeting the specified endpoint.
func NewClient(endpoint string) *Client {
	if endpoint == "" {
		endpoint = EndpointProdGlobal
	}
	return &Client{
		Endpoint: endpoint,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewRequestToken generates a unique 32-hex-character request token.
func NewRequestToken() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("cep_local_%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

// BuildContentAnalysisRequest constructs the ContentAnalysisRequest proto from ScanInput.
func BuildContentAnalysisRequest(in ScanInput) *ContentAnalysisRequest {
	reqToken := NewRequestToken()
	sum := sha256.Sum256(in.Payload)
	digest := hex.EncodeToString(sum[:])

	contentType := in.ContentType
	if contentType == "" {
		contentType = "text/plain"
	}
	connector := in.Connector
	if connector == AnalysisConnectorUnspecified {
		if in.Filename != "" {
			connector = FileAttached
		} else {
			connector = BulkDataEntry
		}
	}
	filename := in.Filename
	if filename == "" && connector == BulkDataEntry {
		if in.Reason == ReasonClipboardPaste {
			filename = "Clipboard text"
		} else {
			filename = "Text input"
		}
	}

	tabURL := in.TabURL
	if tabURL == "" {
		tabURL = in.URL
	}
	destination := in.Destination
	if destination == "" {
		destination = in.URL
	}
	clientID := in.ClientID
	if clientID == "" {
		clientID = in.DeviceName
	}

	// If DMToken is a Managed Profile token (equal to ProfileDMToken), only set DeviceMetadata.DMToken
	// when a separate CBCM browser/device DM token exists.
	deviceDMToken := in.DMToken
	if in.ProfileDMToken != "" && in.DMToken == in.ProfileDMToken {
		deviceDMToken = ""
	}

	var clientMeta *ClientMetadata
	if in.DeviceName != "" || in.OSPlatform != "" || in.ProfileDMToken != "" || in.UserEmail != "" || clientID != "" {
		clientMeta = &ClientMetadata{
			Browser: &BrowserMetadata{
				BrowserID:     in.DeviceName,
				UserAgent:     "Mozilla/5.0 (CEP-Local-DLP-Agent/1.3) Chrome/" + DefaultChromeVersion,
				ChromeVersion: DefaultChromeVersion,
				MachineUser:   in.MachineUser,
			},
			Device: &DeviceMetadata{
				DMToken:    deviceDMToken,
				ClientID:   clientID,
				OSPlatform: in.OSPlatform,
				OSVersion:  in.OSVersion,
				Name:       in.DeviceName,
			},
		}
		if in.ProfileDMToken != "" || in.UserEmail != "" {
			clientMeta.Profile = &ProfileMetadata{
				DMToken:   in.ProfileDMToken,
				GaiaEmail: in.UserEmail,
				ClientID:  clientID,
			}
		}
	}

	return &ContentAnalysisRequest{
		DMToken:           in.DMToken,
		RequestToken:      reqToken,
		AnalysisConnector: connector,
		Tags:              []string{"dlp"},
		Blocking:          true,
		Reason:            in.Reason,
		ExpiresAt:         time.Now().Add(DefaultDeadlineSeconds * time.Second).Unix(),
		RequestData: ContentMetaData{
			URL:                     in.URL,
			TabURL:                  tabURL,
			Filename:                filename,
			Digest:                  digest,
			Email:                   in.UserEmail,
			ContentType:             contentType,
			Source:                  in.Source,
			Destination:             destination,
			ContentAreaAccountEmail: in.UserEmail,
			FileSize:                uint64(len(in.Payload)),
		},
		ClientMetadata: clientMeta,
	}
}

// EncodeScottyMultipart encodes a ContentAnalysisRequest and raw payload into the exact
// Scotty multipart/related wire format expected by WebProtect.
func EncodeScottyMultipart(req *ContentAnalysisRequest, payload []byte, boundary string) []byte {
	if boundary == "" {
		boundary = "cep_dlp_boundary"
	}
	encodedProto := base64.StdEncoding.EncodeToString(req.MarshalProto())
	contentType := req.RequestData.ContentType
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	var buf bytes.Buffer
	fmt.Fprintf(&buf, "--%s\r\nContent-Type: text/plain\r\n\r\n%s\r\n", boundary, encodedProto)
	fmt.Fprintf(&buf, "--%s\r\nContent-Type: %s\r\n\r\n", boundary, contentType)
	buf.Write(payload)
	fmt.Fprintf(&buf, "\r\n--%s--\r\n", boundary)
	return buf.Bytes()
}

// Scan sends the payload and metadata to the CEP WebProtect server and returns the evaluated ScanVerdict.
// Includes a fast 1x retry (150ms backoff) on transient network/5xx errors so momentary network blips
// do not cause missed DLP evaluations.
func (c *Client) Scan(ctx context.Context, in ScanInput) (*ScanVerdict, error) {
	if len(in.Payload) > MaxPayloadBytes {
		return &ScanVerdict{
			Allowed:      true,
			Action:       ActionUnspecified,
			ActionName:   "SKIPPED_LARGE_FILE",
			RequestToken: "skipped_over_50mb",
		}, nil
	}
	if in.DMToken == "" {
		return nil, fmt.Errorf("dm_token is required to authenticate with CEP WebProtect")
	}

	start := time.Now()
	protoReq := BuildContentAnalysisRequest(in)
	const boundary = "cep_dlp_boundary"
	body := EncodeScottyMultipart(protoReq, in.Payload, boundary)

	var respBytes []byte
	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(150 * time.Millisecond):
			}
		}

		httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.Endpoint, bytes.NewReader(body))
		if err != nil {
			return nil, fmt.Errorf("create webprotect request: %w", err)
		}
		httpReq.Header.Set("X-Goog-Upload-Protocol", "multipart")
		httpReq.Header.Set("Content-Type", fmt.Sprintf("multipart/related; boundary=%s", boundary))
		httpReq.Header.Set("User-Agent", "Mozilla/5.0 Chrome/"+DefaultChromeVersion+" CEP-Local-DLP-Agent/1.3")

		resp, err := c.HTTPClient.Do(httpReq)
		if err != nil {
			lastErr = fmt.Errorf("send webprotect request: %w", err)
			continue
		}
		rb, readErr := io.ReadAll(resp.Body)
		_ = resp.Body.Close()
		if readErr != nil {
			lastErr = fmt.Errorf("read webprotect response: %w", readErr)
			continue
		}
		if resp.StatusCode == http.StatusBadGateway || resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusGatewayTimeout {
			lastErr = fmt.Errorf("webprotect server returned HTTP %d: %s", resp.StatusCode, string(rb))
			continue
		}
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("webprotect server returned HTTP %d: %s", resp.StatusCode, string(rb))
		}
		respBytes = rb
		lastErr = nil
		break
	}
	if lastErr != nil {
		return nil, lastErr
	}

	caResp, err := UnmarshalContentAnalysisResponse(respBytes)
	if err != nil {
		return nil, fmt.Errorf("decode ContentAnalysisResponse protobuf: %w", err)
	}

	action, rule := caResp.HighestAction()
	verdict := &ScanVerdict{
		Allowed:      action != ActionBlock && action != ActionForceSaveToCloud,
		Action:       action,
		ActionName:   action.String(),
		RequestToken: protoReq.RequestToken,
		LatencyMs:    time.Since(start).Milliseconds(),
	}
	if rule != nil {
		verdict.RuleName = rule.RuleName
		verdict.RuleID = rule.RuleID
		verdict.CustomMessage = rule.CustomMessageText()
	}
	return verdict, nil
}
