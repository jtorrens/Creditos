from pathlib import PurePath

from import_models.common.rule_model_schema import (
    validate_rule_model as validate_block_model,
)
from .inspection import inspect_source_rows


def inspect_uploaded_source(file_bytes, source_name, source_kind=None):
    """Build a parser-lab inspection document from an uploaded spreadsheet."""
    kind = source_kind or source_kind_from_name(source_name)
    return inspect_source_rows(file_bytes, source_name, kind)


def source_kind_from_name(source_name):
    suffix = PurePath(str(source_name or "")).suffix.lower().lstrip(".")
    if suffix not in {"ods", "xlsx"}:
        raise ValueError("Parser Lab solo admite archivos .ods y .xlsx.")
    return suffix
