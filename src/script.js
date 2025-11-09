const API_BASE_URL = 'http://localhost:5000';
let allContacts = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    loadContacts();

    // 事件监听器
    document.getElementById('showAddForm').addEventListener('click', showAddForm);
    document.getElementById('cancelAdd').addEventListener('click', hideAddForm);
    document.getElementById('contactForm').addEventListener('submit', addContact);
    document.getElementById('editForm').addEventListener('submit', updateContact);
    document.getElementById('refreshBtn').addEventListener('click', loadContacts);
    document.getElementById('searchInput').addEventListener('input', filterContacts);
    document.querySelector('.close').addEventListener('click', closeModal);

    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// 显示加载动画
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

// 隐藏加载动画
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// 显示添加表单
function showAddForm() {
    document.getElementById('addFormSection').classList.remove('hidden');
    document.getElementById('name').focus();
}

// 隐藏添加表单
function hideAddForm() {
    document.getElementById('addFormSection').classList.add('hidden');
    document.getElementById('contactForm').reset();
}

// 加载联系人列表
async function loadContacts() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/contacts`);
        if (!response.ok) throw new Error('网络响应不正常');

        allContacts = await response.json();
        displayContacts(allContacts);
    } catch (error) {
        console.error('加载联系人失败:', error);
        showError('加载联系人失败，请检查网络连接');
    } finally {
        hideLoading();
    }
}

// 显示联系人列表（表格形式）
function displayContacts(contacts) {
    const tableBody = document.getElementById('contactsTableBody');
    const emptyState = document.getElementById('emptyState');

    if (contacts.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    tableBody.innerHTML = contacts.map(contact => `
        <tr>
            <td>
                <div class="contact-name">
                    <i class="fas fa-user-circle"></i>
                    ${contact.name}
                </div>
            </td>
            <td>
                <div class="contact-phone">
                    <i class="fas fa-phone"></i>
                    ${contact.phone}
                </div>
            </td>
            <td>
                <div class="contact-email">
                    ${contact.email ? `<i class="fas fa-envelope"></i> ${contact.email}` : '<span class="text-muted">未填写</span>'}
                </div>
            </td>
            <td>
                <div class="contact-address">
                    ${contact.address ? `<i class="fas fa-map-marker-alt"></i> ${contact.address}` : '<span class="text-muted">未填写</span>'}
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-primary" onclick="openEditModal(${contact.id})">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn btn-danger" onclick="deleteContact(${contact.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 搜索过滤联系人
function filterContacts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        displayContacts(allContacts);
        return;
    }

    const filteredContacts = allContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.phone.toLowerCase().includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
        (contact.address && contact.address.toLowerCase().includes(searchTerm))
    );

    displayContacts(filteredContacts);
}

// 添加联系人
async function addContact(event) {
    event.preventDefault();

    const contactData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim()
    };

    // 简单验证
    if (!contactData.name || !contactData.phone) {
        showError('姓名和电话是必填项');
        return;
    }

    if (!isValidPhone(contactData.phone)) {
        showError('请输入有效的电话号码');
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData)
        });

        if (!response.ok) throw new Error('添加失败');

        const newContact = await response.json();
        hideAddForm();
        loadContacts(); // 重新加载列表
        showSuccess('联系人添加成功！');

    } catch (error) {
        console.error('添加联系人失败:', error);
        showError('添加联系人失败，请重试');
    } finally {
        hideLoading();
    }
}

// 打开编辑模态框
async function openEditModal(id) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/contacts`);
        if (!response.ok) throw new Error('加载联系人失败');

        const contacts = await response.json();
        const contact = contacts.find(c => c.id === id);

        if (contact) {
            document.getElementById('editId').value = contact.id;
            document.getElementById('editName').value = contact.name;
            document.getElementById('editPhone').value = contact.phone;
            document.getElementById('editEmail').value = contact.email || '';
            document.getElementById('editAddress').value = contact.address || '';

            document.getElementById('editModal').style.display = 'block';
        }
    } catch (error) {
        console.error('打开编辑模态框失败:', error);
        showError('加载联系人信息失败');
    } finally {
        hideLoading();
    }
}

// 关闭模态框
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 更新联系人
async function updateContact(event) {
    event.preventDefault();

    const id = document.getElementById('editId').value;
    const contactData = {
        name: document.getElementById('editName').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        address: document.getElementById('editAddress').value.trim()
    };

    // 验证
    if (!contactData.name || !contactData.phone) {
        showError('姓名和电话是必填项');
        return;
    }

    if (!isValidPhone(contactData.phone)) {
        showError('请输入有效的电话号码');
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData)
        });

        if (!response.ok) throw new Error('更新失败');

        closeModal();
        loadContacts(); // 重新加载列表
        showSuccess('联系人更新成功！');

    } catch (error) {
        console.error('更新联系人失败:', error);
        showError('更新联系人失败，请重试');
    } finally {
        hideLoading();
    }
}

// 删除联系人
async function deleteContact(id) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    if (confirm(`确定要删除联系人 "${contact.name}" 吗？此操作不可撤销。`)) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('删除失败');

            loadContacts(); // 重新加载列表
            showSuccess('联系人删除成功！');

        } catch (error) {
            console.error('删除联系人失败:', error);
            showError('删除联系人失败，请重试');
        } finally {
            hideLoading();
        }
    }
}

// 验证电话号码格式
function isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$|^\d{3,4}-\d{7,8}$/;
    return phoneRegex.test(phone);
}

// 显示成功消息
function showSuccess(message) {
    showNotification(message, 'success');
}

// 显示错误消息
function showError(message) {
    showNotification(message, 'error');
}

// 显示通知
function showNotification(message, type) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
    `;

    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);