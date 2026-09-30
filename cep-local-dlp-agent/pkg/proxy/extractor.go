package proxy

import (
	"bytes"
	"compress/flate"
	"compress/gzip"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/url"
	"sort"
	"strings"
	"unicode/utf8"

	"cep-local-dlp-agent/pkg/webprotect"
)

// ExtractedItem represents a discrete text prompt or file attachment extracted from an outbound HTTP request.
type ExtractedItem struct {
	Connector   webprotect.AnalysisConnector
	Filename    string
	ContentType string
	Payload     []byte
}

// jsonMetadataKeys are JSON field names that carry protocol identifiers, UUIDs, model names,
// or telemetry metadata rather than user-authored prompts or documents.
var jsonMetadataKeys = map[string]bool{
	"id":                true,
	"uuid":              true,
	"conversation_id":   true,
	"conversation_uuid": true,
	"parent_message_id": true,
	"message_id":        true,
	"organization_uuid": true,
	"project_uuid":      true,
	"workspace_id":      true,
	"session_id":        true,
	"request_id":        true,
	"trace_id":          true,
	"span_id":           true,
	"client_id":         true,
	"device_id":         true,
	"user_id":           true,
	"account_id":        true,
	"model":             true,
	"role":              true,
	"type":              true,
	"object":            true,
	"stream":            true,
	"timezone":          true,
	"locale":            true,
	"event":             true,
	"event_name":        true,
	"status":            true,
	"version":           true,
	"platform":          true,
	"os":                true,
	"arch":              true,
	"cursor":            true,
	"next_cursor":       true,
	"finish_reason":     true,
	"stop_reason":       true,
	"encoding":          true,
	"media_type":        true,
	"mime_type":         true,
	"content_type":      true,
	"created_at":        true,
	"updated_at":        true,
	"timestamp":         true,
	"access_token":      true,
	"refresh_token":     true,
	"session_token":     true,
	"csrf_token":        true,
	"auth_token":        true,
	"client_msg_id":     true,
	"thread_ts":         true,
	"ts":                true,
}

// DecompressBodyIfNeeded transparently decompresses HTTP request bodies that use
// Content-Encoding: gzip or deflate (common in AI CLI tools, SDKs, and Electron apps)
// capped at webprotect.MaxPayloadBytes to prevent zip-bomb memory exhaustion.
func DecompressBodyIfNeeded(contentEncoding string, body []byte) []byte {
	if len(body) == 0 {
		return body
	}
	enc := strings.ToLower(strings.TrimSpace(contentEncoding))
	switch enc {
	case "gzip", "x-gzip":
		gr, err := gzip.NewReader(bytes.NewReader(body))
		if err != nil {
			return body
		}
		defer gr.Close()
		out, err := io.ReadAll(io.LimitReader(gr, webprotect.MaxPayloadBytes))
		if err != nil || len(out) == 0 {
			return body
		}
		return out
	case "deflate":
		fr := flate.NewReader(bytes.NewReader(body))
		defer fr.Close()
		out, err := io.ReadAll(io.LimitReader(fr, webprotect.MaxPayloadBytes))
		if err != nil || len(out) == 0 {
			return body
		}
		return out
	default:
		return body
	}
}

// ExtractInspectableItems parses an HTTP request body according to its Content-Type:
// - multipart/form-data: extracts uploaded files (FILE_ATTACHED) and text fields (BULK_DATA_ENTRY)
// - application/json: extracts AI/IDE prompts, short typed secrets, and base64-embedded files/images
// - other text/binary types: inspects the body directly
func ExtractInspectableItems(contentTypeHeader string, body []byte, minBytes int) []ExtractedItem {
	if len(body) == 0 {
		return nil
	}
	mediaType, params, err := mime.ParseMediaType(contentTypeHeader)
	if err != nil {
		mediaType = strings.ToLower(strings.TrimSpace(contentTypeHeader))
	}

	// 1. Multipart file uploads (Slack, Webmail, REST file uploads)
	if strings.HasPrefix(mediaType, "multipart/form-data") && params["boundary"] != "" {
		if items := extractMultipartItems(params["boundary"], body, minBytes); len(items) > 0 {
			return items
		}
	}

	// 2. JSON API payloads (Cursor, Claude Desktop, Codex, OpenAI, Gemini, Slack chat.postMessage, Graph API mail)
	if strings.Contains(mediaType, "json") || (len(body) > 0 && (body[0] == '{' || body[0] == '[')) {
		if items, validJSON := extractJSONItems(body); validJSON {
			return items
		}
	}

	// 3. Fallback: classify the raw body.
	if mediaType == "" {
		mediaType = "text/plain"
	}
	if isOpaqueRPCMediaType(mediaType) {
		return nil
	}
	if name, ok := sniffDocumentType(mediaType, body); ok {
		return []ExtractedItem{
			{
				Connector:   webprotect.FileAttached,
				Filename:    name,
				ContentType: mediaType,
				Payload:     body,
			},
		}
	}
	if !isBinaryMediaType(mediaType) || looksLikeText(body) {
		if strings.Contains(mediaType, "urlencoded") {
			if decoded := decodeFormURLEncoded(body); len(decoded) >= 4 {
				body = decoded
			}
		}
		return []ExtractedItem{
			{
				Connector:   webprotect.BulkDataEntry,
				ContentType: "text/plain",
				Payload:     body,
			},
		}
	}
	return nil
}

// isOpaqueRPCMediaType reports binary RPC framings that CEP text/file detectors cannot parse.
func isOpaqueRPCMediaType(mediaType string) bool {
	return strings.Contains(mediaType, "protobuf") ||
		strings.Contains(mediaType, "grpc") ||
		strings.Contains(mediaType, "x-gwt-rpc") ||
		strings.Contains(mediaType, "msgpack") ||
		strings.Contains(mediaType, "x-thrift")
}

// sniffDocumentType returns a synthetic filename and true if the media type or leading magic bytes
// identify a real document/archive/image that CEP file-type detectors understand.
func sniffDocumentType(mediaType string, body []byte) (string, bool) {
	switch {
	case mediaType == "application/pdf":
		return "upload.pdf", true
	case strings.HasPrefix(mediaType, "image/"):
		ext := strings.TrimPrefix(mediaType, "image/")
		if idx := strings.IndexByte(ext, '+'); idx > 0 {
			ext = ext[:idx]
		}
		return "upload." + ext, true
	case strings.HasPrefix(mediaType, "application/vnd.openxmlformats-officedocument."):
		return "upload.office", true
	case strings.HasPrefix(mediaType, "application/vnd.ms-"),
		mediaType == "application/msword",
		mediaType == "application/zip",
		mediaType == "application/x-zip-compressed",
		mediaType == "application/x-7z-compressed",
		mediaType == "application/x-rar-compressed",
		mediaType == "application/vnd.rar",
		mediaType == "application/gzip",
		mediaType == "application/x-tar",
		mediaType == "application/x-bzip2":
		return "upload.bin", true
	}
	if len(body) < 4 {
		return "", false
	}
	switch {
	case bytes.HasPrefix(body, []byte("%PDF")):
		return "upload.pdf", true
	case bytes.HasPrefix(body, []byte{0x50, 0x4B, 0x03, 0x04}):
		return "upload.zip", true
	case bytes.HasPrefix(body, []byte{0xD0, 0xCF, 0x11, 0xE0}):
		return "upload.doc", true
	case bytes.HasPrefix(body, []byte{0x89, 'P', 'N', 'G'}):
		return "upload.png", true
	case bytes.HasPrefix(body, []byte{0xFF, 0xD8, 0xFF}):
		return "upload.jpg", true
	case bytes.HasPrefix(body, []byte("GIF8")):
		return "upload.gif", true
	case bytes.HasPrefix(body, []byte{0x37, 0x7A, 0xBC, 0xAF}):
		return "upload.7z", true
	case bytes.HasPrefix(body, []byte("Rar!")):
		return "upload.rar", true
	case bytes.HasPrefix(body, []byte{0x1F, 0x8B}):
		return "upload.gz", true
	}
	return "", false
}

// looksLikeText samples the body and reports true when it is overwhelmingly printable UTF-8.
func looksLikeText(body []byte) bool {
	if len(body) == 0 {
		return false
	}
	sample := body
	if len(sample) > 4096 {
		sample = sample[:4096]
	}
	if !utf8.Valid(sample) && len(sample) == len(body) {
		return false
	}
	printable := 0
	for _, b := range sample {
		if b == '\n' || b == '\r' || b == '\t' || (b >= 0x20 && b != 0x7F) {
			printable++
		}
	}
	return printable*100 >= len(sample)*95
}

// decodeFormURLEncoded turns key=value&key2=value2 bodies into newline-separated plain text,
// ordered deterministically by key.
func decodeFormURLEncoded(body []byte) []byte {
	vals, err := url.ParseQuery(string(body))
	if err != nil || len(vals) == 0 {
		return body
	}
	keys := make([]string, 0, len(vals))
	for k := range vals {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var sb strings.Builder
	for _, k := range keys {
		for _, v := range vals[k] {
			if strings.TrimSpace(v) != "" {
				sb.WriteString(v)
				sb.WriteString("\n")
			}
		}
	}
	if sb.Len() == 0 {
		return body
	}
	return []byte(sb.String())
}

func extractMultipartItems(boundary string, body []byte, minBytes int) []ExtractedItem {
	mr := multipart.NewReader(bytes.NewReader(body), boundary)
	var items []ExtractedItem
	var textAccum strings.Builder

	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			break
		}
		data, err := io.ReadAll(part)
		_ = part.Close()
		if err != nil || len(data) == 0 {
			continue
		}

		filename := part.FileName()
		partType := part.Header.Get("Content-Type")
		if partType == "" {
			partType = "application/octet-stream"
		}

		if filename != "" {
			items = append(items, ExtractedItem{
				Connector:   webprotect.FileAttached,
				Filename:    filename,
				ContentType: partType,
				Payload:     data,
			})
		} else {
			textAccum.Write(data)
			textAccum.WriteString("\n")
		}
	}

	trimmed := strings.TrimSpace(textAccum.String())
	if len(trimmed) >= 4 && (len(trimmed) >= minBytes || len(items) > 0) {
		items = append(items, ExtractedItem{
			Connector:   webprotect.BulkDataEntry,
			ContentType: "text/plain",
			Payload:     []byte(trimmed),
		})
	}
	return items
}

// extractJSONItems recursively walks a JSON structure in deterministic key order and extracts:
// 1. Base64-encoded files/images (data:...;base64,... or raw base64 PDF/PNG/JPEG/Office payloads) as FILE_ATTACHED.
// 2. Non-metadata human/code text (including short typed secrets like 14-byte My Number or 16-byte Credit Card) as BULK_DATA_ENTRY.
func extractJSONItems(body []byte) ([]ExtractedItem, bool) {
	var root any
	if err := json.Unmarshal(body, &root); err != nil {
		return nil, false
	}
	var sb strings.Builder
	var attachments []ExtractedItem
	collectJSONValues(root, "", &sb, &attachments)

	var items []ExtractedItem
	items = append(items, attachments...)

	text := strings.TrimSpace(sb.String())
	// Emit any non-metadata human/code text >= 4 bytes (covers typed 12-digit My Number,
	// 16-digit credit card, or short sensitive code tokens) while still ignoring empty/UUID-only JSON.
	if len(text) >= 4 {
		items = append(items, ExtractedItem{
			Connector:   webprotect.BulkDataEntry,
			ContentType: "text/plain",
			Payload:     []byte(text),
		})
	}
	return items, true
}

func collectJSONValues(v any, key string, sb *strings.Builder, attachments *[]ExtractedItem) {
	switch val := v.(type) {
	case map[string]any:
		keys := make([]string, 0, len(val))
		for k := range val {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			collectJSONValues(val[k], strings.ToLower(k), sb, attachments)
		}
	case []any:
		for _, item := range val {
			collectJSONValues(item, key, sb, attachments)
		}
	case string:
		trimmed := strings.TrimSpace(val)
		if len(trimmed) == 0 {
			return
		}
		// Check if this string is a data:...;base64,... URI or raw base64 document/image
		if att, ok := tryDecodeBase64Attachment(trimmed, len(*attachments)+1); ok {
			*attachments = append(*attachments, att)
			return
		}
		if isMetadataJSONKey(key) && len(trimmed) < 64 {
			return
		}
		if isUUIDString(trimmed) || isISOTimestamp(trimmed) {
			return
		}
		sb.WriteString(val)
		sb.WriteString("\n")
	}
}

func isMetadataJSONKey(key string) bool {
	if jsonMetadataKeys[key] {
		return true
	}
	return strings.HasSuffix(key, "_id") ||
		strings.HasSuffix(key, "_uuid") ||
		strings.HasSuffix(key, "_at") ||
		strings.HasSuffix(key, "_time") ||
		strings.HasSuffix(key, "_token") ||
		strings.HasSuffix(key, "_version")
}

// tryDecodeBase64Attachment detects base64-encoded files and images embedded inside JSON requests
// (such as Anthropic/OpenAI/Gemini/Cursor multimodal attachments) and returns a FILE_ATTACHED item.
func tryDecodeBase64Attachment(s string, index int) (ExtractedItem, bool) {
	var mimeHint string
	b64Payload := s

	if strings.HasPrefix(s, "data:") {
		comma := strings.IndexByte(s, ',')
		if comma <= 5 {
			return ExtractedItem{}, false
		}
		header := s[5:comma]
		if !strings.Contains(header, ";base64") {
			return ExtractedItem{}, false
		}
		mimeHint = strings.TrimSuffix(header, ";base64")
		if semi := strings.IndexByte(mimeHint, ';'); semi >= 0 {
			mimeHint = mimeHint[:semi]
		}
		b64Payload = strings.TrimSpace(s[comma+1:])
	} else {
		// Fast prefix check for raw base64 strings representing known document/image magic bytes:
		// - "JVBERi0"     -> "%PDF-" (PDF document)
		// - "iVBORw0KGgo" -> "\x89PNG\r\n\x1a\n" (PNG image)
		// - "/9j/"        -> "\xFF\xD8\xFF" (JPEG image)
		// - "R0lGOD"      -> "GIF8" (GIF image)
		// - "UEsDB"       -> "PK\x03\x04" (ZIP / DOCX / XLSX / PPTX Office document)
		// - "0M8R4KGx"    -> "\xD0\xCF\x11\xE0" (Legacy DOC / XLS / PPT Office document)
		if len(s) < 24 || !hasKnownBase64MagicPrefix(s) {
			return ExtractedItem{}, false
		}
	}

	if len(b64Payload) == 0 || len(b64Payload) > (webprotect.MaxPayloadBytes*4/3)+4096 {
		return ExtractedItem{}, false
	}

	decoded, err := decodeBase64Flexible(b64Payload)
	if err != nil || len(decoded) < 4 {
		return ExtractedItem{}, false
	}

	filename, ok := sniffDocumentType(mimeHint, decoded)
	if !ok {
		if mimeHint != "" {
			filename = fmt.Sprintf("embedded_%d.bin", index)
		} else {
			return ExtractedItem{}, false
		}
	} else if index > 1 {
		filename = fmt.Sprintf("%d_%s", index, filename)
	}

	contentType := mimeHint
	if contentType == "" {
		contentType = inferMimeFromFilename(filename)
	}

	return ExtractedItem{
		Connector:   webprotect.FileAttached,
		Filename:    filename,
		ContentType: contentType,
		Payload:     decoded,
	}, true
}

func hasKnownBase64MagicPrefix(s string) bool {
	return strings.HasPrefix(s, "JVBERi0") ||
		strings.HasPrefix(s, "iVBORw0KGgo") ||
		strings.HasPrefix(s, "/9j/") ||
		strings.HasPrefix(s, "R0lGOD") ||
		strings.HasPrefix(s, "UEsDB") ||
		strings.HasPrefix(s, "0M8R4KGx")
}

func decodeBase64Flexible(s string) ([]byte, error) {
	// Strip optional whitespace/newlines inside base64 strings
	clean := strings.Map(func(r rune) rune {
		if r == '\n' || r == '\r' || r == ' ' || r == '\t' {
			return -1
		}
		return r
	}, s)
	if out, err := base64.StdEncoding.DecodeString(clean); err == nil {
		return out, nil
	}
	if out, err := base64.RawStdEncoding.DecodeString(clean); err == nil {
		return out, nil
	}
	if out, err := base64.URLEncoding.DecodeString(clean); err == nil {
		return out, nil
	}
	return base64.RawURLEncoding.DecodeString(clean)
}

func inferMimeFromFilename(filename string) string {
	switch {
	case strings.HasSuffix(filename, ".pdf"):
		return "application/pdf"
	case strings.HasSuffix(filename, ".png"):
		return "image/png"
	case strings.HasSuffix(filename, ".jpg"):
		return "image/jpeg"
	case strings.HasSuffix(filename, ".gif"):
		return "image/gif"
	case strings.HasSuffix(filename, ".zip"), strings.HasSuffix(filename, ".office"):
		return "application/zip"
	default:
		return "application/octet-stream"
	}
}

func isUUIDString(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i := 0; i < 36; i++ {
		c := s[i]
		if i == 8 || i == 13 || i == 18 || i == 23 {
			if c != '-' {
				return false
			}
			continue
		}
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

func isISOTimestamp(s string) bool {
	// Match RFC3339 / ISO-8601 timestamps such as "2026-09-30T15:12:38Z" or "2026-09-30T15:12:38.123+09:00"
	if len(s) < 20 || len(s) > 35 {
		return false
	}
	return s[4] == '-' && s[7] == '-' && (s[10] == 'T' || s[10] == ' ') && s[13] == ':' && s[16] == ':'
}

func isBinaryMediaType(mediaType string) bool {
	if strings.HasPrefix(mediaType, "text/") ||
		strings.Contains(mediaType, "json") ||
		strings.Contains(mediaType, "xml") ||
		strings.Contains(mediaType, "urlencoded") {
		return false
	}
	return mediaType != ""
}
