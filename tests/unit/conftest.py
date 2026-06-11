from unittest.mock import patch
import sys

# Start a global mock for firestore.client so module-level imports do not fail on unit tests
firestore_patcher = patch("firebase_admin.firestore.client")
mock_firestore_client = firestore_patcher.start()
