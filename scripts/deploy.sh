#!/usr/bin/env bash
#
# Deploy Reversi: fetch a tag or commit from GitHub, build it and switch the
# `current` symlink to the new release.
#
# Layout:
#   $BASE_DIR/releases/<name>/  built site (contents of dist/); name is the tag
#                               or the first 12 characters of the commit hash
#   $BASE_DIR/current           symlink to the active release
#
# Usage:
#   deploy.sh <tag>             e.g. deploy.sh v0.1.1
#   deploy.sh <commit-sha>      full or short (7+ characters) hash
#   deploy.sh --rollback        switch to the previous release
#   deploy.sh --list            list releases (active one is marked)
#
# Environment overrides:
#   BASE_DIR   default /var/www/reversi.example.org
#   REPO_URL   default https://github.com/tuxonice/reversi.git
#   KEEP       number of releases to keep, default 5

set -euo pipefail

BASE_DIR="${BASE_DIR:-/var/www/reversi.example.org}"
REPO_URL="${REPO_URL:-https://github.com/tuxonice/reversi.git}"
KEEP="${KEEP:-5}"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
MIN_NODE_MAJOR=24

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

active_release() {
  [[ -L "$CURRENT_LINK" ]] && basename "$(readlink -f "$CURRENT_LINK")" || true
}

# Atomically point `current` at a release directory.
switch_to() {
  local target="$1"
  ln -sfn "$target" "$BASE_DIR/.current.tmp"
  mv -T "$BASE_DIR/.current.tmp" "$CURRENT_LINK"
}

list_releases() {
  local active
  active="$(active_release)"
  # newest first
  ls -1t "$RELEASES_DIR" 2>/dev/null | while read -r r; do
    if [[ "$r" == "$active" ]]; then echo "* $r (active)"; else echo "  $r"; fi
  done
}

rollback() {
  local active previous
  active="$(active_release)"
  [[ -n "$active" ]] || die "no active release"
  previous="$(ls -1t "$RELEASES_DIR" | grep -vx -- "$active" | head -n1 || true)"
  [[ -n "$previous" ]] || die "no previous release to roll back to"
  switch_to "$RELEASES_DIR/$previous"
  log "Rolled back: $active -> $previous"
}

case "${1:-}" in
  ""|-h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  --list) list_releases; exit 0 ;;
esac

mkdir -p "$RELEASES_DIR"

# One deploy at a time.
exec 9>"$BASE_DIR/.deploy.lock"
flock -n 9 || die "another deploy is running"

if [[ "$1" == "--rollback" ]]; then
  rollback
  exit 0
fi

REF="$1"
if [[ "$REF" =~ ^[0-9a-f]{7,40}$ ]]; then
  IS_HASH=1
  if [[ ${#REF} -eq 40 ]]; then
    FETCH_SPEC="$REF"          # exact commit, shallow fetch
  else
    FETCH_SPEC=""              # short hash: needs branch history to resolve
  fi
elif [[ "$REF" =~ ^[A-Za-z0-9._-]+$ && "$REF" != -* ]]; then
  IS_HASH=0
  # Fully qualified so a branch with the same name can never be picked up.
  FETCH_SPEC="refs/tags/$REF:refs/tags/$REF"
  RELEASE_NAME="$REF"
else
  die "invalid ref '$REF': give a tag name or a commit hash (7-40 characters)"
fi

command -v git >/dev/null || die "git is not installed"
command -v node >/dev/null || die "node is not installed"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
(( NODE_MAJOR >= MIN_NODE_MAJOR )) || die "Node $MIN_NODE_MAJOR+ required, found $(node -v)"

BUILD_DIR="$(mktemp -d "$BASE_DIR/.build.XXXXXX")"
trap 'rm -rf "$BUILD_DIR"' EXIT

log "Fetching $REF"
SRC="$BUILD_DIR/src"
git init --quiet "$SRC"
if [[ "$IS_HASH" == 1 && -z "$FETCH_SPEC" ]]; then
  git -C "$SRC" fetch --quiet "$REPO_URL" '+refs/heads/*:refs/remotes/origin/*' \
    || die "could not fetch $REPO_URL"
  FULL_SHA="$(git -C "$SRC" rev-parse --verify --quiet "$REF^{commit}")" \
    || die "'$REF' is unknown or ambiguous; use a longer hash"
  git -C "$SRC" checkout --quiet --detach "$FULL_SHA"
else
  git -C "$SRC" fetch --quiet --depth 1 "$REPO_URL" "$FETCH_SPEC" \
    || die "could not fetch '$REF' (is it an existing tag or a commit hash?)"
  git -C "$SRC" checkout --quiet --detach FETCH_HEAD
  FULL_SHA="$(git -C "$SRC" rev-parse HEAD)"
  if [[ "$IS_HASH" == 1 && "$FULL_SHA" != "$REF" ]]; then
    die "fetched commit does not match $REF"
  fi
fi
if [[ "$IS_HASH" == 1 ]]; then
  RELEASE_NAME="${FULL_SHA:0:12}"
fi
log "Commit $FULL_SHA"

RELEASE_DIR="$RELEASES_DIR/$RELEASE_NAME"
[[ ! -e "$RELEASE_DIR" ]] || die "release $RELEASE_NAME already exists (remove it first to redeploy)"

log "Installing dependencies"
(cd "$BUILD_DIR/src" && npm ci --no-audit --no-fund)

log "Running checks"
(cd "$BUILD_DIR/src" && npm run check)

log "Building"
(cd "$BUILD_DIR/src" && npm run build)
[[ -f "$BUILD_DIR/src/dist/index.html" ]] || die "build produced no dist/index.html"

log "Publishing release $RELEASE_NAME"
mv "$BUILD_DIR/src/dist" "$RELEASE_DIR"
chmod -R u=rwX,go=rX "$RELEASE_DIR"

PREVIOUS="$(active_release)"
switch_to "$RELEASE_DIR"
log "Active release: ${PREVIOUS:-none} -> $RELEASE_NAME"

# Prune old releases, never the active one.
ACTIVE="$(active_release)"
ls -1t "$RELEASES_DIR" | tail -n +"$((KEEP + 1))" | while read -r old; do
  [[ "$old" == "$ACTIVE" ]] && continue
  log "Removing old release $old"
  rm -rf "${RELEASES_DIR:?}/$old"
done

log "Done"
