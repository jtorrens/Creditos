import copy

from .spreadsheet_readers import (
    choose_sheet,
    read_ods_workbook,
    read_sheet_rows,
    workbook_sheets,
)


def read_normalized_workbook(zip_file, source_kind, include_bordered_empty=False):
    if source_kind == "ods":
        return read_ods_workbook(
            zip_file,
            include_bordered_empty=include_bordered_empty,
        )
    sheets = workbook_sheets(zip_file)
    sheet = choose_sheet(sheets)
    rows = read_sheet_rows(
        zip_file,
        sheet["path"],
        include_bordered_empty=include_bordered_empty,
    )
    return sheets, sheet, rows


def expand_empty_rows(rows):
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
        "borders": {},
        "merged_b_to_d": False,
        "empty": True,
    }
