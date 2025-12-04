# Setup Customer Authentication

## Quick Setup Guide

To enable authentication against the `customers` table, you need to create a database function in Supabase.

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `aurora` (or your project name)
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the SQL Function

1. Click **"New query"** button
2. Copy the entire contents of `supabase-auth-function.sql` file
3. Paste it into the SQL editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 3: Verify the Function

After running, you should see a success message. To test it, run this query:

```sql
SELECT * FROM authenticate_customer('1@glatt.ch', 'glatt');
```

If it returns the customer data, the function is working correctly!

### Step 4: Test Login

1. Go back to your application
2. Try logging in with credentials from your `customers` table
3. It should work now!

## Troubleshooting

### Error: "function authenticate_customer does not exist"
- **Solution**: Make sure you ran the SQL function in Step 2

### Error: "permission denied for function authenticate_customer"
- **Solution**: The GRANT statement in the SQL should fix this. Re-run the entire SQL file.

### Error: "Invalid email or password" (but credentials are correct)
- **Check**: Make sure the email and password in your `customers` table match exactly (case-sensitive for password)
- **Test**: Run the test query above to verify the function works

### Still having issues?
- Check the browser console (F12) for detailed error messages
- Verify your `customers` table has the `email` and `password` columns
- Make sure the email in the table matches what you're entering (check for extra spaces)

## What This Function Does

The `authenticate_customer` function:
- ✅ Can be called with the anon key (secure, no secrets exposed)
- ✅ Checks email and password against the `customers` table
- ✅ Returns customer data if credentials match
- ✅ Uses `SECURITY DEFINER` to bypass RLS policies safely
- ✅ Handles case-insensitive email matching

## Security Notes

- The function uses `SECURITY DEFINER` which runs with elevated privileges
- Only the function can access the password column (not direct queries)
- The password is never returned in the response
- The function is only accessible to authenticated/anon roles (as defined in GRANT)

