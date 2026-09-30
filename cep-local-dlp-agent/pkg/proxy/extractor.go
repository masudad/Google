package proxy

import (
	"bytes"
	"encoding/json"
	"io"
	"mime"
	"mime/multipart"
	"net/url"
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

// ExtractInspectableItems parses an HTTP request body according to its Content-Type:
// - multipart/form-data: extracts uploaded files (FILE_ATTACHED) and text fields (BULK_DATA_ENTRY)
// - application/json: extracts AI/IDE prompts & code context (OpenAI, Anthropic, Cursor, Gemini, Slack, etc.)
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

	// 2. JSON API payloads (Cursor, Claude Desktop, OpenAI, Gemini, Slack chat.postMessage, Graph API mail)
	if strings.Contains(mediaType, "json") || (len(body) > 0 && (body[0] == '{' || body[0] == '[')) {
		if text := extractJSONTextStrings(body); len(text) >= minBytes {
			return []ExtractedItem{
				{
					Connector:   webprotect.BulkDataEntry,
					ContentType: "text/plain",
					Payload:     []byte(text),
				},
			}
		}
	}

	// 3. Fallback: classify the raw body.
	//    - Recognised document/archive/image formats (by MIME type or magic bytes) => FILE_ATTACHED
	//    - Text-like bodies (form-urlencoded, XML, plain, or mostly printable octet-stream) => BULK_DATA_ENTRY
	//    - Opaque binary framing (protobuf, gRPC, unknown binary blobs) => not inspectable, skip
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
			if decoded := decodeFormURLEncoded(body); len(decoded) >= minBytes {
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
		return "upload." + strings.TrimPrefix(mediaType, "image/"), true
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

// looksLikeText samples the body and reports true when it is overwhelmingly printable UTF-8
// (so an octet-stream body that is really JSON/CSV/source code is still scanned as text).
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

// decodeFormURLEncoded turns key=value&key2=value2 bodies into newline-separated plain text.
func decodeFormURLEncoded(body []byte) []byte {
	vals, err := url.ParseQuery(string(body))
	if err != nil || len(vals) == 0 {
		return body
	}
	var sb strings.Builder
	for _, list := range vals {
		for _, v := range list {
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

	if textAccum.Len() >= minBytes {
		items = append(items, ExtractedItem{
			Connector:   webprotect.BulkDataEntry,
			ContentType: "text/plain",
			Payload:     []byte(textAccum.String()),
		})
	}
	return items
}

// extractJSONTextStrings recursively walks a JSON structure and concatenates human/code text values
// (such as "content", "prompt", "text", "body", "message", "input", "code") so CEP DLP detectors
// evaluate clean text without JSON escaping noise.
func extractJSONTextStrings(body []byte) string {
	var root any
	if err := json.Unmarshal(body, &root); err != nil {
		return string(body)
	}
	var sb strings.Builder
	collectJSONStrings(root, "", &sb)
	out := strings.TrimSpace(sb.String())
	if out == "" {
		return string(body)
	}
	return out
}

func collectJSONStrings(v any, key string, sb *strings.Builder) {
	switch val := v.(type) {
	case map[string]any:
		for k, child := range val {
			collectJSONStrings(child, strings.ToLower(k), sb)
		}
	case []any:
		for _, item := range val {
			collectJSONStrings(item, key, sb)
		}
	case string:
		// Skip metadata keys like model IDs, roles, or UUIDs unless the value itself is long
		switch key {
		case "role", "model", "id", "type", "object", "stream":
			if len(val) < 32 {
				return
			}
		}
		if len(strings.TrimSpace(val)) > 0 {
			sb.WriteString(val)
			sb.WriteString("\n")
		}
	}
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
