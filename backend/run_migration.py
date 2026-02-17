"""
Run database migrations without needing psql.
Usage (from backend folder): python run_migration.py
"""
import os
import sys

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.database import engine

def run():
    sql = "ALTER TABLE polls ADD COLUMN IF NOT EXISTS voting_security VARCHAR(32) NOT NULL DEFAULT 'ip_address';"
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    print("Migration completed: polls.voting_security column added (or already existed).")

if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"Migration failed: {e}", file=sys.stderr)
        sys.exit(1)
