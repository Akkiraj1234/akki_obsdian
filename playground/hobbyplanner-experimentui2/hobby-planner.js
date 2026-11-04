/**
 * Hobby Planner — timeline behaviour
 *
 * How it works
 * ------------
 * Months run newest → oldest, left to right. The selected month is widened to
 * half of the viewport and pinned to the left edge.
 *
 * Everything that moves (column widths, scroll offset, highlight strength) is
 * derived from ONE number — `position`, the fractional index of the selected
 * month — and a spring animates that number. With a single source of truth
 * there are no competing scroll / width / snap animations, so it stays smooth.
 */
(() => {
    "use strict";

    /* ------------------------------------------------------------------ *
     * Configuration
     * ------------------------------------------------------------------ */

    const LATEST_MONTH = "2026-10";   // leftmost month ("YYYY-MM")
    const MONTH_COUNT = 10;
    const MONTH_WIDTH = 100;          // px, width of an unselected month

    // Spring (critically damped → fast, no overshoot)
    const STIFFNESS = 170;
    const DAMPING = 2 * Math.sqrt(STIFFNESS);
    const REST_DISTANCE = 0.0005;
    const REST_SPEED = 0.002;

    // Input tuning
    const WHEEL_THRESHOLD = 24;       // wheel delta needed to change month
    const WHEEL_IDLE_MS = 110;        // pause that ends a wheel gesture
    const DRAG_START_PX = 6;          // touch movement before a drag begins
    const FLICK_LOOKAHEAD_S = 0.12;   // how far a flick "carries"

    /**
     * Activities, grouped by section.
     * `start` / `end` are inclusive "YYYY-MM" months; `depth` indents a child.
     */
    const GROUPS = [
        {
            title: "Main skill",
            items: [
                { id: "coding", name: "Coding", color: "#b49af7", start: "2026-05", end: "2026-10" },
                { id: "leetcode", name: "LeetCode", color: "#78b8e8", start: "2026-07", end: "2026-09", depth: 1 },
            ],
        },
        {
            title: "Hobbies",
            items: [
                { id: "book-reading", name: "Book reading", color: "#e5a06b", start: "2026-02", end: "2026-06" },
                { id: "sketching", name: "Sketching", color: "#d98bb5", start: "2026-08", end: "2026-10" },
            ],
        },
        {
            title: "Activity",
            items: [
                { id: "chess", name: "Chess", color: "#d4bd72", start: "2026-09", end: "2026-10" },
            ],
        },
        {
            title: "Gym",
            items: [
                { id: "home-workout", name: "Home workout", color: "#7eaa91", start: "2026-06", end: "2026-10" },
            ],
        },
    ];

    /* ------------------------------------------------------------------ *
     * Helpers
     * ------------------------------------------------------------------ */

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function create(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    const formatShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
    const formatLong = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

    function parseMonth(key) {
        const [year, month] = key.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, 1));
    }

    /* ------------------------------------------------------------------ *
     * Months (newest first)
     * ------------------------------------------------------------------ */

    const months = Array.from({ length: MONTH_COUNT }, (_, offset) => {
        const date = parseMonth(LATEST_MONTH);
        date.setUTCMonth(date.getUTCMonth() - offset);

        return {
            key: date.toISOString().slice(0, 7),
            short: formatShort.format(date),
            long: formatLong.format(date),
            year: date.getUTCFullYear(),
        };
    });

    const lastIndex = months.length - 1;
    const monthIndex = new Map(months.map((month, index) => [month.key, index]));

    /** CSS `grid-column` for an activity, clamped to the visible months. */
    function columnSpan({ start, end }) {
        const newest = months[0].key;
        const oldest = months[lastIndex].key;
        if (end < oldest || start > newest) return null;

        const first = monthIndex.get(end > newest ? newest : end);      // newest edge → left
        const last = monthIndex.get(start < oldest ? oldest : start);   // oldest edge → right
        return `${first + 1} / ${last + 2}`;
    }

    /* ------------------------------------------------------------------ *
     * DOM
     * ------------------------------------------------------------------ */

    const dom = {
        root: document.getElementById("tracker"),
        labelList: document.getElementById("labelList"),
        timeline: document.getElementById("timeline"),
        track: document.getElementById("track"),
        months: document.getElementById("months"),
        rows: document.getElementById("rows"),
        grid: document.getElementById("grid"),
    };

    // Month headers (buttons → keyboard and click friendly)
    const monthButtons = months.map((month, index) => {
        const button = create("button", "month");
        button.type = "button";
        button.setAttribute("aria-label", month.long);
        button.append(
            create("span", "month__name", month.short),
            create("span", "month__year", month.year),
        );
        button.addEventListener("click", () => select(index));
        return button;
    });
    dom.months.append(...monthButtons);

    // Background grid lines / dimming, one cell per month
    const gridCells = months.map(() => create("span", "grid-cell"));
    dom.grid.append(...gridCells);

    // Both of these get a `--w` (0 → 1) telling them how "selected" they are.
    const columns = months.map((_, index) => ({
        header: monthButtons[index],
        cell: gridCells[index],
    }));

    // Elements that light up together on hover: id → [label, row, bar]
    const linked = new Map();

    function createLabelRow(item, order) {
        const depth = item.depth ?? 0;
        const row = create("div", depth ? "label-row is-child" : "label-row");
        row.dataset.id = item.id;
        row.style.setProperty("--c", item.color);
        row.style.setProperty("--depth", depth);
        row.style.setProperty("--i", order);
        row.append(
            create("span", "label-row__dot"),
            create("span", "label-row__name", item.name),
        );
        return row;
    }

    function createActivityRow(item, order) {
        const row = create("div", "activity-row");
        row.dataset.id = item.id;

        const span = columnSpan(item);
        if (!span) return { row, bar: null };

        const description =
            `${item.name}: ${formatLong.format(parseMonth(item.start))} – ${formatLong.format(parseMonth(item.end))}`;

        const bar = create("div", "bar");
        bar.style.gridColumn = span;
        bar.style.setProperty("--c", item.color);
        bar.style.setProperty("--i", order);
        bar.title = description;
        bar.setAttribute("role", "img");
        bar.setAttribute("aria-label", description);

        row.append(bar);
        return { row, bar };
    }

    function buildRows() {
        const labels = document.createDocumentFragment();
        const rows = document.createDocumentFragment();
        let order = 0;   // drives the staggered entrance animation

        for (const group of GROUPS) {
            const title = create("h2", "group-title", group.title);
            title.style.setProperty("--i", order++);
            labels.append(title);
            rows.append(create("div", "group-gap"));

            for (const item of group.items) {
                const label = createLabelRow(item, order);
                const { row, bar } = createActivityRow(item, order);
                order++;

                labels.append(label);
                rows.append(row);
                linked.set(item.id, [label, row, bar].filter(Boolean));
            }
        }

        dom.labelList.append(labels);
        dom.rows.append(rows);
    }

    buildRows();

    /* ------------------------------------------------------------------ *
     * Motion: one fractional `position`, animated by a spring
     * ------------------------------------------------------------------ */

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const motion = {
        position: 0,    // fractional month index currently on screen
        velocity: 0,
        target: 0,
        frame: 0,
        lastTime: 0,
    };

    let selectedIndex = 0;
    let selectedWidth = MONTH_WIDTH;

    function measure() {
        selectedWidth = Math.max(MONTH_WIDTH, Math.floor(dom.timeline.clientWidth / 2));
    }

    /** Apply a fractional position to the DOM. */
    function paint(position) {
        const extra = selectedWidth - MONTH_WIDTH;
        let template = "";

        columns.forEach(({ header, cell }, index) => {
            // 1 when this month is selected, fading to 0 one month away.
            const weight = Math.max(0, 1 - Math.abs(index - position));
            const value = weight.toFixed(3);

            template += `${(MONTH_WIDTH + extra * weight).toFixed(2)}px `;
            header.style.setProperty("--w", value);
            cell.style.setProperty("--w", value);
        });

        const { track } = dom;
        track.style.setProperty("--cols", template.trim());
        track.style.width = `${MONTH_WIDTH * months.length + extra}px`;
        track.style.transform = `translate3d(${(-position * MONTH_WIDTH).toFixed(2)}px, 0, 0)`;
    }

    function step(time) {
        const dt = clamp((time - motion.lastTime) / 1000, 0, 1 / 30);
        motion.lastTime = time;

        const displacement = motion.position - motion.target;
        motion.velocity += (-STIFFNESS * displacement - DAMPING * motion.velocity) * dt;
        motion.position += motion.velocity * dt;

        const settled =
            Math.abs(motion.position - motion.target) < REST_DISTANCE &&
            Math.abs(motion.velocity) < REST_SPEED;

        if (settled) {
            motion.position = motion.target;
            motion.velocity = 0;
            motion.frame = 0;
        } else {
            motion.frame = requestAnimationFrame(step);
        }

        paint(motion.position);
    }

    function startLoop() {
        if (motion.frame) return;
        motion.lastTime = performance.now();
        motion.frame = requestAnimationFrame(step);
    }

    function stopLoop() {
        cancelAnimationFrame(motion.frame);
        motion.frame = 0;
    }

    function jumpTo(position) {
        stopLoop();
        motion.position = motion.target = position;
        motion.velocity = 0;
        paint(position);
    }

    function animateTo(index) {
        if (reducedMotion.matches) {
            jumpTo(index);
            return;
        }
        motion.target = index;
        startLoop();
    }

    /* ------------------------------------------------------------------ *
     * Selection
     * ------------------------------------------------------------------ */

    function updateSelection() {
        monthButtons.forEach((button, index) => {
            const active = index === selectedIndex;
            button.tabIndex = active ? 0 : -1;   // roving tabindex
            if (active) button.setAttribute("aria-current", "true");
            else button.removeAttribute("aria-current");
        });
    }

    function select(index) {
        selectedIndex = clamp(index, 0, lastIndex);
        updateSelection();
        animateTo(selectedIndex);
    }

    /* ------------------------------------------------------------------ *
     * Input: wheel, keyboard, touch drag, hover
     * ------------------------------------------------------------------ */

    // Wheel / trackpad → one month per gesture, applied immediately.
    let wheelAccum = 0;
    let wheelStepped = false;
    let wheelIdleTimer = 0;

    dom.timeline.addEventListener("wheel", (event) => {
        event.preventDefault();

        clearTimeout(wheelIdleTimer);
        wheelIdleTimer = setTimeout(() => {
            wheelAccum = 0;
            wheelStepped = false;
        }, WHEEL_IDLE_MS);

        if (wheelStepped) return;

        const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? raw * 16 : raw;
        if (!delta) return;

        if (Math.sign(delta) !== Math.sign(wheelAccum)) wheelAccum = 0;
        wheelAccum += delta;

        if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
            wheelStepped = true;
            select(selectedIndex + Math.sign(wheelAccum));
        }
    }, { passive: false });

    // Keyboard
    dom.months.addEventListener("keydown", (event) => {
        const next = {
            ArrowRight: selectedIndex + 1,
            ArrowLeft: selectedIndex - 1,
            Home: 0,
            End: lastIndex,
        }[event.key];

        if (next === undefined) return;

        event.preventDefault();
        select(next);
        monthButtons[selectedIndex].focus({ preventScroll: true });
    });

    // Touch / pen drag: the timeline follows the finger, then springs to a month.
    let drag = null;
    let swallowClick = false;

    dom.timeline.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;
        drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startPosition: motion.position,
            lastX: event.clientX,
            lastTime: event.timeStamp,
            velocity: 0,   // months per second
            active: false,
        };
    });

    dom.timeline.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;

        if (!drag.active) {
            if (Math.abs(event.clientX - drag.startX) < DRAG_START_PX) return;
            drag.active = true;
            drag.startX = drag.lastX = event.clientX;
            drag.startPosition = motion.position;
            dom.timeline.setPointerCapture(event.pointerId);
            stopLoop();
        }

        const dt = event.timeStamp - drag.lastTime;
        if (dt > 0) {
            const instant = -((event.clientX - drag.lastX) / MONTH_WIDTH) / (dt / 1000);
            drag.velocity = drag.velocity * 0.6 + instant * 0.4;
        }
        drag.lastX = event.clientX;
        drag.lastTime = event.timeStamp;

        motion.velocity = 0;
        motion.position = clamp(
            drag.startPosition - (event.clientX - drag.startX) / MONTH_WIDTH,
            0,
            lastIndex,
        );
        paint(motion.position);
    });

    function endDrag(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;

        const { active, velocity } = drag;
        drag = null;
        if (!active) return;

        swallowClick = true;
        setTimeout(() => { swallowClick = false; });
        select(Math.round(motion.position + velocity * FLICK_LOOKAHEAD_S));
    }

    dom.timeline.addEventListener("pointerup", endDrag);
    dom.timeline.addEventListener("pointercancel", endDrag);

    // A drag that ends over a month header must not also "click" it.
    dom.timeline.addEventListener("click", (event) => {
        if (!swallowClick) return;
        event.stopPropagation();
        event.preventDefault();
    }, true);

    // The viewport is `overflow: hidden`, but focus can still scroll it.
    dom.timeline.addEventListener("scroll", () => {
        dom.timeline.scrollLeft = 0;
    });

    // Hover a label or a bar → highlight the matching label, row and bar.
    let hoveredId = null;

    function setHovered(id) {
        if (id === hoveredId) return;

        linked.get(hoveredId)?.forEach((node) => node.classList.remove("is-hovered"));
        hoveredId = id;
        linked.get(id)?.forEach((node) => node.classList.add("is-hovered"));

        dom.root.classList.toggle("is-hovering", id !== null);
    }

    dom.root.addEventListener("pointerover", (event) => {
        if (event.pointerType === "touch") return;
        setHovered(event.target.closest("[data-id]")?.dataset.id ?? null);
    });
    dom.root.addEventListener("pointerleave", () => setHovered(null));

    /* ------------------------------------------------------------------ *
     * Start
     * ------------------------------------------------------------------ */

    measure();
    updateSelection();
    jumpTo(selectedIndex);

    new ResizeObserver(() => {
        measure();
        paint(motion.position);
    }).observe(dom.timeline);
})();