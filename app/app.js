// Sources: a project's sources, kept by Kontora for the project, each checked by the Researcher
// in a chat of its own. Everything goes through Kontora's bridge (kontora.js): this page has no
// network and can't reach Kontora otherwise.
(async () => {
  const kontora = await Kontora.connect();
  const $ = (id) => document.getElementById(id);
  const say = (text) => ($("said").textContent = text);
  $("project").textContent = `Sources of ${kontora.project.name}`;

  const sources = async () => (await kontora.data.get("sources")) ?? [];
  const keep = (all) => kontora.data.set("sources", all);

  function button(label, run) {
    const it = document.createElement("button");
    it.type = "button";
    it.textContent = label;
    it.addEventListener("click", () => run().catch((error) => say(error.message)));
    return it;
  }

  function row(source, at, all) {
    const item = document.createElement("li");
    const what = document.createElement("div");
    const url = Object.assign(document.createElement("span"), { className: "url", textContent: source.url });
    const note = Object.assign(document.createElement("span"), { className: "note", textContent: source.note });
    what.append(url, note);
    const check = button("Check with Researcher", async () => {
      say("Starting a chat…");
      const words = source.note ? `\n\nWhat it is for: ${source.note}` : "";
      const { chat } = await kontora.chats.start({
        agent: "Researcher",
        message: `Check this source: ${source.url}${words}`,
      });
      await kontora.chats.open(chat);
    });
    check.hidden = !kontora.may.includes("start_chats");
    const remove = button("Remove", async () => {
      await keep(all.filter((_, other) => other !== at));
      await show();
    });
    item.append(what, check, remove);
    return item;
  }

  async function show() {
    const all = await sources();
    $("empty").hidden = all.length > 0;
    $("sources").replaceChildren(...all.map((source, at) => row(source, at, all)));
  }

  $("add").addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = { url: $("url").value.trim(), note: $("note").value.trim() };
    await keep([...(await sources()), source]);
    $("add").reset();
    say(`Added ${source.url}.`);
    await show();
  });
  await show();
})();
