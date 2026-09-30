// Package webprotect implements the wire-compatible Protobuf messages and
// multipart upload client for Chrome Enterprise Premium (CEP) DLP scanning.
//
// Proto field numbers and wire types strictly match the public Chromium specification:
// - components/enterprise/common/proto/connectors.proto (enterprise_connectors)
package webprotect

import (
	"encoding/binary"
	"fmt"
	"strings"
)

// AnalysisConnector mirrors enterprise_connectors.AnalysisConnector (connectors.proto).
type AnalysisConnector uint64

const (
	AnalysisConnectorUnspecified AnalysisConnector = 0
	FileDownloaded               AnalysisConnector = 1
	FileAttached                 AnalysisConnector = 2
	BulkDataEntry                AnalysisConnector = 3
	Print                        AnalysisConnector = 4
	OSFileTransfer               AnalysisConnector = 5
	DataCopied                   AnalysisConnector = 6
	NetworkRequest               AnalysisConnector = 7
)

func (c AnalysisConnector) String() string {
	switch c {
	case FileDownloaded:
		return "FILE_DOWNLOADED"
	case FileAttached:
		return "FILE_ATTACHED"
	case BulkDataEntry:
		return "BULK_DATA_ENTRY"
	case Print:
		return "PRINT"
	case OSFileTransfer:
		return "OS_FILE_TRANSFER"
	case DataCopied:
		return "DATA_COPIED"
	case NetworkRequest:
		return "NETWORK_REQUEST"
	default:
		return "ANALYSIS_CONNECTOR_UNSPECIFIED"
	}
}

// Reason mirrors enterprise_connectors.ContentAnalysisRequest.Reason (connectors.proto).
type Reason uint64

const (
	ReasonUnknown           Reason = 0
	ReasonClipboardPaste    Reason = 1
	ReasonDragAndDrop       Reason = 2
	ReasonFilePickerDialog  Reason = 3
	ReasonPrintPreviewPrint Reason = 4
	ReasonSystemDialogPrint Reason = 5
	ReasonNormalDownload    Reason = 6
	ReasonSaveAsDownload    Reason = 7
)

// ContentMetaData mirrors enterprise_connectors.ContentMetaData (connectors.proto).
type ContentMetaData struct {
	URL         string // field 1
	Filename    string // field 2
	Digest      string // field 3 (SHA-256 hex digest)
	Email       string // field 5
	ContentType string // field 6
	Source      string // field 7
	Destination string // field 8
	TabTitle    string // field 9
	TabURL      string // field 10
	FileSize    uint64 // field 18
}

// BrowserMetadata mirrors enterprise_connectors.ClientMetadata.Browser.
type BrowserMetadata struct {
	BrowserID     string // field 1
	UserAgent     string // field 2
	ChromeVersion string // field 3
	MachineUser   string // field 4
}

// DeviceMetadata mirrors enterprise_connectors.ClientMetadata.Device.
type DeviceMetadata struct {
	DMToken    string // field 1
	ClientID   string // field 2
	OSVersion  string // field 3
	OSPlatform string // field 4
	Name       string // field 5
	DeviceFQDN string // field 6
}

// ProfileMetadata mirrors enterprise_connectors.ClientMetadata.Profile.
type ProfileMetadata struct {
	DMToken     string // field 1
	GaiaEmail   string // field 2
	ProfilePath string // field 3
	ProfileName string // field 4
	ClientID    string // field 5
}

// ClientMetadata mirrors enterprise_connectors.ClientMetadata (connectors.proto).
type ClientMetadata struct {
	Browser *BrowserMetadata // field 1
	Device  *DeviceMetadata  // field 2
	Profile *ProfileMetadata // field 3
}

// ContentAnalysisRequest mirrors enterprise_connectors.ContentAnalysisRequest (connectors.proto).
type ContentAnalysisRequest struct {
	DMToken                 string            // field 1
	RequestToken            string            // field 5
	AnalysisConnector       AnalysisConnector // field 9
	RequestData             ContentMetaData   // field 10
	Tags                    []string          // field 11
	ClientMetadata          *ClientMetadata   // field 12
	ExpiresAt               int64             // field 15
	UserActionID            string            // field 16
	UserActionRequestsCount int64             // field 17
	Reason                  Reason            // field 19
	Blocking                bool              // field 20
}

// ResultStatus mirrors enterprise_connectors.ContentAnalysisResponse.Result.Status.
type ResultStatus uint64

const (
	StatusUnspecified ResultStatus = 0
	StatusSuccess     ResultStatus = 1
	StatusFailure     ResultStatus = 2
)

// TriggeredRuleAction mirrors enterprise_connectors.ContentAnalysisResponse.Result.TriggeredRule.Action.
type TriggeredRuleAction uint64

const (
	ActionUnspecified          TriggeredRuleAction = 0
	ActionReportOnly           TriggeredRuleAction = 1
	ActionWarn                 TriggeredRuleAction = 2
	ActionBlock                TriggeredRuleAction = 3
	ActionForceSaveToCloud     TriggeredRuleAction = 4
	ActionJustificationRequire TriggeredRuleAction = 5
	ActionKeepInManagedChrome  TriggeredRuleAction = 6
)

func (a TriggeredRuleAction) String() string {
	switch a {
	case ActionReportOnly:
		return "REPORT_ONLY"
	case ActionWarn:
		return "WARN"
	case ActionBlock:
		return "BLOCK"
	case ActionForceSaveToCloud:
		return "FORCE_SAVE_TO_CLOUD"
	case ActionJustificationRequire:
		return "JUSTIFICATION_REQUIRED"
	case ActionKeepInManagedChrome:
		return "KEEP_IN_MANAGED_CHROME"
	default:
		return "ACTION_UNSPECIFIED"
	}
}

// CustomRuleMessageSegment mirrors TriggeredRule.CustomRuleMessageSegment.
type CustomRuleMessageSegment struct {
	Text string // field 1
	Link string // field 2
}

// TriggeredRule mirrors ContentAnalysisResponse.Result.TriggeredRule.
type TriggeredRule struct {
	Action          TriggeredRuleAction        // field 1
	RuleName        string                     // field 2
	RuleID          string                     // field 3
	URLCategory     string                     // field 5
	MessageSegments []CustomRuleMessageSegment // field 6 (CustomRuleMessage.message_segments)
}

// CustomMessageText formats any admin-configured custom rule message segments into human-readable text.
func (r TriggeredRule) CustomMessageText() string {
	if len(r.MessageSegments) == 0 {
		return ""
	}
	var sb strings.Builder
	for _, seg := range r.MessageSegments {
		sb.WriteString(seg.Text)
		if seg.Link != "" {
			sb.WriteString(" (")
			sb.WriteString(seg.Link)
			sb.WriteString(")")
		}
	}
	return strings.TrimSpace(sb.String())
}

// Result mirrors ContentAnalysisResponse.Result.
type Result struct {
	Tag            string          // field 1
	Status         ResultStatus    // field 2
	TriggeredRules []TriggeredRule // field 3
}

// ContentAnalysisResponse mirrors enterprise_connectors.ContentAnalysisResponse.
type ContentAnalysisResponse struct {
	RequestToken string   // field 1
	Results      []Result // repeated Result
}

// HighestAction returns the strictest TriggeredRuleAction across all results in the response.
// Precedence: BLOCK > FORCE_SAVE_TO_CLOUD > WARN > REPORT_ONLY > ACTION_UNSPECIFIED.
func (resp *ContentAnalysisResponse) HighestAction() (TriggeredRuleAction, *TriggeredRule) {
	highest := ActionUnspecified
	var matched *TriggeredRule

	rank := func(a TriggeredRuleAction) int {
		switch a {
		case ActionBlock, ActionForceSaveToCloud, ActionKeepInManagedChrome:
			return 4
		case ActionWarn, ActionJustificationRequire:
			return 3
		case ActionReportOnly:
			return 2
		default:
			return 1
		}
	}

	for i := range resp.Results {
		for j := range resp.Results[i].TriggeredRules {
			rule := &resp.Results[i].TriggeredRules[j]
			if rank(rule.Action) > rank(highest) {
				highest = rule.Action
				matched = rule
			}
		}
	}
	return highest, matched
}

// --- Low-level Protobuf Wire Format Encoder / Decoder ---

const (
	wireVarint = 0
	wireBytes  = 2
)

func appendTag(buf []byte, fieldNum uint64, wireType uint64) []byte {
	return binary.AppendUvarint(buf, (fieldNum<<3)|wireType)
}

func appendVarintField(buf []byte, fieldNum uint64, val uint64) []byte {
	if val == 0 {
		return buf
	}
	buf = appendTag(buf, fieldNum, wireVarint)
	return binary.AppendUvarint(buf, val)
}

func appendStringField(buf []byte, fieldNum uint64, val string) []byte {
	if val == "" {
		return buf
	}
	buf = appendTag(buf, fieldNum, wireBytes)
	buf = binary.AppendUvarint(buf, uint64(len(val)))
	return append(buf, val...)
}

func appendBytesField(buf []byte, fieldNum uint64, val []byte) []byte {
	if len(val) == 0 {
		return buf
	}
	buf = appendTag(buf, fieldNum, wireBytes)
	buf = binary.AppendUvarint(buf, uint64(len(val)))
	return append(buf, val...)
}

func (m *ContentMetaData) MarshalProto() []byte {
	var buf []byte
	buf = appendStringField(buf, 1, m.URL)
	buf = appendStringField(buf, 2, m.Filename)
	buf = appendStringField(buf, 3, m.Digest)
	buf = appendStringField(buf, 5, m.Email)
	buf = appendStringField(buf, 6, m.ContentType)
	buf = appendStringField(buf, 7, m.Source)
	buf = appendStringField(buf, 8, m.Destination)
	buf = appendStringField(buf, 9, m.TabTitle)
	buf = appendStringField(buf, 10, m.TabURL)
	buf = appendVarintField(buf, 18, m.FileSize)
	return buf
}

func (b *BrowserMetadata) MarshalProto() []byte {
	if b == nil {
		return nil
	}
	var buf []byte
	buf = appendStringField(buf, 1, b.BrowserID)
	buf = appendStringField(buf, 2, b.UserAgent)
	buf = appendStringField(buf, 3, b.ChromeVersion)
	buf = appendStringField(buf, 4, b.MachineUser)
	return buf
}

func (d *DeviceMetadata) MarshalProto() []byte {
	if d == nil {
		return nil
	}
	var buf []byte
	buf = appendStringField(buf, 1, d.DMToken)
	buf = appendStringField(buf, 2, d.ClientID)
	buf = appendStringField(buf, 3, d.OSVersion)
	buf = appendStringField(buf, 4, d.OSPlatform)
	buf = appendStringField(buf, 5, d.Name)
	buf = appendStringField(buf, 6, d.DeviceFQDN)
	return buf
}

func (p *ProfileMetadata) MarshalProto() []byte {
	if p == nil {
		return nil
	}
	var buf []byte
	buf = appendStringField(buf, 1, p.DMToken)
	buf = appendStringField(buf, 2, p.GaiaEmail)
	buf = appendStringField(buf, 3, p.ProfilePath)
	buf = appendStringField(buf, 4, p.ProfileName)
	buf = appendStringField(buf, 5, p.ClientID)
	return buf
}

func (cm *ClientMetadata) MarshalProto() []byte {
	if cm == nil {
		return nil
	}
	var buf []byte
	buf = appendBytesField(buf, 1, cm.Browser.MarshalProto())
	buf = appendBytesField(buf, 2, cm.Device.MarshalProto())
	buf = appendBytesField(buf, 3, cm.Profile.MarshalProto())
	return buf
}

// MarshalProto serializes ContentAnalysisRequest into wire-compatible Protobuf bytes.
func (req *ContentAnalysisRequest) MarshalProto() []byte {
	var buf []byte
	buf = appendStringField(buf, 1, req.DMToken)
	buf = appendStringField(buf, 5, req.RequestToken)
	buf = appendVarintField(buf, 9, uint64(req.AnalysisConnector))
	buf = appendBytesField(buf, 10, req.RequestData.MarshalProto())
	for _, tag := range req.Tags {
		buf = appendStringField(buf, 11, tag)
	}
	if req.ClientMetadata != nil {
		buf = appendBytesField(buf, 12, req.ClientMetadata.MarshalProto())
	}
	if req.ExpiresAt > 0 {
		buf = appendVarintField(buf, 15, uint64(req.ExpiresAt))
	}
	buf = appendStringField(buf, 16, req.UserActionID)
	if req.UserActionRequestsCount > 0 {
		buf = appendVarintField(buf, 17, uint64(req.UserActionRequestsCount))
	}
	buf = appendVarintField(buf, 19, uint64(req.Reason))
	if req.Blocking {
		buf = appendVarintField(buf, 20, 1)
	}
	return buf
}

// MarshalProto serializes ContentAnalysisResponse (used by tests and mock servers).
func (resp *ContentAnalysisResponse) MarshalProto() []byte {
	var buf []byte
	buf = appendStringField(buf, 1, resp.RequestToken)
	for _, res := range resp.Results {
		var resBuf []byte
		resBuf = appendStringField(resBuf, 1, res.Tag)
		resBuf = appendVarintField(resBuf, 2, uint64(res.Status))
		for _, tr := range res.TriggeredRules {
			var trBuf []byte
			trBuf = appendVarintField(trBuf, 1, uint64(tr.Action))
			trBuf = appendStringField(trBuf, 2, tr.RuleName)
			trBuf = appendStringField(trBuf, 3, tr.RuleID)
			trBuf = appendStringField(trBuf, 5, tr.URLCategory)
			if len(tr.MessageSegments) > 0 {
				var msgBuf []byte
				for _, seg := range tr.MessageSegments {
					var segBuf []byte
					segBuf = appendStringField(segBuf, 1, seg.Text)
					segBuf = appendStringField(segBuf, 2, seg.Link)
					msgBuf = appendBytesField(msgBuf, 1, segBuf)
				}
				trBuf = appendBytesField(trBuf, 6, msgBuf)
			}
			resBuf = appendBytesField(resBuf, 3, trBuf)
		}
		// In webprotect.proto / connectors.proto, results is field 4 (or field 2 in legacy).
		// We emit field 4 and UnmarshalProto accepts both field 2 and field 4.
		buf = appendBytesField(buf, 4, resBuf)
	}
	return buf
}

// UnmarshalContentAnalysisResponse parses wire-format Protobuf bytes into ContentAnalysisResponse.
func UnmarshalContentAnalysisResponse(data []byte) (*ContentAnalysisResponse, error) {
	resp := &ContentAnalysisResponse{}
	pos := 0
	for pos < len(data) {
		tag, n := binary.Uvarint(data[pos:])
		if n <= 0 {
			return nil, fmt.Errorf("invalid protobuf tag at offset %d", pos)
		}
		pos += n
		fieldNum := tag >> 3
		wireType := tag & 0x7

		switch wireType {
		case wireVarint:
			_, vn := binary.Uvarint(data[pos:])
			if vn <= 0 {
				return nil, fmt.Errorf("invalid varint at offset %d", pos)
			}
			pos += vn
		case wireBytes:
			length, ln := binary.Uvarint(data[pos:])
			if ln <= 0 || pos+ln+int(length) > len(data) {
				return nil, fmt.Errorf("invalid length-delimited field %d at offset %d", fieldNum, pos)
			}
			pos += ln
			fieldBytes := data[pos : pos+int(length)]
			pos += int(length)

			switch fieldNum {
			case 1:
				resp.RequestToken = string(fieldBytes)
			case 2, 4: // Result message (field 4 in connectors.proto / webprotect.proto)
				res, err := parseResultProto(fieldBytes)
				if err != nil {
					return nil, err
				}
				resp.Results = append(resp.Results, res)
			}
		default:
			pos, err := skipWireValue(data, pos, wireType)
			if err != nil {
				return nil, err
			}
			_ = pos
		}
	}
	return resp, nil
}

func parseResultProto(data []byte) (Result, error) {
	var res Result
	pos := 0
	for pos < len(data) {
		tag, n := binary.Uvarint(data[pos:])
		if n <= 0 {
			return res, fmt.Errorf("invalid Result tag at %d", pos)
		}
		pos += n
		fieldNum := tag >> 3
		wireType := tag & 0x7

		switch wireType {
		case wireVarint:
			val, vn := binary.Uvarint(data[pos:])
			if vn <= 0 {
				return res, fmt.Errorf("invalid Result varint at %d", pos)
			}
			pos += vn
			if fieldNum == 2 {
				res.Status = ResultStatus(val)
			}
		case wireBytes:
			length, ln := binary.Uvarint(data[pos:])
			if ln <= 0 || pos+ln+int(length) > len(data) {
				return res, fmt.Errorf("invalid Result bytes at %d", pos)
			}
			pos += ln
			fieldBytes := data[pos : pos+int(length)]
			pos += int(length)

			switch fieldNum {
			case 1:
				res.Tag = string(fieldBytes)
			case 3:
				tr, err := parseTriggeredRuleProto(fieldBytes)
				if err != nil {
					return res, err
				}
				res.TriggeredRules = append(res.TriggeredRules, tr)
			}
		default:
			var err error
			pos, err = skipWireValue(data, pos, wireType)
			if err != nil {
				return res, err
			}
		}
	}
	return res, nil
}

func parseTriggeredRuleProto(data []byte) (TriggeredRule, error) {
	var tr TriggeredRule
	pos := 0
	for pos < len(data) {
		tag, n := binary.Uvarint(data[pos:])
		if n <= 0 {
			return tr, fmt.Errorf("invalid TriggeredRule tag at %d", pos)
		}
		pos += n
		fieldNum := tag >> 3
		wireType := tag & 0x7

		switch wireType {
		case wireVarint:
			val, vn := binary.Uvarint(data[pos:])
			if vn <= 0 {
				return tr, fmt.Errorf("invalid TriggeredRule varint at %d", pos)
			}
			pos += vn
			if fieldNum == 1 {
				tr.Action = TriggeredRuleAction(val)
			}
		case wireBytes:
			length, ln := binary.Uvarint(data[pos:])
			if ln <= 0 || pos+ln+int(length) > len(data) {
				return tr, fmt.Errorf("invalid TriggeredRule bytes at %d", pos)
			}
			pos += ln
			fieldBytes := data[pos : pos+int(length)]
			pos += int(length)

			switch fieldNum {
			case 2:
				tr.RuleName = string(fieldBytes)
			case 3:
				tr.RuleID = string(fieldBytes)
			case 5:
				tr.URLCategory = string(fieldBytes)
			case 6:
				segs, err := parseCustomRuleMessageProto(fieldBytes)
				if err != nil {
					return tr, err
				}
				tr.MessageSegments = append(tr.MessageSegments, segs...)
			}
		default:
			var err error
			pos, err = skipWireValue(data, pos, wireType)
			if err != nil {
				return tr, err
			}
		}
	}
	return tr, nil
}

func parseCustomRuleMessageProto(data []byte) ([]CustomRuleMessageSegment, error) {
	var segs []CustomRuleMessageSegment
	pos := 0
	for pos < len(data) {
		tag, n := binary.Uvarint(data[pos:])
		if n <= 0 {
			return nil, fmt.Errorf("invalid CustomRuleMessage tag at %d", pos)
		}
		pos += n
		fieldNum := tag >> 3
		wireType := tag & 0x7
		if wireType == wireBytes {
			length, ln := binary.Uvarint(data[pos:])
			if ln <= 0 || pos+ln+int(length) > len(data) {
				return nil, fmt.Errorf("invalid CustomRuleMessage bytes at %d", pos)
			}
			pos += ln
			fieldBytes := data[pos : pos+int(length)]
			pos += int(length)
			if fieldNum == 1 {
				seg, err := parseSegmentProto(fieldBytes)
				if err != nil {
					return nil, err
				}
				segs = append(segs, seg)
			}
		} else {
			var err error
			pos, err = skipWireValue(data, pos, wireType)
			if err != nil {
				return nil, err
			}
		}
	}
	return segs, nil
}

func parseSegmentProto(data []byte) (CustomRuleMessageSegment, error) {
	var seg CustomRuleMessageSegment
	pos := 0
	for pos < len(data) {
		tag, n := binary.Uvarint(data[pos:])
		if n <= 0 {
			return seg, fmt.Errorf("invalid Segment tag at %d", pos)
		}
		pos += n
		fieldNum := tag >> 3
		wireType := tag & 0x7
		if wireType == wireBytes {
			length, ln := binary.Uvarint(data[pos:])
			if ln <= 0 || pos+ln+int(length) > len(data) {
				return seg, fmt.Errorf("invalid Segment bytes at %d", pos)
			}
			pos += ln
			fieldBytes := data[pos : pos+int(length)]
			pos += int(length)
			switch fieldNum {
			case 1:
				seg.Text = string(fieldBytes)
			case 2:
				seg.Link = string(fieldBytes)
			}
		} else {
			var err error
			pos, err = skipWireValue(data, pos, wireType)
			if err != nil {
				return seg, err
			}
		}
	}
	return seg, nil
}

func skipWireValue(data []byte, pos int, wireType uint64) (int, error) {
	switch wireType {
	case 0: // varint
		_, n := binary.Uvarint(data[pos:])
		if n <= 0 {
			return 0, fmt.Errorf("corrupt varint at %d", pos)
		}
		return pos + n, nil
	case 1: // 64-bit
		if pos+8 > len(data) {
			return 0, fmt.Errorf("corrupt 64-bit field at %d", pos)
		}
		return pos + 8, nil
	case 2: // length-delimited
		l, n := binary.Uvarint(data[pos:])
		if n <= 0 || pos+n+int(l) > len(data) {
			return 0, fmt.Errorf("corrupt bytes field at %d", pos)
		}
		return pos + n + int(l), nil
	case 5: // 32-bit
		if pos+4 > len(data) {
			return 0, fmt.Errorf("corrupt 32-bit field at %d", pos)
		}
		return pos + 4, nil
	default:
		return 0, fmt.Errorf("unsupported wire type %d at %d", wireType, pos)
	}
}
