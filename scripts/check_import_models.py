#!/usr/bin/env python3
import ast
import importlib
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
IMPORT_MODELS_DIR = REPO_ROOT / "apps" / "renderer" / "import_models"
PACKAGE_ROOT = REPO_ROOT / "apps" / "renderer"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    return 1


def module_imports_concrete_model(path, concrete_model_names):
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imported = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            module = node.module or ""
            if node.level == 1 and module in concrete_model_names:
                imported.append(module)
            if module.startswith("apps.renderer.import_models."):
                imported_name = module.rsplit(".", 1)[-1]
                if imported_name in concrete_model_names:
                    imported.append(imported_name)
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.startswith("apps.renderer.import_models."):
                    imported_name = alias.name.rsplit(".", 1)[-1]
                    if imported_name in concrete_model_names:
                        imported.append(imported_name)
    return sorted(set(imported))


def calls_validate_source_json(path):
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        function = node.func
        if isinstance(function, ast.Name) and function.id == "validate_source_json":
            return True
        if isinstance(function, ast.Attribute) and function.attr == "validate_source_json":
            return True
    return False


def main():
    sys.path.insert(0, str(PACKAGE_ROOT))
    registry = importlib.import_module("import_models.registry")
    errors = []

    if not registry.IMPORT_MODELS:
        errors.append("registry.IMPORT_MODELS is empty")

    concrete_model_paths = [
        path
        for path in IMPORT_MODELS_DIR.glob("*.py")
        if path.name not in {"__init__.py", "registry.py"}
    ]
    concrete_model_names = {path.stem for path in concrete_model_paths}

    for model_id, model in registry.IMPORT_MODELS.items():
        if not isinstance(model, dict):
            errors.append(f"{model_id}: IMPORT_MODEL must be a dict")
            continue
        for key in ("id", "label", "source_kinds", "parse"):
            if key not in model:
                errors.append(f"{model_id}: missing IMPORT_MODEL['{key}']")
        if model.get("id") != model_id:
            errors.append(f"{model_id}: registry key does not match IMPORT_MODEL['id']")
        if not callable(model.get("parse")):
            errors.append(f"{model_id}: IMPORT_MODEL['parse'] must be callable")

    registered_modules = {
        getattr(model.get("parse"), "__module__", "").rsplit(".", 1)[-1]
        for model in registry.IMPORT_MODELS.values()
        if isinstance(model, dict)
    }
    unregistered = sorted(concrete_model_names - registered_modules)
    if unregistered:
        errors.append(f"unregistered import model modules: {', '.join(unregistered)}")

    for path in concrete_model_paths:
        imported = module_imports_concrete_model(path, concrete_model_names - {path.stem})
        if imported:
            errors.append(
                f"{path.relative_to(REPO_ROOT)} imports concrete model(s): {', '.join(imported)}"
            )
        if not calls_validate_source_json(path):
            errors.append(f"{path.relative_to(REPO_ROOT)} does not call validate_source_json")

    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
