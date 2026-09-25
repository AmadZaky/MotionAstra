#!/bin/bash
# Run: bash install-macos.command (from the extracted source folder).
set -eu
if pgrep -f '/Adobe After Effects[^/]*/.*After Effects' >/dev/null 2>&1; then
  echo 'Close After Effects before installing.' >&2
  exit 1
fi
source_root="$(cd "$(dirname "$0")" && pwd -P)"
extension_root="$HOME/Library/Application Support/Adobe/CEP/extensions"
destination="$extension_root/MotionAstra-FX"
if [ "$source_root" = "$destination" ]; then
  echo 'Run from the extracted download, outside CEP/extensions.' >&2
  exit 1
fi
[ -f "$source_root/CSXS/manifest.xml" ] || { echo 'Incomplete source folder.' >&2; exit 1; }
mkdir -p "$extension_root"
if [ -e "$destination" ]; then
  backup_root="$HOME/Library/Application Support/MotionAstra Backups"
  mkdir -p "$backup_root"
  backup="$backup_root/MotionAstra-FX-$(date +%Y%m%d-%H%M%S)-$$"
  mv "$destination" "$backup"
  echo "Previous install backed up to: $backup"
fi
cp -R "$source_root" "$destination"
defaults write com.adobe.CSXS.12 PlayerDebugMode -string '1'
defaults write com.adobe.CSXS.11 PlayerDebugMode -string '1'
echo "Installed MotionAstra 2.5 in $destination"
echo 'Restart AE. Open Window > Extensions > MotionAstra FX. See INSTALLATION_GUIDE.md.'
