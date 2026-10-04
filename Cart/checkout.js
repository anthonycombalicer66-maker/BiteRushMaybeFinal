    (function () {
        const key = 'biterush_cart';
        const voucherKey = 'biterush_voucher';
        const vouchers = {
            voucher20: { rate: 0.20, cap: 500, minimum: 249 },
            voucher15: { rate: 0.15, cap: 600, minimum: 199 }
        };
        const read = () => {
            try {
                const value = JSON.parse(localStorage.getItem(key) || '[]');
                return Array.isArray(value)
                    ? value
                        .filter(item => item && item.title && item.img)
                        .map(item => ({
                            ...item,
                            price: Number(item.price),
                            quantity: Number(item.quantity)
                        }))
                        .filter(item => Number.isFinite(item.price) && item.price >= 0
                            && Number.isSafeInteger(item.quantity) && item.quantity > 0)
                    : [];
            } catch (error) {
                console.error('Unable to read checkout cart:', error);
                return [];
            }
        };
        const money = value => `₱ ${Number(value).toFixed(2)}`;
        const setText = (selector, value) => {
            document.querySelectorAll(selector).forEach(element => {
                element.textContent = value;
            });
        };
        const update = () => {
            const storedCart = read();
            const itemCard = document.querySelector('.item-card');
            const currentTitle = itemCard?.querySelector('.item-title')?.textContent.trim();
            const currentPrice = Number(
                itemCard?.querySelector('.item-price')?.textContent.replace(/[^\d.]/g, '')
            );
            const current = storedCart.find(item => item.key === window.location.pathname
                || item.link === window.location.pathname);
            const cart = storedCart.length || !itemCard || !Number.isFinite(currentPrice)
                ? storedCart
                : [{
                    title: currentTitle,
                    price: currentPrice,
                    quantity: 1
                }];
            const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
            const selectedVoucher = vouchers[localStorage.getItem(voucherKey)];
            const discount = selectedVoucher && subtotal >= selectedVoucher.minimum
                ? Math.min(subtotal * selectedVoucher.rate, selectedVoucher.cap)
                : 0;
            const delivery = subtotal ? 4 : 0;
            const service = subtotal ? 9 : 0;
            const total = Math.max(0, subtotal - discount + delivery + service);
            if (document.querySelector('.checkout-container')) {
            if (current) {
                const quantity = itemCard.querySelector('.qty-count');
                if (quantity) quantity.textContent = current.quantity;
            }
            const summaryCard = document.querySelector('.summary-card');
            if (summaryCard) {
                let cartLines = summaryCard.querySelector('.checkout-cart-lines');
                if (!cartLines) {
                    cartLines = document.createElement('div');
                    cartLines.className = 'checkout-cart-lines';
                    summaryCard.querySelector('.summary-header')?.after(cartLines);
                }
                cartLines.replaceChildren();
                if (cart.length) {
                    cart.forEach(item => {
                        const row = document.createElement('div');
                        row.className = 'fee-row checkout-cart-line';
                        const info = document.createElement('div');
                        info.className = 'fee-info';
                        const title = document.createElement('span');
                        title.className = 'fee-title';
                        title.textContent = `${item.quantity} × ${item.title}`;
                        const unitPrice = document.createElement('span');
                        unitPrice.className = 'fee-subtext';
                        unitPrice.textContent = `${money(item.price)} each`;
                        const lineTotal = document.createElement('span');
                        lineTotal.className = 'fee-amount';
                        lineTotal.textContent = money(item.price * item.quantity);
                        info.append(title, unitPrice);
                        row.append(info, lineTotal);
                        cartLines.appendChild(row);
                    });
                } else {
                    const empty = document.createElement('p');
                    empty.className = 'checkout-cart-empty';
                    empty.textContent = 'Your cart is empty.';
                    cartLines.appendChild(empty);
                }
            }
            setText('.header-amount', money(subtotal));
            setText('.total-amount', money(total));
            const deliveryRows = [...document.querySelectorAll('.summary-card .fee-row')].filter(row => {
                const title = row.querySelector('.fee-title')?.textContent.trim().toLowerCase();
                return title === 'standard delivery' || title === 'delivery fee';
            });
            deliveryRows.slice(0, -1).forEach(row => {
                row.hidden = true;
            });
            const feeAmounts = document.querySelectorAll('.summary-card .fee-amount');
            feeAmounts.forEach(amount => {
                const title = amount.closest('.fee-row')?.querySelector('.fee-title')?.textContent.trim().toLowerCase();
                if (title === 'standard delivery' || title === 'delivery fee') amount.textContent = money(delivery);
                if (title === 'service fee') amount.textContent = money(service);
            });
            const discountElement = document.querySelector('.voucher-discount-amount');
            if (discountElement) {
                discountElement.textContent = `-${money(discount)}`;
                discountElement.closest('.voucher-discount-row').hidden = discount === 0;
            }
            }
            if (document.querySelector('.page')) {
            const summary = document.querySelector('.page .summary-item');
            if (summary) {
                summary.replaceChildren();
                if (cart.length) {
                    cart.forEach(item => {
                        const row = document.createElement('div');
                        row.className = 'cart-summary-line';
                        const label = document.createElement('span');
                        label.textContent = `${item.quantity} × ${item.title} (${money(item.price)} each)`;
                        const lineTotal = document.createElement('strong');
                        lineTotal.textContent = money(item.price * item.quantity);
                        row.append(label, lineTotal);
                        summary.appendChild(row);
                    });
                } else {
                    const empty = document.createElement('strong');
                    empty.textContent = 'Your cart is empty.';
                    summary.appendChild(empty);
                }
            }
            const discountLine = document.querySelector('.page .voucher-discount-line');
            if (discountLine) {
                discountLine.hidden = discount === 0;
                discountLine.querySelector('span:last-child').textContent = `-${money(discount)}`;
            }
            const lines = document.querySelectorAll('.page .summary-line:not(.voucher-discount-line) span:last-child');
            if (lines.length >= 3) {
                lines[0].textContent = money(subtotal);
                lines[1].textContent = money(delivery);
                lines[2].textContent = money(service);
            }
            const finalTotal = document.querySelector('.page .total-price');
            if (finalTotal) finalTotal.textContent = money(total);
            const payment = document.querySelector('.page .payment-row > span:last-child');
            if (payment) payment.textContent = money(total);
            const orderButton = document.querySelector('.page .order-button');
            if (orderButton) {
                const orderLink = orderButton.closest('a');
                orderButton.disabled = cart.length === 0;
                if (orderLink) {
                    if (!orderLink.dataset.completionHref) {
                        orderLink.dataset.completionHref = orderLink.getAttribute('href') || '';
                        orderLink.addEventListener('click', event => {
                            if (!read().length) {
                                event.preventDefault();
                                return;
                            }
                            localStorage.removeItem(key);
                            localStorage.removeItem(voucherKey);
                            localStorage.removeItem('biterush_delivery');
                        }, true);
                    }
                    orderLink.href = cart.length ? orderLink.dataset.completionHref : '#';
                    orderLink.setAttribute('aria-disabled', String(cart.length === 0));
                }
            }
            }
        }
        const voucherInputs = document.querySelectorAll('input[name="voucher"]');
        voucherInputs.forEach((input, index) => {
            const voucherId = index === 0 ? 'voucher20' : 'voucher15';
            input.value = voucherId;
            input.checked = localStorage.getItem(voucherKey) === voucherId;
            input.addEventListener('change', () => {
                localStorage.setItem(voucherKey, input.checked ? voucherId : '');
                update();
            });
        });
        const summaryCard = document.querySelector('.summary-card');
        if (summaryCard && !summaryCard.querySelector('.voucher-discount-row')) {
            const row = document.createElement('div');
            row.className = 'fee-row voucher-discount-row';
            row.innerHTML = '<div class="fee-info"><span class="fee-title">Voucher discount</span></div><span class="fee-amount voucher-discount-amount"></span>';
            row.hidden = true;
            summaryCard.querySelector('.voucher-section-title')?.before(row);
        }
        const deliverySummary = document.querySelector('.page .summary-line:last-of-type');
        if (deliverySummary && !document.querySelector('.page .voucher-discount-line')) {
            const row = document.createElement('div');
            row.className = 'summary-line voucher-discount-line';
            row.innerHTML = '<span>Voucher discount</span><span></span>';
            deliverySummary.after(row);
        }
        window.addEventListener('biterush-cart-updated', update);
        window.addEventListener('storage', update);
        update();
    }());
