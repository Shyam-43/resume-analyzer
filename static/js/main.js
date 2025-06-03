/**
 * Resume Analyzer - Main JavaScript
 * Handles interactive functionality across the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeNavigation();
    initializeAnimations();
    initializeFormValidation();
    initializeFileUpload();
    initializeTooltips();
    initializeScrollEffects();
});

/**
 * Navigation Enhancement
 */
function initializeNavigation() {
    // Add active class to current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

/**
 * Animation and Visual Effects
 */
function initializeAnimations() {
    // Animate counters
    const counters = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
    
    // Animate cards on scroll
    const cards = document.querySelectorAll('.card, .feature-card, .process-step');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        cardObserver.observe(card);
    });
}

/**
 * Counter Animation
 */
function animateCounter(element) {
    const target = parseInt(element.textContent.replace(/[^\d]/g, ''));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Preserve any non-numeric characters
        const originalText = element.textContent;
        const numericPart = Math.floor(current);
        const nonNumericPart = originalText.replace(/[\d]/g, '');
        
        if (originalText.includes('%')) {
            element.textContent = numericPart + '%';
        } else if (originalText.includes('+')) {
            element.textContent = numericPart + '+';
        } else if (originalText.includes('.')) {
            element.textContent = (current / 10).toFixed(1) + nonNumericPart;
        } else {
            element.textContent = numericPart + nonNumericPart;
        }
    }, 16);
}

/**
 * Form Validation Enhancement
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('form[novalidate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                
                // Focus on first invalid field
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            form.classList.add('was-validated');
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.checkValidity()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                }
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid') && this.checkValidity()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                }
            });
        });
    });
    
    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        if (input.name === 'password' && input.id !== 'confirm_password') {
            addPasswordStrengthIndicator(input);
        }
    });
}

/**
 * Password Strength Indicator
 */
function addPasswordStrengthIndicator(passwordInput) {
    const strengthMeter = document.createElement('div');
    strengthMeter.className = 'password-strength-meter mt-2';
    strengthMeter.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill"></div>
        </div>
        <small class="strength-text text-muted">Password strength: <span class="strength-level">Weak</span></small>
    `;
    
    passwordInput.parentNode.appendChild(strengthMeter);
    
    passwordInput.addEventListener('input', function() {
        const strength = calculatePasswordStrength(this.value);
        updatePasswordStrengthIndicator(strengthMeter, strength);
    });
}

/**
 * Calculate Password Strength
 */
function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 25;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score += 25;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) score += 25;
    else feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) score += 25;
    else feedback.push('Number');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    
    let level = 'Weak';
    let color = '#dc3545';
    
    if (score >= 85) {
        level = 'Strong';
        color = '#198754';
    } else if (score >= 60) {
        level = 'Good';
        color = '#ffc107';
    } else if (score >= 35) {
        level = 'Fair';
        color = '#fd7e14';
    }
    
    return { score, level, color, feedback };
}

/**
 * Update Password Strength Indicator
 */
function updatePasswordStrengthIndicator(meter, strength) {
    const fill = meter.querySelector('.strength-fill');
    const level = meter.querySelector('.strength-level');
    
    fill.style.width = strength.score + '%';
    fill.style.backgroundColor = strength.color;
    level.textContent = strength.level;
    level.style.color = strength.color;
}

/**
 * File Upload Enhancement
 */
function initializeFileUpload() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        if (input.accept === '.pdf') {
            enhancePdfUpload(input);
        }
    });
}

/**
 * Enhanced PDF Upload
 */
function enhancePdfUpload(input) {
    const container = input.closest('.file-upload-area');
    if (!container) return;
    
    // Drag and drop enhancement
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, () => container.classList.add('drag-over'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, () => container.classList.remove('drag-over'), false);
    });
    
    container.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                handleFileSelect(input, file);
            }
        }
    }
    
    // File selection validation
    input.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            validateFile(file);
        }
    });
}

/**
 * Validate File
 */
function validateFile(file) {
    const maxSize = 16 * 1024 * 1024; // 16MB
    const allowedTypes = ['application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
        showAlert('Please select a PDF file.', 'danger');
        return false;
    }
    
    if (file.size > maxSize) {
        showAlert('File size must be less than 16MB.', 'danger');
        return false;
    }
    
    return true;
}

/**
 * Handle File Selection
 */
function handleFileSelect(input, file) {
    // Update file input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    
    // Show file info
    const fileName = input.closest('.upload-section').querySelector('#fileName');
    const fileSize = input.closest('.upload-section').querySelector('#fileSize');
    const fileUploadArea = input.closest('.upload-section').querySelector('.file-upload-area');
    const fileSelected = input.closest('.upload-section').querySelector('.file-upload-selected');
    
    if (fileName && fileSize && fileUploadArea && fileSelected) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileUploadArea.style.display = 'none';
        fileSelected.style.display = 'block';
    }
}

/**
 * Format File Size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Initialize Tooltips
 */
function initializeTooltips() {
    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Custom tooltip-like functionality for elements with title attributes
    const elementsWithTitles = document.querySelectorAll('[title]');
    elementsWithTitles.forEach(element => {
        element.addEventListener('mouseenter', showCustomTooltip);
        element.addEventListener('mouseleave', hideCustomTooltip);
    });
}

/**
 * Show Custom Tooltip
 */
function showCustomTooltip(e) {
    const element = e.target;
    const title = element.getAttribute('title');
    if (!title) return;
    
    // Remove title to prevent default tooltip
    element.setAttribute('data-original-title', title);
    element.removeAttribute('title');
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = title;
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        pointer-events: none;
        z-index: 1000;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    
    element._tooltip = tooltip;
}

/**
 * Hide Custom Tooltip
 */
function hideCustomTooltip(e) {
    const element = e.target;
    const originalTitle = element.getAttribute('data-original-title');
    
    if (originalTitle) {
        element.setAttribute('title', originalTitle);
        element.removeAttribute('data-original-title');
    }
    
    if (element._tooltip) {
        element._tooltip.remove();
        delete element._tooltip;
    }
}

/**
 * Scroll Effects
 */
function initializeScrollEffects() {
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.backgroundColor = 'rgba(13, 110, 253, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.backgroundColor = '';
                navbar.style.backdropFilter = '';
            }
        });
    }
    
    // Back to top button
    createBackToTopButton();
}

/**
 * Create Back to Top Button
 */
function createBackToTopButton() {
    const backToTop = document.createElement('button');
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.className = 'btn btn-primary btn-back-to-top';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: none;
    `;
    
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Show Alert Message
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertContainer.style.cssText = `
        top: 1rem;
        right: 1rem;
        z-index: 1050;
        min-width: 300px;
        max-width: 500px;
    `;
    
    alertContainer.innerHTML = `
        <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertContainer.parentNode) {
            alertContainer.remove();
        }
    }, 5000);
}

/**
 * Format Date for Display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce Function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Copy to Clipboard
 */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback Copy to Clipboard
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showAlert('Copied to clipboard!', 'success');
    } catch (err) {
        showAlert('Failed to copy to clipboard.', 'danger');
    }
    
    textArea.remove();
}

/**
 * Local Storage Helpers
 */
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Local storage not available:', e);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Local storage not available:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Local storage not available:', e);
        }
    }
};

/**
 * Form Data Persistence
 */
function initializeFormPersistence() {
    const forms = document.querySelectorAll('form[data-persist]');
    
    forms.forEach(form => {
        const formId = form.getAttribute('data-persist');
        
        // Load saved data
        const savedData = Storage.get(`form_${formId}`);
        if (savedData) {
            Object.keys(savedData).forEach(name => {
                const field = form.querySelector(`[name="${name}"]`);
                if (field && field.type !== 'password') {
                    field.value = savedData[name];
                }
            });
        }
        
        // Save data on input
        const saveData = debounce(() => {
            const formData = new FormData(form);
            const data = {};
            for (let [name, value] of formData.entries()) {
                if (form.querySelector(`[name="${name}"]`).type !== 'password') {
                    data[name] = value;
                }
            }
            Storage.set(`form_${formId}`, data);
        }, 500);
        
        form.addEventListener('input', saveData);
        
        // Clear data on successful submit
        form.addEventListener('submit', function(e) {
            if (form.checkValidity()) {
                Storage.remove(`form_${formId}`);
            }
        });
    });
}

// Initialize form persistence
document.addEventListener('DOMContentLoaded', initializeFormPersistence);

// Export functions for global use
window.ResumeAnalyzer = {
    showAlert,
    formatDate,
    formatFileSize,
    copyToClipboard,
    Storage,
    debounce
};
