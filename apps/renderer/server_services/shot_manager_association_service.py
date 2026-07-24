import json

from import_models.registry import DEFAULT_IMPORT_MODEL_ID
from .common import now_iso
from .project_service import unique_production_name


PRODUCTION_TYPES = {"FILM", "SERIES"}


def _local_production(connection, production_id):
    try:
        local_production_id = int(production_id)
    except (TypeError, ValueError) as error:
        raise ValueError("La asociación necesita una producción válida de Créditos.") from error
    production = connection.execute(
        """
        SELECT id, name, production_type, governance_mode
        FROM productions
        WHERE id = ?
        """,
        (local_production_id,),
    ).fetchone()
    if not production:
        raise ValueError("La producción de Créditos no existe.")
    return production


def _required_text(value, label):
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"La asociación necesita {label}.")
    return normalized


def _positive_number(value, label):
    try:
        number = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{label} debe ser un entero positivo.") from error
    if number < 1:
        raise ValueError(f"{label} debe ser un entero positivo.")
    return number


def _unique(records, key, label):
    values = [record[key] for record in records]
    if len(values) != len(set(values)):
        raise ValueError(f"Shot Manager contiene {label} duplicados.")


def _normalize_snapshot(payload):
    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict):
        raise ValueError("La sincronización necesita el snapshot de Shot Manager.")
    production_value = snapshot.get("production")
    if not isinstance(production_value, dict):
        raise ValueError("El snapshot no contiene una producción válida.")
    production_id = _required_text(
        production_value.get("id"),
        "el ID de producción de Shot Manager",
    )
    production_type = _required_text(
        production_value.get("productionType"),
        "el tipo de producción de Shot Manager",
    ).upper()
    if production_type not in PRODUCTION_TYPES:
        raise ValueError("Shot Manager ha devuelto un tipo de producción no admitido.")
    production = {
        "id": production_id,
        "name": _required_text(
            production_value.get("name"),
            "el nombre de producción de Shot Manager",
        ),
        "code": _required_text(
            production_value.get("code"),
            "el código de producción de Shot Manager",
        ),
        "production_type": production_type,
    }

    seasons = []
    for value in snapshot.get("seasons") or []:
        if not isinstance(value, dict) or value.get("archivedAt") is not None:
            continue
        number = _positive_number(value.get("number"), "El número de temporada")
        seasons.append(
            {
                "id": _required_text(value.get("id"), "el ID de temporada"),
                "number": number,
                "code": _required_text(value.get("code"), "el código de temporada"),
                "name": str(value.get("name") or "").strip()
                or f"Temporada {number}",
            }
        )
    _unique(seasons, "id", "IDs de temporada")
    _unique(seasons, "number", "números de temporada")
    _unique(seasons, "code", "códigos de temporada")

    season_ids = {season["id"] for season in seasons}
    episodes = []
    for value in snapshot.get("episodes") or []:
        if not isinstance(value, dict) or value.get("archivedAt") is not None:
            continue
        season_id = _required_text(
            value.get("seasonId"),
            "la temporada del capítulo",
        )
        if season_id not in season_ids:
            raise ValueError("Un capítulo de Shot Manager apunta a una temporada no activa.")
        number = _positive_number(value.get("number"), "El número de capítulo")
        code = _required_text(value.get("code"), "el código de capítulo")
        episodes.append(
            {
                "id": _required_text(value.get("id"), "el ID de capítulo"),
                "season_id": season_id,
                "number": number,
                "code": code,
                "name": str(value.get("title") or "").strip()
                or f"Episodio {code}",
            }
        )
    _unique(episodes, "id", "IDs de capítulo")
    for season in seasons:
        season_episodes = [
            episode for episode in episodes if episode["season_id"] == season["id"]
        ]
        _unique(
            season_episodes,
            "number",
            f"números de capítulo en {season['code']}",
        )
        _unique(
            season_episodes,
            "code",
            f"códigos de capítulo en {season['code']}",
        )

    if production_type == "FILM" and (seasons or episodes):
        raise ValueError("Una película de Shot Manager no puede contener temporadas.")
    if production_type == "SERIES" and not seasons:
        raise ValueError("Una serie de Shot Manager necesita al menos una temporada.")
    return {
        "production": production,
        "seasons": seasons,
        "episodes": episodes,
    }


def _local_hierarchy(connection, production_id):
    production = connection.execute(
        """
        SELECT production_type, governance_mode
        FROM productions
        WHERE id = ?
        """,
        (int(production_id),),
    ).fetchone()
    seasons = connection.execute(
        """
        SELECT
            id, season_number, code, name, shot_manager_season_id
        FROM seasons
        WHERE production_id = ?
        ORDER BY season_number, id
        """,
        (int(production_id),),
    ).fetchall()
    episodes = connection.execute(
        """
        SELECT
            episodes.id,
            episodes.season_id,
            episodes.episode_number,
            episodes.code,
            episodes.name,
            episodes.shot_manager_episode_id,
            seasons.shot_manager_season_id,
            EXISTS (
                SELECT 1 FROM documents
                WHERE documents.episode_id = episodes.id
            ) OR EXISTS (
                SELECT 1 FROM source_files
                WHERE source_files.episode_id = episodes.id
            ) AS has_content
        FROM episodes
        JOIN seasons ON seasons.id = episodes.season_id
        WHERE episodes.production_id = ?
        ORDER BY episodes.season_id, episodes.episode_number, episodes.id
        """,
        (int(production_id),),
    ).fetchall()
    return {
        "productionType": production["production_type"],
        "governanceMode": production["governance_mode"],
        "seasons": [
            {
                "localId": row["id"],
                "number": row["season_number"],
                "code": row["code"],
                "name": row["name"],
                "shotManagerSeasonId": row["shot_manager_season_id"],
            }
            for row in seasons
        ],
        "episodes": [
            {
                "localId": row["id"],
                "localSeasonId": row["season_id"],
                "number": row["episode_number"],
                "code": row["code"],
                "name": row["name"],
                "shotManagerEpisodeId": row["shot_manager_episode_id"],
                "shotManagerSeasonId": row["shot_manager_season_id"],
                "hasContent": bool(row["has_content"]),
            }
            for row in episodes
        ],
    }


def _association_dict(connection, row):
    if row is None:
        return None
    return {
        "creditosProductionId": str(row["production_id"]),
        "shotManagerProductionId": row["shot_manager_production_id"],
        "structureEntryId": row["structure_entry_id"],
        "updatedAt": row["updated_at"],
        "localHierarchy": _local_hierarchy(connection, row["production_id"]),
    }


def load_shot_manager_association(connection, production_id):
    production = _local_production(connection, production_id)
    row = connection.execute(
        """
        SELECT
            production_id,
            shot_manager_production_id,
            structure_entry_id,
            updated_at
        FROM shot_manager_associations
        WHERE production_id = ?
        """,
        (production["id"],),
    ).fetchone()
    return _association_dict(connection, row)


def _governance_plan(connection, production, normalized):
    if production["production_type"] != normalized["production"]["production_type"]:
        raise ValueError(
            "El tipo de producción no coincide entre Créditos y Shot Manager."
        )
    association = connection.execute(
        """
        SELECT production_id, shot_manager_production_id
        FROM shot_manager_associations
        WHERE production_id = ?
        """,
        (production["id"],),
    ).fetchone()
    if (
        production["governance_mode"] == "SHOT_MANAGER"
        and (
            association is None
            or association["shot_manager_production_id"]
            != normalized["production"]["id"]
        )
    ):
        raise ValueError(
            "Convierte primero la producción en independiente antes de asociarla "
            "con otra producción de Shot Manager."
        )
    remote_owner = connection.execute(
        """
        SELECT production_id
        FROM shot_manager_associations
        WHERE shot_manager_production_id = ?
          AND production_id <> ?
        """,
        (normalized["production"]["id"], production["id"]),
    ).fetchone()
    if remote_owner:
        raise ValueError(
            "Esta producción de Shot Manager ya gobierna otra producción de Créditos."
        )

    local = _local_hierarchy(connection, production["id"])
    local_seasons = local["seasons"]
    local_episodes = local["episodes"]
    governed = production["governance_mode"] == "SHOT_MANAGER"
    season_by_identity = {
        (
            season["shotManagerSeasonId"] if governed else season["code"]
        ): season
        for season in local_seasons
    }
    season_matches = {}
    matched_season_ids = set()
    for remote in normalized["seasons"]:
        identity = remote["id"] if governed else remote["code"]
        match = season_by_identity.get(identity)
        if match:
            season_matches[remote["id"]] = match
            matched_season_ids.add(match["localId"])

    episode_by_identity = {}
    if governed:
        episode_by_identity = {
            episode["shotManagerEpisodeId"]: episode
            for episode in local_episodes
        }
    else:
        for remote_season_id, local_season in season_matches.items():
            for episode in local_episodes:
                if episode["localSeasonId"] == local_season["localId"]:
                    episode_by_identity[(remote_season_id, episode["code"])] = episode

    episode_matches = {}
    matched_episode_ids = set()
    for remote in normalized["episodes"]:
        identity = (
            remote["id"]
            if governed
            else (remote["season_id"], remote["code"])
        )
        match = episode_by_identity.get(identity)
        if match:
            episode_matches[remote["id"]] = match
            matched_episode_ids.add(match["localId"])

    extra_episodes = [
        episode
        for episode in local_episodes
        if episode["localId"] not in matched_episode_ids
    ]
    extra_seasons = [
        season
        for season in local_seasons
        if season["localId"] not in matched_season_ids
    ]
    return {
        "local": local,
        "season_matches": season_matches,
        "episode_matches": episode_matches,
        "extra_episodes": extra_episodes,
        "extra_seasons": extra_seasons,
        "content_deletions": [
            {
                "localId": episode["localId"],
                "code": episode["code"],
                "name": episode["name"],
            }
            for episode in extra_episodes
            if episode["hasContent"]
        ],
        "createdSeasons": len(normalized["seasons"]) - len(season_matches),
        "createdEpisodes": len(normalized["episodes"]) - len(episode_matches),
        "deletedSeasons": len(extra_seasons),
        "deletedEpisodes": len(extra_episodes),
    }


def _apply_governance(
    connection,
    production,
    normalized,
    structure_entry_id,
    plan,
):
    timestamp = now_iso()
    connection.execute("BEGIN IMMEDIATE")
    try:
        connection.execute(
            """
            UPDATE seasons
            SET
                season_number = -id,
                code = '__SYNC_SEASON_' || id
            WHERE production_id = ?
            """,
            (production["id"],),
        )
        connection.execute(
            """
            UPDATE episodes
            SET
                episode_number = -id,
                code = '__SYNC_EPISODE_' || id
            WHERE production_id = ?
            """,
            (production["id"],),
        )

        season_ids = {}
        for remote in normalized["seasons"]:
            match = plan["season_matches"].get(remote["id"])
            if match:
                local_id = match["localId"]
                connection.execute(
                    """
                    UPDATE seasons
                    SET
                        season_number = ?,
                        code = ?,
                        name = ?,
                        shot_manager_season_id = ?,
                        updated_at = ?
                    WHERE id = ? AND production_id = ?
                    """,
                    (
                        remote["number"],
                        remote["code"],
                        remote["name"],
                        remote["id"],
                        timestamp,
                        local_id,
                        production["id"],
                    ),
                )
            else:
                cursor = connection.execute(
                    """
                    INSERT INTO seasons (
                        production_id, season_number, code, name,
                        shot_manager_season_id, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        production["id"],
                        remote["number"],
                        remote["code"],
                        remote["name"],
                        remote["id"],
                        timestamp,
                        timestamp,
                    ),
                )
                local_id = cursor.lastrowid
            season_ids[remote["id"]] = local_id

        for remote in normalized["episodes"]:
            match = plan["episode_matches"].get(remote["id"])
            if match:
                connection.execute(
                    """
                    UPDATE episodes
                    SET
                        season_id = ?,
                        episode_number = ?,
                        code = ?,
                        name = ?,
                        shot_manager_episode_id = ?,
                        updated_at = ?
                    WHERE id = ? AND production_id = ?
                    """,
                    (
                        season_ids[remote["season_id"]],
                        remote["number"],
                        remote["code"],
                        remote["name"],
                        remote["id"],
                        timestamp,
                        match["localId"],
                        production["id"],
                    ),
                )
            else:
                connection.execute(
                    """
                    INSERT INTO episodes (
                        production_id, season_id, episode_number, code, name,
                        shot_manager_episode_id, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        production["id"],
                        season_ids[remote["season_id"]],
                        remote["number"],
                        remote["code"],
                        remote["name"],
                        remote["id"],
                        timestamp,
                        timestamp,
                    ),
                )

        if plan["extra_episodes"]:
            connection.executemany(
                "DELETE FROM episodes WHERE id = ? AND production_id = ?",
                [
                    (episode["localId"], production["id"])
                    for episode in plan["extra_episodes"]
                ],
            )
        if plan["extra_seasons"]:
            connection.executemany(
                "DELETE FROM seasons WHERE id = ? AND production_id = ?",
                [
                    (season["localId"], production["id"])
                    for season in plan["extra_seasons"]
                ],
            )

        connection.execute(
            """
            INSERT INTO shot_manager_associations (
                production_id,
                shot_manager_production_id,
                structure_entry_id,
                updated_at
            )
            VALUES (?, ?, ?, ?)
            ON CONFLICT(production_id) DO UPDATE SET
                shot_manager_production_id = excluded.shot_manager_production_id,
                structure_entry_id = excluded.structure_entry_id,
                updated_at = excluded.updated_at
            """,
            (
                production["id"],
                normalized["production"]["id"],
                structure_entry_id,
                timestamp,
            ),
        )
        connection.execute(
            """
            UPDATE productions
            SET governance_mode = 'SHOT_MANAGER', updated_at = ?
            WHERE id = ?
            """,
            (timestamp, production["id"]),
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise


def save_shot_manager_association(connection, payload):
    production = _local_production(
        connection,
        payload.get("creditosProductionId"),
    )
    shot_manager_production_id = _required_text(
        payload.get("shotManagerProductionId"),
        "la producción de Shot Manager",
    )
    structure_entry_id = _required_text(
        payload.get("structureEntryId"),
        "el elemento de estructura de Shot Manager",
    )
    normalized = _normalize_snapshot(payload)
    if normalized["production"]["id"] != shot_manager_production_id:
        raise ValueError("El snapshot no corresponde a la producción seleccionada.")
    plan = _governance_plan(connection, production, normalized)
    if plan["content_deletions"] and not payload.get("confirmDestructive"):
        return {
            "confirmationRequired": True,
            "plan": {
                "contentDeletions": plan["content_deletions"],
                "createdSeasons": plan["createdSeasons"],
                "createdEpisodes": plan["createdEpisodes"],
                "deletedSeasons": plan["deletedSeasons"],
                "deletedEpisodes": plan["deletedEpisodes"],
            },
            "association": None,
        }
    _apply_governance(
        connection,
        production,
        normalized,
        structure_entry_id,
        plan,
    )
    return {
        "confirmationRequired": False,
        "plan": {
            "createdSeasons": plan["createdSeasons"],
            "createdEpisodes": plan["createdEpisodes"],
            "deletedSeasons": plan["deletedSeasons"],
            "deletedEpisodes": plan["deletedEpisodes"],
        },
        "association": load_shot_manager_association(
            connection,
            production["id"],
        ),
    }


def create_governed_production(connection, payload):
    structure_entry_id = _required_text(
        payload.get("structureEntryId"),
        "el elemento de estructura de Shot Manager",
    )
    normalized = _normalize_snapshot(payload)
    requested_production_id = _required_text(
        payload.get("shotManagerProductionId"),
        "la producción de Shot Manager",
    )
    if normalized["production"]["id"] != requested_production_id:
        raise ValueError("El snapshot no corresponde a la producción seleccionada.")
    remote_owner = connection.execute(
        """
        SELECT production_id
        FROM shot_manager_associations
        WHERE shot_manager_production_id = ?
        """,
        (normalized["production"]["id"],),
    ).fetchone()
    if remote_owner:
        raise ValueError(
            "Esta producción de Shot Manager ya existe en Créditos."
        )
    timestamp = now_iso()
    name = unique_production_name(
        connection,
        normalized["production"]["name"],
    )
    connection.execute("BEGIN IMMEDIATE")
    try:
        cursor = connection.execute(
            """
            INSERT INTO productions (
                name, production_type, governance_mode,
                page_width, page_height, preview_background,
                import_model_id, settings_json, created_at, updated_at
            )
            VALUES (?, ?, 'SHOT_MANAGER', 1920, 1080, '#ffffff', ?, ?, ?, ?)
            """,
            (
                name,
                normalized["production"]["production_type"],
                DEFAULT_IMPORT_MODEL_ID,
                json.dumps({}, ensure_ascii=False),
                timestamp,
                timestamp,
            ),
        )
        production_id = cursor.lastrowid
        season_ids = {}
        for season in normalized["seasons"]:
            season_cursor = connection.execute(
                """
                INSERT INTO seasons (
                    production_id, season_number, code, name,
                    shot_manager_season_id, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    production_id,
                    season["number"],
                    season["code"],
                    season["name"],
                    season["id"],
                    timestamp,
                    timestamp,
                ),
            )
            season_ids[season["id"]] = season_cursor.lastrowid
        for episode in normalized["episodes"]:
            connection.execute(
                """
                INSERT INTO episodes (
                    production_id, season_id, episode_number, code, name,
                    shot_manager_episode_id, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    production_id,
                    season_ids[episode["season_id"]],
                    episode["number"],
                    episode["code"],
                    episode["name"],
                    episode["id"],
                    timestamp,
                    timestamp,
                ),
            )
        connection.execute(
            """
            INSERT INTO shot_manager_associations (
                production_id, shot_manager_production_id,
                structure_entry_id, updated_at
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                production_id,
                normalized["production"]["id"],
                structure_entry_id,
                timestamp,
            ),
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    return production_id


def delete_shot_manager_association(connection, production_id):
    production = _local_production(connection, production_id)
    connection.execute("BEGIN IMMEDIATE")
    try:
        cursor = connection.execute(
            "DELETE FROM shot_manager_associations WHERE production_id = ?",
            (production["id"],),
        )
        connection.execute(
            """
            UPDATE productions
            SET governance_mode = 'INDEPENDENT', updated_at = ?
            WHERE id = ?
            """,
            (now_iso(), production["id"]),
        )
        connection.execute(
            """
            UPDATE seasons
            SET shot_manager_season_id = NULL
            WHERE production_id = ?
            """,
            (production["id"],),
        )
        connection.execute(
            """
            UPDATE episodes
            SET shot_manager_episode_id = NULL
            WHERE production_id = ?
            """,
            (production["id"],),
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    return cursor.rowcount > 0
