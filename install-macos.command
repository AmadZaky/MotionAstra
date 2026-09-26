#!/bin/bash
# Double-click the extracted release launcher. No Python/Node dependency.
ma_fail() { printf 'Error: %s\n' "$*" >&2; return 1; }
ma_owned() { [ -f "$1/CSXS/manifest.xml" ] && grep -Eq "ExtensionBundleId=['\"]com\.motionastra\.fx['\"]" "$1/CSXS/manifest.xml"; }
ma_verify() {
  local folder="$1" item
  for item in CSXS/manifest.xml index.html jsx/hostscript.jsx jsx/presets-data.jsx VERSION SHA256SUMS; do
    [ -f "$folder/$item" ] || { ma_fail "Incomplete package: $item. Extract the entire release ZIP first."; return 1; }
  done
  ma_owned "$folder" || { ma_fail 'The payload is not MotionAstra.'; return 1; }
  [ -z "$(find "$folder" -type l -print -quit)" ] || { ma_fail 'Linked files are not supported in the payload.'; return 1; }
  # Checksums may reference only plain relative package paths.
  while IFS= read -r item; do
    [[ "$item" =~ ^[0-9a-f]{64}\ \ [A-Za-z0-9_.\ /-]+$ ]] || { ma_fail 'Invalid checksum list.'; return 1; }
    case "${item:66}" in /*|../*|*/../*|*/..) ma_fail 'Unsafe checksum path.'; return 1;; esac
  done < "$folder/SHA256SUMS"
  [ -s "$folder/SHA256SUMS" ] || { ma_fail 'Empty checksum list.'; return 1; }
  (cd "$folder" && shasum -a 256 -c SHA256SUMS >/dev/null) || { ma_fail 'Package checksum failed. Download and extract the release again.'; return 1; }
}
# File transaction is separate from OS preferences so it can be tested safely.
ma_install() (
  set -Eeuo pipefail
  local payload="$1" extension_root="$2" backup_root="$3" root candidate answer version transaction destination
  shift 3
  ma_verify "$payload" || exit 1
  payload="$(cd "$payload" && pwd -P)" || exit 1
  mkdir -p "$extension_root" "$backup_root" || exit 1
  extension_root="$(cd "$extension_root" && pwd -P)" || exit 1
  destination="$extension_root/MotionAstra-FX"
  local old=() saved=() count=0 moved=0 installed=0 success=0 i
  for root in "$extension_root" "$@"; do
    [ -d "$root" ] || continue
    for candidate in "$root"/* "$root"/.[!.]* "$root"/..?*; do
      [ -d "$candidate" ] || continue
      if ma_owned "$candidate"; then
        [ ! -L "$candidate" ] || { ma_fail "Linked old install: $candidate. Remove that link manually first."; exit 1; }
        candidate="$(cd "$candidate" && pwd -P)"
        case "$payload/" in "$candidate/"*) ma_fail 'Run the installer from Downloads, outside the installed panel.'; exit 1;; esac
        for ((i=0;i<count;i++)); do [ "${old[$i]}" != "$candidate" ] || continue 2; done
        old[$count]="$candidate"; count=$((count+1))
      fi
    done
  done
  if [ -e "$destination" ] || [ -L "$destination" ]; then
    ma_owned "$destination" || { ma_fail "Unrecognized folder at $destination; nothing was removed."; exit 1; }
  fi
  version="$(cat "$payload/VERSION")"
  printf 'Install MotionAstra %s to:\n%s\n' "$version" "$destination"
  if [ "$count" -gt 0 ]; then
    printf '\nExisting MotionAstra installation(s):\n'
    for ((i=0;i<count;i++)); do printf '  %s\n' "${old[$i]}"; done
    printf 'Remove these active copies and install the new version? Backups will be kept. [y/N] '
    IFS= read -r answer || answer=''
    case "$answer" in y|Y|yes|YES) ;; *) echo 'Cancelled. Existing installations unchanged.'; exit 2;; esac
    for ((i=0;i<count;i++)); do
      [ -w "$(dirname "${old[$i]}")" ] || { ma_fail "No permission to replace ${old[$i]}. Move it out of CEP/extensions using Finder (administrator approval may be required), then run this installer again."; exit 1; }
    done
  fi
  transaction="$(mktemp -d "$backup_root/install-XXXXXXXX")" || exit 1
  ma_rollback() {
    local status=$? j
    trap - EXIT INT TERM
    if [ "$success" -ne 1 ]; then
      if [ "$installed" -eq 1 ]; then rm -rf "$destination"; fi
      for ((j=moved-1;j>=0;j--)); do
        if ! mv "${saved[$j]}" "${old[$j]}"; then printf 'Restore manually: %s -> %s\n' "${saved[$j]}" "${old[$j]}" >&2; fi
      done
    fi
    if [ -d "$transaction/new" ]; then rm -rf "$transaction/new"; fi
    if [ "$success" -ne 1 ]; then rmdir "$transaction" 2>/dev/null || true; fi
    exit "$status"
  }
  trap ma_rollback EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  cp -R "$payload" "$transaction/new" || exit 1
  ma_verify "$transaction/new" || exit 1
  for ((i=0;i<count;i++)); do
    saved[$i]="$transaction/previous-$i"
    mv "${old[$i]}" "${saved[$i]}" || exit 1
    moved=$((moved+1))
    printf '%s -> %s\n' "${saved[$i]}" "${old[$i]}" >> "$transaction/RESTORE.txt"
  done
  mv "$transaction/new" "$destination" || exit 1
  installed=1
  ma_verify "$destination" || exit 1
  success=1
  echo "Installed MotionAstra $version."
  if [ "$count" -gt 0 ]; then echo "Previous versions backed up to: $transaction"; else rmdir "$transaction"; fi
)
ma_main() {
  local base payload result
  [ "$(uname -s)" = Darwin ] || { ma_fail 'Use the Windows launcher on Windows; this launcher requires macOS.'; return 1; }
  if pgrep -f '/(Adobe )?After Effects[^/]*\.app/Contents/MacOS/' >/dev/null 2>&1; then ma_fail 'Close After Effects before installing.'; return 1; fi
  base="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
  payload="$base/MotionAstra-FX"
  # Release ZIP places the panel beside this launcher.
  if ma_install "$payload" "$HOME/Library/Application Support/Adobe/CEP/extensions" "$HOME/Library/Application Support/MotionAstra Backups" '/Library/Application Support/Adobe/CEP/extensions'; then
    :
  else
    result=$?
    [ "$result" -eq 2 ] && return 0
    return 1
  fi
  if defaults write com.adobe.CSXS.12 PlayerDebugMode -string '1' && defaults write com.adobe.CSXS.11 PlayerDebugMode -string '1'; then
    echo 'Enabled unsigned CEP panels for this user (PlayerDebugMode 11/12).'
  else echo 'Panel files installed, but CEP debug preferences could not be set. See INSTALLATION_GUIDE.md.' >&2; return 1; fi
  echo 'Restart AE. Open Window > Extensions > MotionAstra FX.'
}
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  ma_main; result=$?
  printf '\nPress Return to close.'; read -r ignored || true
  exit "$result"
fi
