(function() {
    window.gameLog = function(msg, color = '#34d399') {
        // Strip HTML tags if present for clean console logging
        const cleanMsg = msg.replace(/<br>/gi, '\n').replace(/<[^>]*>/g, '');
        console.log(`%c[GameLog] ${cleanMsg}`, `color: ${color}; font-weight: bold; font-family: monospace; font-size: 11px;`);
    };

    window.addEventListener('error', (e) => {
        const errorMsg = `EXCEPTION: ${e.message} at ${e.filename ? e.filename.split('/').pop() : 'inline'}:${e.lineno}:${e.colno}`;
        window.gameLog(errorMsg, '#ef4444');
        console.error(e.error || errorMsg);
    });

    window.addEventListener('unhandledrejection', (e) => {
        window.gameLog(`REJECTION: ${e.reason}`, '#f87171');
        console.error(e.reason);
    });

    console.log('%c[Diagnostics Engine Initialized] All events will log below.', 'color: #10b981; font-weight: bold; font-size: 12px;');
})();
