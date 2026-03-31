package ssh

import (
	"bufio"
	"fmt"
	"os"

	"golang.org/x/crypto/ssh"
)

type Client struct {
	Config *ssh.ClientConfig
	Host   string
	Port   int
}

func NewSSHClient(user, host, keyPath string, port int) (*Client, error) {
	key, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read private key: %v", err)
	}

	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, fmt.Errorf("unable to parse private key: %v", err)
	}

	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	return &Client{
		Config: config,
		Host:   host,
		Port:   port,
	}, nil
}

func (c *Client) ExecuteCommandStream(command string, outputChan chan<- string) error {
	addr := fmt.Sprintf("%s:%d", c.Host, c.Port)
	client, err := ssh.Dial("tcp", addr, c.Config)
	if err != nil {
		return fmt.Errorf("failed to dial: %v", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create session: %v", err)
	}
	defer session.Close()

	stdout, err := session.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdout pipe: %v", err)
	}
	stderr, err := session.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to get stderr pipe: %v", err)
	}

	if err := session.Start(command); err != nil {
		return fmt.Errorf("failed to start command: %v", err)
	}

	// Scanner for stdout
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			outputChan <- scanner.Text()
		}
	}()

	// Scanner for stderr
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			outputChan <- "ERROR: " + scanner.Text()
		}
	}()

	return session.Wait()
}

func (c *Client) ExecuteCommand(command string) (string, error) {
	addr := fmt.Sprintf("%s:%d", c.Host, c.Port)
	client, err := ssh.Dial("tcp", addr, c.Config)
	if err != nil {
		return "", fmt.Errorf("failed to dial: %v", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %v", err)
	}
	defer session.Close()

	b, err := session.CombinedOutput(command)
	if err != nil {
		return string(b), fmt.Errorf("command failed: %v, output: %s", err, string(b))
	}
	return string(b), nil
}
