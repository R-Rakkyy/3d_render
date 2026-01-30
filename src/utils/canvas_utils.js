function resizeRender() {
    const container     = document.getElementById('render-container')
    render.width        = container.clientWidth
    render.height       = container.clientHeight
}
function initRender() {
    LOGGER('Initializing render...')
    resizeRender()
    ctx = render.getContext("2d")
    window.addEventListener('resize', () => { resizeRender() })
    window.addEventListener('orientationchange', () => { resizeRender() })
    LOGGER('Render initialized.')
}
function clear() {
    ctx.fillStyle = BACKGROUND_COLOR
    ctx.fillRect(0, 0, render.width, render.height)
}

function drawnLine(ctx, x1, y1, x2, y2, color, width = 4) {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

function drawCompass() {
    const compassOrigin     = { x: render.width / 2, y: render.height / 2 }
    const compassScale      = 20
    const axisLength        = 1

    const xAxis             = { x: axisLength, y: 0, z: 0 }
    const yAxis             = { x: 0, y: axisLength, z: 0 }
    const zAxis             = { x: 0, y: 0, z: axisLength }

    const rotatedX          = rotateYZ(rotateXZ(xAxis, -camera.yaw), -camera.pitch)
    const rotatedY          = rotateYZ(rotateXZ(yAxis, -camera.yaw), -camera.pitch)
    const rotatedZ          = rotateYZ(rotateXZ(zAxis, -camera.yaw), -camera.pitch)

    const compassLineWidth = 1
    drawnLine(ctx, compassOrigin.x, compassOrigin.y, compassOrigin.x + rotatedX.x * compassScale, compassOrigin.y - rotatedX.y * compassScale, 'red', compassLineWidth)
    drawnLine(ctx, compassOrigin.x, compassOrigin.y, compassOrigin.x + rotatedY.x * compassScale, compassOrigin.y - rotatedY.y * compassScale, 'blue', compassLineWidth)
    drawnLine(ctx, compassOrigin.x, compassOrigin.y, compassOrigin.x + rotatedZ.x * compassScale, compassOrigin.y - rotatedZ.y * compassScale, 'green', compassLineWidth)
}

function drawShapeCompass() {
    const compassOrigin     = { x: render.width - 60, y: render.height - 60 }
    const compassScale      = 40
    const axisLength        = 1

    const xAxis             = { x: axisLength, y: 0, z: 0 }
    const yAxis             = { x: 0, y: axisLength, z: 0 }
    const zAxis             = { x: 0, y: 0, z: axisLength }

    let rotatedX            = rotate(xAxis, shape.theta, shape.phi, shape.psi)
    rotatedX                = rotateYZ(rotateXZ(rotatedX, -camera.yaw), -camera.pitch)

    let rotatedY            = rotate(yAxis, shape.theta, shape.phi, shape.psi)
    rotatedY                = rotateYZ(rotateXZ(rotatedY, -camera.yaw), -camera.pitch)
    
    let rotatedZ            = rotate(zAxis, shape.theta, shape.phi, shape.psi)
    rotatedZ                = rotateYZ(rotateXZ(rotatedZ, -camera.yaw), -camera.pitch)

    const compassLineWidth  = 2
    drawnLine(ctx, compassOrigin.x, compassOrigin.y, compassOrigin.x + rotatedX.x * compassScale, compassOrigin.y - rotatedX.y * compassScale, 'red', compassLineWidth)
    drawnLine(ctx, compassOrigin.x, compassOrigin.y, compassOrigin.x + rotatedY.x * compassScale, compassOrigin.y - rotatedY.y * compassScale, 'blue', compassLineWidth)
    drawnLine(ctx, compassOrigin.x, compassOrigin.y, compassOrigin.x + rotatedZ.x * compassScale, compassOrigin.y - rotatedZ.y * compassScale, 'green', compassLineWidth)
}

function drawLine3D(p1_world, p2_world, color, width) {
    const nearPlane        = 0.1

    const transformToCamera = (p_world) => {
        const p_relative = {
            x: p_world.x - camera.x,
            y: p_world.y - camera.y,
            z: p_world.z - camera.z
        }
        return rotateYZ(rotateXZ(p_relative, -camera.yaw), -camera.pitch) // world is opposite to camera hence -
    }

    let p1_cam          = transformToCamera(p1_world)
    let p2_cam          = transformToCamera(p2_world)

    const p1_in         = p1_cam.z > nearPlane
    const p2_in         = p2_cam.z > nearPlane

    if (p1_in && p2_in) {
        const p1_screen = toScreen(proj3Dto2D(p1_cam))
        const p2_screen = toScreen(proj3Dto2D(p2_cam))
        if (p1_screen && p2_screen)
            drawnLine(ctx, p1_screen.x, p1_screen.y, p2_screen.x, p2_screen.y, color, width)
    } else if (p1_in && !p2_in) {
        const t = (nearPlane - p1_cam.z) / (p2_cam.z - p1_cam.z)
        const p2_clipped = {
            x: p1_cam.x + t * (p2_cam.x - p1_cam.x),
            y: p1_cam.y + t * (p2_cam.y - p1_cam.y),
            z: nearPlane
        }
        const p1_screen = toScreen(proj3Dto2D(p1_cam))
        const p2_screen = toScreen(proj3Dto2D(p2_clipped))
        if (p1_screen && p2_screen)
            drawnLine(ctx, p1_screen.x, p1_screen.y, p2_screen.x, p2_screen.y, color, width)
    } else if (!p1_in && p2_in) {
        const t = (nearPlane - p2_cam.z) / (p1_cam.z - p2_cam.z)
        const p1_clipped = {
            x: p2_cam.x + t * (p1_cam.x - p2_cam.x),
            y: p2_cam.y + t * (p1_cam.y - p2_cam.y),
            z: nearPlane
        }
        const p1_screen = toScreen(proj3Dto2D(p1_clipped))
        const p2_screen = toScreen(proj3Dto2D(p2_cam))
        if (p1_screen && p2_screen)
            drawnLine(ctx, p1_screen.x, p1_screen.y, p2_screen.x, p2_screen.y, color, width)
    }
}

function drawPoint3D(p_world, color, size) {
    const nearPlane        = 0.1

    const transformToCamera = (p_world) => {
        const p_relative = {
            x: p_world.x - camera.x,
            y: p_world.y - camera.y,
            z: p_world.z - camera.z
        }
        return rotateYZ(rotateXZ(p_relative, -camera.yaw), -camera.pitch) // world is opposite to camera hence -
    }

    let p_cam          = transformToCamera(p_world)

    if (p_cam.z > nearPlane) {
        const p_screen = toScreen(proj3Dto2D(p_cam))
        if (p_screen) {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(p_screen.x, p_screen.y, size, 0, 2 * Math.PI)
            ctx.fill()
        }
    }
}

function drawTriangle3D(p1_world, p2_world, p3_world, color, width = 3) {
    const nearPlane         = 0.1

    const transformToCamera = (p_world) => {
        const p_relative    = {
            x: p_world.x - camera.x,
            y: p_world.y - camera.y,
            z: p_world.z - camera.z
        }
        return rotateYZ(rotateXZ(p_relative, -camera.yaw), -camera.pitch)
    }

    const p1_cam            = transformToCamera(p1_world)
    const p2_cam            = transformToCamera(p2_world)
    const p3_cam            = transformToCamera(p3_world)

    const p1_in             = p1_cam.z > nearPlane
    const p2_in             = p2_cam.z > nearPlane
    const p3_in             = p3_cam.z > nearPlane

    // If any vertex is behind the near plane, fallback to edge drawing
    if (!(p1_in && p2_in && p3_in)) {
        drawLine3D(p1_world, p2_world, color, width)
        drawLine3D(p2_world, p3_world, color, width)
        drawLine3D(p3_world, p1_world, color, width)
        return
    }

    const p1_screen         = toScreen(proj3Dto2D(p1_cam))
    const p2_screen         = toScreen(proj3Dto2D(p2_cam))
    const p3_screen         = toScreen(proj3Dto2D(p3_cam))

    if (!p1_screen || !p2_screen || !p3_screen) {
        drawLine3D(p1_world, p2_world, color, width)
        drawLine3D(p2_world, p3_world, color, width)
        drawLine3D(p3_world, p1_world, color, width)
        return
    }

    const v1                = { x: p2_world.x - p1_world.x, y: p2_world.y - p1_world.y, z: p2_world.z - p1_world.z }
    const v2                = { x: p3_world.x - p1_world.x, y: p3_world.y - p1_world.y, z: p3_world.z - p1_world.z }
    const normal            = {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    }
    const nlen              = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z) || 1
    normal.x                /= nlen; normal.y /= nlen; normal.z /= nlen

    const light             = { x: -0.5, y: -0.7, z: 0.4 }
    const llen              = Math.sqrt(light.x * light.x + light.y * light.y + light.z * light.z)
    light.x                 /= llen; light.y /= llen; light.z /= llen

    let intensity           = normal.x * light.x + normal.y * light.y + normal.z * light.z
    intensity               = Math.max(0, intensity)

    const shadeHex = (hex, factor) => {
        if (typeof hex !== 'string' || hex[0] !== '#') return hex
        const v     = hex.slice(1)
        const r     = parseInt(v.slice(0,2),16)
        const g     = parseInt(v.slice(2,4),16)
        const b     = parseInt(v.slice(4,6),16)

        const nr    = Math.max(0, Math.min(255, Math.floor(r * factor)))
        const ng    = Math.max(0, Math.min(255, Math.floor(g * factor)))
        const nb    = Math.max(0, Math.min(255, Math.floor(b * factor)))
        return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`
    }

    const shadeFactor       = 0.4 + 0.6 * intensity
    const fillColor         = shadeHex(color, shadeFactor)

    ctx.fillStyle           = fillColor
    ctx.beginPath()
    ctx.moveTo(p1_screen.x, p1_screen.y)
    ctx.lineTo(p2_screen.x, p2_screen.y)
    ctx.lineTo(p3_screen.x, p3_screen.y)
    ctx.closePath()
    ctx.fill()

    drawLine3D(p1_world, p2_world, color, 1)
    drawLine3D(p2_world, p3_world, color, 1)
    drawLine3D(p3_world, p1_world, color, 1)
}

function drawGrid() {
    const x_span        = shape.x_max - shape.x_min
    const z_span        = shape.y_max - shape.y_min
    const gridSize      = Math.max(x_span, z_span) * 3
    const gridStep      = 5
    const gridY         = shape.z - (Math.max(x_span, z_span) / 2) - 10
    const gridColor     = "#68592d"
    const gridLineWidth = 1

    for (let i = -gridSize / 2; i <= gridSize / 2; i += gridStep) {
        addToRender('line', {
            p1: { x: shape.x + i, y: gridY, z: shape.z - gridSize / 2 },
            p2: { x: shape.x + i, y: gridY, z: shape.z + gridSize / 2 },
            color: gridColor, width: gridLineWidth
        })

        addToRender('line', {
            p1: { x: shape.x - gridSize / 2, y: gridY, z: shape.z + i },
            p2: { x: shape.x + gridSize / 2, y: gridY, z: shape.z + i },
            color: gridColor, width: gridLineWidth
        })
    }
}

function drawShapeGrid() {
    const gridStep      = 5
    const gridColor     = "#5a643a"
    const gridLineWidth = 1
    const gridZ         = 0; // depends on shape's local coordinates anyway

    for (let i = shape.x_min; i <= shape.x_max; i += gridStep) {
        let p1_local = { x: i, y: shape.y_min, z: gridZ }
        let p2_local = { x: i, y: shape.y_max, z: gridZ }

        let p1_world = rotate(p1_local, shape.theta, shape.phi, shape.psi)
        p1_world.x += shape.x; p1_world.y += shape.y; p1_world.z += shape.z

        let p2_world = rotate(p2_local, shape.theta, shape.phi, shape.psi)
        p2_world.x += shape.x; p2_world.y += shape.y; p2_world.z += shape.z

        addToRender('line', { p1: p1_world, p2: p2_world, color: gridColor, width: gridLineWidth })
    }
    for (let i = shape.y_min; i <= shape.y_max; i += gridStep) {
        let p1_local = { x: shape.x_min, y: i, z: gridZ }
        let p2_local = { x: shape.x_max, y: i, z: gridZ }

        let p1_world = rotate(p1_local, shape.theta, shape.phi, shape.psi)
        p1_world.x += shape.x; p1_world.y += shape.y; p1_world.z += shape.z

        let p2_world = rotate(p2_local, shape.theta, shape.phi, shape.psi)
        p2_world.x += shape.x; p2_world.y += shape.y; p2_world.z += shape.z

        addToRender('line', { p1: p1_world, p2: p2_world, color: gridColor, width: gridLineWidth })
    }
}

function getRealWidth(distance, baseWidth) {
    const scaleFactor = 74
    if (distance <= 0) return baseWidth
    const width = distance < scaleFactor ? baseWidth * (scaleFactor / distance) : baseWidth * (scaleFactor / distance) ** 2
    return Math.max(1, Math.floor(width))
}