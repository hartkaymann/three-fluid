precision highp float;

uniform vec3 res; // grid resolution

uniform float halfrdx;

uniform sampler2D pressure;
uniform sampler2D velocity;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    float dxp = 1.0 / res.x; // size of a single x pixel
    float dyp = 1.0 / res.y; // size of a single y pixel    

    float right = texture2D(pressure, uv + vec2(dxp, 0.0)).x;
    float left  = texture2D(pressure, uv - vec2(dxp, 0.0)).x;
    float up    = texture2D(pressure, uv + vec2(0.0, dyp)).x;
    float down  = texture2D(pressure, uv - vec2(0.0, dyp)).x;

    vec2 center = texture2D(velocity, uv).xy;
    vec2 gradient = halfrdx * vec2(right - left,  up - down);

    gl_FragColor = vec4(center - gradient, 0.0, 1.0);
}