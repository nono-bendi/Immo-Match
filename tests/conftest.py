"""Configuration pytest partagée.

Définit les variables d'environnement requises AVANT l'import de `backend`/`config`
(qui échouent désormais volontairement si ces clés sont absentes — cf. sécurité).
Ces valeurs ne servent qu'aux tests, jamais en production.
"""
import os
from cryptography.fernet import Fernet

os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-not-for-production")
os.environ.setdefault("FERNET_KEY", Fernet.generate_key().decode())
os.environ.setdefault("SUPERADMIN_SECRET", "test-superadmin-secret")
os.environ.setdefault("SUPERADMIN_PASSWORD", "test-superadmin-password")
