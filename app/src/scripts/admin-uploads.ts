/**
 * Shared vanilla-TS behavior for the admin upload inputs. Imported by
 * ImageInput.astro and GalleryInput.astro scripts. Replaces the React state
 * machines; DOM is the state.
 *
 * Quota fix vs the source: all selected files go in ONE POST /api/upload
 * (repeated `files` entries), so the server checks the storage quota once
 * per batch instead of re-listing the whole store per file.
 */
import { validateClientFile } from "@/lib/upload";

let initialized = false;

export function initAdminUploads(): void {
  if (initialized) return;
  initialized = true;

  const setError = (el: HTMLElement | null, msg: string | null) => {
    if (!el) return;
    el.textContent = msg ?? "";
    el.classList.toggle("hidden", !msg);
  };

  const uploadBatch = async (
    files: File[],
    onEachError: (msg: string) => void,
  ): Promise<string[]> => {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as {
      urls?: string[];
      errors?: string[];
    };
    for (const e of data.errors ?? []) onEachError(e);
    if (!res.ok && !data.errors?.length) onEachError(`Upload failed (${res.status}).`);
    return data.urls ?? [];
  };

  // ── Single-image inputs ────────────────────────────────────────────────
  document.querySelectorAll<HTMLElement>("[data-image-input]").forEach((root) => {
    const file = root.querySelector<HTMLInputElement>("input[data-file]");
    const browse = root.querySelector<HTMLButtonElement>("[data-browse]");
    const remove = root.querySelector<HTMLButtonElement>("[data-remove]");
    const hidden = root.querySelector<HTMLInputElement>("input[data-url-field]");
    const urlText = root.querySelector<HTMLInputElement>("input[data-url-text]");
    const preview = root.querySelector<HTMLElement>("[data-preview]");
    const err = root.querySelector<HTMLElement>("[data-error]");
    const btnLabel = browse?.querySelector("[data-label]");

    const setUrl = (url: string) => {
      if (hidden) hidden.value = url;
      if (urlText) urlText.value = url;
      if (preview) {
        const img = preview.querySelector("img");
        if (img) img.src = url;
        preview.classList.toggle("hidden", !url);
      }
      if (btnLabel) btnLabel.textContent = url ? "Replace image" : "Upload image";
      if (remove) remove.classList.toggle("hidden", !url);
    };

    browse?.addEventListener("click", () => file?.click());
    remove?.addEventListener("click", () => {
      setUrl("");
      setError(err, null);
    });
    urlText?.addEventListener("input", () => {
      if (hidden) hidden.value = urlText.value;
      const img = preview?.querySelector("img");
      if (img) img.src = urlText.value;
    });
    file?.addEventListener("change", async () => {
      const f = file.files?.[0];
      file.value = "";
      if (!f) return;
      const invalid = validateClientFile(f);
      if (invalid) return setError(err, invalid);
      setError(err, null);
      if (btnLabel) btnLabel.textContent = "Uploading…";
      try {
        const [url] = await uploadBatch([f], (m) => setError(err, m));
        if (url) setUrl(url);
        else if (btnLabel) btnLabel.textContent = hidden?.value ? "Replace image" : "Upload image";
      } catch {
        setError(err, "Upload failed.");
        if (btnLabel) btnLabel.textContent = hidden?.value ? "Replace image" : "Upload image";
      }
    });
  });

  // ── Multi-image (gallery) inputs ───────────────────────────────────────
  document.querySelectorAll<HTMLElement>("[data-gallery-input]").forEach((root) => {
    const file = root.querySelector<HTMLInputElement>("input[data-file]");
    const browse = root.querySelector<HTMLButtonElement>("[data-browse]");
    const rows = root.querySelector<HTMLElement>("[data-rows]");
    const counter = root.querySelector<HTMLElement>("[data-counter]");
    const err = root.querySelector<HTMLElement>("[data-error]");
    const maxItems = Number(root.dataset.max ?? 12);

    const count = () => rows?.querySelectorAll("[data-row]").length ?? 0;
    const sync = () => {
      if (counter) counter.textContent = `${count()} / ${maxItems}`;
      if (browse) browse.disabled = count() >= maxItems;
    };

    const addRow = (url: string) => {
      if (!rows) return;
      const row = document.createElement("div");
      row.className = "flex items-center gap-gutter";
      row.dataset.row = "";
      row.innerHTML = `
        <input type="hidden" name="${root.dataset.name}" value="${url}">
        <img src="${url}" alt="" width="120" height="90" class="w-24 h-auto border border-structural-gray">
        <input class="input flex-1" value="${url}" data-url-text>
        <button type="button" class="btn btn-outline btn-sm" data-remove-row>Remove</button>`;
      rows.appendChild(row);
    };

    browse?.addEventListener("click", () => file?.click());
    rows?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-remove-row]");
      btn?.closest("[data-row]")?.remove();
      sync();
    });
    rows?.addEventListener("input", (e) => {
      const text = e.target as HTMLInputElement;
      if (text.matches("[data-url-text]")) {
        text.closest("[data-row]")?.querySelectorAll<HTMLInputElement>("input[type=hidden]").forEach((h) => {
          h.value = text.value;
        });
        const img = text.closest("[data-row]")?.querySelector("img");
        if (img) img.src = text.value;
      }
    });
    file?.addEventListener("change", async () => {
      const picked = Array.from(file.files ?? []);
      file.value = "";
      if (!picked.length) return;

      const errors: string[] = [];
      let valid = picked.filter((f) => {
        const bad = validateClientFile(f);
        if (bad) errors.push(bad);
        return !bad;
      });
      const room = maxItems - count();
      if (valid.length > room) {
        errors.push(`Only ${room} more fit the ${maxItems}-image limit.`);
        valid = valid.slice(0, room);
      }
      setError(err, errors[0] ?? null);
      if (!valid.length) return;

      if (browse) browse.textContent = "Uploading…";
      try {
        const urls = await uploadBatch(valid, (m) => setError(err, m));
        for (const u of urls) addRow(u);
        sync();
      } catch {
        setError(err, "Upload failed.");
      } finally {
        sync();
        if (browse) browse.textContent = "Add images";
      }
    });
    sync();
  });
}
