from import_models.registry import DEFAULT_IMPORT_MODEL_ID, parse_source
from .import_rule_model_service import get_rule_model


def import_credit_source(connection, file_bytes, source_name, import_model_id=None, options=None):
    model_id = import_model_id or DEFAULT_IMPORT_MODEL_ID
    if str(model_id).startswith("rule_model_"):
        rule_model = get_rule_model(connection, model_id)
        return parse_source(
            file_bytes,
            source_name,
            "rule_based_credits",
            {**(options or {}), "rule_model": rule_model},
        )
    return parse_source(file_bytes, source_name, model_id, options)
