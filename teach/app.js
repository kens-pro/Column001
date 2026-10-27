/* Teaching philosophy article: first-party interaction events only.
 * GA4 integration should be configured through GTM-WHZRZKGG.
 * No duplicate gtag.js initialization, ad pixels, forms or cookies are added here.
 */
(function () {
  'use strict';
  const ARTICLE = 'teaching_philosophy';
  const page = 'piano_educator_teaching_essay';
  window.dataLayer = window.dataLayer || [];

  function track(event, fields) {
    window.dataLayer.push({
      event,
      article_id: ARTICLE,
      page_context: page,
      ...(fields || {})
    });
  }

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Event 1: page interaction has initialized; GA4's page_view belongs to the GTM Google tag.
  track('lp_article_ready', { content_group: 'education_essay' });

  // Depth tracking: fire each milestone just once, based on full document scroll range.
  const milestones = [25, 50, 75, 90, 100];
  const fired = new Set();
  let queued = false;
  function updateProgress() {
    queued = false;
    const root = document.documentElement;
    const extent = Math.max(0, root.scrollHeight - window.innerHeight);
    const scroll = Math.max(window.scrollY || root.scrollTop || 0, 0);
    const percent = extent ? Math.min(100, Math.round(scroll / extent * 100)) : 100;
    const bar = document.getElementById('reading-progress');
    if (bar) bar.style.width = percent + '%';
    for (const milestone of milestones) {
      if (percent >= milestone && !fired.has(milestone)) {
        fired.add(milestone);
        track('lp_scroll_depth', { scroll_percent: milestone });
      }
    }
  }
  window.addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  // Section exposure - distinguish reading of substantial content from page load.
  const seen = new Set();
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target.dataset.articleSection;
        if (section && !seen.has(section)) {
          seen.add(section);
          track('lp_section_view', { section_id: section });
        }
        sectionObserver.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -24% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-article-section]').forEach(el => sectionObserver.observe(el));
  }

  // Navigation & external research citations. The event is intentionally free of personal data.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      track('lp_internal_navigation', {
        target_section: href.slice(1),
        nav_location: link.closest('.toc-grid') ? 'table_of_contents' :
          link.closest('.header-nav') ? 'header' : 'body'
      });
    } else if (link.closest('#sources')) {
      track('lp_reference_click', { reference_host: new URL(link.href).hostname });
    }
  });

  // Engaged time: count only while the page is visible.
  let engagedSeconds = 0;
  const engagementMilestones = new Set();
  const engagementTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    engagedSeconds += 5;
    for (const milestone of [30, 60, 120, 300]) {
      if (engagedSeconds >= milestone && !engagementMilestones.has(milestone)) {
        engagementMilestones.add(milestone);
        track('lp_engaged_time', { engaged_seconds: milestone });
      }
    }
    if (engagedSeconds >= 300) clearInterval(engagementTimer);
  }, 5000);

  // Share: native sharing on supported devices, safe URL-copy fallback.
  const shareButton = document.getElementById('share-button');
  const shareStatus = document.getElementById('share-status');
  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      const shareData = {
        title: document.title,
        text: '「教える」とは何か。ピアノの先生と考える、教育の本質。',
        url: document.querySelector('link[rel="canonical"]')?.href || location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          track('lp_share', { method: 'native' });
          if (shareStatus) shareStatus.textContent = '共有ありがとうございます。';
        } catch (error) {
          // User cancelled; do not record a successful share.
          if (error && error.name !== 'AbortError' && shareStatus) {
            shareStatus.textContent = '共有できませんでした。URLをコピーしてお使いください。';
          }
        }
      } else if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareData.url);
          track('lp_share', { method: 'copy_url' });
          if (shareStatus) shareStatus.textContent = '記事のURLをコピーしました。';
        } catch (error) {
          if (shareStatus) shareStatus.textContent = shareData.url;
        }
      } else if (shareStatus) {
        shareStatus.textContent = shareData.url;
      }
    });
  }

  // Clarity is optional. An actual Microsoft Clarity project ID must be set by the owner.
  // The empty meta value means no tracking code is injected.
  const clarityId = document.querySelector('meta[name="clarity-project-id"]')?.content?.trim() || '';
  if (/^[a-z0-9]{8,20}$/i.test(clarityId)) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments);};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,'clarity','script',clarityId);
  }
})();