from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")

if api_key:
    print(f"Clé trouvée : {api_key[:20]}...")
else:
    print("Clé NON trouvée !")