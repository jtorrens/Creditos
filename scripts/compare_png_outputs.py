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


def compare_directories(main_dir, comparison_dir, allow_hash_diff):
    main_files = png_files(main_dir)
    comparison_files = png_files(comparison_dir)
    errors = []
    warnings = []

    for name in sorted(set(main_files) - set(comparison_files)):
        errors.append(f"missing in comparison: {name}")
    for name in sorted(set(comparison_files) - set(main_files)):
        errors.append(f"extra in comparison: {name}")

    for name in sorted(set(main_files) & set(comparison_files)):
        try:
            main_info = png_info(main_files[name])
            comparison_info = png_info(comparison_files[name])
        except ValueError as error:
            errors.append(f"{name}: {error}")
            continue

        if (main_info["width"], main_info["height"]) != (comparison_info["width"], comparison_info["height"]):
            errors.append(
                f"{name}: dimensions differ "
                f"{main_info['width']}x{main_info['height']} != "
                f"{comparison_info['width']}x{comparison_info['height']}"
            )
        if main_info["sha256"] != comparison_info["sha256"]:
            message = (
                f"{name}: content hash differs "
                f"{main_info['sha256'][:12]} != {comparison_info['sha256'][:12]}"
            )
            if allow_hash_diff:
                warnings.append(message)
            else:
                errors.append(message)

    return errors, warnings, len(main_files), len(comparison_files)


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Compare PNG exports from two Créditos PNG export directories."
    )
    parser.add_argument("main_dir", type=pathlib.Path, help="PNG export directory from main.")
    parser.add_argument("comparison_dir", type=pathlib.Path, help="second PNG export directory.")
    parser.add_argument(
        "--allow-hash-diff",
        action="store_true",
        help="Only fail on missing files or dimension mismatches; print content hash differences as warnings.",
    )
    args = parser.parse_args(argv)

    if not args.main_dir.is_dir():
        print(f"ERROR: {args.main_dir} is not a directory.", file=sys.stderr)
        return 2
    if not args.comparison_dir.is_dir():
        print(f"ERROR: {args.comparison_dir} is not a directory.", file=sys.stderr)
        return 2

    errors, warnings, main_count, comparison_count = compare_directories(
        args.main_dir,
        args.comparison_dir,
        args.allow_hash_diff,
    )

    for warning in warnings:
        print(f"WARNING: {warning}", file=sys.stderr)
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        return 1
    print(f"ok compared {main_count} reference PNGs with {comparison_count} comparison PNGs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
