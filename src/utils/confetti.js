import confetti from 'canvas-confetti';

/**
 * Fire celebration confetti — for goal completion, level up, badges
 */
export function celebrateGoal() {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#06d6a0', '#00b4d8', '#7c3aed', '#f59e0b', '#ec4899'];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

/**
 * Quick burst confetti — for smaller wins
 */
export function celebrateSmall() {
    confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06d6a0', '#00b4d8', '#f59e0b'],
    });
}

/**
 * Level up explosion
 */
export function celebrateLevelUp() {
    const count = 200;
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            particleCount: Math.floor(count * particleRatio),
            ...opts,
        });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#06d6a0'] });
    fire(0.2, { spread: 60, colors: ['#00b4d8'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#7c3aed', '#f59e0b'] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ec4899'] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ['#06d6a0', '#00b4d8'] });
}

/**
 * Fire emoji confetti (stars)
 */
export function celebrateStars() {
    const defaults = {
        spread: 360,
        ticks: 60,
        gravity: 0,
        decay: 0.96,
        startVelocity: 20,
        colors: ['#06d6a0', '#00b4d8', '#7c3aed'],
        zIndex: 9999,
    };

    confetti({ ...defaults, particleCount: 30, origin: { x: 0.5, y: 0.3 } });
    setTimeout(() => {
        confetti({ ...defaults, particleCount: 20, origin: { x: 0.3, y: 0.5 } });
    }, 250);
    setTimeout(() => {
        confetti({ ...defaults, particleCount: 20, origin: { x: 0.7, y: 0.5 } });
    }, 500);
}
