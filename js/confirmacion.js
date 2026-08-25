// Excel en vivo (Google Sheet) — unica dependencia externa
const sheetURLs = [
    "https://opensheet.elk.sh/1acN7pMqKXQIa6km4ka4mMbBG36K4XEOxfmqIRGG7XKQ/Hoja%201",
    "https://opensheet.elk.sh/1acN7pMqKXQIa6km4ka4mMbBG36K4XEOxfmqIRGG7XKQ/1"
];
let rawData = [];
let allFamilies = [];
let confirmationByPerson = {};
let currentFamily = "";

function showFormMessage(text, type = "info") {
    const el = document.getElementById("formMessage");
    if (!el) return;
    el.textContent = text;
    el.className = `form-message ${type}`;
    el.classList.remove("hidden");
}

function hideFormMessage() {
    const el = document.getElementById("formMessage");
    if (el) el.classList.add("hidden");
}

function setStepIndicators(step) {
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`stepIndicator${i}`);
        if (!indicator) continue;
        indicator.classList.remove("active", "done");
        if (i < step) indicator.classList.add("done");
        else if (i === step) indicator.classList.add("active");
    }
}

function getConfirmationValue(row) {
    const v = row.confirmado ?? row.Confirmado ?? row.Asistencia ?? row.ConF ?? row.C ?? row.estado ?? row['Columna C'] ?? row['Confirmación'];
    return Number(v) === 1 ? 1 : 0;
}

function buildPersonKey(row) {
    return `${row.Familia}__${row.Nombre ?? row.Nombres}`;
}

function getFamilyMembers(selectedFamily) {
    return rawData
        .filter(item => item.Familia === selectedFamily && (item.Nombre || item.Nombres))
        .map(item => {
            const key = buildPersonKey(item);
            const initial = getConfirmationValue(item);
            const current = Object.prototype.hasOwnProperty.call(confirmationByPerson, key)
                ? confirmationByPerson[key]
                : initial;
            confirmationByPerson[key] = current;
            return {
                key,
                name: item.Nombre ?? item.Nombres,
                confirmed: current
            };
        });
}

function renderSelectOptions(familiesList) {
    const select = document.getElementById("familySelect");
    if (!select) return;
    select.innerHTML = '<option value="">Selecciona tu familia</option>';
    familiesList.forEach(fam => {
        const option = document.createElement("option");
        option.value = fam;
        option.textContent = fam;
        select.appendChild(option);
    });
}

function renderFamilyResults(filter = "") {
    const resultsEl = document.getElementById("familyResults");
    if (!resultsEl) return;

    const query = filter.trim().toLowerCase();
    const matches = query
        ? allFamilies.filter(fam => fam.toLowerCase().includes(query))
        : allFamilies.slice(0, 8);

    resultsEl.innerHTML = "";

    if (allFamilies.length === 0) {
        resultsEl.classList.add("hidden");
        return;
    }

    if (matches.length === 0) {
        resultsEl.innerHTML = '<p style="padding:12px 14px;color:#666F88;font-size:0.9rem;margin:0;">No encontramos esa familia. Intenta con otro apellido.</p>';
        resultsEl.classList.remove("hidden");
        return;
    }

    matches.forEach(fam => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "family-result-btn";
        btn.textContent = fam;
        btn.setAttribute("role", "option");
        btn.addEventListener("click", () => selectFamily(fam));
        resultsEl.appendChild(btn);
    });

    resultsEl.classList.remove("hidden");
}

function selectFamily(familyName) {
    currentFamily = familyName;

    const searchInput = document.getElementById("familySearch");
    const select = document.getElementById("familySelect");
    const badge = document.getElementById("selectedFamilyBadge");
    const nameEl = document.getElementById("selectedFamilyName");
    const resultsEl = document.getElementById("familyResults");

    if (searchInput) {
        searchInput.value = familyName;
        searchInput.disabled = true;
    }
    if (select) select.value = familyName;
    if (nameEl) nameEl.textContent = familyName;
    if (badge) badge.classList.remove("hidden");
    if (resultsEl) resultsEl.classList.add("hidden");

    hideFormMessage();

    const members = getFamilyMembers(familyName);
    const anyConfirmed = members.some(m => confirmationByPerson[m.key] === 1);
    if (!anyConfirmed && members.length > 0) {
        members.forEach(m => { confirmationByPerson[m.key] = 1; });
    }

    handleFamilySelection();
    setStepIndicators(2);

    document.getElementById("stepGuests")?.classList.remove("hidden");
    document.getElementById("stepSend")?.classList.remove("hidden");
}

function resetFamilySelection() {
    currentFamily = "";

    const searchInput = document.getElementById("familySearch");
    const select = document.getElementById("familySelect");
    const badge = document.getElementById("selectedFamilyBadge");
    const guestsSection = document.getElementById("stepGuests");
    const sendSection = document.getElementById("stepSend");
    const namesContainer = document.getElementById("namesValidationContainer");

    if (searchInput) {
        searchInput.value = "";
        searchInput.disabled = false;
        searchInput.focus();
    }
    if (select) select.value = "";
    if (badge) badge.classList.add("hidden");
    if (guestsSection) guestsSection.classList.add("hidden");
    if (sendSection) sendSection.classList.add("hidden");
    if (namesContainer) namesContainer.innerHTML = "";

    setStepIndicators(1);
    updateSummaryAndButton();
    renderFamilyResults("");
}

function handleFamilySelection() {
    const selectedFamily = currentFamily || document.getElementById("familySelect")?.value;
    const namesContainer = document.getElementById("namesValidationContainer");
    if (!namesContainer || !selectedFamily) return;

    namesContainer.innerHTML = "";
    const members = getFamilyMembers(selectedFamily);

    if (members.length === 0) {
        showFormMessage("No encontramos invitados para esta familia. Verifica el nombre o contáctanos.", "error");
        return;
    }

    members.forEach(person => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        label.className = "guest-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = confirmationByPerson[person.key] === 1;
        checkbox.dataset.personKey = person.key;
        checkbox.addEventListener("change", () => {
            confirmationByPerson[person.key] = checkbox.checked ? 1 : 0;
            updateGuestStatus(label, checkbox.checked);
            updateSummaryAndButton();
        });

        const nameSpan = document.createElement("span");
        nameSpan.className = "guest-name";
        nameSpan.textContent = person.name;

        const statusSpan = document.createElement("span");
        statusSpan.className = "guest-status";
        statusSpan.textContent = checkbox.checked ? "Asiste ✓" : "No asiste";

        label.appendChild(checkbox);
        label.appendChild(nameSpan);
        label.appendChild(statusSpan);
        li.appendChild(label);
        namesContainer.appendChild(li);
    });

    updateSummaryAndButton();
}

function updateGuestStatus(label, isChecked) {
    const status = label.querySelector(".guest-status");
    if (status) status.textContent = isChecked ? "Asiste ✓" : "No asiste";
}

function setAllGuests(confirmed) {
    if (!currentFamily) return;
    const members = getFamilyMembers(currentFamily);
    members.forEach(m => {
        confirmationByPerson[m.key] = confirmed ? 1 : 0;
    });
    handleFamilySelection();
}

function updateSummaryAndButton() {
    const summaryEl = document.getElementById("confirmSummary");
    const sendBtn = document.getElementById("sendWhatsAppBtn");
    const countNote = document.getElementById("guestCountNote");
    const family = currentFamily || document.getElementById("familySelect")?.value;

    if (!family) {
        if (summaryEl) summaryEl.innerHTML = "Primero selecciona tu familia en el paso 1.";
        if (sendBtn) sendBtn.disabled = true;
        if (countNote) countNote.textContent = "";
        setStepIndicators(1);
        return;
    }

    const members = getFamilyMembers(family);
    const confirmed = members.filter(m => confirmationByPerson[m.key] === 1);
    const notAttending = members.filter(m => confirmationByPerson[m.key] !== 1);

    if (countNote) {
        countNote.textContent = `${confirmed.length} de ${members.length} persona(s) confirmada(s) para asistir.`;
    }

    if (summaryEl) {
        if (confirmed.length === 0) {
            summaryEl.innerHTML = `<strong>${family}</strong><br>Marca al menos a una persona que sí asistirá para continuar.`;
        } else {
            let html = `<strong>Familia:</strong> ${family}<br><strong>Asisten (${confirmed.length}):</strong> ${confirmed.map(m => m.name).join(", ")}`;
            if (notAttending.length > 0) {
                html += `<br><strong>No asisten:</strong> ${notAttending.map(m => m.name).join(", ")}`;
            }
            summaryEl.innerHTML = html;
        }
    }

    if (sendBtn) {
        sendBtn.disabled = confirmed.length === 0;
    }

    setStepIndicators(confirmed.length > 0 ? 3 : 2);
}

async function fetchSheetData(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

async function loadFamilies() {
    let lastError = null;

    for (const url of sheetURLs) {
        try {
            rawData = await fetchSheetData(url);

            confirmationByPerson = {};
            rawData.forEach(row => {
                if (!row?.Familia || !(row.Nombre || row.Nombres)) return;
                confirmationByPerson[buildPersonKey(row)] = getConfirmationValue(row);
            });

            allFamilies = Array.from(new Set(rawData.map(item => item.Familia).filter(Boolean))).sort((a, b) =>
                a.localeCompare(b, "es", { sensitivity: "base" })
            );

            renderSelectOptions(allFamilies);

            const searchInput = document.getElementById("familySearch");
            if (searchInput) {
                searchInput.placeholder = allFamilies.length
                    ? "Ejemplo: " + allFamilies[0]
                    : "Escribe el nombre de tu familia";
            }

            if (allFamilies.length === 0) {
                showFormMessage("No hay familias disponibles por el momento. Intenta más tarde.", "error");
            } else {
                hideFormMessage();
            }
            return;
        } catch (error) {
            lastError = error;
            console.warn("No se pudo cargar desde", url, error);
        }
    }

    console.error("Error cargando familias:", lastError);
    showFormMessage("No pudimos cargar la lista de familias. Revisa tu conexión e intenta de nuevo.", "error");
}

function sendWhatsApp() {
    hideFormMessage();
    const family = currentFamily || document.getElementById("familySelect")?.value;

    if (!family) {
        showFormMessage("Primero busca y selecciona tu familia en el paso 1.", "error");
        document.getElementById("familySearch")?.focus();
        return;
    }

    const members = getFamilyMembers(family);
    const confirmedNames = members
        .filter(m => confirmationByPerson[m.key] === 1)
        .map(m => m.name);

    if (confirmedNames.length === 0) {
        showFormMessage("Marca con ✓ al menos a una persona que sí podrá asistir.", "error");
        return;
    }

    const notAttending = members
        .filter(m => confirmationByPerson[m.key] !== 1)
        .map(m => m.name);

    let message = `Hola ✨\n\nConfirmamos asistencia para la boda de Ixi & Ricardo.\n\nFamilia: ${family}\n\n✅ Asisten:\n- ${confirmedNames.join("\n- ")}`;
    if (notAttending.length > 0) {
        message += `\n\n❌ No asisten:\n- ${notAttending.join("\n- ")}`;
    }

    const phone = "527222663174";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    showFormMessage("¡Listo! Se abrió WhatsApp. Solo pulsa Enviar para completar tu confirmación.", "success");
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("familySearch");
    const select = document.getElementById("familySelect");
    const changeFamilyBtn = document.getElementById("changeFamilyBtn");
    const selectAllBtn = document.getElementById("selectAllBtn");
    const clearAllBtn = document.getElementById("clearAllBtn");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (searchInput.disabled) return;
            hideFormMessage();
            renderFamilyResults(searchInput.value);
        });
        searchInput.addEventListener("focus", () => {
            if (!searchInput.disabled) renderFamilyResults(searchInput.value);
        });
    }

    document.addEventListener("click", (e) => {
        const results = document.getElementById("familyResults");
        if (results && !results.contains(e.target) && e.target !== searchInput) {
            if (!currentFamily) results.classList.add("hidden");
        }
    });

    if (changeFamilyBtn) changeFamilyBtn.addEventListener("click", resetFamilySelection);
    if (selectAllBtn) selectAllBtn.addEventListener("click", () => setAllGuests(true));
    if (clearAllBtn) clearAllBtn.addEventListener("click", () => setAllGuests(false));
    if (select) select.addEventListener("change", handleFamilySelection);

    // Cargar el Excel solo cuando el usuario llega al formulario (no al abrir la página)
    const formEl = document.getElementById("confirmacion-form");
    let familiesLoaded = false;
    function loadFamiliesOnce() {
        if (familiesLoaded) return;
        familiesLoaded = true;
        loadFamilies();
    }
    if (formEl && "IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) {
                loadFamiliesOnce();
                io.disconnect();
            }
        }, { rootMargin: "200px" });
        io.observe(formEl);
    } else {
        setTimeout(loadFamiliesOnce, 2500);
    }

    const searchInputEarly = document.getElementById("familySearch");
    if (searchInputEarly) {
        searchInputEarly.addEventListener("focus", loadFamiliesOnce, { once: true });
    }
});
