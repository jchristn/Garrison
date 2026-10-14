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
	"net/url"
	"os"
	"regexp"
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
		for _, p := range profiles {
			if p.Name == "builtin/provider-api" && p.HarnessType == "ProviderApi" {
				providerFound = true
			}
		}
		if !providerFound {
			return errors.New("optional provider profile not found")
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
