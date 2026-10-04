(() => {
    const preferenceKey = 'biterush_theme';
    const authPageNames = new Set([
        'login',
        'signup',
        'googlelogin',
        'fblogin',
        'facebooklogin',
        'qrlogin',
        'forgotpassword'
    ]);
    const isAuthPage = window.location.pathname
        .split('/')
        .filter(Boolean)
        .some(segment => {
            const normalized = segment.toLowerCase().replace(/[^a-z]/g, '');
            return authPageNames.has(normalized)
                || normalized.includes('signup')
                || (normalized.includes('qr') && normalized.includes('login'));
        });
    let preference = 'light';

    try {
        preference = isAuthPage
            ? 'light'
            : localStorage.getItem(preferenceKey) === 'dark'
                ? 'dark'
                : 'light';
        if (isAuthPage) localStorage.setItem(preferenceKey, 'light');
    } catch (error) {
        console.error('Unable to read or enforce the saved theme preference:', error);
    }

    const applyTheme = theme => {
        const useDarkTheme = !isAuthPage && theme === 'dark';
        document.documentElement.classList.toggle('dark-theme', useDarkTheme);
        document.body?.classList.toggle('dark-theme', useDarkTheme);
        return useDarkTheme ? 'dark' : 'light';
    };

    applyTheme(preference);

    document.addEventListener('DOMContentLoaded', () => {
        const activeTheme = applyTheme(preference);
        const themeToggle = document.getElementById('darkModeToggle');
        if (!themeToggle) return;

        themeToggle.checked = activeTheme === 'dark';
        themeToggle.disabled = isAuthPage;
        themeToggle.addEventListener('change', () => {
            const nextTheme = applyTheme(themeToggle.checked ? 'dark' : 'light');
            try {
                localStorage.setItem(preferenceKey, nextTheme);
                preference = nextTheme;
            } catch (error) {
                themeToggle.checked = applyTheme(preference) === 'dark';
                console.error('Unable to save the theme preference:', error);
            }
        });
    });
})();
