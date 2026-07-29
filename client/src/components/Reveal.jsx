import { useEffect, useRef, useState } from 'react';

// Lightweight fade/slide-in-on-scroll wrapper (no extra dependency - just
// IntersectionObserver, already supported by every modern browser). Wrap
// any block that should feel like it settles into place as guests scroll
// past it, matching the "reveal" feel of the polished reference sites.
// `as` lets it render as whatever tag the layout needs (e.g. the actual
// `.card-grid` div itself) so it doesn't add an extra wrapper element.
export default function Reveal({ children, as: Tag = 'div', className = '', ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    // `threshold: 0.15` meant 15% of the *whole wrapped element* had to be
    // on-screen before it revealed. That's fine for a single card, but these
    // wrappers are entire multi-row grids - on a narrow mobile screen a tall
    // grid's 15% area can be more than one whole screen of scrolling, so
    // tapping a nav link (which jumps straight to the section) landed on a
    // section that stayed blank until scrolled almost all the way through.
    // A near-zero threshold plus a bottom rootMargin instead reveals as soon
    // as the element starts entering the viewport, regardless of its height.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(node);
    // Also handle the (rare) case where the section is already fully in
    // view before the observer even attaches - e.g. a very short viewport
    // landing mid-section from an anchor jump that fires before paint.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      observer.disconnect();
    }
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal${visible ? ' reveal-visible' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
}
