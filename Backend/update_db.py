import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medical.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Add created_at column
try:
    cursor.execute("""
    ALTER TABLE bills
    ADD COLUMN created_at TEXT
    """)
    print("✅ created_at column added.")
except Exception as e:
    print("Bills:", e)

# Fill existing rows
cursor.execute("""
UPDATE bills
SET created_at = DATE('now')
WHERE created_at IS NULL
""")

conn.commit()
conn.close()

print("✅ Database Updated Successfully")