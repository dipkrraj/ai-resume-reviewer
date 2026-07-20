import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def reset_db():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to database to check and reset tables...")
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        transaction = conn.begin()
        try:
            print("Dropping existing tables to clean up schema mismatch...")
            # Drop tables with CASCADE to clean up foreign keys correctly
            conn.execute(text("DROP TABLE IF EXISTS resume_analyses CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS resumes CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
            transaction.commit()
            print("Tables dropped successfully!")
        except Exception as e:
            transaction.rollback()
            print(f"Error dropping tables: {e}")
            sys.exit(1)

if __name__ == "__main__":
    reset_db()
