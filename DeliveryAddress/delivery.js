(function () {
    const cartKey = 'biterush_cart';
    const deliveryKey = 'biterush_delivery';
    const savedTipKey = 'biterush_saved_tip';
    const money = value => `₱ ${Number(value).toFixed(2)}`;
    let state;
    try {
        state = JSON.parse(localStorage.getItem(deliveryKey) || '{}');
    } catch (error) {
        console.error('Unable to read delivery preferences:', error);
        state = {};
    }
    state = {
        adjustment: Number(state.adjustment) || 0,
        label: state.label || 'Standard',
        tip: Number(state.tip) || Number(localStorage.getItem(savedTipKey)) || 0,
        payment: state.payment || 'Cash',
        contactless: Boolean(state.contactless)
    };
    const readCart = () => {
        try {
            const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            console.error('Unable to read delivery cart:', error);
            return [];
        }
    };
    const getVoucherDiscount = subtotal => {
        const voucher = localStorage.getItem('biterush_voucher');
        if (voucher === 'voucher20' && subtotal >= 249) return Math.min(subtotal * .2, 500);
        if (voucher === 'voucher15' && subtotal >= 199) return Math.min(subtotal * .15, 600);
        return 0;
    };
    const save = () => localStorage.setItem(deliveryKey, JSON.stringify(state));
    const update = () => {
        const subtotal = readCart().reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
        const discount = getVoucherDiscount(subtotal);
        const delivery = subtotal ? Math.max(0, 4 + Number(state.adjustment || 0)) : 0;
        const service = subtotal ? 9 : 0;
        const tip = Math.max(0, Number(state.tip) || 0);
        const total = Math.max(0, subtotal - discount + delivery + service + tip);
        const deliveryLine = document.getElementById('deliveryFeeSummaryLine');
        if (deliveryLine) {
            const label = state.label === 'Schedule' ? 'Scheduled delivery' : `${state.label} delivery`;
            deliveryLine.querySelector('span:first-child').textContent = label;
            deliveryLine.querySelector('span:last-child').textContent = money(delivery);
        }
        document.querySelectorAll('.summary-line').forEach(line => {
            const label = line.querySelector('span:first-child')?.textContent.trim();
            const value = line.querySelector('span:last-child');
            if (!value) return;
            if (label === 'Subtotal') value.textContent = money(subtotal);
            if (label === 'Service fee') value.textContent = money(service);
        });
        const tipLine = document.getElementById('tipSummaryLine');
        tipLine.hidden = tip === 0;
        tipLine.querySelector('span:last-child').textContent = money(tip);
        document.querySelector('.total-price').textContent = money(total);
        document.querySelector('.payment-row > span:last-child').textContent = money(total);
        document.getElementById('paymentMethodLabel').textContent = state.payment;
    };
    document.querySelectorAll('.delivery-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.deliveryLabel === state.label);
        option.addEventListener('click', () => {
            state.adjustment = Number(option.dataset.deliveryAdjustment);
            state.label = option.dataset.deliveryLabel;
            document.querySelectorAll('.delivery-option').forEach(item => item.classList.remove('selected'));
            option.classList.add('selected');
            save();
            update();
        });
    });
    const tipInput = document.getElementById('tipAmount');
    tipInput.value = state.tip || '';
    tipInput.addEventListener('input', () => {
        state.tip = Math.max(0, Number(tipInput.value) || 0);
        if (document.getElementById('saveTip').checked) {
            localStorage.setItem(savedTipKey, String(state.tip));
        }
        save();
        update();
    });
    const saveTip = document.getElementById('saveTip');
    saveTip.checked = state.tip > 0 && Number(localStorage.getItem(savedTipKey)) === state.tip;
    saveTip.addEventListener('change', () => {
        if (saveTip.checked) {
            localStorage.setItem(savedTipKey, String(state.tip));
        } else {
            localStorage.removeItem(savedTipKey);
        }
    });
    document.querySelectorAll('.payment-choice').forEach(choice => {
        choice.classList.toggle('selected', choice.dataset.payment === state.payment);
        choice.addEventListener('click', () => {
            state.payment = choice.dataset.payment;
            document.querySelectorAll('.payment-choice').forEach(item => item.classList.remove('selected'));
            choice.classList.add('selected');
            save();
            update();
        });
    });
    const contactlessToggle = document.getElementById('contactlessToggle');
    contactlessToggle.checked = state.contactless;
    const applyContactless = () => {
        document.querySelectorAll('[data-payment="Cash"]').forEach(choice => {
            choice.disabled = state.contactless;
        });
        if (state.contactless) {
            state.payment = 'Online payment';
            document.querySelectorAll('.payment-choice').forEach(choice => {
                choice.classList.toggle('selected', choice.dataset.payment === state.payment);
            });
        }
        contactlessToggle.closest('.switch').classList.toggle('active', state.contactless);
        save();
        update();
    };
    contactlessToggle.addEventListener('change', () => {
        state.contactless = contactlessToggle.checked;
        applyContactless();
    });
    applyContactless();
    update();

    document.getElementById('deliveryBackButton')?.addEventListener('click', event => {
        event.preventDefault();
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        window.location.href = '../BiteRushHomePage/index.html';
    });
}());
