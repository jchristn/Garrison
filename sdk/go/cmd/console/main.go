// Console provides an interactive Garrison SDK shell. Credentials are prompted without terminal echo.
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	garrison "github.com/jchristn/Garrison/sdk/go"
	"golang.org/x/term"
	"os"
	"os/signal"
	"strings"
)

func main() {
	base := "http://127.0.0.1:8700"
	if len(os.Args) > 1 {
		base = os.Args[1]
	}
	client := garrison.NewClient(base)
	input := bufio.NewScanner(os.Stdin)
	input.Buffer(make([]byte, 4096), 8*1024*1024)
	terminal := term.IsTerminal(int(os.Stdin.Fd()))
	secret := func(prompt string) (string, error) {
		if terminal {
			fmt.Print(prompt)
			value, err := term.ReadPassword(int(os.Stdin.Fd()))
			fmt.Println()
			return string(value), err
		}
		if !input.Scan() {
			return "", fmt.Errorf("credential input ended")
		}
		return input.Text(), nil
	}
	fmt.Println("Garrison SDK console. Type help; Ctrl+C cancels the active request or stream.")
	for {
		if terminal {
			fmt.Print("garrison> ")
		}
		if !input.Scan() {
			break
		}
		line := strings.TrimSpace(input.Text())
		if line == "" {
			continue
		}
		command, tail, _ := strings.Cut(line, " ")
		argument, rest, _ := strings.Cut(strings.TrimSpace(tail), " ")
		command = strings.ToLower(command)
		if command == "quit" || command == "exit" {
			break
		}
		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
		value, err := execute(ctx, client, command, argument, strings.TrimSpace(rest), secret)
		stop()
		if err != nil {
			fmt.Println("Error:", err)
		} else if value != nil {
			_ = json.NewEncoder(os.Stdout).Encode(value)
		}
	}
	if err := input.Err(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func execute(ctx context.Context, client *garrison.Client, command, argument, rest string, secret func(string) (string, error)) (any, error) {
	needsArgument := command == "login" || command == "tenant" || command == "invoke" || command == "run" || command == "events" || command == "watch"
	if needsArgument && argument == "" {
		return nil, fmt.Errorf("missing arguments; type help")
	}
	switch command {
	case "help":
		fmt.Println("health | login <tenant> <email> | keys | tenant <id> | agents | runs | invoke <agent> <input> | run <id> | events <id> | watch <id> | quit")
		return nil, nil
	case "health":
		return client.Health(ctx)
	case "login":
		if rest == "" {
			return nil, fmt.Errorf("missing email; type help")
		}
		password, err := secret("Password: ")
		if err != nil {
			return nil, err
		}
		if _, err = client.Login(ctx, rest, password, argument); err != nil {
			return nil, err
		}
		fmt.Println("Signed in. Tenant:", client.TenantID)
		return nil, nil
	case "keys":
		access, err := secret("Access key: ")
		if err != nil {
			return nil, err
		}
		key, err := secret("Secret key: ")
		if err != nil {
			return nil, err
		}
		if _, err = client.LoginWithKeys(ctx, access, key); err != nil {
			return nil, err
		}
		fmt.Println("Signed in. Tenant:", client.TenantID)
		return nil, nil
	case "tenant":
		client.TenantID = argument
		return nil, nil
	case "agents":
		var out garrison.EnumerationResult[garrison.Agent]
		err := client.Agents.List(ctx, nil, &out)
		return out, err
	case "runs":
		return client.Runs.List(ctx, garrison.RunFilter{})
	case "invoke":
		if rest == "" {
			return nil, fmt.Errorf("missing input; type help")
		}
		return client.Agents.Invoke(ctx, argument, garrison.InvokeRequest{Input: rest, Wait: false})
	case "run":
		return client.Runs.Get(ctx, argument)
	case "events":
		return client.Runs.Events(ctx, argument, 0, 500)
	case "watch":
		return nil, client.Runs.Stream(ctx, argument, 0, func(frame garrison.RunStreamItem) bool { _ = json.NewEncoder(os.Stdout).Encode(frame); return true })
	default:
		return nil, fmt.Errorf("unknown command; type help")
	}
}
