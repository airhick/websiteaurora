import requests
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "https://oknakvgnwxlkvhwmocno.supabase.co"

# Service Role Key (Preserved from your previous message)
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbmFrdmdud3hsa3Zod21vY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5MTk4OSwiZXhwIjoyMDc2MjY3OTg5fQ._1QAWNGLWLAaLqZushwKgwIhPc6Si6EnY6QNbZ5Ymag"

VAPI_PRIVATE_KEY = "9d09c2ec-4223-41af-a1c9-8bb097b8e5ef"

# --- INIT CLIENT ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_config_for_customer(customer_id):
    print(f"\n--- 1. Searching for Customer ID: {customer_id} ---")
    
    try:
        # Fetch ONLY the 'agents' column where the 'id' matches the input
        response = supabase.table('customers').select('agents').eq('id', customer_id).execute()
        rows = response.data
    except Exception as e:
        print(f"❌ Error fetching from Supabase: {e}")
        return

    # Check if the customer exists
    if not rows:
        print(f"❌ No customer found with ID: {customer_id}")
        return

    # Since we queried by ID, we expect exactly one row
    row = rows[0]
    raw_agents = row.get('agents')

    if not raw_agents:
        print("✅ Customer found, but 'agents' column is empty.")
        return

    # SPLIT the string by semicolon to get individual IDs
    agent_ids = raw_agents.split(';')
    
    print(f"✅ Found {len(agent_ids)} assistant(s) linked to this customer.\n")

    # --- 2. Iterate and Fetch from Vapi ---
    for agent_id in agent_ids:
        clean_id = agent_id.strip() # Remove any accidental spaces
        
        if not clean_id: 
            continue

        print(f"   -> Fetching Vapi config for: {clean_id} ...")

        try:
            vapi_url = f"https://api.vapi.ai/assistant/{clean_id}"
            headers = {
                "Authorization": f"Bearer {VAPI_PRIVATE_KEY}",
                "Content-Type": "application/json"
            }
            
            vapi_response = requests.get(vapi_url, headers=headers)
            
            if vapi_response.status_code == 200:
                config = vapi_response.json()
                
                # Print specific details
                name = config.get('name', 'Unnamed')
                model = config.get('model', {}).get('model', 'Unknown Model')
                first_msg = config.get('firstMessage', 'No first message set')[:50] # truncated
                
                print(f"      ✅ Success!")
                print(f"         Name: {name}")
                print(f"         Model: {model}")
                print(f"         First Message: {first_msg}...")
                
            else:
                print(f"      ❌ Failed to fetch Vapi config (Status {vapi_response.status_code}): {vapi_response.text}")
                
        except Exception as e:
            print(f"      ❌ Network Error: {e}")
    
    print("-" * 40)

if __name__ == "__main__":
    # Ask user for the ID at runtime
    target_id = input("Enter the Customer ID (UUID) to check: ").strip()
    
    if target_id:
        fetch_config_for_customer(target_id)
    else:
        print("❌ No ID entered. Exiting.")