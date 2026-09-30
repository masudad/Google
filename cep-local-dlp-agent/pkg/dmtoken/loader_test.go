package dmtoken

import (
	"testing"
)

func encodeTestLengthDelimitedField(fieldNum byte, payload []byte) []byte {
	tag := (fieldNum << 3) | 2
	out := []byte{tag, byte(len(payload))}
	return append(out, payload...)
}

func TestExtractDMTokenFromPolicyFetchResponse(t *testing.T) {
	// Build a serialized enterprise_management.PolicyData proto:
	//   field 1 (policy_type)   = "google/chrome/user"
	//   field 3 (request_token) = "AGYD5WM_managed_profile_dm_token_12345"
	//   field 7 (username)      = "user@workspace.example.com"
	var policyData []byte
	policyData = append(policyData, encodeTestLengthDelimitedField(1, []byte("google/chrome/user"))...)
	policyData = append(policyData, encodeTestLengthDelimitedField(3, []byte("AGYD5WM_managed_profile_dm_token_12345"))...)
	policyData = append(policyData, encodeTestLengthDelimitedField(7, []byte("user@workspace.example.com"))...)

	// Wrap inside enterprise_management.PolicyFetchResponse proto:
	//   field 3 (policy_data) = policyData
	policyFetchResponse := encodeTestLengthDelimitedField(3, policyData)

	gotToken, gotEmail := ExtractDMTokenFromPolicyFetchResponse(policyFetchResponse)
	if gotToken != "AGYD5WM_managed_profile_dm_token_12345" {
		t.Fatalf("expected request_token %q, got %q", "AGYD5WM_managed_profile_dm_token_12345", gotToken)
	}
	if gotEmail != "user@workspace.example.com" {
		t.Fatalf("expected username %q, got %q", "user@workspace.example.com", gotEmail)
	}
}
