import re
import os
import sys
import argparse
from pathlib import Path

try:
    from gtts import gTTS
except ImportError:
    sys.exit("Installez gTTS:  pip install gtts")

try:
    from pydub import AudioSegment
except ImportError:
    sys.exit("Installez pydub:  pip install pydub")

DEFAULT_INPUT  = "C:\\Users\\admin\\Documents\\Noutq\\src\\data\\lessons"
DEFAULT_OUTPUT = "C:\\Users\\admin\\Documents\\Noutq\\public\\audio"


def extract_arabic_strings(ts_text):
    pattern = re.compile(r'arabic\s*:\s*["\']([^"\']+)["\']')
    seen, results = set(), []
    for m in pattern.finditer(ts_text):
        value = m.group(1).strip()
        if value and value not in seen:
            seen.add(value)
            results.append(value)
    return results


def sanitize_filename(arabic, max_len=40):
    name = re.sub(r'\s+', '_', arabic)
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', name)
    if len(name) > max_len:
        name = name[:max_len] + '...'
    return name or "arabic"


def text_to_wav(arabic_text, wav_path, lang="ar"):
    tts = gTTS(text=arabic_text, lang=lang, slow=False)
    mp3_path = wav_path.replace('.wav', '_tmp.mp3')
    tts.save(mp3_path)
    audio = AudioSegment.from_mp3(mp3_path)
    audio.export(wav_path, format="wav")
    os.remove(mp3_path)


def process_file(ts_path, output_dir, lang="ar"):
    print("\n[fichier]  " + str(ts_path.name))
    text = ts_path.read_text(encoding="utf-8")
    entries = extract_arabic_strings(text)

    if not entries:
        print("   Aucun champ arabic: trouve.")
        return

    for arabic in entries:
        filename = sanitize_filename(arabic) + ".wav"
        wav_path = output_dir / filename

        if wav_path.exists():
            print("   existe deja: " + filename)
            continue

        try:
            text_to_wav(arabic, str(wav_path), lang=lang)
            print("   OK  " + filename)
        except Exception as e:
            print("   ERREUR '" + arabic + "': " + str(e))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input",      "-i", default=DEFAULT_INPUT)
    parser.add_argument("--output_dir", "-o", default=DEFAULT_OUTPUT)
    parser.add_argument("--lang",             default="ar")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if input_path.is_file():
        if input_path.suffix != ".ts":
            sys.exit("Le fichier doit etre un .ts")
        process_file(input_path, output_dir, args.lang)

    elif input_path.is_dir():
        ts_files = sorted(input_path.glob("**/*.ts"))
        if not ts_files:
            sys.exit("Aucun fichier .ts trouve dans " + str(input_path))
        for ts_file in ts_files:
            process_file(ts_file, output_dir, args.lang)

    else:
        sys.exit("Chemin introuvable: " + str(input_path))

    print("\nTermine! Fichiers WAV dans: " + str(output_dir.resolve()))


if __name__ == "__main__":
    main()