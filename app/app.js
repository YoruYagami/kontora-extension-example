// Sources: a project's sources, kept by Kontora for the project and shared with the agents, who
// add to it as they work. Each is checked by the Researcher in a chat of its own, followed here
// until it answers. Everything goes through Kontora's bridge (kontora.js): this page has no
// network and can't reach Kontora otherwise.
(async () => {
  const kontora = await Kontora.connect();
  const $ = (id) => document.getElementById(id);
  const say = (text) => ($("said").textContent = text);
  $("project").textContent = `Sources of ${kontora.project.name}`;
  const canChat = kontora.may.includes("start_chats");

  const sources = async () => (await kontora.data.get("sources")) ?? [];
  const keep = (all) => kontora.data.set("sources", all);
  // Kept, and shown at once: the watch below would show it a moment later.
  const save = async (all) => {
    await keep(all);
    show(all);
  };

  /** What a source's check says: who has it, and how it stands. */
  const STATES = {
    working: "Researcher is checking it…",
    needs_you: "Researcher needs you, in its chat",
    stuck: "Researcher is stuck: see its chat",
    stopped: "Its check stopped",
    done: "Checked by Researcher",
  };

  function button(label, run) {
    const it = document.createElement("button");
    it.type = "button";
    it.textContent = label;
    it.addEventListener("click", () => run().catch((error) => say(error.message)));
    return it;
  }

  const span = (className, textContent) =>
    Object.assign(document.createElement("span"), { className, textContent });

  /** Keeps how the chat checking a source stands, and its answer, with the source. */
  function follow(chat) {
    kontora.chats.watch(chat, async ({ state, answer }) => {
      const all = await sources();
      const at = all.findIndex((it) => it.chat === chat);
      if (at < 0 || (all[at].state === state && all[at].answer === (answer ?? all[at].answer))) return;
      all[at] = { ...all[at], state, answer: answer ?? all[at].answer ?? "" };
      await save(all);
    });
  }

  function row(source, at, all) {
    const item = document.createElement("li");
    const what = document.createElement("div");
    what.append(span("url", source.url), span("note", source.note ?? ""));
    if (source.by) what.append(span("by", `added by ${source.by}`));
    if (source.state) what.append(span(`state ${source.state}`, STATES[source.state] ?? source.state));
    if (source.answer) what.append(span("answer", source.answer));
    const check = source.chat
      ? button("Open the chat", () => kontora.chats.open(source.chat))
      : button("Check with Researcher", async () => {
          const words = source.note ? `\n\nWhat it is for: ${source.note}` : "";
          const { chat } = await kontora.chats.start({
            agent: "Researcher",
            message: `Check this source: ${source.url}${words}`,
          });
          const now = await sources();
          const index = now.findIndex((it) => it.url === source.url);
          if (index >= 0) now[index] = { ...now[index], chat, state: "working" };
          await save(now);
          follow(chat);
        });
    check.hidden = !canChat;
    const remove = button("Remove", () => save(all.filter((_, other) => other !== at)));
    item.append(what, check, remove);
    return item;
  }

  function show(all) {
    all = all ?? [];
    $("empty").hidden = all.length > 0;
    $("sources").replaceChildren(...all.map((source, at) => row(source, at, all)));
  }

  $("add").addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = { url: $("url").value.trim(), note: $("note").value.trim() };
    await save([...(await sources()), source]);
    $("add").reset();
    say(`Added ${source.url}.`);
  });
  // Shown as it changes: here, or by an agent at work.
  kontora.data.watch("sources", show);
  const all = await sources();
  show(all);
  // The checks still going: followed again.
  if (canChat)
    for (const it of all) if (it.chat && it.state !== "done" && it.state !== "stopped") follow(it.chat);
})();
