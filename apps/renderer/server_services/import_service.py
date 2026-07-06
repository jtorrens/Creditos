from import_models.registry import DEFAULT_IMPORT_MODEL_ID, parse_source


def import_credit_source(file_bytes, source_name, import_model_id=None, options=None):
    return parse_source(file_bytes, source_name, import_model_id or DEFAULT_IMPORT_MODEL_ID, options)
