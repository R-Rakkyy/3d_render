const pressedKeys = new Set()

function isInputFocused() {
    return (document.activeElement.tagName === 'INPUT' 
    || document.activeElement.tagName === 'SELECT' 
    || document.activeElement.tagName === 'TEXTAREA')
}

/* INPUT FUNCTIONS UTILITY HERE */
function initFunctionPresets() {
    const presets_select = document.getElementById('function-presets')
    presets_select.addEventListener('change', () => {
        current_preset_index    = parseInt(presets_select.value)
        const presets           = SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS
        const formula           = presets[current_preset_index].formula
        document.getElementById('function-input').value = formula
        shape.custom_function   = new CustomFunctionManager(formula).func
        if (typeof applyPresetParams === 'function') applyPresetParams(formula)
    })
}

// Not a good idea
function applyPresetParams(formula) {
    // nuh uh
    if (typeof updateUIFromState === 'function') updateUIFromState()
}

function updatePresetFunction() {
    const presets                                   = SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS
    if (current_preset_index >= presets.length)     current_preset_index = 0
    else if (current_preset_index < 0)              current_preset_index = presets.length - 1
    const formula                                   = presets[current_preset_index].formula
    shape.custom_function                           = new CustomFunctionManager(formula).func
    document.getElementById('function-input').value = formula
    document.getElementById('function-presets').selectedIndex = current_preset_index
}


function initFunctionInput() {
    initFunctionPresets()
    const function_input    = document.getElementById('function-input')
    function_input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            try {
                const func = new CustomFunctionManager(function_input.value).func
                shape.custom_function = func
                function_input.blur()
            } catch (e) {
                alert('Invalid function')
            }
        }
    })
    const function_axis_select = document.getElementById('function-axis-select')
    function_axis_select.addEventListener('change', () => {
        SETTINGS.function_axis = function_axis_select.value
    })
}
/* **************************************************** */

function handleCtrlShortcuts(event) {
    if (!(event.ctrlKey || event.metaKey)) return
    let prevent = true
    const k = (event.key || '').toLowerCase()
    switch (k) {
        case '+':
        case '=':
        case 'add':
        case 'numpadadd':
            event.preventDefault()
            shape.Nx                                        = Math.min(200, shape.Nx + 1)
            shape.Ny                                        = Math.min(200, shape.Ny + 1)
            document.getElementById('nx-slider').value      = shape.Nx
            document.getElementById('nx-value').textContent = shape.Nx
            document.getElementById('ny-slider').value      = shape.Ny
            document.getElementById('ny-value').textContent = shape.Ny
            break
        case '-':
        case 'subtract':
        case 'numpadsubtract':
            event.preventDefault()
            shape.Nx                                        = Math.max(2, shape.Nx - 1)
            shape.Ny                                        = Math.max(2, shape.Ny - 1)
            document.getElementById('nx-slider').value      = shape.Nx
            document.getElementById('nx-value').textContent = shape.Nx
            document.getElementById('ny-slider').value      = shape.Ny
            document.getElementById('ny-value').textContent = shape.Ny
            break
        case 'arrowleft':
            shape.x_min -= 1
            shape.x_max -= 1
            DOM.syncXDisplays(shape)
            break
        case 'arrowright':
            shape.x_min += 1
            shape.x_max += 1
            DOM.syncXDisplays(shape)
            break
        case 'arrowup':
            shape.y_min += 1
            shape.y_max += 1
            DOM.syncYDisplays(shape)
            break
        case 'arrowdown':
            shape.y_min -= 1
            shape.y_max -= 1
            DOM.syncYDisplays(shape)
            break
        default:
            prevent                 = false
    }
    if (prevent) {
        event.preventDefault()
    }
}


function initKeyboardListeners() {
    const render = document.getElementById('render')
    
    window.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey)) return
        handleCtrlShortcuts(event)
        event.stopPropagation()
    })

    window.addEventListener('keydown', (event) => {
        if (event.defaultPrevented) return
        if (event.ctrlKey || event.metaKey) return
        const key = event.key.toLowerCase()
        if (document.pointerLockElement === render) { // only when pointer lock is active
            if (key === 'escape') {
               document.exitPointerLock()
            }
            if (key === 't' || key === 'enter') {
                document.exitPointerLock()
                document.getElementById('function-input').focus()
            }
            if (key === '+' || key === '=') {
                if (event.ctrlKey) return
                shape.x_min -= 1; shape.x_max += 1
                shape.y_min -= 1; shape.y_max += 1
                DOM.syncXDisplays(shape); DOM.syncYDisplays(shape)
            }
            if (key === '-') {
                if (event.ctrlKey) return
                shape.x_min += 1; shape.x_max -= 1
                shape.y_min += 1; shape.y_max -= 1
                DOM.syncXDisplays(shape); DOM.syncYDisplays(shape)
            }
            if (key === 'f') {
                const presets           = SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS
                current_preset_index    = (current_preset_index + 1) % presets.length
                updatePresetFunction()
            }
            if (key === 'g') {
                const presets           = SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS
                current_preset_index    = (current_preset_index - 1 + presets.length) % presets.length
                updatePresetFunction()
            }
            if (key === 'c') {
                SETTINGS.complex_mode                                       = !SETTINGS.complex_mode
                document.getElementById('function-type-toggle').checked     = SETTINGS.complex_mode
                current_preset_index                                        = 0
                updateUIFromState()
                shape.custom_function                                       = new CustomFunctionManager((SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS)[0].formula).func
            }
            if (key === 'h') {
                if (document.pointerLockElement === render) document.exitPointerLock()
                else render.requestPointerLock()
            }
            if (key === 'y') {
                const modes                                                 = ['line', 'triangle', 'solid']
                const idx                                                   = modes.indexOf(SETTINGS.render_type)
                const next                                                  = modes[(idx + 1) % modes.length]
                SETTINGS.render_type                                        = next
                const select                                                = document.getElementById('render-type-select')
                if (select) select.value                                    = next
            }
        } else if (isInputFocused()) {
            if (key === 'escape') 
                document.activeElement.blur()
        } else {
            switch (key) {
                case '+':
                case '=':
                    if (event.ctrlKey) break
                    shape.x_min -= 1; shape.x_max += 1
                    shape.y_min -= 1; shape.y_max += 1
                    DOM.syncXDisplays(shape); DOM.syncYDisplays(shape)
                    break
                case '-':
                    if (event.ctrlKey) break
                    shape.x_min += 1; shape.x_max -= 1
                    shape.y_min += 1; shape.y_max -= 1
                    DOM.syncXDisplays(shape); DOM.syncYDisplays(shape)
                    break
                case 'f':
                    const presetsF          = SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS
                    current_preset_index    = (current_preset_index + 1) % presetsF.length
                    updatePresetFunction()
                    break
                case 'g':
                    const presetsG          = SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS
                    current_preset_index    = (current_preset_index - 1 + presetsG.length) % presetsG.length
                    updatePresetFunction()
                    break
                case 'c':
                    SETTINGS.complex_mode                                       = !SETTINGS.complex_mode
                    document.getElementById('function-type-toggle').checked     = SETTINGS.complex_mode
                    current_preset_index                                        = 0
                    updateUIFromState()
                    shape.custom_function                                       = new CustomFunctionManager((SETTINGS.complex_mode ? PRESET_COMPLEX_FUNCTIONS : PRESET_FUNCTIONS)[0].formula).func
                    break
                case 'tab':
                case 'h':
                    event.preventDefault()
                    if (document.pointerLockElement !== render) render.requestPointerLock()
                    else document.exitPointerLock()
                    break
                case 't':
                case 'enter':
                    event.preventDefault()
                    document.getElementById('function-input').focus()
                    break
                case 'y':
                    const modes                                                         = ['line', 'triangle', 'solid']
                    const idx                                                           = modes.indexOf(SETTINGS.render_type)
                    const next                                                          = modes[(idx + 1) % modes.length]
                    SETTINGS.render_type                                                = next
                    if (select) document.getElementById('render-type-select').value     = next
                    break
            }
        }
        if (isInputFocused() || event.ctrlKey || event.metaKey) return
        pressedKeys.add(key)
    })

    window.addEventListener('keyup', (event) => {
        pressedKeys.delete(event.key.toLowerCase())
    })

    window.addEventListener('blur', () => {
        pressedKeys.clear()
    })
}

function initInputs() {
    initSliders()
    initButtons()
    initFunctionInput()
    initFpsSelector()
    initToggles()
    initRange()
    updateUIFromState()

    const render = document.getElementById('render')
    render.addEventListener('click', () => { 
        if (document.pointerLockElement !== render) {
            render.requestPointerLock()
        }
    })

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === render) {
            document.addEventListener("mousemove", camera.updateRotation, false)
        } else {
            document.removeEventListener("mousemove", camera.updateRotation, false)
            pressedKeys.clear()
        }
    })

    initKeyboardListeners()
    
}
