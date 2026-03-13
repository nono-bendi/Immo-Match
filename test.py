import pandas as pd

df = pd.read_excel("Base_de_données_Clients_PP_122025.xlsx", sheet_name="Prospects")

def creer_prompt_client(client):
    """Transforme un client en description texte pour Claude"""
    
    parties = []
    
    if pd.notna(client["Nom "]):
        parties.append(f"Client: {client['Nom ']}")
    if pd.notna(client["Bien "]):
        parties.append(f"Type de bien recherché: {client['Bien ']}")
    if pd.notna(client["Villes"]):
        parties.append(f"Secteur: {client['Villes']}")
    if pd.notna(client["Budget max"]):
        parties.append(f"Budget maximum: {client['Budget max']}€")
    if pd.notna(client["Critères "]):
        parties.append(f"Critères: {client['Critères ']}")
    if pd.notna(client["Etat "]):
        parties.append(f"État souhaité: {client['Etat ']}")
    if pd.notna(client["Quartiers"]):
        parties.append(f"Quartiers: {client['Quartiers']}")
    
    return "\n".join(parties)

# Tester sur le premier client
premier_client = df.iloc[0]
print(creer_prompt_client(premier_client))
print("\n---\n")

# Tester sur un client plus complet (index 4)
client_complet = df.iloc[4]
print(creer_prompt_client(client_complet))