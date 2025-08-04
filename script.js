/**
 * 购物清单计算器
 * 支持固定价格和价格区间的智能购物清单管理系统
 */

class ShoppingCalculator {
    constructor() {
        this.items = [];
        this.nextId = 1;
        this.editingItemId = null;
        this.priceMode = 'fixed'; // 'fixed' 或 'range'
        
        this.initializeElements();
        this.bindEvents();
        this.loadFromStorage();
        this.updateDisplay();
    }

    initializeElements() {
        this.addForm = document.getElementById('add-item-form');
        this.itemNameInput = document.getElementById('item-name');
        this.itemNoteInput = document.getElementById('item-note');
        this.fixedPriceInput = document.getElementById('fixed-price');
        this.minPriceInput = document.getElementById('min-price');
        this.maxPriceInput = document.getElementById('max-price');
        this.shoppingList = document.getElementById('shopping-list');
        this.totalPriceDisplay = document.getElementById('total-price-display');
        this.notification = document.getElementById('notification');
        this.exportBtn = document.getElementById('export-btn');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        
        // 价格模式相关元素
        this.fixedPriceBtn = document.getElementById('fixed-price-btn');
        this.rangePriceBtn = document.getElementById('range-price-btn');
        this.fixedPriceGroup = document.getElementById('fixed-price-group');
        this.rangePriceGroup = document.getElementById('range-price-group');
    }

    bindEvents() {
        this.addForm.addEventListener('submit', (e) => this.handleAddItem(e));
        this.exportBtn.addEventListener('click', () => this.exportData());
        this.clearAllBtn.addEventListener('click', () => this.clearAllData());
        
        // 价格模式切换事件
        this.fixedPriceBtn.addEventListener('click', () => this.switchPriceMode('fixed'));
        this.rangePriceBtn.addEventListener('click', () => this.switchPriceMode('range'));
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.exportData();
            } else if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
                e.preventDefault();
                this.clearAllData();
            } else if (e.key === 'Tab' && e.ctrlKey) {
                e.preventDefault();
                this.switchPriceMode(this.priceMode === 'fixed' ? 'range' : 'fixed');
            }
        });
    }

    switchPriceMode(mode) {
        this.priceMode = mode;
        
        // 更新按钮状态
        this.fixedPriceBtn.classList.toggle('active', mode === 'fixed');
        this.rangePriceBtn.classList.toggle('active', mode === 'range');
        
        // 更新输入组显示和required属性
        this.fixedPriceGroup.classList.toggle('active', mode === 'fixed');
        this.rangePriceGroup.classList.toggle('active', mode === 'range');
        
        // 动态设置required属性，避免隐藏字段的验证问题
        if (mode === 'fixed') {
            this.fixedPriceInput.required = true;
            this.minPriceInput.required = false;
            this.maxPriceInput.required = false;
        } else {
            this.fixedPriceInput.required = false;
            this.minPriceInput.required = true;
            this.maxPriceInput.required = true;
        }
        
        // 清空输入值
        this.clearPriceInputs();
        
        // 焦点管理
        setTimeout(() => {
            if (mode === 'fixed') {
                this.fixedPriceInput.focus();
            } else {
                this.minPriceInput.focus();
            }
        }, 100);
    }

    clearPriceInputs() {
        this.fixedPriceInput.value = '';
        this.minPriceInput.value = '';
        this.maxPriceInput.value = '';
    }

    handleAddItem(e) {
        e.preventDefault();
        
        const name = this.itemNameInput.value.trim();
        const note = this.itemNoteInput.value.trim();
        let minPrice, maxPrice;
        
        if (this.priceMode === 'fixed') {
            const fixedPrice = parseFloat(this.fixedPriceInput.value);
            if (!this.validateFixedPrice(name, fixedPrice)) {
                return;
            }
            minPrice = maxPrice = fixedPrice;
        } else {
            minPrice = parseFloat(this.minPriceInput.value);
            maxPrice = parseFloat(this.maxPriceInput.value);
            if (!this.validateRangePrice(name, minPrice, maxPrice)) {
                return;
            }
        }
        
        const item = this.createItem(name, minPrice, maxPrice, this.priceMode, note);
        this.addItem(item);
        this.clearForm();
        this.updateDisplay();
        this.saveToStorage();
        this.showNotification(`商品"${name}"已添加到购物清单`, 'success');
    }

    validateFixedPrice(name, price) {
        if (!name) {
            this.showNotification('请输入商品名称', 'error');
            return false;
        }
        
        if (isNaN(price) || price < 0) {
            this.showNotification('请输入有效的价格', 'error');
            return false;
        }
        
        return true;
    }

    validateRangePrice(name, minPrice, maxPrice) {
        if (!name) {
            this.showNotification('请输入商品名称', 'error');
            return false;
        }
        
        if (isNaN(minPrice) || minPrice < 0) {
            this.showNotification('请输入有效的最低价格', 'error');
            return false;
        }
        
        if (isNaN(maxPrice) || maxPrice < 0) {
            this.showNotification('请输入有效的最高价格', 'error');
            return false;
        }
        
        if (minPrice > maxPrice) {
            this.showNotification('最低价格不能大于最高价格', 'error');
            return false;
        }
        
        return true;
    }

    // 保持向后兼容
    validateItem(name, minPrice, maxPrice) {
        return this.validateRangePrice(name, minPrice, maxPrice);
    }

    createItem(name, minPrice, maxPrice, priceMode = 'range', note = '') {
        return {
            id: this.nextId++,
            name: name,
            note: note,
            minPrice: minPrice,
            maxPrice: maxPrice,
            priceMode: priceMode,
            createdAt: new Date()
        };
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items.splice(index, 1);
            this.updateDisplay();
            this.saveToStorage();
        }
    }

    editItem(id) {
        if (this.editingItemId === id) {
            return;
        }
        
        this.cancelEdit();
        this.editingItemId = id;
        this.updateDisplay();
    }

    saveEdit(id, newName, newMinPrice, newMaxPrice, newNote = '') {
        if (!this.validateRangePrice(newName, newMinPrice, newMaxPrice)) {
            return false;
        }
        
        const item = this.items.find(item => item.id === id);
        if (item) {
            const oldName = item.name;
            item.name = newName;
            item.note = newNote;
            item.minPrice = newMinPrice;
            item.maxPrice = newMaxPrice;
            item.priceMode = newMinPrice === newMaxPrice ? 'fixed' : 'range';
            
            this.editingItemId = null;
            this.updateDisplay();
            this.saveToStorage();
            this.showNotification(`商品"${oldName}"已更新`, 'success');
            return true;
        }
        return false;
    }

    cancelEdit() {
        this.editingItemId = null;
        this.updateDisplay();
    }

    calculateTotalPrice() {
        if (this.items.length === 0) {
            return { min: 0, max: 0 };
        }
        
        const totalMin = this.items.reduce((sum, item) => sum + item.minPrice, 0);
        const totalMax = this.items.reduce((sum, item) => sum + item.maxPrice, 0);
        
        return { min: totalMin, max: totalMax };
    }

    formatPrice(price) {
        return price.toFixed(2);
    }

    formatPriceRange(minPrice, maxPrice) {
        if (minPrice === maxPrice) {
            return `¥${this.formatPrice(minPrice)}`;
        }
        return `¥${this.formatPrice(minPrice)} - ¥${this.formatPrice(maxPrice)}`;
    }

    clearForm() {
        this.itemNameInput.value = '';
        this.itemNoteInput.value = '';
        this.clearPriceInputs();
        this.itemNameInput.focus();
    }

    updateDisplay() {
        this.updateShoppingList();
        this.updateTotalPrice();
    }

    updateShoppingList() {
        if (this.items.length === 0) {
            this.shoppingList.innerHTML = `
                <div class="empty-state">
                    <p>购物清单为空，快添加你的第一个商品吧！</p>
                </div>
            `;
            return;
        }
        
        this.shoppingList.innerHTML = this.items.map(item => 
            this.createItemHTML(item)
        ).join('');
        
        this.bindItemEvents();
    }

    createItemHTML(item) {
        const isEditing = this.editingItemId === item.id;
        const priceDisplay = this.formatPriceRange(item.minPrice, item.maxPrice);
        const priceIcon = item.priceMode === 'fixed' ? 
            '<i class="fas fa-tag text-primary"></i>' : 
            '<i class="fas fa-chart-line text-success"></i>';
        
        const noteDisplay = item.note ? `
            <div class="item-note">
                <i class="fas fa-sticky-note text-muted"></i>
                <span>${this.escapeHtml(item.note)}</span>
            </div>
        ` : '';
        
        return `
            <div class="item ${isEditing ? 'editing' : ''}" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-header">
                        <div class="item-name">${this.escapeHtml(item.name)}</div>
                        <div class="item-price-badge">
                            ${priceIcon}
                            <span class="price-text">${priceDisplay}</span>
                        </div>
                    </div>
                    ${noteDisplay}
                    <div class="item-meta">
                        <small class="text-muted">
                            ${item.priceMode === 'fixed' ? '固定价格' : '价格区间'} • 
                            ${new Date(item.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                </div>
                
                <div class="edit-form">
                    <input type="text" class="edit-name" value="${this.escapeHtml(item.name)}" placeholder="商品名称">
                    <textarea class="edit-note" placeholder="商品注释">${this.escapeHtml(item.note || '')}</textarea>
                    <div class="edit-form-row">
                        <div class="price-inputs">
                            <input type="number" class="edit-min-price" value="${item.minPrice}" step="0.01" min="0" placeholder="最低价格">
                            <input type="number" class="edit-max-price" value="${item.maxPrice}" step="0.01" min="0" placeholder="最高价格">
                        </div>
                        <div class="action-buttons">
                            <button type="button" class="save-btn">
                                <i class="fas fa-check"></i> 保存
                            </button>
                            <button type="button" class="cancel-btn">
                                <i class="fas fa-times"></i> 取消
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="item-actions">
                    <button type="button" class="edit-btn" title="编辑商品">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button type="button" class="delete-btn" title="删除商品">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `;
    }

    bindItemEvents() {
        this.shoppingList.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.item');
            if (!itemElement) return;
            
            const itemId = parseInt(itemElement.dataset.id);
            
            if (e.target.classList.contains('delete-btn')) {
                this.confirmDelete(itemId);
            } else if (e.target.classList.contains('edit-btn')) {
                this.editItem(itemId);
            } else if (e.target.classList.contains('save-btn')) {
                this.handleSaveEdit(itemId, itemElement);
            } else if (e.target.classList.contains('cancel-btn')) {
                this.cancelEdit();
            }
        });
        
        this.shoppingList.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('edit-name')) {
                const itemElement = e.target.closest('.item');
                const itemId = parseInt(itemElement.dataset.id);
                this.handleSaveEdit(itemId, itemElement);
            } else if (e.key === 'Escape') {
                this.cancelEdit();
            }
        });
    }

    handleSaveEdit(itemId, itemElement) {
        const nameInput = itemElement.querySelector('.edit-name');
        const noteInput = itemElement.querySelector('.edit-note');
        const minPriceInput = itemElement.querySelector('.edit-min-price');
        const maxPriceInput = itemElement.querySelector('.edit-max-price');
        
        const newName = nameInput.value.trim();
        const newNote = noteInput.value.trim();
        const newMinPrice = parseFloat(minPriceInput.value);
        const newMaxPrice = parseFloat(maxPriceInput.value);
        
        this.saveEdit(itemId, newName, newMinPrice, newMaxPrice, newNote);
    }

    confirmDelete(itemId) {
        const item = this.items.find(item => item.id === itemId);
        if (item && confirm(`确定要删除"${item.name}"吗？`)) {
            this.removeItem(itemId);
            this.showNotification(`商品"${item.name}"已从购物清单中删除`, 'info');
        }
    }

    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 4000);
    }

    updateTotalPrice() {
        const total = this.calculateTotalPrice();
        const totalDisplay = this.formatPriceRange(total.min, total.max);
        this.totalPriceDisplay.textContent = totalDisplay;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToStorage() {
        try {
            const data = {
                items: this.items,
                nextId: this.nextId,
                priceMode: this.priceMode
            };
            localStorage.setItem('shopping-calculator-data', JSON.stringify(data));
        } catch (error) {
            console.error('保存数据失败:', error);
            this.showNotification('保存数据失败，请检查浏览器存储权限', 'error');
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('shopping-calculator-data');
            if (data) {
                const parsed = JSON.parse(data);
                this.items = parsed.items || [];
                this.nextId = parsed.nextId || 1;
                this.priceMode = parsed.priceMode || 'fixed';
                
                this.items.forEach(item => {
                    if (item.createdAt) {
                        item.createdAt = new Date(item.createdAt);
                    }
                });
                
                this.switchPriceMode(this.priceMode);
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.items = [];
            this.nextId = 1;
            this.priceMode = 'fixed';
            this.switchPriceMode('fixed');
        }
    }

    clearAllData() {
        if (this.items.length === 0) {
            this.showNotification('购物清单已经是空的', 'info');
            return;
        }
        
        if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
            const itemCount = this.items.length;
            this.items = [];
            this.nextId = 1;
            this.editingItemId = null;
            this.updateDisplay();
            this.saveToStorage();
            this.showNotification(`已清空 ${itemCount} 个商品`, 'success');
        }
    }

    exportData() {
        if (this.items.length === 0) {
            this.showNotification('购物清单为空，无法导出', 'error');
            return;
        }
        
        try {
            const data = {
                items: this.items,
                exportTime: new Date().toISOString(),
                totalPrice: this.calculateTotalPrice(),
                summary: {
                    itemCount: this.items.length,
                    totalMinPrice: this.calculateTotalPrice().min,
                    totalMaxPrice: this.calculateTotalPrice().max
                }
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `shopping-list-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification(`购物清单已导出 (${this.items.length} 个商品)`, 'success');
        } catch (error) {
            console.error('导出失败:', error);
            this.showNotification('导出失败，请重试', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.shoppingCalculator = new ShoppingCalculator();
});