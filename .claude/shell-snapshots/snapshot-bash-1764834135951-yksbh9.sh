# Snapshot file
# Unset all aliases to avoid conflicts with functions
unalias -a 2>/dev/null || true
shopt -s expand_aliases
# Check for rg availability
if ! command -v rg >/dev/null 2>&1; then
  alias rg=''\''C:\Users\ASUS\.vscode\extensions\anthropic.claude-code-2.0.56-win32-x64\resources\native-binary\claude.exe'\'' --ripgrep'
fi
export PATH=$PATH
