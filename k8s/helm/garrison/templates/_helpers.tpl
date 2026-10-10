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
