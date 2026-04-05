const DEFAULT_SETTINGS = {
    enabled: true,
    maxJobs: 3,
    startTime: "08:00",
    endTime: "17:00",
    autoSchedule: true,
    minDelaySec: 30,
    maxDelaySec: 180,
    logEnabled: true
};

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
            if (chrome.runtime?.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            if (!response?.success) {
                reject(new Error(response?.error || "Unknown error"));
                return;
            }
            resolve(response);
        });
    });
}

function setForm(settings) {
    document.getElementById("set-max-jobs").value = settings.maxJobs;
    document.getElementById("set-start-time").value = settings.startTime;
    document.getElementById("set-end-time").value = settings.endTime;
    document.getElementById("set-auto-schedule").checked = !!settings.autoSchedule;
    document.getElementById("set-min-delay").value = settings.minDelaySec;
    document.getElementById("set-max-delay").value = settings.maxDelaySec;
    document.getElementById("set-log-enabled").checked = !!settings.logEnabled;
    updateToggleButton(settings.enabled);
}

function getForm() {
    const settings = {
        maxJobs: parseInt(document.getElementById("set-max-jobs").value || "1", 10),
        startTime: document.getElementById("set-start-time").value || "08:00",
        endTime: document.getElementById("set-end-time").value || "17:00",
        autoSchedule: !!document.getElementById("set-auto-schedule").checked,
        minDelaySec: parseInt(document.getElementById("set-min-delay").value || "0", 10),
        maxDelaySec: parseInt(document.getElementById("set-max-delay").value || "0", 10),
        logEnabled: !!document.getElementById("set-log-enabled").checked
    };

    if (settings.maxJobs < 1) settings.maxJobs = 1;
    if (settings.minDelaySec < 0) settings.minDelaySec = 0;
    if (settings.maxDelaySec < settings.minDelaySec) settings.maxDelaySec = settings.minDelaySec;

    return settings;
}

function updateToggleButton(enabled) {
    const btn = document.getElementById("btn-toggle");
    const status = document.getElementById("popup-status");

    btn.textContent = enabled ? "ĐANG BẬT" : "ĐANG TẮT";
    btn.classList.toggle("enabled", enabled);
    btn.classList.toggle("disabled", !enabled);

    status.innerHTML = [
        `Trạng thái extension: <b>${enabled ? "BẬT" : "TẮT"}</b>`,
        "Settings trong popup sẽ được lưu lại cho lần sau."
    ].join("<br>");
}

async function load() {
    const res = await sendMessage({ type: "GET_SETTINGS" });
    const settings = { ...DEFAULT_SETTINGS, ...(res.settings || {}) };
    setForm(settings);
}

document.getElementById("btn-toggle").addEventListener("click", async () => {
    const res = await sendMessage({ type: "TOGGLE_EXTENSION" });
    updateToggleButton(!!res.settings.enabled);
});

document.getElementById("btn-save").addEventListener("click", async () => {
    const current = await sendMessage({ type: "GET_SETTINGS" });
    const merged = {
        ...DEFAULT_SETTINGS,
        ...(current.settings || {}),
        ...getForm()
    };

    const res = await sendMessage({
        type: "SAVE_SETTINGS",
        settings: merged
    });

    setForm(res.settings);
    const status = document.getElementById("popup-status");
    status.innerHTML = [
        `Trạng thái extension: <b>${res.settings.enabled ? "BẬT" : "TẮT"}</b>`,
        "<span style='color:#27ae60;'>Đã lưu settings thành công.</span>"
    ].join("<br>");
});

load().catch(err => {
    document.getElementById("popup-status").textContent = "Lỗi tải popup: " + (err?.message || err);
});
