#!/bin/sh
# Read-only preflight for the Git Master skill. It never prints credential values.

set -u

usage() {
    printf '%s\n' "usage: $0 --provider github|gitlab --host HOST --project NAMESPACE/PROJECT --expected-account ACCOUNT --operation OPERATION --authorization AUTHORIZATION [--glab-alias glab-personal|glab-work]" >&2
    exit 64
}

provider= host= project= expected_account= operation= authorization= glab_alias=
while [ "$#" -gt 0 ]; do
    case "$1" in
        --provider|--host|--project|--expected-account|--operation|--authorization|--glab-alias)
            [ "$#" -ge 2 ] || usage
            key=$1; value=$2; shift 2
            case "$key" in
                --provider) provider=$value ;; --host) host=$value ;;
                --project) project=$value ;; --expected-account) expected_account=$value ;;
                --operation) operation=$value ;; --authorization) authorization=$value ;;
                --glab-alias) glab_alias=$value ;;
            esac
            ;;
        *) usage ;;
    esac
done
[ -n "$provider" ] && [ -n "$host" ] && [ -n "$project" ] && [ -n "$expected_account" ] && [ -n "$operation" ] && [ -n "$authorization" ] || usage

real_executable() {
    command_path=$(command -v "$1" 2>/dev/null || :)
    [ -n "$command_path" ] && [ -f "$command_path" ] && [ -x "$command_path" ]
}

has_github_override=false
[ "${GH_TOKEN+x}" = x ] && has_github_override=true
[ "${GITHUB_TOKEN+x}" = x ] && has_github_override=true
has_gitlab_override=false
[ "${GITLAB_TOKEN+x}" = x ] && has_gitlab_override=true
[ "${GITLAB_ACCESS_TOKEN+x}" = x ] && has_gitlab_override=true
[ "${OAUTH_TOKEN+x}" = x ] && has_gitlab_override=true

result() { printf 'status=%s\n' "$1"; exit "${2:-0}"; }

json_string_field() {
    # Provider responses stay in-process; only the requested scalar is returned.
    sed -n "s/.*\\\"$1\\\"[[:space:]]*:[[:space:]]*\\\"\\([^\\\"]*\\)\\\".*/\\1/p" | sed -n '1p'
}

github() {
    real_executable gh || result cli_missing 1
    gh_auth_host() { gh auth status --hostname "$host" >/dev/null 2>&1; }
    gh_auth_any_host() { gh auth status >/dev/null 2>&1; }
    gh_auth_without_overrides() { (unset GH_TOKEN GITHUB_TOKEN; gh auth status --hostname "$host" >/dev/null 2>&1); }
    gh_any_without_overrides() { (unset GH_TOKEN GITHUB_TOKEN; gh auth status >/dev/null 2>&1); }
    if ! gh_auth_host; then
        if [ "$has_github_override" = true ] && gh_auth_without_overrides; then result environment_token_invalid 1; fi
        if gh_any_without_overrides; then result wrong_host 1; fi
        result stored_credential_invalid 1
    fi
    actual_account=$(gh api user --hostname "$host" --jq .login 2>/dev/null) || result stored_credential_invalid 1
    [ "$actual_account" = "$expected_account" ] || result wrong_account 1
    actual_project=$(gh api "repos/$project" --hostname "$host" --jq .full_name 2>/dev/null) || result project_mismatch 1
    [ "$actual_project" = "$project" ] || result project_mismatch 1
    result ready
}

gitlab() {
    case "$glab_alias" in glab-personal|glab-work) ;; *) usage ;; esac
    real_executable "$glab_alias" || result cli_missing 1
    glab_auth_host() { "$glab_alias" auth status --hostname "$host" >/dev/null 2>&1; }
    glab_auth_any_host() { "$glab_alias" auth status >/dev/null 2>&1; }
    glab_auth_without_overrides() { (unset GITLAB_TOKEN GITLAB_ACCESS_TOKEN OAUTH_TOKEN; "$glab_alias" auth status --hostname "$host" >/dev/null 2>&1); }
    glab_any_without_overrides() { (unset GITLAB_TOKEN GITLAB_ACCESS_TOKEN OAUTH_TOKEN; "$glab_alias" auth status >/dev/null 2>&1); }
    if ! glab_auth_host; then
        if [ "$has_gitlab_override" = true ] && glab_auth_without_overrides; then result environment_token_invalid 1; fi
        if glab_any_without_overrides; then result wrong_host 1; fi
        result stored_credential_invalid 1
    fi
    actual_account=$("$glab_alias" api user --hostname "$host" 2>/dev/null | json_string_field username) || result stored_credential_invalid 1
    [ -n "$actual_account" ] || result stored_credential_invalid 1
    [ "$actual_account" = "$expected_account" ] || result wrong_account 1
    encoded_project=$(printf '%s' "$project" | sed 's|/|%2F|g')
    actual_project=$("$glab_alias" api "projects/$encoded_project" --hostname "$host" 2>/dev/null | json_string_field path_with_namespace) || result project_mismatch 1
    [ "$actual_project" = "$project" ] || result project_mismatch 1
    result ready
}

case "$provider" in github) github ;; gitlab) gitlab ;; *) usage ;; esac
