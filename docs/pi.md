# Floorplan in Pi

Floorplan is a skill-only [Pi package](https://github.com/earendil-works/pi/blob/main/docs/packages.md): the same skill, scripts and map used in Claude Code and Codex. It adds no extensions or hooks. Pi reads your app's local source and runs the bundled scripts to build or refresh the map.

**Browser Ask does not use Pi.** Generate maps and ask questions in your Pi conversation. The browser Ask bar and blueprint Change mode require a separate Claude Code or Codex CLI; Floorplan does not run Pi from the browser. Ready-made fix, build and flow prompts can be copied into Pi.

## What you need

- Pi installed and configured with a model provider. Pi's runtime requirements apply (Pi 1.6.0 requires Node.js 22.19+); Floorplan's scripts themselves need Node.js 18+.
- Review the package source before installing it or granting project trust. Skills can instruct the model to run scripts and write files.

## Install

From your project's folder, install for that project only:

```bash
pi install --local git:github.com/haydenschmitty/floorplan
pi
```

`--local` records the package in `.pi/settings.json`; Pi loads it after project trust is granted. Omit `--local` if you want a personal install for all projects. A git tag or commit can be pinned by appending `@<ref>` to the source. Use a ref that includes Pi support.

For a local checkout, try it for one session without adding a package to settings:

```bash
cd /path/to/your/app
pi -e /absolute/path/to/floorplan
```

Pi loads local packages directly, without copying or installing dependencies. The package manifest exposes only `skills/floorplan`. There is no npm release to install.

## Make and update a map

In Pi, ask “Make me a floorplan of this app” or invoke the skill explicitly:

```text
/skill:floorplan
/skill:floorplan /path/to/your/app
/skill:floorplan /path/to/your/app --refresh
```

Arguments after `/skill:floorplan` are appended as a user request. Pi resolves bundled scripts and references relative to the loaded skill's folder. The skill instructs Pi to run scripts with `FLOORPLAN_AGENT=none`: maps have neutral prompts and no Claude Code project notes are created. This is not unattended mode; Pi still reads, describes and updates your app interactively.

Open the resulting `floorplan/index.html` in your browser. Pi gives you its path rather than starting the Claude/Codex-backed server. After code changes, ask “Update the floorplan.” Reopen the file to see the new map. For blueprints, share your PRD and ask for a floorplan of what you'd need to build.

Ask follow-up questions in Pi using the map and local source. To use browser Ask instead, explicitly choose the separate integration and run `node floorplan/serve.mjs --engine claude` or `--engine codex` from the app folder, with that CLI installed and signed in. Pi's provider sign-in does not power these integrations.

## Update or remove

For a project-local git installation:

```bash
pi update git:github.com/haydenschmitty/floorplan
pi remove --local git:github.com/haydenschmitty/floorplan
```

Use the exact source you installed (including a pinned ref). An update reconciles a pinned ref; it does not move it to a newer release. `pi list` shows configured packages. Start a fresh session after installing, or run `/reload` to reload changed skills in an active session. Removing the package leaves your project's maps in place.
