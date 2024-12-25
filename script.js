// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const backToTopBtn = document.getElementById('back-to-top');
const hamburger = document.querySelector('.hamburger');
const tabsContainer = document.querySelector('.tabs');

// Markdown Content - These would be your markdown files
const markdownFiles = {
    software: 'software.md',
    ricing: 'ricing.md',
    ai: 'ai_software.md'
};

// Configure marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true
});

// Load markdown content
async function loadMarkdownContent(tabId) {
    try {
        const response = await fetch(markdownFiles[tabId]);
        const text = await response.text();
        return marked.parse(text);
    } catch (error) {
        console.error('Error loading markdown:', error);
        return '<p>Error loading content.</p>';
    }
}

// Initialize content
async function initializeContent() {
    // Load initial content for all tabs
    for (const [tabId, _] of Object.entries(markdownFiles)) {
        const content = document.getElementById(tabId);
        content.innerHTML = await loadMarkdownContent(tabId);
    }

    // Process external links
    processExternalLinks();
}

// Handle tab switching
function switchTab(targetTab) {
    // Remove active class from all tabs and contents
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    const selectedBtn = document.querySelector(`[data-tab="${targetTab}"]`);
    const selectedContent = document.getElementById(targetTab);

    selectedBtn.classList.add('active');
    selectedContent.classList.add('active');

    // Reset category filters
    document.querySelectorAll('.category-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    activeFilters = new Set();

    // Reset search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    // Close mobile menu if open
    if (window.innerWidth <= 768) {
        tabsContainer.classList.remove('show');
    }

    setTimeout(createTableOfContents, 100);
}

// Process external links to open in new tab
function processExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
}

// Event Listeners
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

// Debug function
function debugScrollInfo() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    console.log({
        documentElementScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop,
        windowPageYOffset: window.pageYOffset,
        scrollTop: scrollTop,
        hasVisibleClass: backToTopBtn.classList.contains('visible')
    });
}

// Update the scroll detection
const backToTop = document.getElementById('back-to-top');

function toggleBackToTop() {
    if (window.scrollY > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
}

// Throttle scroll events
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            toggleBackToTop();
            ticking = false;
        });
        ticking = true;
    }
});

// Handle click event
backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Handle keyboard navigation
backToTop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

// Initial check
document.addEventListener('DOMContentLoaded', toggleBackToTop);

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    tabsContainer.classList.toggle('show');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        !hamburger.contains(e.target) &&
        !tabsContainer.contains(e.target)) {
        tabsContainer.classList.remove('show');
        hamburger.classList.remove('active');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        tabsContainer.classList.remove('show');
        hamburger.classList.remove('active');
    }
});

// Create and update TOC
function createTableOfContents() {
    const toc = document.createElement('nav');
    toc.className = 'toc';

    const tocContainer = document.createElement('div');
    tocContainer.className = 'toc-container';

    const activeContent = document.querySelector('.tab-content.active');
    const headings = activeContent.querySelectorAll('h1, h2, h3');

    headings.forEach(heading => {
        if (!heading.id) {
            heading.id = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        link.className = `toc-link toc-${heading.tagName.toLowerCase()}`;

        if (heading.tagName === 'H2') {
            link.style.paddingLeft = '1rem';
        } else if (heading.tagName === 'H3') {
            link.style.paddingLeft = '2rem';
        }

        link.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth' });
            document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });

        tocContainer.appendChild(link);
    });

    toc.appendChild(tocContainer);

    const existingToc = document.querySelector('.toc');
    if (existingToc) {
        existingToc.remove();
    }

    document.body.appendChild(toc);
    updateTOC();
}

// Update active TOC link
function updateTOC() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('h1, h2, h3');
    const tocContainer = document.querySelector('.toc-container');

    let currentActive = null;
    let minDistance = Infinity;

    headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        const distanceFromTop = Math.abs(rect.top - 150);

        if (rect.top <= 150 && distanceFromTop < minDistance) {
            minDistance = distanceFromTop;
            currentActive = heading.id;
        }
    });

    tocLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);

        if (href === currentActive) {
            link.classList.add('active');

            // Ensure the active link is visible in the container
            const linkRect = link.getBoundingClientRect();
            const containerRect = tocContainer.getBoundingClientRect();

            if (linkRect.bottom > containerRect.bottom || linkRect.top < containerRect.top) {
                tocContainer.scrollTo({
                    top: link.offsetTop - (containerRect.height / 2),
                    behavior: 'smooth'
                });
            }
        } else {
            link.classList.remove('active');
        }
    });
}

// Add scroll event listener for TOC updates
let tocThrottle = false;
window.addEventListener('scroll', () => {
    if (!tocThrottle) {
        window.requestAnimationFrame(() => {
            updateTOC();
            tocThrottle = false;
        });
        tocThrottle = true;
    }
});

// Define categories and their colors using Catppuccin Mocha palette
const categories = {
    'file-management': {
        name: 'File Management',
        color: 'blue'
    },
    'media-playback': {
        name: 'Media Playback',
        color: 'mauve'
    },
    'media-editing': {
        name: 'Media Editing',
        color: 'pink'
    },
    'development': {
        name: 'Development',
        color: 'green'
    },
    'utility': {
        name: 'Utility',
        color: 'peach'
    },
    'system': {
        name: 'System',
        color: 'yellow'
    },
    'network': {
        name: 'Network',
        color: 'sapphire'
    },
    'compression': {
        name: 'Compression',
        color: 'teal'
    },
    'image': {
        name: 'Image',
        color: 'lavender'
    },
    'audio': {
        name: 'Audio',
        color: 'maroon'
    }
};

// Software categories mapping
const softwareCategories = {
    'textify': ['utility'],
    'qttabbar': ['file-management', 'utility'],
    'microsoft-powertoys': ['utility', 'system'],
    'clipclip': ['utility'],
    'jdownloader-2': ['network', 'utility'],
    'qbittorrent': ['network'],
    'everything': ['utility', 'file-management'],
    'volume2': ['system', 'audio'],
    'mouse-wheel-accelerator': ['utility'],
    '7-taskbar-tweaker': ['system'],
    'rclone': ['file-management', 'network'],
    'yt-dlp': ['network', 'media-playback'],
    'musicbrainz-picard': ['audio', 'utility'],
    'mp3tag': ['audio', 'utility'],
    'wiztree': ['utility', 'file-management'],
    'file-converter': ['utility', 'media-editing'],
    'iconviewer': ['utility', 'image'],
    'icaros': ['system', 'utility'],
    'fiddler-classic': ['network', 'development'],
    'mpc-be': ['media-playback'],
    'audacity': ['audio', 'media-editing'],
    'spek': ['audio', 'utility'],
    'obs-studio': ['media-editing', 'utility'],
    'handbrake': ['media-editing'],
    '7-zip': ['compression', 'utility'],
    'git': ['development'],
    'send-anywhere': ['network', 'utility'],
    'visual-studio-code': ['development'],
    'cursor': ['development'],
    'mediainfo': ['utility', 'media-playback'],
    'unstoppable-copier': ['utility', 'file-management'],
    'hydrus-network': ['image', 'file-management'],
    'jpegview': ['image'],
    'photodemon': ['image', 'media-editing'],
    'losslesscut': ['media-editing', 'utility'],
    'capcut': ['media-editing']
};

// Initialize search and filter functionality
function initializeSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.getElementById('category-filters');
    let activeFilters = new Set();

    // Create category filter tags
    Object.entries(categories).forEach(([key, value]) => {
        const tag = document.createElement('span');
        tag.className = 'category-tag';
        tag.dataset.category = key;
        tag.textContent = value.name;

        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
            if (activeFilters.has(key)) {
                activeFilters.delete(key);
            } else {
                activeFilters.add(key);
            }
            filterContent();
        });

        categoryFilters.appendChild(tag);
    });

    // Search and filter function
    function filterContent() {
        const searchTerm = searchInput.value.toLowerCase();
        const allSections = document.querySelectorAll('.tab-content h2, .tab-content h3');

        allSections.forEach(section => {
            const sectionId = section.id.toLowerCase();
            const sectionText = section.textContent.toLowerCase();
            const categories = softwareCategories[sectionId] || [];

            const matchesSearch = searchTerm === '' ||
                sectionText.includes(searchTerm);
            const matchesFilter = activeFilters.size === 0 ||
                categories.some(cat => activeFilters.has(cat));

            // Find the content associated with this heading
            let content = section;
            while (content.nextElementSibling &&
                !content.nextElementSibling.matches('h2, h3')) {
                content = content.nextElementSibling;
            }

            // Show/hide based on filters
            if (matchesSearch && matchesFilter) {
                section.style.display = '';
                let el = section.nextElementSibling;
                while (el && !el.matches('h2, h3')) {
                    el.style.display = '';
                    el = el.nextElementSibling;
                }
            } else {
                section.style.display = 'none';
                let el = section.nextElementSibling;
                while (el && !el.matches('h2, h3')) {
                    el.style.display = 'none';
                    el = el.nextElementSibling;
                }
            }
        });

        // If search term exists, show matching content in all tabs
        if (searchTerm) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                const hasVisibleContent = Array.from(tab.querySelectorAll('h2, h3'))
                    .some(heading => heading.style.display !== 'none');
                if (hasVisibleContent) {
                    tab.classList.add('active');
                }
            });
        }

        updateTOC();
    }

    // Add search event listener
    searchInput.addEventListener('input', filterContent);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initializeContent();
    switchTab('software');
    createTableOfContents();
    initializeSearchAndFilter();
});

