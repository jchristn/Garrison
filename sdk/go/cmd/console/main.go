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
	needsArgument := command == "login" || command == "tenant" || command == "invoke" || command == "run" || command == "events" || command == "watch" || command == "start-pipeline" || command == "fire-trigger" || command == "apply" || command == "studio-draft" || command == "chat"
	if needsArgument && argument == "" {
		return nil, fmt.Errorf("missing arguments; type help")
	}
	switch command {
	case "help":
		fmt.Println("health | login <tenant> <email> | keys | tenant <id> | agents | runs | invoke <agent> <input> | run <id> | events <id> | operations <id> | watch <id> | pipelines | pipeline-runs | pipeline-reviews | start-pipeline <pipeline> <input> | triggers | fire-trigger <trigger> | notification-endpoints | apply <file> | apps | studio-draft <app> | architect-prompts | architects | architect [prompt] | chat <slug> <message> | quit")
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
	case "operations":
		return client.Runs.Operations(ctx, argument)
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
	case "triggers":
		return client.Triggers.List(ctx, nil, "")
	case "fire-trigger":
		return client.Triggers.Fire(ctx, argument, nil)
	case "notification-endpoints":
		var endpoints garrison.EnumerationResult[garrison.NotificationEndpoint]
		err := client.NotificationEndpoints.List(ctx, nil, &endpoints)
		return endpoints, err
	case "pipelines":
		var out garrison.EnumerationResult[garrison.Pipeline]
		err := client.Pipelines.List(ctx, nil, &out)
		return out, err
	case "pipeline-runs":
		return client.PipelineRuns.List(ctx, garrison.PipelineRunFilter{})
	case "pipeline-reviews":
		return client.PipelineReviews.List(ctx, garrison.PipelineReviewFilter{})
	case "start-pipeline":
		if rest == "" {
			return nil, fmt.Errorf("missing input; type help")
		}
		return client.Pipelines.Start(ctx, argument, garrison.PipelineStartRequest{Input: rest}, "")
	case "apply":
		content, err := os.ReadFile(argument)
		if err != nil {
			return nil, err
		}
		applied, err := client.Manifests.Apply(ctx, string(content), false, false)
		if err != nil {
			return nil, err
		}
		return map[string]any{"id": applied.ID, "documentCount": applied.DocumentCount, "createdCount": applied.CreatedCount, "updatedCount": applied.UpdatedCount, "unchangedCount": applied.UnchangedCount, "failedCount": applied.FailedCount}, nil
	case "apps":
		return client.Apps.List(ctx, nil)
	case "studio-draft":
		return client.StudioDrafts.Create(ctx, "Console draft of "+argument, argument)
	case "architect-prompts":
		prompts, err := client.StudioDrafts.ArchitectPrompts(ctx, nil)
		if err != nil {
			return nil, err
		}
		for _, entry := range prompts.Objects {
			_ = json.NewEncoder(os.Stdout).Encode(entry)
		}
		return nil, nil
	case "architects":
		architects, err := client.StudioDrafts.Architects(ctx, nil)
		if err != nil {
			return nil, err
		}
		for _, entry := range architects.Objects {
			_ = json.NewEncoder(os.Stdout).Encode(entry)
		}
		return nil, nil
	case "architect":
		return selectArchitectPrompt(ctx, client, argument)
	case "chat":
		if rest == "" {
			return nil, fmt.Errorf("missing message; type help")
		}
		return chat(ctx, client, argument, rest)
	default:
		return nil, fmt.Errorf("unknown command; type help")
	}
}

const (
	architectDeployment = "agent-architect-sdk"
	fakeHarnessProfile  = "hrn_builtin_fake"
)

// selectArchitectPrompt selects an architect prompt (identifier or name; default the first listed, the built-in) for an
// agent architect, creating an architect on the fake harness when none exists.
func selectArchitectPrompt(ctx context.Context, client *garrison.Client, prompt string) (*garrison.ArchitectPromptSelection, error) {
	prompts, err := client.StudioDrafts.ArchitectPrompts(ctx, nil)
	if err != nil {
		return nil, err
	}
	if len(prompts.Objects) == 0 {
		return nil, fmt.Errorf("the server lists no architect prompts")
	}
	architects, err := client.StudioDrafts.Architects(ctx, &garrison.ListOptions{MaxResults: 1})
	if err != nil {
		return nil, err
	}
	architectID := ""
	if len(architects.Objects) > 0 {
		architectID = architects.Objects[0].ID
	} else {
		created, err := client.StudioDrafts.CreateArchitect(ctx, garrison.ArchitectRequest{Name: architectDeployment, HarnessProfileID: fakeHarnessProfile})
		if err != nil {
			return nil, err
		}
		architectID = created.ID
	}
	if prompt == "" {
		prompt = prompts.Objects[0].ID
	}
	return client.StudioDrafts.SetArchitectPrompt(ctx, architectID, prompt, nil)
}

// chat starts an anonymous session with the app, sends one message, waits for the turn, and ends the session.
func chat(ctx context.Context, client *garrison.Client, slug, message string) (*garrison.AppTurnView, error) {
	gateway := client.AppGateway(slug)
	if _, err := gateway.StartSession(ctx, "", ""); err != nil {
		return nil, err
	}
	started, err := gateway.StartConversation(ctx, message)
	if err != nil {
		return nil, err
	}
	if err := gateway.StreamTurn(ctx, started.ConversationID, started.Turn.RunID, 0, func(garrison.AppTurnStreamItem) bool { return true }); err != nil {
		return nil, err
	}
	turn, err := gateway.WaitForTurn(ctx, started.ConversationID, started.Turn.RunID)
	if err != nil {
		return nil, err
	}
	return turn, gateway.EndSession(ctx)
}
