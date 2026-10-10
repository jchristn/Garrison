// Command testharness exercises the Garrison Go SDK end to end.
// Usage: go run ./cmd/testharness [baseUrl] [accessKey] [secretKey]
package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	garrison "github.com/jchristn/Garrison/sdk/go"
)

func main() {
	args := []string{"http://127.0.0.1:8700", "access_garrison_default", "secret_garrison_default_change_me"}
	copy(args, os.Args[1:])
	baseURL, accessKey, secretKey := args[0], args[1], args[2]
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	suffix := hex.EncodeToString(b)
	client := garrison.NewClient(baseURL)
	var tenant, fakeID, agentID, deploymentID string
	passed := 0
	var failures []string

	check := func(name string, fn func(ctx context.Context) error) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		started := time.Now()
		if err := fn(ctx); err != nil {
			failures = append(failures, name+": "+err.Error())
			fmt.Printf("FAIL  %s: %v\n", name, err)
			return
		}
		passed++
		fmt.Printf("PASS  %s (%dms)\n", name, time.Since(started).Milliseconds())
	}

	fmt.Printf("Garrison Go SDK harness against %s\n", baseURL)
	check("health", func(ctx context.Context) error {
		h, err := client.Health(ctx)
		if err == nil && h["status"] != "healthy" {
			err = fmt.Errorf("status %v", h["status"])
		}
		return err
	})
	check("token auth", func(ctx context.Context) error {
		issued, err := client.LoginWithKeys(ctx, accessKey, secretKey)
		if err != nil {
			return err
		}
		tenant = issued.TenantID
		d, err := client.TokenDetails(ctx)
		if err == nil && d["principalType"] != "Credential" {
			err = fmt.Errorf("principal %v", d["principalType"])
		}
		return err
	})
	check("signed request auth", func(ctx context.Context) error {
		signed := garrison.NewClient(baseURL)
		t := tenant
		if t == "" {
			t = "ten_default"
		}
		signed.UseSignedRequests(accessKey, secretKey, t)
		var page garrison.EnumerationResult[garrison.Agent]
		if err := signed.Agents.List(ctx, &garrison.ListOptions{MaxResults: 5}, &page); err != nil {
			return err
		}
		if !page.Success {
			return errors.New("list failed")
		}
		return nil
	})
	check("builtin harness profiles", func(ctx context.Context) error {
		profiles, err := client.HarnessProfiles.Builtin(ctx)
		if err != nil {
			return err
		}
		for _, p := range profiles {
			if p.Name == "builtin/fake" {
				fakeID = p.ID
				return nil
			}
		}
		return errors.New("builtin/fake not found")
	})
	check("create agent and deployment", func(ctx context.Context) error {
		var agent garrison.Agent
		if err := client.Agents.Create(ctx, garrison.Agent{Name: "sdk-go-" + suffix, Description: "Go SDK harness scratch agent."}, &agent); err != nil {
			return err
		}
		agentID = agent.ID
		var dep garrison.Deployment
		if err := client.Deployments.Create(ctx, garrison.Deployment{Name: "sdk-go-" + suffix + "-fake", AgentID: agentID, HarnessProfileID: fakeID}, &dep); err != nil {
			return err
		}
		deploymentID = dep.ID
		return nil
	})
	check("invoke with wait", func(ctx context.Context) error {
		run, err := client.Agents.Invoke(ctx, agentID, garrison.InvokeRequest{Input: "Hello from the Go SDK", Wait: true, WaitSeconds: 90})
		if err != nil {
			return err
		}
		if run.Status != "Succeeded" {
			return fmt.Errorf("status %s %s", run.Status, run.ErrorMessage)
		}
		if !strings.HasPrefix(run.ResultText, "Echo:") {
			return fmt.Errorf("result %q", run.ResultText)
		}
		return nil
	})
	check("stream events", func(ctx context.Context) error {
		run, err := client.Runs.Create(ctx, garrison.RunCreateRequest{AgentID: agentID, Input: "Stream this please"})
		if err != nil {
			return err
		}
		events := 0
		var final *garrison.Run
		err = client.Runs.Stream(ctx, run.ID, 0, func(item garrison.RunStreamItem) bool {
			if item.Event != nil {
				events++
			}
			if item.Run != nil {
				final = item.Run
			}
			return true
		})
		if err != nil {
			return err
		}
		if final == nil {
			return errors.New("no run.completed")
		}
		if final.Status != "Succeeded" {
			return fmt.Errorf("status %s", final.Status)
		}
		if events == 0 {
			return errors.New("no events")
		}
		return nil
	})
	check("cancel run", func(ctx context.Context) error {
		run, err := client.Runs.Create(ctx, garrison.RunCreateRequest{AgentID: agentID, Input: "Cancel me"})
		if err != nil {
			return err
		}
		if _, err := client.Runs.Cancel(ctx, run.ID); err != nil && !garrison.IsStatus(err, http.StatusConflict) {
			return err
		}
		final, err := client.Runs.WaitForCompletion(ctx, run.ID)
		if err != nil {
			return err
		}
		if final.Status != "Cancelled" && final.Status != "Succeeded" {
			return fmt.Errorf("status %s", final.Status)
		}
		return nil
	})
	check("manifest dry run", func(ctx context.Context) error {
		yaml := "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-go-manifest-" + suffix + "\nspec:\n  description: Dry run only.\n"
		result, err := client.Manifests.Apply(ctx, yaml, true, false)
		if err != nil {
			return err
		}
		if !result.DryRun || result.FailedCount != 0 {
			return fmt.Errorf("dryRun %v failed %d", result.DryRun, result.FailedCount)
		}
		return nil
	})
	check("list runs by agent", func(ctx context.Context) error {
		page, err := client.Runs.List(ctx, garrison.RunFilter{AgentID: agentID})
		if err != nil {
			return err
		}
		if page.TotalRecords < 3 {
			return fmt.Errorf("total %d", page.TotalRecords)
		}
		for _, r := range page.Objects {
			if r.AgentID != agentID {
				return errors.New("foreign runs")
			}
		}
		return nil
	})
	check("cleanup", func(ctx context.Context) error {
		if deploymentID != "" {
			if err := client.Deployments.Delete(ctx, deploymentID); err != nil {
				return err
			}
		}
		if agentID != "" {
			return client.Agents.Delete(ctx, agentID)
		}
		return nil
	})

	fmt.Printf("\nPassed: %d  Failed: %d\n", passed, len(failures))
	for _, f := range failures {
		fmt.Println("  FAIL " + f)
	}
	if len(failures) > 0 {
		os.Exit(1)
	}
}
