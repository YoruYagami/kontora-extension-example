# Making an extension for Kontora

An extension is an **app** for [Kontora](https://github.com/YoruYagami/Kontora): a page of its
own in Kontora's bar, from a public GitHub repo. Anyone installs it in **Settings › Extensions**
by pasting the repo's address: this one is `github.com/YoruYagami/kontora-extension-example`.

This repo is a working example: **Sources**, an app that keeps a project's sources, asks an agent
to check one and shows its answer, and shares the list with the agents, who add to it as they
work.

An extension brings no agents or skills: those go from one Kontora to another in a library file
(**Settings › Export & import**). Its app works with the user's own agents.

- [Start in five minutes](#start-in-five-minutes)
- [kontora-extension.json](#kontora-extensionjson)
- [An app](#an-app)
- [The bridge: `kontora.*`](#the-bridge-kontora)
- [Data the agents use too](#data-the-agents-use-too)
- [Releases, updates and uninstalling](#releases-updates-and-uninstalling)
- [Trying it before you publish](#trying-it-before-you-publish)
- [Limits](#limits)

## Start in five minutes

1. Make a **public** repo on GitHub.
2. Put a `kontora-extension.json` at its top:

   ```json
   {
     "kontora": 1,
     "name": "My app",
     "description": "What it is for, in a line.",
     "app": { "name": "My app", "page": "app/index.html" }
   }
   ```

3. Add its app, a folder with its page and the files beside it:

   ```
   kontora-extension.json   what it is
   app/index.html           its app's page
   app/app.js, style.css…   what the page loads
   ```

4. Publish a **release** on GitHub (Releases › Draft a new release, a tag like `v1.0.0`).
5. In Kontora, **Settings › Extensions**, paste `github.com/you/your-repo` and press **Read it**:
   Kontora shows its app, then installs it.

## kontora-extension.json

| Field | | |
| --- | --- | --- |
| `kontora` | required | The format: `1`. A Kontora too old for a newer format says so. |
| `name` | required | Its name, shown in Settings › Extensions. |
| `description` | | What it is for, in a line. |
| `app` | required | Its app: see [An app](#an-app). A repo without one isn't installed. |

## An app

An app is a page of its own in Kontora's bar, as Notes and Kanban are, for the project chosen.
Name it in `kontora-extension.json`:

```json
"app": {
  "name": "Sources",
  "page": "app/index.html",
  "may": ["start_chats"],
  "for_agents": { "sources": "The project's sources: a list of { url, note, by }." }
}
```

| Field | | |
| --- | --- | --- |
| `name` | required | Its name in the bar, 40 letters at most. |
| `page` | required | Its page: an `.html` file in a folder of the repo. **That folder is the app**: its files, and only those, are kept on the user's PC and served to it. |
| `may` | | What it may ask Kontora for besides its own data. Today: `"start_chats"`, the agents' names, chats started with them, and following those chats to their answers. Kontora shows it before installing, and refuses what it doesn't know. |
| `for_agents` | | What of its data the agents may read and write: each key, with what it holds. See [Data the agents use too](#data-the-agents-use-too). |

**Where it runs.** Its page opens in a sandboxed frame with no origin of its own: it can't read
Kontora's page, nor its storage, nor call Kontora's API, and it has **no network**. It loads its
own files only, so bring every script, style, picture and font it needs (no CDN). Use relative
paths (`app.js`, `style.css`); the bridge is at `/extension-apps/kontora.js`.

The page of this repo's app, `app/index.html`:

```html
<!doctype html>
<meta charset="utf-8">
<meta name="color-scheme" content="dark">
<link rel="stylesheet" href="style.css">
<script src="/extension-apps/kontora.js"></script>
<script src="app.js" defer></script>
```

Kontora is dark: set `color-scheme` and a background of your own, or the frame shows white.

## The bridge: `kontora.*`

```js
const kontora = await Kontora.connect();
```

| | |
| --- | --- |
| `kontora.project` | `{ id, name }`: the project chosen in Kontora (`id` is `""` for no project). The app opens again when the user chooses another. |
| `kontora.may` | What it was given: `["start_chats"]`, or `[]`. |
| `await kontora.data.get(key)` | Its own data for this project: any JSON, or `null` if none was kept. |
| `await kontora.data.set(key, value)` | Keeps `value` (any JSON) for this project; `null` removes it. |
| `kontora.data.watch(key, (value) => …)` | Told each change of `key` while the page is open, whoever made it: an agent, too. Gives back a function that stops it. |
| `await kontora.agents()` | With `start_chats`: the agents, `[{ name, description }]`. |
| `await kontora.chats.start({ agent, message })` | With `start_chats`: a new chat of the project, `agent` (one of the user's, by name; none: the main agent) answering `message` at once, as if the user had asked. Gives `{ chat }`. |
| `kontora.chats.watch(chat, ({ state, answer }) => …)` | With `start_chats`, for a chat it started: told how it stands, `working`, `needs_you` (an agent waits for the user's yes, in the chat), `stuck`, `stopped` or `done`, with the agent's last `answer` once done. Gives back a function that stops it. |
| `await kontora.agents.ask({ agent, message })` | With `start_chats`: `chats.start`, then its answer once done: `{ chat, answer }`. Fails if the chat stops or is stuck. |
| `await kontora.chats.open(chat)` | With `start_chats`: shows that chat in Kontora. |

Each call returns a promise; one that is refused (not given, a key that doesn't fit, a value too
big) rejects with an `Error` saying why.

- **Keys**: letters, digits, `-`, `_` and `.`, 64 at most.
- **Data** is kept on the user's PC by the extension's repo: it stays when the extension is
  uninstalled, and is there again if it is installed again. It is never sent anywhere; the
  agents see only the keys it names in `for_agents`.
- **Chats** an app starts are the user's: among the project's chats, marked with the app's
  name. If an agent needs the user (a yes before it runs something), it waits there.

## Data the agents use too

An app can share some of its data with the agents, so they work on what it shows: an agent adds
the sources it finds, a pentest's agents add their findings. Name each key in
`for_agents`, saying what it holds, in words the agents read: its shape, and how to change it
("add to the list; keep what is there").

```json
"for_agents": { "sources": "The project's sources: a list of { url, note, by }, by being the name of whoever added it. Add to the list; keep what is there." }
```

- The user reads it before installing: **Your agents may use**.
- Every agent can then use two tools, for the project of its chat:
  - `read_app_data`: a key's value; it only looks, so it runs at once;
  - `write_app_data`: a key's value, written whole; it asks the user first, as their Ask first
    says, and an agent's tools can turn either off.
- The open app sees an agent's change with `kontora.data.watch`.
- Keys not named stay the app's own. What an agent reads there is shown to it as data, never as
  instructions; read what agents wrote the same way, checking it before you show it.

## Releases, updates and uninstalling

- Kontora installs your **latest release** at the commit its tag points to; drafts and
  pre-releases are skipped. A repo with no release installs its default branch as it is.
- It shows its app first, with what it may do, and installs exactly what was shown.
- Publish a newer release and Kontora's row says **Update to v…**. Updating replaces its app's
  files; its data stays as it is.
- Uninstalling removes its app from the bar. Its data stays on the user's PC.

## Trying it before you publish

Kontora installs from GitHub only, so try it from a repo of your own: push to a test repo with
no release (Kontora takes its default branch), install it, change, uninstall and install again.
When it works, publish a release from your real repo.

## Limits

- Public repos only: Kontora asks GitHub without a token.
- GitHub answers 60 asks an hour from one place without a token: reading an extension takes
  three, a row's check for updates two.
- A repo's files: 100 MB zipped, 200 MB and 5,000 files unpacked. An app: 500 files and 20 MB.
- An app's data: 1 MB a value, 10 MB a project.
