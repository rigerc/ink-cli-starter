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

## Keep a shareable `assets/` gallery

The starter's GitHub Actions workflow saves one dark-theme, 100-column PNG for each
registered screen plus the inline demo in `assets/screenshots/`. It also saves an MP4
of the interactive Home-to-Help journey at `assets/demo.mp4`. Both are tracked in Git,
so README links survive artifact expiration. New screens are included automatically
through the screen registry; no list needs maintaining in the workflow.

To refresh these assets locally with the same settings:

```sh
mkdir -p assets/screenshots
rm -f assets/screenshots/*.png
npm run screenshot -- --theme dark --columns 100 --output-dir assets/screenshots
npm run record -- --screen home --theme dark --columns 100 --format mp4
cp screenshots/home-dark-100-video.mp4 assets/demo.mp4
```

Only the PNGs and `demo.mp4` should be committed. Generated `assets/screenshots/tapes/`
is ignored, and the recording's working files in `screenshots/` remain ignored.
Change the recording screen, theme, width or `--tape` in the workflow dispatch inputs
to replace the demo; the gallery still captures every screen at the fixed defaults.
The workflow checks the capture commands before committing, avoiding broken media.

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
FFmpeg and fonts through the official VHS action, then typechecks, tests and runs
the captures. It refreshes `assets/screenshots/*.png` for all screens (including
hidden screens and the inline demo) and `assets/demo.mp4` for the interactive
journey. It uploads the PNGs, MP4 and replayable tapes as a 14-day artifact.

On pushes to `main` or manual dispatch from `main`, GitHub Actions commits changed
assets back to the branch using `GITHUB_TOKEN`. The workflow needs repository
**Actions > General > Workflow permissions** set to allow read and write, and any
branch rules must permit the bot to push. The bot's generated commit does not
retrigger the workflow. On pull requests and manual runs on other branches, the
workflow only uploads an artifact; it does not push to contributors' branches.
Unlike the temporary artifact, the committed `assets/` files persist in Git.

Generated apps include the capture commands when `screenshots` is selected; they
do not inherit the starter's publishing workflow. To create review artifacts
in a generated app, add steps like these to its CI after installing dependencies
(adapt the package manager and paths as needed):

```yaml
- uses: charmbracelet/vhs-action@v2
  with:
    version: v0.12.1
    install-fonts: true
- run: npm run screenshot -- --theme dark --columns 100 --output-dir assets/screenshots
- run: npm run record -- --format mp4
- run: cp screenshots/home-dark-100-video.mp4 assets/demo.mp4
- uses: actions/upload-artifact@v7
  with:
    name: terminal-captures
    path: |
      assets/screenshots/*.png
      assets/demo.mp4
    retention-days: 14
```

To make a generated app publish assets persistently, add a separate, permissions-
restricted commit step for trusted branches as in the starter workflow. The VHS
action with no `path` installs dependencies without running a tape. Keep the capture
font and VHS version aligned across development and CI.
