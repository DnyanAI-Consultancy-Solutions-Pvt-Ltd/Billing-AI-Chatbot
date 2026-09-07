import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medical.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# ===========================================
# PATIENTS
# ===========================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS patients(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    gender TEXT,
    doctor TEXT
)
""")

# ===========================================
# BILLS
# ===========================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS bills(
    bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT,
    consultation REAL,
    medicine REAL,
    lab REAL,
    gst REAL,
    total REAL,
    created_at TEXT DEFAULT CURRENT_DATE
)
""")

# ===========================================
# MEDICINES
# ===========================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS medicines(
    medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_name TEXT,
    stock INTEGER,
    price REAL,
    supplier TEXT,
    expiry_date TEXT
)
""")

# ===========================================
# MEDICINE SALES
# ===========================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS medicine_sales(
    sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_name TEXT,
    quantity INTEGER,
    amount REAL,
    sale_date TEXT DEFAULT CURRENT_DATE
)
""")

conn.commit()
conn.close()

print("✅ Database Ready Successfully")