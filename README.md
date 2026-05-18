# 💱 FX Risk Platform (Beginner's Guide)

Welcome to the **FX Risk Platform**! This project is a web application built for financial institutions to monitor the risk of foreign exchange (FX) trades. 

If you are new to web development, don't worry! This guide is written specifically for beginners and will walk you through setting up the project on your computer step-by-step.

---

## 🛠️ What You Need to Install First

Before we start, make sure you have these free tools installed on your computer:

1. **[Node.js](https://nodejs.org/en/) (Version 18 or 20)**
   - *Why do I need this?* It allows your computer to run JavaScript outside of a web browser and is required to run our web server.
   - *How to check if you have it:* Open your terminal and type `node -v`.
2. **[Git](https://git-scm.com/)**
   - *Why do I need this?* It lets you download (clone) the project code from the internet.
   - *How to check if you have it:* Type `git --version` in your terminal.
3. **A Code Editor (like [VS Code](https://code.visualstudio.com/))**
   - *Why do I need this?* To open the project files and read the code easily.
4. **A [Supabase](https://supabase.com/) Account**
   - *Why do I need this?* Supabase provides our database (where data is saved) and handles user logins for free.

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Download the Code
Open your terminal (or Command Prompt) and run this command to download the code to your computer:
```bash
git clone <your-repository-url>
cd fx-risk-platform
```
*(Replace `<your-repository-url>` with the actual link to your Git repository).*

### Step 2: Install Project Files (Dependencies)
Our project relies on some external code libraries. To download them, run this command inside the project folder:
```bash
npm install
```

### Step 3: Set Up the Database Connection
The application needs to know how to connect to your Supabase database. We do this using a hidden file called `.env`.

1. Create your `.env` file by copying our template. Run this in your terminal:
   ```bash
   cp .env.example .env
   ```
   *(If you are on Windows Command Prompt, use `copy .env.example .env` instead).*

2. Open the new `.env` file in your code editor (like VS Code).
3. Go to your **Supabase Dashboard**, click on the **Settings ⚙️** icon, and then select **API**.
4. Copy your `Project URL` and `anon public` key, and paste them into your `.env` file so it looks like this:

   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
   
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

### Step 4: Create the Database Tables
Now we need to tell Supabase how to structure our data (creating tables for Users, Operations, Alerts, etc.).

1. Go to your **Supabase Dashboard**.
2. Click on the **SQL Editor** (the terminal icon on the left menu).
3. Click **New Query**.
4. In your code editor, open the file located at: `supabase/migrations/20260518073627_9eb4f19f-59c9-44eb-866d-e2ca57fd3af7.sql`.
5. Copy **all** the text from that file, paste it into the Supabase SQL Editor, and click the **Run** button.
6. Do the exact same thing for the second file: `supabase/migrations/20260518075414_4c6f60d1-637e-4e03-8be2-caa27102b9b7.sql`.

### Step 5: Add Demo Data (Optional but highly recommended)
Let's add some fake data so the application isn't empty when you open it.

1. In your code editor, open `supabase/seed_operations.sql`.
2. Copy all the text, paste it into the **Supabase SQL Editor**, and click **Run**.
3. Now, go to **Authentication -> Users** in your Supabase Dashboard. 
4. Click **Add User -> Create New User**.
5. Add these 5 users (Make sure to check "Auto Confirm User" and use the password `Demo!2026` for all of them):
   - `admin@fxrisk.demo`
   - `back@fxrisk.demo`
   - `manager@fxrisk.demo`
   - `risk@fxrisk.demo`
   - `front@fxrisk.demo`

### Step 6: Start the App!
You are all set! To start the website, run this command in your terminal:
```bash
npm run dev
```

Finally, open your web browser (like Chrome or Safari) and go to: **`http://localhost:5173`**

🎉 **Congratulations! You should now see the login page for the FX Risk Platform.** 

---

## 📚 How It Works (For Beginners)

If you are curious about what is happening under the hood:

* **Frontend (What you see):** We use **React** and **Vite** to build the website interface. **Tailwind CSS** makes it look pretty.
* **Backend (Where data lives):** We use **Supabase** (which uses a PostgreSQL database). 
* **The Magic (Triggers):** When a user creates a new "Operation", the database automatically runs a special script (called a Trigger) that calculates a "Risk Score". If the score is too high, it automatically creates an "Alert". This means the database is doing the heavy lifting to keep the application secure!
