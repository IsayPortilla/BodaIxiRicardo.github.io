# YouTube Playlist Downloader

App con interfaz gráfica para descargar todas las canciones de una playlist de YouTube.

## Requisitos

- Python 3.10 o superior
- [FFmpeg](https://ffmpeg.org/download.html) instalado y en el PATH (necesario para convertir a MP3/M4A/WAV)

### Instalar FFmpeg en Windows

1. Descarga desde https://www.gyan.dev/ffmpeg/builds/ (versión `ffmpeg-release-essentials.zip`)
2. Extrae y agrega la carpeta `bin` al PATH del sistema
3. Reinicia la terminal y verifica con: `ffmpeg -version`

## Instalación

```bash
cd youtube-playlist-downloader
pip install -r requirements.txt
```

## Uso

```bash
python descargar_playlist.py
```

1. Pega la URL de la playlist de YouTube
2. Elige la carpeta donde guardar las canciones
3. Selecciona el formato (MP3, M4A o WAV)
4. Pulsa **Descargar playlist**

Las canciones se guardan numeradas: `001 - Título.mp3`, `002 - Título.mp3`, etc.
