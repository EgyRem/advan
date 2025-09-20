// users.js - Script to display user info for admin and member

async function loadUsers() {
    try {
        const response = await fetch('/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const users = await response.json();

        const adminContainer = document.getElementById('adminUsers');
        const memberContainer = document.getElementById('memberUsers');

        if (!adminContainer || !memberContainer) {
            console.error('Containers for admin or member users not found');
            return;
        }

        adminContainer.innerHTML = '';
        memberContainer.innerHTML = '';

        const currentUserRole = localStorage.getItem('role');

        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';

            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';

            const username = document.createElement('strong');
            username.textContent = user.username;

            const role = document.createElement('div');
            role.className = 'role';
            role.textContent = 'Role: ' + (user.role === 'admin' ? 'Admin' : 'Member');

            userInfo.appendChild(username);
            userInfo.appendChild(role);

            userDiv.appendChild(userInfo);

            // Add delete button if current user is admin and not deleting self or another admin
            if (currentUserRole === 'admin' && user.role !== 'admin') {
                const actions = document.createElement('div');
                actions.className = 'actions';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Hapus';
                deleteBtn.onclick = () => deleteUser(user.username);

                actions.appendChild(deleteBtn);
                userDiv.appendChild(actions);
            }

            if (user.role === 'admin') {
                adminContainer.appendChild(userDiv);
            } else {
                memberContainer.appendChild(userDiv);
            }
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

// Function to delete user
async function deleteUser(username) {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${username}?`)) {
        return;
    }
    try {
        const response = await fetch('/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
            loadUsers();
        }
    } catch (error) {
        alert('Gagal menghapus pengguna: ' + error.message);
    }
}
