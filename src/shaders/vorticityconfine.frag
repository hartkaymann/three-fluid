precision highp float;

uniform vec3 res; // grid resolution
uniform float dt;

uniform float halfrdx;

uniform sampler2D velocity;
uniform sampler2D vorticity;

uniform float curl;

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;

    vec2 dxp = vec2( 1.0 / res.x, 0.0 );
    vec2 dyp = vec2( 0.0, 1.0 / res.y );

    float right = texture2D( vorticity, uv + dxp ).x;
    float left  = texture2D( vorticity, uv - dxp ).x;
    float up    = texture2D( vorticity, uv + dyp ).x;
    float down  = texture2D( vorticity, uv - dyp ).x;
    float mid   = texture2D( vorticity, uv ).x;

    vec2 force = halfrdx * vec2( abs( up ) - abs( down ), abs( right ) - abs( left ) );

    float epsilon = 2.4414e-4;
    float magSqr = max( epsilon, dot( force, force ) );

    force *= inversesqrt( magSqr ) * curl * mid; // use half live fast invsqrt?
    force.y *= -1.0;

    vec2 base = texture2D( velocity, uv ).xy;
    gl_FragColor = vec4( base + ( dt * force ), 0.0, 1.0 );
}