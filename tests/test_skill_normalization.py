from backend.services.skill_normalization import (
    normalize_skill,
)

def test_postgres_normalization():

    assert normalize_skill(
        "Postgres"
    ) == "postgresql"

    assert normalize_skill(
        "PostgreSQL"
    ) == "postgresql"


def test_kubernetes_alias():

    assert normalize_skill(
        "K8s"
    ) == "kubernetes"


def test_node_alias():

    assert normalize_skill(
        "Node"
    ) == "node.js"