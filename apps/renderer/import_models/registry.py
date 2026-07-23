from . import rule_based_credits, standard_credits_xls, traz_credits_ods


DEFAULT_IMPORT_MODEL_ID = standard_credits_xls.IMPORT_MODEL["id"]

IMPORT_MODELS = {
    standard_credits_xls.IMPORT_MODEL["id"]: standard_credits_xls.IMPORT_MODEL,
    traz_credits_ods.IMPORT_MODEL["id"]: traz_credits_ods.IMPORT_MODEL,
    rule_based_credits.IMPORT_MODEL["id"]: rule_based_credits.IMPORT_MODEL,
}


def get_import_model(import_model_id=None):
    model_id = import_model_id or DEFAULT_IMPORT_MODEL_ID
    try:
        return IMPORT_MODELS[model_id]
    except KeyError as error:
        raise ValueError(f"Modelo de importacion no disponible: {model_id}") from error


def parse_source(file_bytes, source_name, import_model_id=None, options=None):
    model = get_import_model(import_model_id)
    return model["parse"](file_bytes, source_name, options or {})


def list_import_models():
    return [
        {
            "id": model["id"],
            "label": model.get("label") or model["id"],
            "source_kinds": model.get("source_kinds", []),
        }
        for model in IMPORT_MODELS.values()
        if not model.get("dynamic_template")
    ]
