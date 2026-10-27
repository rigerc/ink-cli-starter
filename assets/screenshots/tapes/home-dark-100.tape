Require node
Set Shell "bash"
Set FontFamily "DejaVu Sans Mono"
Set FontSize 14
Set Columns 100
Set Rows 40
Set Padding 24
Set Framerate 15
Set TypingSpeed 0
Set CursorBlink false
Set Theme "TokyoNight"
Env PS1 ""
Hide
Type "printf '\033[2J\033[H\033[?25l'; cat '/home/runner/work/ink-cli-starter/ink-cli-starter/assets/screenshots/tapes/home-dark-100.ansi'"
Enter
Wait+Screen@15s /[╭┌+]/
Sleep 500ms
Show
Screenshot "/home/runner/work/ink-cli-starter/ink-cli-starter/assets/screenshots/home-dark-100.png"
Sleep 100ms
Hide
Ctrl+C
