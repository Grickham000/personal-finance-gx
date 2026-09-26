import os
import glob
import logging
import firebase_admin
from firebase_admin import credentials

logger = logging.getLogger(__name__)

# Resolve path relative to the app root (parent of Common/)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cert_pattern = "personalfinance-a0728-firebase-adminsdk-*.json"

candidates = [
    os.path.join(base_dir, "personalfinance-a0728-firebase-adminsdk-vr1aa-826b24ddc7.json"),
    os.path.join(os.getcwd(), "personalfinance-a0728-firebase-adminsdk-vr1aa-826b24ddc7.json"),
    os.path.join("/home/site/wwwroot", "personalfinance-a0728-firebase-adminsdk-vr1aa-826b24ddc7.json"),
]

# Check glob patterns in case of variations
candidates.extend(glob.glob(os.path.join(base_dir, cert_pattern)))
candidates.extend(glob.glob(os.path.join(os.getcwd(), cert_pattern)))
candidates.extend(glob.glob(os.path.join("/home/site/wwwroot", cert_pattern)))

cert_path = None
for candidate in candidates:
    if candidate and os.path.exists(candidate):
        cert_path = candidate
        break

firebase_app = None
if not firebase_admin._apps:
    if cert_path:
        try:
            cred = credentials.Certificate(cert_path)
            firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized successfully with cert: %s", cert_path)
        except Exception as e:
            logger.error("Failed to initialize Firebase with cert %s: %s", cert_path, e)
    else:
        logger.error("Firebase certificate not found. Checked candidate locations: %s", candidates)
else:
    firebase_app = firebase_admin.get_app()