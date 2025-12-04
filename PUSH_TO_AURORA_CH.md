# 🔐 Push to aurora-ch/dashboard2

## ❌ **Authentication Issue**

You're authenticated as `airhick` but need to push to `aurora-ch/dashboard2`. Options:

## 🎯 **Solution: Use a Personal Access Token**

### **Step 1: Create a GitHub Personal Access Token**

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Aurora Dashboard Push`
4. Select scopes:
   - ✅ **repo** (full control)
5. Click **"Generate token"**
6. **Copy the token** (you'll only see it once!)

### **Step 2: Push Using the Token**

Run these commands (replace YOUR_TOKEN with your actual token):

```bash
# Set remote with token
git remote set-url origin https://YOUR_TOKEN@github.com/aurora-ch/dashboard2.git

# Push to the repository
git push -u origin main
```

### **Alternative: Use GitHub CLI**

If you have `gh` CLI installed:

```bash
# Login as aurora-ch
gh auth login --scopes repo

# Push
git push -u origin main
```

## 🔄 **After Successful Push**

Update your Render service:

1. Go to: https://dashboard.render.com/web/srv-d3nm6o9gv73c73cf13o0/settings
2. Update **"Repository"** to: `https://github.com/aurora-ch/dashboard2`
3. Click **"Save changes"**
4. Deploy will automatically start

## 📝 **Quick Commands**

```bash
# Generate token at: https://github.com/settings/tokens
# Then run:
git remote set-url origin https://YOUR_TOKEN@github.com/aurora-ch/dashboard2.git
git push -u origin main
```

Your code is ready to push! Just need the token. 🔑
