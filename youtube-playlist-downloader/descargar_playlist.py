"""
Descargador de playlists de YouTube
Interfaz gráfica moderna con CustomTkinter + yt-dlp
"""

from __future__ import annotations

import os
import re
import shutil
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox

import customtkinter as ctk

try:
    import yt_dlp
except ImportError:
    yt_dlp = None


# --- Apariencia ---
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

COLORS = {
    "bg": "#0f1419",
    "surface": "#1a2332",
    "surface_alt": "#243044",
    "accent": "#e85d4c",
    "accent_hover": "#d14a3a",
    "accent_soft": "#3d2a28",
    "text": "#f0ebe3",
    "muted": "#8b9bb4",
    "success": "#3dd68c",
    "warning": "#f5a524",
    "border": "#2d3a4f",
}


def has_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


class PlaylistDownloader(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()

        self.title("YouTube Playlist Downloader")
        self.geometry("720x640")
        self.minsize(640, 560)
        self.configure(fg_color=COLORS["bg"])

        self.download_path = tk.StringVar(value=str(Path.home() / "Music" / "YouTube"))
        self.playlist_url = tk.StringVar()
        self.ffmpeg_ok = has_ffmpeg()
        self.format_choice = tk.StringVar(value="mp3" if self.ffmpeg_ok else "best")
        self.is_downloading = False
        self.cancel_requested = False

        self._build_ui()
        self._center_window()

        if yt_dlp is None:
            messagebox.showerror(
                "Dependencia faltante",
                "No se encontró yt-dlp.\n\nInstálalo con:\npip install -r requirements.txt",
            )
        elif not self.ffmpeg_ok:
            messagebox.showwarning(
                "FFmpeg no encontrado",
                "FFmpeg no está instalado (o no está en el PATH).\n\n"
                "Puedes descargar el audio original sin convertir,\n"
                "o instalar FFmpeg para usar MP3/M4A/WAV:\n"
                "https://www.gyan.dev/ffmpeg/builds/",
            )

    def _center_window(self) -> None:
        self.update_idletasks()
        w, h = 720, 640
        x = (self.winfo_screenwidth() - w) // 2
        y = (self.winfo_screenheight() - h) // 2
        self.geometry(f"{w}x{h}+{x}+{y}")

    def _build_ui(self) -> None:
        # Header
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=36, pady=(28, 8))

        ctk.CTkLabel(
            header,
            text="♪  Playlist Downloader",
            font=ctk.CTkFont(family="Segoe UI", size=26, weight="bold"),
            text_color=COLORS["text"],
        ).pack(anchor="w")

        ctk.CTkLabel(
            header,
            text="Descarga todas las canciones de una lista de YouTube",
            font=ctk.CTkFont(family="Segoe UI", size=13),
            text_color=COLORS["muted"],
        ).pack(anchor="w", pady=(4, 0))

        # Card principal
        card = ctk.CTkFrame(
            self,
            fg_color=COLORS["surface"],
            corner_radius=16,
            border_width=1,
            border_color=COLORS["border"],
        )
        card.pack(fill="both", expand=True, padx=36, pady=(16, 28))

        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(fill="both", expand=True, padx=28, pady=24)

        # URL
        ctk.CTkLabel(
            inner,
            text="URL de la playlist",
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            text_color=COLORS["text"],
        ).pack(anchor="w")

        self.url_entry = ctk.CTkEntry(
            inner,
            textvariable=self.playlist_url,
            placeholder_text="https://www.youtube.com/playlist?list=...",
            height=42,
            corner_radius=10,
            border_width=1,
            border_color=COLORS["border"],
            fg_color=COLORS["surface_alt"],
            text_color=COLORS["text"],
            placeholder_text_color=COLORS["muted"],
            font=ctk.CTkFont(family="Segoe UI", size=13),
        )
        self.url_entry.pack(fill="x", pady=(8, 18))

        # Carpeta de destino
        ctk.CTkLabel(
            inner,
            text="Carpeta de destino",
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            text_color=COLORS["text"],
        ).pack(anchor="w")

        path_row = ctk.CTkFrame(inner, fg_color="transparent")
        path_row.pack(fill="x", pady=(8, 18))

        self.path_entry = ctk.CTkEntry(
            path_row,
            textvariable=self.download_path,
            height=42,
            corner_radius=10,
            border_width=1,
            border_color=COLORS["border"],
            fg_color=COLORS["surface_alt"],
            text_color=COLORS["text"],
            font=ctk.CTkFont(family="Segoe UI", size=13),
        )
        self.path_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))

        ctk.CTkButton(
            path_row,
            text="Elegir…",
            width=100,
            height=42,
            corner_radius=10,
            fg_color=COLORS["surface_alt"],
            hover_color=COLORS["border"],
            text_color=COLORS["text"],
            border_width=1,
            border_color=COLORS["border"],
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            command=self._choose_folder,
        ).pack(side="right")

        # Formato
        format_title = "Formato de audio"
        if not self.ffmpeg_ok:
            format_title += "  ·  FFmpeg no detectado"

        ctk.CTkLabel(
            inner,
            text=format_title,
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            text_color=COLORS["text"],
        ).pack(anchor="w")

        format_row = ctk.CTkFrame(inner, fg_color="transparent")
        format_row.pack(fill="x", pady=(8, 22))

        formats = [
            ("MP3", "mp3"),
            ("M4A", "m4a"),
            ("WAV", "wav"),
            ("Original (sin convertir)", "best"),
        ]
        for label, value in formats:
            needs_ffmpeg = value != "best"
            btn = ctk.CTkRadioButton(
                format_row,
                text=label,
                variable=self.format_choice,
                value=value,
                font=ctk.CTkFont(family="Segoe UI", size=13),
                text_color=COLORS["muted"] if (needs_ffmpeg and not self.ffmpeg_ok) else COLORS["text"],
                fg_color=COLORS["accent"],
                hover_color=COLORS["accent_hover"],
                border_color=COLORS["muted"],
                state="disabled" if (needs_ffmpeg and not self.ffmpeg_ok) else "normal",
            )
            btn.pack(side="left", padx=(0, 16))

        # Botón descargar
        self.download_btn = ctk.CTkButton(
            inner,
            text="Descargar playlist",
            height=48,
            corner_radius=12,
            fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"],
            text_color="#ffffff",
            font=ctk.CTkFont(family="Segoe UI", size=15, weight="bold"),
            command=self._start_download,
        )
        self.download_btn.pack(fill="x")

        # Progreso
        progress_box = ctk.CTkFrame(inner, fg_color="transparent")
        progress_box.pack(fill="x", pady=(22, 0))

        self.status_label = ctk.CTkLabel(
            progress_box,
            text="Listo para descargar",
            font=ctk.CTkFont(family="Segoe UI", size=12),
            text_color=COLORS["muted"],
        )
        self.status_label.pack(anchor="w")

        self.progress = ctk.CTkProgressBar(
            progress_box,
            height=8,
            corner_radius=4,
            progress_color=COLORS["accent"],
            fg_color=COLORS["surface_alt"],
        )
        self.progress.pack(fill="x", pady=(10, 0))
        self.progress.set(0)

        self.detail_label = ctk.CTkLabel(
            progress_box,
            text="",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color=COLORS["muted"],
            wraplength=580,
            justify="left",
        )
        self.detail_label.pack(anchor="w", pady=(8, 0))

        # Log
        self.log_box = ctk.CTkTextbox(
            inner,
            height=120,
            corner_radius=10,
            fg_color=COLORS["surface_alt"],
            text_color=COLORS["muted"],
            font=ctk.CTkFont(family="Consolas", size=11),
            border_width=1,
            border_color=COLORS["border"],
            activate_scrollbars=True,
        )
        self.log_box.pack(fill="both", expand=True, pady=(16, 0))
        self.log_box.insert("1.0", "Las descargas aparecerán aquí…\n")
        self.log_box.configure(state="disabled")

    def _choose_folder(self) -> None:
        folder = filedialog.askdirectory(
            title="Elige dónde guardar las canciones",
            initialdir=self.download_path.get() or str(Path.home()),
        )
        if folder:
            self.download_path.set(folder)

    def _log(self, message: str) -> None:
        def write() -> None:
            self.log_box.configure(state="normal")
            self.log_box.insert("end", message + "\n")
            self.log_box.see("end")
            self.log_box.configure(state="disabled")

        self.after(0, write)

    def _set_status(self, text: str, detail: str = "", progress: float | None = None) -> None:
        def update() -> None:
            self.status_label.configure(text=text)
            self.detail_label.configure(text=detail)
            if progress is not None:
                self.progress.set(max(0.0, min(1.0, progress)))

        self.after(0, update)

    def _validate_url(self, url: str) -> bool:
        patterns = (
            r"(youtube\.com|youtu\.be).*(list=)",
            r"youtube\.com/playlist\?list=",
            r"music\.youtube\.com.*(list=)",
        )
        return any(re.search(p, url, re.IGNORECASE) for p in patterns)

    def _start_download(self) -> None:
        if self.is_downloading:
            return

        if yt_dlp is None:
            messagebox.showerror("Error", "yt-dlp no está instalado.")
            return

        url = self.playlist_url.get().strip()
        dest = self.download_path.get().strip()

        if not url:
            messagebox.showwarning("URL vacía", "Pega la URL de una playlist de YouTube.")
            return

        if not self._validate_url(url):
            messagebox.showwarning(
                "URL inválida",
                "Esa URL no parece una playlist de YouTube.\n"
                "Debe contener un parámetro list=…",
            )
            return

        if not dest:
            messagebox.showwarning("Sin carpeta", "Elige una carpeta de destino.")
            return

        fmt = self.format_choice.get()
        if fmt != "best" and not has_ffmpeg():
            messagebox.showwarning(
                "FFmpeg requerido",
                f"Para convertir a {fmt.upper()} necesitas FFmpeg.\n"
                "Elige «Original (sin convertir)» o instala FFmpeg.",
            )
            return

        Path(dest).mkdir(parents=True, exist_ok=True)

        self.is_downloading = True
        self.cancel_requested = False
        self.download_btn.configure(state="disabled", text="Descargando…")
        self.progress.set(0)
        self._set_status("Obteniendo información de la playlist…")
        self._log("─" * 40)
        self._log(f"Iniciando descarga → {dest}")

        threading.Thread(target=self._download_worker, args=(url, dest), daemon=True).start()

    def _download_worker(self, url: str, dest: str) -> None:
        audio_format = self.format_choice.get()
        total = 0
        completed = 0

        def progress_hook(d: dict) -> None:
            nonlocal completed
            if self.cancel_requested:
                raise yt_dlp.utils.DownloadCancelled("Cancelado por el usuario")

            status = d.get("status")
            filename = Path(d.get("filename", "")).name if d.get("filename") else ""

            if status == "downloading":
                pct = d.get("_percent_str", "").strip()
                speed = d.get("_speed_str", "").strip()
                self._set_status(
                    f"Descargando ({completed}/{total})" if total else "Descargando…",
                    detail=f"{filename}  ·  {pct}  ·  {speed}",
                    progress=(completed + (d.get("downloaded_bytes", 0) / max(d.get("total_bytes") or d.get("total_bytes_estimate") or 1, 1)))
                    / max(total, 1),
                )
            elif status == "finished":
                completed += 1
                self._log(f"✓ {filename or 'archivo'}")
                self._set_status(
                    f"Completadas {completed}/{total}" if total else "Procesando…",
                    detail=filename,
                    progress=completed / max(total, 1),
                )

        outtmpl = os.path.join(dest, "%(playlist_index)03d - %(title)s.%(ext)s")

        ydl_opts: dict = {
            "format": "bestaudio/best",
            "outtmpl": outtmpl,
            "ignoreerrors": True,
            "noplaylist": False,
            "quiet": True,
            "no_warnings": True,
            "progress_hooks": [progress_hook],
            "writethumbnail": False,
            "embedthumbnail": False,
        }

        if audio_format != "best":
            ydl_opts["postprocessors"] = [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": audio_format,
                    "preferredquality": "192",
                }
            ]

        try:
            with yt_dlp.YoutubeDL({**ydl_opts, "extract_flat": "in_playlist", "skip_download": True}) as ydl:
                info = ydl.extract_info(url, download=False)
                entries = info.get("entries") or []
                total = len([e for e in entries if e])
                title = info.get("title") or "Playlist"
                self._log(f"Playlist: {title} ({total} videos)")
                self._set_status(f"Playlist: {title}", detail=f"{total} canciones encontradas")

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            self.after(0, lambda: self._on_download_done(True, completed, total, dest))
        except Exception as exc:  # noqa: BLE001
            self._log(f"✗ Error: {exc}")
            self.after(0, lambda: self._on_download_done(False, completed, total, dest, str(exc)))

    def _on_download_done(
        self,
        success: bool,
        completed: int,
        total: int,
        dest: str,
        error: str | None = None,
    ) -> None:
        self.is_downloading = False
        self.download_btn.configure(state="normal", text="Descargar playlist")

        if success:
            self.progress.set(1)
            self._set_status(
                "¡Descarga completada!",
                detail=f"{completed} de {total} canciones guardadas en {dest}",
            )
            self._log(f"Listo: {completed}/{total} archivos en {dest}")
            messagebox.showinfo(
                "Descarga completa",
                f"Se descargaron {completed} de {total} canciones.\n\nCarpeta:\n{dest}",
            )
        else:
            self._set_status("Error en la descarga", detail=error or "Revisa el log")
            messagebox.showerror("Error", f"Ocurrió un problema:\n\n{error}")


def main() -> None:
    app = PlaylistDownloader()
    app.mainloop()


if __name__ == "__main__":
    main()
