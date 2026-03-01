"""
Archive Reset Utility
Removes all entry documents from Firestore (including the images sub-collection)
and all associated binary assets from Firebase Storage.

Run from the backend/ directory:
    python cleanup_memories.py

What gets removed:
  - Firestore: archive/{id} documents
  - Firestore: archive/{id}/images/{*} sub-collection documents
  - Firebase Storage: memories/{id}/** (photos and voice recording)

What is NOT touched:
  - ElevenLabs voice clones, knowledge bases, or agents
    (manage those at https://elevenlabs.io/app/voice-lab)
  - Your .env configuration file
  - Any Firebase project settings
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv()

import firebase_admin
from firebase_admin import credentials, firestore, storage


def connect_cloud() -> tuple:
    cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccount.json")
    bucket_name = os.environ.get("FIREBASE_STORAGE_BUCKET", "")

    if not os.path.isfile(cred_path):
        print(f"ERROR: service account file not found at {cred_path}")
        sys.exit(1)
    if not bucket_name:
        print("ERROR: FIREBASE_STORAGE_BUCKET not set in .env")
        sys.exit(1)

    cert = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cert, {"storageBucket": bucket_name})
    db = firestore.client()
    bucket = storage.bucket()
    return db, bucket


def scan_entries(db) -> list:
    return list(db.collection("archive").stream())


def purge_entry(db, bucket, entry_id: str, dry_run: bool = False) -> None:
    prefix = f"memories/{entry_id}/"

    # Remove image sub-collection documents
    images_ref = db.collection("archive").document(entry_id).collection("images")
    img_docs = list(images_ref.stream())
    for img in img_docs:
        if dry_run:
            print(f"  [DRY RUN] Would remove Firestore image: {img.id}")
        else:
            img.reference.delete()
            print(f"  Removed Firestore image doc: {img.id}")

    # Remove Storage assets under memories/{id}/
    blobs = list(bucket.list_blobs(prefix=prefix))
    if blobs:
        for blob in blobs:
            if dry_run:
                print(f"  [DRY RUN] Would remove Storage asset: {blob.name}")
            else:
                blob.delete()
                print(f"  Removed Storage asset: {blob.name}")
    else:
        print(f"  No Storage assets found under {prefix}")

    # Remove the parent entry document
    entry_ref = db.collection("archive").document(entry_id)
    if dry_run:
        print(f"  [DRY RUN] Would remove Firestore entry: {entry_id}")
    else:
        entry_ref.delete()
        print(f"  Removed Firestore entry: {entry_id}")


def main() -> None:
    print("=" * 60)
    print("Archive Reset — Firestore + Storage Cleanup")
    print("=" * 60)

    db, bucket = connect_cloud()
    entries = scan_entries(db)

    if not entries:
        print("\nNo entries found in Firestore. Nothing to remove.")
        return

    print(f"\nFound {len(entries)} entry document(s):\n")
    for doc in entries:
        rec = doc.to_dict() or {}
        subject = rec.get("subject_name", "Unknown")
        state = rec.get("state", "unknown")
        voice = rec.get("voice_token") or "(none)"
        companion = rec.get("companion_id") or "(none)"
        registered = rec.get("registered_at", "unknown date")
        print(f"  ID          : {doc.id}")
        print(f"  Subject     : {subject}")
        print(f"  State       : {state}")
        print(f"  voice_token : {voice}")
        print(f"  companion   : {companion}")
        print(f"  Registered  : {registered}")
        print()

    print("-" * 60)
    print("This permanently removes the listed Firestore documents and")
    print("all associated Firebase Storage assets.")
    print()
    print("ElevenLabs resources (voice clone, KB, agent) are NOT")
    print("removed here — manage those at elevenlabs.io if needed.")
    print("-" * 60)
    print()
    selection = input("Type  yes  to remove ALL, or enter an entry ID to remove just one: ").strip()

    if selection.lower() == "yes":
        targets = entries
    elif selection in {doc.id for doc in entries}:
        targets = [doc for doc in entries if doc.id == selection]
    else:
        print("Aborted — nothing removed.")
        return

    print()
    for doc in targets:
        entry_id = doc.id
        subject = (doc.to_dict() or {}).get("subject_name", "Unknown")
        print(f"Removing entry for '{subject}' ({entry_id}) ...")
        purge_entry(db, bucket, entry_id, dry_run=False)
        print(f"  Done.\n")

    print("=" * 60)
    print("Reset complete.")
    print()
    print("Next steps:")
    print("  1. Restart the backend:  cd backend && python run.py")
    print("  2. Start the frontend:   cd frontend && npm run dev")
    print("  3. Open http://localhost:5173 and submit fresh photos")
    print("=" * 60)


if __name__ == "__main__":
    main()
