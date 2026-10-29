// Command testharness exercises the Garrison Go SDK end to end.
// Usage: go run ./cmd/testharness [baseUrl] [accessKey] [secretKey]
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	garrison "github.com/jchristn/Garrison/sdk/go"
)

var traceIDPattern = regexp.MustCompile(`^[0-9a-f]{32}$`)

func main() {
	args := []string{"http://127.0.0.1:8700", "access_garrison_default", "secret_garrison_default_change_me"}
	copy(args, os.Args[1:])
	baseURL, accessKey, secretKey := args[0], args[1], args[2]
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	suffix := hex.EncodeToString(b)
	client := garrison.NewClient(baseURL)
	var tenant, fakeID, agentID, deploymentID string
	var finished *garrison.Run
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
	authFailed := 0
	check("token auth", func(ctx context.Context) error {
		issued, err := client.LoginWithKeys(ctx, accessKey, secretKey)
		if err != nil {
			var apiErr *garrison.Error
			if errors.As(err, &apiErr) && (apiErr.StatusCode == http.StatusUnauthorized || apiErr.StatusCode == http.StatusForbidden) {
				authFailed = apiErr.StatusCode
			}
			return err
		}
		tenant = issued.TenantID
		d, err := client.TokenDetails(ctx)
		if err == nil && d["principalType"] != "Credential" {
			err = fmt.Errorf("principal %v", d["principalType"])
		}
		return err
	})
	if authFailed != 0 {
		fmt.Printf("\nAuthentication failed (HTTP %d): the server rejected access key %s. The remaining checks need a "+
			"signed-in client, so the harness stops here. Pass this server's keys as arguments: "+
			"go run ./cmd/testharness <baseUrl> <accessKey> <secretKey>. Docker Compose and source builds default to "+
			"access_garrison_default and secret_garrison_default_change_me; on Kubernetes read default-access-key and "+
			"default-secret-key from Secret garrison-secrets (see README, \"Where the credentials come from\").\n", authFailed, accessKey)
		os.Exit(1)
	}
	check("signed request auth", func(ctx context.Context) error {
		signed := garrison.NewClient(baseURL)
		t := tenant
		if t == "" {
			t = "default"
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
	check("model price CRUD", func(ctx context.Context) error {
		var price garrison.ModelPrice
		body := map[string]any{"name": "sdk-go-price-" + suffix, "model": "fixture-go-" + suffix, "harnessType": "Generic", "inputUsdPerMillion": 0.5, "outputUsdPerMillion": 2, "reasoningUsdPerMillion": 0, "inputIncludesCachedTokens": false, "outputIncludesReasoningTokens": true}
		if err := client.ModelPrices.Create(ctx, body, &price); err != nil {
			return err
		}
		defer client.ModelPrices.Delete(ctx, price.ID)
		var saved garrison.ModelPrice
		if err := client.ModelPrices.Get(ctx, price.ID, &saved); err != nil {
			return err
		}
		if saved.InputUsdPerMillion != 0.5 || saved.ReasoningUsdPerMillion == nil || *saved.ReasoningUsdPerMillion != 0 || saved.InputIncludesCachedTokens {
			return fmt.Errorf("price fields")
		}
		var page garrison.EnumerationResult[garrison.ModelPrice]
		if err := client.ModelPrices.List(ctx, &garrison.ListOptions{Search: price.Name}, &page); err != nil {
			return err
		}
		if len(page.Objects) != 1 || page.Objects[0].ID != price.ID {
			return fmt.Errorf("price list")
		}
		saved.OutputUsdPerMillion = 3
		if err := client.ModelPrices.Update(ctx, price.ID, saved, &saved); err != nil {
			return err
		}
		if saved.OutputUsdPerMillion != 3 {
			return fmt.Errorf("price update")
		}
		return nil
	})
	check("builtin harness profiles", func(ctx context.Context) error {
		profiles, err := client.HarnessProfiles.Builtin(ctx)
		if err != nil {
			return err
		}
		providerFound := false
		openCodeFound := false
		piFound := false
		for _, p := range profiles {
			if p.Name == "builtin/provider-api" && p.HarnessType == "ProviderApi" {
				providerFound = true
			}
			if p.Name == "builtin/opencode" && p.HarnessType == "OpenCode" {
				openCodeFound = true
			}
			if p.Name == "builtin/pi" && p.HarnessType == "Pi" {
				piFound = true
			}
		}
		if !providerFound {
			return errors.New("optional provider profile not found")
		}
		if !openCodeFound || !piFound {
			return errors.New("opencode or pi profile not found")
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
	check("usage quota CRUD and meters", func(ctx context.Context) error {
		var quota garrison.UsageQuota
		if err := client.UsageQuotas.Create(ctx, map[string]any{"name": "sdk-go-quota-" + suffix, "scope": "Agent", "resourceId": agentID, "dailyRunLimit": 100, "dailyCostUsdLimit": 0.125}, &quota); err != nil {
			return err
		}
		defer client.UsageQuotas.Delete(ctx, quota.ID)
		if err := client.UsageQuotas.Get(ctx, quota.ID, &quota); err != nil {
			return err
		}
		if quota.EnforcementEnabled || quota.DailyRunLimit == nil || *quota.DailyRunLimit != 100 {
			return fmt.Errorf("quota fields")
		}
		usage, err := client.UsageQuotas.Usage(ctx, quota.ID)
		if err != nil {
			return err
		}
		if usage.RunsUsed != 0 || !usage.CostAccountingComplete || usage.WindowEndUTC == "" {
			return fmt.Errorf("quota usage")
		}
		quota.DailyRunLimit = nil
		quota.EnforcementEnabled = true
		// Explicit null clears a configured limit (omitempty intentionally omits absent optional fields).
		body := map[string]any{"name": quota.Name, "scope": quota.Scope, "resourceId": quota.ResourceID, "dailyRunLimit": nil, "dailyCostUsdLimit": quota.DailyCostUSDLimit, "enforcementEnabled": true}
		if err := client.UsageQuotas.Update(ctx, quota.ID, body, &quota); err != nil {
			return err
		}
		if quota.DailyRunLimit != nil || !quota.EnforcementEnabled {
			return fmt.Errorf("unlimited limit")
		}
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
		finished = run
		return nil
	})
	check("run transcript (Markdown and JSON)", func(ctx context.Context) error {
		if finished == nil {
			return errors.New("no finished run")
		}
		markdown, err := client.Runs.TranscriptMarkdown(ctx, finished.ID, false)
		if err != nil {
			return err
		}
		if !strings.Contains(markdown, "sdk-go-"+suffix) || !strings.Contains(markdown, "Hello from the Go SDK") {
			return errors.New("markdown lacks the agent name or the input")
		}
		transcript, err := client.Runs.Transcript(ctx, finished.ID, false)
		if err != nil {
			return err
		}
		if transcript.Schema != "garrison.transcript/v1" || transcript.Kind != "Run" {
			return fmt.Errorf("schema %s kind %s", transcript.Schema, transcript.Kind)
		}
		if transcript.RunID != finished.ID || transcript.AgentName != "sdk-go-"+suffix {
			return fmt.Errorf("run %s agent %s", transcript.RunID, transcript.AgentName)
		}
		if transcript.TurnCount != 1 || len(transcript.Turns) != 1 || transcript.Turns[0].Input != "Hello from the Go SDK" {
			return fmt.Errorf("turns %d", transcript.TurnCount)
		}
		if transcript.IncludesThinking {
			return errors.New("thinking included by default")
		}
		return nil
	})
	check("input schema enforcement", func(ctx context.Context) error {
		var agent garrison.Agent
		schema := `{"type":"object","properties":{"topic":{"type":"string"},"count":{"type":"integer"}},"required":["topic"]}`
		if err := client.Agents.Create(ctx, garrison.Agent{Name: "sdk-go-" + suffix + "-schema", InputMode: "Structured", InputSchemaJSON: schema}, &agent); err != nil {
			return err
		}
		defer client.Agents.Delete(ctx, agent.ID)
		var dep garrison.Deployment
		if err := client.Deployments.Create(ctx, garrison.Deployment{Name: "sdk-go-" + suffix + "-schema-fake", AgentID: agent.ID, HarnessProfileID: fakeID}, &dep); err != nil {
			return err
		}
		defer client.Deployments.Delete(ctx, dep.ID)
		if !strings.Contains(agent.InputSchemaJSON, "topic") {
			return errors.New("inputSchemaJson not stored")
		}
		run, err := client.Agents.Invoke(ctx, agent.ID, garrison.InvokeRequest{Input: `{"topic":"sdk","count":2}`, InputContentType: "application/json", Wait: true, WaitSeconds: 90})
		if err != nil {
			return err
		}
		if run.Status != "Succeeded" {
			return fmt.Errorf("valid input status %s %s", run.Status, run.ErrorMessage)
		}
		_, err = client.Agents.Invoke(ctx, agent.ID, garrison.InvokeRequest{Input: `{"count":"x"}`, InputContentType: "application/json"})
		var apiErr *garrison.Error
		if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusBadRequest || apiErr.FieldCodes["input.topic"] != garrison.FieldCodeInputSchemaViolation {
			return fmt.Errorf("expected 400 InputSchemaViolation on input.topic, got %v", err)
		}
		_, err = client.Agents.Invoke(ctx, agent.ID, garrison.InvokeRequest{Input: "plain words"})
		if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusBadRequest || apiErr.FieldCodes["input"] != garrison.FieldCodeInputNotJSON {
			return fmt.Errorf("expected 400 InputNotJson on input, got %v", err)
		}
		return nil
	})
	check("run timing fields", func(ctx context.Context) error {
		if finished == nil {
			return errors.New("no finished run")
		}
		if finished.TimeToFirstTokenMs == nil || *finished.TimeToFirstTokenMs < 0 {
			return fmt.Errorf("timeToFirstTokenMs %v", finished.TimeToFirstTokenMs)
		}
		if finished.ExecutionMs == nil || *finished.ExecutionMs < 0 {
			return fmt.Errorf("executionMs %v", finished.ExecutionMs)
		}
		if finished.ToolCallCount < 0 {
			return fmt.Errorf("toolCallCount %d", finished.ToolCallCount)
		}
		return nil
	})
	check("run trace id", func(ctx context.Context) error {
		if finished == nil {
			return errors.New("no finished run")
		}
		if finished.TraceID == nil || !traceIDPattern.MatchString(*finished.TraceID) {
			return fmt.Errorf("traceId %v", finished.TraceID)
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
	check("untrusted deployment queues without isolation", func(ctx context.Context) error {
		var trusted garrison.Deployment
		if err := client.Deployments.Get(ctx, deploymentID, &trusted); err != nil {
			return err
		}
		if trusted.TrustLevel != garrison.TrustLevelTrusted {
			return fmt.Errorf("default trustLevel %q", trusted.TrustLevel)
		}
		body := map[string]any{
			"name": "sdk-go-" + suffix + "-untrusted", "agentId": agentID, "harnessProfileId": fakeID,
			"trustLevel": garrison.TrustLevelUntrusted, "weight": 0,
		}
		var dep garrison.Deployment
		if err := client.Deployments.Create(ctx, body, &dep); err != nil {
			return err
		}
		defer client.Deployments.Delete(ctx, dep.ID)
		if dep.TrustLevel != garrison.TrustLevelUntrusted {
			return fmt.Errorf("trustLevel %q", dep.TrustLevel)
		}
		run, err := client.Runs.Create(ctx, garrison.RunCreateRequest{AgentID: agentID, DeploymentID: dep.ID, Input: "Untrusted input"})
		if err != nil {
			return err
		}
		read, err := client.Runs.Get(ctx, run.ID)
		if err != nil {
			return err
		}
		if read.TrustLevel != garrison.TrustLevelUntrusted || read.Executor != garrison.RunExecutorKubernetesJob {
			return fmt.Errorf("run %s %s", read.TrustLevel, read.Executor)
		}
		if read.Status != "Queued" || read.BlockedReason == nil || *read.BlockedReason != "NoIsolatingWorker" {
			return fmt.Errorf("run %s %v", read.Status, read.BlockedReason)
		}
		if _, err := client.Runs.Cancel(ctx, run.ID); err != nil {
			return err
		}
		return nil
	})
	check("effect policy default, update, and conflict", func(ctx context.Context) error {
		body := map[string]any{"name": "sdk-go-" + suffix + "-effect", "agentId": agentID, "harnessProfileId": fakeID, "weight": 0}
		var dep garrison.Deployment
		if err := client.Deployments.Create(ctx, body, &dep); err != nil {
			return err
		}
		defer client.Deployments.Delete(ctx, dep.ID)
		if dep.EffectPolicy != garrison.EffectPolicyAtMostOnce {
			return fmt.Errorf("default effectPolicy %q", dep.EffectPolicy)
		}
		dep.EffectPolicy = garrison.EffectPolicyAtLeastOnce
		var updated garrison.Deployment
		if err := client.Deployments.Update(ctx, dep.ID, dep, &updated); err != nil {
			return err
		}
		if updated.EffectPolicy != garrison.EffectPolicyAtLeastOnce {
			return fmt.Errorf("updated effectPolicy %q", updated.EffectPolicy)
		}
		conflict := map[string]any{"name": dep.Name, "agentId": agentID, "harnessProfileId": fakeID, "weight": 0,
			"effectPolicy": garrison.EffectPolicyAtMostOnce, "retryOnNodeLoss": true}
		err := client.Deployments.Update(ctx, dep.ID, conflict, nil)
		var apiErr *garrison.Error
		if !errors.As(err, &apiErr) || apiErr.StatusCode != 400 || !strings.Contains(apiErr.Body, "EffectPolicyConflict") {
			return fmt.Errorf("conflict not rejected: %v", err)
		}
		run, err := client.Runs.Create(ctx, garrison.RunCreateRequest{AgentID: agentID, DeploymentID: dep.ID, Input: "Effect policy"})
		if err != nil {
			return err
		}
		if run.EffectPolicy != garrison.EffectPolicyAtLeastOnce {
			return fmt.Errorf("run effectPolicy %q", run.EffectPolicy)
		}
		if _, err := client.Runs.Cancel(ctx, run.ID); err != nil {
			return err
		}
		return nil
	})
	check("egress allowlist round trip, validation, and queueing", func(ctx context.Context) error {
		port := 443
		body := map[string]any{
			"name": "sdk-go-" + suffix + "-egress", "agentId": agentID, "harnessProfileId": fakeID, "weight": 0,
			"egressRules": []garrison.DeploymentEgressRule{{CIDR: "203.0.113.0/24", Port: &port, Protocol: garrison.EgressProtocolTCP}},
		}
		var dep garrison.Deployment
		if err := client.Deployments.Create(ctx, body, &dep); err != nil {
			return err
		}
		defer client.Deployments.Delete(ctx, dep.ID)
		var read garrison.Deployment
		if err := client.Deployments.Get(ctx, dep.ID, &read); err != nil {
			return err
		}
		if len(read.EgressRules) != 1 || read.EgressRules[0].CIDR != "203.0.113.0/24" || read.EgressRules[0].Port == nil || *read.EgressRules[0].Port != 443 || read.EgressRules[0].Protocol != garrison.EgressProtocolTCP {
			return fmt.Errorf("egressRules %+v", read.EgressRules)
		}
		bad := map[string]any{
			"name": read.Name, "agentId": agentID, "harnessProfileId": fakeID, "weight": 0,
			"egressRules": []garrison.DeploymentEgressRule{{CIDR: "203.0.113.7/24", Port: &port, Protocol: garrison.EgressProtocolTCP}},
		}
		err := client.Deployments.Update(ctx, dep.ID, bad, nil)
		var apiErr *garrison.Error
		if !errors.As(err, &apiErr) || apiErr.StatusCode != 400 || !strings.Contains(apiErr.Body, "InvalidCidr") {
			return fmt.Errorf("bad cidr not rejected: %v", err)
		}
		run, err := client.Runs.Create(ctx, garrison.RunCreateRequest{AgentID: agentID, DeploymentID: dep.ID, Input: "Egress allowlist"})
		if err != nil {
			return err
		}
		queued, err := client.Runs.Get(ctx, run.ID)
		if err != nil {
			return err
		}
		if queued.Executor != garrison.RunExecutorKubernetesJob {
			return fmt.Errorf("run executor %s", queued.Executor)
		}
		if queued.Status != "Queued" || queued.BlockedReason == nil || *queued.BlockedReason != "NoIsolatingWorker" {
			return fmt.Errorf("run %s %v", queued.Status, queued.BlockedReason)
		}
		if _, err := client.Runs.Cancel(ctx, run.ID); err != nil {
			return err
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
	check("manifest bundle export", func(ctx context.Context) error {
		bundle, err := client.Manifests.Export(ctx, garrison.ManifestExportOptions{Resources: []string{"Agent/sdk-go-" + suffix}, FollowReferences: true})
		if err != nil {
			return err
		}
		if !strings.Contains(bundle, "kind: Bundle") || !strings.Contains(bundle, "kind: Agent") || !strings.Contains(bundle, "name: sdk-go-"+suffix) {
			return errors.New("bundle lacks the Bundle or Agent document")
		}
		if !strings.Contains(bundle, "sdk-go-"+suffix+"-fake") || !strings.Contains(bundle, "builtin/fake") {
			return errors.New("followReferences did not bring the deployment and its built-in requirement")
		}
		dry, err := client.Manifests.Apply(ctx, bundle, true, false)
		if err != nil {
			return err
		}
		if dry.FailedCount != 0 {
			return fmt.Errorf("bundle dry run failed %d", dry.FailedCount)
		}
		_, err = client.Manifests.Export(ctx, garrison.ManifestExportOptions{Kinds: []string{"NoSuchKind"}})
		var apiErr *garrison.Error
		if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusBadRequest || apiErr.FieldCodes["kinds"] != "UnknownKind" {
			return fmt.Errorf("expected 400 UnknownKind, got %v", err)
		}
		return nil
	})
	check("clamped values return ValueClamped warnings", func(ctx context.Context) error {
		body := map[string]any{"name": "sdk-go-" + suffix + "-clamp", "agentId": agentID, "harnessProfileId": fakeID, "weight": 0, "maxAttempts": 99}
		var dep garrison.Deployment
		if err := client.Deployments.Create(ctx, body, &dep); err != nil {
			return err
		}
		defer client.Deployments.Delete(ctx, dep.ID)
		if len(dep.Warnings) != 1 || dep.Warnings[0].Field != "maxAttempts" || dep.Warnings[0].Code != garrison.FieldWarningValueClamped ||
			dep.Warnings[0].Given == nil || *dep.Warnings[0].Given != "99" || dep.Warnings[0].Stored == nil || *dep.Warnings[0].Stored != "10" {
			return fmt.Errorf("create warnings %+v", dep.Warnings)
		}
		var read garrison.Deployment
		if err := client.Deployments.Get(ctx, dep.ID, &read); err != nil {
			return err
		}
		if len(read.Warnings) != 0 {
			return fmt.Errorf("read warnings %+v", read.Warnings)
		}
		yaml := "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-go-clamp-" + suffix + "\nspec:\n  delegation:\n    maxDepth: 99\n"
		result, err := client.Manifests.Apply(ctx, yaml, true, false)
		if err != nil {
			return err
		}
		items, err := result.ParsedItems()
		if err != nil {
			return err
		}
		if len(items) != 1 || len(items[0].Warnings) != 1 || items[0].Warnings[0].Field != "delegationMaxDepth" || items[0].Warnings[0].Code != garrison.FieldWarningValueClamped {
			return fmt.Errorf("manifest warnings %+v", items)
		}
		return nil
	})
	check("node containerized flag", func(ctx context.Context) error {
		var nodes garrison.EnumerationResult[garrison.Node]
		if err := client.Nodes.List(ctx, nil, &nodes); err != nil {
			return err
		}
		for _, node := range nodes.Objects {
			if node.Name == "sdk-harness-worker" && node.Containerized {
				return errors.New("host worker reported containerized")
			}
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
	check("analytics runs", func(ctx context.Context) error {
		now := time.Now().UTC()
		result, err := client.Analytics.Runs(ctx, garrison.AnalyticsQuery{
			From:     now.Add(-time.Hour).Format(time.RFC3339),
			To:       now.Add(time.Minute).Format(time.RFC3339),
			Interval: "minute",
		})
		if err != nil {
			return err
		}
		if result.Totals.Runs < 1 {
			return fmt.Errorf("totals.runs %d", result.Totals.Runs)
		}
		if len(result.Series) == 0 {
			return errors.New("no series")
		}
		for _, series := range result.Series {
			if len(series.Buckets) == 0 {
				return fmt.Errorf("series %s has no buckets", series.Key)
			}
			for _, bucket := range series.Buckets {
				if bucket.StartUTC == "" {
					return fmt.Errorf("series %s bucket missing startUtc", series.Key)
				}
			}
		}
		return nil
	})
	check("analytics runs grouped by harness", func(ctx context.Context) error {
		now := time.Now().UTC()
		result, err := client.Analytics.Runs(ctx, garrison.AnalyticsQuery{
			From:    now.Add(-time.Hour).Format(time.RFC3339),
			To:      now.Add(time.Minute).Format(time.RFC3339),
			GroupBy: "harness",
		})
		if err != nil {
			return err
		}
		if len(result.Series) == 0 {
			return errors.New("no series")
		}
		return nil
	})
	servedModel := func() string {
		if finished == nil || finished.ServedModel == "" {
			return "unknown"
		}
		return finished.ServedModel
	}
	check("analytics runs grouped by harness and model", func(ctx context.Context) error {
		now := time.Now().UTC()
		result, err := client.Analytics.Runs(ctx, garrison.AnalyticsQuery{
			From:    now.Add(-time.Hour).Format(time.RFC3339),
			To:      now.Add(time.Minute).Format(time.RFC3339),
			GroupBy: "harnessModel",
		})
		if err != nil {
			return err
		}
		if len(result.Series) == 0 {
			return errors.New("no series")
		}
		for _, series := range result.Series {
			if !strings.Contains(series.Key, "|") {
				return fmt.Errorf("series key %q", series.Key)
			}
			if !strings.Contains(series.Label, " / ") {
				return fmt.Errorf("series label %q", series.Label)
			}
		}
		return nil
	})
	check("analytics dimensions", func(ctx context.Context) error {
		now := time.Now().UTC()
		dims, err := client.Analytics.Dimensions(ctx, now.Add(-time.Hour).Format(time.RFC3339), now.Add(time.Minute).Format(time.RFC3339))
		if err != nil {
			return err
		}
		foundAgent := false
		for _, a := range dims.Agents {
			if a.ID == agentID {
				foundAgent = true
			}
		}
		if !foundAgent {
			return errors.New("scratch agent missing from dimensions")
		}
		foundDeployment := false
		for _, d := range dims.Deployments {
			if d.ID == deploymentID && d.AgentID == agentID {
				foundDeployment = true
			}
		}
		if !foundDeployment {
			return errors.New("scratch deployment missing from dimensions")
		}
		if len(dims.Harnesses) == 0 {
			return errors.New("no harnesses")
		}
		model := servedModel()
		for _, m := range dims.Models {
			if m == model {
				return nil
			}
		}
		return fmt.Errorf("model %s missing from %v", model, dims.Models)
	})
	check("analytics runs filtered by model", func(ctx context.Context) error {
		now := time.Now().UTC()
		query := garrison.AnalyticsQuery{
			From:    now.Add(-time.Hour).Format(time.RFC3339),
			To:      now.Add(time.Minute).Format(time.RFC3339),
			AgentID: agentID,
			Model:   servedModel(),
		}
		matched, err := client.Analytics.Runs(ctx, query)
		if err != nil {
			return err
		}
		if matched.Totals.Runs < 1 {
			return fmt.Errorf("model %s matched %d runs", query.Model, matched.Totals.Runs)
		}
		query.Model = "garrison-sdk-no-such-model"
		none, err := client.Analytics.Runs(ctx, query)
		if err != nil {
			return err
		}
		if none.Totals.Runs != 0 {
			return fmt.Errorf("unknown model matched %d runs", none.Totals.Runs)
		}
		return nil
	})
	check("analytics rejects from >= to", func(ctx context.Context) error {
		now := time.Now().UTC().Format(time.RFC3339)
		_, err := client.Analytics.Runs(ctx, garrison.AnalyticsQuery{From: now, To: now})
		if err == nil {
			return errors.New("expected HTTP 400, got success")
		}
		if !garrison.IsStatus(err, http.StatusBadRequest) {
			return fmt.Errorf("expected HTTP 400, got %v", err)
		}
		return nil
	})
	var conversationDeploymentID, conversationID string
	check("conversation start", func(ctx context.Context) error {
		body := map[string]any{
			"name": "sdk-go-" + suffix + "-turns", "agentId": agentID, "harnessProfileId": fakeID,
			"parameters": []map[string]string{{"name": "reportTurns", "value": "true"}},
		}
		var dep garrison.Deployment
		if err := client.Deployments.Create(ctx, body, &dep); err != nil {
			return err
		}
		conversationDeploymentID = dep.ID
		run, err := client.Agents.Invoke(ctx, agentID, garrison.InvokeRequest{Input: "First turn from the Go SDK", Wait: true, WaitSeconds: 90, DeploymentID: dep.ID, StartConversation: true})
		if err != nil {
			return err
		}
		if run.Status != "Succeeded" {
			return fmt.Errorf("status %s %s", run.Status, run.ErrorMessage)
		}
		if run.ConversationID == nil || !strings.HasPrefix(*run.ConversationID, "cnv_") {
			return fmt.Errorf("conversationId %v", run.ConversationID)
		}
		if run.ConversationTurn != 1 {
			return fmt.Errorf("conversationTurn %d", run.ConversationTurn)
		}
		if !strings.HasPrefix(run.ResultText, "[turn 1] ") {
			return fmt.Errorf("result %q", run.ResultText)
		}
		conversationID = *run.ConversationID
		return nil
	})
	check("conversation continue", func(ctx context.Context) error {
		run, err := client.Agents.Invoke(ctx, agentID, garrison.InvokeRequest{Input: "Second turn from the Go SDK", Wait: true, WaitSeconds: 90, ConversationID: conversationID})
		if err != nil {
			return err
		}
		if run.Status != "Succeeded" {
			return fmt.Errorf("status %s %s", run.Status, run.ErrorMessage)
		}
		if run.ConversationID == nil || *run.ConversationID != conversationID {
			return fmt.Errorf("conversationId %v", run.ConversationID)
		}
		if run.ConversationTurn != 2 {
			return fmt.Errorf("conversationTurn %d", run.ConversationTurn)
		}
		if !strings.HasPrefix(run.ResultText, "[turn 2] ") {
			return fmt.Errorf("result %q", run.ResultText)
		}
		return nil
	})
	check("conversation read and list", func(ctx context.Context) error {
		conversation, err := client.Conversations.Get(ctx, conversationID)
		if err != nil {
			return err
		}
		if conversation.TurnCount != 2 {
			return fmt.Errorf("turnCount %d", conversation.TurnCount)
		}
		if conversation.SessionID == nil || *conversation.SessionID == "" {
			return errors.New("sessionId empty")
		}
		if conversation.DeploymentID != conversationDeploymentID {
			return fmt.Errorf("deploymentId %s", conversation.DeploymentID)
		}
		if conversation.Busy {
			return errors.New("busy")
		}
		page, err := client.Conversations.List(ctx, garrison.ConversationFilter{AgentID: agentID})
		if err != nil {
			return err
		}
		found := false
		for _, c := range page.Objects {
			if c.ID == conversationID {
				found = true
			}
		}
		if !found {
			return errors.New("conversation missing from list")
		}
		turns, err := client.Conversations.ListRuns(ctx, conversationID, 0, 0)
		if err != nil {
			return err
		}
		if len(turns.Objects) != 2 {
			return fmt.Errorf("turns %d", len(turns.Objects))
		}
		if turns.Objects[0].ConversationTurn != 1 || turns.Objects[1].ConversationTurn != 2 {
			return fmt.Errorf("turn order %d,%d", turns.Objects[0].ConversationTurn, turns.Objects[1].ConversationTurn)
		}
		runs, err := client.Runs.List(ctx, garrison.RunFilter{ConversationID: conversationID})
		if err != nil {
			return err
		}
		if runs.TotalRecords != 2 {
			return fmt.Errorf("runs by conversationId %d", runs.TotalRecords)
		}
		return nil
	})
	check("conversation transcript", func(ctx context.Context) error {
		transcript, err := client.Conversations.Transcript(ctx, conversationID, false)
		if err != nil {
			return err
		}
		if transcript.Kind != "Conversation" || transcript.ConversationID != conversationID {
			return fmt.Errorf("kind %s conversation %s", transcript.Kind, transcript.ConversationID)
		}
		if transcript.TurnCount != 2 || len(transcript.Turns) != 2 || transcript.Turns[0].Turn != 1 || transcript.Turns[1].Turn != 2 {
			return fmt.Errorf("turns %d", transcript.TurnCount)
		}
		markdown, err := client.Conversations.TranscriptMarkdown(ctx, conversationID, false)
		if err != nil {
			return err
		}
		if !strings.Contains(markdown, "First turn from the Go SDK") || !strings.Contains(markdown, "Second turn from the Go SDK") {
			return errors.New("markdown lacks a turn")
		}
		return nil
	})
	check("conversation delete", func(ctx context.Context) error {
		if err := client.Conversations.Delete(ctx, conversationID); err != nil {
			return err
		}
		if _, err := client.Conversations.Get(ctx, conversationID); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("expected HTTP 404 after delete, got %v", err)
		}
		if _, err := client.Agents.Invoke(ctx, agentID, garrison.InvokeRequest{Input: "Turn for a deleted conversation", ConversationID: conversationID}); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("expected HTTP 404 continuing a deleted conversation, got %v", err)
		}
		return nil
	})
	check("control nodes", func(ctx context.Context) error {
		page, err := client.ControlNodes.List(ctx, nil)
		if err != nil {
			return err
		}
		if page.RespondingNodeID == "" {
			return errors.New("respondingNodeId empty")
		}
		ready, leaders := 0, 0
		for _, n := range page.Objects {
			if n.Status == garrison.ControlNodeStatusReady {
				ready++
			}
			if n.IsLeader {
				leaders++
			}
		}
		if ready < 1 || leaders != 1 {
			return fmt.Errorf("ready %d leaders %d", ready, leaders)
		}
		read, err := client.ControlNodes.Get(ctx, page.Objects[0].ID)
		if err != nil {
			return err
		}
		if read.ID != page.Objects[0].ID || read.RespondingNodeID == nil || *read.RespondingNodeID != page.RespondingNodeID {
			return fmt.Errorf("read %s responding %v", read.ID, read.RespondingNodeID)
		}
		return nil
	})
	check("approvals list and read", func(ctx context.Context) error {
		pending, err := client.Approvals.List(ctx, garrison.ApprovalFilter{Status: garrison.ApprovalStatusPending, MaxResults: 1})
		if err != nil {
			return err
		}
		for _, a := range pending.Objects {
			if a.Status != garrison.ApprovalStatusPending {
				return fmt.Errorf("approval %s has status %s in Pending list", a.ID, a.Status)
			}
		}
		if pending.TotalRecords < int64(len(pending.Objects)) {
			return fmt.Errorf("totalRecords %d", pending.TotalRecords)
		}
		scoped, err := client.Approvals.List(ctx, garrison.ApprovalFilter{DeploymentID: deploymentID})
		if err != nil {
			return err
		}
		if len(scoped.Objects) != 0 {
			return fmt.Errorf("scratch deployment has %d approvals", len(scoped.Objects))
		}
		if _, err := client.Approvals.Get(ctx, "apr_missing"+suffix); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("read missing approval: expected HTTP 404, got %v", err)
		}
		if _, err := client.Approvals.Decide(ctx, "apr_missing"+suffix, garrison.ApprovalDecideRequest{Decision: garrison.ApprovalDecisionAllow}); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("decide missing approval: expected HTTP 404, got %v", err)
		}
		return nil
	})
	check("approval rules and approval check", func(ctx context.Context) error {
		var typed garrison.Deployment
		if err := client.Deployments.Get(ctx, deploymentID, &typed); err != nil {
			return err
		}
		if typed.ApprovalsEnabled || typed.ApprovalDefaultAction != garrison.ApprovalRuleActionAsk || typed.ApprovalTimeoutSeconds != 300 || typed.ApprovalTimeoutDecision != garrison.ApprovalDecisionDeny {
			return fmt.Errorf("defaults enabled=%v default=%s timeout=%d timeoutDecision=%s", typed.ApprovalsEnabled, typed.ApprovalDefaultAction, typed.ApprovalTimeoutSeconds, typed.ApprovalTimeoutDecision)
		}
		var raw map[string]any
		if err := client.Deployments.Get(ctx, deploymentID, &raw); err != nil {
			return err
		}
		note := "Go SDK harness rule."
		raw["approvalRules"] = []garrison.DeploymentApprovalRule{
			{Action: garrison.ApprovalRuleActionAllow, Pattern: "Bash(git status:*)"},
			{Action: garrison.ApprovalRuleActionDeny, Pattern: "Bash(rm:*)", Description: &note},
		}
		raw["approvalDefaultAction"] = garrison.ApprovalRuleActionDeny
		var updated garrison.Deployment
		if err := client.Deployments.Update(ctx, deploymentID, raw, &updated); err != nil {
			return err
		}
		if len(updated.ApprovalRules) != 2 || !strings.HasPrefix(updated.ApprovalRules[0].ID, "dar_") || !strings.HasPrefix(updated.ApprovalRules[1].ID, "dar_") {
			return fmt.Errorf("rules %+v", updated.ApprovalRules)
		}
		allowed, err := client.Approvals.Check(ctx, deploymentID, garrison.ApprovalCheckRequest{ToolName: "Bash", Input: &garrison.ApprovalToolInput{Command: "git status --short"}})
		if err != nil {
			return err
		}
		if allowed.Action != garrison.ApprovalRuleActionAllow || allowed.Source != garrison.ApprovalSourceRule || allowed.RulePattern == nil || *allowed.RulePattern != "Bash(git status:*)" || allowed.ApprovalsEnabled {
			return fmt.Errorf("git status %+v", allowed)
		}
		denied, err := client.Approvals.Check(ctx, deploymentID, garrison.ApprovalCheckRequest{ToolName: "Bash", Input: &garrison.ApprovalToolInput{Command: "rm -rf build"}})
		if err != nil {
			return err
		}
		if denied.Action != garrison.ApprovalRuleActionDeny || denied.Source != garrison.ApprovalSourceRule {
			return fmt.Errorf("rm %+v", denied)
		}
		fallback, err := client.Approvals.Check(ctx, deploymentID, garrison.ApprovalCheckRequest{ToolName: "Edit", Input: &garrison.ApprovalToolInput{FilePath: "src/app.go"}})
		if err != nil {
			return err
		}
		if fallback.Action != garrison.ApprovalRuleActionDeny || fallback.Source != garrison.ApprovalSourceDefault || fallback.SuggestedRule == nil || *fallback.SuggestedRule == "" {
			return fmt.Errorf("edit %+v", fallback)
		}
		raw["approvalsEnabled"] = true
		if err := client.Deployments.Update(ctx, deploymentID, raw, nil); !garrison.IsStatus(err, http.StatusBadRequest) {
			return fmt.Errorf("enable approvals on a fake deployment: expected HTTP 400, got %v", err)
		}
		if finished == nil {
			return errors.New("no finished run")
		}
		run, err := client.Runs.Get(ctx, finished.ID)
		if err != nil {
			return err
		}
		if run.PendingApprovals != 0 || run.AwaitingApproval || run.ApprovalWaitMs != nil {
			return fmt.Errorf("run pendingApprovals %d awaitingApproval %v approvalWaitMs %v", run.PendingApprovals, run.AwaitingApproval, run.ApprovalWaitMs)
		}
		return nil
	})
	check("artifact collection and binary download", func(ctx context.Context) error {
		var store garrison.ArtifactStore
		if err := client.ArtifactStores.Create(ctx, garrison.ArtifactStore{Name: "sdk-go-artifacts-" + suffix, Kind: "Filesystem", PathPrefix: "sdk-go-" + suffix}, &store); err != nil {
			return err
		}
		defer client.ArtifactStores.Delete(ctx, store.ID)
		var deployment garrison.Deployment
		err := client.Deployments.Create(ctx, garrison.Deployment{Name: "sdk-go-artifacts-" + suffix, AgentID: agentID, HarnessProfileID: fakeID, ArtifactStoreID: store.ID, ArtifactGlobs: []string{"reports/**/*.txt"}, ArgumentOverrides: []garrison.DeploymentArgumentOverride{{Position: 0, Template: "--output-last-message"}, {Position: 1, Template: "{{run.workspaceDir}}/reports/answer.txt"}}}, &deployment)
		if err != nil {
			return err
		}
		defer client.Deployments.Delete(ctx, deployment.ID)
		run, err := client.Agents.Invoke(ctx, agentID, garrison.InvokeRequest{DeploymentID: deployment.ID, Input: "artifact SDK payload", Wait: true, WaitSeconds: 30})
		if err != nil {
			return err
		}
		if run.Status != "Succeeded" {
			return errors.New("artifact run failed")
		}
		rows, err := client.Artifacts.List(ctx, url.Values{"runId": {run.ID}, "storeId": {store.ID}})
		if err != nil {
			return err
		}
		if len(rows.Objects) != 1 {
			return fmt.Errorf("expected one artifact, got %d", len(rows.Objects))
		}
		artifact, err := client.Artifacts.Get(ctx, rows.Objects[0].ID)
		if err != nil {
			return err
		}
		if artifact.Name != "reports/answer.txt" {
			return errors.New("artifact name")
		}
		bytes, err := client.Artifacts.Download(ctx, artifact.ID)
		if err != nil {
			return err
		}
		if !strings.Contains(string(bytes), "artifact SDK payload") {
			return errors.New("raw bytes")
		}
		link, err := client.Artifacts.DownloadURL(ctx, artifact.ID)
		if err != nil {
			return err
		}
		if link.URL == "" {
			return errors.New("download link")
		}
		if _, err := client.Artifacts.Upload(ctx, run.ID, store.ID, artifact.Name, []byte("late upload"), artifact.LeaseEpoch, artifact.RepairAttempt, "text/plain"); !garrison.IsStatus(err, http.StatusConflict) {
			return fmt.Errorf("terminal upload fence: %v", err)
		}
		if err := client.Artifacts.Delete(ctx, artifact.ID); err != nil {
			return err
		}
		rows, err = client.Artifacts.List(ctx, url.Values{"runId": {run.ID}})
		if err != nil {
			return err
		}
		if len(rows.Objects) != 0 {
			return errors.New("deleted artifact")
		}
		return nil
	})
	check("webhook signature helper", func(ctx context.Context) error {
		body := []byte(`{"a":1}`)
		now := time.Now().Unix()
		header := garrison.SignWebhook("whsec_test_secret_value", now, body)
		prefix := fmt.Sprintf("t=%d,v1=", now)
		if !strings.HasPrefix(header, prefix) || len(header) != len(prefix)+64 {
			return fmt.Errorf("header shape %s", header)
		}
		if !garrison.VerifyWebhook(header, "whsec_test_secret_value", body, 0) {
			return errors.New("verify own signature")
		}
		if !garrison.VerifyWebhook(prefix+strings.Repeat("0", 64)+",v1="+strings.TrimPrefix(header, prefix), "whsec_test_secret_value", body, 0) {
			return errors.New("verify second v1")
		}
		if garrison.VerifyWebhook(header, "whsec_other_secret_value", body, 0) {
			return errors.New("wrong secret accepted")
		}
		if garrison.VerifyWebhook(garrison.SignWebhook("whsec_test_secret_value", now-3600, body), "whsec_test_secret_value", body, 0) {
			return errors.New("stale accepted")
		}
		return nil
	})
	check("agent revisions and promotion", func(ctx context.Context) error {
		var agent garrison.Agent
		if err := client.Agents.Create(ctx, garrison.Agent{Name: "sdk-go-rev-" + suffix, Description: "Go SDK revision agent."}, &agent); err != nil {
			return err
		}
		var dev, staging garrison.Deployment
		defer func() {
			if staging.ID != "" {
				_ = client.Deployments.Delete(ctx, staging.ID)
			}
			if dev.ID != "" {
				_ = client.Deployments.Delete(ctx, dev.ID)
			}
			_ = client.Agents.Delete(ctx, agent.ID)
		}()
		if err := client.Deployments.Create(ctx, garrison.Deployment{Name: "sdk-go-rev-" + suffix + "-dev", AgentID: agent.ID, HarnessProfileID: fakeID}, &dev); err != nil {
			return err
		}
		if err := client.Deployments.Create(ctx, garrison.Deployment{Name: "sdk-go-rev-" + suffix + "-staging", AgentID: agent.ID, HarnessProfileID: fakeID, Environment: "staging"}, &staging); err != nil {
			return err
		}
		if staging.Environment != "staging" || staging.AgentRevisionID != nil {
			return fmt.Errorf("staging deployment fields %q", staging.Environment)
		}
		draft, err := client.Agents.SaveDraft(ctx, agent.ID, garrison.AgentRevision{Description: "Go SDK revision agent, revised."})
		if err != nil {
			return err
		}
		if draft.State != garrison.AgentRevisionStateDraft {
			return fmt.Errorf("draft state %s", draft.State)
		}
		published, err := client.Agents.PublishRevision(ctx, agent.ID, draft.ID, "Go SDK harness")
		if err != nil {
			return err
		}
		if published.State != garrison.AgentRevisionStatePublished || published.ID != draft.ID {
			return fmt.Errorf("published state %s", published.State)
		}
		revisions, err := client.Agents.ListRevisions(ctx, agent.ID, nil)
		if err != nil {
			return err
		}
		if len(revisions.Objects) == 0 || revisions.Objects[0].ID != published.ID {
			return errors.New("revision list")
		}
		promotion, err := client.Promotions.Promote(ctx, garrison.PromotionRequest{AgentID: agent.ID, SourceEnvironment: "dev"})
		if err != nil {
			return err
		}
		if promotion.TargetEnvironment != "staging" || promotion.Kind != garrison.PromotionKindPromote {
			return fmt.Errorf("promotion target %s", promotion.TargetEnvironment)
		}
		if err := client.Deployments.Get(ctx, staging.ID, &staging); err != nil {
			return err
		}
		if staging.AgentRevisionID == nil || *staging.AgentRevisionID != published.ID {
			return errors.New("staging not pinned to the published revision")
		}
		rollback, err := client.Promotions.Rollback(ctx, promotion.ID, "Go SDK harness rollback")
		if err != nil {
			return err
		}
		if rollback.Kind != garrison.PromotionKindRollback {
			return fmt.Errorf("rollback kind %s", rollback.Kind)
		}
		staging = garrison.Deployment{ID: staging.ID}
		if err := client.Deployments.Get(ctx, staging.ID, &staging); err != nil {
			return err
		}
		if staging.AgentRevisionID != nil && *staging.AgentRevisionID != "" {
			return errors.New("staging pin not restored")
		}
		envs, err := client.Environments.Get(ctx)
		if err != nil {
			return err
		}
		names := make([]string, 0, len(envs.Environments))
		for _, e := range envs.Environments {
			names = append(names, e.Name)
		}
		if strings.Join(names, ",") != "dev,staging,prod" {
			return fmt.Errorf("environments %v", names)
		}
		return nil
	})
	check("agent assets", func(ctx context.Context) error {
		asset, err := client.AgentAssets.Create(ctx, garrison.AgentAsset{Name: "sdk-go-asset-" + suffix, Kind: garrison.AgentAssetKindSkill})
		if err != nil {
			return err
		}
		var agent garrison.Agent
		defer func() {
			if agent.ID != "" {
				_ = client.Agents.Delete(ctx, agent.ID)
			}
			_ = client.AgentAssets.Delete(ctx, asset.ID)
		}()
		if asset.Kind != garrison.AgentAssetKindSkill || asset.CurrentVersion != 0 {
			return fmt.Errorf("asset kind %s version %d", asset.Kind, asset.CurrentVersion)
		}
		content := []byte("# SDK skill\n\nCreated by the Go SDK harness.\n")
		sum := sha256.Sum256(content)
		expected := hex.EncodeToString(sum[:])
		files := []garrison.AgentAssetUpload{{Path: "SKILL.md", Content: content, MediaType: "text/markdown"}}
		first, err := client.AgentAssets.UploadVersion(ctx, asset.ID, files, "Go SDK harness")
		if err != nil {
			return err
		}
		if first.Number != 1 {
			return fmt.Errorf("first version %d", first.Number)
		}
		found := false
		for _, f := range first.Files {
			if f.Path == "SKILL.md" && strings.EqualFold(f.SHA256, expected) {
				found = true
			}
		}
		if !found {
			return errors.New("uploaded file sha256 does not match")
		}
		again, err := client.AgentAssets.UploadVersion(ctx, asset.ID, files, "Go SDK harness")
		if err != nil {
			return err
		}
		if again.Number != 1 {
			return fmt.Errorf("identical upload returned version %d", again.Number)
		}
		downloaded, err := client.AgentAssets.DownloadFile(ctx, asset.ID, 1, "SKILL.md")
		if err != nil {
			return err
		}
		if !bytes.Equal(downloaded, content) {
			return errors.New("downloaded bytes differ")
		}
		versions, err := client.AgentAssets.ListVersions(ctx, asset.ID)
		if err != nil {
			return err
		}
		if len(versions) == 0 || versions[0].Number != 1 {
			return errors.New("version list")
		}
		if _, err := client.AgentAssets.GetVersion(ctx, asset.ID, 1); err != nil {
			return err
		}
		listed, err := client.AgentAssets.List(ctx, garrison.AgentAssetKindSkill, &garrison.ListOptions{Search: asset.Name})
		if err != nil {
			return err
		}
		inList := false
		for _, a := range listed.Objects {
			if a.ID == asset.ID {
				inList = true
			}
		}
		if !inList {
			return errors.New("asset not listed")
		}
		if err := client.Agents.Create(ctx, garrison.Agent{Name: "sdk-go-asset-agent-" + suffix, Description: "Go SDK asset pin agent."}, &agent); err != nil {
			return err
		}
		draft, err := client.Agents.SaveDraft(ctx, agent.ID, garrison.AgentRevision{Description: "Pins an asset.", AssetPins: []garrison.AgentRevisionAssetPin{{AssetID: asset.ID}}})
		if err != nil {
			return err
		}
		published, err := client.Agents.PublishRevision(ctx, agent.ID, draft.ID, "Go SDK harness")
		if err != nil {
			return err
		}
		pinned := false
		for _, p := range published.AssetPins {
			if p.AssetID == asset.ID {
				pinned = true
			}
		}
		if !pinned {
			return fmt.Errorf("published assetPins %v", published.AssetPins)
		}
		var apiErr *garrison.Error
		if err := client.AgentAssets.Delete(ctx, asset.ID); !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusConflict || apiErr.Code != "AssetInUse" {
			return fmt.Errorf("deleting a pinned asset should fail with 409 AssetInUse, got %v", err)
		}
		if err := client.Agents.Delete(ctx, agent.ID); err != nil {
			return err
		}
		agent.ID = ""
		if err := client.AgentAssets.Delete(ctx, asset.ID); err != nil {
			return err
		}
		return nil
	})
	check("webhook and cron triggers", func(ctx context.Context) error {
		var webhook, cron garrison.Trigger
		defer func() {
			if webhook.ID != "" {
				_ = client.Triggers.Delete(ctx, webhook.ID)
			}
			if cron.ID != "" {
				_ = client.Triggers.Delete(ctx, cron.ID)
			}
		}()
		agent := agentID
		if err := client.Triggers.Create(ctx, garrison.Trigger{Name: "sdk-go-hook-" + suffix, Type: garrison.TriggerTypeWebhook, AgentID: &agent}, &webhook); err != nil {
			return err
		}
		if webhook.SigningSecret == nil || !strings.HasPrefix(*webhook.SigningSecret, "whsec_") || !strings.HasPrefix(webhook.ID, "trg_") {
			return errors.New("webhook create returns the signing secret")
		}
		secret := *webhook.SigningSecret
		var read garrison.Trigger
		if err := client.Triggers.Get(ctx, webhook.Name, &read); err != nil {
			return err
		}
		if read.ID != webhook.ID || read.SigningSecret != nil || read.RunAsType != "Credential" {
			return errors.New("get by name hides the secret")
		}
		deliveryID := "sdk-go-delivery-" + suffix
		fire, err := client.Triggers.DeliverWebhook(ctx, webhook.ID, secret, []byte(`{"event":"push"}`), "", deliveryID)
		if err != nil {
			return err
		}
		if fire.Outcome != garrison.TriggerFireOutcomeStarted || fire.RunID == nil || fire.Duplicate {
			return fmt.Errorf("signed delivery: %+v", fire)
		}
		repeat, err := client.Triggers.DeliverWebhook(ctx, webhook.ID, secret, []byte(`{"event":"push"}`), "", deliveryID)
		if err != nil {
			return err
		}
		if !repeat.Duplicate || repeat.ID != fire.ID {
			return errors.New("repeated delivery returns the same fire")
		}
		run, err := client.Runs.Get(ctx, *fire.RunID)
		if err != nil {
			return err
		}
		if run.TriggerID == nil || *run.TriggerID != webhook.ID || run.Kind != "Trigger" {
			return errors.New("run carries the trigger")
		}
		byTrigger, err := client.Runs.List(ctx, garrison.RunFilter{TriggerID: webhook.ID})
		if err != nil || len(byTrigger.Objects) != 1 {
			return fmt.Errorf("runs by trigger: %v", err)
		}
		_, err = client.Triggers.DeliverWebhook(ctx, webhook.ID, "whsec_wrong_secret_for_this_trigger", []byte(`{}`), "", "")
		var apiErr *garrison.Error
		if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusUnauthorized || apiErr.Code != "InvalidSignature" {
			return fmt.Errorf("bad signature: %v", err)
		}
		fires, err := client.Triggers.ListFires(ctx, webhook.ID, garrison.TriggerFireOutcomeStarted, nil)
		if err != nil || len(fires.Objects) != 1 || fires.Objects[0].ID != fire.ID {
			return fmt.Errorf("fire history: %v", err)
		}
		rotated, err := client.Triggers.RotateSecret(ctx, webhook.ID)
		if err != nil || rotated.SigningSecret == nil || *rotated.SigningSecret == secret {
			return fmt.Errorf("rotate secret: %v", err)
		}
		expression := "0 9 * * 1-5"
		if err := client.Triggers.Create(ctx, garrison.Trigger{Name: "sdk-go-cron-" + suffix, Type: garrison.TriggerTypeCron, AgentID: &agent, CronExpression: &expression, TimeZone: "America/New_York"}, &cron); err != nil {
			return err
		}
		if cron.NextFireUTC == nil || cron.SigningSecret != nil {
			return errors.New("cron next fire")
		}
		crons, err := client.Triggers.List(ctx, nil, garrison.TriggerTypeCron)
		if err != nil {
			return err
		}
		found := false
		for _, t := range crons.Objects {
			if t.ID == cron.ID {
				found = true
			}
		}
		if !found {
			return errors.New("list by type")
		}
		return nil
	})
	check("notification endpoints", func(ctx context.Context) error {
		var refused garrison.NotificationEndpoint
		err := client.NotificationEndpoints.Create(ctx, garrison.NotificationEndpoint{Name: "sdk-go-local-" + suffix, URL: "http://127.0.0.1:9/x", Events: []string{garrison.NotificationEventRunFailed}}, &refused)
		var apiErr *garrison.Error
		if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusBadRequest || apiErr.FieldCodes["url"] != "DestinationBlocked" {
			return fmt.Errorf("loopback URL refused: %v", err)
		}
		var endpoint garrison.NotificationEndpoint
		if err := client.NotificationEndpoints.Create(ctx, garrison.NotificationEndpoint{Name: "sdk-go-notify-" + suffix, URL: "https://example.invalid/hook", Events: []string{garrison.NotificationEventRunSucceeded, garrison.NotificationEventRunFailed}}, &endpoint); err != nil {
			return err
		}
		defer func() { _ = client.NotificationEndpoints.Delete(ctx, endpoint.ID) }()
		if !strings.HasPrefix(endpoint.ID, "nep_") || endpoint.SigningSecret == nil || len(endpoint.Events) != 2 {
			return errors.New("endpoint create")
		}
		var read garrison.NotificationEndpoint
		if err := client.NotificationEndpoints.Get(ctx, endpoint.Name, &read); err != nil {
			return err
		}
		if read.SigningSecret != nil || read.SigningSecretLast4 == nil {
			return errors.New("get hides the secret")
		}
		test, err := client.NotificationEndpoints.Test(ctx, endpoint.ID)
		if err != nil {
			return err
		}
		if test.Event != garrison.NotificationEventTest || test.Attempts != 1 || (test.Status != garrison.NotificationDeliveryPending && test.Status != garrison.NotificationDeliveryFailed) {
			return fmt.Errorf("test delivery %+v", test)
		}
		deliveries, err := client.NotificationEndpoints.ListDeliveries(ctx, endpoint.ID, "", nil)
		if err != nil || len(deliveries.Objects) == 0 {
			return fmt.Errorf("delivery log: %v", err)
		}
		one, err := client.NotificationEndpoints.GetDelivery(ctx, endpoint.ID, test.ID)
		if err != nil || !strings.Contains(one.Payload, `"event":"Test"`) {
			return fmt.Errorf("delivery payload: %v", err)
		}
		inactive := false
		read.Active = &inactive
		var updated garrison.NotificationEndpoint
		if err := client.NotificationEndpoints.Update(ctx, endpoint.ID, read, &updated); err != nil {
			return err
		}
		if updated.Active == nil || *updated.Active {
			return errors.New("endpoint update")
		}
		return nil
	})
	check("stdio MCP worker diagnostic", func(ctx context.Context) error {
		var nodes garrison.EnumerationResult[garrison.Node]
		if err := client.Nodes.List(ctx, nil, &nodes); err != nil {
			return err
		}
		nodeID := ""
		for _, node := range nodes.Objects {
			if node.SupportsMcpTests && node.Status == "Ready" {
				nodeID = node.ID
				break
			}
		}
		if nodeID == "" {
			return errors.New("compatible worker")
		}
		var server struct {
			ID string `json:"id"`
		}
		if err := client.McpServers.Create(ctx, map[string]any{"name": "sdk-go-stdio-" + suffix, "transport": "Stdio", "command": "garrison-fake-harness", "arguments": []string{"--mcp-stdio"}, "requiredTools": []string{"fixture_status"}}, &server); err != nil {
			return err
		}
		defer client.McpServers.Delete(ctx, server.ID)
		result, err := client.TestMcpServer(ctx, server.ID, nodeID)
		if err != nil {
			return err
		}
		found := false
		for _, name := range result.Tools {
			if name == "fixture_status" {
				found = true
			}
		}
		if !result.Success || result.NodeID != nodeID || !found {
			return errors.New("worker stdio diagnostic")
		}
		return nil
	})
	check("pipelines round trip", func(ctx context.Context) error {
		ctx, cancel := context.WithTimeout(context.Background(), 4*time.Minute)
		defer cancel()
		var editor garrison.Agent
		if err := client.Agents.Create(ctx, garrison.Agent{Name: "sdk-go-editor-" + suffix, Description: "Go SDK harness pipeline stage."}, &editor); err != nil {
			return err
		}
		defer client.Agents.Delete(ctx, editor.ID)
		var editorDeployment garrison.Deployment
		if err := client.Deployments.Create(ctx, garrison.Deployment{Name: "sdk-go-editor-" + suffix + "-fake", AgentID: editor.ID, HarnessProfileID: fakeID}, &editorDeployment); err != nil {
			return err
		}
		defer client.Deployments.Delete(ctx, editorDeployment.ID)

		name := "sdk-go-pipeline-" + suffix
		var created garrison.Pipeline
		definition := garrison.Pipeline{Name: name, Stages: []garrison.PipelineStage{
			{Name: "write", AgentID: agentID, RequiresReview: true},
			{Name: "edit", AgentID: editor.ID},
		}}
		if err := client.Pipelines.Create(ctx, definition, &created); err != nil {
			return err
		}
		deleted := false
		defer func() {
			if !deleted {
				_ = client.Pipelines.Delete(ctx, created.ID)
			}
		}()
		if !strings.HasPrefix(created.ID, "ppl_") || created.Version != 1 || len(created.Stages) != 2 || created.Stages[1].Position != 2 {
			return fmt.Errorf("created %+v", created)
		}
		var byName garrison.Pipeline
		if err := client.Pipelines.Get(ctx, name, &byName); err != nil {
			return err
		}
		if byName.ID != created.ID {
			return errors.New("get by name")
		}
		description := "Updated by the Go SDK harness."
		byName.Description = &description
		var updated garrison.Pipeline
		if err := client.Pipelines.Update(ctx, created.ID, byName, &updated); err != nil {
			return err
		}
		if updated.Version != 2 || updated.Description == nil || *updated.Description != description {
			return fmt.Errorf("update version %d", updated.Version)
		}
		var page garrison.EnumerationResult[garrison.Pipeline]
		if err := client.Pipelines.List(ctx, &garrison.ListOptions{Search: name}, &page); err != nil {
			return err
		}
		if len(page.Objects) != 1 || page.Objects[0].ID != created.ID {
			return errors.New("pipeline list")
		}
		preview, err := client.Pipelines.Preview(ctx, created.ID, garrison.PipelinePreviewRequest{Input: "Preview input", SampleOutputs: []string{"Sample stage one output"}})
		if err != nil {
			return err
		}
		if len(preview.Stages) != 2 || !preview.Stages[0].Success || preview.Stages[0].Prompt == nil || !strings.Contains(*preview.Stages[0].Prompt, "Preview input") {
			return fmt.Errorf("preview %+v", preview.Stages)
		}

		key := "sdk-go-pipeline-key-" + suffix
		started, err := client.Pipelines.Start(ctx, created.ID, garrison.PipelineStartRequest{Input: "Write a Go haiku", Wait: true, WaitSeconds: 30}, key)
		if err != nil {
			return err
		}
		if started.Status != garrison.PipelineRunStatusAwaitingReview || !strings.HasPrefix(started.ID, "plr_") || len(started.Stages) != 2 {
			return fmt.Errorf("started status %s", started.Status)
		}
		repeated, err := client.Pipelines.Start(ctx, created.ID, garrison.PipelineStartRequest{Input: "Write a Go haiku"}, key)
		if err != nil {
			return err
		}
		if repeated.ID != started.ID {
			return errors.New("idempotency key started a second pipeline run")
		}
		reviews, err := client.PipelineReviews.List(ctx, garrison.PipelineReviewFilter{Status: garrison.PipelineReviewStatusPending, PipelineRunID: started.ID})
		if err != nil {
			return err
		}
		if len(reviews.Objects) != 1 {
			return fmt.Errorf("pending reviews %d", len(reviews.Objects))
		}
		review, err := client.PipelineReviews.Get(ctx, reviews.Objects[0].ID)
		if err != nil {
			return err
		}
		decided, err := client.PipelineReviews.Decide(ctx, review.ID, garrison.PipelineReviewDecideRequest{Decision: garrison.PipelineReviewDecisionApprove, Comment: "Looks good from Go"})
		if err != nil {
			return err
		}
		if decided.Status != garrison.PipelineReviewStatusApproved || decided.DecisionSource == nil || *decided.DecisionSource != garrison.PipelineReviewSourceUser {
			return fmt.Errorf("decided status %s", decided.Status)
		}
		if _, err := client.PipelineReviews.Decide(ctx, review.ID, garrison.PipelineReviewDecideRequest{Decision: garrison.PipelineReviewDecisionReject}); !garrison.IsStatus(err, http.StatusConflict) {
			return fmt.Errorf("second decision: %v", err)
		}
		finished, err := waitPipelineRun(ctx, client, started.ID, garrison.PipelineRunStatusSucceeded)
		if err != nil {
			return err
		}
		if finished.Outcome != garrison.PipelineRunOutcomeSucceeded || len(finished.Runs) != 2 || len(finished.Reviews) != 1 {
			return fmt.Errorf("finished outcome %s runs %d reviews %d", finished.Outcome, len(finished.Runs), len(finished.Reviews))
		}
		runs, err := client.PipelineRuns.List(ctx, garrison.PipelineRunFilter{PipelineID: created.ID})
		if err != nil {
			return err
		}
		if len(runs.Objects) != 1 || runs.Objects[0].ID != started.ID {
			return fmt.Errorf("pipeline runs listed %d", len(runs.Objects))
		}

		second, err := client.Pipelines.Start(ctx, created.ID, garrison.PipelineStartRequest{Input: "Write another"}, "")
		if err != nil {
			return err
		}
		if _, err := client.PipelineRuns.Cancel(ctx, second.ID); err != nil {
			return err
		}
		if _, err := waitPipelineRun(ctx, client, second.ID, garrison.PipelineRunStatusCancelled); err != nil {
			return err
		}
		resumed, err := client.PipelineRuns.Retry(ctx, second.ID)
		if err != nil {
			return err
		}
		if resumed.Status == garrison.PipelineRunStatusCancelled {
			return errors.New("retry did not reopen the pipeline run")
		}
		if resumed.Status == garrison.PipelineRunStatusRunning || resumed.Status == garrison.PipelineRunStatusAwaitingReview {
			if _, err := client.PipelineRuns.Cancel(ctx, second.ID); err != nil {
				return err
			}
		}
		final, err := client.PipelineRuns.Get(ctx, second.ID, 30)
		if err != nil {
			return err
		}
		if final.Status == garrison.PipelineRunStatusCancelling {
			if final, err = waitPipelineRun(ctx, client, second.ID, garrison.PipelineRunStatusCancelled); err != nil {
				return err
			}
		}
		if err := client.PipelineRuns.Delete(ctx, second.ID); err != nil {
			return err
		}
		if _, err := client.PipelineRuns.Get(ctx, second.ID, 0); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("deleted pipeline run: %v", err)
		}
		if err := client.Pipelines.Delete(ctx, created.ID); err != nil {
			return err
		}
		deleted = true
		return nil
	})
	check("effect operation metadata", func(ctx context.Context) error {
		if finished == nil {
			return errors.New("no finished run")
		}
		databaseUsage, err := client.Runs.DatabaseUsage(ctx, finished.ID)
		if err != nil {
			return err
		}
		if len(databaseUsage) == 0 {
			return errors.New("missing database attribution")
		}
		for _, usage := range databaseUsage {
			if usage.RunID != finished.ID || usage.TenantID != tenant || usage.Statements == 0 {
				return errors.New("per-run database attribution")
			}
		}
		placement, err := client.Runs.Placement(ctx, finished.ID)
		if err != nil {
			return err
		}
		if placement.RunID != finished.ID || placement.Eligible {
			return errors.New("terminal placement diagnostic")
		}
		operations, err := client.Runs.Operations(ctx, finished.ID)
		if err != nil {
			return err
		}
		for _, operation := range operations {
			if operation.TenantID != tenant {
				return errors.New("journal tenant isolation")
			}
		}
		_, err = client.Runs.Operations(ctx, "run_missing_sdk")
		if !garrison.IsStatus(err, 404) {
			return errors.New("unknown journal must be 404")
		}
		if garrison.IsTerminal(garrison.RunStatusSuspended) {
			return errors.New("suspended must remain active")
		}
		return nil
	})
	check("scheduling, pinned sessions, remote admission, and key rotation", func(ctx context.Context) error {
		administrator := garrison.NewClient(baseURL)
		key := os.Getenv("GARRISON_SDK_ADMIN_API_KEY")
		if key == "" {
			key = "garrisonadmin"
		}
		administrator.UseAdminAPIKey(key, tenant)
		var scratch garrison.Tenant
		if err := administrator.Tenants.Create(ctx, map[string]any{"name": "sdk-go-weight-" + suffix, "schedulingWeight": 7}, &scratch); err != nil {
			return err
		}
		defer administrator.Tenants.Delete(ctx, scratch.ID)
		if scratch.SchedulingWeight != 7 {
			return errors.New("tenant weight create")
		}
		weight := 3
		if err := administrator.Tenants.Update(ctx, scratch.ID, garrison.TenantRequest{SchedulingWeight: &weight}, &scratch); err != nil {
			return err
		}
		if scratch.SchedulingWeight != 3 {
			return errors.New("tenant weight update")
		}
		rotated, err := administrator.Settings.RotateMasterKey(ctx)
		if err != nil {
			return err
		}
		if rotated.KeyVersion < 1 || rotated.Failed != 0 || rotated.Conflicts != 0 {
			return errors.New("rotation pass")
		}
		repeated, err := administrator.Settings.RotateMasterKey(ctx)
		if err != nil {
			return err
		}
		if repeated.Rotated != 0 || repeated.Failed != 0 {
			return errors.New("rotation idempotence")
		}
		var brokerMetadata garrison.Secret
		if err := client.Secrets.Create(ctx, map[string]any{"name": "sdk-go-broker-" + suffix, "kind": "LeaseBroker", "brokerResource": "tenant-scoped-fixture", "brokerAudience": "fixture"}, &brokerMetadata); err != nil {
			return err
		}
		defer client.Secrets.Delete(ctx, brokerMetadata.ID)
		if err := client.Secrets.Get(ctx, brokerMetadata.ID, &brokerMetadata); err != nil {
			return err
		}
		if brokerMetadata.BrokerResource == nil || *brokerMetadata.BrokerResource != "tenant-scoped-fixture" {
			return errors.New("provider metadata round trip")
		}
		err = client.Do(ctx, http.MethodPut, client.TenantPath("/secrets/"+brokerMetadata.ID+"/value"), nil, map[string]any{"value": "forbidden-static-value"}, nil)
		if !garrison.IsStatus(err, 400) {
			return errors.New("broker metadata must reject reusable static values")
		}
		var pinned garrison.HarnessProfile
		if err := client.HarnessProfiles.Create(ctx, map[string]any{"name": "sdk-go-session-" + suffix, "harnessType": "Generic", "executable": "garrison-fake-harness", "sessionFormat": "sdk-fixture-v1"}, &pinned); err != nil {
			return err
		}
		defer client.HarnessProfiles.Delete(ctx, pinned.ID)
		if err := client.HarnessProfiles.Get(ctx, pinned.ID, &pinned); err != nil {
			return err
		}
		if pinned.SessionFormat == nil || *pinned.SessionFormat != "sdk-fixture-v1" {
			return errors.New("session format round trip")
		}
		protocol, endpoint := "A2A", "http://127.0.0.1:9/a2a"
		var remote garrison.Agent
		if err := client.Agents.Create(ctx, garrison.Agent{Name: "sdk-go-remote-" + suffix, Kind: "Remote", RemoteProtocol: &protocol, RemoteEndpointURL: &endpoint}, &remote); err != nil {
			return err
		}
		defer client.Agents.Delete(ctx, remote.ID)
		_, err = client.Agents.Invoke(ctx, remote.ID, garrison.InvokeRequest{Input: "fixture", DeploymentID: deploymentID})
		var apiErr *garrison.Error
		if !errors.As(err, &apiErr) || apiErr.StatusCode != 409 || apiErr.Code != "RemoteDeploymentUnsupported" {
			return fmt.Errorf("remote admission: %v", err)
		}
		var current garrison.Deployment
		if err := client.Deployments.Get(ctx, deploymentID, &current); err != nil {
			return err
		}
		if current.SuspensionEnabled {
			return errors.New("suspension defaults to opt out")
		}
		return nil
	})
	check("conversation file spaces", func(ctx context.Context) error {
		if conversationDeploymentID == "" {
			return errors.New("no conversation deployment")
		}
		// The conversation cases delete their conversation, so this case starts its own.
		started, err := client.Agents.Invoke(ctx, agentID, garrison.InvokeRequest{Input: "File space turn from the Go SDK", Wait: true, WaitSeconds: 90, DeploymentID: conversationDeploymentID, StartConversation: true})
		if err != nil {
			return err
		}
		if started.ConversationID == nil {
			return errors.New("file space conversation missing")
		}
		conversationID := *started.ConversationID
		owner := garrison.FileSpaceOwnerConversations
		text := "# Notes\n\nWritten by the Go SDK harness.\n"
		zero := 0
		first, err := client.FileSpaces.WriteText(ctx, owner, conversationID, "notes/a.md", text, garrison.FileSpaceWriteOptions{BaseVersion: &zero, MediaType: "text/markdown"})
		if err != nil {
			return err
		}
		if first.Version != 1 || first.Conflict || first.Path != "notes/a.md" {
			return fmt.Errorf("first write %+v", *first)
		}
		second, err := client.FileSpaces.WriteText(ctx, owner, conversationID, "notes/a.md", "conflicting edit\n", garrison.FileSpaceWriteOptions{BaseVersion: &zero})
		if err != nil {
			return err
		}
		if !second.Conflict || second.Path == "notes/a.md" {
			return fmt.Errorf("stale write %+v", *second)
		}
		listing, err := client.FileSpaces.List(ctx, owner, conversationID, false)
		if err != nil {
			return err
		}
		hasPath := func(files []garrison.ConversationFile, path string) bool {
			for _, f := range files {
				if f.Path == path {
					return true
				}
			}
			return false
		}
		if !hasPath(listing.Files, "notes/a.md") || !hasPath(listing.Files, second.Path) {
			return fmt.Errorf("listing has %d files", len(listing.Files))
		}
		if listing.FileSpaceID == nil || *listing.FileSpaceID == "" {
			return errors.New("listing fileSpaceId")
		}
		versions, err := client.FileSpaces.Versions(ctx, owner, conversationID, "notes/a.md")
		if err != nil {
			return err
		}
		if len(versions) == 0 || versions[len(versions)-1].Number != 1 {
			return fmt.Errorf("versions %d", len(versions))
		}
		content, err := client.FileSpaces.Read(ctx, owner, conversationID, "notes/a.md", 0)
		if err != nil {
			return err
		}
		if string(content) != text {
			return fmt.Errorf("content %q", string(content))
		}
		link, err := client.FileSpaces.DownloadURL(ctx, owner, conversationID, "notes/a.md", 1)
		if err != nil {
			return err
		}
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, link.URL, nil)
		if err != nil {
			return err
		}
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			return err
		}
		fetched, err := io.ReadAll(response.Body)
		response.Body.Close()
		if err != nil {
			return err
		}
		if response.StatusCode != http.StatusOK || !bytes.Equal(fetched, content) {
			return fmt.Errorf("download url status %d", response.StatusCode)
		}
		if err := client.FileSpaces.Delete(ctx, owner, conversationID, second.Path); err != nil {
			return err
		}
		after, err := client.FileSpaces.List(ctx, owner, conversationID, false)
		if err != nil {
			return err
		}
		if hasPath(after.Files, second.Path) {
			return errors.New("conflict file not deleted")
		}
		turns, err := client.Conversations.ListRuns(ctx, conversationID, 25, 0)
		if err != nil {
			return err
		}
		if len(turns.Objects) == 0 {
			return errors.New("no conversation turns")
		}
		run, err := client.Runs.Get(ctx, turns.Objects[0].ID)
		if err != nil {
			return err
		}
		if run.FileSpaceID == nil || *run.FileSpaceID == "" {
			return errors.New("run fileSpaceId missing")
		}
		byRun, err := client.FileSpaces.List(ctx, garrison.FileSpaceOwnerRuns, run.ID, false)
		if err != nil {
			return err
		}
		if !hasPath(byRun.Files, "notes/a.md") {
			return errors.New("run listing missing notes/a.md")
		}
		return nil
	})
	check("capability catalog", func(ctx context.Context) error {
		catalog, err := client.Capabilities.List(ctx, nil)
		if err != nil {
			return err
		}
		if catalog.TotalRecords != int64(len(catalog.Objects)) {
			return fmt.Errorf("totalRecords %d objects %d", catalog.TotalRecords, len(catalog.Objects))
		}
		var mine *garrison.CapabilityDescriptor
		for i := range catalog.Objects {
			d := &catalog.Objects[i]
			if d.Kind == garrison.CapabilityKindAgent && d.SourceAgentID != nil && *d.SourceAgentID == agentID {
				mine = d
			}
		}
		if mine == nil {
			return errors.New("test agent has no Agent descriptor")
		}
		if mine.Origin != garrison.CapabilityOriginDerived || mine.SourceRevisionID == nil || !strings.HasPrefix(mine.ID, "cap_") {
			return fmt.Errorf("agent descriptor %+v", *mine)
		}
		agents, err := client.Capabilities.List(ctx, &garrison.CapabilityListOptions{Kind: garrison.CapabilityKindAgent})
		if err != nil {
			return err
		}
		for _, d := range agents.Objects {
			if d.Kind != garrison.CapabilityKindAgent {
				return fmt.Errorf("kind filter returned %s", d.Kind)
			}
		}
		name := "sdk-go-cap-" + suffix
		tag := "sdk-go-tag-" + suffix
		summary := "Manual descriptor from the Go SDK harness."
		schema := `{"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}`
		created, err := client.Capabilities.Create(ctx, garrison.CapabilityDescriptor{
			Name: name, Kind: garrison.CapabilityKindMcpTool, Summary: &summary, InputSchemaJSON: &schema, Tags: []string{tag},
			Requirements: []garrison.CapabilityRequirement{{Key: "garrison.io/sdk-fixture", Value: "true"}},
		})
		if err != nil {
			return err
		}
		deleted := false
		defer func() {
			if !deleted {
				_ = client.Capabilities.Delete(ctx, created.ID)
			}
		}()
		if created.Origin != garrison.CapabilityOriginManual || created.SourceKey != "manual:"+created.ID {
			return fmt.Errorf("manual descriptor %+v", *created)
		}
		hasTag := false
		for _, t := range created.Tags {
			if t == tag {
				hasTag = true
			}
		}
		if !hasTag || len(created.Requirements) != 1 || created.Requirements[0].Key != "garrison.io/sdk-fixture" {
			return fmt.Errorf("tags %v requirements %v", created.Tags, created.Requirements)
		}
		byID, err := client.Capabilities.Get(ctx, created.ID)
		if err != nil {
			return err
		}
		if byID.Name != name {
			return fmt.Errorf("read by id returned %s", byID.Name)
		}
		byName, err := client.Capabilities.Get(ctx, name)
		if err != nil {
			return err
		}
		if byName.ID != created.ID {
			return fmt.Errorf("read by name returned %s", byName.ID)
		}
		tagged, err := client.Capabilities.List(ctx, &garrison.CapabilityListOptions{Tag: tag})
		if err != nil {
			return err
		}
		if len(tagged.Objects) != 1 || tagged.Objects[0].ID != created.ID {
			return fmt.Errorf("tag filter returned %d", len(tagged.Objects))
		}
		badSchema := "[1,2]"
		var apiErr *garrison.Error
		if _, err := client.Capabilities.Create(ctx, garrison.CapabilityDescriptor{Name: name + "-bad", Kind: garrison.CapabilityKindMcpTool, InputSchemaJSON: &badSchema}); !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusBadRequest || apiErr.Code != "InvalidJsonSchema" {
			return fmt.Errorf("invalid schema should fail with 400 InvalidJsonSchema, got %v", err)
		}
		if _, err := client.Capabilities.Create(ctx, garrison.CapabilityDescriptor{Name: name, Kind: garrison.CapabilityKindMcpTool}); !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusConflict || apiErr.Code != "NameConflict" {
			return fmt.Errorf("duplicate name should fail with 409 NameConflict, got %v", err)
		}
		changed := "Updated by the Go SDK harness."
		edit := *created
		edit.Summary = &changed
		updated, err := client.Capabilities.Update(ctx, created.ID, edit)
		if err != nil {
			return err
		}
		if updated.Summary == nil || *updated.Summary != changed || len(updated.Tags) != 1 {
			return fmt.Errorf("update returned %+v", *updated)
		}
		refreshed, err := client.Capabilities.Refresh(ctx, "")
		if err != nil {
			return err
		}
		if refreshed.Agents < 0 || refreshed.HarnessBuiltIns < 0 || refreshed.Hints < 0 {
			return fmt.Errorf("refresh %+v", *refreshed)
		}
		for _, m := range refreshed.McpServers {
			if m.McpServerID == "" {
				return errors.New("refresh server entry without mcpServerId")
			}
		}
		if err := client.Capabilities.Delete(ctx, created.ID); err != nil {
			return err
		}
		deleted = true
		if _, err := client.Capabilities.Get(ctx, created.ID); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("deleted descriptor read should be 404, got %v", err)
		}
		return nil
	})
	check("fan-out groups", func(ctx context.Context) error {
		if finished == nil {
			return errors.New("no finished run")
		}
		groups, err := client.FanOutGroups.ListByRun(ctx, finished.ID)
		if err != nil {
			return err
		}
		if len(groups) != 0 {
			return fmt.Errorf("expected no fan-out groups, got %d", len(groups))
		}
		if _, err := client.FanOutGroups.Get(ctx, "fog_missing"); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("missing group read should be 404, got %v", err)
		}
		if _, err := client.FanOutGroups.Cancel(ctx, "fog_missing"); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("missing group cancel should be 404, got %v", err)
		}
		return nil
	})
	check("agentic app, delegation plan, and app revision", func(ctx context.Context) (err error) {
		if agentID == "" {
			return errors.New("no scratch agent")
		}
		name := "sdk-go-app-" + suffix
		description := "Go SDK harness app."
		role := "Talks to people"
		app, err := client.Apps.Create(ctx, garrison.AgenticApp{
			Name: name, Description: &description, EntryAgentID: agentID,
			Members:  []garrison.AgenticAppMember{{AgentID: agentID, Role: &role}},
			AuthMode: garrison.AppAuthModeAnonymous, AnonymousEnabled: true,
		})
		if err != nil {
			return err
		}
		defer func() {
			if derr := client.Apps.Delete(ctx, app.ID); derr != nil && err == nil {
				err = derr
			}
		}()
		if !strings.HasPrefix(app.ID, "app_") || app.Slug != name {
			return fmt.Errorf("app id %s slug %s", app.ID, app.Slug)
		}
		byName, err := client.Apps.Get(ctx, name)
		if err != nil {
			return err
		}
		if byName.ID != app.ID || byName.AuthMode != garrison.AppAuthModeAnonymous || !byName.AnonymousEnabled || len(byName.Members) != 1 || byName.Members[0].AgentID != agentID {
			return fmt.Errorf("read by name: %+v", byName)
		}
		plan, err := client.Apps.Delegation(ctx, app.ID)
		if err != nil {
			return err
		}
		if plan.AppID != app.ID || len(plan.Members) != 1 {
			return fmt.Errorf("delegation plan: %+v", plan)
		}
		draft, err := client.Apps.CreateRevision(ctx, app.ID, "sdk harness")
		if err != nil {
			return err
		}
		if draft.State != garrison.AgentRevisionStateDraft || len(draft.Members) != 1 {
			return fmt.Errorf("app revision: %+v", draft)
		}
		published, err := client.Apps.PublishRevision(ctx, app.ID, strconv.Itoa(draft.Number))
		if err != nil {
			return err
		}
		if published.State != garrison.AgentRevisionStatePublished || published.ID != draft.ID {
			return fmt.Errorf("published: %+v", published)
		}
		read, err := client.Apps.GetRevision(ctx, app.ID, published.ID)
		if err != nil {
			return err
		}
		if read.Number != published.Number {
			return fmt.Errorf("revision read number %d", read.Number)
		}
		revisions, err := client.Apps.Revisions(ctx, app.ID)
		if err != nil {
			return err
		}
		listed := false
		for _, r := range revisions {
			listed = listed || r.ID == published.ID
		}
		if !listed {
			return errors.New("published revision not listed")
		}
		after, err := client.Apps.Get(ctx, app.ID)
		if err != nil {
			return err
		}
		if after.LatestPublishedRevisionID == nil || *after.LatestPublishedRevisionID != published.ID {
			return fmt.Errorf("latestPublishedRevisionId %v", after.LatestPublishedRevisionID)
		}
		return nil
	})
	check("studio draft, graph, and approved apply", func(ctx context.Context) (err error) {
		var live garrison.Agent
		liveName := "sdk-go-studio-" + suffix
		if err := client.Agents.Create(ctx, garrison.Agent{Name: liveName, Description: "Go SDK studio member."}, &live); err != nil {
			return err
		}
		draftAgent := "sdk-go-draft-" + suffix
		appName := "sdk-go-studio-app-" + suffix
		draft, err := client.StudioDrafts.Create(ctx, "sdk go studio "+suffix, "")
		if err != nil {
			_ = client.Agents.Delete(ctx, live.ID)
			return err
		}
		defer func() {
			_ = client.StudioDrafts.Delete(ctx, draft.ID)
			if derr := client.Apps.Delete(ctx, appName); derr != nil && !garrison.IsStatus(derr, http.StatusNotFound) && err == nil {
				err = derr
			}
			if derr := client.Agents.Delete(ctx, draftAgent); derr != nil && !garrison.IsStatus(derr, http.StatusNotFound) && err == nil {
				err = derr
			}
			if derr := client.Agents.Delete(ctx, live.ID); derr != nil && err == nil {
				err = derr
			}
		}()
		if draft.Status != garrison.StudioDraftStatusOpen || len(draft.Items) != 0 {
			return fmt.Errorf("new draft: status %s, %d items", draft.Status, len(draft.Items))
		}
		document := "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: " + draftAgent + "\n  description: x\nspec:\n  displayName: x\n"
		edited, err := client.StudioDrafts.PutItem(ctx, draft.ID, "Agent", draftAgent, draft.Version, document, garrison.StudioDraftOperationUpsert)
		if err != nil {
			return err
		}
		if edited.Version <= draft.Version || len(edited.Items) != 1 || edited.Items[0].Name != draftAgent {
			return fmt.Errorf("after put: version %d, %d items", edited.Version, len(edited.Items))
		}
		var apiErr *garrison.Error
		_, err = client.StudioDrafts.PutItem(ctx, draft.ID, "Agent", draftAgent, draft.Version, document, "")
		if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusConflict || apiErr.Code != "DraftVersionConflict" {
			return fmt.Errorf("expected 409 DraftVersionConflict for a stale version, got %v", err)
		}
		graph, err := client.StudioDrafts.GraphOperation(ctx, draft.ID, garrison.StudioGraphOperationRequest{
			Version: edited.Version, Operation: garrison.StudioGraphOperationAddMember, App: appName, Agent: liveName,
		})
		if err != nil {
			return err
		}
		hasApp, isEntry := false, false
		for _, n := range graph.Nodes {
			if n.Kind == "AgenticApp" && n.Name == appName {
				hasApp = true
			}
			if n.Kind == "Agent" && n.Name == liveName {
				for _, e := range n.EntryOf {
					isEntry = isEntry || e == appName
				}
			}
		}
		if !hasApp || !isEntry || graph.Version <= edited.Version {
			return fmt.Errorf("graph after AddMember: %+v", graph)
		}
		read, err := client.StudioDrafts.Graph(ctx, draft.ID)
		if err != nil {
			return err
		}
		if read.Version != graph.Version || len(read.Nodes) != len(graph.Nodes) {
			return fmt.Errorf("graph read: version %d, %d nodes", read.Version, len(read.Nodes))
		}
		checkDiff := func(diff *garrison.StudioDraftDiff) error {
			if !diff.Valid || len(diff.Items) != 2 {
				return fmt.Errorf("diff: valid %v, %d items", diff.Valid, len(diff.Items))
			}
			for _, item := range diff.Items {
				if item.Change != "Create" {
					return fmt.Errorf("diff item %s/%s is %s", item.Kind, item.Name, item.Change)
				}
			}
			return nil
		}
		diff, err := client.StudioDrafts.Diff(ctx, draft.ID)
		if err != nil {
			return err
		}
		if err := checkDiff(diff); err != nil {
			return err
		}
		validated, err := client.StudioDrafts.Validate(ctx, draft.ID)
		if err != nil {
			return err
		}
		if err := checkDiff(validated); err != nil {
			return err
		}
		approval, err := client.StudioDrafts.RequestApply(ctx, draft.ID, graph.Version)
		if err != nil {
			return err
		}
		if approval.Kind != garrison.ApprovalKindDraftApply || approval.DraftID == nil || *approval.DraftID != draft.ID || approval.Status != garrison.ApprovalStatusPending {
			return fmt.Errorf("draft approval: kind %s status %s", approval.Kind, approval.Status)
		}
		if _, err := client.Approvals.Decide(ctx, approval.ID, garrison.ApprovalDecideRequest{Decision: garrison.ApprovalDecisionAllow}); err != nil {
			return err
		}
		applied, err := client.StudioDrafts.Get(ctx, draft.ID)
		if err != nil {
			return err
		}
		if applied.Status != garrison.StudioDraftStatusApplied {
			return fmt.Errorf("draft status after allow: %s", applied.Status)
		}
		if _, err := client.Apps.Get(ctx, appName); err != nil {
			return fmt.Errorf("applied app: %w", err)
		}
		return nil
	})
	check("architect prompts", func(ctx context.Context) (err error) {
		prompts, err := client.StudioDrafts.ArchitectPrompts(ctx)
		if err != nil {
			return err
		}
		if len(prompts) == 0 || prompts[0].Name != "builtin/agent-architect" || !prompts[0].IsBuiltIn {
			return fmt.Errorf("architect prompts: %+v", prompts)
		}
		clone, err := client.PromptTemplates.Clone(ctx, prompts[0].ID, "sdk-go-architect-"+suffix)
		if err != nil {
			return err
		}
		var dep garrison.Deployment
		defer func() {
			if dep.ID != "" {
				if derr := client.Deployments.Delete(ctx, dep.ID); derr != nil && err == nil {
					err = derr
				}
			}
			if derr := client.PromptTemplates.Delete(ctx, clone.ID); derr != nil && err == nil {
				err = derr
			}
		}()
		var architect garrison.Agent
		if err := client.Agents.Get(ctx, "agent-architect", &architect); err != nil {
			return err
		}
		if err := client.Deployments.Create(ctx, garrison.Deployment{
			Name: "sdk-go-architect-" + suffix, AgentID: architect.ID, HarnessProfileID: "hrn_builtin_fake", ArchitectPromptTemplateID: &clone.ID,
		}, &dep); err != nil {
			return err
		}
		if dep.ManagementAccess != garrison.ManagementAccessDrafts {
			return fmt.Errorf("architect deployment managementAccess %q", dep.ManagementAccess)
		}
		selection, err := client.StudioDrafts.ArchitectPrompt(ctx, dep.ID)
		if err != nil {
			return err
		}
		if selection.ArchitectPromptTemplateID != clone.ID {
			return fmt.Errorf("architect prompt %s, want %s", selection.ArchitectPromptTemplateID, clone.ID)
		}
		changed, err := client.StudioDrafts.SetArchitectPrompt(ctx, dep.ID, "builtin/agent-architect", nil)
		if err != nil {
			return err
		}
		if changed.ArchitectPromptName != "builtin/agent-architect" {
			return fmt.Errorf("architect prompt after set: %s", changed.ArchitectPromptName)
		}
		if _, err := client.PromptTemplates.Reset(ctx, clone.ID); err != nil {
			return err
		}
		rendered, err := client.PromptTemplates.RenderContent(ctx, "Architect for {{agent.displayName}}", map[string]any{"agent": map[string]any{"displayName": "Render Bot"}})
		if err != nil {
			return err
		}
		if !strings.Contains(rendered.Rendered, "Render Bot") {
			return fmt.Errorf("ad hoc render %q", rendered.Rendered)
		}
		return nil
	})
	check("app gateway chat with the support triage bundle", func(ctx context.Context) error {
		bundlePath := findExample("support-triage/support-triage.yaml")
		if bundlePath == "" {
			fmt.Println("      (examples/agentic-apps not found above the working directory; gateway chat skipped)")
			return nil
		}
		bundle, err := os.ReadFile(bundlePath)
		if err != nil {
			return err
		}
		applied, err := client.Manifests.Apply(ctx, string(bundle), false, false)
		if err != nil {
			return err
		}
		if applied.FailedCount != 0 {
			return fmt.Errorf("bundle apply failed %d", applied.FailedCount)
		}
		app, err := client.Apps.Get(ctx, "support-triage")
		if err != nil {
			return err
		}
		gateway := client.AppGateway(app.Slug)
		info, err := gateway.Info(ctx)
		if err != nil {
			return err
		}
		if info.Slug != app.Slug || info.AuthMode != garrison.AppAuthModeAnonymous || !info.AnonymousAllowed {
			return fmt.Errorf("app info %+v", info)
		}
		if !strings.HasSuffix(gateway.LogoURL(), "/v1.0/apps/"+app.Slug+"/logo") {
			return fmt.Errorf("logo URL %s", gateway.LogoURL())
		}
		if _, err := gateway.Logo(ctx); !garrison.IsStatus(err, http.StatusNotFound) {
			return fmt.Errorf("logo of an app without one: %v", err)
		}
		session, err := gateway.StartSession(ctx, "", "")
		if err != nil {
			return err
		}
		if !session.Anonymous || !strings.HasPrefix(session.Token, "gas_") || gateway.Token() != session.Token {
			return fmt.Errorf("session %+v", session)
		}
		started, err := gateway.StartConversation(ctx, "My invoice was charged twice.")
		if err != nil {
			return err
		}
		var names []string
		if err := gateway.StreamTurn(ctx, started.ConversationID, started.Turn.RunID, 0, func(item garrison.AppTurnStreamItem) bool {
			names = append(names, item.Name)
			return true
		}); err != nil {
			return err
		}
		if len(names) == 0 || names[len(names)-1] != "turn.completed" {
			return fmt.Errorf("turn stream %v", names)
		}
		turn, err := gateway.WaitForTurn(ctx, started.ConversationID, started.Turn.RunID)
		if err != nil {
			return err
		}
		if turn.Status != "Succeeded" || turn.Answer == nil || *turn.Answer == "" {
			return fmt.Errorf("turn %+v", turn)
		}
		view, err := gateway.Conversation(ctx, started.ConversationID)
		if err != nil {
			return err
		}
		if view.ID != started.ConversationID || len(view.Turns) != 1 {
			return fmt.Errorf("conversation %+v", view)
		}
		listed, err := gateway.Conversations(ctx)
		if err != nil {
			return err
		}
		found := false
		for _, c := range listed {
			found = found || c.ID == started.ConversationID
		}
		if !found {
			return fmt.Errorf("conversation not listed")
		}
		if _, err := gateway.Files(ctx, started.ConversationID); err != nil {
			return err
		}
		var first *garrison.AppFilesChanged
		if err := gateway.StreamFiles(ctx, started.ConversationID, func(changed garrison.AppFilesChanged) bool {
			first = &changed
			return false
		}); err != nil {
			return err
		}
		if first == nil || first.ConversationID != started.ConversationID {
			return fmt.Errorf("files.changed %+v", first)
		}
		if err := gateway.EndSession(ctx); err != nil {
			return err
		}
		if gateway.Token() != "" {
			return fmt.Errorf("EndSession kept the token")
		}
		if _, err := gateway.Conversations(ctx); !garrison.IsStatus(err, http.StatusUnauthorized) {
			return fmt.Errorf("conversations without a session: %v", err)
		}
		return nil
	})
	check("playground and compile preview of a draft revision", func(ctx context.Context) (err error) {
		var agent garrison.Agent
		if err := client.Agents.Create(ctx, garrison.Agent{Name: "sdk-go-playground-" + suffix, Description: "Go SDK harness playground agent."}, &agent); err != nil {
			return err
		}
		var dev garrison.Deployment
		defer func() {
			if dev.ID != "" {
				if derr := client.Deployments.Delete(ctx, dev.ID); derr != nil && err == nil {
					var apiErr *garrison.Error
					if !errors.As(derr, &apiErr) || apiErr.StatusCode != http.StatusNotFound {
						err = derr
					}
				}
			}
			if derr := client.Agents.Delete(ctx, agent.ID); derr != nil && err == nil {
				err = derr
			}
		}()
		if err := client.Deployments.Create(ctx, garrison.Deployment{
			Name: "sdk-go-playground-" + suffix, AgentID: agent.ID, HarnessProfileID: "hrn_builtin_fake", Environment: "dev",
		}, &dev); err != nil {
			return err
		}
		draft, err := client.Agents.SaveDraft(ctx, agent.ID, garrison.AgentRevision{Description: "Go SDK playground draft " + suffix})
		if err != nil {
			return err
		}
		if draft.State != garrison.AgentRevisionStateDraft {
			return fmt.Errorf("draft state %s", draft.State)
		}
		wait := true
		run, err := client.Agents.PlaygroundInvoke(ctx, agent.Name, garrison.PlaygroundInvokeRequest{
			Input: "Hello from the Go SDK playground", AgentRevisionID: draft.ID, Wait: &wait, WaitSeconds: 60,
		})
		if err != nil {
			return err
		}
		if run.Status != "Succeeded" {
			return fmt.Errorf("playground status %s", run.Status)
		}
		if run.Kind != garrison.RunKindPlayground {
			return fmt.Errorf("playground kind %s", run.Kind)
		}
		if run.AgentRevisionID == nil || *run.AgentRevisionID != draft.ID {
			return fmt.Errorf("playground revision %v, want %s", run.AgentRevisionID, draft.ID)
		}
		preview, err := client.Deployments.CompilePreview(ctx, dev.ID, garrison.CompilePreviewRequest{Input: "Preview the draft", AgentRevisionID: draft.ID})
		if err != nil {
			return err
		}
		if preview.AgentRevisionID == nil || *preview.AgentRevisionID != draft.ID {
			return fmt.Errorf("preview revision %v, want %s", preview.AgentRevisionID, draft.ID)
		}
		if preview.DeploymentID != dev.ID {
			return fmt.Errorf("preview deployment %s, want %s", preview.DeploymentID, dev.ID)
		}
		return nil
	})
	check("cleanup", func(ctx context.Context) error {
		if conversationDeploymentID != "" {
			if err := client.Deployments.Delete(ctx, conversationDeploymentID); err != nil {
				return err
			}
		}
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

// waitPipelineRun waits until a pipeline run reaches status (or any terminal status) and fails otherwise.
func waitPipelineRun(ctx context.Context, client *garrison.Client, id, status string) (*garrison.PipelineRun, error) {
	deadline := time.Now().Add(90 * time.Second)
	for {
		run, err := client.PipelineRuns.Get(ctx, id, 20)
		if err != nil {
			return nil, err
		}
		if run.Status == status {
			return run, nil
		}
		terminal := run.Status == garrison.PipelineRunStatusSucceeded || run.Status == garrison.PipelineRunStatusFailed || run.Status == garrison.PipelineRunStatusCancelled || run.Status == garrison.PipelineRunStatusTimedOut
		if terminal || time.Now().After(deadline) {
			message := ""
			if run.ErrorMessage != nil {
				message = *run.ErrorMessage
			}
			return nil, fmt.Errorf("pipeline run %s is %s (%s), expected %s", id, run.Status, message, status)
		}
		time.Sleep(200 * time.Millisecond)
	}
}

// findExample looks for examples/agentic-apps/<relative> in the working directory and each directory above it.
func findExample(relative string) string {
	directory, err := os.Getwd()
	if err != nil {
		return ""
	}
	for {
		candidate := filepath.Join(directory, "examples", "agentic-apps", filepath.FromSlash(relative))
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
		parent := filepath.Dir(directory)
		if parent == directory {
			return ""
		}
		directory = parent
	}
}
