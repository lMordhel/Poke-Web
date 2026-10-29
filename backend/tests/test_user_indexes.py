"""MongoDB index setup at startup (S9 of odd/tasks/poke-web-hardening.md).

The index setup runs when the application starts. These tests drive it through a
fake database handle that records every `create_index` call, so no MongoDB
server is required.
"""

from pymongo import ASCENDING, DESCENDING

from app.main import create_indexes


class FakeCollection:
    """Records the index definitions requested for one collection."""

    def __init__(self, name):
        self.name = name
        self.indexes = []

    async def create_index(self, keys, **options):
        self.indexes.append((list(keys), options))
        return f"{self.name}_{len(self.indexes)}"

    def index_keys(self):
        return [keys for keys, _ in self.indexes]


class FakeDatabase:
    """Attribute access returns a stable fake collection per name, like Motor."""

    def __init__(self):
        self.collections = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self.collections:
            self.collections[name] = FakeCollection(name)
        return self.collections[name]


async def test_users_email_gets_a_unique_index():
    """S9: `users.email` is unique, enforced by the database itself."""
    db = FakeDatabase()

    await create_indexes(db)

    email_indexes = [
        (keys, options)
        for keys, options in db.users.indexes
        if keys == [("email", ASCENDING)]
    ]
    assert len(email_indexes) == 1
    _, options = email_indexes[0]
    assert options.get("unique") is True


async def test_startup_keeps_the_existing_orders_and_activities_indexes():
    """S9: adding the unique email index must not drop the current indexes."""
    db = FakeDatabase()

    await create_indexes(db)

    assert [("user_id", ASCENDING)] in db.orders.index_keys()
    assert [("user_id", ASCENDING), ("created_at", DESCENDING)] in db.orders.index_keys()
    assert [
        ("user_id", ASCENDING),
        ("timestamp", DESCENDING),
    ] in db.activities.index_keys()
