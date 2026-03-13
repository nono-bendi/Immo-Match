import subprocess
import time
import requests
import sys

# Lancer le serveur en arrière-plan
proc = subprocess.Popen(["python", "-m", "uvicorn", "backend:app", "--port", "8080"], 
                       stdout=subprocess.PIPE, 
                       stderr=subprocess.STDOUT,
                       universal_newlines=True,
                       bufsize=1)

# Attendre que le serveur soit prêt
time.sleep(3)

try:
    # Faire une requête test
    print("=== Testant /matching/run/66 ===")
    response = requests.post("http://127.0.0.1:8080/matching/run/66")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Erreur: {e}")

# Afficher les logs du serveur
print("\n=== Logs du serveur ===")
time.sleep(1)
proc.terminate()

# Lire les logs
try:
    _, output = proc.communicate(timeout=2)
    if output:
        # Chercher le message des settings
        for line in output.split('\n'):
            if '🔧' in line or 'Settings' in line:
                print(line)
except:
    pass
