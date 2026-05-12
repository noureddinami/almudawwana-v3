# 🚀 Push Code to GitHub

The code is ready to push to GitHub. I need your authentication to complete it.

---

## Choose One Method:

### **Method 1: GitHub Personal Access Token (Recommended)** ⭐

#### Step 1: Create Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Token name: "Al-Mudawwana Web"
4. Select scopes:
   - ☑️ `repo` (Full control of private repositories)
   - ☑️ `public_repo` (Access public repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

#### Step 2: Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `almudawwana-web`
3. Description: `Progressive Web App for Moroccan Legal Encyclopedia`
4. Choose: **Public**
5. Click "Create Repository"

#### Step 3: Push Code
```bash
cd almudawwana-web

# When prompted for password, paste your token (not your GitHub password!)
git push -u origin main

# You'll see:
# Enumerating objects...
# Counting objects...
# Writing objects...
# Creating pull request...
# ✅ Successfully pushed to GitHub!
```

---

### **Method 2: SSH Key (More Secure)** 

#### Step 1: Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "noureddin.amaigarou@gmail.com"
# Press Enter to accept defaults
# When asked for passphrase, either skip or create one
```

#### Step 2: Add SSH Key to GitHub
```bash
# Copy the key
cat ~/.ssh/id_ed25519.pub
```

Then:
1. Go to: https://github.com/settings/ssh/new
2. Paste the key
3. Click "Add SSH key"

#### Step 3: Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `almudawwana-web`
3. Description: `Progressive Web App for Moroccan Legal Encyclopedia`
4. Choose: **Public**
5. Click "Create Repository"

#### Step 4: Push Code
```bash
cd almudawwana-web

# First, update remote to use SSH instead of HTTPS
git remote set-url origin git@github.com:noureddinami/almudawwana-web.git

# Push code
git push -u origin main
```

---

### **Method 3: Web Credentials (Windows Credential Manager)**

If you've already logged into GitHub in Git Bash or GitHub Desktop:

1. Create GitHub Repository (same as above)
2. Run push command:
   ```bash
   cd almudawwana-web
   git push -u origin main
   ```
3. It may use stored credentials automatically

---

## What Happens After Push

✅ Repository created: `https://github.com/noureddinami/almudawwana-web`
✅ All code uploaded
✅ GitHub shows your commits
✅ Ready for Vercel deployment

---

## Next: Deploy to Vercel

After pushing to GitHub:

```
1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Search for and select: almudawwana-web
4. Add environment variable:
   NEXT_PUBLIC_API_URL=https://almodawana.dreamhosters.com/api/v1
5. Click "Deploy"
```

---

## Recommended Order

1. ⭐ **Create Personal Access Token** (easiest)
2. Create GitHub Repository
3. Push Code (using token for authentication)
4. Deploy to Vercel

---

Let me know which method you want to use, or provide your token and I'll handle the push!
