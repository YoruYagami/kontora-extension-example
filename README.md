# Kontora extension example

An example extension of [Kontora](https://github.com/YoruYagami/Kontora): agents and skills
anyone can install from a GitHub repo, in **Settings › Extensions**, by pasting
`github.com/YoruYagami/kontora-extension-example`.

## What a repo holds

```
kontora-extension.json   what it is: { "kontora": 1, "name": "…", "description": "…" }
agents/*.json            its agents, one file each, as Kontora keeps an agent
skills/<folder>/SKILL.md its skills, one folder each
```

- **Agents** have a `name`, and may have a `description`, a `system_prompt`, the `skills` they
  use (by name) and `custom_tools`: programs installed in the agents' sandbox, each with its
  `install` command and the `verify` command that says it is there.
- **Skills** are folders with a `SKILL.md`, its `name` and `description` at its top; other files
  in the folder come with it.

## Releases

Kontora installs the latest release, at its commit (with no release, the default branch), and
shows what it brings first: its agents, its skills, and its programs with what installs them.
A newer release shows in the extension's row, to update to.
