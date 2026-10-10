{{/* Namespace. */}}
{{- define "garrison.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride -}}
{{- end -}}

{{/* Image reference: registry/name:tag where tag defaults to v + appVersion. */}}
{{- define "garrison.image" -}}
{{- $tag := default (printf "v%s" .root.Chart.AppVersion) .root.Values.image.tag -}}
{{- printf "%s/%s:%s" .root.Values.image.registry .name $tag -}}
{{- end -}}

{{/* Common labels. */}}
{{- define "garrison.labels" -}}
app.kubernetes.io/part-of: garrison
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}

{{/* Fully qualified server service host. */}}
{{- define "garrison.serverHost" -}}
{{- printf "garrison-server.%s.svc.cluster.local" (include "garrison.namespace" .) -}}
{{- end -}}

{{/* Exec curl probe. */}}
{{- define "garrison.probe" -}}
exec:
  command: ["curl", "-fsS", "-o", "/dev/null", {{ .url | quote }}]
periodSeconds: 5
timeoutSeconds: 4
failureThreshold: {{ .failure }}
successThreshold: {{ .success }}
{{- end -}}

{{/* Database environment for the server. */}}
{{- define "garrison.dbEnv" -}}
{{- if eq .Values.database.mode "external" }}
{{- range $pair := list (list "GARRISON_DB_HOST" "host") (list "GARRISON_DB_PORT" "port") (list "GARRISON_DB_DATABASE" "database") (list "GARRISON_DB_USERNAME" "username") (list "GARRISON_DB_PASSWORD" "password") }}
- name: {{ index $pair 0 }}
  valueFrom:
    secretKeyRef:
      name: {{ $.Values.database.external.secretName }}
      key: {{ index $pair 1 }}
{{- end }}
{{- else }}
- name: GARRISON_DB_HOST
  value: garrison-postgres
- name: GARRISON_DB_PORT
  value: "5432"
- name: GARRISON_DB_DATABASE
  value: garrison
- name: GARRISON_DB_USERNAME
  value: garrison
- name: GARRISON_DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.main }}
      key: db-password
{{- end }}
{{- end -}}

{{/* Observability environment for the server: OTLP export to Alloy, browser-facing URLs for the dashboard, and
in-cluster URLs the server probes. Empty unless observability.enabled. */}}
{{- define "garrison.observabilityServerEnv" -}}
{{- if .Values.observability.enabled }}
- { name: GARRISON_OTLP_ENABLE, value: {{ .Values.observability.otlp.enabled | quote }} }
- { name: GARRISON_OTLP_ENDPOINT, value: "http://garrison-alloy:4317" }
- { name: GARRISON_GRAFANA_URL, value: {{ .Values.observability.urls.grafana | quote }} }
- { name: GARRISON_PROMETHEUS_URL, value: {{ .Values.observability.urls.prometheus | quote }} }
- { name: GARRISON_LOKI_URL, value: {{ .Values.observability.urls.loki | quote }} }
- { name: GARRISON_TEMPO_URL, value: {{ .Values.observability.urls.tempo | quote }} }
- { name: GARRISON_GRAFANA_INTERNAL_URL, value: "http://garrison-grafana:3000" }
- { name: GARRISON_PROMETHEUS_INTERNAL_URL, value: "http://garrison-prometheus:9090" }
- { name: GARRISON_LOKI_INTERNAL_URL, value: "http://garrison-loki:3100" }
- { name: GARRISON_TEMPO_INTERNAL_URL, value: "http://garrison-tempo:3200" }
{{- end }}
{{- end -}}

{{/* Restricted container security context shared by the observability containers. */}}
{{- define "garrison.observabilityContainerSecurity" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: {{ . }}
capabilities: { drop: ["ALL"] }
{{- end -}}

{{/* PersistentVolumeClaim for an observability component. */}}
{{- define "garrison.observabilityPvc" -}}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ .name }}
  namespace: {{ include "garrison.namespace" .root }}
  labels:
    {{- include "garrison.labels" .root | nindent 4 }}
spec:
  accessModes: ["ReadWriteOnce"]
  {{- if .values.storageClassName }}
  storageClassName: {{ .values.storageClassName }}
  {{- end }}
  resources:
    requests:
      storage: {{ .values.storage }}
{{- end -}}
