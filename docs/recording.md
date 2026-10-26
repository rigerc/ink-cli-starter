# Terminal screenshots and recordings

Screenshot capture is optional. A normal capture creates **one PNG** for the Home screen using the dark theme and a 100-column terminal. Extra screens, themes, widths, video, and publishing are opt-in.

## Install capture dependencies

Install project dependencies with `npm ci`, plus [VHS](https://github.com/charmbracelet/vhs) (0.12.1+), ttyd, FFmpeg, Chromium and DejaVu Sans Mono. VHS can download Chromium on first use. On macOS:

```sh
brew install vhs ttyd ffmpeg
```

On Debian/Ubuntu, install ttyd, FFmpeg, DejaVu fonts and a browser through your distribution; install VHS from its releases or Go. Sandboxed Linux may require `VHS_NO_SANDBOX=1`. See the [VHS setup guide](https://github.com/charmbracelet/vhs#installation).

## Take a screenshot

```sh
npm run screenshot                                         # Home, dark, 100 columns
npm run screenshot -- --screen help --theme mono --ascii   # One custom screenshot
npm run screenshot -- --all                                # Every registered screen
npm run screenshot -- --all --theme dark --theme light --columns 80 --columns 120
npm run screenshot -- --output-dir assets/screenshots
```

`--screen`, `--theme`, and `--columns` can be repeated to select a matrix. `--all` means all registered screens and cannot be combined with `--screen`. The screenshot command normally renders Ink synchronously and displays its ANSI frame in VHS. This is fast and deterministic, but effects and delayed work do not run.

Use `--live` to launch the real CLI in a PTY when a screen depends on asynchronous work or input:

```sh
npm run screenshot -- --screen home --live
npm run screenshot -- --screen jobs --live --ready 'Jobs loaded'
```

`--ready` waits for literal text (not a regular expression) before the screenshot and works with `--live` or recordings. Without it, the runner waits for its standard screen-decoration indicator, so bare screens should supply a meaningful `--ready` value. Both modes accept `--rows` to adjust terminal height and `--output-dir` to change output paths. Capture is isolated from the user's saved application settings.

## Record a short interactive demo

```sh
npm run record                                  # Home, dark, 100 columns, MP4 + PNG
npm run record -- --screen home --theme light
npm run record -- --format gif --format webm    # Choose multiple formats
npm run record -- --tape scripts/tapes/workflow.tape
```

`record` runs the actual CLI in a terminal, takes an initial PNG, and executes the interaction snippet in `scripts/tapes/workflow.tape`. Replace its key presses, typing, and waits with your application's flow. The runner controls the launch, output format, and terminal settings; the snippet controls interactions only. Videos are not pixel-stable snapshots.

## Preview or replay a tape

```sh
npm run screenshot -- --dry-run
npm run record -- --dry-run
vhs screenshots/tapes/home-dark-100.tape
```

`--dry-run` creates the ANSI fixture (static mode) and a replayable VHS tape without requiring VHS. It does not create a PNG or video. Generated tapes can include checkout-specific absolute paths; regenerate after moving the checkout.

## GitHub Actions (manual)

The [Screenshots and recordings workflow](../.github/workflows/screenshots.yml) starts only through **Actions → Screenshots and recordings → Run workflow**.

- By default, it captures a dark, 100-column PNG for every registered screen and uploads the files as a 14-day artifact. No video or Git commit is performed.
- Check **Record demo** to also capture a custom MP4, using the screen/theme/width/tape inputs.
- Check **Commit assets** on `main` to publish the screenshots (and demo, if recorded) under `assets/`. It uses a separate write-permission job. On other branches, artifacts are uploaded without pushing changes.

To commit from GitHub Actions, allow Actions to create commits and ensure the branch rules permit the bot to push. Without publishing, no write permissions are required. Workflow files are downstream-owned and may be adapted freely.

To run the all-screen workflow settings locally:

```sh
npm run screenshot -- --all --theme dark --columns 100 --output-dir assets/screenshots
```

The source CLI screenshots are not an HTML conversion. Browser/font versions can change pixels, so compare captures from matching environments when reviewing appearance.
