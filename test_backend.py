import subprocess
import time
import requests

# Lancer le serveur en arrière-plan
proc = subprocess.Popen(["python", "-m", "uvicorn", "backend:app", "--port", "8080"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# Attendre que le serveur soit prêt
time.sleep(3)

try:
    # Faire une requête test
    response = requests.get("http://127.0.0.1:8000/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur: {e}")
finally:
    proc.terminate()
    proc.wait()
