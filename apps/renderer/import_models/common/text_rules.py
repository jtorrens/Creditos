import re


def looks_like_closing_copy_text(value):
    text = normalize_copy_text(value)
    return any(
        marker in text
        for marker in [
            "produccion",
            "colaboracion",
            "copyright",
            "deposito legal",
            "copy animado",
            "atresmedia",
        ]
    ) or "©" in str(value or "")


def normalize_copy_text(value):
    text = str(value or "").lower()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", " ", text).strip()
