# Terminal screenshots and recordings

## Install once

Use Node.js 22+ and install the project's dependencies first. Capture requires
[VHS 0.12.1 or newer](https://github.com/charmbracelet/vhs#installation),
[ttyd](https://github.com/tsl0922/ttyd#installation), FFmpeg, Chromium, and the
DejaVu Sans Mono font. VHS supplies the browser automation; Playwright is not used.

On macOS with Homebrew:

```sh
brew install vhs ttyd ffmpeg
```

On Debian/Ubuntu, install `ttyd`, `ffmpeg`, `fonts-dejavu-core` and a Chromium
browser from your distribution, then install VHS from its release packages or
`go install github.com/charmbracelet/vhs@v0.12.1`. Make sure all three commands
are on PATH. VHS finds a supported browser on the system or downloads Chromium on its first
run. A sandboxed Linux container may also need
`VHS_NO_SANDBOX=1`. See the [VHS documentation](https://github.com/charmbracelet/vhs).

## Capture images

Run the package.json `screenshot` script with your chosen package manager.
The examples below use npm; pnpm/bun use `run`, while Yarn also accepts `yarn screenshot`.

```sh
npm run screenshot
npm run screenshot -- --screen home --theme dark --columns 100
npm run screenshot -- --screen help --theme mono --ascii --rows 60
npm run screenshot -- --output-dir ./screenshots/review
```

Screens, themes and columns can be repeated to select a matrix. Defaults are all
registered screens, all four themes, and 80/120 columns. The starter additionally
includes its inline demo. Terminal height defaults to 40 rows; increase `--rows`
for tall screens so the terminal viewport does not crop or scroll their content.

Images use Ink's static `renderToString()` output, with fixed terminal diagnostics
and config location. VHS displays that ANSI output in its terminal and takes a PNG.
There is no HTML conversion. Initial state is stable; font/OS/browser versions can
still change pixels, so use CI for comparable review artifacts.

## Record an interactive journey

```sh
npm run record
npm run record -- --screen home --theme contrast --columns 120 --ascii
npm run record -- --format webm --format mp4
npm run record -- --tape scripts/tapes/workflow.tape
```

`record` invokes the screenshot runner with `--video`. Defaults are Home, dark,
100 columns and GIF + MP4, plus an initial PNG. Use repeatable `--format` for GIF,
MP4 or WebM. Names include screen, theme, columns, optional `-ascii`, and `-video`.
`--output-dir` changes the destination for every output.

The video runs the source CLI in a real PTY, clears CI/NO_COLOR/CLI_ASCII overrides,
passes explicit theme flags and an isolated temporary config, and leaves the
user's settings untouched. Normal capture removes that temporary config on exit.
Video captures include live animation and state changes; they are not pixel-stable
snapshots. The runner stops the app after the interaction tape finishes.

## Adapt the workflow

Start with `scripts/tapes/workflow.tape`. It opens the command menu, searches for
Help, navigates there, then switches theme. It works without optional screens.
Replace its VHS key presses, `Type`, `Wait` and `Sleep` commands with your journey.
Prefer `Wait+Screen@10s /expected text/` for asynchronous transitions, then a short
`Sleep` for a readable pause. Add `Screenshot "screenshots/checkpoint.png"` for
checkpoints. Paths in interactions resolve from the project root. Keep launch,
Output and Set commands in the runner; interaction snippets run after launch.

For the starter's inline wizard, supply a custom tape with Enter, arrow keys and
confirmation steps (`--screen inline --tape path/to/wizard.tape`). That screen is
not shipped in generated apps. Scenarios can save isolated temporary settings,
but commands that call external services still need suitable demo fixtures.

```sh
# Write tapes/fixtures without VHS. Useful for review and debugging.
npm run record -- --dry-run --tape scripts/tapes/workflow.tape
# Replay a generated tape from the project root (requires capture tools).
vhs screenshots/tapes/home-dark-100-video.tape
# Record your own key sequence, then edit it into an interaction-only snippet.
vhs record > /tmp/my-session.tape
```

Generated tapes include absolute local output/fixture paths and inline the selected
interaction snippet. They are replayable in the same checkout; regenerate after
moving or copying the checkout. A replay uses a fresh config at the tape's recorded
temporary path; remove it yourself if the scenario writes settings during replay.
Dry-run does not verify VHS dependencies or produce images/videos. For a portable
workflow, commit the source interaction tape and regenerate on each machine.

## Continuous integration

The starter's `.github/workflows/screenshots.yml` installs pinned VHS, ttyd,
FFmpeg and fonts through the official VHS action, then validates, captures the PNG
matrix and records a demo. Manual workflow inputs select a screen/theme/width/tape.
Artifacts contain PNGs, GIF/MP4 videos and generated tapes/fixtures for 14 days.
The workflow does not publish media or commit generated files.

Generated apps include the capture commands when `screenshots` is selected; their
regular CI remains toolchain/package-manager aware. To add capture to that CI,
add these steps after dependency installation (adapt the package manager):

```yaml
- uses: charmbracelet/vhs-action@v2
  with:
    version: v0.12.1
    install-fonts: true
- run: npm run screenshot -- --screen home --theme dark --columns 100
- run: npm run record
- uses: actions/upload-artifact@v7
  with:
    name: terminal-captures
    path: screenshots/
    retention-days: 14
```

The VHS action with no `path` installs dependencies without running a tape.
Keep the capture font and VHS version aligned across development and CI.
