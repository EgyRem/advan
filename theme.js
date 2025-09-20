// Theme management
const themes = {
    light: {
        background: '#ffffff',
        color: '#000000',
        sidebarBg: '#2c3e50',
        sidebarColor: '#ffffff',
        contentBg: '#f8f9fa',
        contentColor: '#000000'
    },
    dark: {
        background: '#121212',
        color: '#e0e0e0',
        sidebarBg: '#1e1e1e',
        sidebarColor: '#e0e0e0',
        contentBg: '#181818',
        contentColor: '#e0e0e0'
    },
    blue: {
        background: '#e3f2fd',
        color: '#0d47a1',
        sidebarBg: '#1976d2',
        sidebarColor: '#ffffff',
        contentBg: '#bbdefb',
        contentColor: '#0d47a1'
    },
    green: {
        background: '#e8f5e8',
        color: '#1b5e20',
        sidebarBg: '#388e3c',
        sidebarColor: '#ffffff',
        contentBg: '#c8e6c9',
        contentColor: '#1b5e20'
    },
    purple: {
        background: '#f3e5f5',
        color: '#4a148c',
        sidebarBg: '#7b1fa2',
        sidebarColor: '#ffffff',
        contentBg: '#e1bee7',
        contentColor: '#4a148c'
    }
};

async function initTheme() {
    const body = document.body;
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const savedTheme = localStorage.getItem('theme') || 'light';
    const customBg = localStorage.getItem('customBg');

    // Add dark mode class if theme is dark
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }

    // Fetch wallpaper from server
    try {
        const response = await fetch('/wallpaper');
        const data = await response.json();
        if (data.path) {
            body.style.backgroundImage = `url(${data.path})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundRepeat = 'no-repeat';
            body.style.backgroundAttachment = 'fixed';
            body.style.backgroundColor = 'transparent';
            if (sidebar) sidebar.style.backgroundColor = 'rgba(0,0,0,0.5)';
            if (content) content.style.backgroundColor = 'rgba(255,255,255,0.5)';
            // Apply saved text color for visibility
            const savedTextColor = localStorage.getItem('textColor');
            if (savedTextColor && savedTextColor !== 'default') {
                body.style.color = savedTextColor;
                if (content) content.style.color = savedTextColor;
            }
            return; // Use server wallpaper
        }
    } catch (error) {
        console.error('Failed to fetch wallpaper:', error);
    }

    // Fallback to local customBg or theme
    if (customBg) {
        body.style.backgroundImage = `url(${customBg})`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundAttachment = 'fixed';
    } else if (themes[savedTheme]) {
        const theme = themes[savedTheme];
        body.style.background = theme.background;
        body.style.color = theme.color;
        if (sidebar) {
            sidebar.style.backgroundColor = theme.sidebarBg;
            sidebar.style.color = theme.sidebarColor;
        }
        if (content) {
            content.style.backgroundColor = theme.contentBg;
            content.style.color = theme.contentColor;
        }
    }

    // Apply saved text color after theme
    const savedTextColor = localStorage.getItem('textColor');
    if (savedTextColor && savedTextColor !== 'default') {
        body.style.color = savedTextColor;
        if (content) content.style.color = savedTextColor;
    }

    // Apply saved font family and size
    const savedFontFamily = localStorage.getItem('fontFamily');
    if (savedFontFamily) {
        document.documentElement.style.setProperty('--font-family', savedFontFamily);
    }
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.documentElement.style.setProperty('--font-size', savedFontSize);
    }
}

function setTheme(themeName) {
    const body = document.body;
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');

    localStorage.removeItem('customBg'); // Remove custom if setting predefined

    // Handle dark mode class
    if (themeName === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }

    if (themes[themeName]) {
        const theme = themes[themeName];
        body.style.background = theme.background;
        body.style.backgroundImage = 'none';
        document.documentElement.style.setProperty('--text-color', theme.color);
        if (sidebar) {
            sidebar.style.backgroundColor = theme.sidebarBg;
            sidebar.style.color = theme.sidebarColor;
        }
        if (content) {
            content.style.backgroundColor = theme.contentBg;
        }
        localStorage.setItem('theme', themeName);
    }
    return themeName;
}

function setCustomBg(imageData) {
    const body = document.body;
    body.style.backgroundImage = `url(${imageData})`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundAttachment = 'fixed';
    localStorage.setItem('customBg', imageData);
    localStorage.removeItem('theme'); // Remove predefined theme
}

function setTextColor(color) {
    const body = document.body;
    const content = document.querySelector('.content');
    if (color === 'default') {
        body.style.color = '';
        if (content) content.style.color = '';
        localStorage.removeItem('textColor');
    } else {
        body.style.color = color;
        if (content) content.style.color = color;
        localStorage.setItem('textColor', color);
    }
}

function setFontFamily(font) {
    document.documentElement.style.setProperty('--font-family', font);
    localStorage.setItem('fontFamily', font);
}

function setFontSize(size) {
    document.documentElement.style.setProperty('--font-size', size);
    localStorage.setItem('fontSize', size);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initTheme);
