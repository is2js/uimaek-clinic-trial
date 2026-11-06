import { createClinicGuideRequests } from "./local-clinic-guide-requests.mjs";

export function initializeClinicDownload(root = document) {
  const byId = (id) => root.getElementById(id);
  if (!byId("release-card")) return null;
  const config = root.body?.dataset || {};
  const staticSite = config.clinicStatic === "true";
  const releaseUrl = staticSite ? config.clinicReleaseUrl : "/api/rpg/clinic-local/release";
  const downloadUrl = (kind) => staticSite
    ? config[kind === "installer" ? "clinicInstallerUrl" : "clinicChecksumsUrl"]
    : `/api/rpg/clinic-local/release/download/${kind}`;
  root.querySelector("[data-print-guide]")?.addEventListener("click", () => {
    for (const item of root.querySelectorAll("details")) item.open = true;
    window.print();
  });
  let release = null;
  let loading = false;
  const requests = createClinicGuideRequests();
  const downloadUrls = new Map();
  const buttons = (disabled) => {
    byId("download-installer").disabled = disabled;
    byId("download-checksums").disabled = disabled;
  };
  const explain = (error) => {
    if (error?.name === "TimeoutError") return "응답 시간이 초과되었습니다. 연결을 확인한 뒤 다시 시도하세요.";
    if (error?.status === 401 || error?.status === 403) return "서버가 다운로드 요청을 거부했습니다. 운영자에게 문의하세요.";
    if (error?.status === 503) return "설치 파일이 아직 준비되지 않았거나 검증에 실패했습니다. 운영자에게 문의한 뒤 다시 확인하세요.";
    return "설치 파일을 확인하지 못했습니다. 네트워크를 확인하고 다시 시도하세요.";
  };
  async function refresh() {
    if (loading) return;
    await requests.run(async (signal) => {
      const response = await fetch(releaseUrl, { credentials: "omit", cache: "no-store", signal });
      if (!response.ok) throw { status: response.status };
      return response.json();
    }, {
      start() {
        loading = true;
        release = null;
        buttons(true);
        byId("refresh-release").disabled = true;
        byId("release-details").hidden = true;
        byId("release-status").textContent = "설치 파일을 확인하고 있습니다…";
      },
      apply(data) {
        if (!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(data.version) || !/^[a-f0-9]{64}$/i.test(data.sha256)
            || data.channel !== "trial" || data.filename !== `PvpLocalClinicTrialSetup-${data.version}.exe` || !(data.sizeBytes > 0)
            || data.runtime?.mode !== "desktop" || data.runtime?.service !== false || data.runtime?.automaticStart !== false) throw new Error("Invalid release");
        if (staticSite && new URL(downloadUrl("installer"), document.baseURI).pathname.split("/").pop() !== data.filename) throw new Error("Stale site release");
        release = data;
        byId("release-version").textContent = `시험판 v${data.version} · ${(data.sizeBytes / 1024 / 1024).toFixed(1)} MB`;
        byId("release-filename").textContent = data.filename;
        byId("release-hash").textContent = data.sha256;
        byId("release-signature").textContent = data.signed ? "릴리스 기록: 코드 서명 있음" : "코드 서명 없음 · 제한 시험용 · 담당자와 파일 해시를 확인하세요";
        byId("release-details").hidden = false;
        byId("release-status").textContent = "Windows 대표 PC용 설치 파일입니다. 로그인 없이 받을 수 있습니다.";
      },
      error(error) { byId("release-status").textContent = explain(error); },
      finish() { loading = false; byId("refresh-release").disabled = false; buttons(!release); },
    });
  }
  async function download(kind) {
    if (!release || loading) return;
    await requests.run(async (signal) => {
      const response = await fetch(downloadUrl(kind), { credentials: "omit", cache: "no-store", signal });
      if (!response.ok) throw { status: response.status };
      const blob = await response.blob();
      if (kind === "installer" && staticSite) {
        if (blob.size !== release.sizeBytes) throw { status: 503 };
        if (globalThis.crypto?.subtle) {
          const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
          const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
          if (hash !== release.sha256.toLowerCase()) throw { status: 503 };
        }
      }
      const disposition = response.headers.get("content-disposition") || "";
      const filename = /filename="?(PvpLocalClinicTrialSetup-[\w.-]+\.exe|SHA256SUMS\.txt)"?(?:;|$)/i.exec(disposition)?.[1]
        || (staticSite && !disposition ? (kind === "installer" ? release.filename : "SHA256SUMS.txt") : null);
      if (!filename || filename !== (kind === "installer" ? release.filename : "SHA256SUMS.txt")) throw { status: 503 };
      return { blob, filename };
    }, {
      timeoutMs: 120_000,
      start() { loading = true; buttons(true); byId("refresh-release").disabled = true; byId("release-status").textContent = "파일을 받는 중입니다. 잠시 기다려 주세요… (최대 120초)"; },
      apply({ blob, filename }) {
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        document.body.append(link);
        link.click();
        link.remove();
        downloadUrls.set(url, setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.delete(url); }, 60_000));
        byId("release-status").textContent = "파일 저장을 요청했습니다. 브라우저 다운로드 목록에서 확인하세요.";
      },
      error(error) {
        byId("release-status").textContent = explain(error);
        if (error?.status === 401 || error?.status === 403 || error?.status === 503) { release = null; byId("release-details").hidden = true; }
      },
      finish() { loading = false; byId("refresh-release").disabled = false; buttons(!release); },
    });
  }
  byId("refresh-release").addEventListener("click", refresh);
  byId("download-installer").addEventListener("click", () => download("installer"));
  byId("download-checksums").addEventListener("click", () => download("checksums"));
  window.addEventListener("pagehide", () => { requests.cancel(); for (const [url, timer] of downloadUrls) { clearTimeout(timer); URL.revokeObjectURL(url); } downloadUrls.clear(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) refresh(); });
  void refresh();
  return { refresh };
}

if (document.getElementById("release-card")) initializeClinicDownload();
