package proxy

import (
	"bytes"
	"encoding/json"
	"io"
	"mime"
	"mime/multipart"
	"strings"

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

	// 3. Fallback: inspect raw body as text or binary attachment
	connector := webprotect.BulkDataEntry
	if isBinaryMediaType(mediaType) {
		connector = webprotect.FileAttached
	}
	if mediaType == "" {
		mediaType = "text/plain"
	}
	return []ExtractedItem{
		{
			Connector:   connector,
			ContentType: mediaType,
			Payload:     body,
		},
	}
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
