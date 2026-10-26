# Terminal screenshots and recordings

The optional capture tool (`scripts/screenshot.tsx`) uses [VHS](https://github.com/charmbracelet/vhs) to take **real terminal screenshots**, not an HTML rendering. By default, `npm run screenshot` captures **one** PNG of the Home screen, in dark theme at 100 columns × 40 rows. There is no automatic capture or commit on every push. Recording videos, running a matrix and publishing assets are opt-in.

## Install prerequisites

Install project dependencies with `npm ci`, then install VHS **0.12.1+**, ttyd, FFmpeg, Chromium and DejaVu Sans Mono. VHS may download Chromium on first use. On macOS:

```sh
brew install vhs ttyd ffmpeg
```

On Debian/Ubuntu, install ttyd, FFmpeg, DejaVu fonts and a browser through your distribution; install VHS via its releases or Go. A sandboxed Linux runner may need `VHS_NO_SANDBOX=1`. Consult the [VHS installation guide](https://github.com/charmbracelet/vhs#installation) when browser setup differs. The `--dry-run` mode described below does **not** require VHS, but does need the project's Node dependencies to render static ANSI fixtures.

## Quick recipes

```sh
npm run screenshot                                             # home-dark-100.png
npm run screenshot -- --screen help --theme mono --ascii       # One custom PNG
npm run screenshot -- --all                                    # Home + Settings + Help by default
npm run screenshot -- --screen home --screen help --columns 80 --columns 120
npm run screenshot -- --all --theme dark --theme light --columns 80 --columns 120
npm run screenshot -- --rows 50 --output-dir assets/screenshots
npm run screenshot -- --dry-run                                 # Generate only fixtures/tape
```

A capture matrix is the **Cartesian product** of the selected screens, themes and widths. For example, three default screens × two themes × two widths produces 12 PNGs; `--all` uses **all registered IDs** (including `showInNav: false` screens), not just tab-visible screens. `--screen` cannot be combined with `--all`. Valid `--columns` values are integers from 40–240, and `--rows` from 20–200. Theme values are `dark`, `light`, `contrast` and `mono` (not `auto`).

### Outputs and naming

The default output directory is `screenshots/` relative to the working directory:

| Command type | Expected files for Home / dark / 100 columns |
| --- | --- |
| Static screenshot | `screenshots/home-dark-100.png`, `screenshots/tapes/home-dark-100.ansi`, `screenshots/tapes/home-dark-100.tape` |
| Static `--dry-run` | `.ansi` and `.tape` in `screenshots/tapes/`; **no** PNG |
| `--live` screenshot | `screenshots/home-dark-100.png` and its `.tape`; no static `.ansi` |
| `npm run record` | `screenshots/home-dark-100-video.png`, `.mp4` and `screenshots/tapes/home-dark-100-video.tape` |
| Recording `--dry-run` | Video `.tape` only; **no** PNG or video |

Adding `--ascii` appends `-ascii` to the basename; video appends `-video`. `--format gif --format webm` requests those videos instead of the default MP4, and an initial PNG is still captured. `--format` and `--tape` require `--video` (which `npm run record` supplies). The runner writes replayable VHS tape files in an output `tapes/` subdirectory; absolute paths in generated tapes can be checkout-specific.

## Static versus live capture

**Static (default)** generates a single Ink `renderToString(<App ...>)` frame, writes it to a `.ansi` fixture and uses VHS to screenshot that frame. It is fast and generally deterministic for visual regression review, but React effects, delayed data fetching, input handling and animations do **not** execute. Use static mode for initial screen composition, light/dark comparisons, narrow widths and stable first-frame states.

**Live (`--live`)** launches the actual CLI in a pseudo-terminal, so effects and key handling work. Use this for screens that must settle after a fetch, update or a prompt:

```sh
npm run screenshot -- --screen home --live
# Example after implementing and registering a jobs screen:
npm run screenshot -- --screen jobs --live --ready 'Jobs loaded' --columns 120
```

`--ready` waits for **literal, visible, single-line text**, escaped for the VHS matcher; it is not a regular expression. It is accepted only with `--live` or `--video`. The generated tape waits up to 15 seconds for that text; absent `--ready`, it waits for a standard screen border/decorative character. A custom `layout: 'bare'` screen without borders should supply `--ready`. Choose a marker visible only after the desired state is reached. The runner then sleeps 500 ms before taking the screenshot, so avoid fleeting messages/spinners as readiness markers. Live/video paths launch with an isolated `--config` file and remove the temporary directory afterward.

The capture script also sets `CI=1`, `FORCE_COLOR=3`, clears `NO_COLOR` and points `XDG_CONFIG_HOME` to a temporary capture-specific location; its live command removes CI and overrides theme directly. As a result, normal screenshot runs do not intentionally read or modify the user's saved application configuration. Keep that isolation if adapting the script.

## Record an interactive demo

```sh
npm run record                                                # Initial PNG + MP4
npm run record -- --screen home --theme light --columns 100
npm run record -- --format gif --format webm
npm run record -- --tape scripts/tapes/workflow.tape
npm run record -- --dry-run
```

`npm run record` runs `scripts/screenshot.tsx --video` and always launches the real interactive CLI. It first captures the initial PNG, then executes the interaction snippet from `scripts/tapes/workflow.tape` (whose starter sequence opens the command menu and goes to Help). Edit that file, or pass `--tape` pointing at a different snippet. Do **not** put `Output`, terminal sizing, `Env`, app-launch or shutdown commands into the snippet; the runner supplies those around it. The interaction snippet can use VHS commands such as:

```text
Sleep 500ms
Ctrl+K
Type "help"
Enter
Sleep 1s
```

Preview/replay without recording everything again:

```sh
npm run screenshot -- --dry-run
npm run record -- --dry-run
vhs screenshots/tapes/home-dark-100.tape
```

Regenerate tapes after relocating a checkout because generated commands/fixtures can contain absolute paths. Videos are not pixel-stable snapshots: rely on static PNGs for repeatable visual comparisons and recordings for showing interaction flows.

## GitHub Actions: manual capture and publishing

The [Screenshots and recordings workflow](../.github/workflows/screenshots.yml) runs only through **Actions → Screenshots and recordings → Run workflow**.

1. The default job runs typechecking and tests, captures dark/100-column PNGs for **all registered screens**, and uploads `terminal-captures` (14-day retention). This does not commit or publish files.
2. Set **Record demo** to make an MP4 using the provided screen/theme/columns/tape inputs; it is copied to `assets/demo.mp4` for upload/optional commit.
3. Set **Commit assets** on `main` to run a separate write-permission job that commits `assets/screenshots/` (and `assets/demo.mp4` if present). On other branches, it uploads artifacts only. Bot pushes may be prevented by branch-protection rules or repository settings.

Match the workflow locally with:

```sh
npm run screenshot -- --all --theme dark --columns 100 --output-dir assets/screenshots
```

Capture jobs depend on fonts and browser rendering. To compare PNGs reliably, hold the OS, VHS, Chromium, font version, theme, ASCII mode, and terminal size constant. A changed font or border style can affect wrapping even when application code is unchanged.

## Troubleshooting and acceptance checklist

| Problem | Likely cause / action |
| --- | --- |
| `Unable to run VHS` | Confirm `vhs` is on `PATH` and ttyd, FFmpeg and a supported Chromium installation are available |
| Blank or incomplete live frame | Add a stable `--ready 'Finished loading'` marker, check that it appears on screen within 15 seconds, and avoid a transient spinner |
| A static capture omits fetched content | React effects do not run in static mode; use `--live` or capture an explicit static loading state |
| `Unknown screen` | Register the ID in `src/screens/index.ts`; see [UI guide](ui-framework.md#create-and-register-a-screen) |
| `--ready requires --live or --video` | Add `--live`, or use `npm run record` for a video |
| Unexpected screenshot size/wrapping | Use explicit `--columns`, `--rows`, `--ascii`, matching fonts and the same capture environment |
| `--dry-run` did not produce PNG/MP4 | Expected; dry-run creates replay tapes (and static ANSI fixtures), not media |
| Workflow didn't commit files | Publishing is manual and opt-in, requires `main`, `contents: write` and compatible repository branch rules |

Before sharing assets, verify the selected screen is correct, text is legible at 40/80/120 columns as relevant, there is no personal data in the view, and the recorded key sequence ends in a recognizable state. For UI behavior and keyboard ownership, see the [UI framework guide](ui-framework.md).
