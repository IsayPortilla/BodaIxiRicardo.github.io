const GuestSheet = (function () {
    const SHEET_ID = "1acN7pMqKXQIa6km4ka4mMbBG36K4XEOxfmqIRGG7XKQ";
    const SHEET_GID = "920926980";
    const TIMEOUT_MS = 20000;
    const SOURCES = [
        { type: "json", url: `https://opensheet.elk.sh/${SHEET_ID}/Hoja%201` },
        { type: "json", url: `https://opensheet.elk.sh/${SHEET_ID}/1` },
        { type: "csv", url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}` },
        { type: "csv", url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}` }
    ];

    function parseCsv(text) {
        const rows = [];
        let row = [];
        let field = "";
        let inQuotes = false;
        const s = String(text || "").replace(/^\uFEFF/, "");

        for (let i = 0; i < s.length; i++) {
            const c = s[i];
            if (inQuotes) {
                if (c === '"') {
                    if (s[i + 1] === '"') {
                        field += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += c;
                }
            } else if (c === '"') {
                inQuotes = true;
            } else if (c === ",") {
                row.push(field);
                field = "";
            } else if (c === "\n" || c === "\r") {
                if (c === "\r" && s[i + 1] === "\n") i++;
                row.push(field);
                field = "";
                if (row.some((v) => String(v).trim() !== "")) rows.push(row);
                row = [];
            } else {
                field += c;
            }
        }
        if (field.length || row.length) {
            row.push(field);
            if (row.some((v) => String(v).trim() !== "")) rows.push(row);
        }
        if (rows.length < 2) return [];

        const headers = rows[0].map((h) => String(h).trim());
        return rows.slice(1).map((cols) => {
            const obj = {};
            headers.forEach((header, idx) => {
                if (header) obj[header] = cols[idx] != null ? cols[idx] : "";
            });
            return obj;
        });
    }

    async function fetchBody(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
            if (!response.ok) throw new Error("HTTP " + response.status);
            return await response.text();
        } finally {
            clearTimeout(timer);
        }
    }

    async function loadRows() {
        let lastError = null;

        for (const source of SOURCES) {
            try {
                const body = await fetchBody(source.url);
                const rows = source.type === "json" ? JSON.parse(body) : parseCsv(body);
                if (!Array.isArray(rows) || rows.length === 0) {
                    throw new Error("Sin filas");
                }
                return rows;
            } catch (err) {
                lastError = err;
                console.warn("No se pudo leer el Excel desde", source.url, err);
            }
        }

        throw lastError || new Error("No se pudo conectar al Excel");
    }

    return { loadRows };
})();
