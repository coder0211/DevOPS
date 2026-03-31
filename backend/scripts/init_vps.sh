#!/bin/bash

# DevOPS VPS Initialization Script
# Based on user-provided commands

set -e

NEW_USER="deployer"
SSH_PORT=2288

echo "--- STEP 1: Updating System ---"
apt update && apt upgrade -y

echo "--- STEP 2: Creating User and Sudo config ---"
if id "$NEW_USER" &>/dev/null; then
    echo "User $NEW_USER already exists"
else
    # Simple adduser without password interaction for scripts
    useradd -m -s /bin/bash "$NEW_USER"
    usermod -aG sudo "$NEW_USER"
    echo "$NEW_USER ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deployer
fi

echo "--- STEP 3: Transferring SSH Keys ---"
mkdir -p /home/$NEW_USER/.ssh
cp /root/.ssh/authorized_keys /home/$NEW_USER/.ssh/
chown -R $NEW_USER:$NEW_USER /home/$NEW_USER/.ssh
chmod 700 /home/$NEW_USER/.ssh
chmod 600 /home/$NEW_USER/.ssh/authorized_keys

echo "--- STEP 4: SSH Hardening ---"
# Port change
sed -i "s/#Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
sed -i "s/Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
# Security
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

echo "--- STEP 5: Firewall Setup (UFW) ---"
ufw allow $SSH_PORT/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "--- STEP 6: Swap Space Configuration (4GB) ---"
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | tee -a /etc/sysctl.conf
    sysctl -p
fi

echo "--- STEP 7: Docker & Docker Compose Installation ---"
apt install ca-certificates curl gnupg -y
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
usermod -aG docker $NEW_USER

echo "--- STEP 8: Docker Log Limits ---"
cat <<EOF | tee /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
EOF

echo "--- STEP 9: System Cleanup Script ---"
mkdir -p /home/$NEW_USER/scripts
cat <<EOF | tee /home/$NEW_USER/scripts/cleanup.sh
#!/bin/bash
docker system prune -af --volumes
sudo journalctl --vacuum-time=3d
EOF
chmod +x /home/$NEW_USER/scripts/cleanup.sh

# Cronjob (Avoid duplicates)
(crontab -l 2>/dev/null | grep -v "/home/$NEW_USER/scripts/cleanup.sh"; echo "0 3 * * 0 /home/$NEW_USER/scripts/cleanup.sh > /dev/null 2>&1") | crontab -

echo "--- STEP 10: Restarting Services ---"
systemctl restart docker
systemctl restart ssh

echo "--- INITIALIZATION COMPLETED SUCCESSFULY ---"
echo "You can now login with: ssh -p $SSH_PORT $NEW_USER@your_ip"
