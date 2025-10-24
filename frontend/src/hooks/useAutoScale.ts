import { RefObject, useEffect } from 'react';

type Opts = { minScale?: number };

export default function useAutoScale(ref: RefObject<HTMLElement | null>, deps: any[] = [], opts: Opts = {}) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let raf = 0;
        let ro: ResizeObserver | null = null;

        function fit() {
            const node = ref.current;
            if (!node) return;

            // Reset transform to measure natural size
            node.style.transform = '';
            node.style.width = 'auto';

            const naturalW = node.scrollWidth || node.offsetWidth;
            const naturalH = node.scrollHeight || node.offsetHeight;

            const parent = node.parentElement as HTMLElement | null;
            const availW = parent ? Math.max(parent.clientWidth - 8, 20) : Math.max(window.innerWidth - 16, 20);
            const availH = parent ? Math.max(parent.clientHeight - 8, 40) : Math.max(window.innerHeight * 0.35, 40);

            let scale = Math.min(1, availW / Math.max(naturalW, 1), availH / Math.max(naturalH, 1));
            if (opts.minScale) scale = Math.max(scale, opts.minScale);

            node.style.transformOrigin = 'left top';
            node.style.transform = `scale(${scale})`;
            node.style.width = naturalW + 'px';
            node.style.overflow = 'visible';
        }

        fit();

        const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(fit);
        };

        window.addEventListener('resize', onResize);

        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => {
                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(fit);
            });
            ro.observe(el.parentElement || el);
        }

        return () => {
            window.removeEventListener('resize', onResize);
            if (ro) ro.disconnect();
            cancelAnimationFrame(raf);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
