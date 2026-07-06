#!/usr/bin/env python3
import pathlib
import re
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_JS = REPO_ROOT / "apps" / "renderer" / "app.js"

MOVED_DOMAIN_FUNCTIONS = [
    "defaultSettings",
    "normalizeSettings",
    "normalizeLanguage",
    "normalizeTextCapitalization",
    "localeForLanguage",
    "normalizeProtectedCapitalizationTerms",
    "normalizeProtectedCapitalizationText",
    "applyProtectedCapitalizations",
    "applyTextCapitalization",
    "capitalizeWord",
    "isDottedInitialism",
    "getMaterialContentItems",
    "materialHasRenderableContent",
    "removeDefaultEmptyCartelas",
    "cartelaHasRenderableRefs",
    "ensureCartelaOrders",
    "normalizeVisualOrders",
    "getVisualCartelas",
    "migrateStructure",
    "defaultCartelaForMaterial",
    "normalizeCartela",
    "normalizeCartelaPage",
    "normalizeFrozenMaterial",
    "applyLockedMaterials",
    "getLockedSourceRefSettings",
    "normalizeCartelaImage",
    "normalizeCartelaImages",
    "migrateCartelaImages",
    "cartelaImages",
    "cartelaHasImages",
    "getCartelaRefs",
    "enforceUniqueMaterialRefs",
    "renderMaterial",
    "renderedUnitText",
    "getRenderedBlockUnits",
    "forceRenderedRoleNameColumns",
    "splitRenderedUnitsByBreaks",
    "countThemeLines",
    "countItemLines",
    "flattenRenderedItems",
    "groupMusicLicenseThemes",
    "renderItem",
    "defaultPreviewSettings",
    "normalizePreviewSettings",
    "normalizeRenderCodec",
    "normalizeRenderProfile",
    "getPageFrameCount",
    "formatFrameDuration",
    "formatSecondsAsFrameDuration",
    "parseFrameDuration",
    "distributeFrames",
    "fitPageFrameCountsToTarget",
    "explicitTextLines",
    "explicitTextLineCount",
    "unitRenderOptions",
    "sourceBlankRowsBefore",
    "sourceUnitStartRow",
    "sourceUnitEndRow",
    "sourceBlankRowCounts",
    "creditSourceId",
    "blockForTitleRepeat",
    "countTitleLine",
    "normalizeCartelaStyle",
    "serializeCartelaStyle",
    "safeFilePart",
    "normalizeEditableValue",
    "normalizeText",
    "normalizeColor",
    "normalizeBoolean",
    "normalizeTypographyOverrides",
    "normalizeTitleTypographyOverrides",
    "normalizeBlockAlignment",
    "defaultBlockAlignment",
    "materialHasPairedText",
    "normalizeVerticalAlign",
    "explicitCartelaTitleTypography",
    "explicitCartelaBlockStyle",
    "explicitSourceRefSettings",
    "clonePlainValue",
    "formatScrollSpeed",
    "scrollItemExitOffset",
    "scrollItemNormalOffset",
    "scrollItemEnterOffset",
    "buildIntegerScrollPhase",
    "scrollOffsetForFrame",
    "scrollOffsetForPhaseFrame",
    "scrollItemIntersectsClip",
    "scrollFullAreaItemClip",
    "scrollClipRect",
    "layoutForCartela",
    "numberWithFallback",
    "contentAreaRect",
    "buildScrollPlan",
    "buildScrollItems",
    "scrollGapAfterItem",
    "buildScrollItem",
    "scrollBlocksForPages",
    "scrollBlockHasVisibleText",
    "scrollUnitHasVisibleText",
    "settingsWithProductionLayout",
    "stripProductionLayoutFromSettings",
    "transformCartelaText",
    "fontWeightFromStyle",
    "fontStyleFromStyle",
    "quoteFontFamily",
    "getMovieExportFrameCounts",
    "getMovieBodyTargetFramesOrSource",
    "getMovieTargetFramesOrSource",
    "movieBodySourceFrames",
    "movieBodySourceTotal",
    "normalizeMovieSegments",
]


def main():
    text = APP_JS.read_text(encoding="utf-8")
    errors = []
    for name in MOVED_DOMAIN_FUNCTIONS:
        pattern = re.compile(rf"function\s+{re.escape(name)}\s*\(")
        if pattern.search(text):
            errors.append(f"apps/renderer/app.js defines moved domain function {name}()")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
