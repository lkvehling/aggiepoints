<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aggie Points Login</title>
  <script src="https://unpkg.com/@supabase/supabase-js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 50px; text-align: center; }
    input { padding: 10px; margin: 5px; width: 250px; }
    button { padding: 10px 20px; cursor: pointer; }
    .msg { margin-top: 10px; color: red; }
  </style>
</head>
<body>

  <h1>Aggie Points Login</h1>

  <div>
    <input type="email" id="email" placeholder="Email" required><br>
    <input type="password" id="password" placeholder="Password" required><br>
    <button onclick="login()">Log In</button>
    <p id="message" class="msg"></p>
  </div>

  <script>
    // -------------------------------
    // 1️⃣ Initialize Supabase
    // -------------------------------
    const SUPABASE_URL = "https://gtnptxnkminqmjnnfxie.supabase.co";
    const SUPABASE_KEY = "YOUR_ANON_KEY_HERE"; // replace with your anon key
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // -------------------------------
    // 2️⃣ Login function
    // -------------------------------
    async function login() {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const msgEl = document.getElementById("message");
      msgEl.textContent = "";

      if (!email || !password) {
        msgEl.textContent = "Please enter email and password.";
        return;
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        msgEl.textContent = "❌ " + error.message;
      } else {
        // redirect to main Aggie Points page
        window.location.href = "index.html";
      }
    }

    // -------------------------------
    // 3️⃣ Auto-redirect if already logged in
    // -------------------------------
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = "index.html";
      }
    });
  </script>

</body>
</html>
