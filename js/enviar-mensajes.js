// Excel en vivo (Google Sheet) — unica dependencia externa
        const SHEET_URLS = [
            "https://opensheet.elk.sh/1acN7pMqKXQIa6km4ka4mMbBG36K4XEOxfmqIRGG7XKQ/Hoja%201",
            "https://opensheet.elk.sh/1acN7pMqKXQIa6km4ka4mMbBG36K4XEOxfmqIRGG7XKQ/1"
        ];
        const SENT_STORAGE_KEY = "ixi_ricardo_wa_sent_v1";
        const LINK_LABEL = "Ver invitación:";
        const INVITE_LINK = (function () {
            if (location.protocol.startsWith("http")) {
                return location.origin + location.pathname.replace(/[^/]*$/, "") + "index.html";
            }
            return "https://isayportilla.github.io/BodaIxiRicardo.github.io/index.html";
        })();
        const FETCH_TIMEOUT_MS = 25000;

        let familyGroups = [];
        let sentFamilies = loadSentFamilies();

        function loadSentFamilies() {
            try {
                return JSON.parse(localStorage.getItem(SENT_STORAGE_KEY) || "{}");
            } catch {
                return {};
            }
        }

        function saveSentFamilies() {
            localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify(sentFamilies));
        }

        function getField(row, ...keys) {
            for (const key of keys) {
                const val = row[key];
                if (val !== undefined && val !== null && String(val).trim() !== "") {
                    return String(val).trim();
                }
            }
            return "";
        }

        function normalizePhone(phone) {
            let digits = String(phone).replace(/\D/g, "");
            if (digits.length === 10) digits = "52" + digits;
            return digits;
        }

        function buildFamilyGroups(rawData) {
            const groups = {};

            rawData.forEach(row => {
                const familia = getField(row, "Familia", "familia", "FAMILIA");
                if (!familia) return;

                if (!groups[familia]) {
                    groups[familia] = { familia, phone: "", message: "", members: [] };
                }

                const phone = getField(row,
                    "Telefono", "Teléfono", "telefono", "WhatsApp", "whatsapp",
                    "Celular", "celular", "Numero", "Número", "numero", "Phone", "phone", "E"
                );
                const message = getField(row,
                    "Mensaje", "mensaje", "Message", "message", "Texto", "texto", "F"
                );
                const name = getField(row, "Nombres", "Nombre", "nombres", "nombre");

                if (phone && !groups[familia].phone) groups[familia].phone = phone;
                if (message && !groups[familia].message) groups[familia].message = message;
                if (name && !groups[familia].members.includes(name)) {
                    groups[familia].members.push(name);
                }
            });

            return Object.values(groups).sort((a, b) =>
                a.familia.localeCompare(b.familia, "es", { sensitivity: "base" })
            );
        }

        function buildFullMessage(baseMessage) {
            const text = (baseMessage || "").trim().normalize("NFC");
            const suffix = `${LINK_LABEL} ${INVITE_LINK}`;
            return text ? `${text}\n\n${suffix}` : suffix;
        }

        function showToast(message) {
            let el = document.getElementById("waToast");
            if (!el) {
                el = document.createElement("div");
                el.id = "waToast";
                el.className = "wa-toast";
                document.body.appendChild(el);
            }
            el.textContent = message;
            el.classList.add("show");
            clearTimeout(showToast._timer);
            showToast._timer = setTimeout(() => el.classList.remove("show"), 3500);
        }

        async function copyText(text) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                try {
                    const ta = document.createElement("textarea");
                    ta.value = text;
                    ta.setAttribute("readonly", "");
                    ta.style.position = "fixed";
                    ta.style.left = "-9999px";
                    document.body.appendChild(ta);
                    ta.select();
                    const ok = document.execCommand("copy");
                    document.body.removeChild(ta);
                    return ok;
                } catch {
                    return false;
                }
            }
        }

        function getFamilyStatus(group) {
            const hasPhone = !!group.phone;
            const hasMessage = !!group.message;
            const isSent = !!sentFamilies[group.familia];

            if (isSent) return { type: "sent", label: "Enviada" };
            if (hasPhone && hasMessage) return { type: "ok", label: "Lista" };
            if (!hasPhone && !hasMessage) return { type: "error", label: "Sin tel. ni msg." };
            if (!hasPhone) return { type: "error", label: "Sin teléfono" };
            return { type: "warn", label: "Sin mensaje" };
        }

        function updateStats(filtered = familyGroups) {
            const ready = filtered.filter(g => g.phone && g.message).length;
            document.getElementById("statTotal").textContent = filtered.length;
            document.getElementById("statReady").textContent = ready;
            document.getElementById("statIncomplete").textContent = filtered.length - ready;
            document.getElementById("statSent").textContent = filtered.filter(g => sentFamilies[g.familia]).length;
        }

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
        }

        function renderFamilies() {
            const container = document.getElementById("familiesList");
            const query = document.getElementById("searchInput").value.trim().toLowerCase();
            const filtered = familyGroups.filter(g => !query || g.familia.toLowerCase().includes(query));

            updateStats(filtered);

            if (filtered.length === 0) {
                container.innerHTML = familyGroups.length === 0
                    ? '<p class="empty-msg">No hay familias en el Excel.</p>'
                    : '<p class="empty-msg">No hay familias que coincidan.</p>';
                return;
            }

            container.innerHTML = filtered.map(group => {
                const status = getFamilyStatus(group);
                const fullMessage = buildFullMessage(group.message);
                const canSend = group.phone && fullMessage;
                const membersText = group.members.length
                    ? group.members.slice(0, 4).join(", ") + (group.members.length > 4 ? ` (+${group.members.length - 4})` : "")
                    : "—";

                return `
                    <article class="card family-row ${status.type === "sent" ? "sent" : ""}">
                        <div class="family-inner">
                            <div class="family-body">
                                <div class="family-title-row">
                                    <h3 class="family-name">${escapeHtml(group.familia)}</h3>
                                    <span class="badge badge-${status.type}">${status.label}</span>
                                </div>
                                <p class="family-meta"><strong>Invitados:</strong> ${escapeHtml(membersText)}</p>
                                <p class="family-meta"><strong>Teléfono:</strong> ${group.phone ? escapeHtml(group.phone) : '<span style="color:#991b1b">Falta</span>'}</p>
                                <details>
                                    <summary>Ver mensaje completo</summary>
                                    <div class="preview-box">${escapeHtml(fullMessage || "Sin mensaje")}</div>
                                </details>
                            </div>
                            <div class="family-actions">
                                <button type="button" class="btn-wa" ${canSend ? "" : "disabled"}
                                    data-action="whatsapp" data-familia="${escapeHtml(group.familia)}">Enviar WhatsApp</button>
                                <button type="button" class="btn-secondary" ${canSend ? "" : "disabled"}
                                    data-action="copy" data-familia="${escapeHtml(group.familia)}">Copiar mensaje</button>
                                <button type="button" class="btn-secondary"
                                    data-action="toggle-sent" data-familia="${escapeHtml(group.familia)}">
                                    ${sentFamilies[group.familia] ? "Desmarcar" : "Marcar enviado"}
                                </button>
                            </div>
                        </div>
                    </article>`;
            }).join("");
        }

        async function openWhatsApp(familia) {
            const group = familyGroups.find(g => g.familia === familia);
            if (!group || !group.phone) return;

            // wa.me?text= suele romper emojis en WhatsApp Web (aparecen como).
            // Copiamos el texto UTF-8 intacto y abrimos el chat; si el texto llega mal, Ctrl+V lo pega bien.
            const fullMessage = buildFullMessage(group.message);
            const phone = normalizePhone(group.phone);
            const copied = await copyText(fullMessage);

            const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(fullMessage)}`;
            const win = window.open(waUrl, "_blank");
            if (!win) {
                location.href = waUrl;
            }

            showToast(copied
                ? "Chat abierto. Si los emojis salen mal, pega con Ctrl+V (mensaje ya copiado)."
                : "Chat abierto. Usa Copiar mensaje si faltan emojis.");

            sentFamilies[familia] = true;
            saveSentFamilies();
            renderFamilies();
        }

        async function copyMessage(familia) {
            const group = familyGroups.find(g => g.familia === familia);
            if (!group) return;
            const fullMessage = buildFullMessage(group.message);
            const ok = await copyText(fullMessage);
            showToast(ok ? "Mensaje copiado. Pégalo en WhatsApp con Ctrl+V." : "No se pudo copiar. Abre el mensaje y selecciónalo manualmente.");
        }

        function toggleSent(familia) {
            if (sentFamilies[familia]) delete sentFamilies[familia];
            else sentFamilies[familia] = true;
            saveSentFamilies();
            renderFamilies();
        }

        async function fetchSheet(url) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
            try {
                const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
                if (!response.ok) throw new Error("HTTP " + response.status);
                return await response.json();
            } finally {
                clearTimeout(timer);
            }
        }

        async function loadSheet() {
            const statusEl = document.getElementById("loadStatus");
            statusEl.textContent = "Cargando Excel...";
            statusEl.className = "status-text";

            for (let i = 0; i < SHEET_URLS.length; i++) {
                try {
                    const rawData = await fetchSheet(SHEET_URLS[i]);
                    familyGroups = buildFamilyGroups(rawData);

                    const withPhone = familyGroups.filter(g => g.phone).length;
                    const withMessage = familyGroups.filter(g => g.message).length;

                    statusEl.innerHTML = withPhone === 0 || withMessage === 0
                        ? `<strong>${familyGroups.length}</strong> familias · faltan teléfono o mensaje en el Excel.`
                        : `<strong>${familyGroups.length}</strong> familias · <strong>${withPhone}</strong> listas para enviar.`;

                    renderFamilies();
                    return;
                } catch (err) {
                    console.warn("Intento", i + 1, "falló:", err);
                }
            }

            statusEl.textContent = "Sin conexión al Excel. Usa WiFi o toca Recargar.";
            statusEl.className = "status-text error";
            document.getElementById("familiesList").innerHTML =
                '<p class="empty-msg error">No se pudieron cargar los datos.<br>Verifica tu señal e intenta de nuevo.</p>';
        }

        document.getElementById("searchInput").addEventListener("input", renderFamilies);
        document.getElementById("reloadBtn").addEventListener("click", loadSheet);
        document.getElementById("clearSentBtn").addEventListener("click", () => {
            if (confirm("¿Quitar todas las marcas de enviado?")) {
                sentFamilies = {};
                saveSentFamilies();
                renderFamilies();
            }
        });

        document.getElementById("familiesList").addEventListener("click", (e) => {
            const btn = e.target.closest("[data-action]");
            if (!btn || btn.disabled) return;
            const familia = btn.getAttribute("data-familia");
            const action = btn.getAttribute("data-action");
            if (action === "whatsapp") openWhatsApp(familia);
            else if (action === "copy") copyMessage(familia);
            else if (action === "toggle-sent") toggleSent(familia);
        });

        loadSheet();
