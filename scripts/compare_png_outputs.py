#!/usr/bin/env python3
import argparse
import hashlib
import pathlib
import struct
import sys


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def png_info(path):
    with path.open("rb") as handle:
        header = handle.read(24)
        if len(header) < 24 or not header.startswith(PNG_SIGNATURE):
            raise ValueError("not a PNG file")
        width, height = struct.unpack(">II", header[16:24])
        handle.seek(0)
        digest = hashlib.sha256(handle.read()).hexdigest()
    return {
        "size": path.stat().st_size,
        "width": width,
        "height": height,
        "sha256": digest,
    }


def png_files(root):
    return {
        path.relative_to(root).as_posix(): path
        for path in sorted(root.rglob("*.png"))
        if path.is_file()
    }


def compare_directories(main_dir, refactor_dir, allow_hash_diff):
    main_files = png_files(main_dir)
    refactor_files = png_files(refactor_dir)
    errors = []
    warnings = []

    for name in sorted(set(main_files) - set(refactor_files)):
        errors.append(f"missing in refactor: {name}")
    for name in sorted(set(refactor_files) - set(main_files)):
        errors.append(f"extra in refactor: {name}")

    for name in sorted(set(main_files) & set(refactor_files)):
        try:
            main_info = png_info(main_files[name])
            refactor_info = png_info(refactor_files[name])
        except ValueError as error:
            errors.append(f"{name}: {error}")
            continue

        if (main_info["width"], main_info["height"]) != (refactor_info["width"], refactor_info["height"]):
            errors.append(
                f"{name}: dimensions differ "
                f"{main_info['width']}x{main_info['height']} != "
                f"{refactor_info['width']}x{refactor_info['height']}"
            )
        if main_info["sha256"] != refactor_info["sha256"]:
            message = (
                f"{name}: content hash differs "
                f"{main_info['sha256'][:12]} != {refactor_info['sha256'][:12]}"
            )
            if allow_hash_diff:
                warnings.append(message)
            else:
                errors.append(message)

    return errors, warnings, len(main_files), len(refactor_files)


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Compare PNG exports from production/main and the refactor checkout."
    )
    parser.add_argument("main_dir", type=pathlib.Path, help="PNG export directory from main.")
    parser.add_argument("refactor_dir", type=pathlib.Path, help="PNG export directory from refactor.")
    parser.add_argument(
        "--allow-hash-diff",
        action="store_true",
        help="Only fail on missing files or dimension mismatches; print content hash differences as warnings.",
    )
    args = parser.parse_args(argv)

    if not args.main_dir.is_dir():
        print(f"ERROR: {args.main_dir} is not a directory.", file=sys.stderr)
        return 2
    if not args.refactor_dir.is_dir():
        print(f"ERROR: {args.refactor_dir} is not a directory.", file=sys.stderr)
        return 2

    errors, warnings, main_count, refactor_count = compare_directories(
        args.main_dir,
        args.refactor_dir,
        args.allow_hash_diff,
    )

    for warning in warnings:
        print(f"WARNING: {warning}", file=sys.stderr)
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        return 1
    print(f"ok compared {main_count} main PNGs with {refactor_count} refactor PNGs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
