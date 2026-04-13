# 🇮🇷 Deployment Guide (No Docker / No Git / Iran-Optimized)

This guide is specifically designed for Iranian VPS environments where both Docker and Git are restricted. We will use `SCP` to transfer files directly from your computer to the server.

---

## 🏗️ Step 1: Prepare & Upload (From your Local Computer)
Since the VPS cannot access Git, you must archive and upload the code from your local development machine.

1. **Archive the project** (Run this on your computer in the `lichess` folder):
   ```bash
   tar --exclude='node_modules' --exclude='.git' --exclude='venv' -czf lichess.tar.gz .
   ```

2. **Upload to VPS**:
   ```bash
   scp lichess.tar.gz root@your_vps_ip:/root/
   ```

---

## 🛠️ Step 2: Setup the Server (On the VPS)
Login to your VPS and follow these steps:

1. **Extract the project**:
   ```bash
   cd /root
   tar -xzf lichess.tar.gz
   ```

2. **Install System Dependencies**:
   ```bash
   sudo apt update
   sudo apt install -y python3-pip python3-venv nginx nodejs npm
   ```

---

## 📂 Step 3: Setup the Backend
1. **Enter directory and setup venv**:
   ```bash
   cd /root/backend
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies** (Using domestic mirrors):
   ```bash
   pip install -r requirements.txt -i https://mirror-pypi.runflare.com/simple
   ```

3. **Configure Systemd**:
   Create the file: `sudo nano /etc/systemd/system/lichess-backend.service`
   ```ini
   [Unit]
   Description=Lichess Persian Backend
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/root/backend
   ExecStart=/root/backend/venv/bin/python main.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   *Enable and Start:*
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable lichess-backend
   sudo systemctl start lichess-backend
   ```

---

## 🏗️ Step 4: Build the Frontend
1. **Enter directory**:
   ```bash
   cd /root/frontend
   ```

2. **Install and build** (Using domestic mirrors):
   ```bash
   npm install --registry=https://registry.npmmirror.com
   npm run build
   ```

---

## 🌐 Step 5: Configure Nginx
Create the configuration: `sudo nano /etc/nginx/sites-available/lichess`

```nginx
server {
    listen 80;
    server_name _; # Or your domain

    root /root/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API and Socket.IO
    location ~ ^/(api|socket.io) {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

*Activate and Restart:*
```bash
sudo ln -s /etc/nginx/sites-available/lichess /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📊 Maintenance Commands
- **Check Backend Logs**: `journalctl -u lichess-backend -f`
- **Restart Backend**: `systemctl restart lichess-backend`
- **Update Code**: Re-archive, upload via SCP, extract, and restart the services.
