(function(global){
    const DOM = {}

    DOM.el = function(id) {
        return document.getElementById(id)
    }

    DOM.setText = function(id, text) {
        const el = DOM.el(id)
        if (el) el.textContent = text
    }

    DOM.setValue = function(id, value) {
        const el = DOM.el(id)
        if (el) el.value = value
    }

    DOM.syncXDisplays = function(shape) {
        const xMinSlider    = DOM.el('x-min-slider')
        const xMaxSlider    = DOM.el('x-max-slider')
        const xMinDisplay   = DOM.el('x-min-display')
        const xMaxDisplay   = DOM.el('x-max-display')
        if (xMinSlider && xMaxSlider) { xMinSlider.value = shape.x_min; xMaxSlider.value = shape.x_max; }
        if (xMinDisplay) xMinDisplay.textContent = shape.x_min
        if (xMaxDisplay) xMaxDisplay.textContent = shape.x_max
    }

    DOM.syncYDisplays = function(shape) {
        const yMinSlider    = DOM.el('y-min-slider')
        const yMaxSlider    = DOM.el('y-max-slider')
        const yMinDisplay   = DOM.el('y-min-display')
        const yMaxDisplay   = DOM.el('y-max-display')
        if (yMinSlider && yMaxSlider) { yMinSlider.value = shape.y_min; yMaxSlider.value = shape.y_max; }
        if (yMinDisplay) yMinDisplay.textContent = shape.y_min
        if (yMaxDisplay) yMaxDisplay.textContent = shape.y_max
    }

    DOM.togglePointerLock = function(el) {
        if (!el) return
        if (document.pointerLockElement === el) document.exitPointerLock()
        else el.requestPointerLock()
    }

    global.DOM = DOM
})(typeof window !== 'undefined' ? window : this)
