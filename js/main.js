// ========== 导航栏滚动效果 ==========
const navbar = document.querySelector('.navbar');
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
const navLinkItems = document.querySelectorAll('.nav-links a');

// 滚动时导航栏添加阴影
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// 移动端菜单切换
menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

// 点击导航链接后关闭菜单
navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
    });
});

// ========== 滚动高亮当前导航 ==========
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinkItems.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// ========== 表单提交提示 ==========
const form = document.querySelector('.contact-form');
const submitBtn = form.querySelector('button');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const originalText = submitBtn.textContent;
    submitBtn.textContent = '发送中...';
    submitBtn.disabled = true;

    // 模拟发送（可替换为真实 API 请求）
    setTimeout(() => {
        submitBtn.textContent = '✓ 发送成功！';
        submitBtn.style.background = '#5bbf6a';
        form.reset();

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 2500);
    }, 1000);
});

// ========== 滚动渐入动画 ==========
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// 为各区块添加初始隐藏 + 渐入效果
document.querySelectorAll('.skill-card, .project-card, .stat').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});
