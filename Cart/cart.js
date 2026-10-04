(function () {
    const CART_KEY = 'biterush_cart';
    const readCart = () => {
        try {
            const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
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
            console.error('Unable to read cart:', error);
            return [];
        }
    };
    let cart = readCart();

    const saveCart = () => {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('biterush-cart-updated'));
        render();
    };
    const money = value => `₱ ${Number(value).toFixed(0)}`;
    const itemKey = item => item.key || item.link || `${item.title}|${item.img}`;
    const add = item => {
        item.img = new URL(item.img, location.href).href;
        item.key = itemKey(item);
        const existing = cart.find(entry => itemKey(entry) === item.key);
        if (existing) {
            existing.price = Number(item.price);
            existing.quantity += 1;
        }
        else cart.push({ ...item, quantity: 1 });
        saveCart();
    };
    const change = (title, amount) => {
        const item = cart.find(entry => itemKey(entry) === title);
        if (!item) return;
        item.quantity += amount;
        cart = cart.filter(entry => entry.quantity > 0);
        saveCart();
    };

    const existingButton = document.querySelector('.cart-btn');
    const button = existingButton || document.createElement('button');
    if (!existingButton) {
        button.className = 'shared-cart-toggle';
        button.type = 'button';
        button.setAttribute('aria-label', 'Shopping Cart');
        button.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>`;
        document.body.appendChild(button);
    }
    const badge = button.querySelector('.cart-badge') || document.createElement('span');
    if (!badge.classList.contains('cart-badge')) {
        badge.className = 'shared-cart-badge';
        button.appendChild(badge);
    }
    const pathname = location.pathname.replace(/\\/g, '/');
    const isFoodDetailsPage = /\/FoodDetails\//i.test(pathname)
        || /\/BiteRushHomePage\/FoodDetailsHome\//i.test(pathname);
    const isMenuPage = /\/BiteRushFoodMenuPages\//i.test(pathname);
    const isProjectRootPage = pathname === '/'
        || /^\/index\.html$/i.test(pathname)
        || /\/BiteRush\/(?:index\.html)?$/i.test(pathname);
    const checkoutPath = isFoodDetailsPage
        ? '../../../DeliveryAddress/index.html'
        : isMenuPage
            ? '../../DeliveryAddress/index.html'
            : isProjectRootPage
                ? 'DeliveryAddress/index.html'
                : '../DeliveryAddress/index.html';

    const overlay = document.createElement('div');
    overlay.className = 'shared-cart-overlay';
    const drawer = document.createElement('aside');
    drawer.className = 'shared-cart-drawer';
    drawer.innerHTML = `
        <div class="shared-cart-header">
            <h2>Your Order</h2>
            <button class="shared-cart-close" type="button" aria-label="Close cart">&times;</button>
        </div>
        <div class="shared-cart-items"></div>
        <div class="shared-cart-footer">
            <div class="shared-cart-total"><span>Total:</span><span class="shared-cart-total-value"></span></div>
            <a class="shared-cart-checkout" href="${checkoutPath}">Review payment and address</a>
        </div>`;
    document.body.append(overlay, drawer);

    const itemsElement = drawer.querySelector('.shared-cart-items');
    const totalElement = drawer.querySelector('.shared-cart-total-value');
    const render = () => {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = count;
        button.setAttribute('aria-label', `Shopping Cart, ${count} item${count === 1 ? '' : 's'}`);
        itemsElement.innerHTML = cart.length ? cart.map(item => `
            <div class="shared-cart-item">
                <img src="${item.img}" alt="${item.title}">
                <div><h3>${item.title}</h3><p>${money(item.price)} each</p></div>
                <div class="shared-cart-quantity">
                    <button type="button" data-title="${itemKey(item)}" data-change="-1">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-title="${itemKey(item)}" data-change="1">+</button>
                </div>
            </div>`).join('') : '<div class="shared-cart-empty">Your cart is empty.</div>';
        totalElement.textContent = money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
    };
    window.addEventListener('storage', event => {
        if (event.key === CART_KEY) {
            cart = readCart();
            render();
        }
    });
    const toggle = () => {
        drawer.classList.toggle('open');
        overlay.classList.toggle('open');
    };
    button.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
    drawer.querySelector('.shared-cart-close').addEventListener('click', toggle);
    drawer.addEventListener('click', event => {
        const control = event.target.closest('[data-title]');
        if (control) change(control.dataset.title, Number(control.dataset.change));
    });

    document.querySelectorAll('.add-btn').forEach(addButton => {
        addButton.addEventListener('click', event => {
            const card = event.currentTarget.closest('.food-card, .search-result-card');
            if (!card) return;
            const image = card.querySelector('.food-img');
            const source = event.currentTarget.dataset;
            const detailLink = source.link || card.dataset.link || card.querySelector('.buy-btn')?.closest('a')?.getAttribute('href');
            add({
                title: source.title || card.dataset.title || card.querySelector('.food-title')?.textContent.trim(),
                price: Number(source.price || card.dataset.price || card.querySelector('.price')?.textContent.replace(/[^\d.]/g, '')),
                img: source.img || card.dataset.img || image?.getAttribute('src'),
                link: detailLink ? new URL(detailLink, location.href).pathname : ''
            });
        });
    });

    const detailCard = document.querySelector('.item-card');
    if (detailCard) {
        const detailImage = detailCard.querySelector('.item-img');
        const detailItem = () => ({
            key: location.pathname,
            title: detailCard.querySelector('.item-title')?.textContent.trim(),
            price: Number(detailCard.querySelector('.item-price')?.textContent.replace(/[^\d.]/g, '')),
            img: detailImage?.getAttribute('src')
        });
        const detailKey = location.pathname;
        const existingDetailItem = cart.find(item => itemKey(item) === detailKey);
        const currentDetailPrice = Number(
            detailCard.querySelector('.item-price')?.textContent.replace(/[^\d.]/g, '')
        );
        if (existingDetailItem && Number.isFinite(currentDetailPrice)
            && existingDetailItem.price !== currentDetailPrice) {
            existingDetailItem.price = currentDetailPrice;
            saveCart();
        }
        const getDetailQuantity = () => cart.find(item => item.key === detailKey)?.quantity || 0;
        const detailQuantity = detailCard.querySelector('.qty-count');
        const updateDetailQuantity = () => {
            if (detailQuantity) detailQuantity.textContent = getDetailQuantity() || 1;
        };
        if (!detailCard.querySelector('.shared-add-detail')) {
            const detailAddButton = document.createElement('button');
            detailAddButton.className = 'shared-add-detail';
            detailAddButton.type = 'button';
            detailAddButton.textContent = 'Add to cart';
            detailCard.querySelector('.item-quantity-price')?.appendChild(detailAddButton);
            detailAddButton.addEventListener('click', () => {
                add(detailItem());
                drawer.classList.add('open');
                overlay.classList.add('open');
                updateDetailQuantity();
            });
            detailCard.querySelectorAll('.qty-btn').forEach((control, index) => {
                control.addEventListener('click', () => {
                    if (index === 1) add(detailItem());
                    else change(detailKey, -1);
                    updateDetailQuantity();
                });
            });
        }
        document.querySelectorAll('.checkout-btn').forEach(checkoutButton => {
            checkoutButton.addEventListener('click', () => {
                if (!getDetailQuantity()) add(detailItem());
                location.href = checkoutPath;
            });
        });
        updateDetailQuantity();
    }

    window.BiteRushCart = { add, change, get items() { return [...cart]; } };
    render();
}());
