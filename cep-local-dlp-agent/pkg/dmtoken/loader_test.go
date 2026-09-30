package dmtoken

import (
	"testing"
	"time"
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
	//   field 8 (device_id)     = "client-uuid-9876"
	var policyData []byte
	policyData = append(policyData, encodeTestLengthDelimitedField(1, []byte("google/chrome/user"))...)
	policyData = append(policyData, encodeTestLengthDelimitedField(3, []byte("AGYD5WM_managed_profile_dm_token_12345"))...)
	policyData = append(policyData, encodeTestLengthDelimitedField(7, []byte("user@workspace.example.com"))...)
	policyData = append(policyData, encodeTestLengthDelimitedField(8, []byte("client-uuid-9876"))...)

	// Wrap inside enterprise_management.PolicyFetchResponse proto:
	//   field 3 (policy_data) = policyData
	policyFetchResponse := encodeTestLengthDelimitedField(3, policyData)

	gotToken, gotEmail, gotClientID := ExtractMetadataFromPolicyFetchResponse(policyFetchResponse)
	if gotToken != "AGYD5WM_managed_profile_dm_token_12345" {
		t.Fatalf("expected request_token %q, got %q", "AGYD5WM_managed_profile_dm_token_12345", gotToken)
	}
	if gotEmail != "user@workspace.example.com" {
		t.Fatalf("expected username %q, got %q", "user@workspace.example.com", gotEmail)
	}
	if gotClientID != "client-uuid-9876" {
		t.Fatalf("expected device_id %q, got %q", "client-uuid-9876", gotClientID)
	}
}

func TestSelectProfileCandidateIsDeterministic(t *testing.T) {
	base := time.Date(2026, 9, 30, 0, 0, 0, 0, time.UTC)
	cands := []ProfileCandidate{
		{ProfileDir: "Profile 11", UserEmail: "user@tenant-b.example", DMToken: "tok-cbcmdev", LastUpdated: base.Add(-2 * time.Hour)},
		{ProfileDir: "Profile 16", UserEmail: "admin@tenant-a.example", DMToken: "tok-admin", LastUpdated: base.Add(-1 * time.Hour)},
		{ProfileDir: "Profile 8", UserEmail: "stela@tenant-a.example", DMToken: "tok-stela", LastUpdated: base, IsLastUsed: true},
	}

	// 1. Pinned exact email wins over everything.
	if c, _ := SelectProfileCandidate(cands, "admin@tenant-a.example"); c.DMToken != "tok-admin" {
		t.Fatalf("pinned email: got %s", c.ProfileDir)
	}
	// 2. Pinned "@domain" picks the first profile in that tenant.
	if c, _ := SelectProfileCandidate(cands, "@tenant-a.example"); c.UserEmail == "user@tenant-b.example" {
		t.Fatalf("pinned domain must not select cbcmdev.com")
	}
	// 3. No pin -> Chrome's last-used profile, NOT lexicographic "Profile 11".
	if c, _ := SelectProfileCandidate(cands, ""); c.DMToken != "tok-stela" {
		t.Fatalf("last_used: got %s", c.ProfileDir)
	}
	// 4. No pin, no last_used -> most recently refreshed policy cache.
	for i := range cands {
		cands[i].IsLastUsed = false
	}
	if c, _ := SelectProfileCandidate(cands, ""); c.DMToken != "tok-stela" {
		t.Fatalf("newest mtime: got %s", c.ProfileDir)
	}
}
