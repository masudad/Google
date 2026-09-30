// Package proxy implements the Smart Local HTTPS MITM Proxy with Process/Payload Pre-filtering,
// Quota Rate Limiting, TLS Pinning Auto-Bypass, and AI/Multipart Payload Extraction.
package proxy

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// CertificateAuthority manages the local Root CA and dynamically mints leaf TLS certificates
// per target hostname for HTTPS POST inspection.
type CertificateAuthority struct {
	RootCert    *x509.Certificate
	RootKey     *ecdsa.PrivateKey
	RootCertPEM []byte
	CertPath    string
	KeyPath     string

	mu        sync.RWMutex
	leafCache map[string]*tls.Certificate
}

// LoadOrCreateCA loads an existing Root CA from configDir or generates a new ECDSA P-256 Root CA.
func LoadOrCreateCA(configDir string) (*CertificateAuthority, error) {
	if configDir == "" {
		home, _ := os.UserHomeDir()
		configDir = filepath.Join(home, ".cep-local-dlp-agent")
	}
	if err := os.MkdirAll(configDir, 0o700); err != nil {
		return nil, fmt.Errorf("create CA dir: %w", err)
	}

	certPath := filepath.Join(configDir, "cep-local-root-ca.crt")
	keyPath := filepath.Join(configDir, "cep-local-root-ca.key")

	if certPEM, err := os.ReadFile(certPath); err == nil {
		if keyPEM, err := os.ReadFile(keyPath); err == nil {
			if ca, err := parseCA(certPEM, keyPEM, certPath, keyPath); err == nil {
				return ca, nil
			}
		}
	}

	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("generate root key: %w", err)
	}

	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	tmpl := &x509.Certificate{
		SerialNumber: serial,
		Subject: pkix.Name{
			Organization: []string{"Chrome Enterprise Premium Local DLP Agent"},
			CommonName:   "CEP Local DLP Agent Root CA",
		},
		NotBefore:             time.Now().Add(-1 * time.Hour),
		NotAfter:              time.Now().AddDate(5, 0, 0),
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign | x509.KeyUsageDigitalSignature,
		BasicConstraintsValid: true,
		IsCA:                  true,
		MaxPathLen:            1,
	}

	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &priv.PublicKey, priv)
	if err != nil {
		return nil, fmt.Errorf("create root cert: %w", err)
	}
	rootCert, err := x509.ParseCertificate(der)
	if err != nil {
		return nil, err
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	keyBytes, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return nil, err
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyBytes})

	_ = os.WriteFile(certPath, certPEM, 0o644)
	_ = os.WriteFile(keyPath, keyPEM, 0o600)

	return &CertificateAuthority{
		RootCert:    rootCert,
		RootKey:     priv,
		RootCertPEM: certPEM,
		CertPath:    certPath,
		KeyPath:     keyPath,
		leafCache:   make(map[string]*tls.Certificate),
	}, nil
}

func parseCA(certPEM, keyPEM []byte, certPath, keyPath string) (*CertificateAuthority, error) {
	cb, _ := pem.Decode(certPEM)
	if cb == nil {
		return nil, fmt.Errorf("invalid cert PEM")
	}
	rootCert, err := x509.ParseCertificate(cb.Bytes)
	if err != nil {
		return nil, err
	}
	kb, _ := pem.Decode(keyPEM)
	if kb == nil {
		return nil, fmt.Errorf("invalid key PEM")
	}
	rootKey, err := x509.ParseECPrivateKey(kb.Bytes)
	if err != nil {
		return nil, err
	}
	return &CertificateAuthority{
		RootCert:    rootCert,
		RootKey:     rootKey,
		RootCertPEM: certPEM,
		CertPath:    certPath,
		KeyPath:     keyPath,
		leafCache:   make(map[string]*tls.Certificate),
	}, nil
}

// GetCertificateForHost dynamically signs or returns a cached leaf certificate for the target host.
func (ca *CertificateAuthority) GetCertificateForHost(host string) (*tls.Certificate, error) {
	if h, _, err := net.SplitHostPort(host); err == nil && h != "" {
		host = h
	}

	ca.mu.RLock()
	if cert, ok := ca.leafCache[host]; ok {
		ca.mu.RUnlock()
		return cert, nil
	}
	ca.mu.RUnlock()

	leafKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}
	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	tmpl := &x509.Certificate{
		SerialNumber: serial,
		Subject: pkix.Name{
			Organization: []string{"CEP Local DLP Agent"},
			CommonName:   host,
		},
		NotBefore:   time.Now().Add(-10 * time.Minute),
		NotAfter:    time.Now().AddDate(1, 0, 0),
		KeyUsage:    x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	if ip := net.ParseIP(host); ip != nil {
		tmpl.IPAddresses = []net.IP{ip}
	} else {
		tmpl.DNSNames = []string{host}
	}

	der, err := x509.CreateCertificate(rand.Reader, tmpl, ca.RootCert, &leafKey.PublicKey, ca.RootKey)
	if err != nil {
		return nil, err
	}

	tlsCert := &tls.Certificate{
		Certificate: [][]byte{der, ca.RootCert.Raw},
		PrivateKey:  leafKey,
	}

	ca.mu.Lock()
	if len(ca.leafCache) > 2048 {
		ca.leafCache = make(map[string]*tls.Certificate)
	}
	ca.leafCache[host] = tlsCert
	ca.mu.Unlock()

	return tlsCert, nil
}
