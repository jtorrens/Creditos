import copy
import zipfile
from io import BytesIO

from import_models.common.spreadsheet_readers import (
    choose_sheet,
    read_ods_workbook,
    read_sheet_rows,
    workbook_sheets,
)


INSPECTION_SCHEMA = "parser_lab_inspection"
INSPECTION_VERSION = 2
SUPPORTED_SOURCE_KINDS = {"ods", "xlsx"}


def inspect_source_rows(file_bytes, source_name, source_kind):
    """Return an isolated snapshot of normalized spreadsheet rows.

    This function deliberately stops before any import-model interpretation.
    Its result is a parser-lab contract, not a production source document.
    """
    kind = normalize_source_kind(source_kind)
    if not isinstance(source_name, str) or not source_name:
        raise ValueError("Parser lab source_name must be a non-empty string.")
    if not isinstance(file_bytes, (bytes, bytearray)):
        raise TypeError("Parser lab file_bytes must be bytes or bytearray.")

    with zipfile.ZipFile(BytesIO(bytes(file_bytes))) as zip_file:
        sheets, sheet, rows = read_normalized_workbook(zip_file, kind)
    rows_with_empty_divisions = expand_empty_rows(rows)

    document = {
        "schema": INSPECTION_SCHEMA,
        "version": INSPECTION_VERSION,
        "source": source_name,
        "source_kind": kind,
        "sheet": sheet["name"],
        "workbook_sheets": [
            {"name": item["name"], "is_active": bool(item["is_active"])}
            for item in sheets
        ],
        "columns": ["A", "B", "C", "D"],
        "rows": rows_with_empty_divisions,
    }
    validate_inspection_document(document)
    return document


def expand_empty_rows(rows):
    """Restore internal empty spreadsheet rows from preserved row numbers."""
    expanded = []
    previous_number = None
    for source_row in rows or []:
        number = int(source_row["row"])
        if previous_number is not None:
            for empty_number in range(previous_number + 1, number):
                expanded.append(empty_row(empty_number))
        normalized = copy.deepcopy(source_row)
        normalized["empty"] = not any(normalized.get("values", {}).values())
        expanded.append(normalized)
        previous_number = number
    return expanded


def empty_row(number):
    return {
        "row": number,
        "values": {"A": "", "B": "", "C": "", "D": ""},
        "styles": {},
        "bold": {},
        "merged_b_to_d": False,
        "empty": True,
    }


def normalize_source_kind(source_kind):
    kind = str(source_kind or "").lower().lstrip(".")
    if kind not in SUPPORTED_SOURCE_KINDS:
        supported = ", ".join(sorted(SUPPORTED_SOURCE_KINDS))
        raise ValueError(f"Parser lab source kind {source_kind!r} is not supported. Expected: {supported}.")
    return kind


def read_normalized_workbook(zip_file, source_kind):
    if source_kind == "ods":
        return read_ods_workbook(zip_file)

    sheets = workbook_sheets(zip_file)
    sheet = choose_sheet(sheets)
    rows = read_sheet_rows(zip_file, sheet["path"])
    return sheets, sheet, rows


def validate_inspection_document(document):
    if document.get("schema") != INSPECTION_SCHEMA:
        raise ValueError("Invalid parser lab inspection schema.")
    if document.get("version") != INSPECTION_VERSION:
        raise ValueError("Invalid parser lab inspection version.")
    if document.get("columns") != ["A", "B", "C", "D"]:
        raise ValueError("Parser lab inspection columns must be A, B, C, D.")
    if not isinstance(document.get("rows"), list):
        raise ValueError("Parser lab inspection rows must be a list.")

    for index, row in enumerate(document["rows"]):
        path = f"rows[{index}]"
        if not isinstance(row.get("row"), int):
            raise ValueError(f"{path}.row must be an integer.")
        if not isinstance(row.get("values"), dict):
            raise ValueError(f"{path}.values must be an object.")
        if not isinstance(row.get("bold"), dict):
            raise ValueError(f"{path}.bold must be an object.")
        if not isinstance(row.get("merged_b_to_d"), bool):
            raise ValueError(f"{path}.merged_b_to_d must be a boolean.")
        if not isinstance(row.get("empty"), bool):
            raise ValueError(f"{path}.empty must be a boolean.")
        for column in document["columns"]:
            if column not in row["values"] or not isinstance(row["values"][column], str):
                raise ValueError(f"{path}.values.{column} must be a string.")

    return document
