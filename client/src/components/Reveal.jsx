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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal${visible ? ' reveal-visible' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
}
